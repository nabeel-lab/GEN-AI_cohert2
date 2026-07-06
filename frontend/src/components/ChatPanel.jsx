import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'

export default function ChatPanel({ sessionId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { type: 'assistant', text: 'Ask me anything about this analysis. I\'ll answer based on the actual data.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

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
    setMessages((m) => [...m, { type: 'user', text: userMsg }])
    setLoading(true)

    try {
      const res = await fetch(`/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, question: userMsg }),
      })
      const data = await res.json()
      setMessages((m) => [...m, { type: 'assistant', text: data.answer }])
    } catch (e) {
      setMessages((m) => [...m, { type: 'assistant', text: 'Sorry, I couldn\'t process that. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 left-6 z-40 w-96 max-w-[calc(100vw-3rem)]">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl glass border border-teal-500/30 hover:border-teal-500/50 text-teal-400 font-semibold text-sm transition-all hover:bg-teal-500/10"
        >
          <MessageCircle size={16} />
          AI Assistant
        </button>
      )}

      {isOpen && (
        <div className="glass rounded-2xl border border-white/10 shadow-2xl flex flex-col h-96 animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-teal-400" />
              <span className="font-semibold text-sm">AI Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-100 text-xl">×</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm leading-relaxed ${
                    msg.type === 'user'
                      ? 'bg-gold-500/20 text-slate-100'
                      : 'bg-white/5 text-slate-300'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 px-3 py-2 rounded-lg text-sm text-slate-400">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/5 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 rounded-lg bg-navy-700 border border-white/10 text-slate-100 text-sm placeholder-slate-600"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="p-2 rounded-lg bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 disabled:opacity-50 transition-all"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
