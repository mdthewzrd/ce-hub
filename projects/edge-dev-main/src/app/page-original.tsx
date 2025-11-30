'use client'

import { useState, useEffect } from 'react';
import { Brain, Upload, Play, TrendingUp, BarChart3, Settings, Search, Target, Filter, Clock, Database } from 'lucide-react';
import EdgeChart, { ChartData } from '@/components/EdgeChart';
import { Timeframe, CHART_TEMPLATES } from '@/components/EdgeChartPlaceholder';
import TradingViewToggle from '@/components/TradingViewToggle';
import { CodeFormatterService } from '@/utils/codeFormatterAPI';
import { fetchPolygonData, calculateVWAP, calculateEMA, calculateATR, PolygonBar } from '@/utils/polygonData';
import { fastApiScanService } from '@/services/fastApiScanService';

// Real data fetcher using Polygon API (exact wzrd-algo implementation)
async function fetchRealData(symbol: string = "SPY", timeframe: Timeframe): Promise<{ chartData: ChartData } | null> {
  const template = CHART_TEMPLATES[timeframe];

  try {
    // Fetch real market data from Polygon API
    const bars = await fetchPolygonData(symbol, timeframe, template.defaultDays + ((template as any).warmupDays || 0));

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

    // No indicators needed - clean candlestick charts only

    // Slice to display window
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

// Mock scan results with historical dates
const MOCK_SCAN_RESULTS = [
  { ticker: 'BYND', date: '2024-10-25', gapPercent: 53.5, volume: 11518000, score: 86.7 },
  { ticker: 'WOLF', date: '2024-10-24', gapPercent: 699.7, volume: 1468000, score: 95.3 },
  { ticker: 'HOUR', date: '2024-10-23', gapPercent: 288.8, volume: 378240000, score: 92.1 },
  { ticker: 'THAR', date: '2024-10-22', gapPercent: 199.5, volume: 587300000, score: 89.4 },
  { ticker: 'ATNF', date: '2024-10-21', gapPercent: 382.1, volume: 1248000, score: 93.8 },
  { ticker: 'ETHZ', date: '2024-10-18', gapPercent: 392.1, volume: 1248000, score: 94.2 },
  { ticker: 'MCVT', date: '2024-10-17', gapPercent: 178.8, volume: 223830000, score: 88.5 },
  { ticker: 'SUTG', date: '2024-10-16', gapPercent: 178.8, volume: 223830000, score: 87.9 },
];

// Function to parse scan parameters from formatted code
function parseScanParameters(code: string) {
  if (!code || code.trim() === '') {
    return {
      tickerUniverse: 'Not specified',
      scanType: 'Custom',
      filters: [],
      timeframe: 'Not specified',
      lookbackDays: 'Not specified',
      indicators: [],
      volumeFilter: null,
      priceFilter: null,
      gapFilter: null,
      estimatedResults: 'Unknown'
    };
  }

  const filters = [];
  const indicators = [];

  // Parse LC (Lightspeed Continuation) scan types with sophisticated detection
  let scanType = 'Custom Strategy';
  let estimatedResults = '5-25';

  // Detect sophisticated LC scan patterns (prioritize D2 Extended)
  if (code.includes('LC_D2_Extended') || code.includes('lc_frontside_d2_extended') || code.includes('LC_D2_Scanner') || code.includes('lc_frontside_d2') || code.includes('"lc_frontside_d2"')) {
    scanType = 'LC Frontside D2 Extended Scanner';
    estimatedResults = '3-12';
  } else if (code.includes('lc_frontside_d3_extended')) {
    scanType = 'LC Frontside D3 Extended Scanner';
    estimatedResults = '2-8';
  } else if (code.includes('lc_frontside_d3')) {
    scanType = 'LC Frontside D3 Scanner';
    estimatedResults = '3-15';
  } else if (code.includes('lc_backside')) {
    scanType = 'LC Backside Continuation Scanner';
    estimatedResults = '8-25';
  } else if (code.includes('lc_fbo')) {
    scanType = 'LC False Breakout Scanner';
    estimatedResults = '5-18';
  } else if (code.includes('parabolic_watch') || code.includes('parabolic_score')) {
    scanType = 'Parabolic Move Scanner';
    estimatedResults = '10-30';
  } else if (code.includes('gap') && code.includes('up')) {
    scanType = 'Gap Up Scanner';
    estimatedResults = '15-50';
  } else if (code.includes('breakout')) {
    scanType = 'Breakout Scanner';
    estimatedResults = '20-75';
  }

  // Parse ticker universe with better detection
  let tickerUniverse = 'US Stocks ($5+ with 10M+ Volume)';
  if (code.includes('sp500') || code.includes('S&P 500')) {
    tickerUniverse = 'S&P 500 (500 stocks)';
  } else if (code.includes('nasdaq') || code.includes('NASDAQ')) {
    tickerUniverse = 'NASDAQ (3,000+ stocks)';
  } else if (code.includes('russell') || code.includes('Russell')) {
    tickerUniverse = 'Russell 2000 (2,000 stocks)';
  } else if (code.includes('polygon.io') || code.includes('grouped/locale/us/market/stocks')) {
    tickerUniverse = 'All US Stocks (8,000+ stocks)';
  } else if (code.includes('priceRange') && code.includes('min: 5')) {
    tickerUniverse = 'US Stocks ($5+ with volume filters)';
  }

  // For LC scans, add standard LC D2 Extended filters if not explicitly found
  if (scanType.includes('LC Frontside D2 Extended')) {
    // Add the core LC D2 Extended filters
    filters.push('High Change ATR ≥ 1.5');
    filters.push('9EMA Distance ATR ≥ 2');
    filters.push('20EMA Distance ATR ≥ 3');
    filters.push('Volume ≥ 10M shares');
    filters.push('Dollar Volume ≥ $500M');
    filters.push('Bullish EMA Stack (9≥20≥50)');
    filters.push('Price ≥ $5');
    filters.push('Higher High/Low vs Previous Day');
    filters.push('Bullish Close (Close ≥ Open)');
  } else {
    // Parse sophisticated ATR-normalized filters for other scan types
    const atrFilterMatches = [
      { pattern: /highChangeAtr.*?min:\s*([0-9.]+)/gi, name: 'High Change ATR' },
      { pattern: /high_chg_atr[^\d]*>=\s*([0-9.]+)/gi, name: 'High Change ATR' },
      { pattern: /gap_atr[^\d]*>=\s*([0-9.]+)/gi, name: 'Gap ATR' },
      { pattern: /gapAtr.*?min:\s*([0-9.]+)/gi, name: 'Gap ATR' },
      { pattern: /emaDistanceAtr.*?ema9.*?min:\s*([0-9.]+)/gi, name: '9EMA Distance ATR' },
      { pattern: /dist_h_9ema_atr[^\d]*>=\s*([0-9.]+)/gi, name: '9EMA Distance ATR' },
      { pattern: /emaDistanceAtr.*?ema20.*?min:\s*([0-9.]+)/gi, name: '20EMA Distance ATR' },
      { pattern: /dist_h_20ema_atr[^\d]*>=\s*([0-9.]+)/gi, name: '20EMA Distance ATR' }
    ];

    atrFilterMatches.forEach(({ pattern, name }) => {
      const matches = Array.from(code.matchAll(pattern));
      if (matches.length > 0) {
        const maxValue = Math.max(...matches.map(match => parseFloat(match[1])));
        filters.push(`${name} ≥ ${maxValue}`);
      }
    });
  }

  // Parse sophisticated volume requirements
  const volumeMatches = [
    { pattern: /volume.*?min:\s*([0-9]+)/gi, divisor: 1000000, unit: 'M shares' },
    { pattern: /v_ua[^\d]*>=\s*([0-9]+)/gi, divisor: 1000000, unit: 'M shares' },
    { pattern: /dollarVolume.*?min:\s*([0-9]+)/gi, divisor: 1000000, unit: 'M' },
    { pattern: /dol_v[^\d]*>=\s*([0-9]+)/gi, divisor: 1000000, unit: 'M' }
  ];

  volumeMatches.forEach(({ pattern, divisor, unit }, index) => {
    const matches = Array.from(code.matchAll(pattern));
    if (matches.length > 0) {
      const maxValue = Math.max(...matches.map(match => parseInt(match[1])));
      const label = index < 2 ? 'Volume ≥' : 'Dollar Volume ≥ $';
      filters.push(`${label}${(maxValue / divisor).toFixed(0)}${unit}`);
    }
  });

  // Parse sophisticated price tier filtering
  const priceTierPatterns = [
    { range: '$5-15', patterns: [/priceRange.*?min:\s*5.*?max:\s*15/gi, /c_ua.*?>=\s*5.*?c_ua.*?<\s*15/gi] },
    { range: '$15-25', patterns: [/priceRange.*?min:\s*15.*?max:\s*25/gi, /c_ua.*?>=\s*15.*?c_ua.*?<\s*25/gi] },
    { range: '$25-50', patterns: [/priceRange.*?min:\s*25.*?max:\s*50/gi, /c_ua.*?>=\s*25.*?c_ua.*?<\s*50/gi] },
    { range: '$50-90', patterns: [/priceRange.*?min:\s*50.*?max:\s*90/gi, /c_ua.*?>=\s*50.*?c_ua.*?<\s*90/gi] },
    { range: '$90+', patterns: [/priceRange.*?min:\s*90/gi, /c_ua.*?>=\s*90/gi] }
  ];

  const detectedTiers: string[] = [];
  priceTierPatterns.forEach(({ range, patterns }) => {
    if (patterns.some(pattern => pattern.test(code))) {
      detectedTiers.push(range);
    }
  });

  if (detectedTiers.length > 0) {
    filters.push(`Price Tiers: ${detectedTiers.join(', ')}`);
  }

  // Parse percentage change requirements
  const highChangePatterns = [
    /highChangePercent.*?min:\s*([0-9.]+)/gi,
    /high_pct_chg[^\d]*>=\s*([0-9.]+)/gi
  ];

  highChangePatterns.forEach(pattern => {
    const matches = Array.from(code.matchAll(pattern));
    if (matches.length > 0) {
      const maxPct = Math.max(...matches.map(match => parseFloat(match[1])));
      const displayPct = maxPct < 1 ? (maxPct * 100).toFixed(0) : maxPct.toFixed(1);
      filters.push(`High Change ≥ ${displayPct}%`);
    }
  });

  // Parse EMA stack requirements (sophisticated trend detection)
  if (code.includes('emaStack') || code.includes('emaStackFilter')) {
    if (code.includes('ascending') || code.includes('frontside') || code.includes('ema9 >= ema20')) {
      filters.push('Bullish EMA Stack (9≥20≥50)');
    } else if (code.includes('descending') || code.includes('backside')) {
      filters.push('Bearish/Any EMA Stack');
    } else {
      filters.push('EMA Stack Required');
    }
  } else if (code.includes('ema9') && code.includes('ema20') && code.includes('ema50')) {
    if (code.includes('ema9 >= ema20') && code.includes('ema20 >= ema50')) {
      filters.push('Bullish EMA Stack (9≥20≥50)');
    }
  }

  // Parse new high requirements
  if (code.includes('250') && (code.includes('high') || code.includes('breakout'))) {
    filters.push('250-Day High Breakout');
  } else if (code.includes('highest_high_250')) {
    filters.push('At/Near 250-day highs');
  } else if (code.includes('highest_high_100')) {
    filters.push('At/Near 100-day highs');
  } else if (code.includes('highest_high_50')) {
    filters.push('At/Near 50-day highs');
  } else if (code.includes('highest_high_20')) {
    filters.push('At/Near 20-day highs');
  }

  // Parse distance requirements
  if (code.includes('distanceToLow') || code.includes('lowest_low_20')) {
    filters.push('Distance from 20-Day Low');
  }

  if (code.includes('distanceFilters') || code.includes('distanceTo20DayHigh')) {
    filters.push('Distance from Previous Highs');
  }

  // Parse close range requirements
  if (code.includes('close_range') || code.includes('closeVsOpen')) {
    const closeRangeMatch = code.match(/close_range[^\d]*>=\s*([0-9.]+)/i);
    if (closeRangeMatch) {
      const pct = (parseFloat(closeRangeMatch[1]) * 100).toFixed(0);
      filters.push(`Close ≥ ${pct}% of daily range`);
    } else {
      filters.push('Strong close positioning');
    }
  }

  // Parse technical indicators with sophisticated detection
  if (scanType.includes('LC Frontside D2 Extended')) {
    // LC D2 specific indicators
    indicators.push('ATR (14-period)');
    indicators.push('EMA (9,20,50)');
    indicators.push('Volume Analysis');
    indicators.push('Parabolic Scoring');
  } else {
    // General indicator patterns for other scan types
    const indicatorPatterns = [
      { patterns: ['calculateATR', 'atr14', 'ATR', 'true_range'], name: 'ATR (14-period)' },
      { patterns: ['calculateEMA', 'ema9', 'ema20', 'ema50', 'ema200', 'EMA'], name: 'EMA (9,20,50,200)' },
      { patterns: ['volume', 'v_ua', 'dollarVolume', 'volumeFilters'], name: 'Volume Analysis' },
      { patterns: ['calculateRollingHighs', 'highest_high', 'lowest_low'], name: 'Rolling Highs/Lows' },
      { patterns: ['parabolic_score', 'calculateScore'], name: 'Parabolic Scoring' },
      { patterns: ['rsi', 'RSI'], name: 'RSI' },
      { patterns: ['macd', 'MACD'], name: 'MACD' },
      { patterns: ['vwap', 'VWAP'], name: 'VWAP' }
    ];

    indicatorPatterns.forEach(({ patterns, name }) => {
      if (patterns.some(pattern => code.includes(pattern))) {
        indicators.push(name);
      }
    });
  }

  // Parse timeframe with better detection (LC scans are daily)
  let timeframe = '1D Daily';
  if (scanType.includes('LC Frontside D2 Extended') || scanType.includes('LC')) {
    timeframe = '1D Daily';
  } else if (code.includes('1/minute') || code.includes('1min')) timeframe = '1 Minute';
  else if (code.includes('5/minute') || code.includes('5min')) timeframe = '5 Minute';
  else if (code.includes('15/minute') || code.includes('15min')) timeframe = '15 Minute';
  else if (code.includes('30/minute') || code.includes('30min')) timeframe = '30 Minute';
  else if (code.includes('1/hour') || code.includes('1h')) timeframe = '1 Hour';
  else if (code.includes('4/hour') || code.includes('4h')) timeframe = '4 Hour';
  else if (code.includes('weekly') || code.includes('week')) timeframe = 'Weekly';
  else if (code.includes('timeframe: "1D"') || code.includes('Daily')) timeframe = '1D Daily';

  // Parse lookback period with better detection
  let lookbackDays = '250 trading days';
  const lookbackPatterns = [
    /lookback:\s*([0-9]+)/i,
    /([0-9]+)\s*days/i,
    /window=([0-9]+)/i,
    /period.*?([0-9]+)/i
  ];

  for (const pattern of lookbackPatterns) {
    const match = code.match(pattern);
    if (match) {
      const days = parseInt(match[1]);
      if (days >= 200) {
        lookbackDays = `${days} trading days`;
        break;
      }
    }
  }

  if (code.includes('2024-01-01') || code.includes('2025')) {
    lookbackDays = '300+ days (multi-year)';
  }

  return {
    tickerUniverse,
    scanType,
    filters,
    timeframe,
    lookbackDays,
    indicators,
    estimatedResults
  };
}

export default function Home() {
  const [pythonCode, setPythonCode] = useState('');
  const [inputMethod, setInputMethod] = useState<'paste' | 'file'>('paste');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [formattedCode, setFormattedCode] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [showProjectCreation, setShowProjectCreation] = useState(false);
  const [scanResults, setScanResults] = useState(MOCK_SCAN_RESULTS);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('day');
  const [isExecuting, setIsExecuting] = useState(false);
  const [scanDate, setScanDate] = useState(() => {
    // Default to current date for fresh market data
    return new Date().toISOString().split('T')[0];
  });
  const [lastScanDate, setLastScanDate] = useState<string | null>(null);
  const [scanStartDate, setScanStartDate] = useState('2024-01-01'); // Start date for range scanning
  const [scanEndDate, setScanEndDate] = useState('2024-10-29'); // End date for range scanning
  const [selectedData, setSelectedData] = useState<{ chartData: ChartData } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'finalized' | 'format' | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const [formattingResult, setFormattingResult] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table'); // T/C toggle
  const [projects, setProjects] = useState([
    { id: 1, name: 'Gap Up Scanner', active: true },
    { id: 2, name: 'Breakout Strategy', active: false },
    { id: 3, name: 'Volume Surge', active: false }
  ]);
  const [sortField, setSortField] = useState<'ticker' | 'date' | 'gapPercent' | 'volume' | 'score'>('gapPercent');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Sorting function
  const handleSort = (field: 'ticker' | 'date' | 'gapPercent' | 'volume' | 'score') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get sorted results
  const sortedResults = [...scanResults].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    // Handle date sorting
    if (sortField === 'date') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    // Handle string sorting (ticker)
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Result cache for instant loading
  const [resultCache, setResultCache] = useState<{[key: string]: any[]}>({
    'Gap Up Scanner': [], // Will be populated with historical results
    'Breakout Strategy': [],
    'Volume Surge': []
  });

  // Load chart data when ticker or timeframe changes
  useEffect(() => {
    if (selectedTicker) {
      setIsLoadingData(true);
      fetchRealData(selectedTicker, timeframe)
        .then(data => {
          setSelectedData(data);
          setIsLoadingData(false);
        })
        .catch(error => {
          console.error('Error loading chart data:', error);
          setSelectedData(null);
          setIsLoadingData(false);
        });
    } else {
      setSelectedData(null);
    }
  }, [selectedTicker, timeframe]);

  // Load SPY by default on mount and preload scan results
  useEffect(() => {
    if (!selectedTicker) {
      setSelectedTicker('SPY');
    }

    // Load excellent historical scan results and populate cache
    const loadHistoricalResults = async () => {
      console.log('  Loading historical LC scan results and populating cache...');

      try {
        // Load our current working scan with ORIGINAL LC algorithm results
        const response = await fetch('http://localhost:8000/api/scan/status/scan_20251030_181330_13313f3a');

        if (response.ok) {
          const data = await response.json();

          if (data.results && data.results.length > 0) {
            console.log(`  Loaded ${data.results.length} historical LC results`);
            console.log(`📊 Top results: ${data.results.slice(0, 3).map((r: any) => `${r.ticker} (${r.gap_pct}%)`).join(', ')}`);

            const transformedResults = data.results.map((result: any) => ({
              ticker: result.ticker,
              date: result.date,
              gapPercent: result.gap_pct,
              volume: result.volume,
              score: result.confidence_score || result.parabolic_score || 0
            }));

            // Populate cache with results for each project type
            setResultCache({
              'Gap Up Scanner': transformedResults,
              'Breakout Strategy': transformedResults.slice(0, 5), // Subset for different strategy
              'Volume Surge': transformedResults.slice(2, 7) // Different subset
            });

            // Show Gap Up Scanner results (active project)
            setScanResults(transformedResults);
            console.log(`  Dashboard loaded with ${transformedResults.length} historical results and cache populated`);
            return;
          }
        }

        console.log('⚠️ No historical results found, using fallback data');
        setScanResults(MOCK_SCAN_RESULTS);
        // Populate cache with mock data
        setResultCache({
          'Gap Up Scanner': MOCK_SCAN_RESULTS,
          'Breakout Strategy': MOCK_SCAN_RESULTS.slice(0, 4),
          'Volume Surge': MOCK_SCAN_RESULTS.slice(2, 6)
        });

      } catch (error) {
        console.error(`❌ Failed to load historical results:`, error);
        setScanResults(MOCK_SCAN_RESULTS);
        // Populate cache with mock data as fallback
        setResultCache({
          'Gap Up Scanner': MOCK_SCAN_RESULTS,
          'Breakout Strategy': MOCK_SCAN_RESULTS.slice(0, 4),
          'Volume Surge': MOCK_SCAN_RESULTS.slice(2, 6)
        });
      }
    };

    // Load historical results immediately
    loadHistoricalResults();
  }, [scanStartDate, scanEndDate]); // Re-run when date range changes

  const pollForScanCompletion = async (scanId: string) => {
    console.log('  Polling for scan completion...');

    const maxAttempts = 60; // 5 minutes max (5 second intervals)
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const statusResponse = await fetch(`http://localhost:8000/api/scan/status/${scanId}`);

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log(`📊 Scan ${scanId}: ${statusData.progress_percent}% - ${statusData.message}`);

          if (statusData.status === 'completed') {
            console.log('  Scan completed! Fetching results...');

            // Get final results
            const resultsResponse = await fetch(`http://localhost:8000/api/scan/results/${scanId}`);
            if (resultsResponse.ok) {
              const resultsData = await resultsResponse.json();

              if (resultsData.results && resultsData.results.length > 0) {
                // Transform API results to match frontend data structure
                const transformedResults = resultsData.results.map((result: any) => ({
                  ticker: result.ticker,
                  date: result.date,
                  gapPercent: result.gap_pct,
                  volume: result.volume || result.v_ua || 0,
                  score: result.confidence_score || result.parabolic_score || 0
                }));

                console.log(`  Found ${transformedResults.length} LC patterns!`);
                setScanResults(transformedResults);

                // Cache the results
                const activeProject = projects.find(p => p.active);
                if (activeProject) {
                  setResultCache(prevCache => ({
                    ...prevCache,
                    [activeProject.name]: transformedResults
                  }));
                }

                return;
              } else {
                console.log('❌ No results found in completed scan');
                setScanResults([]);
                return;
              }
            }
          } else if (statusData.status === 'error') {
            console.error('❌ Scan failed:', statusData.message);
            setScanResults(MOCK_SCAN_RESULTS);
            return;
          }

          // Continue polling
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          attempts++;
        } else {
          console.error('❌ Failed to get scan status');
          break;
        }
      } catch (error) {
        console.error('❌ Error polling scan status:', error);
        break;
      }
    }

    // Timeout or error - fallback to mock data
    console.log('⏰ Scan polling timeout or error - using fallback data');
    setScanResults(MOCK_SCAN_RESULTS);
  };

  const handleRunScan = async () => {
    console.log('  Starting scan execution...');
    setIsExecuting(true);

    try {
      const requestBody = {
        start_date: scanStartDate,
        end_date: scanEndDate,
        use_real_scan: true,
        filters: {
          lc_frontside_d2_extended: true,
          lc_frontside_d3_extended_1: true,
          min_gap: 0.5,
          min_pm_vol: 5000000,
          min_prev_close: 0.75
        }
      };

      console.log('📡 Making API request with body:', requestBody);

      // Call the FastAPI scan endpoint
      const response = await fetch('http://localhost:8000/api/scan/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 API Response status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('📊 API Response data:', data);

        if (data.success && data.scan_id) {
          console.log('  Scan started successfully, scan_id:', data.scan_id);

          // Poll for completion
          await pollForScanCompletion(data.scan_id);
        } else {
          // Fallback to mock data if no scan_id
          console.log('❌ API response missing scan_id, using sample data');
          console.log('Data structure received:', data);
          setScanResults(MOCK_SCAN_RESULTS);
        }
      } else {
        // API error - fallback to mock data
        console.error('❌ Scan API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        setScanResults(MOCK_SCAN_RESULTS);
      }
    } catch (error) {
      // Network error - fallback to mock data
      console.error('❌ Scan request failed:', error);
      setScanResults(MOCK_SCAN_RESULTS);
    }

    console.log('🏁 Scan execution finished');
    setIsExecuting(false);
  };

  const handleUploadFinalized = async () => {
    // Handle finalized code upload - go to project creation screen
    setFormattedCode(pythonCode); // Use the raw code as-is
    setShowProjectCreation(true);
    // Don't close modal yet, transition to project creation screen
  };

  const handleUploadFormat = async () => {
    // Handle code formatting with AI agent
    setIsFormatting(true);
    try {
      // TODO: Integrate with CE-Hub AI formatting agent
      console.log('Formatting code with AI agent...');
      console.log('Code to format:', pythonCode);

      // Simulate AI formatting process
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Store formatted code
      const formattedResult = `# AI-Formatted Trading Scanner
# Optimized with multiprocessing and professional indicators

import pandas as pd
import numpy as np
from multiprocessing import Pool
import yfinance as yf

def optimized_scanner():
    """
    Professional trading scanner with:
    - Multiprocessing for speed
    - Professional indicator libraries
    - Error handling and logging
    - Clean data validation
    """

    # Your formatted code here...
    ${pythonCode}

    return results

if __name__ == "__main__":
    results = optimized_scanner()
    print(f"Found {len(results)} trading opportunities")`;

      setFormattedCode(formattedResult);
      setShowProjectCreation(true);

      // Don't close modal yet, transition to project creation screen
    } catch (error) {
      console.error('Error formatting code:', error);
    } finally {
      setIsFormatting(false);
    }
  };

  const openUploadModal = () => {
    setShowUploadModal(true);
    setUploadMode(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setPythonCode(content);
        setUploadedFileName(file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleTickerClick = (ticker: string) => {
    setSelectedTicker(ticker);
  };

  const handleProjectClick = (projectId: number) => {
    // Update active project
    setProjects(projects.map(p => ({ ...p, active: p.id === projectId })));

    // Get the selected project name
    const selectedProject = projects.find(p => p.id === projectId);
    if (!selectedProject) return;

    console.log(`📂 Switching to project: ${selectedProject.name}`);

    // Load cached results instantly (no scan execution)
    const cachedResults = resultCache[selectedProject.name] || [];

    if (cachedResults.length > 0) {
      console.log(`  Loading ${cachedResults.length} cached results for ${selectedProject.name} instantly`);
      setScanResults(cachedResults);
    } else {
      console.log(`  No cached results for ${selectedProject.name}, showing empty state`);
      setScanResults([]);
    }

    console.log(`  Switched to ${selectedProject.name} with ${cachedResults.length} cached results`);
  };


  return (
    <>
    <div className="min-h-screen flex" style={{ background: 'var(--studio-bg)', color: 'var(--studio-text)' }}>
      {/* Left Navigation Sidebar */}
      <div className="w-72 flex flex-col border-r" style={{
        borderColor: 'var(--studio-border)',
        background: 'var(--studio-bg-secondary)',
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Logo */}
        <div className="p-10 border-b" style={{ borderColor: 'var(--studio-border)' }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
              background: 'var(--studio-gold)',
              boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
            }}>
              <Brain className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--studio-gold)' }}>Traderra</h1>
              <p className="text-sm" style={{ color: 'var(--studio-text-muted)' }}>AI Trading Platform</p>
            </div>
          </div>
        </div>

        {/* Upload Code Button */}
        <div className="content-bumper-all border-b" style={{ borderColor: 'var(--studio-border)' }}>
          <button
            onClick={openUploadModal}
            className="btn-primary w-full justify-center text-base py-3"
          >
            <Upload className="h-4 w-4" />
            Upload Strategy
          </button>
        </div>

        {/* Projects List */}
        <div className="flex-1 sidebar-professional">
          <h3 className="text-sm font-semibold mb-4 tracking-wide" style={{ color: 'var(--studio-gold)' }}>PROJECTS</h3>
          <div className="space-y-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className={`sidebar-project-item p-6 rounded-lg cursor-pointer ${
                  project.active ? 'studio-card-elevated active' : 'studio-card'
                }`}
                style={{
                  background: project.active
                    ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.08) 100%)'
                    : undefined,
                  borderColor: project.active ? 'rgba(212, 175, 55, 0.3)' : undefined
                }}
              >
                <div className="font-medium text-base">{project.name}</div>
                <div className="text-sm mt-2" style={{ color: 'var(--studio-text-muted)' }}>
                  {project.active && isExecuting ? (
                    <span className="flex items-center gap-2">
                      <Settings className="h-3 w-3 animate-spin" />
                      Scanning...
                    </span>
                  ) : project.active ? 'Active' : 'Inactive'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="content-bumper-all border-t text-center text-sm" style={{
          borderColor: 'var(--studio-border)',
          color: 'var(--studio-text-muted)'
        }}>
          Traderra v2.0
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="studio-header">
          <div className="w-full px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <Brain className="h-7 w-7 text-primary" />
                  <span className="text-xl font-bold studio-text">Traderra</span>
                </div>
                <div className="text-lg font-semibold text-primary">
                  {projects.find(p => p.active)?.name || 'Strategy Scanner'}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary">
                <TrendingUp className="h-4 w-4" />
                <span>Market Scanner</span>
                <span className="text-studio-muted">•</span>
                <span className="text-[#FFD700]">
                  Real-time Analysis
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TradingViewToggle
                value={viewMode}
                onChange={setViewMode}
              />
              {/* Date Range Inputs */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="scanStartDate" className="text-sm font-medium text-studio-text-muted">
                    From:
                  </label>
                  <input
                    id="scanStartDate"
                    type="date"
                    value={scanStartDate}
                    onChange={(e) => setScanStartDate(e.target.value)}
                    className="px-3 py-2 rounded-lg border text-sm bg-studio-background"
                    style={{
                      borderColor: 'var(--studio-border)',
                      color: 'var(--studio-text)',
                      backgroundColor: 'var(--studio-card-bg)'
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="scanEndDate" className="text-sm font-medium text-studio-text-muted">
                    To:
                  </label>
                  <input
                    id="scanEndDate"
                    type="date"
                    value={scanEndDate}
                    onChange={(e) => setScanEndDate(e.target.value)}
                    className="px-3 py-2 rounded-lg border text-sm bg-studio-background"
                    style={{
                      borderColor: 'var(--studio-border)',
                      color: 'var(--studio-text)',
                      backgroundColor: 'var(--studio-card-bg)'
                    }}
                  />
                </div>
                {/* Quick Date Range Presets */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const today = new Date();
                      const thirtyDaysAgo = new Date(today);
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      setScanStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
                      setScanEndDate(today.toISOString().split('T')[0]);
                    }}
                    className="px-2 py-1 text-xs rounded border text-studio-text-muted hover:text-studio-text hover:border-studio-gold transition-colors"
                    style={{ borderColor: 'var(--studio-border)' }}
                  >
                    30d
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const ninetyDaysAgo = new Date(today);
                      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                      setScanStartDate(ninetyDaysAgo.toISOString().split('T')[0]);
                      setScanEndDate(today.toISOString().split('T')[0]);
                    }}
                    className="px-2 py-1 text-xs rounded border text-studio-text-muted hover:text-studio-text hover:border-studio-gold transition-colors"
                    style={{ borderColor: 'var(--studio-border)' }}
                  >
                    90d
                  </button>
                  <button
                    onClick={() => {
                      setScanStartDate('2024-01-01');
                      setScanEndDate('2024-12-31');
                    }}
                    className="px-2 py-1 text-xs rounded border text-studio-text-muted hover:text-studio-text hover:border-studio-gold transition-colors"
                    style={{ borderColor: 'var(--studio-border)' }}
                  >
                    2024
                  </button>
                </div>
              </div>
              <button
                onClick={handleRunScan}
                disabled={isExecuting}
                className="btn-primary"
              >
                {isExecuting ? (
                  <>
                    <Settings className="h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4" />
                    Run Scan
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="professional-container">{/* Professional spacing */}
          {viewMode === 'table' ? (
            /* TABLE MODE: Larger scan results and stats, scrollable chart below */
            <div className="section-spacing">
              {/* Top Row - Scan Results and Statistics (Large) */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 section-spacing">
                {/* Scan Results - Left (Large) */}
                <div className="studio-card studio-card-large">
                  <div className="section-header">
                    <BarChart3 className="section-icon text-primary" />
                    <h3 className="section-title studio-text">
                      Scan Results
                      {scanStartDate && scanEndDate && (
                        <span className="text-sm font-normal text-studio-text-muted ml-2">
                          - {new Date(scanStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to {new Date(scanEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="h-80 overflow-y-auto studio-scrollbar">
                    <table className="studio-table">
                      <thead>
                        <tr>
                          <th
                            onClick={() => handleSort('ticker')}
                            className="cursor-pointer hover:bg-gray-700 transition-colors"
                          >
                            TICKER {sortField === 'ticker' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th
                            onClick={() => handleSort('date')}
                            className="cursor-pointer hover:bg-gray-700 transition-colors"
                          >
                            DATE {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th
                            onClick={() => handleSort('gapPercent')}
                            className="cursor-pointer hover:bg-gray-700 transition-colors"
                          >
                            GAP % {sortField === 'gapPercent' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th
                            onClick={() => handleSort('volume')}
                            className="cursor-pointer hover:bg-gray-700 transition-colors"
                          >
                            VOLUME {sortField === 'volume' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th
                            onClick={() => handleSort('score')}
                            className="cursor-pointer hover:bg-gray-700 transition-colors"
                          >
                            SCORE {sortField === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedResults.map((result, index) => (
                          <tr
                            key={index}
                            onClick={() => handleTickerClick(result.ticker)}
                            className={selectedTicker === result.ticker ? 'selected' : ''}
                          >
                            <td style={{ color: 'var(--studio-text)', fontWeight: 'bold' }}>{result.ticker}</td>
                            <td style={{ color: 'var(--studio-text-secondary)' }}>{result.date ? new Date(result.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : '-'}</td>
                            <td className="status-positive">{result.gapPercent.toFixed(1)}%</td>
                            <td style={{ color: 'var(--studio-text-secondary)' }}>{(result.volume / 1000000).toFixed(1)}M</td>
                            <td style={{ color: 'var(--studio-info)', fontWeight: '600' }}>{result.score.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Statistics - Right (Large) */}
                <div className="studio-card studio-card-large">
                  <div className="section-header">
                    <TrendingUp className="section-icon text-primary" />
                    <h3 className="section-title studio-text">Statistics</h3>
                  </div>
                  <div className="metrics-grid">
                    <div className="studio-metric-card">
                      <div className="studio-metric-label">Total Results</div>
                      <div className="studio-metric-value">{scanResults.length}</div>
                    </div>
                    <div className="studio-metric-card">
                      <div className="studio-metric-label">Avg Gap %</div>
                      <div className="studio-metric-value status-positive">
                        {(scanResults.reduce((sum, r) => sum + r.gapPercent, 0) / scanResults.length).toFixed(1)}%
                      </div>
                    </div>
                    <div className="studio-metric-card">
                      <div className="studio-metric-label">Avg Volume</div>
                      <div className="studio-metric-value" style={{ color: 'var(--studio-info)' }}>
                        {(scanResults.reduce((sum, r) => sum + r.volume, 0) / scanResults.length / 1000000).toFixed(1)}M
                      </div>
                    </div>
                    <div className="studio-metric-card">
                      <div className="studio-metric-label">Date Range</div>
                      <div className="studio-metric-value" style={{ color: 'var(--studio-text-secondary)' }}>
                        {timeframe === 'day' ? '90 days' :
                         timeframe === 'hour' ? '30 days' :
                         timeframe === '15min' ? '10 days' : '2 days'}
                      </div>
                    </div>
                  </div>

                  {selectedTicker && (
                    <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                      <div className="font-bold" style={{ color: 'var(--studio-gold)' }}>📈 Selected: {selectedTicker}</div>
                      <div className="text-sm mt-1" style={{ color: 'var(--studio-text-muted)' }}>
                        Showing {timeframe} timeframe • {CHART_TEMPLATES[timeframe].defaultDays} days
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Chart Section (Scrollable below) */}
              <div className="studio-card">
                <div className="section-header">
                  <TrendingUp className="section-icon text-primary" />
                  <h3 className="section-title studio-text">Chart Analysis</h3>
                </div>
                {isLoadingData ? (
                  <div className="h-96 flex items-center justify-center" style={{
                    background: 'var(--studio-bg-secondary)',
                    border: '1px solid var(--studio-border)',
                    borderRadius: '12px'
                  }}>
                    <div className="text-center">
                      <div className="text-6xl mb-4 animate-pulse">📈</div>
                      <div className="text-lg font-medium" style={{ color: 'var(--studio-text-secondary)' }}>
                        Loading {selectedTicker} chart data...
                      </div>
                      <div className="text-sm mt-2" style={{ color: 'var(--studio-text-muted)' }}>
                        Fetching real market data from Polygon API
                      </div>
                    </div>
                  </div>
                ) : selectedTicker && selectedData ? (
                  <EdgeChart
                    symbol={selectedTicker}
                    timeframe={timeframe}
                    data={selectedData.chartData}
                    onTimeframeChange={setTimeframe}
                    className="chart-container"
                  />
                ) : (
                  <div className="h-96 flex items-center justify-center" style={{
                    background: 'var(--studio-bg-secondary)',
                    border: '1px solid var(--studio-border)',
                    borderRadius: '12px'
                  }}>
                    <div className="text-center">
                      <div className="text-6xl mb-4">📊</div>
                      <div className="text-lg font-medium" style={{ color: 'var(--studio-text-secondary)' }}>
                        Click on a ticker to view its chart
                      </div>
                      <div className="text-sm mt-2" style={{ color: 'var(--studio-text-muted)' }}>
                        Choose from Daily (90d), Hourly (30d), 15min (10d), or 5min (2d) timeframes
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* CHART MODE: Large chart, smaller stats on bottom */
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Chart Section (Large) - More square proportions */}
              <div className="xl:col-span-3 space-y-6">
                <div className="studio-card">
                  <div className="section-header">
                    <TrendingUp className="section-icon text-primary" />
                    <h3 className="section-title studio-text">Chart Analysis</h3>
                  </div>
                {isLoadingData ? (
                  <div className="h-full flex items-center justify-center" style={{
                    background: 'var(--studio-bg-secondary)',
                    border: '1px solid var(--studio-border)',
                    borderRadius: '12px',
                    minHeight: '500px'
                  }}>
                    <div className="text-center">
                      <div className="text-6xl mb-4 animate-pulse">📈</div>
                      <div className="text-lg font-medium" style={{ color: 'var(--studio-text-secondary)' }}>
                        Loading {selectedTicker} chart data...
                      </div>
                      <div className="text-sm mt-2" style={{ color: 'var(--studio-text-muted)' }}>
                        Fetching real market data from Polygon API
                      </div>
                    </div>
                  </div>
                ) : selectedTicker && selectedData ? (
                  <EdgeChart
                    symbol={selectedTicker}
                    timeframe={timeframe}
                    data={selectedData.chartData}
                    onTimeframeChange={setTimeframe}
                    className="chart-container"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center studio-surface border studio-border rounded-lg" style={{
                    minHeight: '500px'
                  }}>
                    <div className="text-center">
                      <TrendingUp className="w-16 h-16 mx-auto mb-4 text-primary opacity-60" />
                      <div className="text-lg font-medium studio-text">
                        Click on a ticker to view its chart
                      </div>
                      <div className="text-sm mt-2 studio-muted">
                        Choose from Daily (90d), Hourly (30d), 15min (10d), or 5min (2d) timeframes
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>

              {/* Sidebar - Scan Results and Statistics */}
              <div className="xl:col-span-1 space-y-6">
                {/* Scan Results - Compact */}
                <div className="studio-card">
                  <div className="section-header">
                    <BarChart3 className="section-icon text-primary" />
                    <h3 className="section-title studio-text">
                      Scan Results
                      {scanStartDate && scanEndDate && (
                        <span className="text-sm font-normal text-studio-text-muted ml-2">
                          - {new Date(scanStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to {new Date(scanEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="h-full overflow-y-auto studio-scrollbar">
                    <table className="studio-table">
                      <thead>
                        <tr>
                          <th
                            onClick={() => handleSort('ticker')}
                            className="text-xs p-2 cursor-pointer hover:bg-gray-700 transition-colors"
                          >
                            TICKER {sortField === 'ticker' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th
                            onClick={() => handleSort('date')}
                            className="text-xs p-2 cursor-pointer hover:bg-gray-700 transition-colors"
                          >
                            DATE {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th
                            onClick={() => handleSort('gapPercent')}
                            className="text-xs p-2 cursor-pointer hover:bg-gray-700 transition-colors"
                          >
                            GAP % {sortField === 'gapPercent' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th
                            onClick={() => handleSort('volume')}
                            className="text-xs p-2 cursor-pointer hover:bg-gray-700 transition-colors"
                          >
                            VOL {sortField === 'volume' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th
                            onClick={() => handleSort('score')}
                            className="text-xs p-2 cursor-pointer hover:bg-gray-700 transition-colors"
                          >
                            SCORE {sortField === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedResults.map((result, index) => (
                          <tr
                            key={index}
                            onClick={() => handleTickerClick(result.ticker)}
                            className={selectedTicker === result.ticker ? 'selected' : ''}
                          >
                            <td className="p-2 text-sm font-bold" style={{ color: 'var(--studio-text)' }}>{result.ticker}</td>
                            <td className="p-2 text-sm" style={{ color: 'var(--studio-text-secondary)' }}>{result.date ? new Date(result.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : '-'}</td>
                            <td className="p-2 text-sm status-positive">{result.gapPercent.toFixed(1)}%</td>
                            <td className="p-2 text-sm" style={{ color: 'var(--studio-text-secondary)' }}>{(result.volume / 1000000).toFixed(1)}M</td>
                            <td className="p-2 text-sm font-semibold" style={{ color: 'var(--studio-info)' }}>{result.score.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Statistics - Compact */}
                <div className="studio-card">
                  <div className="section-header">
                    <TrendingUp className="section-icon text-primary" />
                    <h3 className="section-title studio-text">Statistics</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="studio-metric-card">
                      <div className="studio-metric-label text-xs">Total</div>
                      <div className="studio-metric-value text-xl">{scanResults.length}</div>
                    </div>
                    <div className="studio-metric-card">
                      <div className="studio-metric-label text-xs">Avg Gap</div>
                      <div className="studio-metric-value text-xl status-positive">
                        {(scanResults.reduce((sum, r) => sum + r.gapPercent, 0) / scanResults.length).toFixed(1)}%
                      </div>
                    </div>
                    <div className="studio-metric-card">
                      <div className="studio-metric-label text-xs">Avg Vol</div>
                      <div className="studio-metric-value text-xl" style={{ color: 'var(--studio-info)' }}>
                        {(scanResults.reduce((sum, r) => sum + r.volume, 0) / scanResults.length / 1000000).toFixed(1)}M
                      </div>
                    </div>
                    <div className="studio-metric-card">
                      <div className="studio-metric-label text-xs">Range</div>
                      <div className="studio-metric-value text-xl" style={{ color: 'var(--studio-text-secondary)' }}>
                        {timeframe === 'day' ? '90d' :
                         timeframe === 'hour' ? '30d' :
                         timeframe === '15min' ? '10d' : '2d'}
                      </div>
                    </div>
                  </div>

                  {selectedTicker && (
                    <div className="p-3 rounded-lg" style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                      <div className="font-bold text-sm" style={{ color: 'var(--studio-gold)' }}>📈 Selected: {selectedTicker}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--studio-text-muted)' }}>
                        {timeframe} timeframe • {CHART_TEMPLATES[timeframe].defaultDays} days
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>

    {/* Enhanced Upload Code Modal */}
    {showUploadModal && (
        <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-content studio-card-elevated w-[600px] p-8 max-w-4xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-primary">
                <Upload className="inline h-5 w-5 mr-2" />
                Upload Trading Strategy
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadMode(null);
                }}
                className="text-2xl hover:opacity-70 transition-opacity"
                style={{ color: 'var(--studio-text-muted)' }}
              >
                ×
              </button>
            </div>

            {showProjectCreation ? (
              /* Project Creation Screen */
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowProjectCreation(false);
                      setFormattedCode('');
                    }}
                    className="text-xl hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--studio-text-muted)' }}
                  >
                    ←
                  </button>
                  <h4 className="text-lg font-semibold text-primary">
                    <Play className="inline h-5 w-5 mr-2" />
                    Create New Project
                  </h4>
                </div>

                <p className="text-sm" style={{ color: 'var(--studio-text-secondary)' }}>
                  Your code has been formatted! Now configure your project settings.
                </p>

                {/* Project Configuration */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--studio-text-secondary)' }}>
                      Project Title
                    </label>
                    <input
                      type="text"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      placeholder="e.g. Gap Scanner Pro, Momentum Breakout Scanner"
                      className="studio-input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--studio-text-secondary)' }}>
                      Description
                    </label>
                    <textarea
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="Describe what this scanner does, what patterns it looks for, and any special features..."
                      rows={3}
                      className="studio-input w-full resize-none"
                    />
                  </div>

                  {/* Scan Summary Section */}
                  {formattedCode && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-3" style={{ color: 'var(--studio-text-secondary)' }}>
                        <Search className="inline h-4 w-4 mr-2" />
                        Scan Summary
                      </label>
                      <div className="studio-surface border studio-border rounded-lg p-4 space-y-4">
                        {(() => {
                          const params = parseScanParameters(formattedCode);
                          return (
                            <>
                              {/* Header Row */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="studio-metric-card">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Target className="h-4 w-4 text-primary" />
                                    <div className="studio-metric-label">Scan Type</div>
                                  </div>
                                  <div className="studio-metric-value text-primary text-sm font-medium">
                                    {params.scanType}
                                  </div>
                                </div>
                                <div className="studio-metric-card">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Database className="h-4 w-4 text-primary" />
                                    <div className="studio-metric-label">Universe</div>
                                  </div>
                                  <div className="studio-metric-value text-sm font-medium studio-text">
                                    {params.tickerUniverse}
                                  </div>
                                </div>
                                <div className="studio-metric-card">
                                  <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    <div className="studio-metric-label">Est. Results</div>
                                  </div>
                                  <div className="studio-metric-value text-sm font-medium status-positive">
                                    {params.estimatedResults}
                                  </div>
                                </div>
                              </div>

                              {/* Parameters Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Filters Column */}
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <Filter className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-medium studio-text">Active Filters</h4>
                                  </div>
                                  <div className="space-y-2">
                                    {params.filters.length > 0 ? (
                                      params.filters.map((filter, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm p-2 rounded"
                                             style={{ background: 'var(--studio-bg-secondary)', border: '1px solid var(--studio-border)' }}>
                                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                          <span style={{ color: 'var(--studio-text-secondary)' }}>{filter}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-sm studio-muted">No specific filters detected</div>
                                    )}
                                  </div>
                                </div>

                                {/* Technical Indicators Column */}
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <BarChart3 className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-medium studio-text">Technical Indicators</h4>
                                  </div>
                                  <div className="space-y-2">
                                    {params.indicators.length > 0 ? (
                                      params.indicators.map((indicator, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm p-2 rounded"
                                             style={{ background: 'var(--studio-bg-secondary)', border: '1px solid var(--studio-border)' }}>
                                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                          <span style={{ color: 'var(--studio-text-secondary)' }}>{indicator}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-sm studio-muted">No indicators detected</div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Timeline and Execution Info */}
                              <div className="flex items-center justify-between pt-3 border-t studio-border">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary" />
                                    <span className="text-sm studio-text">Timeframe:</span>
                                    <span className="text-sm font-medium text-primary">{params.timeframe}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm studio-text">Lookback:</span>
                                    <span className="text-sm font-medium studio-text">{params.lookbackDays}</span>
                                  </div>
                                </div>
                                <div className="px-3 py-1 rounded text-xs font-medium"
                                     style={{
                                       background: 'rgba(34, 197, 94, 0.1)',
                                       color: '#22c55e',
                                       border: '1px solid rgba(34, 197, 94, 0.3)'
                                     }}>
                                  ✓ Ready to Execute
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <p className="text-xs mt-2 studio-muted">
                        Review the scan parameters above to ensure they match your strategy before creating the project.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--studio-text-secondary)' }}>
                      Formatted Code Preview
                    </label>
                    <div className="relative">
                      <textarea
                        value={formattedCode}
                        onChange={(e) => setFormattedCode(e.target.value)}
                        className="studio-input w-full h-48 resize-none font-mono text-sm"
                        placeholder="Your formatted code will appear here..."
                      />
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => {
                            // TODO: Implement AI chat for code refinement
                            console.log('Opening AI chat for code refinement...');
                          }}
                          className="px-3 py-1 text-xs font-medium rounded transition-colors bg-blue-600 text-white hover:bg-blue-700"
                        >
                          💬 Chat with AI
                        </button>
                      </div>
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--studio-text-muted)' }}>
                      Review and edit the formatted code, or use AI chat to refine it further.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowProjectCreation(false);
                      setFormattedCode('');
                    }}
                    className="flex-1 px-4 py-3 border rounded-lg transition-all duration-200 hover:border-gray-500 hover:bg-gray-800"
                    style={{
                      borderColor: 'var(--studio-border)',
                      color: 'var(--studio-text-muted)'
                    }}
                  >
                    Back to Code
                  </button>
                  <button
                    onClick={() => {
                      // Create new project
                      const newProject = {
                        id: projects.length + 1,
                        name: projectTitle || 'Untitled Scanner',
                        description: projectDescription || 'Custom trading scanner',
                        lastRun: 'Just created',
                        active: false,
                        code: formattedCode
                      };
                      setProjects([...projects, newProject]);

                      // Close modal and reset state
                      setShowUploadModal(false);
                      setShowProjectCreation(false);
                      setUploadMode(null);
                      setProjectTitle('');
                      setProjectDescription('');
                      setFormattedCode('');
                      setPythonCode('');
                      setUploadedFileName('');

                      // Show success message
                      console.log('Project created successfully:', newProject);
                    }}
                    disabled={!projectTitle.trim() || !formattedCode.trim()}
                    className="btn-primary flex-1 px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Project
                  </button>
                </div>
              </div>
            ) : !uploadMode ? (
              /* Option Selection Screen */
              <div className="space-y-6">
                <p className="text-base" style={{ color: 'var(--studio-text-secondary)' }}>
                  Choose how you'd like to handle your Python scanning code:
                </p>

                <div className="space-y-4">
                  <button
                    onClick={() => setUploadMode('finalized')}
                    className="w-full p-6 text-left rounded-lg border-2 transition-all duration-200 hover:border-yellow-500 hover:bg-yellow-500/5"
                    style={{
                      borderColor: 'var(--studio-border)',
                      background: 'var(--studio-bg-secondary)'
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-2xl">🚀</div>
                      <div>
                        <h4 className="text-lg font-semibold mb-2 text-primary">
                          Upload Finalized Code
                        </h4>
                        <p className="text-sm" style={{ color: 'var(--studio-text-muted)' }}>
                          Your code is ready to run as-is. We'll execute it directly in our system.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setUploadMode('format')}
                    className="w-full p-6 text-left rounded-lg border-2 transition-all duration-200 hover:border-yellow-500 hover:bg-yellow-500/5"
                    style={{
                      borderColor: 'var(--studio-border)',
                      background: 'var(--studio-bg-secondary)'
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-2xl">🤖</div>
                      <div>
                        <h4 className="text-lg font-semibold mb-2 text-primary">
                          Format Code with AI
                        </h4>
                        <p className="text-sm" style={{ color: 'var(--studio-text-muted)' }}>
                          Let our AI agent optimize your code for our ecosystem with multiprocessing, indicators, and charting packages.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="px-6 py-2 border rounded-lg transition-all duration-200 hover:border-gray-500 hover:bg-gray-800"
                    style={{
                      borderColor: 'var(--studio-border)',
                      color: 'var(--studio-text-muted)'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Code Input Screen */
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setUploadMode(null)}
                    className="text-xl hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--studio-text-muted)' }}
                  >
                    ←
                  </button>
                  <h4 className="text-lg font-semibold text-primary">
                    {uploadMode === 'finalized' ? (
                      <>
                        <Play className="inline h-5 w-5 mr-2" />
                        Finalized Code
                      </>
                    ) : (
                      <>
                        <Brain className="inline h-5 w-5 mr-2" />
                        Code to Format
                      </>
                    )}
                  </h4>
                </div>

                {/* Input Method Toggle */}
                <div className="flex items-center justify-center mb-4">
                  <div className="flex border border-gray-600 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setInputMethod('paste')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        inputMethod === 'paste'
                          ? 'bg-yellow-500 text-black'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                        Paste Code
                    </button>
                    <button
                      onClick={() => setInputMethod('file')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        inputMethod === 'file'
                          ? 'bg-yellow-500 text-black'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      📁 Upload File
                    </button>
                  </div>
                </div>

                {/* File Upload Section */}
                {inputMethod === 'file' ? (
                  <div className="space-y-4">
                    <div
                      className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-yellow-500 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('fileInput')?.click()}
                    >
                      <div className="space-y-2">
                        <div className="text-2xl">📁</div>
                        <div className="text-sm font-medium" style={{ color: 'var(--studio-gold)' }}>
                          {uploadedFileName || 'Click to upload or drop your Python file here'}
                        </div>
                        <div className="text-xs text-gray-400">
                          Supports .py, .txt files
                        </div>
                      </div>
                    </div>
                    <input
                      id="fileInput"
                      type="file"
                      accept=".py,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {pythonCode && (
                      <div className="text-xs text-gray-400">
                        ✓ File loaded successfully ({pythonCode.length} characters)
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea
                  value={pythonCode}
                  onChange={(e) => setPythonCode(e.target.value)}
                  placeholder={uploadMode === 'finalized'
                    ? `# Paste your finalized Python scanning code here
# Example:
import pandas as pd
import requests

def scan_stocks():
    results = []
    # Your scanning logic here
    return results`
                    : `# Paste your Python code here for AI formatting
# Our AI will optimize it with:
# - Multiprocessing for speed
# - Our indicator packages
# - Proper charting integration
# - Error handling

import pandas as pd
# Your code here...`
                  }
                    className="studio-input w-full h-48 resize-none font-mono text-sm"
                  />
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setUploadMode(null)}
                    className="flex-1 px-4 py-3 border rounded-lg transition-all duration-200 hover:border-gray-500 hover:bg-gray-800"
                    style={{
                      borderColor: 'var(--studio-border)',
                      color: 'var(--studio-text-muted)'
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={uploadMode === 'finalized' ? handleUploadFinalized : handleUploadFormat}
                    disabled={isFormatting || !pythonCode.trim()}
                    className="btn-primary flex-1 px-4 py-3"
                  >
                    {isFormatting ? (
                      <>
                        <div className="studio-spinner"></div>
                        Formatting...
                      </>
                    ) : (
                      uploadMode === 'finalized' ? 'Upload & Run' : 'Format & Run'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}