import { useNavigate } from 'react-router-dom'
import { ArrowRight, Brain, MapPin, TrendingUp, Shield, Users, BarChart3, Zap, CheckCircle, Play } from 'lucide-react'
import { DEMO_SCENARIOS } from '../data/demoScenarios'

const AGENTS = [
  { icon: Brain,      label: 'Business Intelligence' },
  { icon: TrendingUp, label: 'Market Analysis' },
  { icon: Users,      label: 'Competitor Mapping' },
  { icon: MapPin,     label: 'Location Scoring' },
  { icon: BarChart3,  label: 'Financial Forecast' },
  { icon: Users,      label: 'Customer Personas' },
  { icon: Zap,        label: 'Supply Chain' },
  { icon: TrendingUp, label: 'Marketing Strategy' },
  { icon: Shield,     label: 'Risk Prediction' },
  { icon: CheckCircle,label: 'Go / No-Go Decision' },
]

const FEATURES = [
  {
    icon: Brain,
    title: '10 Specialized AI Agents',
    desc: 'Each agent is an expert in its domain — from market trends to supply chains. They run in sequence and feed each other context.',
  },
  {
    icon: BarChart3,
    title: 'Investor-Ready Reports',
    desc: 'Get a 12-month financial forecast, competitor SWOT analysis, and a business health score — all in under 60 seconds.',
  },
  {
    icon: MapPin,
    title: 'Hyper-Local Intelligence',
    desc: 'Location scoring, footfall data, and competition density mapped to your exact neighborhood in Bangalore or Hyderabad.',
  },
  {
    icon: Shield,
    title: 'Go / No-Go Verdict',
    desc: "A single, confident recommendation synthesized from all 10 agents. Know whether to launch before you spend a single rupee.",
  },
]

const STEPS = [
  { step: '01', label: 'Describe your idea',   desc: 'Business type, location, budget, and vision — 4 quick inputs.' },
  { step: '02', label: '10 agents activate',   desc: 'Watch each specialist agent run in real time on your idea.' },
  { step: '03', label: 'Review your dashboard',desc: 'Full intelligence report across 8 dimensions.' },
  { step: '04', label: 'Make your decision',   desc: 'Act on a data-backed Go / No-Go with a clear next-steps roadmap.' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  function loadDemoScenario(scenarioId) {
    const scenario = DEMO_SCENARIOS.find(s => s.id === scenarioId)
    if (scenario) {
      sessionStorage.setItem('lw_report', JSON.stringify(scenario.report))
      navigate('/results')
    }
  }

  return (
    <div className="min-h-screen bg-navy-gradient text-slate-100 overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => navigate('/')}>
              <span className="text-2xl">🚀</span>
              <span className="text-lg font-bold text-gold-gradient">LaunchWise AI</span>
            </div>
            <button
              onClick={() => navigate('/analytics')}
              className="hidden sm:inline text-sm text-slate-400 hover:text-slate-100 transition-colors"
            >
              Analytics
            </button>
          </div>
          <button
            onClick={() => navigate('/analyze')}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-gold-500/20"
          >
            Start Analysis <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-36 pb-24 px-6 text-center relative">
        {/* Layered glow orbs for depth */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-1/3 -translate-x-1/2 w-[300px] h-[200px] bg-accent-teal/5 rounded-full blur-3xl pointer-events-none animate-float" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-gold text-gold-400 text-sm font-medium mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse-gold" />
            Powered by Gemini 1.5 Flash · 10 AI Agents
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight animate-fade-in-up" style={{ animationDelay: '80ms' }}>
            Know before you{' '}
            <span className="text-gold-gradient">launch.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '160ms' }}>
            LaunchWise AI runs 10 specialized agents on your business idea — analyzing
            market demand, competitors, location, finances, and risk — then delivers a
            Go&nbsp;/&nbsp;No-Go verdict in under 60 seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
            <button
              onClick={() => navigate('/analyze')}
              className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-gold-gradient text-navy-900 font-bold text-base transition-all duration-200 hover:shadow-2xl hover:shadow-gold-500/30 hover:scale-105 active:scale-100"
            >
              Analyze My Business Idea
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-slate-500 text-sm">No sign-up required · Free to use</p>
          </div>
        </div>
      </section>

      {/* ── Demo Scenarios ── */}
      <section className="py-16 px-6 border-b border-white/5 bg-navy-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">Try a Pre-Built Demo</h2>
            <p className="text-slate-400 text-sm">See LaunchWise in action. Instant, real analysis. No sign-up needed.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {DEMO_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => loadDemoScenario(scenario.id)}
                className="group glass rounded-xl p-5 text-left hover:bg-white/8 hover:border-gold-500/30 transition-all duration-200 border border-white/10"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="text-lg font-semibold text-slate-100 group-hover:text-gold-400 transition-colors">{scenario.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{scenario.subtitle}</div>
                  </div>
                  <Play size={16} className="text-gold-500/50 group-hover:text-gold-400 flex-shrink-0 mt-1 transition-colors" />
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Verdict: <span className={scenario.report.decision.go_no_go === 'GO' ? 'text-emerald-400 font-semibold' : 'text-gold-400 font-semibold'}>
                    {scenario.report.decision.go_no_go}
                  </span> · Health: <span className="text-slate-300">{scenario.report.decision.business_health_score}/100</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agent Ticker ── */}
      <section className="py-10 px-6 border-y border-white/5 overflow-hidden">
        <div className="flex gap-6 animate-[scroll_30s_linear_infinite] w-max">
          {[...AGENTS, ...AGENTS].map((agent, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-full glass-gold text-slate-300 text-sm font-medium whitespace-nowrap flex-shrink-0"
            >
              <agent.icon size={15} className="text-gold-400" />
              {agent.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              A full consulting team,{' '}
              <span className="text-gold-gradient">in 60 seconds</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              What used to cost ₹5 lakhs and 3 weeks now takes one form and one minute.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="glass card-lift rounded-2xl p-7 hover:border-gold-500/20 transition-colors duration-300 group animate-fade-in-up"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="w-11 h-11 rounded-xl bg-gold-500/10 flex items-center justify-center mb-5 group-hover:bg-gold-500/15 transition-colors">
                  <f.icon size={20} className="text-gold-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-slate-400">Four steps from idea to decision.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-full w-full h-px bg-gradient-to-r from-gold-500/30 to-transparent z-10" />
                )}
                <div className="glass card-lift rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: `${i * 90}ms` }}>
                  <div className="text-3xl font-black text-gold-500/20 mb-3">{s.step}</div>
                  <h3 className="font-semibold mb-2 text-slate-100">{s.label}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof Strip ── */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: '10',      label: 'AI Agents' },
            { value: '6',       label: 'Business Types' },
            { value: '< 60s',   label: 'Analysis Time' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-4xl font-black text-gold-gradient mb-1">{stat.value}</div>
              <div className="text-slate-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center glass-gold rounded-3xl p-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to find out if your idea will fly?
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Type your business idea and location. LaunchWise does the rest.
          </p>
          <button
            onClick={() => navigate('/analyze')}
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gold-gradient text-navy-900 font-bold text-base transition-all duration-200 hover:shadow-2xl hover:shadow-gold-500/30 hover:scale-105 active:scale-100"
          >
            Start Free Analysis
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-white/5 text-center text-slate-600 text-sm">
        <span className="text-gold-gradient font-semibold">LaunchWise AI</span>
        {' '}· Built with Gemini 1.5 Flash · Google Cloud
      </footer>

      {/* Ticker keyframe — injected inline since it's a one-off utility */}
      <style>{`
        @keyframes scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
