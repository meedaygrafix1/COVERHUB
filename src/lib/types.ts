import type { ArtConfig } from '../cover/generative/types'

export type CategoryId =
  | 'tutorials'
  | 'api'
  | 'scraping'
  | 'python-js'
  | 'product'
  | 'data-automation'
  | 'comparisons'
  | 'engineering'

export type TemplateId =
  | 'split'
  | 'spotlight'
  | 'showcase'
  | 'bleed'
  | 'headline'
  | 'versus'
  | 'dark-panel'
  | 'editorial'
  | 'framed'
  | 'bento'
  | 'illustration'

export type BackgroundId =
  | 'pastel'
  | 'sky'
  | 'mist'
  | 'paper'
  | 'blueprint'
  | 'aurora'
  | 'cobalt'
  | 'midnight'
  | 'ink'
  | 'generative'

export type SizeId = '1200x630' | '1600x900'
export type Align = 'left' | 'center'
export type TitleColor = 'ink' | 'brand' | 'gradient'
export type CodeLang = 'python' | 'javascript'

/** How a topic scene arranges its library icons. */
export type SceneStyle = 'focus' | 'pair' | 'stack' | 'grid' | 'window' | 'hub' | 'merge' | 'inspect' | 'spotlight' | 'flow' | 'bento' | 'orbit' | 'versus' | 'compose'

/** Building blocks of a free-form composition (the `compose` layout). */
export type CompKind = 'card' | 'tile' | 'pill' | 'brand' | 'spark'

/**
 * One element on the 1120 × 560 composition artboard. Icons are referenced by
 * index into `SceneConfig.items`, so swapping an icon or renaming a caption
 * on the canvas updates every element that uses it.
 */
export interface CompElement {
  id: string
  kind: CompKind
  /** top-left corner and size, in artboard units */
  x: number
  y: number
  w: number
  h: number
  /** scene item drawn as the main icon; -1 for none */
  item: number
  /** a second scene item merged into the main icon as a corner badge; -1 for none */
  badge: number
  /** placeholder text lines on a card, 0-3 */
  lines: number
  /** accent colour, 0-3 (brand blue, mint, lavender, sky) */
  accent: number
  /** the focal element: highlighted glass and a halo */
  emphasis: boolean
  /** hidden from the cover (layers panel eye toggle) */
  hidden?: boolean
}

export interface CompLink {
  from: string
  to: string
  dashed: boolean
  /** a glowing node halfway along */
  node: boolean
}

export interface Composition {
  elements: CompElement[]
  links: CompLink[]
  /** true once a writer has moved something by hand (Regenerate asks before replacing it) */
  edited?: boolean
}

export interface SceneItem {
  /** Kubai icon name */
  icon: string
  /** short caption, shown by the flow, bento and versus layouts */
  label: string
}

/** The `scene` illustration: library icons picked for the title, hero first. */
export interface SceneConfig {
  style: SceneStyle
  items: SceneItem[]
  /** a free-form arrangement of the items, drawn by the `compose` layout */
  composition?: Composition
}

export interface CoverConfig {
  title: string
  subtitle: string
  eyebrow: string
  category: CategoryId
  template: TemplateId
  /** built-in illustration id, or `upload:<assetId>` */
  illustration: string
  background: BackgroundId
  align: Align
  titleColor: TitleColor
  /** multiplier on the template's base title size */
  titleScale: number
  titleWeight: 600 | 700
  uppercase: boolean
  showLogo: boolean
  showTitle: boolean
  showSubtitle: boolean
  showEyebrow: boolean
  decor: 0 | 1 | 2
  codeLang: CodeLang
  size: SizeId
  /** procedural art, used by the `generative` background and `abstract` illustration */
  art: ArtConfig
  /** icons and layout for the `scene` illustration */
  scene: SceneConfig
}

export interface Draft {
  id: string
  name: string
  config: CoverConfig
  updatedAt: number
}

export interface UploadedAsset {
  id: string
  name: string
  kind: 'svg' | 'png' | 'jpeg' | 'webp'
  dataUrl: string
  width: number
  height: number
  addedAt: number
}

export interface ReferenceImage {
  id: string
  name: string
  dataUrl: string
  note: string
  addedAt: number
}

export interface BrandSettings {
  primary: string
  highlight: string
  wordmark: string
  /** data URL of a custom logo mark; empty = built-in Spidra spider */
  customLogo: string
  defaultBackground: BackgroundId
  defaultSize: SizeId
}
