import { useState } from 'react'
import { Sliders, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function WhatIfSimulator({ report, onResult }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [budget, setBudget] = useState(report.request.budget)
  const [marketingMultiplier, setMarketingMultiplier] = useState(1.0)
  const [competitionDensity, setCompetitionDensity] = useState(report.location.competition_density)
  const [rentOverride, setRentOverride] = useState(null)

  async function runSimulation() {
    setLoading(true)
    try {
      const token = localStorage.getItem('lw_token')
      const res = await fetch(`/api/simulate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: report.session_id,
          budget,
          competition_density: competitionDensity,
          rent_override: rentOverride,
          marketing_multiplier: marketingMultiplier,
        }),
      })
      const result = await res.json()
      onResult(result)
    } catch (e) {
      console.error('Simulation failed:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[24rem] max-w-[calc(100vw-3rem)] font-sans">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-3 px-5 py-3.5 rounded-full border border-zinc-800 bg-zinc-900/80 backdrop-blur-md text-zinc-300 font-medium text-sm transition-all hover:bg-zinc-800 hover:text-white shadow-xl shadow-black/50 ml-auto"
          >
            <Sliders size={16} className="text-zinc-500" />
            Simulation Engine
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="border border-zinc-800 bg-zinc-900/60 backdrop-blur-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/50 bg-zinc-900/40">
              <div className="flex items-center gap-3">
                <Sliders size={16} className="text-zinc-500" />
                <h3 className="font-semibold text-zinc-100 tracking-tight">Simulation Engine</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-8 max-h-[30rem] overflow-y-auto">
              
              {/* Budget slider */}
              <div className="space-y-3">
                <label className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-zinc-500">
                  <span>Capital Allocation</span>
                  <span className="text-zinc-200">₹{(budget / 100000).toFixed(1)}L</span>
                </label>
                <input
                  type="range" min={500000} max={5000000} step={100000}
                  value={budget} onChange={(e) => setBudget(parseFloat(e.target.value))}
                  className="w-full accent-zinc-400"
                />
              </div>

              {/* Competition density */}
              <div className="space-y-3">
                <label className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-zinc-500">
                  <span>Market Saturation</span>
                  <span className="text-zinc-200">{competitionDensity}/100</span>
                </label>
                <input
                  type="range" min={0} max={100} step={5}
                  value={competitionDensity} onChange={(e) => setCompetitionDensity(parseInt(e.target.value))}
                  className="w-full accent-zinc-400"
                />
              </div>

              {/* Marketing multiplier */}
              <div className="space-y-3">
                <label className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-zinc-500">
                  <span>Acquisition Spend</span>
                  <span className="text-zinc-200">{(marketingMultiplier * 100).toFixed(0)}%</span>
                </label>
                <input
                  type="range" min={0.5} max={2.0} step={0.1}
                  value={marketingMultiplier} onChange={(e) => setMarketingMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-zinc-400"
                />
              </div>

              {/* Rent override */}
              <div className="space-y-3">
                <label className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-zinc-500">
                  <span>Fixed Overhead (Rent)</span>
                  <span className="text-zinc-200">{rentOverride ? `₹${(rentOverride / 1000).toFixed(0)}K` : 'Auto'}</span>
                </label>
                <input
                  type="number"
                  placeholder="Leave empty for AI estimated rent"
                  value={rentOverride || ''}
                  onChange={(e) => setRentOverride(e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950/50 border border-zinc-800 text-zinc-100 text-sm placeholder-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors"
                />
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/40">
              <button
                onClick={runSimulation}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-zinc-100 text-black font-semibold text-sm disabled:opacity-50 hover:bg-white hover:scale-[1.02] transition-all"
              >
                {loading ? 'Processing Scenario...' : 'Execute Protocol'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
