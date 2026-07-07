import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Download, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  TrendingUp, TrendingDown, Minus, MapPin, Users, Shield, BarChart3,
  Truck, Megaphone, UserCheck, Brain, Star, AlertCircle, Sparkles,
  Target, Lightbulb, Flag, Compass, Gauge, ExternalLink, Loader2,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import WhatIfSimulator from '../components/WhatIfSimulator'
import ChatPanel from '../components/ChatPanel'
import { loadGoogleMaps, DARK_MAP_STYLE } from '../lib/googleMaps'



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

const ScoreRing = React.memo(({ score, size = 120, strokeWidth = 10 }) => {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 70 ? '#10b981' : score >= 45 ? '#3B82F6' : '#ef4444'
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
      <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeLinecap="round"
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} />
    </svg>
  )
})

function StatBar({ label, value, max = 100, color = 'blue' }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const barColor = color === 'blue' ? 'bg-blue-500'
    : color === 'green' ? 'bg-emerald-500'
    : color === 'gold'  ? 'bg-zinc-400'
    : 'bg-zinc-300'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-500">{label}</span>
        <span className="text-zinc-300 font-medium">{value}</span>
      </div>
      <div className="h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all duration-700`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const Badge = React.memo(({ text }) => {
  const map = {
    'GO':                   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'NO GO':                'bg-red-500/10 text-red-400 border-red-500/20',
    'PROCEED WITH CAUTION': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'growing':  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'stable':   'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    'declining':'bg-red-500/10 text-red-400 border-red-500/20',
    'Low':      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Medium':   'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'High':     'bg-red-500/10 text-red-400 border-red-500/20',
  }
  const cls = map[text] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide border ${cls}`}>
      {text}
    </span>
  )
})

function VerdictIcon({ verdict }) {
  if (verdict === 'GO')    return <CheckCircle2 size={28} className="text-emerald-400" />
  if (verdict === 'NO GO') return <XCircle      size={28} className="text-red-400" />
  return <AlertTriangle size={28} className="text-blue-400" />
}

function TrendIcon({ trend }) {
  if (trend === 'growing')  return <TrendingUp   size={14} className="text-emerald-400" />
  if (trend === 'declining')return <TrendingDown size={14} className="text-red-400" />
  return <Minus size={14} className="text-zinc-500" />
}

// ── Custom Recharts tooltip ──────────────────────────────────────────────────
const ChartTooltip = React.memo(({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="surface-elevated rounded-lg px-3 py-2 text-xs">
      <p className="text-zinc-500 mb-1">Month {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: ₹{Number(p.value).toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  )
})

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
      <div className="border border-zinc-800 bg-zinc-900/30 backdrop-blur-xl rounded-2xl p-6 sm:p-8 animate-fade-in-up">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles size={18} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-3">
              <h2 className="text-xl font-medium tracking-tight text-zinc-100">Executive Intelligence Brief</h2>
              <Badge text={decision.go_no_go} />
            </div>
            <p className="text-zinc-500 text-sm mt-1">AI-synthesized from all 10 agent reports</p>
          </div>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs text-zinc-400 hover:text-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-all flex-shrink-0"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>

        {/* Score + verdict strip */}
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8 border-b border-zinc-800/50 pb-8"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
          }}
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } }} className="flex items-center gap-4">
            <div className="relative flex-shrink-0" style={{ width: 64, height: 64 }}>
              <ScoreRing score={score} size={64} strokeWidth={6} />
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0, duration: 0.8 }} 
                className="absolute inset-0 flex items-center justify-center text-base font-medium text-zinc-100 tabular-nums"
              >
                {animatedScore}
              </motion.div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Health</p>
              <p className="text-lg font-medium text-zinc-100">{score}<span className="text-zinc-500 text-sm">/100</span></p>
            </div>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } }}>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-1">Confidence</p>
            <p className="text-lg font-medium text-blue-400">{decision.confidence_score}%</p>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } }}>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-1">Launch Window</p>
            <p className="text-sm text-zinc-300 leading-snug">{decision.recommended_launch_window || '—'}</p>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } }}>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-1">Expected ROI</p>
            <p className="text-sm text-zinc-300 leading-snug">{decision.expected_roi_summary || '—'}</p>
          </motion.div>
        </motion.div>

        {/* Executive summary paragraph */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="text-zinc-300 text-[15px] leading-relaxed mb-6 font-light"
        >
          {decision.executive_summary}
        </motion.p>

        {expanded && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="grid sm:grid-cols-2 gap-6 mt-8 pt-8 border-t border-zinc-800/50"
          >
            <div>
              <p className="text-emerald-400 text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                <Target size={14} /> Top Opportunities
              </p>
              <ul className="flex flex-col gap-2">
                {decision.top_opportunities.map((o, i) => (
                  <li key={i} className="text-sm text-zinc-400 flex gap-2.5 font-light"><span className="text-emerald-500/50 flex-shrink-0">+</span>{o}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-red-400 text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle size={14} /> Biggest Risks
              </p>
              <ul className="flex flex-col gap-2">
                {decision.biggest_risks.map((r, i) => (
                  <li key={i} className="text-sm text-zinc-400 flex gap-2.5 font-light"><span className="text-red-500/50 flex-shrink-0">−</span>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-blue-400 text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 mt-4 sm:mt-0">
                <Compass size={14} /> Market Outlook
              </p>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">{decision.market_outlook}</p>
            </div>
            <div>
              <p className="text-zinc-300 text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 mt-4 sm:mt-0">
                <BarChart3 size={14} className="text-zinc-500" /> Financial Outlook
              </p>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">{decision.financial_outlook}</p>
            </div>
          </motion.div>
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
      <div className="surface-card rounded-2xl p-6 border-l-[3px] border-l-blue-500/50">
        <h3 className="font-semibold mb-2 text-blue-400 flex items-center gap-2">
          <Sparkles size={15} /> Why This Recommendation
        </h3>
        <p className="text-zinc-300 text-sm leading-relaxed font-light">{decision.reasoning}</p>
      </div>

      {/* Confidence explanation */}
      <div className="surface-card rounded-2xl p-6">
        <h3 className="font-semibold mb-1 text-zinc-100">Confidence Explanation</h3>
        <p className="text-zinc-500 text-xs mb-4 font-light">Why the model is {decision.confidence_score}% confident in this verdict.</p>
        <div className="flex flex-col gap-2.5">
          {decision.confidence_factors.map((f, i) => (
            <div key={i} className="flex gap-3 items-start text-sm">
              <CheckCircle2 size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-zinc-300 leading-relaxed font-light">{f}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Risk vs Opportunity matrix */}
      <div className="surface-card rounded-2xl p-6">
        <h3 className="font-semibold mb-4 text-zinc-100">Risk vs Opportunity Matrix</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl p-4 bg-emerald-500/5 border border-emerald-500/10">
            <p className="text-emerald-400 text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Target size={12} /> Opportunities
            </p>
            <ul className="flex flex-col gap-2">
              {decision.top_opportunities.map((o, i) => (
                <li key={i} className="text-sm text-zinc-300 flex gap-2 font-light"><span className="text-emerald-500/50 flex-shrink-0">+</span>{o}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl p-4 bg-red-500/5 border border-red-500/10">
            <p className="text-red-400 text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertTriangle size={12} /> Risks
            </p>
            <ul className="flex flex-col gap-2">
              {decision.biggest_risks.map((r, i) => (
                <li key={i} className="text-sm text-zinc-300 flex gap-2 font-light"><span className="text-red-500/50 flex-shrink-0">−</span>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Strengths / Weaknesses */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="surface-card rounded-2xl p-6">
          <h3 className="font-semibold mb-3 text-zinc-100 flex items-center gap-2">
            <Star size={14} className="text-emerald-400" /> Key Strengths
          </h3>
          <ul className="flex flex-col gap-2">
            {decision.key_strengths.map((s, i) => (
              <li key={i} className="text-sm text-zinc-300 flex gap-2 font-light"><span className="text-emerald-500/50 flex-shrink-0">•</span>{s}</li>
            ))}
          </ul>
        </div>
        <div className="surface-card rounded-2xl p-6">
          <h3 className="font-semibold mb-3 text-zinc-100 flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400" /> Key Weaknesses
          </h3>
          <ul className="flex flex-col gap-2">
            {decision.key_weaknesses.map((w, i) => (
              <li key={i} className="text-sm text-zinc-300 flex gap-2 font-light"><span className="text-red-500/50 flex-shrink-0">•</span>{w}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Hidden opportunities + critical risks */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="surface-card rounded-2xl p-6 border-l-[3px] border-l-blue-500/30">
          <h3 className="font-semibold mb-3 text-blue-400 flex items-center gap-2">
            <Lightbulb size={14} /> Hidden Opportunities
          </h3>
          <ul className="flex flex-col gap-2">
            {decision.hidden_opportunities.map((h, i) => (
              <li key={i} className="text-sm text-zinc-300 flex gap-2 font-light"><span className="text-blue-500/50 flex-shrink-0">✦</span>{h}</li>
            ))}
          </ul>
        </div>
        <div className="surface-card rounded-2xl p-6 border border-red-900/30">
          <h3 className="font-semibold mb-3 text-red-400 flex items-center gap-2">
            <AlertTriangle size={14} /> Critical Risks
          </h3>
          <ul className="flex flex-col gap-2">
            {decision.critical_risks.map((c, i) => (
              <li key={i} className="text-sm text-zinc-300 flex gap-2 font-light"><span className="text-red-500/50 flex-shrink-0">!</span>{c}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Patterns & anomalies */}
      {decision.patterns.length > 0 && (
        <div className="surface-card rounded-2xl p-6">
          <h3 className="font-semibold mb-4 text-zinc-100 flex items-center gap-2">
            <Compass size={15} className="text-blue-400" /> Patterns & Anomalies Detected
          </h3>
          <div className="flex flex-col gap-3">
            {decision.patterns.map((p, i) => (
              <div key={i} className="flex gap-3 items-start p-4 rounded-xl bg-zinc-900/50 text-sm">
                <Sparkles size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-zinc-300 leading-relaxed font-light">{p}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next milestone */}
      <div className="surface-card rounded-2xl p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
          <Flag size={16} className="text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-100 mb-1">Suggested Next Milestone</h3>
          <p className="text-zinc-400 text-sm leading-relaxed font-light">{decision.suggested_next_milestone}</p>
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
      <div className="surface-card rounded-2xl p-7 flex flex-col sm:flex-row items-center gap-7">
        <div className="relative flex-shrink-0 flex items-center justify-center"
          style={{ width: 120, height: 120 }}>
          <ScoreRing score={score} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-medium text-zinc-100 tabular-nums">{animatedScore}</span>
            <span className="text-xs text-zinc-500">/ 100</span>
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center gap-3 justify-center sm:justify-start mb-2">
            <VerdictIcon verdict={decision.go_no_go} />
            <Badge text={decision.go_no_go} />
          </div>
          <h2 className="text-2xl font-medium tracking-tight mb-1 text-zinc-100">Business Health Score</h2>
          <p className="text-zinc-500 text-sm font-light">
            Confidence: <span className="text-zinc-300 font-medium">{decision.confidence_score}%</span>
            <span className="mx-2 text-zinc-800">|</span> Risk: <Badge text={risk.risk_level} />
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
          <div key={m.label} className="surface-card rounded-xl p-5 text-center transition-all hover:bg-zinc-900/50 hover:border-zinc-700">
            <p className="text-zinc-500 text-xs mb-2 font-mono uppercase tracking-widest">{m.label}</p>
            <p className="text-2xl font-medium text-zinc-100">{m.value}</p>
            <p className="text-[11px] text-zinc-600 mt-1 uppercase tracking-wider">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Decision score breakdown — shows how the health score was formed */}
      <ScoreBreakdownCard breakdown={decision.score_breakdown} />

      {/* Top 3 recommendations */}
      <div className="surface-card rounded-2xl p-6">
        <h3 className="font-medium tracking-tight mb-4 text-zinc-100">Top Recommendations</h3>
        <div className="flex flex-col gap-3">
          {decision.top_3_recommendations.map((rec, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span className="text-blue-400 font-mono text-sm flex-shrink-0 w-5">{i + 1}.</span>
              <p className="text-zinc-300 leading-relaxed font-light">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Business profile */}
      <div className="surface-card rounded-2xl p-6">
        <h3 className="font-medium tracking-tight mb-5 text-zinc-100">Business Profile</h3>
        <div className="grid sm:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-zinc-500 text-[11px] font-mono uppercase tracking-widest mb-3">Products / Services</p>
            <ul className="flex flex-col gap-2">
              {business_profile.products.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-zinc-300 font-light">
                  <span className="text-zinc-600 mt-0.5">›</span>{p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-zinc-500 text-[11px] font-mono uppercase tracking-widest mb-3">Target Customers</p>
            <ul className="flex flex-col gap-2">
              {business_profile.target_customers.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-zinc-300 font-light">
                  <span className="text-zinc-600 mt-0.5">›</span>{c}
                </li>
              ))}
            </ul>
          </div>
          <div className="sm:col-span-2 mt-2 pt-6 border-t border-zinc-800/50">
            <p className="text-zinc-500 text-[11px] font-mono uppercase tracking-widest mb-3">Unique Value Proposition</p>
            <p className="text-zinc-300 leading-relaxed font-light">{business_profile.unique_value}</p>
          </div>
        </div>
      </div>

      {/* Next steps timeline */}
      <div className="surface-card rounded-2xl p-6">
        <h3 className="font-medium tracking-tight mb-5 text-zinc-100">Action Roadmap</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(decision.next_steps).map(([phase, actions], i) => (
            <div key={phase} className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5">
              <p className="text-zinc-600 text-[10px] font-mono mb-2 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-blue-500/50" /> Phase {i + 1}
              </p>
              <p className="text-zinc-300 text-sm font-medium mb-4">
                {ROADMAP_PHASE_LABELS[phase] || phase.replace('_', ' ')}
              </p>
              <ul className="flex flex-col gap-2.5">
                {actions.map((a, i) => (
                  <li key={i} className="text-xs text-zinc-400 font-light leading-relaxed flex gap-2">
                    <span className="text-zinc-700 flex-shrink-0">•</span>{a}
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
        <div className="surface-card rounded-xl p-6 text-center transition-all hover:bg-zinc-900/50 hover:border-zinc-700">
          <p className="text-zinc-500 text-[11px] font-mono tracking-widest uppercase mb-3">Demand Score</p>
          <p className="text-4xl font-medium text-zinc-100 tabular-nums">{m.demand_score}</p>
          <p className="text-zinc-600 text-[10px] font-mono mt-2 uppercase">out of 100</p>
        </div>
        <div className="surface-card rounded-xl p-6 text-center transition-all hover:bg-zinc-900/50 hover:border-zinc-700">
          <p className="text-zinc-500 text-[11px] font-mono tracking-widest uppercase mb-3">Market Trend</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <TrendIcon trend={m.trend} />
            <Badge text={m.trend} />
          </div>
        </div>
        <div className="surface-card rounded-xl p-6 text-center transition-all hover:bg-zinc-900/50 hover:border-zinc-700">
          <p className="text-zinc-500 text-[11px] font-mono tracking-widest uppercase mb-3">Market Size</p>
          <p className="text-lg font-medium text-zinc-300 mt-2 leading-snug">{m.market_size_estimate}</p>
        </div>
      </div>

      <div className="surface-card rounded-2xl p-6">
        <h3 className="font-medium tracking-tight mb-5 text-zinc-100">Top 3 Market Trends</h3>
        <div className="flex flex-col gap-4">
          {m.top_3_trends.map((t, i) => (
            <div key={i} className="flex gap-4 items-start pb-4 border-b border-zinc-800/30 last:border-0 last:pb-0">
              <span className="text-zinc-600 font-mono text-sm mt-0.5">{i+1}.</span>
              <p className="text-zinc-300 text-sm leading-relaxed font-light">{t}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="surface-card rounded-2xl p-6">
        <h3 className="font-medium tracking-tight mb-3 text-zinc-100">Seasonality</h3>
        <p className="text-zinc-400 text-sm leading-relaxed font-light">{m.seasonality}</p>
      </div>

      {m.detailed_analysis && (
        <div className="surface-card rounded-2xl p-6 border-l-[3px] border-l-blue-500/50">
          <h3 className="font-semibold mb-3 text-blue-400 text-sm uppercase tracking-wider">Analyst Note</h3>
          <p className="text-zinc-300 text-sm leading-relaxed font-light">{m.detailed_analysis}</p>
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
          <div key={c.name} className="surface-card rounded-2xl p-6 transition-all hover:bg-zinc-900/50 hover:border-zinc-700">
            <div className="flex items-start justify-between gap-4 mb-4 border-b border-zinc-800/50 pb-4">
              <div>
                <h3 className="font-medium tracking-tight text-zinc-100">{c.name}</h3>
                <p className="text-zinc-500 text-sm font-mono mt-1 tracking-wide">{c.price_range}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Star size={13} className="text-zinc-400 fill-zinc-400" />
                <span className="text-zinc-300 font-bold text-sm">{c.rating}</span>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-emerald-400 text-[11px] font-semibold uppercase tracking-wider mb-2">Strengths</p>
                <ul className="flex flex-col gap-2">
                  {c.strengths.map((s, i) => <li key={i} className="text-zinc-400 font-light flex gap-2.5"><span className="text-emerald-500/50">+</span>{s}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-red-400 text-[11px] font-semibold uppercase tracking-wider mb-2">Weaknesses</p>
                <ul className="flex flex-col gap-2">
                  {c.weaknesses.map((w, i) => <li key={i} className="text-zinc-400 font-light flex gap-2.5"><span className="text-red-500/50">−</span>{w}</li>)}
                </ul>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-zinc-800/50 flex justify-between text-xs text-zinc-500 uppercase tracking-widest font-mono">
              <span>Est. monthly revenue</span>
              <span className="text-zinc-300 font-medium tracking-normal">{c.estimated_monthly_revenue}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="surface-card rounded-2xl p-6">
        <h3 className="font-medium tracking-tight mb-5 text-zinc-100">SWOT Analysis</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          {[
            { key: 'strengths',     label: 'Strengths',     color: 'emerald' },
            { key: 'weaknesses',    label: 'Weaknesses',    color: 'red' },
            { key: 'opportunities', label: 'Opportunities', color: 'blue' },
            { key: 'threats',       label: 'Threats',       color: 'zinc' },
          ].map(({ key, label, color }) => {
            const colorMap = { emerald: 'text-emerald-400 border-l-[3px] border-l-emerald-500/50 bg-emerald-500/5', red: 'text-red-400 border-l-[3px] border-l-red-500/50 bg-red-500/5', blue: 'text-blue-400 border-l-[3px] border-l-blue-500/50 bg-blue-500/5', zinc: 'text-zinc-400 border-l-[3px] border-l-zinc-500/50 bg-zinc-500/5' }
            return (
              <div key={key} className={`rounded-xl p-5 ${colorMap[color].split(' ').slice(1).join(' ')}`}>
                <p className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${colorMap[color].split(' ')[0]}`}>{label}</p>
                <ul className="flex flex-col gap-2">
                  {(competitors.swot[key] || []).map((item, i) => (
                    <li key={i} className="text-zinc-400 text-xs leading-relaxed font-light flex gap-2"><span className="text-zinc-700 mt-0.5">•</span> {item}</li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      <div className="surface-card rounded-2xl p-6 border-l-[3px] border-l-blue-500/50">
        <h3 className="font-semibold mb-3 text-blue-400 text-sm uppercase tracking-wider">Gap Opportunity</h3>
        <p className="text-zinc-300 text-sm leading-relaxed font-light">{competitors.gap_opportunity}</p>
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
          <div key={m.label} className="surface-card rounded-xl p-5 text-center transition-all hover:bg-zinc-900/50 hover:border-zinc-700">
            <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-2">{m.label}</p>
            <p className="text-xl font-medium tracking-tight text-zinc-100">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="surface-card rounded-2xl p-6">
        <h3 className="font-medium tracking-tight mb-5 text-zinc-100">12-Month Revenue vs Cost</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#e4e4e7" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#e4e4e7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#52525b" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#52525b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: 'Month', position: 'insideBottom', offset: -2, fill: '#52525b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="Revenue" stroke="#e4e4e7" strokeWidth={2} fill="url(#revGrad)" />
            <Area type="monotone" dataKey="Cost"    stroke="#52525b" strokeWidth={2} fill="url(#costGrad)" />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="surface-card rounded-2xl p-6">
        <h3 className="font-medium tracking-tight mb-5 text-zinc-100">Monthly Profit / Loss</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
            <Bar dataKey="Profit" radius={[4, 4, 0, 0]}>
              {chartData.map((row) => (
                <Cell key={row.month} fill={row.Profit >= 0 ? '#3B82F6' : '#52525b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="surface-card rounded-2xl p-6">
        <h3 className="font-medium tracking-tight mb-4 text-zinc-100">Monthly Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800">
                <th className="text-left pb-3 font-medium">Month</th>
                <th className="text-right pb-3 font-medium">Revenue</th>
                <th className="text-right pb-3 font-medium">Cost</th>
                <th className="text-right pb-3 font-medium">Profit</th>
              </tr>
            </thead>
            <tbody>
              {f.profit_forecast.map((row) => (
                <tr key={row.month} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors font-light">
                  <td className="py-3 text-zinc-400">Month {row.month}</td>
                  <td className="py-3 text-right text-zinc-300">₹{row.revenue.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-right text-zinc-300">₹{row.cost.toLocaleString('en-IN')}</td>
                  <td className={`py-3 text-right font-medium ${row.profit >= 0 ? 'text-blue-400' : 'text-zinc-400'}`}>
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

  return (
    <div className="flex flex-col gap-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="surface-card rounded-xl p-6 text-center transition-all hover:bg-zinc-900/50 hover:border-zinc-700">
            <p className="text-zinc-500 text-[10px] font-mono tracking-widest uppercase mb-3">{m.label}</p>
            <p className="text-3xl font-medium tracking-tight text-zinc-100 tabular-nums">{m.value}</p>
            <p className="text-zinc-600 text-[10px] font-mono mt-1 uppercase">/ 100</p>
          </div>
        ))}
      </div>

      <div className="surface-card rounded-2xl p-6">
        <h3 className="font-medium tracking-tight mb-5 text-zinc-100">Location Score Breakdown</h3>
        <div className="flex flex-col gap-5">
          {metrics.map((m) => (
            <StatBar key={m.label} label={m.label} value={m.value} color={m.color} />
          ))}
        </div>
      </div>

      <LocationMap latitude={loc.latitude} longitude={loc.longitude} businessName={report.business_profile?.business_type} location={report.request?.location} />
    </div>
  )
}

// ── Location Map with graceful fallback ─────────────────────────────────────
// Uses the Maps JavaScript API (a real interactive map + marker) rather than
// the Embed API iframe — consistent with the picker used during analysis,
// and lets us apply the same dark map styling. If the SDK fails to load
// (network issue, key/API problem), we show a permanent fallback underneath:
// coordinates + "Open in Google Maps" link, which needs no API key at all,
// so the section is never blank regardless of Google Maps' own state.
function LocationMap({ latitude, longitude, businessName, location }) {
  const mapDivRef = useRef(null)
  const [sdkState, setSdkState] = useState('loading') // loading | ready | error | no-key
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const query = `${latitude},${longitude}`
  const openInMapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`

  useEffect(() => {
    let cancelled = false
    setSdkState('loading')

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapDivRef.current) return

        const center = { lat: latitude, lng: longitude }
        const map = new window.google.maps.Map(mapDivRef.current, {
          center,
          zoom: 15,
          styles: DARK_MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'cooperative',
        })

        new window.google.maps.Marker({
          position: center,
          map,
          animation: window.google.maps.Animation.DROP,
        })

        setSdkState('ready')
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Google Maps failed to load:', err)
        setLoadError(err?.message || 'Failed to load Google Maps.')
        setSdkState('error')
      })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, reloadKey])

  return (
    <div className="surface-card rounded-2xl overflow-hidden border border-zinc-800/80 shadow-2xl">
      <div className="px-6 py-4 border-b border-zinc-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/40 backdrop-blur-md">
        <div>
          <h3 className="font-medium tracking-tight text-zinc-100 flex items-center gap-2">
            <MapPin size={16} className="text-blue-400" /> Location Map
          </h3>
          <p className="text-zinc-500 text-[11px] mt-1.5 font-mono uppercase tracking-widest">
            {businessName ? `${businessName} · ` : ''}{location ? `${location} · ` : ''}
            <span className="font-mono">{latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {sdkState !== 'no-key' && (
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 text-xs transition-colors"
            >
              <RefreshCw size={13} /> Retry
            </button>
          )}
          <a
            href={openInMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs transition-colors"
          >
            <ExternalLink size={13} /> Open in Google Maps
          </a>
        </div>
      </div>



      {sdkState === 'error' && (
        <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center bg-red-950/30">
          <AlertTriangle size={28} className="text-red-500/50" />
          <p className="text-zinc-300 text-sm font-medium">Couldn't load the map</p>
          <p className="text-zinc-500 text-xs max-w-sm">{loadError}</p>
        </div>
      )}

      {(sdkState === 'ready' || sdkState === 'loading') && (
        <div className="relative">
          {/* Google Maps takes ownership of this div's DOM once initialized —
              it must never have React-rendered children, or React's
              reconciliation conflicts with Maps' own DOM mutations on
              unmount/update (NotFoundError: removeChild). The loading
              spinner is a sibling overlay instead. */}
          <div ref={mapDivRef} className="w-full h-[340px] bg-zinc-950" />
          {sdkState === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 pointer-events-none">
              <Loader2 size={22} className="text-zinc-600 animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tab: Personas ────────────────────────────────────────────────────────────
function PersonasTab({ report }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {report.personas.map((p) => (
        <div key={p.name} className="surface-card rounded-2xl p-6 flex flex-col gap-5 transition-all hover:bg-zinc-900/50 hover:border-zinc-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center text-zinc-300 font-medium text-sm flex-shrink-0">
              {p.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h3 className="font-medium tracking-tight text-zinc-100">{p.name}</h3>
              <p className="text-xs text-zinc-500 mt-0.5 font-light">{p.demographics.occupation}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {Object.entries(p.demographics).map(([k, v]) => (
              <div key={k} className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
                <p className="text-zinc-600 font-mono tracking-wider uppercase mb-1">{k}</p>
                <p className="text-zinc-300 font-medium truncate">{v}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider mb-2">Needs</p>
            <ul className="flex flex-col gap-2">
              {p.needs.map((n, i) => <li key={i} className="text-xs text-zinc-400 font-light flex gap-2"><span className="text-emerald-500/50">•</span>{n}</li>)}
            </ul>
          </div>

          <div>
            <p className="text-[11px] text-red-400 font-semibold uppercase tracking-wider mb-2">Pain Points</p>
            <ul className="flex flex-col gap-2">
              {p.pain_points.map((pt, i) => <li key={i} className="text-xs text-zinc-400 font-light flex gap-2"><span className="text-red-500/50">•</span>{pt}</li>)}
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
      <div className="surface-card rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-8">
        <div className="relative flex-shrink-0" style={{ width: 100, height: 100 }}>
          <ScoreRing score={risk.risk_score} size={100} strokeWidth={9} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-medium text-zinc-100 tabular-nums">{animatedRisk}</span>
            <span className="text-xs text-zinc-500 mt-1">/ 100</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle size={18} className={risk.risk_level === 'High' ? 'text-red-400' : risk.risk_level === 'Medium' ? 'text-blue-400' : 'text-emerald-400'} />
            <span className="font-medium tracking-tight text-xl text-zinc-100">{risk.risk_level} Risk</span>
            <Badge text={risk.risk_level} />
          </div>
          <p className="text-zinc-500 text-sm font-light">Risk score based on budget adequacy and competition density.</p>
        </div>
      </div>

      <div className="surface-card rounded-2xl p-6">
        <h3 className="font-medium tracking-tight mb-5 text-zinc-100">Mitigation Strategies</h3>
        <div className="flex flex-col gap-3">
          {risk.mitigations.map((m, i) => (
            <div key={i} className="flex gap-4 items-start p-4 rounded-xl bg-zinc-900/50 text-sm border border-zinc-800/30">
              <Shield size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-zinc-300 leading-relaxed font-light">{m}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="surface-card rounded-2xl p-6">
        <h3 className="font-medium tracking-tight mb-5 flex items-center gap-2 text-zinc-100">
          <Truck size={16} className="text-blue-400" /> Supply Chain
        </h3>
        <div className="flex flex-col gap-3">
          {supply_chain.map((item) => (
            <div key={item.category} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-zinc-900/50 rounded-xl text-sm border border-zinc-800/30">
              <div className="flex-1">
                <p className="font-medium text-zinc-200">{item.category}</p>
                <p className="text-zinc-500 text-xs mt-1 font-light">{item.suppliers.join(' · ')}</p>
              </div>
              <Badge text={item.risk_level} />
            </div>
          ))}
        </div>
      </div>

      <div className="surface-card rounded-2xl p-6">
        <h3 className="font-medium tracking-tight mb-5 flex items-center gap-2 text-zinc-100">
          <Megaphone size={16} className="text-blue-400" /> Marketing Campaigns
        </h3>
        <div className="flex flex-col gap-3">
          {marketing.map((c) => (
            <div key={c.channel} className="p-5 bg-zinc-900/50 rounded-xl text-sm border border-zinc-800/30">
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="font-medium text-zinc-200">{c.channel}</p>
                <Badge text={c.difficulty} />
              </div>
              <p className="text-zinc-400 text-sm font-light leading-relaxed">{c.strategy}</p>
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
      <div className="surface-card rounded-2xl p-10 text-center border-t border-t-zinc-700/50">
        <div className="w-16 h-16 mx-auto bg-zinc-900 border border-zinc-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
          <Download size={24} className="text-zinc-300" />
        </div>
        <h2 className="text-2xl font-medium tracking-tight mb-3 text-zinc-100">Full Intelligence Report</h2>
        <p className="text-zinc-400 text-sm mb-8 max-w-md mx-auto font-light leading-relaxed">
          Download the complete JSON report with all 10 agent outputs, financial forecasts,
          and the Go/No-Go decision — ready to share with co-founders or investors.
        </p>
        <button onClick={handleDownload}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-zinc-100 text-black font-semibold text-[15px] hover:bg-white hover:scale-[1.02] active:scale-100 transition-all">
          <Download size={18} /> Download Report JSON
        </button>
      </div>

      <div className="surface-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-medium tracking-tight text-zinc-100">Report Summary</h3>
          <span className="text-xs text-zinc-500 font-mono tracking-widest uppercase">ID: {report.session_id.slice(0, 8)}</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
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
            <div key={k} className="flex justify-between gap-4 py-3 border-b border-zinc-800/50">
              <span className="text-zinc-500 font-light">{k}</span>
              <span className="text-zinc-200 font-medium text-right">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const SectionHeader = ({ title, subtitle, icon: Icon }) => (
  <div className="mb-20 relative">
    {/* DeepMind-style Transition Divider */}
    <div className="absolute -top-32 left-0 right-0 flex items-center justify-center opacity-80 pointer-events-none">
      <div className="w-[1px] h-32 bg-gradient-to-b from-transparent via-blue-500/30 to-blue-400/80" />
      <motion.div 
        animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0.8, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 w-2 h-2 rounded-full bg-blue-400 blur-[2px]" 
      />
      <div className="absolute bottom-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      
      {/* Floating Constellation Nodes */}
      <motion.div animate={{ opacity: [0, 1, 0], y: [15, -15] }} transition={{ duration: 4, repeat: Infinity, delay: 0.5 }} className="absolute bottom-4 left-[40%] w-1 h-1 rounded-full bg-cyan-300 blur-[1px]" />
      <motion.div animate={{ opacity: [0, 1, 0], y: [20, -20] }} transition={{ duration: 5, repeat: Infinity, delay: 1.5 }} className="absolute bottom-2 right-[35%] w-1.5 h-1.5 rounded-full bg-blue-400 blur-[1px]" />
      <motion.div animate={{ opacity: [0, 1, 0], x: [-10, 10] }} transition={{ duration: 6, repeat: Infinity, delay: 2.5 }} className="absolute bottom-8 left-[55%] w-1 h-1 rounded-full bg-zinc-300 blur-[0.5px]" />
    </div>

    <div className="flex items-center gap-4 mb-8 relative pt-6">
      <div className="w-14 h-14 rounded-2xl bg-zinc-900/90 border border-zinc-700/50 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.15)] relative z-10 backdrop-blur-xl">
        <Icon size={24} className="text-blue-400" />
      </div>
    </div>
    
    <motion.h2 
      initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="text-4xl font-medium tracking-tight text-zinc-100 mb-5"
    >
      {title}
    </motion.h2>
    
    <motion.p 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="text-zinc-400 font-light leading-relaxed max-w-3xl text-[19px]"
    >
      {subtitle}
    </motion.p>
  </div>
)

// ── Main ResultsPage ─────────────────────────────────────────────────────────
export default function ResultsPage() {
  const navigate = useNavigate()
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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 font-sans">
        <div className="border border-zinc-800 bg-zinc-900/50 rounded-2xl p-10 text-center max-w-md">
          <AlertCircle size={40} className="text-zinc-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2 text-zinc-100">No Report Available</h2>
          <p className="text-zinc-500 text-sm mb-6">{error}</p>
          <button onClick={() => navigate('/analyze')}
            className="px-6 py-3 rounded-full bg-zinc-100 text-black font-semibold text-sm hover:scale-[1.02] transition-transform">
            Run Analysis
          </button>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-zinc-500 text-sm animate-pulse">
          <Loader2 size={16} className="animate-spin" /> Loading intelligence...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-zinc-100 font-sans relative">
      <div className="fixed top-0 left-0 w-full h-full bg-glow pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none z-0" />


      {/* ── Internal Floating Navigation ── */}
      <nav className="hidden xl:flex fixed left-10 top-1/2 -translate-y-1/2 z-40 flex-col gap-1">
        <div className="text-[10px] font-mono tracking-widest uppercase text-zinc-600 mb-3 px-3">Report Index</div>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'ai-insights', label: 'AI Insights' },
          { id: 'market', label: 'Market' },
          { id: 'competitors', label: 'Competitors' },
          { id: 'finance', label: 'Finance' },
          { id: 'location', label: 'Location' },
          { id: 'personas', label: 'Personas' },
          { id: 'risk', label: 'Risk' },
        ].map((sec) => (
          <a key={sec.id} href={`#${sec.id}`}
             className="text-[11px] font-medium tracking-wider uppercase text-zinc-500 hover:text-zinc-100 transition-colors py-2 px-3 rounded-lg hover:bg-zinc-800/40">
            {sec.label}
          </a>
        ))}
      </nav>

      {/* ── Unified Analytical Canvas ── */}
      <main className="relative z-10 max-w-4xl mx-auto px-8 py-32 flex flex-col gap-16">
        
        {/* Document Header & Executive Brief (Unified Hero) */}
        <header className="tour-step-analysis flex flex-col gap-10">
          <motion.div 
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start gap-6 pt-4"
          >
            <motion.div 
              initial={{ scale: 0, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 2.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="relative mt-1"
            >
              <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-150 animate-pulse" />
              <VerdictIcon verdict={report.decision.go_no_go} />
            </motion.div>
            <div className="flex flex-col">
              <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-zinc-100 leading-tight">
                {report.request.business_type} <span className="text-zinc-600 font-light">in</span> {report.request.location}
              </h1>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="flex items-center flex-wrap gap-4 text-[13px] mt-4 font-mono uppercase tracking-widest text-zinc-500"
              >
                <span className="text-zinc-300">Verdict: {report.decision.go_no_go}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span>Health: {report.decision.business_health_score}/100</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span className={report.risk.risk_level === 'High' ? 'text-red-400' : report.risk.risk_level === 'Medium' ? 'text-blue-400' : 'text-emerald-400'}>
                  Risk: {report.risk.risk_level}
                </span>
              </motion.div>
            </div>
          </motion.div>

          <div className="tour-step-brief">
            <ExecutiveBrief report={report} />
          </div>
        </header>

        {/* ── Seamless Sections ── */}
        <div className="flex flex-col gap-40 mt-10">
          <motion.section id="overview" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <SectionHeader 
              title="Executive Overview" 
              subtitle="A high-level synthesis of the proposed business idea, integrating market viability, expected financial performance, and operational requirements." 
              icon={Target} 
            />
            <OverviewTab report={report} />
          </motion.section>

          <motion.section id="ai-insights" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <SectionHeader 
              title="Agentic Insights" 
              subtitle="Deep qualitative analysis extracted by our specialized AI agent network, focusing on hidden market gaps and unexploited competitive advantages." 
              icon={Brain} 
            />
            <AIInsightsTab report={report} />
          </motion.section>

          <motion.section id="market" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <SectionHeader 
              title="Market Analysis" 
              subtitle="Comprehensive evaluation of the Total Addressable Market (TAM), growth trajectories, and prevailing consumer demand signals in the selected location." 
              icon={BarChart3} 
            />
            <MarketTab report={report} />
          </motion.section>

          <motion.section id="competitors" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <SectionHeader 
              title="Competitive Landscape" 
              subtitle="Strategic mapping of existing market players, highlighting saturation points, vulnerability metrics, and areas for potential disruption." 
              icon={Shield} 
            />
            <CompetitorsTab report={report} />
          </motion.section>

          <motion.section id="finance" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <SectionHeader 
              title="Financial Projections" 
              subtitle="Data-driven 12-month revenue forecasting, break-even analysis, and operational cost breakdown based on local economic indicators." 
              icon={TrendingUp} 
            />
            <FinanceTab report={report} />
          </motion.section>

          <motion.section id="location" className="tour-step-maps" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <SectionHeader 
              title="Location Intelligence" 
              subtitle="Geospatial analysis of foot traffic, accessibility, and local zoning constraints mapped directly to the proposed business coordinates." 
              icon={MapPin} 
            />
            <LocationTab report={report} />
          </motion.section>

          <motion.section id="personas" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <SectionHeader 
              title="Target Personas" 
              subtitle="Synthesized psychographic profiles of the ideal customer base, identifying core needs, pain points, and effective marketing channels." 
              icon={Users} 
            />
            <PersonasTab report={report} />
          </motion.section>

          <motion.section id="risk" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <SectionHeader 
              title="Risk Assessment" 
              subtitle="Identification and mitigation strategies for critical business vulnerabilities across supply chain, regulatory, and market domains." 
              icon={AlertTriangle} 
            />
            <RiskTab report={report} />
          </motion.section>

          <motion.section id="report" className="tour-step-reports" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <SectionHeader 
              title="Export & Action Plan" 
              subtitle="Generate a sharable format of this executive brief for stakeholders, investors, or internal reference." 
              icon={Download} 
            />
            <ReportTab report={report} />
          </motion.section>
        </div>
      </main>

      <div className="tour-step-engine">
        <WhatIfSimulator
          report={report}
          onResult={(result) => {
            console.log('Simulation result:', result)
          }}
        />
      </div>
      <div className="tour-step-advisor">
        <ChatPanel sessionId={report.session_id} />
      </div>
    </div>
  )
}
