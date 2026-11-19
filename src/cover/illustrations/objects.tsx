import { tint } from '../../lib/color'
import { stripMarks } from '../../lib/text'
import type { Palette } from '../palette'
import { Bar, Card, Connector, Pill, SpiderMark } from '../primitives'
import type { IllusCtx, IllustrationDef } from './types'

type TokKind = 'text' | 'kw' | 'str' | 'fn' | 'comment' | 'num' | 'muted'
type CodeLine = [string, TokKind][]

function CodeLines({ lines, x, y, p, size = 16, lh = 28, gutter = true }: { lines: CodeLine[]; x: number; y: number; p: Palette; size?: number; lh?: number; gutter?: boolean }) {
  const col = (k: TokKind) =>
    k === 'muted' ? '#7182A6' : k === 'text' ? p.code.text : p.code[k as Exclude<TokKind, 'text' | 'muted'>]
  return (
    <g fontFamily={p.mono} fontSize={size} fontWeight={400} style={{ whiteSpace: 'pre' }}>
      {lines.map((line, i) => (
        <g key={i}>
          {gutter && (
            <text x={x} y={y + i * lh} fill={p.code.gutter} textAnchor="end">
              {i + 1}
            </text>
          )}
          <text x={x + (gutter ? 22 : 0)} y={y + i * lh} xmlSpace="preserve">
            {line.map(([t, k], j) => (
              <tspan key={j} fill={col(k)}>
                {t}
              </tspan>
            ))}
          </text>
        </g>
      ))}
    </g>
  )
}

const PY: CodeLine[] = [
  [['from ', 'kw'], ['spidra ', 'text'], ['import ', 'kw'], ['Spidra', 'fn']],
  [],
  [['client ', 'text'], ['= ', 'muted'], ['Spidra', 'fn'], ['(api_key=', 'text'], ['"sk_live_…"', 'str'], [')', 'text']],
  [],
  [['result ', 'text'], ['= ', 'muted'], ['client.', 'text'], ['scrape', 'fn'], ['(', 'text']],
  [['    url=', 'text'], ['"https://example.com"', 'str'], [',', 'text']],
  [['    format=', 'text'], ['"json"', 'str'], [',', 'text']],
  [['    timeout=', 'text'], ['30', 'num'], [',', 'text']],
  [[')', 'text']],
  [['print', 'fn'], ['(result.data)  ', 'text'], ['# clean JSON', 'comment']],
]

const JS: CodeLine[] = [
  [['import ', 'kw'], ['{ Spidra } ', 'text'], ['from ', 'kw'], ['"@spidra/sdk"', 'str']],
  [],
  [['const ', 'kw'], ['client ', 'text'], ['= ', 'muted'], ['new ', 'kw'], ['Spidra', 'fn'], ['({ apiKey })', 'text']],
  [],
  [['const ', 'kw'], ['res ', 'text'], ['= ', 'muted'], ['await ', 'kw'], ['client.', 'text'], ['scrape', 'fn'], ['({', 'text']],
  [['  url: ', 'text'], ['"https://example.com"', 'str'], [',', 'text']],
  [['  format: ', 'text'], ['"json"', 'str'], [',', 'text']],
  [['  timeout: ', 'text'], ['30_000', 'num'], [',', 'text']],
  [['});', 'text']],
  [['console.', 'text'], ['log', 'fn'], ['(res.data) ', 'text'], ['// clean JSON', 'comment']],
]

function EditorChrome({ x, y, w, h, p, tab }: { x: number; y: number; w: number; h: number; p: Palette; tab: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={18} fill={p.code.bg} stroke={p.code.stroke} strokeWidth={1.5} filter={`url(#${p.ids.shadowLg})`} />
      <path d={`M${x + 18} ${y} H${x + w - 18} a18 18 0 0 1 18 18 V${y + 46} H${x} V${y + 18} a18 18 0 0 1 18 -18 Z`} fill={p.code.bar} />
      <circle cx={x + 24} cy={y + 23} r={5.5} fill="#FF6B6B" opacity={0.85} />
      <circle cx={x + 42} cy={y + 23} r={5.5} fill="#FFC857" opacity={0.85} />
      <circle cx={x + 60} cy={y + 23} r={5.5} fill="#4ADE80" opacity={0.85} />
      <rect x={x + 84} y={y + 8} width={tab.length * 8.6 + 28} height={38} rx={8} fill={p.code.bg} />
      <text x={x + 98} y={y + 30} fontFamily={p.mono} fontSize={14} fill={p.code.text} dominantBaseline="central">
        {tab}
      </text>
    </g>
  )
}

function CodeEditor({ p, lang }: IllusCtx) {
  const py = lang === 'python'
  return (
    <g>
      <EditorChrome x={10} y={14} w={540} h={360} p={p} tab={py ? 'scrape.py' : 'scrape.ts'} />
      <CodeLines lines={py ? PY : JS} x={44} y={100} p={p} size={15} lh={27} />
      <Card x={330} y={318} w={220} h={96} p={p} r={14} lg>
        <circle cx={354} cy={344} r={8} fill="#22C55E" />
        <path d="M350 344 l3 3 l5 -6" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
        <text x={370} y={349} fontFamily={p.mono} fontSize={13} fontWeight={500} fill={p.ink}>
          200 · 1.2s
        </text>
        <Bar x={348} y={366} w={150} h={8} fill={p.bar} />
        <Bar x={348} y={382} w={110} h={8} fill={p.barMid} />
      </Card>
    </g>
  )
}

function Terminal({ p, lang }: IllusCtx) {
  const py = lang === 'python'
  const lines: CodeLine[] = [
    [['$ ', 'kw'], [py ? 'pip install spidra' : 'npm install @spidra/sdk', 'text']],
    [['✓ ', 'str'], ['added 1 package in 0.8s', 'muted']],
    [['$ ', 'kw'], ['spidra scrape ', 'text'], ['example.com/pricing', 'str']],
    [['  ↳ rendering page ', 'muted'], ['…', 'muted']],
    [['  ↳ extracting ', 'muted'], ['12 fields', 'num']],
    [['{ ', 'text'], ['"plan"', 'str'], [': ', 'text'], ['"Pro"', 'str'], [', ', 'text'], ['"price"', 'str'], [': ', 'text'], ['49', 'num'], [' }', 'text']],
    [['$ ', 'kw']],
  ]
  return (
    <g>
      <rect x={14} y={24} width={532} height={370} rx={18} fill={p.code.bg} stroke={p.code.stroke} strokeWidth={1.5} filter={`url(#${p.ids.shadowLg})`} />
      <circle cx={40} cy={50} r={5.5} fill="#FF6B6B" opacity={0.85} />
      <circle cx={58} cy={50} r={5.5} fill="#FFC857" opacity={0.85} />
      <circle cx={76} cy={50} r={5.5} fill="#4ADE80" opacity={0.85} />
      <text x={280} y={51} textAnchor="middle" dominantBaseline="central" fontFamily={p.mono} fontSize={13} fill={p.code.gutter}>
        ~/projects — zsh
      </text>
      <path d="M14 76 H546" stroke={p.code.stroke} strokeWidth={1.5} />
      <CodeLines lines={lines} x={42} y={120} p={p} size={16} lh={40} gutter={false} />
      <rect x={64} y={348} width={10} height={20} fill={p.code.kw} />
      {/* progress */}
      <rect x={262} y={233} width={160} height={8} rx={4} fill={p.code.stroke} />
      <rect x={262} y={233} width={112} height={8} rx={4} fill={p.code.kw} />
    </g>
  )
}

function DocumentIllus({ p }: IllusCtx) {
  return (
    <g>
      <g transform="rotate(-5 140 220)">
        <Card x={30} y={50} w={230} h={300} p={p} r={14}>
          <path d="M218 50 H246 a14 14 0 0 1 14 14 V92 Z" fill={p.cardAlt} />
          <rect x={50} y={72} width={58} height={26} rx={6} fill={p.primary} />
          <text x={79} y={86} textAnchor="middle" dominantBaseline="central" fontFamily={p.sans} fontWeight={700} fontSize={13} fill="#FFFFFF" letterSpacing={0.5}>
            PDF
          </text>
          <Bar x={50} y={118} w={170} h={12} fill={p.barMid} />
          {[142, 158, 174].map((y, i) => (
            <Bar key={y} x={50} y={y} w={[188, 176, 140][i]} h={7} fill={p.bar} />
          ))}
          <rect x={50} y={196} width={190} height={74} rx={8} fill={p.cardAlt} />
          <path d="M66 254 L96 222 L118 244 L138 230 L170 254" fill="none" stroke={p.barMid} strokeWidth={2.4} strokeLinejoin="round" />
          <circle cx={208} cy={218} r={9} fill={p.bar} />
          {[286, 302, 318].map((y, i) => (
            <Bar key={y} x={50} y={y} w={[180, 160, 120][i]} h={7} fill={p.bar} />
          ))}
        </Card>
      </g>
      <Connector x1={262} y1={210} x2={318} y2={210} p={p} />
      <Card x={326} y={70} w={220} h={300} p={p} r={14} lg stroke={p.cardStrokeStrong}>
        <text fontFamily={p.mono} fontWeight={500} fontSize={18} fill={p.primary}>
          <tspan x={346} y={112}>#</tspan>
          <tspan x={346} y={186}>##</tspan>
          <tspan x={346} y={256}>-</tspan>
          <tspan x={346} y={284}>-</tspan>
          <tspan x={346} y={312}>-</tspan>
        </text>
        <Bar x={368} y={99} w={140} h={14} fill={p.primary} />
        <Bar x={346} y={128} w={180} h={7} fill={p.bar} />
        <Bar x={346} y={144} w={150} h={7} fill={p.bar} />
        <Bar x={378} y={174} w={110} h={12} fill={p.barMid} />
        <Bar x={346} y={204} w={176} h={7} fill={p.bar} />
        <Bar x={346} y={220} w={120} h={7} fill={p.bar} />
        {[248, 276, 304].map((y, i) => (
          <Bar key={y} x={364} y={y} w={[130, 100, 140][i]} h={8} fill={p.bar} />
        ))}
        <Pill x={346} y={330} text=".md" p={p} size={13} mono />
      </Card>
      <Pill x={204} y={20} text="Parsing 24 pages" p={p} size={13} fill={p.card} stroke={p.cardStroke} color={p.muted} />
    </g>
  )
}

function Database({ p }: IllusCtx) {
  const cx = 130
  const rx = 100
  const ry = 26
  const tiers = [100, 180, 260]
  return (
    <g>
      <ellipse cx={cx} cy={372} rx={120} ry={22} fill={p.primary} opacity={0.08} />
      {tiers
        .slice()
        .reverse()
        .map((y) => (
          <g key={y} filter={`url(#${p.ids.shadow})`}>
            <path d={`M${cx - rx} ${y} V${y + 70} A${rx} ${ry} 0 0 0 ${cx + rx} ${y + 70} V${y} Z`} fill={p.card} stroke={p.cardStroke} strokeWidth={1.5} />
            <ellipse cx={cx} cy={y} rx={rx} ry={ry} fill={p.cardAlt} stroke={p.cardStroke} strokeWidth={1.5} />
            <circle cx={cx + 62} cy={y + 46} r={5} fill={p.primary} />
            <Bar x={cx - 70} y={y + 42} w={90} h={8} fill={p.bar} />
          </g>
        ))}
      <ellipse cx={cx} cy={100} rx={rx} ry={ry} fill={`url(#${p.ids.hub})`} />
      <ellipse cx={cx} cy={100} rx={rx - 30} ry={ry - 9} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1.5} />

      <Connector x1={236} y1={210} x2={286} y2={210} p={p} />
      <Card x={294} y={86} w={256} h={262} p={p} r={16} lg>
        <rect x={294.75} y={86.75} width={254.5} height={46} rx={15} fill={p.cardAlt} />
        <Bar x={314} y={104} w={56} h={10} fill={p.primary} />
        <Bar x={392} y={104} w={64} h={10} fill={p.barMid} />
        <Bar x={478} y={104} w={50} h={10} fill={p.barMid} />
        {[0, 1, 2, 3, 4].map((i) => {
          const y = 146 + i * 40
          const hl = i === 2
          return (
            <g key={i}>
              {hl && <rect x={302} y={y - 9} width={240} height={34} rx={8} fill={tint(p.primary, 0.9)} stroke={p.cardStrokeStrong} />}
              <Bar x={314} y={y} w={[52, 40, 60, 46, 54][i]} h={9} fill={hl ? p.primary : p.bar} />
              <Bar x={392} y={y} w={[60, 70, 50, 66, 44][i]} h={9} fill={p.bar} />
              <Bar x={478} y={y} w={[40, 30, 46, 36, 42][i]} h={9} fill={p.bar} />
            </g>
          )
        })}
      </Card>
    </g>
  )
}

function Network({ p }: IllusCtx) {
  const cx = 280
  const cy = 215
  const nodes = [0, 1, 2, 3, 4, 5].map((i) => {
    const a = (Math.PI * 2 * i) / 6 - Math.PI / 2
    return { x: cx + Math.cos(a) * 172, y: cy + Math.sin(a) * 158, i }
  })
  const ips = ['185.22.4.10', '45.81.2.77', '91.140.6.3']
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={172} ry={158} fill="none" stroke={p.cardStroke} strokeWidth={1.5} strokeDasharray="4 7" />
      <ellipse cx={cx} cy={cy} rx={96} ry={88} fill="none" stroke={p.cardStroke} strokeWidth={1.5} />
      {nodes.map((n) => (
        <line key={`l${n.i}`} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke={n.i % 2 ? p.cardStrokeStrong : p.line} strokeWidth={n.i % 2 ? 1.6 : 2.4} strokeDasharray={n.i % 2 ? '3 6' : undefined} />
      ))}
      {nodes.map((n, k) => {
        const next = nodes[(k + 1) % nodes.length]
        return k % 2 === 0 ? <line key={`r${k}`} x1={n.x} y1={n.y} x2={next.x} y2={next.y} stroke={p.cardStroke} strokeWidth={1.4} /> : null
      })}
      {nodes.map((n) => (
        <g key={n.i}>
          <circle cx={n.x} cy={n.y} r={28} fill={p.card} stroke={n.i % 2 ? p.cardStroke : p.cardStrokeStrong} strokeWidth={1.6} filter={`url(#${p.ids.shadow})`} />
          {n.i % 2 === 0 ? (
            <g fill="none" stroke={p.primary} strokeWidth={2}>
              <circle cx={n.x} cy={n.y} r={11} />
              <ellipse cx={n.x} cy={n.y} rx={5} ry={11} />
              <path d={`M${n.x - 11} ${n.y} H${n.x + 11}`} />
            </g>
          ) : (
            <g>
              <rect x={n.x - 11} y={n.y - 10} width={22} height={8} rx={2} fill={p.barMid} />
              <rect x={n.x - 11} y={n.y + 1} width={22} height={8} rx={2} fill={p.bar} />
              <circle cx={n.x + 6} cy={n.y - 6} r={1.6} fill="#FFFFFF" />
            </g>
          )}
        </g>
      ))}
      <circle cx={cx} cy={cy} r={84} fill={`url(#${p.ids.glow})`} />
      <circle cx={cx} cy={cy} r={42} fill={`url(#${p.ids.hub})`} filter={`url(#${p.ids.shadowLg})`} />
      <SpiderMark x={cx - 42} y={cy - 42} size={84} p={p} disc={false} ink="#FFFFFF" />
      {ips.map((ip, i) => (
        <Pill key={ip} x={[388, 2, 372][i]} y={[150, 236, 330][i]} text={ip} p={p} size={12} mono fill={p.card} stroke={p.cardStroke} color={p.muted} />
      ))}
    </g>
  )
}

function Dashboard({ p, title }: IllusCtx) {
  const pts = [20, 34, 28, 46, 40, 58, 52, 70, 64, 82]
  const x0 = 46
  const w = 460
  const y0 = 330
  const hh = 130
  const path = pts.map((v, i) => `${i ? 'L' : 'M'}${x0 + (w / (pts.length - 1)) * i} ${y0 - (v / 100) * hh}`).join(' ')
  const price = /price|pric/i.test(title)
  return (
    <g>
      <defs>
        <linearGradient id={`${p.ids.fade}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.primary} stopOpacity="0.28" />
          <stop offset="1" stopColor={p.primary} stopOpacity="0" />
        </linearGradient>
      </defs>
      <Card x={20} y={20} w={520} h={380} p={p} r={20} lg>
        <Bar x={46} y={46} w={130} h={14} fill={p.ink} />
        <Pill x={404} y={40} text="Last 30d" p={p} size={13} />
        {[0, 1, 2].map((i) => {
          const x = 46 + i * 160
          const vals = price ? ['$49.20', '−3.1%', '1,204'] : ['12.4k', '99.2%', '1.8s']
          const labels = price ? ['Avg. price', 'Change', 'SKUs tracked'] : ['Pages scraped', 'Success rate', 'Median latency']
          return (
            <g key={i}>
              <rect x={x} y={80} width={146} height={78} rx={12} fill={p.cardAlt} />
              <text x={x + 14} y={110} fontFamily={p.sans} fontSize={13} fontWeight={500} fill={p.muted}>
                {labels[i]}
              </text>
              <text x={x + 14} y={143} fontFamily={p.sans} fontSize={26} fontWeight={700} fill={i === 0 ? p.primary : p.ink} letterSpacing={-0.6}>
                {vals[i]}
              </text>
            </g>
          )
        })}
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={x0} x2={x0 + w} y1={y0 - (i * hh) / 3} y2={y0 - (i * hh) / 3} stroke={p.cardStroke} strokeWidth={1} strokeDasharray={i ? '3 5' : undefined} />
        ))}
        <path d={`${path} L${x0 + w} ${y0} L${x0} ${y0} Z`} fill={`url(#${p.ids.fade}-area)`} />
        <path d={path} fill="none" stroke={p.primary} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x0 + w} cy={y0 - 0.82 * hh} r={7} fill={p.card} stroke={p.primary} strokeWidth={3} />
        {pts.map((_, i) => (
          <Bar key={i} x={x0 + (w / (pts.length - 1)) * i - 12} y={y0 + 22} w={24} h={6} fill={p.bar} />
        ))}
      </Card>
    </g>
  )
}

function Badge({ p, context }: IllusCtx) {
  const cx = 280
  const cy = 236
  const t = stripMarks(context)
  const rank = t.match(/#\s?(\d{1,2})\b/)?.[1] ?? (/\b(ranks?|number one|first)\b/i.test(t) ? '1' : '')
  const star = (R: number, r: number) => {
    const n = 6
    let d = ''
    for (let i = 0; i < n * 2; i++) {
      const a = (Math.PI * i) / n - Math.PI / 2
      const rad = i % 2 ? r : R
      d += `${i ? 'L' : 'M'}${cx + Math.cos(a) * rad} ${cy + Math.sin(a) * rad} `
    }
    return d + 'Z'
  }
  const sparkle = (x: number, y: number, s: number, o = 1) => (
    <path d={`M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z`} fill="#FFFFFF" opacity={o} />
  )
  return (
    <g>
      <defs>
        <linearGradient id={`${p.ids.fade}-medal`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={tint(p.primary, 0.35)} />
          <stop offset="1" stopColor={p.primary} />
        </linearGradient>
        <linearGradient id={`${p.ids.fade}-rib`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tint(p.primary, 0.75)} />
          <stop offset="1" stopColor={tint(p.primary, 0.5)} />
        </linearGradient>
      </defs>
      <rect x={cx - 92} y={20} width={184} height={150} rx={22} fill={`url(#${p.ids.fade}-rib)`} />
      <rect x={cx - 26} y={20} width={52} height={130} fill={p.primary} opacity={0.75} />
      <path d={star(186, 150)} fill={tint(p.primary, 0.72)} stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={4} strokeLinejoin="round" filter={`url(#${p.ids.shadowLg})`} />
      <path d={star(150, 122)} fill={`url(#${p.ids.fade}-medal)`} strokeLinejoin="round" />
      <circle cx={cx} cy={cy} r={86} fill="#FFFFFF" opacity={0.08} />
      {rank ? (
        <text x={cx} y={cy + 6} textAnchor="middle" dominantBaseline="central" fontFamily={p.sans} fontWeight={700} fontSize={170} fill="#FFFFFF" opacity={0.95} letterSpacing={-4}>
          {rank}
        </text>
      ) : (
        <path d={`M${cx - 48} ${cy + 2} l32 32 l64 -70`} fill="none" stroke="#FFFFFF" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {sparkle(cx + 70, cy - 60, 26)}
      {sparkle(cx - 92, cy + 50, 18)}
      {sparkle(cx + 82, cy + 52, 15)}
      {sparkle(cx + 108, cy - 4, 9, 0.9)}
      {sparkle(cx - 64, cy + 96, 10, 0.9)}
    </g>
  )
}

function Release({ p, context }: IllusCtx) {
  const v = stripMarks(context).match(/\bv?(\d+\.\d+(?:\.\d+)?)\b/)?.[1] ?? '2.0'
  return (
    <g>
      {[
        [40, 60, 14, 0.5],
        [520, 90, 12, 0.6],
        [500, 380, 10, 0.5],
        [30, 330, 9, 0.45],
      ].map(([x, y, s, o], i) => (
        <rect key={i} x={x} y={y} width={s} height={s * 2.2} rx={s / 2} fill={i % 2 ? p.primary : p.barMid} opacity={o} transform={`rotate(${i * 37 + 20} ${x} ${y})`} />
      ))}
      <Card x={76} y={60} w={408} h={320} p={p} r={20} lg>
        <rect x={100} y={86} width={84} height={84} rx={20} fill={`url(#${p.ids.hub})`} />
        <path d="M142 104 c10 6 14 18 12 30 l-6 6 h-12 l-6 -6 c-2 -12 2 -24 12 -30 z" fill="#FFFFFF" />
        <circle cx={142} cy={122} r={4} fill={p.primary} />
        <path d="M136 142 l-4 12 M148 142 l4 12" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
        <text x={204} y={118} fontFamily={p.sans} fontWeight={700} fontSize={36} fill={p.ink} letterSpacing={-1}>
          {'v' + v}
        </text>
        <Bar x={206} y={136} w={150} h={10} fill={p.bar} />
        <path d="M100 196 H460" stroke={p.cardStroke} strokeWidth={1.5} />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <circle cx={114} cy={226 + i * 38} r={10} fill={i < 3 ? tint(p.primary, 0.86) : p.cardAlt} />
            <path d={`M109 ${226 + i * 38} l3.5 3.5 l6 -7`} fill="none" stroke={i < 3 ? p.primary : p.barMid} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            <Bar x={136} y={221 + i * 38} w={[230, 190, 260, 150][i]} h={10} fill={p.bar} />
          </g>
        ))}
      </Card>
      <g transform="rotate(8 470 70)">
        <rect x={420} y={46} width={96} height={42} rx={21} fill={p.primary} filter={`url(#${p.ids.shadow})`} />
        <text x={468} y={68} textAnchor="middle" dominantBaseline="central" fontFamily={p.sans} fontWeight={700} fontSize={18} fill="#FFFFFF" letterSpacing={1}>
          NEW
        </text>
      </g>
    </g>
  )
}

function SearchIllus({ p, title }: IllusCtx) {
  const t = stripMarks(title).toLowerCase()
  const q = /amazon/.test(t)
    ? 'amazon best sellers'
    : /google|serp/.test(t)
      ? 'google search results'
      : /reddit/.test(t)
        ? 'reddit complaints'
        : /maps|leads/.test(t)
          ? 'pharmacies near me'
          : /job/.test(t)
            ? 'remote python jobs'
            : 'web data api'
  return (
    <g>
      <Card x={20} y={24} w={500} h={64} p={p} r={32} lg>
        <circle cx={60} cy={56} r={11} fill="none" stroke={p.primary} strokeWidth={3} />
        <path d="M68 64 l8 8" stroke={p.primary} strokeWidth={3} strokeLinecap="round" />
        <text x={92} y={57} dominantBaseline="central" fontFamily={p.sans} fontSize={20} fontWeight={500} fill={p.ink}>
          {q}
        </text>
        <rect x={92 + q.length * 10.4} y={44} width={2} height={26} fill={p.primary} />
        <rect x={430} y={36} width={74} height={40} rx={20} fill={p.primary} />
        <path d="M455 56 h22 m-8 -8 l8 8 l-8 8" fill="none" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      </Card>
      <Card x={20} y={112} w={500} h={300} p={p} r={20}>
        {[0, 1, 2].map((i) => {
          const y = 136 + i * 90
          return (
            <g key={i}>
              {i === 1 && <rect x={32} y={y - 10} width={476} height={80} rx={12} fill={tint(p.primary, 0.92)} />}
              <circle cx={58} cy={y + 12} r={12} fill={i === 1 ? p.primary : p.cardAlt} stroke={p.cardStroke} />
              <Bar x={80} y={y + 6} w={110} h={8} fill={p.barMid} />
              <Bar x={44} y={y + 34} w={[260, 300, 220][i]} h={12} fill={i === 1 ? p.primary : p.bar} />
              <Bar x={44} y={y + 54} w={[380, 340, 360][i]} h={7} fill={p.bar} />
            </g>
          )
        })}
      </Card>
      {/* magnifier */}
      <g filter={`url(#${p.ids.shadowLg})`}>
        <path d="M494 330 L540 378" stroke={p.primary} strokeWidth={22} strokeLinecap="round" />
        <circle cx={440} cy={270} r={78} fill="#FFFFFF" fillOpacity={0.35} stroke={tint(p.primary, 0.5)} strokeWidth={12} />
        <circle cx={440} cy={270} r={78} fill="none" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={2} />
      </g>
    </g>
  )
}

function AgentChat({ p }: IllusCtx) {
  return (
    <g>
      <Card x={20} y={20} w={520} h={380} p={p} r={22} lg>
        <circle cx={52} cy={54} r={14} fill={`url(#${p.ids.hub})`} />
        <path d="M46 54 h12 M52 48 v12" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
        <Bar x={76} y={49} w={120} h={11} fill={p.ink} />
        <Pill x={410} y={40} text="MCP" p={p} size={13} mono />
        <path d="M20 84 H540" stroke={p.cardStroke} strokeWidth={1.5} />
        {/* user */}
        <rect x={250} y={106} width={262} height={62} rx={18} fill={p.primary} />
        <Bar x={270} y={122} w={200} h={9} fill="#FFFFFF" />
        <Bar x={270} y={140} w={130} h={9} fill={tint(p.primary, 0.55)} />
        {/* tool call */}
        <rect x={46} y={190} width={340} height={96} rx={14} fill={p.code.bg} />
        <text fontFamily={p.mono} fontSize={14}>
          <tspan x={64} y={220} fill={p.code.comment}>
            {'// tool call'}
          </tspan>
          <tspan x={64} y={246} fill={p.code.fn}>
            spidra.search
          </tspan>
          <tspan fill={p.code.text}>(</tspan>
          <tspan fill={p.code.str}>"pricing pages"</tspan>
          <tspan fill={p.code.text}>)</tspan>
          <tspan x={64} y={270} fill={p.code.str}>
            ✓ 12 results · 840ms
          </tspan>
        </text>
        {/* assistant */}
        <rect x={46} y={306} width={300} height={70} rx={18} fill={p.cardAlt} />
        <Bar x={66} y={324} w={230} h={9} fill={p.barMid} />
        <Bar x={66} y={342} w={180} h={9} fill={p.bar} />
        <Bar x={66} y={358} w={100} h={7} fill={p.bar} />
      </Card>
    </g>
  )
}

function Geometric({ p }: IllusCtx) {
  const cells: [number, number, number][] = []
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) cells.push([c, r, (r * 4 + c) % 7])
  return (
    <g>
      <defs>
        <clipPath id={`${p.ids.fade}-gclip`}>
          <circle cx={170} cy={210} r={150} />
        </clipPath>
      </defs>
      <circle cx={170} cy={210} r={150} fill={`url(#${p.ids.hub})`} filter={`url(#${p.ids.shadowLg})`} />
      <g clipPath={`url(#${p.ids.fade}-gclip)`} stroke="#FFFFFF" strokeOpacity={0.22} strokeWidth={10}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <line key={i} x1={0} y1={60 + i * 40} x2={360} y2={-120 + i * 40} />
        ))}
      </g>
      <g fill="none" stroke={p.cardStrokeStrong} strokeWidth={1.5}>
        <path d="M330 30 A190 190 0 0 1 520 220" />
        <path d="M330 70 A150 150 0 0 1 480 220" strokeDasharray="4 6" />
      </g>
      {cells.map(([c, r, k]) => {
        const filled = k === 0 || k === 3
        return (
          <rect
            key={`${c}-${r}`}
            x={330 + c * 52}
            y={220 + r * 44}
            width={40}
            height={32}
            rx={8}
            fill={filled ? p.primary : k === 5 ? p.barMid : p.card}
            stroke={filled ? 'none' : p.cardStroke}
            strokeWidth={1.4}
            opacity={r === 3 ? 0.5 : 1}
          />
        )
      })}
      <circle cx={470} cy={110} r={22} fill={p.card} stroke={p.cardStroke} strokeWidth={1.5} filter={`url(#${p.ids.shadow})`} />
      <circle cx={470} cy={110} r={8} fill={p.primary} />
      <rect x={60} y={360} width={70} height={18} rx={9} fill={p.bar} />
    </g>
  )
}

export const OBJECT_ILLUSTRATIONS: IllustrationDef[] = [
  { id: 'code-editor', name: 'Code editor', group: 'Developer', w: 560, h: 420, render: (c) => <CodeEditor {...c} /> },
  { id: 'terminal', name: 'Terminal', group: 'Developer', w: 560, h: 420, render: (c) => <Terminal {...c} /> },
  { id: 'agent-chat', name: 'Agent / MCP', group: 'Developer', w: 560, h: 420, render: (c) => <AgentChat {...c} /> },
  { id: 'document', name: 'Document parsing', group: 'Data', w: 560, h: 400, render: (c) => <DocumentIllus {...c} /> },
  { id: 'database', name: 'Database', group: 'Data', w: 560, h: 400, render: (c) => <Database {...c} /> },
  { id: 'dashboard', name: 'Monitoring', group: 'Data', w: 560, h: 420, render: (c) => <Dashboard {...c} /> },
  { id: 'network', name: 'Proxy network', group: 'Pipelines', w: 560, h: 430, render: (c) => <Network {...c} /> },
  { id: 'search', name: 'Search results', group: 'Pipelines', w: 560, h: 420, render: (c) => <SearchIllus {...c} /> },
  { id: 'badge', name: 'Award badge', group: 'Product', w: 560, h: 440, render: (c) => <Badge {...c} /> },
  { id: 'release', name: 'Release notes', group: 'Product', w: 560, h: 420, render: (c) => <Release {...c} /> },
  { id: 'geometric', name: 'Geometric', group: 'Abstract', w: 560, h: 420, render: (c) => <Geometric {...c} /> },
]
