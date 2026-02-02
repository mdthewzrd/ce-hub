'use client'

import { useState, useEffect } from 'react';
import { Brain, Upload, Play, TrendingUp, BarChart3, Settings, Search, Target, Filter, Clock, Database } from 'lucide-react';
import EdgeChart, { ChartData, Timeframe, CHART_TEMPLATES } from '@/components/EdgeChart';
import TradingViewToggle from '@/components/TradingViewToggle';
import { CodeFormatterService } from '@/utils/codeFormatterAPI';
import { fetchPolygonData, calculateVWAP, calculateEMA, calculateATR, PolygonBar } from '@/utils/polygonData';
import { fastApiScanService } from '@/services/fastApiScanService';
import { AguiRenataChat } from '@/components/AguiRenataChat';
import { calculateTradingDayTarget, formatTradingDayOffset, getDayOfWeekName, logTradingDayValidation } from '@/utils/tradingDays';

// Real data fetcher using Polygon API (exact wzrd-algo implementation)
async function fetchRealData(symbol: string = "SPY", timeframe: Timeframe, dayOffset: number = 0, baseDate?: Date): Promise<{ chartData: ChartData } | null> {
  const template = CHART_TEMPLATES[timeframe];

  try {
    // Calculate target date using TRADING DAYS (skipping weekends and holidays)
    const baseTargetDate = baseDate ? new Date(baseDate) : new Date();
    const endDate = calculateTradingDayTarget(baseTargetDate, dayOffset);

    console.log(`🎯 TRADING DAY NAVIGATION: Fetching data for ${symbol} on ${formatTradingDayOffset(dayOffset)}`);
    console.log(`🎯 BASE DATE: ${baseTargetDate.toDateString()} (${getDayOfWeekName(baseTargetDate)})`);
    console.log(`🎯 TARGET DATE: ${endDate.toDateString()} (${getDayOfWeekName(endDate)}) - ${dayOffset} trading days`);

    // Fetch real market data from Polygon API with the calculated trading day target end date
    const bars = await fetchPolygonData(symbol, timeframe, template.defaultDays + ((template as any).warmupDays || 0), endDate.toISOString().split('T')[0]);

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

  // Day navigation state for chart controls
  const [dayOffset, setDayOffset] = useState(0);

  // Get the base day from the selected ticker's scan result date
  const getBaseDay = () => {
    if (selectedTicker) {
      const selectedResult = scanResults.find(result => result.ticker === selectedTicker);
      if (selectedResult && selectedResult.date) {
        return new Date(selectedResult.date);
      }
    }
    // Fallback to today if no scan result found
    return new Date();
  };

  // Calculate current trading day based on offset from scan result date
  const baseDay = getBaseDay();
  const currentDay = calculateTradingDayTarget(baseDay, dayOffset);

  // Day navigation functions
  const handlePreviousDay = () => {
    setDayOffset(prev => prev - 1);
  };

  const handleNextDay = () => {
    setDayOffset(prev => prev + 1);
  };

  const handleResetDay = () => {
    setDayOffset(0);
  };

  const handleQuickJump = (jumpDays: number) => {
    console.log(`🎯 Quick Jump: ${jumpDays} days (current offset: ${dayOffset})`);
    setDayOffset(prev => {
      const newOffset = prev + jumpDays;
      console.log(`🎯 New offset: ${newOffset}`);
      return newOffset;
    });
  };

  // Day navigation validation
  const canGoPrevious = dayOffset > -14;
  const canGoNext = dayOffset < 14;

  // Day navigation configuration
  const dayNavigation = {
    currentDay,
    dayOffset,
    canGoPrevious,
    canGoNext,
    onPreviousDay: handlePreviousDay,
    onNextDay: handleNextDay,
    onResetDay: handleResetDay,
    onQuickJump: handleQuickJump,
  };

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

  // Load chart data when ticker, timeframe, or dayOffset changes
  useEffect(() => {
    if (selectedTicker) {
      setIsLoadingData(true);

      // Get the scan result date for the selected ticker
      const selectedResult = scanResults.find(result => result.ticker === selectedTicker);
      const scanResultDate = selectedResult?.date ? new Date(selectedResult.date) : new Date();

      console.log(`🎯 CHART DATA FETCH: ${selectedTicker} | ${formatTradingDayOffset(dayOffset)} | Base: ${scanResultDate.toDateString()} (${getDayOfWeekName(scanResultDate)})`);

      fetchRealData(selectedTicker, timeframe, dayOffset, scanResultDate)
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
  }, [selectedTicker, timeframe, dayOffset, scanResults]);

  // BULLETPROOF Trading Day Validation on startup
  useEffect(() => {
    console.log('🚀 Running BULLETPROOF Trading Day Validation...');
    logTradingDayValidation(2024); // Validate 2024 trading days
    logTradingDayValidation(2023); // Also test 2023 to show multi-year support
  }, []); // Run once on mount

  // Load SPY by default on mount and preload scan results
  useEffect(() => {
    if (!selectedTicker) {
      setSelectedTicker('SPY');
    }

    // Load excellent historical scan results and populate cache
    const loadHistoricalResults = async () => {
      console.log('🔍 Loading historical LC scan results and populating cache...');

      try {
        // Load our current working scan with ORIGINAL LC algorithm results
        const response = await fetch('http://localhost:8000/api/scan/status/scan_20251030_181330_13313f3a');

        if (response.ok) {
          const data = await response.json();

          if (data.results && data.results.length > 0) {
            console.log(`✅ Loaded ${data.results.length} historical LC results`);
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
            console.log(`🎯 Dashboard loaded with ${transformedResults.length} historical results and cache populated`);
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
    console.log('🔄 Polling for scan completion...');

    const maxAttempts = 60; // 5 minutes max (5 second intervals)
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const statusResponse = await fetch(`http://localhost:8000/api/scan/status/${scanId}`);

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log(`📊 Scan ${scanId}: ${statusData.progress_percent}% - ${statusData.message}`);

          if (statusData.status === 'completed') {
            console.log('✅ Scan completed! Fetching results...');

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

                console.log(`🎯 Found ${transformedResults.length} LC patterns!`);
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
    console.log('🔍 Starting scan execution...');
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
          console.log('✅ Scan started successfully, scan_id:', data.scan_id);

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
    setDayOffset(0); // Reset to Day 0 when selecting a new ticker
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
      console.log(`⚡ Loading ${cachedResults.length} cached results for ${selectedProject.name} instantly`);
      setScanResults(cachedResults);
    } else {
      console.log(`📝 No cached results for ${selectedProject.name}, showing empty state`);
      setScanResults([]);
    }

    console.log(`✅ Switched to ${selectedProject.name} with ${cachedResults.length} cached results`);
  };


  return (
    <>
    <div className="min-h-screen" style={{ background: '#111111', color: 'var(--studio-text)' }}>
      {/* Fixed Left Navigation Sidebar */}
      <div
        className="w-72 flex flex-col"
        style={{
          position: 'fixed',
          top: '0',
          left: '0',
          height: '100vh',
          width: '288px',
          zIndex: '30',
          background: '#111111'
        }}
      >
        {/* Enhanced Logo Section */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
            backgroundColor: '#111111'
          }}
        >
          <div className="flex items-center gap-4">
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #D4AF37 0%, rgba(212, 175, 55, 0.8) 100%)',
                boxShadow: '0 4px 16px rgba(212, 175, 55, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(212, 175, 55, 0.3)'
              }}
            >
              <Brain className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#D4AF37',
                  letterSpacing: '0.5px',
                  textShadow: '0 2px 4px rgba(212, 175, 55, 0.3)',
                  marginBottom: '2px'
                }}
              >
                Traderra
              </h1>
              <p
                style={{
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '500',
                  letterSpacing: '0.3px'
                }}
              >
                AI Trading Platform
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Upload Strategy Button */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid rgba(212, 175, 55, 0.15)'
          }}
        >
          <button
            onClick={openUploadModal}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              color: '#ffffff',
              backgroundColor: 'rgba(212, 175, 55, 0.15)',
              fontSize: '14px',
              fontWeight: '600',
              letterSpacing: '0.3px',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(212, 175, 55, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(212, 175, 55, 0.25)';
              e.target.style.borderColor = 'rgba(212, 175, 55, 0.6)';
              e.target.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.2)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(212, 175, 55, 0.15)';
              e.target.style.borderColor = 'rgba(212, 175, 55, 0.4)';
              e.target.style.boxShadow = '0 2px 8px rgba(212, 175, 55, 0.1)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <Upload className="h-4 w-4" style={{ color: '#D4AF37' }} />
            Upload Strategy
          </button>
        </div>

        {/* Enhanced Projects List */}
        <div
          className="flex-1"
          style={{
            padding: '20px',
            overflowY: 'auto'
          }}
        >
          <h3
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#D4AF37',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '16px',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
            }}
          >
            Projects
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: project.active
                    ? '1px solid rgba(212, 175, 55, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  background: project.active
                    ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.08) 100%)'
                    : 'rgba(17, 17, 17, 0.6)',
                  boxShadow: project.active
                    ? '0 4px 12px rgba(212, 175, 55, 0.2)'
                    : '0 2px 6px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (!project.active) {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.target.style.borderColor = 'rgba(212, 175, 55, 0.2)';
                    e.target.style.transform = 'translateX(2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!project.active) {
                    e.target.style.backgroundColor = 'rgba(17, 17, 17, 0.6)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.transform = 'translateX(0)';
                  }
                }}
              >
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: project.active ? '#D4AF37' : '#ffffff',
                    marginBottom: '6px',
                    letterSpacing: '0.3px'
                  }}
                >
                  {project.name}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: '500'
                  }}
                >
                  {project.active && isExecuting ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Settings
                        className="h-3 w-3 animate-spin"
                        style={{ color: '#D4AF37' }}
                      />
                      <span style={{ color: '#D4AF37' }}>Scanning...</span>
                    </span>
                  ) : (
                    <span style={{ color: project.active ? '#D4AF37' : 'rgba(255, 255, 255, 0.6)' }}>
                      {project.active ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(212, 175, 55, 0.2)',
            textAlign: 'center',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)',
            backgroundColor: 'rgba(17, 17, 17, 0.8)',
            fontWeight: '500',
            letterSpacing: '0.5px'
          }}
        >
          Traderra v2.0
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className="flex flex-col min-w-0 dashboard-responsive main-content-area"
        style={{
          marginLeft: '296px', /* 288px sidebar + 8px spacing */
          marginRight: '30rem', /* 480px Renata panel exactly */
          width: 'calc(100vw - 296px - 30rem)',
          maxWidth: '100%',
          overflowX: 'hidden',
          paddingTop: '0',
          border: '1px solid #1a1a1a', /* Very subtle border */
          borderRadius: '4px',
          backgroundColor: '#0a0a0a' /* Dark background for contrast */
        }}
      >
        {/* Header */}
        <header
          style={{
            backgroundColor: '#111111',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
          }}
        >
          <div className="w-full px-6 py-6 header-content">
            <div className="flex items-center justify-between flex-wrap gap-4 header-container">
              <div className="flex items-center gap-8 min-w-0 flex-shrink-0 header-logo-section">
                <div className="flex items-center gap-4 flex-shrink-0">
                  <Brain
                    className="h-8 w-8 flex-shrink-0"
                    style={{
                      color: '#D4AF37',
                      filter: 'drop-shadow(0 2px 4px rgba(212, 175, 55, 0.3))'
                    }}
                  />
                  <span
                    style={{
                      fontSize: '22px',
                      fontWeight: '700',
                      color: '#ffffff',
                      letterSpacing: '0.8px',
                      textShadow: '0 2px 4px rgba(212, 175, 55, 0.2)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Traderra
                  </span>
                </div>
                <div
                  className="header-edge-dev"
                  style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#D4AF37',
                    backgroundColor: 'rgba(212, 175, 55, 0.12)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '2px solid rgba(212, 175, 55, 0.4)',
                    letterSpacing: '0.5px',
                    boxShadow: '0 2px 8px rgba(212, 175, 55, 0.2)',
                    backdropFilter: 'blur(4px)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  edge.dev
                </div>
              </div>
              <div
                className="flex items-center gap-3 text-sm flex-shrink-0 header-market-scanner bg-studio-gold/8 border border-studio-border rounded-lg px-5 py-3"
                style={{ whiteSpace: 'nowrap', maxWidth: 'fit-content' }}
              >
                <TrendingUp className="h-4 w-4 flex-shrink-0 text-studio-gold" />
                <span className="text-studio-text font-medium">Market Scanner</span>
                <span className="text-studio-muted">•</span>
                <span className="text-studio-gold font-semibold">Real-time Analysis</span>
              </div>
            </div>

            {/* Enhanced Controls Row */}
            <div
              className="enhanced-controls-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                marginTop: '16px',
                backgroundColor: 'rgba(17, 17, 17, 0.6)',
                padding: '18px 24px',
                borderRadius: '12px',
                border: '1px solid rgba(212, 175, 55, 0.15)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                overflowX: 'auto'
              }}
            >
              <TradingViewToggle
                value={viewMode}
                onChange={setViewMode}
              />

              {/* Date Range Controls */}
              <div className="flex items-center gap-4 flex-wrap">
                {/* From Date */}
                <div className="flex items-center gap-2">
                  <label htmlFor="scanStartDate" className="text-sm font-bold text-studio-gold uppercase tracking-wide">
                    FROM:
                  </label>
                  <input
                    id="scanStartDate"
                    type="date"
                    value={scanStartDate}
                    onChange={(e) => setScanStartDate(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-studio-border bg-studio-surface text-studio-text font-medium text-sm focus:border-studio-gold focus:ring-2 focus:ring-studio-gold/20 transition-colors"
                  />
                </div>

                {/* To Date */}
                <div className="flex items-center gap-2">
                  <label htmlFor="scanEndDate" className="text-sm font-bold text-studio-gold uppercase tracking-wide">
                    TO:
                  </label>
                  <input
                    id="scanEndDate"
                    type="date"
                    value={scanEndDate}
                    onChange={(e) => setScanEndDate(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-studio-border bg-studio-surface text-studio-text font-medium text-sm focus:border-studio-gold focus:ring-2 focus:ring-studio-gold/20 transition-colors"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => {
                      const today = new Date();
                      const thirtyDaysAgo = new Date(today);
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      setScanStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
                      setScanEndDate(today.toISOString().split('T')[0]);
                    }}
                    className="btn-secondary px-3 py-1 text-xs font-semibold"
                  >
                    30D
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const ninetyDaysAgo = new Date(today);
                      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                      setScanStartDate(ninetyDaysAgo.toISOString().split('T')[0]);
                      setScanEndDate(today.toISOString().split('T')[0]);
                    }}
                    className="btn-secondary px-3 py-1 text-xs font-semibold"
                  >
                    90D
                  </button>
                  <button
                    onClick={() => {
                      setScanStartDate('2024-01-01');
                      setScanEndDate('2024-12-31');
                    }}
                    className="btn-secondary px-3 py-1 text-xs font-semibold"
                  >
                    2024
                  </button>
                </div>
              </div>

              {/* Run Scan Button */}
              <button
                onClick={handleRunScan}
                disabled={isExecuting}
                className={`btn-secondary ${isExecuting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-studio-gold/30 hover:border-studio-gold/60'}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginLeft: '12px'
                }}
              >
                {isExecuting ? (
                  <>
                    <Settings className="h-4 w-4 animate-spin text-studio-gold/60" />
                    Running...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 text-studio-gold" />
                    Run Scan
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main
          style={{
            padding: '20px 20px 20px 10px', /* Minimal left padding */
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            minHeight: '100vh',
            overflow: 'hidden'
          }}
        >
          {/* Professional Dashboard Container */}
          <div
            style={{
              backgroundColor: 'rgba(17, 17, 17, 0.6)',
              borderRadius: '16px',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(10px)',
              padding: '28px 28px 28px 10px', /* Minimal left padding */
              minHeight: 'calc(100vh - 40px)',
              overflow: 'hidden'
            }}
          >
          {viewMode === 'table' ? (
            /* TABLE MODE: Larger scan results and stats, scrollable chart below */
            <div style={{ padding: '0', height: '100%' }}>
              {/* Top Row - Scan Results and Statistics (Large) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '20px',
                  marginBottom: '20px'
                }}
              >
                {/* Scan Results - Left (Large) */}
                <div
                  style={{
                    backgroundColor: 'rgba(17, 17, 17, 0.8)',
                    border: '2px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '8px',
                    padding: '24px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '20px',
                      borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
                      paddingBottom: '12px'
                    }}
                  >
                    <BarChart3
                      style={{
                        width: '20px',
                        height: '20px',
                        color: '#D4AF37',
                        marginRight: '12px'
                      }}
                    />
                    <h3
                      style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#D4AF37',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        margin: '0'
                      }}
                    >
                      Scan Results
                      {scanStartDate && scanEndDate && (
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: '400',
                            color: 'rgba(255, 255, 255, 0.6)',
                            marginLeft: '8px',
                            textTransform: 'none'
                          }}
                        >
                          - {new Date(scanStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to {new Date(scanEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </h3>
                  </div>
                  <div
                    style={{
                      height: '320px',
                      overflowY: 'auto',
                      backgroundColor: 'rgba(17, 17, 17, 0.4)',
                      borderRadius: '8px',
                      border: '1px solid rgba(212, 175, 55, 0.1)'
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
                          <th
                            onClick={() => handleSort('ticker')}
                            style={{
                              cursor: 'pointer',
                              padding: '14px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: sortField === 'ticker' ? '#D4AF37' : 'rgba(255, 255, 255, 0.9)',
                              fontWeight: '600',
                              fontSize: '12px',
                              letterSpacing: '0.5px',
                              textAlign: 'left',
                              transition: 'color 0.2s ease',
                              textTransform: 'uppercase'
                            }}
                            onMouseEnter={(e) => {
                              if (sortField !== 'ticker') {
                                e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.15)';
                                e.currentTarget.style.color = '#D4AF37';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (sortField !== 'ticker') {
                                e.currentTarget.style.backgroundColor = 'rgba(17, 17, 17, 0.8)';
                                e.currentTarget.style.color = '#ffffff';
                              }
                            }}
                          >
                            TICKER {sortField === 'ticker' && (
                              <span style={{ color: '#D4AF37', marginLeft: '4px' }}>
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </th>
                          <th
                            onClick={() => handleSort('date')}
                            style={{
                              cursor: 'pointer',
                              padding: '14px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: sortField === 'date' ? '#D4AF37' : 'rgba(255, 255, 255, 0.9)',
                              fontWeight: '600',
                              fontSize: '12px',
                              letterSpacing: '0.5px',
                              textAlign: 'left',
                              transition: 'color 0.2s ease',
                              textTransform: 'uppercase'
                            }}
                            onMouseEnter={(e) => {
                              if (sortField !== 'date') {
                                e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.15)';
                                e.currentTarget.style.color = '#D4AF37';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (sortField !== 'date') {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                              }
                            }}
                          >
                            DATE {sortField === 'date' && (
                              <span style={{ color: '#D4AF37', marginLeft: '4px' }}>
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </th>
                          <th
                            onClick={() => handleSort('gapPercent')}
                            style={{
                              cursor: 'pointer',
                              padding: '14px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: sortField === 'gapPercent' ? '#D4AF37' : 'rgba(255, 255, 255, 0.9)',
                              fontWeight: '600',
                              fontSize: '12px',
                              letterSpacing: '0.5px',
                              textAlign: 'left',
                              transition: 'color 0.2s ease',
                              textTransform: 'uppercase'
                            }}
                            onMouseEnter={(e) => {
                              if (sortField !== 'gapPercent') {
                                e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.15)';
                                e.currentTarget.style.color = '#D4AF37';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (sortField !== 'gapPercent') {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                              }
                            }}
                          >
                            GAP % {sortField === 'gapPercent' && (
                              <span style={{ color: '#D4AF37', marginLeft: '4px' }}>
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </th>
                          <th
                            onClick={() => handleSort('volume')}
                            style={{
                              cursor: 'pointer',
                              padding: '14px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: sortField === 'volume' ? '#D4AF37' : 'rgba(255, 255, 255, 0.9)',
                              fontWeight: '600',
                              fontSize: '12px',
                              letterSpacing: '0.5px',
                              textAlign: 'left',
                              transition: 'color 0.2s ease',
                              textTransform: 'uppercase'
                            }}
                            onMouseEnter={(e) => {
                              if (sortField !== 'volume') {
                                e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.15)';
                                e.currentTarget.style.color = '#D4AF37';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (sortField !== 'volume') {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                              }
                            }}
                          >
                            VOLUME {sortField === 'volume' && (
                              <span style={{ color: '#D4AF37', marginLeft: '4px' }}>
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </th>
                          <th
                            onClick={() => handleSort('score')}
                            style={{
                              cursor: 'pointer',
                              padding: '14px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: sortField === 'score' ? '#D4AF37' : 'rgba(255, 255, 255, 0.9)',
                              fontWeight: '600',
                              fontSize: '12px',
                              letterSpacing: '0.5px',
                              textAlign: 'left',
                              transition: 'color 0.2s ease',
                              textTransform: 'uppercase'
                            }}
                            onMouseEnter={(e) => {
                              if (sortField !== 'score') {
                                e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.15)';
                                e.currentTarget.style.color = '#D4AF37';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (sortField !== 'score') {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                              }
                            }}
                          >
                            SCORE {sortField === 'score' && (
                              <span style={{ color: '#D4AF37', marginLeft: '4px' }}>
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedResults.map((result, index) => (
                          <tr
                            key={index}
                            onClick={() => handleTickerClick(result.ticker)}
                            style={{
                              cursor: 'pointer',
                              backgroundColor: selectedTicker === result.ticker
                                ? 'rgba(212, 175, 55, 0.15)'
                                : 'transparent',
                              border: selectedTicker === result.ticker
                                ? '1px solid rgba(212, 175, 55, 0.4)'
                                : '1px solid rgba(255, 255, 255, 0.1)',
                              transition: 'all 0.2s ease',
                              borderRadius: selectedTicker === result.ticker ? '4px' : '0px',
                              boxShadow: selectedTicker === result.ticker
                                ? '0 2px 8px rgba(212, 175, 55, 0.2)'
                                : 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (selectedTicker !== result.ticker) {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.2)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedTicker !== result.ticker) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                              }
                            }}
                          >
                            <td style={{
                              color: selectedTicker === result.ticker ? '#D4AF37' : '#ffffff',
                              fontWeight: 'bold',
                              padding: '12px 16px',
                              fontSize: '13px',
                              fontFamily: 'monospace'
                            }}>
                              {result.ticker}
                            </td>
                            <td style={{
                              color: selectedTicker === result.ticker ? '#ffffff' : '#999999',
                              padding: '12px 16px',
                              fontSize: '12px'
                            }}>
                              {result.date ? new Date(result.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : '-'}
                            </td>
                            <td style={{
                              color: '#10b981',
                              fontWeight: '600',
                              padding: '12px 16px',
                              fontSize: '13px',
                              fontFamily: 'monospace'
                            }}>
                              {result.gapPercent.toFixed(1)}%
                            </td>
                            <td style={{
                              color: selectedTicker === result.ticker ? '#ffffff' : '#999999',
                              padding: '12px 16px',
                              fontSize: '12px',
                              fontFamily: 'monospace'
                            }}>
                              {(result.volume / 1000000).toFixed(1)}M
                            </td>
                            <td style={{
                              color: '#D4AF37',
                              fontWeight: '600',
                              padding: '12px 16px',
                              fontSize: '13px',
                              fontFamily: 'monospace'
                            }}>
                              {result.score.toFixed(1)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Statistics - Right (Large) */}
                <div
                  style={{
                    backgroundColor: 'rgba(17, 17, 17, 0.8)',
                    border: '2px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '8px',
                    padding: '24px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '20px',
                      paddingBottom: '16px',
                      borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
                    }}
                  >
                    <TrendingUp
                      className="section-icon"
                      style={{
                        color: '#D4AF37',
                        width: '20px',
                        height: '20px',
                        marginRight: '12px'
                      }}
                    />
                    <h3
                      style={{
                        color: '#D4AF37',
                        fontSize: '16px',
                        fontWeight: '700',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        margin: '0'
                      }}
                    >
                      Statistics
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div
                      style={{
                        backgroundColor: 'rgba(212, 175, 55, 0.1)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        borderRadius: '6px',
                        padding: '16px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        color: '#D4AF37',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '8px'
                      }}>
                        Total Results
                      </div>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        fontFamily: 'monospace'
                      }}>
                        {scanResults.length}
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '6px',
                        padding: '16px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        color: '#10b981',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '8px'
                      }}>
                        Avg Gap %
                      </div>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#10b981',
                        fontFamily: 'monospace'
                      }}>
                        {(scanResults.reduce((sum, r) => sum + r.gapPercent, 0) / scanResults.length).toFixed(1)}%
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '6px',
                        padding: '16px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        color: '#3b82f6',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '8px'
                      }}>
                        Avg Volume
                      </div>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#3b82f6',
                        fontFamily: 'monospace'
                      }}>
                        {(scanResults.reduce((sum, r) => sum + r.volume, 0) / scanResults.length / 1000000).toFixed(1)}M
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        padding: '16px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 255, 255, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        color: '#ffffff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '8px'
                      }}>
                        Date Range
                      </div>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        fontFamily: 'monospace'
                      }}>
                        {timeframe === 'day' ? '90' :
                         timeframe === 'hour' ? '30' :
                         timeframe === '15min' ? '10' : '2'}<span style={{ fontSize: '14px', color: '#999999' }}>d</span>
                      </div>
                    </div>
                  </div>

                  {selectedTicker && (
                    <div
                      style={{
                        marginTop: '24px',
                        padding: '16px',
                        borderRadius: '6px',
                        background: 'rgba(212, 175, 55, 0.15)',
                        border: '2px solid rgba(212, 175, 55, 0.4)',
                        boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        color: '#D4AF37',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '6px'
                      }}>
                        📈 Selected: <span style={{ marginLeft: '8px', fontFamily: 'monospace' }}>{selectedTicker}</span>
                      </div>
                      <div style={{
                        color: '#ffffff',
                        fontSize: '12px',
                        opacity: 0.8
                      }}>
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
                ) : selectedTicker ? (
                  <div style={{ width: '100%', overflow: 'hidden' }}>
                    <EdgeChart
                      symbol={selectedTicker}
                      timeframe={timeframe}
                      data={selectedData?.chartData || { x: [], open: [], high: [], low: [], close: [], volume: [] }}
                      onTimeframeChange={setTimeframe}
                      className="chart-container"
                      dayNavigation={dayNavigation}
                    />
                  </div>
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
            <div
              className="chart-mode-layout"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                width: '100%'
              }}
            >
              {/* Chart Section (Full Width) */}
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
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
                ) : selectedTicker ? (
                  <div style={{ width: '100%', overflow: 'hidden' }}>
                    <EdgeChart
                      symbol={selectedTicker}
                      timeframe={timeframe}
                      data={selectedData?.chartData || { x: [], open: [], high: [], low: [], close: [], volume: [] }}
                      onTimeframeChange={setTimeframe}
                      className="chart-container"
                      dayNavigation={dayNavigation}
                    />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center studio-surface border studio-border rounded-lg" style={{
                    height: '700px'
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

              {/* Bottom Section - Organized Grid Layout */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '20px',
                  width: '100%'
                }}
              >
                {/* Left Column - Scan Results */}
                <div className="studio-card">
                  <div className="section-header">
                    <BarChart3 className="section-icon text-primary" />
                    <h3 className="section-title studio-text">
                      Scan Results
                      {scanStartDate && scanEndDate && (
                        <span className="text-sm font-normal text-studio-muted ml-2">
                          - {new Date(scanStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to {new Date(scanEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </h3>
                  </div>
                  <div style={{ height: '400px' }} className="overflow-y-auto studio-scrollbar">
                    <table className="studio-table">
                      <thead>
                        <tr>
                          <th onClick={() => handleSort('ticker')} className="text-xs p-2 cursor-pointer hover:bg-gray-700 transition-colors">
                            TICKER {sortField === 'ticker' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th onClick={() => handleSort('date')} className="text-xs p-2 cursor-pointer hover:bg-gray-700 transition-colors">
                            DATE {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th onClick={() => handleSort('gapPercent')} className="text-xs p-2 cursor-pointer hover:bg-gray-700 transition-colors">
                            GAP % {sortField === 'gapPercent' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th onClick={() => handleSort('score')} className="text-xs p-2 cursor-pointer hover:bg-gray-700 transition-colors">
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
                            <td className="p-2 text-sm font-bold studio-text">{result.ticker}</td>
                            <td className="p-2 text-sm text-studio-muted">{result.date ? new Date(result.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : '-'}</td>
                            <td className="p-2 text-sm status-positive">{result.gapPercent.toFixed(1)}%</td>
                            <td className="p-2 text-sm font-semibold text-studio-gold">{result.score.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Column - Statistics & Selected Asset */}
                <div className="space-y-4">
                  {/* Statistics */}
                  <div className="studio-card">
                    <div className="section-header">
                      <TrendingUp className="section-icon text-primary" />
                      <h3 className="section-title studio-text">Statistics</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
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
                        <div className="studio-metric-value text-xl text-studio-gold">
                          {(scanResults.reduce((sum, r) => sum + r.volume, 0) / scanResults.length / 1000000).toFixed(1)}M
                        </div>
                      </div>
                      <div className="studio-metric-card">
                        <div className="studio-metric-label text-xs">Range</div>
                        <div className="studio-metric-value text-xl text-studio-muted">
                          {timeframe === 'day' ? '90d' :
                           timeframe === 'hour' ? '30d' :
                           timeframe === '15min' ? '10d' : '2d'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selected Asset Info */}
                  {selectedTicker && (
                    <div className="studio-card">
                      <div className="section-header">
                        <Target className="section-icon text-primary" />
                        <h3 className="section-title studio-text">Selected Asset</h3>
                      </div>
                      <div className="p-4 rounded-lg bg-studio-surface border border-studio-gold/30">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-2xl font-bold text-studio-gold">{selectedTicker}</div>
                          <div className="text-sm text-studio-muted">
                            {timeframe.toUpperCase()} • {CHART_TEMPLATES[timeframe].defaultDays}d
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-studio-muted">Timeframe:</span>
                            <span className="ml-1 font-medium studio-text">{timeframe}</span>
                          </div>
                          <div>
                            <span className="text-studio-muted">Period:</span>
                            <span className="ml-1 font-medium studio-text">{CHART_TEMPLATES[timeframe].defaultDays} days</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>

      {/* Fixed Right Sidebar - Renata AI */}
      <div
        className="flex flex-col"
        style={{
          position: 'fixed',
          top: '0',
          right: '0',
          height: '100vh',
          width: '30rem',
          zIndex: '30',
          background: 'rgba(17, 17, 17, 0.95)',
          borderLeft: '1px solid rgba(212, 175, 55, 0.2)',
          backdropFilter: 'blur(10px)',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Professional Renata AI Chat Interface */}
        <div className="h-full flex flex-col">
          {/* Header */}
          <div
            style={{
              padding: '24px',
              borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
              background: 'rgba(17, 17, 17, 0.8)'
            }}
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #D4AF37 0%, rgba(212, 175, 55, 0.8) 100%)',
                  boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(212, 175, 55, 0.3)'
                }}
              >
                <Brain className="h-5 w-5 text-black" />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#D4AF37',
                    letterSpacing: '0.5px',
                    marginBottom: '2px'
                  }}
                >
                  Renata AI
                </h3>
                <p
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: '500'
                  }}
                >
                  Trading Assistant
                </p>
              </div>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              padding: '20px',
              background: 'rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Welcome Message */}
            <div
              style={{
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}
            >
              <p
                style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: '1.5',
                  margin: '0'
                }}
              >
                👋 Welcome! I'm Renata, your AI trading assistant. I can help you analyze markets, optimize scanners, and provide trading insights.
              </p>
            </div>

            {/* Sample conversation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* User message */}
              <div className="flex justify-end">
                <div
                  style={{
                    backgroundColor: 'rgba(212, 175, 55, 0.2)',
                    border: '1px solid rgba(212, 175, 55, 0.4)',
                    borderRadius: '12px 12px 4px 12px',
                    padding: '12px 16px',
                    maxWidth: '80%'
                  }}
                >
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      lineHeight: '1.4',
                      margin: '0'
                    }}
                  >
                    What do you think about today's market conditions?
                  </p>
                </div>
              </div>

              {/* AI response */}
              <div className="flex justify-start">
                <div
                  style={{
                    backgroundColor: 'rgba(17, 17, 17, 0.8)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '12px 12px 12px 4px',
                    padding: '12px 16px',
                    maxWidth: '80%'
                  }}
                >
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      lineHeight: '1.4',
                      margin: '0'
                    }}
                  >
                    Based on the current scan results, I'm seeing increased volatility with some interesting gap patterns. The volume profile suggests institutional interest in select sectors.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: '28px',
              borderTop: '1px solid rgba(212, 175, 55, 0.2)',
              background: 'rgba(17, 17, 17, 0.8)'
            }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              <input
                type="text"
                placeholder="Ask Renata anything about trading..."
                style={{
                  flex: '1',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  fontSize: '14px',
                  color: '#ffffff',
                  backgroundColor: 'rgba(17, 17, 17, 0.9)',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(212, 175, 55, 0.6)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  color: '#D4AF37',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(212, 175, 55, 0.2)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(212, 175, 55, 0.1)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
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
                      📝 Paste Code
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