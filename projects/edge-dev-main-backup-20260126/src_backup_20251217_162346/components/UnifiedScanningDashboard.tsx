'use client'

/**
 * Unified Scanning Dashboard - Edge-dev
 *
 * Comprehensive dashboard integrating:
 * - Scanner selection and configuration
 * - Scan result visualization
 * - Real-time chart analysis
 * - AI-powered backtesting insights via Renata
 * - Project management workflow
 *
 * Uses complete Traderra styling system for professional appearance
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Target,
  BarChart3,
  Brain,
  Settings,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Clock,
  Database,
  Filter,
  Search,
  Save,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

import EdgeChart, { ChartData } from '@/components/EdgeChart';
import AguiRenataChat from '@/components/AguiRenataChat';
import { ScannerSelector } from '@/components/projects/ScannerSelector';
import EnhancedProjectSidebar from '@/components/EnhancedProjectSidebar';
import SavedScansSidebar from '@/components/SavedScansSidebar';
import { Timeframe } from '@/config/globalChartConfig';
import { useSavedScans } from '@/hooks/useSavedScans';

// Types for scan results
interface ScanResult {
  id: string;
  ticker: string;
  date: string;
  pattern: string;
  confidence: number;
  price: number;
  volume: number;
  scanner_name: string;
  parameters: any;
}

interface ProjectScannerConfig {
  scanner_id: string;
  enabled: boolean;
  weight: number;
  order_index: number;
  parameters: any;
}

interface UnifiedScanningDashboardProps {
  onClose?: () => void;
}

export const UnifiedScanningDashboard: React.FC<UnifiedScanningDashboardProps> = ({ onClose }) => {
  // State management
  const [selectedSymbol, setSelectedSymbol] = useState<string>('SPY');
  const [timeframe, setTimeframe] = useState<Timeframe>('5min');
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [scannerConfigs, setScannerConfigs] = useState<ProjectScannerConfig[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'scanners' | 'results' | 'charts' | 'analysis'>('scanners');
  const [selectedScanResult, setSelectedScanResult] = useState<ScanResult | null>(null);

  // Saved scans management
  const {
    savedScans,
    isLoading: scansLoading,
    deleteScan: handleDeleteScan,
    renameScan: handleRenameScan,
    toggleFavorite: handleToggleFavorite,
    loadScan: handleLoadScan
  } = useSavedScans({
    autoLoadOnMount: true,
    onScanLoaded: (scan) => {
      console.log(`Loaded scan: ${scan.name}`);
      // Here you could load the scan's parameters into the scanner configuration
    },
    onError: (error) => {
      console.error('Saved scans error:', error);
    }
  });

  // Mock chart data for demonstration
  const generateMockChartData = useCallback((): ChartData => {
    const now = new Date();
    const data: ChartData = {
      x: [],
      open: [],
      high: [],
      low: [],
      close: [],
      volume: []
    };

    for (let i = 0; i < 100; i++) {
      const time = new Date(now.getTime() - (100 - i) * 5 * 60 * 1000);
      const basePrice = 400 + Math.sin(i / 10) * 20;
      const volatility = 2;

      const open = basePrice + (Math.random() - 0.5) * volatility;
      const high = open + Math.random() * volatility;
      const low = open - Math.random() * volatility;
      const close = low + Math.random() * (high - low);

      data.x.push(time.toISOString());
      data.open.push(open);
      data.high.push(high);
      data.low.push(low);
      data.close.push(close);
      data.volume.push(Math.floor(Math.random() * 1000000) + 500000);
    }

    return data;
  }, []);

  // Mock scan results for demonstration
  const generateMockScanResults = useCallback((): ScanResult[] => {
    const patterns = ['LC Breakout', 'DMR Setup', 'Volume Spike', 'Support Break'];
    const tickers = ['SPY', 'AAPL', 'MSFT', 'TSLA', 'NVDA', 'META', 'GOOGL'];

    return Array.from({ length: 15 }, (_, i) => ({
      id: `scan_${i}`,
      ticker: tickers[Math.floor(Math.random() * tickers.length)],
      date: new Date().toISOString().split('T')[0],
      pattern: patterns[Math.floor(Math.random() * patterns.length)],
      confidence: Math.floor(Math.random() * 40) + 60, // 60-100%
      price: Math.floor(Math.random() * 200) + 100,
      volume: Math.floor(Math.random() * 5000000) + 1000000,
      scanner_name: `Scanner_${Math.floor(Math.random() * 5) + 1}`,
      parameters: { param1: 'value1', param2: 'value2' }
    }));
  }, []);

  // Initialize data
  useEffect(() => {
    setChartData(generateMockChartData());
    setScanResults(generateMockScanResults());
  }, [generateMockChartData, generateMockScanResults]);

  // Handle scan execution
  const handleRunScan = async () => {
    setIsScanning(true);
    setScanProgress(0);

    // Simulate scan progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setScanResults(generateMockScanResults());
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Handle chart symbol change
  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
    setChartData(generateMockChartData());
  };

  // Handle scan result selection
  const handleScanResultSelect = (result: ScanResult) => {
    setSelectedScanResult(result);
    setSelectedSymbol(result.ticker);
    setChartData(generateMockChartData());
    setActiveTab('charts');
  };

  return (
    <div className="h-screen studio-bg flex" style={{ color: 'var(--studio-text)' }}>
      {/* Left Sidebar - Projects & Saved Scans */}
      <div className="w-80 flex flex-col border-r" style={{ borderColor: 'var(--studio-border)' }}>
        <div className="h-1/2 border-b" style={{ borderColor: 'var(--studio-border)' }}>
          <EnhancedProjectSidebar
            projects={[]}
            projectChatSessions={[]}
            onCreateProject={() => {}}
            onSelectProject={() => {}}
            onCreateChatSession={() => {}}
            onSelectChatSession={() => {}}
            onDeleteProject={() => {}}
            onDeleteChatSession={() => {}}
          />
        </div>
        <div className="h-1/2">
          <SavedScansSidebar
            savedScans={savedScans}
            onLoadScan={handleLoadScan}
            onDeleteScan={handleDeleteScan}
            onRenameScan={handleRenameScan}
            onToggleFavorite={handleToggleFavorite}
            isVisible={true}
            selectedScanId=""
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b" style={{ borderColor: 'var(--studio-border)', backgroundColor: 'var(--studio-surface)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Target className="h-6 w-6 text-studio-gold" />
                <h1 className="text-2xl font-bold">Unified Scanning Dashboard</h1>
              </div>
              <div className="text-sm" style={{ color: 'var(--studio-muted)' }}>
                Professional scanner optimization & backtesting platform
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-sm" style={{ color: 'var(--studio-muted)' }}>
                <Clock className="h-4 w-4" />
                <span>{new Date().toLocaleTimeString()}</span>
              </div>

              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white"
                >
                  Close
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-4">
            {[
              { id: 'scanners', label: 'Scanners', icon: Settings },
              { id: 'results', label: 'Results', icon: Database },
              { id: 'charts', label: 'Charts', icon: BarChart3 },
              { id: 'analysis', label: 'AI Analysis', icon: Brain }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === id
                    ? 'bg-studio-gold text-black'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Primary Content */}
          <div className="flex-1 p-6 overflow-auto">
            {/* Scanners Tab */}
            {activeTab === 'scanners' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Scanner Configuration</h2>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleRunScan}
                      disabled={isScanning}
                      className="flex items-center space-x-2 px-4 py-2 bg-studio-gold text-black rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
                    >
                      {isScanning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      <span>{isScanning ? 'Scanning...' : 'Run Scan'}</span>
                    </button>
                  </div>
                </div>

                {isScanning && (
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-400">Scan Progress</span>
                      <span className="text-blue-400">{scanProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <ScannerSelector
                  projectId={selectedProject || ''}
                  availableScanners={[]} // Would be populated from API
                  selectedScanners={scannerConfigs as any}
                  onSelectScanner={async () => {}}
                  onRemoveScanner={async () => {}}
                  onUpdateScanner={async () => {}}
                  loading={isScanning}
                />
              </div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Scan Results</h2>
                  <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--studio-muted)' }}>
                    <Database className="h-4 w-4" />
                    <span>{scanResults.length} results found</span>
                  </div>
                </div>

                <div className="flex flex-col gap-12">
                  {scanResults.map((result) => (
                    <div
                      key={result.id}
                      className="p-10 border-2 rounded-xl cursor-pointer hover:bg-gray-800/50 transition-all hover:scale-[1.02] shadow-lg"
                      style={{
                        borderColor: 'var(--studio-border)',
                        backgroundColor: 'var(--studio-surface)',
                        minHeight: '120px'
                      }}
                      onClick={() => handleScanResultSelect(result)}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-10">
                          <div className="font-semibold text-studio-gold text-xl">{result.ticker}</div>
                          <div className="text-sm px-6 py-3 rounded-lg" style={{
                            color: 'var(--studio-muted)',
                            backgroundColor: 'rgba(255, 215, 0, 0.15)',
                            border: '2px solid rgba(255, 215, 0, 0.3)'
                          }}>
                            {result.pattern}
                          </div>
                          <div className={`px-6 py-4 rounded-xl text-base font-medium ${
                            result.confidence >= 80 ? 'bg-green-600' :
                            result.confidence >= 60 ? 'bg-yellow-600 text-black' :
                            'bg-red-600'
                          }`}>
                            {result.confidence}% confidence
                          </div>
                        </div>
                        <div className="text-base font-medium" style={{ color: 'var(--studio-muted)' }}>
                          ${result.price.toFixed(2)} | {(result.volume / 1000000).toFixed(1)}M vol
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Charts Tab */}
            {activeTab === 'charts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Chart Analysis</h2>
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedSymbol}
                      onChange={(e) => handleSymbolChange(e.target.value)}
                      className="px-3 py-2 rounded border"
                      style={{ backgroundColor: 'var(--studio-surface)', borderColor: 'var(--studio-border)', color: 'var(--studio-text)' }}
                    >
                      <option value="SPY">SPY</option>
                      <option value="AAPL">AAPL</option>
                      <option value="MSFT">MSFT</option>
                      <option value="TSLA">TSLA</option>
                    </select>
                  </div>
                </div>

                {selectedScanResult && (
                  <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center space-x-3 text-sm">
                      <Info className="h-4 w-4 text-blue-400" />
                      <span className="text-blue-300">
                        Viewing {selectedScanResult.ticker} - {selectedScanResult.pattern} pattern detected with {selectedScanResult.confidence}% confidence
                      </span>
                    </div>
                  </div>
                )}

                <div className="h-[600px]">
                  {chartData && (
                    <EdgeChart
                      symbol={selectedSymbol}
                      timeframe={timeframe}
                      data={chartData}
                      onTimeframeChange={setTimeframe}
                      className="h-full"
                    />
                  )}
                </div>
              </div>
            )}

            {/* AI Analysis Tab */}
            {activeTab === 'analysis' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">AI-Powered Analysis</h2>
                  <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--studio-muted)' }}>
                    <Brain className="h-4 w-4 text-purple-400" />
                    <span>Renata AI - Scanning & Backtesting Specialist</span>
                  </div>
                </div>

                <div className="h-[600px]">
                  <AguiRenataChat />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex-shrink-0 p-2 border-t text-xs" style={{ borderColor: 'var(--studio-border)', backgroundColor: 'var(--studio-surface)', color: 'var(--studio-muted)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-green-400" />
                <span>System Online</span>
              </div>
              <div>Backend: localhost:8000</div>
              <div>Scanners: {scannerConfigs.filter(s => s.enabled).length} active</div>
            </div>
            <div className="flex items-center space-x-4">
              <div>Results: {scanResults.length}</div>
              <div>Chart: {selectedSymbol} {timeframe}</div>
              <div>Edge-dev v2.0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedScanningDashboard;