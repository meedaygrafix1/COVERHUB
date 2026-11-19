import type { ReactNode } from 'react'
import { mix, shade, tint } from '../../lib/color'
import type { SceneItem } from '../../lib/types'
import type { Palette } from '../palette'
import { SpiderMark } from '../primitives'
import { LibIcon } from './scene'

/**
 * Illustration-style scenes for light pastel covers: glassy white cards,
 * skeleton text bars, thin connectors with glowing nodes, and a soft
 * mint / sky / lavender accent set. Each layout is drawn on a fixed
 * 1120 × 560 artboard and scaled to fit its box, so proportions stay true.
 */

export const AW = 1120
export const AH = 560

export interface Props {
  p: Palette
  items: SceneItem[]
  w: number
  h: number
  uid: string
}

const FILLER = ['sparkles', 'layers', 'chart-line', 'globe', 'database', 'braces']

/** Icons these layouts draw on their own; preload them with the scene's items. */
export const BUILT_IN_ICONS = ['user', 'triangle-alert', 'circle-alert', 'arrow-right', 'mouse-pointer-click', ...FILLER]

/** Brand blue, mint and lavender: the three accents every reference uses. */
export const accents = (p: Palette) => [p.primary, '#1FB5A3', '#8B7CF6', mix(p.primary, '#38BDF8', 0.5)]

/** Marks an element as scene item `i` so the canvas can select it; filler slots stay untagged. */
export const tag = (i: number, n: number) => (i >= 0 && i < n ? { 'data-scene-item': i } : {})

export function pad(items: SceneItem[], n: number): SceneItem[] {
  const out = [...items]
  for (const f of FILLER) {
    if (out.length >= n) break
    if (!out.some((i) => i.icon === f)) out.push({ icon: f, label: '' })
  }
  return out.slice(0, n)
}

/** Scale the artboard into the box, centred. */
export function Artboard({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  const s = Math.min(w / AW, h / AH)
  return <g transform={`translate(${(w - AW * s) / 2} ${(h - AH * s) / 2}) scale(${s})`}>{children}</g>
}

export function Defs({ p, uid }: { p: Palette; uid: string }) {
  const shadow = shade(p.primary, 0.3)
  return (
    <defs>
      <linearGradient id={`${uid}-glass`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.96" />
        <stop offset="1" stopColor={tint(p.primary, 0.95)} stopOpacity="0.9" />
      </linearGradient>
      <linearGradient id={`${uid}-glassHi`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={mix(tint(p.primary, 0.9), '#F0EAFF', 0.6)} />
        <stop offset="1" stopColor={mix(tint(p.primary, 0.93), '#FBEFFF', 0.5)} />
      </linearGradient>
      <filter id={`${uid}-soft`} x="-30%" y="-30%" width="160%" height="190%" colorInterpolationFilters="sRGB">
        <feDropShadow dx="0" dy="18" stdDeviation="22" floodColor={shadow} floodOpacity="0.13" />
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor={shadow} floodOpacity="0.06" />
      </filter>
      <radialGradient id={`${uid}-halo`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={p.primary} stopOpacity="0.22" />
        <stop offset="1" stopColor={p.primary} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${uid}-bubble`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#8FE3DA" />
        <stop offset="0.55" stopColor={mix(p.primary, '#7CC4FF', 0.55)} />
        <stop offset="1" stopColor="#A99CF5" />
      </linearGradient>
      <linearGradient id={`${uid}-lens`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#9BE7F0" />
        <stop offset="1" stopColor={mix(p.primary, '#4FA3FF', 0.4)} />
      </linearGradient>
    </defs>
  )
}

export function Glass({ x, y, w, h, r, uid, p, hi, children }: { x: number; y: number; w: number; h: number; r: number; uid: string; p: Palette; hi?: boolean; children?: ReactNode }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={r} fill={hi ? `url(#${uid}-glassHi)` : `url(#${uid}-glass)`} filter={`url(#${uid}-soft)`} />
      <rect x={x + 1} y={y + 1} width={w - 2} height={h - 2} rx={r - 1} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.9} />
      <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke={tint(p.primary, 0.86)} strokeWidth={1} opacity={0.7} />
      {children}
    </g>
  )
}

/** Placeholder text lines. */
export function Bars({ x, y, widths, color, h = 14, gap = 20 }: { x: number; y: number; widths: number[]; color: string; h?: number; gap?: number }) {
  return (
    <g>
      {widths.map((bw, i) => (
        <rect key={i} x={x} y={y + i * (h + gap)} width={bw} height={h} rx={h / 2} fill={color} opacity={i === 0 ? 0.95 : 0.7} />
      ))}
    </g>
  )
}

/** Icon on a soft tinted square. */
export function Chip({ x, y, s, icon, color, id, p, r }: { x: number; y: number; s: number; icon: string; color: string; id: string; p: Palette; r?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={s} height={s} rx={r ?? s * 0.24} fill={tint(color, 0.86)} />
      <LibIcon name={icon} x={x + s * 0.18} y={y + s * 0.18} size={s * 0.64} color={color} id={id} p={p} />
    </g>
  )
}

export function Node({ cx, cy, color, r = 8 }: { cx: number; cy: number; color: string; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r * 2.4} fill={color} opacity={0.14} />
      <circle cx={cx} cy={cy} r={r} fill={color} stroke="#FFFFFF" strokeWidth={3} />
    </g>
  )
}

function Pill({ x, y, text, icon, color, id, p, anchor = 'start' }: { x: number; y: number; text: string; icon: string; color: string; id: string; p: Palette; anchor?: 'start' | 'middle' | 'end' }) {
  const font = 21
  const w = Math.min(260, text.length * font * 0.56 + 84)
  const h = 50
  const left = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2
  return (
    <g>
      <rect x={left} y={y - h / 2} width={w} height={h} rx={h / 2} fill="#FFFFFF" fillOpacity={0.92} stroke="#FFFFFF" strokeWidth={2} filter={`url(#${id.split('-pill')[0]}-soft)`} />
      <LibIcon name={icon} x={left + 16} y={y - 14} size={28} color={color} id={id} p={p} />
      <text x={left + 54} y={y} dominantBaseline="central" fontFamily={p.sans} fontWeight={600} fontSize={font} fill={shade(p.primary, 0.55)} opacity={0.85}>
        {text.length > 16 ? text.slice(0, 15) + '…' : text}
      </text>
    </g>
  )
}

/* ------------------------------------------------------------------ */
/* Hub: brand at the centre, topic tiles and labelled pills around it  */
/* ------------------------------------------------------------------ */

export function Hub({ p, items, w, h, uid }: Props) {
  const acc = accents(p)
  const list = pad(items, 4)
  const cx = AW / 2
  const cy = AH / 2
  const tiles = [
    { x: 250, y: 150 },
    { x: 870, y: 150 },
    { x: 250, y: 410 },
    { x: 870, y: 410 },
  ]
  const pills = [
    { x: 40, y: 50, anchor: 'start' as const, to: tiles[0] },
    { x: AW - 40, y: 50, anchor: 'end' as const, to: tiles[1] },
    { x: 40, y: AH - 44, anchor: 'start' as const, to: tiles[2] },
    { x: AW - 40, y: AH - 44, anchor: 'end' as const, to: tiles[3] },
  ]
  const T = 150
  const TH = 128
  return (
    <Artboard w={w} h={h}>
      <Defs p={p} uid={uid} />
      <ellipse cx={cx} cy={cy + 10} rx={440} ry={240} fill={tint(p.primary, 0.9)} opacity={0.45} />
      <ellipse cx={cx} cy={cy + 10} rx={310} ry={168} fill={tint(p.primary, 0.88)} opacity={0.5} />
      <ellipse cx={cx} cy={cy + 10} rx={190} ry={104} fill={tint(p.primary, 0.86)} opacity={0.55} />

      {/* spokes */}
      {tiles.map((t, i) => {
        const mx = (t.x + cx) / 2
        const my = (t.y + cy) / 2
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={t.x} y2={t.y} stroke={tint(p.primary, 0.45)} strokeWidth={2} />
            <circle cx={mx} cy={my} r={6} fill="#FFFFFF" stroke={tint(p.primary, 0.45)} strokeWidth={2} />
            <circle cx={(mx + t.x) / 2} cy={(my + t.y) / 2} r={6} fill="#FFFFFF" stroke={tint(p.primary, 0.45)} strokeWidth={2} />
          </g>
        )
      })}

      {/* pills with curved leads to their tiles */}
      {pills.map((pl, i) => {
        const it = list[i]
        if (!it.label) return null
        const sx = pl.anchor === 'start' ? pl.x + 170 : pl.x - 170
        const ex = pl.to.x + (pl.anchor === 'start' ? -40 : 40)
        const ey = pl.to.y + (pl.y < cy ? -TH / 2 : TH / 2)
        return (
          <g key={i} {...tag(i, items.length)}>
            <path d={`M${sx} ${pl.y} C ${ex} ${pl.y}, ${ex} ${pl.y}, ${ex} ${ey}`} fill="none" stroke={tint(p.primary, 0.6)} strokeWidth={1.6} />
            <circle cx={ex} cy={(pl.y + ey) / 2 + (pl.y < cy ? 8 : -8)} r={5} fill="#FFFFFF" stroke={tint(p.primary, 0.5)} strokeWidth={1.8} />
            <Pill x={pl.x} y={pl.y} text={it.label} icon={it.icon} color={acc[i % acc.length]} id={`${uid}-pill${i}`} p={p} anchor={pl.anchor} />
          </g>
        )
      })}

      {/* topic tiles with a lifted base */}
      {tiles.map((t, i) => (
        <g key={i} {...tag(i, items.length)}>
          <rect x={t.x - T / 2} y={t.y - TH / 2 + 12} width={T} height={TH} rx={38} fill={tint(p.primary, 0.8)} />
          <Glass x={t.x - T / 2} y={t.y - TH / 2} w={T} h={TH} r={38} uid={uid} p={p}>
            <LibIcon name={list[i].icon} x={t.x - 40} y={t.y - 40} size={80} color={acc[i % acc.length]} id={`${uid}-t${i}`} p={p} />
          </Glass>
        </g>
      ))}

      {/* brand core */}
      <circle cx={cx} cy={cy} r={170} fill={`url(#${uid}-halo)`} />
      <rect x={cx - 120} y={cy - 92 + 18} width={240} height={184} rx={52} fill={mix(p.primary, '#FFFFFF', 0.25)} />
      <Glass x={cx - 120} y={cy - 92} w={240} h={184} r={52} uid={uid} p={p}>
        <SpiderMark x={cx - 62} y={cy - 62} size={124} p={p} />
      </Glass>
    </Artboard>
  )
}

/* ------------------------------------------------------------------ */
/* Merge: source cards converge into one result card                   */
/* ------------------------------------------------------------------ */

export function Merge({ p, items, w, h, uid }: Props) {
  const acc = accents(p)
  const all = items.length >= 2 ? items : pad(items, 3)
  const result = all[all.length - 1]
  const sources = all.slice(0, -1).slice(0, 3)
  const n = sources.length
  const cardW = 360
  const cardH = 150
  const gap = n === 3 ? 26 : 50
  const total = n * cardH + (n - 1) * gap
  const y0 = (AH - total) / 2
  const node = { x: 690, y: AH / 2 }
  const R = { x: 730, y: 70, w: 370, h: 420 }
  const bar = tint(p.primary, 0.78)

  return (
    <Artboard w={w} h={h}>
      <Defs p={p} uid={uid} />
      <ellipse cx={node.x - 40} cy={node.y} rx={170} ry={90} fill={`url(#${uid}-halo)`} />

      {sources.map((s, i) => {
        const y = y0 + i * (cardH + gap)
        const x = 30 + (i === 1 && n === 3 ? -14 : 0)
        const c = acc[i % acc.length]
        const sx = x + cardW
        const sy = y + cardH / 2
        const mx = sx + (node.x - sx) * 0.42
        const my = sy + (node.y - sy) * 0.5
        return (
          <g key={i} {...tag(i, items.length)}>
            <path d={`M${sx} ${sy} C ${sx + 120} ${sy}, ${node.x - 120} ${node.y}, ${node.x} ${node.y}`} fill="none" stroke={c} strokeWidth={2.6} opacity={0.75} />
            <Node cx={mx} cy={my} color={c} r={9} />
            <Glass x={x} y={y} w={cardW} h={cardH} r={30} uid={uid} p={p}>
              {i === 0 && (
                <g>
                  <path d={`M${x + 30} ${y} H${x + cardW - 30} a30 30 0 0 1 30 30 V${y + 34} H${x} V${y + 30} a30 30 0 0 1 30 -30Z`} fill={tint(p.primary, 0.78)} />
                  {[0, 1, 2].map((k) => (
                    <circle key={k} cx={x + 28 + k * 20} cy={y + 17} r={5} fill="#FFFFFF" opacity={0.9} />
                  ))}
                </g>
              )}
              <Chip x={x + 24} y={y + (i === 0 ? 48 : 27)} s={i === 0 ? 86 : 96} icon={s.icon} color={c} id={`${uid}-s${i}`} p={p} />
              <Bars x={x + 140} y={y + (i === 0 ? 56 : 36)} widths={s.label ? [180, 130] : [180, 140, 110]} color={bar} h={12} gap={i === 0 ? 14 : 18} />
              {s.label && (
                <text x={x + 140} y={y + cardH - 18} fontFamily={p.sans} fontWeight={600} fontSize={17} fill={shade(p.primary, 0.5)} opacity={0.75}>
                  {s.label.length > 22 ? s.label.slice(0, 21) + '…' : s.label}
                </text>
              )}
            </Glass>
          </g>
        )
      })}

      <line x1={node.x} y1={node.y} x2={R.x} y2={node.y} stroke={p.primary} strokeWidth={2.6} opacity={0.7} />
      <circle cx={node.x} cy={node.y} r={26} fill={p.primary} opacity={0.12} />
      <circle cx={node.x} cy={node.y} r={13} fill="#FFFFFF" stroke={p.primary} strokeWidth={4} />

      {/* result card */}
      <g {...tag(all.length - 1, items.length)}>
      <Glass x={R.x} y={R.y} w={R.w} h={R.h} r={36} uid={uid} p={p}>
        <rect x={R.x + 28} y={R.y + 28} width={150} height={128} rx={28} fill={tint(acc[1], 0.84)} />
        <rect x={R.x + 28} y={R.y + 28} width={150} height={128} rx={28} fill={tint(p.primary, 0.82)} opacity={0.55} />
        <LibIcon name={result.icon} x={R.x + 53} y={R.y + 42} size={100} color={p.primary} id={`${uid}-r`} p={p} />
        <rect x={R.x + 200} y={R.y + 52} width={142} height={20} rx={10} fill={shade(p.primary, 0.15)} opacity={0.75} />
        <rect x={R.x + 200} y={R.y + 88} width={100} height={14} rx={7} fill={bar} />
        {result.label && (
          <text x={R.x + 200} y={R.y + 138} fontFamily={p.sans} fontWeight={700} fontSize={22} fill={shade(p.primary, 0.45)}>
            {result.label.length > 11 ? result.label.slice(0, 10) + '…' : result.label}
          </text>
        )}

        {/* rows: one per source, echoing its icon */}
        {pad(sources, 3).map((s, i) => {
          const ry = R.y + 186 + i * 58
          return (
            <g key={i}>
              <rect x={R.x + 24} y={ry} width={176} height={46} rx={14} fill={tint(p.primary, 0.93)} />
              <LibIcon name={s.icon} x={R.x + 36} y={ry + 8} size={30} color={acc[i % acc.length]} id={`${uid}-row${i}`} p={p} />
              <rect x={R.x + 80} y={ry + 17} width={98 - i * 14} height={12} rx={6} fill={bar} />
            </g>
          )
        })}

        {/* mini chart */}
        <rect x={R.x + 214} y={R.y + 186} width={132} height={162} rx={18} fill="#FFFFFF" stroke={tint(p.primary, 0.88)} strokeWidth={1.5} />
        {[0.28, 0.4, 0.55, 0.72, 0.92].map((v, i) => {
          const bh = v * 116
          return <rect key={i} x={R.x + 228 + i * 22} y={R.y + 334 - bh} width={15} height={bh} rx={4} fill={mix(tint(p.primary, 0.55), '#B8ADF8', i / 4)} opacity={0.9} />
        })}

        {[acc[1], acc[0], acc[2]].map((c, i) => (
          <rect key={i} x={R.x + 24 + i * 108} y={R.y + 368} width={96} height={30} rx={15} fill={tint(c, 0.72)} />
        ))}
      </Glass>
      </g>
    </Artboard>
  )
}

/* ------------------------------------------------------------------ */
/* Inspect: a thread of cards, one under the magnifier                 */
/* ------------------------------------------------------------------ */

export function Inspect({ p, items, w, h, uid }: Props) {
  const acc = accents(p)
  const list = pad(items, 1)
  const bar = tint(p.primary, 0.76)
  const dx = 70
  const cards = [
    { x: 330 + dx, y: 64, w: 470 },
    { x: 430 + dx, y: 192, w: 470, hi: true },
    { x: 470 + dx, y: 322, w: 360 },
    { x: 510 + dx, y: 432, w: 420 },
  ]
  const ch = 104
  const lens = { cx: 830 + dx, cy: 252, r: 132 }
  return (
    <Artboard w={w} h={h}>
      <Defs p={p} uid={uid} />

      {/* thread line */}
      <path
        transform={`translate(${dx} 0)`}
        d={`M380 ${64 + ch} V${192 + ch / 2 - 18} q0 18 18 18 H430 M410 ${192 + ch / 2} V${322 + ch / 2 - 18} q0 18 18 18 H470 M450 ${322 + ch / 2} V${432 + ch / 2 - 18} q0 18 18 18 H510`}
        fill="none"
        stroke={mix(p.primary, '#7CC4FF', 0.5)}
        strokeWidth={2.4}
        opacity={0.6}
      />

      {cards.map((c, i) => {
        const color = i === 1 ? acc[2] : acc[i % 2 === 0 ? 0 : 3]
        return (
          <Glass key={i} x={c.x} y={c.y} w={c.w} h={ch} r={30} uid={uid} p={p} hi={c.hi}>
            <circle cx={c.x + 56} cy={c.y + ch / 2} r={34} fill={tint(color, 0.8)} />
            <LibIcon name="user" x={c.x + 30} y={c.y + ch / 2 - 26} size={52} color={color} id={`${uid}-a${i}`} p={p} />
            <Bars x={c.x + 112} y={c.y + 34} widths={[c.w * 0.5, c.w * 0.32]} color={c.hi ? tint(acc[2], 0.6) : bar} h={14} gap={10} />
            {i === 1 && <LibIcon name="triangle-alert" x={c.x + c.w - 92} y={c.y + 22} size={60} color="#EF6B6B" id={`${uid}-flag`} p={p} />}
            {i === 3 && <LibIcon name="circle-alert" x={c.x + c.w - 74} y={c.y + 20} size={44} color="#EF6B6B" id={`${uid}-flag2`} p={p} />}
          </Glass>
        )
      })}

      {/* magnifier */}
      <line x1={lens.cx + lens.r * 0.74} y1={lens.cy + lens.r * 0.74} x2={lens.cx + lens.r * 1.36} y2={lens.cy + lens.r * 1.3} stroke={`url(#${uid}-lens)`} strokeWidth={30} strokeLinecap="round" />
      <circle cx={lens.cx} cy={lens.cy} r={lens.r} fill="#FFFFFF" fillOpacity={0.22} stroke={`url(#${uid}-lens)`} strokeWidth={14} filter={`url(#${uid}-soft)`} />
      <circle cx={lens.cx} cy={lens.cy} r={lens.r - 14} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.7} />
      <path d={`M${lens.cx - lens.r * 0.62} ${lens.cy - lens.r * 0.2} A ${lens.r * 0.66} ${lens.r * 0.66} 0 0 1 ${lens.cx - lens.r * 0.14} ${lens.cy - lens.r * 0.64}`} fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" opacity={0.8} />

      {/* speech bubble with the subject */}
      <g transform="translate(40 30) scale(0.86)" {...tag(0, items.length)}>
      <g filter={`url(#${uid}-soft)`}>
        <path d="M 165 290 C 160 270, 168 258, 176 250 C 120 230, 95 190, 100 150 C 108 80, 175 40, 255 40 C 345 40, 410 95, 410 165 C 410 240, 345 288, 255 290 C 230 290, 205 286, 188 280 C 182 290, 175 296, 165 290 Z" fill={`url(#${uid}-bubble)`} />
      </g>
      <circle cx={255} cy={162} r={78} fill="#FFFFFF" opacity={0.95} />
      <LibIcon name={list[0].icon} x={205} y={112} size={100} color={p.primary} id={`${uid}-bub`} p={p} />
      </g>
    </Artboard>
  )
}
