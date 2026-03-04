import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Milestone } from '../types'

interface MilestonesBadgesProps {
  milestones: Milestone[]
  isMillionaire: boolean
}

const MILESTONE_ICONS: Record<string, string> = {
  '$10K': '🌱',
  '$50K': '💵',
  '$100K': '🎯',
  '$250K': '💎',
  '$500K': '🔥',
  '$1M': '🏆',
}

export function MilestonesBadges({ milestones, isMillionaire }: MilestonesBadgesProps) {
  const confettiFiredRef = useRef(false)

  useEffect(() => {
    if (isMillionaire && !confettiFiredRef.current) {
      confettiFiredRef.current = true
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#f59e0b', '#ffffff', '#3b82f6'],
        })
        setTimeout(() => confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#10b981', '#f59e0b'],
        }), 300)
        setTimeout(() => confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#10b981', '#f59e0b'],
        }), 500)
      })
    }
    if (!isMillionaire) {
      confettiFiredRef.current = false
    }
  }, [isMillionaire])

  if (milestones.length === 0) return null

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        Milestones
        {isMillionaire && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="text-sm bg-gold-500/20 border border-gold-500/40 text-gold-400 px-2 py-0.5 rounded-full"
          >
            🏆 Millionaire!
          </motion.span>
        )}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <AnimatePresence>
          {milestones.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.05 }}
              className="milestone-badge rounded-xl"
            >
              <span className="text-2xl flex-shrink-0">{MILESTONE_ICONS[m.label] ?? '⭐'}</span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gold-400">{m.label}</p>
                {m.yearWithDeposit && (
                  <p className="text-xs text-slate-400 truncate">
                    With deposits: <span className="text-emerald-400">yr {m.yearWithDeposit}</span>
                  </p>
                )}
                {m.yearNoDeposit && (
                  <p className="text-xs text-slate-500 truncate">
                    Without: <span className="text-blue-400">yr {m.yearNoDeposit}</span>
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
