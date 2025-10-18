'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useDateRange, type DateRangeOption } from '@/contexts/DateRangeContext'
import { cn } from '@/lib/utils'

interface TraderViewDateSelectorProps {
  className?: string
}

// TraderView-style calendar component
function TraderViewCalendar({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = ''
}: {
  startDate: Date
  endDate: Date
  onStartDateChange: (date: Date) => void
  onEndDateChange: (date: Date) => void
  className?: string
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isSelectingStart, setIsSelectingStart] = useState(true)
  const today = new Date()

  useEffect(() => {
    // Set current month to today's month when component opens
    setCurrentMonth(new Date())
  }, [])

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  const days = []

  // Previous month's trailing days
  for (let i = 0; i < firstDayOfMonth; i++) {
    const prevDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), -firstDayOfMonth + i + 1)
    const isDisabled = prevDate > today
    days.push(
      <button
        key={`prev-${i}`}
        disabled={isDisabled}
        className={cn(
          "h-8 w-8 text-xs rounded text-center transition-colors",
          isDisabled
            ? 'text-gray-600 cursor-not-allowed'
            : 'text-gray-500 hover:bg-gray-700/50'
        )}
        onClick={() => {
          if (!isDisabled) {
            if (isSelectingStart) {
              onStartDateChange(prevDate)
              setIsSelectingStart(false)
            } else {
              onEndDateChange(prevDate)
            }
          }
        }}
      >
        {prevDate.getDate()}
      </button>
    )
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const isStartDate = currentDate.toDateString() === startDate.toDateString()
    const isEndDate = currentDate.toDateString() === endDate.toDateString()
    const isInRange = currentDate >= startDate && currentDate <= endDate && startDate !== endDate
    const isToday = currentDate.toDateString() === today.toDateString()
    const isDisabled = currentDate > today

    days.push(
      <button
        key={day}
        disabled={isDisabled}
        className={cn(
          "h-8 w-8 text-xs rounded text-center transition-colors relative",
          isDisabled
            ? 'text-gray-600 cursor-not-allowed'
            : isStartDate || isEndDate
            ? 'bg-primary text-primary-foreground font-semibold'
            : isInRange
            ? 'bg-primary/20 text-primary'
            : isToday
            ? 'bg-gray-700 text-white font-semibold'
            : 'text-gray-300 hover:bg-gray-700/50'
        )}
        onClick={() => {
          if (!isDisabled) {
            if (isSelectingStart) {
              onStartDateChange(currentDate)
              setIsSelectingStart(false)
            } else {
              onEndDateChange(currentDate)
            }
          }
        }}
      >
        {day}
      </button>
    )
  }

  // Next month's leading days
  const remainingCells = 42 - days.length
  for (let day = 1; day <= remainingCells; day++) {
    const nextDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day)
    const isDisabled = nextDate > today
    days.push(
      <button
        key={`next-${day}`}
        disabled={isDisabled}
        className={cn(
          "h-8 w-8 text-xs rounded text-center transition-colors",
          isDisabled
            ? 'text-gray-600 cursor-not-allowed'
            : 'text-gray-500 hover:bg-gray-700/50'
        )}
        onClick={() => {
          if (!isDisabled) {
            if (isSelectingStart) {
              onStartDateChange(nextDate)
              setIsSelectingStart(false)
            } else {
              onEndDateChange(nextDate)
            }
          }
        }}
      >
        {day}
      </button>
    )
  }

  return (
    <div className={cn("bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 shadow-2xl", className)}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-1 hover:bg-gray-700/50 rounded transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-gray-300" />
        </button>
        <h3 className="font-semibold text-gray-200">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-1 hover:bg-gray-700/50 rounded transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="h-8 w-8 text-xs text-gray-400 font-medium flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {days}
      </div>

      <div className="flex justify-between items-center text-xs text-gray-400 pt-3 border-t border-gray-700/50">
        <span>
          {isSelectingStart ? 'Select start date' : 'Select end date'}
        </span>
        <button
          onClick={() => setIsSelectingStart(true)}
          className="text-primary hover:text-primary/80 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

export function TraderViewDateSelector({ className = '' }: TraderViewDateSelectorProps) {
  const {
    selectedRange,
    customStartDate,
    customEndDate,
    setDateRange,
    setCustomRange
  } = useDateRange()

  const [showCalendar, setShowCalendar] = useState(false)
  const [tempStartDate, setTempStartDate] = useState(customStartDate || new Date())
  const [tempEndDate, setTempEndDate] = useState(customEndDate || new Date())
  const calendarRef = useRef<HTMLDivElement>(null)

  // Quick range options
  const quickRanges = [
    { label: '7d', value: 'week' as DateRangeOption },
    { label: '30d', value: 'month' as DateRangeOption },
    { label: '90d', value: '90day' as DateRangeOption },
  ]

  // Additional filter options
  const filterOptions = [
    { label: '$', title: 'Dollar values' },
    { label: '%', title: 'Percentage' },
    { label: 'R', title: 'Returns' },
  ]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleQuickRange = (range: DateRangeOption) => {
    setDateRange(range)
    setShowCalendar(false)
  }

  const handleCalendarOpen = () => {
    // Initialize temp dates with current custom range or default to last 30 days
    if (selectedRange === 'custom' && customStartDate && customEndDate) {
      setTempStartDate(customStartDate)
      setTempEndDate(customEndDate)
    } else {
      const today = new Date()
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)
      setTempStartDate(thirtyDaysAgo)
      setTempEndDate(today)
    }
    setShowCalendar(true)
  }

  const handleApplyCustomRange = () => {
    setCustomRange(tempStartDate, tempEndDate)
    setShowCalendar(false)
  }

  return (
    <div className={cn("relative flex items-center gap-1", className)} ref={calendarRef}>
      {/* Quick range buttons */}
      {quickRanges.map((range) => (
        <button
          key={range.value}
          onClick={() => handleQuickRange(range.value)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded transition-all duration-200",
            selectedRange === range.value
              ? 'bg-primary text-primary-foreground'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          )}
        >
          {range.label}
        </button>
      ))}

      {/* Calendar button */}
      <button
        onClick={handleCalendarOpen}
        className={cn(
          "px-2 py-1.5 rounded transition-all duration-200 flex items-center justify-center",
          selectedRange === 'custom'
            ? 'bg-traderra-gold text-black'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
        )}
      >
        <Calendar className="h-4 w-4" />
      </button>

      {/* Separator */}
      <div className="w-px h-6 bg-gray-600 mx-1"></div>

      {/* Filter buttons */}
      {filterOptions.map((filter) => (
        <button
          key={filter.label}
          title={filter.title}
          className={cn(
            "px-2 py-1.5 text-sm font-medium rounded transition-all duration-200 flex items-center justify-center min-w-[32px]",
            filter.label === '$'
              ? 'bg-primary text-primary-foreground'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          )}
        >
          {filter.label}
        </button>
      ))}

      {/* Calendar popup */}
      {showCalendar && (
        <div className="absolute top-full left-0 mt-2 z-50">
          <TraderViewCalendar
            startDate={tempStartDate}
            endDate={tempEndDate}
            onStartDateChange={setTempStartDate}
            onEndDateChange={setTempEndDate}
          />
          <div className="flex justify-end gap-2 mt-3 px-4">
            <button
              onClick={() => setShowCalendar(false)}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyCustomRange}
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}