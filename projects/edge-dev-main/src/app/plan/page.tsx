'use client'

import { useState } from 'react'
import { MessageCircle, Brain, Zap, Target, BarChart3, TrendingUp } from 'lucide-react'
import { RenataSidebar } from '@/components/renata/RenataSidebar'

export default function PlanPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeProject, setActiveProject] = useState<string | null>(null)

  return (
    <>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div
            style={{
              borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
              background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.05) 0%, transparent 100%)',
              backdropFilter: 'blur(10px)',
              padding: '16px 24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #D4AF37 0%, rgba(212, 175, 55, 0.7) 100%)',
                      boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(212, 175, 55, 0.4)'
                    }}
                  >
                    <Brain style={{ color: '#000', width: '24px', height: '24px' }} />
                  </div>
                  <div>
                    <h1
                      style={{
                        color: '#D4AF37',
                        fontSize: '24px',
                        fontWeight: '700',
                        margin: 0,
                        letterSpacing: '0.5px'
                      }}
                    >
                      Renata Planning Workspace
                    </h1>
                    <p
                      style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '13px',
                        margin: '2px 0 0 0',
                        fontWeight: '500'
                      }}
                    >
                      AI-Powered Trading Strategy Development
                    </p>
                  </div>
                </div>
              </div>

              {/* Renata AI Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.08) 100%)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  borderRadius: '12px',
                  color: '#D4AF37',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.12) 100%)';
                  e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.08) 100%)';
                  e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                  e.currentTarget.style.transform = 'translateY(0px)';
                }}
                title="Open Renata V2 AI Assistant"
              >
                <MessageCircle style={{ width: '18px', height: '18px' }} />
                Open Renata Chat
              </button>
            </div>
          </div>

          {/* Main Workspace */}
          <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              {/* Welcome Section */}
              <div
                style={{
                  background: 'rgba(17, 17, 17, 0.8)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  borderRadius: '16px',
                  padding: '32px',
                  marginBottom: '24px',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <h2
                  style={{
                    color: '#D4AF37',
                    fontSize: '28px',
                    fontWeight: '700',
                    margin: '0 0 16px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <Brain style={{ width: '28px', height: '28px' }} />
                  Welcome to Renata V2
                </h2>
                <p
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '15px',
                    margin: '0 0 24px 0',
                    lineHeight: '1.6'
                  }}
                >
                  Renata is your AI-powered trading strategy development platform. She combines your V31 Gold Standard,
                  Lingua Trading Framework, and systematized setups to help you build profitable scanners.
                </p>

                {/* Capabilities Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '16px'
                  }}
                >
                  {[
                    { icon: '🎯', title: 'Build V31 Scanners', desc: 'From ideas, A+ examples, or legacy code' },
                    { icon: '📊', title: 'Analyze Backtests', desc: 'Optimize parameters & validate edge' },
                    { icon: '🔍', title: 'Detect Patterns', desc: 'Using your 13 Lingua setups' },
                    { icon: '⚡', title: 'Generate Code', desc: 'With your pyramiding execution style' }
                  ].map((cap, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(40, 40, 40, 0.6)',
                        border: '1px solid rgba(212, 175, 55, 0.15)',
                        borderRadius: '12px',
                        padding: '20px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                        e.currentTarget.style.background = 'rgba(40, 40, 40, 0.8)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.15)';
                        e.currentTarget.style.background = 'rgba(40, 40, 40, 0.6)';
                      }}
                    >
                      <div style={{ fontSize: '32px', marginBottom: '12px' }}>{cap.icon}</div>
                      <div
                        style={{
                          color: '#D4AF37',
                          fontSize: '16px',
                          fontWeight: '600',
                          marginBottom: '8px'
                        }}
                      >
                        {cap.title}
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
                        {cap.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '20px',
                  marginBottom: '24px'
                }}
              >
                {[
                  {
                    icon: <Zap style={{ color: '#D4AF37', width: '32px', height: '32px' }} />,
                    title: 'Build from Idea',
                    desc: 'Describe a setup and Renata builds a V31 scanner',
                    action: () => setSidebarOpen(true)
                  },
                  {
                    icon: <Target style={{ color: '#22C55E', width: '32px', height: '32px' }} />,
                    title: 'Build from A+ Example',
                    desc: 'Provide ticker + date, Renata extracts the setup',
                    action: () => setSidebarOpen(true)
                  },
                  {
                    icon: <TrendingUp style={{ color: '#3B82F6', width: '32px', height: '32px' }} />,
                    title: 'Transform Legacy Code',
                    desc: 'Convert existing scanners to V31 compliance',
                    action: () => setSidebarOpen(true)
                  }
                ].map((action, idx) => (
                  <button
                    key={idx}
                    onClick={action.action}
                    style={{
                      background: 'rgba(17, 17, 17, 0.8)',
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                      borderRadius: '16px',
                      padding: '28px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backdropFilter: 'blur(10px)',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(212, 175, 55, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.2)';
                      e.currentTarget.style.transform = 'translateY(0px)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ marginBottom: '16px' }}>{action.icon}</div>
                    <h3
                      style={{
                        color: '#fff',
                        fontSize: '18px',
                        fontWeight: '700',
                        margin: '0 0 8px 0'
                      }}
                    >
                      {action.title}
                    </h3>
                    <p
                      style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '14px',
                        margin: 0,
                        lineHeight: '1.5'
                      }}
                    >
                      {action.desc}
                    </p>
                  </button>
                ))}
              </div>

              {/* Your 13 Setups */}
              <div
                style={{
                  background: 'rgba(17, 17, 17, 0.8)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  borderRadius: '16px',
                  padding: '28px',
                  marginBottom: '24px',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <h3
                  style={{
                    color: '#D4AF37',
                    fontSize: '20px',
                    fontWeight: '700',
                    margin: '0 0 20px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <BarChart3 style={{ width: '22px', height: '22px' }} />
                  Your Systematized Setups
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '12px'
                  }}
                >
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
                      style={{
                        background: 'rgba(40, 40, 40, 0.6)',
                        border: '1px solid rgba(212, 175, 55, 0.15)',
                        borderRadius: '10px',
                        padding: '14px 18px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)';
                        e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.15)';
                        e.currentTarget.style.background = 'rgba(40, 40, 40, 0.6)';
                      }}
                    >
                      <div
                        style={{
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: '600',
                          margin: 0
                        }}
                      >
                        {setup}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Getting Started Guide */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0.03) 100%)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '16px',
                  padding: '28px',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <h3
                  style={{
                    color: '#D4AF37',
                    fontSize: '20px',
                    fontWeight: '700',
                    margin: '0 0 20px 0'
                  }}
                >
                  Getting Started
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { step: '1', title: 'Open Renata Chat', desc: 'Click the button in the top right' },
                    { step: '2', title: 'Describe Your Setup', desc: 'Tell Renata what you want to build' },
                    { step: '3', title: 'Validate & Optimize', desc: 'Renata guides you through the process' },
                    { step: '4', title: 'Deploy & Test', desc: 'Run on /scan or /backtest pages' }
                  ].map((item) => (
                    <div
                      key={item.step}
                      style={{
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'flex-start'
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #D4AF37 0%, rgba(212, 175, 55, 0.7) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontWeight: '700',
                          fontSize: '16px',
                          color: '#000'
                        }}
                      >
                        {item.step}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            color: '#fff',
                            fontSize: '15px',
                            fontWeight: '600',
                            marginBottom: '4px'
                          }}
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontSize: '13px'
                          }}
                        >
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

      {/* Renata Sidebar */}
      <RenataSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeProject={activeProject}
        onPage="plan"
      />
    </>
  )
}
