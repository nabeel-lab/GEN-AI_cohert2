import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { DEMO_SCENARIOS } from '../data/demoScenarios'
import { ArrowRight, Play, Brain, Database, BarChart3, MapPin, Cloud, LayoutTemplate, Activity, Target, Zap, Server, Shield, Network, Eye, Key } from 'lucide-react'
import HeroIllustration from '../components/HeroIllustration'

// --- Cinematic Text Reveals ---
const titleVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
}
const wordVariants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
}
const AnimatedText = ({ text, className }) => {
  const words = text.split(" ")
  return (
    <motion.h1 variants={titleVariants} initial="hidden" animate="visible" className={className}>
      {words.map((word, i) => (
        <motion.span key={i} variants={wordVariants} className="inline-block mr-[0.3em]">
          {word}
        </motion.span>
      ))}
    </motion.h1>
  )
}

const sectionFadeUp = {
  hidden: { opacity: 0, y: 60, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { scrollYProgress } = useScroll()
  const yBg = useTransform(scrollYProgress, [0, 1], [0, 200])

  function loadDemoScenario(scenarioId) {
    const scenario = DEMO_SCENARIOS.find(s => s.id === scenarioId)
    if (scenario) {
      const demoProject = {
        id: `demo-${scenarioId}`,
        name: scenario.label || scenarioId,
        createdAt: new Date().toISOString(),
        report: scenario.report,
      }
      const stored = localStorage.getItem('lw_projects')
      let projects = []
      if (stored) { try { projects = JSON.parse(stored) } catch(e) {} }
      const existing = projects.findIndex(p => p.id === demoProject.id)
      if (existing >= 0) { projects[existing] = demoProject } else { projects.unshift(demoProject) }
      localStorage.setItem('lw_projects', JSON.stringify(projects))
      sessionStorage.setItem('lw_report', JSON.stringify(scenario.report))
      navigate(`/results/${demoProject.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-background text-zinc-100 selection:bg-blue-500/20 selection:text-white overflow-hidden relative font-sans">
      
      {/* ── Ambient intelligence layers ── */}
      <div className="fixed inset-0 bg-zinc-950 pointer-events-none z-0" />
      <motion.div style={{ y: yBg }} className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_30%,transparent_100%)] pointer-events-none z-0" />

      {/* ── Hero ambient: matches the photo's dark navy interior so the illustration blends naturally ── */}
      {/* Color sampled from inside the hero-illustration.jpeg: deep indigo-navy #090e1f */}
      <div
        className="fixed pointer-events-none z-0"
        style={{
          top: 0,
          right: 0,
          width: '55%',
          height: '80vh',
          background: 'radial-gradient(ellipse 80% 80% at 75% 40%, #090d1d 0%, #070b17 20%, transparent 70%)',
        }}
      />

      {/* ── SECTION 1: HERO ── */}
      <section className="tour-step-hero relative z-10 w-full min-h-[90vh] flex items-center pt-24 pb-16 px-8 md:px-20 lg:px-28 max-w-[1400px] mx-auto">
        <div className="flex flex-col lg:flex-row items-center w-full justify-between gap-12">
          
          <div className="flex-1 max-w-2xl">
            {/* Status indicator */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="flex items-center gap-3 mb-10">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-400"></span>
              </span>
              <span className="text-[11px] font-mono tracking-[0.2em] text-zinc-500 uppercase">
                Agentic Orchestration Engine Online
              </span>
            </motion.div>

            {/* Headline */}
            <AnimatedText text="Simulate Before You Invest." className="text-[clamp(3.5rem,7vw,6.5rem)] leading-[1.05] font-medium tracking-tight text-zinc-100 mb-8" />

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.8 }} className="max-w-lg">
              <p className="text-[17px] text-zinc-400 leading-[1.7] font-light mb-12">
                LaunchWise deploys a network of 10 specialized AI agents to autonomously analyze market dynamics, competitor density, and financial viability. Get a complete executive brief before spending real capital.
              </p>
              
              <button
                id="tour-step-cta"
                onClick={() => navigate('/projects')}
                className="tour-step-cta group relative flex items-center justify-between w-full sm:w-auto sm:min-w-[320px] px-8 py-4 bg-zinc-100 text-zinc-900 rounded-full font-semibold text-[15px] hover:bg-white transition-all duration-500 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:scale-[1.02] active:scale-100"
              >
                <span className="tracking-tight">View Projects & Analyze</span>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400 text-[10px] font-mono hidden sm:block">↵</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
                </div>
              </button>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full hidden lg:block"
          >
            <HeroIllustration />
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 2: LIVE BUSINESS SIMULATION ── */}
      <motion.section 
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionFadeUp}
        className="tour-step-simulation relative z-10 w-full pt-12 pb-32 px-8 md:px-20 lg:px-28 max-w-[1400px] mx-auto"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="text-[11px] tracking-[0.2em] text-blue-400 uppercase font-mono mb-6 flex items-center gap-2">
              <Play size={12} /> Interactive Previews
            </div>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-zinc-100 leading-tight">Live Business Simulations.</h2>
            <p className="text-zinc-400 text-lg font-light mt-6 max-w-xl leading-relaxed">Experience exactly how our agents synthesize data. Review complete executive briefs generated entirely by our architecture for real-world scenarios.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEMO_SCENARIOS.map((scenario, idx) => (
            <motion.button
              key={scenario.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => loadDemoScenario(scenario.id)}
              className="group text-left p-8 rounded-[24px] bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 hover:border-zinc-700/80 shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-2 transition-all duration-500 flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/0 to-transparent group-hover:via-blue-500/50 transition-colors duration-500" />
              
              <div className="flex items-start justify-between w-full mb-12">
                <div>
                  <h3 className="text-xl font-medium text-zinc-100 mb-2 tracking-tight group-hover:text-blue-400 transition-colors">{scenario.label}</h3>
                  <p className="text-sm text-zinc-500 font-light leading-relaxed">{scenario.subtitle}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-700/50 group-hover:bg-blue-500 group-hover:border-blue-400 flex items-center justify-center transition-all duration-400 transform group-hover:scale-110 flex-shrink-0">
                  <ArrowRight size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-800/50 mt-auto">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-2">Health</p>
                  <p className="text-lg font-medium text-zinc-200 tabular-nums">{scenario.report.decision.business_health_score}<span className="text-[11px] text-zinc-600 font-normal ml-1">/100</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-2">Risk</p>
                  <p className={`text-lg font-medium ${scenario.report.risk.risk_level === 'High' ? 'text-red-400' : scenario.report.risk.risk_level === 'Medium' ? 'text-blue-400' : 'text-emerald-400'}`}>
                    {scenario.report.risk.risk_level}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-2">Est. ROI</p>
                  <p className="text-lg font-medium text-zinc-200 tabular-nums">{scenario.report.finance.roi_percentage > 0 ? '+' : ''}{scenario.report.finance.roi_percentage}%</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* ── SECTION 3: 10 SPECIALIZED AI AGENTS (ASYMMETRICAL EDITORIAL) ── */}
      <motion.section 
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionFadeUp}
        className="tour-step-agents relative z-10 w-full py-32 px-8 md:px-20 lg:px-28 max-w-[1400px] mx-auto"
      >
        <div className="max-w-3xl mb-24">
          <div className="text-[11px] tracking-[0.2em] text-zinc-500 uppercase font-mono mb-6">Agentic Architecture</div>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-8 text-zinc-100 leading-tight">10 Specialized AI Agents.<br/><span className="text-zinc-500 font-light">One Executive Decision.</span></h2>
          <p className="text-zinc-400 text-lg font-light leading-relaxed max-w-2xl">
            Unlike standard chatbots, LaunchWise utilizes a decentralized multi-agent orchestration architecture. Each agent commands a specific domain expertise—collaborating, debating, and synthesizing data before yielding a final Go/No-Go verdict.
          </p>
        </div>
        
        {/* Asymmetrical Layout */}
        <div className="relative">
          {/* Subtle connecting background lines */}
          <div className="absolute top-[20%] bottom-[20%] left-[50%] w-px bg-gradient-to-b from-transparent via-zinc-800 to-transparent hidden lg:block" />
          <div className="absolute top-[50%] left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent hidden lg:block" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative z-10">
            
            {/* Lead Agent (Spans larger) */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="lg:col-span-8 p-10 rounded-[32px] bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-zinc-800/80 backdrop-blur-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full" />
              <Network size={32} className="text-blue-400 mb-8" />
              <h3 className="text-2xl font-medium text-zinc-100 mb-4 tracking-tight">The Orchestrator</h3>
              <p className="text-zinc-400 font-light leading-relaxed max-w-md">
                The core intelligence engine that breaks down your business prompt, queries real-time APIs, and delegates specific analysis vectors to the 9 subordinate domain agents.
              </p>
            </motion.div>

            {/* Support Agent */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="lg:col-span-4 p-8 rounded-[32px] bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-end"
            >
              <BarChart3 size={24} className="text-emerald-400 mb-6" />
              <h3 className="text-lg font-medium text-zinc-100 mb-3 tracking-tight">Financial Analyst</h3>
              <p className="text-zinc-500 text-sm font-light leading-relaxed">
                Builds robust 12-month P&L models, calculates CapEx vs OpEx, and determines the break-even horizon.
              </p>
            </motion.div>

            {/* Support Agent */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="lg:col-span-4 p-8 rounded-[32px] bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-xl"
            >
              <Eye size={24} className="text-amber-400 mb-6" />
              <h3 className="text-lg font-medium text-zinc-100 mb-3 tracking-tight">Market Intel</h3>
              <p className="text-zinc-500 text-sm font-light leading-relaxed">
                Scans for local demand trends, seasonality spikes, and calculates the Total Addressable Market (TAM).
              </p>
            </motion.div>

            {/* Support Agent */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="lg:col-span-5 p-8 rounded-[32px] bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-xl"
            >
              <Shield size={24} className="text-red-400 mb-6" />
              <h3 className="text-lg font-medium text-zinc-100 mb-3 tracking-tight">Risk Assessment</h3>
              <p className="text-zinc-500 text-sm font-light leading-relaxed">
                Identifies critical regulatory constraints, supply chain vulnerabilities, and operational threats before they materialize.
              </p>
            </motion.div>

            {/* Micro Agent */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="lg:col-span-3 p-8 rounded-[32px] border border-zinc-800/50 bg-transparent flex flex-col items-center justify-center text-center"
            >
              <p className="text-zinc-400 font-medium">+ 6 More Agents</p>
              <p className="text-zinc-600 text-xs font-mono mt-2">Running parallel logic</p>
            </motion.div>

          </div>
        </div>
      </motion.section>

      {/* ── SECTION 4: HOW IT WORKS ── */}
      <motion.section 
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionFadeUp}
        className="relative z-10 w-full py-32 px-8 md:px-20 lg:px-28 max-w-[1400px] mx-auto text-center"
      >
        <div className="text-[11px] tracking-[0.2em] text-zinc-500 uppercase font-mono mb-8">The Pipeline</div>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-20 text-zinc-100">Intelligent Workflows</h2>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 max-w-5xl mx-auto">
          {["Idea Input", "Agentic Routing", "Market Intel", "Financial Forecast", "Decision Matrix"].map((step, index, arr) => (
            <div key={index} className="flex items-center md:flex-col gap-6 relative group">
              <div className="w-16 h-16 rounded-full border border-zinc-700/50 bg-zinc-900/80 flex items-center justify-center text-sm font-mono text-zinc-400 shadow-xl group-hover:border-blue-500/50 group-hover:text-blue-400 transition-colors z-10">
                0{index + 1}
              </div>
              <div className="text-sm font-medium text-zinc-300 tracking-wide">{step}</div>
              {index < arr.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800" />
              )}
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── SECTION 5: BUILT WITH GOOGLE CLOUD ── */}
      <motion.section 
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionFadeUp}
        className="relative z-10 w-full py-24 px-8 md:px-20 lg:px-28 max-w-[1400px] mx-auto border-t border-zinc-900/50 text-center bg-zinc-950/50"
      >
        <div className="text-[11px] tracking-[0.2em] text-zinc-600 uppercase font-mono mb-12">
          Engineered for scale with
        </div>
        <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-12 opacity-60">
          {[
            { icon: Brain, label: "Gemini 1.5 Pro", color: "text-blue-500" },
            { icon: Database, label: "Firestore", color: "text-yellow-500" },
            { icon: Server, label: "BigQuery", color: "text-blue-400" },
            { icon: MapPin, label: "Google Maps API", color: "text-green-500" },
            { icon: Zap, label: "Cloud Run", color: "text-blue-300" }
          ].map((Tech, i) => (
            <div key={i} className="flex flex-col items-center gap-4 grayscale hover:grayscale-0 transition-all duration-500 cursor-default">
              <Tech.icon size={28} className={Tech.color} />
              <span className="text-xs font-semibold text-zinc-300 tracking-wider uppercase">{Tech.label}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── SECTION 6: FOOTER ── */}
      <footer className="relative z-10 w-full py-12 px-8 md:px-20 lg:px-28 max-w-[1400px] mx-auto border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="font-semibold text-zinc-100 tracking-tight text-[15px]">LaunchWise AI</span>
        </div>
        <div className="flex items-center gap-8 text-zinc-500 font-light">
          <span className="hover:text-zinc-300 transition-colors cursor-default tracking-wide">Google Hackathon 2026</span>
          <a href="https://github.com/launchwise" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors tracking-wide">GitHub</a>
          <span className="hover:text-zinc-300 transition-colors cursor-default tracking-wide">Decision Intelligence</span>
        </div>
      </footer>
    </div>
  )
}
