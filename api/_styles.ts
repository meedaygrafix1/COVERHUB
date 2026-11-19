import type { BackgroundId, TemplateId } from '../src/lib/types'

/**
 * The cover styles a writer picks before generating. Every cover is a
 * full-bleed illustration with no headline (the title lives on the blog
 * page); a style sets the look around Claude's composition. Shared by the
 * server (to brief Claude) and the browser (style cards, and keeping
 * Claude's answer inside the chosen style). Plain data, safe to bundle.
 */
export interface CoverStyle {
  id: 'blueprint' | 'soft'
  name: string
  /** one line for the style card */
  hint: string
  /** what Claude is told about the style */
  brief: string
  /** allowed templates, preferred first (always the full-bleed illustration) */
  templates: TemplateId[]
  /** allowed backgrounds, preferred first */
  backgrounds: BackgroundId[]
}

export const COVER_STYLES: CoverStyle[] = [
  {
    id: 'blueprint',
    name: 'Blueprint',
    hint: 'A technical grid, crisp and clean. The house look',
    brief: 'A light technical blueprint grid. Precise and engineered: align parts to a clear structure and keep generous spacing.',
    templates: ['illustration'],
    backgrounds: ['blueprint'],
  },
  {
    id: 'soft',
    name: 'Soft',
    hint: 'Pastel light, airy and friendly',
    brief: 'Soft pastel light, airy and friendly. Rounded, relaxed compositions with a little more atmosphere (sparkles are welcome).',
    templates: ['illustration'],
    backgrounds: ['pastel', 'aurora', 'sky', 'mist', 'paper'],
  },
]

export const STYLE_BY_ID: Record<CoverStyle['id'], CoverStyle> = Object.fromEntries(COVER_STYLES.map((s) => [s.id, s])) as Record<CoverStyle['id'], CoverStyle>
