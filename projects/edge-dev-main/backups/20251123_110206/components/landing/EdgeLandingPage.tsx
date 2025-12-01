'use client'

import { useState } from 'react'
import { Target, TrendingUp, Zap, Brain, BarChart3, Search, Play } from 'lucide-react'
import { UnifiedScanningDashboard } from '@/components/UnifiedScanningDashboard'
import { AguiRenataChatFixed } from '@/components/AguiRenataChat'

export function EdgeLandingPage() {
  const [showDashboard, setShowDashboard] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)

  if (showDashboard) {
    return <UnifiedScanningDashboard onClose={() => setShowDashboard(false)} />
  }

  return (
    <div className="studio-bg min-h-screen">
      {/* Header */}
      <header className="border-b px-6 py-4" style={{ borderColor: 'var(--studio-border)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-8 w-8 text-studio-gold" />
            <span className="text-xl font-bold studio-text">Edge-dev</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              className="px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--studio-surface)',
                color: 'var(--studio-text)',
                borderColor: 'var(--studio-border)'
              }}
              onClick={() => setShowAnalysis(!showAnalysis)}
            >
              AI Analysis
            </button>
            <button
              className="px-6 py-2 bg-studio-gold text-black rounded-lg hover:bg-yellow-400 transition-colors font-semibold"
              onClick={() => setShowDashboard(true)}
            >
              Launch Scanner
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight studio-text sm:text-6xl">
            Edge Trading Scanner
            <span className="block text-studio-gold">Powered by AI</span>
          </h1>
          <p className="mt-6 text-lg leading-8 studio-muted max-w-2xl mx-auto">
            Meet <strong className="text-studio-gold">Renata</strong>, your AI scanning & backtesting specialist.
            Get professional edge detection, systematic scanner optimization, and algorithmic performance insights.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6">
            <button
              className="bg-studio-gold text-black px-8 py-3 text-lg rounded-lg hover:bg-yellow-400 transition-colors font-semibold"
              onClick={() => setShowDashboard(true)}
            >
              Start Scanning
            </button>
            <button className="px-8 py-3 text-lg rounded-lg border transition-colors studio-text hover:bg-gray-800"
              style={{ borderColor: 'var(--studio-border)' }}
            >
              View Documentation
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-lg p-8 text-center" style={{ backgroundColor: 'var(--studio-surface)' }}>
              <Search className="mx-auto h-12 w-12 text-studio-gold mb-4" />
              <h3 className="text-xl font-semibold studio-text mb-2">Advanced Scanner Engine</h3>
              <p className="studio-muted">
                Multi-pattern scanner detection with real-time market data.
                Customizable filters, backtesting, and performance optimization.
              </p>
            </div>

            <div className="rounded-lg p-8 text-center" style={{ backgroundColor: 'var(--studio-surface)' }}>
              <BarChart3 className="mx-auto h-12 w-12 text-studio-gold mb-4" />
              <h3 className="text-xl font-semibold studio-text mb-2">Edge Analytics</h3>
              <p className="studio-muted">
                Professional edge detection algorithms, statistical validation,
                and systematic performance measurement tools.
              </p>
            </div>

            <div className="rounded-lg p-8 text-center" style={{ backgroundColor: 'var(--studio-surface)' }}>
              <Brain className="mx-auto h-12 w-12 text-studio-gold mb-4" />
              <h3 className="text-xl font-semibold studio-text mb-2">AI-Powered Insights</h3>
              <p className="studio-muted">
                Renata AI specializes in scanner optimization, backtesting analysis,
                and systematic trading performance enhancement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Analysis Section */}
      {showAnalysis && (
        <section className="px-6 py-8">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--studio-surface)', borderColor: 'var(--studio-border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold studio-text">Live AI Analysis</h2>
                <button
                  onClick={() => setShowAnalysis(false)}
                  className="text-studio-muted hover:text-studio-text"
                >
                  ×
                </button>
              </div>
              <div className="h-96">
                <AguiRenataChatFixed />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* AI Modes Preview */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center studio-text mb-12">
            Three AI Personalities, One Goal: <span className="text-studio-gold">Your Edge</span>
          </h2>

          <div className="space-y-6">
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--studio-surface)', borderLeft: '4px solid #ef4444' }}>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm studio-muted mb-1">Scanner Analyst Mode</p>
                  <p className="studio-text">
                    "Pattern confidence dropped 15%. Entry timing variance increased. Risk-reward fell below threshold in last 3 scans."
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--studio-surface)', borderLeft: '4px solid #3b82f6' }}>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm studio-muted mb-1">Backtesting Coach Mode</p>
                  <p className="studio-text">
                    "Your pattern recognition improved this week. Focus on scanner parameter optimization to stabilize edge detection."
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--studio-surface)', borderLeft: '4px solid #10b981' }}>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm studio-muted mb-1">Strategy Mentor Mode</p>
                  <p className="studio-text">
                    "Your systematic approach shows maturity. The edge degradation stems from market regime shifts. Let's examine adaptive parameters."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold studio-text mb-4">
            Ready to Find Your Trading Edge?
          </h2>
          <p className="studio-muted mb-8">
            Join systematic traders who trust Edge-dev for professional scanner optimization and AI-powered backtesting insights.
          </p>
          <button
            className="bg-studio-gold text-black px-8 py-3 text-lg rounded-lg hover:bg-yellow-400 transition-colors font-semibold"
            onClick={() => setShowDashboard(true)}
          >
            Launch Scanner Platform
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8" style={{ borderColor: 'var(--studio-border)' }}>
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-6 w-6 text-studio-gold" />
              <span className="font-semibold studio-text">Edge-dev</span>
            </div>
            <p className="studio-muted text-sm">
              © 2024 Edge-dev. Professional trading scanner & backtesting platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}