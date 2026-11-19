import { tint } from '../../lib/color'
import { stripMarks } from '../../lib/text'
import { Bar, Card, Connector, DashBox, Hub, Pill, WindowDots } from '../primitives'
import type { IllusCtx, IllustrationDef } from './types'

/* ---------- Browser → Spidra → structured page ---------- */
function ScrapeFlow({ p }: IllusCtx) {
  return (
    <g>
      {/* source browser */}
      <Card x={20} y={36} w={340} h={340} p={p} r={18}>
        <WindowDots x={42} y={60} p={p} />
        <DashBox x={38} y={80} w={304} h={30} p={p} r={8} />
        <Bar x={262} y={88} w={66} h={14} fill={p.bar} />
        <DashBox x={38} y={120} w={304} h={30} p={p} r={8} />
        {[52, 112, 172, 232].map((x) => (
          <Bar key={x} x={x} y={130} w={46} h={10} fill={p.bar} />
        ))}
        <DashBox x={38} y={160} w={78} h={156} p={p} r={8} />
        {[176, 202, 228, 254, 280].map((y, i) => (
          <Bar key={y} x={50} y={y} w={i % 2 ? 40 : 54} h={9} fill={p.bar} />
        ))}
        {/* selected element */}
        <rect x={126} y={160} width={216} height={156} rx={10} fill={p.card} stroke={p.primary} strokeWidth={2.6} />
        <Bar x={140} y={174} w={110} h={12} fill={p.primary} />
        <Bar x={140} y={196} w={180} h={7} fill={p.bar} />
        <Bar x={140} y={210} w={150} h={7} fill={p.bar} />
        <rect x={140} y={226} width={188} height={38} rx={6} fill={p.primary} />
        <Bar x={152} y={236} w={70} h={6} fill="#FFFFFF" />
        <Bar x={162} y={249} w={96} h={6} fill={tint(p.primary, 0.6)} />
        <rect x={140} y={274} width={188} height={32} rx={5} fill="none" stroke={p.cardStrokeStrong} strokeWidth={1.3} />
        <path d={`M203 274 V306 M266 274 V306 M140 290 H328`} stroke={p.cardStrokeStrong} strokeWidth={1.3} />
        <DashBox x={38} y={326} w={304} h={36} p={p} r={8} />
      </Card>

      <Connector x1={342} y1={238} x2={486} y2={208} p={p} arrow={false} />
      <Hub cx={520} cy={208} p={p} />
      <Connector x1={556} y1={208} x2={676} y2={150} p={p} />
      {/* dangling silk + empty selectors */}
      <g stroke={p.dot} strokeWidth={2} strokeDasharray="3 6" fill="none">
        <path d="M510 262 L470 336" />
        <path d="M532 262 L560 324" />
      </g>
      <DashBox x={420} y={340} w={66} h={22} p={p} r={6} />
      <DashBox x={540} y={326} w={60} h={22} p={p} r={6} />
      <DashBox x={470} y={378} w={72} h={24} p={p} r={6} />

      {/* clean output */}
      <Card x={690} y={36} w={330} h={340} p={p} r={18}>
        <rect x={708} y={56} width={294} height={40} rx={10} fill={p.cardAlt} />
        <g fill="none" stroke={p.primary} strokeWidth={3}>
          <rect x={720} y={66} width={20} height={20} rx={10} />
          <rect x={732} y={66} width={20} height={20} rx={10} />
        </g>
        <Bar x={764} y={71} w={150} h={10} fill={p.bar} />
        <Bar x={922} y={71} w={64} h={10} fill={p.barMid} />
        <text x={712} y={140} fontFamily={p.sans} fontWeight={600} fontSize={32} fill={p.primary}>
          #
        </text>
        <Bar x={746} y={118} w={176} h={18} fill={p.primary} />
        {[160, 178, 196].map((y, i) => (
          <Bar key={y} x={712} y={y} w={[288, 262, 222][i]} h={8} fill={p.bar} />
        ))}
        <rect x={712} y={218} width={290} height={70} rx={8} fill={p.primary} />
        <Bar x={728} y={234} w={120} h={7} fill="#FFFFFF" />
        <Bar x={744} y={250} w={160} h={7} fill={tint(p.primary, 0.55)} />
        <Bar x={744} y={266} w={96} h={7} fill={tint(p.primary, 0.55)} />
        <rect x={712} y={300} width={290} height={52} rx={6} fill="none" stroke={p.cardStrokeStrong} strokeWidth={1.3} />
        <path d="M809 300 V352 M906 300 V352 M712 326 H1002" stroke={p.cardStrokeStrong} strokeWidth={1.3} />
      </Card>
    </g>
  )
}

/* ---------- Many sources → Spidra → consistent JSON ---------- */
function JsonFanout({ p }: IllusCtx) {
  const ys = [26, 158, 290]
  const brace = (x: number, y: number, open: boolean) => (
    <text x={x} y={y} fontFamily={p.sans} fontWeight={500} fontSize={56} fill={p.primary} textAnchor="middle">
      {open ? '{' : '}'}
    </text>
  )
  return (
    <g>
      {/* sources */}
      <Card x={20} y={ys[0]} w={250} h={108} p={p}>
        <WindowDots x={38} y={44} p={p} gap={11} r={3} />
        <rect x={36} y={58} width={64} height={60} rx={8} fill={p.cardAlt} />
        <path d="M46 104 L60 88 L70 98 L80 86 L92 104" fill="none" stroke={p.barMid} strokeWidth={2.4} strokeLinejoin="round" />
        <Bar x={112} y={62} w={130} h={9} fill={p.bar} />
        <Bar x={112} y={78} w={70} h={9} fill={p.barMid} />
        <rect x={112} y={94} width={88} height={22} rx={11} fill={p.primary} />
      </Card>
      <Card x={20} y={ys[1]} w={250} h={108} p={p}>
        <WindowDots x={38} y={176} p={p} gap={11} r={3} />
        {[194, 210, 226, 242].map((y, i) => (
          <g key={y}>
            <circle cx={42} cy={y + 4} r={4} fill={i % 2 ? p.barMid : p.bar} />
            <Bar x={54} y={y} w={[110, 100, 90, 84][i]} h={8} fill={p.bar} />
            <Bar x={206} y={y} w={44} h={8} fill={p.barMid} />
          </g>
        ))}
      </Card>
      <Card x={20} y={ys[2]} w={250} h={108} p={p}>
        <WindowDots x={38} y={308} p={p} gap={11} r={3} />
        <Bar x={36} y={324} w={170} h={12} fill={p.bar} />
        <Bar x={36} y={344} w={118} h={12} fill={p.bar} />
        <Bar x={36} y={366} w={90} h={5} fill={p.cardAlt} />
        <Bar x={36} y={376} w={90} h={5} fill={p.cardAlt} />
        <rect x={172} y={362} width={78} height={26} rx={6} fill={p.cardAlt} />
      </Card>

      {ys.map((y) => (
        <Connector key={y} x1={270} y1={y + 54} x2={486} y2={210} p={p} arrow={false} />
      ))}
      <Hub cx={520} cy={210} p={p} />
      {ys.map((y) => (
        <Connector key={`o${y}`} x1={556} y1={210} x2={688} y2={y + 54} p={p} />
      ))}

      {/* json outputs */}
      {ys.map((y, k) => (
        <Card key={k} x={700} y={y} w={320} h={108} p={p}>
          {brace(726, y + 74, true)}
          {brace(994, y + 74, false)}
          {[0, 1, 2, 3].map((i) => {
            const empty = (k === 1 && i === 3) || (k === 2 && i === 2)
            return (
              <g key={i}>
                <Bar x={750} y={y + 18 + i * 20} w={62} h={10} fill={p.primary} />
                {empty ? (
                  <rect x={822} y={y + 18 + i * 20} width={120} height={10} rx={5} fill="none" stroke={p.barMid} strokeWidth={1.4} strokeDasharray="4 3" />
                ) : (
                  <Bar x={822} y={y + 18 + i * 20} w={[150, 96, 74, 118][i]} h={10} fill={p.bar} />
                )}
              </g>
            )
          })}
        </Card>
      ))}
    </g>
  )
}

/* ---------- X vs Y comparison ---------- */
export function parseVersus(title: string): [string, string] {
  const t = stripMarks(title)
  const m = t.match(/^(?:.*?:\s*)?(.+?)\s+(?:vs\.?|versus)\s+(.+?)(?:[:?(–—-].*)?$/i)
  const clean = (s: string) =>
    s
      .replace(/^(the|a|an)\s+/i, '')
      .replace(/\b(which|who|what)\b.*$/i, '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join(' ')
  if (m) return [clean(m[1]) || 'Option A', clean(m[2]) || 'Option B']
  const alt = t.match(/(?:best\s+)?(.+?)\s+alternatives?/i)
  if (alt) return [clean(alt[1].replace(/^\d+\s+(best\s+)?/i, '')) || 'Option A', 'Alternatives']
  return ['Option A', 'Option B']
}

function Versus({ p, title }: IllusCtx) {
  const [a, b] = parseVersus(title)
  const side = (x: number, name: string, strong: boolean) => {
    const label = name.length > 14 ? name.slice(0, 13) + '…' : name
    return (
      <Card x={x} y={30} w={400} h={360} p={p} r={20} lg stroke={strong ? p.cardStrokeStrong : undefined}>
        <rect x={x + 28} y={58} width={56} height={56} rx={14} fill={strong ? `url(#${p.ids.hub})` : p.cardAlt} stroke={strong ? undefined : p.cardStroke} />
        <text x={x + 56} y={88} textAnchor="middle" dominantBaseline="central" fontFamily={p.sans} fontWeight={700} fontSize={26} fill={strong ? '#FFFFFF' : p.primary}>
          {label.charAt(0).toUpperCase()}
        </text>
        <text x={x + 100} y={80} fontFamily={p.sans} fontWeight={600} fontSize={26} fill={p.ink} letterSpacing={-0.4}>
          {label}
        </text>
        <Bar x={x + 100} y={96} w={110} h={9} fill={p.bar} />
        {[0, 1, 2, 3, 4].map((i) => {
          const y = 150 + i * 44
          const good = strong ? i !== 4 : i % 2 === 0
          return (
            <g key={i}>
              <circle cx={x + 42} cy={y + 6} r={11} fill={good ? p.primary : p.cardAlt} stroke={good ? undefined : p.cardStroke} />
              {good ? (
                <path d={`M${x + 37} ${y + 6} l4 4 l7 -8`} fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d={`M${x + 38} ${y + 6} h8`} stroke={p.barMid} strokeWidth={2.4} strokeLinecap="round" />
              )}
              <Bar x={x + 64} y={y} w={[180, 150, 200, 130, 160][i]} h={11} fill={p.bar} />
              <Bar x={x + 300} y={y} w={good ? 72 : 40} h={11} fill={good ? p.barMid : p.bar} />
            </g>
          )
        })}
      </Card>
    )
  }
  return (
    <g>
      {side(10, a, true)}
      {side(470, b, false)}
      <circle cx={440} cy={210} r={64} fill={`url(#${p.ids.glow})`} />
      <circle cx={440} cy={210} r={42} fill={`url(#${p.ids.hub})`} stroke="#FFFFFF" strokeWidth={5} filter={`url(#${p.ids.shadow})`} />
      <text x={440} y={211} textAnchor="middle" dominantBaseline="central" fontFamily={p.sans} fontWeight={700} fontSize={26} fill="#FFFFFF" letterSpacing={-0.5}>
        VS
      </text>
    </g>
  )
}

/* ---------- Browser element picking ---------- */
function BrowserExtract({ p }: IllusCtx) {
  return (
    <g>
      <Card x={20} y={20} w={440} h={360} p={p} r={18} lg>
        <rect x={20.75} y={20.75} width={438.5} height={46} rx={17} fill={p.cardAlt} />
        <WindowDots x={44} y={44} p={p} />
        <rect x={100} y={32} width={300} height={24} rx={12} fill={p.card} stroke={p.cardStroke} />
        <circle cx={116} cy={44} r={5} fill="none" stroke={p.barMid} strokeWidth={2} />
        <Bar x={130} y={40} w={150} h={8} fill={p.bar} />
        {/* page */}
        <Bar x={44} y={88} w={170} h={16} fill={p.ink} />
        <Bar x={44} y={114} w={260} h={8} fill={p.bar} />
        {[0, 1, 2].map((i) => {
          const x = 44 + i * 134
          const sel = i === 1
          return (
            <g key={i}>
              <rect x={x} y={142} width={120} height={150} rx={10} fill={sel ? p.card : p.cardAlt} stroke={sel ? p.primary : p.cardStroke} strokeWidth={sel ? 2.6 : 1.3} />
              <rect x={x + 10} y={152} width={100} height={64} rx={6} fill={sel ? tint(p.primary, 0.85) : p.card} />
              <Bar x={x + 10} y={228} w={80} h={9} fill={sel ? p.primary : p.barMid} />
              <Bar x={x + 10} y={246} w={96} h={7} fill={p.bar} />
              <Bar x={x + 10} y={268} w={46} h={12} fill={sel ? p.primary : p.bar} />
            </g>
          )
        })}
        <Bar x={44} y={312} w={392} h={8} fill={p.bar} />
        <Bar x={44} y={330} w={300} h={8} fill={p.bar} />
        {/* selection tag */}
        <rect x={178} y={124} width={86} height={22} rx={5} fill={p.primary} />
        <text x={221} y={135} textAnchor="middle" dominantBaseline="central" fontFamily={p.mono} fontWeight={500} fontSize={11} fill="#FFFFFF">
          div.product
        </text>
        {/* cursor */}
        <path d="M300 250 l0 34 l9 -9 l7 15 l7 -3 l-7 -15 l12 0 z" fill={p.ink} stroke="#FFFFFF" strokeWidth={2} strokeLinejoin="round" />
      </Card>
      <Connector x1={420} y1={236} x2={476} y2={300} p={p} vertical />
      <Card x={380} y={300} w={200} h={110} p={p} r={14} lg>
        <text fontFamily={p.mono} fontSize={13} fontWeight={500}>
          <tspan x={398} y={330} fill={p.primary}>{'{'}</tspan>
          <tspan x={412} y={352} fill={p.primary}>"name"</tspan>
          <tspan fill={p.muted}>: </tspan>
          <tspan fill={p.ink}>"Air 2"</tspan>
          <tspan x={412} y={374} fill={p.primary}>"price"</tspan>
          <tspan fill={p.muted}>: </tspan>
          <tspan fill={p.ink}>129</tspan>
          <tspan x={398} y={396} fill={p.primary}>{'}'}</tspan>
        </text>
      </Card>
    </g>
  )
}

/* ---------- API hub with endpoints ---------- */
function ApiHub({ p }: IllusCtx) {
  const eps = [
    { x: 16, y: 34, m: 'GET', path: '/search' },
    { x: 330, y: 34, m: 'POST', path: '/scrape' },
    { x: 16, y: 334, m: 'POST', path: '/crawl' },
    { x: 330, y: 334, m: 'GET', path: '/jobs/:id' },
  ]
  const cx = 280
  const cy = 220
  return (
    <g>
      <circle cx={cx} cy={cy} r={150} fill="none" stroke={p.cardStroke} strokeWidth={1.5} strokeDasharray="4 7" />
      <circle cx={cx} cy={cy} r={100} fill={`url(#${p.ids.glow})`} />
      {eps.map((e) => {
        const ex = e.x + 107
        const ey = e.y + (e.y < cy ? 72 : 0)
        return <Connector key={e.path} x1={ex} y1={ey} x2={cx + (ex < cx ? -50 : 50)} y2={cy + (ey < cy ? -40 : 40)} p={p} vertical arrow={false} dashed />
      })}
      <rect x={cx - 62} y={cy - 62} width={124} height={124} rx={30} fill={`url(#${p.ids.hub})`} filter={`url(#${p.ids.shadowLg})`} />
      <rect x={cx - 52} y={cy - 52} width={104} height={104} rx={24} fill="none" stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={1.5} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fontFamily={p.sans} fontWeight={700} fontSize={38} fill="#FFFFFF" letterSpacing={-0.5}>
        API
      </text>
      <Pill x={cx + 46} y={cy - 92} text="200 OK" p={p} fill={p.card} stroke={p.cardStroke} size={13} mono />
      {eps.map((e) => (
        <Card key={e.path} x={e.x} y={e.y} w={214} h={72} p={p} r={14}>
          <rect x={e.x + 14} y={e.y + 22} width={e.m === 'GET' ? 52 : 60} height={28} rx={7} fill={e.m === 'GET' ? p.primary : p.primaryDeep} />
          <text x={e.x + 14 + (e.m === 'GET' ? 26 : 30)} y={e.y + 36.5} textAnchor="middle" dominantBaseline="central" fontFamily={p.mono} fontWeight={500} fontSize={13} fill="#FFFFFF">
            {e.m}
          </text>
          <text x={e.x + (e.m === 'GET' ? 78 : 86)} y={e.y + 37} dominantBaseline="central" fontFamily={p.mono} fontWeight={500} fontSize={16} fill={p.ink}>
            {e.path}
          </text>
        </Card>
      ))}
    </g>
  )
}

/* ---------- Automation workflow ---------- */
function Glyph({ kind, x, y, c }: { kind: 'clock' | 'globe' | 'braces' | 'send'; x: number; y: number; c: string }) {
  const common = { fill: 'none', stroke: c, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (kind) {
    case 'clock':
      return (
        <g {...common}>
          <circle cx={x} cy={y} r={11} />
          <path d={`M${x} ${y - 6} V${y} L${x + 5} ${y + 3}`} />
        </g>
      )
    case 'globe':
      return (
        <g {...common}>
          <circle cx={x} cy={y} r={11} />
          <ellipse cx={x} cy={y} rx={5} ry={11} />
          <path d={`M${x - 11} ${y} H${x + 11}`} />
        </g>
      )
    case 'braces':
      return (
        <g {...common}>
          <path d={`M${x - 4} ${y - 11} c-5 0 -5 3 -5 6 s-1 5 -4 5 c3 0 4 2 4 5 s0 6 5 6`} />
          <path d={`M${x + 4} ${y - 11} c5 0 5 3 5 6 s1 5 4 5 c-3 0 -4 2 -4 5 s0 6 -5 6`} />
        </g>
      )
    case 'send':
      return (
        <g {...common}>
          <path d={`M${x - 10} ${y - 1} L${x + 11} ${y - 10} L${x + 4} ${y + 11} L${x} ${y + 2} Z`} />
        </g>
      )
  }
}

function Workflow({ p }: IllusCtx) {
  const nodes = [
    { x: 20, y: 24, t: 'Schedule', s: 'Every 6 hours', g: 'clock' as const },
    { x: 300, y: 124, t: 'Scrape pages', s: '1,284 URLs', g: 'globe' as const },
    { x: 20, y: 224, t: 'Extract fields', s: 'JSON schema', g: 'braces' as const },
    { x: 300, y: 324, t: 'Deliver', s: 'Webhook · Sheets', g: 'send' as const },
  ]
  const W = 240
  const H = 84
  return (
    <g>
      {nodes.slice(0, -1).map((n, i) => {
        // elbow: leave from the side, turn down into the top of the next node
        const m = nodes[i + 1]
        const right = m.x > n.x
        const x1 = right ? n.x + W : n.x
        const y1 = n.y + H / 2
        const x2 = m.x + W / 2
        const y2 = m.y - 4
        const r = 18
        const s = x2 > x1 ? 1 : -1
        return (
          <g key={i} fill="none" stroke={p.line} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d={`M${x1} ${y1} H${x2 - r * s} Q${x2} ${y1} ${x2} ${y1 + r} V${y2}`} />
            <path d={`M${x2 - 7} ${y2 - 7} L${x2} ${y2} L${x2 + 7} ${y2 - 7}`} />
          </g>
        )
      })}
      {nodes.map((n, i) => (
        <Card key={n.t} x={n.x} y={n.y} w={W} h={H} p={p} r={16} stroke={i === 1 ? p.primary : undefined}>
          <rect x={n.x + 16} y={n.y + 18} width={48} height={48} rx={12} fill={i === 1 ? `url(#${p.ids.hub})` : p.cardAlt} />
          <Glyph kind={n.g} x={n.x + 40} y={n.y + 42} c={i === 1 ? '#FFFFFF' : p.primary} />
          <text x={n.x + 78} y={n.y + 38} fontFamily={p.sans} fontWeight={600} fontSize={18} fill={p.ink} letterSpacing={-0.2}>
            {n.t}
          </text>
          <text x={n.x + 78} y={n.y + 60} fontFamily={p.sans} fontWeight={400} fontSize={14} fill={p.muted}>
            {n.s}
          </text>
        </Card>
      ))}
    </g>
  )
}

/* ---------- Async job queue ---------- */
function Queue({ p }: IllusCtx) {
  const jobs = [
    { id: 'job_8f2a', st: 'completed', pct: 1 },
    { id: 'job_91c3', st: 'running', pct: 0.64 },
    { id: 'job_a7d0', st: 'queued', pct: 0 },
  ]
  const ok = '#16A34A'
  return (
    <g>
      <path d="M44 72 V328" stroke={p.cardStrokeStrong} strokeWidth={2} strokeDasharray="4 6" />
      {jobs.map((j, i) => {
        const y = 26 + i * 112
        const cy = y + 46
        return (
          <g key={j.id}>
            {j.st === 'completed' && (
              <g>
                <circle cx={44} cy={cy} r={14} fill={ok} />
                <path d={`M38 ${cy} l4 4 l8 -8`} fill="none" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            )}
            {j.st === 'running' && (
              <g>
                <circle cx={44} cy={cy} r={14} fill={p.card} stroke={p.cardStroke} strokeWidth={2} />
                <path d={`M44 ${cy - 14} A14 14 0 0 1 58 ${cy}`} fill="none" stroke={p.primary} strokeWidth={3.5} strokeLinecap="round" />
              </g>
            )}
            {j.st === 'queued' && <circle cx={44} cy={cy} r={12} fill={p.card} stroke={p.cardStrokeStrong} strokeWidth={2.2} />}
            <Card x={78} y={y} w={460} h={92} p={p} r={16} stroke={j.st === 'running' ? p.cardStrokeStrong : undefined}>
              <text x={100} y={y + 38} fontFamily={p.mono} fontWeight={500} fontSize={17} fill={p.ink}>
                {j.id}
              </text>
              <Pill
                x={j.st === 'completed' ? 408 : j.st === 'running' ? 424 : 430}
                y={y + 20}
                text={j.st}
                p={p}
                size={13}
                fill={j.st === 'completed' ? '#DCFCE7' : j.st === 'running' ? tint(p.primary, 0.86) : p.cardAlt}
                color={j.st === 'completed' ? '#15803D' : j.st === 'running' ? p.primary : p.muted}
              />
              <rect x={100} y={y + 58} width={416} height={10} rx={5} fill={p.cardAlt} />
              {j.pct > 0 && <rect x={100} y={y + 58} width={416 * j.pct} height={10} rx={5} fill={j.st === 'completed' ? p.barMid : p.primary} />}
            </Card>
          </g>
        )
      })}
      <Pill x={78} y={372} text="POST /webhooks/job.completed" p={p} size={13} mono fill={p.card} stroke={p.cardStroke} color={p.muted} />
    </g>
  )
}

export const FLOW_ILLUSTRATIONS: IllustrationDef[] = [
  { id: 'scrape-flow', name: 'Scrape pipeline', group: 'Pipelines', w: 1040, h: 420, render: (c) => <ScrapeFlow {...c} /> },
  { id: 'json-fanout', name: 'Sources → JSON', group: 'Pipelines', w: 1040, h: 420, render: (c) => <JsonFanout {...c} /> },
  { id: 'versus', name: 'Comparison', group: 'Product', w: 880, h: 420, render: (c) => <Versus {...c} /> },
  { id: 'browser-extract', name: 'Browser picker', group: 'Pipelines', w: 600, h: 430, render: (c) => <BrowserExtract {...c} /> },
  { id: 'api-hub', name: 'API endpoints', group: 'Developer', w: 560, h: 420, render: (c) => <ApiHub {...c} /> },
  { id: 'workflow', name: 'Automation flow', group: 'Data', w: 560, h: 430, render: (c) => <Workflow {...c} /> },
  { id: 'queue', name: 'Async job queue', group: 'Data', w: 560, h: 420, render: (c) => <Queue {...c} /> },
]
