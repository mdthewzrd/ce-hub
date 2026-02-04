'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useHealth } from '@/lib/hooks';
import {
  MessageSquare,
  BarChart3,
  FolderOpen,
  Brain,
  Settings,
  Activity,
  Menu,
  X,
  Sparkles,
  TrendingUp,
  Server,
  Code,
  Zap,
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

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { health, isHealthy } = useHealth();
  const pathname = usePathname();


  return (
    <div className="flex h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-surface lg:static lg:z-40 lg:translate-x-0 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
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

          <div className="border-t border-border p-4">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <div className="h-2 w-2 rounded-full bg-gold shadow-[0_0_0_2px_rgba(212,175,55,0.3)]" />
              <span>System Ready</span>
            </div>
          </div>
        </div>
      </aside>

      <main
        className="flex-1 flex flex-col overflow-hidden relative z-10 transition-all duration-300 ease-out"
        style={{ width: sidebarOpen ? 'calc(100% - 384px)' : '100%' }}
      >
        <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded hover:bg-surface-hover text-text-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-gold" />
            <h1 className="text-sm font-medium">Settings</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">System Settings</h2>
              <p className="text-sm text-text-muted">
                Configure your EdgeDev AI environment
              </p>
            </div>

            <div className="card rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Server className="h-5 w-5 text-gold" />
                System Status
              </h3>

              <div className="space-y-1">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-text-muted">API Status</span>
                  <span
                    className={`font-semibold ${
                      isHealthy ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {health?.status || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-text-muted">Version</span>
                  <span className="font-semibold">
                    {health?.version || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-text-muted">Knowledge Base</span>
                  <span className="font-semibold text-green-500">
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-text-muted">Backend</span>
                  <span className="font-semibold text-green-500">
                    Connected
                  </span>
                </div>
              </div>
            </div>

            <div className="card rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Code className="h-5 w-5 text-gold" />
                Configuration
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-muted">
                    Backend URL
                  </label>
                  <input
                    type="text"
                    defaultValue="http://localhost:7447"
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-text-muted">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    defaultValue={30}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Auto-save strategies</p>
                    <p className="text-sm text-text-muted">
                      Automatically save generated strategies
                    </p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gold transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2">
                    <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                  </button>
                </div>
              </div>
            </div>

            <div className="card rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-gold" />
                Enabled Features
              </h3>

              <div className="space-y-3">
                {[
                  { name: 'Strategy Generation', enabled: true },
                  { name: 'Scanner Execution', enabled: true },
                  { name: 'Backtesting', enabled: true },
                  { name: 'Pattern Recognition', enabled: true },
                  { name: 'Knowledge Graph', enabled: true },
                  { name: 'Real-time Updates', enabled: false },
                ].map((feature) => (
                  <div
                    key={feature.name}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm">{feature.name}</span>
                    <span
                      className={`px-2 py-1 text-xs font-semibold border rounded-lg ${
                        feature.enabled
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}
                    >
                      {feature.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
