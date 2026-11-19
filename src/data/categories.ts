import type { BackgroundId, CategoryId, TemplateId } from '../lib/types'

export interface CategoryDef {
  id: CategoryId
  name: string
  eyebrow: string
  templates: TemplateId[]
  illustrations: string[]
  backgrounds: BackgroundId[]
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: 'tutorials',
    name: 'Technical tutorial',
    eyebrow: 'Tutorial',
    templates: ['split', 'framed', 'bleed'],
    illustrations: ['browser-extract', 'code-editor', 'terminal'],
    backgrounds: ['sky', 'mist', 'paper'],
  },
  {
    id: 'api',
    name: 'API & integration guide',
    eyebrow: 'API Guide',
    templates: ['spotlight', 'split', 'bento'],
    illustrations: ['api-hub', 'code-editor', 'workflow'],
    backgrounds: ['blueprint', 'sky', 'midnight'],
  },
  {
    id: 'scraping',
    name: 'Web scraping tutorial',
    eyebrow: 'Web Scraping',
    templates: ['showcase', 'split', 'framed'],
    illustrations: ['scrape-flow', 'browser-extract', 'search'],
    backgrounds: ['sky', 'aurora', 'mist'],
  },
  {
    id: 'python-js',
    name: 'Python & JavaScript',
    eyebrow: 'Python',
    templates: ['bleed', 'dark-panel', 'split'],
    illustrations: ['code-editor', 'terminal'],
    backgrounds: ['mist', 'sky', 'ink'],
  },
  {
    id: 'product',
    name: 'Product announcement',
    eyebrow: 'Announcement',
    templates: ['headline', 'spotlight', 'dark-panel'],
    illustrations: ['badge', 'release'],
    backgrounds: ['blueprint', 'cobalt', 'sky'],
  },
  {
    id: 'data-automation',
    name: 'Data extraction & automation',
    eyebrow: 'Automation',
    templates: ['dark-panel', 'showcase', 'bento'],
    illustrations: ['json-fanout', 'workflow', 'queue', 'database'],
    backgrounds: ['midnight', 'sky', 'aurora'],
  },
  {
    id: 'comparisons',
    name: 'Comparisons & alternatives',
    eyebrow: 'Comparison',
    templates: ['versus', 'editorial'],
    illustrations: ['versus'],
    backgrounds: ['sky', 'paper', 'mist'],
  },
  {
    id: 'engineering',
    name: 'General engineering',
    eyebrow: 'Engineering',
    templates: ['editorial', 'framed', 'split'],
    illustrations: ['network', 'geometric', 'dashboard'],
    backgrounds: ['paper', 'mist', 'ink'],
  },
]

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, CategoryDef>
