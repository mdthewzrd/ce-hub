'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  FileText
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'conversion' | 'troubleshooting' | 'analysis' | 'general';
}

interface RenataAgentProps {
  onStrategyAnalysis?: (analysis: any) => void;
  onConversionHelp?: (help: any) => void;
  executionStatus?: string;
  currentStrategy?: any;
}

const RenataAgent: React.FC<RenataAgentProps> = ({
  onStrategyAnalysis,
  onConversionHelp,
  executionStatus,
  currentStrategy
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm Renata, your AI trading assistant. I can help you with strategy conversion, backtesting analysis, troubleshooting execution issues, and optimizing your trading strategies. How can I assist you today?",
      role: 'assistant',
      timestamp: new Date(),
      type: 'general'
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
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
          'X-Title': 'Edge.dev Exec Dashboard'
        },
        body: JSON.stringify({
          model: 'qwen/qwen-2.5-72b-instruct', // Cost-effective, high-quality model
          messages: [
            {
              role: 'system',
              content: `You are Renata, an expert AI trading assistant for the Edge.dev execution dashboard. You specialize in:

              1. **Strategy Conversion**: Help convert Python, Pine Script, and other trading strategies to edge.dev format
              2. **Backtesting Analysis**: Analyze backtest results and provide optimization suggestions
              3. **Execution Troubleshooting**: Debug execution engine issues and data problems
              4. **Performance Analysis**: Interpret trading metrics and suggest improvements
              5. **Risk Management**: Provide guidance on position sizing, stop losses, and risk controls

              Current context:
              - Execution Status: ${executionStatus || 'Stopped'}
              - Current Strategy: ${currentStrategy ? JSON.stringify(currentStrategy, null, 2) : 'None loaded'}
              - Platform: Edge.dev with backtrader integration

              Be concise, practical, and actionable. Focus on solving immediate problems and improving trading performance.`
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
      // Determine message type and context
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

      // Handle specific actions based on message type
      if (messageType === 'conversion' && onConversionHelp) {
        onConversionHelp({ message: response, userInput: userMessage.content });
      } else if (messageType === 'analysis' && onStrategyAnalysis) {
        onStrategyAnalysis({ message: response, userInput: userMessage.content });
      }

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
    if (lower.includes('convert') || lower.includes('translation') || lower.includes('format')) {
      return 'conversion';
    } else if (lower.includes('error') || lower.includes('problem') || lower.includes('debug')) {
      return 'troubleshooting';
    } else if (lower.includes('analyz') || lower.includes('performance') || lower.includes('metric')) {
      return 'analysis';
    }
    return 'general';
  };

  const gatherContext = (messageType: Message['type']) => {
    const context: any = {
      executionStatus,
      currentStrategy,
      messageType
    };

    if (messageType === 'troubleshooting') {
      context.recentErrors = 'Check console for execution engine errors';
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
      case 'conversion': return <Code className="h-4 w-4 text-studio-accent" />;
      case 'troubleshooting': return <Settings className="h-4 w-4 text-studio-danger" />;
      case 'analysis': return <TrendingUp className="h-4 w-4 text-studio-success" />;
      default: return <Bot className="h-4 w-4 text-primary" />;
    }
  };

  const getBadgeColor = (type?: string) => {
    switch (type) {
      case 'conversion': return 'bg-blue-500/10 text-blue-300 border-blue-400/20';
      case 'troubleshooting': return 'bg-red-500/10 text-red-300 border-red-400/20';
      case 'analysis': return 'bg-green-500/10 text-green-300 border-green-400/20';
      default: return 'bg-studio-gold/10 text-studio-gold border-studio-gold/20';
    }
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="bg-studio-gold text-black hover:bg-studio-gold/90 rounded-full w-14 h-14 shadow-2xl border border-studio-border"
        >
          <Bot className="h-7 w-7" />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-studio-surface border border-studio-border rounded-lg shadow-2xl">
      <div className="flex items-center justify-between p-4 bg-studio-bg border-b border-studio-border rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-studio-gold rounded-full">
            <Bot className="h-5 w-5 text-black" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-studio-gold">Renata AI</h2>
            <p className="text-xs text-studio-muted">Trading Assistant</p>
          </div>
          <Badge className="bg-green-500/10 text-green-400 border-green-400/20 hover:bg-green-500/20">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            Live
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className="text-studio-muted hover:text-studio-gold hover:bg-studio-border h-8 w-8 p-0 rounded-full"
        >
          ✕
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 p-4 bg-studio-bg/50">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuickAction('conversion', 'Help me convert my Python trading strategy to edge.dev format')}
          disabled={isProcessing}
          className="text-xs bg-blue-500/10 border-blue-400/30 text-blue-300 hover:bg-blue-500/20 hover:border-blue-400/50 transition-all duration-200"
        >
          <Code className="h-3 w-3 mr-1" />
          Convert Strategy
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuickAction('troubleshooting', 'Help me debug the execution engine errors I\'m seeing')}
          disabled={isProcessing}
          className="text-xs bg-red-500/10 border-red-400/30 text-red-300 hover:bg-red-500/20 hover:border-red-400/50 transition-all duration-200"
        >
          <Settings className="h-3 w-3 mr-1" />
          Debug Issues
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuickAction('analysis', 'Analyze my current trading performance and suggest improvements')}
          disabled={isProcessing}
          className="text-xs bg-green-500/10 border-green-400/30 text-green-300 hover:bg-green-500/20 hover:border-green-400/50 transition-all duration-200"
        >
          <TrendingUp className="h-3 w-3 mr-1" />
          Analyze Performance
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-h-[400px] bg-studio-bg/30 scrollbar-thin scrollbar-track-studio-bg scrollbar-thumb-studio-border">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="flex-shrink-0 mt-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  message.role === 'user'
                    ? 'bg-studio-gold'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }`}>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4 text-black" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>
              </div>
              <div
                className={`rounded-xl p-4 text-sm shadow-lg ${
                  message.role === 'user'
                    ? 'bg-studio-gold text-black font-medium'
                    : 'bg-studio-surface border border-studio-border text-studio-text'
                }`}
              >
                {message.type && message.role === 'assistant' && (
                  <Badge className={`mb-2 text-xs ${getBadgeColor(message.type)}`}>
                    {message.type}
                  </Badge>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                <div className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-black/70' : 'text-studio-muted'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex gap-3 justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="flex-shrink-0 mt-1">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="bg-studio-surface border border-studio-border rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-studio-gold" />
                  <span className="text-studio-text">Thinking...</span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-studio-gold rounded-full animate-pulse delay-100"></div>
                    <div className="w-1 h-1 bg-studio-gold rounded-full animate-pulse delay-200"></div>
                    <div className="w-1 h-1 bg-studio-gold rounded-full animate-pulse delay-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-studio-border bg-studio-bg rounded-b-lg">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask Renata about scanners, patterns, or trading strategies..."
            disabled={isProcessing}
            className="flex-1 bg-studio-surface border border-studio-border rounded-lg px-4 py-3 text-studio-text placeholder:text-studio-muted focus:outline-none focus:ring-2 focus:ring-studio-gold focus:border-transparent transition-all duration-200"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            className="bg-studio-gold text-black hover:bg-studio-gold/90 disabled:bg-studio-border disabled:text-studio-muted px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="mt-2 text-xs text-studio-muted">
          Press Enter to send • Shift + Enter for new line
        </div>
      </div>
    </div>
  );
};

export default RenataAgent;