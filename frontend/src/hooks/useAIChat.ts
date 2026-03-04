import { useState, useCallback, useRef } from 'react'
import type { ChatMessage, InvestmentParams, CalculationResults } from '../types'

interface UseAIChatResult {
  messages: ChatMessage[]
  isStreaming: boolean
  error: string | null
  sendMessage: (text: string) => void
  startAdvice: (params: InvestmentParams, results: CalculationResults) => void
  clearError: () => void
}

export function useAIChat(): UseAIChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const streamFromAPI = useCallback(async (newMessages: ChatMessage[]) => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setIsStreaming(true)
    setError(null)

    // Optimistically add an empty assistant message to start streaming into
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        const err = await response.text()
        throw new Error(err || `HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                accumulated += parsed.text
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'assistant', content: accumulated }
                  return updated
                })
              }
            } catch {
              // Skip malformed SSE data
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Failed to connect to AI advisor'
      setError(msg)
      // Remove the empty assistant message on error
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsStreaming(false)
    }
  }, [])

  const sendMessage = useCallback((text: string) => {
    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages(prev => {
      const updated = [...prev, userMsg]
      streamFromAPI(updated)
      return updated
    })
  }, [streamFromAPI])

  const startAdvice = useCallback((params: InvestmentParams, results: CalculationResults) => {
    const finalNoDep = results.noDeposit[results.noDeposit.length - 1]
    const finalWithDep = results.withDeposit[results.withDeposit.length - 1]

    const content = [
      `Here are the investment details:`,
      `- Initial investment: $${params.initialInvestment.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `- Monthly deposit: $${params.monthlyDeposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `- Annual rate: ${params.annualInterestRate}%`,
      `- Period: ${params.years} years`,
      ``,
      `Results after ${params.years} years:`,
      `- Without monthly deposits → $${finalNoDep?.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `- With monthly deposits → $${finalWithDep?.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `- Extra from deposits: $${((finalWithDep?.balance ?? 0) - (finalNoDep?.balance ?? 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ``,
      `Please provide:`,
      `1. A plain-English explanation of what these numbers mean`,
      `2. One concrete takeaway about the power of regular contributions`,
      `3. One practical tip the student can act on today`,
      `4. A brief note on whether the interest rate is realistic`,
    ].join('\n')

    const initialMsg: ChatMessage = { role: 'user', content }
    setMessages([])
    streamFromAPI([initialMsg])
  }, [streamFromAPI])

  const clearError = useCallback(() => setError(null), [])

  return { messages, isStreaming, error, sendMessage, startAdvice, clearError }
}
