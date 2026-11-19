import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type Ref } from 'react'
import { Cover, COVER_W, coverHeight } from '../cover/Cover'
import type { TextReport } from '../cover/templates'
import {
  addLink,
  addPart,
  ART_H,
  ART_W,
  gapsAround,
  resizeRect,
  snapRect,
  updateParts,
  type Gap,
  type Guide,
  type Handle,
} from '../lib/composition'
import type { BrandSettings, CompElement, CompKind, Composition, CoverConfig, SceneConfig, UploadedAsset } from '../lib/types'
import { cn } from '@/lib/utils'

export type Tool = 'move' | 'hand' | 'card' | 'tile' | 'pill' | 'spark' | 'connector'
export const INSERT_TOOLS: Partial<Record<Tool, CompKind>> = { card: 'card', tile: 'tile', pill: 'pill', spark: 'spark' }

export const ZOOM_MIN = 0.1
export const ZOOM_MAX = 4
const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z))
const FIT_PAD = 56
/** room kept free under the cover for the floating toolbar */
const TOOLBAR_SPACE = 64
/** Pixels a press must travel before it counts as a drag rather than a click. */
const DRAG_THRESHOLD = 3

type Rect = { x: number; y: number; w: number; h: number }
type Pt = { x: number; y: number }

interface Props {
  config: CoverConfig
  /** a hovered background shown in place of the config */
  preview: CoverConfig | null
  brand: BrandSettings
  assets: UploadedAsset[]
  svgRef: Ref<SVGSVGElement>
  onReport: (r: TextReport) => void
  /** apply an edit to the scene (one undo step) */
  editScene: (fn: (s: SceneConfig) => SceneConfig) => void
  selection: string[]
  setSelection: (ids: string[]) => void
  setSelLink: (i: number | null) => void
  tool: Tool
  setTool: (t: Tool) => void
  zoom: number | 'fit'
  setZoom: (z: number | 'fit') => void
  /** the zoom actually shown, for the zoom menu's percentage */
  onZoomShown: (z: number) => void
  hoverId: string | null
  setHoverId: (id: string | null) => void
}

type Mode =
  | { type: 'move'; ids: string[]; primary: string; start: Pt; orig: Record<string, Rect>; moved: boolean; toggled: boolean }
  | { type: 'resize'; id: string; handle: Handle; start: Pt; orig: CompElement }
  | { type: 'marquee'; start: Pt; base: string[]; moved: boolean }
  | { type: 'pan'; start: Pt; origPan: Pt }
  | { type: 'link'; from: string }

interface Live {
  rects?: Record<string, Rect>
  guides?: Guide[]
  gaps?: Gap[]
  marquee?: Rect
  link?: { from: string; to: Pt }
}

/** The composition with live (uncommitted) rectangles applied. */
function withRects(comp: Composition, rects: Record<string, Rect>): Composition {
  return { ...comp, elements: comp.elements.map((e) => (rects[e.id] ? { ...e, ...rects[e.id] } : e)) }
}

const HANDLES: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
const HANDLE_CURSOR: Record<Handle, string> = { n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize' }

/**
 * The design canvas: the cover on a pasteboard you can zoom and pan, with
 * Figma-style editing of AI compositions — select (click, Shift-click,
 * drag a box), move with snapping and spacing guides, resize from eight
 * handles, insert parts, and draw connections between them.
 */
export function Canvas(p: Props) {
  const { config: c } = p
  const viewport = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [vp, setVp] = useState({ w: 800, h: 600 })
  const [pan, setPan] = useState<Pt>({ x: 0, y: 0 })
  const [space, setSpace] = useState(false)
  const [live, setLive] = useState<Live | null>(null)
  const mode = useRef<Mode | null>(null)

  const comp = c.illustration === 'scene' && c.scene.style === 'compose' ? c.scene.composition : undefined
  const editable = !!comp && !p.preview
  const W = COVER_W
  const H = coverHeight(c.size)

  /* ---------- zoom and pan ---------- */
  const fitZ = Math.max(ZOOM_MIN, Math.min((vp.w - FIT_PAD * 2) / W, (vp.h - FIT_PAD * 2 - TOOLBAR_SPACE) / H))
  const z = p.zoom === 'fit' ? fitZ : p.zoom
  const effPan = p.zoom === 'fit' ? { x: 0, y: 0 } : pan
  const stageLeft = (vp.w - W * z) / 2 + effPan.x
  const stageTop = (vp.h - TOOLBAR_SPACE - H * z) / 2 + effPan.y
  const { onZoomShown } = p
  useEffect(() => onZoomShown(z), [z, onZoomShown])

  useLayoutEffect(() => {
    const el = viewport.current
    if (!el) return
    const ro = new ResizeObserver(() => setVp({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setVp({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  // Ctrl/⌘ + wheel zooms around the pointer; a plain wheel or trackpad pans
  const zoomState = useRef({ z, pan: effPan, fit: p.zoom === 'fit' })
  zoomState.current = { z, pan: effPan, fit: p.zoom === 'fit' }
  const { setZoom } = p
  useEffect(() => {
    const el = viewport.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const { z: cz, pan: cp } = zoomState.current
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect()
        const nz = clampZoom(cz * Math.exp(-e.deltaY * 0.01))
        // keep the point under the cursor still
        const px = e.clientX - r.left - r.width / 2
        const py = e.clientY - r.top - r.height / 2
        setPan({ x: px - ((px - cp.x) / cz) * nz, y: py - ((py - cp.y) / cz) * nz })
        setZoom(nz)
      } else {
        if (zoomState.current.fit) setZoom(cz)
        setPan({ x: cp.x - e.deltaX, y: cp.y - e.deltaY })
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [setZoom])
  // switching to an explicit zoom from the toolbar keeps the cover centred
  useEffect(() => {
    if (p.zoom === 'fit') setPan({ x: 0, y: 0 })
  }, [p.zoom])

  // hold Space to pan, like any design tool
  useEffect(() => {
    const typing = (t: EventTarget | null) => (t as HTMLElement | null)?.closest?.('input, textarea, [contenteditable="true"]')
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !typing(e.target) && !e.repeat) {
        e.preventDefault()
        setSpace(true)
      }
    }
    const up = (e: KeyboardEvent) => e.code === 'Space' && setSpace(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  /* ---------- artboard ↔ screen ---------- */
  // where the composition's artboard sits inside the stage, in stage pixels per unit
  const [frame, setFrame] = useState<{ x: number; y: number; k: number } | null>(null)
  useLayoutEffect(() => {
    const art = stage.current?.querySelector('[data-comp-artboard]')
    const st = stage.current?.getBoundingClientRect()
    if (!art || !st) {
      if (frame) setFrame(null)
      return
    }
    const r = art.getBoundingClientRect()
    const next = { x: r.left - st.left, y: r.top - st.top, k: r.width / ART_W }
    if (!frame || Math.abs(next.x - frame.x) > 0.25 || Math.abs(next.y - frame.y) > 0.25 || Math.abs(next.k - frame.k) > 0.0005) setFrame(next)
  })
  const toUnits = useCallback(
    (clientX: number, clientY: number): Pt | null => {
      const st = stage.current?.getBoundingClientRect()
      if (!st || !frame) return null
      return { x: (clientX - st.left - frame.x) / frame.k, y: (clientY - st.top - frame.y) / frame.k }
    },
    [frame],
  )
  const box = (r: Rect) => (frame ? { left: frame.x + r.x * frame.k, top: frame.y + r.y * frame.k, width: r.w * frame.k, height: r.h * frame.k } : null)

  /* ---------- what's on screen ---------- */
  const shownComp = comp && live?.rects ? withRects(comp, live.rects) : comp
  const shownCfg = useMemo(() => {
    if (p.preview) return p.preview
    if (!shownComp || shownComp === comp) return c
    return { ...c, scene: { ...c.scene, composition: shownComp } }
  }, [p.preview, shownComp, comp, c])
  const byId = useMemo(() => new Map((shownComp?.elements ?? []).map((e) => [e.id, e])), [shownComp])

  const partAt = (target: EventTarget | null): CompElement | null => {
    const g = (target as Element | null)?.closest?.('[data-comp-el]')
    if (!g || !stage.current?.contains(g)) return null
    return comp?.elements.find((e) => e.id === g.getAttribute('data-comp-el') && !e.hidden) ?? null
  }

  /* ---------- pointer interactions ---------- */
  const { setSelection, setSelLink, setTool, editScene, setHoverId } = p
  const panning = p.tool === 'hand' || space

  const onPointerDown = (ev: React.PointerEvent) => {
    if (ev.button !== 0 && ev.button !== 1) return
    viewport.current?.focus({ preventScroll: true })
    const start = { x: ev.clientX, y: ev.clientY }
    const capture = () => viewport.current?.setPointerCapture(ev.pointerId)

    if (panning || ev.button === 1) {
      mode.current = { type: 'pan', start, origPan: effPan }
      if (p.zoom === 'fit') setZoom(z)
      capture()
      return
    }
    if (!editable || !comp) return
    const u = toUnits(ev.clientX, ev.clientY)
    if (!u) return

    const handle = (ev.target as HTMLElement).closest?.('[data-handle]')?.getAttribute('data-handle') as Handle | null
    if (handle && p.selection.length === 1) {
      const orig = comp.elements.find((e) => e.id === p.selection[0])
      if (orig) {
        mode.current = { type: 'resize', id: orig.id, handle, start, orig }
        capture()
      }
      return
    }

    const insert = INSERT_TOOLS[p.tool]
    if (insert) {
      if (u.x < 0 || u.y < 0 || u.x > ART_W || u.y > ART_H) return
      const r = addPart(c.scene, insert, u.x, u.y)
      editScene(() => r.scene)
      setSelection([r.id])
      setTool('move')
      return
    }

    const hit = partAt(ev.target)
    if (p.tool === 'connector') {
      if (hit) {
        mode.current = { type: 'link', from: hit.id }
        setLive({ link: { from: hit.id, to: u } })
        capture()
      }
      return
    }

    // move tool
    if (hit) {
      let ids = p.selection
      let toggled = false
      if (ev.shiftKey) {
        toggled = true
        ids = ids.includes(hit.id) ? ids.filter((i) => i !== hit.id) : [...ids, hit.id]
        setSelection(ids)
        if (!ids.includes(hit.id)) return
      } else if (!ids.includes(hit.id)) {
        ids = [hit.id]
        setSelection(ids)
      }
      setSelLink(null)
      const orig: Record<string, Rect> = {}
      for (const e of comp.elements) if (ids.includes(e.id)) orig[e.id] = { x: e.x, y: e.y, w: e.w, h: e.h }
      mode.current = { type: 'move', ids, primary: hit.id, start, orig, moved: false, toggled }
      capture()
    } else {
      if (!ev.shiftKey) setSelection([])
      setSelLink(null)
      mode.current = { type: 'marquee', start, base: ev.shiftKey ? p.selection : [], moved: false }
      capture()
    }
  }

  const onPointerMove = (ev: React.PointerEvent) => {
    const m = mode.current
    if (!m) {
      if (editable && !panning) setHoverId(partAt(ev.target)?.id ?? null)
      return
    }
    const dxPx = ev.clientX - ('start' in m ? m.start.x : 0)
    const dyPx = ev.clientY - ('start' in m ? m.start.y : 0)
    if (m.type === 'pan') {
      setPan({ x: m.origPan.x + dxPx, y: m.origPan.y + dyPx })
      return
    }
    if (!comp || !frame) return
    const k = frame.k
    if (m.type === 'move') {
      if (!m.moved && Math.hypot(dxPx, dyPx) < DRAG_THRESHOLD) return
      m.moved = true
      setHoverId(null)
      const prim = m.orig[m.primary]
      const exclude = new Set(m.ids)
      // snap the part under the pointer; the rest of the selection keeps its offset
      const snapped = snapRect(comp, { ...prim, x: prim.x + dxPx / k, y: prim.y + dyPx / k }, exclude, !ev.altKey)
      const ddx = snapped.x - prim.x
      const ddy = snapped.y - prim.y
      const rects: Record<string, Rect> = {}
      for (const id of m.ids) {
        const o = m.orig[id]
        rects[id] = { ...o, x: Math.min(ART_W - o.w, Math.max(0, o.x + ddx)), y: Math.min(ART_H - o.h, Math.max(0, o.y + ddy)) }
      }
      setLive({ rects, guides: snapped.guides, gaps: m.ids.length === 1 ? gapsAround(comp, rects[m.primary], exclude) : [] })
    } else if (m.type === 'resize') {
      const r = resizeRect(m.orig, m.handle, dxPx / k, dyPx / k, { snap: !ev.altKey, keepRatio: ev.shiftKey })
      setLive({ rects: { [m.id]: r }, gaps: gapsAround(comp, r, new Set([m.id])) })
    } else if (m.type === 'marquee') {
      if (!m.moved && Math.hypot(dxPx, dyPx) < DRAG_THRESHOLD) return
      m.moved = true
      const a = toUnits(m.start.x, m.start.y)
      const b = toUnits(ev.clientX, ev.clientY)
      if (!a || !b) return
      const r = { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) }
      const inside = comp.elements.filter((e) => !e.hidden && e.x < r.x + r.w && e.x + e.w > r.x && e.y < r.y + r.h && e.y + e.h > r.y).map((e) => e.id)
      setSelection([...new Set([...m.base, ...inside])])
      setLive({ marquee: r })
    } else if (m.type === 'link') {
      const u = toUnits(ev.clientX, ev.clientY)
      if (u) setLive({ link: { from: m.from, to: u } })
      const over = document.elementFromPoint(ev.clientX, ev.clientY)
      setHoverId(partAt(over)?.id ?? null)
    }
  }

  const onPointerUp = (ev: React.PointerEvent) => {
    const m = mode.current
    mode.current = null
    if (viewport.current?.hasPointerCapture(ev.pointerId)) viewport.current.releasePointerCapture(ev.pointerId)
    if (!m) return
    if (m.type === 'move') {
      if (m.moved && live?.rects) {
        const rects = live.rects
        editScene((s) => updateParts(s, rects))
      } else if (!m.moved && !m.toggled && m.ids.length > 1) {
        // a plain click inside a multi-selection narrows it to that part
        setSelection([m.primary])
      }
    } else if (m.type === 'resize') {
      if (live?.rects) {
        const rects = live.rects
        editScene((s) => updateParts(s, rects))
      }
    } else if (m.type === 'link') {
      const target = partAt(document.elementFromPoint(ev.clientX, ev.clientY))
      if (target && target.id !== m.from) {
        const from = m.from
        editScene((s) => addLink(s, from, target.id))
      }
      setTool('move')
    }
    setLive(null)
  }

  /* ---------- overlays ---------- */
  const selected = p.selection.map((id) => byId.get(id)).filter((e): e is CompElement => !!e && !e.hidden)
  const single = selected.length === 1 ? selected[0] : null
  const hover = p.hoverId && !p.selection.includes(p.hoverId) ? byId.get(p.hoverId) : undefined
  const bounds =
    selected.length > 1
      ? (() => {
          const x = Math.min(...selected.map((e) => e.x))
          const y = Math.min(...selected.map((e) => e.y))
          return { x, y, w: Math.max(...selected.map((e) => e.x + e.w)) - x, h: Math.max(...selected.map((e) => e.y + e.h)) - y }
        })()
      : null
  const dragging = !!live?.rects
  const sizeLabel = single ? `${Math.round(single.w)} × ${Math.round(single.h)}` : bounds ? `${Math.round(bounds.w)} × ${Math.round(bounds.h)}` : ''
  const labelRect = single ?? bounds

  const cursor = panning ? (mode.current?.type === 'pan' ? 'grabbing' : 'grab') : INSERT_TOOLS[p.tool] ? 'crosshair' : p.tool === 'connector' ? 'crosshair' : p.hoverId && editable ? 'default' : undefined

  return (
    <div
      ref={viewport}
      data-canvas
      tabIndex={0}
      aria-label="Design canvas. Tab moves between parts, arrow keys nudge, Delete removes."
      className="pasteboard relative h-full min-h-0 w-full overflow-hidden outline-none select-none"
      style={{ cursor, touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        mode.current = null
        setLive(null)
      }}
      onPointerLeave={() => !mode.current && setHoverId(null)}
    >
      <div ref={stage} className="absolute" style={{ left: stageLeft, top: stageTop, width: W * z, height: H * z }}>
        <div className="overflow-hidden rounded-[4px] shadow-[0_0_0_1px_rgba(16,24,40,0.06),0_1px_2px_rgba(16,24,40,0.06),0_16px_48px_-16px_rgba(16,24,40,0.22)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_16px_48px_-16px_rgba(0,0,0,0.75)]">
          <Cover ref={p.svgRef} config={shownCfg} brand={p.brand} assets={p.assets} onReport={p.onReport} className="block h-auto w-full" />
        </div>

        {editable && frame && (
          <div className="pointer-events-none absolute inset-0">
            {/* connections being drawn */}
            {live?.link &&
              (() => {
                const f = byId.get(live.link.from)
                if (!f) return null
                const a = { x: frame.x + (f.x + f.w / 2) * frame.k, y: frame.y + (f.y + f.h / 2) * frame.k }
                const b = { x: frame.x + live.link.to.x * frame.k, y: frame.y + live.link.to.y * frame.k }
                return (
                  <svg className="absolute inset-0 h-full w-full overflow-visible">
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--fluid-accent)" strokeWidth={2} strokeDasharray="4 4" />
                    <circle cx={a.x} cy={a.y} r={4} fill="var(--fluid-accent)" />
                  </svg>
                )
              })()}

            {hover && !dragging && <span className="absolute rounded-[2px] ring-[1.5px] ring-[var(--fluid-accent)]" style={box(hover)!} />}

            {selected.map((e) => (
              <span key={e.id} className="absolute ring-[1.5px] ring-[var(--fluid-accent)]" style={box(e)!} />
            ))}
            {bounds && <span className="absolute border border-dashed border-[var(--fluid-accent)]" style={box(bounds)!} />}

            {/* resize handles (single selection, move tool) */}
            {single && p.tool === 'move' && !space && (
              <>
                {HANDLES.map((h) => {
                  const b = box(single)!
                  const cx = h.includes('w') ? b.left : h.includes('e') ? b.left + b.width : b.left + b.width / 2
                  const cy = h.includes('n') ? b.top : h.includes('s') ? b.top + b.height : b.top + b.height / 2
                  return (
                    <span
                      key={h}
                      data-handle={h}
                      className="pointer-events-auto absolute size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-[2px] border-[1.5px] border-[var(--fluid-accent)] bg-white"
                      style={{ left: cx, top: cy, cursor: HANDLE_CURSOR[h] }}
                    />
                  )
                })}
              </>
            )}

            {/* size badge under the selection */}
            {labelRect && (
              <span
                className="absolute -translate-x-1/2 rounded-[4px] bg-[var(--fluid-accent)] px-1.5 py-0.5 text-[11px] leading-none font-medium text-white tabular-nums"
                style={{ left: box(labelRect)!.left + box(labelRect)!.width / 2, top: box(labelRect)!.top + box(labelRect)!.height + 8 }}
              >
                {sizeLabel}
              </span>
            )}

            {/* alignment guides */}
            {live?.guides?.map((g, i) =>
              g.axis === 'v' ? (
                <span key={i} className="absolute w-px bg-[#F43F5E]" style={{ left: frame.x + g.at * frame.k, top: frame.y, height: ART_H * frame.k }} />
              ) : (
                <span key={i} className="absolute h-px bg-[#F43F5E]" style={{ top: frame.y + g.at * frame.k, left: frame.x, width: ART_W * frame.k }} />
              ),
            )}

            {/* spacing to neighbours */}
            {live?.gaps?.map((g, i) => {
              const len = g.to - g.from
              if (len < 4) return null
              const horiz = g.axis === 'h'
              const style = horiz
                ? { left: frame.x + g.from * frame.k, top: frame.y + g.at * frame.k, width: len * frame.k }
                : { left: frame.x + g.at * frame.k, top: frame.y + g.from * frame.k, height: len * frame.k }
              return (
                <span key={i} className={cn('absolute flex items-center justify-center bg-[#F43F5E]', horiz ? 'h-px' : 'w-px')} style={style}>
                  <span className="rounded-[3px] bg-[#F43F5E] px-1 py-px text-[10px] leading-none font-medium text-white tabular-nums">{Math.round(len)}</span>
                </span>
              )
            })}

            {live?.marquee && <span className="absolute border border-[var(--fluid-accent)] bg-[var(--fluid-accent)]/10" style={box(live.marquee)!} />}
          </div>
        )}
      </div>

      {p.preview && (
        <span className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-2.5 py-1 text-[11px] text-background">Preview · click to apply</span>
      )}
    </div>
  )
}
