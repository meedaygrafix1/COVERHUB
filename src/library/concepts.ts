/**
 * Curated topic → icon map for the Kubai icon library.
 *
 * Each concept lists trigger terms and the icons that picture it, best first.
 * Anything not covered here still gets matched against the library's own tags
 * (see `match.ts`), so this list only needs the topics the blog writes about
 * most, and the ones where the tag search would pick the wrong icon.
 *
 * Roles decide who becomes the hero of a scene:
 *   subject  what the article is about (Amazon, prices, real estate…)
 *   action   what you do to it (scrape, monitor, automate…)
 *   output   what comes out (JSON, CSV, a dashboard…)
 *   tech     what you do it with (Python, an API, a database…)
 *   meta     framing words (tutorial, tools…), only used when nothing else matched
 */
export type ConceptRole = 'subject' | 'action' | 'output' | 'tech' | 'meta'

export interface Concept {
  id: string
  terms: string[]
  icons: string[]
  role: ConceptRole
  /** fixed display label; otherwise the matched word, as written in the title */
  label?: string
  /** below 1 = only wins when nothing stronger matched */
  weight?: number
  /** caption with the word as written in the title (Amazon, Postgres, Stripe) instead of `label` */
  named?: boolean
}

export const CONCEPTS: Concept[] = [
  /* ---------------- actions ---------------- */
  { id: 'scrape', role: 'action', label: 'Scrape', terms: ['scrape', 'scraping', 'scraper', 'scrapers', 'scraped', 'crawl', 'crawler', 'crawlers', 'crawling', 'spider', 'spiders', 'harvest', 'web scraping'], icons: ['globe-search', 'app-window', 'search', 'scan'] },
  { id: 'extract', role: 'action', label: 'Extract', terms: ['extract', 'extraction', 'extracting', 'extractor', 'parse', 'parsing', 'parser', 'pull data', 'collect', 'collecting'], icons: ['scan-text', 'filter', 'scan'] },
  { id: 'automate', role: 'action', label: 'Automate', terms: ['automate', 'automated', 'automating', 'automation', 'automations', 'automatically', 'workflow', 'workflows', 'n8n', 'zapier', 'make.com', 'pipeline', 'pipelines', 'etl'], icons: ['workflow', 'settings', 'robot-arm'] },
  { id: 'schedule', role: 'action', label: 'Schedule', terms: ['schedule', 'scheduled', 'scheduling', 'cron', 'daily', 'hourly', 'weekly', 'recurring'], icons: ['calendar-days', 'clock', 'timer'] },
  { id: 'monitor', role: 'action', label: 'Monitor', terms: ['monitor', 'monitors', 'monitoring', 'track', 'tracking', 'tracker', 'watch', 'watching', 'alert', 'alerts', 'observability'], icons: ['activity', 'gauge', 'radar', 'bell-ring'] },
  { id: 'search', role: 'action', label: 'Search', terms: ['search', 'searching', 'find', 'finding', 'lookup', 'discover', 'discovery', 'serp', 'serps'], icons: ['search', 'binoculars'] },
  { id: 'analyze', role: 'action', label: 'Analyze', terms: ['analyze', 'analyse', 'analyzing', 'analysis', 'analytics', 'insight', 'insights', 'metrics', 'measure', 'kpi', 'kpis'], icons: ['chart-bar', 'chart-line', 'presentation'] },
  { id: 'integrate', role: 'action', label: 'Integrate', terms: ['integrate', 'integrating', 'integration', 'integrations', 'connect', 'connecting', 'connector', 'connectors', 'plugin', 'plugins'], icons: ['plug', 'puzzle', 'link'] },
  { id: 'launch', role: 'action', label: 'Launch', terms: ['launch', 'launches', 'launched', 'launching', 'deploy', 'deploying', 'deployment', 'ship', 'shipping it', 'release', 'released', 'go live'], icons: ['rocket'] },
  { id: 'announce', role: 'meta', label: 'News', terms: ['announcing', 'announces', 'announcement', 'introducing', 'meet', 'welcome', 'now available'], icons: ['megaphone', 'party-popper'] },
  { id: 'build', role: 'action', label: 'Build', weight: 0.6, terms: ['build', 'building', 'builds', 'create', 'creating', 'make your own', 'diy'], icons: ['hammer', 'blocks', 'toolbox'] },
  { id: 'download', role: 'action', label: 'Export', terms: ['download', 'downloading', 'export', 'exporting', 'save to', 'backup', 'backups'], icons: ['download', 'export'] },
  { id: 'clean', role: 'action', label: 'Clean', terms: ['clean', 'cleaning', 'cleanup', 'dedupe', 'deduplicate', 'normalize', 'normalise', 'validate', 'validation', 'enrich', 'enrichment', 'transform', 'transforming'], icons: ['filter', 'list-checks', 'wand'] },
  { id: 'translate', role: 'action', label: 'Translate', terms: ['translate', 'translation', 'translations', 'multilingual', 'localization', 'languages'], icons: ['languages'] },
  { id: 'test', role: 'action', label: 'Test', terms: ['test', 'tests', 'testing', 'qa', 'debug', 'debugging', 'bug', 'bugs', 'troubleshoot', 'troubleshooting'], icons: ['bug', 'circle-check'] },
  { id: 'scale', role: 'action', label: 'Scale', terms: ['scale', 'scaling', 'scalable', 'at scale', 'performance', 'faster', 'speed', 'latency', 'optimize', 'optimise', 'optimizing'], icons: ['gauge', 'trending-up', 'layers'] },
  { id: 'sync', role: 'action', label: 'Sync', terms: ['sync', 'syncing', 'synchronize', 'refresh', 'real-time', 'realtime', 'live data'], icons: ['sync', 'rotate-cw'] },
  { id: 'send', role: 'action', label: 'Send', terms: ['send', 'sending', 'notify', 'notifications', 'notification', 'slack', 'discord', 'telegram'], icons: ['send', 'bell-ring', 'message-square'] },
  { id: 'compare', role: 'action', label: 'Compare', weight: 0.8, terms: ['compare', 'compared', 'comparing', 'comparison', 'benchmark', 'benchmarks', 'benchmarking', 'evaluate', 'evaluation'], icons: ['scale', 'git-compare', 'chart-bar'] },

  /* ---------------- outputs ---------------- */
  { id: 'json', role: 'output', label: 'JSON', terms: ['json', 'structured', 'structured data', 'schema', 'schemas', 'yaml'], icons: ['braces', 'file-code'] },
  { id: 'spreadsheet', named: true, role: 'output', label: 'Spreadsheet', terms: ['csv', 'excel', 'spreadsheet', 'spreadsheets', 'google sheets', 'sheets', 'xlsx', 'airtable', 'table', 'tables'], icons: ['file-spreadsheet', 'table'] },
  { id: 'database', named: true, role: 'output', label: 'Database', terms: ['database', 'databases', 'db', 'sql', 'postgres', 'postgresql', 'mysql', 'sqlite', 'supabase', 'mongodb', 'bigquery', 'snowflake', 'warehouse', 'data warehouse'], icons: ['database', 'server'] },
  { id: 'dashboard', role: 'output', label: 'Dashboard', terms: ['dashboard', 'dashboards', 'report', 'reports', 'reporting', 'visualize', 'visualization', 'chart', 'charts', 'graph', 'graphs'], icons: ['layout-dashboard', 'chart-pie', 'file-chart'] },
  { id: 'data', role: 'output', label: 'Data', weight: 0.55, terms: ['data', 'dataset', 'datasets', 'records', 'information'], icons: ['database', 'layers', 'chart-pie'] },
  { id: 'markdown', role: 'output', label: 'Markdown', terms: ['markdown', 'plain text', 'clean text', 'llm-ready'], icons: ['file-text', 'type'] },

  /* ---------------- tech ---------------- */
  { id: 'python', named: true, role: 'tech', label: 'Python', terms: ['python', 'pandas', 'django', 'flask', 'fastapi', 'jupyter', 'beautifulsoup', 'beautiful soup', 'bs4', 'scrapy', 'requests', 'httpx', 'selenium'], icons: ['terminal', 'code', 'file-code'] },
  { id: 'javascript', named: true, role: 'tech', label: 'JavaScript', terms: ['javascript', 'js', 'node', 'nodejs', 'node.js', 'typescript', 'ts', 'react', 'next.js', 'nextjs', 'npm', 'deno', 'bun', 'cheerio'], icons: ['braces', 'code', 'file-code'] },
  { id: 'api', role: 'tech', label: 'API', terms: ['api', 'apis', 'endpoint', 'endpoints', 'rest api', 'rest apis', 'graphql', 'sdk', 'sdks', 'http', 'requests', 'oauth', 'api key'], icons: ['plug', 'component', 'key-round'] },
  { id: 'webhook', role: 'tech', label: 'Webhooks', terms: ['webhook', 'webhooks', 'callback', 'callbacks', 'event-driven', 'events api'], icons: ['webhook'] },
  { id: 'browser', named: true, role: 'tech', label: 'Browser', terms: ['browser', 'browsers', 'headless', 'puppeteer', 'playwright', 'chrome', 'chromium', 'firefox', 'extension', 'chrome extension'], icons: ['app-window', 'monitor', 'cursor'] },
  { id: 'proxy', role: 'tech', label: 'Proxies', terms: ['proxy', 'proxies', 'residential', 'rotating', 'rotate', 'ip', 'ips', 'ip address', 'vpn', 'geo-targeting'], icons: ['router', 'network', 'globe'] },
  { id: 'antibot', role: 'subject', label: 'Anti-bot', terms: ['captcha', 'captchas', 'recaptcha', 'anti-bot', 'antibot', 'bot detection', 'cloudflare', 'blocked', 'blocking', 'blocks', 'fingerprint', 'fingerprinting', 'rate limit', 'rate limits', 'rate limiting', 'ban', 'bans'], icons: ['shield', 'brick-wall', 'fingerprint'] },
  { id: 'queue', role: 'tech', label: 'Queue', terms: ['queue', 'queues', 'async', 'asynchronous', 'batch', 'batches', 'background jobs', 'job queue', 'workers', 'concurrency', 'concurrent', 'parallel', 'retries', 'retry', 'polling'], icons: ['layers', 'rows', 'list-ordered'] },
  { id: 'cloud', named: true, role: 'tech', label: 'Cloud', terms: ['cloud', 'aws', 'gcp', 'azure', 'serverless', 'lambda', 'server', 'servers', 'infrastructure', 'hosting', 'kubernetes', 'docker', 'container', 'containers', 'vercel'], icons: ['cloud', 'server-rack', 'container'] },
  { id: 'git', named: true, role: 'tech', label: 'GitHub', terms: ['git', 'github', 'gitlab', 'open source', 'open-source', 'repo', 'repos', 'repository', 'pull request', 'commit', 'commits'], icons: ['git-branch', 'git-pull-request', 'git-merge'] },
  { id: 'ai', named: true, role: 'tech', label: 'AI', terms: ['ai', 'llm', 'llms', 'gpt', 'chatgpt', 'claude', 'openai', 'anthropic', 'gemini', 'machine learning', 'ml', 'genai', 'generative', 'prompt', 'prompts', 'ai-powered'], icons: ['sparkles', 'brain', 'bot'] },
  { id: 'agent', role: 'subject', label: 'Agents', terms: ['agent', 'agents', 'agentic', 'ai agent', 'ai agents', 'assistant', 'assistants', 'chatbot', 'chatbots', 'copilot'], icons: ['bot', 'sparkles', 'messages'] },
  { id: 'mcp', role: 'tech', label: 'MCP', terms: ['mcp', 'model context protocol', 'mcp server', 'tool calling', 'function calling'], icons: ['plug', 'component', 'bot'] },
  { id: 'rag', role: 'tech', label: 'RAG', terms: ['rag', 'embedding', 'embeddings', 'vector', 'vectors', 'vector database', 'semantic search', 'knowledge base', 'retrieval'], icons: ['layers', 'brain', 'database'] },
  { id: 'regex', role: 'tech', label: 'Selectors', terms: ['regex', 'regular expression', 'regular expressions', 'selector', 'selectors', 'xpath', 'css selector', 'css selectors', 'dom'], icons: ['regex', 'text-select', 'brackets'] },
  { id: 'cli', role: 'tech', label: 'CLI', terms: ['cli', 'terminal', 'command line', 'command-line', 'bash', 'shell', 'curl'], icons: ['terminal'] },
  { id: 'code', role: 'tech', label: 'Code', weight: 0.7, terms: ['code', 'coding', 'developer', 'developers', 'programming', 'script', 'scripts', 'no-code', 'low-code', 'library', 'libraries', 'framework', 'frameworks'], icons: ['code', 'terminal', 'file-code'] },
  { id: 'mobile', role: 'tech', label: 'Mobile', terms: ['mobile', 'ios', 'android', 'mobile app', 'mobile apps', 'app store', 'play store'], icons: ['smartphone', 'tablet-smartphone'] },
  { id: 'security', role: 'subject', label: 'Security', terms: ['security', 'protection', 'privacy', 'auth', 'authentication', 'login', 'logins', 'password', 'passwords', 'encryption', 'encrypt'], icons: ['shield-check', 'lock', 'fingerprint'] },
  { id: 'cookies', role: 'tech', label: 'Sessions', terms: ['cookie', 'cookies', 'session', 'sessions', 'headers', 'user agent', 'user-agent'], icons: ['cookie', 'key'] },
  { id: 'pagination', role: 'tech', label: 'Pagination', terms: ['pagination', 'paginate', 'paginated', 'infinite scroll', 'next page', 'load more'], icons: ['list', 'chevrons-down'] },
  { id: 'errors', role: 'subject', label: 'Errors', terms: ['error', 'errors', 'exception', 'exceptions', 'failure', 'failures', 'fail', 'failing', 'broken', '403', '429', 'timeout', 'timeouts'], icons: ['triangle-alert', 'circle-x', 'bug'] },
  { id: 'files', role: 'tech', label: 'Files', terms: ['file', 'files', 'storage', 'upload', 'uploads', 's3', 'google drive', 'dropbox', 'folder', 'folders'], icons: ['folder', 'cloud-upload', 'hard-drive'] },

  /* ---------------- subjects ---------------- */
  { id: 'website', role: 'subject', label: 'Websites', weight: 0.85, terms: ['website', 'websites', 'web', 'webpage', 'webpages', 'web page', 'web pages', 'page', 'pages', 'site', 'sites', 'url', 'urls', 'html', 'internet', 'online', 'dynamic pages', 'javascript-heavy'], icons: ['globe', 'app-window'] },
  { id: 'ecommerce', named: true, role: 'subject', terms: ['amazon', 'ebay', 'shopify', 'walmart', 'etsy', 'aliexpress', 'temu', 'target.com', 'best buy', 'ecommerce', 'e-commerce', 'online store', 'online stores', 'shops', 'shopping', 'products', 'retail', 'marketplace', 'marketplaces', 'catalog', 'catalogue', 'product listings', 'sku', 'skus'], icons: ['shopping-cart', 'store', 'shopping-bag', 'package'] },
  { id: 'prices', role: 'subject', label: 'Prices', terms: ['price', 'prices', 'pricing', 'cost', 'costs', 'deal', 'deals', 'discount', 'discounts', 'coupon', 'coupons', 'cheap', 'cheapest', 'price tracker', 'price tracking'], icons: ['tag', 'badge-percent', 'currency-dollar'] },
  { id: 'finance', named: true, role: 'subject', label: 'Finance', terms: ['stock', 'stocks', 'finance', 'financial', 'crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'trading', 'trader', 'traders', 'market data', 'invest', 'investing', 'investment', 'investors', 'fintech', 'forex'], icons: ['chart-candlestick', 'coins', 'trending-up', 'landmark'] },
  { id: 'payments', named: true, role: 'subject', label: 'Payments', terms: ['payment', 'payments', 'billing', 'invoice', 'invoices', 'stripe', 'checkout', 'subscription', 'subscriptions', 'receipt', 'receipts'], icons: ['credit-card', 'receipt', 'wallet'] },
  { id: 'money', role: 'subject', label: 'Revenue', terms: ['revenue', 'sales', 'money', 'budget', 'profit', 'roi', 'save money', 'savings'], icons: ['banknote', 'coins', 'piggy-bank'] },
  { id: 'jobs', named: true, role: 'subject', label: 'Jobs', terms: ['hiring', 'recruiting', 'recruitment', 'recruiters', 'careers', 'job board', 'job boards', 'job listings', 'job postings', 'job posts', 'indeed', 'glassdoor', 'resume', 'resumes', 'candidates'], icons: ['briefcase', 'id-badge', 'users'] },
  { id: 'realestate', named: true, role: 'subject', label: 'Real estate', terms: ['real estate', 'property', 'properties', 'zillow', 'redfin', 'rental', 'rentals', 'housing', 'homes', 'house', 'airbnb', 'apartments', 'listings data'], icons: ['home', 'building', 'map-pin'] },
  { id: 'travel', named: true, role: 'subject', label: 'Travel', terms: ['travel', 'hotel', 'hotels', 'booking', 'booking.com', 'expedia', 'tripadvisor', 'flight', 'flights', 'airline', 'airlines', 'trip', 'trips', 'tourism'], icons: ['plane', 'hotel', 'luggage', 'boarding-pass'] },
  { id: 'food', named: true, role: 'subject', label: 'Restaurants', terms: ['restaurant', 'restaurants', 'food', 'menu', 'menus', 'yelp', 'recipe', 'recipes', 'doordash', 'ubereats', 'grocery', 'groceries'], icons: ['utensils', 'chef-hat', 'pizza'] },
  { id: 'maps', named: true, role: 'subject', label: 'Maps', terms: ['google maps', 'maps', 'map', 'local business', 'local businesses', 'location', 'locations', 'places', 'address', 'addresses', 'geo', 'geolocation', 'nearby', 'directory', 'directories'], icons: ['map-pin', 'map', 'navigation'] },
  { id: 'social', named: true, role: 'subject', label: 'Social', terms: ['social', 'social media', 'twitter', 'x.com', 'instagram', 'facebook', 'reddit', 'threads', 'bluesky', 'influencer', 'influencers', 'posts', 'followers', 'hashtag', 'hashtags', 'comments'], icons: ['messages', 'users', 'thumbs-up', 'share'] },
  { id: 'linkedin', role: 'subject', label: 'LinkedIn', terms: ['linkedin', 'profiles', 'profile', 'people data', 'professionals'], icons: ['id-badge', 'user-group', 'briefcase'] },
  { id: 'video', named: true, role: 'subject', label: 'Video', terms: ['youtube', 'tiktok', 'video', 'videos', 'streaming', 'twitch', 'transcript', 'transcripts', 'shorts'], icons: ['play', 'video', 'clapperboard'] },
  { id: 'leads', named: true, role: 'subject', label: 'Leads', terms: ['lead', 'leads', 'lead generation', 'lead gen', 'prospect', 'prospects', 'prospecting', 'contacts', 'crm', 'hubspot', 'salesforce', 'b2b', 'outreach'], icons: ['target', 'contact-book', 'users'] },
  { id: 'email', named: true, role: 'subject', label: 'Email', terms: ['email', 'emails', 'e-mail', 'newsletter', 'newsletters', 'inbox', 'gmail', 'cold email', 'mailing list'], icons: ['mail', 'mails', 'send'] },
  { id: 'reviews', named: true, role: 'subject', label: 'Reviews', terms: ['review', 'reviews', 'rating', 'ratings', 'sentiment', 'feedback', 'testimonials', 'complaints', 'trustpilot', 'g2', 'capterra'], icons: ['star', 'message-square', 'thumbs-up'] },
  { id: 'news', named: true, role: 'subject', label: 'News', terms: ['news', 'article', 'articles', 'headlines', 'press', 'blog', 'blogs', 'blog posts', 'rss', 'feed', 'feeds', 'media monitoring', 'content'], icons: ['newspaper', 'rss', 'file-text'] },
  { id: 'seo', named: true, role: 'subject', label: 'SEO', terms: ['seo', 'keyword', 'keywords', 'rankings', 'ranking', 'google', 'bing', 'backlinks', 'search engine', 'search engines', 'organic'], icons: ['search', 'trending-up', 'chart-line'] },
  { id: 'marketing', role: 'subject', label: 'Marketing', terms: ['marketing', 'ads', 'ad', 'ad library', 'campaign', 'campaigns', 'advertising', 'advertisers', 'growth', 'brand', 'brands', 'funnel', 'conversion', 'conversions'], icons: ['megaphone', 'target', 'chart-funnel'] },
  { id: 'competitors', role: 'subject', label: 'Competitors', terms: ['competitor', 'competitors', 'competitive', 'competition', 'market research', 'market intelligence', 'intelligence', 'benchmark competitors', 'spy'], icons: ['binoculars', 'radar', 'target'] },
  { id: 'weather', role: 'subject', label: 'Weather', terms: ['weather', 'climate', 'forecast', 'forecasts', 'temperature'], icons: ['cloud-sun', 'thermometer'] },
  { id: 'sports', role: 'subject', label: 'Sports', terms: ['sports', 'sport', 'scores', 'football', 'soccer', 'nba', 'nfl', 'betting', 'odds', 'fixtures'], icons: ['trophy', 'soccer-ball', 'basketball'] },
  { id: 'health', role: 'subject', label: 'Health', terms: ['health', 'healthcare', 'medical', 'clinical', 'pharma', 'pharmacy', 'hospital', 'hospitals', 'doctors', 'patients'], icons: ['heart-pulse', 'stethoscope', 'hospital-cross'] },
  { id: 'research', role: 'subject', label: 'Research', terms: ['research', 'academic', 'papers', 'paper', 'scholar', 'study', 'studies', 'students', 'education', 'university', 'universities', 'courses'], icons: ['graduation-cap', 'book-open', 'microscope'] },
  { id: 'science', role: 'subject', label: 'Science', terms: ['science', 'scientific', 'chemistry', 'biology', 'physics', 'lab', 'experiment', 'experiments'], icons: ['flask', 'atom', 'dna'] },
  { id: 'legal', role: 'subject', label: 'Legal', terms: ['legal', 'law', 'laws', 'lawful', 'legality', 'contract', 'contracts', 'compliance', 'compliant', 'gdpr', 'ccpa', 'terms of service', 'ethical', 'ethics', 'robots.txt', 'copyright'], icons: ['scale', 'contract', 'stamp'] },
  { id: 'government', role: 'subject', label: 'Public data', terms: ['government', 'public data', 'open data', 'census', 'public records', 'court records', 'regulation', 'regulations'], icons: ['landmark', 'building'] },
  { id: 'logistics', role: 'subject', label: 'Logistics', terms: ['shipping', 'logistics', 'supply chain', 'inventory', 'stock levels', 'delivery', 'deliveries', 'fulfillment', 'warehouses', 'packages'], icons: ['truck', 'package', 'warehouse'] },
  { id: 'cars', named: true, role: 'subject', label: 'Automotive', terms: ['car', 'cars', 'automotive', 'vehicle', 'vehicles', 'dealership', 'dealerships'], icons: ['car', 'car-front'] },
  { id: 'images', role: 'subject', label: 'Images', terms: ['image', 'images', 'photo', 'photos', 'screenshot', 'screenshots', 'pictures', 'thumbnails', 'visual', 'visuals'], icons: ['image', 'camera', 'images'] },
  { id: 'documents', named: true, role: 'subject', label: 'Documents', terms: ['pdf', 'pdfs', 'document', 'documents', 'docx', 'word documents', 'ocr', 'scanned', 'forms', 'contracts pdf'], icons: ['file-text', 'files', 'scan-text'] },
  { id: 'docs', role: 'subject', label: 'Docs', terms: ['documentation', 'docs', 'reference', 'handbook', 'knowledge'], icons: ['book-open', 'notebook'] },
  { id: 'events', role: 'subject', label: 'Events', terms: ['event', 'events', 'tickets', 'ticket', 'concert', 'concerts', 'conference', 'conferences', 'meetup', 'webinar'], icons: ['ticket', 'calendar'] },
  { id: 'music', named: true, role: 'subject', label: 'Music', terms: ['music', 'spotify', 'song', 'songs', 'podcast', 'podcasts', 'lyrics', 'audio'], icons: ['music', 'headphones', 'podcast'] },
  { id: 'games', named: true, role: 'subject', label: 'Games', terms: ['game', 'games', 'gaming', 'steam', 'esports', 'gamers'], icons: ['gamepad', 'game-console'] },
  { id: 'customers', role: 'subject', label: 'Customers', terms: ['customer', 'customers', 'users', 'user', 'audience', 'audiences', 'clients', 'community'], icons: ['users', 'user-group'] },
  { id: 'team', role: 'subject', label: 'Teams', terms: ['team', 'teams', 'collaboration', 'collaborate', 'company', 'companies', 'enterprise', 'enterprises', 'startup', 'startups', 'agency', 'agencies'], icons: ['user-group', 'building-office', 'users-round'] },
  { id: 'award', role: 'subject', label: 'Award', terms: ['award', 'awards', 'ranks', 'ranked', '#1', 'number one', 'milestone', 'milestones', 'winner', 'wins', 'won', 'leader', 'top-rated', 'g2 leader'], icons: ['trophy', 'medal', 'award'] },
  { id: 'changelog', role: 'subject', label: 'Updates', terms: ['changelog', 'release notes', 'update', 'updates', 'version', 'whats new', "what's new", 'new features', 'feature', 'features', 'improvements'], icons: ['sparkles', 'list-checks', 'git-commit'] },
  { id: 'partnership', role: 'subject', label: 'Partners', terms: ['partner', 'partners', 'partnership', 'partnerships', 'collaborating with', 'teams up'], icons: ['link', 'users', 'hand-heart'] },
  { id: 'ideas', role: 'subject', label: 'Ideas', weight: 0.7, terms: ['idea', 'ideas', 'use case', 'use cases', 'tips', 'strategy', 'strategies', 'lessons', 'best practices', 'playbook'], icons: ['lightbulb', 'list-checks', 'target'] },
  { id: 'time', role: 'subject', label: 'Time', weight: 0.7, terms: ['time', 'hours', 'minutes', 'seconds', 'history', 'historical', 'archive', 'archived', 'wayback'], icons: ['history', 'hourglass', 'clock'] },

  /* ---------------- meta (framing only) ---------------- */
  { id: 'tutorial', role: 'meta', label: 'Guide', weight: 0.4, terms: ['tutorial', 'tutorials', 'guide', 'guides', 'how to', 'how-to', 'step by step', 'step-by-step', 'learn', 'beginner', 'beginners', 'walkthrough', 'getting started', 'quickstart', 'introduction'], icons: ['book-open', 'graduation-cap', 'lightbulb'] },
  { id: 'tools', role: 'meta', label: 'Tools', weight: 0.5, terms: ['tools', 'tool', 'toolkit', 'stack', 'software', 'platform', 'platforms', 'services', 'solutions', 'alternatives', 'alternative', 'best', 'top'], icons: ['toolbox', 'podium', 'wrench'] },
]

/**
 * Words that turn an icon into one of its badged variants (`database` →
 * `database-lock`). Applied to the scene's hero when the variant exists.
 */
/** `icon` is added as its own pick when no matched icon has that badge. */
export const MODIFIERS: { badge: string; terms: string[]; icon?: string }[] = [
  { badge: 'lock', icon: 'shield-check', terms: ['secure', 'security', 'secure', 'securely', 'private', 'protected', 'encrypted', 'authenticated', 'behind login', 'login-protected', 'gated'] },
  { badge: 'sparkle', icon: 'sparkles', terms: ['ai', 'ai-powered', 'llm', 'llms', 'smart', 'gpt', 'claude', 'intelligent', 'magic', 'generative'] },
  { badge: 'search', terms: ['search', 'find', 'finding', 'lookup', 'discover', 'scrape', 'scraping', 'extract', 'extracting', 'crawl', 'crawling'] },
  { badge: 'clock', icon: 'clock', terms: ['schedule', 'scheduled', 'cron', 'daily', 'hourly', 'historical', 'history', 'timeout', 'real-time', 'realtime'] },
  { badge: 'sync', terms: ['sync', 'syncing', 'refresh', 'rotate', 'rotating', 'update', 'updates', 'live'] },
  { badge: 'check', terms: ['validate', 'validation', 'verified', 'verify', 'reliable', 'accurate', 'consistent', 'clean', 'correct'] },
  { badge: 'bolt', icon: 'gauge', terms: ['fast', 'faster', 'fastest', 'instant', 'instantly', 'speed', 'quick', 'quickly', 'performance'] },
  { badge: 'alert', terms: ['alert', 'alerts', 'error', 'errors', 'warning', 'blocked', 'failing', 'broken'] },
  { badge: 'cog', terms: ['configure', 'config', 'configuration', 'settings', 'setup', 'set up', 'automate', 'automated', 'automation'] },
  { badge: 'down', terms: ['download', 'export', 'exporting'] },
  { badge: 'up', terms: ['upload', 'uploading', 'publish'] },
  { badge: 'plus', terms: ['new', 'add', 'adding', 'introducing', 'create'] },
  { badge: 'star', terms: ['best', 'top', 'favorite', 'favourite', 'featured', 'premium'] },
]
