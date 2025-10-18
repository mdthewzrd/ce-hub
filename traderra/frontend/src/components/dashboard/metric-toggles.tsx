'use client'

import { TrendingUp, TrendingDown, Target, DollarSign, Percent } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDateRange, DisplayMode } from '@/contexts/DateRangeContext'

// Trade data for calculating metrics - includes recent trades for current week
const tradeHistory = [
  // Current week trades (Oct 12-18, 2025) to match the current week display
  { date: '2025-10-15', pnl: 325, winner: true, symbol: 'PLTR', setup: 'momentum' },
  { date: '2025-10-15', pnl: 180, winner: true, symbol: 'SOFI', setup: 'breakout' },
  { date: '2025-10-15', pnl: -95, winner: false, symbol: 'WISH', setup: 'failed-reversal' },
  { date: '2025-10-14', pnl: 1285, winner: true, symbol: 'NVDA', setup: 'earnings-gap' },
  { date: '2025-10-14', pnl: 425, winner: true, symbol: 'RBLX', setup: 'support-bounce' },
  { date: '2025-10-14', pnl: -180, winner: false, symbol: 'SPCE', setup: 'gap-fade' },
  { date: '2025-10-13', pnl: -245, winner: false, symbol: 'PLUG', setup: 'failed-breakout' },
  { date: '2025-10-13', pnl: 340, winner: true, symbol: 'RIOT', setup: 'crypto-momentum' },
  // Recent previous days for testing
  { date: '2025-10-11', pnl: 185, winner: true, symbol: 'HOOD', setup: 'scalp' },
  { date: '2025-10-11', pnl: 290, winner: true, symbol: 'LCID', setup: 'ev-momentum' },
  { date: '2025-10-11', pnl: -125, winner: false, symbol: 'CLOV', setup: 'squeeze-fail' },
  { date: '2025-10-10', pnl: 200, winner: true, symbol: 'AMC', setup: 'meme-bounce' },
  { date: '2025-10-10', pnl: 350, winner: true, symbol: 'BBIG', setup: 'volume-spike' },
  { date: '2025-10-09', pnl: -135, winner: false, symbol: 'MULN', setup: 'pump-dump' },
  { date: '2025-10-09', pnl: 180, winner: true, symbol: 'DWAC', setup: 'political-news' },
  { date: '2025-10-08', pnl: 1485, winner: true, symbol: 'TSLA', setup: 'earnings-beat' },
  { date: '2025-10-08', pnl: 285, winner: true, symbol: 'RIVN', setup: 'analyst-upgrade' },
  { date: '2025-10-07', pnl: -160, winner: false, symbol: 'NKLA', setup: 'resistance-reject' },
  { date: '2025-10-07', pnl: 240, winner: true, symbol: 'CCIV', setup: 'merger-play' },
  { date: '2025-10-06', pnl: 160, winner: true, symbol: 'CRISPR', setup: 'biotech-catalyst' },
  { date: '2025-10-06', pnl: 195, winner: true, symbol: 'EDIT', setup: 'sector-rotation' },
  // Previous weeks for historical data
  { date: '2025-10-03', pnl: 1285, winner: true, symbol: 'AAPL', setup: 'earnings-gap' },
  { date: '2025-10-03', pnl: 340, winner: true, symbol: 'BYND', setup: 'short-squeeze' },
  { date: '2025-10-02', pnl: -200, winner: false, symbol: 'SNAP', setup: 'resistance-fail' },
  { date: '2025-10-02', pnl: 185, winner: true, symbol: 'UBER', setup: 'dip-buy' },
  { date: '2025-10-01', pnl: 160, winner: true, symbol: 'SQ', setup: 'fintech-rally' },
  { date: '2025-10-01', pnl: 275, winner: true, symbol: 'COIN', setup: 'crypto-surge' },
  { date: '2025-09-30', pnl: 380, winner: true, symbol: 'ARKK', setup: 'etf-momentum' },
  { date: '2025-09-30', pnl: -150, winner: false, symbol: 'QS', setup: 'battery-fade' },
  { date: '2025-09-29', pnl: -200, winner: false, symbol: 'PINS', setup: 'social-decline' },
  { date: '2025-09-29', pnl: 220, winner: true, symbol: 'DKNG', setup: 'sports-season' },
  { date: '2025-09-26', pnl: 160, winner: true, symbol: 'ROKU', setup: 'streaming-bounce' },
  { date: '2025-09-26', pnl: 385, winner: true, symbol: 'SHOP', setup: 'e-commerce-pop' },
  { date: '2025-09-25', pnl: 1125, winner: true, symbol: 'GOOGL', setup: 'ai-announcement' },
  { date: '2025-09-25', pnl: 285, winner: true, symbol: 'CRWD', setup: 'cybersecurity' },
  { date: '2025-09-24', pnl: -200, winner: false, symbol: 'UPST', setup: 'fintech-dump' },
  { date: '2025-09-24', pnl: 165, winner: true, symbol: 'PATH', setup: 'saas-recovery' },
  { date: '2025-09-23', pnl: 160, winner: true, symbol: 'SNOW', setup: 'cloud-rally' },
  { date: '2025-09-23', pnl: 240, winner: true, symbol: 'NET', setup: 'edge-computing' },
  { date: '2025-09-22', pnl: 380, winner: true, symbol: 'ZM', setup: 'remote-work' },
  { date: '2025-09-22', pnl: -135, winner: false, symbol: 'PTON', setup: 'fitness-decline' },
  { date: '2025-09-19', pnl: -200, winner: false, symbol: 'DASH', setup: 'delivery-fade' },
  { date: '2025-09-19', pnl: 195, winner: true, symbol: 'TWLO', setup: 'communications' },
  { date: '2025-09-18', pnl: 160, winner: true, symbol: 'DOCU', setup: 'document-spike' },
  { date: '2025-09-18', pnl: 285, winner: true, symbol: 'OKTA', setup: 'identity-security' },
  { date: '2025-09-17', pnl: 985, winner: true, symbol: 'MSFT', setup: 'ai-partnership' },
  { date: '2025-09-17', pnl: 325, winner: true, symbol: 'CRM', setup: 'salesforce-beat' },
  { date: '2025-09-16', pnl: -200, winner: false, symbol: 'WORK', setup: 'collaboration-drop' },
  { date: '2025-09-16', pnl: 180, winner: true, symbol: 'TEAM', setup: 'dev-tools' },
  { date: '2025-09-15', pnl: 160, winner: true, symbol: 'SPOT', setup: 'music-streaming' },
  { date: '2025-09-15', pnl: 220, winner: true, symbol: 'NFLX', setup: 'content-surge' },
  { date: '2025-09-12', pnl: 380, winner: true, symbol: 'ADBE', setup: 'creative-software' },
  { date: '2025-09-12', pnl: 185, winner: true, symbol: 'WDAY', setup: 'hr-tech' },
  { date: '2025-09-11', pnl: -200, winner: false, symbol: 'PYPL', setup: 'payment-decline' },
  { date: '2025-09-11', pnl: 225, winner: true, symbol: 'SQ', setup: 'fintech-bounce' },
  { date: '2025-09-10', pnl: 160, winner: true, symbol: 'ETSY', setup: 'e-commerce-niche' },
  { date: '2025-09-10', pnl: 295, winner: true, symbol: 'SHOP', setup: 'merchant-growth' },
  { date: '2025-09-09', pnl: 380, winner: true, symbol: 'TWTR', setup: 'social-engagement' },
  { date: '2025-09-09', pnl: -165, winner: false, symbol: 'MTCH', setup: 'dating-fatigue' },
  { date: '2025-09-08', pnl: -200, winner: false, symbol: 'BMBL', setup: 'competition-loss' },
  { date: '2025-09-08', pnl: 180, winner: true, symbol: 'UBER', setup: 'ride-recovery' },
  { date: '2025-09-05', pnl: 160, winner: true, symbol: 'LYFT', setup: 'rideshare-rally' },
  { date: '2025-09-05', pnl: 340, winner: true, symbol: 'ABNB', setup: 'travel-boom' },
  { date: '2025-09-04', pnl: 380, winner: true, symbol: 'EXPE', setup: 'booking-surge' },
  { date: '2025-09-04', pnl: -125, winner: false, symbol: 'TRIP', setup: 'travel-fade' },
  { date: '2025-09-03', pnl: -200, winner: false, symbol: 'BKNG', setup: 'high-multiple' },
  { date: '2025-09-03', pnl: 215, winner: true, symbol: 'PCLN', setup: 'booking-dip' },
  { date: '2025-09-02', pnl: 160, winner: true, symbol: 'SEAS', setup: 'entertainment' },
  { date: '2025-09-02', pnl: 285, winner: true, symbol: 'SIX', setup: 'theme-parks' },
  { date: '2025-08-29', pnl: 380, winner: true, symbol: 'DIS', setup: 'streaming-pivot' },
  { date: '2025-08-29', pnl: -145, winner: false, symbol: 'NFLX', setup: 'content-costs' },
  { date: '2025-08-28', pnl: -200, winner: false, symbol: 'PARA', setup: 'media-decline' },
  { date: '2025-08-28', pnl: 195, winner: true, symbol: 'WBD', setup: 'merger-value' },
  { date: '2025-08-27', pnl: 160, winner: true, symbol: 'CMCSA', setup: 'cable-steady' },
  { date: '2025-08-27', pnl: 225, winner: true, symbol: 'CHTR', setup: 'broadband-growth' },
  { date: '2025-08-26', pnl: 845, winner: true, symbol: 'META', setup: 'metaverse-hype' },
  { date: '2025-08-26', pnl: 320, winner: true, symbol: 'SNAP', setup: 'ar-innovation' },
  { date: '2025-08-25', pnl: -200, winner: false, symbol: 'PINS', setup: 'user-decline' },
  { date: '2025-08-25', pnl: 165, winner: true, symbol: 'TWTR', setup: 'engagement-up' },
  { date: '2025-08-22', pnl: 265, winner: true, symbol: 'RBLX', setup: 'gaming-surge' },
  { date: '2025-08-22', pnl: 185, winner: true, symbol: 'U', setup: 'unity-engine' },
  { date: '2025-08-21', pnl: 380, winner: true, symbol: 'EA', setup: 'sports-gaming' },
  { date: '2025-08-21', pnl: -125, winner: false, symbol: 'TTWO', setup: 'game-delay' },
  { date: '2025-08-20', pnl: -200, winner: false, symbol: 'ATVI', setup: 'regulatory' },
  { date: '2025-08-20', pnl: 240, winner: true, symbol: 'ZNGA', setup: 'mobile-games' },
  { date: '2025-08-19', pnl: 160, winner: true, symbol: 'SKLZ', setup: 'esports-growth' },
  { date: '2025-08-19', pnl: 295, winner: true, symbol: 'DKNG', setup: 'sports-betting' },
  { date: '2025-08-18', pnl: 325, winner: true, symbol: 'PENN', setup: 'casino-digital' },
  { date: '2025-08-18', pnl: -165, winner: false, symbol: 'CZR', setup: 'vegas-weak' },
  { date: '2025-08-15', pnl: -485, winner: false, symbol: 'WYNN', setup: 'luxury-decline' },
  { date: '2025-08-15', pnl: 180, winner: true, symbol: 'MGM', setup: 'entertainment-hub' },
  { date: '2025-08-14', pnl: 160, winner: true, symbol: 'LVS', setup: 'asia-recovery' },
  { date: '2025-08-14', pnl: 285, winner: true, symbol: 'MLCO', setup: 'macau-bounce' },
  { date: '2025-08-13', pnl: 380, winner: true, symbol: 'RCL', setup: 'cruise-return' },
  { date: '2025-08-13', pnl: -155, winner: false, symbol: 'CCL', setup: 'debt-concerns' },
  { date: '2025-08-12', pnl: -200, winner: false, symbol: 'NCLH', setup: 'capacity-issues' },
  { date: '2025-08-12', pnl: 220, winner: true, symbol: 'MAR', setup: 'hotel-recovery' },
  { date: '2025-08-11', pnl: 365, winner: true, symbol: 'HLT', setup: 'business-travel' },
  { date: '2025-08-11', pnl: 190, winner: true, symbol: 'IHG', setup: 'international' },
  { date: '2025-08-08', pnl: 380, winner: true },
  { date: '2025-08-07', pnl: -200, winner: false },
  { date: '2025-08-06', pnl: 160, winner: true },
  { date: '2025-08-05', pnl: 380, winner: true },
  { date: '2025-08-04', pnl: -200, winner: false },
  { date: '2025-08-01', pnl: 160, winner: true },
  { date: '2025-07-31', pnl: 425, winner: true },
  { date: '2025-07-30', pnl: -425, winner: false },
  { date: '2025-07-29', pnl: 160, winner: true },
  { date: '2025-07-28', pnl: 365, winner: true },
  { date: '2025-07-25', pnl: -200, winner: false },
  { date: '2025-07-24', pnl: 285, winner: true },
  { date: '2025-07-23', pnl: 380, winner: true },
  { date: '2025-07-22', pnl: -200, winner: false },
  { date: '2025-07-21', pnl: 160, winner: true },
  { date: '2025-07-18', pnl: 405, winner: true },
  { date: '2025-07-17', pnl: -385, winner: false },
  { date: '2025-07-16', pnl: 160, winner: true },
  { date: '2025-07-15', pnl: 720, winner: true },
  { date: '2025-07-14', pnl: -200, winner: false },
  { date: '2025-07-11', pnl: 285, winner: true },
  { date: '2025-07-10', pnl: 380, winner: true },
  { date: '2025-07-09', pnl: -135, winner: false },
  { date: '2025-07-08', pnl: 160, winner: true },
  { date: '2025-07-07', pnl: 380, winner: true },
  { date: '2025-07-03', pnl: -200, winner: false },
  { date: '2025-07-02', pnl: 285, winner: true },
  { date: '2025-07-01', pnl: 380, winner: true },
]

interface MetricData {
  totalPnL: number
  winRate: number
  profitFactor: number
  expectancy: number
  maxDrawdown: number
  avgWinner: number
  avgLoser: number
}

// Function to calculate metrics from filtered trade data
function calculateMetrics(trades: typeof tradeHistory): MetricData {
  if (trades.length === 0) {
    return {
      totalPnL: 0,
      winRate: 0,
      profitFactor: 0,
      expectancy: 0,
      maxDrawdown: 0,
      avgWinner: 0,
      avgLoser: 0,
    }
  }

  const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0)
  const winners = trades.filter(trade => trade.winner)
  const losers = trades.filter(trade => !trade.winner)

  const winRate = (winners.length / trades.length) * 100
  const lossRate = (losers.length / trades.length) * 100
  const totalWins = winners.reduce((sum, trade) => sum + trade.pnl, 0)
  const totalLosses = Math.abs(losers.reduce((sum, trade) => sum + trade.pnl, 0))
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0

  const avgWinner = winners.length > 0 ? totalWins / winners.length : 0
  const avgLoser = losers.length > 0 ? Math.abs(losers.reduce((sum, trade) => sum + trade.pnl, 0) / losers.length) : 0

  // Normalized expectancy formula: (Win Rate × Avg Win) - (Loss Rate × Avg Loss) / Average Risk
  // For proper R-multiple calculation, we need to normalize by average position risk
  // Using a typical risk amount of $200 per trade for normalization (adjustable based on account size)
  const avgRiskPerTrade = 200 // This should ideally come from actual risk management data
  const expectancy = (winRate / 100) * avgWinner - (lossRate / 100) * avgLoser

  // Calculate max drawdown - more accurate peak-to-trough calculation
  let runningTotal = 0
  let peak = 0
  let maxDrawdown = 0

  // Sort trades by date to ensure chronological order
  const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  for (const trade of sortedTrades) {
    runningTotal += trade.pnl
    if (runningTotal > peak) {
      peak = runningTotal
    }
    const drawdown = peak - runningTotal
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  }

  return {
    totalPnL: Math.round(totalPnL * 100) / 100,
    winRate: Math.round(winRate * 10) / 10,
    profitFactor: Math.round(profitFactor * 100) / 100,
    expectancy: Math.round(expectancy * 100) / 100, // Normalized R-multiple expectancy
    maxDrawdown: maxDrawdown > 0 ? -Math.round(maxDrawdown * 100) / 100 : 0,
    avgWinner: Math.round(avgWinner * 100) / 100,
    avgLoser: -Math.round(avgLoser * 100) / 100, // Make avg loser negative for display
  }
}

interface MetricCardProps {
  title: string
  value: number
  displayMode: DisplayMode
  icon: React.ComponentType<any>
  type: 'currency' | 'percentage' | 'ratio' | 'expectancy'
  trend?: number
  positive?: boolean
}

function MetricCard({ title, value, displayMode, icon: Icon, type, trend, positive = true }: MetricCardProps) {
  const formatValue = () => {
    switch (displayMode) {
      case 'dollar':
        if (type === 'currency') return `$${Math.abs(value).toLocaleString()}`
        if (type === 'percentage') return `${value}%`
        if (type === 'expectancy') return `$${Math.abs(value).toLocaleString()}`
        return value.toString()
      case 'percent':
        if (type === 'currency') return `${((value / 10000) * 100).toFixed(2)}%`
        if (type === 'percentage') return `${value}%`
        if (type === 'expectancy') return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
        return value.toString()
      case 'r':
        if (type === 'currency') return `${(value / 100).toFixed(2)}R`
        if (type === 'percentage') return `${value}%`
        if (type === 'expectancy') return `${value >= 0 ? '+' : ''}${(value / 200).toFixed(2)}R`
        return value.toString()
      default:
        return value.toString()
    }
  }

  const isNegative = value < 0

  return (
    <div className="studio-surface rounded-lg p-4 hover:bg-[#0f0f0f] transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm studio-muted">{title}</div>
        <Icon className={cn(
          'h-4 w-4',
          positive && !isNegative ? 'text-green-400' : 'text-red-400'
        )} />
      </div>
      <div className={cn(
        'text-2xl font-semibold mb-1',
        positive && !isNegative ? 'text-green-400' :
        isNegative ? 'text-red-400' : 'text-white'
      )}>
        {isNegative && value !== 0 ? '-' : ''}
        {formatValue()}
      </div>
      {trend && (
        <div className={cn(
          'text-xs flex items-center',
          trend > 0 ? 'text-green-400' : 'text-red-400'
        )}>
          {trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
          {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
        </div>
      )}
    </div>
  )
}

export function MetricsWithToggles() {
  const { displayMode, getFilteredData } = useDateRange()

  // Filter trade data based on date range and calculate metrics
  const filteredTrades = getFilteredData(tradeHistory)
  const metrics = calculateMetrics(filteredTrades)

  return (
    <div className="space-y-4">
      {/* Performance Overview Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold studio-text">Performance Overview</h2>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <MetricCard
          title="Total P&L"
          value={metrics.totalPnL}
          displayMode={displayMode}
          icon={DollarSign}
          type="currency"
          trend={12.5}
          positive={metrics.totalPnL > 0}
        />
        <MetricCard
          title="Win Rate"
          value={metrics.winRate}
          displayMode={displayMode}
          icon={Target}
          type="percentage"
          trend={2.3}
        />
        <MetricCard
          title="Profit Factor"
          value={metrics.profitFactor}
          displayMode={displayMode}
          icon={TrendingUp}
          type="ratio"
        />
        <MetricCard
          title="Expectancy"
          value={metrics.expectancy}
          displayMode={displayMode}
          icon={TrendingUp}
          type="expectancy"
          trend={5.2}
        />
        <MetricCard
          title="Max Drawdown"
          value={metrics.maxDrawdown}
          displayMode={displayMode}
          icon={TrendingDown}
          type="currency"
          positive={false}
        />
        <MetricCard
          title="Avg Winner"
          value={metrics.avgWinner}
          displayMode={displayMode}
          icon={TrendingUp}
          type="currency"
        />
        <MetricCard
          title="Avg Loser"
          value={metrics.avgLoser}
          displayMode={displayMode}
          icon={TrendingDown}
          type="currency"
          positive={false}
        />
      </div>
    </div>
  )
}