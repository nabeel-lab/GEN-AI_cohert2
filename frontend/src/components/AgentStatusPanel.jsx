import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, TrendingUp, Users, MapPin, BarChart3,
  UserCheck, Truck, Megaphone, Shield, CheckCircle2,
  Loader2, Clock, Activity, ArrowRight
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

const AGENT_DELAY_MS = 1800

export default function AgentStatusPanel({ isRunning, isDataReady, onProceed, onComplete }) {
  const [statuses, setStatuses] = useState(
    () => Object.fromEntries(AGENTS.map((a) => [a.id, 'idle']))
  )
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    if (!isRunning) return
    let cancelled = false
    const timers = []

    AGENTS.forEach((agent, i) => {
      timers.push(
        setTimeout(() => {
          if (cancelled) return
          setActiveId(agent.id)
          setStatuses((prev) => ({ ...prev, [agent.id]: 'running' }))
        }, i * AGENT_DELAY_MS)
      )

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

  useEffect(() => {
    if (!isRunning) {
      setStatuses(Object.fromEntries(AGENTS.map((a) => [a.id, 'idle'])))
      setActiveId(null)
    }
  }, [isRunning])

  const completedCount = Object.values(statuses).filter((s) => s === 'complete').length
  const progressPct    = Math.round((completedCount / AGENTS.length) * 100)

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col gap-6 h-full backdrop-blur-2xl relative overflow-hidden font-sans">
      
      {/* Background flare when active */}
      <AnimatePresence>
        {isRunning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.05, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none rounded-full"
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3">
          <Activity className="text-zinc-500 w-4 h-4" />
          <h3 className="font-medium text-zinc-300 text-sm tracking-widest uppercase">Agent Network</h3>
        </div>
        {isRunning && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-right"
          >
            <span className="text-zinc-100 font-mono text-sm">{progressPct}%</span>
          </motion.div>
        )}
      </div>

      <div className="h-[2px] rounded-full bg-zinc-800 overflow-hidden relative z-10">
        <motion.div
          className="h-full bg-zinc-300 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto pr-2 gap-2 z-10 relative">
        {AGENTS.map((agent, idx) => {
          const status = statuses[agent.id]
          const isActive = activeId === agent.id

          return (
            <motion.div 
              key={agent.id} 
              layout
              initial={{ opacity: 0.4, x: -10 }}
              animate={{ opacity: status === 'idle' ? 0.4 : 1, x: 0 }}
              className={[
                'group relative flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-500 overflow-hidden',
                status === 'complete' ? 'bg-zinc-800/20' :
                isActive             ? 'bg-zinc-800/50 shadow-lg shadow-black/20 border border-zinc-700/50' :
                                       'bg-transparent hover:bg-zinc-900/30 border border-transparent'
              ].join(' ')}
            >
              <div className="relative z-10 w-6 h-6 flex items-center justify-center flex-shrink-0">
                {status === 'complete' ? (
                  <CheckCircle2 size={16} className="text-zinc-400" />
                ) : isActive ? (
                  <Loader2 size={16} className="text-zinc-100 animate-spin" />
                ) : (
                  <Clock size={16} className="text-zinc-700" />
                )}
              </div>

              <div className="flex items-center gap-3 min-w-0 flex-1 z-10">
                <agent.icon
                  size={14}
                  className={[
                    'flex-shrink-0 transition-colors duration-500',
                    status === 'complete' ? 'text-zinc-500' :
                    isActive             ? 'text-zinc-100' :
                                           'text-zinc-700',
                  ].join(' ')}
                />
                <div className="min-w-0">
                  <p className={[
                    'text-sm font-medium truncate transition-colors duration-500',
                    status === 'complete' ? 'text-zinc-400' :
                    isActive             ? 'text-zinc-100' :
                                           'text-zinc-600',
                  ].join(' ')}>
                    {agent.label}
                  </p>
                  <AnimatePresence>
                    {isActive && (
                      <motion.p 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs text-zinc-400 truncate mt-0.5"
                      >
                        {agent.desc}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <span className="text-[10px] text-zinc-700 font-mono flex-shrink-0 z-10 uppercase tracking-widest">
                ID_{String(agent.id).padStart(2, '0')}
              </span>
            </motion.div>
          )
        })}
      </div>

      <AnimatePresence>
        {isRunning && completedCount === AGENTS.length && !isDataReady && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-5 py-4 rounded-xl bg-zinc-800 text-zinc-400 z-10 mt-2 cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <Loader2 size={16} className="text-zinc-400 animate-spin" />
              <p className="text-sm font-semibold tracking-wide">Finalizing report...</p>
            </div>
          </motion.div>
        )}
        
        {isDataReady && (
          <motion.button 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onProceed}
            className="flex items-center justify-between px-5 py-4 rounded-xl bg-zinc-100 text-black z-10 mt-2 hover:bg-white hover:scale-[1.02] active:scale-100 transition-all cursor-pointer w-full"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 size={16} className="text-black" />
              <p className="text-sm font-semibold tracking-wide">Analysis Complete - View Results</p>
            </div>
            <ArrowRight size={16} className="text-black/60" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
