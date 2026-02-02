/**
 * Plan Page - Renata V2 Planning Workspace
 *
 * Trading strategy development interface with Renata AI.
 */

'use client';

import { useState } from 'react';
import { MessageCircle, Brain, Zap, Target, BarChart3, TrendingUp, Sparkles, X } from 'lucide-react';

export default function PlanPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-surface">
          <div className="flex items-center gap-3 px-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold">
              <Brain className="h-4 w-4 text-black" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-text-primary">Renata Planning Workspace</h1>
              <p className="text-xs text-text-muted">AI-Powered Trading Strategy Development</p>
            </div>
          </div>

          {/* Renata AI Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn btn-primary mr-4"
            title="Open Renata V2 AI Assistant"
          >
            <MessageCircle className="h-4 w-4" />
            Open Renata Chat
          </button>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6">
            {/* Welcome Section */}
            <div className="card mb-6">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-text-primary">
                <Brain className="h-5 w-5 text-gold" />
                Welcome to Renata V2
              </h2>
              <p className="mb-6 text-sm text-text-secondary">
                Renata is your AI-powered trading strategy development platform. She combines your V31 Gold Standard,
                Lingua Trading Framework, and systematized setups to help you build profitable scanners.
              </p>

              {/* Capabilities Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: '🎯', title: 'Build V31 Scanners', desc: 'From ideas, A+ examples, or legacy code' },
                  { icon: '📊', title: 'Analyze Backtests', desc: 'Optimize parameters & validate edge' },
                  { icon: '🔍', title: 'Detect Patterns', desc: 'Using your 13 Lingua setups' },
                  { icon: '⚡', title: 'Generate Code', desc: 'With your pyramiding execution style' }
                ].map((cap, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-border bg-surface-hover p-4 transition-all hover:border-gold/30"
                  >
                    <div className="mb-2 text-2xl">{cap.icon}</div>
                    <div className="mb-1 text-sm font-medium text-text-primary">
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
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: <Zap className="h-6 w-6 text-gold" />,
                  title: 'Build from Idea',
                  desc: 'Describe a setup and Renata builds a V31 scanner',
                  action: () => setSidebarOpen(true)
                },
                {
                  icon: <Target className="h-6 w-6 text-success" />,
                  title: 'Build from A+ Example',
                  desc: 'Provide ticker + date, Renata extracts the setup',
                  action: () => setSidebarOpen(true)
                },
                {
                  icon: <TrendingUp className="h-6 w-6 text-primary" />,
                  title: 'Transform Legacy Code',
                  desc: 'Convert existing scanners to V31 compliance',
                  action: () => setSidebarOpen(true)
                }
              ].map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.action}
                  className="card card-interactive p-5 text-left w-full"
                >
                  <div className="mb-3">{action.icon}</div>
                  <h3 className="mb-1 text-base font-medium text-text-primary">
                    {action.title}
                  </h3>
                  <p className="m-0 text-sm text-text-muted">
                    {action.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Your 13 Setups */}
            <div className="card mb-6">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-text-primary">
                <BarChart3 className="h-5 w-5 text-gold" />
                Your Systematized Setups
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
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
                    className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-2 text-center transition-all hover:border-gold/40 hover:bg-gold/10"
                  >
                    <p className="m-0 text-xs font-medium text-text-primary">
                      {setup}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Getting Started Guide */}
            <div className="card border-gold/30">
              <h3 className="mb-4 text-base font-semibold text-text-primary">
                Getting Started
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  { step: '1', title: 'Open Renata Chat', desc: 'Click the button in the top right' },
                  { step: '2', title: 'Describe Your Setup', desc: 'Tell Renata what you want to build' },
                  { step: '3', title: 'Validate & Optimize', desc: 'Renata guides you through the process' },
                  { step: '4', title: 'Deploy & Test', desc: 'Run on /scan or /backtest pages' }
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex gap-3"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gold text-sm font-semibold text-black">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="mb-0.5 text-sm font-medium text-text-primary">
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

      {/* Sidebar Placeholder for Renata Chat */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-80 border-l border-border bg-surface shadow-xl lg:shadow-2xl">
            <div className="flex h-full flex-col">
              {/* Sidebar Header */}
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <h3 className="text-sm font-semibold text-text-primary">Renata Chat</h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-md p-1.5 hover:bg-surface-hover text-text-muted hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Chat Content */}
              <div className="flex-1 flex flex-col p-4 gap-3">
                <div className="flex-1 rounded-lg border border-border bg-surface-hover/50 p-4">
                  <p className="text-sm text-text-muted">
                    Renata AI chat will be integrated here. For now, this is a placeholder for the upcoming CopilotKit integration.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-2">
                  <input
                    type="text"
                    placeholder="Ask Renata..."
                    className="input w-full text-sm"
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
