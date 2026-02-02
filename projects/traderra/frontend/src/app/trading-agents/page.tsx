'use client'

import React, { useState, useEffect } from 'react'
import {
  Brain,
  TrendingUp,
  Activity,
  BarChart3,
  Settings,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Target,
  Zap,
  Eye,
  Download,
  Upload,
  Save,
  Trash2,
  Plus,
  Minus,
  Info,
  ChevronRight,
  ChevronDown,
  Edit,
  Copy,
  Filter,
  Search,
  MoreVertical
} from 'lucide-react'

interface TradingAgent {
  id: string
  name: string
  type: 'scanner' | 'backtester' | 'edge' | 'portfolio'
  status: 'idle' | 'running' | 'completed' | 'error'
  description: string
  performance?: {
    sharpeRatio: number
    maxDrawdown: number
    winRate: number
    totalReturn: number
  }
  lastRun?: string
  parameters: Record<string, any>
  results?: any[]
}

interface ScannerConfig {
  name: string
  universe: string[]
  indicators: string[]
  conditions: string[]
  timeframe: string
}

const TradingAgentsPage = () => {
  const [agents, setAgents] = useState<TradingAgent[]>([
    {
      id: 'momentum-scanner',
      name: 'Momentum Scanner',
      type: 'scanner',
      status: 'idle',
      description: 'Scans for momentum breakout patterns across large-cap stocks',
      performance: {
        sharpeRatio: 1.8,
        maxDrawdown: 12.5,
        winRate: 0.65,
        totalReturn: 24.3
      },
      lastRun: '2024-12-01 14:30:00',
      parameters: {
        lookback: 20,
        threshold: 2.0,
        volumeMultiplier: 1.5
      }
    },
    {
      id: 'mean-reversion-backtester',
      name: 'Mean Reversion Backtester',
      type: 'backtester',
      status: 'completed',
      description: 'Backtests mean reversion strategies with statistical validation',
      performance: {
        sharpeRatio: 1.2,
        maxDrawdown: 8.3,
        winRate: 0.58,
        totalReturn: 18.7
      },
      lastRun: '2024-12-01 16:45:00',
      parameters: {
        lookbackPeriod: 60,
        entryThreshold: 2.0,
        exitThreshold: 0.5,
        stopLoss: 0.15
      }
    },
    {
      id: 'volatility-edge',
      name: 'Volatility Edge Detector',
      type: 'edge',
      status: 'running',
      description: 'Custom volatility-based indicator for market regime detection',
      parameters: {
        volatilityWindow: 30,
        threshold: 1.8,
        smoothingFactor: 0.3
      }
    }
  ])

  const [selectedAgent, setSelectedAgent] = useState<TradingAgent | null>(null)
  const [activeTab, setActiveTab] = useState<'agents' | 'scanner' | 'backtester' | 'edge'>('agents')
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set())
  const [scannerConfig, setScannerConfig] = useState<ScannerConfig>({
    name: '',
    universe: ['SPY', 'QQQ', 'IWM'],
    indicators: ['RSI', 'MACD', 'BB'],
    conditions: [],
    timeframe: '1D'
  })

  const getStatusIcon = (status: TradingAgent['status']) => {
    switch (status) {
      case 'running':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getTypeIcon = (type: TradingAgent['type']) => {
    switch (type) {
      case 'scanner':
        return <Target className="w-4 h-4" />
      case 'backtester':
        return <BarChart3 className="w-4 h-4" />
      case 'edge':
        return <Brain className="w-4 h-4" />
      default:
        return <Settings className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: TradingAgent['status']) => {
    switch (status) {
      case 'running':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const toggleAgentExpansion = (agentId: string) => {
    const newExpanded = new Set(expandedAgents)
    if (newExpanded.has(agentId)) {
      newExpanded.delete(agentId)
    } else {
      newExpanded.add(agentId)
    }
    setExpandedAgents(newExpanded)
  }

  const runAgent = async (agentId: string) => {
    setAgents(prev => prev.map(agent =>
      agent.id === agentId
        ? { ...agent, status: 'running' }
        : agent
    ))

    // Simulate agent execution
    setTimeout(() => {
      setAgents(prev => prev.map(agent =>
        agent.id === agentId
          ? {
              ...agent,
              status: 'completed',
              lastRun: new Date().toLocaleString(),
              performance: agent.performance ? {
                ...agent.performance,
                totalReturn: agent.performance.totalReturn + Math.random() * 10 - 2
              } : undefined
            }
          : agent
      ))
    }, 3000 + Math.random() * 4000)
  }

  const stopAgent = async (agentId: string) => {
    setAgents(prev => prev.map(agent =>
      agent.id === agentId
        ? { ...agent, status: 'idle' }
        : agent
    ))
  }

  const deleteAgent = async (agentId: string) => {
    setAgents(prev => prev.filter(agent => agent.id !== agentId))
    if (selectedAgent?.id === agentId) {
      setSelectedAgent(null)
    }
  }

  const duplicateAgent = async (agent: TradingAgent) => {
    const newAgent = {
      ...agent,
      id: `${agent.id}-copy-${Date.now()}`,
      name: `${agent.name} (Copy)`,
      status: 'idle' as const,
      lastRun: undefined
    }
    setAgents(prev => [...prev, newAgent])
  }

  const createScannerAgent = () => {
    const newAgent: TradingAgent = {
      id: `scanner-${Date.now()}`,
      name: scannerConfig.name || 'Custom Scanner',
      type: 'scanner',
      status: 'idle',
      description: `Custom scanner for ${scannerConfig.universe.join(', ')}`,
      parameters: {
        universe: scannerConfig.universe,
        indicators: scannerConfig.indicators,
        conditions: scannerConfig.conditions,
        timeframe: scannerConfig.timeframe
      }
    }
    setAgents(prev => [...prev, newAgent])
    setActiveTab('agents')
    setScannerConfig({
      name: '',
      universe: ['SPY', 'QQQ', 'IWM'],
      indicators: ['RSI', 'MACD', 'BB'],
      conditions: [],
      timeframe: '1D'
    })
  }

  const renderAgentsList = () => (
    <div className="space-y-4">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className={`bg-white rounded-lg border ${agent.status === 'running' ? 'border-blue-200 shadow-sm' : 'border-gray-200'} transition-all duration-200`}
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${agent.status === 'running' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {getTypeIcon(agent.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                    {getStatusIcon(agent.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{agent.description}</p>
                  {agent.lastRun && (
                    <p className="text-xs text-gray-500 mt-1">Last run: {agent.lastRun}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setSelectedAgent(agent)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="View Details"
                >
                  <Eye className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => duplicateAgent(agent)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => deleteAgent(agent.id)}
                  className="p-1 hover:bg-red-100 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
                <button
                  onClick={() => toggleAgentExpansion(agent.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {expandedAgents.has(agent.id) ?
                    <ChevronDown className="w-4 h-4 text-gray-600" /> :
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  }
                </button>
              </div>
            </div>

            {agent.performance && (
              <div className="mt-4 grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Sharpe Ratio</div>
                  <div className={`text-sm font-semibold ${agent.performance.sharpeRatio > 1 ? 'text-green-600' : 'text-gray-900'}`}>
                    {agent.performance.sharpeRatio.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Max Drawdown</div>
                  <div className={`text-sm font-semibold ${agent.performance.maxDrawdown < 10 ? 'text-green-600' : 'text-red-600'}`}>
                    {agent.performance.maxDrawdown.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Win Rate</div>
                  <div className={`text-sm font-semibold ${agent.performance.winRate > 0.6 ? 'text-green-600' : 'text-gray-900'}`}>
                    {(agent.performance.winRate * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Total Return</div>
                  <div className={`text-sm font-semibold ${agent.performance.totalReturn > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {agent.performance.totalReturn > 0 ? '+' : ''}{agent.performance.totalReturn.toFixed(1)}%
                  </div>
                </div>
              </div>
            )}

            {expandedAgents.has(agent.id) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Parameters</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(agent.parameters).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-medium">{JSON.stringify(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  {agent.status === 'running' ? (
                    <button
                      onClick={() => stopAgent(agent.id)}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => runAgent(agent.id)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Play className="w-4 h-4" />
                      <span>Run</span>
                    </button>
                  )}
                  <button
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Configure</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )

  const renderScannerBuilder = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scanner Configuration</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Scanner Name</label>
            <input
              type="text"
              value={scannerConfig.name}
              onChange={(e) => setScannerConfig(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter scanner name..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Universe</label>
            <div className="space-y-2">
              {scannerConfig.universe.map((symbol, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => {
                      const newUniverse = [...scannerConfig.universe]
                      newUniverse[index] = e.target.value
                      setScannerConfig(prev => ({ ...prev, universe: newUniverse }))
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Symbol (e.g., SPY)"
                  />
                  <button
                    onClick={() => {
                      const newUniverse = scannerConfig.universe.filter((_, i) => i !== index)
                      setScannerConfig(prev => ({ ...prev, universe: newUniverse }))
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setScannerConfig(prev => ({ ...prev, universe: [...prev.universe, ''] }))}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-center space-x-1 text-gray-600"
              >
                <Plus className="w-4 h-4" />
                <span>Add Symbol</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Indicators</label>
            <div className="grid grid-cols-3 gap-2">
              {['RSI', 'MACD', 'BB', 'SMA', 'EMA', 'ATR', 'OBV', 'CCI', 'ADX'].map(indicator => (
                <label key={indicator} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scannerConfig.indicators.includes(indicator)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setScannerConfig(prev => ({ ...prev, indicators: [...prev.indicators, indicator] }))
                      } else {
                        setScannerConfig(prev => ({ ...prev, indicators: prev.indicators.filter(i => i !== indicator) }))
                      }
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{indicator}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
            <select
              value={scannerConfig.timeframe}
              onChange={(e) => setScannerConfig(prev => ({ ...prev, timeframe: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1m">1 Minute</option>
              <option value="5m">5 Minutes</option>
              <option value="15m">15 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="1D" selected>Daily</option>
              <option value="1W">Weekly</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={createScannerAgent}
            disabled={!scannerConfig.name || scannerConfig.universe.length === 0}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Scanner Agent</span>
          </button>
          <button
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Test Configuration
          </button>
        </div>
      </div>
    </div>
  )

  const renderBacktesterInterface = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Backtesting Framework</h3>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { name: 'VectorBT', speed: 'Very Fast', features: 'Vectorized optimization', color: 'blue' },
            { name: 'QuantConnect', speed: 'Fast', features: 'Professional tools', color: 'green' },
            { name: 'Backtrader', speed: 'Medium', features: 'Flexible & extensible', color: 'purple' },
            { name: 'Zipline', speed: 'Medium', features: 'Academic focus', color: 'orange' }
          ].map((framework) => (
            <div key={framework.name} className={`p-4 border-2 border-dashed border-${framework.color}-300 rounded-lg hover:border-${framework.color}-500 transition-colors cursor-pointer`}>
              <h4 className="font-medium text-gray-900">{framework.name}</h4>
              <p className="text-xs text-gray-600 mt-1">{framework.features}</p>
              <div className="mt-2">
                <span className={`text-xs bg-${framework.color}-100 text-${framework.color}-700 px-2 py-1 rounded-full`}>
                  {framework.speed}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Quick Backtest</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Strategy Type</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>Momentum</option>
                <option>Mean Reversion</option>
                <option>Trend Following</option>
                <option>Volatility</option>
                <option>Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Backtest Period</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>1 Year</option>
                <option>2 Years</option>
                <option>5 Years</option>
                <option>10 Years</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Capital</label>
              <input type="number" defaultValue="100000" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission</label>
              <input type="number" defaultValue="0.001" step="0.001" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <button className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
            <Play className="w-4 h-4" />
            <span>Run Backtest</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderEdgeDeveloper = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edge Development Studio</h3>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Custom Indicator Builder</h4>
              <p className="text-sm text-blue-700 mb-3">Create and validate custom technical indicators with statistical rigor</p>
              <button className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Launch Builder
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Signal Generator</h4>
              <p className="text-sm text-green-700 mb-3">Generate and combine trading signals from multiple sources</p>
              <button className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                Create Signals
              </button>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">ML Edge Discovery</h4>
              <p className="text-sm text-purple-700 mb-3">Use machine learning to discover new trading edges</p>
              <button className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                Start Discovery
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Statistical Validation</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Significance Level:</span>
                  <span className="font-medium">p &lt; 0.05</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Min Sharpe Ratio:</span>
                  <span className="font-medium">&gt; 1.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Drawdown:</span>
                  <span className="font-medium">&lt; 20%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Out-of-Sample Period:</span>
                  <span className="font-medium">6 months</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Recent Edge Discoveries</h4>
              <div className="space-y-2">
                {[
                  { name: 'Volatility Regime Signal', edge: 2.3, status: 'Validated' },
                  { name: 'Volume-Price Divergence', edge: 1.8, status: 'Testing' },
                  { name: 'Momentum Reversal Pattern', edge: 1.5, status: 'Development' }
                ].map((discovery, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm font-medium">{discovery.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-green-600">+{discovery.edge}%</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        discovery.status === 'Validated' ? 'bg-green-100 text-green-700' :
                        discovery.status === 'Testing' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {discovery.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Trading Agents</h1>
                <p className="text-sm text-gray-600">Advanced AI-powered trading tools and analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
                <span>New Agent</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'agents', label: 'Agents', icon: Brain },
              { id: 'scanner', label: 'Scanner Builder', icon: Target },
              { id: 'backtester', label: 'Backtester', icon: BarChart3 },
              { id: 'edge', label: 'Edge Developer', icon: Zap }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'agents' && renderAgentsList()}
        {activeTab === 'scanner' && renderScannerBuilder()}
        {activeTab === 'backtester' && renderBacktesterInterface()}
        {activeTab === 'edge' && renderEdgeDeveloper()}
      </div>

      {/* Agent Details Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {getTypeIcon(selectedAgent.type)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedAgent.name}</h2>
                    <p className="text-sm text-gray-600">{selectedAgent.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {selectedAgent.performance && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Performance Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600">Sharpe Ratio</div>
                        <div className="text-lg font-semibold text-green-600">
                          {selectedAgent.performance.sharpeRatio.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600">Max Drawdown</div>
                        <div className="text-lg font-semibold text-red-600">
                          {selectedAgent.performance.maxDrawdown.toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600">Win Rate</div>
                        <div className="text-lg font-semibold text-blue-600">
                          {(selectedAgent.performance.winRate * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600">Total Return</div>
                        <div className="text-lg font-semibold text-green-600">
                          {selectedAgent.performance.totalReturn > 0 ? '+' : ''}{selectedAgent.performance.totalReturn.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Configuration</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(selectedAgent.parameters, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      runAgent(selectedAgent.id)
                      setSelectedAgent(null)
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Run Agent</span>
                  </button>
                  <button
                    onClick={() => setSelectedAgent(null)}
                    className="flex-1 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TradingAgentsPage