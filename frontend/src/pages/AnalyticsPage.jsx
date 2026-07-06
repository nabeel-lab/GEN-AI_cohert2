import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, TrendingUp, Users, Shield, CheckCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

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
      <div className="min-h-screen bg-navy-gradient flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">Loading analytics...</div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-navy-gradient text-slate-100">
        <nav className="glass border-b border-white/5 px-6 h-16 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-100 text-sm"
          >
            <ArrowLeft size={16} /> Home
          </button>
        </nav>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <p className="text-slate-400 mb-4">No analytics data yet.</p>
            <button
              onClick={() => navigate('/analyze')}
              className="px-6 py-2 rounded-lg bg-gold-gradient text-navy-900 font-semibold text-sm"
            >
              Run Your First Analysis
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

  const decisionColors = {
    'GO': '#10b981',
    'PROCEED WITH CAUTION': '#eab308',
    'NO GO': '#ef4444',
  }

  return (
    <div className="min-h-screen bg-navy-gradient text-slate-100">
      {/* Navbar */}
      <nav className="glass border-b border-white/5 px-6 h-16 flex items-center justify-between sticky top-0 z-50">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-100 text-sm"
        >
          <ArrowLeft size={16} /> Home
        </button>
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-gold-400" />
          <span className="font-bold">Analytics Dashboard</span>
        </div>
        <div className="w-12" />
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">Platform Analytics</h1>
        <p className="text-slate-400 text-sm mb-8">
          Data source: {summary.source === 'bigquery' ? 'BigQuery' : 'Local Sessions'}
        </p>

        {/* KPI Cards */}
        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-2xl p-6">
            <div className="text-slate-500 text-xs font-semibold mb-2">Total Reports</div>
            <div className="text-3xl font-bold text-slate-100">{summary.total_reports}</div>
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="text-slate-500 text-xs font-semibold mb-2">Avg Health Score</div>
            <div className="text-3xl font-bold text-gold-400">{summary.avg_health_score}/100</div>
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="text-slate-500 text-xs font-semibold mb-2">Avg ROI</div>
            <div className="text-3xl font-bold text-emerald-400">{summary.avg_roi}%</div>
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="text-slate-500 text-xs font-semibold mb-2">Avg Risk Score</div>
            <div className="text-3xl font-bold text-red-400">{summary.avg_risk_score}/100</div>
          </div>
        </div>

        {/* Charts grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Decision Distribution */}
          {decisionData.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-6 flex items-center gap-2">
                <CheckCircle size={16} className="text-gold-400" />
                Decision Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={decisionData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80}>
                    {decisionData.map((entry, index) => (
                      <Cell key={index} fill={decisionColors[entry.name] || '#9333ea'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* By Business Type */}
          {summary.by_business_type && summary.by_business_type.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-6 flex items-center gap-2">
                <TrendingUp size={16} className="text-gold-400" />
                Top Business Types
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summary.by_business_type}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="business_type" stroke="rgba(255,255,255,0.3)" />
                  <YAxis stroke="rgba(255,255,255,0.3)" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Bar dataKey="count" fill="#aa882c" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Location performance */}
        {summary.by_location && summary.by_location.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
              <Users size={16} className="text-gold-400" />
              Top Locations
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 text-slate-400">Location</th>
                    <th className="text-right p-3 text-slate-400">Analyses</th>
                    <th className="text-right p-3 text-slate-400">Avg Health Score</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.by_location.map((loc) => (
                    <tr key={loc.location} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 text-slate-200">{loc.location}</td>
                      <td className="text-right p-3 text-slate-300">{loc.count}</td>
                      <td className="text-right p-3 font-semibold">
                        <span className={loc.avg_health_score >= 60 ? 'text-emerald-400' : loc.avg_health_score >= 45 ? 'text-gold-400' : 'text-red-400'}>
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
