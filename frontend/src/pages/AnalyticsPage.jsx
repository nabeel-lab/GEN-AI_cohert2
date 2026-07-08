import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, TrendingUp, Users, CheckCircle, Activity, Globe, Zap } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { motion } from 'framer-motion'

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/summary')
      .then((r) => r.json())
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-zinc-500 text-sm animate-pulse">
          <Activity className="animate-spin w-4 h-4" /> Synchronizing intelligence network...
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-background text-zinc-100 font-sans relative">
        <div className="fixed top-0 left-0 w-full h-full bg-glow pointer-events-none z-0" />
        <nav className="relative z-50 border-b border-zinc-800/50 bg-background/80 backdrop-blur-xl px-8 h-20 flex items-center sticky top-0">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Home
          </button>
        </nav>
        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-5rem)]">
          <div className="text-center">
            <p className="text-zinc-500 mb-6 font-medium">Network inactive. No analytics data found.</p>
            <button
              onClick={() => navigate('/projects')}
              className="px-6 py-3 rounded-full bg-zinc-100 text-black font-semibold text-sm hover:scale-[1.02] transition-transform"
            >
              Initialize First Scan
            </button>
          </div>
        </div>
      </div>
    )
  }

  const decisionData = Object.entries(summary.decision_distribution || {}).map(([decision, count]) => ({
    name: decision,
    value: count,
  }))

  // Cinematic monochromatic pie chart
  const decisionColors = {
    'GO': '#a1a1aa',
    'PROCEED WITH CAUTION': '#52525b',
    'NO GO': '#27272a',
  }

  return (
    <div className="min-h-screen bg-background text-zinc-100 font-sans relative">
      <div className="fixed top-0 left-0 w-full h-full bg-glow pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none z-0" />

      {/* Navbar */}
      <nav className="relative z-50 border-b border-zinc-800/50 bg-background/80 backdrop-blur-xl px-8 h-20 flex items-center justify-between sticky top-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} /> Home
        </button>
        <div className="flex items-center gap-3">
          <Activity size={18} className="text-zinc-400" />
          <span className="font-medium tracking-tight text-lg">Global Analytics</span>
        </div>
        <div className="w-12" />
      </nav>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-8 py-16">
        
        <header className="mb-12 animate-fade-in-up">
          <h1 className="text-4xl font-medium tracking-tight text-zinc-100 mb-3">Intelligence Dashboard</h1>
          <p className="text-zinc-500 text-sm font-mono tracking-widest uppercase">
            Data stream: {summary.source === 'bigquery' ? 'BigQuery Nexus' : 'Local Sandbox'}
          </p>
        </header>

        {/* KPI Cards */}
        <div className="grid sm:grid-cols-4 gap-6 mb-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="border border-zinc-800 bg-zinc-900/40 backdrop-blur-md rounded-2xl p-6">
            <div className="flex items-center gap-3 text-zinc-500 text-xs font-mono uppercase tracking-widest mb-4">
              <Globe size={14} /> Scans Executed
            </div>
            <div className="text-4xl font-medium text-zinc-100 tracking-tight">{summary.total_reports}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="border border-zinc-800 bg-zinc-900/40 backdrop-blur-md rounded-2xl p-6">
            <div className="flex items-center gap-3 text-zinc-500 text-xs font-mono uppercase tracking-widest mb-4">
              <Activity size={14} /> Avg Health
            </div>
            <div className="text-4xl font-medium text-zinc-300 tracking-tight">{summary.avg_health_score}<span className="text-zinc-600 text-lg">/100</span></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="border border-zinc-800 bg-zinc-900/40 backdrop-blur-md rounded-2xl p-6">
            <div className="flex items-center gap-3 text-zinc-500 text-xs font-mono uppercase tracking-widest mb-4">
              <TrendingUp size={14} /> Avg ROI Yield
            </div>
            <div className="text-4xl font-medium text-zinc-300 tracking-tight">{summary.avg_roi}<span className="text-zinc-600 text-lg">%</span></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="border border-zinc-800 bg-zinc-900/40 backdrop-blur-md rounded-2xl p-6">
            <div className="flex items-center gap-3 text-zinc-500 text-xs font-mono uppercase tracking-widest mb-4">
              <Zap size={14} /> Risk Index
            </div>
            <div className="text-4xl font-medium text-zinc-400 tracking-tight">{summary.avg_risk_score}<span className="text-zinc-600 text-lg">/100</span></div>
          </motion.div>
        </div>

        {/* Charts grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Decision Distribution */}
          {decisionData.length > 0 && (
            <div className="border border-zinc-800 bg-zinc-900/40 backdrop-blur-md rounded-2xl p-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <h3 className="font-medium text-lg mb-8 flex items-center gap-3 border-b border-zinc-800 pb-4 text-zinc-200">
                <CheckCircle size={18} className="text-zinc-500" />
                Verdict Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={decisionData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={90}>
                    {decisionData.map((entry, index) => (
                      <Cell key={index} fill={decisionColors[entry.name] || '#52525b'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* By Business Type */}
          {summary.by_business_type && summary.by_business_type.length > 0 && (
            <div className="border border-zinc-800 bg-zinc-900/40 backdrop-blur-md rounded-2xl p-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <h3 className="font-medium text-lg mb-8 flex items-center gap-3 border-b border-zinc-800 pb-4 text-zinc-200">
                <TrendingUp size={18} className="text-zinc-500" />
                Top Vectors
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summary.by_business_type}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="business_type" stroke="#52525b" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#52525b" tick={{ fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', color: '#f4f4f5' }} />
                  <Bar dataKey="count" fill="#d4d4d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Location performance */}
        {summary.by_location && summary.by_location.length > 0 && (
          <div className="border border-zinc-800 bg-zinc-900/40 backdrop-blur-md rounded-2xl p-8 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <h3 className="font-medium text-lg mb-8 flex items-center gap-3 border-b border-zinc-800 pb-4 text-zinc-200">
              <Users size={18} className="text-zinc-500" />
              Regional Performance
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-4 px-2 text-zinc-500 font-medium">Node Location</th>
                    <th className="text-right py-4 px-2 text-zinc-500 font-medium">Evaluations</th>
                    <th className="text-right py-4 px-2 text-zinc-500 font-medium">Mean Health</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.by_location.map((loc) => (
                    <tr key={loc.location} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group">
                      <td className="py-4 px-2 text-zinc-300 font-medium group-hover:text-zinc-100 transition-colors">{loc.location}</td>
                      <td className="text-right py-4 px-2 text-zinc-400 font-mono">{loc.count}</td>
                      <td className="text-right py-4 px-2 font-mono tracking-wide">
                        <span className={loc.avg_health_score >= 60 ? 'text-zinc-300' : loc.avg_health_score >= 45 ? 'text-zinc-500' : 'text-zinc-600'}>
                          {loc.avg_health_score}/100
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
