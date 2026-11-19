import { useRef } from 'react'
import { RotateCcw, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ColorPickerPopover } from '@/components/ui/color-picker'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { BACKGROUNDS } from '../cover/backgrounds'
import { DEFAULT_BRAND } from '../cover/palette'
import { contrast, isHex } from '../lib/color'
import type { BrandSettings } from '../lib/types'
import { FluidGrid, FluidGridItem, Label, t } from './kit'
import { Segmented } from './Segmented'

interface Props {
  open: boolean
  onClose: () => void
  brand: BrandSettings
  setBrand: (b: BrandSettings) => void
  onLogoUpload: (f: File) => void
}

/** The backgrounds covers can use (the illustration format is drawn for light fields). */
const LIGHT: string[] = ['blueprint', 'pastel', 'sky', 'mist', 'aurora', 'paper']

const REFERENCE_SWATCHES = [
  ['#007AFF', 'Site primary'],
  ['#2563EB', 'Cover blue'],
  ['#0657C2', 'Deep blue'],
  ['#2D8CFF', 'Bright blue'],
  ['#0A1222', 'Ink'],
  ['#E3ECF7', 'Soft line'],
] as const

export function BrandModal(p: Props) {
  const b = p.brand
  const set = (patch: Partial<BrandSettings>) => p.setBrand({ ...b, ...patch })

  return (
    <Dialog open={p.open} onOpenChange={(o) => !o && p.onClose()}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>Brand system</DialogTitle>
          <DialogDescription>The colour and logo every cover uses. Stored in this browser.</DialogDescription>
        </DialogHeader>

        <div className="mt-5 max-h-[58vh] overflow-y-auto [scrollbar-width:thin]">
          <Identity brand={b} set={set} onLogoUpload={p.onLogoUpload} />
        </div>

        <DialogFooter>
          <Button variant="ghost" leadingIcon={RotateCcw} className="mr-auto" onClick={() => p.setBrand({ ...DEFAULT_BRAND })}>
            Restore Spidra defaults
          </Button>
          <Button variant="primary" onClick={p.onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const low = isHex(value) && contrast(value, '#FFFFFF') < 3
  return (
    <div>
      <Label meta={low ? 'Low contrast on white' : undefined}>{label}</Label>
      <ColorPickerPopover
        value={value}
        onValueChange={(v: string) => isHex(v.slice(0, 7)) && onChange(v.slice(0, 7))}
        swatches={REFERENCE_SWATCHES.map(([color, name]) => ({ color, label: name }))}
      />
    </div>
  )
}

function Identity({ brand: b, set, onLogoUpload }: { brand: BrandSettings; set: (p: Partial<BrandSettings>) => void; onLogoUpload: (f: File) => void }) {
  const logoRef = useRef<HTMLInputElement>(null)
  return (
    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
      <ColorField label="Primary colour" value={b.primary} onChange={(v) => set({ primary: v })} />

      <div>
        <Label meta="Used by the Spidra mark part">Logo mark</Label>
        <div className="flex items-center gap-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] shadow-[0_0_0_1px_var(--border)]">
            <img src={b.customLogo || '/favicon.svg'} alt="Current logo" className="size-6 object-contain" />
          </span>
          <Button variant="tertiary" leadingIcon={Upload} onClick={() => logoRef.current?.click()}>
            Upload
          </Button>
          {b.customLogo && (
            <Button variant="ghost" onClick={() => set({ customLogo: '' })}>
              Use default
            </Button>
          )}
          <input
            ref={logoRef}
            type="file"
            accept="image/svg+xml,image/png,image/webp,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onLogoUpload(f)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      <div>
        <Label>Default background</Label>
        <Select value={b.defaultBackground} onValueChange={(v) => set({ defaultBackground: v as BrandSettings['defaultBackground'] })}>
          <SelectTrigger aria-label="Default background" />
          <SelectContent>
            {BACKGROUNDS.filter((x) => LIGHT.includes(x.id)).map((x, i) => (
              <SelectItem key={x.id} index={i} value={x.id}>
                {x.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Default size</Label>
        <Segmented
          ariaLabel="Default size"
          value={b.defaultSize}
          onChange={(v) => set({ defaultSize: v })}
          options={[
            { value: '1200x630', label: '1200 × 630' },
            { value: '1600x900', label: '1600 × 900' },
          ]}
        />
      </div>

      <div className="sm:col-span-2">
        <Label meta="Click to use as primary">Palette from spidra.io</Label>
        <FluidGrid cols={3} label="Brand palette">
          {REFERENCE_SWATCHES.map(([c, n], i) => (
            <FluidGridItem key={c} index={i} selected={b.primary.toUpperCase() === c} label={n} caption={`${n} · ${c}`} onClick={() => set({ primary: c })}>
              <span className="block h-9" style={{ background: c }} />
            </FluidGridItem>
          ))}
        </FluidGrid>
        <p className={cn(t.caption, 'mt-2 text-muted-foreground')}>Covers use Geist, embedded in every SVG and PNG export.</p>
      </div>
    </div>
  )
}
