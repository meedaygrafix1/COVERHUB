import { embeddedFontCss } from './fonts'

/**
 * Serialize a rendered cover <svg> into a standalone SVG document with the
 * Geist fonts embedded, sized to the requested pixel dimensions.
 */
export async function buildSvgString(svg: SVGSVGElement, width: number, height: number): Promise<string> {
  const clone = svg.cloneNode(true) as SVGSVGElement
  resolveCssColors(svg, clone)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  clone.removeAttribute('class')
  clone.removeAttribute('style')

  const css = await embeddedFontCss()
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = css
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
  defs.appendChild(style)
  clone.insertBefore(defs, clone.firstChild)

  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone)
}

const COLOR_PROPS = ['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color', 'color']
const colorCache = new Map<string, string>()
let probe: CanvasRenderingContext2D | null = null

/** Any CSS colour the browser can compute (color-mix, color(srgb …)) → #rrggbb or rgba(). */
function toPlainColor(css: string): string {
  const hit = colorCache.get(css)
  if (hit) return hit
  probe ??= Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true })
  let out = css
  if (probe) {
    probe.clearRect(0, 0, 1, 1)
    probe.fillStyle = '#000'
    probe.fillStyle = css
    probe.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data
    const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
    out = a === 255 ? hex : a === 0 ? 'transparent' : `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`
  }
  colorCache.set(css, out)
  return out
}

/**
 * Library icons colour themselves with CSS variables and color-mix(), which
 * design tools and some renderers don't understand. Bake the computed colours
 * into the exported copy so the file looks the same everywhere.
 */
function resolveCssColors(live: SVGSVGElement, clone: SVGSVGElement) {
  const src = live.querySelectorAll<SVGElement>('[style]')
  const dst = clone.querySelectorAll<SVGElement>('[style]')
  src.forEach((el, i) => {
    const out = dst[i]
    const style = el.getAttribute('style') ?? ''
    if (!out || !/var\(|color-mix|currentcolor/i.test(style)) return
    const cs = getComputedStyle(el)
    for (const prop of COLOR_PROPS) {
      if (!new RegExp(`(^|;)\s*${prop}\s*:`, 'i').test(style)) continue
      const v = cs.getPropertyValue(prop).trim()
      if (!v || v.startsWith('url(') || v === 'none') continue
      out.style.setProperty(prop, toPlainColor(v))
    }
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not rasterize the cover SVG'))
    img.src = src
  })
}

/** Rasterize an SVG string to a PNG blob at width×height×scale. */
export async function svgToPng(svgString: string, width: number, height: number, scale = 1): Promise<Blob> {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const img = await loadImage(url)
    // embedded web fonts inside an SVG image can settle a frame after load
    await new Promise((r) => setTimeout(r, 60))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png'))
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** Read a File into a data URL plus its natural size. */
export function readImageFile(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.onload = async () => {
      const dataUrl = String(reader.result)
      try {
        const img = await loadImage(dataUrl)
        resolve({ dataUrl, width: img.naturalWidth || 512, height: img.naturalHeight || 512 })
      } catch {
        reject(new Error('That file is not a valid image'))
      }
    }
    reader.readAsDataURL(file)
  })
}

/** Downscale large raster uploads so they fit comfortably in localStorage. */
export async function compressRaster(dataUrl: string, maxDim = 1400): Promise<{ dataUrl: string; width: number; height: number }> {
  const img = await loadImage(dataUrl)
  const s = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.round(img.naturalWidth * s)
  const h = Math.round(img.naturalHeight * s)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  c.getContext('2d')!.drawImage(img, 0, 0, w, h)
  const png = c.toDataURL('image/png')
  const webp = c.toDataURL('image/webp', 0.9)
  return { dataUrl: webp.length < png.length && webp.startsWith('data:image/webp') ? webp : png, width: w, height: h }
}
