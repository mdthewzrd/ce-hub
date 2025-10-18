'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import { isWeekend, subDays, format } from 'date-fns'

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

interface TradingChartProps {
  symbol: string
  trade?: {
    entryTime: string
    exitTime: string
    entryPrice: number
    exitPrice: number
    side: 'Long' | 'Short'
  }
  className?: string
  height?: number
  timeframe?: '2m' | '5m' | '15m' | '1h' | '1d'
}

interface CandlestickData {
  x: string[]
  open: number[]
  high: number[]
  low: number[]
  close: number[]
}

const POLYGON_API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'

// Helper function to check if a date is a market holiday (basic US holidays)
const isMarketHoliday = (date: Date): boolean => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()

  // Basic US market holidays (simplified)
  const holidays = [
    new Date(year, 0, 1), // New Year's Day
    new Date(year, 6, 4), // Independence Day
    new Date(year, 11, 25), // Christmas
  ]

  return holidays.some(holiday =>
    holiday.getFullYear() === year &&
    holiday.getMonth() === month &&
    holiday.getDate() === day
  )
}

// Helper function to get the last trading day
const getLastTradingDay = (fromDate: Date): Date => {
  let date = new Date(fromDate)
  while (isWeekend(date) || isMarketHoliday(date)) {
    date = subDays(date, 1)
  }
  return date
}

// Helper function to get trading days for date range
const getTradingDateRange = (daysBack: number): { from: string, to: string } => {
  let endDate = getLastTradingDay(new Date())
  let startDate = new Date(endDate)
  let tradingDaysFound = 0

  while (tradingDaysFound < daysBack) {
    startDate = subDays(startDate, 1)
    if (!isWeekend(startDate) && !isMarketHoliday(startDate)) {
      tradingDaysFound++
    }
  }

  return {
    from: format(startDate, 'yyyy-MM-dd'),
    to: format(endDate, 'yyyy-MM-dd')
  }
}

export function TradingChart({ symbol, trade, className, height = 800, timeframe = '15m' }: TradingChartProps) {
  const [candlestickData, setCandlestickData] = useState<CandlestickData>({
    x: [],
    open: [],
    high: [],
    low: [],
    close: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentOHLC, setCurrentOHLC] = useState<{
    time: string
    open: number
    high: number
    low: number
    close: number
  } | null>(null)

  // Timeframe configuration
  const getTimeframeConfig = (timeframe: string) => {
    const configs = {
      '2m': {
        multiplier: 2,
        timespan: 'minute',
        daysBefore: trade ? 1 : 0,
        daysAfter: trade ? 0 : 0,
        label: '2m'
      },
      '5m': {
        multiplier: 5,
        timespan: 'minute',
        daysBefore: trade ? 2 : 1,
        daysAfter: trade ? 1 : 0,
        label: '5m'
      },
      '15m': {
        multiplier: 15,
        timespan: 'minute',
        daysBefore: trade ? 5 : 5,
        daysAfter: trade ? 3 : 0,
        label: '15m'
      },
      '1h': {
        multiplier: 1,
        timespan: 'hour',
        daysBefore: trade ? 14 : 14,
        daysAfter: trade ? 5 : 0,
        label: '1h'
      },
      '1d': {
        multiplier: 1,
        timespan: 'day',
        daysBefore: trade ? 60 : 60,
        daysAfter: trade ? 14 : 0,
        label: '1d'
      }
    }
    return configs[timeframe as keyof typeof configs] || configs['15m']
  }

  const fetchCandlestickData = async (symbol: string, from: string, to: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const config = getTimeframeConfig(timeframe)

      console.log(`🔍 Fetching ${symbol} ${timeframe} data from ${from} to ${to}`)

      // Polygon.io aggregates (bars) endpoint with dynamic timeframe
      const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${config.multiplier}/${config.timespan}/${from}/${to}?adjusted=true&sort=asc&limit=50000&apikey=${POLYGON_API_KEY}`
      console.log(`📡 API URL: ${url}`)

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`📊 API Response for ${symbol} ${timeframe}:`, {
        status: data.status,
        resultsCount: data.results?.length || 0,
        queryCount: data.queryCount,
        request_id: data.request_id,
        firstBar: data.results?.[0],
        lastBar: data.results?.[data.results?.length - 1]
      })

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        throw new Error(data.error || 'No data available for this symbol/timeframe')
      }

      // Use real market data timestamps but filter for trading hours only
      const rawBars = data.results
      const x: string[] = []
      const open: number[] = []
      const high: number[] = []
      const low: number[] = []
      const close: number[] = []

      console.log(`📊 Processing ${rawBars.length} raw bars from API`)
      console.log(`📅 Trade entry time: ${trade?.entryTime}`)

      rawBars.forEach((bar: any) => {
        const barTime = new Date(bar.t)
        const isWeekend = barTime.getUTCDay() === 0 || barTime.getUTCDay() === 6

        if (!isWeekend) {
          // Convert UTC timestamp to Eastern Time for proper display
          const easternTime = new Date(barTime.getTime() - (5 * 60 * 60 * 1000))
          x.push(easternTime.toISOString())
          open.push(bar.o)
          high.push(bar.h)
          low.push(bar.l)
          close.push(bar.c)
        }
      })

      console.log(`✅ Processed ${x.length} continuous data points for ${symbol} ${timeframe}`)
      console.log(`📈 Price range: $${Math.min(...low).toFixed(2)} - $${Math.max(...high).toFixed(2)}`)
      setCandlestickData({ x, open, high, low, close })
    } catch (err) {
      console.error('Error fetching candlestick data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch chart data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadChartData = async () => {
    if (!symbol) return

    try {
      const config = getTimeframeConfig(timeframe)
      let fromDate: string
      let toDate: string

      if (trade) {
        // Simple: show from entry day to exit day only
        // Trade times are already in Eastern Time format (e.g., '2024-12-13T09:30:00')
        const entryDate = new Date(trade.entryTime + '-05:00') // Explicitly mark as EST
        const exitDate = new Date(trade.exitTime + '-05:00')

        // Get the date part only (no time) for entry and exit
        const entryDateStr = format(entryDate, 'yyyy-MM-dd')
        const exitDateStr = format(exitDate, 'yyyy-MM-dd')

        fromDate = entryDateStr
        toDate = exitDateStr

        console.log(`📊 Loading ${timeframe} chart data for trade period:`)
        console.log(`   Entry Eastern: ${trade.entryTime} (${entryDateStr})`)
        console.log(`   Exit Eastern: ${trade.exitTime} (${exitDateStr})`)
        console.log(`   Date range: ${fromDate} to ${toDate}`)
      } else {
        // Default based on timeframe configuration
        const { from, to } = getTradingDateRange(config.daysBefore)
        fromDate = from
        toDate = to

        console.log(`📊 Loading default ${timeframe} chart data from ${fromDate} to ${toDate}`)
      }

      await fetchCandlestickData(symbol, fromDate, toDate)
    } catch (error) {
      console.error('Error loading chart data:', error)
    }
  }

  useEffect(() => {
    if (symbol) {
      loadChartData()
    }
  }, [symbol, trade, timeframe])

  if (error) {
    return (
      <div className={cn('flex items-center justify-center bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]', className)} style={{ height }}>
        <div className="text-center">
          <div className="text-red-400 text-sm mb-2">Chart Error</div>
          <div className="text-xs studio-muted max-w-md">{error}</div>
          <button
            onClick={() => loadChartData()}
            className="mt-3 px-3 py-1 text-xs bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Helper function to create session background shapes for continuous data
  const createSessionBackgrounds = () => {
    if (candlestickData.x.length === 0) return []

    const shapes: any[] = []
    const config = getTimeframeConfig(timeframe)

    // Calculate bars per session for continuous data
    const barsPerHour = 60 / config.multiplier
    const preMarketBars = Math.floor(5.5 * barsPerHour) // 4:00 AM - 9:30 AM (5.5 hours)
    const regularHoursBars = Math.floor(6.5 * barsPerHour) // 9:30 AM - 4:00 PM (6.5 hours)
    const afterHoursBars = Math.floor(4 * barsPerHour) // 4:00 PM - 8:00 PM (4 hours)
    const totalDailyBars = preMarketBars + regularHoursBars + afterHoursBars

    console.log(`📊 Session bars for ${timeframe}: Pre-market: ${preMarketBars}, Regular: ${regularHoursBars}, After: ${afterHoursBars}`)

    // Apply session backgrounds to all visible trading days
    let currentBar = 0
    let dayCount = 0

    while (currentBar < candlestickData.x.length) {
      const dayStartBar = currentBar
      const preMarketEndBar = Math.min(currentBar + preMarketBars, candlestickData.x.length)
      const regularHoursEndBar = Math.min(preMarketEndBar + regularHoursBars, candlestickData.x.length)
      const afterHoursEndBar = Math.min(regularHoursEndBar + afterHoursBars, candlestickData.x.length)

      // Pre-market session background (dark gray)
      if (preMarketEndBar > dayStartBar) {
        shapes.push({
          type: 'rect',
          xref: 'x',
          yref: 'paper',
          x0: candlestickData.x[dayStartBar],
          x1: candlestickData.x[preMarketEndBar - 1],
          y0: 0,
          y1: 1,
          fillcolor: 'rgba(64, 64, 64, 0.3)',
          line: { width: 0 },
          layer: 'below'
        })
      }

      // After-hours session background (dark gray)
      if (afterHoursEndBar > regularHoursEndBar) {
        shapes.push({
          type: 'rect',
          xref: 'x',
          yref: 'paper',
          x0: candlestickData.x[regularHoursEndBar],
          x1: candlestickData.x[afterHoursEndBar - 1],
          y0: 0,
          y1: 1,
          fillcolor: 'rgba(64, 64, 64, 0.3)',
          line: { width: 0 },
          layer: 'below'
        })
      }

      currentBar = afterHoursEndBar
      dayCount++
    }

    console.log(`📅 Applied session backgrounds to ${dayCount} trading days with ${shapes.length} rectangles`)
    return shapes
  }

  // Prepare trade markers with directional triangles
  const annotations: any[] = []
  const shapes: any[] = [...createSessionBackgrounds()]

  // Add dynamic OHLC values at the top of the chart
  if (currentOHLC) {
    annotations.push({
      x: 0.02, // Left side of chart
      y: 0.95, // Near top (in the buffer space)
      xref: 'paper',
      yref: 'paper',
      text: `${currentOHLC.time} • O: $${currentOHLC.open.toFixed(2)} • H: $${currentOHLC.high.toFixed(2)} • L: $${currentOHLC.low.toFixed(2)} • C: $${currentOHLC.close.toFixed(2)}`,
      font: {
        size: 14,
        color: '#fcd34d', // Gold color
        family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      },
      showarrow: false,
      align: 'left',
      bgcolor: 'transparent', // No background
    })
  } else if (candlestickData.x.length > 0) {
    // Show last candle data when not hovering
    const lastIndex = candlestickData.x.length - 1
    const lastTime = new Date(candlestickData.x[lastIndex]).toLocaleString()
    annotations.push({
      x: 0.02,
      y: 0.95,
      xref: 'paper',
      yref: 'paper',
      text: `${lastTime} • O: $${candlestickData.open[lastIndex].toFixed(2)} • H: $${candlestickData.high[lastIndex].toFixed(2)} • L: $${candlestickData.low[lastIndex].toFixed(2)} • C: $${candlestickData.close[lastIndex].toFixed(2)}`,
      font: {
        size: 14,
        color: '#fcd34d',
        family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      },
      showarrow: false,
      align: 'left',
      bgcolor: 'transparent',
    })
  }

  if (trade && candlestickData.x.length > 0) {
    console.log(`🎯 Setting up trade markers for ${trade.side} ${symbol} trade`)
    console.log(`📅 Entry: ${trade.entryTime} at $${trade.entryPrice}`)
    console.log(`📅 Exit: ${trade.exitTime} at $${trade.exitPrice}`)

    // Find closest timestamp indices for entry and exit
    // Convert trade times from Eastern Time (naive) to match chart timestamps (Eastern Time shifted)
    const entryTimeEastern = new Date(trade.entryTime + '-05:00') // Parse as EST
    const exitTimeEastern = new Date(trade.exitTime + '-05:00')   // Parse as EST

    // Now shift by -5 hours to match the chart data format
    const entryTime = new Date(entryTimeEastern.getTime() - (5 * 60 * 60 * 1000)).toISOString()
    const exitTime = new Date(exitTimeEastern.getTime() - (5 * 60 * 60 * 1000)).toISOString()

    console.log(`📅 Looking for entry time: ${entryTime} (from ${trade.entryTime})`)
    console.log(`📅 Looking for exit time: ${exitTime} (from ${trade.exitTime})`)
    console.log(`📅 First chart timestamp: ${candlestickData.x[0]}`)
    console.log(`📅 Last chart timestamp: ${candlestickData.x[candlestickData.x.length - 1]}`)

    const findClosestIndex = (targetTime: string) => {
      const targetTimestamp = new Date(targetTime).getTime()
      let closestIndex = 0
      let closestDiff = Math.abs(new Date(candlestickData.x[0]).getTime() - targetTimestamp)

      candlestickData.x.forEach((time, index) => {
        const diff = Math.abs(new Date(time).getTime() - targetTimestamp)
        if (diff < closestDiff) {
          closestDiff = diff
          closestIndex = index
        }
      })
      return closestIndex
    }

    const entryIndex = findClosestIndex(entryTime)
    const exitIndex = findClosestIndex(exitTime)

    console.log(`📍 Entry marker: index ${entryIndex} (timestamp: ${candlestickData.x[entryIndex]})`)
    console.log(`📍 Exit marker: index ${exitIndex} (timestamp: ${candlestickData.x[exitIndex]})`)

    console.log(`📍 Creating arrows for Long trade:`)
    console.log(`  Entry: Green ▲ at ${trade.entryTime} ($${trade.entryPrice})`)
    console.log(`  Exit: Red ▼ at ${trade.exitTime} ($${trade.exitPrice})`)

    // Entry triangle - point at fill price, direction based on trade side
    if (entryIndex < candlestickData.x.length) {
      const xPos = candlestickData.x[entryIndex]
      const yPos = trade.entryPrice

      console.log(`📍 Creating entry arrow at ${xPos}, $${yPos}`)

      // Add entry annotation with triangle (black border + 85% opacity)
      if (trade.side === 'Long') {
        // Long entry: First add black outline triangle (larger)
        annotations.push({
          x: xPos,
          y: yPos,
          xref: 'x',
          yref: 'y',
          text: '▲',
          font: {
            size: 34, // Larger for black border effect
            color: '#000000', // Black border
            family: 'Arial Black, sans-serif'
          },
          showarrow: false,
          hovertext: `${trade.side} Entry: $${trade.entryPrice.toFixed(2)}`,
        })
        // Then add green filled triangle on top (smaller)
        annotations.push({
          x: xPos,
          y: yPos,
          xref: 'x',
          yref: 'y',
          text: '▲',
          font: {
            size: 30,
            color: 'rgba(34, 197, 94, 0.7)', // Bright green at 70% opacity
            family: 'Arial Black, sans-serif'
          },
          showarrow: false,
          hovertext: `${trade.side} Entry: $${trade.entryPrice.toFixed(2)}`,
        })
      } else {
        // Short entry: First add black outline triangle (larger)
        annotations.push({
          x: xPos,
          y: yPos,
          xref: 'x',
          yref: 'y',
          text: '▼',
          font: {
            size: 34, // Larger for black border effect
            color: '#000000', // Black border
            family: 'Arial Black, sans-serif'
          },
          showarrow: false,
          hovertext: `${trade.side} Entry: $${trade.entryPrice.toFixed(2)}`,
        })
        // Then add pink filled triangle on top (smaller)
        annotations.push({
          x: xPos,
          y: yPos,
          xref: 'x',
          yref: 'y',
          text: '▼',
          font: {
            size: 30,
            color: 'rgba(236, 72, 153, 0.7)', // Bright pink at 70% opacity
            family: 'Arial Black, sans-serif'
          },
          showarrow: false,
          hovertext: `${trade.side} Entry: $${trade.entryPrice.toFixed(2)}`,
        })
      }
    }

    // Exit triangle - point at fill price, direction based on trade side
    if (exitIndex < candlestickData.x.length) {
      const xPos = candlestickData.x[exitIndex]
      const yPos = trade.exitPrice

      console.log(`📍 Creating exit arrow at ${xPos}, $${yPos}`)

      // Add exit annotation with triangle (black border + 85% opacity)
      if (trade.side === 'Long') {
        // Long exit: First add black outline triangle (larger)
        annotations.push({
          x: xPos,
          y: yPos,
          xref: 'x',
          yref: 'y',
          text: '▼',
          font: {
            size: 34, // Larger for black border effect
            color: '#000000', // Black border
            family: 'Arial Black, sans-serif'
          },
          showarrow: false,
          hovertext: `Exit: $${trade.exitPrice.toFixed(2)} (Profit)`,
        })
        // Then add pink filled triangle on top (smaller)
        annotations.push({
          x: xPos,
          y: yPos,
          xref: 'x',
          yref: 'y',
          text: '▼',
          font: {
            size: 30,
            color: 'rgba(236, 72, 153, 0.7)', // Bright pink at 70% opacity
            family: 'Arial Black, sans-serif'
          },
          showarrow: false,
          hovertext: `Exit: $${trade.exitPrice.toFixed(2)} (Profit)`,
        })
      } else {
        // Short exit: First add black outline triangle (larger)
        annotations.push({
          x: xPos,
          y: yPos,
          xref: 'x',
          yref: 'y',
          text: '▲',
          font: {
            size: 34, // Larger for black border effect
            color: '#000000', // Black border
            family: 'Arial Black, sans-serif'
          },
          showarrow: false,
          hovertext: `Exit: $${trade.exitPrice.toFixed(2)} (Profit)`,
        })
        // Then add green filled triangle on top (smaller)
        annotations.push({
          x: xPos,
          y: yPos,
          xref: 'x',
          yref: 'y',
          text: '▲',
          font: {
            size: 30,
            color: 'rgba(34, 197, 94, 0.7)', // Bright green at 70% opacity
            family: 'Arial Black, sans-serif'
          },
          showarrow: false,
          hovertext: `Exit: $${trade.exitPrice.toFixed(2)} (Profit)`,
        })
      }
    }
  }

  return (
    <div className={cn('relative bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] overflow-hidden', className)}>
      {/* Chart Header */}
      <div className="absolute top-2 left-4 z-10 bg-[#0a0a0a]/80 backdrop-blur-sm rounded px-2 py-1">
        <div className="flex items-center space-x-3 text-xs">
          <span className="font-semibold studio-text">{symbol}</span>
          <span className="studio-muted">{getTimeframeConfig(timeframe).label}</span>
          <span className="studio-muted">•</span>
          <span className="studio-muted">Pre/Post Market</span>
          {trade && (
            <>
              <span className="studio-muted">•</span>
              <span className={cn(
                'font-medium',
                trade.side === 'Long' ? 'text-green-400' : 'text-red-400'
              )}>
                {trade.side} Trade
              </span>
            </>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="flex items-center space-x-2 text-sm studio-muted">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>Loading {symbol} chart data...</span>
          </div>
        </div>
      )}

      {/* Plotly Chart */}
      {!isLoading && candlestickData.x.length > 0 && (
        <Plot
          data={[
            {
              x: candlestickData.x,
              open: candlestickData.open,
              high: candlestickData.high,
              low: candlestickData.low,
              close: candlestickData.close,
              type: 'candlestick' as const,
              name: symbol,
              increasing: {
                line: { color: '#ffffff', width: 1 },
                fillcolor: '#ffffff'
              },
              decreasing: {
                line: { color: '#ef4444', width: 1 },
                fillcolor: '#ef4444'
              },
              hoverinfo: 'none', // Disable hover tooltip since we'll show values at top
              yaxis: 'y',
              xaxis: 'x',
            }
          ]}
          layout={{
            autosize: true,
            width: undefined,
            height: height,
            paper_bgcolor: '#0a0a0a',
            plot_bgcolor: '#000000', // Black background for regular trading hours
            font: {
              color: '#e5e5e5',
              family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              size: 11
            },
            xaxis: {
              type: 'date',
              gridcolor: '#1a1a1a',
              gridwidth: 1,
              linecolor: '#1a1a1a',
              tickcolor: '#1a1a1a',
              tickfont: { color: '#e5e5e5', size: 10 },
              title: { text: '', font: { color: '#e5e5e5' } },
              showspikes: true,
              spikecolor: '#fcd34d', // Gold crosshair
              spikethickness: 0.5,
              spikedash: 'longdash', // Long dashes with big gaps
              spikemode: 'across',
              spikesnap: 'cursor', // Freeform crosshair - follows cursor, not data points
              rangeslider: { visible: false },
              rangeselector: { visible: false },
              showticklabels: true,
              zeroline: false,
              // Auto-scaling tick format based on zoom level
              tickmode: 'auto',
              nticks: 8,
              tickangle: 0,
              // Initial range shows exactly entry day to exit day (4am-8pm each day)
              ...(trade && candlestickData.x.length > 0 && (() => {
                // Trade times are already in Eastern Time format
                const entryDate = new Date(trade.entryTime + '-05:00') // Explicitly mark as EST
                const exitDate = new Date(trade.exitTime + '-05:00')

                const entryDateStr = format(entryDate, 'yyyy-MM-dd')
                const exitDateStr = format(exitDate, 'yyyy-MM-dd')

                console.log(`🎯 Setting chart range for trade period: ${entryDateStr} to ${exitDateStr}`)

                // Find first bar of entry day and last bar of exit day
                let startIndex = 0
                let endIndex = candlestickData.x.length - 1

                // Find start of entry day (first bar of that day)
                for (let i = 0; i < candlestickData.x.length; i++) {
                  const barDate = new Date(candlestickData.x[i])
                  // Timestamps are already in Eastern Time
                  const barDateStr = format(barDate, 'yyyy-MM-dd')
                  if (barDateStr === entryDateStr) {
                    startIndex = i
                    break
                  }
                }

                // Find end of exit day (last bar of that day)
                for (let i = candlestickData.x.length - 1; i >= 0; i--) {
                  const barDate = new Date(candlestickData.x[i])
                  // Timestamps are already in Eastern Time
                  const barDateStr = format(barDate, 'yyyy-MM-dd')
                  if (barDateStr === exitDateStr) {
                    endIndex = i
                    break
                  }
                }

                console.log(`🎯 Chart range: bars ${startIndex} to ${endIndex}`)
                console.log(`📅 From: ${candlestickData.x[startIndex]} to ${candlestickData.x[endIndex]}`)

                return {
                  range: [
                    candlestickData.x[startIndex],
                    candlestickData.x[endIndex]
                  ]
                }
              })())
            },
            yaxis: {
              gridcolor: '#1a1a1a',
              gridwidth: 1,
              linecolor: '#1a1a1a',
              tickcolor: '#1a1a1a',
              tickfont: { color: '#e5e5e5', size: 10 },
              title: { text: 'Price ($)', font: { color: '#e5e5e5' } },
              showspikes: true,
              spikecolor: '#fcd34d', // Gold crosshair
              spikethickness: 0.5,
              spikedash: 'longdash', // Long dashes with big gaps
              spikemode: 'across',
              spikesnap: 'cursor', // Freeform crosshair - follows cursor, not data points
              fixedrange: false,
              autorange: false, // Disable auto-range to use custom range
              // Calculate range for trade day only (first ~16 hours of data for 4 AM - 8 PM)
              ...(trade && candlestickData.high.length > 0 && (() => {
                const config = getTimeframeConfig(timeframe)
                const barsPerHour = 60 / config.multiplier
                const tradeDayBars = Math.floor(16 * barsPerHour) // 16 hours (4 AM - 8 PM)
                const tradeDayEnd = Math.min(tradeDayBars, candlestickData.high.length)

                // Get high/low for trade day only
                const tradeDayHigh = Math.max(...candlestickData.high.slice(0, tradeDayEnd))
                const tradeDayLow = Math.min(...candlestickData.low.slice(0, tradeDayEnd))
                const range = tradeDayHigh - tradeDayLow
                const bottomPadding = range * 0.05 // 5% padding at bottom
                const topPadding = range * 0.15 // 15% padding at top for OHLC display

                return {
                  range: [
                    tradeDayLow - bottomPadding,
                    tradeDayHigh + topPadding
                  ]
                }
              })() || {
                // Fallback for when no trade data
                range: candlestickData.high.length > 0 ? [
                  Math.min(...candlestickData.low) * 0.995,
                  Math.max(...candlestickData.high) * 1.005
                ] : undefined
              })
            },
            margin: { l: 60, r: 20, t: 40, b: 40 },
            showlegend: false,
            hovermode: 'x', // Enable hover for crosshair but use custom handling
            annotations: annotations,
            shapes: shapes, // Combined session backgrounds and trade markers
            dragmode: 'pan'
          }}
          config={{
            displayModeBar: true,
            modeBarButtonsToRemove: [
              'autoScale2d',
              'resetScale2d',
              'toggleSpikelines',
              'hoverCompareCartesian',
              'lasso2d',
              'select2d'
            ],
            displaylogo: false,
            responsive: true,
            scrollZoom: true
          }}
          onHover={(data) => {
            if (data.points && data.points.length > 0) {
              const point = data.points[0]
              if (point.pointIndex !== undefined) {
                const index = point.pointIndex
                setCurrentOHLC({
                  time: new Date(candlestickData.x[index]).toLocaleString(),
                  open: candlestickData.open[index],
                  high: candlestickData.high[index],
                  low: candlestickData.low[index],
                  close: candlestickData.close[index]
                })
              }
            }
          }}
          onUnhover={() => {
            setCurrentOHLC(null)
          }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      )}

      {/* Chart legend */}
      <div className="absolute bottom-2 left-4 z-10 bg-[#0a0a0a]/80 backdrop-blur-sm rounded px-2 py-1">
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-2 bg-white border border-white"></div>
            <span className="studio-muted">Bullish</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-2 bg-red-400 border border-red-400"></div>
            <span className="studio-muted">Bearish</span>
          </div>
          {trade && (
            <>
              <div className="flex items-center space-x-1">
                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-green-400"></div>
                <span className="studio-muted">Entry</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-red-400"></div>
                <span className="studio-muted">Exit</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}