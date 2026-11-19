import { useEffect, useSyncExternalStore } from 'react'

/**
 * The Kubai icon library: 3,000+ tagged icons, loaded on demand.
 *
 * Two lazy stores share one change counter so React can re-render when
 * something arrives:
 *   - the tag index (names, categories, tags), ~500 KB, fetched once at startup
 *   - individual icons, fetched the first time a cover uses them
 *
 * Icons are loaded as raw module text and only their SVG markup is kept:
 * covers are static, so the icons' hover-motion code isn't needed, and raw
 * text chunks carry no imports of their own.
 */

/** Just what a cover needs: the icon's inner SVG, with `__K__` as the id placeholder. */
export interface IconData {
  name: string
  markup: string
}

const RAW = import.meta.glob<string>('/node_modules/kubai-icons/dist/icons/*.js', { query: '?raw', import: 'default' })
const LOADERS = new Map(Object.entries(RAW).map(([path, load]) => [path.slice(path.lastIndexOf('/') + 1, -3), load]))
const ICON_NAMES = [...LOADERS.keys()]

/** `…i("database","<defs>…",…)` → the markup string */
function parseIconModule(name: string, src: string): IconData | null {
  const m = /i\("[^"]*",("(?:[^"\\]|\\.)*")/.exec(src)
  if (!m) return null
  try {
    return { name, markup: JSON.parse(m[1]) as string }
  } catch {
    return null
  }
}

export interface IconEntry {
  name: string
  category: string
  tags: string[]
  /** set on badged variants, e.g. database-lock → base "database" */
  base?: string
  badge?: string
}

export const ICON_NAME_SET: ReadonlySet<string> = new Set(ICON_NAMES)

let version = 0
const listeners = new Set<() => void>()
let scheduled = false
function bump() {
  // coalesce many arrivals into one render
  if (scheduled) return
  scheduled = true
  queueMicrotask(() => {
    scheduled = false
    version++
    listeners.forEach((l) => l())
  })
}
function subscribe(l: () => void) {
  listeners.add(l)
  return () => void listeners.delete(l)
}
const getVersion = () => version

/* ---------------- tag index ---------------- */

let index: IconEntry[] | null = null
let byName: Map<string, IconEntry> | null = null
let indexLoading: Promise<void> | null = null

export function loadIconIndex(): Promise<void> {
  indexLoading ??= import('kubai-icons/icons.json')
    .then((m) => {
      index = (m.default as IconEntry[]).filter((e) => ICON_NAME_SET.has(e.name))
      byName = new Map(index.map((e) => [e.name, e]))
      bump()
    })
    .catch(() => {
      indexLoading = null
    })
  return indexLoading
}

export const getIconIndex = () => index
export const getIconEntry = (name: string) => byName?.get(name)

/** Re-renders once the tag index has loaded. Returns true when it's ready. */
export function useIconIndex(): boolean {
  useSyncExternalStore(subscribe, getVersion)
  useEffect(() => void loadIconIndex(), [])
  return index !== null
}

/* ---------------- icon modules ---------------- */

const cache = new Map<string, IconData>()
const pending = new Set<string>()

export function getIcon(name: string): IconData | undefined {
  return cache.get(name)
}

export function ensureIcons(list: readonly string[]) {
  for (const n of list) {
    if (cache.has(n) || pending.has(n) || !ICON_NAME_SET.has(n)) continue
    pending.add(n)
    LOADERS.get(n)!()
      .then((src) => {
        const d = parseIconModule(n, src)
        if (d) {
          cache.set(n, d)
          bump()
        }
      })
      .catch(() => {})
      .finally(() => pending.delete(n))
  }
}

/** Loads the named icons and returns a counter that changes as they arrive. */
export function useIcons(list: readonly string[]): number {
  const v = useSyncExternalStore(subscribe, getVersion)
  const key = list.join('|')
  useEffect(() => {
    if (key) ensureIcons(key.split('|'))
  }, [key])
  return v
}
