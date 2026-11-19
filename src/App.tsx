import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { exportDims } from './cover/Cover'
import type { TextReport } from './cover/templates'
import { COVER_STYLES, STYLE_BY_ID, type CoverStyle } from '../api/_styles'
import { applyAiCover, fetchAiCover, quickCover } from './lib/ai'
import {
  copyParts,
  deleteLink,
  deleteParts,
  duplicateParts,
  movePartTo,
  parseClip,
  pasteParts,
  reorderParts,
  updateParts,
} from './lib/composition'
import { readShareHash, sanitizeConfig, shareLink } from './lib/configio'
import { buildSvgString, compressRaster, downloadBlob, readImageFile, svgToPng } from './lib/export'
import { uid } from './lib/random'
import { DEFAULT_CONFIG, slugify, store } from './lib/storage'
import { suggest } from './lib/suggest'
import { stripMarks } from './lib/text'
import type { BrandSettings, CoverConfig, Draft, SceneConfig, UploadedAsset } from './lib/types'
import { BrandModal } from './ui/BrandModal'
import { Canvas, ZOOM_MAX, ZOOM_MIN, type Tool } from './ui/Canvas'
import { CreatePanel } from './ui/CreatePanel'
import { DesignPanel } from './ui/DesignPanel'
import { DraftsDrawer } from './ui/DraftsDrawer'
import { FloatingToolbar } from './ui/FloatingToolbar'
import { LayersPanel } from './ui/LayersPanel'
import { TopBar } from './ui/TopBar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { t } from './ui/kit'
import { useToast } from './ui/Toast'

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024
const CLIP_KEY = 'scs.clipboard.v1'

// Read a shared design once at load (outside React so StrictMode double-invocation is harmless).
const SHARED = readShareHash()
if (SHARED) history.replaceState(null, '', location.pathname + location.search)

/** A shared link or a saved cover opens in the editor; a fresh start opens the create screen. */
function initialStage(): 'create' | 'edit' {
  if (SHARED) return 'edit'
  return JSON.stringify(store.loadCurrent()) === JSON.stringify(DEFAULT_CONFIG) ? 'create' : 'edit'
}

function initialConfig(assets: UploadedAsset[], brand: BrandSettings): CoverConfig {
  if (SHARED) return sanitizeConfig(SHARED, assets)
  const saved = store.loadCurrent()
  const isPristine = JSON.stringify(saved) === JSON.stringify(DEFAULT_CONFIG)
  return isPristine ? { ...DEFAULT_CONFIG, background: brand.defaultBackground, size: brand.defaultSize } : sanitizeConfig(saved, assets)
}

const typingIn = (t: EventTarget | null) => !!(t as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable="true"]')

export default function App() {
  const toast = useToast()
  const [brand, setBrandState] = useState<BrandSettings>(() => store.loadBrand())
  // uploads are no longer offered, but older drafts that used one still render
  const [assets] = useState<UploadedAsset[]>(() => store.loadAssets())
  const [config, setConfig] = useState<CoverConfig>(() => initialConfig(store.loadAssets(), store.loadBrand()))
  const [drafts, setDrafts] = useState<Draft[]>(() => store.loadDrafts())
  const [prefs] = useState(() => store.loadPrefs())
  const [stage, setStage] = useState<'create' | 'edit'>(initialStage)
  const [createTitle, setCreateTitle] = useState('')
  // the title the current cover was designed for; editing the title away from it prompts a regenerate
  const [designedFor, setDesignedFor] = useState(() => stripMarks(initialConfig(store.loadAssets(), store.loadBrand()).title).trim())
  const [styleId, setStyleId] = useState<CoverStyle['id']>(() => STYLE_BY_ID[store.loadPrefs().style as CoverStyle['id']]?.id ?? COVER_STYLES[0].id)
  const [exporting, setExporting] = useState<'png' | 'svg' | null>(null)
  const [panel, setPanel] = useState<null | 'drafts' | 'brand' | 'paste'>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  // hover previews: a background shown on the canvas but not applied
  const [previewPatch, setPreviewPatch] = useState<Partial<CoverConfig> | null>(null)
  const preview = useMemo(() => (previewPatch ? { ...config, ...previewPatch } : null), [config, previewPatch])

  /* ---------- editor state: selection, tool, zoom ---------- */
  const [selection, setSelectionState] = useState<string[]>([])
  const [selLink, setSelLink] = useState<number | null>(null)
  const [tool, setTool] = useState<Tool>('move')
  const [zoom, setZoom] = useState<number | 'fit'>('fit')
  const [zoomShown, setZoomShown] = useState(1)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const setSelection = useCallback((ids: string[]) => {
    setSelectionState(ids)
    if (ids.length) setSelLink(null)
  }, [])
  const comp = config.scene.style === 'compose' ? config.scene.composition : undefined
  const editable = !!comp && config.illustration === 'scene'

  // drop selections that no longer exist (after undo, delete, regenerate)
  useEffect(() => {
    const ids = new Set(comp?.elements.map((e) => e.id) ?? [])
    setSelectionState((sel) => (sel.every((id) => ids.has(id)) ? sel : sel.filter((id) => ids.has(id))))
    setSelLink((l) => (l !== null && (!comp || l >= comp.links.length) ? null : l))
  }, [comp])

  /* ---------- undo / redo ---------- */
  // Every config change is a step; rapid changes (typing, nudging) within 600 ms merge into one.
  const hist = useRef({ past: [] as CoverConfig[], future: [] as CoverConfig[], last: 0, skip: false })
  const prevConfig = useRef(config)
  const [, setHistTick] = useState(0)
  useEffect(() => {
    const h = hist.current
    const prev = prevConfig.current
    prevConfig.current = config
    if (prev === config) return
    if (h.skip) {
      h.skip = false
      return
    }
    const now = Date.now()
    if (now - h.last > 600 || !h.past.length) {
      h.past.push(prev)
      if (h.past.length > 100) h.past.shift()
    }
    h.last = now
    h.future = []
    setHistTick((n) => n + 1)
  }, [config])
  const undo = useCallback(() => {
    const h = hist.current
    const prev = h.past.pop()
    if (!prev) return
    h.future.push(prevConfig.current)
    h.skip = true
    h.last = 0
    setConfig(prev)
    setPreviewPatch(null)
    setHistTick((n) => n + 1)
  }, [])
  const redo = useCallback(() => {
    const h = hist.current
    const next = h.future.pop()
    if (!next) return
    h.past.push(prevConfig.current)
    h.skip = true
    h.last = 0
    setConfig(next)
    setPreviewPatch(null)
    setHistTick((n) => n + 1)
  }, [])

  /* ---------- persistence ---------- */
  useEffect(() => {
    const t = setTimeout(() => store.saveCurrent(config), 300)
    return () => clearTimeout(t)
  }, [config])
  useEffect(() => void store.savePrefs({ ...prefs, style: styleId }), [prefs, styleId])

  const setBrand = (b: BrandSettings) => {
    setBrandState(b)
    if (!store.saveBrand(b)) toast('Could not save brand settings — storage is full', 'error')
  }

  /* ---------- editing ---------- */
  const update = useCallback((patch: Partial<CoverConfig>) => setConfig((c) => ({ ...c, ...patch })), [])
  const editScene = useCallback((fn: (s: SceneConfig) => SceneConfig) => setConfig((c) => ({ ...c, illustration: 'scene', scene: fn(c.scene) })), [])
  const onTitle = (title: string) => setConfig((c) => ({ ...c, title }))
  const onReport = useCallback((_r: TextReport) => {}, [])

  const duplicateSel = () => {
    if (!selection.length) return
    const r = duplicateParts(config.scene, selection)
    editScene(() => r.scene)
    setSelection(r.ids)
  }
  const deleteSel = () => {
    if (selLink !== null) {
      editScene((s) => deleteLink(s, selLink))
      setSelLink(null)
      return
    }
    if (!selection.length) return
    const ids = selection
    editScene((s) => deleteParts(s, ids))
    setSelection([])
  }
  const copySel = () => {
    if (!selection.length) return false
    const text = JSON.stringify(copyParts(config.scene, selection))
    try {
      localStorage.setItem(CLIP_KEY, text)
    } catch {
      // storage blocked: the system clipboard below still works within this tab
    }
    void navigator.clipboard?.writeText(text).catch(() => {})
    return true
  }
  const paste = async () => {
    let clip = null
    try {
      clip = parseClip(await navigator.clipboard.readText())
    } catch {
      // clipboard read blocked: fall back to the copy kept in storage
    }
    if (!clip) {
      try {
        clip = parseClip(localStorage.getItem(CLIP_KEY))
      } catch {
        clip = null
      }
    }
    if (!clip || !editable) return
    const r = pasteParts(config.scene, clip)
    editScene(() => r.scene)
    setSelection(r.ids)
    toast(`Pasted ${r.ids.length} part${r.ids.length === 1 ? '' : 's'}`)
  }
  const zoomBy = (dir: 'in' | 'out' | number | 'fit') => {
    if (dir === 'fit') return setZoom('fit')
    if (typeof dir === 'number') return setZoom(dir)
    setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomShown * (dir === 'in' ? 1.25 : 0.8))))
  }

  /* ---------- generate (Claude), with the keyword match as a fallback ---------- */
  const [aiBusy, setAiBusy] = useState(false)
  const aiAbort = useRef<AbortController | null>(null)
  const generate = async (rawTitle: string, subtitle: string, keepText: boolean) => {
    const title = stripMarks(rawTitle).trim()
    if (!title) return
    const style = STYLE_BY_ID[styleId]
    const s = suggest(rawTitle, subtitle)
    aiAbort.current?.abort()
    const ac = new AbortController()
    aiAbort.current = ac
    setAiBusy(true)
    // a fresh post drops the previous subtitle and label
    const text = (c: CoverConfig): CoverConfig => (keepText ? c : { ...c, title: rawTitle, subtitle: '', eyebrow: '' })
    try {
      const ai = await fetchAiCover(title, stripMarks(subtitle), s, style, ac.signal)
      setConfig((c) => applyAiCover(text(c), ai, s, style))
      if (ai.reason) toast(ai.reason)
    } catch (e) {
      if (ac.signal.aborted) return
      setConfig((c) => quickCover(text(c), s, style))
      toast(`${e instanceof Error ? e.message : 'AI unavailable'}. Used a quick match instead.`, 'error')
    } finally {
      if (aiAbort.current === ac) setAiBusy(false)
    }
    setDesignedFor(title)
    setSelection([])
    setZoom('fit')
    setStage('edit')
  }
  const titleChanged = stripMarks(config.title).trim() !== designedFor

  // hand-edited parts would be lost on Regenerate, so it asks first
  const [confirmRegen, setConfirmRegen] = useState(false)
  const regenerate = () => (config.scene.composition?.edited && !titleChanged ? setConfirmRegen(true) : void generate(config.title, config.subtitle, true))

  /* ---------- export ---------- */
  const exportCover = async (kind: 'png' | 'svg', scale: 1 | 2 = 1) => {
    const svg = svgRef.current
    if (!svg) return
    setExporting(kind)
    try {
      const { w, h } = exportDims(config.size)
      const str = await buildSvgString(svg, w, h)
      const base = `${slugify(config.title)}-${w}x${h}`
      if (kind === 'svg') {
        downloadBlob(new Blob([str], { type: 'image/svg+xml' }), `${base}.svg`)
        toast('SVG downloaded')
      } else {
        const png = await svgToPng(str, w, h, scale)
        downloadBlob(png, `${base}${scale === 2 ? '@2x' : ''}.png`)
        toast(`PNG downloaded · ${w * scale}×${h * scale}`)
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Export failed', 'error')
    } finally {
      setExporting(null)
    }
  }

  /* ---------- drafts ---------- */
  const persistDrafts = (next: Draft[]) => {
    if (!store.saveDrafts(next)) {
      toast('Storage is full — delete a draft', 'error')
      return false
    }
    setDrafts(next)
    return true
  }
  const saveDraft = (name: string) => {
    const existing = drafts.find((d) => d.name === name)
    const d: Draft = { id: existing?.id ?? uid(), name, config, updatedAt: Date.now() }
    if (persistDrafts([d, ...drafts.filter((x) => x.id !== d.id)])) toast(existing ? 'Draft updated' : 'Draft saved')
  }
  const openDraft = (d: Draft) => {
    const opened = sanitizeConfig(d.config, assets)
    setConfig(opened)
    setDesignedFor(stripMarks(opened.title).trim())
    setStage('edit')
    setSelection([])
    setZoom('fit')
    setPanel(null)
    toast(`Opened “${d.name}”`)
  }

  /* ---------- brand logo ---------- */
  const onLogoUpload = async (f: File) => {
    try {
      if (!/^image\/(svg\+xml|png|jpeg|webp)$/.test(f.type)) throw new Error('Use an SVG, PNG, JPEG or WebP file')
      if (f.size > MAX_UPLOAD_BYTES) throw new Error('File is larger than 4 MB')
      const read = await readImageFile(f)
      const img = f.type === 'image/svg+xml' ? read : await compressRaster(read.dataUrl, 256)
      setBrand({ ...brand, customLogo: img.dataUrl })
      toast('Logo updated')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Upload failed', 'error')
    }
  }

  /* ---------- config io ---------- */
  const copyText = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast(msg)
    } catch {
      toast('Clipboard is blocked in this browser', 'error')
    }
  }

  const reset = () => {
    aiAbort.current?.abort()
    setAiBusy(false)
    setConfig({ ...DEFAULT_CONFIG, background: brand.defaultBackground, size: brand.defaultSize })
    setCreateTitle('')
    setSelection([])
    setStage('create')
  }

  /* ---------- shortcuts ---------- */
  // one listener; the latest handlers live in a ref so it never re-subscribes
  const keys = useRef<(e: KeyboardEvent) => void>(() => {})
  keys.current = (e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey
    const k = e.key.toLowerCase()
    const typing = typingIn(e.target)
    if (mod && (k === 'z' || k === 'y') && !typing) {
      // text fields keep their own undo; everywhere else it's the design's
      e.preventDefault()
      return k === 'y' || e.shiftKey ? redo() : undo()
    }
    if (mod && k === 's') {
      e.preventDefault()
      if (stage === 'edit') saveDraft(stripMarks(config.title).slice(0, 60) || 'Untitled cover')
      return
    }
    if (mod && k === 'e') {
      e.preventDefault()
      if (stage === 'edit') void exportCover('png', 2)
      return
    }
    if (stage !== 'edit' || typing || document.querySelector('[role="dialog"]')) return

    // zoom
    if (mod && (k === '=' || k === '+')) return (e.preventDefault(), zoomBy('in'))
    if (mod && k === '-') return (e.preventDefault(), zoomBy('out'))
    if (e.shiftKey && e.code === 'Digit1') return (e.preventDefault(), zoomBy('fit'))
    if (e.shiftKey && e.code === 'Digit0') return (e.preventDefault(), zoomBy(1))
    if (!editable) return

    // tools
    if (!mod && !e.altKey) {
      const toolKey: Record<string, Tool> = { v: 'move', h: 'hand', r: 'card', o: 'tile', p: 'pill', k: 'spark', l: 'connector' }
      if (toolKey[k] && !e.shiftKey) return setTool(toolKey[k])
    }
    if (k === 'escape') {
      if (tool !== 'move') return setTool('move')
      setSelection([])
      setSelLink(null)
      return
    }
    // selection
    if (mod && k === 'a') {
      e.preventDefault()
      return setSelection(comp!.elements.filter((x) => !x.hidden).map((x) => x.id))
    }
    if (k === 'tab' && (e.target as HTMLElement | null)?.closest?.('[data-canvas]')) {
      // keyboard access to parts: Tab / Shift+Tab walk through them
      e.preventDefault()
      const ids = comp!.elements.filter((x) => !x.hidden).map((x) => x.id)
      if (!ids.length) return
      const cur = selection.length ? ids.indexOf(selection[selection.length - 1]) : -1
      return setSelection([ids[(cur + (e.shiftKey ? -1 : 1) + ids.length) % ids.length]])
    }
    if (k === 'delete' || k === 'backspace') return (e.preventDefault(), deleteSel())
    if (mod && k === 'd') return (e.preventDefault(), duplicateSel())
    if (mod && k === 'c') return void (copySel() && e.preventDefault())
    if (mod && k === 'x') {
      if (copySel()) {
        e.preventDefault()
        deleteSel()
      }
      return
    }
    if (mod && k === 'v') return (e.preventDefault(), void paste())
    if (mod && (e.key === ']' || e.key === '[' || e.code === 'BracketRight' || e.code === 'BracketLeft')) {
      e.preventDefault()
      const fwd = e.key === ']' || e.code === 'BracketRight'
      const dir = e.shiftKey ? (fwd ? 'front' : 'back') : fwd ? 'forward' : 'backward'
      const ids = selection
      if (ids.length) editScene((s) => reorderParts(s, ids, dir))
      return
    }
    // nudge
    const step = e.shiftKey ? 16 : 2
    const arrows: Record<string, [number, number]> = { arrowleft: [-step, 0], arrowright: [step, 0], arrowup: [0, -step], arrowdown: [0, step] }
    if (arrows[k] && selection.length) {
      e.preventDefault()
      const [dx, dy] = arrows[k]
      const patches = Object.fromEntries(comp!.elements.filter((x) => selection.includes(x.id)).map((x) => [x.id, { x: x.x + dx, y: x.y + dy }]))
      editScene((s) => updateParts(s, patches))
    }
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keys.current(e)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-full flex-col bg-background">
      <TopBar
        brand={brand}
        title={stage === 'create' ? createTitle || 'New cover' : config.title}
        onTitle={stage === 'edit' ? onTitle : undefined}
        draftCount={drafts.length}
        exporting={exporting}
        size={config.size}
        onExport={exportCover}
        onDrafts={() => setPanel('drafts')}
        onBrand={() => setPanel('brand')}
        onShareLink={() => copyText(shareLink(config), 'Share link copied')}
        onCopyConfig={() => copyText(JSON.stringify(config, null, 2), 'Design config copied as JSON')}
        onPasteConfig={() => setPanel('paste')}
        onReset={reset}
        canUndo={hist.current.past.length > 0}
        canRedo={hist.current.future.length > 0}
        onUndo={undo}
        onRedo={redo}
        creating={stage === 'create'}
        onRegenerate={stage === 'edit' ? regenerate : undefined}
        aiBusy={aiBusy}
      />

      {stage === 'create' ? (
        <main className="min-h-0 flex-1">
          <CreatePanel
            title={createTitle}
            setTitle={setCreateTitle}
            style={styleId}
            setStyle={setStyleId}
            busy={aiBusy}
            onGenerate={() => void generate(createTitle, '', false)}
            brand={brand}
            assets={assets}
          />
        </main>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <aside aria-label="Layers" className="hidden min-h-0 w-[232px] shrink-0 overflow-y-auto border-r border-border bg-background [scrollbar-width:thin] md:block">
            <LayersPanel
              composition={comp}
              items={config.scene.items}
              brand={brand}
              selection={selection}
              onSelect={(id, additive) => setSelection(additive ? (selection.includes(id) ? selection.filter((x) => x !== id) : [...selection, id]) : [id])}
              selLink={selLink}
              onSelectLink={(i) => {
                setSelectionState([])
                setSelLink(i)
              }}
              hoverId={hoverId}
              setHoverId={setHoverId}
              onToggleHidden={(id) => {
                const e = comp?.elements.find((x) => x.id === id)
                if (e) editScene((s) => updateParts(s, { [id]: { hidden: !e.hidden } }))
              }}
              onDeleteLink={(i) => {
                editScene((s) => deleteLink(s, i))
                setSelLink(null)
              }}
              onMoveTo={(id, index) => editScene((s) => movePartTo(s, id, index))}
            />
          </aside>
          <main className="relative order-first min-h-[320px] min-w-0 flex-1 md:order-none">
            <Canvas
              config={config}
              preview={preview}
              brand={brand}
              assets={assets}
              svgRef={svgRef}
              onReport={onReport}
              editScene={editScene}
              selection={selection}
              setSelection={setSelection}
              setSelLink={setSelLink}
              tool={tool}
              setTool={setTool}
              zoom={zoom}
              setZoom={setZoom}
              onZoomShown={setZoomShown}
              hoverId={hoverId}
              setHoverId={setHoverId}
            />
            <FloatingToolbar tool={editable ? tool : undefined} setTool={setTool} zoomShown={zoomShown} onZoom={zoomBy} />
          </main>
          <aside aria-label="Design" className="min-h-0 w-full shrink-0 overflow-y-auto border-t border-border bg-background [scrollbar-width:thin] md:w-[272px] md:border-t-0 md:border-l">
            <DesignPanel
              config={config}
              brand={brand}
              styleId={styleId}
              setStyle={setStyleId}
              update={update}
              onPreview={setPreviewPatch}
              editScene={editScene}
              selection={selection}
              selLink={selLink}
              onDuplicate={duplicateSel}
              onDelete={deleteSel}
              onDeleteLink={(i) => {
                editScene((s) => deleteLink(s, i))
                setSelLink(null)
              }}
              title={config.title}
              onTitle={onTitle}
              titleChanged={titleChanged}
              onRegenerate={regenerate}
              aiBusy={aiBusy}
            />
          </aside>
        </div>
      )}

      <DraftsDrawer
        open={panel === 'drafts'}
        onClose={() => setPanel(null)}
        drafts={drafts}
        current={config}
        brand={brand}
        assets={assets}
        onSave={saveDraft}
        onOpen={openDraft}
        onDelete={(id) => persistDrafts(drafts.filter((d) => d.id !== id))}
        onRename={(id, name) => persistDrafts(drafts.map((d) => (d.id === id ? { ...d, name, updatedAt: Date.now() } : d)))}
      />

      <BrandModal open={panel === 'brand'} onClose={() => setPanel(null)} brand={brand} setBrand={setBrand} onLogoUpload={onLogoUpload} />

      <Dialog open={confirmRegen} onOpenChange={(o) => !o && setConfirmRegen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace your layout?</DialogTitle>
            <DialogDescription>You edited parts of this cover by hand. Regenerating designs a new cover and your changes will be replaced. You can still undo afterwards.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmRegen(false)}>
              Keep my layout
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setConfirmRegen(false)
                void generate(config.title, config.subtitle, true)
              }}
            >
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PasteConfigModal
        open={panel === 'paste'}
        onClose={() => setPanel(null)}
        onApply={(raw) => {
          setConfig(sanitizeConfig(raw, assets))
          setStage('edit')
          setSelection([])
          setPanel(null)
          toast('Design config applied')
        }}
      />
    </div>
  )
}

function PasteConfigModal({ open, onClose, onApply }: { open: boolean; onClose: () => void; onApply: (raw: unknown) => void }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    if (open) {
      setText('')
      setError('')
    }
  }, [open])
  const apply = () => {
    try {
      const raw = JSON.parse(text)
      if (typeof raw !== 'object' || !raw) throw new Error()
      onApply(raw)
    } catch {
      setError('That isn’t valid design JSON. Use “Copy design config” to get the right format.')
    }
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Paste design config</DialogTitle>
          <DialogDescription>Apply a design copied from a teammate. Unknown fields are ignored.</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Textarea
            autoFocus
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setError('')
            }}
            rows={10}
            placeholder={'{\n  "title": "…",\n  "scene": { … }\n}'}
            className="font-mono"
            aria-label="Design config JSON"
            aria-invalid={!!error}
          />
          {error && <p className={cn(t.caption, 'mt-2 text-destructive')}>{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={apply} disabled={!text.trim()}>
            Apply design
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
