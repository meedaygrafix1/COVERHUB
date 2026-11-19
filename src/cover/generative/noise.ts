import { rng } from '../../lib/random'

/**
 * Seeded 2D gradient (Perlin) noise. Returns values roughly in [-1, 1].
 * Deterministic for a seed, so a design reproduces exactly from its config.
 */
export function makeNoise(seed: number) {
  const r = rng(seed ^ 0x9e3779b9)
  const perm = new Uint8Array(512)
  const p = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[p[i], p[j]] = [p[j], p[i]]
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]

  const grad = (h: number, x: number, y: number) => {
    switch (h & 7) {
      case 0: return x + y
      case 1: return -x + y
      case 2: return x - y
      case 3: return -x - y
      case 4: return x
      case 5: return -x
      case 6: return y
      default: return -y
    }
  }
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  const noise2 = (x: number, y: number) => {
    const xi = Math.floor(x) & 255
    const yi = Math.floor(y) & 255
    const xf = x - Math.floor(x)
    const yf = y - Math.floor(y)
    const u = fade(xf)
    const v = fade(yf)
    const aa = perm[perm[xi] + yi]
    const ab = perm[perm[xi] + yi + 1]
    const ba = perm[perm[xi + 1] + yi]
    const bb = perm[perm[xi + 1] + yi + 1]
    return lerp(lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u), lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u), v) * 1.4
  }

  /** Fractal sum of octaves: more organic than a single layer. */
  const fbm = (x: number, y: number, octaves = 3) => {
    let sum = 0
    let amp = 0.5
    let f = 1
    for (let o = 0; o < octaves; o++) {
      sum += amp * noise2(x * f, y * f)
      f *= 2
      amp *= 0.5
    }
    return sum / 0.875
  }

  return { noise2, fbm }
}

export type Noise = ReturnType<typeof makeNoise>
