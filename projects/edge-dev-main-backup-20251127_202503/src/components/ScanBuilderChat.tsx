/**
 * 🤖 Scan Builder Chat Interface
 * AI-Agent integrated conversational scan parameter modification
 * Built with CopilotKit for natural language interaction
 */

'use client'

import React, { useState, useEffect } from 'react';
import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core';
import { CopilotChat } from '@copilotkit/react-ui';
import {
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Zap,
  Target,
  X
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
//   TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface ScanParameters {
  market_filters: {
    price_min: number;
    price_max: number;
    volume_min_usd: number;
  };
  momentum_triggers: {
    atr_multiple: number;
    volume_multiple: number;
    gap_threshold_atr: number;
    ema_distance_9: number;
    ema_distance_20: number;
  };
  signal_scoring: {
    signal_strength_min: number;
    target_multiplier: number;
  };
  entry_criteria: {
    max_results_per_day: number;
    close_range_min: number;
  };
}

interface ParameterModification {
  changes: Record<string, any>;
  confidence: number;
  explanation: string;
  requires_approval: boolean;
  estimated_impact: {
    signal_count_change: string;
    quality_impact: string;
    performance_prediction: string;
  };
  warnings: string[];
  suggestions: string[];
}

interface BacktestResult {
  is_safe: boolean;
  estimated_signals_per_day: number;
  quality_score: number;
  risk_assessment: string;
  recommendation: string;
  key_concerns: string[];
  validation_confidence: number;
}

interface ApprovalModalData {
  modification: ParameterModification | null;
  backtest: BacktestResult | null;
  isOpen: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ScanBuilderChat() {
  // ────── State Management ──────
  const [currentParameters, setCurrentParameters] = useState<ScanParameters>({
    market_filters: {
      price_min: 8.0,
      price_max: 1000.0,
      volume_min_usd: 30_000_000,
    },
    momentum_triggers: {
      atr_multiple: 1.0,
      volume_multiple: 1.5,
      gap_threshold_atr: 0.75,
      ema_distance_9: 1.5,
      ema_distance_20: 2.0,
    },
    signal_scoring: {
      signal_strength_min: 0.6,
      target_multiplier: 1.08,
    },
    entry_criteria: {
      max_results_per_day: 50,
      close_range_min: 0.7,
    }
  });

  const [approvalModal, setApprovalModal] = useState<ApprovalModalData>({
    modification: null,
    backtest: null,
    isOpen: false
  });

  const [isBacktesting, setIsBacktesting] = useState(false);
  const [lastBacktest, setLastBacktest] = useState<BacktestResult | null>(null);

  // ────── CopilotKit Integration ──────

  // Make current parameters readable to the AI
  useCopilotReadable({
    description: "Current trading scan parameters and configuration",
    value: {
      parameters: currentParameters,
      last_backtest: lastBacktest,
      status: "ready_for_modifications"
    }
  });

  // Main parameter modification action
  useCopilotAction({
    name: "modify_scan_parameters",
    description: "Modify trading scan parameters based on natural language request",
    parameters: [
      {
        name: "user_request",
        type: "string",
        description: "Natural language request for parameter changes (e.g., 'make this more aggressive', 'focus on small caps')",
        required: true
      }
    ],
    handler: async ({ user_request }) => {
      try {
        console.log("🤖 Processing parameter modification request:", user_request);

        // Call our Parameter Translation Engine
        const modification = await translateUserRequest(user_request, currentParameters);

        if (!modification.requires_approval) {
          // Apply changes immediately for low-risk modifications
          await applyParameterChanges(modification.changes);
          return `  Applied changes: ${modification.explanation}\n\nEstimated impact: ${modification.estimated_impact.signal_count_change}`;
        } else {
          // Show approval modal for significant changes
          setApprovalModal({
            modification,
            backtest: null,
            isOpen: true
          });

          // Trigger quick backtest
          const backtestResult = await runQuickBacktest(modification.changes);
          setApprovalModal(prev => ({
            ...prev,
            backtest: backtestResult
          }));

          return `  Parameter changes prepared for your review:\n\n${modification.explanation}\n\n⚠️ Approval required due to: ${modification.warnings.join(', ')}\n\nRunning quick validation...`;
        }

      } catch (error) {
        console.error("Parameter modification error:", error);
        return `❌ Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try rephrasing your request.`;
      }
    },
  });

  // Quick backtest action
  useCopilotAction({
    name: "run_backtest_validation",
    description: "Run a quick backtest to validate current scan parameters",
    parameters: [],
    handler: async () => {
      setIsBacktesting(true);
      try {
        const result = await runQuickBacktest(currentParameters);
        setLastBacktest(result);
        setIsBacktesting(false);

        return `📊 Backtest completed!\n\nSignals per day: ${result.estimated_signals_per_day}\nQuality score: ${result.quality_score}\nRisk: ${result.risk_assessment}\n\n${result.recommendation}`;
      } catch (error) {
        setIsBacktesting(false);
        return `❌ Backtest failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });

  // Reset to defaults action
  useCopilotAction({
    name: "reset_to_defaults",
    description: "Reset scan parameters to default balanced configuration",
    parameters: [],
    handler: async () => {
      const defaultParams: ScanParameters = {
        market_filters: { price_min: 8.0, price_max: 1000.0, volume_min_usd: 30_000_000 },
        momentum_triggers: { atr_multiple: 1.0, volume_multiple: 1.5, gap_threshold_atr: 0.75, ema_distance_9: 1.5, ema_distance_20: 2.0 },
        signal_scoring: { signal_strength_min: 0.6, target_multiplier: 1.08 },
        entry_criteria: { max_results_per_day: 50, close_range_min: 0.7 }
      };

      setCurrentParameters(defaultParams);
      return "  Reset to default balanced configuration";
    },
  });

  // ────── Helper Functions ──────

  const translateUserRequest = async (request: string, params: ScanParameters): Promise<ParameterModification> => {
    // Call our backend Parameter Translation Engine
    const response = await fetch('/api/ai-agent/translate-parameters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_request: request,
        current_parameters: params
      })
    });

    if (!response.ok) {
      throw new Error('Failed to translate parameters');
    }

    return await response.json();
  };

  const runQuickBacktest = async (params: any): Promise<BacktestResult> => {
    // Call our Backtest Validation System
    const response = await fetch('/api/ai-agent/quick-backtest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parameters: params })
    });

    if (!response.ok) {
      throw new Error('Backtest validation failed');
    }

    return await response.json();
  };

  const applyParameterChanges = async (changes: Record<string, any>) => {
    // Apply changes to current parameters
    const newParams = { ...currentParameters };

    for (const [path, value] of Object.entries(changes)) {
      const keys = path.split('.');
      let current: any = newParams;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
    }

    setCurrentParameters(newParams);

    // Save to backend
    await fetch('/api/ai-agent/update-parameters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parameters: newParams })
    });
  };

  const handleApprovalConfirm = async () => {
    if (approvalModal.modification) {
      await applyParameterChanges(approvalModal.modification.changes);
      setApprovalModal({ modification: null, backtest: null, isOpen: false });
    }
  };

  const handleApprovalCancel = () => {
    setApprovalModal({ modification: null, backtest: null, isOpen: false });
  };

  // ────── Render Component ──────
  return (
    <div className="h-full flex flex-col space-y-6 p-6 studio-bg">
      {/* Renata Header */}
      <div className="studio-card-elevated border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-yellow-600/5 backdrop-blur-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/25 ring-2 ring-yellow-500/20">
            <span className="text-black font-bold text-sm">R</span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">Renata AI</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-500/50"></div>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Live Assistant</span>
            </div>
          </div>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">
          Hello! I'm Renata, your AI trading assistant. Tell me how you'd like to modify your trading scan.
          I can help you adjust parameters, change risk levels, focus on different market caps, and optimize performance.
        </p>
      </div>

      {/* Current Configuration Summary */}
      <div className="studio-card bg-gradient-to-br from-gray-900/80 to-gray-800/60 border border-yellow-500/10 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <Settings className="h-4 w-4 text-white" />
          </div>
          <h4 className="font-semibold text-white text-base">Current Configuration</h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="studio-metric-card bg-gray-800/60 border border-gray-700/50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Price Range</p>
            <p className="text-sm font-bold text-white">
              ${currentParameters.market_filters.price_min} - ${currentParameters.market_filters.price_max}
            </p>
          </div>
          <div className="studio-metric-card bg-gray-800/60 border border-gray-700/50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Signal Strength</p>
            <p className="text-sm font-bold text-white">
              {(currentParameters.signal_scoring.signal_strength_min * 100).toFixed(0)}% min
            </p>
          </div>
          <div className="studio-metric-card bg-gray-800/60 border border-gray-700/50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Volume Req</p>
            <p className="text-sm font-bold text-white">
              ${(currentParameters.market_filters.volume_min_usd / 1_000_000).toFixed(0)}M+
            </p>
          </div>
          <div className="studio-metric-card bg-gray-800/60 border border-gray-700/50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Max Signals/Day</p>
            <p className="text-sm font-bold text-white">
              {currentParameters.entry_criteria.max_results_per_day}
            </p>
          </div>
        </div>

        {/* Last Backtest Results */}
        {lastBacktest && (
          <div className="mt-6 p-4 bg-gradient-to-br from-gray-800/80 to-gray-700/60 rounded-xl border border-gray-600/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-semibold text-white flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-md flex items-center justify-center">
                  <BarChart3 className="h-3 w-3 text-white" />
                </div>
                Latest Validation
              </h5>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                lastBacktest.risk_assessment === 'Low risk'
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              }`}>
                {lastBacktest.risk_assessment}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <p className="text-xs text-gray-400 font-medium mb-1">Signals/Day</p>
                <p className="font-bold text-white text-sm">{lastBacktest.estimated_signals_per_day}</p>
              </div>
              <div className="text-center p-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <p className="text-xs text-gray-400 font-medium mb-1">Quality</p>
                <p className="font-bold text-white text-sm">{(lastBacktest.quality_score * 100).toFixed(0)}%</p>
              </div>
              <div className="text-center p-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <p className="text-xs text-gray-400 font-medium mb-1">Confidence</p>
                <p className="font-bold text-white text-sm">{(lastBacktest.validation_confidence * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Interface */}
      <div className="flex-1 studio-card-elevated bg-gradient-to-br from-gray-900/90 to-gray-800/80 border border-gray-600/50 min-h-[400px] backdrop-blur-sm">
        <CopilotChat
          instructions={`You are an expert trading scan builder assistant. Help users modify their trading scan parameters through natural conversation.

Current scan configuration:
- Price range: $${currentParameters.market_filters.price_min} - $${currentParameters.market_filters.price_max}
- Volume requirement: $${(currentParameters.market_filters.volume_min_usd / 1_000_000).toFixed(0)}M+
- Signal strength minimum: ${(currentParameters.signal_scoring.signal_strength_min * 100).toFixed(0)}%
- ATR multiple: ${currentParameters.momentum_triggers.atr_multiple}x
- Volume multiple: ${currentParameters.momentum_triggers.volume_multiple}x

I can help you:
- Make scans more/less aggressive
- Focus on different market caps (small, mid, large)
- Adjust risk levels (conservative, moderate, aggressive)
- Optimize for more/fewer signals
- Target specific sectors or conditions

Always explain the impact of parameter changes and run quick validation when making significant modifications.`}

          className="h-full min-h-[400px] rounded-xl bg-transparent border-0"
        />
      </div>

      {/* Backtest Progress */}
      {isBacktesting && (
        <div className="p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3 text-blue-300">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4 animate-spin text-white" />
            </div>
            <span className="text-sm font-medium">Running quick validation...</span>
            <div className="flex-1 bg-blue-800/50 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full w-2/3 animate-pulse shadow-lg shadow-blue-500/30"></div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {approvalModal.isOpen && approvalModal.modification && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">
          <div className="studio-card-elevated bg-gradient-to-br from-gray-900/95 to-gray-800/90 border border-gray-600/50 w-full max-w-2xl m-6 max-h-[90vh] overflow-y-auto backdrop-blur-xl">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Parameter Changes Require Approval
                </h3>
                <button
                  onClick={handleApprovalCancel}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Change Summary */}
              <div className="bg-blue-900 bg-opacity-30 p-4 rounded border border-blue-600">
                <h4 className="font-medium mb-2 text-white">Proposed Changes</h4>
                <p className="text-sm text-blue-100">{approvalModal.modification.explanation}</p>
              </div>

              {/* Impact Prediction */}
              <div className="bg-gray-900 p-4 rounded border border-gray-600">
                <h4 className="font-medium mb-2 text-white">Expected Impact</h4>
                <div className="space-y-1 text-sm text-gray-300">
                  <p>• {approvalModal.modification.estimated_impact.signal_count_change}</p>
                  <p>• {approvalModal.modification.estimated_impact.quality_impact}</p>
                </div>
              </div>

              {/* Backtest Results */}
              {approvalModal.backtest && (
                <div className={`p-4 rounded border ${
                  approvalModal.backtest.is_safe
                    ? 'bg-green-900 bg-opacity-30 border-green-600'
                    : 'bg-yellow-900 bg-opacity-30 border-yellow-600'
                }`}>
                  <h4 className="font-medium mb-2 text-white flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Quick Validation Results
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Est. Signals/Day</p>
                      <p className="font-medium text-white">{approvalModal.backtest.estimated_signals_per_day}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Quality Score</p>
                      <p className="font-medium text-white">{(approvalModal.backtest.quality_score * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                  <p className={`mt-2 text-sm font-medium ${
                    approvalModal.backtest.is_safe ? 'text-green-300' : 'text-yellow-300'
                  }`}>
                    {approvalModal.backtest.recommendation}
                  </p>
                </div>
              )}

              {/* Warnings */}
              {approvalModal.modification.warnings.length > 0 && (
                <div className="p-3 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded">
                  <div className="flex items-center gap-2 text-yellow-300">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">
                      <strong>Warnings:</strong> {approvalModal.modification.warnings.join('; ')}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleApprovalCancel}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                >
                  Cancel Changes
                </button>
                <button
                  onClick={handleApprovalConfirm}
                  className={`px-4 py-2 text-white text-sm rounded transition-colors flex items-center gap-2 ${
                    approvalModal.backtest?.is_safe
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}