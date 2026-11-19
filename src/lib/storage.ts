import { DEFAULT_BRAND } from '../cover/palette'
import { DEFAULT_ART } from '../cover/generative/types'
import type { BrandSettings, CoverConfig, Draft, ReferenceImage, SceneConfig, TemplateId, UploadedAsset } from './types'

const K = {
  current: 'scs.current.v1',
  drafts: 'scs.drafts.v1',
  recent: 'scs.recentTemplates.v1',
  brand: 'scs.brand.v1',
  assets: 'scs.assets.v1',
  refs: 'scs.references.v1',
  prefs: 'scs.prefs.v1',
}

export interface Prefs {
  autoMatch: boolean
  scale: 1 | 2
  /** the first-run title prompt has been answered or skipped */
  onboarded: boolean
  /** the cover style picked last on the create screen */
  style?: string
}

export const DEFAULT_SCENE: SceneConfig = {
  style: 'merge',
  items: [
    { icon: 'globe-check', label: 'Websites' },
    { icon: 'file-text', label: 'Product pages' },
    { icon: 'scan-text', label: 'Listings' },
    { icon: 'braces', label: 'JSON' },
  ],
}

export const DEFAULT_CONFIG: CoverConfig = {
  title: 'How to extract *consistent JSON* from different websites',
  subtitle: 'One schema, any page layout — a practical guide with Spidra',
  eyebrow: '',
  category: 'data-automation',
  template: 'illustration',
  illustration: 'scene',
  background: 'blueprint',
  align: 'center',
  titleColor: 'ink',
  titleScale: 1,
  titleWeight: 600,
  uppercase: false,
  showLogo: true,
  showTitle: true,
  showSubtitle: true,
  showEyebrow: true,
  decor: 1,
  codeLang: 'python',
  size: '1200x630',
  art: DEFAULT_ART,
  scene: DEFAULT_SCENE,
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

/** Returns false when storage is unavailable or full. */
function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/** Fill any missing keys (e.g. from older saved drafts or pasted configs). */
export function normalizeConfig(c: Partial<CoverConfig> | null | undefined): CoverConfig {
  return { ...DEFAULT_CONFIG, ...(c ?? {}), art: { ...DEFAULT_ART, ...(c?.art ?? {}) }, scene: c?.scene ?? DEFAULT_SCENE }
}

export const store = {
  loadCurrent: () => normalizeConfig(read<Partial<CoverConfig> | null>(K.current, null)),
  saveCurrent: (c: CoverConfig) => write(K.current, c),

  loadDrafts: () => read<Draft[]>(K.drafts, []).map((d) => ({ ...d, config: normalizeConfig(d.config) })),
  saveDrafts: (d: Draft[]) => write(K.drafts, d),

  loadRecent: () => read<TemplateId[]>(K.recent, []),
  saveRecent: (r: TemplateId[]) => write(K.recent, r),

  loadBrand: () => ({ ...DEFAULT_BRAND, ...read<Partial<BrandSettings>>(K.brand, {}) }),
  saveBrand: (b: BrandSettings) => write(K.brand, b),

  loadAssets: () => read<UploadedAsset[]>(K.assets, []),
  saveAssets: (a: UploadedAsset[]) => write(K.assets, a),

  loadRefs: () => read<ReferenceImage[]>(K.refs, []),
  saveRefs: (r: ReferenceImage[]) => write(K.refs, r),

  loadPrefs: () => ({ autoMatch: true, scale: 2 as 1 | 2, onboarded: false, ...read<Partial<Prefs>>(K.prefs, {}) }),
  savePrefs: (p: Prefs) => write(K.prefs, p),
}

export function slugify(s: string): string {
  return (
    s
      .replace(/\*/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'spidra-cover'
  )
}
