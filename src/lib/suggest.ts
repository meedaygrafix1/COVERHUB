import { stripMarks } from './text'
import { matchTopics, type TopicMatch } from '../library/match'
import type { CategoryId, CodeLang, TemplateId } from './types'

/**
 * Deterministic keyword rules. No models, no network: each rule lists
 * trigger terms and what they vote for. Earlier items in each list carry
 * more weight.
 */
interface Rule {
  label: string
  terms: string[]
  illustrations?: string[]
  templates?: TemplateId[]
  category?: CategoryId
  lang?: CodeLang
  weight?: number
}

export const RULES: Rule[] = [
  {
    label: 'Python',
    terms: ['python', 'pandas', 'django', 'flask', 'fastapi', 'pip', 'beautifulsoup', 'bs4', 'scrapy', 'requests', 'httpx', 'jupyter', 'py'],
    illustrations: ['code-editor', 'terminal'],
    templates: ['bleed', 'split'],
    category: 'python-js',
    lang: 'python',
  },
  {
    label: 'JavaScript',
    terms: ['javascript', 'js', 'node', 'nodejs', 'node.js', 'typescript', 'ts', 'puppeteer', 'playwright', 'npm', 'react', 'next.js', 'nextjs', 'deno', 'bun'],
    illustrations: ['code-editor', 'terminal'],
    templates: ['bleed', 'dark-panel'],
    category: 'python-js',
    lang: 'javascript',
  },
  {
    label: 'API',
    terms: ['api', 'apis', 'endpoint', 'endpoints', 'rest', 'graphql', 'integration', 'integrations', 'integrate', 'webhook', 'webhooks', 'sdk', 'http', 'oauth'],
    illustrations: ['api-hub', 'code-editor', 'workflow'],
    templates: ['spotlight', 'bento'],
    category: 'api',
  },
  {
    label: 'Scraping',
    terms: ['scrape', 'scraping', 'scraper', 'scrapers', 'crawl', 'crawler', 'crawling', 'spider', 'html', 'selector', 'selectors', 'xpath', 'css selector'],
    illustrations: ['scrape-flow', 'browser-extract', 'search'],
    templates: ['showcase', 'split'],
    category: 'scraping',
  },
  {
    label: 'Async & jobs',
    terms: ['async', 'asynchronous', 'job', 'jobs', 'queue', 'queues', 'batch', 'background', 'concurrent', 'concurrency', 'parallel', 'worker', 'workers', 'retry', 'retries', 'polling'],
    illustrations: ['queue', 'workflow'],
    templates: ['dark-panel', 'split'],
    category: 'data-automation',
  },
  {
    label: 'Documents',
    terms: ['pdf', 'pdfs', 'document', 'documents', 'docx', 'markdown', 'parse', 'parsing', 'parser', 'invoice', 'invoices', 'ocr', 'docs'],
    illustrations: ['document'],
    templates: ['split', 'framed'],
    category: 'data-automation',
  },
  {
    label: 'Structured data',
    terms: ['json', 'structured', 'schema', 'extract', 'extraction', 'extracting', 'dataset', 'datasets', 'csv', 'excel', 'fields', 'consistent', 'normalize', 'unified'],
    illustrations: ['json-fanout', 'database'],
    templates: ['showcase', 'dark-panel'],
    category: 'data-automation',
  },
  {
    label: 'Data pipelines',
    terms: ['database', 'sql', 'postgres', 'postgresql', 'mysql', 'storage', 'warehouse', 'pipeline', 'pipelines', 'etl', 'catalog', 'enrichment', 'leads', 'supabase', 'bigquery'],
    illustrations: ['database', 'workflow', 'json-fanout'],
    templates: ['dark-panel', 'bento'],
    category: 'data-automation',
  },
  {
    label: 'Automation',
    terms: ['automation', 'automate', 'automated', 'schedule', 'scheduled', 'cron', 'workflow', 'workflows', 'n8n', 'zapier', 'make.com', 'refresh', 'monitors'],
    illustrations: ['workflow', 'queue', 'dashboard'],
    templates: ['dark-panel', 'bento'],
    category: 'data-automation',
  },
  {
    label: 'Comparison',
    terms: ['vs', 'vs.', 'versus', 'alternative', 'alternatives', 'compare', 'compared', 'comparison', 'comparing', 'or'],
    illustrations: ['versus'],
    templates: ['versus', 'editorial'],
    category: 'comparisons',
    weight: 1.6,
  },
  {
    label: 'Roundup',
    terms: ['best', 'top', 'tools', 'list'],
    illustrations: ['versus', 'search'],
    templates: ['editorial', 'versus'],
    category: 'comparisons',
    weight: 0.8,
  },
  {
    label: 'Announcement',
    terms: ['announcing', 'introducing', 'launch', 'launches', 'launched', 'release', 'released', 'new', 'now available', 'ranks', 'ranked', '#1', 'award', 'milestone', 'changelog', 'update', 'welcome', 'partnership'],
    illustrations: ['badge', 'release'],
    templates: ['headline', 'spotlight'],
    category: 'product',
    weight: 1.3,
  },
  {
    label: 'Tutorial',
    terms: ['how to', 'tutorial', 'guide', 'step by step', 'step-by-step', 'build', 'learn', 'getting started', 'beginner', 'beginners', 'walkthrough', 'quickstart'],
    templates: ['split', 'framed'],
    category: 'tutorials',
    weight: 0.7,
  },
  {
    label: 'Browsers & proxies',
    terms: ['proxy', 'proxies', 'captcha', 'captchas', 'network', 'ip', 'ips', 'rotate', 'rotating', 'headless', 'browser', 'browsers', 'fingerprint', 'block', 'blocked', 'rate limit'],
    illustrations: ['network', 'browser-extract'],
    templates: ['split', 'dark-panel'],
    category: 'scraping',
  },
  {
    label: 'Search',
    terms: ['search', 'serp', 'google', 'results', 'ads', 'ad library', 'maps', 'amazon', 'ebay', 'reddit', 'facebook', 'linkedin', 'youtube', 'tiktok', 'x post', 'twitter', 'social'],
    illustrations: ['search', 'scrape-flow'],
    templates: ['split', 'showcase'],
    category: 'scraping',
    weight: 0.9,
  },
  {
    label: 'AI tooling',
    terms: ['mcp', 'agent', 'agents', 'llm', 'llms', 'rag', 'ai', 'claude', 'chatgpt', 'assistant', 'embedding', 'embeddings', 'vector'],
    illustrations: ['agent-chat', 'network'],
    templates: ['split', 'spotlight'],
    category: 'engineering',
  },
  {
    label: 'Monitoring',
    terms: ['monitor', 'monitoring', 'analytics', 'metrics', 'dashboard', 'price', 'prices', 'pricing', 'tracking', 'track', 'trends', 'alerts', 'complaints'],
    illustrations: ['dashboard', 'workflow'],
    templates: ['split', 'bento'],
    category: 'data-automation',
  },
  {
    label: 'Engineering',
    terms: ['architecture', 'engineering', 'scale', 'scaling', 'performance', 'infrastructure', 'system', 'systems', 'design', 'latency', 'reliability', 'evaluate', 'evaluation', 'benchmark', 'testing'],
    illustrations: ['network', 'geometric', 'dashboard'],
    templates: ['editorial', 'framed'],
    category: 'engineering',
  },
]

export interface Suggestion {
  matched: { label: string; terms: string[] }[]
  category: CategoryId
  templates: TemplateId[]
  illustrations: string[]
  lang: CodeLang | null
  fallback: boolean
  /** library icons matched to the title, for the topic scene */
  topics: TopicMatch
}

const FALLBACK: Omit<Suggestion, 'matched' | 'topics'> = {
  category: 'engineering',
  templates: ['editorial', 'split', 'framed'],
  illustrations: ['abstract', 'geometric', 'network'],
  lang: null,
  fallback: true,
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hits(text: string, term: string): boolean {
  if (term.includes(' ') || /[^a-z0-9]/.test(term)) {
    // phrases and symbol terms: boundary-aware substring
    const re = new RegExp(`(^|[^a-z0-9])${escapeRe(term)}($|[^a-z0-9])`)
    return re.test(text)
  }
  return new RegExp(`\\b${term}\\b`).test(text)
}

export function suggest(title: string, subtitle = ''): Suggestion {
  const text = stripMarks(`${title} ${subtitle}`).toLowerCase()
  const topics = matchTopics(title, subtitle)
  if (!text.trim()) return { ...FALLBACK, matched: [], topics }

  const cat = new Map<CategoryId, number>()
  const tpl = new Map<TemplateId, number>()
  const ill = new Map<string, number>()
  const lang = new Map<CodeLang, number>()
  const matched: Suggestion['matched'] = []

  for (const r of RULES) {
    // "or" only counts as comparison in "X or Y?" patterns
    const terms = r.terms.filter((t) => (t === 'or' ? /\b\w+ or \w+\?/.test(text) : hits(text, t)))
    if (!terms.length) continue
    const w = (r.weight ?? 1) * (1 + Math.min(terms.length - 1, 2) * 0.35)
    matched.push({ label: r.label, terms })
    if (r.category) cat.set(r.category, (cat.get(r.category) ?? 0) + w)
    r.templates?.forEach((t, i) => tpl.set(t, (tpl.get(t) ?? 0) + w * (1 - i * 0.25)))
    r.illustrations?.forEach((t, i) => ill.set(t, (ill.get(t) ?? 0) + w * (1 - i * 0.2)))
    if (r.lang) lang.set(r.lang, (lang.get(r.lang) ?? 0) + w)
  }

  if (!matched.length) return { ...FALLBACK, matched: [], topics, fallback: topics.picks.length === 0 }

  const rank = <T,>(m: Map<T, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k)
  const categories = rank(cat)
  const templates = rank(tpl)
  const illustrations = rank(ill)
  const category = categories[0] ?? FALLBACK.category

  // Only a tutorial signal with no visual subject? fall back to neutral visuals.
  if (!illustrations.length) illustrations.push(...FALLBACK.illustrations)
  if (!templates.length) templates.push(...FALLBACK.templates)

  return {
    matched,
    category,
    templates: templates.slice(0, 4),
    illustrations: illustrations.slice(0, 5),
    lang: rank(lang)[0] ?? null,
    fallback: false,
    topics,
  }
}
