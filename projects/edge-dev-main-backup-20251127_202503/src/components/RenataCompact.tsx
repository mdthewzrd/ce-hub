'use client'

/**
 * Compact Renata Chat Component for Sidebar
 * Optimized for small space with essential functionality
 */

import React, { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle, Brain, Sparkles } from 'lucide-react'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const RenataCompact: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hi! I'm Renata, your AI trading assistant. Ask me about scanners, patterns, or strategy optimization.",
      type: 'assistant',
      timestamp: new Date()
    }
  ])

  const [currentInput, setCurrentInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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
            page: 'main_dashboard_sidebar',
            timestamp: new Date().toISOString(),
            mode: 'compact'
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
      console.error('Renata API error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting. Please try again in a moment.",
        type: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }

    setIsLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatMessage = (content: string) => {
    // Simple markdown formatting for compact display
    return content.split('\n').map((line, index) => {
      const trimmedLine = line.trim()

      if (!trimmedLine) {
        return <br key={index} />
      }

      // Bold formatting
      if (trimmedLine.includes('**')) {
        const parts = trimmedLine.split(/(\*\*[^*]+\*\*)/)
        return (
          <div key={index} className="mb-1">
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
          <div key={index} className="flex items-start gap-1 mb-1 ml-2">
            <span className="text-studio-gold text-xs mt-1">•</span>
            <span className="flex-1">{trimmedLine.replace(/^[•\-]\s*/, '')}</span>
          </div>
        )
      }

      // Emoji headers
      if (/^[🔧📄🚀📁📊 📅🤖 💡 📈📉 ]/u.test(trimmedLine)) {
        return (
          <div key={index} className="font-medium text-studio-gold mb-2 mt-2 text-sm border-b border-studio-border/20 pb-1">
            {trimmedLine}
          </div>
        )
      }

      return (
        <div key={index} className="mb-1">
          {trimmedLine}
        </div>
      )
    })
  }

  return (
    <div
      className="flex flex-col bg-studio-bg border border-studio-border rounded-lg overflow-hidden"
      style={{ height: '300px' }}
    >
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-2 max-w-[90%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
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
                className="rounded-lg px-3 py-2 text-xs"
                style={{
                  backgroundColor: message.type === 'user' ? '#D4AF37' : '#1a1a1a',
                  color: message.type === 'user' ? '#000' : '#e5e5e5',
                  border: message.type === 'user' ? 'none' : '1px solid #333'
                }}
              >
                <div className="leading-relaxed">
                  {formatMessage(message.content)}
                </div>
                <div className={`text-xs mt-1 opacity-60 ${message.type === 'user' ? 'text-black/60' : 'text-studio-muted'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[90%]">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                  R
                </div>
              </div>
              <div className="rounded-lg px-3 py-2 bg-studio-surface border border-studio-border">
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-studio-gold rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-studio-gold rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-studio-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-studio-text ml-2">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-2 border-t border-studio-border bg-studio-surface/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about scanners..."
            disabled={isLoading}
            className="flex-1 bg-studio-bg border border-studio-border rounded px-2 py-1 text-xs text-studio-text placeholder:text-studio-muted focus:outline-none focus:ring-1 focus:ring-studio-gold focus:border-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={!currentInput.trim() || isLoading}
            className="bg-studio-gold text-black px-2 py-1 rounded text-xs font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Send className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default RenataCompact