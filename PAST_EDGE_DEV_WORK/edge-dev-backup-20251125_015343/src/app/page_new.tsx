'use client'

import { useState, useEffect } from 'react';
import EdgeChart, { ChartData } from '@/components/EdgeChart';
import { Timeframe, GLOBAL_CHART_TEMPLATES } from '@/config/globalChartConfig';
import TradingViewToggle from '@/components/TradingViewToggle';
import { CodeFormatterService } from '@/utils/codeFormatterAPI';
import { fetchPolygonData, calculateVWAP, calculateEMA, calculateATR, PolygonBar } from '@/utils/polygonData';

// Define IndicatorData type locally
interface IndicatorData {
  [key: string]: any;
}

// Real data fetcher using Polygon API (exact wzrd-algo implementation)
async function fetchRealData(symbol: string = "SPY", timeframe: Timeframe): Promise<{ chartData: ChartData; indicators: IndicatorData } | null> {
  const template = GLOBAL_CHART_TEMPLATES[timeframe];

  try {
    // Fetch real market data from Polygon API
    const bars = await fetchPolygonData(symbol, timeframe, template.defaultDays + template.warmupDays);

    if (!bars || bars.length === 0) {
      console.error(`No data received for ${symbol} ${timeframe}`);
      return null;
    }

    console.log(`Processing ${bars.length} bars for ${symbol} ${timeframe}`);

    // Convert Polygon data to chart format
    const dates = bars.map(bar => new Date(bar.t).toISOString());
    const opens = bars.map(bar => bar.o);
    const highs = bars.map(bar => bar.h);
    const lows = bars.map(bar => bar.l);
    const closes = bars.map(bar => bar.c);
    const volumes = bars.map(bar => bar.v);

    // Calculate indicators (exact wzrd-algo implementation)
    const vwaps = calculateVWAP(bars);
    const ema9s = calculateEMA(closes, 9);
    const ema20s = calculateEMA(closes, 20);
    const ema72s = calculateEMA(closes, 72);
    const ema89s = calculateEMA(closes, 89);

    // Calculate ATR deviation bands for 72/89 system (wzrd-algo style)
    let upperBand72s: number[] | undefined;
    let lowerBand72s: number[] | undefined;

    if (ema72s && ema89s) {
      const atr72 = calculateATR(bars, 72);
      const atr89 = calculateATR(bars, 89);

      upperBand72s = ema72s.map((ema72, i) => ema72 + (7.4 * atr72[i]));
      lowerBand72s = ema89s.map((ema89, i) => ema89 - (7.4 * atr89[i]));
    }

    // Get previous close (for hourly/15min charts)
    let prevClose: number | undefined;
    if (closes.length > 1) {
      prevClose = closes[closes.length - 2]; // Previous bar's close
    }

    // Slice to display window if needed (keep warmup data for indicators)
    const displayBars = Math.floor(template.defaultDays * template.barsPerDay);
    const startIdx = Math.max(0, dates.length - displayBars);

    return {
      chartData: {
        x: dates.slice(startIdx),
        open: opens.slice(startIdx),
        high: highs.slice(startIdx),
        low: lows.slice(startIdx),
        close: closes.slice(startIdx),
        volume: volumes.slice(startIdx),
      },
      indicators: {
        vwap: vwaps?.slice(startIdx),
        prevClose,
        ema9: ema9s?.slice(startIdx),
        ema20: ema20s?.slice(startIdx),
        ema72: ema72s?.slice(startIdx),
        ema89: ema89s?.slice(startIdx),
        upperBand72: upperBand72s?.slice(startIdx),
        lowerBand72: lowerBand72s?.slice(startIdx),
      }
    };

  } catch (error) {
    console.error(`Error fetching real data for ${symbol}:`, error);
    return null;
  }
}

// Helper function for SMA calculation (fallback)
function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(data[i]); // Not enough data for full period
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

// Mock scan results data
const mockScanResults = [
  { ticker: 'SPY', gapPercent: 53.5, volume: 11518000, rMultiple: 8.67 },
  { ticker: 'WOLF', gapPercent: 699.7, volume: 1506000, rMultiple: 814.73 },
  { ticker: 'META', gapPercent: 12.3, volume: 8420000, rMultiple: 3.21 },
  { ticker: 'TSLA', gapPercent: -8.5, volume: 6210000, rMultiple: -2.14 },
  { ticker: 'AAPL', gapPercent: 4.7, volume: 5890000, rMultiple: 1.89 },
  { ticker: 'NVDA', gapPercent: 15.2, volume: 7530000, rMultiple: 4.56 },
  { ticker: 'GOOGL', gapPercent: -3.2, volume: 3840000, rMultiple: -0.92 },
  { ticker: 'AMZN', gapPercent: 7.8, volume: 4920000, rMultiple: 2.34 }
];

export default function TradingPlatform() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('hour');
  const [selectedTicker, setSelectedTicker] = useState('SPY'); // Default to SPY like wzrd-algo
  const [isFormatting, setIsFormatting] = useState(false);
  const [uploadMode, setUploadMode] = useState<'finalized' | 'format' | null>(null);
  const [chartData, setChartData] = useState<{ chartData: ChartData; indicators: IndicatorData } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load real data when component mounts or parameters change
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      console.log(`Loading real data for ${selectedTicker} ${selectedTimeframe}`);

      const data = await fetchRealData(selectedTicker, selectedTimeframe);

      if (data) {
        setChartData(data);
        console.log(`Successfully loaded data for ${selectedTicker} ${selectedTimeframe}`);
      } else {
        console.error(`Failed to load data for ${selectedTicker} ${selectedTimeframe}`);
        // Keep existing data if new data fails to load
      }

      setIsLoading(false);
    };

    loadData();
  }, [selectedTicker, selectedTimeframe]);

  const handleUploadCode = async (file: File) => {
    setIsFormatting(true);

    try {
      const code = await file.text();
      console.log('Processing uploaded code:', code.substring(0, 100) + '...');

      if (uploadMode === 'format') {
        // Format the code using the existing formatter
        const result = await CodeFormatterService.formatTradingCode(code, {
          addImports: true,
          fixIndentation: true,
          addDocstrings: true,
          optimizeCode: true
        });

        if (result.success) {
          console.log('Code formatted successfully');
          // Here you could display the formatted code or download it
          const blob = new Blob([result.formattedCode], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'formatted_' + file.name;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          console.error('Formatting failed:', result.errors);
        }
      } else {
        // Handle finalized code upload
        console.log('Processing finalized code');
      }
    } catch (error) {
      console.error('Error processing upload:', error);
    } finally {
      setIsFormatting(false);
      setUploadMode(null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUploadCode(file);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
              <span className="text-black font-bold">E</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Edge.dev</h1>
              <p className="text-sm text-gray-400">Trading Platform</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Gap Up Scanner</span>
              <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                Professional trading analysis dashboard
              </span>
            </div>

            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 flex items-center space-x-2">
                <span>📊</span>
                <span>Table</span>
              </button>
              <button className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600 flex items-center space-x-2">
                <span>📈</span>
                <span>Chart</span>
              </button>
              <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 flex items-center space-x-2">
                <span>▶️</span>
                <span>Run Scan</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-64 bg-gray-900 border-r border-gray-800 p-4">
          {/* Upload Code Button */}
          <div className="mb-6">
            <button
              onClick={() => setUploadMode('format')}
              className="w-full bg-yellow-500 text-black px-4 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors flex items-center justify-center space-x-2"
            >
              <span>⬆️</span>
              <span>Upload Code</span>
            </button>
          </div>

          {/* Projects */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Projects</h3>
            <div className="space-y-6"> {/* Increased spacing from space-y-4 to space-y-6 */}
              <div>
                <div className="text-sm text-yellow-500 font-medium mb-1">Gap Up Scanner</div>
                <div className="text-xs text-gray-500">active</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 font-medium mb-1">Breakout Strategy</div>
                <div className="text-xs text-gray-500">inactive</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 font-medium mb-1">Volume Surge</div>
                <div className="text-xs text-gray-500">inactive</div>
              </div>
            </div>
          </div>

          {/* TradingView Toggle */}
          <TradingViewToggle
            value="chart"
            onChange={(value) => console.log('View changed to:', value)}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Chart Section */}
          <div className="flex-1 p-6">
            <div className="bg-gray-900 rounded-lg border border-gray-800 h-full">
              <div className="p-4 border-b border-gray-800">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">📈</span>
                  <span className="text-sm font-medium">Chart Analysis</span>
                </div>
              </div>

              <div className="p-4 h-[calc(100%-60px)]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <div className="text-sm text-gray-400">Loading {selectedTicker} data...</div>
                    </div>
                  </div>
                ) : chartData ? (
                  <EdgeChart
                    symbol={selectedTicker}
                    timeframe={selectedTimeframe}
                    data={chartData.chartData}
                    onTimeframeChange={setSelectedTimeframe}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-gray-400 mb-2">Failed to load chart data</div>
                      <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Scan Results */}
              <div className="bg-gray-900 rounded-lg border border-gray-800">
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">🔍</span>
                    <span className="text-sm font-medium">Scan Results</span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-700">
                          <th className="text-left py-2 font-medium">TICKER</th>
                          <th className="text-left py-2 font-medium">GAP %</th>
                          <th className="text-left py-2 font-medium">VOL</th>
                          <th className="text-left py-2 font-medium">R-MULT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockScanResults.map((result, index) => (
                          <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer"
                              onClick={() => setSelectedTicker(result.ticker)}>
                            <td className="py-2 text-white font-medium">{result.ticker}</td>
                            <td className={`py-2 ${result.gapPercent > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {result.gapPercent > 0 ? '+' : ''}{result.gapPercent}%
                            </td>
                            <td className="py-2 text-gray-300">{(result.volume / 1000000).toFixed(1)}M</td>
                            <td className={`py-2 ${result.rMultiple > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {result.rMultiple > 0 ? '+' : ''}{result.rMultiple}R
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-gray-900 rounded-lg border border-gray-800">
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">📊</span>
                    <span className="text-sm font-medium">Statistics</span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">8</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">TOTAL</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400 mb-1">296.7%</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">AVG GAP</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-300 mb-1">4.2M</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">AVG VOL</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-300 mb-1">$45-$385</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">RANGE</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Upload Trading Code</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Choose upload type:</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setUploadMode('finalized')}
                    className={`w-full p-3 rounded border text-left ${
                      uploadMode === 'finalized'
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium">Finalized Code</div>
                    <div className="text-sm text-gray-400">Ready-to-run trading code</div>
                  </button>

                  <button
                    onClick={() => setUploadMode('format')}
                    className={`w-full p-3 rounded border text-left ${
                      uploadMode === 'format'
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium">Format & Optimize</div>
                    <div className="text-sm text-gray-400">Raw code that needs formatting</div>
                  </button>
                </div>
              </div>

              <div>
                <input
                  type="file"
                  accept=".py,.txt,.json"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-600"
                  disabled={isFormatting}
                />
              </div>

              {isFormatting && (
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setUploadMode(null)}
                className="px-4 py-2 text-gray-400 hover:text-white"
                disabled={isFormatting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}