import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { TraderraTrade } from '@/utils/csv-parser'

export function useTrades() {
  const [trades, setTrades] = useState<TraderraTrade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isLoaded, isSignedIn } = useUser()

  // Load trades when user is authenticated
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadTrades()
    } else if (isLoaded && !isSignedIn) {
      setTrades([])
      setIsLoading(false)
    }
  }, [isLoaded, isSignedIn])

  const loadTrades = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/trades')

      if (!response.ok) {
        throw new Error('Failed to load trades')
      }

      const data = await response.json()
      setTrades(data.trades || [])
    } catch (err) {
      console.error('Error loading trades:', err)
      setError(err instanceof Error ? err.message : 'Failed to load trades')
    } finally {
      setIsLoading(false)
    }
  }

  const saveTrades = async (newTrades: TraderraTrade[]) => {
    try {
      setError(null)

      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trades: newTrades }),
      })

      if (!response.ok) {
        throw new Error('Failed to save trades')
      }

      const data = await response.json()

      // Update local state
      setTrades(newTrades)

      return data
    } catch (err) {
      console.error('Error saving trades:', err)
      setError(err instanceof Error ? err.message : 'Failed to save trades')
      throw err
    }
  }

  const addTrade = async (trade: TraderraTrade) => {
    const updatedTrades = [...trades, trade]
    await saveTrades(updatedTrades)
  }

  return {
    trades,
    isLoading,
    error,
    loadTrades,
    saveTrades,
    addTrade,
  }
}