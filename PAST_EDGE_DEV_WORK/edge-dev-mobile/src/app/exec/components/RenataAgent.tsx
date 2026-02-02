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
      case 'conversion': return 'border-studio-accent text-studio-accent bg-studio-accent/10';
      case 'troubleshooting': return 'border-studio-danger text-studio-danger bg-studio-danger/10';
      case 'analysis': return 'border-studio-success text-studio-success bg-studio-success/10';
      default: return 'border-primary text-primary bg-primary/10';
    }
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="studio-button rounded-full w-12 h-12 shadow-studio-lg"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="section-header">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="section-title">Renata AI</h2>
          <Badge variant="outline" className="border-studio-success text-studio-success bg-studio-success/10">
            <div className="w-2 h-2 bg-studio-success rounded-full mr-1 animate-pulse"></div>
            Live
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className="text-studio-muted hover:text-studio-text h-6 w-6 p-0"
        >
          ✕
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuickAction('conversion', 'Help me convert my Python trading strategy to edge.dev format')}
          disabled={isProcessing}
          className="text-xs border-studio-accent text-studio-accent hover:bg-studio-accent/10"
        >
          <Code className="h-3 w-3 mr-1" />
          Convert Strategy
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuickAction('troubleshooting', 'Help me debug the execution engine errors I\'m seeing')}
          disabled={isProcessing}
          className="text-xs border-studio-danger text-studio-danger hover:bg-studio-danger/10"
        >
          <Settings className="h-3 w-3 mr-1" />
          Debug Issues
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuickAction('analysis', 'Analyze my current trading performance and suggest improvements')}
          disabled={isProcessing}
          className="text-xs border-studio-success text-studio-success hover:bg-studio-success/10"
        >
          <TrendingUp className="h-3 w-3 mr-1" />
          Analyze Performance
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 max-h-[400px] studio-scrollbar">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="flex-shrink-0 mt-1">
                {getMessageIcon(message)}
              </div>
              <div
                className={`rounded-lg p-3 text-sm ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'ai-message studio-surface studio-text'
                }`}
              >
                {message.type && message.role === 'assistant' && (
                  <Badge variant="outline" className={`mb-2 text-xs ${getBadgeColor(message.type)}`}>
                    {message.type}
                  </Badge>
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
          <div className="flex gap-3 justify-start">
            <div className="flex gap-2 max-w-[85%]">
              <div className="flex-shrink-0 mt-1">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="ai-message studio-surface studio-text">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t studio-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask Renata about conversions, debugging, or trading strategies..."
            disabled={isProcessing}
            className="studio-input flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            size="sm"
            className="studio-button"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin studio-spinner" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RenataAgent;