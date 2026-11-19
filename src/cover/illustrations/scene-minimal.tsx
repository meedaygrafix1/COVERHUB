import { mix, shade, tint } from '../../lib/color'
import type { SceneItem } from '../../lib/types'
import type { Palette } from '../palette'
import { LibIcon } from './scene'
import { AH, AW, accents, Artboard, Bars, Chip, Defs, Glass, pad, tag, type Props } from './scene-illustrated'

/**
 * Minimal illustration motifs. Fewer elements than Merge/Inspect/Hub, lots of
 * air, and one idea each. All share the pastel glass language and the
 * 1120 × 560 artboard.
 */

/**
 * Two icons merged into one mark: the main icon, with a second topic set in
 * a white disc on its lower-right corner. Works for any pair in the library.
 */
export function MergedIcon({ x, y, size, main, sub, color, subColor, id, p, subTag = {} }: { x: number; y: number; size: number; main: string; sub?: string; color: string; subColor: string; id: string; p: Palette; subTag?: object }) {
  const r = size * 0.24
  // Kubai badged variants (database-lock, globe-search…) already use the lower-right corner
  const corner = /-(plus|check|alert|search|clock|cog|minus|x|off|heart|star|down|lock|info|up|right|sync|sparkle|bolt)$/.test(main)
  const bx = x + size * 0.86
  const by = corner ? y + size * 0.1 : y + size * 0.86
  return (
    <g>
      <LibIcon name={main} x={x} y={y} size={size} color={color} id={`${id}-m`} p={p} />
      {sub && (
        <g {...subTag}>
          <circle cx={bx} cy={by + 4} r={r + 6} fill={shade(p.primary, 0.3)} opacity={0.08} />
          <circle cx={bx} cy={by} r={r + 6} fill="#FFFFFF" />
          <circle cx={bx} cy={by} r={r} fill={tint(subColor, 0.86)} />
          <LibIcon name={sub} x={bx - r * 0.72} y={by - r * 0.72} size={r * 1.44} color={subColor} id={`${id}-s`} p={p} />
        </g>
      )}
    </g>
  )
}

function Label({ x, y, text, p, size = 24, anchor = 'middle' }: { x: number; y: number; text: string; p: Palette; size?: number; anchor?: 'start' | 'middle' }) {
  if (!text) return null
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="central" fontFamily={p.sans} fontWeight={600} fontSize={size} fill={shade(p.primary, 0.55)} opacity={0.8}>
      {text.length > 18 ? text.slice(0, 17) + '…' : text}
    </text>
  )
}

function Spark({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const k = r * 0.28
  return <path d={`M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r}Z`} fill={fill} />
}

/* ------------------------------------------------------------------ */
/* Focus: one hero tile, a merged badge, two quiet satellites          */
/* ------------------------------------------------------------------ */

export function Focus({ p, items, w, h, uid }: Props) {
  const acc = accents(p)
  const [hero, badge, a, b] = [items[0], items[1], items[2], items[3]]
  const cx = AW / 2
  const cy = AH / 2
  const T = 270
  return (
    <Artboard w={w} h={h}>
      <Defs p={p} uid={uid} />
      <circle cx={cx} cy={cy} r={250} fill={`url(#${uid}-halo)`} />
      <circle cx={cx} cy={cy} r={215} fill="none" stroke={tint(p.primary, 0.8)} strokeWidth={1.6} strokeDasharray="2 10" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={262} fill="none" stroke={tint(p.primary, 0.86)} strokeWidth={1.4} opacity={0.7} />
      <g {...tag(0, items.length)}>
        <Glass x={cx - T / 2} y={cy - T / 2} w={T} h={T} r={70} uid={uid} p={p}>
          <MergedIcon x={cx - 88} y={cy - 92} size={176} main={hero.icon} sub={badge?.icon} color={p.primary} subColor={acc[1]} id={`${uid}-f`} p={p} subTag={tag(1, items.length)} />
        </Glass>
      </g>
      {[a, b].map((it, i) =>
        it ? (
          <g key={i} {...tag(i + 2, items.length)}>
            <circle cx={i ? cx + 262 * 0.8 : cx - 262 * 0.86} cy={i ? cy + 262 * 0.55 : cy - 262 * 0.42} r={52} fill="#FFFFFF" filter={`url(#${uid}-soft)`} />
            <LibIcon name={it.icon} x={(i ? cx + 262 * 0.8 : cx - 262 * 0.86) - 32} y={(i ? cy + 262 * 0.55 : cy - 262 * 0.42) - 32} size={64} color={acc[i ? 2 : 3]} id={`${uid}-sat${i}`} p={p} />
          </g>
        ) : null,
      )}
      <Spark cx={cx + 200} cy={cy - 170} r={16} fill={acc[2]} />
      <Spark cx={cx - 225} cy={cy + 150} r={11} fill={acc[1]} />
      <circle cx={cx + 280} cy={cy - 40} r={6} fill={tint(p.primary, 0.5)} />
    </Artboard>
  )
}

/* ------------------------------------------------------------------ */
/* Pair: A → B                                                         */
/* ------------------------------------------------------------------ */

export function Pair({ p, items, w, h, uid }: Props) {
  const acc = accents(p)
  const [a, b] = pad(items, 2)
  const T = 230
  const y = 140
  const ax = 220
  const bx = AW - 220 - T
  const mid = AW / 2
  return (
    <Artboard w={w} h={h}>
      <Defs p={p} uid={uid} />
      <circle cx={bx + T / 2} cy={y + T / 2} r={220} fill={`url(#${uid}-halo)`} />
      <line x1={ax + T + 24} y1={y + T / 2} x2={bx - 24} y2={y + T / 2} stroke={tint(p.primary, 0.55)} strokeWidth={2.4} strokeDasharray="3 10" strokeLinecap="round" />
      <g {...tag(0, items.length)}>
        <Glass x={ax} y={y} w={T} h={T} r={60} uid={uid} p={p}>
          <LibIcon name={a.icon} x={ax + 45} y={y + 45} size={140} color={acc[3]} id={`${uid}-a`} p={p} />
        </Glass>
      </g>
      <g {...tag(1, items.length)}>
        <Glass x={bx} y={y} w={T} h={T} r={60} uid={uid} p={p} hi>
          <LibIcon name={b.icon} x={bx + 45} y={y + 45} size={140} color={p.primary} id={`${uid}-b`} p={p} />
        </Glass>
      </g>
      <circle cx={mid} cy={y + T / 2} r={40} fill="#FFFFFF" filter={`url(#${uid}-soft)`} />
      <circle cx={mid} cy={y + T / 2} r={30} fill={tint(p.primary, 0.88)} />
      <LibIcon name="arrow-right" x={mid - 21} y={y + T / 2 - 21} size={42} color={p.primary} id={`${uid}-arrow`} p={p} />
      <Label x={ax + T / 2} y={y + T + 52} text={a.label} p={p} />
      <Label x={bx + T / 2} y={y + T + 52} text={b.label} p={p} />
      <Spark cx={bx + T + 30} cy={y - 10} r={14} fill={acc[2]} />
    </Artboard>
  )
}

/* ------------------------------------------------------------------ */
/* Stack: fanned cards, the hero on top                                */
/* ------------------------------------------------------------------ */

export function Stack({ p, items, w, h, uid }: Props) {
  const acc = accents(p)
  const list = pad(items, 3)
  const cw = 420
  const ch = 250
  const cx = AW / 2
  const top = 130
  const fan = [
    { r: -9, dx: -110, dy: 26, i: 2 },
    { r: 7, dx: 110, dy: 18, i: 1 },
    { r: 0, dx: 0, dy: 0, i: 0 },
  ]
  const bar = tint(p.primary, 0.78)
  return (
    <Artboard w={w} h={h}>
      <Defs p={p} uid={uid} />
      <ellipse cx={cx} cy={top + ch / 2 + 30} rx={360} ry={180} fill={`url(#${uid}-halo)`} />
      {fan.map(({ r, dx, dy, i }) => {
        const x = cx - cw / 2 + dx
        const y = top + dy
        const it = list[i]
        const front = i === 0
        const c = front ? p.primary : acc[i]
        return (
          <g key={i} transform={`rotate(${r} ${x + cw / 2} ${y + ch / 2})`} {...tag(i, items.length)}>
            <Glass x={x} y={y} w={cw} h={ch} r={34} uid={uid} p={p} hi={front}>
              <Chip x={x + 32} y={y + 32} s={front ? 132 : 104} icon={it.icon} color={c} id={`${uid}-c${i}`} p={p} r={30} />
              {front ? (
                <g>
                  <rect x={x + 190} y={y + 52} width={170} height={18} rx={9} fill={shade(p.primary, 0.12)} opacity={0.7} />
                  <Bars x={x + 190} y={y + 90} widths={[130, 96]} color={bar} h={12} gap={16} />
                  <Label x={x + 32} y={y + ch - 42} text={it.label} p={p} size={26} anchor="start" />
                  {[acc[1], acc[2]].map((col, k) => (
                    <rect key={k} x={x + cw - 150 + k * 66} y={y + ch - 58} width={56} height={30} rx={15} fill={tint(col, 0.72)} />
                  ))}
                </g>
              ) : (
                <Bars x={x + 160} y={y + 50} widths={[160, 110]} color={bar} h={12} gap={16} />
              )}
            </Glass>
          </g>
        )
      })}
      <Spark cx={cx + 290} cy={top - 20} r={16} fill={acc[2]} />
      <Spark cx={cx - 300} cy={top + ch + 70} r={11} fill={acc[1]} />
    </Artboard>
  )
}

/* ------------------------------------------------------------------ */
/* Grid: topic tiles, one picked                                       */
/* ------------------------------------------------------------------ */

export function Grid({ p, items, w, h, uid }: Props) {
  const acc = accents(p)
  const n = items.length >= 5 ? 6 : 4
  const list = pad(items, n)
  const cols = n === 6 ? 3 : 2
  const rows = 2
  const T = 168
  const g = 30
  const gw = cols * T + (cols - 1) * g
  const gh = rows * T + (rows - 1) * g
  const x0 = (AW - gw) / 2
  const y0 = (AH - gh) / 2
  return (
    <Artboard w={w} h={h}>
      <Defs p={p} uid={uid} />
      <ellipse cx={AW / 2} cy={AH / 2} rx={gw * 0.75} ry={gh * 0.7} fill={`url(#${uid}-halo)`} />
      {list.map((it, i) => {
        const x = x0 + (i % cols) * (T + g)
        const y = y0 + Math.floor(i / cols) * (T + g)
        const hero = i === 0
        return (
          <g key={i} {...tag(i, items.length)}>
          <Glass x={x} y={y} w={T} h={T} r={44} uid={uid} p={p} hi={hero}>
            <LibIcon name={it.icon} x={x + T * 0.24} y={y + T * 0.2} size={T * 0.52} color={hero ? p.primary : acc[(i % 3) + 1]} id={`${uid}-g${i}`} p={p} />
            {it.label && <Label x={x + T / 2} y={y + T - 26} text={it.label} p={p} size={18} />}
          </Glass>
          </g>
        )
      })}
      <LibIcon name="mouse-pointer-click" x={x0 + T - 30} y={y0 + T - 34} size={64} color={shade(p.primary, 0.2)} id={`${uid}-cursor`} p={p} />
      <Spark cx={x0 + gw + 46} cy={y0 - 10} r={15} fill={acc[2]} />
    </Artboard>
  )
}

/* ------------------------------------------------------------------ */
/* Window: an app window holding the topic, a merged badge floating    */
/* ------------------------------------------------------------------ */

export function Window({ p, items, w, h, uid }: Props) {
  const acc = accents(p)
  const list = pad(items, 4)
  const W = 600
  const H = 380
  const x = (AW - W) / 2 - 40
  const y = (AH - H) / 2 + 10
  const bar = tint(p.primary, 0.78)
  return (
    <Artboard w={w} h={h}>
      <Defs p={p} uid={uid} />
      <ellipse cx={x + W / 2} cy={y + H / 2} rx={420} ry={240} fill={`url(#${uid}-halo)`} />
      <Glass x={x} y={y} w={W} h={H} r={34} uid={uid} p={p}>
        <path d={`M${x + 34} ${y} H${x + W - 34} a34 34 0 0 1 34 34 V${y + 52} H${x} V${y + 34} a34 34 0 0 1 34 -34Z`} fill={tint(p.primary, 0.86)} />
        {[0, 1, 2].map((k) => (
          <circle key={k} cx={x + 34 + k * 22} cy={y + 26} r={6.5} fill={[acc[1], acc[0], acc[2]][k]} opacity={0.55} />
        ))}
        <rect x={x + 120} y={y + 14} width={W - 190} height={24} rx={12} fill="#FFFFFF" opacity={0.8} />
        <g {...tag(0, items.length)}>
          <rect x={x + 32} y={y + 84} width={190} height={170} rx={30} fill={tint(p.primary, 0.9)} />
          <LibIcon name={list[0].icon} x={x + 62} y={y + 104} size={130} color={p.primary} id={`${uid}-w0`} p={p} />
        </g>
        <rect x={x + 252} y={y + 98} width={240} height={20} rx={10} fill={shade(p.primary, 0.12)} opacity={0.65} />
        <Bars x={x + 252} y={y + 140} widths={[300, 250, 190]} color={bar} h={12} gap={18} />
        {list.slice(2, 4).map((it, i) => (
          <g key={i} {...tag(i + 2, items.length)}>
            <rect x={x + 32 + i * 196} y={y + 280} width={180} height={64} rx={18} fill={tint(acc[i + 1], 0.9)} />
            <LibIcon name={it.icon} x={x + 46 + i * 196} y={y + 292} size={40} color={acc[i + 1]} id={`${uid}-w${i + 2}`} p={p} />
            <rect x={x + 98 + i * 196} y={y + 306} width={90 - i * 14} height={12} rx={6} fill={tint(acc[i + 1], 0.6)} />
          </g>
        ))}
        <rect x={x + 424} y={y + 280} width={144} height={64} rx={18} fill={`url(#${uid}-bubble)`} opacity={0.9} />
      </Glass>
      {/* floating merged badge */}
      <g {...tag(1, items.length)}>
      <circle cx={x + W + 20} cy={y + 30} r={96} fill="#FFFFFF" filter={`url(#${uid}-soft)`} />
      <circle cx={x + W + 20} cy={y + 30} r={96} fill="none" stroke={tint(p.primary, 0.85)} strokeWidth={1.5} />
      <MergedIcon x={x + W + 20 - 58} y={y + 30 - 62} size={116} main={list[1].icon} color={acc[2]} subColor={acc[1]} id={`${uid}-wb`} p={p} />
      </g>
      <LibIcon name="mouse-pointer-click" x={x + 170} y={y + 220} size={60} color={shade(p.primary, 0.2)} id={`${uid}-cursor`} p={p} />
      <circle cx={x - 40} cy={y + H - 20} r={8} fill={mix(p.primary, '#FFFFFF', 0.5)} />
      <Spark cx={x + W + 130} cy={y + H - 40} r={15} fill={acc[1]} />
    </Artboard>
  )
}

export type { SceneItem }
