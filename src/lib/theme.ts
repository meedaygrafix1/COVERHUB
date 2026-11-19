import { useEffect, useState } from 'react'

/**
 * App theme: light, dark, or follow the system. The choice is stored per
 * browser; index.html applies it before first paint so there's no flash.
 * Covers themselves never change with the theme: they export as designed.
 */
export type Theme = 'system' | 'light' | 'dark'

const KEY = 'scs.theme'
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

export function loadTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

function apply(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && media().matches)
  document.documentElement.classList.toggle('dark', dark)
}

/** The current theme and a setter; keeps <html class="dark"> in step, including system changes. */
export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(loadTheme)
  useEffect(() => {
    apply(theme)
    try {
      if (theme === 'system') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, theme)
    } catch {
      // storage blocked: the choice lasts for this visit only
    }
    if (theme !== 'system') return
    const m = media()
    const onChange = () => apply('system')
    m.addEventListener('change', onChange)
    return () => m.removeEventListener('change', onChange)
  }, [theme])
  return [theme, setTheme]
}
