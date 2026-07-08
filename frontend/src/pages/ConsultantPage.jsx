import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, Bot, User, Loader2 } from 'lucide-react'

const SUGGESTED_PROMPTS = [
  "What business should I start with ₹10 Lakhs?",
  "Compare opening a Café vs a Gym in Bangalore.",
  "How does market density affect ROI in tier 2 cities?",
]

function formatMessageText(text) {
  // Split paragraphs / lines
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Match Markdown bolding, e.g. **💼 Business Agent:** or **📊 Market Agent:**
    const match = line.match(/^\*\*(.*?)\*\*(.*)$/);
    if (match) {
      const agentHeader = match[1];
      const agentText = match[2];
      
      // Determine premium theme classes for the agent badge
      let badgeColor = 'bg-zinc-800 text-zinc-300 border-zinc-700';
      if (agentHeader.includes('Business')) badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      else if (agentHeader.includes('Market')) badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      else if (agentHeader.includes('Finance') || agentHeader.includes('Economics')) badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      else if (agentHeader.includes('Location')) badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      else if (agentHeader.includes('Competitor')) badgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      else if (agentHeader.includes('Risk')) badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
      else if (agentHeader.includes('Decision') || agentHeader.includes('Panel')) badgeColor = 'bg-zinc-100/10 text-zinc-100 border-zinc-100/20';
      
      return (
        <div key={idx} className="mb-3 last:mb-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${badgeColor} mr-2 shadow-sm`}>
            {agentHeader}
          </span>
          <span className="text-zinc-300 leading-relaxed font-light">{agentText}</span>
        </div>
      );
    }
    return <p key={idx} className="mb-2 last:mb-0 font-light leading-relaxed text-zinc-300">{line}</p>;
  });
}

export default function ConsultantPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm your LaunchWise AI Consultant panel. Tell me about your business ideas, budget, or target market, and the specialized agents will help evaluate it!" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [extractedParams, setExtractedParams] = useState(null)
  const messagesEndRef = useRef(null)

  // Scroll to bottom whenever messages list or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend(text = input) {
    if (!text.trim() || loading) return
    
    const updatedMessages = [...messages, { role: 'user', text }]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const token = localStorage.getItem('lw_token')
      const res = await fetch('http://localhost:8000/consult', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messages: updatedMessages }),
      })

      if (!res.ok) {
        throw new Error(`Server returned error: ${res.status}`)
      }

      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }])
      
      if (data.is_ready_for_analysis) {
        setIsReady(true)
        setExtractedParams(data.extracted_params)
      } else {
        setIsReady(false)
        setExtractedParams(null)
      }
    } catch (err) {
      console.error("Consultation chat failed:", err)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: "⚠️ **System Error:** Failed to establish connection with the AI agent panel. Please ensure your backend is running and the Gemini API key is configured correctly in `.env`." 
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleConvertToProject() {
    if (!extractedParams) return
    const newProject = {
      id: crypto.randomUUID(),
      name: extractedParams.business_type || 'New Project',
      createdAt: new Date().toISOString(),
      report: null,
      answers: extractedParams
    }
    const stored = localStorage.getItem('lw_projects')
    const projects = stored ? JSON.parse(stored) : []
    const updated = [newProject, ...projects]
    localStorage.setItem('lw_projects', JSON.stringify(updated))
    navigate(`/analyze/${newProject.id}`)
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
        <header className="mb-8 text-center">
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={20} className="text-blue-400" />
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-zinc-100 mb-2">Strategic AI Consultant</h1>
          <p className="text-zinc-500 font-light text-sm">Brainstorm ideas with our 10-agent network before launching a full simulation.</p>
        </header>

        {/* Message Thread */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto mb-8 px-2 min-h-[350px]">
          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`px-5 py-4 rounded-2xl text-[15px] font-light leading-relaxed max-w-[85%] shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-zinc-800/80 border border-zinc-700/60 text-zinc-200'
                  : 'bg-zinc-900/50 border border-zinc-800/80 backdrop-blur-md'
              }`}>
                {msg.role === 'user' ? msg.text : formatMessageText(msg.text)}
              </div>
            </motion.div>
          ))}

          {/* Loader Indicator */}
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4 flex-row"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-400 border border-blue-500/20 flex-shrink-0">
                <Bot size={14} />
              </div>
              <div className="px-5 py-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 backdrop-blur-md flex items-center gap-3">
                <Loader2 size={16} className="text-zinc-500 animate-spin" />
                <span className="text-zinc-500 text-xs font-mono tracking-widest uppercase">Agents Discussing...</span>
              </div>
            </motion.div>
          )}

          {/* Action Card for Analysis Ready */}
          {isReady && extractedParams && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center shadow-lg"
            >
              <h3 className="text-lg font-medium text-blue-400 mb-2">Analysis Ready</h3>
              <p className="text-sm text-zinc-300 font-light mb-6">
                The panel has gathered enough context to run the full simulation.
              </p>
              <button
                onClick={handleConvertToProject}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 transition-colors"
              >
                Convert to Project & Analyze <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts (only visible when not busy loading) */}
        {!loading && (
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
        )}

        {/* Input Bar */}
        <div className="relative">
          <input 
            type="text" 
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={loading ? "Agents are reviewing..." : "Ask about a business idea, budget, or location..."}
            className="w-full bg-zinc-900/80 border border-zinc-700/50 focus:border-zinc-500 rounded-2xl pl-6 pr-14 py-4 text-zinc-100 placeholder-zinc-500 font-light focus:outline-none transition-all shadow-lg backdrop-blur-xl disabled:opacity-50"
          />
          <button 
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-zinc-800"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
