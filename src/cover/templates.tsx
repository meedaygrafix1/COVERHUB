import type { ReactNode } from 'react'
import { tint } from '../lib/color'
import { MONO_FAMILY, SANS_FAMILY } from '../lib/fonts'
import { fitText, measure, type FitResult } from '../lib/text'
import type { BackgroundId, BrandSettings, CategoryId, CoverConfig, TemplateId } from '../lib/types'
import { CATEGORY_BY_ID } from '../data/categories'
import type { Palette } from './palette'
import { Logo, SpiderMark, TextBlock } from './primitives'
import type { TextZone } from './generative'

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface TextReport {
  titleTruncated: boolean
  titleShrunk: boolean
  subtitleTruncated: boolean
}

export type ArtAlign = 'xMidYMid' | 'xMinYMid' | 'xMaxYMid' | 'xMidYMin' | 'xMinYMin' | 'xMidYMax' | 'xMaxYMax'

export interface LayoutCtx {
  cfg: CoverConfig
  W: number
  H: number
  p: Palette
  brand: BrandSettings
  uid: string
  report: TextReport
  art: (box: Box, opts?: { align?: ArtAlign; clipR?: number }) => ReactNode
}

export interface TemplateDef {
  id: TemplateId
  name: string
  description: string
  categories: CategoryId[]
  backgrounds: BackgroundId[]
  supportsAlign: boolean
  /** illustration slot shape — used to rank illustrations in variations */
  slot: 'wide' | 'box'
  /** where the text sits, so generative backgrounds stay calm there */
  textZone: TextZone
  render: (c: LayoutCtx) => ReactNode
}

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

/** A saturated brand-blue field (Cobalt, or abstract art in the Brand tone): text and logo go white. */
export const isBrandField = (cfg: CoverConfig) => cfg.background === 'cobalt' || (cfg.background === 'generative' && cfg.art.tone === 'brand')

interface TextColors {
  ink: string
  muted: string
  accent: string
  hl: string
  title: string
  chipFill: string
  chipStroke: string
}

function colors(c: LayoutCtx, onCard = false): TextColors {
  const { p, cfg } = c
  const lightOnCard = onCard && p.cardsMode === 'light' && p.mode === 'dark'
  const dark = lightOnCard ? false : onCard ? p.cardsMode === 'dark' : p.mode === 'dark'
  const cobalt = isBrandField(cfg) && !onCard
  const ink = dark ? '#FFFFFF' : '#0A1222'
  const muted = dark ? (cobalt ? tint(p.primary, 0.78) : '#A8B6D2') : '#4A5871'
  const accent = dark ? (cobalt ? '#FFFFFF' : tint(p.primary, 0.5)) : p.primary
  const hl = dark ? (cobalt ? '#BFE3FF' : '#7CC4FF') : p.highlight
  let title = ink
  if (cfg.titleColor === 'brand') title = dark ? (cobalt ? '#FFFFFF' : tint(p.primary, 0.6)) : p.primaryDeep
  if (cfg.titleColor === 'gradient') title = lightOnCard ? p.primaryDeep : `url(#${p.ids.title})`
  return {
    ink,
    muted,
    accent,
    hl,
    title,
    chipFill: dark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
    chipStroke: dark ? 'rgba(255,255,255,0.16)' : p.cardStroke,
  }
}

function fitTitle(c: LayoutCtx, maxWidth: number, maxLines: number, maxSize: number, minSize = 30): FitResult | null {
  const { cfg } = c
  if (!cfg.showTitle || !cfg.title.trim()) return null
  const size = Math.round(maxSize * cfg.titleScale)
  const f = fitText({
    text: cfg.title,
    maxWidth,
    maxLines,
    maxSize: size,
    minSize: Math.min(minSize, size),
    weight: cfg.titleWeight,
    tracking: cfg.uppercase ? -0.01 : -0.028,
    lineHeight: cfg.uppercase ? 1.02 : 1.08,
    uppercase: cfg.uppercase,
  })
  c.report.titleTruncated ||= f.truncated
  c.report.titleShrunk ||= f.shrunk
  return f
}

function fitSub(c: LayoutCtx, maxWidth: number, maxLines: number, size: number, weight = 400): FitResult | null {
  const { cfg } = c
  if (!cfg.showSubtitle || !cfg.subtitle.trim()) return null
  const f = fitText({
    text: cfg.subtitle,
    maxWidth,
    maxLines,
    maxSize: size,
    minSize: Math.max(15, size - 6),
    weight,
    tracking: -0.01,
    lineHeight: 1.38,
  })
  c.report.subtitleTruncated ||= f.truncated
  return f
}

/** Default label for a category; the Python & JS category follows the chosen language. */
export function categoryLabel(cfg: CoverConfig): string {
  if (cfg.category === 'python-js') return cfg.codeLang === 'javascript' ? 'JavaScript' : 'Python'
  return CATEGORY_BY_ID[cfg.category]?.eyebrow ?? ''
}

function eyebrowText(c: LayoutCtx): string {
  if (!c.cfg.showEyebrow) return ''
  return (c.cfg.eyebrow.trim() || categoryLabel(c.cfg)).toUpperCase()
}

type EyebrowStyle = 'chip' | 'plain' | 'mono' | 'big'

function eyebrow(c: LayoutCtx, style: EyebrowStyle, onCard = false) {
  const text = eyebrowText(c)
  if (!text) return { h: 0, render: () => null as ReactNode }
  const col = colors(c, onCard)
  const size = style === 'big' ? 22 : style === 'mono' ? 14 : 14
  const family = style === 'mono' ? MONO_FAMILY : SANS_FAMILY
  const track = style === 'mono' ? 0.06 : 0.09
  const tw = measure(text, size, 600, family, track)
  const fam = style === 'mono' ? c.p.mono : c.p.sans
  if (style === 'chip') {
    const h = 34
    const w = tw + 46
    return {
      h,
      render: (x: number, y: number, anchor: 'start' | 'middle') => {
        const left = anchor === 'middle' ? x - w / 2 : x
        return (
          <g>
            <rect x={left} y={y} width={w} height={h} rx={h / 2} fill={col.chipFill} stroke={col.chipStroke} strokeWidth={1.4} />
            <circle cx={left + 18} cy={y + h / 2} r={4} fill={col.accent} />
            <text x={left + 30} y={y + h / 2 + 0.5} dominantBaseline="central" fontFamily={fam} fontWeight={600} fontSize={size} letterSpacing={track * size} fill={col.accent}>
              {text}
            </text>
          </g>
        )
      },
    }
  }
  const h = size
  return {
    h,
    render: (x: number, y: number, anchor: 'start' | 'middle') => (
      <text
        x={x}
        y={y + size * 0.82}
        textAnchor={anchor}
        fontFamily={fam}
        fontWeight={style === 'mono' ? 500 : 600}
        fontSize={size}
        letterSpacing={track * size}
        fill={style === 'mono' ? col.muted : col.accent}
      >
        {style === 'mono' ? `// ${text}` : text}
      </text>
    ),
  }
}

interface GroupOpts {
  width: number
  titleSize: number
  titleLines: number
  titleMin?: number
  subSize?: number
  subLines?: number
  eyebrowStyle?: EyebrowStyle
  gapEyebrow?: number
  gapSub?: number
  onCard?: boolean
  subWeight?: number
  subColor?: 'muted' | 'accent'
}

/** Measure an eyebrow + title + subtitle stack; render it later at a chosen top. */
function textGroup(c: LayoutCtx, o: GroupOpts) {
  const eb = eyebrow(c, o.eyebrowStyle ?? 'chip', o.onCard)
  const tf = fitTitle(c, o.width, o.titleLines, o.titleSize, o.titleMin)
  const sf = fitSub(c, o.width, o.subLines ?? 2, o.subSize ?? 22, o.subWeight)
  const gE = eb.h && tf ? (o.gapEyebrow ?? 24) : 0
  const gS = sf && (tf || eb.h) ? (o.gapSub ?? 20) : 0
  const h = eb.h + gE + (tf?.height ?? 0) + gS + (sf?.height ?? 0)
  const col = colors(c, o.onCard)
  return {
    h,
    title: tf,
    render: (x: number, top: number, anchor: 'start' | 'middle') => {
      let y = top
      const nodes: ReactNode[] = []
      if (eb.h) {
        nodes.push(<g key="eb">{eb.render(x, y, anchor)}</g>)
        y += eb.h + gE
      }
      if (tf) {
        nodes.push(<TextBlock key="t" fit={tf} x={x} y={y} anchor={anchor} fill={col.title} hlFill={col.hl} family={c.p.sans} />)
        y += tf.height + gS
      }
      if (sf) {
        nodes.push(
          <TextBlock key="s" fit={sf} x={x} y={y} anchor={anchor} fill={o.subColor === 'accent' ? col.accent : col.muted} hlFill={col.accent} family={c.p.sans} />,
        )
      }
      return <g>{nodes}</g>
    },
  }
}

function logo(c: LayoutCtx, x: number, y: number, size = 34, anchor: 'start' | 'middle' = 'start', onCard = false) {
  if (!c.cfg.showLogo) return null
  const col = colors(c, onCard)
  return (
    <Logo
      x={x}
      y={y}
      size={size}
      p={{ ...c.p, ink: col.ink }}
      wordmark={c.brand.wordmark}
      customLogo={c.brand.customLogo}
      anchor={anchor}
      inverted={isBrandField(c.cfg) && !onCard}
    />
  )
}

const PAD = 72

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'illustration',
    textZone: 'none',
    name: 'Illustration',
    description: 'Full-bleed illustration, no headline: the title lives on the page',
    categories: ['tutorials', 'api', 'scraping', 'python-js', 'product', 'data-automation', 'comparisons', 'engineering'],
    backgrounds: ['blueprint', 'pastel', 'sky', 'mist', 'aurora', 'paper'],
    supportsAlign: false,
    slot: 'wide',
    render: (c) => <g>{c.art({ x: 24, y: 20, w: c.W - 48, h: c.H - 40 }, { align: 'xMidYMid' })}</g>,
  },
  {
    id: 'split',
    textZone: 'left',
    name: 'Split',
    description: 'Headline left, illustration right',
    categories: ['tutorials', 'python-js', 'engineering', 'scraping'],
    backgrounds: ['blueprint', 'sky', 'mist', 'paper', 'aurora', 'midnight'],
    supportsAlign: false,
    slot: 'box',
    render: (c) => {
      const { H } = c
      const g = textGroup(c, { width: 520, titleSize: 58, titleLines: 4, subSize: 22, subLines: 3 })
      const top = Math.max(PAD + 64, (H - g.h) / 2 + 22)
      return (
        <g>
          {logo(c, PAD, 58)}
          {g.render(PAD, top, 'start')}
          {c.art({ x: 630, y: 70, w: 530, h: H - 130 }, { align: 'xMidYMid' })}
        </g>
      )
    },
  },
  {
    id: 'spotlight',
    textZone: 'top',
    name: 'Spotlight',
    description: 'Centered headline, illustration rising from below',
    categories: ['api', 'product', 'engineering'],
    backgrounds: ['blueprint', 'sky', 'cobalt', 'midnight', 'aurora'],
    supportsAlign: true,
    slot: 'wide',
    render: (c) => {
      const { W, H, cfg } = c
      const center = cfg.align === 'center'
      const g = textGroup(c, { width: center ? 920 : 760, titleSize: 54, titleLines: 2, subSize: 21, subLines: 1, gapEyebrow: 20, gapSub: 14 })
      const top = cfg.showLogo ? 112 : 64
      const artY = top + g.h + 36
      return (
        <g>
          {logo(c, center ? W / 2 : PAD, 44, 34, center ? 'middle' : 'start')}
          {g.render(center ? W / 2 : PAD, top, center ? 'middle' : 'start')}
          {c.art(
            center ? { x: 150, y: artY, w: 900, h: Math.max(260, H - artY + 90) } : { x: 300, y: artY, w: 900, h: Math.max(260, H - artY + 90) },
            { align: 'xMidYMin' },
          )}
        </g>
      )
    },
  },
  {
    id: 'showcase',
    textZone: 'bottom',
    name: 'Showcase',
    description: 'Illustration-first, like the Spidra blog — title optional',
    categories: ['scraping', 'data-automation', 'tutorials'],
    backgrounds: ['blueprint', 'sky', 'aurora', 'mist', 'midnight'],
    supportsAlign: true,
    slot: 'wide',
    render: (c) => {
      const { W, H, cfg } = c
      const center = cfg.align === 'center'
      const tf = fitTitle(c, center ? 900 : 760, 2, 40, 26)
      const col = colors(c)
      const titleH = tf ? tf.height + 48 : 0
      const artTop = cfg.showLogo ? 96 : 50
      const artBox = { x: 60, y: artTop, w: W - 120, h: H - artTop - titleH - (tf ? 18 : 54) }
      return (
        <g>
          {logo(c, W / 2, 30, 40, 'middle')}
          {c.art(artBox, { align: 'xMidYMid' })}
          {tf && (
            <TextBlock fit={tf} x={center ? W / 2 : PAD} y={H - tf.height - 46} anchor={center ? 'middle' : 'start'} fill={col.title} hlFill={col.hl} family={c.p.sans} />
          )}
        </g>
      )
    },
  },
  {
    id: 'bleed',
    textZone: 'left',
    name: 'Code Bleed',
    description: 'Headline left, oversized panel bleeding off the edge',
    categories: ['python-js', 'tutorials', 'api'],
    backgrounds: ['mist', 'sky', 'paper', 'ink', 'midnight'],
    supportsAlign: false,
    slot: 'box',
    render: (c) => {
      const { H } = c
      const g = textGroup(c, { width: 500, titleSize: 56, titleLines: 4, subSize: 21, subLines: 3, eyebrowStyle: 'mono' })
      const top = Math.max(PAD + 64, (H - g.h) / 2 + 20)
      return (
        <g>
          {logo(c, PAD, 58)}
          {g.render(PAD, top, 'start')}
          {c.art({ x: 618, y: 92, w: 720, h: H - 40 }, { align: 'xMinYMin' })}
        </g>
      )
    },
  },
  {
    id: 'headline',
    textZone: 'right',
    name: 'Headline',
    description: 'Bold announcement headline with a hero badge',
    categories: ['product'],
    backgrounds: ['blueprint', 'cobalt', 'sky', 'midnight'],
    supportsAlign: false,
    slot: 'box',
    render: (c) => {
      const { W, H } = c
      const g = textGroup(c, {
        width: 560,
        titleSize: 74,
        titleLines: 3,
        titleMin: 36,
        subSize: 26,
        subLines: 2,
        eyebrowStyle: 'big',
        gapEyebrow: 18,
        gapSub: 18,
        subWeight: 600,
        subColor: 'accent',
      })
      const top = Math.max(110, (H - g.h) / 2 + 24)
      return (
        <g>
          {logo(c, W / 2, 40, 36, 'middle')}
          {c.art({ x: 50, y: 96, w: 480, h: H - 150 }, { align: 'xMidYMid' })}
          {g.render(580, top, 'start')}
        </g>
      )
    },
  },
  {
    id: 'versus',
    textZone: 'top',
    name: 'Versus',
    description: 'Title over a head-to-head comparison',
    categories: ['comparisons'],
    backgrounds: ['sky', 'paper', 'mist', 'midnight', 'blueprint'],
    supportsAlign: true,
    slot: 'wide',
    render: (c) => {
      const { W, H, cfg } = c
      const center = cfg.align === 'center'
      const g = textGroup(c, { width: center ? 980 : 820, titleSize: 48, titleLines: 2, titleMin: 30, subSize: 20, subLines: 1, gapEyebrow: 18, gapSub: 12 })
      const top = cfg.showLogo ? 100 : 56
      const artY = top + g.h + 34
      return (
        <g>
          {logo(c, center ? W / 2 : PAD, 38, 32, center ? 'middle' : 'start')}
          {g.render(center ? W / 2 : PAD, top, center ? 'middle' : 'start')}
          {c.art({ x: 70, y: artY, w: W - 140, h: H - artY - 40 }, { align: 'xMidYMid' })}
        </g>
      )
    },
  },
  {
    id: 'dark-panel',
    textZone: 'right',
    name: 'Glow Panel',
    description: 'Illustration in a glow, headline right — built for dark fields',
    categories: ['data-automation', 'python-js', 'product', 'api'],
    backgrounds: ['midnight', 'ink', 'cobalt', 'sky'],
    supportsAlign: false,
    slot: 'box',
    render: (c) => {
      const { H, p } = c
      const g = textGroup(c, { width: 470, titleSize: 54, titleLines: 4, subSize: 21, subLines: 3 })
      const top = Math.max(PAD + 64, (H - g.h) / 2 + 20)
      return (
        <g>
          <ellipse cx={330} cy={H / 2} rx={330} ry={H * 0.5} fill={`url(#${p.ids.glow})`} />
          {c.art({ x: 36, y: 64, w: 590, h: H - 128 }, { align: 'xMidYMid' })}
          {logo(c, 670, 58)}
          {g.render(670, top, 'start')}
        </g>
      )
    },
  },
  {
    id: 'editorial',
    textZone: 'left',
    name: 'Editorial',
    description: 'Large typographic headline with a supporting visual',
    categories: ['engineering', 'comparisons', 'tutorials'],
    backgrounds: ['paper', 'mist', 'ink', 'sky'],
    supportsAlign: false,
    slot: 'box',
    render: (c) => {
      const { W, H, p } = c
      const col = colors(c)
      const tf = fitTitle(c, 720, 3, 70, 36)
      const sf = fitSub(c, 600, 2, 21)
      const titleY = 150
      const subY = titleY + (tf?.height ?? 0) + 22
      const label = eyebrowText(c)
      return (
        <g>
          {logo(c, PAD, 56, 32)}
          {label && (
            <text x={W - PAD} y={78} textAnchor="end" fontFamily={p.mono} fontWeight={500} fontSize={14} letterSpacing={0.9} fill={col.muted}>
              {label}
            </text>
          )}
          {c.art({ x: 790, y: H - 340, w: 380, h: 300 }, { align: 'xMaxYMax' })}
          {tf && <TextBlock fit={tf} x={PAD} y={titleY} fill={col.title} hlFill={col.hl} family={p.sans} />}
          {sf && <TextBlock fit={sf} x={PAD} y={subY} fill={col.muted} hlFill={col.accent} family={p.sans} />}
          <line x1={PAD} y1={H - 92} x2={700} y2={H - 92} stroke={p.mode === 'dark' ? 'rgba(255,255,255,0.14)' : p.cardStroke} strokeWidth={1.5} />
          <rect x={PAD} y={H - 93.5} width={64} height={3} fill={col.accent} />
          <text x={PAD} y={H - 56} fontFamily={p.mono} fontWeight={400} fontSize={15} fill={col.muted}>
            spidra.io/blog
          </text>
        </g>
      )
    },
  },
  {
    id: 'framed',
    textZone: 'none',
    name: 'Framed',
    description: 'Inset card holding headline and an edge-cropped visual',
    categories: ['tutorials', 'scraping', 'engineering'],
    backgrounds: ['cobalt', 'sky', 'aurora', 'midnight', 'blueprint'],
    supportsAlign: false,
    slot: 'box',
    render: (c) => {
      const { W, H, p, uid } = c
      const f = { x: 44, y: 44, w: W - 88, h: H - 88 }
      const g = textGroup(c, { width: 470, titleSize: 52, titleLines: 4, subSize: 20, subLines: 3, onCard: true })
      const top = Math.max(f.y + 100, (H - g.h) / 2 + 22)
      return (
        <g>
          <defs>
            <clipPath id={`${uid}-frame`}>
              <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={28} />
            </clipPath>
          </defs>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={28} fill={p.card} stroke={p.cardStroke} strokeWidth={1.5} filter={`url(#${p.ids.shadowLg})`} />
          <g clipPath={`url(#${uid}-frame)`}>
            <rect x={640} y={f.y} width={f.x + f.w - 640} height={f.h} fill={p.cardAlt} />
            <circle cx={900} cy={H / 2} r={260} fill={`url(#${p.ids.glow})`} />
            {c.art({ x: 672, y: 96, w: f.x + f.w - 672 - 32, h: H - 192 }, { align: 'xMidYMid' })}
          </g>
          {logo(c, 92, 86, 32, 'start', true)}
          {g.render(92, top, 'start')}
        </g>
      )
    },
  },
  {
    id: 'bento',
    textZone: 'none',
    name: 'Bento',
    description: 'Modular tiles: headline, visual, brand and topic',
    categories: ['api', 'data-automation', 'product'],
    backgrounds: ['mist', 'sky', 'midnight', 'ink', 'blueprint'],
    supportsAlign: false,
    slot: 'box',
    render: (c) => {
      const { W, H, p, uid } = c
      const m = 40
      const gap = 18
      const A = { x: m, y: m, w: 620, h: H - m * 2 }
      const rx = A.x + A.w + gap
      const rw = W - m - rx
      const B = { x: rx, y: m, w: rw, h: Math.round((H - m * 2 - gap) * 0.66) }
      const smallH = H - m * 2 - gap - B.h
      const C = { x: rx, y: B.y + B.h + gap, w: (rw - gap) / 2, h: smallH }
      const D = { x: C.x + C.w + gap, y: C.y, w: C.w, h: smallH }
      const g = textGroup(c, { width: A.w - 96, titleSize: 52, titleLines: 4, subSize: 20, subLines: 3, onCard: true, eyebrowStyle: 'chip' })
      const top = A.y + Math.max(48, (A.h - g.h) / 2)
      const tile = (b: Box, fill?: string) => (
        <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={24} fill={fill ?? p.card} stroke={p.cardStroke} strokeWidth={1.5} filter={`url(#${p.ids.shadow})`} />
      )
      const col = colors(c, true)
      return (
        <g>
          <defs>
            <clipPath id={`${uid}-bentoB`}>
              <rect x={B.x} y={B.y} width={B.w} height={B.h} rx={24} />
            </clipPath>
          </defs>
          {tile(A)}
          {tile(B, p.cardAlt)}
          {tile(C)}
          <rect x={D.x} y={D.y} width={D.w} height={D.h} rx={24} fill={`url(#${p.ids.hub})`} filter={`url(#${p.ids.shadow})`} />
          {g.render(A.x + 48, top, 'start')}
          <g clipPath={`url(#${uid}-bentoB)`}>{c.art({ x: B.x + 20, y: B.y + 18, w: B.w - 40, h: B.h - 36 }, { align: 'xMidYMid' })}</g>
          {/* topic tile */}
          <text x={C.x + 22} y={C.y + 40} fontFamily={p.mono} fontSize={13} fontWeight={500} fill={col.muted} letterSpacing={0.6}>
            {'</>'}
          </text>
          <text x={C.x + 22} y={C.y + C.h - 26} fontFamily={p.sans} fontSize={18} fontWeight={600} fill={col.ink} letterSpacing={-0.2}>
            {(c.cfg.eyebrow.trim() || categoryLabel(c.cfg)).slice(0, 16)}
          </text>
          {/* brand tile */}
          {c.cfg.showLogo ? (
            c.brand.customLogo ? (
              <image href={c.brand.customLogo} x={D.x + D.w / 2 - 34} y={D.y + D.h / 2 - 34} width={68} height={68} />
            ) : (
              <g>
                <line x1={D.x + D.w / 2} y1={D.y} x2={D.x + D.w / 2} y2={D.y + D.h / 2 - 40} stroke="#FFFFFF" strokeWidth={2.2} />
                <SpiderMark x={D.x + D.w / 2 - 44} y={D.y + D.h / 2 - 50} size={88} p={p} disc={false} ink="#FFFFFF" />
              </g>
            )
          ) : (
            <circle cx={D.x + D.w / 2} cy={D.y + D.h / 2} r={18} fill="#FFFFFF" opacity={0.3} />
          )}
        </g>
      )
    },
  },
]

export const TEMPLATE_BY_ID = Object.fromEntries(TEMPLATES.map((t) => [t.id, t])) as Record<TemplateId, TemplateDef>
