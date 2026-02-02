import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { TraderraTrade } from '@/utils/csv-parser'
import { useGuestMode } from '@/contexts/GuestModeContext'

export function useTrades() {
  const [trades, setTrades] = useState<TraderraTrade[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isLoaded, isSignedIn } = useUser()
  const { isGuestMode, guestTrades, hasGuestData } = useGuestMode()

  // Load trades when user is authenticated or in guest mode
  useEffect(() => {
    if (isGuestMode && hasGuestData) {
      // Guest mode: use mock data
      setTrades(guestTrades)
      setIsLoading(false)
      setError(null)
    } else if (isLoaded && isSignedIn) {
      // Authenticated user: load from API
      loadTrades()
    } else if (isLoaded && !isSignedIn && !isGuestMode) {
      // Not authenticated and not in guest mode: show empty state
      setTrades([])
      setIsLoading(false)
    }
  }, [isLoaded, isSignedIn, isGuestMode, hasGuestData, guestTrades])

  // Listen for refresh events (e.g., after trade upload)
  useEffect(() => {
    const handleRefresh = () => {
      console.log('[useTrades] Refreshing trades...')
      loadTrades()
    }

    window.addEventListener('refreshTrades', handleRefresh)

    return () => {
      window.removeEventListener('refreshTrades', handleRefresh)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  const deleteTrade = async (tradeId: string) => {
    try {
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete trade')
      }

      // Remove the deleted trade from local state
      setTrades(trades.filter(t => t.id !== tradeId))
    } catch (err) {
      console.error('Error deleting trade:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete trade')
      throw err
    }
  }

  return {
    trades: trades || [], // Always return array, never undefined
    isLoading,
    error,
    loadTrades,
    saveTrades,
    addTrade,
    deleteTrade,
  }
}