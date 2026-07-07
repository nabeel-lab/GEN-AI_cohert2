import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Bot, User } from 'lucide-react'

const SUGGESTED_PROMPTS = [
  "What business should I start with ₹10 Lakhs?",
  "Compare opening a Café vs a Gym in Bangalore.",
  "How does market density affect ROI in tier 2 cities?",
]

export default function ConsultantPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm your LaunchWise AI Consultant. Let's discuss your business ideas, budget, or market strategy before we run a full simulation." }
  ])
  const [input, setInput] = useState('')

  function handleSend(text = input) {
    if (!text.trim()) return
    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    
    // Mock response for demo
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: "That's an interesting direction. To give you a precise answer, I would recommend running a full 'Instant Business Simulation' using our 10-agent network. It will provide a comprehensive health score, competitor mapping, and ROI projection based on those exact parameters." 
      }])
    }, 1000)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-background text-zinc-100 flex flex-col pt-32 pb-10 px-6 font-sans relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.03),transparent_50%)] pointer-events-none" />
      
      <div className="max-w-3xl mx-auto w-full flex flex-col flex-1 relative z-10">
        <header className="mb-10 text-center">
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={20} className="text-blue-400" />
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-zinc-100 mb-2">Strategic AI Consultant</h1>
          <p className="text-zinc-500 font-light">Discuss ideas before launching a full simulation.</p>
        </header>

        <div className="flex-1 flex flex-col gap-6 overflow-y-auto mb-8 px-2">
          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-zinc-800 text-zinc-300' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`px-5 py-4 rounded-2xl text-[15px] font-light leading-relaxed max-w-[85%] ${
                msg.role === 'user' 
                  ? 'bg-zinc-800/80 border border-zinc-700 text-zinc-200'
                  : 'bg-zinc-900/50 border border-zinc-800/80 text-zinc-300 backdrop-blur-md'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          {SUGGESTED_PROMPTS.map((p, i) => (
            <button 
              key={i}
              onClick={() => handleSend(p)}
              className="text-[11px] font-medium text-zinc-400 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 hover:text-zinc-200 px-4 py-2 rounded-full transition-all"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about a business idea, budget, or location..."
            className="w-full bg-zinc-900/80 border border-zinc-700/50 focus:border-zinc-500 rounded-2xl pl-6 pr-14 py-4 text-zinc-100 placeholder-zinc-500 font-light focus:outline-none transition-all shadow-lg backdrop-blur-xl"
          />
          <button 
            onClick={() => handleSend()}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
