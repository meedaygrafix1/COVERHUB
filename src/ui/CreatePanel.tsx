import { useEffect, useMemo, useRef } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { COVER_STYLES, type CoverStyle } from '../../api/_styles'
import { Cover } from '../cover/Cover'
import { DEFAULT_CONFIG } from '../lib/storage'
import type { BrandSettings, CoverConfig, UploadedAsset } from '../lib/types'
import { FluidGrid, FluidGridItem, Label, semibold, t } from './kit'

const EXAMPLES = ['How to scrape Amazon prices with Python', 'Monitor Reddit comments for brand complaints', 'Puppeteer vs Playwright for web scraping']

/** What each style card shows: the default scene in that style's look. */
const SAMPLES: Record<CoverStyle['id'], Partial<CoverConfig>> = {
  blueprint: { background: 'blueprint' },
  soft: { background: 'pastel' },
}

interface Props {
  title: string
  setTitle: (v: string) => void
  style: CoverStyle['id']
  setStyle: (s: CoverStyle['id']) => void
  busy: boolean
  onGenerate: () => void
  brand: BrandSettings
  assets: UploadedAsset[]
}

/**
 * The first step: a title, a style, Generate. Everything else waits until
 * there is a cover to tweak.
 */
export function CreatePanel({ title, setTitle, style, setStyle, busy, onGenerate, brand, assets }: Props) {
  const input = useRef<HTMLTextAreaElement>(null)
  useEffect(() => input.current?.focus(), [])
  const ready = title.trim().length > 0 && !busy
  const thumbTitle = title.trim() || 'Your post title goes here'
  const samples = useMemo(
    () => Object.fromEntries(COVER_STYLES.map((st) => [st.id, { ...DEFAULT_CONFIG, template: 'illustration', illustration: 'scene', ...SAMPLES[st.id], title: thumbTitle, subtitle: '', eyebrow: '', showLogo: false }])) as Record<CoverStyle['id'], CoverConfig>,
    [thumbTitle],
  )

  return (
    <div className="pasteboard flex h-full min-h-0 justify-center overflow-y-auto p-4 sm:items-center sm:p-8">
      <form
        className="w-full max-w-[760px] rounded-[20px] bg-card p-5 shadow-[0_0_0_1px_rgba(16,24,40,0.06),0_24px_64px_-16px_rgba(16,24,40,0.2)] sm:p-8 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_24px_64px_-16px_rgba(0,0,0,0.7)]"
        onSubmit={(e) => {
          e.preventDefault()
          if (ready) onGenerate()
        }}
      >
        <h1 className="text-[22px] leading-tight tracking-[-0.01em] text-foreground" style={semibold}>
          Create a cover
        </h1>
        <p className={cn(t.body, 'mt-1 text-muted-foreground')}>Give it your post title and pick a style. You can tweak everything after.</p>

        <div className="mt-6">
          <Label htmlFor="create-title">1. Post title</Label>
          <Textarea
            ref={input}
            id="create-title"
            value={title}
            onChange={(e) => setTitle(e.target.value.replace(/\n/g, ' '))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (ready) onGenerate()
              }
            }}
            placeholder="How to scrape Amazon prices with Python"
            className="min-h-[64px] text-[15px]"
            disabled={busy}
          />
          {!title.trim() && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={cn(t.caption, 'mr-0.5 text-muted-foreground')}>Try</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setTitle(ex)}
                  className={cn(t.caption, 'rounded-full bg-[var(--hover)] px-2.5 py-1 text-foreground outline-none hover:bg-[var(--active)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]')}
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          <Label>2. Style</Label>
          <FluidGrid cols={2} label="Cover style">
            {COVER_STYLES.map((st, i) => (
              <FluidGridItem key={st.id} index={i} selected={style === st.id} label={`${st.name}: ${st.hint}`} caption={st.name} onClick={() => setStyle(st.id)}>
                <Cover config={samples[st.id]} brand={brand} assets={assets} className="pointer-events-none w-full" label={`${st.name} style`} />
              </FluidGridItem>
            ))}
          </FluidGrid>
          <p className={cn(t.caption, 'mt-2 text-muted-foreground')}>{COVER_STYLES.find((st) => st.id === style)?.hint}</p>
        </div>

        <Button type="submit" variant="primary" leadingIcon={Sparkles} loading={busy} disabled={!title.trim()} className="mt-6 h-11 w-full">
          {busy ? 'Designing your cover…' : 'Generate cover'}
        </Button>
        {busy && <p className={cn(t.caption, 'mt-2 text-center text-muted-foreground')}>Claude is composing a visual for your post. This takes about 10 seconds.</p>}
      </form>
    </div>
  )
}
