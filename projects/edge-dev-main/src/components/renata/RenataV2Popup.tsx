'use client';

/**
 * 🤖 RENATA V2 Popup Component
 *
 * Controlled CopilotKit popup that connects to RENATA V2 Orchestrator backend
 * Can be opened programmatically with isOpen/onClose props
 */

import React, { useEffect, useState } from 'react';
import { CopilotPopup } from '@copilotkit/react-ui';
import { Bot } from 'lucide-react';

interface RenataV2PopupProps {
  isOpen: boolean;
  onClose: () => void;
  scannerCode?: string;
  scanResults?: any[];
  mode?: 'scan' | 'backtest' | 'plan';
}

export function RenataV2Popup({
  isOpen,
  onClose,
  scannerCode = '',
  scanResults = [],
  mode = 'scan'
}: RenataV2PopupProps) {
  const [orchestratorStatus, setOrchestratorStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Check orchestrator connection
  useEffect(() => {
    const checkOrchestrator = async () => {
      try {
        const response = await fetch('http://localhost:5666/health');
        if (response.ok) {
          setOrchestratorStatus('connected');
          console.log('✅ RENATA V2 Orchestrator connected');
        } else {
          setOrchestratorStatus('disconnected');
        }
      } catch (error) {
        setOrchestratorStatus('disconnected');
        console.warn('⚠️  RENATA V2 Orchestrator not available:', error);
      }
    };

    checkOrchestrator();
    const interval = setInterval(checkOrchestrator, 30000);
    return () => clearInterval(interval);
  }, []);

  // Custom chat suggestions based on mode
  const suggestions = mode === 'scan' ? [
    {
      label: 'Generate a D2 momentum scanner',
      message: 'Generate a D2 momentum scanner with gap confirmation',
    },
    {
      label: 'Validate V31 compliance',
      message: 'Validate my current scanner code for V31 compliance',
    },
    {
      label: 'Optimize gap parameters',
      message: 'Optimize gap percent between 1.5 and 3.0',
    },
  ] : mode === 'backtest' ? [
    {
      label: 'Quick backtest',
      message: 'Run quick backtest on last 30 days',
    },
    {
      label: 'Analyze results',
      message: 'Analyze backtest results and metrics',
    },
    {
      label: 'Optimize parameters',
      message: 'Optimize strategy parameters based on backtest',
    },
  ] : [
    {
      label: 'Create implementation plan',
      message: 'Create implementation plan for momentum strategy',
    },
    {
      label: 'Generate backtest script',
      message: 'Generate backtest script for this strategy',
    },
    {
      label: 'Analyze market structure',
      message: 'Analyze market structure for AAPL',
    },
  ];

  return (
    <CopilotPopup
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      instructions={`You are Renata V2, an AI-powered trading strategy development assistant integrated with the RENATA V2 Orchestrator backend.

**Your Role**: Help users build V31-compliant scanners, backtest strategies, and optimize parameters.

**Orchestrator Backend**: ${orchestratorStatus === 'connected' ? '✅ Connected (13 tools available)' : '⚠️ Disconnected - using fallback mode'}

**Current Mode**: ${mode}
${scannerCode ? `**Scanner Code**: Present (${scannerCode.length} chars)` : '**Scanner Code**: None'}
**Scan Results**: ${scanResults.length} items

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
- Link to relevant pages (/scan for execution, /backtest for validation)`}
      labels={{
        title: orchestratorStatus === 'connected' ? `Renata V2 (13 Tools) - ${mode.charAt(0).toUpperCase() + mode.slice(1)}` : `Renata V2 - ${mode.charAt(0).toUpperCase() + mode.slice(1)}`,
        initial: orchestratorStatus === 'connected'
          ? `Hi! I'm Renata V2 with 13 coordinated tools ready to help! I'm in ${mode} mode.\n\nI can generate scanners, optimize parameters, backtest strategies, and more. What would you like to work on?`
          : `Hi! I'm Renata, your AI trading assistant (currently in fallback mode). I'm in ${mode} mode and can help you build V31 scanners, analyze strategies, and optimize parameters.`,
        placeholder: orchestratorStatus === 'connected'
          ? 'Ask me to generate scanners, optimize parameters, create plans...'
          : 'Tell Renata what you want to build...'
      }}
      defaultOpen={false}
      shortcut="/"
      className="renata-v2-popup"
    />
  );
}
