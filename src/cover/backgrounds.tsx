import type { ReactNode } from 'react'
import { mix, shade, tint } from '../lib/color'
import type { BackgroundId } from '../lib/types'
import type { Palette } from './palette'
import { ArtLayer, DEFAULT_ART, type ArtConfig, type TextZone } from './generative'

export interface BgProps {
  W: number
  H: number
  p: Palette
  decor: 0 | 1 | 2
  uid: string
  /** procedural art for the `generative` background */
  art?: ArtConfig
  /** where the template sets its text, kept calm by the art's fade */
  zone?: TextZone
}

export interface BackgroundDef {
  id: BackgroundId
  name: string
  dark: boolean
  /** CSS preview swatch for the picker */
  swatch: (primary: string) => string
  render: (props: BgProps) => ReactNode
}

/** Soft rolling wave anchored to the bottom edge — a recurring Spidra motif. */
function Wave({ W, H, fill, opacity = 1 }: { W: number; H: number; fill: string; opacity?: number }) {
  const y = H - 78
  return (
    <g opacity={opacity}>
      <path
        d={`M0 ${y + 18} C ${W * 0.22} ${y - 18}, ${W * 0.4} ${y + 30}, ${W * 0.62} ${y + 6} S ${W * 0.9} ${y - 10}, ${W} ${y + 12} L ${W} ${H} L 0 ${H} Z`}
        fill={fill}
        opacity={0.55}
      />
      <path
        d={`M0 ${y + 44} C ${W * 0.25} ${y + 22}, ${W * 0.45} ${y + 58}, ${W * 0.7} ${y + 38} S ${W * 0.92} ${y + 30}, ${W} ${y + 44} L ${W} ${H} L 0 ${H} Z`}
        fill={fill}
      />
    </g>
  )
}

/** Small scattered dots, placed at fixed, balanced positions. */
function Dots({ W, H, fill }: { W: number; H: number; fill: string }) {
  const pts = [
    [0.25, 0.12, 4],
    [0.86, 0.14, 4],
    [0.035, 0.5, 3],
    [0.965, 0.46, 3],
    [0.04, 0.9, 3],
    [0.96, 0.9, 3],
  ]
  return (
    <g fill={fill}>
      {pts.map(([x, y, r], i) => (
        <circle key={i} cx={x * W} cy={y * H} r={r} />
      ))}
    </g>
  )
}

function Grid({ W, H, step, stroke, opacity }: { W: number; H: number; step: number; stroke: string; opacity: number }) {
  const lines: ReactNode[] = []
  for (let x = step; x < W; x += step) lines.push(<line key={`x${x}`} x1={x} y1={0} x2={x} y2={H} />)
  for (let y = step; y < H; y += step) lines.push(<line key={`y${y}`} x1={0} y1={y} x2={W} y2={y} />)
  return (
    <g stroke={stroke} strokeWidth={1} opacity={opacity}>
      {lines}
    </g>
  )
}

/** Sparse “blueprint” guide lines with intersection nodes, as on the announcement covers. */
function Guides({ W, H, stroke, node }: { W: number; H: number; stroke: string; node: string }) {
  const ys = [H * 0.29, H * 0.69]
  const xs = [W * 0.05, W * 0.84, W * 0.95]
  return (
    <g>
      <g stroke={stroke} strokeWidth={1.2}>
        {ys.map((y) => (
          <line key={y} x1={0} y1={y} x2={W} y2={y} />
        ))}
        {xs.map((x) => (
          <line key={x} x1={x} y1={0} x2={x} y2={H} />
        ))}
      </g>
      <g fill={node}>
        {ys.flatMap((y) => xs.map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r={3.5} />))}
      </g>
    </g>
  )
}

function NoiseDots({ W, H, fill, step = 22 }: { W: number; H: number; fill: string; step?: number }) {
  return (
    <g>
      <defs>
        <pattern id={`dotgrid-${step}-${fill.replace('#', '')}`} width={step} height={step} patternUnits="userSpaceOnUse">
          <circle cx={step / 2} cy={step / 2} r={1.2} fill={fill} />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#dotgrid-${step}-${fill.replace('#', '')})`} />
    </g>
  )
}

export const BACKGROUNDS: BackgroundDef[] = [
  {
    id: 'pastel',
    name: 'Pastel',
    dark: false,
    swatch: (c) => `radial-gradient(circle at 15% 15%, #CFF5EE, transparent 45%), radial-gradient(circle at 85% 85%, #E2DCFB, transparent 45%), linear-gradient(180deg, #F6F9FF, ${tint(c, 0.9)})`,
    render: ({ W, H, p, decor, uid }) => {
      const hill = tint(p.primary, 0.9)
      return (
        <g>
          <defs>
            <linearGradient id={`${uid}-pa`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#F7FAFF" />
              <stop offset="1" stopColor={mix(tint(p.primary, 0.92), '#F1EEFF', 0.4)} />
            </linearGradient>
            <filter id={`${uid}-pablur`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={70} />
            </filter>
            <linearGradient id={`${uid}-pahill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={hill} stopOpacity="0.9" />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <rect width={W} height={H} fill={`url(#${uid}-pa)`} />
          <g filter={`url(#${uid}-pablur)`}>
            <ellipse cx={W * 0.06} cy={H * 0.02} rx={W * 0.22} ry={H * 0.3} fill="#C9F3EA" opacity={0.85} />
            <ellipse cx={W * 0.96} cy={H * 0.98} rx={W * 0.26} ry={H * 0.34} fill="#DDD5FB" opacity={0.85} />
            <ellipse cx={W * 0.72} cy={H * 0.12} rx={W * 0.2} ry={H * 0.22} fill={tint(p.primary, 0.82)} opacity={0.5} />
          </g>
          {decor >= 1 && (
            <g>
              <path d={`M0 ${H * 0.86} C ${W * 0.18} ${H * 0.52}, ${W * 0.42} ${H * 0.5}, ${W * 0.62} ${H * 0.78} L ${W * 0.62} ${H} L 0 ${H} Z`} fill={`url(#${uid}-pahill)`} opacity={0.75} />
              <path d={`M${W * 0.5} ${H} C ${W * 0.62} ${H * 0.5}, ${W * 0.8} ${H * 0.28}, ${W} ${H * 0.4} L ${W} ${H} Z`} fill={`url(#${uid}-pahill)`} opacity={0.55} />
            </g>
          )}
          {decor >= 2 && <Dots W={W} H={H} fill={tint(p.primary, 0.6)} />}
        </g>
      )
    },
  },
  {
    id: 'sky',
    name: 'Sky',
    dark: false,
    swatch: (c) => `linear-gradient(180deg, #F7FAFF, ${tint(c, 0.82)})`,
    render: ({ W, H, p, decor, uid }) => (
      <g>
        <defs>
          <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F8FBFF" />
            <stop offset="1" stopColor={tint(p.primary, 0.86)} />
          </linearGradient>
          <radialGradient id={`${uid}-skyglow`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={tint(p.primary, 0.7)} stopOpacity="0.85" />
            <stop offset="1" stopColor={tint(p.primary, 0.7)} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${uid}-sky)`} />
        <ellipse cx={W / 2} cy={H * 0.5} rx={W * 0.36} ry={H * 0.42} fill={`url(#${uid}-skyglow)`} />
        {decor >= 1 && <Wave W={W} H={H} fill={tint(p.primary, 0.9)} />}
        {decor >= 2 && <Dots W={W} H={H} fill={tint(p.primary, 0.5)} />}
      </g>
    ),
  },
  {
    id: 'mist',
    name: 'Mist',
    dark: false,
    swatch: (c) => `radial-gradient(circle at 30% 30%, ${tint(c, 0.8)}, #F3F7FD 60%)`,
    render: ({ W, H, p, decor, uid }) => (
      <g>
        <defs>
          <radialGradient id={`${uid}-mistA`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={tint(p.primary, 0.72)} stopOpacity="0.9" />
            <stop offset="1" stopColor={tint(p.primary, 0.72)} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-mistB`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#BEEBFF" stopOpacity="0.7" />
            <stop offset="1" stopColor="#BEEBFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="#F3F7FD" />
        <circle cx={W * 0.18} cy={H * 0.2} r={H * 0.55} fill={`url(#${uid}-mistA)`} />
        <circle cx={W * 0.86} cy={H * 0.9} r={H * 0.6} fill={`url(#${uid}-mistB)`} />
        {decor >= 1 && <NoiseDots W={W} H={H} fill={tint(p.primary, 0.75)} step={26} />}
        {decor >= 2 && (
          <g fill="none" stroke={tint(p.primary, 0.75)} strokeWidth={1.5}>
            <circle cx={W * 0.92} cy={H * 0.08} r={110} />
            <circle cx={W * 0.92} cy={H * 0.08} r={170} />
          </g>
        )}
      </g>
    ),
  },
  {
    id: 'paper',
    name: 'Paper',
    dark: false,
    swatch: () => '#FFFFFF',
    render: ({ W, H, p, decor }) => (
      <g>
        <rect width={W} height={H} fill="#FFFFFF" />
        {decor >= 1 && <Grid W={W} H={H} step={40} stroke={tint(p.primary, 0.9)} opacity={1} />}
        {decor >= 2 && <rect x={0} y={H - 10} width={W} height={10} fill={p.primary} />}
        {decor < 1 && <NoiseDots W={W} H={H} fill={tint(p.primary, 0.85)} step={24} />}
      </g>
    ),
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    dark: false,
    swatch: (c) => `linear-gradient(135deg, #EEF4FD, ${tint(c, 0.85)})`,
    render: ({ W, H, p, decor, uid }) => (
      <g>
        <defs>
          <linearGradient id={`${uid}-bp`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#EEF3FB" />
            <stop offset="1" stopColor={tint(p.primary, 0.86)} />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${uid}-bp)`} />
        <Guides W={W} H={H} stroke={tint(p.primary, 0.7)} node={tint(p.primary, 0.45)} />
        {decor >= 1 && <NoiseDots W={W} H={H} fill={tint(p.primary, 0.78)} step={18} />}
        {decor >= 2 && <Grid W={W} H={H} step={120} stroke={tint(p.primary, 0.82)} opacity={0.6} />}
      </g>
    ),
  },
  {
    id: 'aurora',
    name: 'Aurora',
    dark: false,
    swatch: (c) => `linear-gradient(120deg, #E9F6FF, ${tint(c, 0.8)}, #F1EEFF)`,
    render: ({ W, H, p, decor, uid }) => (
      <g>
        <defs>
          <linearGradient id={`${uid}-au`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#EEF8FF" />
            <stop offset="0.55" stopColor={tint(p.primary, 0.88)} />
            <stop offset="1" stopColor="#F2F0FF" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${uid}-au)`} />
        <path
          d={`M0 ${H * 0.72} C ${W * 0.18} ${H * 0.42}, ${W * 0.32} ${H * 0.4}, ${W * 0.5} ${H * 0.62} S ${W * 0.82} ${H * 0.38}, ${W} ${H * 0.5} L ${W} ${H} L 0 ${H} Z`}
          fill="#FFFFFF"
          opacity={0.45}
        />
        {decor >= 1 && (
          <path
            d={`M0 ${H * 0.86} C ${W * 0.3} ${H * 0.7}, ${W * 0.55} ${H * 0.95}, ${W} ${H * 0.74} L ${W} ${H} L 0 ${H} Z`}
            fill={tint(p.primary, 0.84)}
            opacity={0.7}
          />
        )}
        {decor >= 2 && <Dots W={W} H={H} fill={tint(p.primary, 0.55)} />}
      </g>
    ),
  },
  {
    id: 'cobalt',
    name: 'Cobalt',
    dark: true,
    swatch: (c) => `linear-gradient(135deg, ${shade(c, 0.15)}, ${mix(c, '#4F9BFF', 0.5)})`,
    render: ({ W, H, p, decor, uid }) => (
      <g>
        <defs>
          <linearGradient id={`${uid}-co`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={shade(p.primary, 0.18)} />
            <stop offset="1" stopColor={mix(p.primary, '#4F9BFF', 0.5)} />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${uid}-co)`} />
        <Grid W={W} H={H} step={60} stroke="#FFFFFF" opacity={decor >= 1 ? 0.07 : 0.035} />
        {decor >= 1 && (
          <g fill="none" stroke="#FFFFFF" opacity={0.14} strokeWidth={1.5}>
            <circle cx={W * 0.96} cy={H * 0.02} r={180} />
            <circle cx={W * 0.96} cy={H * 0.02} r={260} />
            <circle cx={W * 0.96} cy={H * 0.02} r={340} />
          </g>
        )}
        {decor >= 2 && <Wave W={W} H={H} fill="#FFFFFF" opacity={0.08} />}
      </g>
    ),
  },
  {
    id: 'midnight',
    name: 'Midnight',
    dark: true,
    swatch: (c) => `radial-gradient(circle at 70% 40%, ${shade(c, 0.35)}, #07101F 70%)`,
    render: ({ W, H, p, decor, uid }) => (
      <g>
        <defs>
          <linearGradient id={`${uid}-mn`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#081226" />
            <stop offset="1" stopColor="#0B1D3F" />
          </linearGradient>
          <radialGradient id={`${uid}-mng`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={p.primary} stopOpacity="0.55" />
            <stop offset="1" stopColor={p.primary} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${uid}-mn)`} />
        <Grid W={W} H={H} step={48} stroke="#7FA6FF" opacity={0.06} />
        <ellipse cx={W * 0.7} cy={H * 0.55} rx={W * 0.4} ry={H * 0.55} fill={`url(#${uid}-mng)`} />
        {decor >= 1 && <NoiseDots W={W} H={H} fill="#5C7FC4" step={48} />}
        {decor >= 2 && <rect x={0} y={0} width={W} height={3} fill={p.primary} />}
      </g>
    ),
  },
  {
    id: 'ink',
    name: 'Ink',
    dark: true,
    swatch: () => 'linear-gradient(180deg, #0B0F19, #111827)',
    render: ({ W, H, p, decor, uid }) => (
      <g>
        <defs>
          <radialGradient id={`${uid}-ink`} cx="0.5" cy="0" r="0.8">
            <stop offset="0" stopColor={p.primary} stopOpacity="0.35" />
            <stop offset="1" stopColor={p.primary} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="#0A0E18" />
        <rect width={W} height={H} fill={`url(#${uid}-ink)`} />
        {decor >= 1 && <NoiseDots W={W} H={H} fill="#1F2A40" step={20} />}
        {decor >= 2 && (
          <g stroke={p.primary} opacity={0.5} strokeWidth={1}>
            <line x1={0} y1={H - 1} x2={W} y2={H - 1} />
          </g>
        )}
      </g>
    ),
  },
]

BACKGROUNDS.push({
  id: 'generative',
  name: 'Abstract',
  dark: false,
  swatch: (c) => `conic-gradient(from 200deg at 70% 50%, ${tint(c, 0.85)}, ${c}, #22D3EE, ${tint(c, 0.6)}, ${tint(c, 0.85)})`,
  render: ({ W, H, p, uid, art, zone }) => <ArtLayer art={art ?? DEFAULT_ART} w={W} h={H} uid={`${uid}-gen`} primary={p.primary} zone={zone ?? 'none'} />,
})

export const BG_BY_ID = Object.fromEntries(BACKGROUNDS.map((b) => [b.id, b])) as Record<BackgroundId, BackgroundDef>
