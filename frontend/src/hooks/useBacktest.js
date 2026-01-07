import { useState } from 'react'

export function useBacktest() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const runBacktest = async (strategyId, options = {}) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const { startDate, endDate } = options
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/backtest/${strategyId}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate,
            endDate,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Backtest failed')
      }

      const data = await response.json()
      setResult(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const clearResult = () => {
    setResult(null)
    setError(null)
  }

  const clearError = () => {
    setError(null)
  }

  return { 
    runBacktest, 
    loading, 
    error, 
    result, 
    clearResult,
    clearError 
  }
}
