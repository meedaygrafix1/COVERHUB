import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ClipboardCopy,
  ClipboardPaste,
  Download,
  Ellipsis,
  FileCode2,
  FolderOpen,
  Image,
  Link2,
  Monitor,
  Moon,
  Palette,
  Pencil,
  Redo2,
  RotateCcw,
  Sparkles,
  Sun,
  Undo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownContent, DropdownMenu, DropdownSeparator, DropdownTrigger } from '@/components/ui/dropdown'
import { MenuItem } from '@/components/ui/menu-item'
import { Tooltip, TooltipGroup } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { exportDims } from '../cover/Cover'
import { buildPalette } from '../cover/palette'
import { SpiderMark } from '../cover/primitives'
import { stripMarks } from '../lib/text'
import { useTheme, type Theme } from '../lib/theme'
import type { BrandSettings, SizeId } from '../lib/types'
import { semibold, t } from './kit'

interface Props {
  brand: BrandSettings
  title: string
  /** edit the post title in place (editor only) */
  onTitle?: (title: string) => void
  draftCount: number
  exporting: 'png' | 'svg' | null
  size: SizeId
  onExport: (kind: 'png' | 'svg', scale?: 1 | 2) => void
  onDrafts: () => void
  onBrand: () => void
  onShareLink: () => void
  onCopyConfig: () => void
  onPasteConfig: () => void
  onReset: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  /** on the create screen: no editor controls, there is no cover yet */
  creating?: boolean
  onRegenerate?: () => void
  aiBusy?: boolean
}

const THEMES: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: 'system', label: 'Theme: match system', icon: Monitor },
  { id: 'light', label: 'Theme: light', icon: Sun },
  { id: 'dark', label: 'Theme: dark', icon: Moon },
]

function ToolButton({ label, shortcut, icon: Icon, active, onClick, disabled }: { label: string; shortcut?: string; icon: typeof Sun; active?: boolean; onClick?: () => void; disabled?: boolean }) {
  return (
    <Tooltip content={label} shortcut={shortcut}>
      <Button variant="ghost" size="icon-compact" aria-label={label} aria-pressed={active} active={active} onClick={onClick} disabled={disabled}>
        <Icon />
      </Button>
    </Tooltip>
  )
}

export function TopBar(p: Props) {
  const [moreOpen, setMoreOpen] = useState(false)
  const [theme, setTheme] = useTheme()
  const themeIndex = THEMES.findIndex((x) => x.id === theme)
  const nextTheme = THEMES[(themeIndex + 1) % THEMES.length]
  const logoPalette = useMemo(() => buildPalette(p.brand, 'sky', 'topbar'), [p.brand])
  const { w, h } = exportDims(p.size)
  const name = stripMarks(p.title).trim() || 'Untitled cover'
  const ThemeIcon = THEMES[themeIndex].icon

  return (
    <header className="relative z-20 flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border bg-background pr-2 pl-3">
      {/* file: logo and the post title as the file name */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 40 40" aria-hidden className="shrink-0">
          <defs>
            <linearGradient id={logoPalette.ids.logo} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={logoPalette.primary} />
              <stop offset="1" stopColor={logoPalette.primaryBright} />
            </linearGradient>
          </defs>
          {p.brand.customLogo ? <image href={p.brand.customLogo} width="40" height="40" /> : <SpiderMark x={0} y={0} size={40} p={logoPalette} />}
        </svg>
        <span className={cn(t.body, 'hidden shrink-0 text-foreground xl:inline')} style={semibold}>
          Cover Studio
        </span>
        <span className={cn(t.body, 'hidden shrink-0 text-muted-foreground xl:inline')} aria-hidden>
          /
        </span>
        {p.onTitle ? (
          <Tooltip content="Blog post title: type or paste a new one, then Regenerate">
            <label className="group flex h-8 max-w-[520px] min-w-0 flex-1 cursor-text items-center gap-1.5 rounded-lg px-2 hover:bg-[var(--hover)] focus-within:bg-transparent focus-within:shadow-[0_0_0_1.5px_var(--fluid-accent)]">
              <input
                value={p.title}
                onChange={(e) => p.onTitle!(e.target.value)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === 'Escape') && (e.target as HTMLInputElement).blur()}
                aria-label="Blog post title"
                placeholder="Paste your blog post title"
                className={cn(t.body, 'h-full min-w-0 flex-1 truncate bg-transparent text-foreground outline-none placeholder:text-muted-foreground')}
              />
              <Pencil size={13} className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden />
            </label>
          </Tooltip>
        ) : (
          <span className={cn(t.body, 'min-w-0 truncate text-muted-foreground')} title={name}>
            {name}
          </span>
        )}
      </div>

      <div className="flex min-w-0 items-center justify-end gap-1">
        <TooltipGroup>
          <div className="flex items-center gap-0.5">
            {!p.creating && (
              <>
                <ToolButton label="Undo" shortcut="Ctrl+Z" icon={Undo2} onClick={p.onUndo} disabled={!p.canUndo} />
                <ToolButton label="Redo" shortcut="Ctrl+Shift+Z" icon={Redo2} onClick={p.onRedo} disabled={!p.canRedo} />
                <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />
              </>
            )}
            <ToolButton label={p.draftCount ? `Drafts (${p.draftCount})` : 'Drafts'} shortcut="Ctrl+S" icon={FolderOpen} onClick={p.onDrafts} />
            <ToolButton label="Brand colours and logo" icon={Palette} onClick={p.onBrand} />
            <ToolButton label={`${THEMES[themeIndex].label} (click for ${nextTheme.id})`} icon={ThemeIcon} onClick={() => setTheme(nextTheme.id)} />
            <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
              <Tooltip content="More" forceOpen={moreOpen ? false : undefined}>
                <DropdownTrigger
                  render={
                    <Button variant="ghost" size="icon-compact" aria-label="More" active={moreOpen}>
                      <Ellipsis />
                    </Button>
                  }
                />
              </Tooltip>
              <DropdownContent align="end" sideOffset={6}>
                <MenuItem index={0} icon={Link2} label="Copy share link" onSelect={p.onShareLink} />
                <MenuItem index={1} icon={ClipboardCopy} label="Copy design config" onSelect={p.onCopyConfig} />
                <MenuItem index={2} icon={ClipboardPaste} label="Paste design config…" onSelect={p.onPasteConfig} />
                <DropdownSeparator />
                <MenuItem index={3} icon={RotateCcw} label="New cover" destructive onSelect={p.onReset} />
              </DropdownContent>
            </DropdownMenu>
          </div>
        </TooltipGroup>

        {p.onRegenerate && (
          <Button variant="secondary" leadingIcon={Sparkles} loading={p.aiBusy} onClick={p.onRegenerate} className="ml-1" aria-label="Regenerate">
            <span className="hidden lg:inline">{p.aiBusy ? 'Designing…' : 'Regenerate'}</span>
          </Button>
        )}

        {!p.creating && (
          <DropdownMenu>
            <DropdownTrigger
              render={
                <Button variant="primary" leadingIcon={Download} trailingIcon={ChevronDown} loading={!!p.exporting} className="ml-1">
                  Export
                </Button>
              }
            />
            <DropdownContent align="end" sideOffset={6}>
              <MenuItem index={0} icon={Image} label={`PNG @2x · ${w * 2}×${h * 2}`} shortcut="Ctrl+E" onSelect={() => p.onExport('png', 2)} />
              <MenuItem index={1} icon={Image} label={`PNG · ${w}×${h}`} onSelect={() => p.onExport('png', 1)} />
              <MenuItem index={2} icon={FileCode2} label="SVG · vector" onSelect={() => p.onExport('svg')} />
            </DropdownContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
