import { BG_BY_ID } from '../cover/backgrounds'
import { ILLUS_BY_ID } from '../cover/illustrations'
import { TEMPLATE_BY_ID } from '../cover/templates'
import { CATEGORY_BY_ID } from '../data/categories'
import { ART_PATTERNS, DEFAULT_ART, type ArtConfig } from '../cover/generative/types'
import { DEFAULT_SCENE, normalizeConfig } from './storage'
import { ICON_NAME_SET } from '../library/catalog'
import { MAX_COMPOSE_ITEMS, sanitizeComposition } from './composition'
import type { CoverConfig, SceneConfig, UploadedAsset } from './types'

/** Validate an untrusted config (pasted JSON, share link) field by field. */
export function sanitizeConfig(raw: unknown, assets: UploadedAsset[]): CoverConfig {
  const c = normalizeConfig(typeof raw === 'object' && raw ? (raw as Partial<CoverConfig>) : {})
  const d = normalizeConfig({})
  const str = (v: unknown, max: number, fb: string) => (typeof v === 'string' ? v.slice(0, max) : fb)
  const bool = (v: unknown, fb: boolean) => (typeof v === 'boolean' ? v : fb)
  const oneOf = <T,>(v: unknown, list: readonly T[], fb: T): T => (list.includes(v as T) ? (v as T) : fb)

  const illusOk = typeof c.illustration === 'string' && (c.illustration === 'none' || !!ILLUS_BY_ID[c.illustration] || assets.some((a) => `upload:${a.id}` === c.illustration))

  return {
    title: str(c.title, 200, d.title),
    subtitle: str(c.subtitle, 200, ''),
    eyebrow: str(c.eyebrow, 28, ''),
    category: CATEGORY_BY_ID[c.category] ? c.category : d.category,
    template: TEMPLATE_BY_ID[c.template] ? c.template : d.template,
    illustration: illusOk ? c.illustration : d.illustration,
    background: BG_BY_ID[c.background] ? c.background : d.background,
    align: oneOf(c.align, ['left', 'center'] as const, d.align),
    titleColor: oneOf(c.titleColor, ['ink', 'brand', 'gradient'] as const, d.titleColor),
    titleScale: typeof c.titleScale === 'number' ? Math.min(1.25, Math.max(0.75, c.titleScale)) : 1,
    titleWeight: oneOf(c.titleWeight, [600, 700] as const, 600),
    uppercase: bool(c.uppercase, false),
    showLogo: bool(c.showLogo, true),
    showTitle: bool(c.showTitle, true),
    showSubtitle: bool(c.showSubtitle, true),
    showEyebrow: bool(c.showEyebrow, true),
    decor: oneOf(c.decor, [0, 1, 2] as const, 1),
    codeLang: oneOf(c.codeLang, ['python', 'javascript'] as const, 'python'),
    size: oneOf(c.size, ['1200x630', '1600x900'] as const, '1200x630'),
    art: sanitizeArt(c.art),
    scene: sanitizeScene(c.scene),
  }
}

function sanitizeScene(raw: unknown): SceneConfig {
  if (typeof raw !== 'object' || !raw) return DEFAULT_SCENE
  const r = raw as Partial<SceneConfig>
  const style = (['focus', 'pair', 'stack', 'grid', 'window', 'hub', 'merge', 'inspect', 'spotlight', 'flow', 'bento', 'orbit', 'versus', 'compose'] as const).find((s) => s === r.style) ?? 'spotlight'
  // dropping an unknown icon would shift the indexes a composition points at, so swap it for a placeholder there
  const list = (Array.isArray(r.items) ? r.items : []).filter((i): i is SceneConfig['items'][number] => !!i && typeof i === 'object' && typeof i.icon === 'string')
  const compose = r.composition !== undefined
  const items = (compose ? list.map((i) => (ICON_NAME_SET.has(i.icon) ? i : { ...i, icon: 'sparkles' })) : list.filter((i) => ICON_NAME_SET.has(i.icon)))
    .slice(0, compose ? MAX_COMPOSE_ITEMS : 4)
    .map((i) => ({ icon: i.icon, label: typeof i.label === 'string' ? i.label.slice(0, 32) : '' }))
  if (!items.length && !compose) return DEFAULT_SCENE
  const composition = compose ? sanitizeComposition(r.composition, items.length, true) : undefined
  return composition ? { style, items, composition } : { style, items }
}

function sanitizeArt(raw: unknown): ArtConfig {
  const a = { ...DEFAULT_ART, ...(typeof raw === 'object' && raw ? (raw as Partial<ArtConfig>) : {}) }
  const unit = (v: unknown, fb: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fb)
  const oneOf = <T,>(v: unknown, list: readonly T[], fb: T): T => (list.includes(v as T) ? (v as T) : fb)
  return {
    pattern: oneOf(a.pattern, ART_PATTERNS.map((p) => p.id), DEFAULT_ART.pattern),
    seed: typeof a.seed === 'number' && Number.isFinite(a.seed) ? Math.abs(Math.floor(a.seed)) % 1_000_000 : DEFAULT_ART.seed,
    density: unit(a.density, DEFAULT_ART.density),
    scale: unit(a.scale, DEFAULT_ART.scale),
    rotation: typeof a.rotation === 'number' && Number.isFinite(a.rotation) ? ((Math.round(a.rotation) % 360) + 360) % 360 : 0,
    intensity: unit(a.intensity, DEFAULT_ART.intensity),
    softness: unit(a.softness, DEFAULT_ART.softness),
    palette: oneOf(a.palette, ['brand', 'ocean', 'aurora', 'mono'] as const, 'brand'),
    tone: oneOf(a.tone, ['light', 'dark', 'brand'] as const, 'light'),
    grain: typeof a.grain === 'boolean' ? a.grain : false,
    fade: typeof a.fade === 'boolean' ? a.fade : true,
    frame: oneOf(a.frame, ['card', 'circle', 'soft'] as const, 'card'),
  }
}

function b64urlEncode(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(s: string): string {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  return new TextDecoder().decode(Uint8Array.from(b, (ch) => ch.charCodeAt(0)))
}

/** Shareable link that reproduces a design (uploads are local-only and excluded). */
export function shareLink(c: CoverConfig): string {
  const portable = c.illustration.startsWith('upload:') ? { ...c, illustration: 'geometric' } : c
  return `${location.origin}${location.pathname}#c=${b64urlEncode(JSON.stringify(portable))}`
}

export function readShareHash(): unknown | null {
  const m = location.hash.match(/[#&]c=([A-Za-z0-9_-]+)/)
  if (!m) return null
  try {
    return JSON.parse(b64urlDecode(m[1]))
  } catch {
    return null
  }
}
