import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { CalculationResults } from '../types'
import { formatCompact, formatCurrency } from '../lib/calculator'

interface GrowthChartProps {
  results: CalculationResults
}

interface ChartDataPoint {
  year: number
  withDeposit: number
  noDeposit: number
  interestWithDeposit: number
  interestNoDeposit: number
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card border-white/20 px-4 py-3 text-sm space-y-2 shadow-xl">
      <p className="text-slate-300 font-semibold border-b border-white/10 pb-1 mb-2">
        Year {label}
      </p>
      {payload.map(entry => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
            <span className="text-slate-400">{entry.name}</span>
          </span>
          <span className="font-mono font-semibold" style={{ color: entry.color }}>
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function GrowthChart({ results }: GrowthChartProps) {
  const data: ChartDataPoint[] = results.withDeposit.map((wd, i) => ({
    year: wd.year,
    withDeposit: Math.round(wd.balance),
    noDeposit: Math.round(results.noDeposit[i]?.balance ?? 0),
    interestWithDeposit: Math.round(wd.interestEarned),
    interestNoDeposit: Math.round(results.noDeposit[i]?.interestEarned ?? 0),
  }))

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Growth Over Time</h2>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-0.5 bg-emerald-500 rounded" />
            With deposits
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-0.5 bg-blue-500 rounded" />
            Without deposits
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorWithDeposit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="colorNoDeposit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="year"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
            label={{ value: 'Year', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 11 }}
          />
          <YAxis
            tickFormatter={formatCompact}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={65}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#64748b', paddingTop: '8px' }}
            iconType="circle"
            iconSize={8}
          />
          <Area
            type="monotone"
            dataKey="noDeposit"
            name="Without Deposits"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorNoDeposit)"
            animationDuration={800}
          />
          <Area
            type="monotone"
            dataKey="withDeposit"
            name="With Deposits"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#colorWithDeposit)"
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
