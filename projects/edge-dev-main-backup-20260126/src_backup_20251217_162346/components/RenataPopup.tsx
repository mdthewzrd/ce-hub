'use client'

/**
 * Renata AI Popup Component with CopilotKit Integration
 * Slides out from the sidebar as a collapsible popup window
 * Now properly integrated with CopilotKit for AI functionality
 */

import React, { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle, Brain, X, ChevronUp, ChevronDown, Upload, Paperclip, TrendingUp, BarChart3, Zap, Search, Bell, Activity, Code, ChevronDown as ExpandIcon, ChevronUp as CollapseIcon } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

// Collapsible Code Block Component
interface CollapsibleCodeBlockProps {
  children: React.ReactNode
  className?: string
}

const CollapsibleCodeBlock: React.FC<CollapsibleCodeBlockProps> = ({ children, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Convert children to string to analyze content
  const content = React.Children.toArray(children).join('')
  const lines = content.split('\n').filter(line => line.trim() !== '')

  // If it's a short code block (less than 8 lines), don't make it collapsible
  if (lines.length < 8) {
    return (
      <pre className={className} style={{
        backgroundColor: 'rgba(0,0,0,0.4)',
        color: '#FFD700',
        padding: '1rem',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        overflow: 'auto',
        maxWidth: '100%',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        whiteSpace: 'pre-wrap',
        border: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        {children}
      </pre>
    )
  }

  const previewLines = lines.slice(0, 5)
  const remainingLines = lines.length - previewLines.length

  return (
    <div style={{
      backgroundColor: 'rgba(0,0,0,0.4)',
      borderRadius: '0.5rem',
      border: '1px solid rgba(255, 215, 0, 0.2)',
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      {/* Header with info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderBottom: isExpanded ? '1px solid rgba(255, 215, 0, 0.2)' : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Code size={16} style={{ color: '#FFD700' }} />
          <span style={{
            color: '#FFD700',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            Code Block ({lines.length} lines)
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.25rem 0.75rem',
            backgroundColor: 'rgba(255, 215, 0, 0.2)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '0.25rem',
            color: '#FFD700',
            fontSize: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 215, 0, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 215, 0, 0.2)'
          }}
        >
          {isExpanded ? (
            <>
              <CollapseIcon size={12} />
              Show Less
            </>
          ) : (
            <>
              <ExpandIcon size={12} />
              Show {remainingLines} More Lines
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div style={{
        padding: '1rem',
        fontSize: '0.875rem',
        color: '#FFD700',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        whiteSpace: 'pre-wrap',
        overflow: isExpanded ? 'auto' : 'hidden',
        maxHeight: isExpanded ? 'none' : '120px'
      }}>
        {isExpanded ? children : previewLines.join('\n')}
      </div>

      {!isExpanded && remainingLines > 0 && (
        <div style={{
          padding: '0.5rem 1rem',
          background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.4))',
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 215, 0, 0.1)'
        }}>
          <span style={{
            color: 'rgba(255, 215, 0, 0.6)',
            fontSize: '0.75rem'
          }}>
            {remainingLines} more lines hidden
          </span>
        </div>
      )}
    </div>
  )
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  file?: {
    name: string
    content: string
    size: number
    type: string
  }
}

interface RenataPopupProps {
  isOpen: boolean
  onToggle: () => void
}

const RenataPopup: React.FC<RenataPopupProps> = ({ isOpen, onToggle }) => {
  console.log('RenataPopup render - isOpen:', isOpen);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "**Renata - CE Hub Powered**\n\nHello! I'm Renata, powered by CE Hub's structured workflow system.\n\n**How I Can Help:**\n• **Build scanners** using Research → Plan → Iterate → Validate\n• **Develop strategies** with systematic approach\n• **Optimize parameters** through structured process\n• **Create indicators** with step-by-step workflow\n• **Format code** with advanced processing\n\n**Try These:**\n• \"Build a momentum scanner using workflow\"\n• \"Create a trading strategy step by step\"\n• \"Design a technical indicator\"\n• Upload your Python code for formatting\n\nJust describe what you want to build, or upload your code!",
      type: 'assistant',
      timestamp: new Date()
    }
  ])

  const [currentInput, setCurrentInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const handleSendMessage = async () => {
    if (!currentInput.trim() && attachedFiles.length === 0) return

    const messageContent = currentInput.trim()
    let fileContent = ''

    // Process attached files
    if (attachedFiles.length > 0) {
      for (const file of attachedFiles) {
        const content = await file.text()
        fileContent += `\n\n--- File: ${file.name} ---\n${content}`
      }
    }

    const fullMessage = messageContent + fileContent

    // Add user message
    addMessage({
      type: 'user',
      content: messageContent || `Uploaded ${attachedFiles.length} file(s)`,
      file: attachedFiles.length > 0 ? {
        name: attachedFiles[0].name,
        content: fileContent,
        size: attachedFiles[0].size,
        type: attachedFiles[0].type
      } : undefined
    })

    setCurrentInput('')
    setAttachedFiles([])
    setIsLoading(true)

    try {
      const response = await fetch('/api/renata/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: fullMessage,
          personality: 'general',
          context: {
            page: 'renata-popup',
            timestamp: new Date().toISOString()
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        addMessage({
          type: 'assistant',
          content: data.message || 'I processed your request successfully.'
        })
      } else {
        addMessage({
          type: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.'
        })
      }
    } catch (error) {
      console.error('Chat API error:', error)
      addMessage({
        type: 'assistant',
        content: 'Connection error. Please check your internet connection and try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      handleFiles(files)
    }
  }

  const handleFiles = (files: File[]) => {
    const codeFiles = files.filter(file =>
      file.name.endsWith('.py') ||
      file.name.endsWith('.js') ||
      file.name.endsWith('.ts') ||
      file.name.endsWith('.tsx') ||
      file.type.includes('text')
    )

    setAttachedFiles(prev => [...prev, ...codeFiles])
  }

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (!isOpen) {
    return null // Don't render the floating circular button
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '1.5rem',
        width: '26rem',
        height: '40rem',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        borderRadius: '1rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 15px rgba(255, 215, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
        border: '1px solid rgba(255, 215, 0, 0.3)',
        overflow: 'hidden',
        padding: '0.5rem'
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid rgba(255, 215, 0, 0.3)',
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%)',
          margin: '0.5rem',
          borderRadius: '0.75rem'
        }}
        className="flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center space-x-2">
          <div
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              boxShadow: '0 0 10px rgba(255, 215, 0, 0.3)'
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center"
          >
            <Brain className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="font-bold text-yellow-400 text-lg" style={{ margin: 0, padding: 0 }}>Renata AI</h3>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setMessages([messages[0]]) // Keep only welcome message
              setAttachedFiles([])
            }}
            style={{
              backgroundColor: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}
            className="p-2 rounded-lg transition-all hover:bg-yellow-500 hover:bg-opacity-20"
            title="Clear chat"
          >
            <X className="w-4 h-4 text-yellow-400" />
          </button>
          <button
            onClick={onToggle}
            style={{
              backgroundColor: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}
            className="p-2 rounded-lg transition-all hover:bg-yellow-500 hover:bg-opacity-20"
          >
            <ChevronDown className="w-5 h-5 text-yellow-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          padding: '1.25rem'
        }}
        className="flex-1 overflow-y-auto space-y-4"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-6`}
            style={{marginBottom: '2rem'}}
          >
            <div
              style={{
                background: message.type === 'user'
                  ? 'rgba(184, 148, 31, 0.9)'
                  : 'rgba(255, 215, 0, 0.1)',
                backdropFilter: 'blur(8px)',
                border: message.type === 'user'
                  ? '1px solid rgba(212, 175, 55, 0.6)'
                  : '1px solid rgba(255, 215, 0, 0.3)',
                maxWidth: '80%',
                wordBreak: 'break-word',
                borderRadius: '12px',
                boxShadow: message.type === 'user'
                  ? '0 4px 6px -1px rgba(184, 148, 31, 0.4), 0 2px 4px -1px rgba(184, 148, 31, 0.3)'
                  : '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              className="px-8 py-5"
            >
              <div
                style={{
                  color: message.type === 'user' ? '#FFFFFF' : '#FFD700',
                  fontWeight: message.type === 'assistant' ? '500' : 'normal',
                  fontSize: '0.875rem',
                  lineHeight: '1.6',
                  padding: '0.5rem 1rem'
                }}
              >
                {message.type === 'assistant' ? (
                  <ReactMarkdown
                    components={{
                      strong: ({children}) => <strong style={{fontWeight: 'bold', color: '#FFA500'}}>{children}</strong>,
                      em: ({children}) => <em style={{fontStyle: 'italic', color: '#FFD700'}}>{children}</em>,
                      u: ({children}) => <u style={{textDecoration: 'underline', color: '#FFD700'}}>{children}</u>,
                      p: ({children}) => <p style={{margin: '0 0 0.75rem 0', color: '#FFD700', lineHeight: '1.6', wordBreak: 'break-word', overflowWrap: 'break-word'}}>{children}</p>,
                      ul: ({children}) => <ul style={{margin: '0.75rem 0', paddingLeft: '1.5rem', color: '#FFD700'}}>{children}</ul>,
                      ol: ({children}) => <ol style={{margin: '0.75rem 0', paddingLeft: '1.5rem', color: '#FFD700'}}>{children}</ol>,
                      li: ({children}) => <li style={{margin: '0.5rem 0', color: '#FFD700', lineHeight: '1.5'}}>{children}</li>,
                      h1: ({children}) => <h1 style={{fontSize: '1.25rem', fontWeight: 'bold', margin: '1rem 0', color: '#FFA500'}}>{children}</h1>,
                      h2: ({children}) => <h2 style={{fontSize: '1.125rem', fontWeight: 'bold', margin: '0.875rem 0', color: '#FFA500'}}>{children}</h2>,
                      h3: ({children}) => <h3 style={{fontSize: '1rem', fontWeight: 'bold', margin: '0.75rem 0', color: '#FFA500'}}>{children}</h3>,
                      code: ({children}) => <code style={{
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        color: '#FFD700',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        display: 'inline-block',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%'
                      }}>{children}</code>,
                      pre: ({children}) => <CollapsibleCodeBlock>{children}</CollapsibleCodeBlock>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <div>
                    <div className="whitespace-pre-wrap" style={{padding: '0.25rem 0', lineHeight: '1.6'}}>{message.content}</div>
                    {message.file && (
                      <div
                        style={{
                          marginTop: '0.75rem',
                          padding: '0.75rem 1rem',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem'
                        }}
                      >
                        <Paperclip
                          size={16}
                          style={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            flexShrink: 0
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              color: '#FFFFFF',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              marginBottom: '0.25rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {message.file.name}
                          </div>
                          <div
                            style={{
                              color: 'rgba(255, 255, 255, 0.6)',
                              fontSize: '0.75rem'
                            }}
                          >
                            {(message.file.size / 1024).toFixed(1)} KB • {message.file.type || 'text/plain'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <span
                style={{
                  color: message.type === 'user' ? '#666666' : '#333333',
                  opacity: 0.7,
                  fontSize: '0.75rem'
                }}
                className="mt-2 block text-right"
              >
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div
              style={{
                background: 'rgba(255, 215, 0, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              className="px-6 py-4 max-w-[80%]"
            >
              <div className="flex items-center space-x-3">
                {/* Renata Brain Icon with pulse animation */}
                <div
                  style={{
                    color: '#FFD700',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }}
                  className="flex-shrink-0"
                >
                  <Brain className="w-5 h-5" />
                </div>

                {/* Typing animation text */}
                <div className="flex items-center space-x-1">
                  <span
                    style={{
                      color: '#FFD700',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    Renata is thinking
                  </span>

                  {/* Animated dots */}
                  <div className="flex space-x-1 ml-2">
                    <div
                      style={{
                        backgroundColor: '#FFD700',
                        animationDelay: '0s'
                      }}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                    ></div>
                    <div
                      style={{
                        backgroundColor: '#FFD700',
                        animationDelay: '0.2s'
                      }}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                    ></div>
                    <div
                      style={{
                        backgroundColor: '#FFD700',
                        animationDelay: '0.4s'
                      }}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File Attachments */}
      {attachedFiles.length > 0 && (
        <div
          style={{
            borderTop: '1px solid rgba(255, 215, 0, 0.3)',
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.05) 0%, rgba(255, 165, 0, 0.05) 100%)'
          }}
          className="px-4 py-2"
        >
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  boxShadow: '0 2px 8px rgba(255, 215, 0, 0.2)'
                }}
                className="flex items-center space-x-2 px-2 py-1 rounded-lg text-xs"
              >
                <Paperclip className="w-3 h-3 text-yellow-400" />
                <span className="text-yellow-200 truncate max-w-[150px]">
                  {file.name}
                </span>
                <span className="text-yellow-400">
                  ({formatFileSize(file.size)})
                </span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 215, 0, 0.3)',
          background: isDragOver
            ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%)'
            : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          position: 'relative',
          padding: '1rem'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="Ask me anything about trading scanners, or upload code..."
              style={{
                backgroundColor: 'rgba(42, 42, 42, 0.6)',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                color: '#FFD700',
                fontSize: '0.875rem',
                fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                paddingTop: '1rem',
                paddingBottom: '1rem',
                paddingLeft: '1.5rem',
                paddingRight: '1.5rem',
                overflow: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
                borderRadius: '1rem',
                outline: 'none'
              }}
              className="w-full resize-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent placeholder-yellow-600"
              rows={3}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
          </div>
          <div className="flex items-center space-x-3" style={{ alignItems: 'center', alignSelf: 'center' }}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".py,.js,.ts,.tsx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.15) 100%)',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                boxShadow: '0 1px 6px rgba(0, 0, 0, 0.2)',
                width: '44px',
                height: '44px'
              }}
              className="flex items-center justify-center text-yellow-400 hover:text-yellow-300 rounded-lg transition-all hover:bg-yellow-500 hover:bg-opacity-20"
              title="Attach files"
            >
              <Paperclip className="w-4 h-4" style={{ color: '#FFD700' }} />
            </button>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || (!currentInput.trim() && attachedFiles.length === 0)}
              style={{
                background: isLoading || (!currentInput.trim() && attachedFiles.length === 0)
                  ? 'linear-gradient(135deg, #4a4a4a 0%, #2d2d2d 100%)'
                  : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                boxShadow: isLoading || (!currentInput.trim() && attachedFiles.length === 0)
                  ? '0 1px 6px rgba(0, 0, 0, 0.2)'
                  : '0 2px 12px rgba(255, 215, 0, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                width: '44px',
                height: '44px'
              }}
              className="flex items-center justify-center text-black font-semibold rounded-lg transition-all hover:shadow-lg disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-yellow-500 rounded-lg"
               style={{
                 background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%)'
               }}
          >
            <div className="text-center">
              <Upload className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-yellow-300 font-medium">Drop files here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RenataPopup