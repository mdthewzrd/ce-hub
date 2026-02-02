/**
 * Plan Page - Renata V2 Premium Planning Workspace
 *
 * Premium black & gold trading strategy development interface.
 * Professional 3D design with smooth animations and seamless interactions.
 */

'use client';

import { useState } from 'react';
import { MessageCircle, Brain, Zap, Target, BarChart3, TrendingUp, Sparkles, X, Loader2, Play, ArrowRight, CheckCircle2, Shield, Crown } from 'lucide-react';

export default function PlanPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'build' | 'analyze' | 'deploy'>('build');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Main Content Area */}
      <div
        className="flex flex-col overflow-hidden relative z-10 transition-all duration-300 ease-out"
        style={{
          width: sidebarOpen ? 'calc(100% - 384px)' : '100%',
          marginLeft: sidebarOpen ? '0' : '0'
        }}
      >
        {/* Premium Header */}
        <header className="flex h-16 items-center justify-between border-b border-gold/10 bg-gradient-to-b from-surface to-transparent backdrop-blur-xl px-6">
          <div className="flex items-center gap-4">
            {/* Premium Logo */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl animate-glow" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-gold shadow-gold-md border border-gold/50">
                <Brain className="h-5 w-5 text-black" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-bold text-text-gold tracking-wide">
                Renata V2 Planning Workspace
              </h1>
              <p className="text-xs text-text-muted font-medium">
                AI-Powered Trading Strategy Development
              </p>
            </div>
          </div>

          {/* Premium AI Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn btn-primary gap-2 animate-glow"
            title="Open Renata V2 AI Assistant"
          >
            <MessageCircle className="h-4 w-4" />
            Open Renata Chat
            <ArrowRight className="h-4 w-4" />
          </button>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            {/* Premium Welcome Section */}
            <div className="card mb-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gold/20 rounded-full blur-xl animate-pulse" />
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold shadow-gold-lg border border-gold/50">
                        <Crown className="h-6 w-6 text-black" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-text-gold mb-1 flex items-center gap-2">
                        Welcome to Renata V2
                        <span className="text-sm font-normal text-gold/70">Beta</span>
                      </h2>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        Your AI-powered trading strategy development platform with V31 Gold Standard integration
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="text-center">
                      <div className="text-xl font-bold text-text-gold">V31</div>
                      <div className="text-xs text-text-muted">Gold Standard</div>
                    </div>
                  </div>
                </div>

                {/* Premium Capabilities Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { icon: '🎯', title: 'Build V31 Scanners', desc: 'From ideas, A+ examples, or legacy code', color: 'from-gold/20 to-gold/5' },
                    { icon: '📊', title: 'Analyze Backtests', desc: 'Optimize parameters & validate edge', color: 'from-gold/15 to-gold/5' },
                    { icon: '🔍', title: 'Detect Patterns', desc: 'Using your 13 Lingua setups', color: 'from-gold/10 to-gold/5' },
                    { icon: '⚡', title: 'Generate Code', desc: 'With your pyramiding execution style', color: 'from-gold/20 to-gold/5' }
                  ].map((cap, idx) => (
                    <div
                      key={idx}
                      className="group relative overflow-hidden rounded-xl border border-gold/15 bg-gradient-to-br from-gold/10 to-gold/5 p-5 transition-all duration-300 hover:border-gold/40 hover:shadow-gold-md hover-lift cursor-pointer"
                      onMouseEnter={() => setHoveredCard(`cap-${idx}`)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${cap.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                      <div className="relative">
                        <div className={`mb-3 text-3xl transition-transform duration-300 ${hoveredCard === `cap-${idx}` ? 'scale-110' : ''}`}>{cap.icon}</div>
                        <div className="mb-2 text-sm font-semibold text-text-gold">
                          {cap.title}
                        </div>
                        <div className="text-xs text-text-muted">
                          {cap.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Premium Action Tabs */}
            <div className="card mb-6 p-6">
              <div className="flex gap-2 mb-6">
                {[
                  { id: 'build', label: 'Build', icon: Zap },
                  { id: 'analyze', label: 'Analyze', icon: BarChart3 },
                  { id: 'deploy', label: 'Deploy', icon: Play }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-gradient-gold text-black shadow-gold-sm'
                        : 'bg-surface-hover text-text-muted hover:text-text-gold hover:border-gold/30 border border-transparent'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute inset-0 rounded-lg bg-gold/20 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>

              {/* Premium Quick Actions */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeTab === 'build' && [
                  {
                    icon: <Sparkles className="h-7 w-7 text-gold" />,
                    title: 'Build from Idea',
                    desc: 'Describe a setup and Renata builds a V31 scanner',
                    badge: 'AI Powered',
                    gradient: 'from-gold/20 via-gold/10 to-gold/5'
                  },
                  {
                    icon: <Target className="h-7 w-7 text-success" />,
                    title: 'Build from A+ Example',
                    desc: 'Provide ticker + date, Renata extracts the setup',
                    badge: 'Smart Detection',
                    gradient: 'from-gold/15 via-gold/8 to-gold/5'
                  },
                  {
                    icon: <TrendingUp className="h-7 w-7 text-gold" />,
                    title: 'Transform Legacy Code',
                    desc: 'Convert existing scanners to V31 compliance',
                    badge: 'Auto Migration',
                    gradient: 'from-gold/20 via-gold/10 to-gold/5'
                  }
                ].map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSidebarOpen(true)}
                    className="card card-interactive p-6 text-left relative overflow-hidden group"
                    onMouseEnter={() => setHoveredCard(`action-${idx}`)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-2 rounded-lg bg-gold/10 border border-gold/30 group-hover:border-gold/50 transition-colors duration-300">
                          {action.icon}
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold">
                          {action.badge}
                        </span>
                      </div>
                      <h3 className="mb-2 text-base font-bold text-text-primary group-hover:text-text-gold transition-colors duration-300">
                        {action.title}
                      </h3>
                      <p className="m-0 text-sm text-text-muted leading-relaxed">
                        {action.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Your 13 Systematized Setups */}
            <div className="card mb-6 p-6">
              <h3 className="mb-5 flex items-center gap-3 text-lg font-bold text-text-gold">
                <div className="p-2 rounded-lg bg-gold/10 border border-gold/30">
                  <BarChart3 className="h-5 w-5 text-gold" />
                </div>
                Your Systematized Setups
                <span className="ml-auto text-xs font-normal text-gold/70">13 Patterns</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                {[
                  'OS D1', 'G2G S1', 'SC DMR', 'SC MDR Swing', 'Daily Para Run', 'EXT Uptrend Gap', 'Para FRD',
                  'MDR', 'LC FBO', 'LC T30', 'LC Extended Trendbreak', 'LC Breakdown', 'Backside Trend Pop', 'Backside Euphoric'
                ].map((setup, idx) => (
                  <div
                    key={setup}
                    onClick={() => setSidebarOpen(true)}
                    className="group cursor-pointer rounded-lg border border-gold/15 bg-surface px-4 py-3 text-center transition-all duration-300 hover:border-gold/50 hover:bg-gold/10 hover:shadow-gold-sm hover-lift relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative">
                      <p className="m-0 text-xs font-semibold text-text-primary group-hover:text-text-gold transition-colors duration-300">
                        {setup}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium Getting Started Guide */}
            <div className="card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-3xl" />
              <div className="relative">
                <h3 className="mb-6 flex items-center gap-3 text-lg font-bold text-text-gold">
                  <Shield className="h-5 w-5" />
                  Getting Started
                  <span className="ml-2 text-xs font-normal text-gold/70">4 Steps</span>
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    { step: '01', title: 'Open Renata Chat', desc: 'Click the button in the top right corner', icon: MessageCircle },
                    { step: '02', title: 'Describe Your Setup', desc: 'Tell Renata what you want to build', icon: Sparkles },
                    { step: '03', title: 'Validate & Optimize', desc: 'Renata guides you through the process', icon: CheckCircle2 },
                    { step: '04', title: 'Deploy & Test', desc: 'Run on /scan or /backtest pages', icon: Play }
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="group flex gap-4 p-4 rounded-lg border border-gold/10 bg-surface-hover/30 transition-all duration-300 hover:border-gold/30 hover:bg-gold/5 hover-lift cursor-pointer relative overflow-hidden"
                      onClick={() => setSidebarOpen(true)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-gold text-base font-bold text-black shadow-gold-sm border border-gold/50 group-hover:scale-110 transition-transform duration-300">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2 text-sm font-bold text-text-primary group-hover:text-text-gold transition-colors duration-300">
                          {item.title}
                          <item.icon className="h-4 w-4 text-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <div className="text-xs text-text-muted">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Sidebar for Renata Chat */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-96 border-l border-gold/20 bg-gradient-to-b from-surface to-surface-hover shadow-3d-lg lg:shadow-3d-xl transition-transform duration-300 ease-out"
          style={{
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)'
          }}
          >
            <div className="flex h-full flex-col">
              {/* Sidebar Header */}
              <div className="flex h-16 items-center justify-between border-b border-gold/10 px-6 bg-gradient-to-r from-gold/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-gold shadow-gold-sm border border-gold/50">
                    <Brain className="h-4 w-4 text-black" />
                  </div>
                  <h3 className="text-sm font-bold text-text-gold">Renata V2 Chat</h3>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-2 hover:bg-gold/10 text-text-muted hover:text-gold transition-all duration-200 border border-transparent hover:border-gold/30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Chat Content */}
              <div className="flex-1 flex flex-col p-6 gap-4">
                <div className="flex-1 rounded-xl border border-gold/10 bg-surface p-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent" />
                  <div className="relative flex flex-col items-center justify-center h-full text-center">
                    <div className="mb-4 p-3 rounded-full bg-gold/10 border border-gold/30 animate-float">
                      <Brain className="h-8 w-8 text-gold" />
                    </div>
                    <p className="text-sm text-text-secondary mb-2">
                      Renata AI Chat Integration
                    </p>
                    <p className="text-xs text-text-muted">
                      Coming soon with CopilotKit integration
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-gold/10 to-gold/5 p-3 shadow-gold-sm">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Ask Renata about your trading setup..."
                      className="input flex-1 bg-transparent text-sm border-0 focus:ring-0"
                      disabled
                    />
                    <button className="btn btn-primary px-4" disabled>
                      <Sparkles className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
