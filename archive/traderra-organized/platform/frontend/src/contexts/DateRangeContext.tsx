'use client'

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react'

// Date range type definitions
export type DateRangeOption = 'today' | 'week' | 'month' | 'quarter' | 'year' | '90day' | '12months' | 'lastMonth' | 'lastYear' | 'all' | 'custom'

// Legacy types for compatibility
export type LegacyDateRange = '7d' | '30d' | '90d'

// Quick selection options for calendar picker
export interface QuickSelectOption {
  label: string
  value: DateRangeOption
  description?: string
}

export interface DateRange {
  start: Date
  end: Date
  label: string
}

export interface DateRangeContextType {
  selectedRange: DateRangeOption
  customStartDate: Date | null
  customEndDate: Date | null
  currentDateRange: DateRange
  setDateRange: (range: DateRangeOption | LegacyDateRange) => void
  setCustomRange: (start: Date, end: Date) => void
  getDateRangeLabel: () => string
  getFilteredData: <T extends { date?: Date | string; timestamp?: Date | string; createdAt?: Date | string }>(data: T[]) => T[]
  isDateInRange: (date: Date) => boolean
  getQuickSelectOptions: () => QuickSelectOption[]
  // Legacy support for existing components
  dateRange: DateRangeOption | LegacyDateRange
  currentWeekStart: Date
  setCurrentWeekStart: (date: Date) => void
  getCalendarLabel: () => string
}

interface DateRangeProviderProps {
  children: ReactNode
}

// Date range calculation utility
function calculateDateRange(rangeType: DateRangeOption, customStart?: Date, customEnd?: Date): DateRange {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (rangeType) {
    case 'today':
      return {
        start: today,
        end: today,
        label: 'Today'
      }

    case 'week':
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
      return {
        start: weekStart,
        end: today,
        label: 'This Week'
      }

    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return {
        start: monthStart,
        end: today,
        label: 'This Month'
      }

    case 'quarter':
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3
      const quarterStart = new Date(now.getFullYear(), quarterMonth, 1)
      return {
        start: quarterStart,
        end: today,
        label: 'This Quarter'
      }

    case 'year':
      const yearStart = new Date(now.getFullYear(), 0, 1)
      return {
        start: yearStart,
        end: today,
        label: 'This Year'
      }

    case '90day':
      const ninetyDaysAgo = new Date(today)
      ninetyDaysAgo.setDate(today.getDate() - 89) // 90 days including today
      return {
        start: ninetyDaysAgo,
        end: today,
        label: '90 Days'
      }

    case '12months':
      const twelveMonthsAgo = new Date(now)
      twelveMonthsAgo.setMonth(now.getMonth() - 12)
      // Ensure we don't go beyond the current day of month if it doesn't exist in the target month
      if (twelveMonthsAgo.getDate() !== now.getDate()) {
        // This handles cases like Jan 31 -> Feb 28/29, etc.
        twelveMonthsAgo.setDate(0) // Sets to last day of previous month
      }
      return {
        start: twelveMonthsAgo,
        end: today,
        label: 'Last 12 Months'
      }

    case 'lastMonth':
      // Previous calendar month (full month from 1st to last day)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0) // Last day of previous month
      return {
        start: lastMonthStart,
        end: lastMonthEnd,
        label: 'Last Month'
      }

    case 'lastYear':
      // Previous calendar year (Jan 1 - Dec 31 of previous year)
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1) // Jan 1 of last year
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31) // Dec 31 of last year
      return {
        start: lastYearStart,
        end: lastYearEnd,
        label: 'Last Year'
      }

    case 'all':
      // Set to a very early date for "all time"
      const allTimeStart = new Date(2020, 0, 1)
      return {
        start: allTimeStart,
        end: today,
        label: 'All Time'
      }

    case 'custom':
      if (customStart && customEnd) {
        const formatDate = (date: Date) => {
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: customStart.getFullYear() !== customEnd.getFullYear() ? 'numeric' : undefined
          })
        }

        const label = customStart.getTime() === customEnd.getTime()
          ? formatDate(customStart)
          : `${formatDate(customStart)} - ${formatDate(customEnd)}`

        return {
          start: customStart,
          end: customEnd,
          label
        }
      }
      // Fallback to last 30 days if custom dates not provided
      const defaultEnd = today
      const defaultStart = new Date(today)
      defaultStart.setDate(today.getDate() - 29)
      return {
        start: defaultStart,
        end: defaultEnd,
        label: 'Custom Range'
      }

    default:
      // Default to last 30 days
      const defaultLast30 = new Date(today)
      defaultLast30.setDate(today.getDate() - 29)
      return {
        start: defaultLast30,
        end: today,
        label: 'Last 30 Days'
      }
  }
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined)

// Storage key for localStorage persistence
const DATE_RANGE_STORAGE_KEY = 'traderra_date_range'
const CUSTOM_DATES_STORAGE_KEY = 'traderra_custom_dates'

// Helper function to get stored date range from localStorage
function getStoredDateRange(): DateRangeOption {
  if (typeof window === 'undefined') {
    return 'all' // Default for SSR
  }

  try {
    const stored = localStorage.getItem(DATE_RANGE_STORAGE_KEY)
    if (stored && ['today', 'week', 'month', 'quarter', 'year', '90day', '12months', 'all', 'custom'].includes(stored)) {
      return stored as DateRangeOption
    }
  } catch (error) {
    console.warn('Failed to read date range from localStorage:', error)
  }

  return 'all' // Default fallback
}

// Helper function to get stored custom dates from localStorage
function getStoredCustomDates(): { start: Date | null; end: Date | null } {
  if (typeof window === 'undefined') {
    return { start: null, end: null }
  }

  try {
    const stored = localStorage.getItem(CUSTOM_DATES_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        start: parsed.start ? new Date(parsed.start) : null,
        end: parsed.end ? new Date(parsed.end) : null
      }
    }
  } catch (error) {
    console.warn('Failed to read custom dates from localStorage:', error)
  }

  return { start: null, end: null }
}

// Helper function to store date range in localStorage
function storeDateRange(range: DateRangeOption): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(DATE_RANGE_STORAGE_KEY, range)
  } catch (error) {
    console.warn('Failed to store date range in localStorage:', error)
  }
}

// Helper function to store custom dates in localStorage
function storeCustomDates(start: Date | null, end: Date | null): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(CUSTOM_DATES_STORAGE_KEY, JSON.stringify({
      start: start?.toISOString(),
      end: end?.toISOString()
    }))
  } catch (error) {
    console.warn('Failed to store custom dates in localStorage:', error)
  }
}

// Legacy date utility functions for compatibility
const getStartOfWeek = (date: Date): Date => {
  const start = new Date(date)
  const day = start.getDay()
  const diff = start.getDate() - day
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)
  return start
}

export function DateRangeProvider({ children }: DateRangeProviderProps) {
  // Initialize with default values first, then load from localStorage
  const [selectedRange, setSelectedRangeState] = useState<DateRangeOption>('all')
  const [customStartDate, setCustomStartDateState] = useState<Date | null>(null)
  const [customEndDate, setCustomEndDateState] = useState<Date | null>(null)
  const [currentDateRange, setCurrentDateRange] = useState<DateRange>(() => calculateDateRange('all'))
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(new Date()))
  const [isInitialized, setIsInitialized] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Set mounted state on client-side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load from localStorage on component mount (client-side only)
  useEffect(() => {
    if (isMounted && !isInitialized) {
      const storedRange = getStoredDateRange()
      const storedDates = getStoredCustomDates()

      setSelectedRangeState(storedRange)
      setCustomStartDateState(storedDates.start)
      setCustomEndDateState(storedDates.end)
      setIsInitialized(true)
    }
  }, [isMounted, isInitialized])

  // Wrapper functions to persist to localStorage
  const setSelectedRange = useCallback((range: DateRangeOption) => {
    setSelectedRangeState(range)
    storeDateRange(range)
  }, [])

  const setCustomStartDate = useCallback((date: Date | null) => {
    setCustomStartDateState(date)
    storeCustomDates(date, customEndDate)
  }, [customEndDate])

  const setCustomEndDate = useCallback((date: Date | null) => {
    setCustomEndDateState(date)
    storeCustomDates(customStartDate, date)
  }, [customStartDate])

  // Update current date range when selection changes
  useEffect(() => {
    const newRange = calculateDateRange(selectedRange, customStartDate || undefined, customEndDate || undefined)
    setCurrentDateRange(newRange)
  }, [selectedRange, customStartDate, customEndDate])

  const mapLegacyRange = (range: DateRangeOption | LegacyDateRange): DateRangeOption => {
    switch (range) {
      case '7d': return 'week'
      case '30d': return 'month'
      case '90d': return '90day'
      default: return range as DateRangeOption
    }
  }

  const setDateRange = useCallback((range: DateRangeOption | LegacyDateRange) => {
    const mappedRange = mapLegacyRange(range)
    setSelectedRange(mappedRange)
    // Clear custom dates when switching to non-custom range
    if (mappedRange !== 'custom') {
      setCustomStartDateState(null)
      setCustomEndDateState(null)
      storeCustomDates(null, null)
    }
  }, [])

  const setCustomRange = useCallback((start: Date, end: Date) => {
    // Ensure start is not after end
    if (start > end) {
      [start, end] = [end, start]
    }

    setCustomStartDateState(start)
    setCustomEndDateState(end)
    setSelectedRange('custom')
    storeCustomDates(start, end)
  }, [])

  const getDateRangeLabel = useCallback(() => {
    return currentDateRange.label
  }, [currentDateRange.label])

  const isDateInRange = useCallback((date: Date) => {
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const startDate = new Date(currentDateRange.start.getFullYear(), currentDateRange.start.getMonth(), currentDateRange.start.getDate())
    const endDate = new Date(currentDateRange.end.getFullYear(), currentDateRange.end.getMonth(), currentDateRange.end.getDate())

    return checkDate >= startDate && checkDate <= endDate
  }, [currentDateRange])

  const getFilteredData = useCallback(<T extends { date?: Date | string; timestamp?: Date | string; createdAt?: Date | string }>(data: T[]): T[] => {
    if (!data || data.length === 0) return data

    return data.filter(item => {
      // Try to find a date field in the item
      let itemDate: Date | null = null

      if (item.date) {
        itemDate = typeof item.date === 'string' ? new Date(item.date) : item.date
      } else if (item.timestamp) {
        itemDate = typeof item.timestamp === 'string' ? new Date(item.timestamp) : item.timestamp
      } else if (item.createdAt) {
        itemDate = typeof item.createdAt === 'string' ? new Date(item.createdAt) : item.createdAt
      }

      if (!itemDate || isNaN(itemDate.getTime())) {
        // If no valid date found, include the item (fail-safe)
        return true
      }

      return isDateInRange(itemDate)
    })
  }, [isDateInRange])

  const getCalendarLabel = useCallback((): string => {
    return 'Weekly Glance'
  }, [])

  const getQuickSelectOptions = useCallback((): QuickSelectOption[] => {
    return [
      { label: 'This Month', value: 'month', description: 'Current month' },
      { label: 'Last Month', value: 'lastMonth', description: 'Previous month' },
      { label: 'Last 12 Months', value: '12months', description: 'Past 12 months' },
      { label: 'Last Year', value: 'lastYear', description: 'Previous calendar year' },
      { label: 'YTD', value: 'year', description: 'Year to date' }
    ]
  }, [])

  const getLegacyDateRange = (): DateRangeOption | LegacyDateRange => {
    // Return legacy format for compatibility
    switch (selectedRange) {
      case 'week': return '7d'
      case 'month': return '30d'
      case '90day': return '90d'
      default: return selectedRange
    }
  }

  const contextValue: DateRangeContextType = {
    selectedRange,
    customStartDate,
    customEndDate,
    currentDateRange,
    setDateRange,
    setCustomRange,
    getDateRangeLabel,
    getFilteredData,
    isDateInRange,
    getQuickSelectOptions,
    // Legacy support
    dateRange: getLegacyDateRange(),
    currentWeekStart,
    setCurrentWeekStart,
    getCalendarLabel
  }

  return (
    <DateRangeContext.Provider value={contextValue}>
      {children}
    </DateRangeContext.Provider>
  )
}

export function useDateRange() {
  const context = useContext(DateRangeContext)
  if (context === undefined) {
    throw new Error('useDateRange must be used within a DateRangeProvider')
  }
  return context
}

// Utility function to format date ranges for display
export function formatDateRangeDisplay(start: Date, end: Date): string {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: start.getFullYear() !== end.getFullYear() ? 'numeric' : undefined
    })
  }

  if (start.getTime() === end.getTime()) {
    return formatDate(start)
  }

  return `${formatDate(start)} - ${formatDate(end)}`
}

// Export the context for advanced use cases
export { DateRangeContext }