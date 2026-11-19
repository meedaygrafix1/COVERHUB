import type { ReactNode } from 'react'
import { getIcon } from '../../library/catalog'
import { measure } from '../../lib/text'
import type { SceneConfig, SceneItem } from '../../lib/types'
import type { Palette } from '../palette'
import { Connector, Hub } from '../primitives'
import { Hub as HubScene, Inspect, Merge } from './scene-illustrated'
import { Focus, Grid, Pair, Stack, Window } from './scene-minimal'
import { Compose } from './scene-compose'

/**
 * Topic scenes: Kubai library icons, picked for the title, composed into one
 * illustration. Every layout lays itself out in the box it is given (w × h),
 * so the same scene fills a wide Showcase slot or a square Split slot.
 */

const KUBAI_VIEWBOX = '0 -3 31 31'
const FALLBACK: SceneItem[] = [{ icon: 'sparkles', label: 'Topic' }]

interface SceneProps {
  p: Palette
  scene: SceneConfig
  w: number
  h: number
  /** unique per rendered cover, keeps icon gradient ids apart */
  uid: string
}

const iconInk = (p: Palette) => (p.cardsMode === 'dark' ? p.primaryBright : p.primary)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** One library icon drawn at (x, y) with side `size`. A soft placeholder shows until it loads. */
export function LibIcon({ name, x, y, size, color, id, p }: { name: string; x: number; y: number; size: number; color: string; id: string; p: Palette }) {
  const d = getIcon(name)
  if (!d) return <rect x={x + size * 0.2} y={y + size * 0.2} width={size * 0.6} height={size * 0.6} rx={size * 0.16} fill={p.bar} opacity={0.55} />
  return (
    <svg
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox={KUBAI_VIEWBOX}
      overflow="visible"
      style={{ color }}
      dangerouslySetInnerHTML={{ __html: d.markup.replace(/__K__/g, id) }}
    />
  )
}

function Tile({ x, y, w, h, r, p, soft, round, children }: { x: number; y: number; w: number; h: number; r: number; p: Palette; soft?: boolean; round?: boolean; children?: ReactNode }) {
  return (
    <g>
      {round ? (
        <circle cx={x + w / 2} cy={y + h / 2} r={w / 2} fill={soft ? p.cardAlt : p.card} stroke={p.cardStroke} strokeWidth={1.5} filter={`url(#${p.ids.shadow})`} />
      ) : (
        <rect x={x} y={y} width={w} height={h} rx={r} fill={soft ? p.cardAlt : p.card} stroke={p.cardStroke} strokeWidth={1.5} filter={`url(#${p.ids.shadow})`} />
      )}
      {children}
    </g>
  )
}

/** Caption that shrinks, then truncates, to fit `maxW`. */
function Caption({ x, y, text, size, maxW, p, anchor = 'middle', color, weight = 600 }: { x: number; y: number; text: string; size: number; maxW: number; p: Palette; anchor?: 'start' | 'middle'; color?: string; weight?: number }) {
  let s = size
  let t = text
  while (s > 11 && measure(t, s, weight) > maxW) s -= 1
  while (t.length > 3 && measure(t, s, weight) > maxW) t = t.slice(0, -2).trimEnd() + '…'
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="central" fontFamily={p.sans} fontWeight={weight} fontSize={s} fill={color ?? p.muted}>
      {t}
    </text>
  )
}

function Sparkle({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const k = r * 0.28
  return <path d={`M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r}Z`} fill={fill} />
}

/* ------------------------------------------------------------------ */
/* Spotlight: hero tile, satellites around it                          */
/* ------------------------------------------------------------------ */

function Spotlight({ p, items, w, h, uid }: { p: Palette; items: SceneItem[]; w: number; h: number; uid: string }) {
  const ink = iconInk(p)
  const m = Math.min(w, h)
  const cx = w / 2
  const cy = h / 2
  const T = Math.min(m * 0.48, w * 0.4)
  const t = T * 0.46
  const spread = clamp(w / h / 1.33, 1, 1.9)
  const spots: [number, number][] = [
    [0.86, -0.6],
    [-0.88, 0.5],
    [-0.8, -0.62],
    [0.9, 0.58],
  ]
  const sats = items.slice(1, 5).map((it, i) => {
    const [ox, oy] = spots[i]
    const sx = clamp(cx + ox * T * spread, t / 2 + 6, w - t / 2 - 6)
    const sy = clamp(cy + oy * T, t / 2 + 6, h - t / 2 - 6)
    return { it, sx, sy }
  })
  const ringR = Math.min(T * 0.92, m / 2 - 4)
  return (
    <g>
      <circle cx={cx} cy={cy} r={T * 1.1} fill={`url(#${p.ids.glow})`} />
      <circle cx={cx} cy={cy} r={ringR} fill="none" stroke={p.cardStroke} strokeWidth={1.5} strokeDasharray="3 7" />
      {sats.map(({ sx, sy }, i) => (
        <line key={i} x1={cx} y1={cy} x2={sx} y2={sy} stroke={p.cardStrokeStrong} strokeWidth={1.6} strokeDasharray="2 6" strokeLinecap="round" />
      ))}
      <g data-scene-item={0}>
        <Tile x={cx - T / 2} y={cy - T / 2} w={T} h={T} r={T * 0.26} p={p}>
          <LibIcon name={items[0].icon} x={cx - T * 0.32} y={cy - T * 0.32} size={T * 0.64} color={ink} id={`${uid}-0`} p={p} />
        </Tile>
      </g>
      {sats.map(({ it, sx, sy }, i) => (
        <g key={i} data-scene-item={i + 1}>
          <Tile x={sx - t / 2} y={sy - t / 2} w={t} h={t} r={t * 0.28} p={p}>
            <LibIcon name={it.icon} x={sx - t * 0.31} y={sy - t * 0.31} size={t * 0.62} color={ink} id={`${uid}-${i + 1}`} p={p} />
          </Tile>
        </g>
      ))}
      <Sparkle cx={cx + T * 0.62} cy={cy + T * 0.62} r={T * 0.07} fill={p.primary} />
      <Sparkle cx={cx - T * 0.66} cy={cy - T * 0.08} r={T * 0.045} fill={p.dot} />
      <circle cx={cx + T * 0.08} cy={cy - T * 0.7} r={T * 0.025} fill={p.dot} />
    </g>
  )
}

/* ------------------------------------------------------------------ */
/* Orbit: round hero, satellites riding two rings                      */
/* ------------------------------------------------------------------ */

function Orbit({ p, items, w, h, uid }: { p: Palette; items: SceneItem[]; w: number; h: number; uid: string }) {
  const ink = iconInk(p)
  const cx = w / 2
  const cy = h / 2
  const ry = Math.min(h / 2 - 8, w * 0.36)
  const rx = Math.min(w / 2 - 8, ry * clamp(w / h, 1, 1.7))
  const H0 = ry * 0.78
  const sat = ry * 0.34
  const rings = [0.68, 1].map((k) => ({ rx: rx * k - sat * 0.2, ry: ry * k - sat * 0.2 }))
  const angles = [-38, 152, 218, 28]
  const sats = items.slice(1, 5).map((it, i) => {
    const ring = rings[i % 2 === 0 ? 1 : 0]
    const a = (angles[i] * Math.PI) / 180
    const sx = clamp(cx + Math.cos(a) * ring.rx, sat / 2 + 4, w - sat / 2 - 4)
    const sy = clamp(cy + Math.sin(a) * ring.ry, sat / 2 + 4, h - sat / 2 - 4)
    return { it, sx, sy }
  })
  return (
    <g>
      <circle cx={cx} cy={cy} r={H0 * 1.35} fill={`url(#${p.ids.glow})`} />
      {rings.map((r, i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={r.rx} ry={r.ry} fill="none" stroke={p.cardStroke} strokeWidth={1.5} strokeDasharray={i ? '2 8' : undefined} />
      ))}
      <circle cx={cx + rings[0].rx} cy={cy} r={4} fill={p.primary} />
      <circle cx={cx - rings[1].rx * 0.7} cy={cy - rings[1].ry * 0.71} r={3} fill={p.dot} />
      <g data-scene-item={0}>
        <Tile x={cx - H0 / 2} y={cy - H0 / 2} w={H0} h={H0} r={0} p={p} round>
          <LibIcon name={items[0].icon} x={cx - H0 * 0.3} y={cy - H0 * 0.3} size={H0 * 0.6} color={ink} id={`${uid}-0`} p={p} />
        </Tile>
      </g>
      {sats.map(({ it, sx, sy }, i) => (
        <g key={i} data-scene-item={i + 1}>
          <Tile x={sx - sat / 2} y={sy - sat / 2} w={sat} h={sat} r={0} p={p} round>
            <LibIcon name={it.icon} x={sx - sat * 0.3} y={sy - sat * 0.3} size={sat * 0.6} color={ink} id={`${uid}-${i + 1}`} p={p} />
          </Tile>
        </g>
      ))}
    </g>
  )
}

/* ------------------------------------------------------------------ */
/* Flow: source → action → output                                      */
/* ------------------------------------------------------------------ */

function Flow({ p, items, w, h, uid }: { p: Palette; items: SceneItem[]; w: number; h: number; uid: string }) {
  const ink = iconInk(p)
  const list = items.slice(0, 4)
  // two items get the brand engine between them
  const slots: (SceneItem | 'hub')[] = list.length === 2 ? [list[0], 'hub', list[1]] : list.length === 1 ? ['hub', list[0]] : list
  const n = slots.length
  const tall = w / h < 1.25

  let T: number
  let pos: { x: number; y: number }[]
  if (tall) {
    // staircase from top-left to bottom-right
    T = Math.min(w, h) * (n > 3 ? 0.22 : 0.27)
    const pad = 12
    const labelH = T * 0.42
    pos = slots.map((_, i) => ({
      x: pad + (i * (w - 2 * pad - T)) / (n - 1),
      y: pad + (i * (h - 2 * pad - T - labelH)) / (n - 1),
    }))
  } else {
    const G = 0.62
    T = Math.min(h * 0.5, w / (n + (n - 1) * G))
    const total = n * T + (n - 1) * T * G
    const x0 = (w - total) / 2
    const y = h / 2 - T / 2 - T * 0.16
    pos = slots.map((_, i) => ({ x: x0 + i * T * (1 + G), y }))
  }
  const font = clamp(T * 0.15, 13, 24)
  const mid = Math.floor(n / 2)

  return (
    <g>
      {pos.slice(0, -1).map((a, i) => {
        const b = pos[i + 1]
        return <Connector key={i} x1={a.x + T + 10} y1={a.y + T / 2} x2={b.x - 12} y2={b.y + T / 2} p={p} width={2.6} />
      })}
      {slots.map((s, i) => {
        const { x, y } = pos[i]
        if (s === 'hub') return <Hub key={i} cx={x + T / 2} cy={y + T / 2} r={T * 0.3} p={p} />
        const hero = i === mid && n >= 3
        return (
          <g key={i} data-scene-item={list.indexOf(s)}>
            {hero && <circle cx={x + T / 2} cy={y + T / 2} r={T * 0.95} fill={`url(#${p.ids.glow})`} />}
            <Tile x={x} y={y} w={T} h={T} r={T * 0.24} p={p} soft={hero}>
              <LibIcon name={s.icon} x={x + T * 0.19} y={y + T * 0.19} size={T * 0.62} color={ink} id={`${uid}-${i}`} p={p} />
            </Tile>
            <Caption x={x + T / 2} y={y + T + T * 0.24} text={s.label} size={font} maxW={T * 1.5} p={p} />
          </g>
        )
      })}
    </g>
  )
}

/* ------------------------------------------------------------------ */
/* Bento: hero tile with its supporting topics                         */
/* ------------------------------------------------------------------ */

function Bento({ p, items, w, h, uid }: { p: Palette; items: SceneItem[]; w: number; h: number; uid: string }) {
  const ink = iconInk(p)
  const list = items.slice(0, 4)
  const n = list.length
  const g = Math.min(w, h) * 0.045
  const r = Math.min(w, h) * 0.065
  type Cell = { x: number; y: number; w: number; h: number }
  const ratio = w / h
  let cells: Cell[]
  const row = (x0: number, y0: number, rw: number, rh: number, k: number): Cell[] => {
    const cw = (rw - g * (k - 1)) / k
    return Array.from({ length: k }, (_, i) => ({ x: x0 + i * (cw + g), y: y0, w: cw, h: rh }))
  }
  const col = (x0: number, y0: number, cw: number, ch: number, k: number): Cell[] => {
    const rh = (ch - g * (k - 1)) / k
    return Array.from({ length: k }, (_, i) => ({ x: x0, y: y0 + i * (rh + g), w: cw, h: rh }))
  }
  if (n === 1) cells = [{ x: 0, y: 0, w, h }]
  else if (ratio > 2.1) {
    // one row; the hero gets more width
    const unit = (w - g * (n - 1)) / (n + 0.6)
    cells = [{ x: 0, y: 0, w: unit * 1.6, h }, ...row(unit * 1.6 + g, 0, w - unit * 1.6 - g, h, n - 1)]
  } else if (ratio < 1.4) {
    // squarish slot: hero across the top, the rest in a row underneath
    const hh = (h - g) * 0.6
    cells = [{ x: 0, y: 0, w, h: hh }, ...row(0, hh + g, w, h - hh - g, n - 1)]
  } else {
    // landscape: hero on the left, the rest stacked on the right
    const hw = (w - g) * 0.56
    cells = [{ x: 0, y: 0, w: hw, h }, ...col(hw + g, 0, w - hw - g, h, n - 1)]
  }

  return (
    <g>
      {list.map((it, i) => {
        const c = cells[i]
        const hero = i === 0
        const short = Math.min(c.w, c.h)
        const pad = short * 0.14
        // wide, low tiles read best as icon + caption side by side
        const sideways = !hero && c.w > c.h * 1.7
        const font = clamp(short * (hero ? 0.1 : sideways ? 0.2 : 0.13), 12, hero ? 26 : 20)
        const showLabel = short > 64 && !!it.label
        let size: number, ix: number, iy: number
        if (sideways) {
          size = c.h - pad * 2
          ix = c.x + pad
          iy = c.y + pad
        } else {
          const labelSpace = showLabel ? font * 2.1 : 0
          size = Math.min(c.w - pad * 2, c.h - pad * 2 - labelSpace) * (hero ? 0.8 : 0.78)
          ix = c.x + (c.w - size) / 2
          iy = c.y + pad + (c.h - pad * 2 - labelSpace - size) / 2
        }
        return (
          <g key={i} data-scene-item={i}>
            <Tile x={c.x} y={c.y} w={c.w} h={c.h} r={r} p={p} soft={hero}>
              {hero && <circle cx={ix + size / 2} cy={iy + size / 2} r={size * 0.72} fill={`url(#${p.ids.glow})`} />}
              <LibIcon name={it.icon} x={ix} y={iy} size={size} color={ink} id={`${uid}-${i}`} p={p} />
              {showLabel &&
                (sideways ? (
                  <Caption x={ix + size + pad * 0.8} y={c.y + c.h / 2} text={it.label} size={font} maxW={c.w - size - pad * 2.8} p={p} anchor="start" />
                ) : hero ? (
                  <Caption x={c.x + pad} y={c.y + c.h - pad - font * 0.3} text={it.label} size={font} maxW={c.w - pad * 2} p={p} anchor="start" color={p.ink} />
                ) : (
                  <Caption x={c.x + c.w / 2} y={c.y + c.h - pad - font * 0.3} text={it.label} size={font} maxW={c.w - pad * 1.4} p={p} />
                ))}
            </Tile>
          </g>
        )
      })}
    </g>
  )
}

/* ------------------------------------------------------------------ */
/* Versus: two tiles facing off                                        */
/* ------------------------------------------------------------------ */

function Versus({ p, items, w, h, uid }: { p: Palette; items: SceneItem[]; w: number; h: number; uid: string }) {
  const ink = iconInk(p)
  const [a, b] = [items[0], items[1] ?? items[0]]
  const T = Math.min(h * 0.6, w * 0.34)
  const gap = T * 0.56
  const cx = w / 2
  const y = h / 2 - T / 2 - T * 0.14
  const lx = cx - gap / 2 - T
  const rx = cx + gap / 2
  const font = clamp(T * 0.14, 13, 26)
  const vr = Math.max(18, T * 0.2)
  return (
    <g>
      <circle cx={lx + T / 2} cy={y + T / 2} r={T * 0.85} fill={`url(#${p.ids.glow})`} />
      <circle cx={rx + T / 2} cy={y + T / 2} r={T * 0.85} fill={`url(#${p.ids.glow})`} />
      {[
        { it: a, x: lx },
        { it: b, x: rx },
      ].map(({ it, x }, i) => (
        <g key={i} data-scene-item={i}>
          <Tile x={x} y={y} w={T} h={T} r={T * 0.24} p={p}>
            <LibIcon name={it.icon} x={x + T * 0.19} y={y + T * 0.19} size={T * 0.62} color={ink} id={`${uid}-${i}`} p={p} />
          </Tile>
          <Caption x={x + T / 2} y={y + T + T * 0.22} text={it.label} size={font} maxW={T * 1.25} p={p} color={p.ink} />
        </g>
      ))}
      <circle cx={cx} cy={y + T / 2} r={vr} fill={`url(#${p.ids.hub})`} filter={`url(#${p.ids.shadow})`} />
      <text x={cx} y={y + T / 2} textAnchor="middle" dominantBaseline="central" fontFamily={p.sans} fontWeight={700} fontSize={vr * 0.78} fill="#FFFFFF" letterSpacing={-0.5}>
        VS
      </text>
    </g>
  )
}

const LAYOUTS = { focus: Focus, pair: Pair, stack: Stack, grid: Grid, window: Window, hub: HubScene, merge: Merge, inspect: Inspect, spotlight: Spotlight, orbit: Orbit, flow: Flow, bento: Bento, versus: Versus }

export function Scene({ p, scene, w, h, uid }: SceneProps) {
  const items = scene.items.length ? scene.items : FALLBACK
  if (scene.style === 'compose') {
    if (scene.composition) return <Compose p={p} items={items} composition={scene.composition} w={w} h={h} uid={uid} />
    // a compose scene without a composition (e.g. a pasted config): fall back to a preset layout
    return <HubScene p={p} items={items} w={w} h={h} uid={uid} />
  }
  const L = LAYOUTS[scene.style] ?? Spotlight
  return <L p={p} items={items} w={w} h={h} uid={uid} />
}

export const SCENE_STYLES: { id: SceneConfig['style']; name: string; hint: string }[] = [
  { id: 'focus', name: 'Focus', hint: 'One hero icon, a second topic merged in as a badge' },
  { id: 'pair', name: 'Pair', hint: 'A → B, two topics side by side' },
  { id: 'stack', name: 'Stack', hint: 'Fanned cards, the hero on top' },
  { id: 'grid', name: 'Grid', hint: 'Topic tiles, one picked' },
  { id: 'window', name: 'Window', hint: 'An app window holding the topic' },
  { id: 'merge', name: 'Merge', hint: 'Sources flowing into one result card' },
  { id: 'inspect', name: 'Inspect', hint: 'A thread of cards under a magnifier' },
  { id: 'hub', name: 'Hub', hint: 'Your brand at the centre of the topics' },
  { id: 'spotlight', name: 'Spotlight', hint: 'Hero icon with its topics around it' },
  { id: 'flow', name: 'Flow', hint: 'Source → action → result' },
  { id: 'bento', name: 'Bento', hint: 'Topic tiles with captions' },
  { id: 'orbit', name: 'Orbit', hint: 'Topics circling the hero' },
  { id: 'versus', name: 'Versus', hint: 'Two things compared' },
  { id: 'compose', name: 'AI composition', hint: 'A custom layout Claude designed for this post' },
]
