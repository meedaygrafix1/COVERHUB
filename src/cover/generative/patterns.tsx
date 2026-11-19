import type { ReactNode } from 'react'
import { mix } from '../../lib/color'
import type { Noise } from './noise'
import type { ArtConfig, ArtPattern } from './types'

export interface PatternCtx {
  w: number
  h: number
  /** unit scale: sizes are authored for a 1200px-wide canvas */
  k: number
  r: () => number
  n: Noise
  colors: string[]
  base: string
  a: ArtConfig
  uid: string
  /** side of the square that covers the canvas at any rotation */
  D: number
  ox: number
  oy: number
  /** is a point (in the unrotated frame) on screen after rotation? */
  visible: (x: number, y: number, pad: number) => boolean
}

const f = (v: number) => Math.round(v * 10) / 10
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const pickColor = (c: PatternCtx, v: number) => c.colors[Math.min(c.colors.length - 1, Math.max(0, Math.floor(clamp01(v) * c.colors.length)))]

/** Group subpaths by colour so a pattern draws as a handful of <path>s. */
function buckets() {
  const m = new Map<string, string[]>()
  return {
    add: (color: string, d: string) => {
      const arr = m.get(color)
      if (arr) arr.push(d)
      else m.set(color, [d])
    },
    entries: () => [...m.entries()].map(([c, parts]) => [c, parts.join('')] as const),
  }
}

/* ---------------- 1. Mesh glow ---------------- */
function mesh(c: PatternCtx): ReactNode {
  const { w, h, r, a, k } = c
  const n = 4 + Math.round(a.density * 6)
  const big = Math.max(w, h)
  return (
    <g>
      <defs>
        <filter id={`${c.uid}-mesh`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={(46 + a.softness * 70) * k} />
        </filter>
      </defs>
      <g filter={`url(#${c.uid}-mesh)`}>
        {Array.from({ length: n }, (_, i) => (
          <circle
            key={i}
            cx={f(w * (0.32 + r() * 0.72))}
            cy={f(h * (r() * 1.1 - 0.05))}
            r={f((0.12 + a.scale * 0.26) * big * (0.6 + r() * 0.7))}
            fill={c.colors[i % c.colors.length]}
            opacity={f(0.6 + 0.4 * a.intensity)}
          />
        ))}
      </g>
    </g>
  )
}

/* ---------------- 2. Flow field ---------------- */
function flow(c: PatternCtx): ReactNode {
  const { r, n, a, k, D, ox, oy } = c
  const count = Math.round(120 + a.density * 520)
  const steps = 36 + Math.round(a.scale * 50)
  const freq = (0.0009 + (1 - a.scale) * 0.0038) / k
  const step = 6 * k
  const b = buckets()
  for (let i = 0; i < count; i++) {
    let x = ox + r() * D
    let y = oy + r() * D
    if (!c.visible(x, y, steps * step)) continue
    const colorV = (n.noise2(x * freq * 0.35 + 50, y * freq * 0.35) + 1) / 2
    let d = `M${f(x)} ${f(y)}`
    for (let s = 0; s < steps; s++) {
      const ang = n.fbm(x * freq, y * freq, 2) * Math.PI * 2.2
      x += Math.cos(ang) * step
      y += Math.sin(ang) * step
      d += `L${f(x)} ${f(y)}`
    }
    b.add(pickColor(c, colorV), d)
  }
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={f((0.7 + a.intensity * 2) * k)} opacity={f(0.55 + 0.45 * a.intensity)}>
      {b.entries().map(([col, d]) => (
        <path key={col} d={d} stroke={col} />
      ))}
    </g>
  )
}

/* ---------------- 3. Topography (marching squares) ---------------- */
function contours(c: PatternCtx): ReactNode {
  const { w, h, n, a, k } = c
  const cell = (9 + (1 - a.density) * 12) * k
  const freq = (0.0011 + (1 - a.scale) * 0.0036) / k
  const rot = (a.rotation * Math.PI) / 180
  const cos = Math.cos(rot)
  const sin = Math.sin(rot)
  const cols = Math.ceil(w / cell) + 1
  const rows = Math.ceil(h / cell) + 1
  const field: number[] = new Array(cols * rows)
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const x = i * cell - w / 2
      const y = j * cell - h / 2
      field[j * cols + i] = n.fbm((x * cos - y * sin) * freq, (x * sin + y * cos) * freq, 3)
    }
  const L = 6 + Math.round(a.density * 10)
  const paths: ReactNode[] = []
  for (let l = 0; l < L; l++) {
    const t = -0.7 + (1.4 * (l + 0.5)) / L
    let d = ''
    for (let j = 0; j < rows - 1; j++)
      for (let i = 0; i < cols - 1; i++) {
        const v0 = field[j * cols + i]
        const v1 = field[j * cols + i + 1]
        const v2 = field[(j + 1) * cols + i + 1]
        const v3 = field[(j + 1) * cols + i]
        const idx = (v0 > t ? 8 : 0) | (v1 > t ? 4 : 0) | (v2 > t ? 2 : 0) | (v3 > t ? 1 : 0)
        if (idx === 0 || idx === 15) continue
        const x = i * cell
        const y = j * cell
        const lerp = (p: number, q: number) => (t - p) / (q - p)
        const top: [number, number] = [x + cell * lerp(v0, v1), y]
        const right: [number, number] = [x + cell, y + cell * lerp(v1, v2)]
        const bottom: [number, number] = [x + cell * lerp(v3, v2), y + cell]
        const left: [number, number] = [x, y + cell * lerp(v0, v3)]
        const seg = (p: [number, number], q: [number, number]) => `M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}`
        switch (idx) {
          case 1: case 14: d += seg(left, bottom); break
          case 2: case 13: d += seg(bottom, right); break
          case 3: case 12: d += seg(left, right); break
          case 4: case 11: d += seg(top, right); break
          case 6: case 9: d += seg(top, bottom); break
          case 7: case 8: d += seg(left, top); break
          case 5: d += seg(left, top) + seg(bottom, right); break
          case 10: d += seg(top, right) + seg(left, bottom); break
        }
      }
    const major = l % 4 === 0
    paths.push(
      <path key={l} d={d} stroke={pickColor(c, l / L)} strokeWidth={f((major ? 1.8 : 0.9) * (0.7 + a.intensity) * k)} opacity={major ? 1 : 0.75} />,
    )
  }
  return (
    <g fill="none" strokeLinecap="round">
      {paths}
    </g>
  )
}

/* ---------------- 4. Halftone ---------------- */
function halftone(c: PatternCtx): ReactNode {
  const { n, a, k, D, ox, oy } = c
  const s = (12 + (1 - a.density) * 22) * k
  const freq = (0.0014 + (1 - a.scale) * 0.0036) / k
  const b = buckets()
  const gamma = 1.7 - 1.2 * a.intensity
  for (let gy = oy; gy < oy + D; gy += s)
    for (let gx = ox; gx < ox + D; gx += s) {
      if (!c.visible(gx, gy, s)) continue
      const v = Math.pow(clamp01((n.fbm(gx * freq, gy * freq, 2) + 1) / 2), gamma)
      const rad = s * 0.5 * v
      if (rad < 0.7 * k) continue
      b.add(pickColor(c, v), `M${f(gx - rad)} ${f(gy)}a${f(rad)} ${f(rad)} 0 1 0 ${f(rad * 2)} 0a${f(rad)} ${f(rad)} 0 1 0 ${f(-rad * 2)} 0`)
    }
  return (
    <g>
      {b.entries().map(([col, d]) => (
        <path key={col} d={d} fill={col} />
      ))}
    </g>
  )
}

/* ---------------- 5. Isometric blocks ---------------- */
function isometric(c: PatternCtx): ReactNode {
  const { w, h, n, a, k } = c
  const s = (22 + a.scale * 48) * k
  const dx = s * 0.866
  const dy = s * 0.5
  const threshold = 1 - (0.2 + a.density * 0.62)
  const nodes: ReactNode[] = []
  const rows = Math.ceil(h / dy) + 4
  const cols = Math.ceil(w / (2 * dx)) + 2
  for (let j = -2; j < rows; j++)
    for (let i = -1; i < cols; i++) {
      const v = (n.fbm(i * 0.21 * (1.25 - a.scale), j * 0.12 * (1.25 - a.scale), 2) + 1) / 2
      if (v < threshold) continue
      const lift = Math.floor(((v - threshold) / (1 - threshold)) * 3) * s * 0.5
      const x = i * 2 * dx + (j & 1 ? dx : 0)
      const y = j * dy - lift
      const base = pickColor(c, ((i * 7 + j * 3) % 10) / 10 < a.intensity * 0.6 ? v : 0)
      const top = mix(base, '#FFFFFF', 0.5)
      const right = mix(base, '#000000', 0.22)
      nodes.push(
        <g key={`${i}-${j}`}>
          <path d={`M${f(x)} ${f(y - dy)}L${f(x + dx)} ${f(y)}L${f(x)} ${f(y + dy)}L${f(x - dx)} ${f(y)}Z`} fill={top} />
          <path d={`M${f(x - dx)} ${f(y)}L${f(x)} ${f(y + dy)}L${f(x)} ${f(y + dy + s)}L${f(x - dx)} ${f(y + s)}Z`} fill={base} />
          <path d={`M${f(x)} ${f(y + dy)}L${f(x + dx)} ${f(y)}L${f(x + dx)} ${f(y + s)}L${f(x)} ${f(y + dy + s)}Z`} fill={right} />
        </g>,
      )
    }
  return <g>{nodes}</g>
}

/* ---------------- 6. Orbits ---------------- */
function rings(c: PatternCtx): ReactNode {
  const { w, h, r, a, k } = c
  const centers = Array.from({ length: 1 + Math.round(a.density * 2) }, (_, i) =>
    i === 0 ? [w * (0.66 + r() * 0.14), h * (0.4 + r() * 0.2)] : [r() * w, r() * h],
  )
  const maxR = Math.hypot(w, h) * 0.75
  const step = (8 + (1 - a.density) * 24) * k * (0.6 + a.scale)
  const nodes: ReactNode[] = []
  centers.forEach(([cx, cy], ci) => {
    let i = 0
    for (let rad = step; rad < maxR; rad += step, i++) {
      const C = 2 * Math.PI * rad
      const solid = r() < 0.35
      const segs = 1 + Math.floor(r() * 4)
      const dash = solid ? undefined : `${f((C / segs) * (0.25 + r() * 0.6))} ${f((C / segs) * (0.15 + r() * 0.5))}`
      nodes.push(
        <circle
          key={`${ci}-${i}`}
          cx={f(cx)}
          cy={f(cy)}
          r={f(rad)}
          fill="none"
          stroke={c.colors[(i + ci) % c.colors.length]}
          strokeWidth={f((0.8 + r() * 2.6 * a.intensity) * k)}
          strokeDasharray={dash}
          strokeLinecap="round"
          opacity={f(Math.max(0.15, 1 - rad / maxR) * (0.5 + a.intensity * 0.5))}
          transform={`rotate(${f(r() * 360)} ${f(cx)} ${f(cy)})`}
        />,
      )
    }
    nodes.push(<circle key={`core${ci}`} cx={f(cx)} cy={f(cy)} r={f(step * 0.45)} fill={c.colors[0]} />)
  })
  return <g>{nodes}</g>
}

/* ---------------- 7. Ridgelines ---------------- */
function ridges(c: PatternCtx): ReactNode {
  const { w, h, n, a, k } = c
  const L = 14 + Math.round(a.density * 40)
  const top = h * 0.12
  const spacing = (h * 0.86 - top) / L
  const amp = (18 + a.intensity * 70) * k
  const freq = (0.0035 + (1 - a.scale) * 0.01) / k
  const cx = w * 0.64
  const spread = w * (0.14 + a.scale * 0.22)
  const stepX = 6 * k
  const nodes: ReactNode[] = []
  for (let i = 0; i < L; i++) {
    const y0 = top + i * spacing + spacing
    let d = `M${f(-10)} ${f(y0)}`
    for (let x = -10; x <= w + 10; x += stepX) {
      const env = Math.exp(-(((x - cx) / spread) ** 2))
      const dyv = -Math.abs(n.fbm(x * freq, i * 0.33, 3)) * amp * (0.2 + env * 2.2)
      d += `L${f(x)} ${f(y0 + dyv)}`
    }
    d += `L${f(w + 10)} ${f(h + 10)}L-10 ${f(h + 10)}Z`
    nodes.push(<path key={i} d={d} fill={c.base} stroke={pickColor(c, i / L)} strokeWidth={f((1 + a.intensity * 1.4) * k)} strokeLinejoin="round" />)
  }
  return <g>{nodes}</g>
}

/* ---------------- 8. Truchet tiles ---------------- */
function truchet(c: PatternCtx): ReactNode {
  const { n, a, k, D, ox, oy, r } = c
  const s = (26 + a.scale * 70) * k
  const hs = s / 2
  const b = buckets()
  const freq = 0.0016 / k
  for (let y = oy; y < oy + D; y += s)
    for (let x = ox; x < ox + D; x += s) {
      if (!c.visible(x + hs, y + hs, s)) continue
      if (r() > 0.55 + a.density * 0.45) continue
      const flip = r() < 0.5
      const d = flip
        ? `M${f(x + hs)} ${f(y)}A${f(hs)} ${f(hs)} 0 0 1 ${f(x)} ${f(y + hs)}M${f(x + hs)} ${f(y + s)}A${f(hs)} ${f(hs)} 0 0 1 ${f(x + s)} ${f(y + hs)}`
        : `M${f(x + hs)} ${f(y)}A${f(hs)} ${f(hs)} 0 0 0 ${f(x + s)} ${f(y + hs)}M${f(x + hs)} ${f(y + s)}A${f(hs)} ${f(hs)} 0 0 0 ${f(x)} ${f(y + hs)}`
      b.add(pickColor(c, (n.noise2(x * freq, y * freq) + 1) / 2), d)
    }
  return (
    <g fill="none" strokeLinecap="round" strokeWidth={f(s * (0.07 + a.intensity * 0.16))}>
      {b.entries().map(([col, d]) => (
        <path key={col} d={d} stroke={col} />
      ))}
    </g>
  )
}

/* ---------------- 9. Bauhaus grid ---------------- */
function bauhaus(c: PatternCtx): ReactNode {
  const { r, a, k, D, ox, oy } = c
  const s = (70 + a.scale * 110) * k
  const nodes: ReactNode[] = []
  const shapes = ['circle', 'half', 'quarter', 'split', 'triangle', 'ring', 'stripes', 'diamond'] as const
  let id = 0
  for (let y = oy; y < oy + D; y += s)
    for (let x = ox; x < ox + D; x += s) {
      if (!c.visible(x + s / 2, y + s / 2, s)) continue
      if (r() > 0.3 + a.density * 0.65) continue
      const shape = shapes[Math.floor(r() * shapes.length)]
      const c1 = c.colors[Math.floor(r() * c.colors.length)]
      const c2 = c.colors[Math.floor(r() * c.colors.length)]
      const rot = Math.floor(r() * 4) * 90
      const tf = `translate(${f(x)} ${f(y)}) rotate(${rot} ${f(s / 2)} ${f(s / 2)})`
      const pad = s * 0.06
      const S = s - pad * 2
      const key = id++
      const tile = r() < a.intensity * 0.5 ? <rect x={pad} y={pad} width={f(S)} height={f(S)} fill={c2} opacity={0.35} /> : null
      let el: ReactNode = null
      switch (shape) {
        case 'circle': el = <circle cx={f(s / 2)} cy={f(s / 2)} r={f(S * 0.42)} fill={c1} />; break
        case 'half': el = <path d={`M${f(pad)} ${f(s / 2)}A${f(S / 2)} ${f(S / 2)} 0 0 1 ${f(s - pad)} ${f(s / 2)}Z`} fill={c1} />; break
        case 'quarter': el = <path d={`M${f(pad)} ${f(pad)}L${f(s - pad)} ${f(pad)}A${f(S)} ${f(S)} 0 0 1 ${f(pad)} ${f(s - pad)}Z`} fill={c1} />; break
        case 'split': el = (
          <>
            <rect x={pad} y={pad} width={f(S)} height={f(S / 2)} fill={c1} />
            <circle cx={f(s / 2)} cy={f(s / 2)} r={f(S * 0.25)} fill={c2} />
          </>
        ); break
        case 'triangle': el = <path d={`M${f(pad)} ${f(s - pad)}L${f(s - pad)} ${f(s - pad)}L${f(pad)} ${f(pad)}Z`} fill={c1} />; break
        case 'ring': el = <circle cx={f(s / 2)} cy={f(s / 2)} r={f(S * 0.36)} fill="none" stroke={c1} strokeWidth={f(S * 0.13)} />; break
        case 'stripes': el = (
          <>
            {[0, 1, 2, 3].map((i2) => (
              <rect key={i2} x={pad} y={f(pad + (i2 * S) / 4 + S / 16)} width={f(S)} height={f(S / 8)} rx={f(S / 16)} fill={c1} />
            ))}
          </>
        ); break
        case 'diamond': el = <path d={`M${f(s / 2)} ${f(pad)}L${f(s - pad)} ${f(s / 2)}L${f(s / 2)} ${f(s - pad)}L${f(pad)} ${f(s / 2)}Z`} fill={c1} />; break
      }
      nodes.push(
        <g key={key} transform={tf}>
          {tile}
          {el}
        </g>,
      )
    }
  return <g>{nodes}</g>
}

/* ---------------- 10. Constellation ---------------- */
function constellation(c: PatternCtx): ReactNode {
  const { w, h, r, a, k } = c
  const N = 36 + Math.round(a.density * 150)
  const pts = Array.from({ length: N }, () => [r() * w, r() * h, r()] as const)
  const maxD = (60 + a.scale * 120) * k
  const lines: ReactNode[] = []
  for (let i = 0; i < N; i++)
    for (let j = i + 1; j < N; j++) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1])
      if (d > maxD) continue
      lines.push(
        <line
          key={`${i}-${j}`}
          x1={f(pts[i][0])}
          y1={f(pts[i][1])}
          x2={f(pts[j][0])}
          y2={f(pts[j][1])}
          stroke={c.colors[0]}
          strokeWidth={f((0.6 + a.intensity * 0.9) * k)}
          opacity={f((1 - d / maxD) * (0.25 + 0.6 * a.intensity))}
        />,
      )
    }
  return (
    <g>
      {lines}
      {pts.map(([x, y, z], i) => {
        const hub = z > 0.95
        const rad = (hub ? 4.5 : 1.4 + z * 2.4) * k
        return (
          <g key={i}>
            {hub && <circle cx={f(x)} cy={f(y)} r={f(rad * 3)} fill="none" stroke={c.colors[1 % c.colors.length]} strokeWidth={f(1.2 * k)} opacity={0.6} />}
            <circle cx={f(x)} cy={f(y)} r={f(rad)} fill={hub ? c.colors[0] : c.colors[(i % (c.colors.length - 1)) + 1]} />
          </g>
        )
      })}
    </g>
  )
}

/* ---------------- 11. Glass blobs ---------------- */
function blobPath(cx: number, cy: number, R: number, n: Noise, seed: number) {
  const N = 10
  const pts = Array.from({ length: N }, (_, i) => {
    const t = (i / N) * Math.PI * 2
    const rr = R * (0.78 + 0.42 * n.noise2(Math.cos(t) * 0.9 + seed, Math.sin(t) * 0.9 + seed))
    return [cx + Math.cos(t) * rr, cy + Math.sin(t) * rr]
  })
  // closed Catmull-Rom → cubic Béziers
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % N]
    const p3 = pts[(i + 2) % N]
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`
  }
  return d + 'Z'
}

function blobs(c: PatternCtx): ReactNode {
  const { w, h, r, n, a, uid } = c
  const count = 2 + Math.round(a.density * 4)
  const big = Math.max(w, h)
  const items = Array.from({ length: count }, (_, i) => {
    const R = (0.1 + a.scale * 0.22) * big * (0.6 + r() * 0.6)
    const cx = w * (0.45 + r() * 0.5)
    const cy = h * (0.15 + r() * 0.7)
    return { R, cx, cy, d: blobPath(cx, cy, R, n, i * 3.1 + 1), c1: c.colors[i % c.colors.length], c2: c.colors[(i + 1) % c.colors.length] }
  })
  const orbs = Array.from({ length: Math.round(a.density * 8) }, () => ({ x: r() * w, y: r() * h, R: (6 + r() * 22) * c.k }))
  return (
    <g>
      <defs>
        {items.map((it, i) => (
          <linearGradient key={i} id={`${uid}-bl${i}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={mix(it.c1, '#FFFFFF', 0.25)} />
            <stop offset="1" stopColor={it.c2} />
          </linearGradient>
        ))}
        <radialGradient id={`${uid}-gloss`} cx="0.35" cy="0.3" r="0.6">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
      </defs>
      {items.map((it, i) => (
        <g key={i}>
          <path d={it.d} fill={`url(#${uid}-bl${i})`} opacity={f(0.7 + 0.3 * a.intensity)} />
          <path d={it.d} fill={`url(#${uid}-gloss)`} />
        </g>
      ))}
      {orbs.map((o, i) => (
        <g key={`o${i}`}>
          <circle cx={f(o.x)} cy={f(o.y)} r={f(o.R)} fill={c.colors[i % c.colors.length]} opacity={0.85} />
          <circle cx={f(o.x)} cy={f(o.y)} r={f(o.R)} fill={`url(#${uid}-gloss)`} />
        </g>
      ))}
    </g>
  )
}

/* ---------------- 12. Sunburst ---------------- */
function rays(c: PatternCtx): ReactNode {
  const { w, h, r, a, uid } = c
  const fx = w * (0.68 + r() * 0.12)
  const fy = h * (0.42 + r() * 0.16)
  const N = 16 + Math.round(a.density * 56)
  const R = Math.hypot(w, h)
  const span = (Math.PI * 2) / N
  const wedges: string[] = []
  for (let i = 0; i < N; i += 2) {
    const t0 = i * span
    const t1 = t0 + span * (0.4 + a.scale * 0.6)
    wedges.push(`M${f(fx)} ${f(fy)}L${f(fx + Math.cos(t0) * R)} ${f(fy + Math.sin(t0) * R)}L${f(fx + Math.cos(t1) * R)} ${f(fy + Math.sin(t1) * R)}Z`)
  }
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-core`} cx={f(fx / w)} cy={f(fy / h)} r="0.6" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor={c.colors[1 % c.colors.length]} stopOpacity={0.9} />
          <stop offset="1" stopColor={c.colors[1 % c.colors.length]} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={wedges.join('')} fill={c.colors[0]} opacity={f(0.1 + 0.3 * a.intensity)} />
      <rect width={w} height={h} fill={`url(#${uid}-core)`} opacity={0.6} />
      {[0.08, 0.16, 0.26].map((m, i) => (
        <circle key={i} cx={f(fx)} cy={f(fy)} r={f(Math.min(w, h) * m)} fill="none" stroke={c.colors[0]} strokeWidth={f(1.2 * c.k)} opacity={0.35 - i * 0.08} />
      ))}
      <circle cx={f(fx)} cy={f(fy)} r={f(Math.min(w, h) * 0.03)} fill={c.colors[0]} />
    </g>
  )
}

export const PATTERNS: Record<ArtPattern, (c: PatternCtx) => ReactNode> = {
  mesh,
  flow,
  contours,
  halftone,
  isometric,
  rings,
  ridges,
  truchet,
  bauhaus,
  constellation,
  blobs,
  rays,
}
