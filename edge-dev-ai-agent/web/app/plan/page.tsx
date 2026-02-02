'use client';

import { useState } from 'react';
import { MessageCircle, Brain, Zap, Target, BarChart3, TrendingUp, Sparkles } from 'lucide-react';

export default function PlanPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-gold/20 bg-gradient-to-b from-gold/5 to-transparent backdrop-blur-md px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold/70 shadow-lg shadow-gold/30 border border-gold/40">
                <Brain className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gold tracking-wide">
                  Renata Planning Workspace
                </h1>
                <p className="text-xs text-text-muted font-medium">
                  AI-Powered Trading Strategy Development
                </p>
              </div>
            </div>
          </div>

          {/* Renata AI Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-gold/15 to-gold/8 border border-gold/40 rounded-xl text-gold text-sm font-semibold cursor-pointer transition-all duration-200 backdrop-blur-md hover:from-gold/20 hover:to-gold/12 hover:border-gold/60 hover:-translate-y-0.5 whitespace-nowrap"
            title="Open Renata V2 AI Assistant"
          >
            <MessageCircle className="h-[18px] w-[18px]" />
            Open Renata Chat
          </button>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-[1400px]">
            {/* Welcome Section */}
            <div className="mb-6 rounded-2xl border border-gold/20 bg-surface/80 p-8 backdrop-blur-md">
              <h2 className="mb-4 flex items-center gap-3 text-2xl font-bold text-gold">
                <Brain className="h-7 w-7" />
                Welcome to Renata V2
              </h2>
              <p className="mb-6 text-[15px] leading-relaxed text-text-secondary">
                Renata is your AI-powered trading strategy development platform. She combines your V31 Gold Standard,
                Lingua Trading Framework, and systematized setups to help you build profitable scanners.
              </p>

              {/* Capabilities Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: '🎯', title: 'Build V31 Scanners', desc: 'From ideas, A+ examples, or legacy code' },
                  { icon: '📊', title: 'Analyze Backtests', desc: 'Optimize parameters & validate edge' },
                  { icon: '🔍', title: 'Detect Patterns', desc: 'Using your 13 Lingua setups' },
                  { icon: '⚡', title: 'Generate Code', desc: 'With your pyramiding execution style' }
                ].map((cap, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-gold/15 bg-surface-hover/60 p-5 transition-all duration-200 hover:border-gold/40 hover:bg-surface-hover/80"
                  >
                    <div className="mb-3 text-[32px]">{cap.icon}</div>
                    <div className="mb-2 text-base font-semibold text-gold">
                      {cap.title}
                    </div>
                    <div className="text-xs text-text-muted">
                      {cap.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: <Zap className="h-8 w-8 text-gold" />,
                  title: 'Build from Idea',
                  desc: 'Describe a setup and Renata builds a V31 scanner',
                  action: () => setSidebarOpen(true)
                },
                {
                  icon: <Target className="h-8 w-8 text-success" />,
                  title: 'Build from A+ Example',
                  desc: 'Provide ticker + date, Renata extracts the setup',
                  action: () => setSidebarOpen(true)
                },
                {
                  icon: <TrendingUp className="h-8 w-8 text-primary" />,
                  title: 'Transform Legacy Code',
                  desc: 'Convert existing scanners to V31 compliance',
                  action: () => setSidebarOpen(true)
                }
              ].map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.action}
                  className="rounded-2xl border border-gold/20 bg-surface/80 p-7 text-left backdrop-blur-md transition-all duration-200 hover:border-gold/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/15 w-full"
                >
                  <div className="mb-4">{action.icon}</div>
                  <h3 className="mb-2 text-lg font-bold text-foreground">
                    {action.title}
                  </h3>
                  <p className="m-0 text-sm leading-relaxed text-text-muted">
                    {action.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Your 13 Setups */}
            <div className="mb-6 rounded-2xl border border-gold/20 bg-surface/80 p-7 backdrop-blur-md">
              <h3 className="mb-5 flex items-center gap-2.5 text-xl font-bold text-gold">
                <BarChart3 className="h-[22px] w-[22px]" />
                Your Systematized Setups
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                {[
                  'OS D1',
                  'G2G S1',
                  'SC DMR',
                  'SC MDR Swing',
                  'Daily Para Run',
                  'EXT Uptrend Gap',
                  'Para FRD',
                  'MDR',
                  'LC FBO',
                  'LC T30',
                  'LC Extended Trendbreak',
                  'LC Breakdown',
                  'Backside Trend Pop',
                  'Backside Euphoric'
                ].map((setup) => (
                  <div
                    key={setup}
                    onClick={() => setSidebarOpen(true)}
                    className="cursor-pointer rounded-xl border border-gold/15 bg-surface-hover/60 px-4.5 py-3.5 text-center transition-all duration-200 hover:border-gold/50 hover:bg-gold/10"
                  >
                    <p className="m-0 text-sm font-semibold text-foreground">
                      {setup}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Getting Started Guide */}
            <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/8 to-gold/3 p-7 backdrop-blur-md">
              <h3 className="mb-5 text-xl font-bold text-gold">
                Getting Started
              </h3>
              <div className="flex flex-col gap-4">
                {[
                  { step: '1', title: 'Open Renata Chat', desc: 'Click the button in the top right' },
                  { step: '2', title: 'Describe Your Setup', desc: 'Tell Renata what you want to build' },
                  { step: '3', title: 'Validate & Optimize', desc: 'Renata guides you through the process' },
                  { step: '4', title: 'Deploy & Test', desc: 'Run on /scan or /backtest pages' }
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex gap-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold/70 text-base font-bold text-black">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 text-sm font-semibold text-foreground">
                        {item.title}
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

      {/* Simple Sidebar Placeholder */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-96 border-l border-gold/20 bg-surface p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gold">Renata Chat</h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-2 hover:bg-surface-hover"
              >
                ✕
              </button>
            </div>
            <div className="flex h-[calc(100%-80px)] flex-col gap-4">
              <div className="flex-1 rounded-xl border border-gold/10 bg-surface-hover/30 p-4">
                <p className="text-sm text-text-muted">
                  Renata AI chat will be integrated here. For now, this is a placeholder for the upcoming CopilotKit integration.
                </p>
              </div>
              <div className="rounded-xl border border-gold/20 bg-surface p-4">
                <input
                  type="text"
                  placeholder="Ask Renata..."
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-text-muted focus:outline-none"
                  disabled
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
