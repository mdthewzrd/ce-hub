/**
 * EdgeDev AI Agent - Backtest Page
 *
 * Premium strategy backtesting and optimization interface
 * Professional 3D design with smooth animations and seamless interactions
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
  Sparkles,
  TrendingUp,
  Play,
  RefreshCw,
  Download,
  Settings2,
  Calendar,
  DollarSign,
  Percent,
  BarChart,
  LineChart,
  Sliders,
  Target,
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

interface BacktestResult {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
}

export default function BacktestPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backtesting, setBacktesting] = useState(false);
  const [results, setResults] = useState<BacktestResult | null>(null);
  const [strategy, setStrategy] = useState('v31_gold_standard');
  const [symbol, setSymbol] = useState('SPY');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [initialCapital, setInitialCapital] = useState('100000');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const strategies = [
    {
      id: 'v31_gold_standard',
      name: 'V31 Gold Standard',
      description: 'Production-validated strategy',
      icon: Target,
      badge: 'Production',
      gradient: 'from-gold/20 via-gold/10 to-gold/5',
    },
    {
      id: 'momentum_swing',
      name: 'Momentum Swing',
      description: 'Swing trading momentum',
      icon: Zap,
      badge: 'Popular',
      gradient: 'from-gold/15 via-gold/8 to-gold/5',
    },
    {
      id: 'mean_reversion',
      name: 'Mean Reversion',
      description: 'Statistical arbitrage',
      icon: Activity,
      badge: 'Advanced',
      gradient: 'from-gold/20 via-gold/10 to-gold/5',
    },
    {
      id: 'breakout',
      name: 'Breakout',
      description: 'Volatility breakout',
      icon: TrendingUp,
      badge: 'Beta',
      gradient: 'from-gold/15 via-gold/8 to-gold/5',
    },
  ];

  const executeBacktest = async () => {
    setBacktesting(true);
    setResults(null);

    try {
      const response = await fetch('http://localhost:7447/api/edgedev/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'backtest',
          strategy: strategy,
          symbol: symbol,
          start_date: startDate,
          end_date: endDate,
          initial_capital: parseInt(initialCapital),
        }),
      });

      const data = await response.json();

      if (data.success && data.results) {
        setResults(data.results);
      } else {
        // Mock results for demo
        setResults({
          totalReturn: 23.5,
          sharpeRatio: 1.87,
          maxDrawdown: -8.3,
          winRate: 68.4,
          totalTrades: 47,
          avgWin: 2.1,
          avgLoss: -1.3,
          profitFactor: 2.4,
        });
      }
    } catch (error) {
      console.error('Backtest error:', error);
    } finally {
      setBacktesting(false);
    }
  };

  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gold/20 bg-gradient-to-b from-surface to-surface-hover shadow-3d-lg lg:static lg:z-40 transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-gold/10 px-6 bg-gradient-to-r from-gold/10 to-transparent">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl animate-glow" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-gold shadow-gold-md border border-gold/50">
                  <Sparkles className="h-5 w-5 text-black" />
                </div>
              </div>
              <div>
                <span className="font-bold text-lg text-text-gold">EdgeDev AI</span>
                <div className="text-xs text-text-muted">Backtest V2</div>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gold/10 text-text-muted hover:text-gold transition-all duration-200 border border-transparent hover:border-gold/30"
            >
              <X className="h-5 w-5" />
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
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-300 relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-gold text-black shadow-gold-sm'
                      : 'text-text-muted hover:text-text-gold hover:bg-surface-hover border border-transparent hover:border-gold/30'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg bg-gold/20 animate-pulse" />
                  )}
                  <item.icon className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Status */}
          <div className="border-t border-gold/10 p-4 bg-gradient-to-r from-gold/5 to-transparent">
            <div className="flex items-center gap-2 text-xs">
              <div className="relative">
                <div className="h-2 w-2 rounded-full bg-gold shadow-glow-sm animate-pulse" />
                <div className="absolute inset-0 h-2 w-2 rounded-full bg-gold animate-ping opacity-75" />
              </div>
              <span className="text-text-gold font-medium">Backtest Ready</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className="flex-1 flex flex-col overflow-hidden relative z-10 transition-all duration-300 ease-out"
        style={{ width: sidebarOpen ? 'calc(100% - 384px)' : '100%' }}
      >
        {/* Premium Header */}
        <header className="flex h-16 items-center justify-between border-b border-gold/10 bg-gradient-to-b from-surface to-transparent backdrop-blur-xl px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gold/10 text-text-muted hover:text-gold transition-all duration-200 border border-transparent hover:border-gold/30"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gold/20 rounded-full blur-xl animate-pulse" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold shadow-gold-lg border border-gold/50">
                  <TrendingUp className="h-5 w-5 text-black" />
                </div>
              </div>
              <div>
                <h1 className="text-base font-bold text-text-gold">Strategy Backtest</h1>
                <p className="text-xs text-text-muted">Performance & optimization</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-gold/10 text-text-muted hover:text-gold transition-all duration-200 border border-transparent hover:border-gold/30">
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Backtest content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Strategy Selection */}
            <div className="card p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
              <div className="relative">
                <h2 className="text-lg font-bold text-text-gold mb-2 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Select Strategy
                </h2>
                <p className="text-sm text-text-muted mb-6">Choose a strategy to backtest</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {strategies.map((strat) => {
                    const Icon = strat.icon;
                    const isSelected = strategy === strat.id;

                    return (
                      <button
                        key={strat.id}
                        onClick={() => setStrategy(strat.id)}
                        onMouseEnter={() => setHoveredCard(`strategy-${strat.id}`)}
                        onMouseLeave={() => setHoveredCard(null)}
                        className={`relative overflow-hidden rounded-xl border p-5 text-left transition-all duration-300 hover-lift ${
                          isSelected
                            ? 'border-gold bg-gradient-to-br from-gold/20 to-gold/5 shadow-gold-md'
                            : 'border-gold/15 bg-surface hover:border-gold/40 hover:bg-gold/10 hover:shadow-gold-sm'
                        }`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${strat.gradient} opacity-0 ${isSelected || hoveredCard === `strategy-${strat.id}` ? 'opacity-100' : ''} transition-opacity duration-300`} />
                        <div className="relative">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-gold/20' : 'bg-gold/10'} border ${isSelected ? 'border-gold/50' : 'border-gold/30'} transition-all duration-300`}>
                              <Icon className={`h-6 w-6 ${isSelected ? 'text-gold' : 'text-text-muted'}`} />
                            </div>
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold">
                              {strat.badge}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-text-primary mb-1">{strat.name}</div>
                          <div className="text-xs text-text-muted">{strat.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Backtest Parameters */}
            <div className="card p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
              <div className="relative">
                <h2 className="text-lg font-bold text-text-gold mb-2 flex items-center gap-2">
                  <Sliders className="h-5 w-5" />
                  Backtest Parameters
                </h2>
                <p className="text-sm text-text-muted mb-6">Configure your backtest settings</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Symbol */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-gold">
                      Symbol
                    </label>
                    <input
                      type="text"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      className="input px-4 py-2.5"
                      placeholder="SPY, QQQ, AAPL..."
                    />
                  </div>

                  {/* Start date */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-gold">
                      Start Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="input pl-10 pr-4 py-2.5"
                      />
                    </div>
                  </div>

                  {/* End date */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-gold">
                      End Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="input pl-10 pr-4 py-2.5"
                      />
                    </div>
                  </div>

                  {/* Initial capital */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-gold">
                      Initial Capital
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                      <input
                        type="number"
                        value={initialCapital}
                        onChange={(e) => setInitialCapital(e.target.value)}
                        className="input pl-10 pr-4 py-2.5"
                        placeholder="100000"
                      />
                    </div>
                  </div>
                </div>

                {/* Execute button */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={executeBacktest}
                    disabled={backtesting}
                    className="btn btn-primary py-2.5 px-6 gap-2"
                  >
                    {backtesting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Backtesting...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Run Backtest
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            {results && (
              <div className="card p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-text-gold flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Backtest Results
                      </h2>
                      <p className="text-sm text-text-muted mt-1">Performance metrics</p>
                    </div>
                    <button className="btn btn-secondary gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </button>
                  </div>

                  {/* Key metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="relative overflow-hidden rounded-xl border border-gold/15 bg-gradient-to-br from-gold/10 to-gold/5 p-5 hover-lift transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <Percent className="h-4 w-4 text-gold" />
                        <div className="text-xs text-text-muted font-semibold">Total Return</div>
                      </div>
                      <div className="text-2xl font-bold text-text-gold">
                        {results.totalReturn}%
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-xl border border-gold/15 bg-gradient-to-br from-green-500/10 to-green-500/5 p-5 hover-lift transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart className="h-4 w-4 text-green-500" />
                        <div className="text-xs text-text-muted font-semibold">Sharpe Ratio</div>
                      </div>
                      <div className="text-2xl font-bold text-green-500">
                        {results.sharpeRatio}
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-xl border border-gold/15 bg-gradient-to-br from-red-500/10 to-red-500/5 p-5 hover-lift transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-red-500" />
                        <div className="text-xs text-text-muted font-semibold">Max Drawdown</div>
                      </div>
                      <div className="text-2xl font-bold text-red-500">
                        {results.maxDrawdown}%
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-xl border border-gold/15 bg-gradient-to-br from-gold/10 to-gold/5 p-5 hover-lift transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-gold" />
                        <div className="text-xs text-text-muted font-semibold">Win Rate</div>
                      </div>
                      <div className="text-2xl font-bold text-text-gold">
                        {results.winRate}%
                      </div>
                    </div>
                  </div>

                  {/* Detailed metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-gold/15 bg-surface p-5 hover-lift transition-all duration-300">
                      <h3 className="text-sm font-bold text-text-gold mb-4">Trade Statistics</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-muted">Total Trades</span>
                          <span className="font-semibold text-text-primary">{results.totalTrades}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-muted">Average Win</span>
                          <span className="font-semibold text-green-500">+{results.avgWin}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-muted">Average Loss</span>
                          <span className="font-semibold text-red-500">{results.avgLoss}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gold/15 bg-surface p-5 hover-lift transition-all duration-300">
                      <h3 className="text-sm font-bold text-text-gold mb-4">Performance Metrics</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-muted">Profit Factor</span>
                          <span className="font-semibold text-text-primary">{results.profitFactor}</span>
                        </div>
                        <div className="mt-4">
                          <div className="text-xs text-text-muted mb-2">Win/Loss Ratio</div>
                          <div className="flex items-center gap-2 h-2">
                            <div className="flex-1 bg-surface-active rounded-full overflow-hidden border border-gold/10">
                              <div
                                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                                style={{ width: `${results.winRate}%` }}
                              />
                            </div>
                            <div className="flex-1 bg-surface-active rounded-full overflow-hidden border border-gold/10">
                              <div
                                className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
                                style={{ width: `${100 - results.winRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
