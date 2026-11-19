# Spidra Cover Studio

An internal blog cover generator for the Spidra content team. Writers type a title, pick a style and click Generate: Claude composes the cover from the icon library and templates (see [AI suggestions](#ai-suggestions)). They can then tweak it and download a publish-ready PNG or SVG.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

**Deploy:** import the repo into Vercel. `vercel.json` already sets the Vite framework, build command and output folder, so no extra configuration is needed.

## How it works

| Piece | Where | Notes |
| --- | --- | --- |
| Brand tokens | `src/cover/palette.ts` | The palette is derived from one primary colour (default `#2563EB`; the site uses `#007AFF`). The Brand modal can change it. |
| Backgrounds | `src/cover/backgrounds.tsx` | 6 light treatments offered in the app (Blueprint, Pastel, Sky, Mist, Aurora, Paper). Cobalt, Midnight, Ink and Abstract stay defined only so older drafts still render |
| Illustrations | `src/cover/illustrations/` | 18 vector scenes: pipelines, API hub, code editor, terminal, documents, database, queue, workflow, network, search, dashboard, badge, release notes, versus, MCP/agent, geometric |
| Templates | `src/cover/templates.tsx` | 10 layouts (Split, Spotlight, Showcase, Code Bleed, Headline, Versus, Glow Panel, Editorial, Framed, Bento) |
| Text fitting | `src/lib/text.ts` | Measures text with the real Geist font metrics, then wraps, auto-shrinks, balances lines and truncates with "…" as a last resort |
| Suggestions | `src/lib/suggest.ts` | Keyword rules map the title and subtitle to a category, templates and illustrations. Titles with no matches get a neutral fallback |
| Variations | `src/lib/variations.ts` | Seeded PRNG (mulberry32) picks distinct template, background, illustration, alignment and title-style combinations |
| Export | `src/lib/export.ts` | SVG is serialised with Geist embedded as base64 `@font-face`. PNG is that same SVG drawn onto a canvas, so the export matches the preview |

### Topic scenes (icon library)
`src/library/` matches the title to icons from the [Kubai](https://icons.kubai.design/) library (3,000+ tagged icons, MIT) and `src/cover/illustrations/scene.tsx` arranges them into the cover's illustration slot.

- **Matching** (`match.ts`): curated concepts in `concepts.ts` come first, and anything else is looked up in the library's own tags, so "honey prices" still finds a bee. Matches are ranked subject → action → output → tech, with the title ahead of the subtitle. Modifier words swap in badged variants ("secure" turns `database` into `database-lock`).
- **Illustration style (the default)**: the **Illustration** template on the **Blueprint** background shows a full-bleed hero image with no headline, made of glassy cards, placeholder text bars and glowing connectors (`scene-illustrated.tsx`). It has three layouts: **Merge** (source cards flow into a result card), **Inspect** (a thread of cards under a magnifier) and **Hub** (the brand at the centre with topic tiles and labelled pills). Titles with topics get this style automatically, and the first variations use it.
- **Minimal layouts** (`scene-minimal.tsx`): **Focus** (one hero icon with a second topic merged in as a corner badge), **Pair** (A → B), **Stack** (fanned cards), **Grid** (topic tiles, one picked) and **Window** (an app window with a floating badge). `MergedIcon` combines any two library icons into one mark.
- **Layout engine** (end of `matchTopics`): every illustrated layout gets a fit score from the shape of the title: how many topics, a flow, a comparison, a roundup, or web, data or signal topics. A small jitter seeded by the title breaks near-ties, so similar posts get different covers but the same title always gets the same one. It needs no model and no network, so it runs on any device.
- **Other layouts**: Spotlight, Flow ("X into Y", or an action plus an output), Bento, Orbit and Versus ("X vs Y"). Each one lays itself out in whatever box the template gives it.
- **Editing**: Layout tab → Topic scene. Pick a layout, rename the captions, or click an icon to swap it for any of the 3,000+ icons.
- **Loading**: icons load on demand as raw text, and the tag index loads once at startup. Export bakes the icons' CSS colours into plain hex, so SVGs open correctly in design tools.

To teach it a topic, add an entry to `CONCEPTS` with its trigger terms and icon names (best first).

### Abstract art engine
`src/cover/generative/` generates seeded SVG art, so covers never run out of visuals. There are 12 patterns: mesh glow, flow field, topography, halftone, isometric, orbits, ridgelines, Truchet, Bauhaus, constellation, glass blobs and sunburst. Each is controlled by density, scale, rotation, intensity, softness, palette, tone, grain and a seed.

The art can be used two ways:
- **As a background** (`background: 'generative'`). It fades out where the template's text sits; each template declares that position as `textZone`.
- **As an illustration** (`illustration: 'abstract'`), framed as a card, a circle or a soft-edged cloud.

Writers drive it from the **Art** tab. Variations always include one art-led cover, and titles with no recognised topic fall back to abstract art. The settings live in `config.art`, so a share link reproduces the art exactly.

To add a pattern, write a function in `patterns.tsx` that takes a `PatternCtx` and returns SVG. Size everything by `k`, the unit scale, so thumbnails stay cheap. Group strokes of the same colour into one path, then register the pattern in `PATTERNS` and `ART_PATTERNS`.

### Adding a keyword rule
Add an entry to `RULES` in `src/lib/suggest.ts`. List the trigger terms and the illustrations and templates the rule should vote for. Earlier entries in each list carry more weight.

### Adding an illustration
Write a component that draws in its own coordinate space (around 560×420). Use the palette (`p.primary`, `p.card`, `p.bar`, …) rather than hard-coded colours so it adapts to light and dark backgrounds. Register it in `FLOW_ILLUSTRATIONS` or `OBJECT_ILLUSTRATIONS` with its `w`/`h`.

### Adding a template
Add a `TemplateDef` to `TEMPLATES`. Use `textGroup()` to measure and render the label, title and subtitle stack, and `c.art(box)` to place the selected illustration.

## AI suggestions
**Generate cover** and **Regenerate** send the title, subtitle, chosen style and the icons the keyword matcher found to `POST /api/suggest`. Claude picks the category, template, background, scene layout, scene icons and captions, eyebrow and title colour, plus a one-line reason shown as a toast. The result is one undoable step.

| Piece | Where | Notes |
| --- | --- | --- |
| Endpoint | `api/suggest.ts` | Vercel function. Calls Claude (`claude-haiku-5-5`, medium effort) with structured output, so the answer always matches the schema. Refuses cross-site requests and caps input sizes |
| Design brief | `api/_guide.ts` | The system prompt: house style, every template, background, illustration and scene layout, and when to use each. Update it when you add one |
| Schema | `api/_schema.ts` | The answer's shape. Its lists are type-checked against `src/lib/types.ts`, so the build fails if they drift |
| AI composition | `src/cover/illustrations/scene-compose.tsx` | Claude designs a new layout (`scene.style: 'compose'`) instead of picking a preset: it places glass cards, icon tiles, pills, the Spidra hub and sparkles on the 1120×560 artboard, links them with connectors, and combines two library icons into one mark (a main icon with a corner badge). Elements point at `scene.items` by index, so swapping or renaming an icon on the canvas updates the composition; `src/lib/composition.ts` validates compositions and keeps the indexes right when items are reordered or removed |
| Validation | `src/lib/ai.ts` | Unknown icons are looked up with `searchIcons` from Claude's `iconQuery` or dropped, backgrounds are kept to the template's set, and an empty scene falls back to the keyword match |

**Setup:** set `ANTHROPIC_API_KEY` in `.env.local` for local development (`npm run dev` serves `/api/*` through a small Vite middleware) and in Vercel → Settings → Environment Variables for production. The key stays on the server and is never bundled. Without it, Generate falls back to the keyword match.

## Editor
- **Create:** a fresh start opens one screen: type the post title, pick a style (Blueprint or Soft, defined in `api/_styles.ts`), and click **Generate cover**. Every cover is a full-bleed illustration with no headline; the title lives on the blog page. If the AI can't be reached, the keyword match builds the cover instead.
- **Edit, Figma-style** (three panels):
  - **Top bar:** the post title as the file name (pencil: click to rename), undo/redo, drafts, brand, theme, **Regenerate** and **Export**.
  - **Floating toolbar (bottom of the canvas):** the tools and zoom.
  - **Layers (left):** every part, front to back, with its icon and caption. Click to select (Shift adds), hover to find it on the canvas, the eye hides it, drag to restack. Connections are listed below and can be selected or deleted.
  - **Canvas (centre):** click, Shift-click or drag a box to select; drag to move (snaps to other parts and an 8-unit grid, with red guides and spacing labels; Alt skips snapping); pull the eight handles to resize (Shift keeps proportions). Ctrl/⌘ + scroll zooms, scroll or Space + drag pans.
  - **Design (right):** follows the selection. Nothing selected: the **blog post title** (paste a new one and click *Generate for this title*; the panel says when the title has changed since the cover was made), style, size and background. One part: exact X/Y/W/H, icon, caption, **badge** (combine a second icon into it), placeholder lines, accent colour, focal point and layer order. Several parts: align and distribute. A connection: dashed and glowing-dot options.
- **Tools:** Move (V), Hand (H), Card (R), Tile (O), Pill (P), Sparkle (K), Connection (L: drag from one part to another).
- **Shortcuts:** Delete, Ctrl+D duplicate, Ctrl+C / X / V (works across covers), Ctrl+A select all, Ctrl+] / [ forward / backward (add Shift for front / back), arrow keys nudge (Shift for 16), Tab / Shift+Tab walk through parts when the canvas has focus, Esc deselects, Ctrl+= / Ctrl+- zoom, Shift+1 fit, Shift+0 100%, Ctrl+Z / Ctrl+Shift+Z undo / redo, Ctrl+S save draft, Ctrl+E export PNG.
- Once anything has been edited by hand, Regenerate asks before replacing the layout. Editing logic lives in `src/lib/composition.ts`; the UI is `src/ui/Canvas.tsx`, `LayersPanel.tsx`, `DesignPanel.tsx` and `TopBar.tsx`.

## Storage
Drafts, recently used templates, brand settings, uploaded assets and reference images all live in `localStorage`, so they stay in the browser where they were created. To pass a design to a teammate, use **⋯ → Copy share link**, which encodes the design in the URL, or **Copy design config**, which copies it as JSON. Uploaded assets are not included in share links.

## Shortcuts
- `Ctrl/⌘ + S`: save the current cover as a draft
- `*word*` in the title: highlight that word in the brand colour
#   C O V E R H U B  
 