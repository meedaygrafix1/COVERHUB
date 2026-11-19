import { mix, shade, tint } from '../lib/color'
import { FONT_MONO, FONT_SANS } from '../lib/fonts'
import type { BackgroundId, BrandSettings } from '../lib/types'

export interface Palette {
  mode: 'light' | 'dark'
  cardsMode: 'light' | 'dark'
  primary: string
  primaryDeep: string
  primaryBright: string
  highlight: string
  ink: string
  muted: string
  faint: string
  card: string
  cardAlt: string
  cardStroke: string
  cardStrokeStrong: string
  bar: string
  barMid: string
  line: string
  dot: string
  code: {
    bg: string
    bar: string
    stroke: string
    text: string
    kw: string
    str: string
    fn: string
    comment: string
    num: string
    gutter: string
  }
  ids: {
    shadow: string
    shadowLg: string
    glow: string
    logo: string
    title: string
    hub: string
    fade: string
  }
  sans: string
  mono: string
}

export const DEFAULT_BRAND: BrandSettings = {
  primary: '#2563EB',
  highlight: '#007AFF',
  wordmark: 'Spidra',
  customLogo: '',
  defaultBackground: 'blueprint',
  defaultSize: '1200x630',
}

const DARK_BGS: BackgroundId[] = ['midnight', 'ink', 'cobalt']

export function buildPalette(brand: BrandSettings, bg: BackgroundId, uid: string): Palette {
  const P = brand.primary
  const dark = DARK_BGS.includes(bg)
  // cobalt keeps white cards on a saturated brand field
  const cardsDark = bg === 'midnight' || bg === 'ink'
  const id = (k: string) => `${uid}-${k}`

  const code = {
    bg: '#0B1220',
    bar: '#111A2E',
    stroke: '#1E2A44',
    text: '#D6E2FF',
    kw: '#7CB2FF',
    str: '#8EE3B5',
    fn: '#FFD27A',
    comment: '#5D6B8A',
    num: '#F7A6C9',
    gutter: '#3A4866',
  }

  const base = {
    primary: P,
    primaryDeep: shade(P, 0.28),
    primaryBright: mix(P, '#4F9BFF', 0.45),
    highlight: brand.highlight,
    code,
    ids: {
      shadow: id('sh'),
      shadowLg: id('shl'),
      glow: id('glow'),
      logo: id('logo'),
      title: id('title'),
      hub: id('hub'),
      fade: id('fade'),
    },
    sans: FONT_SANS,
    mono: FONT_MONO,
  }

  const textLight = {
    mode: 'light' as const,
    ink: '#0A1222',
    muted: '#4A5871',
    faint: '#8592A8',
  }
  const textDark = {
    mode: 'dark' as const,
    ink: '#FFFFFF',
    muted: bg === 'cobalt' ? tint(P, 0.78) : '#A8B6D2',
    faint: bg === 'cobalt' ? tint(P, 0.55) : '#6A7A9C',
  }

  const cardsLight = {
    cardsMode: 'light' as const,
    card: '#FFFFFF',
    cardAlt: tint(P, 0.95),
    cardStroke: tint(P, 0.84),
    cardStrokeStrong: tint(P, 0.55),
    bar: tint(P, 0.8),
    barMid: tint(P, 0.58),
    line: P,
    dot: tint(P, 0.55),
  }
  const cardsDarkSet = {
    cardsMode: 'dark' as const,
    card: '#0F1B33',
    cardAlt: '#13223F',
    cardStroke: '#22355A',
    cardStrokeStrong: mix(P, '#22355A', 0.35),
    bar: '#22375E',
    barMid: '#34548C',
    line: mix(P, '#7FB0FF', 0.4),
    dot: mix(P, '#7FB0FF', 0.3),
  }

  return {
    ...base,
    ...(dark ? textDark : textLight),
    ...(cardsDark ? cardsDarkSet : cardsLight),
    ...(bg === 'cobalt' ? { line: '#FFFFFF', dot: tint(P, 0.6) } : {}),
  }
}
