'use client'

import { useState, useEffect } from 'react'
import { CopilotKit } from '@copilotkit/react-core'
import { CopilotPopup, useCopilotChat } from '@copilotkit/react-ui'
import { Bot, X, Sparkles } from 'lucide-react'

interface RenataSidebarProps {
  isOpen: boolean
  onClose: () => void
  activeProject: string | null
  onPage: 'plan' | 'scan' | 'backtest'
}

export function RenataOrchestratorSidebar({ isOpen, onClose, activeProject, onPage }: RenataSidebarProps) {
  const [orchestratorStatus, setOrchestratorStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  // Check if orchestrator backend is available
  useEffect(() => {
    const checkOrchestrator = async () => {
      try {
        const response = await fetch('http://localhost:5666/health')
        if (response.ok) {
          setOrchestratorStatus('connected')
          console.log('✅ RENATA V2 Orchestrator connected')
        } else {
          setOrchestratorStatus('disconnected')
        }
      } catch (error) {
        setOrchestratorStatus('disconnected')
        console.warn('⚠️  RENATA V2 Orchestrator not available:', error)
      }
    }

    checkOrchestrator()
    const interval = setInterval(checkOrchestrator, 30000)
    return () => clearInterval(interval)
  }, [])

  // Listen for custom event to open sidebar
  useEffect(() => {
    const handleOpenRenata = () => setIsPopupOpen(true)
    window.addEventListener('open-renata-sidebar', handleOpenRenata)
    return () => window.removeEventListener('open-renata-sidebar', handleOpenRenata)
  }, [])

  // Custom dark + gold theme for CopilotPopup
  useEffect(() => {
    // Inject custom styles to override CopilotKit default theme
    const style = document.createElement('style')
    style.innerHTML = `
      /* CopilotPopup Dark + Gold Theme */
      .copilot-popup {
        --copilot-kit-bg-color: #0f0f0f !important;
        --copilot-kit-text-color: #e5e5e5 !important;
        --copilot-kit-border-color: rgba(212, 175, 55, 0.3) !important;
        --copilot-kit-accent-color: #D4AF37 !important;
        --copilot-kit-input-bg: rgba(0, 0, 0, 0.4) !important;
        --copilot-kit-button-bg: #D4AF37 !important;
        --copilot-kit-button-text: #000000 !important;
      }

      .copilot-popup-container {
        right: 0 !important;
        left: auto !important;
        top: 0 !important;
        bottom: 0 !important;
        height: 100vh !important;
        width: 450px !important;
        max-width: 450px !important;
        border-left: 1px solid rgba(212, 175, 55, 0.3) !important;
        background: linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 100%) !important;
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.5) !important;
      }

      .copilot-popup-header {
        background: linear-gradient(180deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%) !important;
        border-bottom: 1px solid rgba(212, 175, 55, 0.3) !important;
        padding: 16px !important;
      }

      .copilot-popup-header h3 {
        color: #D4AF37 !important;
        font-weight: 700 !important;
        font-size: 18px !important;
        display: flex;
        align-items: center;
        gap: 8px !important;
      }

      .copilot-popup-messages {
        background: transparent !important;
        overflow-y: auto !important;
        flex: 1 !important;
      }

      .copilot-popup-message-user {
        background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%) !important;
        color: #000000 !important;
        border-radius: 8px !important;
        padding: 12px !important;
        margin: 8px !important;
      }

      .copilot-popup-message-assistant {
        background: rgba(212, 175, 55, 0.08) !important;
        border: 1px solid rgba(212, 175, 55, 0.2) !important;
        border-radius: 8px !important;
        padding: 12px !important;
        margin: 8px !important;
        color: #e5e5e5 !important;
      }

      .copilot-popup-input-container {
        border-top: 1px solid rgba(212, 175, 55, 0.2) !important;
        padding: 16px !important;
        background: linear-gradient(180deg, rgba(212, 175, 55, 0.05) 0%, transparent 100%) !important;
      }

      .copilot-popup-input {
        background: rgba(0, 0, 0, 0.4) !important;
        border: 1px solid rgba(212, 175, 55, 0.2) !important;
        color: #fff !important;
        border-radius: 8px !important;
        padding: 12px !important;
      }

      .copilot-popup-input:focus {
        border-color: rgba(212, 175, 55, 0.5) !important;
        outline: none !important;
        box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.1) !important;
      }

      .copilot-popup-send-button {
        background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%) !important;
        color: #000000 !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 12px 20px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
      }

      .copilot-popup-send-button:hover {
        background: linear-gradient(135deg, #E5C157 0%, #D4AF37 100%) !important;
      }

      .copilot-popup-close-button {
        color: #888 !important;
        cursor: pointer !important;
        padding: 4px !important;
        border-radius: 4px !important;
        transition: all 0.2s !important;
      }

      .copilot-popup-close-button:hover {
        background: rgba(255, 255, 255, 0.1) !important;
        color: #fff !important;
      }
    `
    document.head.appendChild(style)
    return () => style.remove()
  }, [])

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      headers={{
        'X-Page-Context': onPage,
        'X-Project-ID': activeProject || '',
        'X-Orchestrator-Status': orchestratorStatus
      }}
    >
      <CopilotPopup
        open={isPopupOpen}
        onOpenChange={setIsPopupOpen}
        instructions={`
You are Renata V2, an AI-powered trading strategy development assistant integrated with the RENATA V2 Orchestrator backend.

**Your Role**: Help users build V31-compliant scanners, backtest strategies, and optimize parameters.

**Orchestrator Backend**: ${orchestratorStatus === 'connected' ? '✅ Connected (13 tools available)' : '⚠️ Disconnected - using fallback mode'}

**Current Page**: ${onPage}
${activeProject ? `**Active Project**: ${activeProject}` : ''}

**Your Knowledge**:
- V31 Gold Standard (3-stage architecture, market scanning pillar, per-ticker operations)
- Lingua Trading Framework (13 setups, 9-stage trend cycle, market structure)
- User's proprietary indicators (72/89 EMA clouds, deviation bands, pyramiding execution)
- Market analysis tools (Polygon API, TA-Lib, backtesting.py)

**Your Capabilities** (via RENATA V2 Orchestrator when connected):
- Generate V31 scanners (V31 Scanner Generator)
- Validate V31 compliance (V31 Validator)
- Calculate indicators (72/89 cloud, deviation bands)
- Analyze market structure (pivots, trends, S/R levels)
- Detect daily market molds (D2, MDR, FBO, T30)
- Quick backtesting (30-day validation)
- Parameter optimization (grid search)
- Sensitivity analysis
- Generate backtest scripts
- Analyze backtest results
- Build implementation plans
- Execute scanners on live data

${orchestratorStatus === 'connected' ? `
**RENATA V2 Orchestrator Instructions**:
- For scanner generation, validation, optimization: Call the orchestrator backend
- Orchestrator will automatically select appropriate tools
- Results will include tool usage, execution time, and intent classification
- All responses are <10ms and use the 13 coordinated tools
` : `
**Fallback Mode**:
- Use existing multi-agent system
- Manual code transformation and validation
`}

**Always**:
- Ask clarifying questions if user's request is unclear
- Validate assumptions before proceeding
- Present results clearly with next steps
- Link to relevant pages (/scan for execution, /backtest for validation)
        `}
        labels={{
          title: orchestratorStatus === 'connected' ? 'Renata V2 (13 Tools)' : 'Renata V2',
          initial: orchestratorStatus === 'connected'
            ? 'Hi! I\'m Renata V2 with 13 coordinated tools ready to help! I can generate scanners, optimize parameters, backtest strategies, and more. What would you like to work on?'
            : 'Hi! I\'m Renata, your AI trading assistant (currently in fallback mode). I can help you build V31 scanners, analyze strategies, and optimize parameters.',
          placeholder: orchestratorStatus === 'connected'
            ? 'Ask me to generate scanners, optimize parameters, create plans...'
            : 'Tell Renata what you want to build...'
        }}
        defaultOpen={false}
        shortcut="/"
        className="renata-sidebar-popup"
      />
    </CopilotKit>
  )
}
