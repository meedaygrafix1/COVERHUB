import { useEffect, useState, type ReactNode } from 'react'
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
  ArrowDown,
  ArrowUp,
  BringToFront,
  Copy,
  Plus,
  SendToBack,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipGroup } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { COVER_STYLES, STYLE_BY_ID, type CoverStyle } from '../../api/_styles'
import { BACKGROUNDS } from '../cover/backgrounds'
import { mix } from '../lib/color'
import {
  alignParts,
  distributeParts,
  KIND_NAMES,
  partName,
  reorderParts,
  setPartIcon,
  setPartLabel,
  updateLink,
  updateParts,
  type AlignMode,
} from '../lib/composition'
import type { BrandSettings, CompElement, CoverConfig, SceneConfig } from '../lib/types'
import { IconPicker } from './IconPicker'
import { FluidGrid, FluidGridItem, IconButton, semibold, t } from './kit'
import { Segmented } from './Segmented'
import { UiIcon } from './UiIcon'

interface Props {
  config: CoverConfig
  brand: BrandSettings
  styleId: CoverStyle['id']
  setStyle: (s: CoverStyle['id']) => void
  /** patch the cover itself (background, size) */
  update: (patch: Partial<CoverConfig>) => void
  onPreview: (patch: Partial<CoverConfig> | null) => void
  editScene: (fn: (s: SceneConfig) => SceneConfig) => void
  selection: string[]
  selLink: number | null
  onDuplicate: () => void
  onDelete: () => void
  onDeleteLink: (i: number) => void
  /** the blog post title: changing it and regenerating designs a new cover */
  title: string
  onTitle: (t: string) => void
  /** the title differs from the one the cover was designed for */
  titleChanged: boolean
  onRegenerate: () => void
  aiBusy: boolean
}

/** The four accents parts can use, in the order the composition indexes them. */
const accentColors = (primary: string) => [primary, '#1FB5A3', '#8B7CF6', mix(primary, '#38BDF8', 0.5)]
const ACCENT_NAMES = ['Brand blue', 'Mint', 'Lavender', 'Sky']

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-b border-border px-4 pt-3 pb-4 last:border-b-0">
      <div className="mb-2.5 flex h-7 items-center justify-between gap-2">
        <h2 className={cn(t.caption, 'text-foreground')} style={semibold}>
          {title}
        </h2>
        {action}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[64px_1fr] items-center gap-2">
      <span className={cn(t.caption, 'text-muted-foreground')}>{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** A number box with a letter prefix, like Figma's X / Y / W / H fields. Commits as you type. */
function NumberField({ label, value, onChange, min }: { label: string; value: number; onChange: (v: number) => void; min?: number }) {
  const [text, setText] = useState(String(Math.round(value)))
  useEffect(() => setText(String(Math.round(value))), [value])
  return (
    <label className="flex h-8 items-center gap-1.5 rounded-lg bg-[var(--hover)] px-2 focus-within:ring-2 focus-within:ring-[var(--focus-ring)]">
      <span className={cn(t.caption, 'w-3 shrink-0 text-muted-foreground')}>{label}</span>
      <input
        inputMode="numeric"
        value={text}
        aria-label={label}
        onChange={(e) => {
          setText(e.target.value)
          const n = Number(e.target.value)
          if (e.target.value.trim() !== '' && Number.isFinite(n)) onChange(min !== undefined ? Math.max(min, n) : n)
        }}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
          e.preventDefault()
          const step = (e.shiftKey ? 10 : 1) * (e.key === 'ArrowUp' ? 1 : -1)
          onChange(Math.round(value) + step)
        }}
        onBlur={() => setText(String(Math.round(value)))}
        className="h-full w-full min-w-0 bg-transparent text-[12px] text-foreground tabular-nums outline-none"
      />
    </label>
  )
}

/**
 * The right-hand Design panel. It follows the selection: the cover's look
 * when nothing is selected, a part's properties for one part, alignment for
 * several, and the style of a connection.
 */
export function DesignPanel(p: Props) {
  const [picking, setPicking] = useState<null | 'item' | 'badge'>(null)
  const scene = p.config.scene
  const comp = scene.style === 'compose' ? scene.composition : undefined
  const selected = (comp?.elements ?? []).filter((e) => p.selection.includes(e.id))

  if (p.selLink !== null && comp?.links[p.selLink]) return <LinkPanel {...p} />
  if (selected.length > 1) return <MultiPanel {...p} count={selected.length} />
  if (selected.length === 1) {
    const e = selected[0]
    return (
      <>
        <PartPanel {...p} e={e} onPick={setPicking} />
        <IconPicker
          open={picking !== null}
          onClose={() => setPicking(null)}
          brand={p.brand}
          initial={picking === 'item' ? (scene.items[e.item]?.label ?? '') : ''}
          alternatives={[]}
          current={picking === 'item' ? scene.items[e.item]?.icon : picking === 'badge' ? scene.items[e.badge]?.icon : undefined}
          onPick={(icon) => {
            if (picking) p.editScene((s) => setPartIcon(s, e.id, picking, icon))
            setPicking(null)
          }}
        />
      </>
    )
  }
  return <CoverPanel {...p} />
}

/* ---------- nothing selected: the cover ---------- */

function CoverPanel({ config: c, brand, styleId, setStyle, update, onPreview, title, onTitle, titleChanged, onRegenerate, aiBusy }: Props) {
  const style = STYLE_BY_ID[styleId]
  const editable = c.scene.style === 'compose' && !!c.scene.composition
  return (
    <>
      <Section title="Blog post title">
        <Textarea
          value={title}
          onChange={(e) => onTitle(e.target.value.replace(/\n/g, ' '))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (title.trim()) onRegenerate()
            }
          }}
          placeholder="Paste a new blog post title"
          aria-label="Blog post title"
          className="min-h-[64px]"
        />
        {titleChanged && title.trim() ? (
          <p className={cn(t.caption, 'text-[var(--fluid-accent)]')}>Title changed. Generate to design a cover for it.</p>
        ) : (
          <p className={cn(t.caption, 'text-muted-foreground')}>Working on another post? Paste its title here and generate a new cover.</p>
        )}
        <Button variant={titleChanged ? 'primary' : 'secondary'} leadingIcon={Sparkles} loading={aiBusy} disabled={!title.trim()} onClick={onRegenerate} className="w-full">
          {aiBusy ? 'Designing…' : titleChanged ? 'Generate for this title' : 'Regenerate'}
        </Button>
      </Section>
      <Section title="Cover">
        <Row label="Style">
          <Segmented
            ariaLabel="Style"
            value={styleId}
            onChange={(v) => {
              setStyle(v)
              const next = STYLE_BY_ID[v]
              if (!next.backgrounds.includes(c.background)) update({ background: next.backgrounds[0] })
            }}
            options={COVER_STYLES.map((s) => ({ value: s.id, label: s.name }))}
          />
        </Row>
        <Row label="Size">
          <Segmented
            ariaLabel="Canvas size"
            value={c.size}
            onChange={(v) => update({ size: v })}
            options={[
              { value: '1200x630', label: '1200 × 630' },
              { value: '1600x900', label: '1600 × 900' },
            ]}
          />
        </Row>
        <p className={cn(t.caption, 'text-muted-foreground')}>{style.hint}. Regenerate to redesign in this style.</p>
      </Section>
      <Section title="Background">
        <FluidGrid cols={3} label="Backgrounds">
          {BACKGROUNDS.filter((b) => ['blueprint', 'pastel', 'sky', 'mist', 'aurora', 'paper'].includes(b.id)).map((b, i) => (
            <FluidGridItem
              key={b.id}
              index={i}
              selected={b.id === c.background}
              label={b.name}
              caption={b.name}
              onClick={() => update({ background: b.id })}
              onPreview={(on) => onPreview(on ? { background: b.id } : null)}
            >
              <span className="block h-9" style={{ background: b.swatch(brand.primary) }} />
            </FluidGridItem>
          ))}
        </FluidGrid>
      </Section>
      <Section title={editable ? 'Tips' : 'Editing'}>
        {editable ? (
          <ul className={cn(t.caption, 'flex list-disc flex-col gap-1 pl-4 text-muted-foreground')}>
            <li>Click a part to edit it; Shift-click or drag a box to select several.</li>
            <li>Drag to move, pull the handles to resize. Hold Alt to skip snapping.</li>
            <li>Ctrl/⌘ + scroll to zoom, Space + drag to pan.</li>
            <li>Insert cards, tiles, pills, sparkles and connections from the toolbar.</li>
          </ul>
        ) : (
          <p className={cn(t.caption, 'text-muted-foreground')}>This cover uses a preset layout. Click Regenerate for a composition you can edit part by part.</p>
        )}
      </Section>
    </>
  )
}

/* ---------- one part ---------- */

function PartPanel({ config, brand, editScene, e, onPick, onDuplicate, onDelete }: Props & { e: CompElement; onPick: (slot: 'item' | 'badge') => void }) {
  const items = config.scene.items
  const it = e.item >= 0 ? items[e.item] : undefined
  const badge = e.badge >= 0 ? items[e.badge] : undefined
  const set = (patch: Partial<CompElement>) => editScene((s) => updateParts(s, { [e.id]: patch }))
  const hasIcon = e.kind === 'card' || e.kind === 'tile' || e.kind === 'pill'
  const colors = accentColors(brand.primary)

  return (
    <>
      <Section
        title={`${KIND_NAMES[e.kind]} · ${partName(e, items)}`}
        action={
          <TooltipGroup>
            <div className="flex items-center gap-0.5">
              <IconButton icon={Copy} label="Duplicate (Ctrl+D)" onClick={onDuplicate} />
              <IconButton icon={Trash2} label="Delete (Del)" onClick={onDelete} />
            </div>
          </TooltipGroup>
        }
      >
        <div className="grid grid-cols-2 gap-1.5">
          <NumberField label="X" value={e.x} onChange={(x) => set({ x })} />
          <NumberField label="Y" value={e.y} onChange={(y) => set({ y })} />
          <NumberField label="W" value={e.w} onChange={(w) => set({ w })} min={1} />
          <NumberField label="H" value={e.h} onChange={(h) => set({ h })} min={1} />
        </div>
      </Section>

      {hasIcon && (
        <Section title="Content">
          <Row label="Icon">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onPick('item')}
                aria-label={`Swap icon ${it?.icon ?? ''}`}
                data-kubai-trigger
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--hover)] outline-none hover:bg-[var(--active)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                {it ? <UiIcon name={it.icon} size={20} color={brand.primary} trigger="parent" /> : <Plus size={14} />}
              </button>
              <span className={cn(t.caption, 'truncate text-muted-foreground')}>{it ? it.icon : 'No icon'}</span>
              {it && e.kind === 'card' && (
                <Tooltip content="Remove icon">
                  <Button variant="ghost" size="icon-compact" aria-label="Remove icon" className="ml-auto" onClick={() => editScene((s) => setPartIcon(s, e.id, 'item', null))}>
                    <X />
                  </Button>
                </Tooltip>
              )}
            </div>
          </Row>
          {it && (
            <Row label="Caption">
              <Input value={it.label} maxLength={32} onChange={(ev) => editScene((s) => setPartLabel(s, e.id, ev.target.value))} placeholder={e.kind === 'tile' ? 'Layer name (not shown)' : 'Caption'} aria-label="Caption" />
            </Row>
          )}
          <Row label="Badge">
            {badge ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onPick('badge')}
                  aria-label={`Swap badge ${badge.icon}`}
                  data-kubai-trigger
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--hover)] outline-none hover:bg-[var(--active)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <UiIcon name={badge.icon} size={16} color={colors[(e.accent + 1) % 4]} trigger="parent" />
                </button>
                <span className={cn(t.caption, 'truncate text-muted-foreground')}>{badge.icon}</span>
                <Tooltip content="Remove badge">
                  <Button variant="ghost" size="icon-compact" aria-label="Remove badge" className="ml-auto" onClick={() => editScene((s) => setPartIcon(s, e.id, 'badge', null))}>
                    <X />
                  </Button>
                </Tooltip>
              </div>
            ) : (
              <Button variant="ghost" size="compact" leadingIcon={Plus} onClick={() => onPick('badge')} disabled={!it}>
                Combine with an icon
              </Button>
            )}
          </Row>
        </Section>
      )}

      <Section title="Appearance">
        {e.kind === 'card' && (
          <Row label="Lines">
            <Segmented ariaLabel="Placeholder lines" value={e.lines} onChange={(lines) => set({ lines })} options={[0, 1, 2, 3].map((n) => ({ value: n, label: String(n) }))} />
          </Row>
        )}
        {e.kind !== 'brand' && (
          <Row label="Accent">
            <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Accent colour">
              {colors.map((col, i) => (
                <Tooltip key={i} content={ACCENT_NAMES[i]}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={e.accent === i}
                    aria-label={ACCENT_NAMES[i]}
                    onClick={() => set({ accent: i })}
                    className={cn('size-6 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]', e.accent === i && 'ring-2 ring-foreground ring-offset-2 ring-offset-background')}
                    style={{ background: col }}
                  />
                </Tooltip>
              ))}
            </div>
          </Row>
        )}
        {e.kind !== 'spark' && (
          <Row label="Focal">
            <Switch className="px-0" label="Highlight with a halo" checked={e.emphasis} onToggle={() => set({ emphasis: !e.emphasis })} />
          </Row>
        )}
      </Section>

      <Section title="Layer">
        <TooltipGroup>
          <div className="flex items-center gap-0.5">
            <IconButton icon={BringToFront} label="Bring to front (Ctrl+Shift+])" onClick={() => editScene((s) => reorderParts(s, [e.id], 'front'))} />
            <IconButton icon={ArrowUp} label="Bring forward (Ctrl+])" onClick={() => editScene((s) => reorderParts(s, [e.id], 'forward'))} />
            <IconButton icon={ArrowDown} label="Send backward (Ctrl+[)" onClick={() => editScene((s) => reorderParts(s, [e.id], 'backward'))} />
            <IconButton icon={SendToBack} label="Send to back (Ctrl+Shift+[)" onClick={() => editScene((s) => reorderParts(s, [e.id], 'back'))} />
          </div>
        </TooltipGroup>
      </Section>
    </>
  )
}

/* ---------- several parts ---------- */

const ALIGN: { mode: AlignMode; icon: typeof AlignStartVertical; label: string }[] = [
  { mode: 'left', icon: AlignStartVertical, label: 'Align left' },
  { mode: 'hcenter', icon: AlignCenterVertical, label: 'Align centres horizontally' },
  { mode: 'right', icon: AlignEndVertical, label: 'Align right' },
  { mode: 'top', icon: AlignStartHorizontal, label: 'Align top' },
  { mode: 'vcenter', icon: AlignCenterHorizontal, label: 'Align centres vertically' },
  { mode: 'bottom', icon: AlignEndHorizontal, label: 'Align bottom' },
]

function MultiPanel({ editScene, selection, count, onDuplicate, onDelete }: Props & { count: number }) {
  return (
    <Section
      title={`${count} parts`}
      action={
        <TooltipGroup>
          <div className="flex items-center gap-0.5">
            <IconButton icon={Copy} label="Duplicate (Ctrl+D)" onClick={onDuplicate} />
            <IconButton icon={Trash2} label="Delete (Del)" onClick={onDelete} />
          </div>
        </TooltipGroup>
      }
    >
      <TooltipGroup>
        <div className="flex flex-wrap items-center gap-0.5">
          {ALIGN.map((a) => (
            <IconButton key={a.mode} icon={a.icon} label={a.label} onClick={() => editScene((s) => alignParts(s, selection, a.mode))} />
          ))}
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          <IconButton icon={AlignHorizontalDistributeCenter} label="Distribute horizontally" disabled={count < 3} onClick={() => editScene((s) => distributeParts(s, selection, 'h'))} />
          <IconButton icon={AlignVerticalDistributeCenter} label="Distribute vertically" disabled={count < 3} onClick={() => editScene((s) => distributeParts(s, selection, 'v'))} />
        </div>
      </TooltipGroup>
      <TooltipGroup>
        <div className="flex items-center gap-0.5">
          <IconButton icon={BringToFront} label="Bring to front" onClick={() => editScene((s) => reorderParts(s, selection, 'front'))} />
          <IconButton icon={SendToBack} label="Send to back" onClick={() => editScene((s) => reorderParts(s, selection, 'back'))} />
        </div>
      </TooltipGroup>
      <p className={cn(t.caption, 'text-muted-foreground')}>Drag any of them to move the group. Distributing needs three or more.</p>
    </Section>
  )
}

/* ---------- a connection ---------- */

function LinkPanel({ config, editScene, selLink, onDeleteLink }: Props) {
  const comp = config.scene.composition!
  const l = comp.links[selLink!]
  const name = (id: string) => {
    const e = comp.elements.find((x) => x.id === id)
    return e ? partName(e, config.scene.items) : id
  }
  return (
    <Section title="Connection" action={<IconButton icon={Trash2} label="Delete connection" onClick={() => onDeleteLink(selLink!)} />}>
      <p className={cn(t.caption, 'text-foreground')}>
        {name(l.from)} → {name(l.to)}
      </p>
      <Switch className="px-0" label="Dashed line" checked={l.dashed} onToggle={() => editScene((s) => updateLink(s, selLink!, { dashed: !l.dashed }))} />
      <Switch className="px-0" label="Glowing dot halfway" checked={l.node} onToggle={() => editScene((s) => updateLink(s, selLink!, { node: !l.node }))} />
    </Section>
  )
}
