'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Zap,
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
  Code,
  TrendingUp,
  FileText,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'conversion' | 'troubleshooting' | 'analysis' | 'general';
}

const GlobalRenataAgent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm Renata, your AI trading assistant. I can help you with scanner analysis, strategy optimization, troubleshooting, and trading insights. How can I assist you today?",
      role: 'assistant',
      timestamp: new Date(),
      type: 'general'
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const callOpenRouter = async (prompt: string, context?: any): Promise<string> => {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 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',
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'CE-Hub AI Assistant'
        },
        body: JSON.stringify({
          model: 'qwen/qwen-2.5-72b-instruct', // Cost-effective, high-quality model
          messages: [
            {
              role: 'system',
              content: `You are Renata, an expert AI trading assistant for CE-Hub. You specialize in:

              1. **Scanner Analysis**: Help analyze trading patterns, optimize scan parameters, and interpret results
              2. **AI Scanner Splitting**: Assist with the new AI-powered scanner splitting features
              3. **Trading Strategy**: Provide insights on LC patterns, gap scanners, and market analysis
              4. **Troubleshooting**: Debug scanner issues, parameter problems, and data analysis
              5. **Performance Optimization**: Suggest improvements for scan efficiency and accuracy

              Current context:
              - Platform: CE-Hub with AI-powered scanner splitting
              - Scanner Types: LC patterns, Gap Up scanners, A+ patterns
              - New Features: OpenRouter AI integration for intelligent scanner analysis
              - Page: ${window.location.pathname}

              Be concise, practical, and focused on trading and scanner optimization.`
            },
            {
              role: 'user',
              content: context ? `${prompt}\n\nContext: ${JSON.stringify(context, null, 2)}` : prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'I apologize, but I encountered an issue processing your request.';
    } catch (error) {
      console.error('OpenRouter API error:', error);
      return "I'm having trouble connecting to my AI service right now. Please try again in a moment.";
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date(),
      type: 'general'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const messageType = determineMessageType(userMessage.content);
      const context = gatherContext(messageType);

      const response = await callOpenRouter(userMessage.content, context);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
        type: messageType
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I encountered an error. Please try rephrasing your question or check your connection.",
        role: 'assistant',
        timestamp: new Date(),
        type: 'general'
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsProcessing(false);
  };

  const determineMessageType = (content: string): Message['type'] => {
    const lower = content.toLowerCase();
    if (lower.includes('convert') || lower.includes('split') || lower.includes('ai scanner')) {
      return 'conversion';
    } else if (lower.includes('error') || lower.includes('problem') || lower.includes('debug')) {
      return 'troubleshooting';
    } else if (lower.includes('analyz') || lower.includes('performance') || lower.includes('metric') || lower.includes('scanner')) {
      return 'analysis';
    }
    return 'general';
  };

  const gatherContext = (messageType: Message['type']) => {
    const context: any = {
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
      messageType
    };

    if (messageType === 'analysis') {
      context.scannerContext = 'User is asking about scanner analysis';
    }

    return context;
  };

  const handleQuickAction = async (action: string, prompt: string) => {
    setIsProcessing(true);

    const context = gatherContext(action as Message['type']);
    const response = await callOpenRouter(prompt, context);

    const assistantMessage: Message = {
      id: Date.now().toString(),
      content: response,
      role: 'assistant',
      timestamp: new Date(),
      type: action as Message['type']
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsProcessing(false);
  };

  const getMessageIcon = (message: Message) => {
    if (message.role === 'user') return <User className="h-4 w-4" />;

    switch (message.type) {
      case 'conversion': return <Code className="h-4 w-4 text-blue-500" />;
      case 'troubleshooting': return <Settings className="h-4 w-4 text-red-500" />;
      case 'analysis': return <TrendingUp className="h-4 w-4 text-green-500" />;
      default: return <Bot className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getBadgeColor = (type?: string) => {
    switch (type) {
      case 'conversion': return 'bg-blue-100 text-blue-700 border border-blue-300';
      case 'troubleshooting': return 'bg-red-100 text-red-700 border border-red-300';
      case 'analysis': return 'bg-green-100 text-green-700 border border-green-300';
      default: return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
    }
  };

  // Floating button when collapsed
  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-yellow-600 hover:bg-yellow-700 text-black rounded-full w-14 h-14 shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
          title="Open Renata AI Assistant"
        >
          <Bot className="h-7 w-7" />
        </button>
      </div>
    );
  }

  const containerClass = isMaximized
    ? "fixed inset-4 z-50 bg-gray-900 border border-gray-700 rounded-lg"
    : "fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-gray-900 border border-gray-700 rounded-lg";

  return (
    <div className={containerClass}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-yellow-500" />
            <h3 className="text-yellow-500 font-semibold">Renata AI</h3>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="text-gray-400 hover:text-white p-1 rounded"
              title={isMaximized ? "Minimize" : "Maximize"}
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-white p-1 rounded"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-3 border-b border-gray-700">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickAction('analysis', 'Help me optimize my scanner parameters and improve scan results')}
              disabled={isProcessing}
              className="text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
            >
              <TrendingUp className="h-3 w-3" />
              Optimize Scanner
            </button>
            <button
              onClick={() => handleQuickAction('conversion', 'Show me how to use the new AI-powered scanner splitting features')}
              disabled={isProcessing}
              className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            >
              <Code className="h-3 w-3" />
              AI Splitting
            </button>
            <button
              onClick={() => handleQuickAction('troubleshooting', 'Help me debug scanner issues and parameter problems')}
              disabled={isProcessing}
              className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              Debug Issues
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="flex-shrink-0 mt-1">
                  {getMessageIcon(message)}
                </div>
                <div
                  className={`rounded-lg p-3 text-sm ${
                    message.role === 'user'
                      ? 'bg-yellow-600 text-black'
                      : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  {message.type && message.role === 'assistant' && (
                    <div className={`inline-block px-2 py-1 rounded text-xs mb-2 ${getBadgeColor(message.type)}`}>
                      {message.type}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex gap-2 justify-start">
              <div className="flex gap-2 max-w-[85%]">
                <div className="flex-shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="bg-gray-800 text-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask Renata about scanners, patterns, or trading strategies..."
              disabled={isProcessing}
              className="flex-1 bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isProcessing}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded px-4 py-2 transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalRenataAgent;