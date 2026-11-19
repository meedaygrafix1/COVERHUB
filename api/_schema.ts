import { z } from 'zod'
import type { BackgroundId, CategoryId, CompKind, SceneStyle, TemplateId, TitleColor } from '../src/lib/types'

/*
 * The shape Claude must answer in. Files in api/ that start with "_" are not
 * routes on Vercel, so this is shared by the function and (as a type) by the
 * browser. The `satisfies` checks fail the build if these lists drift from
 * src/lib/types.ts.
 */

export const CATEGORIES = ['tutorials', 'api', 'scraping', 'python-js', 'product', 'data-automation', 'comparisons', 'engineering'] as const satisfies readonly CategoryId[]

export const TEMPLATES = ['illustration', 'split', 'spotlight', 'showcase', 'bleed', 'headline', 'versus', 'dark-panel', 'editorial', 'framed', 'bento'] as const satisfies readonly TemplateId[]

export const BACKGROUNDS = ['blueprint', 'pastel', 'sky', 'mist', 'paper', 'aurora'] as const satisfies readonly BackgroundId[]

export const SCENE_STYLES = ['compose', 'merge', 'inspect', 'hub', 'focus', 'pair', 'stack', 'grid', 'window', 'spotlight', 'flow', 'bento', 'orbit', 'versus'] as const satisfies readonly SceneStyle[]

export const COMP_KINDS = ['card', 'tile', 'pill', 'brand', 'spark'] as const satisfies readonly CompKind[]

export const ILLUSTRATIONS = [
  'scene',
  'abstract',
  'scrape-flow',
  'json-fanout',
  'versus',
  'browser-extract',
  'api-hub',
  'workflow',
  'queue',
  'code-editor',
  'terminal',
  'agent-chat',
  'document',
  'database',
  'dashboard',
  'network',
  'search',
  'badge',
  'release',
  'geometric',
] as const

export const TITLE_COLORS = ['ink', 'brand', 'gradient'] as const satisfies readonly TitleColor[]

export const AiCoverSchema = z.object({
  category: z.enum(CATEGORIES),
  template: z.enum(TEMPLATES),
  background: z.enum(BACKGROUNDS),
  illustration: z.enum(ILLUSTRATIONS),
  scene: z.object({
    style: z.enum(SCENE_STYLES),
    items: z.array(
      z.object({
        /** short caption, 1-3 words */
        label: z.string(),
        /** an icon name from the candidates, or "" when none fits */
        icon: z.string(),
        /** 1-2 plain words to search the icon library with when `icon` is "" or unknown */
        iconQuery: z.string(),
      }),
    ),
    /** the custom layout, used when style is "compose" */
    composition: z.object({
      elements: z.array(
        z.object({
          id: z.string(),
          kind: z.enum(COMP_KINDS),
          x: z.number(),
          y: z.number(),
          w: z.number(),
          h: z.number(),
          item: z.number(),
          badge: z.number(),
          lines: z.number(),
          accent: z.number(),
          emphasis: z.boolean(),
        }),
      ),
      links: z.array(z.object({ from: z.string(), to: z.string(), dashed: z.boolean(), node: z.boolean() })),
    }),
  }),
  eyebrow: z.string(),
  titleColor: z.enum(TITLE_COLORS),
  showLogo: z.boolean(),
  /** one sentence, shown to the writer */
  reason: z.string(),
})

export type AiCover = z.infer<typeof AiCoverSchema>

/** What the browser sends. */
export interface AiRequest {
  /** the style the writer picked (see _styles.ts) */
  style: string
  title: string
  subtitle: string
  /** icons the local matcher already found, best first */
  candidates: { label: string; concept: string; role: string; icon: string; alts: string[] }[]
}
