import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, X, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChatPanel({ sessionId, projectId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { type: 'assistant', text: 'Ask me anything about this analysis. I\'ll answer based on the actual data.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (projectId) {
      const stored = localStorage.getItem(`lw_chat_${projectId}`)
      if (stored) {
        try {
          setMessages(JSON.parse(stored))
        } catch (e) {}
      }
    }
  }, [projectId])

  useEffect(() => {
    if (projectId) {
      localStorage.setItem(`lw_chat_${projectId}`, JSON.stringify(messages))
    }
  }, [messages, projectId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function sendMessage() {
    if (!input.trim()) return

    const userMsg = input
    setInput('')
    
    // Map current message history before updating local state
    const history = messages
      .filter(m => m.text)
      .map(m => ({
        role: m.type === 'user' ? 'user' : 'model',
        text: m.text
      }))

    setMessages((m) => [...m, { type: 'user', text: userMsg }])
    setLoading(true)

    try {
      const token = localStorage.getItem('lw_token')
      const res = await fetch(`http://localhost:8000/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          session_id: sessionId, 
          question: userMsg,
          history: history
        }),
      })
      
      const text = await res.text()
      if (!res.ok) {
        let errMessage = 'Server error'
        try { errMessage = JSON.parse(text).detail || text } catch(e) {}
        throw new Error(errMessage)
      }
      
      const data = JSON.parse(text)
      if (!data.answer) throw new Error("No answer in response")

      setMessages((m) => [...m, { type: 'assistant', text: data.answer }])
    } catch (e) {
      console.error("Chat Error:", e)
      setMessages((m) => [...m, { 
        type: 'assistant', 
        text: `Sorry, I couldn't process that. Error: ${e.message || 'Unknown'}. Please make sure the backend is running.` 
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 left-6 z-40 w-[26rem] max-w-[calc(100vw-3rem)] font-sans">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-3 px-5 py-3.5 rounded-full border border-zinc-800 bg-zinc-900/80 backdrop-blur-md text-zinc-300 font-medium text-sm transition-all hover:bg-zinc-800 hover:text-white shadow-xl shadow-black/50"
          >
            <Activity size={16} className="text-zinc-500" />
            Strategic Advisor
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="border border-zinc-800 bg-zinc-900/60 backdrop-blur-2xl rounded-3xl shadow-2xl flex flex-col h-[32rem] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/50 bg-zinc-900/40">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-zinc-300" />
                <span className="font-semibold text-zinc-100 tracking-tight">Strategic Advisor</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                      msg.type === 'user'
                        ? 'bg-zinc-100 text-black font-medium rounded-br-sm'
                        : 'bg-zinc-800/50 text-zinc-300 border border-zinc-700/50 rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-zinc-800/30 px-5 py-3.5 rounded-2xl rounded-bl-sm text-sm text-zinc-500 flex items-center gap-2 border border-zinc-800/50">
                    <Activity size={14} className="animate-spin" /> Synthesizing...
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/40">
              <div className="flex gap-2 p-2 rounded-2xl bg-zinc-950/50 border border-zinc-800 focus-within:border-zinc-600 transition-colors">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask a question..."
                  className="flex-1 px-3 py-2 bg-transparent text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="p-3 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50 transition-all flex items-center justify-center"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
