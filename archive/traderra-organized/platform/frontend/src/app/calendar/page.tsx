'use client'

import { useState } from 'react'
import { TopNavigation } from '@/components/layout/top-nav'
import { TraderViewDateSelector } from '@/components/ui/traderview-date-selector'
import { DisplayModeToggle } from '@/components/ui/display-mode-toggle'
import { DateRangeProvider, useDateRange } from '@/contexts/DateRangeContext'
import { DisplayModeProvider } from '@/contexts/DisplayModeContext'
import { RenataChat } from '@/components/dashboard/renata-chat'
import { FileText, ChevronLeft, ChevronRight, Calendar, Plus, X, Edit, TrendingUp, TrendingDown } from 'lucide-react'
import { TradeDetailModal } from '@/components/trades/trade-detail-modal'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { usePnLMode } from '@/contexts/PnLModeContext'
import { getPnLValue } from '@/utils/trade-statistics'
import { useQuery } from '@tanstack/react-query'
import { TraderraTrade } from '@/utils/csv-parser'

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
        10: { pnl: 847.25, trades: 3, hasJournal: true },
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

// Sample journal data - this should come from your journal system
const journalData = {
  '2025-10-09': {
    type: 'formal',
    title: 'Daily Trading Review - October 9th, 2025',
    content: `**Market Conditions:**
- SPY opened flat, range-bound session with low volume
- VIX around 18.5, indicating moderate fear levels
- Tech sector showing weakness after earnings warnings

**Trades Executed:**
1. **TSLA Short Position** - Entry: $247.50, Exit: $251.25 (LOSS)
   - Entry Reasoning: Resistance at $250 level, overbought RSI
   - Exit: Stop loss triggered at $251.25
   - Mistake: Position sizing too large for setup conviction

**Lessons Learned:**
- Need to reduce position size when setup has lower conviction
- Should have waited for clearer rejection at resistance level
- Stop loss placement was appropriate, honored it correctly

**Psychology Notes:**
- Felt FOMO after missing morning move in AAPL
- This led to rushing into TSLA setup without proper patience
- Need to stick to planned setups and avoid reactive trading

**Tomorrow's Focus:**
- Only take high-conviction setups
- Reduce position size by 50% until confidence returns
- Focus on quality over quantity

**P&L:** -$195.30
**Win Rate:** 0% (0/1)
**Key Takeaway:** Patience beats aggression in uncertain markets.`,
    mood: 'reflective',
    tags: ['lesson-learned', 'position-sizing', 'psychology'],
    timeSpent: '25 minutes'
  },
  '2025-10-10': {
    type: 'casual',
    title: 'Quick Notes - October 10th',
    content: `Good day overall!

Market felt more decisive today. SPY broke through yesterday's resistance and held nicely. Volume picked up in the afternoon which was encouraging.

**Quick trade notes:**
- AAPL breakout play worked perfectly - got in at $175.20, out at $177.85. Clean setup, nice momentum
- NVDA gave me two smaller scalps - $435 to $437.50 and then $438 to $440.25. These felt effortless
- Missed TSLA but whatever, three wins is plenty for the day

**Random thoughts:**
- Really liked how I stayed patient today vs yesterday's mess
- The smaller position sizing experiment worked well - less stress, clearer thinking
- Need to remember this feeling when I'm tempted to go big again
- Coffee shop was too noisy, might switch back to home office tomorrow

**Non-trading stuff:**
- Had lunch with Sarah, she mentioned some interesting biotech stuff but nothing actionable
- Need to call the accountant about Q3 taxes
- Gym session was solid, felt good to move after sitting all morning

Overall vibe: 8/10. Profitable, disciplined, and didn't overtrade. This is what consistency looks like.

P&L: +$847.25 💪`,
    mood: 'positive',
    tags: ['good-day', 'discipline', 'consistency'],
    timeSpent: '10 minutes'
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
        className={`relative p-3 min-h-[120px] flex flex-col items-start justify-between hover:bg-[#111111] transition-colors cursor-pointer ${
          isSelected ? 'bg-[#161616]' : ''
        } ${
          showColorBg
            ? isProfit
              ? 'bg-trading-profit/20'
              : isLoss
              ? 'bg-trading-loss/20'
              : 'bg-gray-900'
            : 'bg-gray-900'
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
            <span className={`text-xs font-semibold ${isProfit ? 'text-trading-profit' : 'text-trading-loss'}`}>
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

  // Yearly view (enhanced layout with better performance indicators)
  return (
    <div
      className={`relative h-[36px] flex items-center justify-center hover:bg-[#111111] transition-colors cursor-pointer ${
        isSelected ? 'bg-[#161616]' : ''
      } ${
        showColorBg
          ? isProfit
            ? 'bg-trading-profit/25'
            : isLoss
            ? 'bg-trading-loss/25'
            : 'bg-gray-900'
          : !isCurrentMonth
          ? 'bg-gray-900'
          : 'bg-gray-900'
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
      <span className={`text-xs font-semibold ${
        showColorBg
          ? isProfit
            ? 'text-trading-profit'
            : isLoss
            ? 'text-trading-loss'
            : isCurrentMonth
            ? 'studio-text'
            : 'studio-muted'
          : isCurrentMonth
          ? 'studio-text'
          : 'studio-muted'
      }`}>
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
  currentDateRange,
  tradesData,
  mode,
  onNavigateMonth
}: {
  year: number
  month: number
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  onPlusClick?: (date: Date) => void
  isYearlyView?: boolean
  onOpenMonth?: (year: number, month: number) => void
  currentDateRange?: { start: Date, end: Date }
  tradesData?: TraderraTrade[]
  mode: 'gross' | 'net'
  onNavigateMonth?: (direction: 'prev' | 'next') => void
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
    const dateStr = currentDate.toISOString().split('T')[0]
    const dayTrades = (tradesData || []).filter(trade => trade.date === dateStr)
    const isWithinRange = currentDateRange &&
      currentDate >= currentDateRange.start &&
      currentDate <= currentDateRange.end

    // Check if this date has a journal entry
    const hasJournalEntry = !!journalData[dateStr as keyof typeof journalData]

    const rawDayData = dayTrades.length > 0 ? {
      pnl: dayTrades.reduce((sum, trade) => sum + getPnLValue(trade, mode), 0),
      trades: dayTrades.length,
      hasJournal: hasJournalEntry
    } : hasJournalEntry ? {
      pnl: 0,
      trades: 0,
      hasJournal: true
    } : undefined

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
  let totalPnL = 0
  let totalTrades = 0

  if (tradesData) {
    tradesData.forEach(trade => {
      const tradeDate = new Date(trade.date)
      if (tradeDate.getFullYear() === year && tradeDate.getMonth() === month - 1) {
        const isWithinRange = currentDateRange &&
          tradeDate >= currentDateRange.start &&
          tradeDate <= currentDateRange.end

        if (isWithinRange) {
          totalPnL += getPnLValue(trade, mode)
          totalTrades += 1
        }
      }
    })
  }

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
        {!isYearlyView && onNavigateMonth ? (
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNavigateMonth('prev')}
              className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="h-5 w-5 studio-muted hover:studio-text" />
            </button>
            <h3 className="font-semibold studio-text text-2xl">
              {monthNames[month - 1]} {year}
            </h3>
            <button
              onClick={() => onNavigateMonth('next')}
              className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
              title="Next month"
            >
              <ChevronRight className="h-5 w-5 studio-muted hover:studio-text" />
            </button>
          </div>
        ) : (
          <h3 className={`font-semibold studio-text ${isYearlyView ? 'text-base' : 'text-2xl'} ${isYearlyView ? 'hover:text-primary transition-colors' : ''}`}>
            {monthNames[month - 1]} {!isYearlyView && year}
          </h3>
        )}
        <div className="flex items-center space-x-2 text-sm">
          <span className={`font-semibold ${totalPnL >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
            ${totalPnL.toLocaleString()}
          </span>
          <span className="studio-muted">
            {totalTrades} trade{totalTrades !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="p-2 border border-gray-700 rounded-lg bg-black w-full">
        <div className={`grid gap-0 rounded overflow-hidden`} style={{ gridTemplateColumns: '0.6fr 1.6fr 1.6fr 1.6fr 1.6fr 1.6fr 0.6fr' }}>
        {/* Day headers */}
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
          <div key={day} className={`text-center bg-gray-900 flex items-center justify-center ${isYearlyView ? 'h-[36px]' : 'p-3'}`}>
            <span className={`font-medium studio-muted ${isYearlyView ? 'text-xs' : 'text-sm'}`}>
              {isYearlyView ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'][index] : day}
            </span>
          </div>
        ))}

        {/* Calendar days */}
        {days}
        </div>
      </div>
    </div>
  )
}

// Simple markdown formatting function
function formatMarkdownText(text: string) {
  return text
    // Bold text: **text** -> <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert line breaks to <br> tags
    .replace(/\n/g, '<br>')
    // Convert markdown headers: **Header:** -> styled headers
    .replace(/\*\*(.*?):\*\*/g, '<div class="font-semibold text-white mt-4 mb-2">$1:</div>')
    // Convert list items: - item -> proper list items
    .replace(/^- (.*$)/gim, '<div class="ml-4 mb-1">• $1</div>')
}

// Date Preview Modal Component - Enhanced TraderVue Style
function DatePreviewModal({
  isOpen,
  onClose,
  date,
  dayTrades,
  mode
}: {
  isOpen: boolean
  onClose: () => void
  date: Date | null
  dayTrades: TraderraTrade[]
  mode: 'gross' | 'net'
}) {
  const router = useRouter()
  const [selectedTrade, setSelectedTrade] = useState<TraderraTrade | null>(null)
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false)

  if (!isOpen || !date) return null

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const hasData = dayTrades.length > 0

  // Get journal entry for this date
  const dateKey = date.toISOString().split('T')[0]
  const journalEntry = journalData[dateKey as keyof typeof journalData]

  // Calculate comprehensive day statistics
  const totalPnL = dayTrades.reduce((sum, trade) => sum + getPnLValue(trade, mode), 0)
  const totalVolume = dayTrades.reduce((sum, trade) => sum + trade.quantity, 0)
  const totalCommissions = dayTrades.reduce((sum, trade) => sum + (trade.commission || 0), 0)
  const winningTrades = dayTrades.filter(trade => getPnLValue(trade, mode) > 0)
  const losingTrades = dayTrades.filter(trade => getPnLValue(trade, mode) < 0)
  const winRate = hasData ? (winningTrades.length / dayTrades.length) * 100 : 0
  const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, trade) => sum + getPnLValue(trade, mode), 0) / winningTrades.length : 0
  const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, trade) => sum + getPnLValue(trade, mode), 0) / losingTrades.length) : 0
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 999 : 0

  const handleTradeClick = (trade: TraderraTrade) => {
    // Convert TraderraTrade to the format expected by TradeDetailModal
    const formattedTrade = {
      id: trade.id,
      date: trade.date,
      symbol: trade.symbol,
      side: trade.side as 'Long' | 'Short',
      quantity: trade.quantity,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      pnl: getPnLValue(trade, mode),
      pnlPercent: ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100,
      commission: trade.commission || 0,
      duration: trade.duration || '00:00:00',
      strategy: trade.strategy || 'Unknown',
      notes: trade.notes || '',
      entryTime: trade.entryTime,
      exitTime: trade.exitTime
    }
    setSelectedTrade(formattedTrade as any)
    setIsTradeModalOpen(true)
  }

  const goToJournalForDate = () => {
    const dateString = date.toISOString().split('T')[0]
    router.push(`/journal?focus=daily-reviews&date=${dateString}`)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold studio-text">{formattedDate}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
            >
              <X className="h-5 w-5 studio-muted" />
            </button>
          </div>

          {hasData || journalEntry ? (
            <div className="space-y-6">
              {/* Day Statistics Grid - TraderVue Style */}
              {hasData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#111111] rounded-lg p-4">
                  <div className="text-sm studio-muted mb-1">Total P&L</div>
                  <div className={`text-xl font-bold ${totalPnL >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
                    {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString()}
                  </div>
                </div>
                <div className="bg-[#111111] rounded-lg p-4">
                  <div className="text-sm studio-muted mb-1">Total Trades</div>
                  <div className="text-xl font-bold studio-text">{dayTrades.length}</div>
                </div>
                <div className="bg-[#111111] rounded-lg p-4">
                  <div className="text-sm studio-muted mb-1">Win Rate</div>
                  <div className="text-xl font-bold studio-text">{winRate.toFixed(1)}%</div>
                </div>
                <div className="bg-[#111111] rounded-lg p-4">
                  <div className="text-sm studio-muted mb-1">Total Volume</div>
                  <div className="text-xl font-bold studio-text">{totalVolume.toLocaleString()}</div>
                </div>
                <div className="bg-[#111111] rounded-lg p-4">
                  <div className="text-sm studio-muted mb-1">Commissions/Fees</div>
                  <div className="text-xl font-bold text-trading-loss">${totalCommissions.toFixed(2)}</div>
                </div>
                <div className="bg-[#111111] rounded-lg p-4">
                  <div className="text-sm studio-muted mb-1">Avg Win</div>
                  <div className="text-xl font-bold text-trading-profit">${avgWin.toFixed(2)}</div>
                </div>
                <div className="bg-[#111111] rounded-lg p-4">
                  <div className="text-sm studio-muted mb-1">Avg Loss</div>
                  <div className="text-xl font-bold text-trading-loss">${avgLoss.toFixed(2)}</div>
                </div>
                <div className="bg-[#111111] rounded-lg p-4">
                  <div className="text-sm studio-muted mb-1">Profit Factor</div>
                  <div className="text-xl font-bold studio-text">{profitFactor.toFixed(2)}</div>
                </div>
              </div>
              )}

              {/* Trades List Table */}
              {hasData && (
              <div>
                <h3 className="text-lg font-semibold studio-text mb-4">Trades Executed</h3>
                <div className="bg-[#111111] rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#1a1a1a]">
                          <th className="text-left p-3 text-sm font-medium studio-muted">Time</th>
                          <th className="text-left p-3 text-sm font-medium studio-muted">Symbol</th>
                          <th className="text-left p-3 text-sm font-medium studio-muted">Side</th>
                          <th className="text-right p-3 text-sm font-medium studio-muted">Quantity</th>
                          <th className="text-right p-3 text-sm font-medium studio-muted">Entry</th>
                          <th className="text-right p-3 text-sm font-medium studio-muted">Exit</th>
                          <th className="text-right p-3 text-sm font-medium studio-muted">P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dayTrades.map((trade, index) => {
                          const tradePnL = getPnLValue(trade, mode)
                          return (
                            <tr
                              key={trade.id || index}
                              className="border-b border-[#1a1a1a] hover:bg-[#161616] cursor-pointer transition-colors"
                              onClick={() => handleTradeClick(trade)}
                            >
                              <td className="p-3 text-sm studio-text">
                                {trade.entryTime ? new Date(trade.entryTime).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : '--:--'}
                              </td>
                              <td className="p-3 text-sm font-medium studio-text">{trade.symbol}</td>
                              <td className="p-3 text-sm">
                                <span className={`${trade.side === 'Long' ? 'text-trading-profit' : 'text-trading-loss'}`}>
                                  {trade.side}
                                </span>
                              </td>
                              <td className="p-3 text-sm text-right studio-text">{trade.quantity.toLocaleString()}</td>
                              <td className="p-3 text-sm text-right studio-text">${trade.entryPrice.toFixed(2)}</td>
                              <td className="p-3 text-sm text-right studio-text">${trade.exitPrice.toFixed(2)}</td>
                              <td className="p-3 text-sm text-right font-medium">
                                <span className={tradePnL >= 0 ? 'text-trading-profit' : 'text-trading-loss'}>
                                  {tradePnL >= 0 ? '+' : ''}${tradePnL.toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              )}

              {/* Journal Entry Section */}
              {journalEntry && (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold studio-text">Daily Journal</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      journalEntry.mood === 'positive' ? 'bg-trading-profit/20 text-trading-profit' :
                      journalEntry.mood === 'reflective' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-600/20 text-gray-400'
                    }`}>
                      {journalEntry.mood}
                    </span>
                    <span className="text-xs studio-muted">({journalEntry.timeSpent})</span>
                  </div>
                  <div className="bg-[#111111] rounded-lg p-6">
                    <h4 className="font-semibold studio-text mb-4">{journalEntry.title}</h4>
                    <div className="prose prose-invert max-w-none">
                      <div
                        className="studio-text text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatMarkdownText(journalEntry.content) }}
                      />
                    </div>
                    {journalEntry.tags && journalEntry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#1a1a1a]">
                        {journalEntry.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-[#1a1a1a] rounded text-xs studio-muted hover:bg-[#222222] transition-colors"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={goToJournalForDate}
                  className="btn-primary"
                >
                  {journalEntry ? 'Edit Journal Entry' : 'Create Daily Review'}
                </button>
                <button
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="studio-muted mb-4">No trading activity on this date</div>
              <button
                onClick={goToJournalForDate}
                className="btn-primary"
              >
                Create Daily Review
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Trade Detail Modal */}
      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade}
          isOpen={isTradeModalOpen}
          onClose={() => {
            setIsTradeModalOpen(false)
            setSelectedTrade(null)
          }}
        />
      )}
    </>
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
            <TrendingUp className="h-5 w-5 text-trading-profit" />
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
  const [datePreviewModal, setDatePreviewModal] = useState<{ isOpen: boolean, date: Date | null, dayTrades: TraderraTrade[] }>({
    isOpen: false,
    date: null,
    dayTrades: []
  })
  const [documentCreationModal, setDocumentCreationModal] = useState<{ isOpen: boolean, date: Date | null }>({
    isOpen: false,
    date: null
  })

  const { currentDateRange, selectedRange, setDateRange } = useDateRange()
  const { mode } = usePnLMode()

  // Fetch real trade data
  const { data: tradesData } = useQuery({
    queryKey: ['trades'],
    queryFn: async () => {
      const response = await fetch('/api/trades')
      if (!response.ok) {
        throw new Error('Failed to fetch trades')
      }
      const data = await response.json()
      return data.trades as TraderraTrade[]
    }
  })

  // Handle date click for preview
  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]

    // Filter trades for this specific date
    const dayTrades = (tradesData || []).filter(trade => trade.date === dateStr)

    setDatePreviewModal({
      isOpen: true,
      date,
      dayTrades
    })
  }

  // Handle plus button click for document creation
  const handlePlusClick = (date: Date) => {
    setDocumentCreationModal({
      isOpen: true,
      date
    })
  }

  // Handle month navigation in monthly view
  const handleNavigateMonth = (direction: 'prev' | 'next') => {
    if (!selectedMonth) return

    let newMonth = selectedMonth.month
    let newYear = selectedMonth.year

    if (direction === 'prev') {
      newMonth -= 1
      if (newMonth < 1) {
        newMonth = 12
        newYear -= 1
      }
    } else {
      newMonth += 1
      if (newMonth > 12) {
        newMonth = 1
        newYear += 1
      }
    }

    setSelectedMonth({ year: newYear, month: newMonth })
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
            <TraderViewDateSelector />
            <DisplayModeToggle variant="flat" />
          </div>
        </div>

        {/* Calendar Grid - Always show all 12 months */}
        {viewMode === 'yearly' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                tradesData={tradesData}
                mode={mode}
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
              tradesData={tradesData}
              mode={mode}
              onNavigateMonth={handleNavigateMonth}
            />
          </div>
        ) : null}
          </div>
        </main>
      </div>

      {/* AI Sidebar - Renata Chat */}
      {aiSidebarOpen && (
        <div className="w-[480px] studio-surface border-l border-[#1a1a1a] z-40">
          <RenataChat />
        </div>
      )}

      {/* Modals */}
      <DatePreviewModal
        isOpen={datePreviewModal.isOpen}
        onClose={() => setDatePreviewModal({ isOpen: false, date: null, dayTrades: [] })}
        date={datePreviewModal.date}
        dayTrades={datePreviewModal.dayTrades}
        mode={mode}
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
      <DisplayModeProvider>
        <CalendarPageContent />
      </DisplayModeProvider>
    </DateRangeProvider>
  )
}