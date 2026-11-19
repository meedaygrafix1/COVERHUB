import { TEMPLATE_BY_ID } from '../cover/templates'
import { CATEGORY_BY_ID } from '../data/categories'
import { hash, pick, rng } from './random'
import type { Suggestion } from './suggest'
import type { CategoryId, CoverConfig, SceneConfig, SceneStyle, TemplateId } from './types'
import { ART_PATTERNS, type ArtConfig, type ArtPattern } from '../cover/generative/types'

/** Patterns that suit each kind of article (picked most of the time, never exclusively). */
const CATEGORY_PATTERNS: Record<CategoryId, ArtPattern[]> = {
  tutorials: ['flow', 'halftone', 'truchet'],
  api: ['constellation', 'rings', 'contours'],
  scraping: ['flow', 'halftone', 'constellation'],
  'python-js': ['truchet', 'isometric', 'flow'],
  product: ['rays', 'mesh', 'blobs'],
  'data-automation': ['halftone', 'contours', 'isometric'],
  comparisons: ['bauhaus', 'ridges', 'mesh'],
  engineering: ['isometric', 'contours', 'ridges'],
}

/** A fresh, on-brand art configuration. Deterministic for a seed. */
export function randomArt(base: ArtConfig, seed: number, category: CategoryId): ArtConfig {
  const r = rng(hash(`art|${seed}|${category}`))
  const pattern = r() < 0.7 ? pick(r, CATEGORY_PATTERNS[category]) : pick(r, ART_PATTERNS.map((p) => p.id))
  const rotates = ART_PATTERNS.find((p) => p.id === pattern)?.rotates
  return {
    ...base,
    pattern,
    seed: Math.floor(r() * 100000),
    density: 0.35 + r() * 0.45,
    scale: 0.3 + r() * 0.45,
    rotation: rotates ? pick(r, [0, 0, 15, 30, 45, 90, 135] as const) : 0,
    intensity: 0.45 + r() * 0.4,
    softness: r() < 0.2 ? 0.25 + r() * 0.25 : 0,
    palette: pick(r, ['brand', 'brand', 'ocean', 'aurora'] as const),
    tone: pick(r, ['light', 'light', 'dark', 'brand'] as const),
    grain: r() < 0.3,
  }
}

export const WIDE = new Set(['scrape-flow', 'json-fanout', 'versus'])

/** True when the title matched real topics in the icon library (not just framing words). */
export const hasTopics = (s: Suggestion) => s.topics.picks.some((p) => p.role !== 'meta')

/** The scene for one layout, straight from the title match. */
export function sceneFor(s: Suggestion, style: SceneStyle = s.topics.styles[0]): SceneConfig {
  return { style, items: s.topics.scenes[style] }
}

/** Turn a keyword suggestion into concrete config choices. */
export function applySuggestion(cfg: CoverConfig, s: Suggestion): CoverConfig {
  const cat = CATEGORY_BY_ID[s.category]
  let template: TemplateId = s.templates.find((t) => cat.templates.includes(t)) ?? cat.templates[0]
  if (template === 'versus' && s.category !== 'comparisons') template = cat.templates[0]
  const tpl = TEMPLATE_BY_ID[template]
  // illustration-first: a title with real topics gets the full-bleed illustration on pastel
  const topical = hasTopics(s)
  if (topical) template = 'illustration'
  const illustration =
    template === 'versus'
      ? 'versus'
      : topical
        ? 'scene'
        : (s.illustrations.find((i) => i !== 'versus' && (tpl.slot === 'wide' || template === 'split' || !WIDE.has(i))) ?? cat.illustrations[0])
  const background = topical
    ? 'blueprint'
    : tpl.backgrounds.includes(cfg.background)
      ? cfg.background
      : (cat.backgrounds.find((b) => tpl.backgrounds.includes(b)) ?? tpl.backgrounds[0])
  return {
    ...cfg,
    category: s.category,
    template,
    illustration,
    background,
    codeLang: s.lang ?? cfg.codeLang,
    uppercase: template === 'headline' ? cfg.uppercase : false,
    scene: topical ? sceneFor(s) : cfg.scene,
  }
}
