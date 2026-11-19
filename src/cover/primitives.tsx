import type { ReactNode } from 'react'
import { shade, tint } from '../lib/color'
import type { FitResult } from '../lib/text'
import type { Palette } from './palette'

/** Shared <defs> every cover needs: shadows, glows, logo gradient. */
export function SharedDefs({ p }: { p: Palette }) {
  const sc = p.cardsMode === 'dark' ? '#000000' : shade(p.primary, 0.35)
  const so = p.cardsMode === 'dark' ? 0.45 : 0.13
  return (
    <defs>
      <filter id={p.ids.shadow} x="-30%" y="-30%" width="160%" height="180%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor={sc} floodOpacity={so} />
      </filter>
      <filter id={p.ids.shadowLg} x="-30%" y="-30%" width="160%" height="180%">
        <feDropShadow dx="0" dy="22" stdDeviation="26" floodColor={sc} floodOpacity={so * 1.25} />
      </filter>
      <radialGradient id={p.ids.glow} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={p.primary} stopOpacity={p.cardsMode === 'dark' ? 0.55 : 0.28} />
        <stop offset="1" stopColor={p.primary} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={p.ids.logo} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={p.primary} />
        <stop offset="1" stopColor={p.primaryBright} />
      </linearGradient>
      <linearGradient id={p.ids.hub} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={p.primary} />
        <stop offset="1" stopColor={p.primaryBright} />
      </linearGradient>
      <linearGradient id={p.ids.title} x1="0" y1="0" x2="1" y2="0.4">
        <stop offset="0" stopColor={p.mode === 'dark' ? '#FFFFFF' : p.primaryDeep} />
        <stop offset="1" stopColor={p.mode === 'dark' ? tint(p.primary, 0.55) : p.primaryBright} />
      </linearGradient>
    </defs>
  )
}

/** The Spidra spider mark: gradient disc, thread from top edge, small spider. */
export function SpiderMark({
  x,
  y,
  size,
  p,
  disc = true,
  ink: inkColor,
  discFill,
}: {
  x: number
  y: number
  size: number
  p: Palette
  disc?: boolean
  ink?: string
  discFill?: string
}) {
  const s = size / 40
  const ink = inkColor ?? (disc ? '#FFFFFF' : p.primary)
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {disc && <circle cx={20} cy={20} r={20} fill={discFill ?? `url(#${p.ids.logo})`} />}
      <path d="M20 0 V16.5" stroke={ink} strokeWidth={1.5} />
      <g fill="none" stroke={ink} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16.8 20.6 C15 19 13 19 11.6 20.6" />
        <path d="M16.6 22.6 C14.6 22.2 12.8 23 11.8 24.8" />
        <path d="M23.2 20.6 C25 19 27 19 28.4 20.6" />
        <path d="M23.4 22.6 C25.4 22.2 27.2 23 28.2 24.8" />
        <path d="M17.6 24.4 C16.3 25.3 15.8 26.6 16 28" />
        <path d="M22.4 24.4 C23.7 25.3 24.2 26.6 24 28" />
      </g>
      <ellipse cx={20} cy={22.6} rx={3.7} ry={3.3} fill={ink} />
      <circle cx={20} cy={18.6} r={2.1} fill={ink} />
    </g>
  )
}

export function Logo({
  x,
  y,
  size = 36,
  p,
  wordmark,
  customLogo,
  anchor = 'start',
  inverted,
}: {
  x: number
  y: number
  size?: number
  p: Palette
  wordmark: string
  customLogo?: string
  anchor?: 'start' | 'middle'
  /** white disc + brand spider, for saturated brand backgrounds */
  inverted?: boolean
}) {
  const fs = size * 0.68
  const gap = size * 0.3
  // approximate wordmark width so the lockup can be centred without measuring
  const textW = wordmark.length * fs * 0.56
  const total = size + gap + textW
  const ox = anchor === 'middle' ? x - total / 2 : x
  return (
    <g>
      {customLogo ? (
        <image href={customLogo} x={ox} y={y} width={size} height={size} preserveAspectRatio="xMidYMid meet" />
      ) : (
        <SpiderMark x={ox} y={y} size={size} p={p} discFill={inverted ? '#FFFFFF' : undefined} ink={inverted ? p.primary : undefined} />
      )}
      {wordmark && (
        <text
          x={ox + size + gap}
          y={y + size / 2}
          dominantBaseline="central"
          fontFamily={p.sans}
          fontWeight={500}
          fontSize={fs}
          letterSpacing={-0.2}
          fill={p.ink}
        >
          {wordmark}
        </text>
      )}
    </g>
  )
}

export function Card({
  x,
  y,
  w,
  h,
  p,
  r = 16,
  lg,
  fill,
  stroke,
  dashed,
  children,
}: {
  x: number
  y: number
  w: number
  h: number
  p: Palette
  r?: number
  lg?: boolean
  fill?: string
  stroke?: string
  dashed?: boolean
  children?: ReactNode
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={r}
        fill={fill ?? p.card}
        stroke={stroke ?? p.cardStroke}
        strokeWidth={1.5}
        strokeDasharray={dashed ? '6 6' : undefined}
        filter={dashed ? undefined : `url(#${lg ? p.ids.shadowLg : p.ids.shadow})`}
      />
      {children}
    </g>
  )
}

export function Bar({ x, y, w, h = 10, fill }: { x: number; y: number; w: number; h?: number; fill: string }) {
  return <rect x={x} y={y} width={Math.max(h, w)} height={h} rx={h / 2} fill={fill} />
}

export function DashBox({ x, y, w, h, p, r = 10 }: { x: number; y: number; w: number; h: number; p: Palette; r?: number }) {
  return <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke={p.cardStrokeStrong} strokeWidth={1.6} strokeDasharray="6 5" />
}

export function WindowDots({ x, y, p, gap = 13, r = 3.6 }: { x: number; y: number; p: Palette; gap?: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={p.bar} />
      <circle cx={x + gap} cy={y} r={r} fill={p.barMid} />
      <circle cx={x + gap * 2} cy={y} r={r} fill={p.primary} />
    </g>
  )
}

/** Smooth cubic connector from (x1,y1) to (x2,y2) with optional arrowhead. */
export function Connector({
  x1,
  y1,
  x2,
  y2,
  p,
  arrow = true,
  dashed,
  vertical,
  width = 2.4,
  color,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  p: Palette
  arrow?: boolean
  dashed?: boolean
  vertical?: boolean
  width?: number
  color?: string
}) {
  const c = color ?? p.line
  const d = vertical
    ? `M${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`
    : `M${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`
  const a = 9
  const head = vertical
    ? `M${x2 - a} ${y2 - a} L${x2} ${y2} L${x2 + a} ${y2 - a}`
    : `M${x2 - a} ${y2 - a} L${x2} ${y2} L${x2 - a} ${y2 + a}`
  return (
    <g fill="none" stroke={c} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} strokeDasharray={dashed ? '2 7' : undefined} />
      {arrow && <path d={head} />}
    </g>
  )
}

/** The central Spidra “engine” node used in pipeline diagrams. */
export function Hub({ cx, cy, r = 34, p, label }: { cx: number; cy: number; r?: number; p: Palette; label?: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r * 2.4} fill={`url(#${p.ids.glow})`} />
      <circle cx={cx} cy={cy} r={r * 1.5} fill={p.cardsMode === 'dark' ? '#16284A' : tint(p.primary, 0.88)} opacity={0.9} />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${p.ids.hub})`} filter={`url(#${p.ids.shadow})`} />
      <SpiderMark x={cx - r} y={cy - r} size={r * 2} p={p} disc={false} ink="#FFFFFF" />
      {label && (
        <text x={cx} y={cy + r * 1.5 + 26} textAnchor="middle" fontFamily={p.sans} fontWeight={600} fontSize={15} fill={p.muted}>
          {label}
        </text>
      )}
    </g>
  )
}

export function Pill({
  x,
  y,
  text,
  p,
  fill,
  color,
  size = 15,
  mono,
  stroke,
  padX = 14,
  h,
}: {
  x: number
  y: number
  text: string
  p: Palette
  fill?: string
  color?: string
  size?: number
  mono?: boolean
  stroke?: string
  padX?: number
  h?: number
}) {
  const height = h ?? size * 2
  const w = text.length * size * (mono ? 0.62 : 0.58) + padX * 2
  return (
    <g>
      <rect x={x} y={y} width={w} height={height} rx={height / 2} fill={fill ?? p.cardAlt} stroke={stroke} strokeWidth={stroke ? 1.4 : 0} />
      <text
        x={x + w / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={mono ? p.mono : p.sans}
        fontWeight={mono ? 500 : 600}
        fontSize={size}
        fill={color ?? p.primary}
      >
        {text}
      </text>
    </g>
  )
}

/** Render a FitResult as SVG text, with highlight colouring per word. */
export function TextBlock({
  fit,
  x,
  y,
  anchor = 'start',
  fill,
  hlFill,
  family,
}: {
  fit: FitResult
  x: number
  y: number
  anchor?: 'start' | 'middle' | 'end'
  fill: string
  hlFill: string
  family: string
}) {
  const { lines, fontSize, lineHeight, tracking, weight } = fit
  // place the first baseline so the cap height sits at `y`
  const first = y + (lineHeight - fontSize) / 2 + fontSize * 0.8
  return (
    <text
      fontFamily={family}
      fontWeight={weight}
      fontSize={fontSize}
      letterSpacing={tracking * fontSize}
      textAnchor={anchor}
      fill={fill}
      xmlSpace="preserve"
      style={{ whiteSpace: 'pre' }}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} y={first + i * lineHeight}>
          {line.map((w, j) => (
            <tspan key={j} fill={w.hl ? hlFill : undefined}>
              {w.text + (j < line.length - 1 ? ' ' : '')}
            </tspan>
          ))}
        </tspan>
      ))}
    </text>
  )
}
