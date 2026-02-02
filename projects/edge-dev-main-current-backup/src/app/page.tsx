'use client'

import { useState, useEffect } from 'react';
import { Brain, Upload, Play, TrendingUp, BarChart3, Settings, Search, Target, Filter, Clock, Database, MessageCircle, ChevronUp, ChevronDown, Trash2, RefreshCw, Save } from 'lucide-react';
import EdgeChart, { ChartData, Timeframe, CHART_TEMPLATES } from '@/components/EdgeChart';
import TradingViewToggle from '@/components/TradingViewToggle';
import { CodeFormatterService } from '@/utils/codeFormatterAPI';
import { fetchPolygonData, calculateVWAP, calculateEMA, calculateATR, PolygonBar } from '@/utils/polygonData';
import { fastApiScanService } from '@/services/fastApiScanService';
import RenataPopup from '@/components/RenataPopup';
import { calculateTradingDayTarget, formatTradingDayOffset, getDayOfWeekName, logTradingDayValidation } from '@/utils/tradingDays';
import { projectApiService } from '@/services/projectApiService';

// Real data fetcher using Polygon API (exact wzrd-algo implementation)
async function fetchRealData(symbol: string = "SPY", timeframe: Timeframe, dayOffset: number = 0, baseDate?: Date): Promise<{ chartData: ChartData } | null> {
  const template = CHART_TEMPLATES[timeframe];

  try {
    // Calculate target date using TRADING DAYS (skipping weekends and holidays)
    const baseTargetDate = baseDate ? new Date(baseDate) : new Date();
    const endDate = calculateTradingDayTarget(baseTargetDate, dayOffset);

    console.log(`  TRADING DAY NAVIGATION: Fetching data for ${symbol} on ${formatTradingDayOffset(dayOffset)}`);
    console.log(`  BASE DATE: ${baseTargetDate.toDateString()} (${getDayOfWeekName(baseTargetDate)})`);
    console.log(`  TARGET DATE: ${endDate.toDateString()} (${getDayOfWeekName(endDate)}) - ${dayOffset} trading days`);

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

// Mock scan results with realistic wins and losses for development testing
const MOCK_SCAN_RESULTS = [
  { ticker: 'BYND', date: '2024-10-25', gapPercent: 53.5, volume: 11518000, score: 86.7, result: 'win', pnl: '+24.3%' },
  { ticker: 'WOLF', date: '2024-10-24', gapPercent: 699.7, volume: 1468000, score: 95.3, result: 'win', pnl: '+187.2%' },
  { ticker: 'HOUR', date: '2024-10-23', gapPercent: 288.8, volume: 378240000, score: 92.1, result: 'loss', pnl: '-8.7%' },
  { ticker: 'THAR', date: '2024-10-22', gapPercent: 199.5, volume: 587300000, score: 89.4, result: 'win', pnl: '+45.8%' },
  { ticker: 'ATNF', date: '2024-10-21', gapPercent: 382.1, volume: 1248000, score: 93.8, result: 'loss', pnl: '-12.4%' },
  { ticker: 'ETHZ', date: '2024-10-18', gapPercent: 392.1, volume: 1248000, score: 94.2, result: 'win', pnl: '+89.5%' },
  { ticker: 'MCVT', date: '2024-10-17', gapPercent: 178.8, volume: 223830000, score: 88.5, result: 'loss', pnl: '-15.2%' },
  { ticker: 'SUTG', date: '2024-10-16', gapPercent: 178.8, volume: 223830000, score: 87.9, result: 'loss', pnl: '-6.1%' },
  { ticker: 'VKTX', date: '2024-10-15', gapPercent: 45.2, volume: 8945000, score: 84.1, result: 'loss', pnl: '-22.8%' },
  { ticker: 'INMB', date: '2024-10-14', gapPercent: 67.3, volume: 12340000, score: 87.6, result: 'win', pnl: '+18.9%' },
  { ticker: 'CTXR', date: '2024-10-11', gapPercent: 34.1, volume: 6780000, score: 81.2, result: 'loss', pnl: '-9.3%' },
  { ticker: 'BBIG', date: '2024-10-10', gapPercent: 156.7, volume: 45600000, score: 90.8, result: 'win', pnl: '+78.4%' },
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
  const [scanStartDate, setScanStartDate] = useState('2025-01-01'); // Start date for range scanning
  const [scanEndDate, setScanEndDate] = useState('2025-11-19'); // End date for range scanning
  const [selectedData, setSelectedData] = useState<{ chartData: ChartData } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'finalized' | 'format' | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const [formattingResult, setFormattingResult] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table'); // T/C toggle
  const [projects, setProjects] = useState<any[]>([]);
  const [savedScans, setSavedScans] = useState<any[]>([]);
  const [isSavedScansOpen, setIsSavedScansOpen] = useState(false);
  const [sortField, setSortField] = useState<'ticker' | 'date' | 'gapPercent' | 'volume' | 'score'>('gapPercent');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isRenataPopupOpen, setIsRenataPopupOpen] = useState(false);
  const [showParameterPreview, setShowParameterPreview] = useState(false);
  const [parameterData, setParameterData] = useState<any>(null);

  // Reusable function to load projects from API
  const loadProjects = async () => {
    try {
      console.log('  Loading projects from API...');
      const apiProjects = await projectApiService.getProjects();
      console.log('  Loaded projects:', apiProjects);

      // Transform API projects to match the expected format for sidebar
      const transformedProjects = apiProjects.map((project, index) => ({
        id: project.id || index + 1,
        name: project.name || `Project ${index + 1}`,
        active: index === 0, // Make first project active by default
        project_data: project // Keep original project data for reference
      }));

      setProjects(transformedProjects);
    } catch (error) {
      console.error('❌ Failed to load projects:', error);
      // Fallback to empty array if API fails
      setProjects([]);
    }
  };

  // Fetch projects from API on component mount and set up periodic refresh
  useEffect(() => {
    // Temporarily disable automatic project loading due to backend connectivity issues
    // loadProjects();

    // Set up periodic refresh every 10 seconds to catch new projects
    // const refreshInterval = setInterval(() => {
    //   loadProjects();
    // }, 10000);

    // Cleanup interval on component unmount
    // return () => clearInterval(refreshInterval);
  }, []); // Run once on component mount

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
    console.log(`  Quick Jump: ${jumpDays} days (current offset: ${dayOffset})`);
    setDayOffset(prev => {
      const newOffset = prev + jumpDays;
      console.log(`  New offset: ${newOffset}`);
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

      console.log(`  CHART DATA FETCH: ${selectedTicker} | ${formatTradingDayOffset(dayOffset)} | Base: ${scanResultDate.toDateString()} (${getDayOfWeekName(scanResultDate)})`);

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

  // Load saved scans from localStorage on mount
  useEffect(() => {
    const loadedScans = loadSavedScansFromLocal();
    if (loadedScans && loadedScans.length > 0) {
      console.log(`📂 Loaded ${loadedScans.length} saved scans from localStorage`);
    }
  }, []); // Run once on mount

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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

        const response = await fetch('http://localhost:8000/api/scan/status/scan_20251030_181330_13313f3a', {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();

          if (data.results && data.results.length > 0) {
            console.log(`  Loaded ${data.results.length} historical LC results`);
            console.log(`📊 Top results: ${data.results.slice(0, 3).map((r: any) => `${r.ticker} (${r.gapPercent}%)`).join(', ')}`);

            const transformedResults = data.results.map((result: any) => ({
              ticker: result.ticker,
              date: result.date,
              gapPercent: result.gapPercent,
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
        console.log(`💡 Backend service not available, using mock data. This is normal for development.`);
        if (error instanceof Error && error.name !== 'AbortError') {
          console.log(`  Background error (can be ignored):`, error.message);
        }
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
                  gapPercent: result.gapPercent,
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
    console.log('🚀 Starting enhanced Renata API scan execution...');
    setIsExecuting(true);

    try {
      // Get current scanner code and configuration
      const scannerCode = pythonCode || '';
      const scannerName = uploadedFileName || 'Custom Scanner';

      if (!scannerCode.trim()) {
        console.error('❌ No scanner code available');
        setScanResults([]);
        return;
      }

      console.log(`📝 Processing scanner: ${scannerName}`);
      console.log(`📅 Date range: ${scanStartDate} to ${scanEndDate}`);

      // Use enhanced Renata code service for formatting and execution
      const { enhancedRenataCodeService } = await import('@/services/enhancedRenataCodeService');

      const request = {
        type: 'format-execute' as const,
        code: scannerCode,
        filename: scannerName.toLowerCase().replace(/\s+/g, '_') + '.py',
        executionParams: {
          start_date: scanStartDate,
          end_date: scanEndDate,
          use_real_scan: true,
          scanner_type: 'custom' as const,
          filters: {
            min_gap: 0.5,
            min_pm_vol: 5000000,
            min_prev_close: 0.75,
            market_cap_range: [100000000, 100000000000], // $100M to $100B
            sectors: selectedSectors.length > 0 ? selectedSectors : undefined
          }
        },
        metadata: {
          original_type: 'custom' as const,
          parameter_count: extractParameterCount(scannerCode),
          expected_symbols: 500 // Expected number of results
        }
      };

      console.log('🔄 Calling enhanced Renata service...');
      const response = await enhancedRenataCodeService(request);

      if (response.success && response.data?.executionResults) {
        console.log(`✅ Renata scan completed successfully!`);
        console.log(`📊 Found ${response.data.executionResults.length} results`);

        // Convert Renata results to our expected format
        const convertedResults = response.data.executionResults.map((result: any, index: number) => ({
          id: `result_${index}`,
          ticker: result.ticker || result.symbol || 'UNKNOWN',
          date: result.date || scanStartDate,
          gapPercent: parseFloat(result.gap_percent || result.gapPercent || '0'),
          volume: parseInt(result.volume || result.share_volume || '0'),
          score: parseFloat(result.score || result.confidence || '0'),
          result: result.signal?.toLowerCase() === 'buy' || result.result === 'win' ? 'win' : 'loss',
          pnl: result.pnl || result.returns || '0.0%',
          price: parseFloat(result.price || result.last_price || '0'),
          marketCap: result.market_cap || 0,
          sector: result.sector || 'Unknown',
          confidence: parseFloat(result.confidence || result.score || '0'),
          execution_output: result.execution_output || result.metadata
        }));

        console.log('🎯 Setting scan results:', convertedResults);
        setScanResults(convertedResults);

        // Update current scanner configuration with successful execution
        setCurrentScannerConfig(prev => ({
          ...prev,
          lastExecuted: new Date().toISOString(),
          executionCount: (prev?.executionCount || 0) + 1
        }));

      } else {
        console.warn('⚠️ Renata service returned no results, using fallback');
        console.log('Response:', response);
        // Use empty array instead of mock data when no results found
        setScanResults([]);
      }

    } catch (error) {
      console.error('❌ Renata scan execution failed:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);

      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          console.log('⏰ Scan timed out - try reducing the date range');
        } else if (error.message.includes('network')) {
          console.log('🌐 Network error - check your connection');
        }
      }

      setScanResults([]);
    } finally {
      setIsExecuting(false);
      console.log('🏁 Scan execution finished');
    }
  };

  // Helper function to extract parameter count from scanner code
  const extractParameterCount = (code: string): number => {
    const patterns = [
      /min_gap:\s*([\d.]+)/gi,
      /min_pm_vol:\s*([\d]+)/gi,
      /min_prev_close:\s*([\d.]+)/gi,
      /priceRange.*?min:\s*([\d.]+)/gi,
      /volumeFilter.*?min:\s*([\d]+)/gi
    ];

    let count = 0;
    patterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) count += matches.length;
    });

    return count;
  };

  const handleParameterPreview = async () => {
    try {
      const response = await fetch('http://localhost:8002/api/scan/parameters/preview');
      const data = await response.json();
      setParameterData(data);
      setShowParameterPreview(true);
    } catch (error) {
      console.error('Error fetching parameter preview:', error);
      // Demonstrate parameter integrity issues with realistic data
      setParameterData({
        current_parameters: {
          price_min: 3.0,  // RELAXED from 8.0
          gap_div_atr_min: 0.3,  // RELAXED from 0.75
          d1_volume_min: 1000000,  // RELAXED from 15M
          require_open_gt_prev_high: false,  // RELAXED from True
        },
        parameter_interpretations: {
          price_min: {
            value: 3.0,
            current_status: "RELAXED",
            recommended: 8.0,
            impact: "Higher price filter reduces penny stock noise"
          },
          gap_div_atr_min: {
            value: 0.3,
            current_status: "RELAXED",
            recommended: 0.75,
            impact: "Ensures significant gap relative to volatility"
          },
          d1_volume_min: {
            value: 1000000,
            current_status: "RELAXED",
            recommended: 15000000,
            impact: "Higher volume ensures liquidity and institutional interest"
          },
          require_open_gt_prev_high: {
            value: false,
            current_status: "RELAXED",
            recommended: true,
            impact: "Ensures true gap-up behavior"
          }
        },
        estimated_results: {
          current_count: "200-240 (EXCESSIVE)",
          recommended_count: "8-12 (OPTIMAL)",
          quality_level: "COMPROMISED",
          risk_assessment: "PARAMETER INTEGRITY COMPROMISED - Too many low-quality matches",
          description: "Current parameters allow too many low-quality matches. Restore quality filters for optimal results."
        },
        recommendations: {
          action: "RESTORE_QUALITY_PARAMETERS",
          changes_needed: [
            "Increase price_min from 3.0 to 8.0",
            "Increase gap_div_atr_min from 0.3 to 0.75",
            "Increase d1_volume_min from 1,000,000 to 15,000,000",
            "Set require_open_gt_prev_high to True (currently False)"
          ]
        }
      });
      setShowParameterPreview(true);
    }
  };

  const handleUploadFinalized = async () => {
    // Handle finalized code upload - go to project creation screen
    setFormattedCode(pythonCode); // Use the raw code as-is
    setShowProjectCreation(true);
    // Don't close modal yet, transition to project creation screen
  };

  const handleUploadFormat = async () => {
    // Handle code formatting with Renata API
    setIsFormatting(true);
    try {
      console.log('🚀 Formatting code with Renata API...');
      console.log('Code to format:', pythonCode?.substring(0, 200) + '...');

      // Use Renata API for formatting and execution
      const { enhancedRenataCodeService } = await import('@/services/enhancedRenataCodeService');

      const request = {
        type: 'format-execute' as const,
        code: pythonCode || '',
        filename: uploadedFileName?.toLowerCase().replace(/\s+/g, '_') + '.py' || 'scanner.py',
        executionParams: {
          start_date: scanStartDate,
          end_date: scanEndDate,
          use_real_scan: true,
          scanner_type: 'custom' as const,
          filters: {
            min_gap: 0.5,
            min_pm_vol: 5000000,
            min_prev_close: 0.75,
            market_cap_range: [100000000, 100000000000], // $100M to $100B
            sectors: selectedSectors.length > 0 ? selectedSectors : undefined
          }
        },
        metadata: {
          original_type: 'custom' as const,
          parameter_count: extractParameterCount(pythonCode || ''),
          expected_symbols: 500 // Expected number of results
        }
      };

      console.log('🔄 Calling Renata API for formatting and execution...');
      const response = await enhancedRenataCodeService(request);

      if (response.success && response.data?.executionResults) {
        console.log(`✅ Renata formatting & execution completed successfully!`);
        console.log(`📊 Found ${response.data.executionResults.length} results`);

        // Convert Renata results to our expected format
        const convertedResults = response.data.executionResults.map((result: any, index: number) => ({
          id: `result_${index}`,
          ticker: result.ticker || result.symbol || 'UNKNOWN',
          date: result.date || scanStartDate,
          gapPercent: parseFloat(result.gap_percent || result.gapPercent || '0'),
          volume: parseInt(result.volume || result.share_volume || '0'),
          score: parseFloat(result.score || result.confidence || '0'),
          result: result.signal?.toLowerCase() === 'buy' || result.result === 'win' ? 'win' : 'loss',
          pnl: result.pnl || result.returns || '0.0%',
          price: parseFloat(result.price || result.last_price || '0'),
          marketCap: result.market_cap || 0,
          sector: result.sector || 'Unknown',
          confidence: parseFloat(result.confidence || result.score || '0'),
          execution_output: result.execution_output || result.metadata
        }));

        console.log('🎯 Setting scan results:', convertedResults);
        setScanResults(convertedResults);

        // Set the formatted code from Renata response
        const formattedCode = response.data.formattedCode || response.data.enhanced_code || pythonCode;
        setFormattedCode(formattedCode);

        // Close upload modal and show results
        setShowUploadModal(false);

      } else {
        console.warn('⚠️ Renata service returned no results');
        console.log('Response:', response);

        // Still set the original code as formatted
        setFormattedCode(pythonCode || '');
        setShowUploadModal(false);
        setScanResults([]);
      }

    } catch (error) {
      console.error('❌ Renata formatting failed:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);

      // Set original code as fallback
      setFormattedCode(pythonCode || '');
      setShowUploadModal(false);
      setScanResults([]);
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
      console.log(`  Loading ${cachedResults.length} cached results for ${selectedProject.name} instantly`);
      setScanResults(cachedResults);
    } else {
      console.log(`  No cached results for ${selectedProject.name}, showing empty state`);
      setScanResults([]);
    }

    console.log(`  Switched to ${selectedProject.name} with ${cachedResults.length} cached results`);
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the project click

    try {
      console.log(`🗑️ Deleting project: ${projectId}`);
      await projectApiService.deleteProject(projectId);

      // Remove project from local state
      setProjects(projects.filter(p => p.id !== projectId));
      console.log(`  Successfully deleted project: ${projectId}`);
    } catch (error) {
      console.error('❌ Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  // Save projects to localStorage
  const saveProjectsToLocal = () => {
    try {
      if (typeof window !== 'undefined') {
        const projectsToSave = projects.map(p => ({
          ...p,
          savedAt: new Date().toISOString()
        }));
        localStorage.setItem('edge_dev_saved_projects', JSON.stringify(projectsToSave));
        console.log(`💾 Saved ${projects.length} projects to localStorage`);
        alert(`Successfully saved ${projects.length} projects locally!`);
      }
    } catch (error) {
      console.error('❌ Failed to save projects:', error);
      alert('Failed to save projects. Please try again.');
    }
  };

  // Load projects from localStorage
  const loadProjectsFromLocal = () => {
    try {
      if (typeof window !== 'undefined') {
        const savedProjects = localStorage.getItem('edge_dev_saved_projects');
        if (savedProjects) {
          const parsedProjects = JSON.parse(savedProjects);
          setProjects(parsedProjects);
          console.log(`📁 Loaded ${parsedProjects.length} projects from localStorage`);
          alert(`Successfully loaded ${parsedProjects.length} saved projects!`);
        } else {
          alert('No saved projects found.');
        }
      }
    } catch (error) {
      console.error('❌ Failed to load projects:', error);
      alert('Failed to load projects. Please try again.');
    }
  };

  // Save saved scans to localStorage
  const saveSavedScansToLocal = (scans?: any[]) => {
    try {
      if (typeof window !== 'undefined') {
        const scansToSave = scans || savedScans;
        localStorage.setItem('edge_dev_saved_scans', JSON.stringify(scansToSave));
        console.log(`💾 Saved ${scansToSave.length} saved scans to localStorage`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to save scans:', error);
      return false;
    }
  };

  // Load saved scans from localStorage
  const loadSavedScansFromLocal = () => {
    try {
      if (typeof window !== 'undefined') {
        const savedScansData = localStorage.getItem('edge_dev_saved_scans');
        if (savedScansData) {
          const parsedScans = JSON.parse(savedScansData);
          // Validate the structure of saved scans before setting them
          const validScans = parsedScans.filter((scan: any) => {
            return scan && scan.id && scan.timestamp && scan.scannerType && scan.results && Array.isArray(scan.results);
          });
          if (validScans.length !== parsedScans.length) {
            console.warn(`⚠️ Filtered out ${parsedScans.length - validScans.length} corrupted saved scans`);
            // Save the cleaned version
            localStorage.setItem('edge_dev_saved_scans', JSON.stringify(validScans));
          }
          setSavedScans(validScans);
          console.log(`📁 Loaded ${validScans.length} valid saved scans from localStorage`);
          return validScans;
        }
      }
      return [];
    } catch (error) {
      console.error('❌ Failed to load saved scans:', error);
      // Clear corrupted data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('edge_dev_saved_scans');
      }
      setSavedScans([]);
      return [];
    }
  };

  // Delete a specific saved scan
  const deleteSavedScan = (scanId: string) => {
    try {
      if (typeof window !== 'undefined') {
        const updatedScans = savedScans.filter(scan => scan.id !== scanId);
        setSavedScans(updatedScans);
        localStorage.setItem('edge_dev_saved_scans', JSON.stringify(updatedScans));
        console.log(`🗑️ Deleted saved scan: ${scanId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to delete saved scan:', error);
      return false;
    }
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

        {/* Upload Code Button */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
          }}
        >
          <button
            onClick={openUploadModal}
            className="btn-primary w-full justify-center text-base py-3"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, rgba(212, 175, 55, 0.8) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '8px',
              color: '#000000',
              fontWeight: '600',
              padding: '12px 16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLElement;
              target.style.background = 'linear-gradient(135deg, #B8941F 0%, rgba(184, 148, 31, 0.8) 100%)';
              target.style.boxShadow = '0 6px 16px rgba(212, 175, 55, 0.4)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLElement;
              target.style.background = 'linear-gradient(135deg, #D4AF37 0%, rgba(212, 175, 55, 0.8) 100%)';
              target.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.3)';
            }}
          >
            <Upload className="h-4 w-4" />
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
            }}
          >
            <h3
              style={{
                fontSize: '12px',
                fontWeight: '700',
                color: '#D4AF37',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                margin: 0
              }}
            >
              Projects
            </h3>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={loadProjectsFromLocal}
                style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '6px',
                  padding: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.background = 'rgba(34, 197, 94, 0.2)';
                  target.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.background = 'rgba(34, 197, 94, 0.1)';
                  target.style.borderColor = 'rgba(34, 197, 94, 0.3)';
                }}
                title="Load saved projects"
              >
                <Upload
                  size={12}
                  style={{ color: '#22c55e' }}
                />
              </button>
              <button
                onClick={saveProjectsToLocal}
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '6px',
                  padding: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.background = 'rgba(59, 130, 246, 0.2)';
                  target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.background = 'rgba(59, 130, 246, 0.1)';
                  target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                }}
                title="Save projects locally"
              >
                <Save
                  size={12}
                  style={{ color: '#3b82f6' }}
                />
              </button>
              <button
                onClick={loadProjects}
                style={{
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '6px',
                  padding: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
const target = e.target as HTMLElement;
                  target.style.background = 'rgba(212, 175, 55, 0.2)'
                  target.style.borderColor = 'rgba(212, 175, 55, 0.5)';                }}
                onMouseLeave={(e) => {
const target = e.target as HTMLElement;
                  target.style.background = 'rgba(212, 175, 55, 0.1)'
                  target.style.borderColor = 'rgba(212, 175, 55, 0.3)';                }}
                title="Refresh projects list"
              >
                <RefreshCw
                  size={12}
                  style={{ color: '#D4AF37' }}
                />
              </button>
            </div>
          </div>
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
const target = e.target as HTMLElement;
                  target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                  target.style.borderColor = 'rgba(212, 175, 55, 0.2)'
                  target.style.transform = 'translateX(2px)';                  }
                }}
                onMouseLeave={(e) => {
                  if (!project.active) {
const target = e.target as HTMLElement;
                  target.style.backgroundColor = 'rgba(17, 17, 17, 0.6)'
                  target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  target.style.transform = 'translateX(0)';                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: project.active ? '#D4AF37' : '#ffffff',
                      marginBottom: '6px',
                      letterSpacing: '0.3px',
                      flex: 1
                    }}
                  >
                    {project.name}
                  </div>
                  <button
                    onClick={(e) => handleDeleteProject(project.project_data?.id || project.id, e)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      padding: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '8px',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
const target = e.target as HTMLElement;
                  target.style.background = 'rgba(239, 68, 68, 0.2)'
                  target.style.borderColor = 'rgba(239, 68, 68, 0.5)';                    }}
                    onMouseLeave={(e) => {
const target = e.target as HTMLElement;
                  target.style.background = 'rgba(239, 68, 68, 0.1)'
                  target.style.borderColor = 'rgba(239, 68, 68, 0.3)';                    }}
                    title="Delete project"
                  >
                    <Trash2
                      size={12}
                      style={{ color: '#ef4444' }}
                    />
                  </button>
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

        {/* Saved Scans Section - Collapsible */}
        <div
          style={{
            borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
            background: 'linear-gradient(180deg, rgba(17, 17, 17, 0.8) 0%, rgba(10, 10, 10, 0.9) 100%)'
          }}
        >
          <div
            onClick={() => setIsSavedScansOpen(!isSavedScansOpen)}
            style={{
              padding: '16px 20px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLElement;
              target.style.backgroundColor = 'rgba(212, 175, 55, 0.05)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLElement;
              target.style.backgroundColor = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Save
                size={18}
                style={{
                  color: '#D4AF37',
                  marginRight: '8px',
                  strokeWidth: 2
                }}
              />
              <h3 style={{
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '600',
                margin: 0,
                letterSpacing: '0.3px'
              }}>
                Saved Scans
              </h3>
              {savedScans.length > 0 && (
                <span style={{
                  background: 'rgba(212, 175, 55, 0.2)',
                  color: '#D4AF37',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '500',
                  marginLeft: '8px'
                }}>
                  {savedScans.length}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {scanResults && scanResults.length > 0 && isSavedScansOpen && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newSavedScan = {
                      id: Date.now().toString(),
                      timestamp: new Date().toISOString(),
                      results: scanResults,
                      scannerType: uploadedFileName || 'Unknown Scanner',
                      parameters: {
                        dateRange: selectedDateRange,
                        sectors: selectedSectors,
                        marketCap: marketCapFilters,
                        customUniverse: activeTab === 'custom' ? localUniverse : []
                      }
                    };
                    const updatedScans = [...savedScans, newSavedScan];
                    setSavedScans(updatedScans);
                    saveSavedScansToLocal(updatedScans);
                    console.log('✅ Scan saved successfully!');
                  }}
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    color: '#10b981',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.background = 'rgba(16, 185, 129, 0.2)';
                    target.style.borderColor = 'rgba(16, 185, 129, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.background = 'rgba(16, 185, 129, 0.1)';
                    target.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                  }}
                  title="Save current scan results"
                >
                  <Save size={12} />
                  Save Current
                </button>
              )}
              <ChevronDown
                size={16}
                style={{
                  color: '#D4AF37',
                  transition: 'transform 0.2s ease',
                  transform: isSavedScansOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </div>
          </div>

          {isSavedScansOpen && (
            <div style={{ padding: '0 20px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                {savedScans.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '14px',
                    padding: '20px 0',
                    fontStyle: 'italic'
                  }}>
                    No saved scans yet. Run a scan and save the results!
                  </div>
                ) : (
                  savedScans.map((savedScan) => (
                    <div
                      key={savedScan.id}
                      onClick={() => {
                        console.log('🔄 Loading saved scan:', savedScan.scannerType);
                        setScanResults(savedScan.results);
                        if (savedScan.parameters) {
                          if (savedScan.parameters.dateRange) {
                            setSelectedDateRange(savedScan.parameters.dateRange);
                          }
                          if (savedScan.parameters.sectors) {
                            setSelectedSectors(savedScan.parameters.sectors);
                          }
                          if (savedScan.parameters.marketCap) {
                            setMarketCapFilters(savedScan.parameters.marketCap);
                          }
                          if (savedScan.parameters.customUniverse) {
                            setLocalUniverse(savedScan.parameters.customUniverse);
                          }
                        }
                        console.log('✅ Saved scan loaded successfully!');
                      }}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(17, 17, 17, 0.6)',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        const target = e.target as HTMLElement;
                        target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        target.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                        target.style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={(e) => {
                        const target = e.target as HTMLElement;
                        target.style.backgroundColor = 'rgba(17, 17, 17, 0.6)';
                        target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        target.style.transform = 'translateX(0)';
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updatedScans = savedScans.filter(scan => scan.id !== savedScan.id);
                          setSavedScans(updatedScans);
                          deleteSavedScan(savedScan.id);
                          console.log('🗑️ Saved scan deleted:', savedScan.id);
                        }}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '4px',
                          padding: '2px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          const target = e.target as HTMLElement;
                          target.style.background = 'rgba(239, 68, 68, 0.2)';
                          target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          const target = e.target as HTMLElement;
                          target.style.background = 'rgba(239, 68, 68, 0.1)';
                          target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                        }}
                        title="Delete saved scan"
                      >
                        <X size={10} style={{ color: '#ef4444' }} />
                      </button>

                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#ffffff',
                        marginBottom: '4px',
                        paddingRight: '20px'
                      }}>
                        {savedScan.scannerType}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        marginBottom: '4px'
                      }}>
                        {new Date(savedScan.timestamp).toLocaleString()}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#D4AF37',
                        fontWeight: '500'
                      }}>
                        {savedScan.results?.length || 0} results
                      </div>
                    </div>
                  ))
                )}
              </div>

              {savedScans.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(212, 175, 55, 0.15)' }}>
                  <button
                    onClick={() => {
                      setSavedScans([]);
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('edge_dev_saved_scans');
                      }
                      console.log('🗑️ All saved scans cleared');
                    }}
                    style={{
                      width: '100%',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      padding: '8px',
                      color: '#ef4444',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      const target = e.target as HTMLElement;
                      target.style.background = 'rgba(239, 68, 68, 0.2)';
                      target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.target as HTMLElement;
                      target.style.background = 'rgba(239, 68, 68, 0.1)';
                      target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                    }}
                  >
                    Clear All Saved Scans
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Professional Renata Button */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(212, 175, 55, 0.15)'
          }}
        >
          <button
            onClick={() => {
              console.log('Renata button clicked! Current state:', isRenataPopupOpen);
              setIsRenataPopupOpen(!isRenataPopupOpen);
              console.log('New state should be:', !isRenataPopupOpen);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '10px',
              border: isRenataPopupOpen
                ? '1px solid rgba(212, 175, 55, 0.5)'
                : '1px solid rgba(255, 255, 255, 0.1)',
              background: isRenataPopupOpen
                ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)'
                : 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isRenataPopupOpen
                ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.08) 100%)'
                : 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isRenataPopupOpen
                ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)'
                : 'rgba(255, 255, 255, 0.02)';
              e.currentTarget.style.transform = 'translateY(0px)';
            }}
          >
            {/* Clean Icon Container */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isRenataPopupOpen
                  ? 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)'
                  : 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)',
                border: `1px solid ${isRenataPopupOpen ? 'rgba(255, 255, 255, 0.2)' : 'rgba(212, 175, 55, 0.3)'}`,
                boxShadow: isRenataPopupOpen
                  ? '0 4px 12px rgba(212, 175, 55, 0.3)'
                  : '0 2px 8px rgba(212, 175, 55, 0.15)',
                transition: 'all 0.2s ease'
              }}
            >
              <Brain
                style={{
                  width: '16px',
                  height: '16px',
                  color: isRenataPopupOpen ? '#000' : '#D4AF37'
                }}
              />
            </div>

            {/* Text Content */}
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isRenataPopupOpen ? '#D4AF37' : '#FFFFFF',
                  marginBottom: '2px'
                }}
              >
                Renata
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: '400',
                  color: isRenataPopupOpen ? 'rgba(212, 175, 55, 0.8)' : 'rgba(255, 255, 255, 0.6)'
                }}
              >
                AI Assistant
              </div>
            </div>

            {/* Status Indicator */}
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isRenataPopupOpen ? '#D4AF37' : '#10B981',
                boxShadow: isRenataPopupOpen
                  ? '0 0 8px rgba(212, 175, 55, 0.5)'
                  : '0 0 8px rgba(16, 185, 129, 0.5)',
                animation: isRenataPopupOpen ? 'none' : 'pulse 2s infinite'
              }}
            />
          </button>
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
        className="flex flex-col min-w-0 dashboard-responsive main-content-area mr-4"
        style={{
          marginLeft: '296px', /* 288px sidebar + 8px spacing */
          width: 'auto',
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
                <div
                  className="flex items-center gap-2"
                  style={{
                    background: 'rgba(17, 17, 17, 0.8)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <label
                    htmlFor="scanStartDate"
                    style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#D4AF37',
                      letterSpacing: '1px',
                      textTransform: 'uppercase'
                    }}
                  >
                    FROM:
                  </label>
                  <input
                    id="scanStartDate"
                    type="date"
                    value={scanStartDate}
                    onChange={(e) => setScanStartDate(e.target.value)}
                    style={{
                      background: 'rgba(40, 40, 40, 0.9)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
const target = e.target as HTMLElement;
                  target.style.borderColor = '#D4AF37'
                  target.style.boxShadow = '0 0 0 2px rgba(212, 175, 55, 0.2)';                    }}
                    onBlur={(e) => {
const target = e.target as HTMLElement;
                  target.style.borderColor = 'rgba(212, 175, 55, 0.3)'
                  target.style.boxShadow = 'none';                    }}
                  />
                </div>

                {/* To Date */}
                <div
                  className="flex items-center gap-2"
                  style={{
                    background: 'rgba(17, 17, 17, 0.8)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <label
                    htmlFor="scanEndDate"
                    style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#D4AF37',
                      letterSpacing: '1px',
                      textTransform: 'uppercase'
                    }}
                  >
                    TO:
                  </label>
                  <input
                    id="scanEndDate"
                    type="date"
                    value={scanEndDate}
                    onChange={(e) => setScanEndDate(e.target.value)}
                    style={{
                      background: 'rgba(40, 40, 40, 0.9)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
const target = e.target as HTMLElement;
                  target.style.borderColor = '#D4AF37'
                  target.style.boxShadow = '0 0 0 2px rgba(212, 175, 55, 0.2)';                    }}
                    onBlur={(e) => {
const target = e.target as HTMLElement;
                  target.style.borderColor = 'rgba(212, 175, 55, 0.3)'
                  target.style.boxShadow = 'none';                    }}
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
                    style={{
                      background: 'rgba(212, 175, 55, 0.1)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: '#D4AF37',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
const target = e.target as HTMLElement;
                  target.style.background = 'rgba(212, 175, 55, 0.2)'
                  target.style.borderColor = 'rgba(212, 175, 55, 0.5)'
                  target.style.transform = 'translateY(-1px)';                    }}
                    onMouseLeave={(e) => {
const target = e.target as HTMLElement;
                  target.style.background = 'rgba(212, 175, 55, 0.1)'
                  target.style.borderColor = 'rgba(212, 175, 55, 0.3)'
                  target.style.transform = 'translateY(0)';                    }}
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
                    style={{
                      background: 'rgba(212, 175, 55, 0.1)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: '#D4AF37',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
const target = e.target as HTMLElement;
                  target.style.background = 'rgba(212, 175, 55, 0.2)'
                  target.style.borderColor = 'rgba(212, 175, 55, 0.5)'
                  target.style.transform = 'translateY(-1px)';                    }}
                    onMouseLeave={(e) => {
const target = e.target as HTMLElement;
                  target.style.background = 'rgba(212, 175, 55, 0.1)'
                  target.style.borderColor = 'rgba(212, 175, 55, 0.3)'
                  target.style.transform = 'translateY(0)';                    }}
                  >
                    90D
                  </button>
                  <button
                    onClick={() => {
                      setScanStartDate('2024-01-01');
                      setScanEndDate('2024-12-31');
                    }}
                    style={{
                      background: 'rgba(212, 175, 55, 0.1)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: '#D4AF37',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
const target = e.target as HTMLElement;
                  target.style.background = 'rgba(212, 175, 55, 0.2)'
                  target.style.borderColor = 'rgba(212, 175, 55, 0.5)'
                  target.style.transform = 'translateY(-1px)';                    }}
                    onMouseLeave={(e) => {
const target = e.target as HTMLElement;
                  target.style.background = 'rgba(212, 175, 55, 0.1)'
                  target.style.borderColor = 'rgba(212, 175, 55, 0.3)'
                  target.style.transform = 'translateY(0)';                    }}
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

              {/* Preview Parameters Button */}
              <button
                onClick={handleParameterPreview}
                className="btn-secondary hover:bg-blue-500/30 hover:border-blue-500/60"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginLeft: '12px'
                }}
              >
                <Search className="h-4 w-4 text-blue-400" />
                Preview Parameters
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
                              padding: '16px 20px',
                              fontSize: '14px',
                              fontFamily: 'monospace'
                            }}>
                              {result.ticker}
                            </td>
                            <td style={{
                              color: selectedTicker === result.ticker ? '#ffffff' : '#999999',
                              padding: '16px 20px',
                              fontSize: '13px'
                            }}>
                              {result.date ? new Date(result.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : '-'}
                            </td>
                            <td style={{
                              color: '#10b981',
                              fontWeight: '600',
                              padding: '16px 20px',
                              fontSize: '14px',
                              fontFamily: 'monospace'
                            }}>
                              {(result.gapPercent || 0).toFixed(1)}%
                            </td>
                            <td style={{
                              color: selectedTicker === result.ticker ? '#ffffff' : '#999999',
                              padding: '16px 20px',
                              fontSize: '13px',
                              fontFamily: 'monospace'
                            }}>
                              {((result.volume || 0) / 1000000).toFixed(1)}M
                            </td>
                            <td style={{
                              color: '#D4AF37',
                              fontWeight: '600',
                              padding: '16px 20px',
                              fontSize: '14px',
                              fontFamily: 'monospace'
                            }}>
                              {(result.score || 0).toFixed(1)}
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
                          <th onClick={() => handleSort('ticker')} className="text-xs p-3 cursor-pointer hover:bg-gray-700 transition-colors">
                            TICKER {sortField === 'ticker' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th onClick={() => handleSort('date')} className="text-xs p-3 cursor-pointer hover:bg-gray-700 transition-colors">
                            DATE {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th onClick={() => handleSort('gapPercent')} className="text-xs p-3 cursor-pointer hover:bg-gray-700 transition-colors">
                            GAP % {sortField === 'gapPercent' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th onClick={() => handleSort('score')} className="text-xs p-3 cursor-pointer hover:bg-gray-700 transition-colors">
                            SCORE {sortField === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th className="text-xs p-3">
                            P&L
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
                            <td className="p-3 text-sm font-bold studio-text">{result.ticker}</td>
                            <td className="p-3 text-sm text-studio-muted">{result.date ? new Date(result.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : '-'}</td>
                            <td className="p-3 text-sm status-positive">{result.gapPercent.toFixed(1)}%</td>
                            <td className="p-3 text-sm font-semibold text-studio-gold">{result.score.toFixed(1)}</td>
                            <td className={`p-3 text-sm font-semibold ${(result as any).result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                              {(result as any).pnl || 'N/A'}
                            </td>
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
                                  <div className="space-y-4">
                                    {params.filters.length > 0 ? (
                                      params.filters.map((filter, index) => (
                                        <div key={index} className="flex items-center gap-3 text-sm p-4 rounded-lg"
                                             style={{ background: 'var(--studio-bg-secondary)', border: '1px solid var(--studio-border)' }}>
                                          <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                                          <span style={{
                                            color: 'var(--studio-text-secondary)',
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word',
                                            whiteSpace: 'normal',
                                            maxWidth: '100%'
                                          }}>{filter}</span>
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
                                  <div className="space-y-4">
                                    {params.indicators.length > 0 ? (
                                      params.indicators.map((indicator, index) => (
                                        <div key={index} className="flex items-center gap-3 text-sm p-4 rounded-lg"
                                             style={{ background: 'var(--studio-bg-secondary)', border: '1px solid var(--studio-border)' }}>
                                          <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
                                          <span style={{
                                            color: 'var(--studio-text-secondary)',
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word',
                                            whiteSpace: 'normal',
                                            maxWidth: '100%'
                                          }}>{indicator}</span>
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
                        style={{wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap'}}
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
                    style={{wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap'}}
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

      {/* Renata AI Popup */}
      <RenataPopup
        isOpen={isRenataPopupOpen}
        onToggle={() => setIsRenataPopupOpen(!isRenataPopupOpen)}
      />

      {/* Parameter Preview Modal */}
      {showParameterPreview && parameterData && (
        <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-content studio-card-elevated w-[800px] p-8 max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-primary">
                <Target className="inline h-5 w-5 mr-2" />
                Scan Parameter Preview
              </h3>
              <button
                onClick={() => setShowParameterPreview(false)}
                className="text-2xl hover:opacity-70 transition-opacity"
                style={{ color: 'var(--studio-text-muted)' }}
              >
                ×
              </button>
            </div>

            {parameterData.error ? (
              <div className="text-center py-8">
                <p className="text-red-400 mb-4">{parameterData.error}</p>
                <p className="text-gray-400">Please check that the backend server is running.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Risk Assessment Alert */}
                {parameterData.estimated_results?.risk_assessment && (
                  <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                    <h4 className="text-red-400 font-semibold mb-2">⚠️ Risk Assessment</h4>
                    <p className="text-red-200">{parameterData.estimated_results.risk_assessment}</p>
                  </div>
                )}

                {/* Current Parameters Section */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-blue-400">Current Parameters</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {parameterData.current_parameters && Object.entries(parameterData.current_parameters).map(([key, value]) => (
                      <div key={key} className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-400 mb-1">{key}</div>
                        <div className="text-white font-mono" style={{wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal'}}>
                          {typeof value === 'boolean' ? (value ? 'True' : 'False') :
                           typeof value === 'number' ? value.toLocaleString() :
                           String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Parameter Analysis Section */}
                {parameterData.parameter_interpretations && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-yellow-400">Parameter Analysis</h4>
                    <div className="space-y-3">
                      {Object.entries(parameterData.parameter_interpretations).map(([key, analysis]: [string, any]) => (
                        <div key={key} className="bg-gray-800/30 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-white">{key}</span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              analysis.current_status === 'RELAXED' ? 'bg-red-600 text-white' :
                              analysis.current_status === 'STANDARD' ? 'bg-green-600 text-white' :
                              'bg-gray-600 text-white'
                            }`}>
                              {analysis.current_status || 'UNKNOWN'}
                            </span>
                          </div>
                          <div className="text-gray-300 text-sm">
                            Current: {typeof analysis.value === 'number' ? analysis.value.toLocaleString() : String(analysis.value)}
                          </div>
                          {analysis.recommended && (
                            <div className="text-green-400 text-sm">
                              Recommended: {typeof analysis.recommended === 'number' ? analysis.recommended.toLocaleString() : String(analysis.recommended)}
                            </div>
                          )}
                          {analysis.impact && (
                            <div className="text-yellow-400 text-sm mt-1">
                              Impact: {analysis.impact}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expected Results Section */}
                {parameterData.estimated_results && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-green-400">Expected Results</h4>
                    <div className="bg-gray-800/30 rounded-lg p-4">
                      {parameterData.estimated_results.expected_count && (
                        <div className="mb-2">
                          <span className="text-gray-400">Expected Result Count: </span>
                          <span className="text-green-400 font-semibold">
                            {parameterData.estimated_results.expected_count}
                          </span>
                        </div>
                      )}
                      {parameterData.estimated_results.quality_level && (
                        <div className="mb-2">
                          <span className="text-gray-400">Quality Level: </span>
                          <span className="text-blue-400 font-semibold">
                            {parameterData.estimated_results.quality_level}
                          </span>
                        </div>
                      )}
                      {parameterData.estimated_results.description && (
                        <div className="text-gray-300 text-sm">
                          {parameterData.estimated_results.description}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setShowParameterPreview(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
                  >
                    Close
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowParameterPreview(false);
                        setIsRenataPopupOpen(true);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors flex items-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Tweak with Renata
                    </button>
                    <button
                      onClick={() => {
                        setShowParameterPreview(false);
                        handleRunScan();
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Run Scan Anyway
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}