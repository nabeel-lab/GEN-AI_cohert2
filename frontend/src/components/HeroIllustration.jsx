import { motion } from 'framer-motion'
import { Activity, Target } from 'lucide-react'

export default function HeroIllustration() {
  return (
    <div className="relative w-full flex items-center justify-center pointer-events-none select-none">

      {/* ── Ambient color blob — matches the photo's dark navy background ── */}
      {/* This is what makes the photo feel part of the page, not floating on it */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 90% 85% at 55% 48%, #090e1f 0%, #060a18 35%, transparent 72%)',
        }}
      />

      {/* ── Floating image with edge-fading mask applied directly to wrapper ── */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-full"
        style={{
          // Mask fades all 4 edges of the JPEG to transparent so it merges with the ambient blob
          maskImage: [
            'linear-gradient(to right,  transparent 0%, black 12%, black 88%, transparent 100%)',
            'linear-gradient(to bottom, transparent 0%, black 6%,  black 82%, transparent 100%)',
          ].join(', '),
          WebkitMaskImage: [
            'linear-gradient(to right,  transparent 0%, black 12%, black 88%, transparent 100%)',
            'linear-gradient(to bottom, transparent 0%, black 6%,  black 82%, transparent 100%)',
          ].join(', '),
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in',
        }}
      >
        <img
          src="/hero-illustration.jpeg"
          alt="LaunchWise AI — Business analyst presenting holographic analytics dashboards"
          className="w-full h-auto max-w-[640px] mx-auto"
          draggable={false}
          loading="eager"
        />

        {/* Floating Confidence Score */}
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [-1, 1, -1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-[22%] right-[8%] px-3 py-1.5 rounded-lg bg-[#0a0e1f]/80 border border-blue-800/40 backdrop-blur-md shadow-2xl flex items-center gap-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest">94% Confidence</span>
        </motion.div>

        {/* Growth badge */}
        <motion.div
          animate={{ y: [0, 8, 0], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-[28%] left-[4%] p-2 rounded-xl bg-[#0a0e1f]/80 border border-blue-900/40 backdrop-blur-md flex flex-col items-center justify-center shadow-lg"
        >
          <Target size={16} className="text-emerald-400 mb-1" />
          <div className="text-[9px] font-medium text-zinc-400 uppercase tracking-widest">Growth</div>
        </motion.div>

        {/* Subtle pulsing node */}
        <motion.div
          animate={{ opacity: [0, 0.8, 0], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute top-[44%] left-[44%] w-1.5 h-1.5 bg-cyan-300 rounded-full blur-[1px]"
        />
      </motion.div>

      {/* Subtle floating particles */}
      <motion.div
        animate={{ opacity: [0.1, 0.4, 0.1], y: [0, -8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[18%] right-[18%] w-1 h-1 bg-cyan-300 rounded-full blur-[1px]"
      />
      <motion.div
        animate={{ opacity: [0.1, 0.35, 0.1], y: [0, 6, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        className="absolute bottom-[22%] left-[12%] w-1 h-1 bg-blue-400 rounded-full blur-[1px]"
      />
    </div>
  )
}
