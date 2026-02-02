/**
 * EdgeDev AI Agent - Main Page
 *
 * Main application page with navigation and routing.
 */

'use client';

import { useState } from 'react';
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
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavigationItem[] = [
  { name: 'Chat', href: '/', icon: MessageSquare },
  { name: 'Patterns', href: '/patterns', icon: BarChart3 },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Memory', href: '/memory', icon: Brain },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // If on the home page, show the chat interface
  // Otherwise, show the appropriate page
  if (pathname === '/') {
    return (
      <div className="flex h-screen bg-background">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-card lg:static lg:z-40 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-200 ease-in-out`}
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center justify-between border-b border-border px-6">
              <h1 className="text-xl font-bold">EdgeDev AI</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Status indicator */}
            <div className="border-t border-border p-4">
              <SystemStatus />
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          {/* Top bar */}
          <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-semibold">Chat</h2>
            <div className="w-6" /> {/* Spacer for centering */}
          </header>

          {/* Chat interface */}
          <ChatInterface />
        </main>
      </div>
    );
  }

  // For other pages, just render children
  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-card lg:static lg:z-40 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-200 ease-in-out`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-border px-6">
            <Link href="/" className="text-xl font-bold">
              EdgeDev AI
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Status indicator */}
          <div className="border-t border-border p-4">
            <SystemStatus />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-semibold">
            {navigation.find((item) => item.href === pathname)?.name || 'EdgeDev AI'}
          </h2>
          <div className="w-6" /> {/* Spacer for centering */}
        </header>

        {/* Page content will be rendered here by Next.js */}
      </main>
    </div>
  );
}

/**
 * System Status Component
 */
function SystemStatus() {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="h-2 w-2 rounded-full bg-success" />
      <span className="text-muted-foreground">System Online</span>
    </div>
  );
}

/**
 * Chat Interface Component
 */
function ChatInterface() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold">Welcome to EdgeDev AI</h1>
            <p className="text-muted-foreground">
              Archon-powered trading strategy development system
            </p>
          </div>

          {/* Messages will be rendered here */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-muted-foreground">
                Start a conversation to develop trading strategies, scanners, and backtests.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-card p-4">
        <div className="mx-auto max-w-3xl">
          <form className="flex gap-2">
            <input
              type="text"
              placeholder="Ask about trading strategies, scanners, backtests..."
              className="flex-1 rounded-lg border border-border bg-secondary px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
