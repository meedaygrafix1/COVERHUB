import type { CompElement, CompKind, CompLink, Composition, SceneConfig, SceneItem } from './types'

/** The composition artboard. It fills the cover; everything is laid out in these units. */
export const ART_W = 1120
export const ART_H = 560

export const COMP_KINDS: readonly CompKind[] = ['card', 'tile', 'pill', 'brand', 'spark']
export const MAX_ELEMENTS = 40
export const MAX_LINKS = 40
/** compose scenes reference their icons by index into scene.items */
export const MAX_COMPOSE_ITEMS = 48

export const MIN_SIZE: Record<CompKind, number> = { card: 90, tile: 56, pill: 120, brand: 90, spark: 12 }
const MIN_H: Record<CompKind, number> = { card: 60, tile: 56, pill: 36, brand: 90, spark: 12 }
const num = (v: unknown, fb = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fb)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** What each part is called in the layers list and the design panel. */
export const KIND_NAMES: Record<CompKind, string> = { card: 'Card', tile: 'Tile', pill: 'Pill', brand: 'Spidra mark', spark: 'Sparkle' }

/** A layer's display name: its caption, else its icon, else its kind. */
export function partName(e: CompElement, items: SceneItem[]): string {
  const it = e.item >= 0 ? items[e.item] : undefined
  if (it?.label) return it.label
  if (it?.icon) return it.icon.replace(/-/g, ' ')
  return KIND_NAMES[e.kind]
}

/**
 * Validate an untrusted composition (from Claude, a share link or pasted JSON):
 * known kinds only, sizes and positions kept on the artboard, item indexes in
 * range, links only between elements that exist. Returns undefined when
 * nothing usable is left, unless `allowEmpty` (an emptied canvas is still a
 * canvas while editing).
 */
export function sanitizeComposition(raw: unknown, itemCount: number, allowEmpty = false): Composition | undefined {
  if (typeof raw !== 'object' || !raw) return undefined
  const r = raw as Partial<Composition>
  const ids = new Set<string>()
  const index = (v: unknown) => {
    const i = Math.round(num(v, -1))
    return i >= 0 && i < itemCount ? i : -1
  }

  const elements: CompElement[] = []
  for (const e of Array.isArray(r.elements) ? r.elements : []) {
    if (elements.length >= MAX_ELEMENTS) break
    if (!e || typeof e !== 'object' || !COMP_KINDS.includes(e.kind)) continue
    const id = typeof e.id === 'string' && e.id && !ids.has(e.id) ? e.id.slice(0, 24) : uniqueId(e.kind, ids)
    const w = clamp(num(e.w, MIN_SIZE[e.kind]), MIN_SIZE[e.kind], ART_W)
    const h = clamp(num(e.h, MIN_SIZE[e.kind]), MIN_H[e.kind], ART_H)
    const el: CompElement = {
      id,
      kind: e.kind,
      w,
      h,
      x: clamp(num(e.x), 0, ART_W - w),
      y: clamp(num(e.y), 0, ART_H - h),
      item: index(e.item),
      badge: index(e.badge),
      lines: clamp(Math.round(num(e.lines)), 0, 3),
      accent: clamp(Math.round(num(e.accent)), 0, 3),
      emphasis: e.emphasis === true,
    }
    if (e.hidden === true) el.hidden = true
    if (el.badge === el.item) el.badge = -1
    // tiles and pills are only an icon (and a caption): without one they'd be empty
    if ((el.kind === 'tile' || el.kind === 'pill') && el.item < 0) continue
    ids.add(id)
    elements.push(el)
  }
  if (!elements.length && !allowEmpty) return undefined

  const links: CompLink[] = []
  for (const l of Array.isArray(r.links) ? r.links : []) {
    if (links.length >= MAX_LINKS) break
    if (!l || typeof l !== 'object' || !ids.has(l.from) || !ids.has(l.to) || l.from === l.to) continue
    links.push({ from: l.from, to: l.to, dashed: l.dashed === true, node: l.node === true })
  }
  return r.edited === true ? { elements, links, edited: true } : { elements, links }
}

/**
 * Stacking order for a fresh composition from Claude: sparkles at the back,
 * the focal part at the front. After that the array order is the layer order
 * and writers change it by hand.
 */
export function stackForDisplay(comp: Composition): Composition {
  const order = [...comp.elements].sort((a, b) => Number(b.kind === 'spark') - Number(a.kind === 'spark') || Number(a.emphasis) - Number(b.emphasis))
  return { ...comp, elements: order }
}

function uniqueId(kind: string, taken: Set<string> | string[]): string {
  const has = (id: string) => (taken instanceof Set ? taken.has(id) : taken.includes(id))
  for (let n = 1; ; n++) {
    const id = `${kind}${n}`
    if (!has(id)) return id
  }
}

/* ------------------------------------------------------------------ */
/* Moving and resizing                                                  */
/* ------------------------------------------------------------------ */

/** Snapping: alignment with other parts wins within this distance, otherwise the grid. */
export const SNAP_DISTANCE = 8
export const GRID = 8

export interface Guide {
  axis: 'v' | 'h'
  /** artboard units: x for a vertical guide, y for a horizontal one */
  at: number
}

type Rect = { x: number; y: number; w: number; h: number }

function snapAxis(pos: number, size: number, lines: number[], dir: Guide['axis'], guides: Guide[]): number {
  let best: { d: number; to: number; at: number } | null = null
  for (const off of [0, size / 2, size])
    for (const line of lines) {
      const d = Math.abs(pos + off - line)
      if (d <= SNAP_DISTANCE && (!best || d < best.d)) best = { d, to: line - off, at: line }
    }
  if (best) {
    guides.push({ axis: dir, at: best.at })
    return best.to
  }
  return Math.round(pos / GRID) * GRID
}

/**
 * Where a dragged rectangle lands: its left, centre or right edge snaps to
 * another part's edge or centre (or the artboard's centre line) when close,
 * else to the grid; it always stays on the artboard. `exclude` are the parts
 * being dragged, which never snap to themselves.
 */
export function snapRect(comp: Composition, r: Rect, exclude: Set<string>, snap = true): { x: number; y: number; guides: Guide[] } {
  const guides: Guide[] = []
  let { x, y } = r
  if (snap) {
    const others = comp.elements.filter((el) => !exclude.has(el.id) && el.kind !== 'spark' && !el.hidden)
    x = snapAxis(x, r.w, [ART_W / 2, ...others.flatMap((o) => [o.x, o.x + o.w / 2, o.x + o.w])], 'v', guides)
    y = snapAxis(y, r.h, [ART_H / 2, ...others.flatMap((o) => [o.y, o.y + o.h / 2, o.y + o.h])], 'h', guides)
  }
  return { x: clamp(x, 0, ART_W - r.w), y: clamp(y, 0, ART_H - r.h), guides }
}

/** Single-part version of snapRect, kept for callers that move one part. */
export function snapMove(comp: Composition, id: string, x: number, y: number, snap = true) {
  const e = comp.elements.find((el) => el.id === id)
  if (!e) return { x, y, guides: [] as Guide[] }
  return snapRect(comp, { x, y, w: e.w, h: e.h }, new Set([id]), snap)
}

/** Distances from a part to its nearest neighbours on each side, for the spacing labels. */
export interface Gap {
  axis: 'h' | 'v'
  /** start and end of the gap along its axis, and where it sits across it */
  from: number
  to: number
  at: number
}
export function gapsAround(comp: Composition, r: Rect, exclude: Set<string>): Gap[] {
  const others = comp.elements.filter((o) => !exclude.has(o.id) && !o.hidden && o.kind !== 'spark')
  const gaps: Gap[] = []
  const overlapY = (o: Rect) => o.y < r.y + r.h && o.y + o.h > r.y
  const overlapX = (o: Rect) => o.x < r.x + r.w && o.x + o.w > r.x
  const left = others.filter((o) => overlapY(o) && o.x + o.w <= r.x).sort((a, b) => b.x + b.w - (a.x + a.w))[0]
  const right = others.filter((o) => overlapY(o) && o.x >= r.x + r.w).sort((a, b) => a.x - b.x)[0]
  const up = others.filter((o) => overlapX(o) && o.y + o.h <= r.y).sort((a, b) => b.y + b.h - (a.y + a.h))[0]
  const down = others.filter((o) => overlapX(o) && o.y >= r.y + r.h).sort((a, b) => a.y - b.y)[0]
  const cy = r.y + r.h / 2
  const cx = r.x + r.w / 2
  if (left) gaps.push({ axis: 'h', from: left.x + left.w, to: r.x, at: cy })
  if (right) gaps.push({ axis: 'h', from: r.x + r.w, to: right.x, at: cy })
  if (up) gaps.push({ axis: 'v', from: up.y + up.h, to: r.y, at: cx })
  if (down) gaps.push({ axis: 'v', from: r.y + r.h, to: down.y, at: cx })
  return gaps
}

export type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

/** A part's new rectangle while a resize handle is dragged by (dx, dy) artboard units. */
export function resizeRect(e: CompElement, handle: Handle, dx: number, dy: number, opts: { snap: boolean; keepRatio: boolean }): Rect {
  let { x, y, w, h } = e
  const minW = MIN_SIZE[e.kind]
  const minH = MIN_H[e.kind]
  if (handle.includes('e')) w = clamp(e.w + dx, minW, ART_W - e.x)
  if (handle.includes('s')) h = clamp(e.h + dy, minH, ART_H - e.y)
  if (handle.includes('w')) {
    const nx = clamp(e.x + dx, 0, e.x + e.w - minW)
    w = e.w + (e.x - nx)
    x = nx
  }
  if (handle.includes('n')) {
    const ny = clamp(e.y + dy, 0, e.y + e.h - minH)
    h = e.h + (e.y - ny)
    y = ny
  }
  if (opts.keepRatio && handle.length === 2) {
    const ratio = e.w / e.h
    if (w / h > ratio) w = h * ratio
    else h = w / ratio
    if (handle.includes('w')) x = e.x + e.w - w
    if (handle.includes('n')) y = e.y + e.h - h
  }
  if (opts.snap) {
    const g = (v: number) => Math.round(v / GRID) * GRID
    if (handle.includes('e')) w = Math.max(minW, g(x + w) - x)
    if (handle.includes('s')) h = Math.max(minH, g(y + h) - y)
    if (handle.includes('w')) {
      const nx = Math.min(g(x), x + w - minW)
      w += x - nx
      x = nx
    }
    if (handle.includes('n')) {
      const ny = Math.min(g(y), y + h - minH)
      h += y - ny
      y = ny
    }
  }
  return { x, y, w, h }
}

/* ------------------------------------------------------------------ */
/* Editing operations: each returns a new scene                         */
/* ------------------------------------------------------------------ */

const compOf = (scene: SceneConfig): Composition => scene.composition ?? { elements: [], links: [] }

/** Put a changed composition back, marked as edited, dropping icons nothing uses any more. */
export function withComposition(scene: SceneConfig, comp: Composition): SceneConfig {
  return pruneItems({ ...scene, style: 'compose', composition: { ...comp, edited: true } })
}

/** Remove scene items no part references, re-pointing every part at the new indexes. */
export function pruneItems(scene: SceneConfig): SceneConfig {
  const comp = scene.composition
  if (!comp) return scene
  const used = new Set(comp.elements.flatMap((e) => [e.item, e.badge]).filter((i) => i >= 0))
  if (used.size === scene.items.length) return scene
  const order = scene.items.map((_, i) => i).filter((i) => used.has(i))
  const remap = new Map(order.map((old, neu) => [old, neu]))
  const re = (i: number) => (i >= 0 ? (remap.get(i) ?? -1) : -1)
  return {
    ...scene,
    items: order.map((i) => scene.items[i]),
    composition: { ...comp, elements: comp.elements.map((e) => ({ ...e, item: re(e.item), badge: re(e.badge) })) },
  }
}

/** Patch parts by id (position, size, accent, lines, emphasis, hidden…). */
export function updateParts(scene: SceneConfig, patches: Record<string, Partial<CompElement>>): SceneConfig {
  const comp = compOf(scene)
  return withComposition(scene, {
    ...comp,
    elements: comp.elements.map((e) => {
      const p = patches[e.id]
      if (!p) return e
      const n = { ...e, ...p }
      n.w = clamp(n.w, MIN_SIZE[n.kind], ART_W)
      n.h = clamp(n.h, MIN_H[n.kind], ART_H)
      n.x = clamp(n.x, 0, ART_W - n.w)
      n.y = clamp(n.y, 0, ART_H - n.h)
      return n
    }),
  })
}

/** Default size and look for a part inserted from the toolbar. */
const NEW_PART: Record<CompKind, { w: number; h: number; lines: number; label: string; icon: string | null }> = {
  card: { w: 300, h: 120, lines: 2, label: 'New card', icon: 'sparkles' },
  tile: { w: 120, h: 120, lines: 0, label: '', icon: 'sparkles' },
  pill: { w: 220, h: 52, lines: 0, label: 'New pill', icon: 'sparkles' },
  brand: { w: 200, h: 160, lines: 0, label: '', icon: null },
  spark: { w: 28, h: 28, lines: 0, label: '', icon: null },
}

/** Insert a new part centred on (cx, cy). Returns the scene and the new part's id. */
export function addPart(scene: SceneConfig, kind: CompKind, cx: number, cy: number): { scene: SceneConfig; id: string } {
  const comp = compOf(scene)
  const d = NEW_PART[kind]
  const items = [...scene.items]
  let item = -1
  if (d.icon) {
    item = items.length
    items.push({ icon: d.icon, label: d.label })
  }
  const id = uniqueId(kind, comp.elements.map((e) => e.id))
  const el: CompElement = {
    id,
    kind,
    w: d.w,
    h: d.h,
    x: clamp(Math.round(cx - d.w / 2), 0, ART_W - d.w),
    y: clamp(Math.round(cy - d.h / 2), 0, ART_H - d.h),
    item,
    badge: -1,
    lines: d.lines,
    accent: (comp.elements.length + 1) % 4,
    emphasis: false,
  }
  return { scene: withComposition({ ...scene, items }, { ...comp, elements: [...comp.elements, el] }), id }
}

/** Delete parts and every connection that touches them. */
export function deleteParts(scene: SceneConfig, ids: string[]): SceneConfig {
  const comp = compOf(scene)
  const gone = new Set(ids)
  return withComposition(scene, {
    ...comp,
    elements: comp.elements.filter((e) => !gone.has(e.id)),
    links: comp.links.filter((l) => !gone.has(l.from) && !gone.has(l.to)),
  })
}

/** Duplicate parts (with their icons, and connections between copied parts), offset a little. */
export function duplicateParts(scene: SceneConfig, ids: string[], offset = 24): { scene: SceneConfig; ids: string[] } {
  const clip = copyParts(scene, ids)
  return pasteParts(scene, clip, offset)
}

/** Move parts one step forward/back in the stack, or to the very front/back. */
export function reorderParts(scene: SceneConfig, ids: string[], dir: 'forward' | 'backward' | 'front' | 'back'): SceneConfig {
  const comp = compOf(scene)
  const sel = new Set(ids)
  let els = [...comp.elements]
  if (dir === 'front') els = [...els.filter((e) => !sel.has(e.id)), ...els.filter((e) => sel.has(e.id))]
  else if (dir === 'back') els = [...els.filter((e) => sel.has(e.id)), ...els.filter((e) => !sel.has(e.id))]
  else if (dir === 'forward') {
    for (let i = els.length - 2; i >= 0; i--) if (sel.has(els[i].id) && !sel.has(els[i + 1].id)) [els[i], els[i + 1]] = [els[i + 1], els[i]]
  } else {
    for (let i = 1; i < els.length; i++) if (sel.has(els[i].id) && !sel.has(els[i - 1].id)) [els[i], els[i - 1]] = [els[i - 1], els[i]]
  }
  return withComposition(scene, { ...comp, elements: els })
}

/** Move a part to a new position in the stack (layers panel drag), counted from the back. */
export function movePartTo(scene: SceneConfig, id: string, index: number): SceneConfig {
  const comp = compOf(scene)
  const els = comp.elements.filter((e) => e.id !== id)
  const e = comp.elements.find((x) => x.id === id)
  if (!e) return scene
  els.splice(clamp(index, 0, els.length), 0, e)
  return withComposition(scene, { ...comp, elements: els })
}

export type AlignMode = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom'

/** Align parts to the edge or centre of their combined bounds (or the artboard, for one part). */
export function alignParts(scene: SceneConfig, ids: string[], mode: AlignMode): SceneConfig {
  const comp = compOf(scene)
  const sel = comp.elements.filter((e) => ids.includes(e.id))
  if (!sel.length) return scene
  const b =
    sel.length === 1
      ? { x: 0, y: 0, w: ART_W, h: ART_H }
      : (() => {
          const x = Math.min(...sel.map((e) => e.x))
          const y = Math.min(...sel.map((e) => e.y))
          return { x, y, w: Math.max(...sel.map((e) => e.x + e.w)) - x, h: Math.max(...sel.map((e) => e.y + e.h)) - y }
        })()
  const patches: Record<string, Partial<CompElement>> = {}
  for (const e of sel) {
    if (mode === 'left') patches[e.id] = { x: b.x }
    if (mode === 'hcenter') patches[e.id] = { x: Math.round(b.x + b.w / 2 - e.w / 2) }
    if (mode === 'right') patches[e.id] = { x: b.x + b.w - e.w }
    if (mode === 'top') patches[e.id] = { y: b.y }
    if (mode === 'vcenter') patches[e.id] = { y: Math.round(b.y + b.h / 2 - e.h / 2) }
    if (mode === 'bottom') patches[e.id] = { y: b.y + b.h - e.h }
  }
  return updateParts(scene, patches)
}

/** Space three or more parts evenly between the outermost two. */
export function distributeParts(scene: SceneConfig, ids: string[], axis: 'h' | 'v'): SceneConfig {
  const comp = compOf(scene)
  const sel = comp.elements.filter((e) => ids.includes(e.id))
  if (sel.length < 3) return scene
  const pos = (e: CompElement) => (axis === 'h' ? e.x : e.y)
  const size = (e: CompElement) => (axis === 'h' ? e.w : e.h)
  const sorted = [...sel].sort((a, b) => pos(a) - pos(b))
  const start = pos(sorted[0])
  const end = pos(sorted[sorted.length - 1]) + size(sorted[sorted.length - 1])
  const gap = (end - start - sorted.reduce((s, e) => s + size(e), 0)) / (sorted.length - 1)
  const patches: Record<string, Partial<CompElement>> = {}
  let cursor = start
  for (const e of sorted) {
    patches[e.id] = axis === 'h' ? { x: Math.round(cursor) } : { y: Math.round(cursor) }
    cursor += size(e) + gap
  }
  return updateParts(scene, patches)
}

/* ---------- icons and captions, per part ---------- */

/**
 * Give one part its own copy of an item before changing it, so editing one
 * card never changes another card that happened to share the icon.
 */
function ownItem(scene: SceneConfig, id: string, slot: 'item' | 'badge', fresh: SceneItem): { scene: SceneConfig; index: number } {
  const comp = compOf(scene)
  const e = comp.elements.find((x) => x.id === id)!
  const cur = e[slot]
  const shared = cur >= 0 && comp.elements.some((o) => o.id !== id && (o.item === cur || o.badge === cur))
  if (cur >= 0 && !shared) return { scene, index: cur }
  const items = [...scene.items, cur >= 0 ? { ...scene.items[cur] } : fresh]
  const index = items.length - 1
  const elements = comp.elements.map((x) => (x.id === id ? { ...x, [slot]: index } : x))
  return { scene: { ...scene, items, composition: { ...comp, elements } }, index }
}

/** Set (or with null, remove) a part's main icon or its badge. */
export function setPartIcon(scene: SceneConfig, id: string, slot: 'item' | 'badge', icon: string | null): SceneConfig {
  const comp = compOf(scene)
  const e = comp.elements.find((x) => x.id === id)
  if (!e) return scene
  if (icon === null) {
    // tiles and pills need an icon; only a badge (or a card's icon) can go
    if (slot === 'item' && (e.kind === 'tile' || e.kind === 'pill')) return scene
    return updateParts(scene, { [id]: { [slot]: -1 } })
  }
  const o = ownItem(scene, id, slot, { icon, label: slot === 'badge' ? '' : icon.replace(/-/g, ' ').replace(/^\w/, (m) => m.toUpperCase()) })
  const items = o.scene.items.map((it, i) => (i === o.index ? { ...it, icon } : it))
  return withComposition({ ...o.scene, items }, compOf(o.scene))
}

/** Set a part's caption (cards and pills show it; it also names the layer). */
export function setPartLabel(scene: SceneConfig, id: string, label: string): SceneConfig {
  const comp = compOf(scene)
  const e = comp.elements.find((x) => x.id === id)
  if (!e || e.item < 0) return scene
  const o = ownItem(scene, id, 'item', { icon: 'sparkles', label })
  const items = o.scene.items.map((it, i) => (i === o.index ? { ...it, label: label.slice(0, 32) } : it))
  return withComposition({ ...o.scene, items }, compOf(o.scene))
}

/* ---------- connections ---------- */

export function addLink(scene: SceneConfig, from: string, to: string): SceneConfig {
  const comp = compOf(scene)
  if (from === to || comp.links.some((l) => (l.from === from && l.to === to) || (l.from === to && l.to === from))) return scene
  return withComposition(scene, { ...comp, links: [...comp.links, { from, to, dashed: false, node: true }] })
}

export function updateLink(scene: SceneConfig, index: number, patch: Partial<CompLink>): SceneConfig {
  const comp = compOf(scene)
  return withComposition(scene, { ...comp, links: comp.links.map((l, i) => (i === index ? { ...l, ...patch } : l)) })
}

export function deleteLink(scene: SceneConfig, index: number): SceneConfig {
  const comp = compOf(scene)
  return withComposition(scene, { ...comp, links: comp.links.filter((_, i) => i !== index) })
}

/* ---------- copy and paste (works across covers) ---------- */

/** A self-contained copy of some parts: icons travel with them. */
export interface PartsClip {
  kind: 'coverhub-parts'
  parts: (Omit<CompElement, 'item' | 'badge'> & { item: SceneItem | null; badge: SceneItem | null })[]
  links: CompLink[]
}

export function copyParts(scene: SceneConfig, ids: string[]): PartsClip {
  const comp = compOf(scene)
  const sel = new Set(ids)
  return {
    kind: 'coverhub-parts',
    parts: comp.elements
      .filter((e) => sel.has(e.id))
      .map((e) => ({ ...e, item: e.item >= 0 ? { ...scene.items[e.item] } : null, badge: e.badge >= 0 ? { ...scene.items[e.badge] } : null })),
    links: comp.links.filter((l) => sel.has(l.from) && sel.has(l.to)),
  }
}

export function pasteParts(scene: SceneConfig, clip: PartsClip, offset = 24): { scene: SceneConfig; ids: string[] } {
  const comp = compOf(scene)
  const items = [...scene.items]
  const taken = comp.elements.map((e) => e.id)
  const idMap = new Map<string, string>()
  const added: CompElement[] = []
  for (const p of clip.parts.slice(0, MAX_ELEMENTS - comp.elements.length)) {
    if (!COMP_KINDS.includes(p.kind)) continue
    const id = uniqueId(p.kind, [...taken, ...added.map((a) => a.id)])
    idMap.set(p.id, id)
    const push = (it: SceneItem | null) => (it && typeof it.icon === 'string' ? items.push({ icon: it.icon, label: String(it.label ?? '').slice(0, 32) }) - 1 : -1)
    const { item, badge, ...rest } = p
    added.push({ ...rest, id, hidden: undefined, item: push(item), badge: push(badge), x: clamp(p.x + offset, 0, ART_W - p.w), y: clamp(p.y + offset, 0, ART_H - p.h) })
  }
  const links = clip.links.filter((l) => idMap.has(l.from) && idMap.has(l.to)).map((l) => ({ ...l, from: idMap.get(l.from)!, to: idMap.get(l.to)! }))
  const next = withComposition({ ...scene, items }, { ...comp, elements: [...comp.elements, ...added], links: [...comp.links, ...links] })
  return { scene: next, ids: added.map((a) => a.id) }
}

/** Read a clip back from text (the system clipboard or storage); null if it isn't one. */
export function parseClip(text: string | null): PartsClip | null {
  if (!text) return null
  try {
    const v = JSON.parse(text)
    return v && v.kind === 'coverhub-parts' && Array.isArray(v.parts) ? (v as PartsClip) : null
  } catch {
    return null
  }
}

/** The composition with one part moved, marked as edited by hand. */
export function moveElement(comp: Composition, id: string, x: number, y: number): Composition {
  return { ...comp, edited: true, elements: comp.elements.map((el) => (el.id === id ? { ...el, x: clamp(x, 0, ART_W - el.w), y: clamp(y, 0, ART_H - el.h) } : el)) }
}

/**
 * Reorder or drop scene items, keeping a composition pointing at the right
 * icons. `order` lists old item indexes in their new order; indexes left out
 * are removed.
 */
export function reorderSceneItems(scene: SceneConfig, order: number[]): SceneConfig {
  const items = order.map((i) => scene.items[i]).filter(Boolean)
  if (!scene.composition) return { ...scene, items }
  const remap = new Map(order.map((old, neu) => [old, neu]))
  const re = (i: number) => (i >= 0 ? (remap.get(i) ?? -1) : -1)
  const moved = { ...scene.composition, elements: scene.composition.elements.map((e) => ({ ...e, item: re(e.item), badge: re(e.badge) })) }
  return { ...scene, items, composition: sanitizeComposition(moved, items.length, true) }
}
