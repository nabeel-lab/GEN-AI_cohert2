import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, ChevronRight,
  Store, MapPin, Wallet, FileText, AlertCircle,
  Activity
} from 'lucide-react'
import AgentStatusPanel from '../components/AgentStatusPanel'
import LocationPicker from '../components/LocationPicker'

// ── Form steps definition ──────────────────────────────────────────────────
const STEPS = [
  {
    id: 'business_type',
    icon: Store,
    question: 'What type of business do you want to launch?',
    hint: 'e.g. Café, Bakery, Restaurant, Retail store, Gym, Salon',
    placeholder: 'e.g. Specialty coffee café',
    type: 'text',
  },
  {
    id: 'location',
    icon: MapPin,
    question: 'Where do you plan to open it?',
    hint: 'City or neighbourhood in India — e.g. Indiranagar, Bangalore',
    placeholder: 'e.g. Koramangala, Bangalore',
    type: 'text',
  },
  {
    id: 'budget',
    icon: Wallet,
    question: 'What is your launch budget?',
    hint: 'Enter amount in Indian Rupees (INR)',
    placeholder: 'e.g. 1500000',
    type: 'number',
  },
  {
    id: 'description',
    icon: FileText,
    question: 'Describe your idea in a few sentences.',
    hint: 'What makes it unique? Who is it for? What problem does it solve?',
    placeholder: 'e.g. A cozy workspace café targeting remote workers, offering specialty pour-overs and fast Wi-Fi with dedicated quiet zones…',
    type: 'textarea',
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────
function formatBudget(val) {
  const n = parseFloat(val)
  if (isNaN(n)) return ''
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)} L`
  if (n >= 1_000)      return `₹${(n / 1_000).toFixed(1)}K`
  return `₹${n}`
}

// ── Component ──────────────────────────────────────────────────────────────
export default function AnalysisPage() {
  const navigate = useNavigate()
  const { projectId } = useParams()

  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers]         = useState({ business_type: '', location: '', budget: '', description: '' })

  // Initialize with existing project data if available
  useEffect(() => {
    if (projectId) {
      const stored = localStorage.getItem('lw_projects')
      if (stored) {
        try {
          const projects = JSON.parse(stored)
          const proj = projects.find(p => p.id === projectId)
          if (proj) {
            // First check if we have answers explicitly saved (from AI consultant), otherwise fallback to the report request
            const prev = proj.answers || proj.report?.request
            if (prev) {
              setAnswers({
                business_type: prev.business_type || '',
                location: prev.location || '',
                budget: prev.budget?.toString() || '',
                description: prev.description || ''
              })
              setInputVal(prev.business_type || '')
            }
          }
        } catch (e) {}
      }
    }
  }, [projectId])
  const [inputVal, setInputVal]       = useState('')
  const [locationData, setLocationData] = useState(null)
  const [error, setError]             = useState('')

  // Analysis state
  const [phase, setPhase]         = useState('form')   // 'form' | 'analyzing' | 'done'
  const [apiError, setApiError]   = useState('')

  const step = STEPS[currentStep]

  // ── Validation ────────────────────────────────────────────────────────────
  function validate(val) {
    if (step?.id === 'location') {
      return locationData ? '' : 'Please confirm a location on the map before continuing.'
    }
    const v = val?.trim() || ''
    if (!v) return 'Please fill in this field before continuing.'
    if (step?.id === 'budget') {
      const n = parseFloat(v)
      if (isNaN(n) || n < 50_000)  return 'Minimum budget is ₹50,000.'
      if (n > 500_000_000)          return 'Please enter a realistic budget value.'
    }
    if (step?.id === 'description' && v.length < 20) {
      return 'Please describe your idea in at least 20 characters.'
    }
    return ''
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  function handleNext() {
    const err = validate(inputVal)
    if (err) { setError(err); return }
    setError('')

    const newAnswers = step.id === 'location'
      ? {
          ...answers,
          location: locationData.formatted_address
            || [locationData.locality, locationData.city].filter(Boolean).join(', ')
            || locationData.free_text
            || '',
          location_data: locationData,
        }
      : { ...answers, [step.id]: inputVal.trim() }
    
    setAnswers(newAnswers)

    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      setInputVal(newAnswers[STEPS[nextStep].id] || '')
    } else {
      startAnalysis(newAnswers)
    }
  }

  function handleBack() {
    if (currentStep === 0) { navigate('/'); return }
    setCurrentStep((s) => s - 1)
    setInputVal(answers[STEPS[currentStep - 1].id] || '')
    setError('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && step?.type !== 'textarea') handleNext()
  }

  // ── API call ──────────────────────────────────────────────────────────────
  async function startAnalysis(data) {
    setPhase('analyzing')
    setApiError('')
    setAnimDone(false)

    try {
      const loc = data.location_data
      const payload = {
        session_id:    projectId || undefined,
        business_type: data.business_type,
        location:      data.location,
        budget:        parseFloat(data.budget),
        description:   data.description,

        ...(loc && loc.latitude != null ? {
          latitude:          loc.latitude,
          longitude:         loc.longitude,
          formatted_address: loc.formatted_address || undefined,
          place_id:          loc.place_id || undefined,
          locality:          loc.locality || undefined,
          city:              loc.city || undefined,
          state:             loc.state || undefined,
          country:           loc.country || undefined,
          postal_code:       loc.postal_code || undefined,
        } : {}),
      }

      const token = localStorage.getItem('lw_token')
      const res = await fetch('http://localhost:8000/analyze', {
        method:  'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body:    JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || `Server error: ${res.status}`)
      }

      const report = await res.json()
      
      const stored = localStorage.getItem('lw_projects')
      if (stored) {
        try {
          const projects = JSON.parse(stored)
          const updated = projects.map(p => p.id === projectId ? { ...p, report } : p)
          localStorage.setItem('lw_projects', JSON.stringify(updated))
        } catch(e) {}
      }
      sessionStorage.setItem('lw_report', JSON.stringify(report))
      
      setPhase('done')
    } catch (err) {
      console.error('Analysis failed:', err)
      setApiError(err.message || 'Something went wrong. Please try again.')
      setPhase('form')
    }
  }

  const [animDone, setAnimDone] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)
  const analysisStartRef = useRef(null)

  useEffect(() => {
    if (phase !== 'analyzing' && phase !== 'done') {
      analysisStartRef.current = null
      setElapsedSec(0)
      return
    }
    if (analysisStartRef.current === null) analysisStartRef.current = Date.now()
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - analysisStartRef.current) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [phase])

  const handleAgentsComplete = useCallback(() => {
    setAnimDone(true)
  }, [])

  const handleProceed = useCallback(() => {
    navigate(`/results/${projectId || ''}`)
  }, [navigate, projectId])

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full bg-glow pointer-events-none animate-breathe" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* ── Navbar ── */}
      <nav className="relative z-10 px-8 h-20 flex items-center justify-between border-b border-white/5 bg-background/50 backdrop-blur-xl">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Cancel Simulation
        </button>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-zinc-300" />
          <span className="font-semibold text-zinc-100 tracking-tight text-lg">LaunchWise AI</span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={[
                'w-1.5 h-1.5 rounded-full transition-all duration-500',
                i < currentStep  ? 'bg-zinc-500' :
                i === currentStep ? 'bg-zinc-100 scale-125' :
                                    'bg-zinc-800',
              ].join(' ')}
            />
          ))}
        </div>
      </nav>

      {/* ── Main layout ── */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-8 py-12 gap-16">
        
        {/* ── Left: Form / Analyzing state ── */}
        <div className="flex-1 flex flex-col justify-center max-w-2xl">
          
          <AnimatePresence mode="wait">
            {phase === 'form' && (
              <motion.div 
                key={currentStep} 
                initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                {/* Step counter */}
                <div className="flex items-center gap-4 mb-10">
                  <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase">
                    Step {currentStep + 1} of {STEPS.length}
                  </span>
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span className="text-xs font-mono text-zinc-600">
                    {Math.round(((currentStep) / STEPS.length) * 100)}%
                  </span>
                </div>

                {/* Question */}
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-10 h-10 rounded-lg border border-zinc-800 bg-zinc-900 flex items-center justify-center flex-shrink-0 mt-1">
                    <step.icon size={18} className="text-zinc-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-medium text-zinc-100 leading-tight tracking-tight mb-2">
                      {step.question}
                    </h2>
                    <p className="text-zinc-500 text-sm font-light">{step.hint}</p>
                  </div>
                </div>

                {/* Input */}
                {step.id === 'location' ? (
                  <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden focus-within:border-zinc-500 transition-colors">
                    <LocationPicker
                      initialQuery={answers.location}
                      initialLocation={answers.location_data || null}
                      onChange={(loc) => { setLocationData(loc); setError('') }}
                    />
                  </div>
                ) : step.type === 'textarea' ? (
                  <textarea
                    autoFocus
                    rows={4}
                    value={inputVal}
                    onChange={(e) => { setInputVal(e.target.value); setError('') }}
                    placeholder={step.placeholder}
                    className={[
                      'w-full bg-zinc-900/50 border rounded-xl px-5 py-4 text-zinc-100 placeholder-zinc-600',
                      'focus:outline-none focus:border-zinc-500',
                      'resize-none text-lg font-light leading-relaxed transition-colors',
                      error ? 'border-red-900' : 'border-zinc-800',
                    ].join(' ')}
                  />
                ) : (
                  <input
                    autoFocus
                    type={step.type}
                    value={inputVal}
                    onChange={(e) => { setInputVal(e.target.value); setError('') }}
                    onKeyDown={handleKeyDown}
                    placeholder={step.placeholder}
                    className={[
                      'w-full bg-zinc-900/50 border rounded-xl px-5 py-4 text-zinc-100 placeholder-zinc-600',
                      'focus:outline-none focus:border-zinc-500',
                      'text-lg font-light transition-colors',
                      error ? 'border-red-900' : 'border-zinc-800',
                    ].join(' ')}
                  />
                )}

                {/* Budget preview */}
                {step.id === 'budget' && inputVal && !isNaN(parseFloat(inputVal)) && (
                  <p className="mt-3 text-zinc-400 text-sm font-mono tracking-wide">
                    {formatBudget(inputVal)}
                  </p>
                )}

                {/* Inline error */}
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mt-4 text-red-400 text-sm font-medium">
                    <AlertCircle size={14} /> {error}
                  </motion.div>
                )}

                {/* API error */}
                {apiError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 px-5 py-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-sm">
                    {apiError}
                  </motion.div>
                )}

                {/* Navigation buttons */}
                <div className="flex items-center gap-4 mt-12">
                  <button
                    onClick={handleBack}
                    className="px-6 py-4 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 hover:bg-zinc-900 transition-all text-sm font-medium"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-zinc-100 text-black font-semibold text-base hover:bg-white hover:scale-[1.02] active:scale-100 transition-all"
                  >
                    {currentStep < STEPS.length - 1 ? (
                      <> Continue <span className="ml-1 text-xs font-mono text-zinc-500 bg-zinc-200/80 px-2 py-0.5 rounded border border-zinc-300 shadow-sm">↵</span> </>
                    ) : (
                      <> Run Intelligence Protocol <span className="ml-1 text-xs font-mono text-zinc-500 bg-zinc-200/80 px-2 py-0.5 rounded border border-zinc-300 shadow-sm">↵</span> </>
                    )}
                  </button>
                </div>

                {/* Previous answers summary */}
                {currentStep > 0 && (
                  <div className="mt-12 pt-8 border-t border-zinc-800/50">
                    <p className="text-xs font-mono text-zinc-600 mb-4 uppercase tracking-widest">Configuration State</p>
                    <div className="flex flex-col gap-3">
                      {STEPS.slice(0, currentStep).map((s) => (
                        <div key={s.id} className="flex items-center gap-3 text-sm">
                          <s.icon size={14} className="text-zinc-600 flex-shrink-0" />
                          <span className="text-zinc-400 font-light truncate">
                            {s.id === 'budget'
                              ? formatBudget(answers[s.id])
                              : answers[s.id]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {(phase === 'analyzing' || phase === 'done') && (
              <motion.div 
                key="analyzing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                <div className="border border-zinc-800 bg-zinc-900/50 rounded-2xl p-8 mb-8 backdrop-blur-xl">
                  <div className="flex items-center gap-4 mb-8 pb-8 border-b border-zinc-800/80">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                      <div className="w-12 h-12 rounded-full border border-blue-500/30 bg-zinc-900 flex items-center justify-center relative z-10">
                        <Activity className="w-6 h-6 text-blue-400 animate-pulse" />
                      </div>
                      <div className="absolute -inset-1 rounded-full border border-blue-500/30 opacity-50 animate-ping" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-medium tracking-tight text-zinc-100">Executing Analysis</h2>
                      <p className="text-zinc-500 text-sm font-light">10 autonomous agents engaged</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-zinc-300 text-lg tabular-nums">
                        {String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:{String(elapsedSec % 60).padStart(2, '0')}
                      </span>
                      <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest">T-Plus</p>
                    </div>
                  </div>
                  <motion.div 
                    className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } }
                    }}
                  >
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="flex items-center gap-3">
                      <Store size={16} className="text-zinc-600 flex-shrink-0" />
                      <span className="text-zinc-300 font-medium truncate">{answers.business_type}</span>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="flex items-center gap-3">
                      <MapPin size={16} className="text-zinc-600 flex-shrink-0" />
                      <span className="text-zinc-300 font-medium truncate">{answers.location}</span>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="flex items-center gap-3 col-span-2">
                      <Wallet size={16} className="text-zinc-600 flex-shrink-0" />
                      <span className="text-zinc-300 font-mono tracking-wide">{formatBudget(answers.budget)}</span>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="flex items-start gap-3 col-span-2">
                      <FileText size={16} className="text-zinc-600 flex-shrink-0 mt-1" />
                      <span className="text-zinc-400 font-light line-clamp-3 leading-relaxed">{answers.description}</span>
                    </motion.div>
                  </motion.div>
                </div>
                <div className="text-center">
                  <p className="inline-flex items-center gap-2 text-zinc-500 text-sm font-mono tracking-wide uppercase">
                    <span className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" />
                    Synthesizing intelligence report
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right: Agent Status Panel ── */}
        <div className="lg:w-96 flex-shrink-0 relative z-20">
          <AgentStatusPanel
            isRunning={phase === 'analyzing' || phase === 'done'}
            isDataReady={phase === 'done'}
            onProceed={handleProceed}
            onComplete={handleAgentsComplete}
          />
        </div>
      </div>
    </div>
  )
}
