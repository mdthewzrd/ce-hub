'use client'

import { useState } from 'react'
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
  TrendingUp
} from 'lucide-react'
import { TopNavigation } from '@/components/layout/top-nav'
import { RenataChat } from '@/components/dashboard/renata-chat'
import { cn } from '@/lib/utils'

const settingsSections = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'trading', name: 'Trading', icon: TrendingUp },
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
  })

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setUnsavedChanges(true)
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

  const renderProfileSettings = () => (
    <div className="space-y-6">
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
            <button className="btn-ghost text-red-400 hover:text-red-300 flex items-center space-x-2">
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
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
        <div className="w-[600px] studio-surface border-l border-[#1a1a1a] z-40">
          <RenataChat />
        </div>
      )}
    </div>
  )
}