import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { DESIGN_GUIDE } from './_guide'
import { AiCoverSchema, type AiRequest } from './_schema'
import { COVER_STYLES, STYLE_BY_ID } from './_styles'

/**
 * POST /api/suggest — Claude picks a cover composition for a post title.
 *
 * Runs on the server so the API key never reaches the browser. The key comes
 * from ANTHROPIC_API_KEY (Vercel env settings in production, .env.local in dev).
 */

// created on first use, so a missing key becomes a clear error response instead of a crash at load
let client: Anthropic | null = null

const json = (body: unknown, status = 200) => Response.json(body, { status })

export async function POST(req: Request): Promise<Response> {
  // Browsers always send Origin on cross-site POSTs: refuse other sites using this key.
  const origin = req.headers.get('origin')
  if (origin && new URL(origin).host !== new URL(req.url).host) return json({ error: 'Forbidden' }, 403)

  let body: AiRequest
  try {
    body = (await req.json()) as AiRequest
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }
  const title = String(body.title ?? '').trim().slice(0, 300)
  const subtitle = String(body.subtitle ?? '').trim().slice(0, 300)
  if (!title) return json({ error: 'A title is required' }, 400)
  const candidates = (Array.isArray(body.candidates) ? body.candidates : []).slice(0, 12).map((c) => ({
    label: String(c.label).slice(0, 60),
    concept: String(c.concept).slice(0, 40),
    role: String(c.role).slice(0, 20),
    icon: String(c.icon).slice(0, 60),
    alts: (Array.isArray(c.alts) ? c.alts : []).slice(0, 6).map((a) => String(a).slice(0, 60)),
  }))

  const st = STYLE_BY_ID[body.style as keyof typeof STYLE_BY_ID] ?? COVER_STYLES[0]
  const style = { name: st.name, brief: st.brief, templates: st.templates, backgrounds: st.backgrounds }

  try {
    client ??= new Anthropic()
    // Haiku: fast and low-cost for one structured answer per cover. It has no server-side refusal
    // fallback; a decline returns 422 and the browser falls back to the keyword match.
    const message = await client.messages.parse({
      model: 'claude-haiku-5-5',
      max_tokens: 16000,
      // medium (Haiku's default): enough thinking to lay parts out without overlaps
      output_config: { effort: 'medium', format: zodOutputFormat(AiCoverSchema) },
      system: [{ type: 'text', text: DESIGN_GUIDE, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: JSON.stringify({ title, subtitle, style, candidates }) }],
    })

    if (message.stop_reason === 'refusal') return json({ error: 'Claude declined to suggest a cover for this title' }, 422)
    if (!message.parsed_output) return json({ error: 'Claude returned no suggestion' }, 502)
    return json(message.parsed_output)
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return json({ error: 'The Anthropic API key was rejected. Check ANTHROPIC_API_KEY.' }, 500)
    if (e instanceof Anthropic.RateLimitError) return json({ error: 'Rate limited by the Anthropic API. Try again in a moment.' }, 429)
    if (e instanceof Anthropic.APIError) return json({ error: `Anthropic API error ${e.status ?? ''}: ${e.message}` }, 502)
    if (e instanceof Error && /api key|apiKey|ANTHROPIC_API_KEY/i.test(e.message)) return json({ error: 'ANTHROPIC_API_KEY is not set on the server.' }, 500)
    return json({ error: 'Could not reach the Anthropic API' }, 502)
  }
}
