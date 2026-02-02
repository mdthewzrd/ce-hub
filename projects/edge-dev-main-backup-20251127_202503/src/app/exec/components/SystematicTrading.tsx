'use client';

import React, { useState, useEffect } from 'react';
import { Play, Square, BarChart3, Filter, Database, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { fastApiScanService, ScanResult as FastApiScanResult } from '../../../services/fastApiScanService';

interface ScanResult {
  ticker: string;
  date: string;
  gap: number;
  pm_vol: number;
  prev_close: number;
  lc_frontside_d2_extended: boolean;
  lc_frontside_d3_extended_1: boolean;
  parabolic_score: number;
  atr: number;
  high_chg_atr?: number;
  dist_h_9ema_atr?: number;
  dist_h_20ema_atr?: number;
  v_ua?: number;
  dol_v?: number;
  c_ua?: number;
  close?: number;
  volume?: number;
}

interface BacktestResult {
  ticker: string;
  date: string;
  entry_price: number;
  exit_price: number;
  pnl: number;
  pnl_pct: number;
  win_rate: number;
  avg_win: number;
  avg_loss: number;
  total_trades: number;
  calmar_ratio: number;
  max_drawdown: number;
}

// Transform FastAPI scan results to component-expected format
function transformFastApiResults(fastApiResults: FastApiScanResult[]): ScanResult[] {
  return fastApiResults.map(result => ({
    ticker: result.ticker,
    date: result.date,
    gap: result.gap_pct || 0, // Map gap_pct to gap
    pm_vol: result.volume || 0, // Use volume as pm_vol
    prev_close: result.close || 0, // Map close to prev_close
    lc_frontside_d2_extended: Boolean(result.lc_frontside_d2_extended), // Convert to boolean
    lc_frontside_d3_extended_1: false, // Default value as not provided by FastAPI
    parabolic_score: result.parabolic_score || 0,
    atr: 1.0, // Default ATR value - could be calculated later
    // Optional properties with defaults
    high_chg_atr: 0,
    dist_h_9ema_atr: 0,
    dist_h_20ema_atr: 0,
    v_ua: result.volume || 0,
    dol_v: (result.volume || 0) * (result.close || 0),
    c_ua: result.confidence_score || 0,
    close: result.close,
    volume: result.volume
  }));
}

interface SystematicTradingProps {
  isVisible: boolean;
  onClose: () => void;
  onScanComplete?: (results: ScanResult[]) => void;
  onStrategyUploaded?: (results: ScanResult[]) => void;
  uploadedScannerCode?: string; // Add uploaded scanner code prop
}

type WorkflowStep = 'scan' | 'format' | 'backtest' | 'results' | 'execution';

const SystematicTrading: React.FC<SystematicTradingProps> = ({ isVisible, onClose, onScanComplete, onStrategyUploaded, uploadedScannerCode }) => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [formatProgress, setFormatProgress] = useState(0);
  const [backtestProgress, setBacktestProgress] = useState(0);
  const [scanStatusMessage, setScanStatusMessage] = useState('');
  const [formatStatusMessage, setFormatStatusMessage] = useState('');
  const [scanError, setScanError] = useState('');
  const [strategyLoaded, setStrategyLoaded] = useState(false);

  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Save/Load state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [scanName, setScanName] = useState('');
  const [savedScans, setSavedScans] = useState<any[]>([]);
  const [userId] = useState('default_user'); // Simple user ID for now
  const [strategyTitle, setStrategyTitle] = useState('LC Frontside D2/D3');
  const [strategyDescription, setStrategyDescription] = useState('Parabolic momentum scanner with gap analysis and volume confirmation');
  const [selectedFilters, setSelectedFilters] = useState({
    lc_frontside_d2_extended: true,
    lc_frontside_d3_extended_1: true,
    min_gap: 0.5,
    min_pm_vol: 5000000,
    min_prev_close: 0.75
  });

  // WebSocket removed - now using REST API endpoints

  useEffect(() => {
    if (isVisible) {
      // WebSocket removed - using REST API endpoints instead
      console.log('🚀 SystematicTrading modal opened');

      // Reset state when modal opens
      setCurrentStep('scan');
      setScanProgress(0);
      setFormatProgress(0);
      setBacktestProgress(0);
      setScanResults([]);
      setBacktestResults([]);
      setScanError('');

      // Load saved scans
      loadUserScans();

      // No cleanup needed for REST API approach
    }
  }, [isVisible]);

  const startScan = async () => {
    console.log('🚀 Starting systematic scan...');

    setIsScanning(true);
    setScanProgress(0);
    setScanResults([]);
    setScanStatusMessage('Initializing scan...');
    setScanError('');

    try {
      console.log('📡 Making API request via FastAPI service');

      // Use selected date range from UI
      console.log(`📅 Using date range: ${startDate} to ${endDate}`);

      let response;

      // Check if we have uploaded scanner code
      if (uploadedScannerCode) {
        console.log('  Executing uploaded scanner code');
        // Execute uploaded scanner
        const scanRequest = {
          start_date: startDate,
          end_date: endDate,
          scanner_type: 'uploaded',
          uploaded_code: uploadedScannerCode,
          use_real_scan: true,
          filters: {
            scan_type: 'uploaded_scanner',
            ...selectedFilters
          }
        };

        // Start the scan with uploaded code
        const scanResponse = await fastApiScanService.executeScan(scanRequest);

        if (!scanResponse.success) {
          throw new Error(scanResponse.message || 'Uploaded scanner execution failed');
        }

        // Wait for completion with progress tracking
        response = await fastApiScanService.waitForScanCompletion(scanResponse.scan_id, (progress, message, status) => {
          setScanProgress(progress || 0);
          setScanStatusMessage(message || 'Processing uploaded scanner...');
          console.log('📊 Uploaded scanner progress:', progress, message);
        });
      } else {
        console.log('  Executing standard LC scanner');
        // Execute standard LC scan
        response = await fastApiScanService.executeOptimizedScan({
          start_date: startDate,
          end_date: endDate,
          use_real_scan: true,
          filters: selectedFilters
        }, (progress) => {
          // Handle progress updates
          setScanProgress(progress.progress_percent || 0);
          setScanStatusMessage(progress.message || 'Processing...');
          console.log('📊 Scan progress:', progress);
        });
      }

      console.log('📡 FastAPI Response:', response);

      // Handle FastAPI response
      if (!response.success) {
        console.error('❌ FastAPI Error Response:', response.message);
        throw new Error(`Scan failed: ${response.message}`);
      }

      console.log('  FastAPI scan completed successfully!');
      console.log('📊 Scan results:', response.results?.length || 0, 'tickers found');

      // Update UI with results (transform FastAPI format to component format)
      const transformedResults = transformFastApiResults(response.results || []);
      setScanResults(transformedResults);
      setIsScanning(false);
      setScanProgress(100);
      setScanStatusMessage(`Scan completed! Found ${response.results?.length || 0} qualifying tickers. Ready to proceed to strategy formatting.`);

      // Call the parent callback to update universe stats
      if (onScanComplete) {
        onScanComplete(transformedResults);
      }

    } catch (error) {
      console.error('❌ Critical error in startScan:', error);
      setScanError(error instanceof Error ? error.message : 'Unknown error occurred');
      setIsScanning(false);
      setScanProgress(0);
      setScanStatusMessage('Scan failed to start');
    }
  };

  // Save scan results
  const saveScanResults = async () => {
    if (!scanName.trim() || scanResults.length === 0) {
      alert('Please provide a scan name and ensure you have scan results to save.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/scans/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          scan_name: scanName.trim(),
          scan_results: scanResults,
          scanner_type: 'lc',
          metadata: {
            start_date: startDate,
            end_date: endDate,
            filters: selectedFilters,
            saved_at: new Date().toISOString()
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Scan saved successfully as "${scanName}"`);
        setShowSaveDialog(false);
        setScanName('');
        await loadUserScans();
      } else {
        alert('Failed to save scan: ' + data.message);
      }
    } catch (error) {
      console.error('Error saving scan:', error);
      alert('Failed to save scan. Please try again.');
    }
  };

  // Load user's saved scans
  const loadUserScans = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/scans/user/${userId}`);
      const data = await response.json();

      if (data.success) {
        setSavedScans(data.scans);
      }
    } catch (error) {
      console.error('Error loading saved scans:', error);
    }
  };

  // Load specific scan
  const loadScan = async (scanId: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/scans/load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          scan_id: scanId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setScanResults(data.scan_data.scan_results || []);
        setStartDate(data.scan_data.metadata?.start_date || startDate);
        setEndDate(data.scan_data.metadata?.end_date || endDate);
        setSelectedFilters(data.scan_data.metadata?.filters || selectedFilters);
        setShowLoadDialog(false);
        alert(`Loaded scan: ${data.scan_data.scan_name}`);
      } else {
        alert('Failed to load scan: ' + data.message);
      }
    } catch (error) {
      console.error('Error loading scan:', error);
      alert('Failed to load scan. Please try again.');
    }
  };

  const startStrategyFormatting = async (results: ScanResult[]) => {
    console.log('  Starting strategy formatting with results:', results?.length || 0, 'tickers');

    setIsFormatting(true);
    setFormatProgress(0);
    setFormatStatusMessage('Initializing strategy formatting...');

    // Simple progress simulation
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setFormatProgress(i);
      if (i === 100) {
        setFormatStatusMessage(`Strategy formatted! Found ${results.length} qualifying tickers ready for backtesting.`);
      } else {
        setFormatStatusMessage(`Processing strategy... ${i}%`);
      }
    }

    // Formatting complete - just set loaded state
    setStrategyLoaded(true);
    setIsFormatting(false);

    // Call upload callback immediately
    if (onStrategyUploaded) {
      onStrategyUploaded(results);
    }

    console.log('  Strategy formatting complete');
  };


  const startBacktest = async () => {
    if (scanResults.length === 0) {
      alert('Please run a scan first to get ticker data');
      return;
    }

    setIsBacktesting(true);
    setBacktestProgress(0);
    setBacktestResults([]);

    try {
      const response = await fetch('/api/systematic/backtest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scan_results: scanResults,
          start_capital: 100000,
          risk_per_trade: 0.01
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start backtest');
      }

      const result = await response.json();
      console.log('Backtest initiated:', result);
    } catch (error) {
      console.error('Error starting backtest:', error);
      setIsBacktesting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg w-[95vw] h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#333333]">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-[#FFD700]" />
            <h2 className="text-xl font-medium text-white">Systematic Trading Workflow</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Workflow Steps */}
        <div className="flex border-b border-[#333333]">
          {[
            { id: 'scan', label: 'Market Scan', icon: Filter },
            { id: 'format', label: 'Strategy Format', icon: Database },
            { id: 'backtest', label: 'Backtest', icon: TrendingUp },
            { id: 'results', label: 'Results', icon: BarChart3 },
            { id: 'execution', label: 'Execute', icon: Play }
          ].map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted =
              (step.id === 'scan' && scanResults.length > 0) ||
              (step.id === 'format' && strategyLoaded) ||
              (step.id === 'backtest' && backtestResults.length > 0);

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id as WorkflowStep)}
                className={`flex-1 flex items-center justify-center gap-2 p-4 transition-colors ${
                  isActive
                    ? 'bg-[#FFD700]/10 border-b-2 border-[#FFD700] text-[#FFD700]'
                    : isCompleted
                    ? 'text-green-400 hover:bg-green-400/5'
                    : 'text-[#888888] hover:text-white hover:bg-white/5'
                }`}
                disabled={
                  (step.id === 'format' && scanResults.length === 0) ||
                  (step.id === 'backtest' && !strategyLoaded) ||
                  (step.id === 'results' && backtestResults.length === 0)
                }
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{step.label}</span>
                {isCompleted && <CheckCircle className="w-4 h-4" />}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {currentStep === 'scan' && (
            <div className="h-full flex">
              {/* Scan Configuration */}
              <div className="w-1/3 p-6 border-r border-[#333333]">
                <h3 className="text-lg font-medium text-white mb-4">Scan Configuration</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#888888] mb-2">
                      Date Range
                    </label>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3 py-2 bg-[#333333] border border-[#555555] rounded text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">End Date</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-3 py-2 bg-[#333333] border border-[#555555] rounded text-white text-sm"
                        />
                      </div>
                    </div>

                    <label className="block text-sm font-medium text-[#888888] mb-2">
                      Filters
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedFilters.lc_frontside_d2_extended}
                          onChange={(e) => setSelectedFilters(prev => ({
                            ...prev,
                            lc_frontside_d2_extended: e.target.checked
                          }))}
                          className="rounded bg-[#333333] border-[#555555]"
                        />
                        <span className="text-sm text-white">LC Frontside D2 Extended</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedFilters.lc_frontside_d3_extended_1}
                          onChange={(e) => setSelectedFilters(prev => ({
                            ...prev,
                            lc_frontside_d3_extended_1: e.target.checked
                          }))}
                          className="rounded bg-[#333333] border-[#555555]"
                        />
                        <span className="text-sm text-white">LC Frontside D3 Extended 1</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#888888] mb-2">
                      Minimum Gap
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedFilters.min_gap}
                      onChange={(e) => setSelectedFilters(prev => ({
                        ...prev,
                        min_gap: parseFloat(e.target.value)
                      }))}
                      className="w-full px-3 py-2 bg-[#333333] border border-[#555555] rounded text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#888888] mb-2">
                      Minimum PM Volume
                    </label>
                    <input
                      type="number"
                      value={selectedFilters.min_pm_vol}
                      onChange={(e) => setSelectedFilters(prev => ({
                        ...prev,
                        min_pm_vol: parseInt(e.target.value)
                      }))}
                      className="w-full px-3 py-2 bg-[#333333] border border-[#555555] rounded text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#888888] mb-2">
                      Minimum Previous Close
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedFilters.min_prev_close}
                      onChange={(e) => setSelectedFilters(prev => ({
                        ...prev,
                        min_prev_close: parseFloat(e.target.value)
                      }))}
                      className="w-full px-3 py-2 bg-[#333333] border border-[#555555] rounded text-white"
                    />
                  </div>

                  <button
                    onClick={startScan}
                    disabled={isScanning}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FFD700] text-black rounded font-medium hover:bg-[#FFD700]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isScanning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/20 border-t-black animate-spin rounded-full"></div>
                        Scanning Universe...
                      </>
                    ) : (
                      <>
                        <Filter className="w-4 h-4" />
                        Start Market Scan
                      </>
                    )}
                  </button>

                  {(isScanning || scanStatusMessage || scanError) && (
                    <div className="mt-4 space-y-3">
                      {/* Progress Bar */}
                      {isScanning && (
                        <div>
                          <div className="flex justify-between text-sm text-[#888888] mb-1">
                            <span>Progress</span>
                            <span>{scanProgress}%</span>
                          </div>
                          <div className="w-full bg-[#333333] rounded-full h-2">
                            <div
                              className="bg-[#FFD700] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${scanProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Status Message */}
                      {scanStatusMessage && (
                        <div className="p-3 bg-[#333333]/20 border border-[#333333] rounded-lg">
                          <div className="flex items-center gap-2">
                            {isScanning ? (
                              <div className="w-4 h-4 border-2 border-[#FFD700]/20 border-t-[#FFD700] animate-spin rounded-full"></div>
                            ) : scanError ? (
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            )}
                            <span className="text-sm text-white">{scanStatusMessage}</span>
                          </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {scanError && (
                        <div className="p-3 bg-red-600/10 border border-red-600/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium text-red-400">Scan Error</div>
                              <div className="text-sm text-red-300 mt-1">{scanError}</div>
                              <div className="text-xs text-red-400 mt-2">
                                Check that Python 3 and required packages (pandas, numpy, aiohttp) are installed.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Scan Results */}
              <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Scan Results</h3>
                  {scanResults.length > 0 && (
                    <div className="text-sm text-[#888888]">
                      Found {scanResults.length} qualifying tickers
                    </div>
                  )}
                </div>

                {scanResults.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-[#888888]">
                    <div className="text-center">
                      <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No scan results yet</p>
                      <p className="text-sm">Start a market scan to see qualifying tickers</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-[#0a0a0a] border-b border-[#333333]">
                        <tr className="text-left text-[#888888]">
                          <th className="p-2">Ticker</th>
                          <th className="p-2">Date</th>
                          <th className="p-2">Gap %</th>
                          <th className="p-2">PM Vol</th>
                          <th className="p-2">Prev Close</th>
                          <th className="p-2">Para Score</th>
                          <th className="p-2">ATR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scanResults.map((result, index) => (
                          <tr key={index} className="border-b border-[#333333] hover:bg-[#333333]/20">
                            <td className="p-2 text-white font-medium">{result.ticker}</td>
                            <td className="p-2 text-[#888888]">{result.date}</td>
                            <td className="p-2 text-green-400">{formatPercent(result.gap)}</td>
                            <td className="p-2 text-[#888888]">{result.pm_vol.toLocaleString()}</td>
                            <td className="p-2 text-[#888888]">{formatCurrency(result.prev_close)}</td>
                            <td className="p-2 text-[#FFD700]">{result.parabolic_score.toFixed(2)}</td>
                            <td className="p-2 text-[#888888]">{result.atr.toFixed(3)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {scanResults.length > 0 && (
                  <div className="mt-4 flex justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowSaveDialog(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors"
                      >
                        💾 Save Scan
                      </button>
                      <button
                        onClick={() => setShowLoadDialog(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded font-medium hover:bg-purple-700 transition-colors"
                      >
                        📂 Load Scan
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentStep('format');
                        startStrategyFormatting(scanResults);
                      }}
                      className="px-4 py-2 bg-[#FFD700] text-black rounded font-medium hover:bg-[#FFD700]/90 transition-colors"
                    >
                      Proceed to Format Strategy →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 'format' && (
            <div className="h-full p-6">
              <h3 className="text-lg font-medium text-white mb-6">Strategy Formatting</h3>

              {isFormatting ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-4 h-4 border-2 border-[#FFD700]/20 border-t-[#FFD700] animate-spin rounded-full mx-auto mb-4"></div>
                    <div className="text-white mb-2">{formatStatusMessage}</div>
                    <div className="text-[#FFD700]">{formatProgress}%</div>
                  </div>

                  <div className="w-full bg-[#333333] rounded-full h-2">
                    <div
                      className="bg-[#FFD700] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${formatProgress}%` }}
                    ></div>
                  </div>
                </div>
              ) : strategyLoaded ? (
                <div className="space-y-6">
                  <div className="p-4 bg-green-600/10 border border-green-600/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <div>
                        <div className="text-lg font-medium text-green-400">Strategy Ready!</div>
                        <div className="text-sm text-green-300">{formatStatusMessage}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#333333]/20 border border-[#333333] rounded-lg">
                    <h4 className="text-lg font-medium text-white mb-4">{strategyTitle}</h4>
                    <p className="text-sm text-[#888888] mb-4">{strategyDescription}</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-[#888888] mb-2">Entry Criteria</div>
                        <div className="text-sm text-white">
                          • Gap &gt; {selectedFilters.min_gap}% with volume confirmation<br/>
                          • High above previous high (D2)<br/>
                          • Low above previous low (D3)<br/>
                          • ATR-based breakout signals
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-[#888888] mb-2">Qualifying Tickers</div>
                        <div className="text-sm text-white">
                          Found {scanResults.length} stocks matching criteria<br/>
                          Min PM Volume: {selectedFilters.min_pm_vol.toLocaleString()}<br/>
                          Min Previous Close: ${selectedFilters.min_prev_close}
                        </div>
                      </div>
                    </div>

                    {scanResults.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm text-[#888888] mb-2">Top Qualifying Stocks</div>
                        <div className="grid grid-cols-6 gap-2">
                          {scanResults.slice(0, 6).map((stock, index) => (
                            <div key={index} className="p-2 bg-[#444444]/20 rounded text-center">
                              <div className="text-xs font-medium text-white">{stock.ticker}</div>
                              <div className="text-xs text-[#888888]">{stock.parabolic_score.toFixed(1)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setCurrentStep('backtest')}
                      className="px-6 py-3 bg-[#FFD700] text-black rounded font-medium hover:bg-[#FFD700]/90 transition-colors"
                    >
                      Proceed to Backtest →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-[#888888]">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Waiting to start formatting...</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 'backtest' && (
            <div className="h-full flex">
              {/* Backtest Configuration */}
              <div className="w-1/3 p-6 border-r border-[#333333]">
                <h3 className="text-lg font-medium text-white mb-4">Backtest Configuration</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#888888] mb-2">
                      Data Source
                    </label>
                    <div className="p-3 bg-[#333333]/20 border border-[#333333] rounded">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-white">
                          {scanResults.length} tickers from scan
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#888888] mb-2">
                      Starting Capital
                    </label>
                    <input
                      type="number"
                      value={100000}
                      className="w-full px-3 py-2 bg-[#333333] border border-[#555555] rounded text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#888888] mb-2">
                      Risk Per Trade
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={0.01}
                      className="w-full px-3 py-2 bg-[#333333] border border-[#555555] rounded text-white"
                    />
                  </div>

                  <button
                    onClick={startBacktest}
                    disabled={isBacktesting || scanResults.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isBacktesting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full"></div>
                        Running Backtest...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        Start Backtest
                      </>
                    )}
                  </button>

                  {isBacktesting && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-[#888888] mb-1">
                        <span>Progress</span>
                        <span>{backtestProgress}%</span>
                      </div>
                      <div className="w-full bg-[#333333] rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${backtestProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Backtest Status */}
              <div className="flex-1 p-6">
                <h3 className="text-lg font-medium text-white mb-4">Backtest Status</h3>

                {!isBacktesting && backtestResults.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-[#888888]">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Ready to backtest</p>
                      <p className="text-sm">Configure settings and start the backtest</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-[#333333]/20 border border-[#333333] rounded">
                        <div className="text-sm text-[#888888]">Tickers Processing</div>
                        <div className="text-xl font-bold text-white">
                          {Math.floor((backtestProgress / 100) * scanResults.length)} / {scanResults.length}
                        </div>
                      </div>
                      <div className="p-4 bg-[#333333]/20 border border-[#333333] rounded">
                        <div className="text-sm text-[#888888]">Estimated Time</div>
                        <div className="text-xl font-bold text-white">
                          {isBacktesting ? '~2 min' : 'Complete'}
                        </div>
                      </div>
                    </div>

                    {backtestResults.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-md font-medium text-white mb-2">Quick Stats</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 bg-green-600/20 border border-green-600 rounded">
                            <div className="text-sm text-green-400">Total Trades</div>
                            <div className="text-lg font-bold text-white">
                              {backtestResults.reduce((sum, r) => sum + r.total_trades, 0)}
                            </div>
                          </div>
                          <div className="p-3 bg-blue-600/20 border border-blue-600 rounded">
                            <div className="text-sm text-blue-400">Win Rate</div>
                            <div className="text-lg font-bold text-white">
                              {formatPercent(backtestResults.reduce((sum, r) => sum + r.win_rate, 0) / backtestResults.length || 0)}
                            </div>
                          </div>
                          <div className="p-3 bg-[#FFD700]/20 border border-[#FFD700] rounded">
                            <div className="text-sm text-[#FFD700]">Total PnL</div>
                            <div className="text-lg font-bold text-white">
                              {formatCurrency(backtestResults.reduce((sum, r) => sum + r.pnl, 0))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 'results' && (
            <div className="p-6 h-full overflow-auto">
              <h3 className="text-lg font-medium text-white mb-4">Backtest Results</h3>

              {backtestResults.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-[#888888]">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No backtest results available</p>
                    <p className="text-sm">Complete a backtest to see results</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Statistics */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-[#333333]/20 border border-[#333333] rounded">
                      <div className="text-sm text-[#888888]">Total PnL</div>
                      <div className="text-2xl font-bold text-green-400">
                        {formatCurrency(backtestResults.reduce((sum, r) => sum + r.pnl, 0))}
                      </div>
                    </div>
                    <div className="p-4 bg-[#333333]/20 border border-[#333333] rounded">
                      <div className="text-sm text-[#888888]">Win Rate</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {formatPercent(backtestResults.reduce((sum, r) => sum + r.win_rate, 0) / backtestResults.length || 0)}
                      </div>
                    </div>
                    <div className="p-4 bg-[#333333]/20 border border-[#333333] rounded">
                      <div className="text-sm text-[#888888]">Total Trades</div>
                      <div className="text-2xl font-bold text-white">
                        {backtestResults.reduce((sum, r) => sum + r.total_trades, 0)}
                      </div>
                    </div>
                    <div className="p-4 bg-[#333333]/20 border border-[#333333] rounded">
                      <div className="text-sm text-[#888888]">Max Drawdown</div>
                      <div className="text-2xl font-bold text-red-400">
                        {formatPercent(Math.max(...backtestResults.map(r => r.max_drawdown)))}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Results Table */}
                  <div>
                    <h4 className="text-md font-medium text-white mb-3">Detailed Results</h4>
                    <div className="overflow-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-[#0a0a0a] border-b border-[#333333]">
                          <tr className="text-left text-[#888888]">
                            <th className="p-2">Ticker</th>
                            <th className="p-2">Date</th>
                            <th className="p-2">Entry</th>
                            <th className="p-2">Exit</th>
                            <th className="p-2">PnL</th>
                            <th className="p-2">PnL %</th>
                            <th className="p-2">Win Rate</th>
                            <th className="p-2">Trades</th>
                          </tr>
                        </thead>
                        <tbody>
                          {backtestResults.map((result, index) => (
                            <tr key={index} className="border-b border-[#333333] hover:bg-[#333333]/20">
                              <td className="p-2 text-white font-medium">{result.ticker}</td>
                              <td className="p-2 text-[#888888]">{result.date}</td>
                              <td className="p-2 text-[#888888]">{formatCurrency(result.entry_price)}</td>
                              <td className="p-2 text-[#888888]">{formatCurrency(result.exit_price)}</td>
                              <td className={`p-2 ${result.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatCurrency(result.pnl)}
                              </td>
                              <td className={`p-2 ${result.pnl_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatPercent(result.pnl_pct)}
                              </td>
                              <td className="p-2 text-blue-400">{formatPercent(result.win_rate)}</td>
                              <td className="p-2 text-[#888888]">{result.total_trades}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setCurrentStep('execution')}
                      className="px-4 py-2 bg-[#FFD700] text-black rounded font-medium hover:bg-[#FFD700]/90 transition-colors"
                    >
                      Setup Live Execution →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'execution' && (
            <div className="p-6 h-full">
              <h3 className="text-lg font-medium text-white mb-4">Live Execution Setup</h3>

              <div className="flex items-center justify-center h-64 text-[#888888]">
                <div className="text-center">
                  <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Execution interface coming soon</p>
                  <p className="text-sm">Integration with existing execution dashboard</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Scan Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#333333] w-96">
            <h3 className="text-lg font-medium text-white mb-4">Save Scan Results</h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Scan Name</label>
              <input
                type="text"
                value={scanName}
                onChange={(e) => setScanName(e.target.value)}
                placeholder="Enter scan name..."
                className="w-full px-3 py-2 bg-[#333333] border border-[#555555] rounded text-white"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setScanName('');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveScanResults}
                disabled={!scanName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Scan Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#333333] w-96">
            <h3 className="text-lg font-medium text-white mb-4">Load Saved Scan</h3>
            <div className="mb-4 max-h-64 overflow-y-auto">
              {savedScans.length === 0 ? (
                <div className="text-center text-gray-400 py-4">
                  No saved scans found
                </div>
              ) : (
                <div className="space-y-2">
                  {savedScans.map((scan) => (
                    <button
                      key={scan.scan_id}
                      onClick={() => loadScan(scan.scan_id)}
                      className="w-full text-left p-3 bg-[#333333] hover:bg-[#444444] rounded border border-[#555555] transition-colors"
                    >
                      <div className="font-medium text-white">{scan.scan_name}</div>
                      <div className="text-sm text-gray-400">
                        {scan.result_count} results • {new Date(scan.created_at).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystematicTrading;