import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { DEMO_SCENARIOS } from '../data/demoScenarios'

// ─────────────────────────────────────────────────────────────────────────────
// FORCE_TOUR = true  → Always show tour (development mode, ignores localStorage)
// FORCE_TOUR = false → Normal first-visit logic
const FORCE_TOUR = false
// ─────────────────────────────────────────────────────────────────────────────

const TOUR_STEPS = [
  {
    title: 'Welcome to LaunchWise AI',
    description: 'The ultimate decision intelligence platform for entrepreneurs. We simulate your business launch before you invest real capital.',
    selector: null,
    path: '/',
    dialogPosition: 'center',
  },
  {
    title: 'Navigation',
    description: 'The floating glass navbar gives you instant access to your Analysis tool, AI Consultant, Analytics dashboard, and User Guide.',
    selector: 'nav',
    path: '/',
    dialogPosition: 'below',
  },
  {
    title: 'The Hero',
    description: "LaunchWise AI's core promise: simulate your business idea with 10 AI agents before spending a single rupee on execution.",
    selector: '.tour-step-hero',
    path: '/',
    dialogPosition: 'center',
  },
  {
    title: 'Start Your Analysis',
    description: 'Click here to evaluate a business idea. Enter your concept, target location, and available budget to trigger the full orchestration network.',
    selector: '.tour-step-cta',
    path: '/',
    dialogPosition: 'above',
  },
  {
    title: 'Live Business Simulations',
    description: 'Try pre-generated full executive reports for real-world business scenarios — instantly, without running a new analysis.',
    selector: '.tour-step-simulation',
    path: '/',
    dialogPosition: 'above',
  },
  {
    title: '10 AI Agents',
    description: 'Our decentralized multi-agent network runs in parallel. Each agent owns a specific domain: market research, financials, risk, location, and more.',
    selector: '.tour-step-agents',
    path: '/',
    dialogPosition: 'above',
  },
  {
    title: 'Business Analysis Report',
    description: 'This is the top of your executive report — Business type, location, the AI verdict, Business Health Score, and risk classification.',
    selector: '.tour-step-analysis',
    path: '/results',
    dialogPosition: 'below',
  },
  {
    title: 'Executive Intelligence Brief',
    description: 'The synthesized Go/No-Go verdict from the orchestrator, including the Business Health Score and core strategic reasoning.',
    selector: '.tour-step-brief',
    path: '/results',
    dialogPosition: 'below',
  },
  {
    title: 'Simulation Engine',
    description: 'Adjust variables like rent, marketing budget, and pricing in real-time. Watch how each change ripples through your 12-month projections.',
    selector: '.tour-step-engine',
    path: '/results',
    dialogPosition: 'above',
  },
  {
    title: 'Strategic AI Advisor',
    description: 'Chat with our context-aware AI consultant. Ask follow-up questions, explore alternative strategies, and refine your decision.',
    selector: '.tour-step-advisor',
    path: '/results',
    dialogPosition: 'above',
  },
  {
    title: 'Google Maps Intelligence',
    description: 'See exactly where your business should launch. The map overlays foot traffic, competitor density, and accessibility — all from Google Maps API.',
    selector: '.tour-step-maps',
    path: '/results',
    dialogPosition: 'above',
  },
  {
    title: 'Export & Reports',
    description: 'Generate a complete, shareable executive brief for stakeholders, investors, or internal review. Export instantly.',
    selector: '.tour-step-reports',
    path: '/results',
    dialogPosition: 'above',
  },
  {
    title: 'You\'re All Set',
    description: 'You\'ve completed the LaunchWise AI tour. Start by analyzing your own idea — or explore one of the live simulations to see it in action.',
    selector: null,
    path: '/results',
    dialogPosition: 'center',
  },
]

// ─────────────────────────────────────────────────────────────────────────────

function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ProductTour() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)          // Spotlight rect
  const [ready, setReady] = useState(false)        // True once we are on correct page

  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { width: vw, height: vh } = useWindowSize()

  // Ref to track if we triggered a navigation (to avoid double-effect)
  const navigatedRef = useRef(false)
  const findTimerRef = useRef(null)

  // ── Start tour ────────────────────────────────────────────────────────────
  useEffect(() => {
    const seen = localStorage.getItem('lw_has_seen_tour')
    if (FORCE_TOUR || !seen) {
      const t = setTimeout(() => {
        setIsOpen(true)
      }, 1200)
      return () => clearTimeout(t)
    }
  }, [])

  // ── Spotlight measurement ─────────────────────────────────────────────────
  const measureElement = useCallback((selector) => {
    if (!selector) { setRect(null); return }

    if (findTimerRef.current) clearTimeout(findTimerRef.current)

    const attempt = (tries = 0) => {
      const el = document.querySelector(selector)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Wait for scroll to finish before measuring
        findTimerRef.current = setTimeout(() => {
          const r = el.getBoundingClientRect()
          setRect({ x: r.left, y: r.top, w: r.width, h: r.height })
        }, 450)
      } else if (tries < 8) {
        findTimerRef.current = setTimeout(() => attempt(tries + 1), 200)
      } else {
        console.warn(`[ProductTour] Giving up on selector: ${selector}`)
        setRect(null)
      }
    }
    attempt()
  }, [])

  // ── Effect 1: When step changes ───────────────────────────────────────────
  // Handles navigation and triggers spotlight when on the right page.
  useEffect(() => {
    if (!isOpen) return

    const config = TOUR_STEPS[step]
    setRect(null)    // Clear old spotlight instantly
    setReady(false)

    if (pathname !== config.path) {
      // Need to navigate first — Effect 2 will pick this up
      navigatedRef.current = true
      if (config.path === '/results' && !sessionStorage.getItem('lw_report')) {
        sessionStorage.setItem('lw_report', JSON.stringify(DEMO_SCENARIOS[0].report))
      }
      navigate(config.path)
    } else {
      // Already on correct page
      setReady(true)
    }
  }, [step, isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 2: When pathname changes ───────────────────────────────────────
  // If we triggered navigation in Effect 1, wait for the page to mount then highlight.
  useEffect(() => {
    if (!isOpen || !navigatedRef.current) return
    navigatedRef.current = false

    const config = TOUR_STEPS[step]
    if (pathname === config.path) {
      // Give the page components time to mount
      findTimerRef.current = setTimeout(() => {
        setReady(true)
      }, 700)
    }
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 3: When ready → measure spotlight ──────────────────────────────
  useEffect(() => {
    if (!isOpen || !ready) return
    const config = TOUR_STEPS[step]
    measureElement(config.selector)
  }, [ready, isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => { if (findTimerRef.current) clearTimeout(findTimerRef.current) }
  }, [])

  // ── Controls ──────────────────────────────────────────────────────────────
  function next() {
    if (step < TOUR_STEPS.length - 1) setStep(s => s + 1)
    else finish(true)
  }
  function prev() {
    if (step > 0) setStep(s => s - 1)
  }
  function finish(neverShowAgain = false) {
    setIsOpen(false)
    setRect(null)
    if (neverShowAgain && !FORCE_TOUR) {
      localStorage.setItem('lw_has_seen_tour', 'true')
    }
  }

  // ── SVG Spotlight geometry ────────────────────────────────────────────────
  const PAD = 14
  const RADIUS = 16

  // Spotlight rectangle with padding
  const sx = rect ? rect.x - PAD : 0
  const sy = rect ? rect.y - PAD : 0
  const sw = rect ? rect.w + PAD * 2 : 0
  const sh = rect ? rect.h + PAD * 2 : 0

  // Dialog position
  function getDialogStyle() {
    if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

    const dialogH = 280
    const dialogW = Math.min(420, vw - 40)
    const margin = 20

    const config = TOUR_STEPS[step]
    const spaceBelow = vh - (rect.y + rect.h + PAD)
    const spaceAbove = rect.y - PAD

    let top, left

    if (config.dialogPosition === 'below' || (config.dialogPosition !== 'above' && spaceBelow > dialogH + margin)) {
      top = sy + sh + margin
    } else if (spaceAbove > dialogH + margin) {
      top = sy - dialogH - margin
    } else {
      top = Math.max(margin, Math.min(sy, vh - dialogH - margin))
    }

    // Horizontal center: align to spotlight, clamp to viewport
    left = sx + sw / 2 - dialogW / 2
    left = Math.max(margin, Math.min(left, vw - dialogW - margin))

    return { position: 'fixed', top, left, width: dialogW }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'none' }}>

      {/* ── SVG Overlay with Spotlight Mask ─────────────────────────────── */}
      <svg
        width={vw}
        height={vh}
        style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none' }}
      >
        <defs>
          <mask id="pt-mask">
            {/* White = overlay visible (dark) */}
            <rect x="0" y="0" width={vw} height={vh} fill="white" />
            {/* Black = overlay transparent (spotlight = bright) */}
            {rect && (
              <rect
                x={sx} y={sy}
                width={sw} height={sh}
                rx={RADIUS} ry={RADIUS}
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Dark overlay, punched out at spotlight */}
        <rect
          x="0" y="0"
          width={vw} height={vh}
          fill="rgba(6, 6, 10, 0.82)"
          mask="url(#pt-mask)"
        />

        {/* Spotlight glow ring */}
        {rect && (
          <rect
            x={sx - 1} y={sy - 1}
            width={sw + 2} height={sh + 2}
            rx={RADIUS + 1} ry={RADIUS + 1}
            fill="none"
            stroke="rgba(59, 130, 246, 0.4)"
            strokeWidth="1.5"
          />
        )}
      </svg>

      {/* ── Tour Dialog ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ ...getDialogStyle(), pointerEvents: 'auto', position: 'fixed', zIndex: 10000 }}
          className="bg-[#0e0e12] border border-zinc-700/60 rounded-2xl shadow-2xl shadow-black overflow-hidden backdrop-blur-2xl"
        >
          {/* Blue accent top bar */}
          <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-400" />

          <div className="p-6">
            {/* Progress dots */}
            <div className="flex items-center gap-1.5 mb-5">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                    i === step ? 'bg-blue-400 w-5' : i < step ? 'bg-blue-800 w-2' : 'bg-zinc-700 w-2'
                  }`}
                />
              ))}
              <span className="ml-auto text-[11px] font-mono text-zinc-600">
                {step + 1}/{TOUR_STEPS.length}
              </span>
            </div>

            {/* Content */}
            <h2 className="text-[18px] font-semibold tracking-tight text-zinc-100 mb-2 leading-snug">
              {TOUR_STEPS[step].title}
            </h2>
            <p className="text-[13px] text-zinc-400 font-light leading-relaxed min-h-[52px]">
              {TOUR_STEPS[step].description}
            </p>

            {/* Controls */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800/60">
              <button
                onClick={() => finish(true)}
                className="text-[11px] text-zinc-600 hover:text-zinc-400 font-medium transition-colors tracking-wider uppercase"
              >
                Never Show Again
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={prev}
                  disabled={step === 0}
                  className="p-2 rounded-lg bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowLeft size={14} />
                </button>

                <button
                  onClick={() => finish(false)}
                  className="px-3 py-2 text-[11px] text-zinc-500 hover:text-zinc-300 font-medium transition-colors rounded-lg hover:bg-zinc-800/60"
                >
                  Skip
                </button>

                <button
                  onClick={next}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-semibold text-[13px] transition-all shadow-[0_0_16px_rgba(59,130,246,0.35)] hover:shadow-[0_0_24px_rgba(59,130,246,0.5)]"
                >
                  {step === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                  {step < TOUR_STEPS.length - 1 && <ArrowRight size={14} />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
