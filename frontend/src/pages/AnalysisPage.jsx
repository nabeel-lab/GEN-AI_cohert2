import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, ChevronRight,
  Store, MapPin, Wallet, FileText, AlertCircle,
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

  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers]         = useState({ business_type: '', location: '', budget: '', description: '' })
  const [inputVal, setInputVal]       = useState('')
  const [locationData, setLocationData] = useState(null) // rich picker output — lat/lng, address parts, place_id
  const [error, setError]             = useState('')

  // Analysis state
  const [phase, setPhase]         = useState('form')   // 'form' | 'analyzing' | 'done'
  const [apiError, setApiError]   = useState('')

  const step = STEPS[currentStep]

  // ── Validation ────────────────────────────────────────────────────────────
  function validate(val) {
    if (step.id === 'location') {
      return locationData ? '' : 'Please confirm a location on the map before continuing.'
    }
    const v = val.trim()
    if (!v) return 'Please fill in this field before continuing.'
    if (step.id === 'budget') {
      const n = parseFloat(v)
      if (isNaN(n) || n < 50_000)  return 'Minimum budget is ₹50,000.'
      if (n > 500_000_000)          return 'Please enter a realistic budget value.'
    }
    if (step.id === 'description' && v.length < 20) {
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
      setCurrentStep((s) => s + 1)
      setInputVal('')
    } else {
      // All steps filled — kick off analysis
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
    if (e.key === 'Enter' && step.type !== 'textarea') handleNext()
  }

  // ── API call ──────────────────────────────────────────────────────────────
  async function startAnalysis(data) {
    setPhase('analyzing')
    setApiError('')
    setAnimDone(false)

    try {
      const loc = data.location_data
      const payload = {
        business_type: data.business_type,
        location:      data.location,
        budget:        parseFloat(data.budget),
        description:   data.description,
        // Precise location data from the map picker — optional on the
        // backend, so this stays backward compatible if ever omitted.
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

      const res = await fetch('/api/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || `Server error: ${res.status}`)
      }

      const report = await res.json()
      // Store in sessionStorage so ResultsPage can pick it up without prop drilling
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

  // Live elapsed-time counter while agents are "running" — reinforces the
  // real-time feel of the analysis for the demo. Keeps counting across the
  // 'analyzing' → 'done' transition since that's still one continuous
  // visual sequence from the user's perspective.
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

  // Called by AgentStatusPanel once all 10 agents finish their visual sequence.
  const handleAgentsComplete = useCallback(() => {
    setAnimDone(true)
  }, [])

  // Navigate to /results only once BOTH the agent animation has finished AND
  // the API has actually returned a report — whichever finishes last wins.
  // This fixes a stuck-screen bug: previously, if the animation finished
  // before the API responded, nothing ever re-checked and the user was
  // stranded on the analyzing screen indefinitely.
  useEffect(() => {
    if (phase === 'done' && animDone) navigate('/results')
  }, [phase, animDone, navigate])

  return (
    <div className="min-h-screen bg-navy-gradient text-slate-100 flex flex-col">

      {/* ── Navbar ── */}
      <nav className="glass border-b border-white/5 px-6 h-16 flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          <span className="font-bold text-gold-gradient">LaunchWise AI</span>
        </div>
        {/* Step progress pills */}
        <div className="hidden sm:flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={[
                'w-2 h-2 rounded-full transition-all duration-300',
                i < currentStep  ? 'bg-emerald-400' :
                i === currentStep ? 'bg-gold-500 scale-125' :
                                    'bg-navy-600',
              ].join(' ')}
            />
          ))}
        </div>
      </nav>

      {/* ── Main layout ── */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full px-6 py-10 gap-8">

        {/* ── Left: Form / Analyzing state ── */}
        <div className="flex-1 flex flex-col justify-center">

          {phase === 'form' && (
            <div key={currentStep} className="max-w-xl w-full animate-fade-in-up">

              {/* Step counter */}
              <div className="flex items-center gap-2 mb-8">
                <span className="text-xs font-mono text-slate-500">
                  STEP {currentStep + 1} OF {STEPS.length}
                </span>
                <div className="flex-1 h-px bg-navy-700" />
                <span className="text-xs text-slate-600">
                  {Math.round(((currentStep) / STEPS.length) * 100)}% complete
                </span>
              </div>

              {/* Question */}
              <div className="flex items-start gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <step.icon size={18} className="text-gold-400" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-100 leading-snug">
                    {step.question}
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">{step.hint}</p>
                </div>
              </div>

              {/* Input */}
              {step.id === 'location' ? (
                <LocationPicker
                  initialQuery={answers.location}
                  initialLocation={answers.location_data || null}
                  onChange={(loc) => { setLocationData(loc); setError('') }}
                />
              ) : step.type === 'textarea' ? (
                <textarea
                  autoFocus
                  rows={4}
                  value={inputVal}
                  onChange={(e) => { setInputVal(e.target.value); setError('') }}
                  placeholder={step.placeholder}
                  className={[
                    'w-full bg-navy-800 border rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600',
                    'focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20',
                    'resize-none text-sm leading-relaxed transition-colors',
                    error ? 'border-red-500/50' : 'border-white/8',
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
                    'w-full bg-navy-800 border rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600',
                    'focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20',
                    'text-base transition-colors',
                    error ? 'border-red-500/50' : 'border-white/8',
                  ].join(' ')}
                />
              )}

              {/* Budget preview */}
              {step.id === 'budget' && inputVal && !isNaN(parseFloat(inputVal)) && (
                <p className="mt-2 text-gold-400 text-sm font-medium">
                  {formatBudget(inputVal)}
                </p>
              )}

              {/* Inline error */}
              {error && (
                <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {/* API error */}
              {apiError && (
                <div className="mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {apiError}
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={handleBack}
                  className="px-5 py-3 rounded-xl border border-white/8 text-slate-400 hover:text-slate-100 hover:border-white/15 transition-all text-sm"
                >
                  <ArrowLeft size={15} />
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gold-gradient text-navy-900 font-semibold text-sm hover:shadow-lg hover:shadow-gold-500/20 hover:scale-[1.02] active:scale-100 transition-all"
                >
                  {currentStep < STEPS.length - 1 ? (
                    <> Continue <ChevronRight size={16} /> </>
                  ) : (
                    <> Run Analysis <ArrowRight size={16} /> </>
                  )}
                </button>
              </div>

              {/* Previous answers summary */}
              {currentStep > 0 && (
                <div className="mt-8 pt-6 border-t border-white/5">
                  <p className="text-xs text-slate-600 mb-3 uppercase tracking-wider">Your answers so far</p>
                  <div className="flex flex-col gap-2">
                    {STEPS.slice(0, currentStep).map((s) => (
                      <div key={s.id} className="flex items-center gap-2 text-sm">
                        <s.icon size={12} className="text-slate-600 flex-shrink-0" />
                        <span className="text-slate-500 truncate">
                          {s.id === 'budget'
                            ? formatBudget(answers[s.id])
                            : answers[s.id]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analyzing state — left side shows summary card.
              Stays visible through 'done' too: 'done' only means the API
              resolved, not that the 10-agent visual sequence has finished. */}
          {(phase === 'analyzing' || phase === 'done') && (
            <div className="max-w-xl w-full animate-fade-in-up">
              <div className="glass-gold rounded-2xl p-8 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl animate-float">🚀</span>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">Analysis in progress</h2>
                    <p className="text-slate-400 text-sm">10 agents are working on your idea</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-mono text-gold-400 text-lg font-bold tabular-nums">
                      {String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:{String(elapsedSec % 60).padStart(2, '0')}
                    </span>
                    <p className="text-slate-600 text-xs">elapsed</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Store size={14} className="text-gold-400 flex-shrink-0" />
                    <span className="text-slate-300">{answers.business_type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={14} className="text-gold-400 flex-shrink-0" />
                    <span className="text-slate-300">{answers.location}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Wallet size={14} className="text-gold-400 flex-shrink-0" />
                    <span className="text-slate-300">{formatBudget(answers.budget)}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText size={14} className="text-gold-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-400 line-clamp-2 text-xs leading-relaxed">{answers.description}</span>
                  </div>
                </div>
              </div>
              <p className="text-slate-500 text-sm text-center animate-pulse">
                Generating your full intelligence report…
              </p>
            </div>
          )}
        </div>

        {/* ── Right: Agent Status Panel ── */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0">
          <AgentStatusPanel
            isRunning={phase === 'analyzing' || phase === 'done'}
            onComplete={handleAgentsComplete}
          />
        </div>
      </div>
    </div>
  )
}
