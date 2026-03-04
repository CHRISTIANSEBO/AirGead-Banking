import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { InvestmentParams } from '../types'
import { NLInput } from './NLInput'

interface SliderConfig {
  key: keyof InvestmentParams
  label: string
  min: number
  max: number
  step: number
  format: (v: number) => string
  emoji: string
}

const SLIDERS: SliderConfig[] = [
  {
    key: 'initialInvestment',
    label: 'Initial Investment',
    min: 0,
    max: 100_000,
    step: 500,
    format: v => `$${v.toLocaleString()}`,
    emoji: '💰',
  },
  {
    key: 'monthlyDeposit',
    label: 'Monthly Deposit',
    min: 0,
    max: 5_000,
    step: 25,
    format: v => `$${v.toLocaleString()}/mo`,
    emoji: '📅',
  },
  {
    key: 'annualInterestRate',
    label: 'Annual Interest Rate',
    min: 0.5,
    max: 20,
    step: 0.5,
    format: v => `${v}%`,
    emoji: '📈',
  },
  {
    key: 'years',
    label: 'Years to Invest',
    min: 1,
    max: 50,
    step: 1,
    format: v => `${v} yrs`,
    emoji: '⏳',
  },
]

interface InputPanelProps {
  params: InvestmentParams
  onChange: (params: InvestmentParams) => void
}

type TabId = 'sliders' | 'natural'

export function InputPanel({ params, onChange }: InputPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('sliders')

  const handleSlider = useCallback((key: keyof InvestmentParams, value: number) => {
    onChange({ ...params, [key]: value })
  }, [params, onChange])

  const handleNumberInput = useCallback((key: keyof InvestmentParams, raw: string) => {
    const parsed = parseFloat(raw)
    if (!isNaN(parsed)) onChange({ ...params, [key]: parsed })
  }, [params, onChange])

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Investment Parameters</h2>
        {/* Tab switcher */}
        <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs font-medium">
          {(['sliders', 'natural'] as TabId[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 transition-colors ${
                activeTab === tab ? 'tab-active' : 'tab-inactive'
              }`}
            >
              {tab === 'sliders' ? '🎛 Sliders' : '✏️ Describe'}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'sliders' ? (
          <motion.div
            key="sliders"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {SLIDERS.map(cfg => {
              const value = params[cfg.key] as number
              const pct = ((value - cfg.min) / (cfg.max - cfg.min)) * 100
              return (
                <div key={cfg.key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-slate-300 flex items-center gap-1.5">
                      <span>{cfg.emoji}</span>
                      {cfg.label}
                    </label>
                    <input
                      type="number"
                      value={value}
                      min={cfg.min}
                      max={cfg.max}
                      step={cfg.step}
                      onChange={e => handleNumberInput(cfg.key, e.target.value)}
                      className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-emerald-400 font-mono text-right focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min={cfg.min}
                      max={cfg.max}
                      step={cfg.step}
                      value={value}
                      onChange={e => handleSlider(cfg.key, parseFloat(e.target.value))}
                      className="input-slider w-full"
                      style={{ '--slider-value': `${pct}%` } as React.CSSProperties}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{cfg.format(cfg.min)}</span>
                    <span className="text-emerald-500 font-medium">{cfg.format(value)}</span>
                    <span>{cfg.format(cfg.max)}</span>
                  </div>
                </div>
              )
            })}
          </motion.div>
        ) : (
          <motion.div
            key="natural"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm text-slate-400 mb-3">
              Describe your investment goal in plain English. Our AI will extract the parameters for you.
            </p>
            <NLInput onParamsExtracted={p => { onChange(p); setActiveTab('sliders') }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
