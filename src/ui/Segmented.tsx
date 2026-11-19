import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { spring } from '@/lib/springs'
import { cn } from '@/lib/utils'
import { normal, semibold, t } from './kit'

/**
 * A segmented choice on the compact ladder: a 28px track with 2px padding and
 * 24px segments (outer radius 8 → inner 6, concentric). The selection pill is
 * one element moved by transform, so it slides between equal-width cells.
 */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  disabled,
  ariaLabel,
}: {
  value: T
  options: { value: T; label: ReactNode; title?: string; text?: string }[]
  onChange: (v: T) => void
  disabled?: boolean
  ariaLabel: string
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  const n = options.length
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className={cn('relative grid h-7 rounded-[8px] bg-[var(--tint)] p-0.5', disabled && 'pointer-events-none opacity-50')}
      style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
    >
      <motion.span
        aria-hidden
        className="absolute top-0.5 bottom-0.5 left-0.5 rounded-[6px] bg-background shadow-[0_1px_2px_rgba(16,24,40,0.10),0_0_0_0.5px_rgba(16,24,40,0.08)] dark:bg-[var(--surface-5)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
        style={{ width: `calc((100% - 4px) / ${n})` }}
        initial={false}
        animate={{ x: `${index * 100}%` }}
        transition={spring.moderate}
      />
      {options.map((o, i) => {
        const on = i === index
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.text}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative z-[1] flex h-6 min-w-0 items-center justify-center gap-1 rounded-[6px] px-2 outline-none',
              'transition-colors duration-80 focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
              t.caption,
              on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span className="grid">
              <span className="col-start-1 row-start-1 truncate transition-[font-variation-settings] duration-80" style={on ? semibold : normal}>
                {o.label}
              </span>
              <span aria-hidden className="invisible col-start-1 row-start-1 truncate" style={semibold}>
                {o.label}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
