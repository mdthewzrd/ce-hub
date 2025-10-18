'use client'

import { useState, useEffect } from 'react'
import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core'
import { CopilotTextarea } from '@copilotkit/react-textarea'
import { Brain, Send, Settings, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api, type PerformanceMetrics, type TradingContext } from '@/lib/api'

type RenataMode = 'analyst' | 'coach' | 'mentor'

const RENATA_MODES = [
  {
    id: 'analyst' as RenataMode,
    name: 'Analyst',
    description: 'Direct, data-focused analysis',
    color: 'text-red-400',
    borderColor: 'border-red-400/50',
  },
  {
    id: 'coach' as RenataMode,
    name: 'Coach',
    description: 'Constructive guidance',
    color: 'text-blue-400',
    borderColor: 'border-blue-400/50',
  },
  {
    id: 'mentor' as RenataMode,
    name: 'Mentor',
    description: 'Reflective insights',
    color: 'text-green-400',
    borderColor: 'border-green-400/50',
  },
]

export function RenataChat() {
  const [currentMode, setCurrentMode] = useState<RenataMode>('coach')
  const [isConnected, setIsConnected] = useState(true)
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics>({
    totalPnL: 2847.50,
    winRate: 0.524,
    expectancy: 0.82,
    profitFactor: 1.47,
    maxDrawdown: -0.15,
    totalTrades: 67,
    avgWinner: 180.25,
    avgLoser: -95.50,
  })
  const [tradingContext] = useState<TradingContext>({
    timeRange: 'week',
    activeFilters: ['all_trades'],
  })

  // Check backend connectivity on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await api.ping()
        setIsConnected(true)
      } catch (error) {
        console.warn('Backend connectivity check failed:', error)
        setIsConnected(false)
      }
    }

    checkConnection()

    // Set up periodic connectivity check
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Load performance data on mount
  useEffect(() => {
    const loadPerformanceData = async () => {
      try {
        const metrics = await api.getMetrics()
        setPerformanceData(metrics)
        setIsConnected(true)
      } catch (error) {
        console.warn('Failed to load performance data:', error)
        setIsConnected(false)
        // Keep using mock data as fallback
      }
    }

    loadPerformanceData()
  }, [])

  // Make trading context readable to Copilot
  useCopilotReadable({
    description: 'Current trading performance metrics and user context',
    value: {
      ...performanceData,
      currentMode: currentMode,
      ...tradingContext,
      isConnected,
    },
  })

  // Define Copilot actions for Renata
  useCopilotAction({
    name: 'analyzePerformance',
    description: 'Analyze trading performance with current metrics',
    parameters: [
      {
        name: 'timeRange',
        type: 'string',
        description: 'Time range for analysis (week, month, quarter)',
        required: false,
      },
      {
        name: 'focus',
        type: 'string',
        description: 'Specific aspect to focus on (risk, psychology, strategy)',
        required: false,
      },
    ],
    handler: async ({ timeRange = 'week', focus }) => {
      try {
        // Call the backend API with current context
        const response = await api.renata.analyze(
          performanceData,
          { ...tradingContext, timeRange, focusArea: focus },
          currentMode
        )

        console.log('Renata analysis response:', response)
        return `${response.response}\n\nInsights: ${response.insights.join(', ')}\nRecommendations: ${response.recommendations.join(', ')}`
      } catch (error) {
        console.error('Failed to get Renata analysis:', error)

        // Fallback response based on mode when backend is unavailable
        const fallbackResponses = {
          analyst: `Expectancy: $${performanceData.expectancy}. Win rate: ${(performanceData.winRate * 100).toFixed(1)}%. Risk parameters within tolerance. ${focus ? `${focus} metrics nominal.` : ''}`,
          coach: `Solid performance this ${timeRange}. Your risk management improved. Consider refining entry timing for better consistency.`,
          mentor: `You've shown discipline in your approach this ${timeRange}. The slight expectancy variance suggests emotional consistency. Reflect on what conditions support your best decision-making.`,
        }

        return `${fallbackResponses[currentMode]} (Note: Backend connection unavailable, using cached analysis)`
      }
    },
  })

  useCopilotAction({
    name: 'switchMode',
    description: 'Switch Renata\'s analysis mode',
    parameters: [
      {
        name: 'mode',
        type: 'string',
        description: 'New mode: analyst, coach, or mentor',
        required: true,
      },
    ],
    handler: async ({ mode }) => {
      if (RENATA_MODES.find(m => m.id === mode)) {
        setCurrentMode(mode as RenataMode)
        return `Switched to ${mode} mode. My responses will now reflect this perspective.`
      }
      return 'Invalid mode. Available modes: analyst, coach, mentor.'
    },
  })

  const currentModeInfo = RENATA_MODES.find(m => m.id === currentMode)!

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 studio-border border-b">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Brain className="h-8 w-8 text-primary" />
            <div
              className={cn(
                'absolute -top-1 -right-1 h-3 w-3 rounded-full',
                isConnected ? 'status-online' : 'status-offline'
              )}
            />
          </div>
          <div>
            <h3 className="font-semibold studio-text">Renata</h3>
            <p className="text-xs studio-muted">
              {currentModeInfo.name} Mode • {isConnected ? 'Connected' : 'Offline'}
            </p>
          </div>
        </div>
        <button className="p-2 hover:bg-[#161616] rounded-lg transition-colors">
          <Settings className="h-4 w-4 studio-muted" />
        </button>
      </div>

      {/* Mode Selector */}
      <div className="p-4 studio-border border-b">
        <div className="grid grid-cols-3 gap-1 p-1 studio-surface rounded-lg">
          {RENATA_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setCurrentMode(mode.id)}
              className={cn(
                'px-3 py-2 text-xs font-medium rounded-md transition-all',
                currentMode === mode.id
                  ? `bg-[#161616] ${mode.color}`
                  : 'studio-muted hover:studio-text hover:bg-[#0f0f0f]'
              )}
            >
              {mode.name}
            </button>
          ))}
        </div>
        <p className="text-xs studio-muted mt-2 text-center">
          {currentModeInfo.description}
        </p>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="p-4 studio-border border-b">
          <div className="flex items-center space-x-2 text-sm text-yellow-400">
            <AlertCircle className="h-4 w-4" />
            <span>Backend connection unavailable</span>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 p-4">
        <div className="space-y-4">
          {/* Welcome Message */}
          <div className={cn('ai-message', currentMode)}>
            <div className="flex items-start space-x-3">
              <div className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0', {
                'bg-red-400': currentMode === 'analyst',
                'bg-blue-400': currentMode === 'coach',
                'bg-green-400': currentMode === 'mentor',
              })} />
              <div>
                <p className="text-sm studio-muted mb-1">{currentModeInfo.name} Mode</p>
                <p className="studio-text text-sm">
                  {currentMode === 'analyst' && "Ready to analyze your performance data. I'll provide direct, metric-focused insights."}
                  {currentMode === 'coach' && "I'm here to help you improve your trading. Ask me about your performance or specific concerns."}
                  {currentMode === 'mentor' && "Let's explore your trading journey together. I'll help you understand patterns and build long-term wisdom."}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <p className="text-xs studio-muted uppercase tracking-wide">Quick Actions</p>
            <div className="grid grid-cols-1 gap-2">
              <button className="btn-ghost text-left text-sm p-3 shadow-interactive">
                📊 Analyze this week's performance
              </button>
              <button className="btn-ghost text-left text-sm p-3 shadow-interactive">
                🎯 Review risk management
              </button>
              <button className="btn-ghost text-left text-sm p-3 shadow-interactive">
                📝 Discuss latest journal entries
              </button>
              <button className="btn-ghost text-left text-sm p-3 shadow-interactive">
                🔍 Identify improvement areas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Input */}
      <div className="p-4 studio-border border-t">
        <div className="relative">
          <CopilotTextarea
            className="min-h-[80px] max-h-32 resize-none pr-12 form-input shadow-studio-subtle"
            style={{
              backgroundColor: '#111111',
              borderColor: '#1a1a1a',
              color: '#e5e5e5'
            }}
            placeholder={`Ask Renata (${currentModeInfo.name} mode) about your trading...`}
            autosuggestionsConfig={{
              textareaPurpose: `Trading performance analysis in ${currentMode} mode. Provide ${currentModeInfo.description.toLowerCase()}.`,
              chatApiConfigs: {},
            }}
          />
          <button
            className="absolute bottom-2 right-2 p-2 text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 shadow-interactive"
            onClick={() => {
              // CopilotTextarea handles submission
            }}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs studio-muted">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span className={cn('flex items-center space-x-1', {
            'text-green-400': isConnected,
            'text-red-400': !isConnected,
          })}>
            <div className={cn('w-1.5 h-1.5 rounded-full', {
              'bg-green-400': isConnected,
              'bg-red-400': !isConnected,
            })} />
            <span>{isConnected ? 'Live' : 'Offline'}</span>
          </span>
        </div>
      </div>
    </div>
  )
}