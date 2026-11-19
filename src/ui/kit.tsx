import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { FluidHoverHighlight } from '@/components/fluid-hover-highlight'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { useFluidHover, useRegisterFluidHoverItem, type UseFluidHoverReturn } from '@/hooks/use-fluid-hover'
import { fontWeights } from '@/lib/font-weight'
import { typeClass } from '@/lib/type-scale'
import { cn } from '@/lib/utils'
import type { IconComponent } from '@/lib/icon-context'

/* The inspector is a dense region: every text role uses the compact step. */
export const t = {
  title: typeClass('title', 'compact'),
  subtitle: typeClass('subtitle', 'compact'),
  body: typeClass('body', 'compact'),
  caption: typeClass('caption', 'compact'),
  micro: typeClass('micro', 'compact'),
}

export const semibold = { fontVariationSettings: fontWeights.semibold }
export const normal = { fontVariationSettings: fontWeights.normal }

/** An inspector section: a heading row with an optional action, then controls. */
export function Section({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('border-b border-border px-4 pt-4 pb-5 last:border-b-0', className)}>
      <div className="mb-3 flex h-7 items-center justify-between gap-2">
        <h2 className={cn(t.body, 'text-foreground')} style={semibold}>
          {title}
        </h2>
        {action}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

/** A field label with optional right-aligned meta (counter, value). */
export function Label({ children, htmlFor, meta }: { children: ReactNode; htmlFor?: string; meta?: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className={cn(t.caption, 'text-muted-foreground')}>
        {children}
      </label>
      {meta && <span className={cn(t.caption, 'text-muted-foreground tabular-nums')}>{meta}</span>}
    </div>
  )
}

/** Icon-only button that names itself: aria-label and tooltip share the words. */
export function IconButton({
  icon,
  label,
  onClick,
  shortcut,
  variant = 'ghost',
  active,
  disabled,
}: {
  icon: IconComponent
  label: string
  onClick?: () => void
  shortcut?: string
  variant?: 'ghost' | 'tertiary' | 'secondary'
  active?: boolean
  disabled?: boolean
}) {
  const Icon = icon
  return (
    <Tooltip content={label} shortcut={shortcut}>
      <Button variant={variant} size="icon-compact" aria-label={label} onClick={onClick} active={active} disabled={disabled}>
        <Icon />
      </Button>
    </Tooltip>
  )
}

/* ------------------------------------------------------------------ */
/* Fluid grid: one gliding highlight across a grid of thumbnails       */
/* ------------------------------------------------------------------ */

const GridCtx = createContext<UseFluidHoverReturn | null>(null)

/**
 * Cells touch (gap 0) and carry their own padding, so the highlight glides
 * from cell to cell instead of blinking out in the gutters.
 */
export function FluidGrid({ cols, children, className, label }: { cols: 2 | 3 | 4; children: ReactNode; className?: string; label?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const hover = useFluidHover(ref, { axis: 'xy' })
  return (
    <GridCtx.Provider value={hover}>
      <div
        ref={ref}
        {...hover.handlers}
        role="group"
        aria-label={label}
        className={cn('relative -mx-1 grid', cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-4', className)}
      >
        <FluidHoverHighlight hover={hover} className="rounded-[10px]" />
        {children}
      </div>
    </GridCtx.Provider>
  )
}

export function FluidGridItem({
  index,
  selected,
  onClick,
  label,
  caption,
  children,
  badge,
  onPreview,
}: {
  index: number
  selected: boolean
  onClick: () => void
  label: string
  caption?: ReactNode
  children: ReactNode
  badge?: ReactNode
  /** hover/focus preview on the canvas (true on enter, false on leave) */
  onPreview?: (on: boolean) => void
}) {
  const hover = useContext(GridCtx)
  const ref = useRef<HTMLButtonElement>(null)
  useRegisterFluidHoverItem(hover?.registerItem, index, ref)
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => {
        onPreview?.(false)
        onClick()
      }}
      onPointerEnter={onPreview && ((e) => e.pointerType === 'mouse' && onPreview(true))}
      onPointerLeave={onPreview && (() => onPreview(false))}
      onFocus={onPreview && (() => onPreview(true))}
      onBlur={onPreview && (() => onPreview(false))}
      aria-pressed={selected}
      aria-label={caption ? undefined : label}
      title={caption ? undefined : label}
      className={cn(
        'group/cell relative flex flex-col gap-1.5 rounded-[10px] p-1 text-left outline-none',
        'focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
        selected && 'bg-active',
      )}
    >
      <span
        className={cn(
          'relative block overflow-hidden rounded-md bg-background',
          'shadow-[0_0_0_1px_var(--border)] transition-[box-shadow] duration-150 ease-out',
          selected && 'shadow-[0_0_0_1.5px_var(--fluid-accent)]',
        )}
      >
        {children}
        {badge}
      </span>
      {caption && (
        <span className="grid px-0.5 pb-0.5">
          {/* weight without reflow: the semibold ghost reserves the width */}
          <span
            className={cn(t.caption, 'col-start-1 row-start-1 truncate transition-[color,font-variation-settings] duration-80', selected ? 'text-foreground' : 'text-muted-foreground')}
            style={selected ? semibold : normal}
          >
            {caption}
          </span>
          <span aria-hidden className={cn(t.caption, 'invisible col-start-1 row-start-1 truncate')} style={semibold}>
            {caption}
          </span>
        </span>
      )}
    </button>
  )
}

/** A quiet, collapsible group for advanced or secondary controls. */
export function Disclosure({ title, hint, children, defaultOpen = false, flush }: { title: string; hint?: string; children: ReactNode; defaultOpen?: boolean; flush?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 px-4 py-3 text-left outline-none hover:bg-[var(--hover)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-inset"
      >
        <ChevronRight size={14} className={cn('shrink-0 text-muted-foreground transition-transform duration-150', open && 'rotate-90')} />
        <span className={cn(t.body, 'text-foreground')} style={semibold}>
          {title}
        </span>
        {hint && <span className={cn(t.caption, 'ml-auto truncate text-muted-foreground')}>{hint}</span>}
      </button>
      {open && <div className={flush ? '' : 'flex flex-col gap-3 px-4 pb-5'}>{children}</div>}
    </div>
  )
}
