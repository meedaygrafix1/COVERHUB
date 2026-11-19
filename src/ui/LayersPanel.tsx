import { useState } from 'react'
import { Circle, Eye, EyeOff, RectangleHorizontal, Spline, Sparkle, Square, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { partName } from '../lib/composition'
import type { BrandSettings, CompKind, Composition, SceneItem } from '../lib/types'
import { semibold, t } from './kit'
import { UiIcon } from './UiIcon'

const KIND_ICON: Record<CompKind, typeof Square> = { card: Square, tile: Circle, pill: RectangleHorizontal, brand: Square, spark: Sparkle }

interface Props {
  composition: Composition | undefined
  items: SceneItem[]
  brand: BrandSettings
  selection: string[]
  /** select a part; additive with Shift / Ctrl */
  onSelect: (id: string, additive: boolean) => void
  selLink: number | null
  onSelectLink: (i: number) => void
  hoverId: string | null
  setHoverId: (id: string | null) => void
  onToggleHidden: (id: string) => void
  onDeleteLink: (i: number) => void
  /** drag a layer to a new stack position, counted from the back */
  onMoveTo: (id: string, index: number) => void
}

/**
 * Layers, front to back like Figma: every part of the composition, with its
 * icon and caption. Click to select (Shift adds), hover to find it on the
 * canvas, the eye hides it, drag to restack. Connections are listed below.
 */
export function LayersPanel(p: Props) {
  const [drag, setDrag] = useState<{ id: string; over: number } | null>(null)
  if (!p.composition) {
    return (
      <div className="p-4">
        <p className={cn(t.caption, 'text-muted-foreground')}>This cover uses a preset layout, so its parts can't be edited one by one. Click Regenerate for an editable composition.</p>
      </div>
    )
  }
  const els = p.composition.elements
  const front = [...els].reverse()
  const name = (id: string) => {
    const e = els.find((x) => x.id === id)
    return e ? partName(e, p.items) : id
  }
  // rows are front-to-back; the stack index counts from the back
  const stackIndex = (row: number) => els.length - 1 - row

  return (
    <div className="flex flex-col pb-4">
      <p className={cn(t.caption, 'px-4 pt-3 pb-1.5 text-muted-foreground')} style={semibold}>
        Layers
      </p>
      {front.length === 0 && <p className={cn(t.caption, 'px-4 py-2 text-muted-foreground')}>Empty. Use the toolbar to add a card, tile, pill or sparkle.</p>}
      <ul role="listbox" aria-label="Layers" aria-multiselectable className="flex flex-col px-2">
        {front.map((e, row) => {
          const Icon = KIND_ICON[e.kind]
          const it = e.item >= 0 ? p.items[e.item] : undefined
          const sel = p.selection.includes(e.id)
          return (
            <li
              key={e.id}
              role="option"
              aria-selected={sel}
              draggable
              onDragStart={(ev) => {
                ev.dataTransfer.effectAllowed = 'move'
                setDrag({ id: e.id, over: row })
              }}
              onDragOver={(ev) => {
                ev.preventDefault()
                if (drag && drag.over !== row) setDrag({ ...drag, over: row })
              }}
              onDrop={(ev) => {
                ev.preventDefault()
                if (drag) p.onMoveTo(drag.id, stackIndex(row))
                setDrag(null)
              }}
              onDragEnd={() => setDrag(null)}
              className={cn('group relative', drag && drag.over === row && drag.id !== e.id && 'before:absolute before:inset-x-1 before:-top-px before:h-0.5 before:rounded-full before:bg-[var(--fluid-accent)]')}
            >
              <button
                type="button"
                onClick={(ev) => p.onSelect(e.id, ev.shiftKey || ev.metaKey || ev.ctrlKey)}
                onMouseEnter={() => p.setHoverId(e.id)}
                onMouseLeave={() => p.setHoverId(null)}
                className={cn(
                  'flex h-8 w-full items-center gap-2 rounded-md pr-8 pl-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                  sel ? 'bg-[color-mix(in_oklab,var(--fluid-accent)_14%,transparent)]' : p.hoverId === e.id ? 'bg-[var(--hover)]' : 'hover:bg-[var(--hover)]',
                  e.hidden && 'opacity-45',
                )}
              >
                <Icon size={13} className="shrink-0 text-muted-foreground" />
                {it ? <UiIcon name={it.icon} size={16} color={p.brand.primary} /> : <span className="size-4 shrink-0" />}
                <span className={cn(t.caption, 'min-w-0 flex-1 truncate text-foreground')} style={sel ? semibold : undefined}>
                  {partName(e, p.items)}
                </span>
                {e.emphasis && <span className="size-1.5 shrink-0 rounded-full bg-[var(--fluid-accent)]" title="Focal point" />}
              </button>
              <button
                type="button"
                aria-label={e.hidden ? `Show ${partName(e, p.items)}` : `Hide ${partName(e, p.items)}`}
                onClick={() => p.onToggleHidden(e.id)}
                className={cn(
                  'absolute top-1/2 right-1 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground outline-none hover:bg-[var(--active)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                  e.hidden ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                )}
              >
                {e.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </li>
          )
        })}
      </ul>

      {p.composition.links.length > 0 && (
        <>
          <p className={cn(t.caption, 'mt-3 px-4 pb-1.5 text-muted-foreground')} style={semibold}>
            Connections
          </p>
          <ul className="flex flex-col px-2">
            {p.composition.links.map((l, i) => (
              <li key={`${l.from}-${l.to}-${i}`} className="group relative">
                <button
                  type="button"
                  onClick={() => p.onSelectLink(i)}
                  onMouseEnter={() => p.setHoverId(l.to)}
                  onMouseLeave={() => p.setHoverId(null)}
                  className={cn(
                    'flex h-8 w-full items-center gap-2 rounded-md pr-8 pl-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                    p.selLink === i ? 'bg-[color-mix(in_oklab,var(--fluid-accent)_14%,transparent)]' : 'hover:bg-[var(--hover)]',
                  )}
                >
                  <Spline size={13} className="shrink-0 text-muted-foreground" />
                  <span className={cn(t.caption, 'min-w-0 flex-1 truncate text-foreground')}>
                    {name(l.from)} → {name(l.to)}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Delete connection"
                  onClick={() => p.onDeleteLink(i)}
                  className="absolute top-1/2 right-1 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground opacity-0 outline-none group-hover:opacity-100 hover:bg-[var(--active)] hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
