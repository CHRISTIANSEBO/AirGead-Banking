import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import type { CalculationResults, InvestmentParams } from '../types'
import { formatCurrency } from '../lib/calculator'

function AnimatedNumber({ target }: { target: number }) {
  const [displayed, setDisplayed] = useState(0)
  const frameRef = useRef<number>(0)
  const startRef = useRef<{ val: number; time: number } | null>(null)
  const DURATION = 1200

  useEffect(() => {
    const startVal = displayed
    startRef.current = { val: startVal, time: performance.now() }

    const animate = (now: number) => {
      const elapsed = now - (startRef.current?.time ?? now)
      const progress = Math.min(elapsed / DURATION, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(startVal + (target - startVal) * eased))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target])

  return <>{formatCurrency(displayed)}</>
}

interface StatCardProps {
  title: string
  finalBalance: number
  interest: number
  color: 'emerald' | 'blue'
  icon: string
}

function StatCard({ title, finalBalance, interest, color, icon }: StatCardProps) {
  const borderClass = color === 'emerald' ? 'border-emerald-500/30' : 'border-blue-500/30'
  const labelClass = color === 'emerald' ? 'text-emerald-400' : 'text-blue-400'
  const glowClass = color === 'emerald' ? 'emerald-glow' : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card ${borderClass} ${glowClass} p-5 space-y-3`}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-sm font-medium ${labelClass}`}>{title}</span>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-black text-white tracking-tight">
          <AnimatedNumber target={finalBalance} />
        </p>
        <p className="text-xs text-slate-500">
          Total interest: <span className={labelClass}><AnimatedNumber target={interest} /></span>
        </p>
      </div>
    </motion.div>
  )
}

interface ResultsDashboardProps {
  results: CalculationResults
  params: InvestmentParams
}

export function ResultsDashboard({ results, params }: ResultsDashboardProps) {
  const finalNoDeposit = results.noDeposit[results.noDeposit.length - 1]
  const finalWithDeposit = results.withDeposit[results.withDeposit.length - 1]

  const totalInterestNoDeposit = results.noDeposit.reduce((s, r) => s + r.interestEarned, 0)
  const totalInterestWithDeposit = results.withDeposit.reduce((s, r) => s + r.interestEarned, 0)
  const depositBoost = (finalWithDeposit?.balance ?? 0) - (finalNoDeposit?.balance ?? 0)
  const totalContributions = params.monthlyDeposit * 12 * params.years

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Your Projections</h2>
        <span className="text-xs text-slate-500">{params.years} year projection</span>
      </div>

      {/* Main stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Without Monthly Deposits"
          finalBalance={finalNoDeposit?.balance ?? 0}
          interest={totalInterestNoDeposit}
          color="blue"
          icon="🏦"
        />
        <StatCard
          title="With Monthly Deposits"
          finalBalance={finalWithDeposit?.balance ?? 0}
          interest={totalInterestWithDeposit}
          color="emerald"
          icon="🚀"
        />
      </div>

      {/* Deposit boost banner */}
      {depositBoost > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card border-gold-500/30 gold-glow px-5 py-4 flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Deposit boost</p>
            <p className="text-2xl font-black text-gold-400">
              +<AnimatedNumber target={depositBoost} />
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-0.5">Total contributed</p>
            <p className="text-lg font-bold text-slate-300">{formatCurrency(totalContributions)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-0.5">Return on contributions</p>
            <p className="text-lg font-bold text-gold-400">
              {totalContributions > 0
                ? `${((depositBoost / totalContributions) * 100).toFixed(0)}%`
                : '—'}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
