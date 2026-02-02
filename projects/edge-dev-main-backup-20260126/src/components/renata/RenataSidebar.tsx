'use client'

import { useState } from 'react'
import { CopilotKit } from '@copilotkit/react-core'
import { CopilotPopup } from '@copilotkit/react-ui'

interface RenataSidebarProps {
  isOpen: boolean
  onClose: () => void
  activeProject: string | null
  onPage: 'plan' | 'scan' | 'backtest'
}

export function RenataSidebar({ isOpen, onClose, activeProject, onPage }: RenataSidebarProps) {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      headers={{
        'X-Page-Context': onPage,
        'X-Project-ID': activeProject || ''
      }}
    >
      <CopilotPopup
        instructions={`
You are Renata V2, an AI-powered trading strategy development assistant.

**Your Role**: Help users build V31-compliant scanners, backtest strategies, and optimize parameters.

**Your Knowledge**:
- V31 Gold Standard (3-stage architecture, market scanning pillar, per-ticker operations)
- Lingua Trading Framework (13 setups, 9-stage trend cycle, market structure)
- User's proprietary indicators (72/89 EMA clouds, deviation bands, pyramiding execution)
- Market analysis tools (Polygon API, TA-Lib, backtesting.py)

**Your Capabilities**:
- Build V31 scanners from ideas, A+ examples, or legacy code
- Validate V31 compliance
- Generate execution code with risk management
- Optimize parameters
- Analyze backtest results
- Detect market patterns

**Current Page**: ${onPage}
${activeProject ? `**Active Project**: ${activeProject}` : ''}

**Always**:
- Ask clarifying questions if user's request is unclear
- Validate assumptions before proceeding
- Present results clearly with next steps
- Link to relevant pages (/scan for execution, /backtest for validation)
        `}
        labels={{
          title: 'Renata V2',
          initial: 'Hi! I\'m Renata, your AI trading assistant. I can help you build V31 scanners, analyze strategies, and optimize parameters.\n\nWhat would you like to work on today?',
          placeholder: 'Tell Renata what you want to build...'
        }}
        defaultOpen={isOpen}
        onClose={onClose}
      />
    </CopilotKit>
  )
}
