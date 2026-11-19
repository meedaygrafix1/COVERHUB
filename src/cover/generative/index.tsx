import { memo, type ReactNode } from 'react'
import { mix, shade, tint } from '../../lib/color'
import { rng } from '../../lib/random'
import { makeNoise } from './noise'
import { PATTERNS, type PatternCtx } from './patterns'
import { ART_PATTERNS, type ArtConfig, type ArtTone } from './types'

export * from './types'

/** Where the template puts its text, so the art can stay calm there. */
export type TextZone = 'left' | 'right' | 'top' | 'bottom' | 'center' | 'none'

/** Palette colours for a tone. Index 0 is the dominant colour. */
export function artColors(a: ArtConfig, primary: string): string[] {
  const P = primary
  if (a.tone === 'brand' && a.palette !== 'mono') return ['#FFFFFF', tint(P, 0.55), tint(P, 0.25), '#9BD4FF', '#C7D2FE']
  const dark = a.tone === 'dark'
  switch (a.palette) {
    case 'ocean':
      return dark ? ['#38BDF8', '#22D3EE', mix(P, '#7FB0FF', 0.4), '#5EEAD4', '#1D4ED8'] : [P, '#06B6D4', '#38BDF8', shade(P, 0.3), '#5EEAD4']
    case 'aurora':
      return dark ? ['#818CF8', '#22D3EE', mix(P, '#7FB0FF', 0.4), '#C084FC', '#60A5FA'] : [P, '#7C3AED', '#22D3EE', '#A78BFA', '#60A5FA']
    case 'mono':
      if (a.tone === 'brand') return ['#FFFFFF', tint(P, 0.7), tint(P, 0.45), '#FFFFFF', tint(P, 0.85)]
      return dark ? ['#FFFFFF', '#A8B6D2', mix(P, '#7FB0FF', 0.5), '#5B6B8C', '#33456B'] : ['#0A1222', '#4A5871', P, '#A8B6D2', '#D7DEEA']
    default:
      return dark ? [mix(P, '#7FB0FF', 0.45), '#7CC4FF', P, tint(P, 0.55), '#BFDBFE'] : [P, mix(P, '#4F9BFF', 0.45), tint(P, 0.45), tint(P, 0.7), shade(P, 0.3)]
  }
}

export function toneBase(tone: ArtTone, primary: string): { from: string; to: string; solid: string } {
  if (tone === 'dark') return { from: '#07111F', to: '#0C1F44', solid: '#091733' }
  if (tone === 'brand') return { from: shade(primary, 0.18), to: mix(primary, '#4F9BFF', 0.5), solid: primary }
  return { from: '#F8FBFF', to: tint(primary, 0.86), solid: '#F2F6FE' }
}

/** Palette tone → the background id whose text/card colours suit it. */
export const TONE_TO_BG = { light: 'sky', dark: 'midnight', brand: 'cobalt' } as const

const GROUP_ROTATED = new Set(['flow', 'halftone', 'truchet', 'bauhaus', 'rays', 'rings'])

function patternNode(a: ArtConfig, w: number, h: number, uid: string, primary: string): ReactNode {
  const k = Math.max(w, h) / 1200
  const D = Math.hypot(w, h)
  const rot = (a.rotation * Math.PI) / 180
  const cos = Math.cos(rot)
  const sin = Math.sin(rot)
  const cx = w / 2
  const cy = h / 2
  const rotate = GROUP_ROTATED.has(a.pattern) && a.rotation % 360 !== 0
  const ctx: PatternCtx = {
    w,
    h,
    k,
    r: rng(a.seed * 2654435761),
    n: makeNoise(a.seed),
    colors: artColors(a, primary),
    base: toneBase(a.tone, primary).solid,
    a,
    uid,
    D,
    ox: cx - D / 2,
    oy: cy - D / 2,
    visible: (x, y, pad) => {
      if (!rotate) return x > -pad && x < w + pad && y > -pad && y < h + pad
      const dx = x - cx
      const dy = y - cy
      const sx = cx + dx * cos - dy * sin
      const sy = cy + dx * sin + dy * cos
      return sx > -pad && sx < w + pad && sy > -pad && sy < h + pad
    },
  }
  const node = PATTERNS[a.pattern]?.(ctx) ?? null
  const blur = a.pattern === 'mesh' ? 0 : a.softness * 14 * k
  return (
    <g>
      {blur > 0.2 && (
        <defs>
          <filter id={`${uid}-soft`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={Math.round(blur * 10) / 10} />
          </filter>
        </defs>
      )}
      <g filter={blur > 0.2 ? `url(#${uid}-soft)` : undefined}>
        {rotate ? <g transform={`rotate(${a.rotation} ${cx} ${cy})`}>{node}</g> : node}
      </g>
    </g>
  )
}

function Grain({ w, h, uid, tone }: { w: number; h: number; uid: string; tone: ArtTone }) {
  return (
    <g>
      <defs>
        <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
          <feColorMatrix type="matrix" values={tone === 'light' ? '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.09 0' : '0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.08 0'} />
        </filter>
      </defs>
      <rect width={w} height={h} filter={`url(#${uid}-grain)`} />
    </g>
  )
}

function Fade({ w, h, uid, zone, color }: { w: number; h: number; uid: string; zone: TextZone; color: string }) {
  if (zone === 'none') return null
  if (zone === 'center') {
    return (
      <g>
        <defs>
          <radialGradient id={`${uid}-fade`} cx="0.5" cy="0.5" r="0.55">
            <stop offset="0" stopColor={color} stopOpacity={0.92} />
            <stop offset="0.6" stopColor={color} stopOpacity={0.55} />
            <stop offset="1" stopColor={color} stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill={`url(#${uid}-fade)`} />
      </g>
    )
  }
  const dir = { left: [0, 0, 1, 0], right: [1, 0, 0, 0], top: [0, 0, 0, 1], bottom: [0, 1, 0, 0] }[zone]
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-fade`} x1={dir[0]} y1={dir[1]} x2={dir[2]} y2={dir[3]}>
          <stop offset="0" stopColor={color} stopOpacity={0.96} />
          <stop offset="0.38" stopColor={color} stopOpacity={0.88} />
          <stop offset="0.62" stopColor={color} stopOpacity={0.25} />
          <stop offset="0.8" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#${uid}-fade)`} />
    </g>
  )
}

/** Full-bleed generative background. */
export const ArtLayer = memo(function ArtLayer({
  art,
  w,
  h,
  uid,
  primary,
  zone,
}: {
  art: ArtConfig
  w: number
  h: number
  uid: string
  primary: string
  zone: TextZone
}) {
  const base = toneBase(art.tone, primary)
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-artbg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={base.from} />
          <stop offset="1" stopColor={base.to} />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#${uid}-artbg)`} />
      {patternNode(art, w, h, `${uid}-a`, primary)}
      {art.grain && <Grain w={w} h={h} uid={uid} tone={art.tone} />}
      {art.fade && <Fade w={w} h={h} uid={uid} zone={zone} color={art.tone === 'brand' ? shade(primary, 0.1) : base.from} />}
    </g>
  )
})

/** Generative art framed as an illustration: a card, a circle, or a soft-edged cloud. */
export const ArtTile = memo(function ArtTile({ art, w, h, uid, primary }: { art: ArtConfig; w: number; h: number; uid: string; primary: string }) {
  const base = toneBase(art.tone, primary)
  const frame = art.frame
  const r = Math.min(w, h)
  const clip =
    frame === 'circle' ? <circle cx={w / 2} cy={h / 2} r={r * 0.47} /> : frame === 'card' ? <rect x={w * 0.04} y={h * 0.05} width={w * 0.92} height={h * 0.9} rx={r * 0.07} /> : null
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-tbg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={base.from} />
          <stop offset="1" stopColor={base.to} />
        </linearGradient>
        {clip && <clipPath id={`${uid}-tclip`}>{clip}</clipPath>}
        {frame === 'soft' && (
          <>
            <radialGradient id={`${uid}-tmaskg`} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0.45" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#000000" />
            </radialGradient>
            <mask id={`${uid}-tmask`}>
              <rect width={w} height={h} fill={`url(#${uid}-tmaskg)`} />
            </mask>
          </>
        )}
        <filter id={`${uid}-tshadow`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy={r * 0.04} stdDeviation={r * 0.05} floodColor={shade(primary, 0.4)} floodOpacity={0.22} />
        </filter>
      </defs>
      {clip && <g filter={`url(#${uid}-tshadow)`}>{frame === 'circle' ? <circle cx={w / 2} cy={h / 2} r={r * 0.47} fill={base.solid} /> : <rect x={w * 0.04} y={h * 0.05} width={w * 0.92} height={h * 0.9} rx={r * 0.07} fill={base.solid} />}</g>}
      <g clipPath={clip ? `url(#${uid}-tclip)` : undefined} mask={frame === 'soft' ? `url(#${uid}-tmask)` : undefined}>
        {frame !== 'soft' && <rect width={w} height={h} fill={`url(#${uid}-tbg)`} />}
        {patternNode({ ...art, fade: false }, w, h, `${uid}-t`, primary)}
        {art.grain && <Grain w={w} h={h} uid={`${uid}-t`} tone={art.tone} />}
      </g>
      {clip && frame === 'card' && (
        <rect x={w * 0.04} y={h * 0.05} width={w * 0.92} height={h * 0.9} rx={r * 0.07} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={r * 0.006} />
      )}
    </g>
  )
})

export const patternName = (id: string) => ART_PATTERNS.find((p) => p.id === id)?.name ?? id
