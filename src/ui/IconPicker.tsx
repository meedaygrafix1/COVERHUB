import { useDeferredValue, useMemo, useState } from 'react'
import { Replace, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { getIconEntry, useIconIndex } from '../library/catalog'
import { searchIcons } from '../library/match'
import type { BrandSettings } from '../lib/types'
import { t } from './kit'
import { UiIcon } from './UiIcon'

/** Search 3,000+ library icons; also offers same-topic alternatives and badged variants of the current icon. */
export function IconPicker({
  open,
  onClose,
  onPick,
  brand,
  initial,
  alternatives,
  current,
}: {
  open: boolean
  onClose: () => void
  onPick: (icon: string) => void
  brand: BrandSettings
  initial: string
  alternatives: string[]
  current?: string
}) {
  const ready = useIconIndex()
  const [query, setQuery] = useState<string | null>(null)
  const q = query ?? initial
  const deferred = useDeferredValue(q)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const results = useMemo(() => searchIcons(deferred, 72), [deferred, ready])
  const variants = useMemo(() => {
    if (!current) return []
    const base = getIconEntry(current)?.base ?? current
    return [base, ...searchIcons(base, 40).filter((n) => getIconEntry(n)?.base === base)].filter((n) => n !== current).slice(0, 12)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, ready])

  const grid = (names: string[]) => (
    <div className="grid grid-cols-6 gap-1">
      {names.map((n) => (
        <Tooltip key={n} content={n}>
          <button
            type="button"
            onClick={() => onPick(n)}
            aria-label={n}
            data-kubai-trigger
            className={cn(
              'flex aspect-square items-center justify-center rounded-lg outline-none hover:bg-[var(--hover)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
              n === current && 'bg-active',
            )}
          >
            <UiIcon name={n} size={30} color={brand.primary} trigger="parent" />
          </button>
        </Tooltip>
      ))}
    </div>
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose()
          setQuery(null)
        }
      }}
    >
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Choose an icon</DialogTitle>
          <DialogDescription>Search 3,000+ Kubai icons by name or idea: “price”, “secure”, “shopping”, “weather”.</DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-4">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus aria-label="Search icons" value={q} onChange={(e) => setQuery(e.target.value)} placeholder="Search icons" className="pl-9" />
          </div>
          <div className="max-h-[52vh] overflow-y-auto pr-1 [scrollbar-width:thin]">
            {!query && alternatives.length > 0 && (
              <div className="mb-4">
                <p className={cn(t.caption, 'mb-1.5 text-muted-foreground')}>Same topic</p>
                {grid(alternatives)}
              </div>
            )}
            {!query && variants.length > 0 && (
              <div className="mb-4">
                <p className={cn(t.caption, 'mb-1.5 flex items-center gap-1 text-muted-foreground')}>
                  <Replace size={12} /> With a badge
                </p>
                {grid(variants)}
              </div>
            )}
            <p className={cn(t.caption, 'mb-1.5 text-muted-foreground')}>{q ? `Results for “${q}”` : 'Library'}</p>
            {results.length ? grid(results) : <p className={cn(t.caption, 'py-6 text-center text-muted-foreground')}>{ready ? 'No icons match. Try a broader word.' : 'Loading the library…'}</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
