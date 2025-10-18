'use client'

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDateRange } from '@/contexts/DateRangeContext'

// Sample trading data spanning 4/1/25 to 10/13/25 with realistic varied P&L - in a real app this would come from an API
const tradingData = {
  // April 2025
  '2025-04-01': { pnl: 0, trades: 0 },
  '2025-04-02': { pnl: 315, trades: 2, symbols: ['PLTR', 'SOFI'] },
  '2025-04-03': { pnl: -120, trades: 1, symbols: ['WISH'] },
  '2025-04-04': { pnl: 290, trades: 3, symbols: ['RBLX', 'HOOD', 'LCID'] },
  '2025-04-07': { pnl: -60, trades: 1, symbols: ['SPCE'] },
  '2025-04-08': { pnl: 360, trades: 2, symbols: ['AMC', 'BBIG'] },
  '2025-04-09': { pnl: 180, trades: 2, symbols: ['MULN', 'DWAC'] },
  '2025-04-10': { pnl: -120, trades: 1, symbols: ['PLUG'] },
  '2025-04-11': { pnl: 380, trades: 3, symbols: ['RIOT', 'CLOV', 'BYND'] },
  '2025-04-14': { pnl: 240, trades: 2, symbols: ['SNAP', 'UBER'] },
  '2025-04-15': { pnl: -180, trades: 1, symbols: ['QS'] },
  '2025-04-16': { pnl: 400, trades: 2, symbols: ['COIN', 'SQ'] },
  '2025-04-17': { pnl: 200, trades: 2, symbols: ['ROKU', 'SHOP'] },
  '2025-04-18': { pnl: -140, trades: 1, symbols: ['UPST'] },
  '2025-04-21': { pnl: 360, trades: 2, symbols: ['PATH', 'SNOW'] },
  '2025-04-22': { pnl: 240, trades: 2, symbols: ['NET', 'ZM'] },
  '2025-04-23': { pnl: -160, trades: 1, symbols: ['PTON'] },
  '2025-04-24': { pnl: 340, trades: 3, symbols: ['DASH', 'TWLO', 'DOCU'] },
  '2025-04-25': { pnl: 220, trades: 2, symbols: ['OKTA', 'CRM'] },
  '2025-04-28': { pnl: -200, trades: 1, symbols: ['WORK'] },
  '2025-04-29': { pnl: 320, trades: 2, symbols: ['TEAM', 'SPOT'] },
  '2025-04-30': { pnl: 260, trades: 2, symbols: ['ADBE', 'WDAY'] },
  // May 2025
  '2025-05-01': { pnl: -140, trades: 1, symbols: ['PYPL'] },
  '2025-05-02': { pnl: 440, trades: 3, symbols: ['ETSY', 'TWTR', 'BMBL'] },
  '2025-05-05': { pnl: 260, trades: 2, symbols: ['LYFT', 'ABNB'] },
  '2025-05-06': { pnl: -200, trades: 1, symbols: ['BKNG'] },
  '2025-05-07': { pnl: 380, trades: 3, symbols: ['SEAS', 'DIS', 'PARA'] },
  '2025-05-08': { pnl: 220, trades: 2, symbols: ['CMCSA', 'META'] },
  '2025-05-09': { pnl: -140, trades: 1, symbols: ['PINS'] },
  '2025-05-12': { pnl: 380, trades: 3 },
  '2025-05-13': { pnl: 160, trades: 2 },
  '2025-05-14': { pnl: -180, trades: 1 },
  '2025-05-15': { pnl: 380, trades: 3 },
  '2025-05-16': { pnl: 160, trades: 2 },
  '2025-05-19': { pnl: 300, trades: 3 },
  '2025-05-20': { pnl: -285, trades: 1 },
  '2025-05-21': { pnl: 425, trades: 3 },
  '2025-05-22': { pnl: 180, trades: 2 },
  '2025-05-23': { pnl: -180, trades: 1 },
  '2025-05-27': { pnl: 440, trades: 3 },
  '2025-05-28': { pnl: 220, trades: 2 },
  '2025-05-29': { pnl: -200, trades: 1 },
  '2025-05-30': { pnl: 380, trades: 3 },
  // June 2025
  '2025-06-02': { pnl: 160, trades: 2 },
  '2025-06-03': { pnl: 300, trades: 3 },
  '2025-06-04': { pnl: -200, trades: 1 },
  '2025-06-05': { pnl: 380, trades: 3 },
  '2025-06-06': { pnl: 160, trades: 2 },
  '2025-06-09': { pnl: 360, trades: 3 },
  '2025-06-10': { pnl: 160, trades: 2 },
  '2025-06-11': { pnl: -200, trades: 1 },
  '2025-06-12': { pnl: 380, trades: 3 },
  '2025-06-13': { pnl: 160, trades: 2 },
  '2025-06-16': { pnl: -200, trades: 1 },
  '2025-06-17': { pnl: 380, trades: 3 },
  '2025-06-18': { pnl: 160, trades: 2 },
  '2025-06-19': { pnl: -200, trades: 1 },
  '2025-06-20': { pnl: 380, trades: 3 },
  '2025-06-23': { pnl: 160, trades: 2 },
  '2025-06-24': { pnl: 300, trades: 3 },
  '2025-06-25': { pnl: -345, trades: 1 },
  '2025-06-26': { pnl: 405, trades: 3 },
  '2025-06-27': { pnl: 160, trades: 2 },
  '2025-06-30': { pnl: -200, trades: 1 },
  // July 2025
  '2025-07-01': { pnl: 380, trades: 3 },
  '2025-07-02': { pnl: 160, trades: 2 },
  '2025-07-03': { pnl: -200, trades: 1 },
  '2025-07-07': { pnl: 380, trades: 3 },
  '2025-07-08': { pnl: 160, trades: 2 },
  '2025-07-09': { pnl: -200, trades: 1 },
  '2025-07-10': { pnl: 380, trades: 3 },
  '2025-07-11': { pnl: 160, trades: 2 },
  '2025-07-14': { pnl: -200, trades: 1 },
  '2025-07-15': { pnl: 380, trades: 3 },
  '2025-07-16': { pnl: 160, trades: 2 },
  '2025-07-17': { pnl: -385, trades: 1 },
  '2025-07-18': { pnl: 405, trades: 3 },
  '2025-07-21': { pnl: 160, trades: 2 },
  '2025-07-22': { pnl: -200, trades: 1 },
  '2025-07-23': { pnl: 380, trades: 3 },
  '2025-07-24': { pnl: 160, trades: 2 },
  '2025-07-25': { pnl: -200, trades: 1 },
  '2025-07-28': { pnl: 380, trades: 3 },
  '2025-07-29': { pnl: 160, trades: 2 },
  '2025-07-30': { pnl: -425, trades: 1 },
  '2025-07-31': { pnl: 425, trades: 3 },
  // August 2025
  '2025-08-01': { pnl: 160, trades: 2 },
  '2025-08-04': { pnl: -200, trades: 1 },
  '2025-08-05': { pnl: 380, trades: 3 },
  '2025-08-06': { pnl: 160, trades: 2 },
  '2025-08-07': { pnl: -200, trades: 1 },
  '2025-08-08': { pnl: 380, trades: 3 },
  '2025-08-11': { pnl: 160, trades: 2 },
  '2025-08-12': { pnl: -200, trades: 1 },
  '2025-08-13': { pnl: 380, trades: 3 },
  '2025-08-14': { pnl: 160, trades: 2 },
  '2025-08-15': { pnl: -485, trades: 1 },
  '2025-08-18': { pnl: 425, trades: 3 },
  '2025-08-19': { pnl: 160, trades: 2 },
  '2025-08-20': { pnl: -200, trades: 1 },
  '2025-08-21': { pnl: 380, trades: 3 },
  '2025-08-22': { pnl: 160, trades: 2 },
  '2025-08-25': { pnl: -200, trades: 1 },
  '2025-08-26': { pnl: 845, trades: 3 },
  '2025-08-27': { pnl: 160, trades: 2 },
  '2025-08-28': { pnl: -200, trades: 1 },
  '2025-08-29': { pnl: 380, trades: 3 },
  // September 2025
  '2025-09-02': { pnl: 160, trades: 2 },
  '2025-09-03': { pnl: -200, trades: 1 },
  '2025-09-04': { pnl: 380, trades: 3 },
  '2025-09-05': { pnl: 160, trades: 2 },
  '2025-09-08': { pnl: -200, trades: 1 },
  '2025-09-09': { pnl: 380, trades: 3 },
  '2025-09-10': { pnl: 160, trades: 2 },
  '2025-09-11': { pnl: -200, trades: 1 },
  '2025-09-12': { pnl: 380, trades: 3 },
  '2025-09-15': { pnl: 160, trades: 2 },
  '2025-09-16': { pnl: -200, trades: 1 },
  '2025-09-17': { pnl: 985, trades: 3 },
  '2025-09-18': { pnl: 160, trades: 2 },
  '2025-09-19': { pnl: -200, trades: 1 },
  '2025-09-22': { pnl: 380, trades: 3 },
  '2025-09-23': { pnl: 160, trades: 2 },
  '2025-09-24': { pnl: -200, trades: 1 },
  '2025-09-25': { pnl: 1125, trades: 3 },
  '2025-09-26': { pnl: 160, trades: 2 },
  '2025-09-29': { pnl: -200, trades: 1 },
  '2025-09-30': { pnl: 380, trades: 3 },
  // October 2025
  '2025-10-01': { pnl: 160, trades: 2, symbols: ['SQ', 'COIN'] },
  '2025-10-02': { pnl: -200, trades: 1, symbols: ['SNAP'] },
  '2025-10-03': { pnl: 1285, trades: 3, symbols: ['AAPL', 'BYND', 'UBER'] },
  '2025-10-06': { pnl: 160, trades: 2, symbols: ['CRISPR', 'EDIT'] },
  '2025-10-07': { pnl: -200, trades: 1, symbols: ['NKLA'] },
  '2025-10-08': { pnl: 1485, trades: 3, symbols: ['TSLA', 'RIVN', 'CCIV'] },
  '2025-10-09': { pnl: 160, trades: 2, symbols: ['MULN', 'DWAC'] },
  '2025-10-10': { pnl: -200, trades: 1, symbols: ['AMC'] },
  '2025-10-11': { pnl: 475, trades: 3, symbols: ['HOOD', 'LCID', 'CLOV'] },
  '2025-10-13': { pnl: 380, trades: 3, symbols: ['PLUG', 'RIOT', 'PLTR'] },
  '2025-10-14': { pnl: 1510, trades: 3, symbols: ['NVDA', 'RBLX', 'SPCE'] },
  '2025-10-15': { pnl: 410, trades: 3, symbols: ['PLTR', 'SOFI', 'WISH'] },
}

// Generate week data
const getStartOfWeek = (date: Date): Date => {
  const start = new Date(date)
  const day = start.getDay()
  const diff = start.getDate() - day
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)
  return start
}

const generateWeekData = (weekStart: Date) => {
  const weekData = []
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart)
    currentDate.setDate(weekStart.getDate() + i)
    const dateStr = currentDate.toISOString().split('T')[0]
    const dayData = (tradingData as any)[dateStr] || { pnl: 0, trades: 0 }

    weekData.push({
      date: currentDate.getDate(),
      day: dayNames[currentDate.getDay()],
      pnl: dayData.pnl,
      trades: dayData.trades,
      fullDate: currentDate
    })
  }

  return weekData
}

interface CalendarDayProps {
  date: number
  day: string
  pnl: number
  trades: number
  isToday?: boolean
}

function CalendarDay({ date, day, pnl, trades, isToday }: CalendarDayProps) {
  const hasActivity = trades > 0
  const isPositive = pnl > 0
  const isNegative = pnl < 0

  return (
    <div className={cn(
      'flex-1 p-3 text-center cursor-pointer transition-all duration-200',
      'shadow-studio-subtle hover:shadow-studio hover:bg-[#0f0f0f] hover:-translate-y-0.5',
      isToday && 'bg-primary/5 border border-primary/20 rounded-lg shadow-studio'
    )}>
      <div className="text-xs studio-muted mb-1">{day}</div>
      <div className={cn(
        'text-lg font-semibold mb-1',
        isToday ? 'text-primary' : 'studio-text'
      )}>
        {date}
      </div>

      {hasActivity ? (
        <>
          <div className={cn(
            'text-sm font-semibold mb-1',
            isPositive && 'text-green-400',
            isNegative && 'text-red-400'
          )}>
            {pnl > 0 ? '+' : ''}${Math.abs(pnl).toLocaleString()}
          </div>
          <div className="text-xs studio-muted">
            {trades} trade{trades !== 1 ? 's' : ''}
          </div>
        </>
      ) : (
        <div className="text-xs studio-muted mt-2">No trades</div>
      )}
    </div>
  )
}

export function CalendarRow() {
  const { dateRange, setDateRange, currentWeekStart, setCurrentWeekStart, displayMode, setDisplayMode, getCalendarLabel } = useDateRange()

  // Generate week data based on current context
  const weekData = generateWeekData(currentWeekStart)
  const totalWeekPnL = weekData.reduce((sum, day) => sum + day.pnl, 0)
  const totalWeekTrades = weekData.reduce((sum, day) => sum + day.trades, 0)

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  // Navigation functions
  const handlePreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart)
    newWeekStart.setDate(newWeekStart.getDate() - 7)
    setCurrentWeekStart(newWeekStart)
  }

  const handleNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart)
    newWeekStart.setDate(newWeekStart.getDate() + 7)
    setCurrentWeekStart(newWeekStart)
  }

  const canNavigateForward = () => {
    const nextWeekStart = new Date(currentWeekStart)
    nextWeekStart.setDate(nextWeekStart.getDate() + 7)
    return nextWeekStart <= new Date()
  }

  // Today for highlighting
  const today = new Date()
  const todayDateStr = today.toISOString().split('T')[0]

  return (
    <div className="studio-surface border-b border-[#1a1a1a] px-6 py-4 shadow-studio">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold studio-text">{getCalendarLabel()}</h2>
          <div className="flex items-center space-x-2 text-sm studio-muted">
            <span>Total:</span>
            <span className={cn(
              'font-semibold',
              totalWeekPnL >= 0 ? 'text-green-400' : 'text-red-400'
            )}>
              {totalWeekPnL >= 0 ? '+' : ''}${totalWeekPnL.toLocaleString()}
            </span>
            <span>•</span>
            <span>{totalWeekTrades} trades</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Date Range Toggle - TraderView Style */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDateRange('7d')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded transition-all duration-200',
                dateRange === '7d'
                  ? 'bg-traderra-gold text-black'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
              )}
            >
              7d
            </button>
            <button
              onClick={() => setDateRange('30d')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded transition-all duration-200',
                dateRange === '30d'
                  ? 'bg-traderra-gold text-black'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
              )}
            >
              30d
            </button>
            <button
              onClick={() => setDateRange('90d')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded transition-all duration-200',
                dateRange === '90d'
                  ? 'bg-traderra-gold text-black'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
              )}
            >
              90d
            </button>
            <button
              className={cn(
                'px-2 py-1.5 rounded transition-all duration-200 flex items-center justify-center',
                dateRange === 'custom'
                  ? 'bg-traderra-gold text-black'
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

          {/* Week Navigation - always available */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousWeek}
              className="p-1 rounded transition-colors hover:bg-[#1a1a1a] studio-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm studio-muted px-2">
              {formatDateForDisplay(currentWeekStart)} - {formatDateForDisplay(new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000))}
            </span>
            <button
              onClick={handleNextWeek}
              disabled={!canNavigateForward()}
              className={cn(
                "p-1 rounded transition-colors",
                canNavigateForward()
                  ? "hover:bg-[#1a1a1a] studio-muted"
                  : "opacity-30 cursor-not-allowed studio-muted"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Row - always show individual days for current week */}
      <div className="flex space-x-1">
        {weekData.map((day, index) => {
          const dayDateStr = day.fullDate.toISOString().split('T')[0]
          return (
            <CalendarDay
              key={index}
              date={day.date}
              day={day.day}
              pnl={day.pnl}
              trades={day.trades}
              isToday={dayDateStr === todayDateStr}
            />
          )
        })}
      </div>
    </div>
  )
}