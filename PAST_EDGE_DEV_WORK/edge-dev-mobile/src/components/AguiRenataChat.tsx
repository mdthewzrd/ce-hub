'use client'

/**
 * AG-UI Enhanced Renata Chat - Scanner & Backtesting Specialist
 * Adapted for Edge-dev scanning and backtesting optimization
 * Uses Traderra styling with specialized scanning/backtesting terminology
 */

import React, { useState, useEffect, useRef } from 'react'
import { Brain, Settings, AlertCircle, Sparkles, Send, RotateCcw } from 'lucide-react'

type RenataMode = 'renata' | 'analyst' | 'coach' | 'mentor'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'error'
  content: string
  timestamp: Date
}

const RENATA_MODES = [
  {
    id: 'renata' as RenataMode,
    name: 'Renata',
    description: 'Scanning & Backtesting specialist',
    color: 'text-purple-400',
    borderColor: 'border-purple-400/50',
  },
  {
    id: 'analyst' as RenataMode,
    name: 'Analyst',
    description: 'Scanner optimization expert',
    color: 'text-red-400',
    borderColor: 'border-red-400/50',
  },
  {
    id: 'coach' as RenataMode,
    name: 'Coach',
    description: 'Backtesting strategy guide',
    color: 'text-blue-400',
    borderColor: 'border-blue-400/50',
  },
  {
    id: 'mentor' as RenataMode,
    name: 'Mentor',
    description: 'Pattern recognition insights',
    color: 'text-green-400',
    borderColor: 'border-green-400/50',
  },
]

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function AguiRenataChat() {
  const [currentMode, setCurrentMode] = useState<RenataMode>('renata')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected')
  const [activityStatus, setActivityStatus] = useState<'idle' | 'thinking' | 'processing'>('idle')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Add initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        type: 'assistant',
        content: 'Hello! I\'m Renata, your AI scanning and backtesting specialist. I can help you optimize scanners, develop backtesting strategies, and analyze pattern performance. What scanning or backtesting challenge can I help you with today?',
        timestamp: new Date()
      }])
    }
  }, [messages.length])

  // Process actions from message content
  const processActions = async (messageContent: string): Promise<string> => {
    setActivityStatus('processing')
    const lowerMessage = messageContent.toLowerCase()
    const actions: string[] = []

    // Simple command processing
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      setActivityStatus('idle')
      return `I can help you with:
• Scanner optimization and parameter tuning
• Backtesting strategy development
• Pattern recognition and analysis
• LC scanner configuration
• Performance metrics analysis
• Risk-reward optimization
• Scanner result interpretation
• Strategy validation and testing

Just ask me anything about scanner optimization or backtesting strategies!`
    }

    if (lowerMessage.includes('scanner') || lowerMessage.includes('scan')) {
      actions.push('📊 Scanner optimization mode activated')
    }

    if (lowerMessage.includes('backtest') || lowerMessage.includes('backtesting')) {
      actions.push('📈 Backtesting analysis mode enabled')
    }

    if (lowerMessage.includes('pattern') || lowerMessage.includes('lc')) {
      actions.push('🔍 Pattern recognition mode engaged')
    }

    if (lowerMessage.includes('optimize') || lowerMessage.includes('improve')) {
      actions.push('⚡ Performance optimization mode engaged')
    }

    if (lowerMessage.includes('parameter') || lowerMessage.includes('setting')) {
      actions.push('🛠️ Parameter tuning mode activated')
    }

    // Generate response
    if (actions.length > 0) {
      const actionSummary = actions.join('\n')
      setActivityStatus('idle')
      return `${actionSummary}\n\nI'm ready to help! What specific aspect would you like to focus on?`
    }

    // Default conversational response
    setActivityStatus('idle')
    return `I understand you said: "${messageContent}". I'm here to help with trading analysis and insights. Could you be more specific about what you'd like to explore?`
  }

  // Send message function
  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return

    const messageContent = message.trim()

    // Add user message
    const newUserMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newUserMessage])
    setMessage('')
    setIsLoading(true)
    setActivityStatus('thinking')

    try {
      // Process actions
      const actionResponse = await processActions(messageContent)

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        type: 'assistant',
        content: actionResponse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Failed to process message:', error)
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'error',
        content: 'Sorry, I encountered an error while processing your request.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Handle chat reset
  const handleResetChat = () => {
    setMessages([{
      id: 'reset',
      type: 'assistant',
      content: '🔄 Chat reset successfully! How can I help you today?',
      timestamp: new Date()
    }])
    setMessage('')
    setIsLoading(false)
    setActivityStatus('idle')
    setConnectionStatus('connected')
  }

  const currentModeInfo = RENATA_MODES.find(mode => mode.id === currentMode) || RENATA_MODES[0]

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: 'var(--studio-surface)' }}>
      {/* Fixed Header */}
      <div className="flex-shrink-0 flex items-center justify-between border-b p-4"
           style={{
             borderColor: 'var(--studio-border)',
             backgroundColor: 'var(--studio-surface)'
           }}>
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
            <Brain className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--studio-text)' }}>Renata AI</h3>
            <p className="text-xs" style={{ color: 'var(--studio-muted)' }}>Trading Assistant</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center space-x-2">
          <select
            value={currentMode}
            onChange={(e) => setCurrentMode(e.target.value as RenataMode)}
            className="rounded border px-3 py-1 text-sm"
            style={{
              borderColor: 'var(--studio-border)',
              backgroundColor: 'var(--studio-surface)',
              color: 'var(--studio-text)'
            }}
          >
            {RENATA_MODES.map(mode => (
              <option key={mode.id} value={mode.id}>
                {mode.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fixed Status Bar */}
      <div className="flex-shrink-0 border-b p-2"
           style={{
             borderColor: 'var(--studio-border)',
             backgroundColor: 'rgba(17, 17, 17, 0.3)'
           }}>
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--studio-muted)' }}>
          <div className="flex items-center space-x-4">
            <span className={cn("flex items-center space-x-1", currentModeInfo.color)}>
              <Sparkles className="h-3 w-3" />
              <span>{currentModeInfo.name} Mode</span>
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className={cn(
              "flex items-center space-x-1",
              connectionStatus === 'connected' ? 'text-green-400' :
              connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'
            )}>
              <div className={cn(
                "h-2 w-2 rounded-full",
                connectionStatus === 'connected' ? 'bg-green-400' :
                connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
              )}></div>
              <span className="capitalize">{connectionStatus}</span>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleResetChat}
              className="p-1 rounded-md bg-gray-700/50 hover:bg-gray-600/50 transition-colors cursor-pointer"
              title="Reset chat (clears errors and starts fresh)"
            >
              <RotateCcw className="h-3 w-3 text-gray-400 hover:text-gray-200" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--studio-muted)' }}>
            <Brain className="h-12 w-12 mx-auto mb-4 text-purple-400" />
            <p className="text-sm">Ask me anything about trading, scanning, or market analysis...</p>
            <p className="text-xs mt-2">Try: "Help me optimize my scanner" • "Analyze this chart pattern" • "What are good risk management practices?"</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex w-full",
                msg.type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                  msg.type === 'user'
                    ? 'border'
                    : msg.type === 'error'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'border'
                )}
                style={{
                  backgroundColor: msg.type === 'user' ? 'var(--primary)' : 'var(--studio-surface)',
                  color: msg.type === 'user' ? '#000000' : 'var(--studio-text)',
                  borderColor: msg.type === 'error' ? undefined : 'var(--studio-border)'
                }}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className="text-xs mt-1 opacity-70"
                     style={{
                       color: msg.type === 'user' ? 'rgba(0, 0, 0, 0.7)' : 'var(--studio-muted)'
                     }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="border rounded-lg px-4 py-2 text-sm"
                 style={{
                   backgroundColor: 'var(--studio-surface)',
                   borderColor: 'var(--studio-border)'
                 }}>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--studio-muted)' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--studio-muted)', animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--studio-muted)', animationDelay: '0.2s' }}></div>
                </div>
                <span style={{ color: 'var(--studio-muted)' }}>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Input Area */}
      <div className="flex-shrink-0 border-t p-4"
           style={{
             borderColor: 'var(--studio-border)',
             backgroundColor: 'var(--studio-surface)'
           }}>
        <div className="space-y-2">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="w-full h-16 resize-none rounded-lg border p-3 pr-12 transition-all disabled:opacity-50 focus:ring-2 focus:ring-opacity-20"
              style={{
                backgroundColor: 'var(--studio-surface)',
                borderColor: 'var(--studio-border)',
                color: 'var(--studio-text)',
              } as React.CSSProperties}
              placeholder="Ask me about trading, scanning, or market analysis..."
            />

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="absolute bottom-2 right-2 h-8 w-8 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--primary)',
                color: '#000000',
              } as React.CSSProperties}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          {/* Helper Text */}
          <div className="text-xs text-center" style={{ color: 'var(--studio-muted)' }}>
            <div>Try: "Help me optimize my scanner" • "Analyze this pattern" • "Risk management tips"</div>
            <div className="mt-1">Press <kbd className="px-1 py-0.5 text-xs rounded" style={{ backgroundColor: 'var(--studio-surface)' }}>Enter</kbd> to send • <kbd className="px-1 py-0.5 text-xs rounded" style={{ backgroundColor: 'var(--studio-surface)' }}>Shift + Enter</kbd> for new line</div>
          </div>
        </div>
      </div>
    </div>
  )
}