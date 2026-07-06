import { useEffect, useState } from 'react'
import {
  Brain, TrendingUp, Users, MapPin, BarChart3,
  UserCheck, Truck, Megaphone, Shield, CheckCircle2,
  Loader2, Clock,
} from 'lucide-react'

const AGENTS = [
  { id: 1,  icon: Brain,       label: 'Business Intelligence',  desc: 'Extracting business profile' },
  { id: 2,  icon: TrendingUp,  label: 'Market Analysis',        desc: 'Scanning market trends' },
  { id: 3,  icon: Users,       label: 'Competitor Mapping',     desc: 'Profiling competitors' },
  { id: 4,  icon: MapPin,      label: 'Location Intelligence',  desc: 'Scoring location metrics' },
  { id: 5,  icon: BarChart3,   label: 'Financial Forecast',     desc: 'Projecting 12-month P&L' },
  { id: 6,  icon: UserCheck,   label: 'Customer Personas',      desc: 'Building buyer profiles' },
  { id: 7,  icon: Truck,       label: 'Supply Chain',           desc: 'Mapping supplier network' },
  { id: 8,  icon: Megaphone,   label: 'Marketing Strategy',     desc: 'Crafting launch campaigns' },
  { id: 9,  icon: Shield,      label: 'Risk Prediction',        desc: 'Evaluating risk factors' },
  { id: 10, icon: CheckCircle2,label: 'Go / No-Go Decision',    desc: 'Synthesizing final verdict' },
]

// Each agent gets a staggered delay (ms) to create a realistic sequential feel
const AGENT_DELAY_MS = 1800

/**
 * AgentStatusPanel
 * Props:
 *   isRunning  — boolean, starts the animation sequence
 *   onComplete — callback fired when all agents have turned green
 */
export default function AgentStatusPanel({ isRunning, onComplete }) {
  // 'idle' | 'running' | 'complete'
  const [statuses, setStatuses] = useState(
    () => Object.fromEntries(AGENTS.map((a) => [a.id, 'idle']))
  )
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    if (!isRunning) return

    let cancelled = false
    const timers = []

    AGENTS.forEach((agent, i) => {
      // Mark as 'running' at staggered interval
      timers.push(
        setTimeout(() => {
          if (cancelled) return
          setActiveId(agent.id)
          setStatuses((prev) => ({ ...prev, [agent.id]: 'running' }))
        }, i * AGENT_DELAY_MS)
      )

      // Mark as 'complete' one interval later
      timers.push(
        setTimeout(() => {
          if (cancelled) return
          setStatuses((prev) => ({ ...prev, [agent.id]: 'complete' }))
          if (agent.id === AGENTS.length) {
            setActiveId(null)
            onComplete?.()
          }
        }, i * AGENT_DELAY_MS + AGENT_DELAY_MS - 200)
      )
    })

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [isRunning, onComplete])

  // Reset when not running
  useEffect(() => {
    if (!isRunning) {
      setStatuses(Object.fromEntries(AGENTS.map((a) => [a.id, 'idle'])))
      setActiveId(null)
    }
  }, [isRunning])

  const completedCount = Object.values(statuses).filter((s) => s === 'complete').length
  const progressPct    = Math.round((completedCount / AGENTS.length) * 100)

  return (
    <div className="glass rounded-2xl p-6 flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-100 text-sm">Agent Pipeline</h3>
          <p className="text-slate-500 text-xs mt-0.5">
            {isRunning
              ? `${completedCount} of ${AGENTS.length} agents complete`
              : 'Waiting for analysis to start'}
          </p>
        </div>
        {isRunning && (
          <div className="text-right">
            <span className="text-gold-400 font-bold text-sm">{progressPct}%</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-navy-700 overflow-hidden">
        <div
          className="h-full bg-gold-gradient rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Agent list */}
      <div className="flex flex-col flex-1 overflow-y-auto pr-1">
        {AGENTS.map((agent, idx) => {
          const status = statuses[agent.id]
          const isActive = activeId === agent.id
          const isLast = idx === AGENTS.length - 1

          return (
            <div key={agent.id} className="relative flex gap-3">
              {/* Timeline connector */}
              {!isLast && (
                <div
                  className={[
                    'absolute left-[17px] top-8 w-px h-[calc(100%-8px)] transition-colors duration-500',
                    status === 'complete' ? 'bg-emerald-500/30' : 'bg-white/5',
                  ].join(' ')}
                />
              )}

              <div
                className={[
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 flex-1 min-w-0 mb-1',
                  status === 'complete' ? 'bg-emerald-500/8 border border-emerald-500/15' :
                  isActive             ? 'bg-gold-500/8 border border-gold-500/20 animate-pulse-gold shadow-lg shadow-gold-500/5' :
                                         'border border-transparent opacity-50',
                ].join(' ')}
              >
                {/* Status icon */}
                <div className={[
                  'relative w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300',
                  status === 'complete' ? 'bg-emerald-500/15' :
                  isActive             ? 'bg-gold-500/15' :
                                         'bg-navy-700',
                ].join(' ')}>
                  {status === 'complete' ? (
                    <CheckCircle2 size={14} className="text-emerald-400 animate-fade-in" />
                  ) : isActive ? (
                    <>
                      <Loader2 size={14} className="text-gold-400 animate-spin" />
                      <span className="absolute inset-0 rounded-lg bg-gold-500/20 animate-ping" />
                    </>
                  ) : (
                    <Clock size={14} className="text-slate-600" />
                  )}
                </div>

                {/* Agent icon + label */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <agent.icon
                    size={13}
                    className={[
                      'flex-shrink-0 transition-colors duration-300',
                      status === 'complete' ? 'text-emerald-400' :
                      isActive             ? 'text-gold-400' :
                                             'text-slate-600',
                    ].join(' ')}
                  />
                  <div className="min-w-0">
                    <p className={[
                      'text-xs font-medium truncate transition-colors duration-300',
                      status === 'complete' ? 'text-emerald-300' :
                      isActive             ? 'text-gold-400' :
                                             'text-slate-500',
                    ].join(' ')}>
                      {agent.label}
                    </p>
                    {isActive && (
                      <p className="text-xs text-slate-500 truncate">{agent.desc}</p>
                    )}
                  </div>
                </div>

                {/* Agent number badge */}
                <span className="text-xs text-slate-700 font-mono flex-shrink-0">
                  {String(agent.id).padStart(2, '0')}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Completion banner */}
      {isRunning && completedCount === AGENTS.length && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-fade-in-up">
          <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
          <p className="text-xs text-emerald-300 font-medium">All agents complete — assembling your report…</p>
        </div>
      )}
    </div>
  )
}
