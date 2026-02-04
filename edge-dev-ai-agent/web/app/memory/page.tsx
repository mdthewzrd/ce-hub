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
  Sparkles,
  TrendingUp,
  Search,
  FileText,
  Lightbulb,
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

export default function MemoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const pathname = usePathname();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:7447/api/learning/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 10 }),
      });
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

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
              <span>Knowledge Base</span>
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
            <Brain className="h-5 w-5 text-gold" />
            <h1 className="text-sm font-medium">Memory</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                <Lightbulb className="h-8 w-8 text-gold" />
                Knowledge Search
              </h2>
              <p className="text-sm text-text-muted">
                Search through strategies, patterns, insights, and learnings
              </p>
            </div>

            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for strategies, patterns, insights..."
                    className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="px-6 py-3 bg-gold text-black font-medium rounded-xl hover:bg-gold-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-gold-sm hover:shadow-glow-md flex items-center gap-2"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>

            {loading && (
              <div className="card rounded-xl p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-text-muted">Searching knowledge base...</p>
                </div>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Results ({results.length})</h3>
                {results.map((result: any, index: number) => (
                  <div key={index} className="card rounded-xl p-6 hover:border-gold/30 transition-all duration-200">
                    <div className="flex items-start gap-3 mb-3">
                      <FileText className="h-5 w-5 text-gold flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{result.title || result.type}</h4>
                        <p className="text-sm text-text-muted">{result.content}</p>
                        {result.metadata && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
                            <span className="px-2 py-1 bg-gold/10 text-gold border border-gold/20 rounded-lg">
                              {result.metadata.type}
                            </span>
                            {result.metadata.created_at && (
                              <span>{new Date(result.metadata.created_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="card rounded-xl p-12 text-center">
                <Search className="mx-auto mb-4 h-12 w-12 text-text-muted" />
                <h3 className="mb-2 text-lg font-semibold">No results found</h3>
                <p className="text-sm text-text-muted">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}

            {!loading && !query && (
              <div className="card rounded-xl p-12 text-center">
                <Brain className="mx-auto mb-4 h-16 w-16 text-gold" />
                <h3 className="mb-2 text-lg font-semibold">Search Your Knowledge</h3>
                <p className="text-sm text-text-muted mb-6">
                  Enter a query to search through all your trading strategies, patterns, and insights
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
                  {['Momentum strategies', 'V31 patterns', 'Backtest results', 'Entry signals'].map(
                    (suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setQuery(suggestion)}
                        className="px-3 py-2 text-sm bg-surface border border-border rounded-lg hover:border-gold/30 hover:bg-surface-hover transition-all duration-200"
                      >
                        {suggestion}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
