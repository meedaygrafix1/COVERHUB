import { useEffect, useRef, useState } from 'react'
import { FolderOpen, Pencil, Save, Trash2 } from 'lucide-react'
import { FluidHoverHighlight } from '@/components/fluid-hover-highlight'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { TooltipGroup } from '@/components/ui/tooltip'
import { useFluidHover, useRegisterFluidHoverItem, type UseFluidHoverReturn } from '@/hooks/use-fluid-hover'
import { cn } from '@/lib/utils'
import { Cover } from '../cover/Cover'
import { stripMarks } from '../lib/text'
import type { BrandSettings, CoverConfig, Draft, UploadedAsset } from '../lib/types'
import { IconButton, semibold, t } from './kit'

interface Props {
  open: boolean
  onClose: () => void
  drafts: Draft[]
  current: CoverConfig
  brand: BrandSettings
  assets: UploadedAsset[]
  onSave: (name: string) => void
  onOpen: (d: Draft) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
}

function ago(ts: number) {
  const s = Math.round((Date.now() - ts) / 1000)
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function DraftsDrawer(p: Props) {
  const [name, setName] = useState('')
  const listRef = useRef<HTMLUListElement>(null)
  const hover = useFluidHover(listRef, { axis: 'y' })

  useEffect(() => {
    if (p.open) setName(stripMarks(p.current.title).slice(0, 60))
  }, [p.open, p.current.title])

  return (
    <Dialog open={p.open} onOpenChange={(o) => !o && p.onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Drafts</DialogTitle>
          <DialogDescription>Saved in this browser. Saving with an existing name updates that draft.</DialogDescription>
        </DialogHeader>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            p.onSave(name.trim() || 'Untitled cover')
          }}
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Draft name" aria-label="Draft name" />
          <Button type="submit" variant="primary" leadingIcon={Save}>
            Save current
          </Button>
        </form>

        {p.drafts.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-[12px] bg-[var(--hover)] px-6 py-10 text-center">
            <FolderOpen size={20} className="text-muted-foreground" />
            <p className={cn(t.body, 'mt-2 text-foreground')} style={semibold}>
              No drafts yet
            </p>
            <p className={cn(t.caption, 'mt-0.5 text-muted-foreground')}>Save the current cover to pick it up later. Ctrl+S works from anywhere.</p>
          </div>
        ) : (
          <ul ref={listRef} {...hover.handlers} className="relative -mx-2 mt-4 max-h-[52vh] overflow-y-auto [scrollbar-width:thin]">
            <FluidHoverHighlight hover={hover} className="rounded-[10px]" />
            {p.drafts.map((d, i) => (
              <DraftRow key={d.id} d={d} index={i} hover={hover} {...p} />
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DraftRow({ d, index, hover, brand, assets, onOpen, onDelete, onRename }: Props & { d: Draft; index: number; hover: UseFluidHoverReturn }) {
  const ref = useRef<HTMLLIElement>(null)
  useRegisterFluidHoverItem(hover.registerItem, index, ref)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(d.name)
  return (
    <li ref={ref} className="relative flex items-center gap-3 rounded-[10px] p-2">
      {!editing && <button type="button" className="absolute inset-0 z-10 rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" aria-label={`Open ${d.name}`} onClick={() => onOpen(d)} />}
      <span className="w-[112px] shrink-0 overflow-hidden rounded-[4px] shadow-[0_0_0_1px_var(--border)]">
        <Cover config={d.config} brand={brand} assets={assets} className="pointer-events-none w-full" />
      </span>
      <div className="min-w-0 flex-1">
        {editing ? (
          <form
            className="relative z-20"
            onSubmit={(e) => {
              e.preventDefault()
              onRename(d.id, value.trim() || d.name)
              setEditing(false)
            }}
          >
            <Input autoFocus value={value} onChange={(e) => setValue(e.target.value)} onBlur={() => setEditing(false)} aria-label="Draft name" />
          </form>
        ) : (
          <>
            <p className={cn(t.body, 'truncate text-foreground')} style={semibold}>
              {d.name}
            </p>
            <p className={cn(t.caption, 'text-muted-foreground')}>{ago(d.updatedAt)}</p>
          </>
        )}
      </div>
      {!editing && (
        <div className="relative z-20 flex items-center gap-0.5">
          <TooltipGroup>
            <div className="flex">
              <IconButton
                icon={Pencil}
                label="Rename"
                onClick={() => {
                  setValue(d.name)
                  setEditing(true)
                }}
              />
              <IconButton icon={Trash2} label="Delete draft" onClick={() => onDelete(d.id)} />
            </div>
          </TooltipGroup>
        </div>
      )}
    </li>
  )
}
