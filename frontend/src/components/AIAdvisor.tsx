import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { InvestmentParams, CalculationResults } from '../types'
import { useAIChat } from '../hooks/useAIChat'

interface AIAdvisorProps {
  params: InvestmentParams
  results: CalculationResults
  aiAvailable: boolean
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-2 px-4">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-emerald-500"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

export function AIAdvisor({ params, results, aiAvailable }: AIAdvisorProps) {
  const { messages, isStreaming, error, sendMessage, startAdvice, clearError } = useAIChat()
  const [input, setInput] = useState('')
  const [hasStarted, setHasStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  function handleStart() {
    setHasStarted(true)
    startAdvice(params, results)
  }

  function handleSend() {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    sendMessage(text)
  }

  if (!aiAvailable) {
    return (
      <div className="glass-card p-6 space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>🤖</span> AI Financial Advisor
        </h2>
        <div className="text-center py-8 space-y-3">
          <span className="text-4xl">🔑</span>
          <p className="text-slate-400 text-sm">
            Set the <code className="bg-white/10 px-1.5 py-0.5 rounded text-emerald-400">ANTHROPIC_API_KEY</code> environment variable and restart the backend to unlock AI-powered advice.
          </p>
          <p className="text-slate-500 text-xs">
            Run: <code className="bg-white/10 px-1.5 py-0.5 rounded">uvicorn api:app --reload</code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-6 flex flex-col space-y-4" style={{ minHeight: '420px' }}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <motion.span
            animate={{ rotate: isStreaming ? [0, 10, -10, 0] : 0 }}
            transition={{ duration: 0.5, repeat: isStreaming ? Infinity : 0 }}
          >
            🤖
          </motion.span>
          AI Financial Advisor
          {isStreaming && (
            <span className="text-xs text-emerald-400 font-normal animate-pulse">Thinking...</span>
          )}
        </h2>
        <span className="text-xs text-slate-500 glass-card px-2 py-1">Powered by Claude</span>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] max-h-[340px] pr-1">
        {!hasStarted && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-10 space-y-4"
          >
            <span className="text-5xl">💡</span>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              Get personalized advice on your investment plan from our AI advisor.
            </p>
            <button
              onClick={handleStart}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-navy-900 font-semibold rounded-xl transition-colors emerald-glow text-sm"
            >
              Get My Advice ✨
            </button>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user'
            // Don't show the initial system-context user message
            if (i === 0 && isUser && msg.content.startsWith('Here are the investment details:')) {
              return null
            }
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                  {!isUser && (
                    <p className="text-xs text-emerald-500 font-medium mb-1">Advisor</p>
                  )}
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                    {i === messages.length - 1 && isStreaming && !isUser && (
                      <span className="inline-block w-0.5 h-4 bg-emerald-400 ml-0.5 animate-pulse align-middle" />
                    )}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {isStreaming && messages.length === 0 && <TypingIndicator />}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card border-red-500/30 px-4 py-3 text-sm text-red-400 flex items-center justify-between"
          >
            <span>{error}</span>
            <button onClick={clearError} className="text-red-400/60 hover:text-red-400 ml-3">✕</button>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      {hasStarted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask a follow-up question..."
            disabled={isStreaming}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-navy-900 font-semibold rounded-xl transition-colors text-sm"
          >
            Send
          </button>
        </motion.div>
      )}
    </div>
  )
}
