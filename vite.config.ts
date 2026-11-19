import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Windows drive-letter case. A shell (VS Code's included) can start in `c:\…`
 * while Node reports `C:\…`, and different resolvers (root, tsconfig `paths`,
 * the alias) pick different spellings. The bundler then treats
 * `c:/…/node_modules/react` and `C:/…/node_modules/react` as two modules and
 * ships React twice, and every hook fails at startup ("Invalid hook call").
 * Normalise every resolved path to an uppercase drive letter.
 */
function canonicalDriveLetter(): Plugin {
  return {
      name: 'canonical-drive-letter',
      enforce: 'pre',
      async resolveId(id, importer, options) {
        if (process.platform !== 'win32') return null
        const r = await this.resolve(id, importer, { ...options, skipSelf: true })
        // leave Vite's own client modules alone: Vite finds them by its own path spelling to inject
        // __DEFINES__, and renaming them breaks the dev client ("__DEFINES__ is not defined")
        if (r && /[\\/]node_modules[\\/]vite[\\/]dist[\\/]client[\\/]/.test(r.id)) return r
        if (r && /^[a-z]:[\\/]/.test(r.id)) return { ...r, id: r.id[0].toUpperCase() + r.id.slice(1) }
        return r
      },
  }
}

/**
 * Serves the Vercel functions in api/ during `npm run dev`, so the AI
 * endpoint works locally without the Vercel CLI. Each `api/<name>.ts`
 * exports `POST(request: Request): Promise<Response>`, as on Vercel.
 */
function devApi(): Plugin {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const m = /^\/api\/([a-z0-9-]+)\/?(?:\?.*)?$/.exec(req.url ?? '')
        if (!m) return next()
        try {
          const mod = await server.ssrLoadModule(`/api/${m[1]}.ts`)
          const handler = mod[req.method ?? 'GET']
          if (typeof handler !== 'function') {
            res.statusCode = 405
            return res.end()
          }
          const chunks: Buffer[] = []
          for await (const c of req) chunks.push(c as Buffer)
          const host = req.headers.host ?? 'localhost'
          const request = new Request(`http://${host}${req.url}`, {
            method: req.method,
            headers: Object.entries(req.headers).flatMap(([k, v]) => (v === undefined ? [] : [[k, String(v)] as [string, string]])),
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          })
          const response: Response = await handler(request)
          res.statusCode = response.status
          response.headers.forEach((v, k) => res.setHeader(k, v))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (e) {
          server.config.logger.error(String(e instanceof Error ? (e.stack ?? e.message) : e))
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: 'Dev API handler crashed — see the terminal' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // expose .env.local secrets (no VITE_ prefix, so never bundled) to the dev API handlers
  const env = loadEnv(mode, process.cwd(), '')
  process.env.ANTHROPIC_API_KEY ??= env.ANTHROPIC_API_KEY
  return {
    plugins: [canonicalDriveLetter(), react(), tailwindcss(), devApi()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
