import { motion } from 'framer-motion'

export function Hero() {
  return (
    <div className="relative overflow-hidden py-16 px-4 star-field">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], x: [0, 20, 0], y: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.3, 1], x: [0, -20, 0], y: [0, 10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 glass-card px-4 py-2 text-sm text-emerald-400 mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Powered by AI · Real-time Calculations
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black mb-4 leading-none tracking-tight"
        >
          <span className="gradient-text">AirGead</span>
          <br />
          <span className="text-white">Banking</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed"
        >
          Watch your money grow in real time.{' '}
          <span className="text-emerald-400">Compound interest</span> visualized beautifully —
          with an <span className="text-gold-400">AI advisor</span> to guide you.
        </motion.p>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="flex flex-wrap justify-center gap-6 text-sm text-slate-500"
        >
          {[
            { icon: '📈', text: 'Live projections' },
            { icon: '🤖', text: 'AI-powered advice' },
            { icon: '🎯', text: 'Milestone tracking' },
            { icon: '📊', text: 'Interactive charts' },
          ].map(({ icon, text }) => (
            <span key={text} className="flex items-center gap-1.5">
              <span>{icon}</span>
              <span>{text}</span>
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
