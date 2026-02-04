/**
 * EdgeDev AI Agent - Scan Page
 *
 * Premium scanner execution interface with error handling
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
  Search,
  Calendar,
  Target,
  Zap,
  ScanLine,
  Filter,
  ChevronDown,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { useToasts } from '../components/Toast';
import { edgedevApi, ApiClientError } from '../../lib/apiClient';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'Chat', href: '/', icon: MessageSquare },
  { name: 'Plan', href: '/plan', icon: Sparkles },
  { name: 'Scan', href: '/scan', icon: ScanLine },
  { name: 'Backtest', href: '/backtest', icon: TrendingUp },
  { name: 'Patterns', href: '/patterns', icon: BarChart3 },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Memory', href: '/memory', icon: Brain },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface ScanResult {
  symbol: string;
  scanner: string;
  timestamp: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
  volume: number;
  change: number;
}

export default function ScanPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [selectedScanner, setSelectedScanner] = useState('v31_gold_standard');
  const [symbol, setSymbol] = useState('SPY');
  const [dateRange, setDateRange] = useState('1D');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);

  const { show: showToast, remove: removeToast } = useToasts();
  const pathname = usePathname();

  const scanners = [
    {
      id: 'v31_gold_standard',
      name: 'V31 Gold Standard',
      description: 'Production-validated scanner',
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
      id: 'volume_surge',
      name: 'Volume Surge',
      description: 'Unusual volume detection',
      icon: TrendingUp,
      badge: 'Advanced',
      gradient: 'from-gold/20 via-gold/10 to-gold/5',
    },
    {
      id: 'gap_trader',
      name: 'Gap Trader',
      description: 'Gap & go trading',
      icon: Activity,
      badge: 'Beta',
      gradient: 'from-gold/15 via-gold/8 to-gold/5',
    },
  ];

  const executeScan = async () => {
    if (!symbol.trim()) {
      const toastId = showToast({
        type: 'warning',
        message: 'Please enter a trading symbol',
      });
      setTimeout(() => removeToast(toastId), 3000);
      return;
    }

    setScanning(true);
    setError(null);
    setResults([]);

    try {
      const response = await edgedevApi.executeScan({
        scanner_type: selectedScanner,
        symbol: symbol.toUpperCase(),
        date_range: dateRange,
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Scan execution failed');
      }

      // Process results
      const scanResults = response.data as ScanResult[];
      setResults(scanResults || []);

      // Show success toast
      const toastId = showToast({
        type: 'success',
        message: `Scan complete! Found ${scanResults?.length || 0} results`,
      });
      setTimeout(() => removeToast(toastId), 5000);

    } catch (err) {
      const error = err as ApiClientError;
      console.error('Scan error:', error);

      setError({
        message: error.message || 'Failed to execute scan',
        code: error.code,
      });

      showToast({
        type: 'error',
        message: error.message || 'Scan execution failed',
        duration: 0,
      });
    } finally {
      setScanning(false);
    }
  };

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
                <div className="text-xs text-text-muted">Scanner V2</div>
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
              <span className="text-text-gold font-medium">Scanner Ready</span>
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
                  <ScanLine className="h-5 w-5 text-black" />
                </div>
              </div>
              <div>
                <h1 className="text-base font-bold text-text-gold">Market Scanner</h1>
                <p className="text-xs text-text-muted">Real-time pattern detection</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-gold/10 text-text-muted hover:text-gold transition-all duration-200 border border-transparent hover:border-gold/30">
              <Filter className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gold/10 text-text-muted hover:text-gold transition-all duration-200 border border-transparent hover:border-gold/30">
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Scanner content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Error Display */}
            {error && (
              <ErrorMessage
                title="Scan Error"
                message={error.message}
                onRetry={() => {
                  setError(null);
                  executeScan();
                }}
                onDismiss={() => setError(null)}
              />
            )}

            {/* Loading State */}
            {scanning && (
              <div className="card p-12 flex flex-col items-center justify-center">
                <LoadingSpinner size="lg" text="Executing market scan..." />
                <p className="text-xs text-text-muted mt-4">
                  Scanning {symbol} using {scanners.find(s => s.id === selectedScanner)?.name}
                </p>
              </div>
            )}

            {/* Scanner Selection */}
            {!scanning && (
              <div className="card p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                <div className="relative">
                  <h2 className="text-lg font-bold text-text-gold mb-2 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Select Scanner
                  </h2>
                  <p className="text-sm text-text-muted mb-6">Choose a scanner to execute</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {scanners.map((scanner) => {
                      const Icon = scanner.icon;
                      const isSelected = selectedScanner === scanner.id;

                      return (
                        <button
                          key={scanner.id}
                          onClick={() => setSelectedScanner(scanner.id)}
                          onMouseEnter={() => setHoveredCard(`scanner-${scanner.id}`)}
                          onMouseLeave={() => setHoveredCard(null)}
                          className={`relative overflow-hidden rounded-xl border p-5 text-left transition-all duration-300 hover-lift ${
                            isSelected
                              ? 'border-gold bg-gradient-to-br from-gold/20 to-gold/5 shadow-gold-md'
                              : 'border-gold/15 bg-surface hover:border-gold/40 hover:bg-gold/10 hover:shadow-gold-sm'
                          }`}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${scanner.gradient} opacity-0 ${isSelected || hoveredCard === `scanner-${scanner.id}` ? 'opacity-100' : ''} transition-opacity duration-300`} />
                          <div className="relative">
                            <div className="flex items-start justify-between mb-3">
                              <div className={`p-2 rounded-lg ${isSelected ? 'bg-gold/20' : 'bg-gold/10'} border ${isSelected ? 'border-gold/50' : 'border-gold/30'} transition-all duration-300`}>
                                <Icon className={`h-6 w-6 ${isSelected ? 'text-gold' : 'text-text-muted'}`} />
                              </div>
                              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold">
                                {scanner.badge}
                              </span>
                            </div>
                            <div className="text-sm font-bold text-text-primary mb-1">{scanner.name}</div>
                            <div className="text-xs text-text-muted">{scanner.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Scan Parameters */}
            {!scanning && (
              <div className="card p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                <div className="relative">
                  <h2 className="text-lg font-bold text-text-gold mb-2 flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    Scan Parameters
                  </h2>
                  <p className="text-sm text-text-muted mb-6">Configure your scan settings</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Symbol Input */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-text-gold">
                        Symbol
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                        <input
                          type="text"
                          value={symbol}
                          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                          className="input pl-10 pr-4 py-2.5"
                          placeholder="SPY, QQQ, AAPL..."
                          disabled={scanning}
                        />
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-text-gold">
                        Date Range
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                        <select
                          value={dateRange}
                          onChange={(e) => setDateRange(e.target.value)}
                          className="input pl-10 pr-10 py-2.5 appearance-none cursor-pointer"
                          disabled={scanning}
                        >
                          <option value="1D">1 Day</option>
                          <option value="1W">1 Week</option>
                          <option value="1M">1 Month</option>
                          <option value="3M">3 Months</option>
                          <option value="YTD">Year to Date</option>
                          <option value="1Y">1 Year</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
                      </div>
                    </div>

                    {/* Execute Button */}
                    <div className="flex items-end">
                      <button
                        onClick={executeScan}
                        disabled={scanning}
                        className="btn btn-primary w-full py-2.5 gap-2"
                      >
                        {scanning ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Scanning...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Execute Scan
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Scan Results */}
            {results.length > 0 && !scanning && (
              <div className="card p-6 relative overflow-hidden group animate-fade-in">
                <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-text-gold flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Scan Results
                      </h2>
                      <p className="text-sm text-text-muted mt-1">
                        {results.length} {results.length === 1 ? 'result' : 'results'} found
                      </p>
                    </div>
                    <button className="btn btn-secondary gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gold/10">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-text-gold">Symbol</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-text-gold">Scanner</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-text-gold">Signal</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-text-gold">Confidence</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-text-gold">Price</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-text-gold">Change</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-text-gold">Volume</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((result, index) => (
                          <tr
                            key={index}
                            className="border-b border-gold/5 hover:bg-gold/5 transition-all duration-200 group/row"
                          >
                            <td className="py-4 px-4">
                              <div className="font-bold text-text-primary">{result.symbol}</div>
                              <div className="flex items-center gap-1 text-xs text-text-muted mt-1">
                                <Clock className="h-3 w-3" />
                                {new Date(result.timestamp).toLocaleString()}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm font-medium text-text-primary">{result.scanner}</div>
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                  result.signal === 'BUY'
                                    ? 'bg-green-500/10 text-green-500 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                                    : result.signal === 'SELL'
                                      ? 'bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                                      : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                                }`}
                              >
                                {result.signal}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-20 h-2 bg-surface-active rounded-full overflow-hidden border border-gold/10">
                                  <div
                                    className="h-full bg-gradient-gold transition-all duration-500 shadow-glow-sm"
                                    style={{ width: `${result.confidence * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-bold text-text-gold">
                                  {Math.round(result.confidence * 100)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm font-mono font-bold text-text-primary">
                                ${result.price.toFixed(2)}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className={`text-sm font-mono font-bold ${result.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {result.change >= 0 ? '+' : ''}{result.change.toFixed(2)}%
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm font-mono text-text-muted">
                                {result.volume.toLocaleString()}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
