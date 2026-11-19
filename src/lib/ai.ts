import type { AiCover, AiRequest } from '../../api/_schema'
import type { CoverStyle } from '../../api/_styles'
import { TEMPLATE_BY_ID } from '../cover/templates'
import { ICON_NAME_SET } from '../library/catalog'
import { searchIcons } from '../library/match'
import { MAX_COMPOSE_ITEMS, sanitizeComposition, stackForDisplay } from './composition'
import { hash } from './random'
import type { Suggestion } from './suggest'
import type { CoverConfig, SceneConfig, SceneItem } from './types'
import { applySuggestion, randomArt, sceneFor } from './variations'

export type { AiCover }

/** Ask the server (and Claude) for a cover composition. Throws with a readable message. */
export async function fetchAiCover(title: string, subtitle: string, s: Suggestion, style: CoverStyle, signal?: AbortSignal): Promise<AiCover> {
  const body: AiRequest = {
    style: style.id,
    title,
    subtitle,
    candidates: s.topics.picks.map((p) => ({ label: p.label, concept: p.concept, role: p.role, icon: p.icon, alts: p.alts })),
  }
  let res: Response
  try {
    res = await fetch('/api/suggest', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new Error('Could not reach the AI service')
  }
  const data = (await res.json().catch(() => null)) as (AiCover & { error?: string }) | null
  if (!res.ok || !data) {
    if (data?.error) throw new Error(data.error)
    // no readable error: the server function itself failed (or isn't deployed)
    if (res.status === 404 || res.ok) throw new Error('The AI endpoint isn’t available here (deploy to Vercel or run npm run dev)')
    throw new Error(`The AI service crashed (${res.status}). Check the function logs on Vercel`)
  }
  return data
}

/** A real library icon for one of Claude's scene items, or null. */
function resolveIcon(it: AiCover['scene']['items'][number]): string | null {
  if (it.icon && ICON_NAME_SET.has(it.icon)) return it.icon
  for (const q of [it.iconQuery, it.label]) {
    const hit = q ? searchIcons(q, 1)[0] : undefined
    if (hit) return hit
  }
  return null
}

/**
 * Apply Claude's choices to a config, repairing anything that doesn't fit:
 * unknown icons are searched for or dropped, backgrounds are kept to the
 * template's set, and an empty scene falls back to the keyword match.
 */
export function applyAiCover(cfg: CoverConfig, ai: AiCover, s: Suggestion, style: CoverStyle): CoverConfig {
  const tpl = TEMPLATE_BY_ID[ai.template] ?? TEMPLATE_BY_ID.illustration
  const template = tpl.id

  // scene icons: real icons only; a duplicate reuses the first copy. `remap` tracks where each of
  // Claude's item indexes ended up, so the composition keeps pointing at the right icons.
  const compose = ai.scene.style === 'compose'
  const items: SceneItem[] = []
  const remap = new Map<number, number>()
  ai.scene.items.slice(0, compose ? MAX_COMPOSE_ITEMS : 5).forEach((it, i) => {
    const icon = resolveIcon(it)
    if (!icon) return
    const at = items.findIndex((x) => x.icon === icon)
    if (at >= 0) {
      if (!items[at].label && it.label) items[at] = { ...items[at], label: it.label.slice(0, 32) }
      remap.set(i, at)
    } else {
      remap.set(i, items.length)
      items.push({ icon, label: it.label.slice(0, 32) })
    }
  })
  const re = (i: number) => remap.get(Math.round(i)) ?? -1
  const composition = compose
    ? sanitizeComposition({ ...ai.scene.composition, elements: ai.scene.composition.elements.map((e) => ({ ...e, item: re(e.item), badge: re(e.badge) })) }, items.length)
    : undefined
  const scene: SceneConfig = !items.length
    ? sceneFor(s)
    : composition
      ? { style: 'compose', items, composition: stackForDisplay(composition) }
      : // compose without a usable composition: fall back to the house layout
        { style: compose ? 'merge' : ai.scene.style, items: compose ? items.slice(0, 5) : items }

  let illustration: string = ai.illustration
  if (template === 'illustration') illustration = 'scene'
  if (template === 'versus' && illustration !== 'scene') illustration = 'versus'

  const background = tpl.backgrounds.includes(ai.background) ? ai.background : tpl.backgrounds[0]
  const needsArt = illustration === 'abstract'

  return fitStyle(
    {
      ...cfg,
      category: ai.category,
      template,
      illustration,
      background,
      scene,
      eyebrow: template === 'illustration' ? cfg.eyebrow : ai.eyebrow.slice(0, 32),
      titleColor: ai.titleColor,
      showLogo: ai.showLogo,
      uppercase: template === 'headline' ? cfg.uppercase : false,
      art: needsArt ? randomArt(cfg.art, hash(cfg.title), ai.category) : cfg.art,
    },
    style,
  )
}

/**
 * Keep a cover inside the writer's chosen style: an allowed template, and a
 * background that both the style and the template accept.
 */
export function fitStyle(cfg: CoverConfig, style: CoverStyle): CoverConfig {
  const template = style.templates.includes(cfg.template) ? cfg.template : style.templates[0]
  const tpl = TEMPLATE_BY_ID[template]
  const fits = style.backgrounds.filter((b) => b === 'generative' || tpl.backgrounds.includes(b))
  const background = fits.includes(cfg.background) ? cfg.background : (fits[0] ?? tpl.backgrounds[0])
  let illustration = cfg.illustration
  if (template === 'illustration' && !illustration.startsWith('upload:')) illustration = 'scene'
  if (template === 'versus' && illustration !== 'scene') illustration = 'versus'
  const art = background === 'generative' && cfg.background !== 'generative' ? randomArt(cfg.art, hash(cfg.title), cfg.category) : cfg.art
  return { ...cfg, template, background, illustration, art, uppercase: template === 'headline' ? cfg.uppercase : false }
}

/** Without the AI (offline, no key, an error): the keyword match, kept inside the style. */
export function quickCover(cfg: CoverConfig, s: Suggestion, style: CoverStyle): CoverConfig {
  return fitStyle({ ...applySuggestion(cfg, s), showLogo: false }, style)
}
