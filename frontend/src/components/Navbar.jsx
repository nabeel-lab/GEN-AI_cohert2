import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/projects', label: 'Projects' },
  { path: '/consultant', label: 'AI Consultant' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, logout } = useAuth()

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious()
    if (latest > 50) {
      setIsScrolled(true)
      if (latest > previous && latest > 150) {
        setHidden(true)
      } else {
        setHidden(false)
      }
    } else {
      setIsScrolled(false)
      setHidden(false)
    }
  })

  return (
    <motion.nav
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: -100, opacity: 0 },
      }}
      animate={hidden ? 'hidden' : 'visible'}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-6 px-4 py-2 rounded-full transition-all duration-300 ${
        isScrolled ? 'bg-zinc-900/40 backdrop-blur-2xl border border-zinc-700/30 shadow-2xl shadow-black/40' : 'bg-transparent border border-transparent'
      }`}
    >
      <Link to="/" className="flex items-center gap-3 group mr-4">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:scale-125 transition-transform duration-300" />
        <span className="font-semibold text-zinc-100 tracking-tight text-[15px]">LaunchWise</span>
      </Link>

      <div className="hidden md:flex items-center gap-1">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.path
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`relative px-3 py-1.5 rounded-full text-[12px] font-medium tracking-wide whitespace-nowrap transition-colors ${
                isActive ? 'text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="navbar-active"
                  className="absolute inset-0 bg-zinc-800/80 rounded-full border border-zinc-700/50 -z-10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              {link.label}
            </Link>
          )
        })}
      </div>

      <div className="flex items-center gap-2 ml-4">
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-zinc-400 font-mono hidden sm:inline-block">{user.email}</span>
            <button 
              onClick={() => { logout(); navigate('/'); }}
              className="px-4 py-1.5 rounded-full border border-zinc-700 hover:bg-zinc-800 text-[12px] font-medium text-zinc-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="px-4 py-1.5 rounded-full bg-zinc-100 hover:bg-white text-black text-[12px] font-medium transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </motion.nav>
  )
}
