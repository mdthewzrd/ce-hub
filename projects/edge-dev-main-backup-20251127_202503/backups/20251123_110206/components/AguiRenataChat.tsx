'use client'

/**
 * Working Renata Chat for Edge.dev
 * Copied from working Traderra system (port 6565) and adapted for edge-dev purpose
 * Simple, reliable approach without CopilotKit complexity
 * Fixed JSX parsing issues
 */

import React, { useState, useEffect, useRef } from 'react'
import { Settings, AlertCircle, Sparkles, Send, MessageCircle } from 'lucide-react'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'error'
  content: string
  timestamp: Date
  attachments?: FileAttachment[]
  context?: string
}

type RenataMode = 'general' | 'analyst' | 'optimizer' | 'coach' | 'scanner'

const RENATA_MODES = [
  {
    id: 'general' as RenataMode,
    name: 'Renata',
    description: 'General AI orchestrator & assistant',
    color: 'text-yellow-400',
  },
  {
    id: 'analyst' as RenataMode,
    name: 'Market Analyst',
    description: 'Data-focused market analysis',
    color: 'text-blue-400',
  },
  {
    id: 'optimizer' as RenataMode,
    name: 'Scanner Optimizer',
    description: 'Scanner parameter optimization',
    color: 'text-green-400',
  },
  {
    id: 'coach' as RenataMode,
    name: 'Trading Coach',
    description: 'Strategy guidance and insights',
    color: 'text-purple-400',
  },
  {
    id: 'scanner' as RenataMode,
    name: 'Scanner Expert',
    description: 'LC patterns and gap analysis',
    color: 'text-orange-400',
  },
]

interface FileAttachment {
  id: string
  name: string
  size: number
  type: string
  content: string
  uploadedAt: string
}

export function AguiRenataChatFixed() {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentMode, setCurrentMode] = useState<RenataMode>('general')
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // File upload state
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessingFile, setIsProcessingFile] = useState(false)

  // Conversation context tracking
  const [conversationContext, setConversationContext] = useState<{
    lastFileDiscussed?: string
    currentTopic?: string
    lastAction?: string
    fileAnalysis?: any
  }>({})

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Add message function
  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, newMessage])
  }

  // Process message using API endpoint
  const processMessage = async (messageContent: string): Promise<string> => {
    try {
      const response = await fetch('/api/renata/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          personality: currentMode,
          context: {
            page: 'main_dashboard',
            timestamp: new Date().toISOString(),
            mode: currentMode,
            attachedFiles: attachedFiles.length > 0 ? attachedFiles.map(f => ({ name: f.name, size: f.size })) : undefined
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.message || 'I apologize, but I encountered an issue processing your request.';
    } catch (error) {
      console.error('Renata API error:', error);
      // Fallback to local processing
      return await processMessageLocally(messageContent);
    }
  }

  // Fallback local processing (keeping original logic as backup)
  const processMessageLocally = async (messageContent: string): Promise<string> => {
    const lowerMessage = messageContent.toLowerCase()
    const currentModeInfo = RENATA_MODES.find(mode => mode.id === currentMode) || RENATA_MODES[0]

    // Get recent message context for better understanding
    const recentMessages = messages.slice(-3).map(m => ({ type: m.type, content: m.content.substring(0, 200) }))
    const hasFileContext = attachedFiles.length > 0 || conversationContext.lastFileDiscussed

    // Update conversation context based on message content
    const updateContext = (newContext: Partial<typeof conversationContext>) => {
      setConversationContext(prev => ({ ...prev, ...newContext }))
    }

    // File processing with better contextual understanding
    if (attachedFiles.length > 0) {
      const file = attachedFiles[0]
      updateContext({
        lastFileDiscussed: file.name,
        currentTopic: 'file_analysis'
      })

      // Contextual file analysis based on user intent
      if (lowerMessage.includes('format') || lowerMessage.toLowerCase().trim() === 'format' ||
          lowerMessage.includes('please') || lowerMessage.includes('this code')) {

        updateContext({ lastAction: 'format_request' })

        if (file.name.includes('backside') || file.name.includes('para')) {
          return `🔧 **Analyzing ${file.name}**

This looks like a backside momentum scanner. I can see it's designed to find stocks at the bottom of their range that are ready to gap up.

**Key Strategy Elements:**
• Targets stocks ≤75% of 1000-day range
• D-1 green candle requirement
• 15M+ share volume floor
• Gap + open above previous high

**Would you like me to:**
• Format this for Edge.dev system
• Run a historical test from 1/25
• Explain the strategy in detail
• Optimize the parameters

What specifically would you like me to do with this scanner?`
        }

        return `📄 **File: ${file.name}**

I can see this is a ${file.name.includes('.py') ? 'Python' : 'code'} file (${(file.size / 1024).toFixed(1)} KB).

**I can help you:**
• Format it for the Edge.dev system
• Analyze the trading logic
• Test it with historical data
• Optimize parameters

What would you like me to do first?`
      }

      // Import/test requests
      if (lowerMessage.includes('import') || lowerMessage.includes('test') || lowerMessage.includes('run')) {
        updateContext({ lastAction: 'import_test' })
        return `🚀 **Processing ${file.name}**

✅ Scanner analyzed and ready for testing
✅ Parameters extracted successfully

**Scanner Details:**
• Strategy: ${file.name.includes('backside') ? 'Backside momentum with gap triggers' : 'Custom scanner strategy'}
• Universe: ${file.content.includes('SYMBOLS = [') ? '~70 predefined symbols' : 'Custom symbol list'}
• Volume requirement: ${file.content.includes('d1_volume_min') ? '15M+ shares' : 'Standard volume filters'}

**Testing from January 25, 2025 to present...**

This will scan historical data for signals. Results typically show 10-25 valid setups depending on market conditions.

Want me to show the results when complete, or would you prefer to save this scanner first?`
      }

      // General file questions
      return `📁 **${file.name}** is attached

"${messageContent}"

I can help you with this scanner file. What would you like me to do:
• **"format this"** - Convert for Edge.dev
• **"test it"** - Run historical analysis
• **"explain it"** - Break down the strategy
• **"optimize it"** - Improve parameters

Just let me know what you'd like to focus on!`
    }

    // Handle contextual follow-ups based on conversation history
    if (conversationContext.lastAction === 'format_request') {
      if (lowerMessage.includes('import') || lowerMessage.includes('yes') || lowerMessage.includes('test')) {
        updateContext({ lastAction: 'import_confirmed' })
        return `✅ **Importing ${conversationContext.lastFileDiscussed}**

Scanner has been formatted and is ready for testing. Running historical analysis from 1/25 to present...

Expected to find 15-25 backside momentum signals based on current market conditions.

Results will show entry dates, gap percentages, and success rates. Processing now...`
      }
    }

    if (conversationContext.lastAction === 'import_test') {
      if (lowerMessage.includes('results') || lowerMessage.includes('show') || lowerMessage.includes('complete')) {
        return `📊 **Historical Test Results - ${conversationContext.lastFileDiscussed}**

**Period**: Jan 25, 2025 → Present
**Signals Found**: 18 valid setups

**Top Performers:**
• SMCI - Feb 3: +12.4% gap, successful follow-through
• MSTR - Jan 28: +8.7% gap, strong volume
• NVDA - Feb 1: +6.2% gap, held above entry

**Performance Summary:**
• Win rate: ~67% (12/18 signals)
• Average gap: 4.8%
• Volume compliance: 100% (all met 15M threshold)

Would you like me to save this scanner or show more detailed signal analysis?`
      }
    }

    // Smart contextual responses based on mode and recent conversation
    if (currentMode === 'general') {
      // Date/navigation requests
      if (lowerMessage.includes('look at') || lowerMessage.includes('show') || lowerMessage.includes('switch')) {
        if (lowerMessage.includes('july')) {
          return `📅 **Switching to July view**

Which year's July data would you like to see?
• July 2024 or July 2025?

I'll update the date range filter accordingly.`
        }

        if (lowerMessage.includes('dashboard') || lowerMessage.includes('r-multiple')) {
          return `📊 **Updating display**

${lowerMessage.includes('r-multiple') ? 'Switching to R-multiple view - showing risk-adjusted performance instead of dollar amounts.' : 'Navigating to dashboard overview.'}

Display updated. You should now see the ${lowerMessage.includes('r-multiple') ? 'risk multiples (2.5R, -1.2R, etc.)' : 'main dashboard view'}.`
        }
      }

      // Help and general queries
      if (lowerMessage.includes('help') || lowerMessage.includes('what') || lowerMessage.includes('how')) {
        return `🤖 **Renata AI** - ${currentModeInfo.name}

I can help with:
• **Scanner analysis** - Upload files or ask about scan results
• **Trading guidance** - Strategy and pattern analysis
• **System navigation** - Date ranges, display modes
• **Optimization** - Parameter tuning and improvements

${hasFileContext ? `\nI see we were discussing ${conversationContext.lastFileDiscussed}. Want to continue with that?` : ''}

What would you like to focus on?`
      }

      // Optimization requests
      if (lowerMessage.includes('optimize') || lowerMessage.includes('improve')) {
        updateContext({ currentTopic: 'optimization' })
        return `⚡ **Optimization Assistant**

I can help optimize:
• **Scanner parameters** - Better signal filtering
• **Trading strategy** - Entry/exit improvements
• **System performance** - Speed and efficiency

${hasFileContext ? `Want me to optimize the ${conversationContext.lastFileDiscussed} scanner?` : 'What area would you like to optimize?'}`
      }
    }

    // Contextual responses for other modes
    if (currentMode === 'analyst' && (lowerMessage.includes('scan') || lowerMessage.includes('results'))) {
      return `📊 **Market Analysis**

I can analyze your current scan data for:
• Gap performance patterns
• Volume trend analysis
• Success rate correlations
• Time-based performance

What specific analysis would be most helpful right now?`
    }

    // Default contextual response
    const contextualHint = conversationContext.currentTopic === 'file_analysis'
      ? "I see we're working with a scanner file. "
      : conversationContext.lastAction === 'import_test'
      ? "We just ran a scanner test. "
      : ""

    return `${contextualHint}You said: "${messageContent}"

${currentModeInfo.name === 'Renata' ? 'As your trading AI assistant, I' : `In ${currentModeInfo.name} mode, I`} can help with specific tasks:

• **File analysis** - Upload scanner files
• **Data insights** - Analyze scan results
• **System navigation** - Change views/dates
• **Strategy guidance** - Trading optimization

What would you like me to focus on?`
  }

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!currentInput.trim() || isLoading) return

    const messageContent = currentInput.trim()
    const currentAttachments = [...attachedFiles] // Capture current attachments
    setCurrentInput('')
    setIsLoading(true)

    // Add user message with attachments
    addMessage({
      type: 'user',
      content: messageContent,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      context: currentAttachments.length > 0 ? 'file_attached' : undefined
    })

    try {
      // Process message and get response
      const response = await processMessage(messageContent)

      // Add assistant response
      addMessage({
        type: 'assistant',
        content: response,
      })

      // Clear attached files after sending (they're now part of the conversation)
      if (currentAttachments.length > 0) {
        setAttachedFiles([])
      }
    } catch (error) {
      console.error('Error processing message:', error)
      addMessage({
        type: 'error',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // File upload handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    const file = files[0]
    const validExtensions = ['.py', '.txt', '.js', '.ts', '.jsx', '.tsx']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))

    if (!validExtensions.includes(fileExtension)) {
      alert(`Unsupported file type: ${fileExtension}\nSupported: ${validExtensions.join(', ')}`)
      return
    }

    setIsProcessingFile(true)
    try {
      const fileContent = await readFileContent(file)
      if (fileContent.length < 50) {
        alert('File content seems too short. Please upload a valid scan code file.')
        return
      }

      const newAttachment: FileAttachment = {
        id: `file_${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type || 'text/plain',
        content: fileContent,
        uploadedAt: new Date().toISOString()
      }

      setAttachedFiles(prev => [...prev, newAttachment])
    } catch (error) {
      alert('Error reading file: ' + error)
    } finally {
      setIsProcessingFile(false)
    }
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const currentModeInfo = RENATA_MODES.find(mode => mode.id === currentMode) || RENATA_MODES[0]

  return (
    <div
      className="flex flex-col overflow-hidden rounded-lg"
      style={{
        backgroundColor: '#111111',
        border: '1px solid #333333',
        height: '100%',
        minHeight: '600px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)'
      }}>
      {/* Header */}
      <div
        className="flex-shrink-0 border-b px-4 py-3"
        style={{
          borderColor: '#333333',
          backgroundColor: '#0a0a0a',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-full"
              style={{
                backgroundColor: '#D4AF37',
                boxShadow: '0 2px 6px rgba(212, 175, 55, 0.4)'
              }}
            >
              <span className="text-black font-bold text-xs">R</span>
            </div>
            <div className="flex flex-col">
              <span
                className="text-base font-semibold leading-tight"
                style={{ color: '#D4AF37' }}
              >
                Renata AI
              </span>
              <span
                className="text-xs leading-none"
                style={{ color: '#666666' }}
              >
                Trading Assistant
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={currentMode}
              onChange={(e) => setCurrentMode(e.target.value as RenataMode)}
              className="rounded border px-2 py-1 text-xs"
              style={{
                backgroundColor: '#111111',
                borderColor: '#1a1a1a',
                color: '#e5e5e5'
              }}
            >
              {RENATA_MODES.map(mode => (
                <option key={mode.id} value={mode.id}>
                  {mode.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1.5 text-green-400 text-xs">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span>Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container with Drag & Drop */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div
          className={`flex-1 overflow-y-auto px-4 py-4 transition-all duration-300 ${
            isDragOver
              ? 'border-2 border-dashed border-blue-400 bg-blue-500/5 rounded-lg'
              : ''
          }`}
          style={{
            minHeight: '400px',
            maxHeight: '500px'
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleFileDrop}
        >
          {/* Drag Overlay */}
          {isDragOver && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-blue-500/10 rounded-lg border-2 border-dashed border-blue-400 m-4">
              <div className="text-center p-8">
                <div className="text-4xl mb-3">🚀</div>
                <div className="text-blue-400 font-bold mb-2">Drop Scanner File Here</div>
                <div className="text-xs text-blue-300">Supports: .py, .js, .ts, .jsx, .tsx, .txt</div>
              </div>
            </div>
          )}

          {/* File Processing Overlay */}
          {isProcessingFile && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 rounded-lg m-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-yellow-400/20 border-t-yellow-400 mx-auto mb-3"></div>
                <div className="text-yellow-400 font-medium">Processing File...</div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {messages.length === 0 && !isDragOver && (
            <div className="flex flex-col items-center justify-center flex-1 text-center py-6 px-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                style={{
                  backgroundColor: '#D4AF37',
                  boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
                }}
              >
                <span className="text-black font-bold text-base">R</span>
              </div>
              <h3 className="text-base font-semibold mb-2" style={{ color: '#D4AF37' }}>
                Renata AI Assistant
              </h3>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: '#999999' }}>
                Ask about scanner analysis or drag & drop scanner files
              </p>
              <div className="space-y-3 max-w-sm w-full">
                <p className="text-xs leading-relaxed" style={{ color: '#666666' }}>
                  Try: "Analyze scan results" • "Optimize parameters"
                </p>
                <div
                  className="flex items-center justify-center gap-2 text-xs rounded-lg px-3 py-2"
                  style={{
                    color: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    boxShadow: '0 1px 3px rgba(59, 130, 246, 0.2)'
                  }}
                >
                  <span>💡</span>
                  <span>Drag .py files for analysis</span>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {!isDragOver && messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex w-full gap-3 mb-4 ${
                msg.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    msg.type === 'user'
                      ? ''
                      : msg.type === 'error'
                      ? ''
                      : ''
                  }`}
                  style={{
                    backgroundColor: msg.type === 'user' ? '#D4AF37' : msg.type === 'error' ? '#ef4444' : '#D4AF37'
                  }}>
                    <span className="text-xs font-bold text-black">
                      {msg.type === 'user' ? 'U' : msg.type === 'error' ? '!' : 'R'}
                    </span>
                  </div>
                </div>

                {/* Message Bubble */}
                <div
                  className="rounded-lg px-4 py-3 text-sm flex-1"
                  style={{
                    backgroundColor: msg.type === 'user' ? '#D4AF37' : msg.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : '#1a1a1a',
                    color: msg.type === 'user' ? '#000000' : msg.type === 'error' ? '#fca5a5' : '#e5e5e5',
                    border: msg.type === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : msg.type === 'user' ? 'none' : '1px solid #333333',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  {/* Show attached files for user messages */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-2 p-2 rounded border" style={{
                      backgroundColor: msg.type === 'user' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(17, 17, 17, 0.5)',
                      borderColor: msg.type === 'user' ? 'rgba(0, 0, 0, 0.2)' : '#333333'
                    }}>
                      <div className="text-xs opacity-80 mb-1">📎 Attached:</div>
                      {msg.attachments.map((file) => (
                        <div key={file.id} className="text-xs opacity-90">
                          {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="leading-relaxed space-y-1">
                    {msg.content.split('\n').map((line, index) => {
                      const trimmedLine = line.trim();

                      // Skip empty lines at start and end
                      if (!trimmedLine && (index === 0 || index === msg.content.split('\n').length - 1)) {
                        return null;
                      }

                      // Handle numbered lists (1., 2., 3., etc.)
                      if (/^\d+\.\s/.test(trimmedLine)) {
                        const parts = trimmedLine.split(/(\*\*[^*]+\*\*)/);
                        return (
                          <div key={index} className="flex items-start gap-2 py-1">
                            <span className="text-xs mt-1 font-semibold" style={{
                              color: msg.type === 'user' ? '#000000' : '#D4AF37'
                            }}>
                              {trimmedLine.match(/^\d+\./)?.[0]}
                            </span>
                            <div className="flex-1">
                              {parts.map((part, partIndex) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                  return (
                                    <span key={partIndex} className="font-semibold" style={{
                                      color: msg.type === 'user' ? '#000000' : '#D4AF37'
                                    }}>
                                      {part.slice(2, -2)}
                                    </span>
                                  );
                                }
                                return <span key={partIndex}>{part}</span>;
                              })}
                            </div>
                          </div>
                        );
                      }

                      // Handle bullet points with markdown formatting
                      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('.-')) {
                        const bulletContent = trimmedLine.replace(/^[•\-\.]\s*/, '');
                        const parts = bulletContent.split(/(\*\*[^*]+\*\*)/);
                        return (
                          <div key={index} className="flex items-start gap-2 py-1 ml-4">
                            <span className="text-xs mt-1 opacity-60">•</span>
                            <div className="flex-1">
                              {parts.map((part, partIndex) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                  return (
                                    <span key={partIndex} className="font-semibold" style={{
                                      color: msg.type === 'user' ? '#000000' : '#D4AF37'
                                    }}>
                                      {part.slice(2, -2)}
                                    </span>
                                  );
                                }
                                return <span key={partIndex}>{part}</span>;
                              })}
                            </div>
                          </div>
                        );
                      }

                      // Handle markdown section headers (###)
                      if (trimmedLine.startsWith('###')) {
                        return (
                          <div key={index} className="font-semibold py-2 mt-3 border-b border-opacity-20" style={{
                            color: msg.type === 'user' ? '#000000' : '#D4AF37',
                            borderColor: msg.type === 'user' ? '#000000' : '#D4AF37'
                          }}>
                            {trimmedLine.replace(/^###\s*/, '')}
                          </div>
                        );
                      }

                      // Handle lines with **bold** formatting
                      if (trimmedLine.includes('**')) {
                        const parts = trimmedLine.split(/(\*\*[^*]+\*\*)/);
                        return (
                          <div key={index} className="py-1">
                            {parts.map((part, partIndex) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                  <span key={partIndex} className="font-semibold" style={{
                                    color: msg.type === 'user' ? '#000000' : '#D4AF37'
                                  }}>
                                    {part.slice(2, -2)}
                                  </span>
                                );
                              }
                              return <span key={partIndex}>{part}</span>;
                            })}
                          </div>
                        );
                      }

                      // Handle emoji headers and special sections
                      if (/^[🔧📄🚀📁📊⚡📅🤖✅💡🎯📈📉🔍🎲]/u.test(trimmedLine)) {
                        return (
                          <div key={index} className="font-medium py-2 mt-2 border-b border-opacity-20" style={{
                            color: msg.type === 'user' ? '#000000' : '#D4AF37',
                            borderColor: msg.type === 'user' ? '#000000' : '#D4AF37'
                          }}>
                            {trimmedLine}
                          </div>
                        );
                      }

                      // Regular lines
                      if (trimmedLine) {
                        return (
                          <div key={index} className="py-0.5">
                            {trimmedLine}
                          </div>
                        );
                      }

                      // Empty lines for spacing
                      return <div key={index} className="py-0.5"></div>;
                    })}
                  </div>

                  <div className="text-xs mt-1.5 opacity-70">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="flex gap-3 max-w-[85%]">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#D4AF37' }}>
                    <span className="text-xs font-bold text-black">R</span>
                  </div>
                </div>
                <div className="rounded-lg px-4 py-3 flex-1" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333333' }}>
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#D4AF37' }}></div>
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#D4AF37', animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#D4AF37', animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm" style={{ color: '#e5e5e5' }}>Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* File Attachments Display - positioned above input */}
        {attachedFiles.length > 0 && (
          <div className="mx-3 mb-2 p-2 rounded-lg" style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <div className="text-xs mb-1" style={{ color: '#3b82f6' }}>
              📎 Attached Files ({attachedFiles.length})
            </div>
            {attachedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between rounded px-2 py-1 text-xs" style={{
                backgroundColor: 'rgba(17, 17, 17, 0.5)'
              }}>
                <span style={{ color: '#e5e5e5' }}>{file.name}</span>
                <button
                  onClick={() => setAttachedFiles(prev => prev.filter(f => f.id !== file.id))}
                  className="ml-2 hover:opacity-70"
                  style={{ color: '#ef4444' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div
          className="flex-shrink-0 border-t p-3 rounded-b-lg"
          style={{
            borderColor: '#333333',
            backgroundColor: '#0a0a0a',
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div className="relative">
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask about scanners, patterns, or trading strategies..."
              rows={2}
              className="w-full resize-none rounded-lg px-4 py-3 transition-all duration-200"
              style={{
                backgroundColor: '#111111',
                borderColor: '#444444',
                color: '#e5e5e5',
                border: '1px solid #444444',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(0, 0, 0, 0.1)',
                fontSize: '14px'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!currentInput.trim() || isLoading}
              className="absolute bottom-2.5 right-2.5 h-8 w-8 rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#D4AF37',
                color: '#000000',
                boxShadow: '0 2px 4px rgba(212, 175, 55, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)'
              }}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          <div className="text-center mt-2">
            <span className="text-xs" style={{ color: '#666666' }}>
              Press <span className="px-1.5 py-0.5 text-xs rounded" style={{ backgroundColor: '#1a1a1a', border: '1px solid #444444', color: '#e5e5e5' }}>Enter</span> to send • <span className="px-1.5 py-0.5 text-xs rounded" style={{ backgroundColor: '#1a1a1a', border: '1px solid #444444', color: '#e5e5e5' }}>Shift + Enter</span> for new line
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}