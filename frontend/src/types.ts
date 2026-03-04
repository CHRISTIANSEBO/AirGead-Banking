export interface InvestmentRecord {
  year: number
  balance: number
  interestEarned: number
}

export interface InvestmentParams {
  initialInvestment: number  // dollars
  monthlyDeposit: number     // dollars
  annualInterestRate: number // percent (e.g. 7 = 7%)
  years: number              // whole number
}

export interface CalculationResults {
  noDeposit: InvestmentRecord[]
  withDeposit: InvestmentRecord[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface Milestone {
  amount: number
  label: string
  yearNoDeposit: number | null
  yearWithDeposit: number | null
}
