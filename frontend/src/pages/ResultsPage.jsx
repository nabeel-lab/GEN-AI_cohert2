import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Download, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  TrendingUp, TrendingDown, Minus, MapPin, Users, Shield, BarChart3,
  Truck, Megaphone, UserCheck, Brain, Star, AlertCircle, Sparkles,
  Target, Lightbulb, Flag, Compass, Gauge,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import WhatIfSimulator from '../components/WhatIfSimulator'
import ChatPanel from '../components/ChatPanel'

// ── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',     label: 'Overview',     icon: Brain },
  { id: 'ai-insights',  label: 'AI Insights',  icon: Sparkles },
  { id: 'market',       label: 'Market',        icon: TrendingUp },
  { id: 'competitors',  label: 'Competitors',   icon: Users },
  { id: 'finance',      label: 'Finance',       icon: BarChart3 },
  { id: 'location',     label: 'Location',      icon: MapPin },
  { id: 'personas',     label: 'Personas',      icon: UserCheck },
  { id: 'risk',         label: 'Risk',          icon: Shield },
  { id: 'report',       label: 'Report',        icon: Download },
]

// ── Small reusable primitives ────────────────────────────────────────────────

// Animates a number counting up from 0 to its target value on mount/change.
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf
    const start = performance.now()
    const from = 0
    const tick = (now) => {
      const pct = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - pct, 3) // ease-out-cubic
      setValue(Math.round(from + (target - from) * eased))
      if (pct < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

function ScoreRing({ score, size = 120, strokeWidth = 10 }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 70 ? '#10b981' : score >= 45 ? '#D4AF37' : '#ef4444'
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }} />
    </svg>
  )
}

function StatBar({ label, value, max = 100, color = 'gold' }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const barColor = color === 'gold' ? 'bg-gold-gradient'
    : color === 'green' ? 'bg-emerald-500'
    : color === 'blue'  ? 'bg-accent-blue'
    : 'bg-gold-gradient'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-medium">{value}</span>
      </div>
      <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all duration-700`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Badge({ text }) {
  const map = {
    'GO':                   'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    'NO GO':                'bg-red-500/15 text-red-300 border-red-500/25',
    'PROCEED WITH CAUTION': 'bg-gold-500/15 text-gold-400 border-gold-500/25',
    'growing':  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'stable':   'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'declining':'bg-red-500/10 text-red-400 border-red-500/20',
    'Low':      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Medium':   'bg-gold-500/10 text-gold-400 border-gold-500/20',
    'High':     'bg-red-500/10 text-red-400 border-red-500/20',
  }
  const cls = map[text] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {text}
    </span>
  )
}

function VerdictIcon({ verdict }) {
  if (verdict === 'GO')    return <CheckCircle2 size={28} className="text-emerald-400" />
  if (verdict === 'NO GO') return <XCircle      size={28} className="text-red-400" />
  return <AlertTriangle size={28} className="text-gold-400" />
}

function TrendIcon({ trend }) {
  if (trend === 'growing')  return <TrendingUp   size={14} className="text-emerald-400" />
  if (trend === 'declining')return <TrendingDown size={14} className="text-red-400" />
  return <Minus size={14} className="text-slate-400" />
}

// ── Custom Recharts tooltip ──────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs border border-white/10">
      <p className="text-slate-400 mb-1">Month {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: ₹{Number(p.value).toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  )
}

// Maps the backend's next_steps keys onto the phased-roadmap labels requested
// for the demo — same underlying data, clearer executive framing.
const ROADMAP_PHASE_LABELS = {
  now:        'Immediate',
  '3_months': 'Preparation',
  '6_months': 'Launch',
  '1_year':   'Growth',
}

// Fixed weights mirroring backend/agents/decision_agent.py::_SCORE_WEIGHTS —
// shown here purely as a label; the actual sub-scores always come from the API.
const SCORE_COMPONENT_META = {
  market:       { label: 'Market Demand',    weight: 20 },
  location:     { label: 'Location',         weight: 15 },
  finance:      { label: 'Finance / ROI',    weight: 15 },
  competition:  { label: 'Competition',      weight: 10 },
  risk:         { label: 'Risk (inverse)',   weight: 15 },
  customer_fit: { label: 'Customer Fit',     weight: 10 },
  supply_chain: { label: 'Supply Chain',     weight: 7.5 },
  marketing:    { label: 'Marketing',        weight: 7.5 },
}

function ScoreBreakdownCard({ breakdown }) {
  if (!breakdown || Object.keys(breakdown).length === 0) return null
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Gauge size={16} className="text-gold-400" />
        <h3 className="font-semibold text-slate-100">Decision Score Breakdown</h3>
      </div>
      <p className="text-slate-500 text-xs mb-5">How each factor contributes to the overall Business Health Score.</p>
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
        {Object.entries(breakdown).map(([key, value]) => {
          const meta = SCORE_COMPONENT_META[key] || { label: key, weight: 0 }
          return (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{meta.label}</span>
                <span className="text-slate-300 font-medium">{value}/100 <span className="text-slate-600">· {meta.weight}% weight</span></span>
              </div>
              <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${value >= 70 ? 'bg-emerald-500' : value >= 45 ? 'bg-gold-gradient' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, value)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Executive Intelligence Brief — the hero section shown above every tab ───
function ExecutiveBrief({ report }) {
  const { decision } = report
  const [expanded, setExpanded] = useState(true)
  const score = decision.business_health_score
  const animatedScore = useCountUp(score)

  if (!decision.executive_summary) return null

  return (
    <div className="max-w-6xl mx-auto px-6 pt-6">
      <div className="glass-gold rounded-2xl p-6 sm:p-7 animate-fade-in-up">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gold-500/15 flex items-center justify-center flex-shrink-0">
            <Sparkles size={17} className="text-gold-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-lg font-bold text-slate-100">Executive Intelligence Brief</h2>
              <Badge text={decision.go_no_go} />
            </div>
            <p className="text-slate-500 text-xs mt-0.5">AI-synthesized from all 10 agent reports</p>
          </div>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs text-slate-400 hover:text-slate-100 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-all flex-shrink-0"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>

        {/* Score + verdict strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0" style={{ width: 56, height: 56 }}>
              <ScoreRing score={score} size={56} strokeWidth={6} />
              <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-slate-100 tabular-nums">{animatedScore}</div>
            </div>
            <div>
              <p className="text-xs text-slate-500">Health Score</p>
              <p className="text-sm font-semibold text-slate-200">{score}/100</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Confidence</p>
            <p className="text-lg font-bold text-gold-400">{decision.confidence_score}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Launch Window</p>
            <p className="text-xs text-slate-300 leading-snug">{decision.recommended_launch_window || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Expected ROI</p>
            <p className="text-xs text-slate-300 leading-snug">{decision.expected_roi_summary || '—'}</p>
          </div>
        </div>

        {/* Executive summary paragraph */}
        <p className="text-slate-300 text-sm leading-relaxed mb-5">{decision.executive_summary}</p>

        {expanded && (
          <div className="grid sm:grid-cols-2 gap-5 animate-fade-in-up">
            <div>
              <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Target size={12} /> Top Opportunities
              </p>
              <ul className="flex flex-col gap-1.5">
                {decision.top_opportunities.map((o, i) => (
                  <li key={i} className="text-xs text-slate-400 flex gap-2"><span className="text-emerald-600 flex-shrink-0">+</span>{o}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle size={12} /> Biggest Risks
              </p>
              <ul className="flex flex-col gap-1.5">
                {decision.biggest_risks.map((r, i) => (
                  <li key={i} className="text-xs text-slate-400 flex gap-2"><span className="text-red-600 flex-shrink-0">−</span>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Compass size={12} /> Market Outlook
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">{decision.market_outlook}</p>
            </div>
            <div>
              <p className="text-gold-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BarChart3 size={12} /> Financial Outlook
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">{decision.financial_outlook}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab: AI Insights ─────────────────────────────────────────────────────────
function AIInsightsTab({ report }) {
  const { decision } = report
  return (
    <div className="flex flex-col gap-6">
      {/* Why this verdict */}
      <div className="glass-gold rounded-2xl p-6">
        <h3 className="font-semibold mb-2 text-gold-400 flex items-center gap-2">
          <Sparkles size={15} /> Why This Recommendation
        </h3>
        <p className="text-slate-300 text-sm leading-relaxed">{decision.reasoning}</p>
      </div>

      {/* Confidence explanation */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-1 text-slate-100">Confidence Explanation</h3>
        <p className="text-slate-500 text-xs mb-4">Why the model is {decision.confidence_score}% confident in this verdict.</p>
        <div className="flex flex-col gap-2.5">
          {decision.confidence_factors.map((f, i) => (
            <div key={i} className="flex gap-3 items-start text-sm">
              <CheckCircle2 size={14} className="text-gold-400 flex-shrink-0 mt-0.5" />
              <p className="text-slate-300 leading-relaxed">{f}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Risk vs Opportunity matrix */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-4 text-slate-100">Risk vs Opportunity Matrix</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl p-4 bg-emerald-500/8 border border-emerald-500/15">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Target size={12} /> Opportunities
            </p>
            <ul className="flex flex-col gap-2">
              {decision.top_opportunities.map((o, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-emerald-500 flex-shrink-0">+</span>{o}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl p-4 bg-red-500/8 border border-red-500/15">
            <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertTriangle size={12} /> Risks
            </p>
            <ul className="flex flex-col gap-2">
              {decision.biggest_risks.map((r, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-red-500 flex-shrink-0">−</span>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Strengths / Weaknesses */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-3 text-slate-100 flex items-center gap-2">
            <Star size={14} className="text-emerald-400" /> Key Strengths
          </h3>
          <ul className="flex flex-col gap-2">
            {decision.key_strengths.map((s, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-emerald-600 flex-shrink-0">•</span>{s}</li>
            ))}
          </ul>
        </div>
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-3 text-slate-100 flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400" /> Key Weaknesses
          </h3>
          <ul className="flex flex-col gap-2">
            {decision.key_weaknesses.map((w, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-red-600 flex-shrink-0">•</span>{w}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Hidden opportunities + critical risks */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="glass-gold rounded-2xl p-6">
          <h3 className="font-semibold mb-3 text-gold-400 flex items-center gap-2">
            <Lightbulb size={14} /> Hidden Opportunities
          </h3>
          <ul className="flex flex-col gap-2">
            {decision.hidden_opportunities.map((h, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-gold-500 flex-shrink-0">✦</span>{h}</li>
            ))}
          </ul>
        </div>
        <div className="glass rounded-2xl p-6 border border-red-500/15">
          <h3 className="font-semibold mb-3 text-red-400 flex items-center gap-2">
            <AlertTriangle size={14} /> Critical Risks
          </h3>
          <ul className="flex flex-col gap-2">
            {decision.critical_risks.map((c, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-red-500 flex-shrink-0">!</span>{c}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Patterns & anomalies */}
      {decision.patterns.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4 text-slate-100 flex items-center gap-2">
            <Compass size={15} className="text-gold-400" /> Patterns & Anomalies Detected
          </h3>
          <div className="flex flex-col gap-3">
            {decision.patterns.map((p, i) => (
              <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-navy-800/50 text-sm">
                <Sparkles size={13} className="text-gold-400 flex-shrink-0 mt-0.5" />
                <p className="text-slate-300 leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next milestone */}
      <div className="glass rounded-2xl p-6 flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0">
          <Flag size={16} className="text-gold-400" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-100 mb-1">Suggested Next Milestone</h3>
          <p className="text-slate-300 text-sm leading-relaxed">{decision.suggested_next_milestone}</p>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Overview ────────────────────────────────────────────────────────────
function OverviewTab({ report }) {
  const { decision, business_profile, market_intelligence, risk, finance } = report
  const score = decision.business_health_score
  const animatedScore = useCountUp(score)

  return (
    <div className="flex flex-col gap-6">
      {/* Hero score card */}
      <div className="glass-gold rounded-2xl p-7 flex flex-col sm:flex-row items-center gap-7">
        <div className="relative flex-shrink-0 flex items-center justify-center"
          style={{ width: 120, height: 120 }}>
          <ScoreRing score={score} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-slate-100 tabular-nums">{animatedScore}</span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center gap-3 justify-center sm:justify-start mb-2">
            <VerdictIcon verdict={decision.go_no_go} />
            <Badge text={decision.go_no_go} />
          </div>
          <h2 className="text-2xl font-bold mb-1">Business Health Score</h2>
          <p className="text-slate-400 text-sm">
            Confidence: <span className="text-gold-400 font-semibold">{decision.confidence_score}%</span>
            &nbsp;·&nbsp; Risk: <Badge text={risk.risk_level} />
          </p>
        </div>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Market Demand',    value: `${market_intelligence.demand_score}/100`, sub: market_intelligence.trend },
          { label: 'Break-even',       value: `Month ${finance.break_even_months}`,      sub: 'estimated' },
          { label: 'Year-1 Revenue',   value: `₹${(finance.projected_revenue_month_12/100000).toFixed(1)}L`, sub: 'projected' },
          { label: 'ROI (12 mo)',      value: `${finance.roi_percentage}%`,               sub: 'projected' },
        ].map((m) => (
          <div key={m.label} className="glass card-lift rounded-xl p-4 text-center">
            <p className="text-slate-500 text-xs mb-1">{m.label}</p>
            <p className="text-xl font-bold text-slate-100">{m.value}</p>
            <p className="text-xs text-slate-600 mt-0.5 capitalize">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Decision score breakdown — shows how the health score was formed */}
      <ScoreBreakdownCard breakdown={decision.score_breakdown} />

      {/* Top 3 recommendations */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-4 text-slate-100">Top Recommendations</h3>
        <div className="flex flex-col gap-3">
          {decision.top_3_recommendations.map((rec, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span className="text-gold-500 font-black text-base flex-shrink-0 w-5">{i + 1}.</span>
              <p className="text-slate-300 leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Business profile */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-4 text-slate-100">Business Profile</h3>
        <div className="grid sm:grid-cols-2 gap-5 text-sm">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Products / Services</p>
            <ul className="flex flex-col gap-1.5">
              {business_profile.products.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-300">
                  <span className="text-gold-500 mt-0.5">›</span>{p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Target Customers</p>
            <ul className="flex flex-col gap-1.5">
              {business_profile.target_customers.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-300">
                  <span className="text-gold-500 mt-0.5">›</span>{c}
                </li>
              ))}
            </ul>
          </div>
          <div className="sm:col-span-2">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Unique Value Proposition</p>
            <p className="text-slate-300 leading-relaxed">{business_profile.unique_value}</p>
          </div>
        </div>
      </div>

      {/* Next steps timeline */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-5 text-slate-100">Action Roadmap</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(decision.next_steps).map(([phase, actions], i) => (
            <div key={phase} className="bg-navy-800/60 rounded-xl p-4">
              <p className="text-slate-600 text-xs font-mono mb-1">PHASE {i + 1}</p>
              <p className="text-gold-400 text-xs font-bold uppercase tracking-wider mb-3">
                {ROADMAP_PHASE_LABELS[phase] || phase.replace('_', ' ')}
              </p>
              <ul className="flex flex-col gap-2">
                {actions.map((a, i) => (
                  <li key={i} className="text-xs text-slate-400 leading-relaxed flex gap-2">
                    <span className="text-gold-600 flex-shrink-0">•</span>{a}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Tab: Market ──────────────────────────────────────────────────────────────
function MarketTab({ report }) {
  const m = report.market_intelligence
  return (
    <div className="flex flex-col gap-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5 text-center">
          <p className="text-slate-500 text-xs mb-2">Demand Score</p>
          <p className="text-4xl font-black text-gold-gradient">{m.demand_score}</p>
          <p className="text-slate-600 text-xs mt-1">out of 100</p>
        </div>
        <div className="glass rounded-xl p-5 text-center">
          <p className="text-slate-500 text-xs mb-2">Market Trend</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <TrendIcon trend={m.trend} />
            <Badge text={m.trend} />
          </div>
        </div>
        <div className="glass rounded-xl p-5 text-center">
          <p className="text-slate-500 text-xs mb-2">Market Size</p>
          <p className="text-sm font-semibold text-slate-200 mt-1 leading-snug">{m.market_size_estimate}</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Top 3 Market Trends</h3>
        <div className="flex flex-col gap-3">
          {m.top_3_trends.map((t, i) => (
            <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-navy-800/50">
              <span className="w-6 h-6 rounded-lg bg-gold-500/15 text-gold-400 text-xs font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
              <p className="text-slate-300 text-sm leading-relaxed">{t}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-2">Seasonality</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{m.seasonality}</p>
      </div>

      {m.detailed_analysis && (
        <div className="glass-gold rounded-2xl p-6">
          <h3 className="font-semibold mb-2 text-gold-400">Analyst Note</h3>
          <p className="text-slate-300 text-sm leading-relaxed">{m.detailed_analysis}</p>
        </div>
      )}
    </div>
  )
}

// ── Tab: Competitors ─────────────────────────────────────────────────────────
function CompetitorsTab({ report }) {
  const { competitors } = report
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {competitors.competitors.map((c) => (
          <div key={c.name} className="glass card-lift rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-slate-100">{c.name}</h3>
                <p className="text-slate-500 text-sm">{c.price_range}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Star size={13} className="text-gold-400 fill-gold-400" />
                <span className="text-gold-400 font-bold text-sm">{c.rating}</span>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">Strengths</p>
                <ul className="flex flex-col gap-1">
                  {c.strengths.map((s, i) => <li key={i} className="text-slate-400 flex gap-2"><span className="text-emerald-600">+</span>{s}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">Weaknesses</p>
                <ul className="flex flex-col gap-1">
                  {c.weaknesses.map((w, i) => <li key={i} className="text-slate-400 flex gap-2"><span className="text-red-600">−</span>{w}</li>)}
                </ul>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-xs text-slate-500">
              <span>Est. monthly revenue</span>
              <span className="text-slate-300 font-medium">{c.estimated_monthly_revenue}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-4">SWOT Analysis</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          {[
            { key: 'strengths',     label: 'Strengths',     color: 'emerald' },
            { key: 'weaknesses',    label: 'Weaknesses',    color: 'red' },
            { key: 'opportunities', label: 'Opportunities', color: 'blue' },
            { key: 'threats',       label: 'Threats',       color: 'gold' },
          ].map(({ key, label, color }) => {
            const colorMap = { emerald: 'text-emerald-400 bg-emerald-500/10', red: 'text-red-400 bg-red-500/10', blue: 'text-blue-400 bg-blue-500/10', gold: 'text-gold-400 bg-gold-500/10' }
            return (
              <div key={key} className={`rounded-xl p-4 ${colorMap[color].split(' ')[1]}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${colorMap[color].split(' ')[0]}`}>{label}</p>
                <ul className="flex flex-col gap-1">
                  {(competitors.swot[key] || []).map((item, i) => (
                    <li key={i} className="text-slate-400 text-xs leading-relaxed">• {item}</li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      <div className="glass-gold rounded-2xl p-6">
        <h3 className="font-semibold mb-2 text-gold-400">Gap Opportunity</h3>
        <p className="text-slate-300 text-sm leading-relaxed">{competitors.gap_opportunity}</p>
      </div>
    </div>
  )
}

// ── Tab: Finance ─────────────────────────────────────────────────────────────
function FinanceTab({ report }) {
  const f = report.finance
  const chartData = f.profit_forecast.map((m) => ({
    month: m.month,
    Revenue: Math.round(m.revenue),
    Cost:    Math.round(m.cost),
    Profit:  Math.round(m.profit),
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Rent',     value: `₹${f.monthly_rent_estimate.toLocaleString('en-IN')}` },
          { label: 'Staff Cost',       value: `₹${f.staff_cost_estimate.toLocaleString('en-IN')}` },
          { label: 'Break-even Month', value: `Month ${f.break_even_months}` },
          { label: 'Projected ROI',    value: `${f.roi_percentage}%` },
        ].map((m) => (
          <div key={m.label} className="glass rounded-xl p-4 text-center">
            <p className="text-slate-500 text-xs mb-1">{m.label}</p>
            <p className="text-lg font-bold text-slate-100">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-5">12-Month Revenue vs Cost</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#D4AF37" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: 'Month', position: 'insideBottom', offset: -2, fill: '#475569', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="Revenue" stroke="#D4AF37" strokeWidth={2} fill="url(#revGrad)" />
            <Area type="monotone" dataKey="Cost"    stroke="#ef4444" strokeWidth={2} fill="url(#costGrad)" />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-5">Monthly Profit / Loss</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
            <Bar dataKey="Profit" radius={[4, 4, 0, 0]}>
              {chartData.map((row) => (
                <Cell key={row.month} fill={row.Profit >= 0 ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Monthly Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-white/5">
                <th className="text-left pb-2 font-medium">Month</th>
                <th className="text-right pb-2 font-medium">Revenue</th>
                <th className="text-right pb-2 font-medium">Cost</th>
                <th className="text-right pb-2 font-medium">Profit</th>
              </tr>
            </thead>
            <tbody>
              {f.profit_forecast.map((row) => (
                <tr key={row.month} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                  <td className="py-2 text-slate-400">Month {row.month}</td>
                  <td className="py-2 text-right text-slate-300">₹{row.revenue.toLocaleString('en-IN')}</td>
                  <td className="py-2 text-right text-slate-300">₹{row.cost.toLocaleString('en-IN')}</td>
                  <td className={`py-2 text-right font-medium ${row.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {row.profit >= 0 ? '+' : ''}₹{row.profit.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Location ────────────────────────────────────────────────────────────
function LocationTab({ report }) {
  const loc = report.location
  const metrics = [
    { label: 'Footfall Score',       value: loc.footfall_score,      color: 'gold' },
    { label: 'Competition Density',  value: loc.competition_density, color: 'gold' },
    { label: 'Accessibility',        value: loc.accessibility_score, color: 'green' },
    { label: 'Growth Potential',     value: loc.growth_potential,    color: 'blue' },
  ]
  const mapsUrl = `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${loc.latitude},${loc.longitude}&zoom=15`

  return (
    <div className="flex flex-col gap-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="glass rounded-xl p-5 text-center">
            <p className="text-slate-500 text-xs mb-2">{m.label}</p>
            <p className="text-3xl font-black text-slate-100">{m.value}</p>
            <p className="text-slate-600 text-xs mt-1">/ 100</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Location Score Breakdown</h3>
        <div className="flex flex-col gap-4">
          {metrics.map((m) => (
            <StatBar key={m.label} label={m.label} value={m.value} color={m.color} />
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="font-semibold">Location Map</h3>
          <p className="text-slate-500 text-xs mt-0.5">
            {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
          </p>
        </div>
        <iframe
          title="Business Location Map"
          src={mapsUrl}
          width="100%"
          height="340"
          style={{ border: 0, display: 'block' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  )
}

// ── Tab: Personas ────────────────────────────────────────────────────────────
function PersonasTab({ report }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {report.personas.map((p) => (
        <div key={p.name} className="glass card-lift rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-500/15 flex items-center justify-center text-gold-400 font-bold text-sm flex-shrink-0">
              {p.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-100">{p.name}</h3>
              <p className="text-xs text-slate-500">{p.demographics.occupation}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(p.demographics).map(([k, v]) => (
              <div key={k} className="bg-navy-800/60 rounded-lg p-2">
                <p className="text-slate-600 capitalize">{k}</p>
                <p className="text-slate-300 font-medium truncate">{v}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1.5">Needs</p>
            <ul className="flex flex-col gap-1">
              {p.needs.map((n, i) => <li key={i} className="text-xs text-slate-400 flex gap-1.5"><span className="text-emerald-600">•</span>{n}</li>)}
            </ul>
          </div>

          <div>
            <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1.5">Pain Points</p>
            <ul className="flex flex-col gap-1">
              {p.pain_points.map((pt, i) => <li key={i} className="text-xs text-slate-400 flex gap-1.5"><span className="text-red-600">•</span>{pt}</li>)}
            </ul>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tab: Risk ────────────────────────────────────────────────────────────────
function RiskTab({ report }) {
  const { risk, supply_chain, marketing } = report
  const animatedRisk = useCountUp(risk.risk_score)
  return (
    <div className="flex flex-col gap-6">
      <div className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative flex-shrink-0" style={{ width: 100, height: 100 }}>
          <ScoreRing score={risk.risk_score} size={100} strokeWidth={9} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-slate-100 tabular-nums">{animatedRisk}</span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={16} className={risk.risk_level === 'High' ? 'text-red-400' : risk.risk_level === 'Medium' ? 'text-gold-400' : 'text-emerald-400'} />
            <span className="font-semibold">{risk.risk_level} Risk</span>
            <Badge text={risk.risk_level} />
          </div>
          <p className="text-slate-400 text-sm">Risk score based on budget adequacy and competition density.</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Mitigation Strategies</h3>
        <div className="flex flex-col gap-3">
          {risk.mitigations.map((m, i) => (
            <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-navy-800/50 text-sm">
              <Shield size={14} className="text-gold-400 flex-shrink-0 mt-0.5" />
              <p className="text-slate-300 leading-relaxed">{m}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Truck size={15} className="text-gold-400" /> Supply Chain
        </h3>
        <div className="flex flex-col gap-3">
          {supply_chain.map((item) => (
            <div key={item.category} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-navy-800/50 rounded-xl text-sm">
              <div className="flex-1">
                <p className="font-medium text-slate-200">{item.category}</p>
                <p className="text-slate-500 text-xs mt-0.5">{item.suppliers.join(' · ')}</p>
              </div>
              <Badge text={item.risk_level} />
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Megaphone size={15} className="text-gold-400" /> Marketing Campaigns
        </h3>
        <div className="flex flex-col gap-3">
          {marketing.map((c) => (
            <div key={c.channel} className="p-4 bg-navy-800/50 rounded-xl text-sm">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="font-medium text-slate-200">{c.channel}</p>
                <Badge text={c.difficulty} />
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{c.strategy}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Tab: Report (export) ─────────────────────────────────────────────────────
function ReportTab({ report }) {
  function handleDownload() {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `launchwise-report-${report.session_id.slice(0, 8)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-gold rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">📊</div>
        <h2 className="text-2xl font-bold mb-2">Full Intelligence Report</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
          Download the complete JSON report with all 10 agent outputs, financial forecasts,
          and the Go/No-Go decision — ready to share with co-founders or investors.
        </p>
        <button onClick={handleDownload}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gold-gradient text-navy-900 font-bold text-sm hover:shadow-lg hover:shadow-gold-500/20 hover:scale-105 active:scale-100 transition-all">
          <Download size={16} /> Download Report JSON
        </button>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Report Summary</h3>
          <span className="text-xs text-slate-600 font-mono">{report.session_id.slice(0, 8)}…</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {[
            ['Business Type',    report.request.business_type],
            ['Location',         report.request.location],
            ['Budget',           `₹${Number(report.request.budget).toLocaleString('en-IN')}`],
            ['Verdict',          report.decision.go_no_go],
            ['Health Score',     `${report.decision.business_health_score} / 100`],
            ['Risk Level',       report.risk.risk_level],
            ['Break-even',       `Month ${report.finance.break_even_months}`],
            ['Generated',        new Date(report.timestamp).toLocaleString('en-IN')],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2 border-b border-white/5">
              <span className="text-slate-500">{k}</span>
              <span className="text-slate-200 font-medium text-right">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main ResultsPage ─────────────────────────────────────────────────────────
export default function ResultsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [report, setReport]       = useState(null)
  const [error, setError]         = useState('')

  useEffect(() => {
    const raw = sessionStorage.getItem('lw_report')
    if (!raw) {
      setError('No report found. Please run an analysis first.')
      return
    }
    try {
      setReport(JSON.parse(raw))
    } catch {
      setError('Report data is corrupted. Please run a new analysis.')
    }
  }, [])

  function handleNewAnalysis() {
    sessionStorage.removeItem('lw_report')
    navigate('/analyze')
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="min-h-screen bg-navy-gradient flex items-center justify-center px-6">
        <div className="glass rounded-2xl p-10 text-center max-w-md animate-fade-in-up">
          <AlertCircle size={40} className="text-gold-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Report Available</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button onClick={() => navigate('/analyze')}
            className="px-6 py-3 rounded-xl bg-gold-gradient text-navy-900 font-semibold text-sm">
            Run Analysis
          </button>
        </div>
      </div>
    )
  }

  // ── Loading state ──
  if (!report) {
    return (
      <div className="min-h-screen bg-navy-gradient flex items-center justify-center">
        <div className="text-slate-500 text-sm animate-pulse">Loading report…</div>
      </div>
    )
  }

  // Only the active tab's component is constructed/mounted — avoids mounting
  // two Recharts containers + a Maps iframe simultaneously on every render.
  const TAB_COMPONENTS = {
    overview:    OverviewTab,
    'ai-insights': AIInsightsTab,
    market:      MarketTab,
    competitors: CompetitorsTab,
    finance:     FinanceTab,
    location:    LocationTab,
    personas:    PersonasTab,
    risk:        RiskTab,
    report:      ReportTab,
  }
  const ActiveTabComponent = TAB_COMPONENTS[activeTab]

  return (
    <div className="min-h-screen bg-navy-gradient text-slate-100">

      {/* ── Navbar ── */}
      <nav className="glass border-b border-white/5 px-6 h-16 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors text-sm">
          <ArrowLeft size={16} /> Home
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          <span className="font-bold text-gold-gradient hidden sm:block">LaunchWise AI</span>
        </div>
        <button onClick={handleNewAnalysis}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-100 hover:border-white/20 transition-all text-sm">
          <RefreshCw size={14} /> New Analysis
        </button>
      </nav>

      {/* ── Verdict banner ── */}
      <div className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <VerdictIcon verdict={report.decision.go_no_go} />
            <div>
              <div className="flex items-center gap-2">
                <Badge text={report.decision.go_no_go} />
                <span className="text-slate-400 text-sm">·</span>
                <span className="text-slate-400 text-sm">Health score <span className="text-slate-100 font-semibold">{report.decision.business_health_score}/100</span></span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 capitalize">{report.request.business_type} · {report.request.location}</p>
            </div>
          </div>
          <Badge text={report.risk.risk_level} />
        </div>
      </div>

      {/* ── Executive Intelligence Brief (hero) ── */}
      <ExecutiveBrief report={report} />

      {/* ── Tab bar ── */}
      <div className="border-b border-white/5 sticky top-16 z-40 bg-navy-900/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 overflow-x-auto">
          <div className="flex gap-1 py-2 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-gold-500/15 text-gold-400 border border-gold-500/20'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5',
                ].join(' ')}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div key={activeTab} className="animate-fade-in-up">
          <ActiveTabComponent report={report} />
        </div>
      </div>

      {/* What-If Simulator & Chat Assistant floating panels */}
      <WhatIfSimulator
        report={report}
        onResult={(result) => {
          // Update display with simulation results — brief notification
          console.log('Simulation result:', result)
        }}
      />
      <ChatPanel sessionId={report.session_id} />
    </div>
  )
}
