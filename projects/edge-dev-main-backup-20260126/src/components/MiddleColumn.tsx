'use client';

import React, { useState } from 'react';
import { Calendar, Play, TrendingUp, Activity } from 'lucide-react';
import { EdgeChart } from './EdgeChart';

interface ScanResult {
  date: string;
  ticker: string;
  entry: number;
  signal: string;
}

interface Stats {
  totalScanned: number;
  qualifying: number;
  passRate: string;
  lastScan: string;
}

interface MiddleColumnProps {
  scanResults?: ScanResult[];
  stats?: Stats;
  onRunScan?: (startDate: string, endDate: string) => void;
}

/**
 * Middle Column - Main Dashboard Area
 * Contains: Nav bar, Results table + Stats (side by side), Full-width chart
 */
export const MiddleColumn: React.FC<MiddleColumnProps> = ({
  scanResults = [],
  stats = {
    totalScanned: 0,
    qualifying: 0,
    passRate: '0%',
    lastScan: new Date().toISOString().split('T')[0]
  },
  onRunScan
}) => {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [selectedResult, setSelectedResult] = useState<ScanResult | null>(null);

  const handleRunScan = () => {
    onRunScan?.(startDate, endDate);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0a0a0a]">
      {/* Top Nav Bar - Compact */}
      <div className="border-b border-[#1a1a1a] p-4 bg-[#111111]">
        <div className="flex items-center justify-between gap-4">
          {/* Date Range Selector */}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-[#D4AF37]" />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 rounded bg-[#1a1a1a] border studio-border text-sm studio-text focus:outline-none focus:border-[#D4AF37]"
              />
              <span className="studio-muted">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 rounded bg-[#1a1a1a] border studio-border text-sm studio-text focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Run Scan Button */}
          <button
            onClick={handleRunScan}
            className="btn-primary flex items-center gap-2 px-4 py-2"
          >
            <Play className="h-4 w-4" />
            <span>Run Scan</span>
          </button>
        </div>
      </div>

      {/* Table & Stats Row - Side by Side */}
      <div className="grid grid-cols-2 gap-4 p-4">
        {/* Results Table */}
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg overflow-hidden">
          <div className="p-3 border-b border-[#1a1a1a]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold studio-text">Scan Results</h3>
              <span className="text-xs studio-muted">{scanResults.length} tickers</span>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[200px]">
            {scanResults.length === 0 ? (
              <div className="text-center py-8 px-4">
                <TrendingUp className="h-8 w-8 studio-muted mx-auto mb-2" />
                <p className="text-xs studio-muted">No results yet</p>
                <p className="text-xs studio-muted mt-1">Run a scan to see results</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-black sticky top-0">
                  <tr className="border-b border-[#1a1a1a]">
                    <th className="px-3 py-2 text-left text-xs font-medium studio-muted">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium studio-muted">Ticker</th>
                    <th className="px-3 py-2 text-left text-xs font-medium studio-muted">Entry</th>
                    <th className="px-3 py-2 text-left text-xs font-medium studio-muted">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {scanResults.map((result, idx) => (
                    <tr
                      key={`${result.ticker}-${result.date}-${idx}`}
                      onClick={() => {
                        setSelectedTicker(result.ticker);
                        setSelectedResult(result);
                      }}
                      className={`border-b border-[#1a1a1a] hover:bg-[#1a1a1a] cursor-pointer ${
                        selectedResult?.ticker === result.ticker && selectedResult?.date === result.date
                          ? 'bg-[#D4AF37]/20'
                          : ''
                      }`}
                    >
                      <td className="px-3 py-2 text-xs studio-muted font-mono">{result.date}</td>
                      <td className="px-3 py-2 text-sm studio-text font-semibold">{result.ticker}</td>
                      <td className="px-3 py-2 text-xs font-mono studio-text">${result.entry.toFixed(2)}</td>
                      <td className="px-3 py-2 text-xs studio-muted">{result.signal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Stats Window */}
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-[#D4AF37]" />
            <h3 className="text-sm font-semibold studio-text">Statistics</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs studio-muted mb-1">Total Scanned</div>
              <div className="text-2xl font-bold studio-text font-mono">{stats.totalScanned}</div>
            </div>
            <div>
              <div className="text-xs studio-muted mb-1">Qualifying</div>
              <div className="text-2xl font-bold text-[#10b981] font-mono">{stats.qualifying}</div>
            </div>
            <div>
              <div className="text-xs studio-muted mb-1">Pass Rate</div>
              <div className="text-lg font-semibold text-[#D4AF37] font-mono">{stats.passRate}</div>
            </div>
            <div>
              <div className="text-xs studio-muted mb-1">Last Scan</div>
              <div className="text-xs studio-text font-mono">{stats.lastScan}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Chart */}
      {/* TODO: Implement EdgeChart with proper props (symbol, timeframe, data) */}
      {/* <div className="flex-1 p-4 pt-0 overflow-hidden">
        <EdgeChart
          symbol={selectedTicker || 'SPY'}
          timeframe={'day'}
          data={[]} // TODO: Provide actual chart data
        />
      </div> */}
    </div>
  );
};

export default MiddleColumn;
