import { SANS_FAMILY } from './fonts'

export interface Word {
  text: string
  hl: boolean
}

export interface FitOptions {
  text: string
  maxWidth: number
  maxLines: number
  maxSize: number
  minSize: number
  weight?: number
  family?: string
  /** letter spacing in em */
  tracking?: number
  lineHeight?: number
  uppercase?: boolean
}

export interface FitResult {
  lines: Word[][]
  fontSize: number
  lineHeight: number
  tracking: number
  weight: number
  /** text needed truncation even at minSize */
  truncated: boolean
  /** text had to shrink below 80% of maxSize */
  shrunk: boolean
  height: number
  width: number
}

let ctx: CanvasRenderingContext2D | null = null
function context(): CanvasRenderingContext2D {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d')!
  return ctx
}

const widthCache = new Map<string, number>()

export function measure(text: string, size: number, weight = 600, family = SANS_FAMILY, tracking = 0): number {
  const key = `${weight}|${size}|${family}|${tracking}|${text}`
  const hit = widthCache.get(key)
  if (hit !== undefined) return hit
  const c = context()
  c.font = `${weight} ${size}px "${family}"`
  const w = c.measureText(text).width + Math.max(0, text.length - 1) * tracking * size
  if (widthCache.size > 5000) widthCache.clear()
  widthCache.set(key, w)
  return w
}

/** Split text into words, honouring `*highlighted phrases*`. */
export function parseWords(text: string, uppercase = false): Word[] {
  const words: Word[] = []
  let hl = false
  let buf = ''
  const flush = () => {
    if (buf) words.push({ text: uppercase ? buf.toUpperCase() : buf, hl })
    buf = ''
  }
  for (const ch of text.replace(/\s+/g, ' ').trim()) {
    if (ch === '*') {
      flush()
      hl = !hl
    } else if (ch === ' ') {
      flush()
    } else {
      buf += ch
    }
  }
  flush()
  return words
}

export const stripMarks = (t: string) => t.replace(/\*/g, '')

function wrap(words: Word[], width: number, m: (s: string) => number): Word[][] {
  const lines: Word[][] = []
  let line: Word[] = []
  for (const w of words) {
    const candidate = [...line, w].map((x) => x.text).join(' ')
    if (line.length && m(candidate) > width) {
      lines.push(line)
      line = [w]
    } else {
      line.push(w)
    }
  }
  if (line.length) lines.push(line)
  return lines
}

const lineText = (l: Word[]) => l.map((w) => w.text).join(' ')

/**
 * Fit text into a box: shrink until it fits in maxLines, balance line lengths,
 * and truncate with an ellipsis as a last resort.
 */
export function fitText(o: FitOptions): FitResult {
  const weight = o.weight ?? 600
  const family = o.family ?? SANS_FAMILY
  const tracking = o.tracking ?? -0.02
  const lhRatio = o.lineHeight ?? 1.12
  const words = parseWords(o.text, o.uppercase)
  const base = { tracking, weight, truncated: false, shrunk: false }
  if (!words.length) return { ...base, lines: [], fontSize: o.maxSize, lineHeight: o.maxSize * lhRatio, height: 0, width: 0 }

  for (let size = Math.round(o.maxSize); size >= o.minSize; size -= 1) {
    const m = (s: string) => measure(s, size, weight, family, tracking)
    if (words.some((w) => m(w.text) > o.maxWidth)) continue
    const lines = wrap(words, o.maxWidth, m)
    if (lines.length <= o.maxLines) {
      // balance: find narrowest width that keeps the same line count
      let lo = o.maxWidth * 0.45
      let hi = o.maxWidth
      let best = lines
      if (lines.length > 1) {
        for (let i = 0; i < 12; i++) {
          const mid = (lo + hi) / 2
          if (words.some((w) => m(w.text) > mid)) {
            lo = mid
            continue
          }
          const trial = wrap(words, mid, m)
          if (trial.length <= lines.length) {
            best = trial
            hi = mid
          } else lo = mid
        }
      }
      const lh = size * lhRatio
      return {
        ...base,
        lines: best,
        fontSize: size,
        lineHeight: lh,
        shrunk: size < o.maxSize * 0.8,
        height: best.length * lh,
        width: Math.max(...best.map((l) => m(lineText(l)))),
      }
    }
  }

  // Truncate at minimum size
  const size = o.minSize
  const m = (s: string) => measure(s, size, weight, family, tracking)
  const all = wrap(words, o.maxWidth, m)
  const lines = all.slice(0, o.maxLines)
  const last = lines[lines.length - 1]
  if (last) {
    while (last.length > 1 && m(lineText(last) + '…') > o.maxWidth) last.pop()
    const lw = last[last.length - 1]
    let t = lw.text
    while (t.length > 1 && m(lineText(last.slice(0, -1).concat({ text: t + '…', hl: lw.hl }))) > o.maxWidth) t = t.slice(0, -1)
    last[last.length - 1] = { text: t + '…', hl: lw.hl }
  }
  const lh = size * lhRatio
  return {
    ...base,
    lines,
    fontSize: size,
    lineHeight: lh,
    truncated: true,
    shrunk: true,
    height: lines.length * lh,
    width: Math.max(...lines.map((l) => m(lineText(l)))),
  }
}
