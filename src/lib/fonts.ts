import sans400 from '@fontsource/geist-sans/files/geist-sans-latin-400-normal.woff2?url'
import sans500 from '@fontsource/geist-sans/files/geist-sans-latin-500-normal.woff2?url'
import sans600 from '@fontsource/geist-sans/files/geist-sans-latin-600-normal.woff2?url'
import sans700 from '@fontsource/geist-sans/files/geist-sans-latin-700-normal.woff2?url'
import mono400 from '@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff2?url'
import mono500 from '@fontsource/geist-mono/files/geist-mono-latin-500-normal.woff2?url'

export const SANS_FAMILY = 'Geist Sans'
export const MONO_FAMILY = 'Geist Mono'
export const FONT_SANS = `'${SANS_FAMILY}', 'Geist', 'Inter', system-ui, sans-serif`
export const FONT_MONO = `'${MONO_FAMILY}', ui-monospace, 'SFMono-Regular', Menlo, monospace`

const FACES = [
  { family: SANS_FAMILY, weight: 400, url: sans400 },
  { family: SANS_FAMILY, weight: 500, url: sans500 },
  { family: SANS_FAMILY, weight: 600, url: sans600 },
  { family: SANS_FAMILY, weight: 700, url: sans700 },
  { family: MONO_FAMILY, weight: 400, url: mono400 },
  { family: MONO_FAMILY, weight: 500, url: mono500 },
]

/** Ensure every face used by covers is loaded before text is measured. */
export async function loadFonts(): Promise<void> {
  try {
    await Promise.all(FACES.map((f) => document.fonts.load(`${f.weight} 32px "${f.family}"`)))
    await document.fonts.ready
  } catch {
    /* measurement falls back to system font metrics */
  }
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(bin)
}

let faceCssCache: Promise<string> | null = null

/** @font-face rules with base64-embedded fonts, so exported SVG/PNG render identically. */
export function embeddedFontCss(): Promise<string> {
  if (!faceCssCache) {
    faceCssCache = Promise.all(
      FACES.map(async (f) => {
        const res = await fetch(f.url)
        const b64 = toBase64(await res.arrayBuffer())
        return `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${f.weight};src:url(data:font/woff2;base64,${b64}) format('woff2');}`
      }),
    ).then((rules) => rules.join('\n'))
    faceCssCache.catch(() => {
      faceCssCache = null
    })
  }
  return faceCssCache
}
