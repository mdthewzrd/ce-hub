'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  User,
  Shield,
  Bell,
  Palette,
  Database,
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  TrendingUp,
  Zap,
  Link,
  MessageSquare,
  BarChart3,
  Globe,
  Smartphone,
  Bot,
  ExternalLink,
  Check,
  X,
  AlertCircle,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react'
import { TopNavigation } from '@/components/layout/top-nav'
import { RenataChat } from '@/components/dashboard/renata-chat'
import { cn } from '@/lib/utils'
import { UserProfileCard } from '@/components/auth/user-profile'
import { api, type AIModelConfigResponse } from '@/lib/api'
import { MCPHealthDashboard } from '@/components/monitoring/mcp-health-dashboard'

const settingsSections = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'trading', name: 'Trading', icon: TrendingUp },
  { id: 'ai', name: 'AI Configuration', icon: Bot },
  { id: 'system', name: 'System Health', icon: Activity },
  { id: 'integrations', name: 'Integrations', icon: Zap },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'appearance', name: 'Appearance', icon: Palette },
  { id: 'data', name: 'Data & Exports', icon: Database },
  { id: 'security', name: 'Security', icon: Shield },
]

export default function SettingsPage() {
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true)
  const [activeSection, setActiveSection] = useState('profile')
  const [showApiKey, setShowApiKey] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    // Profile settings
    displayName: 'Demo Account',
    email: 'demo@traderra.com',
    timezone: 'America/New_York',

    // Trading settings
    defaultPositionSize: 1000,
    maxPositionSize: 10000,
    riskPerTrade: 1.0,
    stopLossPercent: 2.0,
    takeProfitRatio: 2.0,
    defaultStrategy: 'momentum',

    // Notification settings
    emailNotifications: true,
    pushNotifications: true,
    tradeAlerts: true,
    journalReminders: true,
    marketOpenAlert: false,

    // Appearance settings
    theme: 'dark',
    chartTheme: 'dark',
    compactMode: false,
    animationsEnabled: true,

    // Data settings
    dataRetention: '1year',
    autoBackup: true,
    backupFrequency: 'weekly',

    // Security settings
    twoFactor: false,
    sessionTimeout: 30,
    apiAccess: false,

    // Integration settings
    dasTraderConnected: false,
    dasUsername: '',
    dasApiKey: '',
    dasLiveTrading: false,
    discordConnected: false,
    discordWebhookUrl: '',
    discordChannel: '#trading-alerts',
    discordNotifications: true,
    twitterConnected: false,
    twitterUsername: '',
    tradingViewConnected: false,
    tradingViewUsername: '',
    telegramConnected: false,
    telegramBotToken: '',
    telegramChatId: '',
    emailAlertsEnabled: true,
    smsAlertsEnabled: false,
    smsPhoneNumber: '',

    // AI Configuration settings
    defaultAIProvider: 'openai',
    defaultAIModel: 'gpt-4',
    enableModelSwitching: true,
    aiResponseStyle: 'professional',
    enableArchonIntegration: true,
    maxTokens: 4000,
    temperature: 0.7,

    // Playwright browser automation settings
    playwrightHeadlessMode: true,
    playwrightBrowserType: 'chrome',
    playwrightTimeout: 30000,
    playwrightAutoScreenshots: false,
  })

  // AI Models state
  const [aiModels, setAiModels] = useState<AIModelConfigResponse | null>(null)
  const [isLoadingAIModels, setIsLoadingAIModels] = useState(false)

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setUnsavedChanges(true)
  }

  // Load AI models on mount
  useEffect(() => {
    const loadAIModels = async () => {
      setIsLoadingAIModels(true)
      try {
        const modelsConfig = await api.ai.getModels()
        setAiModels(modelsConfig)

        // Update settings with current defaults
        setSettings(prev => ({
          ...prev,
          defaultAIProvider: modelsConfig.default_provider,
          defaultAIModel: modelsConfig.default_model
        }))
      } catch (error) {
        console.warn('Failed to load AI models:', error)
      } finally {
        setIsLoadingAIModels(false)
      }
    }

    loadAIModels()
  }, [])

  // Handle AI model selection
  const handleAIModelSelect = async (provider: string, model: string) => {
    try {
      const response = await api.ai.selectModel(provider, model)
      if (response.success) {
        setSettings(prev => ({
          ...prev,
          defaultAIProvider: provider,
          defaultAIModel: model
        }))
        setUnsavedChanges(true)
      }
    } catch (error) {
      console.error('Failed to select AI model:', error)
    }
  }

  const handleSaveSettings = () => {
    // Save settings logic would go here
    console.log('Saving settings:', settings)
    setUnsavedChanges(false)
  }

  const handleExportData = () => {
    console.log('Exporting data...')
  }

  const handleImportData = () => {
    console.log('Importing data...')
  }

  const handleDeleteAllTrades = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete ALL trades? This action cannot be undone.\n\n' +
      'This will permanently remove:\n' +
      '• All trade data\n' +
      '• All statistics\n' +
      '• All journal entries\n\n' +
      'Type "DELETE ALL" in the next prompt to confirm.'
    )

    if (confirmed) {
      const confirmText = window.prompt(
        'Please type "DELETE ALL" (without quotes) to confirm permanent deletion:'
      )

      if (confirmText === 'DELETE ALL') {
        try {
          // Call the API to delete all trades from the database
          const response = await fetch('/api/trades', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const result = await response.json()
            alert(`All trade data has been successfully deleted. ${result.deletedCount} trades removed. The page will reload.`)
            window.location.reload()
          } else {
            const error = await response.json()
            alert(`Failed to delete trades: ${error.error}`)
          }
        } catch (error) {
          console.error('Error deleting trades:', error)
          alert('An error occurred while deleting trades. Please try again.')
        }
      } else {
        alert('Deletion cancelled. Confirmation text did not match.')
      }
    }
  }

  const renderProfileSettings = () => (
    <div className="space-y-6">
      {/* User Profile Card */}
      <UserProfileCard />

      <div>
        <h3 className="text-lg font-semibold studio-text mb-4">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium studio-text mb-1">Display Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              value={settings.displayName}
              onChange={(e) => handleSettingChange('displayName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium studio-text mb-1">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              value={settings.email}
              onChange={(e) => handleSettingChange('email', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium studio-text mb-1">Timezone</label>
        <select
          className="w-full md:w-1/2 px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          value={settings.timezone}
          onChange={(e) => handleSettingChange('timezone', e.target.value)}
        >
          <option value="America/New_York">Eastern Time (ET)</option>
          <option value="America/Chicago">Central Time (CT)</option>
          <option value="America/Denver">Mountain Time (MT)</option>
          <option value="America/Los_Angeles">Pacific Time (PT)</option>
          <option value="Europe/London">London (GMT)</option>
          <option value="Asia/Tokyo">Tokyo (JST)</option>
        </select>
      </div>

      <div className="flex items-center justify-between p-4 studio-surface rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <span className="text-lg font-medium text-white">T</span>
          </div>
          <div>
            <div className="text-sm font-medium studio-text">Profile Picture</div>
            <div className="text-xs studio-muted">Upload a custom avatar</div>
          </div>
        </div>
        <button className="btn-ghost text-sm">Change</button>
      </div>
    </div>
  )

  const renderTradingSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold studio-text mb-4">Default Trading Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium studio-text mb-1">Default Position Size ($)</label>
            <input
              type="number"
              className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              value={settings.defaultPositionSize}
              onChange={(e) => handleSettingChange('defaultPositionSize', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium studio-text mb-1">Max Position Size ($)</label>
            <input
              type="number"
              className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              value={settings.maxPositionSize}
              onChange={(e) => handleSettingChange('maxPositionSize', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold studio-text mb-4">Risk Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium studio-text mb-1">Risk per Trade (%)</label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              value={settings.riskPerTrade}
              onChange={(e) => handleSettingChange('riskPerTrade', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium studio-text mb-1">Stop Loss (%)</label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              value={settings.stopLossPercent}
              onChange={(e) => handleSettingChange('stopLossPercent', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium studio-text mb-1">Take Profit Ratio</label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              value={settings.takeProfitRatio}
              onChange={(e) => handleSettingChange('takeProfitRatio', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium studio-text mb-1">Default Strategy</label>
        <select
          className="w-full md:w-1/2 px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          value={settings.defaultStrategy}
          onChange={(e) => handleSettingChange('defaultStrategy', e.target.value)}
        >
          <option value="momentum">Momentum</option>
          <option value="breakout">Breakout</option>
          <option value="reversal">Reversal</option>
          <option value="swing">Swing</option>
          <option value="scalp">Scalp</option>
        </select>
      </div>
    </div>
  )

  const renderAISettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold studio-text mb-4">Renata AI Configuration</h3>
        <p className="text-sm studio-muted mb-6">
          Configure your AI assistant's behavior and model preferences.
        </p>

        {/* AI Model Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium studio-text mb-2">Default AI Model</label>
          {isLoadingAIModels ? (
            <div className="flex items-center space-x-2 text-sm studio-muted">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading AI models...</span>
            </div>
          ) : aiModels ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {aiModels.available_models.filter(model => model.available).map((model) => {
                const isSelected = settings.defaultAIProvider === model.provider && settings.defaultAIModel === model.model
                return (
                  <button
                    key={`${model.provider}:${model.model}`}
                    onClick={() => handleAIModelSelect(model.provider, model.model)}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-[#1a1a1a] studio-surface hover:border-[#2a2a2a] studio-text'
                    )}
                  >
                    <div className="font-medium text-sm">{model.display_name}</div>
                    <div className="text-xs studio-muted mt-1 capitalize">{model.provider}</div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-sm text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>Failed to load AI models</span>
            </div>
          )}
        </div>

        {/* AI Response Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium studio-text mb-2">Response Style</label>
            <select
              className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              value={settings.aiResponseStyle}
              onChange={(e) => handleSettingChange('aiResponseStyle', e.target.value)}
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="detailed">Detailed</option>
              <option value="concise">Concise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium studio-text mb-2">Max Response Length</label>
            <select
              className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              value={settings.maxTokens}
              onChange={(e) => handleSettingChange('maxTokens', Number(e.target.value))}
            >
              <option value={1000}>Short (1,000 tokens)</option>
              <option value={2000}>Medium (2,000 tokens)</option>
              <option value={4000}>Long (4,000 tokens)</option>
              <option value={8000}>Extended (8,000 tokens)</option>
            </select>
          </div>
        </div>

        {/* AI Features */}
        <div className="space-y-4">
          <h4 className="text-md font-medium studio-text">AI Features</h4>

          {[
            {
              key: 'enableModelSwitching',
              label: 'Enable Model Switching',
              desc: 'Allow switching between AI models during conversations',
              icon: <Bot className="h-4 w-4" />
            },
            {
              key: 'enableArchonIntegration',
              label: 'Archon Knowledge Integration',
              desc: 'Use Archon knowledge graph for enhanced trading insights',
              icon: <Brain className="h-4 w-4" />
            },
          ].map((feature) => (
            <div key={feature.key} className="flex items-center justify-between p-4 studio-surface rounded-lg border border-[#1a1a1a]">
              <div className="flex items-center space-x-3">
                <div className="text-primary">
                  {feature.icon}
                </div>
                <div>
                  <div className="text-sm font-medium studio-text">{feature.label}</div>
                  <div className="text-xs studio-muted">{feature.desc}</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings[feature.key as keyof typeof settings] as boolean}
                  onChange={(e) => handleSettingChange(feature.key, e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/60 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>

        {/* Advanced Settings */}
        <div className="border-t border-[#1a1a1a] pt-6">
          <h4 className="text-md font-medium studio-text mb-4">Advanced Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium studio-text mb-2">
                Temperature ({settings.temperature})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => handleSettingChange('temperature', Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs studio-muted mt-1">
                <span>Conservative</span>
                <span>Creative</span>
              </div>
            </div>
          </div>
          <p className="text-xs studio-muted mt-2">
            Higher temperature values make the AI more creative but less focused.
          </p>
        </div>
      </div>
    </div>
  )

  const renderSystemHealth = () => (
    <MCPHealthDashboard />
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold studio-text mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {[
            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
            { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser and mobile push notifications' },
            { key: 'tradeAlerts', label: 'Trade Alerts', desc: 'Notifications when trades are executed' },
            { key: 'journalReminders', label: 'Journal Reminders', desc: 'Reminders to update your trading journal' },
            { key: 'marketOpenAlert', label: 'Market Open Alert', desc: 'Notification when markets open' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 studio-surface rounded-lg">
              <div>
                <div className="text-sm font-medium studio-text">{item.label}</div>
                <div className="text-xs studio-muted">{item.desc}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings[item.key as keyof typeof settings] as boolean}
                  onChange={(e) => handleSettingChange(item.key, e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/60 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold studio-text mb-4">Theme Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium studio-text mb-1">Application Theme</label>
            <select
              className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              value={settings.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium studio-text mb-1">Chart Theme</label>
            <select
              className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              value={settings.chartTheme}
              onChange={(e) => handleSettingChange('chartTheme', e.target.value)}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold studio-text mb-4">Display Options</h3>
        <div className="space-y-4">
          {[
            { key: 'compactMode', label: 'Compact Mode', desc: 'Show more information in less space' },
            { key: 'animationsEnabled', label: 'Animations', desc: 'Enable smooth transitions and animations' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 studio-surface rounded-lg">
              <div>
                <div className="text-sm font-medium studio-text">{item.label}</div>
                <div className="text-xs studio-muted">{item.desc}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings[item.key as keyof typeof settings] as boolean}
                  onChange={(e) => handleSettingChange(item.key, e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/60 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold studio-text mb-4">Data Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium studio-text mb-1">Data Retention Period</label>
            <select
              className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              value={settings.dataRetention}
              onChange={(e) => handleSettingChange('dataRetention', e.target.value)}
            >
              <option value="6months">6 Months</option>
              <option value="1year">1 Year</option>
              <option value="2years">2 Years</option>
              <option value="forever">Forever</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium studio-text mb-1">Backup Frequency</label>
            <select
              className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              value={settings.backupFrequency}
              onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="manual">Manual Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 studio-surface rounded-lg">
        <div>
          <div className="text-sm font-medium studio-text">Auto Backup</div>
          <div className="text-xs studio-muted">Automatically backup your data</div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={settings.autoBackup}
            onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/60 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
        </label>
      </div>

      <div>
        <h3 className="text-lg font-semibold studio-text mb-4">Import/Export</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 studio-surface rounded-lg">
            <div>
              <div className="text-sm font-medium studio-text">Export All Data</div>
              <div className="text-xs studio-muted">Download all your trading data as CSV/JSON</div>
            </div>
            <button className="btn-ghost flex items-center space-x-2" onClick={handleExportData}>
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 studio-surface rounded-lg">
            <div>
              <div className="text-sm font-medium studio-text">Import Data</div>
              <div className="text-xs studio-muted">Import trades from CSV or other platforms</div>
            </div>
            <button className="btn-ghost flex items-center space-x-2" onClick={handleImportData}>
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold studio-text mb-4">Security Options</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 studio-surface rounded-lg">
            <div>
              <div className="text-sm font-medium studio-text">Two-Factor Authentication</div>
              <div className="text-xs studio-muted">Add an extra layer of security to your account</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.twoFactor}
                onChange={(e) => handleSettingChange('twoFactor', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/60 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 studio-surface rounded-lg">
            <div>
              <div className="text-sm font-medium studio-text">API Access</div>
              <div className="text-xs studio-muted">Enable API access for third-party integrations</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.apiAccess}
                onChange={(e) => handleSettingChange('apiAccess', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/60 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {settings.apiAccess && (
        <div>
          <h3 className="text-lg font-semibold studio-text mb-4">API Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium studio-text mb-1">API Key</label>
              <div className="flex items-center space-x-2">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className="flex-1 px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono"
                  value="trdr_sk_1234567890abcdefghijklmnop"
                  readOnly
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-2 hover:bg-[#1a1a1a] rounded transition-colors"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4 studio-muted" /> : <Eye className="h-4 w-4 studio-muted" />}
                </button>
                <button className="btn-ghost text-sm">Regenerate</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium studio-text mb-1">Session Timeout (minutes)</label>
        <select
          className="w-full md:w-1/3 px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          value={settings.sessionTimeout}
          onChange={(e) => handleSettingChange('sessionTimeout', Number(e.target.value))}
        >
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={60}>1 hour</option>
          <option value={120}>2 hours</option>
          <option value={0}>Never</option>
        </select>
      </div>

      <div className="border-t border-[#1a1a1a] pt-6">
        <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-900/10 border border-red-900/50 rounded-lg">
            <div>
              <div className="text-sm font-medium studio-text">Delete All Data</div>
              <div className="text-xs studio-muted">Permanently delete all your trading data and journal entries</div>
            </div>
            <button
              className="btn-ghost text-red-400 hover:text-red-300 flex items-center space-x-2"
              onClick={handleDeleteAllTrades}
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete All Trades</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderIntegrationsSettings = () => (
    <div className="space-y-8">
      {/* Broker Integrations */}
      <div>
        <h3 className="text-lg font-semibold studio-text mb-4 flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <span>Broker Integrations</span>
        </h3>
        <div className="space-y-4">
          {/* DAS Trader */}
          <div className="studio-surface rounded-lg p-6 border border-[#1a1a1a]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold studio-text">DAS Trader</h4>
                  <p className="text-xs studio-muted">Professional day trading platform</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {settings.dasTraderConnected ? (
                  <div className="flex items-center space-x-2 text-green-400">
                    <Wifi className="h-4 w-4" />
                    <span className="text-xs font-medium">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 studio-muted">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-xs font-medium">Disconnected</span>
                  </div>
                )}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.dasTraderConnected}
                    onChange={(e) => handleSettingChange('dasTraderConnected', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/60 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            {settings.dasTraderConnected && (
              <div className="space-y-4 border-t border-[#1a1a1a] pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium studio-text mb-1">Username</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Your DAS username"
                      value={settings.dasUsername}
                      onChange={(e) => handleSettingChange('dasUsername', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium studio-text mb-1">API Key</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono"
                      placeholder="Enter your DAS API key"
                      value={settings.dasApiKey}
                      onChange={(e) => handleSettingChange('dasApiKey', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-amber-900/10 border border-amber-900/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                    <div>
                      <div className="text-sm font-medium studio-text">Live Trading Mode</div>
                      <div className="text-xs studio-muted">Enable real money trading execution</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.dasLiveTrading}
                      onChange={(e) => handleSettingChange('dasLiveTrading', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-400/20 dark:peer-focus:ring-amber-400/60 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Communication Integrations */}
      <div>
        <h3 className="text-lg font-semibold studio-text mb-4 flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <span>Communication & Alerts</span>
        </h3>
        <div className="space-y-4">
          {/* Discord */}
          <div className="studio-surface rounded-lg p-6 border border-[#1a1a1a]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold studio-text">Discord</h4>
                  <p className="text-xs studio-muted">Send trading alerts and notifications</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {settings.discordConnected ? (
                  <div className="flex items-center space-x-2 text-green-400">
                    <Check className="h-4 w-4" />
                    <span className="text-xs font-medium">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 studio-muted">
                    <X className="h-4 w-4" />
                    <span className="text-xs font-medium">Not Connected</span>
                  </div>
                )}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.discordConnected}
                    onChange={(e) => handleSettingChange('discordConnected', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/60 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            {settings.discordConnected && (
              <div className="space-y-4 border-t border-[#1a1a1a] pt-4">
                <div>
                  <label className="block text-sm font-medium studio-text mb-1">Webhook URL</label>
                  <input
                    type="url"
                    className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono text-xs"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={settings.discordWebhookUrl}
                    onChange={(e) => handleSettingChange('discordWebhookUrl', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium studio-text mb-1">Channel</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="#trading-alerts"
                      value={settings.discordChannel}
                      onChange={(e) => handleSettingChange('discordChannel', e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="discordNotifications"
                        checked={settings.discordNotifications}
                        onChange={(e) => handleSettingChange('discordNotifications', e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="discordNotifications" className="text-sm studio-text">
                        Enable notifications
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Telegram */}
          <div className="studio-surface rounded-lg p-6 border border-[#1a1a1a]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold studio-text">Telegram</h4>
                  <p className="text-xs studio-muted">Instant mobile notifications</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {settings.telegramConnected ? (
                  <div className="flex items-center space-x-2 text-green-400">
                    <Check className="h-4 w-4" />
                    <span className="text-xs font-medium">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 studio-muted">
                    <X className="h-4 w-4" />
                    <span className="text-xs font-medium">Not Connected</span>
                  </div>
                )}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.telegramConnected}
                    onChange={(e) => handleSettingChange('telegramConnected', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/60 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            {settings.telegramConnected && (
              <div className="space-y-4 border-t border-[#1a1a1a] pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium studio-text mb-1">Bot Token</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono text-xs"
                      placeholder="Bot token from @BotFather"
                      value={settings.telegramBotToken}
                      onChange={(e) => handleSettingChange('telegramBotToken', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium studio-text mb-1">Chat ID</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-mono"
                      placeholder="Your chat ID"
                      value={settings.telegramChatId}
                      onChange={(e) => handleSettingChange('telegramChatId', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Social & Trading Platform Integrations */}
      <div>
        <h3 className="text-lg font-semibold studio-text mb-4 flex items-center space-x-2">
          <Globe className="h-5 w-5 text-primary" />
          <span>Social & Platform Integrations</span>
        </h3>
        <div className="space-y-4">
          {/* TradingView */}
          <div className="studio-surface rounded-lg p-6 border border-[#1a1a1a]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold studio-text">TradingView</h4>
                  <p className="text-xs studio-muted">Share charts and analysis</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {settings.tradingViewConnected ? (
                  <div className="flex items-center space-x-2 text-green-400">
                    <Check className="h-4 w-4" />
                    <span className="text-xs font-medium">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 studio-muted">
                    <X className="h-4 w-4" />
                    <span className="text-xs font-medium">Not Connected</span>
                  </div>
                )}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.tradingViewConnected}
                    onChange={(e) => handleSettingChange('tradingViewConnected', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/60 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            {settings.tradingViewConnected && (
              <div className="space-y-4 border-t border-[#1a1a1a] pt-4">
                <div>
                  <label className="block text-sm font-medium studio-text mb-1">TradingView Username</label>
                  <input
                    type="text"
                    className="w-full md:w-1/2 px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Your TradingView username"
                    value={settings.tradingViewUsername}
                    onChange={(e) => handleSettingChange('tradingViewUsername', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Twitter/X */}
          <div className="studio-surface rounded-lg p-6 border border-[#1a1a1a]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-sky-400 to-sky-600 rounded-lg flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold studio-text">Twitter / X</h4>
                  <p className="text-xs studio-muted">Share trading insights</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {settings.twitterConnected ? (
                  <div className="flex items-center space-x-2 text-green-400">
                    <Check className="h-4 w-4" />
                    <span className="text-xs font-medium">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 studio-muted">
                    <X className="h-4 w-4" />
                    <span className="text-xs font-medium">Not Connected</span>
                  </div>
                )}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.twitterConnected}
                    onChange={(e) => handleSettingChange('twitterConnected', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/60 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            {settings.twitterConnected && (
              <div className="space-y-4 border-t border-[#1a1a1a] pt-4">
                <div>
                  <label className="block text-sm font-medium studio-text mb-1">Twitter Handle</label>
                  <input
                    type="text"
                    className="w-full md:w-1/2 px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="@yourusername"
                    value={settings.twitterUsername}
                    onChange={(e) => handleSettingChange('twitterUsername', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Alert Methods */}
      <div>
        <h3 className="text-lg font-semibold studio-text mb-4 flex items-center space-x-2">
          <Bell className="h-5 w-5 text-primary" />
          <span>Additional Alert Methods</span>
        </h3>
        <div className="space-y-4">
          <div className="studio-surface rounded-lg p-4 border border-[#1a1a1a]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium studio-text">Email Alerts</div>
                <div className="text-xs studio-muted">Send trading alerts to your email</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.emailAlertsEnabled}
                  onChange={(e) => handleSettingChange('emailAlertsEnabled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/60 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          <div className="studio-surface rounded-lg p-4 border border-[#1a1a1a]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-medium studio-text">SMS Alerts</div>
                <div className="text-xs studio-muted">Receive critical alerts via SMS</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.smsAlertsEnabled}
                  onChange={(e) => handleSettingChange('smsAlertsEnabled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/60 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>

            {settings.smsAlertsEnabled && (
              <div className="border-t border-[#1a1a1a] pt-4">
                <label className="block text-sm font-medium studio-text mb-1">Phone Number</label>
                <input
                  type="tel"
                  className="w-full md:w-1/2 px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="+1 (555) 123-4567"
                  value={settings.smsPhoneNumber}
                  onChange={(e) => handleSettingChange('smsPhoneNumber', e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Browser Automation (Playwright) */}
      <div>
        <h3 className="text-lg font-semibold studio-text mb-4 flex items-center space-x-2">
          <Globe className="h-5 w-5 text-primary" />
          <span>Browser Automation</span>
        </h3>
        <div className="studio-surface rounded-lg p-6 border border-[#1a1a1a]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold studio-text">Playwright MCP</h4>
                <p className="text-xs studio-muted">Browser automation and web scraping capabilities</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-green-400">
              <Wifi className="h-4 w-4" />
              <span className="text-xs font-medium">Connected</span>
            </div>
          </div>

          <div className="space-y-4 border-t border-[#1a1a1a] pt-4">
            {/* Browser Mode Toggle */}
            <div className="flex items-center justify-between p-4 bg-amber-900/10 border border-amber-900/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                <div>
                  <div className="text-sm font-medium studio-text">Headless Mode</div>
                  <div className="text-xs studio-muted">
                    {settings.playwrightHeadlessMode
                      ? 'Browser runs in background (faster, no visual feedback)'
                      : 'Browser opens visually (slower, but you can see what\'s happening)'
                    }
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.playwrightHeadlessMode}
                  onChange={(e) => handleSettingChange('playwrightHeadlessMode', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-400/20 dark:peer-focus:ring-amber-400/60 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Browser Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium studio-text mb-1">Browser Type</label>
                <select
                  className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  value={settings.playwrightBrowserType}
                  onChange={(e) => handleSettingChange('playwrightBrowserType', e.target.value)}
                >
                  <option value="chrome">Chrome</option>
                  <option value="firefox">Firefox</option>
                  <option value="webkit">WebKit (Safari)</option>
                  <option value="edge">Microsoft Edge</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium studio-text mb-1">Timeout (seconds)</label>
                <select
                  className="w-full px-3 py-2 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  value={settings.playwrightTimeout}
                  onChange={(e) => handleSettingChange('playwrightTimeout', Number(e.target.value))}
                >
                  <option value={15000}>15 seconds</option>
                  <option value={30000}>30 seconds</option>
                  <option value={60000}>1 minute</option>
                  <option value={120000}>2 minutes</option>
                </select>
              </div>
            </div>

            {/* Additional Options */}
            <div className="flex items-center justify-between p-4 studio-surface rounded-lg border border-[#1a1a1a]">
              <div>
                <div className="text-sm font-medium studio-text">Auto Screenshots</div>
                <div className="text-xs studio-muted">Automatically capture screenshots during automation</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.playwrightAutoScreenshots}
                  onChange={(e) => handleSettingChange('playwrightAutoScreenshots', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/60 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Info Panel */}
            <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <ExternalLink className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h5 className="text-sm font-medium text-blue-300 mb-1">Browser Automation Info</h5>
                  <p className="text-xs text-blue-200/80 leading-relaxed">
                    Playwright enables automated web scraping, testing, and data extraction.
                    Headless mode is recommended for production use as it's faster and uses fewer resources.
                    You can toggle to headed mode for debugging or learning purposes.
                  </p>
                  <div className="mt-2 text-xs text-blue-200/60">
                    Current setting: <span className="font-medium">
                      {settings.playwrightHeadlessMode ? 'Headless' : 'Headed'} mode with {settings.playwrightBrowserType}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSettings()
      case 'trading':
        return renderTradingSettings()
      case 'ai':
        return renderAISettings()
      case 'system':
        return renderSystemHealth()
      case 'integrations':
        return renderIntegrationsSettings()
      case 'notifications':
        return renderNotificationSettings()
      case 'appearance':
        return renderAppearanceSettings()
      case 'data':
        return renderDataSettings()
      case 'security':
        return renderSecuritySettings()
      default:
        return renderProfileSettings()
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
            <div className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold studio-text">Settings</h1>
            </div>
            <div className="flex items-center space-x-4">
            {unsavedChanges && (
              <div className="flex items-center space-x-2 text-sm text-yellow-400">
                <RefreshCw className="h-4 w-4" />
                <span>Unsaved changes</span>
              </div>
            )}
            <button
              className={cn(
                'btn-primary flex items-center space-x-2',
                !unsavedChanges && 'opacity-50 cursor-not-allowed'
              )}
              onClick={handleSaveSettings}
              disabled={!unsavedChanges}
            >
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
            </div>
          </div>
        </div>

        {/* Settings content */}
        <main className="flex flex-1 overflow-hidden">
          {/* Settings sidebar */}
          <div className="w-64 studio-border border-r">
            <nav className="p-4">
              <ul className="space-y-1">
                {settingsSections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        'w-full flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left',
                        activeSection === section.id
                          ? 'bg-primary/10 text-primary'
                          : 'studio-muted hover:bg-[#161616] hover:studio-text'
                      )}
                    >
                      <section.icon className="h-5 w-5" />
                      <span>{section.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Settings content */}
          <div className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-4xl">
              {renderActiveSection()}
            </div>
          </div>
        </main>
      </div>

      {/* AI Sidebar - Renata Chat */}
      {aiSidebarOpen && (
        <div className="w-[480px] studio-surface border-l border-[#1a1a1a] z-40">
          <RenataChat />
        </div>
      )}
    </div>
  )
}