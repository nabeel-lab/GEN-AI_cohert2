import { useState } from 'react'
import { Sliders, TrendingUp } from 'lucide-react'

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
      const res = await fetch(`/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const verdictColor = {
    GO: 'text-emerald-400',
    'NO GO': 'text-red-400',
    'PROCEED WITH CAUTION': 'text-gold-400',
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-96 max-w-[calc(100vw-3rem)]">
      {/* Collapsed button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl glass border border-gold-500/30 hover:border-gold-500/50 text-gold-400 font-semibold text-sm transition-all hover:bg-gold-500/10"
        >
          <Sliders size={16} />
          What-If Simulator
        </button>
      )}

      {/* Expanded panel */}
      {isOpen && (
        <div className="glass rounded-2xl p-6 border border-white/10 shadow-2xl animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-gold-400" />
              <h3 className="font-bold">What-If Simulator</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-100 text-xl">×</button>
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto">
            {/* Budget slider */}
            <div>
              <label className="text-xs text-slate-400 block mb-2">
                Budget: <span className="text-slate-200 font-semibold">₹{(budget / 100000).toFixed(1)}L</span>
              </label>
              <input
                type="range"
                min={500000}
                max={5000000}
                step={100000}
                value={budget}
                onChange={(e) => setBudget(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Competition density */}
            <div>
              <label className="text-xs text-slate-400 block mb-2">
                Competition Density: <span className="text-slate-200 font-semibold">{competitionDensity}/100</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={competitionDensity}
                onChange={(e) => setCompetitionDensity(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Marketing multiplier */}
            <div>
              <label className="text-xs text-slate-400 block mb-2">
                Marketing Spend: <span className="text-slate-200 font-semibold">{(marketingMultiplier * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.1}
                value={marketingMultiplier}
                onChange={(e) => setMarketingMultiplier(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Rent override */}
            <div>
              <label className="text-xs text-slate-400 block mb-2">
                Monthly Rent (override): <span className="text-slate-200 font-semibold">{rentOverride ? `₹${(rentOverride / 1000).toFixed(0)}K` : 'Default'}</span>
              </label>
              <input
                type="number"
                placeholder="Leave empty for default"
                value={rentOverride || ''}
                onChange={(e) => setRentOverride(e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full px-3 py-2 rounded-lg bg-navy-700 border border-white/10 text-slate-100 text-sm placeholder-slate-600"
              />
            </div>
          </div>

          <button
            onClick={runSimulation}
            disabled={loading}
            className="w-full mt-4 px-4 py-2 rounded-lg bg-gold-gradient text-navy-900 font-semibold text-sm disabled:opacity-50 transition-all"
          >
            {loading ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>
      )}
    </div>
  )
}
