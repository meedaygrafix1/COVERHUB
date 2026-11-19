import { shade, tint } from '../../lib/color'
import { measure } from '../../lib/text'
import type { CompElement, CompLink, Composition, SceneItem } from '../../lib/types'
import type { Palette } from '../palette'
import { SpiderMark } from '../primitives'
import { accents, Artboard, AW, AH, Bars, Defs, Glass, Node } from './scene-illustrated'
import { MergedIcon } from './scene-minimal'

/**
 * Compose: a free-form arrangement of the scene's library icons, laid out by
 * Claude (or edited by hand) from the same parts as the illustrated layouts:
 * glass cards, icon tiles, pills, the brand hub, sparkles and glowing
 * connectors. Two icons can be combined into one mark (a main icon with a
 * corner badge). Drawn on the 1120 × 560 artboard and scaled into the slot.
 */

interface Props {
  p: Palette
  items: SceneItem[]
  composition: Composition
  w: number
  h: number
  uid: string
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Text that shrinks, then truncates, to fit `maxW`. */
function Fit({ x, y, text, size, maxW, p, anchor = 'start', color, weight = 600 }: { x: number; y: number; text: string; size: number; maxW: number; p: Palette; anchor?: 'start' | 'middle'; color: string; weight?: number }) {
  if (!text || maxW < 24) return null
  let s = size
  let t = text
  while (s > 13 && measure(t, s, weight) > maxW) s -= 1
  while (t.length > 3 && measure(t, s, weight) > maxW) t = t.slice(0, -2).trimEnd() + '…'
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="central" fontFamily={p.sans} fontWeight={weight} fontSize={s} fill={color}>
      {t}
    </text>
  )
}

function Spark({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const k = r * 0.28
  return <path d={`M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r}Z`} fill={fill} />
}

/** An icon on a tinted square, with an optional second icon merged in as a badge. */
function IconMark({ x, y, s, icon, badge, color, badgeColor, id, p }: { x: number; y: number; s: number; icon: string; badge?: string; color: string; badgeColor: string; id: string; p: Palette }) {
  const inner = s * 0.64
  return (
    <g>
      <rect x={x} y={y} width={s} height={s} rx={s * 0.24} fill={tint(color, 0.86)} />
      <MergedIcon x={x + (s - inner) / 2} y={y + (s - inner) / 2} size={inner} main={icon} sub={badge} color={color} subColor={badgeColor} id={id} p={p} />
    </g>
  )
}

/** Where a connector leaves `a` and enters `b`: facing edges, curved. */
function linkPath(a: CompElement, b: CompElement) {
  const acx = a.x + a.w / 2
  const acy = a.y + a.h / 2
  const bcx = b.x + b.w / 2
  const bcy = b.y + b.h / 2
  const dx = bcx - acx
  const dy = bcy - acy
  let s: [number, number], e: [number, number], c1: [number, number], c2: [number, number]
  if (Math.abs(dx) >= Math.abs(dy) * 0.8) {
    s = [dx > 0 ? a.x + a.w : a.x, acy]
    e = [dx > 0 ? b.x : b.x + b.w, bcy]
    const k = (e[0] - s[0]) * 0.5
    c1 = [s[0] + k, s[1]]
    c2 = [e[0] - k, e[1]]
  } else {
    s = [acx, dy > 0 ? a.y + a.h : a.y]
    e = [bcx, dy > 0 ? b.y : b.y + b.h]
    const k = (e[1] - s[1]) * 0.5
    c1 = [s[0], s[1] + k]
    c2 = [e[0], e[1] - k]
  }
  // bezier midpoint (t = 0.5)
  const mid: [number, number] = [(s[0] + 3 * c1[0] + 3 * c2[0] + e[0]) / 8, (s[1] + 3 * c1[1] + 3 * c2[1] + e[1]) / 8]
  return { d: `M${s[0]} ${s[1]} C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${e[0]} ${e[1]}`, mid }
}

function Link({ link, byId, p }: { link: CompLink; byId: Map<string, CompElement>; p: Palette }) {
  const a = byId.get(link.from)
  const b = byId.get(link.to)
  if (!a || !b) return null
  const color = accents(p)[a.accent % 4]
  const { d, mid } = linkPath(a, b)
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={2.6} opacity={0.75} strokeLinecap="round" strokeDasharray={link.dashed ? '2 9' : undefined} />
      {link.node && <Node cx={mid[0]} cy={mid[1]} color={color} r={8} />}
    </g>
  )
}

function Element({ e, items, p, uid }: { e: CompElement; items: SceneItem[]; p: Palette; uid: string }) {
  const acc = accents(p)
  const color = acc[e.accent % 4]
  const badgeColor = acc[(e.accent + 1) % 4]
  const it = e.item >= 0 ? items[e.item] : undefined
  const badge = e.badge >= 0 ? items[e.badge]?.icon : undefined
  const id = `${uid}-${e.id}`
  const tagProps = it ? { 'data-scene-item': e.item } : {}
  const { x, y, w, h } = e
  const cx = x + w / 2
  const cy = y + h / 2
  const ink = shade(p.primary, 0.5)
  const halo = e.emphasis ? <ellipse cx={cx} cy={cy} rx={w * 0.78} ry={h * 0.78} fill={`url(#${uid}-halo)`} /> : null

  switch (e.kind) {
    case 'spark':
      return <Spark cx={cx} cy={cy} r={Math.min(w, h) / 2} fill={color} />

    case 'brand': {
      const r = Math.min(52, Math.min(w, h) * 0.26)
      const s = Math.min(w, h) * 0.62
      return (
        <g>
          <circle cx={cx} cy={cy} r={Math.max(w, h) * 0.75} fill={`url(#${uid}-halo)`} />
          <rect x={x} y={y + 16} width={w} height={h} rx={r} fill={tint(p.primary, 0.75)} />
          <Glass x={x} y={y} w={w} h={h} r={r} uid={uid} p={p}>
            <SpiderMark x={cx - s / 2} y={cy - s / 2} size={s} p={p} />
          </Glass>
        </g>
      )
    }

    case 'pill': {
      if (!it) return null
      const ph = clamp(h, 36, 70)
      const py = cy - ph / 2
      const is = ph * 0.56
      const font = ph * 0.42
      return (
        <g {...tagProps}>
          <rect x={x} y={py} width={w} height={ph} rx={ph / 2} fill="#FFFFFF" fillOpacity={0.92} stroke="#FFFFFF" strokeWidth={2} filter={`url(#${uid}-soft)`} />
          <MergedIcon x={x + ph * 0.32} y={cy - is / 2} size={is} main={it.icon} sub={badge} color={color} subColor={badgeColor} id={id} p={p} />
          <Fit x={x + ph * 0.32 + is + ph * 0.22} y={cy} text={it.label} size={font} maxW={w - ph * 1.3 - is * 0.6} p={p} color={ink} />
        </g>
      )
    }

    case 'tile': {
      if (!it) return null
      const round = Math.abs(w - h) < Math.min(w, h) * 0.25
      const m = Math.min(w, h)
      const s = m * 0.6
      return (
        <g {...tagProps}>
          {halo}
          {round ? (
            <circle cx={cx} cy={cy} r={m / 2} fill="#FFFFFF" filter={`url(#${uid}-soft)`} />
          ) : (
            <Glass x={x} y={y} w={w} h={h} r={m * 0.28} uid={uid} p={p} hi={e.emphasis} />
          )}
          <MergedIcon x={cx - s / 2} y={cy - s / 2} size={s} main={it.icon} sub={badge} color={color} subColor={badgeColor} id={id} p={p} />
        </g>
      )
    }

    case 'card': {
      const r = Math.min(36, Math.min(w, h) * 0.22)
      const pad = clamp(Math.min(w, h) * 0.16, 14, 30)
      const label = it?.label ?? ''
      const barColor = e.emphasis ? tint(acc[2], 0.6) : tint(p.primary, 0.78)
      const horizontal = w >= h * 1.5
      let body
      if (horizontal) {
        const s = it ? Math.min(h - pad * 2, w * 0.36) : 0
        const tx = x + pad + (it ? s + pad * 0.9 : 0)
        const tw = x + w - pad - tx
        const font = clamp(h * 0.15, 15, 26)
        const barH = clamp(h * 0.085, 8, 14)
        const gap = barH * 1.1
        const widths = [0.85, 0.6, 0.72].slice(0, e.lines).map((f) => tw * f)
        const blockH = (label ? font * 1.5 : 0) + widths.length * (barH + gap) - (widths.length ? gap : 0)
        const top = cy - blockH / 2
        body = (
          <g>
            {it && <IconMark x={x + pad} y={cy - s / 2} s={s} icon={it.icon} badge={badge} color={color} badgeColor={badgeColor} id={id} p={p} />}
            {label && <Fit x={tx} y={top + font * 0.6} text={label} size={font} maxW={tw} p={p} color={ink} weight={700} />}
            <Bars x={tx} y={top + (label ? font * 1.5 : 0)} widths={widths} color={barColor} h={barH} gap={gap} />
          </g>
        )
      } else {
        const font = clamp(w * 0.085, 15, 26)
        const barH = clamp(w * 0.04, 8, 13)
        const gap = barH * 1.1
        const textH = (label ? font * 1.6 : 0) + Math.min(e.lines, 2) * (barH + gap)
        const s = it ? Math.max(0, Math.min(w - pad * 2, h - pad * 2 - textH) * 0.92) : 0
        const top = y + (h - (s + (s ? pad * 0.6 : 0) + textH)) / 2
        const widths = [0.62, 0.42].slice(0, Math.min(e.lines, 2)).map((f) => w * f)
        const ty = top + s + (s ? pad * 0.6 : 0)
        body = (
          <g>
            {it && s > 20 && <IconMark x={cx - s / 2} y={top} s={s} icon={it.icon} badge={badge} color={color} badgeColor={badgeColor} id={id} p={p} />}
            {label && <Fit x={cx} y={ty + font * 0.7} text={label} size={font} maxW={w - pad * 2} p={p} color={ink} anchor="middle" weight={700} />}
            {widths.map((bw, i) => (
              <rect key={i} x={cx - bw / 2} y={ty + (label ? font * 1.6 : 0) + i * (barH + gap)} width={bw} height={barH} rx={barH / 2} fill={barColor} opacity={i ? 0.7 : 0.95} />
            ))}
          </g>
        )
      }
      return (
        <g {...tagProps}>
          {halo}
          <Glass x={x} y={y} w={w} h={h} r={r} uid={uid} p={p} hi={e.emphasis}>
            {body}
          </Glass>
        </g>
      )
    }
  }
}

export function Compose({ p, items, composition, w, h, uid }: Props) {
  // the array order is the layer order (back to front); hidden parts and their connections are skipped
  const shown = composition.elements.filter((e) => !e.hidden)
  const byId = new Map(shown.map((e) => [e.id, e]))
  return (
    <Artboard w={w} h={h}>
      <Defs p={p} uid={uid} />
      {/* the artboard's exact frame: the editor maps pointer positions to artboard units with it */}
      <rect data-comp-artboard x={0} y={0} width={AW} height={AH} fill="none" pointerEvents="none" />
      {/* a soft wash behind the parts; on dark fields it would read as a pale blob */}
      {p.cardsMode !== 'dark' && <ellipse cx={AW / 2} cy={AH / 2 + 10} rx={470} ry={240} fill={tint(p.primary, 0.9)} opacity={0.4} />}
      {composition.links.map((l, i) => (
        <Link key={i} link={l} byId={byId} p={p} />
      ))}
      {shown.map((e) => (
        // data-comp-el + the exact-size hit box let the canvas pick, outline and drag this part
        <g key={e.id} data-comp-el={e.id}>
          <rect data-comp-box x={e.x} y={e.y} width={e.w} height={e.h} fill="transparent" />
          <Element e={e} items={items} p={p} uid={uid} />
        </g>
      ))}
    </Artboard>
  )
}
