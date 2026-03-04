import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { InvestmentParams } from '../types'

interface NLInputProps {
  onParamsExtracted: (params: InvestmentParams) => void
}

type ParseState = 'idle' | 'loading' | 'clarifying' | 'success'

export function NLInput({ onParamsExtracted }: NLInputProps) {
  const [text, setText] = useState('')
  const [parseState, setParseState] = useState<ParseState>('idle')
  const [clarifyQuestion, setClarifyQuestion] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!text.trim() || parseState === 'loading') return
    setParseState('loading')
    setError('')
    setClarifyQuestion('')

    try {
      const res = await fetch('/api/parse-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()

      if (data.tool === 'run_investment_calculator') {
        setParseState('success')
        onParamsExtracted({
          initialInvestment: data.params.initial_investment,
          monthlyDeposit: data.params.monthly_deposit,
          annualInterestRate: data.params.annual_interest_rate,
          years: data.params.years,
        })
        setText('')
        setTimeout(() => setParseState('idle'), 2000)
      } else if (data.tool === 'request_clarification') {
        setParseState('clarifying')
        setClarifyQuestion(data.question)
      } else {
        setParseState('idle')
        setError('Could not parse your goal. Please try again.')
      }
    } catch {
      setParseState('idle')
      setError('AI service unavailable. Please use the manual sliders.')
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
          }}
          placeholder={`Describe your goal in plain English...\ne.g. "I have $5k saved, can add $200/month, expecting 7%, retiring in 25 years"`}
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
          disabled={parseState === 'loading'}
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || parseState === 'loading'}
          className="absolute bottom-3 right-3 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-navy-900 text-xs font-semibold rounded-lg transition-colors"
        >
          {parseState === 'loading' ? (
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 border-2 border-navy-900/50 border-t-navy-900 rounded-full animate-spin" />
              Parsing...
            </span>
          ) : (
            '⌘↵ Parse'
          )}
        </button>
      </div>

      <AnimatePresence>
        {parseState === 'clarifying' && clarifyQuestion && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card border-gold-500/30 px-4 py-3 text-sm text-gold-400"
          >
            <span className="font-semibold">AI needs more info: </span>
            {clarifyQuestion}
          </motion.div>
        )}
        {parseState === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card border-emerald-500/30 px-4 py-3 text-sm text-emerald-400"
          >
            ✓ Parameters extracted! Sliders updated.
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
