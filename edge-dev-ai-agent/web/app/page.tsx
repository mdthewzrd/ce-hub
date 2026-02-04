/**
 * EdgeDev AI Agent - Main Chat Page
 *
 * Premium chat interface with Renata V2 AI integration
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useCopilotChat, useCopilotReadable } from '@copilotkit/react-core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  BarChart3,
  FolderOpen,
  Brain,
  Settings,
  Activity,
  Menu,
  X,
  Send,
  Sparkles,
  TrendingUp,
  User,
  Bot,
  Loader2,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'Chat', href: '/', icon: MessageSquare },
  { name: 'Plan', href: '/plan', icon: Sparkles },
  { name: 'Scan', href: '/scan', icon: BarChart3 },
  { name: 'Backtest', href: '/backtest', icon: TrendingUp },
  { name: 'Patterns', href: '/patterns', icon: BarChart3 },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Memory', href: '/memory', icon: Brain },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [localMessages, setLocalMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to EdgeDev AI! I\'m Renata V2, your advanced trading strategist. I can help you:\n\n• Develop custom trading strategies\n• Execute market scanners\n• Run backtests and optimizations\n• Analyze trading patterns\n• Review past results\n\nWhat would you like to work on today?',
      timestamp: new Date(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // CopilotKit integration
  const {
    visibleMessages,
    appendMessage,
    isLoading,
  } = useCopilotChat();

  // Provide context to Copilot
  useCopilotReadable({
    description: 'EdgeDev AI Trading System Context',
    value: JSON.stringify({
      system: 'EdgeDev AI Agent',
      version: '2.0',
      capabilities: [
        'strategy_development',
        'scanner_execution',
        'backtesting',
        'pattern_analysis',
        'code_generation',
      ],
      availableScanners: [
        'V31 Gold Standard',
        'Momentum Swing',
        'Volume Surge',
        'Gap Trader',
      ],
      availableStrategies: [
        'V31 Gold Standard',
        'Momentum Swing',
        'Mean Reversion',
        'Breakout',
      ],
    }),
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages]);

  // Sync visible messages with local state
  useEffect(() => {
    setLocalMessages(
      visibleMessages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.createdAt || Date.now()),
      }))
    );
  }, [visibleMessages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setLocalMessages((prev) => [...prev, userMessage]);
    setInputMessage('');

    // CopilotKit appendMessage - pass string directly
    await appendMessage(inputMessage as any);
  };

  if (pathname === '/') {
    return (
      <div className="flex h-screen bg-background">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-surface lg:static lg:z-40 lg:translate-x-0 transition-transform duration-200 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold shadow-glow-sm">
                  <Sparkles className="h-4 w-4 text-black" />
                </div>
                <span className="font-semibold text-lg">EdgeDev AI</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded hover:bg-surface-hover text-text-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-0.5 p-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-gold text-black shadow-gold-sm'
                        : 'text-text-muted hover:bg-surface hover:text-text-primary'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Status */}
            <div className="border-t border-border p-4">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <div className="h-2 w-2 rounded-full bg-gold shadow-[0_0_0_2px_rgba(212,175,55,0.3)]" />
                <span>Renata V2 Online</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main
          className="flex-1 flex flex-col overflow-hidden relative z-10 transition-all duration-300 ease-out"
          style={{ width: sidebarOpen ? 'calc(100% - 384px)' : '100%' }}
        >
          {/* Header */}
          <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded hover:bg-surface-hover text-text-muted"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-gold" />
              <h1 className="text-sm font-medium">Chat with Renata V2</h1>
            </div>
            <div className="w-8" />
          </header>

          {/* Chat interface */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto p-6 space-y-6">
                {localMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gold flex items-center justify-center shadow-gold-sm">
                        <Bot className="w-4 h-4 text-black" />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-xl p-4 ${
                        message.role === 'user'
                          ? 'bg-gold text-black shadow-gold-sm'
                          : 'card'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-black/60' : 'text-text-muted'}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center">
                        <User className="w-4 h-4 text-text-muted" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gold flex items-center justify-center shadow-gold-sm">
                      <Bot className="w-4 h-4 text-black" />
                    </div>
                    <div className="card rounded-xl p-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-gold" />
                        <span className="text-sm text-text-muted">Renata is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-border bg-surface">
              <div className="max-w-4xl mx-auto p-4">
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask Renata about trading strategies, scanners, backtests..."
                    className="flex-1 px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim()}
                    className="px-6 py-3 bg-gold text-black font-medium rounded-lg hover:bg-gold-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-gold-sm hover:shadow-glow-md flex items-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-surface lg:static lg:z-40 lg:translate-x-0 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold shadow-glow-sm">
                <Sparkles className="h-4 w-4 text-black" />
              </div>
              <span className="font-semibold text-lg">EdgeDev AI</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded hover:bg-surface-hover text-text-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5 p-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-gold text-black shadow-gold-sm'
                      : 'text-text-muted hover:bg-surface hover:text-text-primary'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Status */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <div className="h-2 w-2 rounded-full bg-gold shadow-[0_0_0_2px_rgba(212,175,55,0.3)]" />
              <span>System Online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className="flex-1 flex flex-col overflow-hidden relative z-10 transition-all duration-300 ease-out"
        style={{ width: sidebarOpen ? 'calc(100% - 384px)' : '100%' }}
      >
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded hover:bg-surface-hover text-text-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-medium">
            {navigation.find((item) => item.href === pathname)?.name || 'EdgeDev AI'}
          </h1>
          <div className="w-8" />
        </header>
      </main>
    </div>
  );
}
