import type { InvestmentParams, InvestmentRecord, CalculationResults, Milestone } from '../types'

/**
 * Calculate yearly balances WITHOUT monthly deposits.
 * Uses simple annual compounding (mirrors Python/C++ original).
 */
export function calcNoDeposit(params: InvestmentParams): InvestmentRecord[] {
  let balance = params.initialInvestment
  return Array.from({ length: params.years }, (_, i) => {
    const interestEarned = balance * (params.annualInterestRate / 100)
    balance += interestEarned
    return { year: i + 1, balance, interestEarned }
  })
}

/**
 * Calculate yearly balances WITH monthly deposits.
 * Uses monthly compounding with monthly contributions (mirrors Python/C++ original).
 */
export function calcWithDeposit(params: InvestmentParams): InvestmentRecord[] {
  let balance = params.initialInvestment
  const monthlyRate = params.annualInterestRate / 100 / 12
  return Array.from({ length: params.years }, (_, i) => {
    let totalInterest = 0
    for (let m = 0; m < 12; m++) {
      balance += params.monthlyDeposit
      const interest = balance * monthlyRate
      balance += interest
      totalInterest += interest
    }
    return { year: i + 1, balance, interestEarned: totalInterest }
  })
}

/**
 * Run both calculations and return combined results.
 */
export function calculate(params: InvestmentParams): CalculationResults {
  return {
    noDeposit: calcNoDeposit(params),
    withDeposit: calcWithDeposit(params),
  }
}

/**
 * Find the year a milestone amount is first reached in a results array.
 * Returns null if never reached within the projection period.
 */
function findMilestoneYear(records: InvestmentRecord[], amount: number): number | null {
  const record = records.find(r => r.balance >= amount)
  return record ? record.year : null
}

const MILESTONE_AMOUNTS = [10_000, 50_000, 100_000, 250_000, 500_000, 1_000_000]
const MILESTONE_LABELS: Record<number, string> = {
  10_000: '$10K',
  50_000: '$50K',
  100_000: '$100K',
  250_000: '$250K',
  500_000: '$500K',
  1_000_000: '$1M',
}

/**
 * Detect which financial milestones are hit and when.
 */
export function getMilestones(results: CalculationResults): Milestone[] {
  return MILESTONE_AMOUNTS.map(amount => ({
    amount,
    label: MILESTONE_LABELS[amount],
    yearNoDeposit: findMilestoneYear(results.noDeposit, amount),
    yearWithDeposit: findMilestoneYear(results.withDeposit, amount),
  })).filter(m => m.yearNoDeposit !== null || m.yearWithDeposit !== null)
}

/**
 * Format a dollar amount to a compact string like $1.2M or $450K.
 */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

/**
 * Format a dollar amount with full precision like $1,234,567.89.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}
