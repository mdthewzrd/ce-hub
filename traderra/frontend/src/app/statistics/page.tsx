'use client'

import { useState } from 'react'
import { Download, RefreshCw, Calendar, FileText, AlertTriangle, BarChart3, Settings, X } from 'lucide-react'
import { TopNavigation } from '@/components/layout/top-nav'
import { RenataChat } from '@/components/dashboard/renata-chat'
import { TraderViewDateSelector } from '@/components/ui/traderview-date-selector'
import { DateRangeProvider, useDateRange } from '@/contexts/DateRangeContext'
import { cn } from '@/lib/utils'

// Detailed stats component with clean table format
function TraderVueDetailedStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-studio-border rounded-lg overflow-hidden">
      {/* Left Column */}
      <div className="p-6 border-r border-studio-border">
        <div className="space-y-0">
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Total Gain/Loss:</span>
            <span className="text-sm studio-text font-semibold">$341,100.61</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Average Daily Gain/Loss</span>
            <span className="text-sm studio-text font-semibold">$535.48</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Average Trade Gain/Loss</span>
            <span className="text-sm studio-text font-semibold">$194.25</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Total Number of Trades</span>
            <span className="text-sm studio-text font-semibold">1756</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Average Hold Time (scratch trades)</span>
            <span className="text-sm studio-text">about 1 hour</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Number of Scratch Trades</span>
            <span className="text-sm studio-text">6 (0.3%)</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Trade P&L Standard Deviation</span>
            <span className="text-sm studio-text font-semibold">$1,942.67</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Kelly Percentage</span>
            <span className="text-sm studio-text font-semibold">2.45%</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Total Commissions</span>
            <span className="text-sm studio-text font-semibold">$2,456.78</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-sm studio-muted">Average position MAE</span>
            <span className="text-sm studio-text font-semibold">-$125.43</span>
          </div>
        </div>
      </div>

      {/* Center Column */}
      <div className="p-6 border-r border-studio-border">
        <div className="space-y-0">
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Largest Gain</span>
            <span className="text-sm studio-text font-semibold text-trading-profit">$30,809.32</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Average Daily Volume</span>
            <span className="text-sm studio-text font-semibold">11322</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Average Winning Trade</span>
            <span className="text-sm studio-text font-semibold">$1,268.09</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Number of Winning Trades</span>
            <span className="text-sm studio-text font-semibold">744 (42.4%)</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Average Hold Time (winning trades)</span>
            <span className="text-sm studio-text">about 12 hours</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Max Consecutive Wins</span>
            <span className="text-sm studio-text font-semibold">12</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">System Quality Number (SQN)</span>
            <span className="text-sm studio-text font-semibold">3.85</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">K-Ratio</span>
            <span className="text-sm studio-text font-semibold">1.42</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Total Fees</span>
            <span className="text-sm studio-text font-semibold">$892.34</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-sm studio-muted">Average Position MFE</span>
            <span className="text-sm studio-text font-semibold">$298.76</span>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="p-6">
        <div className="space-y-0">
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Largest Loss</span>
            <span className="text-sm studio-text font-semibold text-trading-loss">-$14,380.00</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Average Per-share Gain/Loss</span>
            <span className="text-sm studio-text font-semibold">$0.09</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Average Losing Trade</span>
            <span className="text-sm studio-text font-semibold">-$598.77</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Number of Losing Trades</span>
            <span className="text-sm studio-text font-semibold">1006 (57.3%)</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Average Hold Time (losing trades)</span>
            <span className="text-sm studio-text">about 4 hours</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Max Consecutive Losses</span>
            <span className="text-sm studio-text font-semibold">16</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Probability of Random Chance</span>
            <span className="text-sm studio-text font-semibold">12.8%</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Profit factor</span>
            <span className="text-sm studio-text font-semibold">1.57</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-studio-border">
            <span className="text-sm studio-muted">Sharpe Ratio</span>
            <span className="text-sm studio-text font-semibold">1.89</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-sm studio-muted">Maximum Drawdown</span>
            <span className="text-sm studio-text font-semibold text-trading-loss">-$18,245.00</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Cumulative P&L chart component with hover functionality
function CumulativePLChart() {
  const [hoveredPoint, setHoveredPoint] = useState<{ month: string, value: string, gain: string, x: number, y: number } | null>(null)

  const pnlData = [
    { month: 'Jan 2024', value: '$50,000', gain: '+$12,500', x: 0, y: 150 },
    { month: 'Feb 2024', value: '$75,000', gain: '+$25,000', x: 200, y: 120 },
    { month: 'Apr 2024', value: '$135,000', gain: '+$60,000', x: 400, y: 80 },
    { month: 'Jul 2024', value: '$195,000', gain: '+$60,000', x: 600, y: 60 },
    { month: 'Oct 2024', value: '$275,000', gain: '+$80,000', x: 800, y: 40 },
    { month: 'Dec 2024', value: '$341,100', gain: '+$66,100', x: 1000, y: 20 },
  ]

  return (
    <div className="studio-surface rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold studio-text">Cumulative P&L</h3>
        <div className="text-lg font-semibold text-trading-profit">$341,100.61</div>
      </div>
      <div
        className="h-64 bg-[#1a1a1a] rounded relative overflow-hidden"
        onMouseLeave={() => setHoveredPoint(null)}
      >
        <svg className="w-full h-full" viewBox="0 0 1000 200">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="100" height="40" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 40" fill="none" stroke="#333" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Area fill under the curve */}
          <defs>
            <linearGradient id="pnlGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05"/>
            </linearGradient>
          </defs>

          {/* P&L curve with area fill */}
          <path
            d="M0,150 Q100,140 200,120 T400,80 T600,60 T800,40 T1000,20 L1000,200 L0,200 Z"
            fill="url(#pnlGradient)"
          />

          {/* P&L line */}
          <path
            d="M0,150 Q100,140 200,120 T400,80 T600,60 T800,40 T1000,20"
            stroke="#22c55e"
            strokeWidth="3"
            fill="none"
          />

          {/* Data points */}
          <circle cx="0" cy="150" r="3" fill="#22c55e" stroke="#1a1a1a" strokeWidth="2"/>
          <circle cx="200" cy="120" r="3" fill="#22c55e" stroke="#1a1a1a" strokeWidth="2"/>
          <circle cx="400" cy="80" r="3" fill="#22c55e" stroke="#1a1a1a" strokeWidth="2"/>
          <circle cx="600" cy="60" r="3" fill="#22c55e" stroke="#1a1a1a" strokeWidth="2"/>
          <circle cx="800" cy="40" r="3" fill="#22c55e" stroke="#1a1a1a" strokeWidth="2"/>
          <circle cx="1000" cy="20" r="3" fill="#22c55e" stroke="#1a1a1a" strokeWidth="2"/>

          {/* Invisible hover areas for interaction */}
          {pnlData.map((point, index) => (
            <rect
              key={index}
              x={point.x - 50}
              y="0"
              width="100"
              height="200"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={(e) => {
                setHoveredPoint({
                  ...point,
                  x: point.x,
                  y: point.y
                })
              }}
            />
          ))}
        </svg>

        {/* Enhanced hover tooltip */}
        {hoveredPoint && (
          <div
            className="absolute bg-gray-900/95 backdrop-blur-sm text-white text-xs px-4 py-3 rounded-lg shadow-2xl border border-gray-700/50 pointer-events-none z-20 transition-all duration-200 scale-100"
            style={{
              left: `${(hoveredPoint.x / 1000) * 100}%`,
              top: '10px',
              transform: 'translateX(-50%)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="font-semibold text-gray-200 mb-1">{hoveredPoint.month}</div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-300">Total:</span>
              <span className="font-semibold text-green-400">{hoveredPoint.value}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-300">Gain:</span>
              <span className="font-semibold text-blue-400">{hoveredPoint.gain}</span>
            </div>
            {/* Tooltip arrow */}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900/95 border-r border-b border-gray-700/50 rotate-45"></div>
          </div>
        )}


        {/* Y-axis labels - improved visibility */}
        <div className="absolute left-2 top-2 text-xs text-gray-300 font-medium">$400K</div>
        <div className="absolute left-2 top-12 text-xs text-gray-300 font-medium">$350K</div>
        <div className="absolute left-2 top-20 text-xs text-gray-300 font-medium">$300K</div>
        <div className="absolute left-2 top-28 text-xs text-gray-300 font-medium">$250K</div>
        <div className="absolute left-2 top-36 text-xs text-gray-300 font-medium">$200K</div>
        <div className="absolute left-2 top-44 text-xs text-gray-300 font-medium">$150K</div>
        <div className="absolute left-2 top-52 text-xs text-gray-300 font-medium">$100K</div>
        <div className="absolute left-2 top-60 text-xs text-gray-300 font-medium">$50K</div>
        <div className="absolute left-2 bottom-8 text-xs text-gray-300 font-medium">$0</div>

        {/* X-axis labels - improved visibility */}
        <div className="absolute bottom-2 left-4 text-xs text-gray-300 font-medium">Jan 2024</div>
        <div className="absolute bottom-2 left-1/4 text-xs text-gray-300 font-medium">Apr 2024</div>
        <div className="absolute bottom-2 left-1/2 text-xs text-gray-300 font-medium">Jul 2024</div>
        <div className="absolute bottom-2 left-3/4 text-xs text-gray-300 font-medium">Oct 2024</div>
        <div className="absolute bottom-2 right-4 text-xs text-gray-300 font-medium">Dec 2024</div>

        {/* Axis lines */}
        <div className="absolute left-8 top-0 w-px h-full bg-studio-border opacity-50"></div>
        <div className="absolute bottom-8 left-0 w-full h-px bg-studio-border opacity-50"></div>
      </div>
    </div>
  )
}

// Drawdown chart component with hover functionality
function DrawdownChart() {
  const [hoveredPoint, setHoveredPoint] = useState<{ month: string, drawdown: string, portfolio: string, x: number, y: number } | null>(null)

  const drawdownData = [
    { month: 'Jan', drawdown: '0%', portfolio: '$341,100', x: 0, y: 20 },
    { month: 'Jan', drawdown: '0%', portfolio: '$341,100', x: 100, y: 20 },
    { month: 'Feb', drawdown: '-3.8%', portfolio: '$327,856', x: 150, y: 70 },
    { month: 'Mar', drawdown: '-6.8%', portfolio: '$318,032', x: 200, y: 110 },
    { month: 'Mar', drawdown: '-1.9%', portfolio: '$334,651', x: 250, y: 45 },
    { month: 'Apr', drawdown: '-3.0%', portfolio: '$330,859', x: 300, y: 60 },
    { month: 'May', drawdown: '-7.9%', portfolio: '$314,297', x: 350, y: 125 },
    { month: 'Jun', drawdown: '-5.2%', portfolio: '$323,572', x: 400, y: 90 },
    { month: 'Jul', drawdown: '-4.1%', portfolio: '$327,256', x: 450, y: 75 },
    { month: 'Aug', drawdown: '-9.1%', portfolio: '$309,959', x: 500, y: 150 },
    { month: 'Sep', drawdown: '-6.9%', portfolio: '$317,567', x: 550, y: 115 },
    { month: 'Oct', drawdown: '-3.0%', portfolio: '$330,859', x: 600, y: 60 },
    { month: 'Nov', drawdown: '-5.7%', portfolio: '$321,864', x: 650, y: 95 },
    { month: 'Dec', drawdown: '-1.9%', portfolio: '$334,651', x: 700, y: 45 },
    { month: 'Dec', drawdown: '0%', portfolio: '$341,100', x: 750, y: 20 },
    { month: 'Jan', drawdown: '-3.8%', portfolio: '$327,856', x: 800, y: 70 },
    { month: 'Feb', drawdown: '-2.6%', portfolio: '$332,264', x: 850, y: 55 },
    { month: 'Mar', drawdown: '-0.8%', portfolio: '$337,386', x: 900, y: 30 },
    { month: 'Apr', drawdown: '-3.3%', portfolio: '$329,863', x: 950, y: 65 },
    { month: 'May', drawdown: '-2.1%', portfolio: '$333,977', x: 1000, y: 40 },
  ]

  const maxDrawdownPoint = drawdownData.find(d => d.x === 500)

  return (
    <div className="studio-surface rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold studio-text">Cumulative Drawdown</h2>
        <div className="text-lg font-semibold text-trading-loss">-$18,245.00</div>
      </div>
      <div
        className="h-64 bg-[#1a1a1a] rounded relative overflow-hidden"
        onMouseLeave={() => setHoveredPoint(null)}
      >
        <svg className="w-full h-full" viewBox="0 0 1000 200">
          {/* Drawdown area fill */}
          <defs>
            <linearGradient id="drawdownGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1"/>
            </linearGradient>
          </defs>

          {/* Zero line */}
          <line x1="0" y1="20" x2="1000" y2="20" stroke="#666" strokeWidth="1" strokeDasharray="3,3"/>

          {/* Drawdown path - more vertical scaling */}
          <path
            d="M0,20 L100,20 L150,70 L200,110 L250,45 L300,60 L350,125 L400,90 L450,75 L500,150 L550,115 L600,60 L650,95 L700,45 L750,20 L800,70 L850,55 L900,30 L950,65 L1000,40"
            stroke="#ef4444"
            strokeWidth="2"
            fill="url(#drawdownGradient)"
          />

          {/* Maximum drawdown point only */}
          <circle cx="500" cy="150" r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="2"/>

          {/* Invisible hover areas for interaction */}
          {drawdownData.map((point, index) => (
            <rect
              key={index}
              x={point.x - 25}
              y="0"
              width="50"
              height="200"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                setHoveredPoint({
                  ...point,
                  x: rect.left + 25,
                  y: rect.top
                })
              }}
            />
          ))}
        </svg>

        {/* Enhanced hover tooltip for drawdown */}
        {hoveredPoint && (
          <div
            className="absolute bg-gray-900/95 backdrop-blur-sm text-white text-xs px-4 py-3 rounded-lg shadow-2xl border border-gray-700/50 pointer-events-none z-20 transition-all duration-200 scale-100"
            style={{
              left: `${(hoveredPoint.x / 1000) * 100}%`,
              top: '10px',
              transform: 'translateX(-50%)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="font-semibold text-gray-200 mb-1">{hoveredPoint.month}</div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-300">Drawdown:</span>
              <span className="font-semibold text-red-400">{hoveredPoint.drawdown}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-300">Portfolio:</span>
              <span className="font-semibold text-yellow-400">{hoveredPoint.portfolio}</span>
            </div>
            {/* Tooltip arrow */}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900/95 border-r border-b border-gray-700/50 rotate-45"></div>
          </div>
        )}


        {/* Y-axis labels - improved visibility with drawdown data */}
        <div className="absolute left-2 top-4 text-xs text-gray-300 font-medium">0%</div>
        <div className="absolute left-2 top-12 text-xs text-gray-300 font-medium">-1%</div>
        <div className="absolute left-2 top-20 text-xs text-gray-300 font-medium">-2%</div>
        <div className="absolute left-2 top-28 text-xs text-gray-300 font-medium">-3%</div>
        <div className="absolute left-2 top-36 text-xs text-gray-300 font-medium">-4%</div>
        <div className="absolute left-2 top-44 text-xs text-gray-300 font-medium">-5%</div>
        <div className="absolute left-2 top-52 text-xs text-gray-300 font-medium">-6%</div>
        <div className="absolute left-2 top-60 text-xs text-gray-300 font-medium">-7%</div>
        <div className="absolute left-2 top-68 text-xs text-gray-300 font-medium">-8%</div>
        <div className="absolute left-2 top-76 text-xs text-gray-300 font-medium">-9%</div>
        <div className="absolute left-2 bottom-16 text-xs text-gray-300 font-medium">-10%</div>

        {/* X-axis labels - improved visibility */}
        <div className="absolute bottom-2 left-4 text-xs text-gray-300 font-medium">Jan</div>
        <div className="absolute bottom-2 left-1/4 text-xs text-gray-300 font-medium">Apr</div>
        <div className="absolute bottom-2 left-1/2 text-xs text-gray-300 font-medium">Jul</div>
        <div className="absolute bottom-2 left-3/4 text-xs text-gray-300 font-medium">Oct</div>
        <div className="absolute bottom-2 right-4 text-xs text-gray-300 font-medium">Dec</div>
      </div>
    </div>
  )
}

// Combined chart component with improved toggle styling and scrolling
function CombinedChart({ title, distributionData, performanceData, type ="bar" }: {
  title: string
  distributionData: any[]
  performanceData: any[]
  type?:"bar" |"horizontal"
}) {
  const [view, setView] = useState<'performance' | 'distribution'>('performance')

  const currentData = view === 'performance' ? performanceData : distributionData

  return (
    <div className="studio-surface rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold studio-text">{title}</h3>
        <div className="flex bg-gray-800/60 rounded-lg p-1 w-fit border border-gray-700/50">
          <button
            onClick={() => setView('performance')}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-md transition-all duration-300',
              view === 'performance'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            )}
          >
            Performance
          </button>
          <button
            onClick={() => setView('distribution')}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-md transition-all duration-300',
              view === 'distribution'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            )}
          >
            Distribution
          </button>
        </div>
      </div>

      <div className={cn(
     "h-72 scrollbar-thin scrollbar-track-studio-bg scrollbar-thumb-studio-border",
        type ==="horizontal" ?"overflow-y-auto overflow-x-hidden" :"overflow-x-auto overflow-y-hidden"
      )}>
        {type ==="horizontal" ? (
          <div className="space-y-4 py-3">
            {currentData.map((item, index) => (
              <div key={index} className="group flex items-center gap-4 hover:bg-studio-border/20 rounded-md transition-colors duration-200 px-0 py-2">
                <div className="w-28 text-xs text-gray-300 text-right flex-shrink-0 font-medium">
                  {item.label}
                </div>
                <div className="flex-1 bg-[#0f0f0f] rounded-md h-9 relative border border-studio-border/30 mr-20">
                  <div
                    className={cn(
                   "h-full rounded-md transition-all duration-500 ease-out relative overflow-hidden",
                      view === 'performance'
                        ? item.value >= 0 ?"bg-gradient-to-r from-green-600 to-green-500 shadow-sm" :"bg-gradient-to-r from-red-600 to-red-500 shadow-sm"
                        :"bg-gradient-to-r from-gray-300 to-gray-200 shadow-sm"
                    )}
                    style={{
                      width: `${Math.max(5, Math.abs(item.value) / Math.max(...currentData.map(d => Math.abs(d.value))) * 75)}%`
                    }}
                  >
                    {/* Subtle animation overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                  </div>
                  {/* Value positioned at the end of the bar with fixed spacing */}
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 text-xs font-semibold text-white pointer-events-none whitespace-nowrap"
                    style={{
                      left: `${Math.max(5, Math.abs(item.value) / Math.max(...currentData.map(d => Math.abs(d.value))) * 75) + 2}%`
                    }}
                  >
                    {view === 'performance'
                      ? `${item.value >= 0 ? '+' : ''}$${item.value.toLocaleString()}`
                      : item.value.toLocaleString()
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={cn(
         "flex items-end h-full gap-2 px-2 pb-8",
            currentData.length > 8 ?"min-w-[800px]" :""
          )}>
            {currentData.map((item, index) => (
              <div key={index} className={cn(
             "flex flex-col items-center relative",
                currentData.length > 8 ?"min-w-[65px] flex-shrink-0" :"flex-1"
              )}>
                <div className="absolute -top-6 text-xs studio-text font-medium whitespace-nowrap">
                  {view === 'performance' ? `$${item.value.toLocaleString()}` : item.value}
                </div>
                <div
                  className={cn(
                 "w-full rounded-t transition-all duration-300",
                    view === 'performance'
                      ? item.value >= 0 ?"bg-trading-profit" :"bg-trading-loss"
                      :"bg-gray-300"
                  )}
                  style={{
                    height: `${Math.max(3, Math.abs(item.value) / Math.max(...currentData.map(d => Math.abs(d.value))) * 85)}%`
                  }}
                />
                <div className="text-xs studio-muted mt-2 text-center w-full whitespace-nowrap">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatisticsPageContent() {
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true)
  const [reportType, setReportType] = useState('comprehensive')
  const [activeTab, setActiveTab] = useState('overview')

  // TraderVue main navigation tabs
  const mainTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'performance', label: 'Performance' },
  ]

  const handleExportReport = () => {
    console.log('Exporting report...')
  }

  const handleRefreshData = () => {
    console.log('Refreshing data...')
  }

  // Sample data for charts
  const priceDistributionData = [
    { label: '<$2', value: 500 },
    { label: '$2-$5', value: 620 },
    { label: '$5-$10', value: 380 },
    { label: '$10-$20', value: 150 },
    { label: '$20-$50', value: 80 },
    { label: '$50+', value: 26 },
  ]

  const pricePerformanceData = [
    { label: '<$2', value: -5000 },
    { label: '$2-$5', value: 85000 },
    { label: '$5-$10', value: 45000 },
    { label: '$10-$20', value: 25000 },
    { label: '$20-$50', value: 15000 },
    { label: '$50+', value: 8000 },
  ]

  const dayDistributionData = [
    { label: 'Mon', value: 280 },
    { label: 'Tue', value: 320 },
    { label: 'Wed', value: 380 },
    { label: 'Thu', value: 350 },
    { label: 'Fri', value: 426 },
  ]

  const dayPerformanceData = [
    { label: 'Mon', value: 25000 },
    { label: 'Tue', value: 85000 },
    { label: 'Wed', value: -15000 },
    { label: 'Thu', value: 95000 },
    { label: 'Fri', value: 12000 },
  ]

  const hourDistributionData = [
    { label: '4:00', value: 15 },
    { label: '5:00', value: 25 },
    { label: '6:00', value: 45 },
    { label: '7:00', value: 180 },
    { label: '8:00', value: 280 },
    { label: '9:00', value: 580 },
    { label: '10:00', value: 320 },
    { label: '11:00', value: 180 },
    { label: '12:00', value: 95 },
    { label: '13:00', value: 45 },
    { label: '14:00', value: 25 },
    { label: '15:00', value: 8 },
  ]

  const hourPerformanceData = [
    { label: '4:00', value: -8000 },
    { label: '5:00', value: -5000 },
    { label: '6:00', value: 15000 },
    { label: '7:00', value: 85000 },
    { label: '8:00', value: 125000 },
    { label: '9:00', value: 95000 },
    { label: '10:00', value: 45000 },
    { label: '11:00', value: 25000 },
    { label: '12:00', value: 8000 },
    { label: '13:00', value: 5000 },
    { label: '14:00', value: 2000 },
    { label: '15:00', value: 1000 },
  ]

  // Function to render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Header Stats Section */}
            <div className="studio-surface rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold studio-text">Stats</h2>
              </div>
              <TraderVueDetailedStats />
            </div>

            {/* Time-based Charts */}
            <div className="space-y-8">
              {/* Top Row - Day and Month Analysis */}
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 min-w-0">
                  <CombinedChart
                    title="Trade Distribution by Day of Week"
                    distributionData={dayDistributionData}
                    performanceData={dayPerformanceData}
                    type="horizontal"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <CombinedChart
                    title="Performance by Month of Year"
                    distributionData={[
                      { label: 'Jan', value: 280 },
                      { label: 'Feb', value: 320 },
                      { label: 'Mar', value: 380 },
                      { label: 'Apr', value: 350 },
                      { label: 'May', value: 426 },
                      { label: 'Jun', value: 380 },
                      { label: 'Jul', value: 450 },
                      { label: 'Aug', value: 390 },
                      { label: 'Sep', value: 340 },
                      { label: 'Oct', value: 310 },
                      { label: 'Nov', value: 290 },
                      { label: 'Dec', value: 260 },
                    ]}
                    performanceData={[
                      { label: 'Jan', value: 25000 },
                      { label: 'Feb', value: 35000 },
                      { label: 'Mar', value: 45000 },
                      { label: 'Apr', value: 55000 },
                      { label: 'May', value: 65000 },
                      { label: 'Jun', value: 85000 },
                      { label: 'Jul', value: 75000 },
                      { label: 'Aug', value: 15000 },
                      { label: 'Sep', value: 25000 },
                      { label: 'Oct', value: 35000 },
                      { label: 'Nov', value: 45000 },
                      { label: 'Dec', value: 30000 },
                    ]}
                    type="horizontal"
                  />
                </div>
              </div>

              {/* Hour Distribution and Duration Analysis - Side by Side */}
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 min-w-0">
                  <CombinedChart
                    title="Trade Distribution by Hour of Day"
                    distributionData={hourDistributionData}
                    performanceData={hourPerformanceData}
                    type="horizontal"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <CombinedChart
                    title="Trade Distribution by Duration"
                    distributionData={[
                      { label: 'Intraday', value: 1400 },
                      { label: 'Multiday', value: 356 },
                    ]}
                    performanceData={[
                      { label: 'Intraday', value: 285000 },
                      { label: 'Multiday', value: 56000 },
                    ]}
                    type="horizontal"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'analytics':
        return (
          <div className="space-y-8">
            {/* Price and Volume Analysis */}
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 min-w-0">
                <CombinedChart
                  title="Trade Distribution by Price"
                  distributionData={priceDistributionData}
                  performanceData={pricePerformanceData}
                  type="horizontal"
                />
              </div>

              <div className="flex-1 min-w-0">
                <CombinedChart
                  title="Distribution by Volume Traded"
                  distributionData={[
                    { label: '2-4', value: 15 },
                    { label: '5-9', value: 25 },
                    { label: '10-19', value: 45 },
                    { label: '20-49', value: 180 },
                    { label: '50-99', value: 280 },
                    { label: '100-500', value: 580 },
                    { label: '500-999', value: 320 },
                    { label: '1000-1999', value: 180 },
                    { label: '2000-2999', value: 95 },
                    { label: '3000-4999', value: 45 },
                    { label: '5000-9999', value: 25 },
                    { label: '10000-19999', value: 15 },
                    { label: '20000+', value: 8 },
                  ]}
                  performanceData={[
                    { label: '2-4', value: -5000 },
                    { label: '5-9', value: -3000 },
                    { label: '10-19', value: 5000 },
                    { label: '20-49', value: 15000 },
                    { label: '50-99', value: 25000 },
                    { label: '100-500', value: 85000 },
                    { label: '500-999', value: 45000 },
                    { label: '1000-1999', value: 65000 },
                    { label: '2000-2999', value: 35000 },
                    { label: '3000-4999', value: 45000 },
                    { label: '5000-9999', value: 25000 },
                    { label: '10000-19999', value: 15000 },
                    { label: '20000+', value: 85000 },
                  ]}
                  type="horizontal"
                />
              </div>
            </div>

            {/* Instrument Analysis */}
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 min-w-0">
                <CombinedChart
                  title="Distribution by Instrument Volume"
                  distributionData={[
                    { label: '0 to 49K', value: 15 },
                    { label: '50K-99K', value: 25 },
                    { label: '100K-249K', value: 45 },
                    { label: '250K-499K', value: 180 },
                    { label: '500K-1M', value: 280 },
                    { label: '1M-2.49M', value: 580 },
                    { label: '2.5M-4.9M', value: 320 },
                    { label: '5M-9.9M', value: 180 },
                    { label: '10M-24.9M', value: 95 },
                    { label: '25M+', value: 45 },
                  ]}
                  performanceData={[
                    { label: '0 to 49K', value: 50000 },
                    { label: '50K-99K', value: -25000 },
                    { label: '100K-249K', value: 75000 },
                    { label: '250K-499K', value: 65000 },
                    { label: '500K-1M', value: 85000 },
                    { label: '1M-2.49M', value: -15000 },
                    { label: '2.5M-4.9M', value: 95000 },
                    { label: '5M-9.9M', value: 125000 },
                    { label: '10M-24.9M', value: 65000 },
                    { label: '25M+', value: 185000 },
                  ]}
                  type="horizontal"
                />
              </div>

              <div className="flex-1 min-w-0">
                <CombinedChart
                  title="Performance by Instrument"
                  distributionData={[
                    { label: 'AAPL', value: 324 },
                    { label: 'TSLA', value: 298 },
                    { label: 'NVDA', value: 267 },
                    { label: 'MSFT', value: 201 },
                    { label: 'GOOGL', value: 189 },
                    { label: 'AMZN', value: 156 },
                    { label: 'META', value: 134 },
                    { label: 'AMD', value: 98 },
                    { label: 'SPY', value: 89 },
                    { label: 'Others', value: 200 },
                  ]}
                  performanceData={[
                    { label: 'AAPL', value: 85000 },
                    { label: 'TSLA', value: 67000 },
                    { label: 'NVDA', value: 95000 },
                    { label: 'MSFT', value: 34000 },
                    { label: 'GOOGL', value: 28000 },
                    { label: 'AMZN', value: 12000 },
                    { label: 'META', value: 45000 },
                    { label: 'AMD', value: -15000 },
                    { label: 'SPY', value: 23000 },
                    { label: 'Others', value: 35000 },
                  ]}
                  type="horizontal"
                />
              </div>
            </div>

            {/* Market Behavior Section */}
            <div className="studio-surface rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold studio-text">Market Behavior</h2>
                <div className="text-sm studio-muted">
                  Entry price vs 50-day SMA analysis
                </div>
              </div>
              <CombinedChart
                title="Trade Distribution by Entry Price vs 50-Day SMA"
                distributionData={[
                  { label: 'less than -5%', value: 120 },
                  { label: '-1% to -5%', value: 15 },
                  { label: '0 to -1%', value: 25 },
                  { label: '0 to +1%', value: 45 },
                  { label: '+1% to +5%', value: 180 },
                  { label: '> +5%', value: 1370 },
                ]}
                performanceData={[
                  { label: 'less than -5%', value: 85000 },
                  { label: '-1% to -5%', value: 25000 },
                  { label: '0 to -1%', value: -15000 },
                  { label: '0 to +1%', value: -25000 },
                  { label: '+1% to +5%', value: -35000 },
                  { label: '> +5%', value: 285000 },
                ]}
                type="horizontal"
              />
            </div>

            {/* Intraday Duration Analysis */}
            <div className="w-full">
              <CombinedChart
                title="Trade Distribution by Intraday Duration"
                distributionData={[
                  { label: '<1:00', value: 285 },
                  { label: '1:00-1:59', value: 156 },
                  { label: '2:00-4:59', value: 234 },
                  { label: '5:00-9:59', value: 289 },
                  { label: '10:00-19:59', value: 198 },
                  { label: '20:00-39:59', value: 167 },
                  { label: '40:00-59:59', value: 89 },
                  { label: '1:00:00-1:59:59', value: 134 },
                  { label: '2:00:00-3:59:59', value: 298 },
                  { label: '4:00:00+', value: 310 },
                ]}
                performanceData={[
                  { label: '<1:00', value: -25000 },
                  { label: '1:00-1:59', value: -15000 },
                  { label: '2:00-4:59', value: -8000 },
                  { label: '5:00-9:59', value: -12000 },
                  { label: '10:00-19:59', value: -18000 },
                  { label: '20:00-39:59', value: -22000 },
                  { label: '40:00-59:59', value: -8000 },
                  { label: '1:00:00-1:59:59', value: 45000 },
                  { label: '2:00:00-3:59:59', value: 185000 },
                  { label: '4:00:00+', value: 278000 },
                ]}
                type="horizontal"
              />
            </div>
          </div>
        )

      case 'performance':
        return (
          <div className="space-y-8">
            {/* Win/Loss and Expectation Row */}
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Win/Loss Ratio */}
              <div className="flex-1 min-w-0">
                <div className="studio-surface rounded-lg p-6">
                  <h3 className="text-lg font-semibold studio-text mb-4">Win/Loss Ratio</h3>
                  <div className="flex items-center justify-center h-64">
                    <div className="relative w-48 h-48">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#ef4444"
                          strokeWidth="10"
                          fill="none"
                          strokeDasharray="151 100"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#22c55e"
                          strokeWidth="10"
                          fill="none"
                          strokeDasharray="100 151"
                          strokeDashoffset="-151"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-sm studio-muted">Win Rate</div>
                          <div className="text-lg font-semibold text-trading-profit">42.4%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-4 text-sm mt-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-trading-profit rounded mr-2"></div>
                      <span className="">Wins: 42.4%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-trading-loss rounded mr-2"></div>
                      <span className="">Losses: 57.6%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trade Expectation */}
              <div className="flex-1 min-w-0">
                <div className="studio-surface rounded-lg p-6">
                  <h3 className="text-lg font-semibold studio-text mb-4">Trade Expectation</h3>
                  <div className="h-64 flex items-end">
                    <div className="w-full bg-trading-profit rounded flex items-center justify-center" style={{ height: '80%' }}>
                      <div className="text-center text-white font-semibold text-xl">
                        $194.25
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-4 text-sm studio-muted">
                    Expected value per trade
                  </div>
                </div>
              </div>
            </div>

            {/* Cumulative P&L - Full Width */}
            <div className="w-full">
              <CumulativePLChart />
            </div>

            {/* Cumulative Drawdown */}
            <div className="w-full">
              <DrawdownChart />
            </div>
          </div>
        )

      default:
        return (
          <div className="studio-surface rounded-lg p-6">
            <h2 className="text-xl font-semibold studio-text">Tab Content</h2>
            <p className="studio-muted mt-2">Content for {activeTab} tab</p>
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen studio-bg">
      {/* Main content container with top navigation */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNavigation onAiToggle={() => setAiSidebarOpen(!aiSidebarOpen)} aiOpen={aiSidebarOpen} />

        {/* Page Header */}
        <div className="studio-surface border-b border-[#1a1a1a] px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold studio-text">Trading Statistics</h1>
            <div className="flex items-center space-x-4">
              <TraderViewDateSelector />
              <button
                className="btn-ghost flex items-center space-x-2"
                onClick={handleRefreshData}
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <button
                className="btn-ghost flex items-center space-x-2"
                onClick={handleExportReport}
              >
                <Download className="h-4 w-4" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* TraderVue-style Tab Navigation */}
        <div className="studio-surface border-b border-[#1a1a1a] px-6">
          <div className="flex space-x-6">
            {mainTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent studio-muted hover:text-studio-text hover:border-[#333]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Statistics content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            {renderTabContent()}
          </div>
        </main>
      </div>

      {/* AI Sidebar - Renata Chat */}
      {aiSidebarOpen && (
        <div className="w-[600px] studio-surface border-l border-[#1a1a1a] z-40">
          <RenataChat />
        </div>
      )}
    </div>
  )
}

export default function StatisticsPage() {
  return (
    <DateRangeProvider>
      <StatisticsPageContent />
    </DateRangeProvider>
  )
}