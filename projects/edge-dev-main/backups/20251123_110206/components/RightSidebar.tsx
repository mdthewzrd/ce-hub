'use client';

import React, { useState } from 'react';
import { Brain, Send } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface RightSidebarProps {
  onSendMessage?: (message: string) => void;
}

/**
 * Right Sidebar - Renata AI Chat
 * Matches Traderra 6565 styling and interaction patterns
 */
export const RightSidebar: React.FC<RightSidebarProps> = ({ onSendMessage }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm Renata, your AI trading assistant. I can help you with strategy conversion, backtesting analysis, troubleshooting execution issues, and optimizing your trading strategies. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    onSendMessage?.(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <aside className="h-full border-l border-[#1a1a1a] bg-[#111111] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-5 w-5 text-[#D4AF37]" />
          <h2 className="text-sm font-semibold studio-text">Renata AI</h2>
          <span className="ml-auto px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] text-xs font-medium border border-[#10b981]/30">
            Live
          </span>
        </div>
        <p className="text-xs studio-muted">AI Trading Assistant</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-[#D4AF37] text-white'
                  : 'bg-[#1a1a1a] studio-text border studio-border'
              }`}
            >
              {/* Message Indicator */}
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2 text-xs text-[#D4AF37]">
                  <Brain className="h-3 w-3" />
                  <span className="font-medium">Renata</span>
                </div>
              )}

              {/* Message Content */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </div>

              {/* Timestamp */}
              <div className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-white/70' : 'studio-muted'
              }`}>
                {message.timestamp.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-[#1a1a1a]">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setInput('Convert my scanner to production format')}
            className="px-2 py-1 text-xs rounded bg-[#1a1a1a] hover:bg-black studio-text border border-[#333333]"
          >
            Convert Strategy
          </button>
          <button
            onClick={() => setInput('Debug my scanner execution issues')}
            className="px-2 py-1 text-xs rounded bg-[#1a1a1a] hover:bg-black studio-text border border-[#333333]"
          >
            Debug Issues
          </button>
          <button
            onClick={() => setInput('Analyze my scan results')}
            className="px-2 py-1 text-xs rounded bg-[#1a1a1a] hover:bg-black studio-text border border-[#333333]"
          >
            Analyze Results
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[#1a1a1a]">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Renata about conversions, debugging, or trading strategies..."
            className="flex-1 px-3 py-2 rounded bg-black border border-[#333333] text-sm studio-text placeholder-[#666666] focus:outline-none focus:border-[#D4AF37] resize-none"
            rows={3}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="btn-primary px-3 self-end disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="text-xs studio-muted mt-2">
          Press Enter to send • Shift + Enter for new line
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
