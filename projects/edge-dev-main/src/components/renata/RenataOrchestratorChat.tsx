'use client'

/**
 * 🤖 RENATA V2 Orchestrator Chat Component
 *
 * Simple CopilotKit-integrated chat that connects to the RENATA V2 Python backend
 * Use this in your /scan, /backtest, and /plan pages
 */

import React, { useState, useRef, useEffect } from 'react';
import { useCopilotChat, useCopilotReadable } from '@copilotkit/react-core';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';

interface RenataOrchestratorChatProps {
  scannerCode?: string;
  scanResults?: any[];
  currentPlan?: any;
  backtestResults?: any;
  mode?: 'scan' | 'backtest' | 'plan';
}

export function RenataOrchestratorChat({
  scannerCode,
  scanResults = [],
  currentPlan,
  backtestResults,
  mode = 'scan'
}: RenataOrchestratorChatProps) {
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Make context available to RENATA
  useCopilotReadable({
    description: `Current Mode: ${mode}\nScanner Code: ${scannerCode ? 'Present' : 'None'}\nScan Results: ${scanResults.length} items\nPlan: ${currentPlan ? 'Present' : 'None'}\nBacktest Results: ${backtestResults ? 'Present' : 'None'}`,
    value: JSON.stringify({
      mode,
      scannerCode: scannerCode?.substring(0, 500), // First 500 chars
      scanResultsCount: scanResults.length,
      hasPlan: !!currentPlan,
      hasBacktest: !!backtestResults
    })
  });

  const {
    visibleMessages,
    appendMessage,
    setMessages,
    deleteMessage,
    isLoading: isCopilotLoading
  } = useCopilotChat();

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">RENATA V2 Orchestrator</h3>
            <p className="text-xs text-gray-400">
              {mode === 'scan' && 'Scanner Generation & Validation'}
              {mode === 'backtest' && 'Backtesting & Analysis'}
              {mode === 'plan' && 'Strategy Planning & Implementation'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-gray-400">13 Tools</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {visibleMessages.length === 0 && (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">Chat with RENATA V2</p>
              <div className="grid grid-cols-1 gap-2 text-sm max-w-md mx-auto">
                {mode === 'scan' && (
                  <>
                    <button
                      onClick={() => appendMessage({ role: 'user', content: 'Generate a D2 momentum scanner' })}
                      className="text-left px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Generate a D2 scanner
                    </button>
                    <button
                      onClick={() => appendMessage({ role: 'user', content: 'Validate this V31 scanner code' })}
                      className="text-left px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Validate scanner code
                    </button>
                    <button
                      onClick={() => appendMessage({ role: 'user', content: 'Optimize scanner parameters' })}
                      className="text-left px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Optimize parameters
                    </button>
                  </>
                )}
                {mode === 'backtest' && (
                  <>
                    <button
                      onClick={() => appendMessage({ role: 'user', content: 'Run quick backtest on last 30 days' })}
                      className="text-left px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Quick backtest (30 days)
                    </button>
                    <button
                      onClick={() => appendMessage({ role: 'user', content: 'Analyze backtest results' })}
                      className="text-left px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Analyze results
                    </button>
                    <button
                      onClick={() => appendMessage({ role: 'user', content: 'Generate backtest script' })}
                      className="text-left px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Generate backtest code
                    </button>
                  </>
                )}
                {mode === 'plan' && (
                  <>
                    <button
                      onClick={() => appendMessage({ role: 'user', content: 'Create implementation plan for momentum strategy' })}
                      className="text-left px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Plan momentum strategy
                    </button>
                    <button
                      onClick={() => appendMessage({ role: 'user', content: 'Create step-by-step roadmap' })}
                      className="text-left px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Create roadmap
                    </button>
                    <button
                      onClick={() => appendMessage({ role: 'user', content: 'Generate complete trading system' })}
                      className="text-left px-3 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Generate system
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {visibleMessages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100 border border-gray-700'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-300" />
                </div>
              )}
            </div>
          ))}

          {isCopilotLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input is handled by CopilotKit */}
    </div>
  );
}

// Export with CopilotKit wrapper
export function RenataOrchestratorChatWithCopilot(props: RenataOrchestratorChatProps) {
  return (
    <>
      <RenataOrchestratorChat {...props} />
    </>
  );
}
