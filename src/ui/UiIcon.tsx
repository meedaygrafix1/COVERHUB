import { useId, useMemo } from 'react'
import { getIcon, useIcons } from '../library/catalog'

/**
 * A Kubai library icon for the editor UI. Shares the icon cache with the
 * covers, so nothing loads twice.
 */
export function UiIcon({ name, size = 24, color }: { name: string; size?: number; color?: string; trigger?: 'self' | 'parent' }) {
  useIcons([name])
  const data = getIcon(name)
  const id = 'u' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const html = useMemo(() => (data ? { __html: data.markup.replace(/__K__/g, id) } : undefined), [data, id])
  if (!html) return <span aria-hidden style={{ display: 'inline-block', width: size, height: size }} />
  return <svg viewBox="0 -3 31 31" width={size} height={size} fill="none" overflow="visible" aria-hidden style={{ color, display: 'block' }} dangerouslySetInnerHTML={html} />
}
