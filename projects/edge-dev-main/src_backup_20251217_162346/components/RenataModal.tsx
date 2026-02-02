'use client'

/**
 * Renata AI Modal Component
 * Opens in a modal overlay for better space utilization
 */

import React, { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle, Brain, X, Maximize2, Minimize2 } from 'lucide-react'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface RenataModalProps {
  isOpen: boolean
  onClose: () => void
}

const RenataModal: React.FC<RenataModalProps> = ({ isOpen, onClose }) => {
  // Debug logging
  React.useEffect(() => {
    console.log('🎯 RenataModal: isOpen changed to:', isOpen);
  }, [isOpen]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hi! I'm Renata, your AI trading assistant. I can help you analyze scan results, optimize scanner parameters, troubleshoot trading strategies, and provide market insights. How can I assist you today?",
      type: 'assistant',
      timestamp: new Date()
    }
  ])

  const [currentInput, setCurrentInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!currentInput.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: currentInput.trim(),
      type: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/renata/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          personality: 'general',
          context: {
            page: 'main_dashboard_modal',
            timestamp: new Date().toISOString(),
            mode: 'modal'
          }
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.message || 'I apologize, but I encountered an issue processing your request.',
        type: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('API unavailable, using fallback response:', error)

      // Fallback response system when API is unavailable
      const lowerMessage = userMessage.content.toLowerCase()
      let fallbackResponse = ''

      if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        fallbackResponse = "Hello! I'm Renata, your AI trading assistant. I can help you analyze scan results, optimize scanner parameters, and provide market insights. What would you like to know?"
      } else if (lowerMessage.includes('scanner') || lowerMessage.includes('scan')) {
        fallbackResponse = "I can help you with scanner analysis and optimization! I can analyze your scan results, suggest parameter improvements, and help troubleshoot any scanner issues you're experiencing. What specific scanner would you like help with?"
      } else if (lowerMessage.includes('optimize') || lowerMessage.includes('improve')) {
        fallbackResponse = "For scanner optimization, I can help you:\n• Analyze current parameter performance\n• Suggest improvements based on market conditions\n• Identify potential parameter contamination issues\n• Provide optimization strategies\n\nWhat would you like me to optimize?"
      } else if (lowerMessage.includes('analyz') || lowerMessage.includes('results')) {
        fallbackResponse = "I'd be happy to help analyze your scan results! I can:\n• Identify high-probability trading opportunities\n• Explain pattern formations\n• Provide risk management insights\n• Suggest entry/exit strategies\n\nPlease share what you'd like me to analyze."
      } else if (lowerMessage.includes('strategy') || lowerMessage.includes('trading')) {
        fallbackResponse = "I can assist with trading strategy development and analysis! My expertise includes:\n• Pattern recognition and analysis\n• Risk management optimization\n• Market timing strategies\n• Multi-timeframe analysis\n\nWhat trading strategy would you like to explore?"
      } else {
        fallbackResponse = "I understand you're looking for assistance with trading analysis. I can help you with:\n• Scanner optimization and analysis\n• Pattern recognition\n• Risk management\n• Strategy development\n• Market insights\n\nWhat specific area would you like help with?"
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: fallbackResponse,
        type: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    }

    setIsLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, index) => {
      const trimmedLine = line.trim()

      if (!trimmedLine) {
        return <br key={index} />
      }

      // Bold formatting
      if (trimmedLine.includes('**')) {
        const parts = trimmedLine.split(/(\*\*[^*]+\*\*)/)
        return (
          <div key={index} className="mb-2">
            {parts.map((part, partIndex) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <span key={partIndex} className="font-semibold text-studio-gold">
                    {part.slice(2, -2)}
                  </span>
                )
              }
              return <span key={partIndex}>{part}</span>
            })}
          </div>
        )
      }

      // Bullet points
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
        return (
          <div key={index} className="flex items-start gap-2 mb-2 ml-4">
            <span className="text-studio-gold text-sm mt-1">•</span>
            <span className="flex-1">{trimmedLine.replace(/^[•\-]\s*/, '')}</span>
          </div>
        )
      }

      // Numbered lists
      if (/^\d+\.\s/.test(trimmedLine)) {
        return (
          <div key={index} className="flex items-start gap-2 mb-2">
            <span className="text-studio-gold font-semibold">
              {trimmedLine.match(/^\d+\./)?.[0]}
            </span>
            <span className="flex-1">{trimmedLine.replace(/^\d+\.\s*/, '')}</span>
          </div>
        )
      }

      // Emoji headers
      if (/^[🔧📄🚀📁📊 📅🤖 💡 📈📉 🎲]/u.test(trimmedLine)) {
        return (
          <div key={index} className="font-semibold text-studio-gold mb-3 mt-4 text-lg border-b border-studio-border/30 pb-2">
            {trimmedLine}
          </div>
        )
      }

      // Section headers
      if (trimmedLine.startsWith('###')) {
        return (
          <div key={index} className="font-semibold text-studio-gold mb-2 mt-3 text-base">
            {trimmedLine.replace(/^###\s*/, '')}
          </div>
        )
      }

      return (
        <div key={index} className="mb-2 leading-relaxed">
          {trimmedLine}
        </div>
      )
    })
  }

  if (!isOpen) {
    console.log('🎯 RenataModal: Returning null (isOpen is false)');
    return null;
  }

  console.log('🎯 RenataModal: Rendering modal (isOpen is true)');
  const modalSize = isMaximized ? 'w-[95vw] h-[90vh]' : 'w-[800px] h-[600px]'

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div
        className={`bg-studio-surface border border-studio-border rounded-xl shadow-2xl flex flex-col transition-all duration-300 ${modalSize}`}
        style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-studio-border bg-studio-bg rounded-t-xl">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, rgba(212, 175, 55, 0.8) 100%)',
                boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'
              }}
            >
              <Brain className="h-5 w-5 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-studio-gold">Renata AI</h2>
              <p className="text-sm text-studio-muted">Trading Assistant</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">Online</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 hover:bg-studio-border/20 rounded-lg transition-colors"
            >
              {isMaximized ? (
                <Minimize2 className="h-4 w-4 text-studio-muted" />
              ) : (
                <Maximize2 className="h-4 w-4 text-studio-muted" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-studio-border/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-studio-muted" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-4 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className="flex-shrink-0 mt-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      backgroundColor: message.type === 'user' ? '#D4AF37' : '#3b82f6',
                      color: message.type === 'user' ? '#000' : '#fff'
                    }}
                  >
                    {message.type === 'user' ? 'U' : 'R'}
                  </div>
                </div>

                {/* Message Bubble */}
                <div
                  className="rounded-xl px-4 py-3 text-sm max-w-full"
                  style={{
                    backgroundColor: message.type === 'user' ? '#D4AF37' : '#1a1a1a',
                    color: message.type === 'user' ? '#000' : '#e5e5e5',
                    border: message.type === 'user' ? 'none' : '1px solid #333'
                  }}
                >
                  <div className="leading-relaxed">
                    {formatMessage(message.content)}
                  </div>
                  <div className={`text-xs mt-3 opacity-60 ${message.type === 'user' ? 'text-black/60' : 'text-studio-muted'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-4 max-w-[85%]">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold text-white">
                    R
                  </div>
                </div>
                <div className="rounded-xl px-4 py-3 bg-studio-surface border border-studio-border">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-studio-gold rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-studio-gold rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-studio-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-studio-text ml-2">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 p-6 border-t border-studio-border bg-studio-bg rounded-b-xl">
          <div className="flex gap-4">
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about scanners, patterns, strategy optimization, or trading analysis..."
              disabled={isLoading}
              rows={3}
              className="flex-1 bg-studio-surface border border-studio-border rounded-lg px-4 py-3 text-sm text-studio-text placeholder:text-studio-muted focus:outline-none focus:ring-2 focus:ring-studio-gold focus:border-transparent resize-none"
            />
            <button
              onClick={sendMessage}
              disabled={!currentInput.trim() || isLoading}
              className="bg-studio-gold text-black px-6 py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
          <div className="mt-3 text-xs text-studio-muted">
            Press Enter to send • Shift + Enter for new line • Esc to close
          </div>
        </div>
      </div>
    </div>
  )
}

export default RenataModal