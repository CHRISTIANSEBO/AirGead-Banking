import { useMemo } from 'react'
import type { InvestmentParams, CalculationResults } from '../types'
import { calculate, getMilestones } from '../lib/calculator'
import type { Milestone } from '../types'

interface UseCalculatorResult {
  results: CalculationResults
  milestones: Milestone[]
  isMillionaire: boolean
}

export function useCalculator(params: InvestmentParams): UseCalculatorResult {
  return useMemo(() => {
    const results = calculate(params)
    const milestones = getMilestones(results)
    const finalWithDeposit = results.withDeposit[results.withDeposit.length - 1]
    const isMillionaire = finalWithDeposit?.balance >= 1_000_000 || false
    return { results, milestones, isMillionaire }
  }, [
    params.initialInvestment,
    params.monthlyDeposit,
    params.annualInterestRate,
    params.years,
  ])
}
