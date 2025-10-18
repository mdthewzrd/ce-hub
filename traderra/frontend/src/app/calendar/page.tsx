'use client'

import { useState } from 'react'
import { TopNavigation } from '@/components/layout/top-nav'
import { DateRangeSelector } from '@/components/ui/date-range-selector'
import { DateRangeProvider, useDateRange } from '@/contexts/DateRangeContext'
import { RenataChat } from '@/components/dashboard/renata-chat'
import { FileText, ChevronLeft, ChevronRight, Calendar, Plus, X, Edit, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Sample data for calendar - this should come from your data source
const calendarData = {
  2025: {
    1: { // January
      days: {
        2: { pnl: 485.20, trades: 2, hasJournal: true },
        3: { pnl: 1485.75, trades: 4, hasJournal: true },
        6: { pnl: 785.30, trades: 3, hasJournal: true },
        9: { pnl: 1245.60, trades: 5, hasJournal: true },
        10: { pnl: 567.89, trades: 2, hasJournal: true },
        11: { pnl: -234.50, trades: 2, hasJournal: true },
        15: { pnl: 985.40, trades: 3, hasJournal: true },
        17: { pnl: 625.80, trades: 2, hasJournal: true },
        22: { pnl: 1125.90, trades: 4, hasJournal: true },
        23: { pnl: 445.60, trades: 2, hasJournal: true },
        27: { pnl: 865.40, trades: 3, hasJournal: true },
        30: { pnl: 1485.90, trades: 6, hasJournal: true },
      }
    },
    2: { // February
      days: {
        1: { pnl: 325.50, trades: 2, hasJournal: true },
        5: { pnl: -185.20, trades: 1, hasJournal: true },
        8: { pnl: 745.30, trades: 3, hasJournal: true },
        12: { pnl: 1150.60, trades: 4, hasJournal: true },
        14: { pnl: 420.89, trades: 2, hasJournal: true },
        19: { pnl: 685.40, trades: 3, hasJournal: true },
        21: { pnl: -125.80, trades: 1, hasJournal: true },
        26: { pnl: 925.90, trades: 4, hasJournal: true },
        28: { pnl: 385.60, trades: 2, hasJournal: true },
      }
    },
    3: { // March
      days: {
        3: { pnl: 525.20, trades: 3, hasJournal: true },
        7: { pnl: 1285.75, trades: 5, hasJournal: true },
        11: { pnl: 645.30, trades: 2, hasJournal: true },
        14: { pnl: -195.60, trades: 1, hasJournal: true },
        18: { pnl: 885.89, trades: 4, hasJournal: true },
        21: { pnl: 455.40, trades: 2, hasJournal: true },
        25: { pnl: 1325.80, trades: 6, hasJournal: true },
        28: { pnl: 785.90, trades: 3, hasJournal: true },
      }
    },
    4: { // April
      days: {
        2: { pnl: 415.50, trades: 2, hasJournal: true },
        4: { pnl: 865.20, trades: 4, hasJournal: true },
        9: { pnl: -285.75, trades: 1, hasJournal: true },
        11: { pnl: 1185.30, trades: 5, hasJournal: true },
        16: { pnl: 595.89, trades: 3, hasJournal: true },
        18: { pnl: 325.40, trades: 2, hasJournal: true },
        23: { pnl: 1425.80, trades: 6, hasJournal: true },
        25: { pnl: 685.90, trades: 3, hasJournal: true },
        30: { pnl: -165.60, trades: 1, hasJournal: true },
      }
    },
    5: { // May
      days: {
        2: { pnl: 715.50, trades: 3, hasJournal: true },
        6: { pnl: 1165.20, trades: 5, hasJournal: true },
        9: { pnl: 485.75, trades: 2, hasJournal: true },
        13: { pnl: -225.30, trades: 1, hasJournal: true },
        16: { pnl: 845.89, trades: 4, hasJournal: true },
        20: { pnl: 615.40, trades: 3, hasJournal: true },
        23: { pnl: 1285.80, trades: 5, hasJournal: true },
        27: { pnl: 565.90, trades: 2, hasJournal: true },
        30: { pnl: 925.60, trades: 4, hasJournal: true },
      }
    },
    6: { // June
      days: {
        3: { pnl: 825.50, trades: 4, hasJournal: true },
        5: { pnl: 1385.20, trades: 6, hasJournal: true },
        10: { pnl: 645.75, trades: 3, hasJournal: true },
        12: { pnl: -315.30, trades: 1, hasJournal: true },
        17: { pnl: 985.89, trades: 5, hasJournal: true },
        19: { pnl: 475.40, trades: 2, hasJournal: true },
        24: { pnl: 1485.80, trades: 7, hasJournal: true },
        26: { pnl: 785.90, trades: 3, hasJournal: true },
      }
    },
    7: { // July
      days: {
        1: { pnl: 545.50, trades: 3, hasJournal: true },
        8: { pnl: 1125.20, trades: 5, hasJournal: true },
        11: { pnl: 685.75, trades: 3, hasJournal: true },
        15: { pnl: -185.30, trades: 1, hasJournal: true },
        18: { pnl: 825.89, trades: 4, hasJournal: true },
        22: { pnl: 595.40, trades: 3, hasJournal: true },
        25: { pnl: 1385.80, trades: 6, hasJournal: true },
        29: { pnl: 745.90, trades: 3, hasJournal: true },
      }
    },
    8: { // August
      days: {
        1: { pnl: 625.50, trades: 3, hasJournal: true },
        5: { pnl: 1285.20, trades: 5, hasJournal: true },
        8: { pnl: 485.75, trades: 2, hasJournal: true },
        12: { pnl: -265.30, trades: 1, hasJournal: true },
        15: { pnl: 945.89, trades: 4, hasJournal: true },
        19: { pnl: 685.40, trades: 3, hasJournal: true },
        22: { pnl: 1485.80, trades: 6, hasJournal: true },
        26: { pnl: 825.90, trades: 4, hasJournal: true },
        29: { pnl: 565.60, trades: 2, hasJournal: true },
      }
    },
    9: { // September
      days: {
        2: { pnl: 765.50, trades: 3, hasJournal: true },
        5: { pnl: 1185.20, trades: 5, hasJournal: true },
        9: { pnl: 645.75, trades: 3, hasJournal: true },
        12: { pnl: -325.30, trades: 1, hasJournal: true },
        16: { pnl: 885.89, trades: 4, hasJournal: true },
        19: { pnl: 515.40, trades: 2, hasJournal: true },
        23: { pnl: 1385.80, trades: 6, hasJournal: true },
        26: { pnl: 925.90, trades: 4, hasJournal: true },
        30: { pnl: 685.60, trades: 3, hasJournal: true },
      }
    },
    10: { // October
      days: {
        1: { pnl: 485.50, trades: 2, hasJournal: true },
        3: { pnl: 1285.20, trades: 5, hasJournal: true },
        7: { pnl: 725.75, trades: 3, hasJournal: false },
        9: { pnl: -195.30, trades: 1, hasJournal: true },
        14: { pnl: 1025.89, trades: 5, hasJournal: false },
        16: { pnl: 645.40, trades: 3, hasJournal: true },
        21: { pnl: 1485.80, trades: 6, hasJournal: true },
        24: { pnl: 785.90, trades: 4, hasJournal: false },
        28: { pnl: 525.60, trades: 2, hasJournal: true },
        31: { pnl: 925.70, trades: 4, hasJournal: true },
      }
    },
    11: { // November
      days: {
        4: { pnl: 685.50, trades: 3, hasJournal: true },
        7: { pnl: 1185.20, trades: 5, hasJournal: true },
        11: { pnl: 545.75, trades: 2, hasJournal: true },
        14: { pnl: -285.30, trades: 1, hasJournal: true },
        18: { pnl: 925.89, trades: 4, hasJournal: true },
        21: { pnl: 595.40, trades: 3, hasJournal: true },
        25: { pnl: 1385.80, trades: 6, hasJournal: true },
        28: { pnl: 725.90, trades: 3, hasJournal: true },
      }
    },
    12: { // December
      days: {
        2: { pnl: 825.50, trades: 4, hasJournal: true },
        5: { pnl: 1285.20, trades: 5, hasJournal: true },
        9: { pnl: 645.75, trades: 3, hasJournal: true },
        12: { pnl: -385.30, trades: 1, hasJournal: true },
        16: { pnl: 1125.89, trades: 5, hasJournal: true },
        19: { pnl: 785.40, trades: 4, hasJournal: true },
        23: { pnl: 1485.80, trades: 6, hasJournal: true },
        26: { pnl: 925.90, trades: 4, hasJournal: true },
        30: { pnl: 685.60, trades: 3, hasJournal: true },
      }
    }
  }
}

function CalendarDay({
  date,
  data,
  isCurrentMonth,
  isSelected,
  onClick,
  onPlusClick,
  isYearlyView = false,
  isInRange = false,
  fullDate
}: {
  date: number
  data?: { pnl: number, trades: number, hasJournal: boolean }
  isCurrentMonth: boolean
  isSelected: boolean
  onClick: () => void
  onPlusClick?: (date: Date) => void
  isYearlyView?: boolean
  isInRange?: boolean
  fullDate?: Date
}) {
  const hasData = data && data.trades > 0
  const isProfit = data && data.pnl > 0
  const isLoss = data && data.pnl < 0

  // Only show color background if date has trading data AND is in range
  const showColorBg = hasData && isInRange && isCurrentMonth

  // Different layout for monthly vs yearly view
  if (!isYearlyView) {
    // Enhanced monthly view with larger cells, PnL values, and journal icons
    return (
      <div
        className={`relative p-3 min-h-[120px] flex flex-col items-start justify-between hover:bg-[#111111] transition-colors cursor-pointer border-r border-b border-[#1a1a1a] ${
          isSelected ? 'bg-[#161616] border border-primary/50' : ''
        } ${
          showColorBg
            ? isProfit
              ? 'bg-green-400/20'
              : isLoss
              ? 'bg-red-400/20'
              : 'bg-[#0a0a0a]'
            : 'bg-[#0a0a0a]'
        } ${
          !isCurrentMonth ? 'opacity-30' : ''
        }`}
        onClick={(e) => {
          onClick()
        }}
      >
        <div className="flex items-center justify-between w-full">
          <span className={`text-sm font-medium ${isCurrentMonth ? 'studio-text' : 'studio-muted'}`}>
            {date}
          </span>
          {hasData && isCurrentMonth && (
            <FileText
              className={`h-4 w-4 ${data.hasJournal ? 'text-primary fill-current' : 'text-gray-500'}`}
            />
          )}
        </div>

        {hasData && isCurrentMonth && (
          <div className="flex flex-col space-y-1 mt-1">
            <span className={`text-xs font-semibold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              ${Math.abs(data.pnl).toLocaleString()}
            </span>
            <span className="text-xs studio-muted">
              {data.trades} trade{data.trades !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Plus icon in bottom right corner - only show for current month days */}
        {isCurrentMonth && (
          <div className="absolute bottom-2 right-2">
            <Plus
              className="h-3 w-3 text-gray-500 hover:text-primary transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                if (fullDate && onPlusClick) {
                  onPlusClick(fullDate)
                }
              }}
            />
          </div>
        )}
      </div>
    )
  }

  // Yearly view (existing compact layout)
  return (
    <div
      className={`relative px-1 py-1 h-7 flex items-center justify-center hover:bg-[#111111] transition-colors cursor-pointer ${
        isSelected ? 'bg-[#161616] border border-primary/50' : ''
      } ${
        showColorBg
          ? isProfit
            ? 'bg-green-400/20'
            : isLoss
            ? 'bg-red-400/20'
            : 'bg-[#0a0a0a]'
          : 'bg-[#0a0a0a]'
      } ${
        !isCurrentMonth ? 'opacity-30' : ''
      }`}
      onClick={(e) => {
        if (isYearlyView) {
          e.stopPropagation()
        }
        onClick()
      }}
    >
      <span className={`text-xs ${isCurrentMonth ? 'studio-text' : 'studio-muted'}`}>
        {date}
      </span>
    </div>
  )
}

function MonthCalendar({
  year,
  month,
  selectedDate,
  onDateSelect,
  onPlusClick,
  isYearlyView = true,
  onOpenMonth,
  currentDateRange
}: {
  year: number
  month: number
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  onPlusClick?: (date: Date) => void
  isYearlyView?: boolean
  onOpenMonth?: (year: number, month: number) => void
  currentDateRange?: { start: Date, end: Date }
}) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate()

  const days = []

  // Previous month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const date = daysInPrevMonth - i
    days.push(
      <CalendarDay
        key={`prev-${date}`}
        date={date}
        isCurrentMonth={false}
        isSelected={false}
        onClick={() => {}}
        isYearlyView={isYearlyView}
      />
    )
  }

  // Current month days
  for (let date = 1; date <= daysInMonth; date++) {
    const currentDate = new Date(year, month - 1, date)

    // Only show data for dates that are within the selected date range
    const rawDayData = (calendarData as any)[year]?.[month]?.days[date]
    const isWithinRange = currentDateRange &&
      currentDate >= currentDateRange.start &&
      currentDate <= currentDateRange.end
    const dayData = isWithinRange ? rawDayData : undefined

    const isSelected = selectedDate &&
      selectedDate.getDate() === date &&
      selectedDate.getMonth() === month - 1 &&
      selectedDate.getFullYear() === year

    // Check if date is within the current date range
    const isInRange = currentDateRange &&
      currentDate >= currentDateRange.start &&
      currentDate <= currentDateRange.end

    days.push(
      <CalendarDay
        key={date}
        date={date}
        data={dayData}
        isCurrentMonth={true}
        isSelected={!!isSelected}
        onClick={() => onDateSelect(currentDate)}
        onPlusClick={onPlusClick}
        isYearlyView={isYearlyView}
        isInRange={!!isInRange}
        fullDate={currentDate}
      />
    )
  }

  // Next month days to fill grid - only add enough to complete the current week
  const totalCells = days.length
  const remainingCellsToCompleteWeek = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)

  for (let date = 1; date <= remainingCellsToCompleteWeek; date++) {
    days.push(
      <CalendarDay
        key={`next-${date}`}
        date={date}
        isCurrentMonth={false}
        isSelected={false}
        onClick={() => {}}
        isYearlyView={isYearlyView}
      />
    )
  }

  // Calculate month totals - only include dates within the selected range
  const monthData = (calendarData as any)[year]?.[month]?.days || {}

  let totalPnL = 0
  let totalTrades = 0

  Object.entries(monthData).forEach(([dateStr, dayData]: [string, any]) => {
    const date = new Date(year, month - 1, parseInt(dateStr))
    const isWithinRange = currentDateRange &&
      date >= currentDateRange.start &&
      date <= currentDateRange.end

    if (isWithinRange) {
      totalPnL += dayData.pnl || 0
      totalTrades += dayData.trades || 0
    }
  })

  return (
    <div
      className={`studio-surface rounded-lg shadow-studio ${
        isYearlyView
          ? 'p-3 hover:shadow-lg transition-all duration-200 cursor-pointer border border-transparent hover:border-primary/30'
          : 'p-6 border border-[#1a1a1a]'
      }`}
      onClick={() => isYearlyView && onOpenMonth && onOpenMonth(year, month)}
    >
      <div className={`flex items-center justify-between ${isYearlyView ? 'mb-2' : 'mb-4'}`}>
        <h3 className={`font-semibold studio-text ${isYearlyView ? 'text-base' : 'text-2xl'} ${isYearlyView ? 'hover:text-primary transition-colors' : ''}`}>
          {monthNames[month - 1]} {!isYearlyView && year}
        </h3>
        <div className="flex items-center space-x-2 text-sm">
          <span className={`font-semibold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${totalPnL.toLocaleString()}
          </span>
          <span className="studio-muted">
            {totalTrades} trade{totalTrades !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className={`grid grid-cols-7 ${isYearlyView ? 'gap-px' : 'gap-0'} border border-[#1a1a1a] rounded-lg overflow-hidden bg-[#1a1a1a]`}>
        {/* Day headers */}
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
          <div key={day} className={`text-center bg-[#0d0d0d] ${isYearlyView ? 'py-1 px-1' : 'p-3 border-b border-[#1a1a1a]'}`}>
            <span className={`font-medium studio-muted ${isYearlyView ? 'text-xs' : 'text-sm'}`}>
              {isYearlyView ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'][index] : day}
            </span>
          </div>
        ))}

        {/* Calendar days */}
        {days}
      </div>
    </div>
  )
}

// Date Preview Modal Component
function DatePreviewModal({
  isOpen,
  onClose,
  date,
  data
}: {
  isOpen: boolean
  onClose: () => void
  date: Date | null
  data?: { pnl: number, trades: number, hasJournal: boolean }
}) {
  if (!isOpen || !date) return null

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const hasData = data && data.trades > 0
  const isProfit = data && data.pnl > 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold studio-text">{formattedDate}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
          >
            <X className="h-4 w-4 studio-muted" />
          </button>
        </div>

        {hasData ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {isProfit ? (
                <TrendingUp className="h-5 w-5 text-green-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-400" />
              )}
              <div>
                <div className={`text-xl font-semibold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                  {isProfit ? '+' : ''}${data.pnl.toLocaleString()}
                </div>
                <div className="text-sm studio-muted">
                  {data.trades} trade{data.trades !== 1 ? 's' : ''} executed
                </div>
              </div>
            </div>

            <div className="border-t border-[#1a1a1a] pt-4">
              <div className="flex items-center justify-between">
                <span className="studio-muted">Journal Entry</span>
                <div className="flex items-center space-x-2">
                  <FileText className={`h-4 w-4 ${data.hasJournal ? 'text-primary' : 'text-gray-500'}`} />
                  <span className={`text-sm ${data.hasJournal ? 'text-primary' : 'studio-muted'}`}>
                    {data.hasJournal ? 'Completed' : 'Not created'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <button className="flex-1 btn-primary text-sm py-2">
                View Details
              </button>
              {!data.hasJournal && (
                <button className="flex-1 btn-secondary text-sm py-2">
                  Add Journal
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="studio-muted mb-4">No trading activity on this date</div>
            <button className="btn-primary text-sm">
              Add Entry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Document Creation Modal Component
function DocumentCreationModal({
  isOpen,
  onClose,
  date
}: {
  isOpen: boolean
  onClose: () => void
  date: Date | null
}) {
  if (!isOpen || !date) return null

  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold studio-text">Create Entry</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
          >
            <X className="h-4 w-4 studio-muted" />
          </button>
        </div>

        <div className="mb-4">
          <div className="text-sm studio-muted">Date: {formattedDate}</div>
        </div>

        <div className="space-y-3">
          <button
            className="w-full flex items-center space-x-3 p-3 hover:bg-[#1a1a1a] rounded-lg transition-colors text-left"
            onClick={() => {
              console.log('Create trade entry for', date)
              onClose()
            }}
          >
            <TrendingUp className="h-5 w-5 text-green-400" />
            <div>
              <div className="studio-text font-medium">Trade Entry</div>
              <div className="text-xs studio-muted">Record trading activity and P&L</div>
            </div>
          </button>

          <button
            className="w-full flex items-center space-x-3 p-3 hover:bg-[#1a1a1a] rounded-lg transition-colors text-left"
            onClick={() => {
              console.log('Create journal entry for', date)
              onClose()
            }}
          >
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <div className="studio-text font-medium">Journal Entry</div>
              <div className="text-xs studio-muted">Write notes and analysis</div>
            </div>
          </button>

          <button
            className="w-full flex items-center space-x-3 p-3 hover:bg-[#1a1a1a] rounded-lg transition-colors text-left"
            onClick={() => {
              console.log('Create general note for', date)
              onClose()
            }}
          >
            <Edit className="h-5 w-5 text-blue-400" />
            <div>
              <div className="studio-text font-medium">General Note</div>
              <div className="text-xs studio-muted">Quick thoughts or reminders</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

function CalendarPageContent() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentYear, setCurrentYear] = useState(2025)
  const [viewMode, setViewMode] = useState<'yearly' | 'monthly'>('yearly')
  const [selectedMonth, setSelectedMonth] = useState<{ year: number, month: number } | null>(null)
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true)

  // Modal states
  const [datePreviewModal, setDatePreviewModal] = useState<{ isOpen: boolean, date: Date | null, data?: any }>({
    isOpen: false,
    date: null,
    data: undefined
  })
  const [documentCreationModal, setDocumentCreationModal] = useState<{ isOpen: boolean, date: Date | null }>({
    isOpen: false,
    date: null
  })

  const { currentDateRange, selectedRange, displayMode, setDisplayMode, setDateRange } = useDateRange()

  // Handle date click for preview
  const handleDateClick = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayData = (calendarData as any)[year]?.[month]?.days[day]

    setDatePreviewModal({
      isOpen: true,
      date,
      data: dayData
    })
  }

  // Handle plus button click for document creation
  const handlePlusClick = (date: Date) => {
    setDocumentCreationModal({
      isOpen: true,
      date
    })
  }

  // Always show all 12 months for the current year
  const getMonthsToDisplay = () => {
    const months = []
    // Always show all 12 months for the current year
    for (let month = 1; month <= 12; month++) {
      months.push({ year: currentYear, month })
    }
    return months
  }

  const monthsToDisplay = getMonthsToDisplay()

  return (
    <div className="flex h-screen studio-bg">
      {/* Main content container with top navigation */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNavigation onAiToggle={() => setAiSidebarOpen(!aiSidebarOpen)} aiOpen={aiSidebarOpen} />

        {/* Calendar content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl space-y-6">
        {/* Header with date range selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold studio-text">Calendar</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentYear(prev => prev - 1)}
                className="p-2 hover:bg-accent rounded transition-colors"
              >
                <ChevronLeft className="h-4 w-4 studio-muted" />
              </button>
              <span className="text-sm studio-muted font-medium min-w-[60px] text-center">
                {currentYear}
              </span>
              <button
                onClick={() => setCurrentYear(prev => prev + 1)}
                className="p-2 hover:bg-accent rounded transition-colors"
              >
                <ChevronRight className="h-4 w-4 studio-muted" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Date Range Toggle Buttons - TraderVue Style */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDateRange('7d')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded transition-all duration-200',
                  currentDateRange.label === 'This Week'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                )}
              >
                7d
              </button>
              <button
                onClick={() => setDateRange('30d')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded transition-all duration-200',
                  currentDateRange.label === 'This Month'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                )}
              >
                30d
              </button>
              <button
                onClick={() => setDateRange('90d')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded transition-all duration-200',
                  currentDateRange.label === '90 Days'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                )}
              >
                90d
              </button>
              <button
                className={cn(
                  'px-2 py-1.5 rounded transition-all duration-200 flex items-center justify-center',
                  selectedRange === 'custom'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                )}
              >
                <Calendar className="h-4 w-4" />
              </button>
            </div>

            {/* Display Mode Toggle */}
            <div className="flex items-center bg-[#111111] rounded-lg p-1 border border-[#1a1a1a]">
              <button
                onClick={() => setDisplayMode('dollar')}
                className={cn(
                  'flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  displayMode === 'dollar'
                    ? 'bg-primary/20 text-primary'
                    : 'studio-muted hover:studio-text'
                )}
              >
                <span>$</span>
              </button>
              <button
                onClick={() => setDisplayMode('percent')}
                className={cn(
                  'flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  displayMode === 'percent'
                    ? 'bg-primary/20 text-primary'
                    : 'studio-muted hover:studio-text'
                )}
              >
                <span>%</span>
              </button>
              <button
                onClick={() => setDisplayMode('r')}
                className={cn(
                  'flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  displayMode === 'r'
                    ? 'bg-primary/20 text-primary'
                    : 'studio-muted hover:studio-text'
                )}
              >
                <span className="text-xs font-bold">R</span>
              </button>
            </div>

          </div>
        </div>

        {/* Calendar Grid - Always show all 12 months */}
        {viewMode === 'yearly' ? (
          <div className="grid grid-cols-4 gap-4">
            {monthsToDisplay.map(({ year, month }) => (
              <MonthCalendar
                key={`${year}-${month}`}
                year={year}
                month={month}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onPlusClick={handlePlusClick}
                isYearlyView={true}
                currentDateRange={currentDateRange}
                onOpenMonth={(year, month) => {
                  setSelectedMonth({ year, month })
                  setViewMode('monthly')
                }}
              />
            ))}
          </div>
        ) : selectedMonth ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setViewMode('yearly')}
                className="text-primary hover:text-primary/80 text-sm"
              >
                ← Back to Year View
              </button>
            </div>
            <MonthCalendar
              key={`${selectedMonth.year}-${selectedMonth.month}`}
              year={selectedMonth.year}
              month={selectedMonth.month}
              selectedDate={selectedDate}
              onDateSelect={handleDateClick}
              onPlusClick={handlePlusClick}
              isYearlyView={false}
              currentDateRange={currentDateRange}
            />
          </div>
        ) : null}
          </div>
        </main>
      </div>

      {/* AI Sidebar - Renata Chat */}
      {aiSidebarOpen && (
        <div className="w-[600px] studio-surface border-l border-[#1a1a1a] z-40">
          <RenataChat />
        </div>
      )}

      {/* Modals */}
      <DatePreviewModal
        isOpen={datePreviewModal.isOpen}
        onClose={() => setDatePreviewModal({ isOpen: false, date: null, data: undefined })}
        date={datePreviewModal.date}
        data={datePreviewModal.data}
      />

      <DocumentCreationModal
        isOpen={documentCreationModal.isOpen}
        onClose={() => setDocumentCreationModal({ isOpen: false, date: null })}
        date={documentCreationModal.date}
      />
    </div>
  )
}

export default function CalendarPage() {
  return (
    <DateRangeProvider>
      <CalendarPageContent />
    </DateRangeProvider>
  )
}