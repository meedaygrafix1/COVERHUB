import { hash, rng } from '../lib/random'
import { stripMarks } from '../lib/text'
import type { SceneItem, SceneStyle } from '../lib/types'
import { getIconIndex, ICON_NAME_SET, type IconEntry } from './catalog'
import { CONCEPTS, MODIFIERS, type Concept, type ConceptRole } from './concepts'

/**
 * Title → library icons. Fully deterministic, no network.
 *
 * 1. Curated concepts (concepts.ts) are found by phrase; longer phrases win
 *    overlaps, so "web scraping" doesn't also count as "web".
 * 2. Remaining nouns are looked up in the library's own tags, so a title about
 *    beekeeping or pizza still finds `bee` or `pizza`.
 * 3. Hits are ranked subject → action → output → tech, and the best one becomes
 *    the hero. A modifier word ("secure", "scheduled", "AI") may swap the hero
 *    for its badged variant (`database` → `database-lock`).
 * 4. The shape of the title picks the layouts: "X vs Y" → versus,
 *    "X to/into Y" or action + output → flow, several topics → bento.
 */

export interface TopicPick extends SceneItem {
  concept: string
  role: ConceptRole
  score: number
  /** where the matched word starts in the text (title first, then subtitle) */
  pos: number
  /** other icons that picture the same concept, for quick swaps */
  alts: string[]
}

export interface TopicMatch {
  picks: TopicPick[]
  /** layouts that suit this title, best first */
  styles: SceneStyle[]
  /** ready-to-use items for each layout */
  scenes: Record<SceneStyle, SceneItem[]>
}

const ROLE_RANK: Record<ConceptRole, number> = { subject: 0, action: 1, output: 2, tech: 3, meta: 4 }

const UPPER = new Set(['api', 'json', 'csv', 'pdf', 'sql', 'ai', 'llm', 'seo', 'url', 'html', 'mcp', 'rag', 'crm', 'sdk', 'cli', 'aws', 'gcp', 'ocr', 'b2b', 'roi', 'kpi', 'xml', 'gpt', 'ip', 'vpn', 'qa'])
/** "pdfs" → "PDFs", "apis" → "APIs" */
const caseWord = (w: string) => {
  const l = w.toLowerCase()
  if (UPPER.has(l)) return l.toUpperCase()
  if (l.endsWith('s') && UPPER.has(l.slice(0, -1))) return l.slice(0, -1).toUpperCase() + 's'
  return w.charAt(0).toUpperCase() + w.slice(1)
}

const STOP = new Set(
  `a an the and or but nor of for with without in on at by to from into onto via per as is are was were be been being am do does did done can could will would should shall may might must have has had having
  how what why when where which who whom whose that this these those there here than then so too very just also only even still yet again ever never
  i me my we us our you your yours he she it its they them their his her hers one two three four five six seven eight nine ten first second third
  all any each every some most more less much many few other another such same own not no yes up down out over under about above below between through during before after
  get gets getting got make makes making made use uses using used need needs want wants know let lets like way ways thing things part
  guide guides tutorial complete ultimate simple simply easy easily quick quickly practical real world new better best top good great right wrong vs versus
  step steps tips tricks intro introduction overview explained explain beginner beginners started start starting work works working within
  2023 2024 2025 2026 2027 year years today now day days week month months
  turn turns turning convert converting converts different store stored storing bypass avoid handle handling choose choosing spidra
  fix fixing solve solving reduce reducing improve improving help helps based free scale really actually cut cuts cutting`.split(/\s+/),
)

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const reCache = new Map<string, RegExp>()
function termRe(term: string): RegExp {
  let re = reCache.get(term)
  if (!re) {
    re = new RegExp(`(^|[^a-z0-9])(${escapeRe(term)})(?=$|[^a-z0-9])`, 'g')
    reCache.set(term, re)
  }
  re.lastIndex = 0
  return re
}

interface Hit {
  concept: Concept | null
  /** generic hits carry their own icon */
  icon?: string
  term: string
  start: number
  end: number
}

const hitKey = (h: Hit) => (h.concept ? h.concept.id : `word:${h.icon}`)

function conceptHits(text: string): Hit[] {
  const hits: Hit[] = []
  for (const c of CONCEPTS) {
    for (const term of c.terms) {
      const re = termRe(term)
      let m: RegExpExecArray | null
      while ((m = re.exec(text))) {
        const start = m.index + m[1].length
        hits.push({ concept: c, term, start, end: start + term.length })
      }
    }
  }
  // longer phrases claim their words first; overlapping shorter hits of other concepts drop out
  hits.sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start)
  const kept: Hit[] = []
  for (const h of hits) {
    const clash = kept.some((k) => k.concept !== h.concept && h.start < k.end && k.start < h.end)
    if (!clash) kept.push(h)
  }
  return kept
}

const stem = (w: string) => {
  const out = [w]
  if (w.endsWith('ies') && w.length > 4) out.push(w.slice(0, -3) + 'y')
  else if (w.endsWith('es') && w.length > 4) out.push(w.slice(0, -2), w.slice(0, -1))
  else if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) out.push(w.slice(0, -1))
  if (w.endsWith('ing') && w.length > 5) out.push(w.slice(0, -3), w.slice(0, -3) + 'e')
  return out
}

/** Best base icon for one loose word, from the library's names and tags. */
function lookupWord(word: string, index: IconEntry[]): { icon: string; score: number } | null {
  const forms = stem(word)
  let best: { icon: string; score: number } | null = null
  for (const e of index) {
    if (e.base) continue
    let s = 0
    const parts = e.name.split('-')
    for (const f of forms) {
      if (e.name === f) s = Math.max(s, 10)
      else if (parts.includes(f)) s = Math.max(s, 5 - parts.length * 0.4)
      else if (e.tags.includes(f)) s = Math.max(s, 4)
    }
    if (s > 0 && (!best || s > best.score || (s === best.score && e.name.length < best.icon.length))) best = { icon: e.name, score: s }
  }
  return best && best.score >= 4 ? best : null
}

function genericHits(text: string, taken: Hit[]): Hit[] {
  const index = getIconIndex()
  if (!index) return []
  const out: Hit[] = []
  const re = /[a-z][a-z0-9'-]*/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const word = m[0].replace(/'s$/, '')
    const start = m.index
    const end = start + m[0].length
    if (STOP.has(word) || word.length < 3) continue
    if (taken.some((t) => start < t.end && t.start < end)) continue
    const found = lookupWord(word, index)
    if (found) out.push({ concept: null, icon: found.icon, term: word, start, end })
  }
  return out
}

function labelFrom(raw: string, h: Hit): string {
  if (h.concept?.label && !h.concept.named) return h.concept.label
  const word = raw.slice(h.start, h.end)
  return word.length > 16 && h.concept?.label ? h.concept.label : caseWord(word)
}

/** Flow split: "PDFs to JSON", "from websites into a database", "A → B". */
function flowSplit(text: string): number {
  const m =
    /(?<!how|want|need|ways|way|guide|learn|easy|able|going|have|has)\s(?:to|into|→|->)\s(?!scrape|extract|build|use|get|make|do|turn|convert|automate|monitor|track|find|create|avoid|bypass|handle|choose|know|learn|pick|start|the\s+next|be\s)/.exec(
      text,
    )
  return m ? m.index : -1
}

/** "A vs B", "A versus B", "A or B?" → the two sides as written. */
function versusSides(raw: string): [string, string] | null {
  const m = /^(.*?)\s+(?:vs\.?|versus)\s+(.*)$/i.exec(raw) ?? /^(.*?)\s+or\s+([^?]+)\?/i.exec(raw)
  if (!m) return null
  const clean = (s: string) =>
    s
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^(?:compare|comparing|comparison of|choosing between|between)\s+/i, '')
  let left = clean(m[1].split(/[:—–|]/).pop() ?? '')
  let right = clean(m[2].split(/[:?,.!—–(|]|\s-\s|\s(?:for|in|which|when|what|who|to|with)\s/i)[0] ?? '')
  const short = (s: string) => {
    if (s.length <= 18) return s
    return s.split(' ').slice(-2).join(' ').slice(0, 18)
  }
  left = short(left)
  right = short(right.split(' ').slice(0, 3).join(' '))
  return left && right ? [left, right] : null
}

interface Ranked {
  hit: Hit
  concept: string
  role: ConceptRole
  score: number
  icons: string[]
  label: string
}

/** The concept's icons, led by one named exactly like the word in the title ("hotel" → hotel). */
function conceptIcons(c: Concept, term: string): string[] {
  const list = c.icons.filter((i) => ICON_NAME_SET.has(i))
  const exact = c.role === 'subject' ? stem(term).find((f) => ICON_NAME_SET.has(f)) : undefined
  return exact ? [exact, ...list.filter((i) => i !== exact)] : list
}

function rankHits(raw: string, hits: Hit[], titleLen: number): Ranked[] {
  const by = new Map<string, Ranked & { terms: Set<string> }>()
  for (const h of hits) {
    const key = hitKey(h)
    const inTitle = h.start < titleLen
    const base = (h.concept?.weight ?? (h.concept ? 1 : 0.75)) * (inTitle ? 1 : 0.6)
    const cur = by.get(key)
    if (cur) {
      cur.terms.add(h.term)
      cur.score = Math.max(cur.score, base) * (1 + Math.min(cur.terms.size - 1, 2) * 0.3)
      if (h.start < cur.hit.start) {
        cur.hit = h
        cur.label = labelFrom(raw, h)
      }
      // any matched word named exactly like an icon leads ("hotel" wins over "TripAdvisor")
      if (h.concept) {
        const own = conceptIcons(h.concept, h.term)
        if (own[0] !== h.concept.icons[0] && own[0] !== cur.icons[0]) cur.icons = [own[0], ...cur.icons.filter((i) => i !== own[0])]
      }
      continue
    }
    by.set(key, {
      hit: h,
      concept: key,
      role: h.concept?.role ?? 'subject',
      score: base,
      icons: h.concept ? conceptIcons(h.concept, h.term) : [h.icon!],
      label: labelFrom(raw, h),
      terms: new Set([h.term]),
    })
  }
  const list = [...by.values()].filter((r) => r.icons.length)
  const strong = list.filter((r) => r.role !== 'meta')
  const pool = strong.length ? strong : list
  // the title outranks the subtitle; within each, subject → action → output → tech
  const inTitle = (r: Ranked) => (r.hit.start < titleLen ? 0 : 1)
  return pool.sort((a, b) => inTitle(a) - inTitle(b) || ROLE_RANK[a.role] - ROLE_RANK[b.role] || b.score - a.score || a.hit.start - b.hit.start)
}

export const baseOf = (icon: string) => icon.replace(/-(plus|check|alert|search|clock|cog|minus|x|off|heart|star|down|lock|info|up|right|sync|sparkle|bolt)$/, '')

function toPicks(ranked: Ranked[], max = 4): TopicPick[] {
  const used = new Set<string>()
  const out: TopicPick[] = []
  for (const r of ranked) {
    const icon = r.icons.find((i) => !used.has(baseOf(i)))
    if (!icon) continue
    used.add(baseOf(icon))
    out.push({ icon, label: r.label, concept: r.concept, role: r.role, score: r.score, pos: r.hit.start, alts: r.icons.filter((i) => i !== icon) })
    if (out.length >= max) break
  }
  return out
}

function applyModifier(text: string, picks: TopicPick[], hits: Hit[]) {
  if (!picks.length) return
  const shown = new Set(picks.map((p) => p.concept))
  const shownTerms = new Set(hits.filter((h) => shown.has(hitKey(h))).map((h) => h.term))
  const found: { badge: string; term: string; pos: number }[] = []
  for (const mod of MODIFIERS) {
    for (const t of mod.terms) {
      if (shownTerms.has(t)) continue
      const m = termRe(t).exec(text)
      if (m) found.push({ badge: mod.badge, term: t, pos: m.index })
    }
  }
  found.sort((a, b) => a.pos - b.pos)
  for (const f of found) {
    for (const p of picks.slice(0, 2)) {
      const v = `${baseOf(p.icon)}-${f.badge}`
      if (ICON_NAME_SET.has(v) && v !== p.icon) {
        p.alts = [p.icon, ...p.alts]
        p.icon = v
        return
      }
    }
  }
  // no icon takes the badge: show the modifier as its own small topic
  for (const f of found) {
    const mod = MODIFIERS.find((m) => m.badge === f.badge)
    if (mod?.icon && picks.length < 4 && !picks.some((p) => baseOf(p.icon) === mod.icon)) {
      picks.push({ icon: mod.icon, label: caseWord(f.term), concept: `mod:${mod.badge}`, role: 'tech', score: 0.5, pos: f.pos, alts: [] })
      return
    }
  }
}

const item = (p: { icon: string; label: string }): SceneItem => ({ icon: p.icon, label: p.label })

const EMPTY: TopicMatch = { picks: [], styles: ['focus'], scenes: { hub: [], merge: [], inspect: [], focus: [], pair: [], stack: [], grid: [], window: [], spotlight: [], flow: [], bento: [], orbit: [], versus: [], compose: [] } }

/** Topics that read as "looking into conversations / signals": the Inspect scene suits them. */
const INSPECT_CONCEPTS = new Set(['monitor', 'search', 'reviews', 'social', 'video', 'errors', 'antibot', 'competitors', 'seo', 'news', 'test', 'analyze', 'linkedin', 'leads'])
/** Topics that live in a browser or an app: the Window scene suits them. */
const WINDOW_CONCEPTS = new Set(['website', 'browser', 'scrape', 'api', 'dashboard', 'code', 'cli', 'mobile', 'changelog', 'seo', 'javascript', 'python', 'ecommerce', 'regex', 'pagination'])

/** The layouts drawn in the light illustration style, in no particular order. */
export const ILLUSTRATED_STYLES = ['focus', 'pair', 'stack', 'grid', 'window', 'merge', 'inspect', 'hub'] as const
type IllustratedStyle = (typeof ILLUSTRATED_STYLES)[number]

/** Topics about gathering and combining data: the Merge scene suits them. */
const MERGE_CONCEPTS = new Set(['extract', 'scrape', 'json', 'spreadsheet', 'database', 'data', 'clean', 'leads', 'documents', 'automate', 'rag', 'dashboard', 'markdown'])

export function matchTopics(title: string, subtitle = ''): TopicMatch {
  const rawTitle = stripMarks(title).trim()
  const raw = `${rawTitle} ${stripMarks(subtitle).trim()}`.trim()
  const text = raw.toLowerCase()
  if (!text) return EMPTY

  const cHits = conceptHits(text)
  const hits = [...cHits, ...genericHits(text, cHits)]
  const picks = toPicks(rankHits(raw, hits, rawTitle.length))
  applyModifier(text, picks, hits)
  if (!picks.length) return EMPTY

  /* ---- flow: source → action → output ---- */
  const split = flowSplit(text.slice(0, rawTitle.length))
  // when the title spells out the flow ("X into Y"), a verb from the subtitle doesn't get the middle
  const action = picks.find((p) => p.role === 'action' && (split < 0 || p.pos < rawTitle.length))
  const before = picks.filter((p) => p !== action && (split < 0 ? p.role === 'subject' || p.role === 'tech' : p.pos < split))
  const after = picks.filter((p) => p !== action && (split < 0 ? p.role === 'output' : p.pos > split && p.pos < rawTitle.length))
  const flowItems: TopicPick[] = []
  if (before[0]) flowItems.push(before[0])
  if (action) flowItems.push(action)
  const target = after.find((p) => !flowItems.includes(p))
  if (target) flowItems.push(target)
  const flowable = flowItems.length >= 2 && (split >= 0 || (!!action && !!target))
  const flow = flowable ? flowItems.map(item) : picks.slice(0, 3).map(item)

  /* ---- versus: one icon per side ---- */
  const sides = versusSides(rawTitle)
  let versus: SceneItem[] = []
  if (sides) {
    const sideIcon = (s: string, avoid: string) => {
      const low = s.toLowerCase()
      const sh = conceptHits(low)
      const r = rankHits(s, [...sh, ...genericHits(low, sh)], s.length)[0]
      return r?.icons.find((i) => i !== avoid) ?? null
    }
    const l = sideIcon(sides[0], '') ?? picks[0].icon
    let r = sideIcon(sides[1], l) ?? picks.find((p) => p.icon !== l)?.icon ?? picks[0].alts[0] ?? 'component'
    if (r === l) r = picks[0].alts.find((a) => a !== l) ?? 'component'
    versus = [
      { icon: l, label: sides[0] },
      { icon: r, label: sides[1] },
    ]
  }

  /*
   * Layout engine: every illustrated layout gets a fit score from the shape of
   * the title (how many topics, a flow, a comparison, a roundup, web/data/
   * signal topics). A small jitter seeded by the title breaks near-ties, so
   * similar posts don't all look alike, yet the same title always gets the
   * same cover. No model, no network: it runs on any device.
   */
  const has = (set: Set<string>) => picks.some((p) => set.has(p.concept))
  const n = picks.length
  const roundup = /\b(best|top|tools|alternatives?|vs\.?|versus|compared?|comparison|stack|landscape|ecosystem)\b/.test(text)
  const score: Record<IllustratedStyle, number> = {
    focus: n <= 2 ? 3 : 1.6,
    pair: versus.length ? 3.4 : flowable && flowItems.length === 2 ? 3 : n >= 2 ? 1.2 : 0,
    stack: n >= 3 ? 2.2 : n === 2 ? 1 : 0.4,
    grid: n >= 4 ? 2.6 : roundup ? 2.4 : n === 3 ? 1.3 : 0.3,
    window: has(WINDOW_CONCEPTS) ? 2.5 : 1,
    merge: flowable ? 2.9 : has(MERGE_CONCEPTS) ? 2.5 : n >= 2 ? 1 : 0.2,
    inspect: has(INSPECT_CONCEPTS) ? 2.8 : 0.5,
    hub: roundup ? 3.2 : n >= 3 ? 1.5 : 0.8,
  }
  const jitter = rng(hash(text))
  const illustrated = (Object.keys(score) as IllustratedStyle[])
    .map((st) => [st, score[st] + jitter() * 0.9] as const)
    .sort((x, y) => y[1] - x[1])
    .map(([st]) => st as SceneStyle)

  const styles: SceneStyle[] = [...illustrated]
  if (versus.length) styles.push('versus')
  if (flowable) styles.push('flow')
  styles.push(...((picks.length >= 3 ? ['bento', 'spotlight', 'orbit'] : ['spotlight', 'orbit', 'bento']) as SceneStyle[]))

  const all = picks.map(item)
  // a lone topic still deserves company: orbit it with other pictures of the same idea
  const padded = [...all]
  for (const alt of picks[0].alts) {
    if (padded.length >= 3) break
    if (!padded.some((p) => baseOf(p.icon) === baseOf(alt))) padded.push({ icon: alt, label: picks[0].label })
  }

  return {
    picks,
    styles,
    scenes: {
      hub: all,
      focus: all,
      pair: versus.length ? versus : flowable ? [flowItems[0], flowItems[flowItems.length - 1]].map(item) : all.slice(0, 2),
      stack: all,
      grid: all,
      window: all,
      // merge: sources first, the result last
      merge: (() => {
        const result = target ?? picks.find((p) => p.role === 'output') ?? picks[0]
        const sources = picks.filter((p) => p !== result && p !== action).slice(0, 3)
        const src = sources.length ? sources : picks.filter((p) => p !== result).slice(0, 3)
        return [...(src.length ? src : picks[0].alts.slice(0, 2).map((a) => ({ icon: a, label: '' }))), result].map(item)
      })(),
      // inspect: the subject goes in the speech bubble, then what gets flagged
      inspect: all,
      spotlight: padded,
      orbit: padded,
      bento: all,
      flow,
      versus: versus.length ? versus : all.slice(0, 2),
      compose: all,
    },
  }
}

/* ------------------------------------------------------------------ */
/* Free-text search for the icon picker                                */
/* ------------------------------------------------------------------ */

export function searchIcons(query: string, limit = 60): string[] {
  const q = query.toLowerCase().trim()
  const index = getIconIndex()
  if (!q) return index ? index.filter((e) => !e.base).slice(0, limit).map((e) => e.name) : []
  const words = q.split(/[\s,]+/).filter(Boolean)

  // curated concepts first: typing "scraping" should surface globe-search
  const curated: string[] = []
  for (const c of CONCEPTS) if (words.some((w) => c.terms.includes(w) || c.id === w)) curated.push(...c.icons)

  if (!index) return [...new Set([...curated, ...[...ICON_NAME_SET].filter((n) => words.every((w) => n.includes(w)))])].slice(0, limit)

  const scored: [string, number][] = []
  for (const e of index) {
    let total = 0
    let all = true
    for (const w of words) {
      let s = 0
      if (e.name === w) s = 100
      else if (e.name.startsWith(w)) s = 60
      else if (e.name.split('-').includes(w)) s = 50
      else if (e.tags.includes(w)) s = 40
      else if (e.name.includes(w)) s = 25
      else if (e.tags.some((t) => t.includes(w))) s = 15
      else if (e.category === w) s = 10
      if (!s) {
        all = false
        break
      }
      total += s
    }
    if (all) scored.push([e.name, total + (e.base ? 0 : 6)])
  }
  scored.sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)
  return [...new Set([...curated, ...scored.map(([n]) => n)])].slice(0, limit)
}
