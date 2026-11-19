import { ChevronDown, Circle, Hand, MousePointer2, RectangleHorizontal, Sparkle, Spline, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownContent, DropdownMenu, DropdownSeparator, DropdownTrigger } from '@/components/ui/dropdown'
import { MenuItem } from '@/components/ui/menu-item'
import { Tooltip, TooltipGroup } from '@/components/ui/tooltip'
import type { Tool } from './Canvas'

const TOOLS: { id: Tool; label: string; key: string; icon: typeof Square; group: number }[] = [
  { id: 'move', label: 'Move', key: 'V', icon: MousePointer2, group: 0 },
  { id: 'hand', label: 'Hand', key: 'H', icon: Hand, group: 0 },
  { id: 'card', label: 'Card', key: 'R', icon: Square, group: 1 },
  { id: 'tile', label: 'Tile', key: 'O', icon: Circle, group: 1 },
  { id: 'pill', label: 'Pill', key: 'P', icon: RectangleHorizontal, group: 1 },
  { id: 'spark', label: 'Sparkle', key: 'K', icon: Sparkle, group: 1 },
  { id: 'connector', label: 'Connection', key: 'L', icon: Spline, group: 2 },
]

interface Props {
  /** omitted when the cover can't be edited part by part: only zoom is shown */
  tool?: Tool
  setTool?: (t: Tool) => void
  zoomShown: number
  onZoom: (z: number | 'fit' | 'in' | 'out') => void
}

/**
 * The floating toolbar at the bottom of the canvas, like Figma's: tools on
 * the left, zoom on the right. It sits over the pasteboard, never the cover.
 */
export function FloatingToolbar({ tool, setTool, zoomShown, onZoom }: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
      <TooltipGroup>
        <div
          role="toolbar"
          aria-label="Tools"
          className="pointer-events-auto flex items-center gap-0.5 rounded-2xl bg-popover p-1 shadow-[0_0_0_1px_rgba(16,24,40,0.08),0_12px_32px_-8px_rgba(16,24,40,0.28)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_12px_32px_-8px_rgba(0,0,0,0.7)]"
        >
          {tool &&
            setTool &&
            TOOLS.map((tl, i) => {
              const Icon = tl.icon
              return (
                <span key={tl.id} className="contents">
                  {i > 0 && TOOLS[i - 1].group !== tl.group && <span className="mx-1 h-5 w-px bg-border" aria-hidden />}
                  <Tooltip content={tl.label} shortcut={tl.key}>
                    <Button variant="ghost" size="icon" aria-label={tl.label} aria-pressed={tool === tl.id} active={tool === tl.id} onClick={() => setTool(tl.id)}>
                      <Icon />
                    </Button>
                  </Tooltip>
                </span>
              )
            })}
          {tool && <span className="mx-1 h-5 w-px bg-border" aria-hidden />}
          <DropdownMenu>
            <Tooltip content="Zoom">
              <DropdownTrigger
                render={
                  <Button variant="ghost" trailingIcon={ChevronDown} aria-label="Zoom" className="min-w-[72px] tabular-nums">
                    {Math.round(zoomShown * 100)}%
                  </Button>
                }
              />
            </Tooltip>
            <DropdownContent align="end" side="top" sideOffset={8}>
              <MenuItem index={0} label="Zoom in" shortcut="Ctrl+=" onSelect={() => onZoom('in')} />
              <MenuItem index={1} label="Zoom out" shortcut="Ctrl+-" onSelect={() => onZoom('out')} />
              <MenuItem index={2} label="Zoom to fit" shortcut="Shift+1" onSelect={() => onZoom('fit')} />
              <DropdownSeparator />
              <MenuItem index={3} label="50%" onSelect={() => onZoom(0.5)} />
              <MenuItem index={4} label="100%" shortcut="Shift+0" onSelect={() => onZoom(1)} />
              <MenuItem index={5} label="200%" onSelect={() => onZoom(2)} />
            </DropdownContent>
          </DropdownMenu>
        </div>
      </TooltipGroup>
    </div>
  )
}
