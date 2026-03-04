import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { InvestmentParams } from './types'
import { useCalculator } from './hooks/useCalculator'
import { Hero } from './components/Hero'
import { InputPanel } from './components/InputPanel'
import { ResultsDashboard } from './components/ResultsDashboard'
import { GrowthChart } from './components/GrowthChart'
import { MilestonesBadges } from './components/MilestonesBadges'
import { DataTable } from './components/DataTable'
import { AIAdvisor } from './components/AIAdvisor'

const DEFAULT_PARAMS: InvestmentParams = {
  initialInvestment: 5000,
  monthlyDeposit: 200,
  annualInterestRate: 7,
  years: 20,
}

export default function App() {
  const [params, setParams] = useState<InvestmentParams>(DEFAULT_PARAMS)
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null)

  const { results, milestones, isMillionaire } = useCalculator(params)

  // Check if the FastAPI backend is running and has an API key
  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(data => setAiAvailable(data.ai_available === true))
      .catch(() => setAiAvailable(false))
  }, [])

  return (
    <div className="min-h-screen bg-navy-900 selection:bg-emerald-500/30">
      {/* Hero */}
      <Hero />

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 pb-20 space-y-8">
        {/* Top row: Input + Projections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <InputPanel params={params} onChange={setParams} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ResultsDashboard results={results} params={params} />
          </motion.div>
        </div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <GrowthChart results={results} />
        </motion.div>

        {/* Milestones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <MilestonesBadges milestones={milestones} isMillionaire={isMillionaire} />
        </motion.div>

        {/* Data Table + AI Advisor */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <DataTable results={results} params={params} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            <AIAdvisor
              params={params}
              results={results}
              aiAvailable={aiAvailable === true}
            />
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="text-center text-slate-600 text-xs pt-4 border-t border-white/5">
          AirGead Banking · Investment Calculator · Built with React + TypeScript + Claude AI
        </footer>
      </div>
    </div>
  )
}
