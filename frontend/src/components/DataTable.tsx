import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CalculationResults, InvestmentParams } from '../types'
import { formatCurrency } from '../lib/calculator'

type TableTab = 'withDeposit' | 'noDeposit'

interface DataTableProps {
  results: CalculationResults
  params: InvestmentParams
}

export function DataTable({ results, params }: DataTableProps) {
  const [activeTab, setActiveTab] = useState<TableTab>('withDeposit')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10

  const rows = activeTab === 'withDeposit' ? results.withDeposit : results.noDeposit
  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const totalDeposited = (year: number) =>
    activeTab === 'withDeposit' ? params.monthlyDeposit * 12 * year : 0

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-white">Year-by-Year Breakdown</h2>
        <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs font-medium">
          <button
            onClick={() => { setActiveTab('withDeposit'); setPage(0) }}
            className={`px-3 py-1.5 transition-colors ${activeTab === 'withDeposit' ? 'tab-active' : 'tab-inactive'}`}
          >
            With Deposits
          </button>
          <button
            onClick={() => { setActiveTab('noDeposit'); setPage(0) }}
            className={`px-3 py-1.5 transition-colors ${activeTab === 'noDeposit' ? 'tab-active' : 'tab-inactive'}`}
          >
            Without Deposits
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 pr-4 text-slate-400 font-medium">Year</th>
              <th className="text-right py-2 pr-4 text-slate-400 font-medium">Balance</th>
              <th className="text-right py-2 pr-4 text-slate-400 font-medium">Interest</th>
              {activeTab === 'withDeposit' && (
                <th className="text-right py-2 text-slate-400 font-medium">Total Deposited</th>
              )}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="wait">
              {pageRows.map((row, i) => (
                <motion.tr
                  key={`${activeTab}-${row.year}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                    i % 2 === 0 ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <td className="py-2.5 pr-4 text-slate-400 font-mono">{row.year}</td>
                  <td className="py-2.5 pr-4 text-right font-mono text-emerald-400 font-medium">
                    {formatCurrency(row.balance)}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono text-slate-300">
                    {formatCurrency(row.interestEarned)}
                  </td>
                  {activeTab === 'withDeposit' && (
                    <td className="py-2.5 text-right font-mono text-gold-400">
                      {formatCurrency(totalDeposited(row.year))}
                    </td>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, rows.length)} of {rows.length} years
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-1 rounded glass-card disabled:opacity-30 hover:bg-white/10 transition-colors"
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-6 h-6 rounded text-center transition-colors ${
                  i === page ? 'bg-emerald-500 text-navy-900 font-semibold' : 'glass-card hover:bg-white/10'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-2 py-1 rounded glass-card disabled:opacity-30 hover:bg-white/10 transition-colors"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
