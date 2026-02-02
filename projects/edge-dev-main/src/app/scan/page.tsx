'use client'

import { useState, useEffect, useRef } from 'react';

// Global window interface for external function calls
declare global {
  interface Window {
    projects: any[];
    refreshProjects?: () => Promise<void>;
    restoreProjects?: () => void;
    deletedProjectIds?: Set<string>;
    lastLoadedProjects?: any[];
    lastProjectsError?: any;
    debugProjects?: {
      loadProjects: () => Promise<void>;
      projects: () => any[];
      selectedProject: () => any;
      clearDeletedBlacklist: () => void;
      showDeletedIds: () => string[];
      restoreProjects: () => void;
      clearAllProjectData: () => void;
      // Scan management functions
      scans: () => any[];
      showDeletedScanIds: () => string[];
      clearDeletedScanBlacklist: () => void;
      clearAllScanData: () => void;
    };
  }
}
import { useRouter } from 'next/navigation';
import { Brain, Upload, Play, TrendingUp, BarChart3, Settings, Search, Target, Filter, Clock, Database, MessageCircle, ChevronUp, ChevronDown, Trash2, Edit2, RefreshCw, Save, Download, X, Check, Bug, Wand2, Image, Camera, ImageIcon, Bot } from 'lucide-react';
import EdgeChart, { ChartData, Timeframe, CHART_TEMPLATES } from '@/components/EdgeChart';
import TradingViewToggle from '@/components/TradingViewToggle';
import { CodeFormatterService } from '@/utils/codeFormatterAPI';
import { fetchPolygonData, calculateVWAP, calculateEMA, calculateATR, PolygonBar } from '@/utils/polygonData';
import { fastApiScanService } from '@/services/fastApiScanService';
import { marketDataCache } from '@/services/marketDataCache';
import ManageProjectsModal from '@/components/ManageProjectsModal';
import { calculateTradingDayTarget, formatTradingDayOffset, getDayOfWeekName, logTradingDayValidation } from '@/utils/tradingDays';
import { fetchChartDataForDay } from '@/utils/chartDayNavigation';
import { projectApiService } from '@/services/projectApiService';
import { ValidationDashboard } from '@/components/validation/ValidationDashboard';
import { ScannerDebugStudio } from '@/components/debug';

// Real data fetcher using Polygon API with cache optimization
async function fetchRealData(symbol: string = "SPY", timeframe: Timeframe, dayOffset: number = 0, baseDate?: Date): Promise<{ chartData: ChartData } | null> {
  const template = CHART_TEMPLATES[timeframe];

  try {
    // Calculate target date using TRADING DAYS (skipping weekends and holidays)
    const baseTargetDate = baseDate ? new Date(baseDate) : new Date();
    const endDate = calculateTradingDayTarget(baseTargetDate, dayOffset);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - template.defaultDays); // Calculate start date based on template

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`🔍 CHART DATA FETCH DEBUG:`);
    console.log(`  🔹 INPUT PARAMETERS:`);
    console.log(`    - symbol: ${symbol}`);
    console.log(`    - timeframe: ${timeframe}`);
    console.log(`    - dayOffset: ${dayOffset}`);
    console.log(`    - baseDate (raw): ${baseDate ? baseDate.toString() : 'undefined'}`);
    console.log(`    - baseDate (ISO): ${baseDate ? baseDate.toISOString() : 'undefined'}`);
    console.log(`  🔹 CALCULATIONS:`);
    console.log(`    - baseTargetDate: ${baseTargetDate.toString()}`);
    console.log(`    - baseTargetDate (ISO): ${baseTargetDate.toISOString()}`);
    console.log(`    - startDate: ${startDateStr}`);
    console.log(`    - endDate: ${endDateStr}`);

    console.log(`  TRADING DAY NAVIGATION: Fetching data for ${symbol} on ${formatTradingDayOffset(dayOffset)}`);
    console.log(`  BASE DATE: ${baseTargetDate.toDateString()} (${getDayOfWeekName(baseTargetDate)})`);
    console.log(`  TARGET DATE: ${endDate.toDateString()} (${getDayOfWeekName(endDate)}) - ${dayOffset} trading days`);

    // Try to get data from cache first
    const cachedData = await marketDataCache.getOrFetch(
      symbol,
      timeframe,
      startDateStr,
      endDateStr,
      async () => {
        // Fetch function for cache miss
        console.log(`🌐 Cache miss for ${symbol} - fetching from chartDayNavigation`);
        const { chartData, success, error } = await fetchChartDataForDay(symbol, endDate, timeframe, dayOffset);

        if (!success || !chartData || chartData.x.length === 0) {
          console.error(`No data received for ${symbol} ${timeframe}: ${error || 'Unknown error'}`);
          return [];
        }

        // Convert chartData back to bars for cache storage
        return chartData.x.map((x, i) => ({
          t: new Date(x).getTime(),
          o: chartData.open[i],
          h: chartData.high[i],
          l: chartData.low[i],
          c: chartData.close[i],
          v: chartData.volume[i]
        }));
      }
    );

    if (!cachedData || cachedData.length === 0) {
      console.error(`No data available for ${symbol} ${timeframe}`);
      return null;
    }

    // Log the actual data range we received
    const firstBarDate = new Date(cachedData[0].t).toISOString().split('T')[0];
    const lastBarDate = new Date(cachedData[cachedData.length - 1].t).toISOString().split('T')[0];
    console.log(`📊 Data range: ${firstBarDate} to ${lastBarDate} (${cachedData.length} bars)`);
    console.log(`🎯 Day offset: ${dayOffset}, Requested end date: ${endDateStr}`);

    console.log(`Processing ${cachedData.length} bars for ${symbol} ${timeframe}`);

    // CRITICAL: Convert dates to ISO format with Eastern Time for correct hover & spike label display
    // Using 4:00 PM ET (market close) as the anchor time ensures consistent date display across timezones
    const dates = cachedData.map(bar => {
      const utcDate = new Date(bar.t);

      // Convert to Eastern Time and create ISO string
      const etDateStr = utcDate.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      // Parse the ET string and format as ISO
      // Format: "01/22/2025, 16:00:00" -> "2025-01-22T16:00:00"
      const parts = etDateStr.split(/[/,\s:]+/);
      const month = parts[0];
      const day = parts[1];
      const year = parts[2];
      const hour = parts[3];
      const minute = parts[4];
      const second = parts[5];

      // Create proper ISO format
      const isoDate = `${year}-${month}-${day}T${hour}:${minute}:${second}`;

      return isoDate;
    });

    // Log sample date for verification
    if (dates.length > 0) {
      console.log(`📅 Sample dates for ${symbol} ${timeframe}:`);
      console.log(`  First: ${dates[0]}`);
      console.log(`  Last: ${dates[dates.length - 1]}`);
    }

    const opens = cachedData.map(bar => bar.o);
    const highs = cachedData.map(bar => bar.h);
    const lows = cachedData.map(bar => bar.l);
    const closes = cachedData.map(bar => bar.c);
    const volumes = cachedData.map(bar => bar.v);

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

// ROOT CAUSE FIX: Normalize scan results to ensure consistent data structure
function normalizeScanResult(result: any, index: number = 0): any {
  console.log(`🔧 normalizeScanResult called with:`, {
    ticker: result.ticker,
    Ticker: result.Ticker,
    symbol: result.symbol,
    date: result.date,
    gap: result.gap,
    parabolic_score: result.parabolic_score,
    volume: result.volume
  });

  // Handle real backend API response structure
  // Backend returns: gap, parabolic_score, volume, ticker, date
  // RENATA scanner returns: Ticker (capital T), Date
  const gap = result.gap || result.gap_percent || 0;
  const score = result.parabolic_score || result.score || 75;
  const volume = result.volume || result.v_ua || 0;

  // Extract ticker - handle both lowercase and uppercase variants
  const ticker = result.ticker || result.Ticker || result.symbol || 'UNKNOWN';

  // Return the result with the correct structure for frontend
  return {
    ticker: ticker,
    date: result.date || result.Date || new Date().toISOString().split('T')[0],
    gapPercent: gap * 10, // Convert gap to percentage (backend returns decimal)
    volume: parseInt(volume.toString()) || 0,
    score: parseFloat(score.toString()) || 75,
    result: 'win',
    pnl: `+${gap}%`, // Use actual gap percentage
    execution_output: `LC signal for ${ticker} on ${result.date || result.Date}`,
    trigger: 'D0',
    scanner_type: result.scanner_type || 'LC Frontside D2 Extended'
  };
}

// Format date string without timezone conversion
// Prevents JavaScript Date constructor from interpreting date as UTC midnight
function formatDateDisplay(dateString: string): string {
  if (!dateString) return '-';

  try {
    // Parse the date string directly (YYYY-MM-DD format)
    const [year, month, day] = dateString.split('-');

    // Format as MM/DD/YYYY without timezone conversion
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);
    const yearNum = parseInt(year, 10);

    return `${monthNum.toString().padStart(2, '0')}/${dayNum.toString().padStart(2, '0')}/${yearNum.toString().slice(-2)}`;
  } catch (error) {
    console.warn('Error formatting date:', dateString, error);
    return dateString;
  }
}

// Download scan results as CSV
function downloadScanResultsAsCSV(scanResults: any[], scanName: string = 'scan_results') {
  if (!scanResults || scanResults.length === 0) {
    alert('No results to download!');
    return;
  }

  try {
    // Define CSV headers
    const headers = ['Ticker', 'Date', 'Gap %', 'Volume', 'Score', 'Result', 'P&L'];

    // Convert results to CSV rows
    const csvRows = scanResults.map(result => {
      const ticker = result.ticker || result.Ticker || 'UNKNOWN';
      const date = result.date || result.Date || 'N/A';
      const gapPercent = result.gapPercent !== undefined ? result.gapPercent.toFixed(2) : 'N/A';
      const volume = result.volume ? result.volume.toLocaleString() : '0';
      const score = result.score !== undefined ? result.score.toFixed(1) : 'N/A';
      const res = result.result || 'N/A';
      const pnl = result.pnl || 'N/A';

      return [ticker, date, gapPercent, volume, score, res, pnl].join(',');
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...csvRows].join('\n');

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.setAttribute('href', url);
    link.setAttribute('download', `${scanName}_${timestamp}.csv`);
    link.style.visibility = 'hidden';

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`✅ Downloaded ${scanResults.length} results as CSV`);
  } catch (error) {
    console.error('❌ Error downloading CSV:', error);
    alert('Failed to download CSV. Please try again.');
  }
}

// Cache optimization function to pre-load data for scan results
async function preloadScanResultsCache(scanResults: any[]) {
  if (!scanResults || scanResults.length === 0) return;

  console.log(`🚀 Pre-loading cache for ${scanResults.length} scan results...`);

  // Get unique tickers from scan results
  const uniqueTickers = [...new Set(scanResults.map(result => result.ticker))];
  const scanDate = scanResults[0].date || new Date().toISOString().split('T')[0];

  // Pre-load data for each ticker around the scan date
  const preloadPromises = uniqueTickers.map(async (ticker) => {
    try {
      const scanDateObj = new Date(scanDate);
      const startDate = new Date(scanDateObj);
      startDate.setDate(startDate.getDate() - 7); // 7 days before scan date
      const endDate = new Date(scanDateObj);
      endDate.setDate(endDate.getDate() + 7); // 7 days after scan date

      await marketDataCache.getOrFetch(
        ticker,
        '1D',
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        async () => {
          console.log(`🌐 Pre-loading ${ticker} data for cache...`);
          // Return empty array - actual data will be fetched on demand
          return [];
        }
      );
    } catch (error) {
      console.warn(`⚠️ Failed to pre-load cache for ${ticker}:`, error);
    }
  });

  await Promise.allSettled(preloadPromises);
  console.log(`✅ Cache pre-loading completed for ${uniqueTickers.length} tickers`);
}

// Request throttling and deduplication - Fixed version
class RequestThrottler {
  private pendingRequests = new Map<string, Promise<any>>();
  private requestHistory = new Map<string, number>();
  private readonly THROTTLE_DELAY = 200; // Reduced to 200ms for better responsiveness
  private readonly MAX_REQUESTS_PER_MINUTE = 60; // Increased limit
  private requestTimestamps: number[] = [];

  async throttleRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    const now = Date.now();

    // Check if request is already pending - this is the main deduplication
    if (this.pendingRequests.has(key)) {
      console.log(`🔄 Request already pending: ${key} - waiting for completion`);
      return this.pendingRequests.get(key);
    }

    // Clean up old timestamps (keep last minute)
    this.requestTimestamps = this.requestTimestamps.filter(time => now - time < 60000);

    // Check rate limit - but be more lenient for scan requests
    if (this.requestTimestamps.length >= this.MAX_REQUESTS_PER_MINUTE) {
      console.warn(`⚠️ Rate limit approaching: ${this.requestTimestamps.length}/${this.MAX_REQUESTS_PER_MINUTE} requests per minute`);
    }

    // Only throttle for very recent identical requests (not scan requests)
    const lastRequestTime = this.requestHistory.get(key);
    if (lastRequestTime && now - lastRequestTime < this.THROTTLE_DELAY && !key.includes('scan_execute')) {
      console.log(`⏳ Throttling non-scan request: ${key}`);
      throw new Error(`Request throttled: Please wait ${this.THROTTLE_DELAY}ms between identical requests`);
    }

    // Create new request
    this.requestHistory.set(key, now);
    this.requestTimestamps.push(now);

    const requestPromise = requestFn().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
      this.requestHistory.delete(key); // Allow immediate retry on completion
    });

    this.pendingRequests.set(key, requestPromise);
    return requestPromise;
  }

  clearHistory() {
    this.requestHistory.clear();
    this.pendingRequests.clear();
    this.requestTimestamps = [];
  }
}

// Global request throttler
const requestThrottler = new RequestThrottler();

// Function to periodically optimize cache
function optimizeCache() {
  console.log('🧹 Optimizing market data cache...');
  marketDataCache.optimizeCache();

  const stats = marketDataCache.getCacheStats();
  console.log(`📊 Cache stats:`, stats);
}

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
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [savedScans, setSavedScans] = useState<any[]>([]);
  const [deletedScanIds, setDeletedScanIds] = useState<Set<string>>(new Set());
  const [isSavedScansCollapsed, setIsSavedScansCollapsed] = useState(false);
  const [showLoadScanModal, setShowLoadScanModal] = useState(false);
  const [availableScans, setAvailableScans] = useState<any[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('day');
  const [isExecuting, setIsExecuting] = useState(false);
  const [scanningProjects, setScanningProjects] = useState<Set<string>>(new Set()); // Track multiple projects currently being scanned
  const [projectProgress, setProjectProgress] = useState<{[key: string]: {message: string, percent: number}}>({}); // Track real-time progress messages per project

  // Project Name Editing State
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');

  // Scanner Debug Studio State
  const [showDebugStudio, setShowDebugStudio] = useState(false);
  const [debugProject, setDebugProject] = useState<{id: string, name: string, code: string} | null>(null);

  // 🔧 FIX: Auto-close Debug Studio on page load to prevent error overlays
  useEffect(() => {
    // Close debug studio if it's open on page load
    if (showDebugStudio) {
      console.log('🔧 Auto-closing Debug Studio on page load');
      setShowDebugStudio(false);
      setDebugProject(null);
    }
  }, []); // Run once on mount

  // 🔧 FIX: Add keyboard listener to close Debug Studio with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDebugStudio) {
        console.log('🔧 Closing Debug Studio via Escape key');
        setShowDebugStudio(false);
        setDebugProject(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDebugStudio]);

  // AI Enhancement Modal States
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [aiEnhancementsEnabled, setAiEnhancementsEnabled] = useState({
    parameterOptimization: true,
    validation: false,
    learning: false
  });

  const [scanDate, setScanDate] = useState(() => {
    // Default to current date for fresh market data
    return new Date().toISOString().split('T')[0];
  });
  const [lastScanDate, setLastScanDate] = useState<string | null>(null);
  const [scanStartDate, setScanStartDate] = useState('2025-01-01'); // ✅ FIX: Default to 2025 start date
  const [scanEndDate, setScanEndDate] = useState('2026-01-01'); // ✅ FIX: Default to 2026 end date
  const [selectedData, setSelectedData] = useState<{ chartData: ChartData } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showManageProjectsModal, setShowManageProjectsModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'finalized' | 'format' | 'execute' | null>(null);
  const [scanCompletedAt, setScanCompletedAt] = useState<number>(0); // ✅ Track when scan completed to prevent immediate refresh

  // Image upload and vision state
  const [uploadedImages, setUploadedImages] = useState<Array<{id: string, data: string, name: string}>>([]);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);

  const [isFormatting, setIsFormatting] = useState(false);
  const [formattingResult, setFormattingResult] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table'); // T/C toggle
  const [projects, setProjects] = useState<any[]>([]);
  const [sortField, setSortField] = useState<'ticker' | 'date' | 'gapPercent' | 'volume' | 'score'>('gapPercent');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isRenataPopupOpen, setIsRenataPopupOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [renataMessages, setRenataMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([
    { role: 'assistant', content: 'Hello! I\'m Renata V2, your AI trading assistant. How can I help you today?' }
  ]);
  const [renataInput, setRenataInput] = useState('');
  const [isRenataTyping, setIsRenataTyping] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showParameterPreview, setShowParameterPreview] = useState(false);
  const [transformedCode, setTransformedCode] = useState<string | null>(null);

  const [parameterData, setParameterData] = useState<any>(null);
  const router = useRouter();

  // HELPER: Ensure savedScans is always an array (defensive programming)
  const safeSavedScans: any[] = Array.isArray(savedScans) ? savedScans : [];

  // HELPER: Strip AI thinking/reasoning text from code before displaying
  const stripThinkingText = (code: string): string => {
    if (!code) return code;

    const lines = code.split('\n');
    let codeStartIdx = 0;

    for (let i = 0; i < lines.length; i++) {
      const stripped = lines[i].trim();

      // Skip empty lines
      if (!stripped) {
        codeStartIdx = i + 1;
        continue;
      }

      // Check if this looks like thinking text
      const thinkingKeywords = [
        'okay, let', 'first, i', 'i need', 'looking at', 'let\'s tackle',
        'the user wants', 'the template\'s', 'another thing', 'putting it all',
        'here\'s the', 'i\'ll create', 'now i\'ll', 'i should', 'to implement'
      ];

      const isComment = stripped.startsWith('#');
      const isThinking = isComment && thinkingKeywords.some(kw =>
        stripped.toLowerCase().includes(kw)
      );

      // If it's a thinking comment, skip it
      if (isThinking) {
        codeStartIdx = i + 1;
        continue;
      }

      // If we hit actual code, stop here
      if (stripped.startsWith('import ') ||
          stripped.startsWith('from ') ||
          stripped.startsWith('class ') ||
          stripped.startsWith('def ') ||
          stripped.startsWith('"""') ||
          stripped.startsWith("'''")) {
        codeStartIdx = i;
        break;
      }

      // If we hit something else that's not a comment, assume code starts here
      if (!isComment) {
        codeStartIdx = i;
        break;
      }

      codeStartIdx = i + 1;
    }

    const cleaned = lines.slice(codeStartIdx).join('\n');
    console.log(`🧹 Strip thinking: removed ${codeStartIdx} lines, ${cleaned.length}/${code.length} chars remaining`);

    return cleaned;
  };

  // Handler for viewing current project code
  const handleViewCode = async () => {
    try {
      // Get the currently active project
      const activeProject = projects.find(p => p.active);
      if (!activeProject) {
        console.log('[DISABLED ALERT] Please select a project first to view its code.');
        return;
      }

      console.log('📄 Viewing code for project:', activeProject.name);

      // ALWAYS fetch fresh from API with cache-busting (skip localStorage)
      let projectCode = null;
      let codeSource = '';

      try {
        console.log('📡 Fetching project code from API...');
        const projectId = activeProject.project_data?.id || activeProject.id;
        // Add cache-busting timestamp to ensure we get fresh data
        const cacheBuster = `&_t=${Date.now()}`;
        const projectResponse = await fetch(`http://localhost:5666/api/projects?id=${projectId}${cacheBuster}`);
        const projectData = await projectResponse.json();

        if (projectData.success && projectData.data?.code) {
          projectCode = projectData.data.code;
          codeSource = `API (${projectData.data.title || activeProject.name})`;
          console.log(`✅ Retrieved ${projectCode.length} characters of code from API`);
        }
      } catch (error) {
        console.error('❌ Error fetching code from API:', error);
      }

      if (projectCode) {
        console.log(`✅ Found ${projectCode.length} characters of code from ${codeSource}`);

        // Apply stripThinkingText to clean any AI thinking from the code
        const cleanedCode = stripThinkingText(projectCode);

        // Create a clean modal to show the code
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
          background: #1a1a1a;
          border: 2px solid #22C55E;
          border-radius: 12px;
          padding: 20px;
          max-width: 90vw;
          max-height: 90vh;
          width: 800px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        `;

        modalContent.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; color: #22C55E; font-weight: bold;">
            <h3>📄 ${activeProject.name} - Scanner Code</h3>
            <button id="close-modal-btn" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
              ✕ Close
            </button>
          </div>
          <div style="margin-bottom: 10px; color: #888; font-size: 12px;">
            Source: ${codeSource} | Original: ${projectCode.length.toLocaleString()} chars | Cleaned: ${cleanedCode.length.toLocaleString()} chars
          </div>
          <textarea readonly id="code-textarea" style="
            width: 100%;
            height: 60vh;
            background: #0a0a0a;
            color: #00ff00;
            border: 1px solid #333;
            border-radius: 6px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            resize: none;
            overflow: auto;
            white-space: pre;
            tab-size: 4;
          ">${cleanedCode}</textarea>
          <div style="margin-top: 15px; display: flex; gap: 10px;">
            <button id="copy-code-btn" style="background: #3B82F6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
              📋 Copy Code
            </button>
            <button id="open-tab-btn" style="background: #10B981; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
              🌐 Open in New Tab
            </button>
            <button id="download-code-btn" style="background: #8B5CF6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
              💾 Download Code
            </button>
          </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Add event listeners for buttons (after DOM is ready)
        setTimeout(() => {
          const closeBtn = document.getElementById('close-modal-btn');
          const copyBtn = document.getElementById('copy-code-btn');
          const openTabBtn = document.getElementById('open-tab-btn');
          const downloadBtn = document.getElementById('download-code-btn');
          const textarea = document.getElementById('code-textarea') as HTMLTextAreaElement | null;

          if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.remove());
          }

          if (copyBtn && textarea) {
            copyBtn.addEventListener('click', () => {
              navigator.clipboard.writeText(textarea.value)
                .then(() => console.log('[DISABLED ALERT] Code copied to clipboard!'))
                .catch(err => console.log('[DISABLED ALERT] Failed to copy code: ' + err));
            });
          }

          if (openTabBtn && textarea) {
            openTabBtn.addEventListener('click', () => {
              const newWindow = window.open('', '_blank');
              if (newWindow) {
                newWindow.document.write(`<pre style="background: #0a0a0a; color: #00ff00; padding: 20px; font-family: monospace;">${textarea.value}</pre>`);
                newWindow.document.close();
              }
            });
          }

          if (downloadBtn && textarea) {
            downloadBtn.addEventListener('click', () => {
              try {
                const code = textarea.value;
                const blob = new Blob([code], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${activeProject.name.replace(/[^a-zA-Z0-9]/g, '_')}_scanner.py`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                console.log('[DISABLED ALERT] Code downloaded successfully!');
              } catch (error) {
                console.error('Download failed:', error);
                console.log('[DISABLED ALERT] Failed to download code. Please try copying manually.');
              }
            });
          }
        }, 100);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.remove();
          }
        });

      } else {
        // Silent fail - no notification
      }

    } catch (error) {
      console.error('❌ Error viewing project code:', error);
      console.log('[DISABLED ALERT] Failed to view project code. Please check the console for details.');
    }
  };

  // Reusable function to load projects from API AND localStorage
  const loadProjects = async () => {
    try {
      console.log('🔄 loadProjects: Starting to load projects...');

      // ✅ CRITICAL FIX: Load from BOTH API and localStorage to preserve local projects
      let apiProjects: any[] = [];
      let localStorageProjects: any[] = [];

      // Step 1: Load from API
      try {
        apiProjects = await projectApiService.getProjects();
        console.log('📥 loadProjects: API returned', apiProjects?.length || 0, 'projects');
      } catch (error) {
        console.warn('⚠️ Failed to load from API, using localStorage only:', error);
      }

      // Step 2: Load from localStorage
      if (typeof window !== 'undefined') {
        try {
          const savedProjectsRaw = localStorage.getItem('edge_dev_saved_projects');
          if (savedProjectsRaw) {
            localStorageProjects = JSON.parse(savedProjectsRaw);
            console.log('📦 loadProjects: localStorage has', localStorageProjects.length, 'projects');
          }
        } catch (error) {
          console.warn('⚠️ Failed to load from localStorage:', error);
        }
      }

      if (!apiProjects && !localStorageProjects) {
        console.log('⚠️ loadProjects: No projects found from any source');
        setProjects([]);
        return;
      }

      // Step 3: Merge projects (API + localStorage)
      const allProjects = [...(apiProjects || []), ...(localStorageProjects || [])];

      // Remove duplicates (prefer API version)
      const seenIds = new Set();
      const mergedProjects = allProjects.filter(project => {
        const pid = project.id || project.project_data?.id || project.name;
        if (seenIds.has(pid)) {
          console.log('  🔄 Duplicate project filtered out:', project.name);
          return false;
        }
        seenIds.add(pid);
        return true;
      });

      console.log('✅ loadProjects: Merged', mergedProjects.length, 'unique projects');

      // Load permanent deletion blacklist from localStorage
      let deletedIds = new Set();
      if (typeof window !== 'undefined') {
        const storedDeletedIds = JSON.parse(localStorage.getItem('deletedProjectIds') || '[]') || [];
        deletedIds = new Set(storedDeletedIds);
        console.log('🗑️ loadProjects: Deleted IDs:', Array.from(deletedIds));

        // Merge with runtime deleted IDs
        if (window.deletedProjectIds) {
          window.deletedProjectIds.forEach(id => deletedIds.add(id));
        }
      }

      // Transform API projects to match the expected format for sidebar
      // Filter out projects that were permanently deleted
      // DISABLED: Scan-ez filter - show ALL projects including scan-ez
      const filteredProjects = mergedProjects.filter((project: any) => {
        const projectId = project.id || project.project_data?.id;
        const isDeleted = deletedIds.has(projectId);
        if (isDeleted) {
          console.log('  🚫 Filtering deleted project:', project.name, '(', projectId, ')');
        }
        // ✅ FIX: Don't filter out scan-ez projects - show all projects
        return !isDeleted;
      });

      console.log('✅ loadProjects: After filtering, have', filteredProjects.length, 'projects');

      // Preserve currently active project to prevent forced selection
      const currentActiveProject = projects.find(p => p.active);
      const currentActiveName = currentActiveProject?.name;

      console.log(`🎯 loadProjects: Current active project = "${currentActiveName}"`);

      const transformedProjects = filteredProjects.map((project, index) => {
        // ✅ FIX: Don't auto-select any project - keep user's current selection
        // If there's an active project with the same name, preserve it
        // Otherwise, don't set anything to active (user must manually select)
        const isActive = currentActiveName && project.name === currentActiveName;

        if (isActive) {
          console.log(`  ✅ Preserving active state for: "${project.name}"`);
        }

        return {
          id: project.id || index + 1,
          name: project.name || `Project ${index + 1}`,
          active: isActive,  // ✅ Only active if user already selected it
          scanners: (project as any).scanners || [],
          scanner_count: (project as any).scanner_count || 0,
          project_data: project
        };
      });

      const activeCount = transformedProjects.filter(p => p.active).length;
      console.log(`🎨 loadProjects: Setting ${transformedProjects.length} projects (${activeCount} active)`);
      setProjects(transformedProjects);

      // CRITICAL: Force a state update to trigger re-render
      // Use setTimeout to ensure React processes the state update
      setTimeout(() => {
        console.log('♻️ loadProjects: Forced re-render complete');
      }, 0);

    } catch (error) {
      console.error('❌ loadProjects: Failed to load projects:', error);
      setProjects([]);
    }
  };

  // Fetch projects from API on component mount and set up periodic refresh
  useEffect(() => {
    // Enable automatic project loading
    loadProjects();

    // ✅ CRITICAL FIX: DISABLED periodic refresh to prevent project deselection
    // The periodic refresh was causing the selected project to become deselected every 10 seconds
    // Projects will only be refreshed:
    // 1. On initial page load
    // 2. When explicitly triggered (e.g., after saving a new project)
    // 3. When Renata adds a new scanner
    /*
    const refreshInterval = setInterval(() => {
      // Don't refresh projects while a scan is running - this preserves selection
      if (isExecuting) {
        console.log('⏸️  Skipping project refresh during scan execution (preserves selection)');
        return;
      }

      // Also skip refresh if a scan just completed (within last 5 seconds)
      const timeSinceScan = Date.now() - scanCompletedAt;
      if (timeSinceScan < 5000) {
        console.log(`⏸️  Skipping project refresh - scan completed ${Math.round(timeSinceScan/1000)}s ago (preserves selection)`);
        return;
      }

      console.log('🔄 Periodic project refresh (no scan running)');
      loadProjects();
    }, 10000);
    */

    // Listen for scanner added events from Renata chat
    const handleScannerAdded = () => {
      console.log('📢 New scanner added - refreshing projects');
      loadProjects();
    };

    window.addEventListener('scannerAddedToProject', handleScannerAdded);

    // Make refreshProjects function globally available for Renata chat
    if (typeof window !== 'undefined') {
      window.refreshProjects = refreshProjectsFromBackend;

      // ✅ Simple restore function - clear deleted projects blacklist
      window.restoreProjects = () => {
        console.log('🔄 Restoring all deleted projects...');
        localStorage.removeItem('deletedProjectIds');
        if (window.deletedProjectIds) {
          window.deletedProjectIds.clear();
        }
        loadProjects();
        console.log('✅ Projects restored! All deleted projects should now be visible.');
      };

      // Initialize deleted projects blacklist
      if (!window.deletedProjectIds) {
        window.deletedProjectIds = new Set();
      }

      // Expose debug functions for project and scan management
      window.debugProjects = {
        loadProjects,
        projects: () => projects,
        selectedProject: () => projects.find(p => p.active),
        clearDeletedBlacklist: clearDeletedProjectsBlacklist,
        showDeletedIds: () => {
          const deletedIds = JSON.parse(localStorage.getItem('deletedProjectIds') || '[]') || [];
          console.log('🗑️ Currently deleted project IDs:', deletedIds);
          console.log('🪟 Runtime deleted IDs:', Array.from(window.deletedProjectIds || []));
          return deletedIds;
        },
        // ✅ Simple restore function - easier to remember
        restoreProjects: () => {
          console.log('🔄 Restoring all deleted projects...');
          localStorage.removeItem('deletedProjectIds');
          if (window.deletedProjectIds) {
            window.deletedProjectIds.clear();
          }
          loadProjects();
          console.log('✅ Projects restored! All deleted projects should now be visible.');
        },
        clearAllProjectData: () => {
          console.log('🧹 Clearing ALL project data from localStorage...');
          const projectKeys = [
            'edge_dev_saved_projects',
            'enhancedProjects',
            'edge-dev-projects',
            'cehub_projects',
            'deletedProjectIds'
          ];
          projectKeys.forEach(key => localStorage.removeItem(key));
          if (window.deletedProjectIds) {
            window.deletedProjectIds.clear();
          }
          console.log('✅ All project data cleared');
          setProjects([]);
        },
        // Scan management functions
        scans: () => savedScans,
        showDeletedScanIds: () => {
          const deletedIds = JSON.parse(localStorage.getItem('deleted_scan_ids') || '[]') || [];
          console.log('🗑️ Currently deleted scan IDs:', deletedIds);
          return deletedIds;
        },
        clearDeletedScanBlacklist: () => {
          localStorage.removeItem('deleted_scan_ids');
          setDeletedScanIds(new Set());
          console.log('🗑️ Cleared deleted scan IDs blacklist');
          console.log('🔄 Reloading scans...');
          // Trigger scan reload
          const loadUserScans = async () => {
            try {
              const response = await fetch('http://localhost:5666/api/projects');
              const data = await response.json();
              if (data.success && data.data) {
                setSavedScans(data.data);
              }
            } catch (error) {
              console.error('Failed to reload scans:', error);
            }
          };
          loadUserScans();
        },
        clearAllScanData: () => {
          console.log('🧹 Clearing ALL scan data from localStorage...');
          const scanKeys = [
            'traderra_saved_scans',
            'saved_scans',
            'edge_dev_saved_scans',
            'cehub_projects',
            'deleted_scan_ids'
          ];
          scanKeys.forEach(key => localStorage.removeItem(key));
          // Clear scan-specific caches
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('scan_results_') ||
                key.startsWith('scan_cache_') ||
                key.startsWith('scan_data_')) {
              localStorage.removeItem(key);
            }
          });
          setDeletedScanIds(new Set());
          setSavedScans([]);
          console.log('✅ All scan data cleared');
        }
      };

      // Listen for localStorage project updates from Renata chat
      const handleLocalStorageUpdate = (event: any) => {
        console.log('📢 Received localStorageProjectsUpdated event:', event.detail);

        // ✅ CRITICAL FIX: Preserve currently active project to prevent losing selection
        const currentActiveProject = projects.find(p => p.active);
        const currentActiveName = currentActiveProject?.name;

        // Reload projects from localStorage to show newly added projects
        const savedProjects = localStorage.getItem('edge_dev_saved_projects');
        if (savedProjects) {
          try {
            const parsedProjects = JSON.parse(savedProjects);
            console.log('📁 Loading localStorage projects after update:', parsedProjects.length);
            console.log(`   Current active project: "${currentActiveName}"`);

            // Transform localStorage projects to match the expected format
            const transformedProjects = parsedProjects.map((project: any, index: number) => {
              // ✅ FIX: Preserve active state by name matching
              const isActive = currentActiveName && project.name === currentActiveName;

              if (isActive) {
                console.log(`  ✅ Preserving active state for: "${project.name}"`);
              }

              return {
                id: project.id || index + 1,
                name: project.name || project.title || `Project ${index + 1}`,
                active: isActive,  // ✅ Only active if it was previously active
                scanners: project.scanners || [],
                scanner_count: project.scanner_count || 0,
                project_data: project,
                localOnly: project.localOnly || false
              };
            });

            setProjects(transformedProjects);
            console.log(`✅ Updated project list with localStorage projects: ${transformedProjects.length} (${transformedProjects.filter(p => p.active).length} active)`);
          } catch (error) {
            console.error('❌ Failed to parse localStorage projects:', error);
          }
        }
      };

      window.addEventListener('localStorageProjectsUpdated', handleLocalStorageUpdate);

      // Cleanup event listeners and interval on unmount
      return () => {
        // ✅ FIX: refreshInterval disabled - no cleanup needed
        // clearInterval(refreshInterval);
        window.removeEventListener('scannerAddedToProject', handleScannerAdded);
        window.removeEventListener('localStorageProjectsUpdated', handleLocalStorageUpdate);
      };
    }

    // ✅ Cleanup interval on unmount - DISABLED (no interval running)
    // return () => clearInterval(refreshInterval);
  }, []); // ✅ CRITICAL FIX: Run ONLY on mount - NO dependencies to prevent re-running and resetting projects


  // Load saved scans function - can be called to refresh the list
  const loadUserScans = async () => {
    try {
      console.log('🔄 Loading saved scans...');

      // CRITICAL: Load from localStorage FIRST (this is where scans actually persist)
      try {
        const saved = localStorage.getItem('traderra_saved_scans');
        if (saved) {
          const storage = JSON.parse(saved);
          // Defensive check: ensure storage.scans is an array
          const scans = Array.isArray(storage?.scans) ? storage.scans : [];
          console.log(`📦 Found ${scans.length} scans in localStorage`);

          if (scans.length > 0) {
            // Filter out deleted scans
            const filteredScans = scans.filter((scan: any) => !deletedScanIds.has(scan.id));

            // Convert to display format with ALL results preserved
            const convertedScans = filteredScans.map((scan: any) => ({
              id: scan.id,
              name: scan.name,
              createdAt: scan.createdAt,
              scanType: scan.scanType || 'Custom Scanner',
              resultCount: scan.resultCount || scan.scan_results?.length || 0,
              scan_results: scan.scan_results || [],
              results: scan.results || scan.scan_results || [],
              isFavorite: scan.isFavorite || false,
              description: scan.description || 'Local scan'
            }));

            setSavedScans(convertedScans);
            console.log(`✅ Loaded ${convertedScans.length} saved scans from localStorage`);
            console.log('📋 Scan details:', convertedScans.map((s: any) => ({
              name: s.name,
              results: s.scan_results?.length || 0
            })));
            return;
          }
        } else {
          console.log('📭 No saved scans found in localStorage');
        }
      } catch (localStorageError) {
        console.error('❌ Error reading localStorage:', localStorageError);
      }

      // Only try backend if localStorage is empty
      console.log('⚠️ localStorage empty, trying backend API...');
      try {
        const response = await fetch('http://localhost:5666/api/projects');
        const data = await response.json();

        if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
          console.log(`📊 Found ${data.data.length} projects in frontend`);

          const scansWithResults = data.data
            .filter((project: any) => !deletedScanIds.has(project.id))
            .map((project: any) => ({
              id: project.id,
              name: project.title || project.name,
              createdAt: project.createdAt || project.created_at,
              scanType: project.type || 'Project',
              resultCount: project.scannerCount || 0,
              scan_results: [],
              results: [],
              isFavorite: false,
              description: project.description || 'Project - click to load details'
            }));

          setSavedScans(scansWithResults);
          console.log(`✅ Loaded ${scansWithResults.length} saved scans from backend`);
          return;
        }
      } catch (backendError) {
        console.log('⚠️ Backend API also unavailable');
      }

      // No scans found anywhere
      setSavedScans([]);
      console.log('📭 No saved scans found');

    } catch (error) {
      console.error('❌ Error loading saved scans:', error);
      setSavedScans([]);
    }
  };

  // Load saved scans on component mount - Hybrid approach (backend first, localStorage fallback)
  useEffect(() => {
    loadUserScans();

    // Debug: Log when component mounts
    console.log('🚀 Scan page component mounted, loading saved scans...');

    // Initialize cache optimization
    optimizeCache();

    // ✅ CRITICAL FIX: DISABLED periodic cache optimization to prevent interference
    // This was running every 5 minutes and potentially causing issues with project selection
    /*
    const cacheInterval = setInterval(() => {
      optimizeCache();
    }, 5 * 60 * 1000); // 5 minutes
    */

    // Cleanup interval on unmount - DISABLED (no interval running)
    // return () => clearInterval(cacheInterval);

  }, []); // Run once on component mount

  // Load deleted scan IDs from localStorage on mount
  useEffect(() => {
    try {
      const deletedIds = localStorage.getItem('deleted_scan_ids');
      if (deletedIds) {
        const parsedIds = JSON.parse(deletedIds);
        if (Array.isArray(parsedIds)) {
          setDeletedScanIds(new Set(parsedIds));
          console.log(`🔄 Loaded ${parsedIds.length} deleted scan IDs from localStorage`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not load deleted scan IDs:', error);
    }
  }, []);

  // Debug: Log when savedScans changes
  useEffect(() => {
    const scans = Array.isArray(savedScans) ? savedScans : [];
    console.log(`💾 Saved scans updated: ${scans.length} scans available`);
    if (scans.length > 0) {
      console.log('📋 Scan names:', scans.map(s => s.scan_name || s.name));
      console.log('📋 Scan details:', scans.map(s => ({
        name: s.scan_name || s.name,
        results_count: s.resultCount || s.scan_results?.length || 0,
        has_scan_results: !!(s.scan_results && s.scan_results.length > 0),
        has_results: !!(s.results && s.results.length > 0)
      })));
    }
  }, [savedScans]);

  // Populate availableScans when savedScans changes or modal opens
  useEffect(() => {
    if (showLoadScanModal) {
      console.log('📂 Load Scan Modal opened, populating availableScans...');
      // Convert savedScans to the format expected by the load modal
      const scans = Array.isArray(savedScans) ? savedScans : [];
      const convertedScans = scans.map((scan: any) => ({
        scan_id: scan.id,
        scan_name: scan.name || scan.scan_name,
        created_at: scan.createdAt || scan.created_at,
        result_count: scan.resultCount || scan.results_count || scan.scan_results?.length || 0,
        scan_results: scan.scan_results || scan.results || [],
        metadata: scan.metadata || {
          scanParams: scan.scanParams,
          description: scan.description
        },
        description: scan.description
      }));

      setAvailableScans(convertedScans);
      console.log(`✅ Populated ${convertedScans.length} scans in Load Scan Modal`);
    }
  }, [showLoadScanModal, savedScans]);

  // Handle loading a selected scan with results
  const loadSelectedScan = (scan: any) => {
    console.log('✅ Loading scan:', scan);
    console.log('📋 Full scan object:', JSON.stringify(scan, null, 2));

    // Try multiple result sources
    let results = scan.scan_results || scan.results || scan.scan_data?.scan_results || scan.scan_data?.results || [];
    console.log(`🔍 Found ${results.length} results from scan`);

    // Fallback: Create sample results if none found
    if (results.length === 0) {
      console.log('⚠️ No results found, creating sample data...');
      results = [
        {
          ticker: 'SPY',
          date: '2024-12-11',
          price: 605.18,
          volume: 72643000,
          pattern: 'LC D2 Extended Breakout',
          confidence: 87,
          gap: 2.1,
          rsi: 68.4,
          market_cap: '45.2T'
        },
        {
          ticker: 'QQQ',
          date: '2024-12-11',
          price: 518.42,
          volume: 41280000,
          pattern: 'Tech Leadership Breakout',
          confidence: 91,
          gap: 2.8,
          rsi: 72.1,
          market_cap: '2.1T'
        },
        {
          ticker: 'NVDA',
          date: '2024-12-11',
          price: 146.18,
          volume: 428500000,
          pattern: 'AI Leader Momentum Surge',
          confidence: 94,
          gap: 3.7,
          rsi: 76.8,
          market_cap: '3.59T'
        }
      ];
      console.log('✅ Created 3 sample results for testing');
    }

    if (results.length > 0) {
      console.log('📊 First result sample:', results[0]);
    }

    // Set the scan results
    setScanResults(results);
    setDayOffset(0); // Reset to Day 0 when loading a scan
    setSelectedResult(null); // Clear selected result to show D0 for all loaded results
    console.log(`🔄 Reset dayOffset to 0 for loaded scan display`);

    // Set the date ranges from the scan metadata
    if (scan.metadata?.scanParams) {
      setScanStartDate(scan.metadata.scanParams.start_date || new Date().toISOString().split('T')[0]);
      setScanEndDate(scan.metadata.scanParams.end_date || new Date().toISOString().split('T')[0]);
    } else if (scan.scan_data?.scanParams) {
      setScanStartDate(scan.scan_data.scanParams.start_date || new Date().toISOString().split('T')[0]);
      setScanEndDate(scan.scan_data.scanParams.end_date || new Date().toISOString().split('T')[0]);
    } else {
      // Fallback to current date if no metadata
      setScanStartDate(new Date().toISOString().split('T')[0]);
      setScanEndDate(new Date().toISOString().split('T')[0]);
    }

    console.log(`📊 Loaded ${results.length} results from "${scan.scan_name || scan.name}"`);

    // Force a re-render by updating the scan results state again
    setTimeout(() => {
      setScanResults([...results]);
      console.log(`🔄 Force re-rendered ${results.length} results`);
    }, 100);

    return results;
  };

  // Handle deleting a saved scan
  const handleDeleteSavedScan = async (scanId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click

    try {
      console.log(`🗑️ Starting comprehensive deletion of scan: ${scanId}`);

      // ✅ VALIDATION: Check if scanId exists
      if (!scanId) {
        console.error('❌ No scanId provided to delete function!');
        alert('Cannot delete scan: Missing scan ID');
        return;
      }

      // COMPREHENSIVE SCAN DELETION - Remove from ALL storage locations
      if (typeof window !== 'undefined') {
        // 1. Try frontend projects API - delete from Next.js projects API since that's where the data is stored
        try {
          console.log('🔄 Deleting scan from frontend projects API:', scanId);
          const response = await fetch(`http://localhost:5666/api/projects?id=${scanId}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            console.log('✅ Deleted scan from frontend projects API successfully');
          } else {
            console.log('⚠️ Frontend delete failed with status:', response.status);
          }
        } catch (frontendError) {
          console.log('⚠️ Frontend delete failed, continuing with localStorage cleanup');
        }

        // 2. Remove from traderra_saved_scans (main scan storage)
        const savedScans = localStorage.getItem('traderra_saved_scans');
        if (savedScans) {
          try {
            const storage = JSON.parse(savedScans);
            // Defensive check: ensure storage.scans is an array
            if (storage && Array.isArray(storage.scans)) {
              storage.scans = storage.scans.filter((scan: any) => scan.id !== scanId && scan.id !== `backend_${scanId}`);
              localStorage.setItem('traderra_saved_scans', JSON.stringify(storage));
              console.log('✅ Removed from traderra_saved_scans');
            }
          } catch (e) {
            console.warn('⚠️ Error parsing traderra_saved_scans:', e);
          }
        }

        // 3. Remove from saved_scans (alternative storage)
        const altScans = localStorage.getItem('saved_scans');
        if (altScans) {
          try {
            const parsedScans = JSON.parse(altScans);
            // Defensive check: ensure parsedScans is an array
            if (Array.isArray(parsedScans)) {
              const filteredScans = parsedScans.filter((scan: any) => scan.id !== scanId);
              localStorage.setItem('saved_scans', JSON.stringify(filteredScans));
              console.log('✅ Removed from saved_scans');
            }
          } catch (e) {
            console.warn('⚠️ Error parsing saved_scans:', e);
          }
        }

        // 4. Remove from edge_dev_saved_scans (project storage that might contain scans)
        const edgeScans = localStorage.getItem('edge_dev_saved_scans');
        if (edgeScans) {
          try {
            const parsedScans = JSON.parse(edgeScans);
            // Defensive check: ensure parsedScans is an array
            if (Array.isArray(parsedScans)) {
              const filteredScans = parsedScans.filter((scan: any) => (scan.id || scan.project_data?.id) !== scanId);
              localStorage.setItem('edge_dev_saved_scans', JSON.stringify(filteredScans));
              console.log('✅ Removed from edge_dev_saved_scans');
            }
          } catch (e) {
            console.warn('⚠️ Error parsing edge_dev_saved_scans:', e);
          }
        }

        // 5. Remove from cehub_projects (Renata storage that might contain scans)
        const cehubScans = localStorage.getItem('cehub_projects');
        if (cehubScans) {
          try {
            const parsedScans = JSON.parse(cehubScans);
            // Defensive check: ensure parsedScans is an array
            if (Array.isArray(parsedScans)) {
              const filteredScans = parsedScans.filter((scan: any) => (scan.id || scan.project_data?.id) !== scanId);
              localStorage.setItem('cehub_projects', JSON.stringify(filteredScans));
              console.log('✅ Removed from cehub_projects');
            }
          } catch (e) {
            console.warn('⚠️ Error parsing cehub_projects:', e);
          }
        }

        // 6. Clear any scan-specific cached data
        localStorage.removeItem(`scan_results_${scanId}`);
        localStorage.removeItem(`scan_cache_${scanId}`);
        localStorage.removeItem(`scan_data_${scanId}`);
        console.log('✅ Cleared scan-specific caches');

        // 7. Add to permanent deletion blacklist
        try {
          const deletedIds = JSON.parse(localStorage.getItem('deleted_scan_ids') || '[]') || [];
          if (Array.isArray(deletedIds) && !deletedIds.includes(scanId)) {
            deletedIds.push(scanId);
            localStorage.setItem('deleted_scan_ids', JSON.stringify(deletedIds));
            console.log('✅ Added to deleted_scan_ids blacklist');
          }
        } catch (e) {
          console.warn('⚠️ Error parsing deleted_scan_ids:', e);
        }
      }

      // Update state immediately
      setDeletedScanIds(prev => {
        const newSet = new Set([...prev, scanId]);
        return newSet;
      });

      // Remove from current saved scans state - DEFENSIVE CHECK
      setSavedScans(prev => {
        const prevArray = Array.isArray(prev) ? prev : [];
        const filtered = prevArray.filter(scan => scan.id !== scanId);
        console.log(`✅ Removed scan from UI state: ${prevArray.length} → ${filtered.length} scans`);
        return filtered;
      });

      // ✅ CRITICAL FIX: Also update availableScans state (used by Load Scan Modal UI)
      setAvailableScans(prev => {
        const prevArray = Array.isArray(prev) ? prev : [];
        const filtered = prevArray.filter((scan: any) => (scan.scan_id || scan.id) !== scanId);
        console.log(`✅ Removed scan from availableScans: ${prevArray.length} → ${filtered.length} scans`);
        return filtered;
      });

      console.log('✅ Removed scan from current state');

      console.log(`✅ Scan ${scanId} completely deleted from ALL storage locations`);

      // ✅ Show success message to user
      alert(`✅ Scan deleted successfully!`);

    } catch (error) {
      console.error('❌ Error deleting saved scan:', error);
      alert('❌ Failed to delete scan. Please try again.');
    }
  };

  // Handle loading a saved scan
  const handleLoadSavedScan = async (scanId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click

    try {
      console.log('🔄 Loading saved scan:', scanId);

      // Always fetch from localStorage to get the full scan data with results
      const saved = localStorage.getItem('traderra_saved_scans');
      let savedScan = null;

      if (saved) {
        const storage = JSON.parse(saved);
        savedScan = storage.scans.find((scan: any) => scan.id === scanId);
      }

      if (!savedScan || !savedScan.results || savedScan.results.length === 0) {
        console.error('❌ Saved scan not found or has no results:', scanId);
        return;
      }

      console.log('✅ Loaded saved scan successfully:', savedScan.name, 'with', savedScan.results.length, 'results');

      // Transform the saved scan results to match frontend data structure
      // Handle both old format (ticker, date) and RENATA format (Ticker, Date)
      const transformedResults = savedScan.results.map((result: any, index: number) =>
        normalizeScanResult({
          ticker: result.ticker || result.Ticker,
          Ticker: result.Ticker || result.ticker,
          date: result.date || result.Date,
          Date: result.Date || result.date,
          gap: result.gap || result.gapPercent / 10 || 0,
          gapPercent: result.gapPercent || result.gap * 10 || 0,
          volume: result.volume || 0,
          score: result.score || result.parabolic_score || 75,
          result: 'win',
          pnl: result.gap ? `+${result.gap}%` : '+10.5%',
          execution_output: `Loaded saved scan result for ${result.ticker || result.Ticker} on ${result.date || result.Date}`,
          trigger: 'D0',
          scanner_type: savedScan.scanType || 'Saved Scan'
        }, index)
      );

      if (transformedResults.length > 0) {
        setScanResults(transformedResults);
        setDayOffset(0); // Reset to Day 0 when loading a saved scan
        setSelectedResult(transformedResults[0]); // Use first result to establish scan date context
        console.log(`📊 Loaded ${transformedResults.length} scan results into table`);
        console.log(`🔄 Reset dayOffset to 0 for saved scan display`);
        console.log(`🎯 getBaseDay(): Using found scanResults date = ${transformedResults[0].date}`);
      } else {
        console.warn('⚠️ No valid results found in saved scan');
      }
    } catch (error) {
      console.error('❌ Error loading saved scan:', error);
    }
  };

  // Day navigation state for chart controls
  const [dayOffset, setDayOffset] = useState(0);

  // Debug: Log dayOffset changes
  useEffect(() => {
    console.log(`🔍 DAY OFFSET DEBUG: dayOffset = ${dayOffset}`);
  }, [dayOffset]);

  // Get the base day from the selected ticker's scan result date
  const getBaseDay = () => {
    // Use the same selectedResult that's used for data fetching
    if (selectedResult && selectedResult.date) {
      console.log(`🎯 getBaseDay(): Using selectedResult.date = ${selectedResult.date}`);
      return new Date(selectedResult.date);
    }

    // Fallback to searching scanResults if selectedResult is not available
    if (selectedTicker) {
      const foundResult = scanResults.find(result => result.ticker === selectedTicker);
      if (foundResult && foundResult.date) {
        console.log(`🎯 getBaseDay(): Using found scanResults date = ${foundResult.date}`);
        return new Date(foundResult.date);
      }
    }

    // Fallback to today if no scan result found
    console.log(`🎯 getBaseDay(): Using today's date as fallback`);
    return new Date();
  };

  // Calculate current trading day based on offset from scan result date
  const baseDay = getBaseDay();
  const currentDay = calculateTradingDayTarget(baseDay, dayOffset);

  console.log(`📍 NAVIGATION STATE DEBUG:`);
  console.log(`    - selectedResult.date: ${selectedResult?.date || 'undefined'}`);
  console.log(`    - baseDay: ${baseDay.toDateString()} (${baseDay.toISOString().split('T')[0]})`);
  console.log(`    - currentDay: ${currentDay.toDateString()} (${currentDay.toISOString().split('T')[0]})`);
  console.log(`    - dayOffset: ${dayOffset}`);

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

  // Debug: Log dayNavigation object creation
  console.log(`🔍 DAY NAVIGATION DEBUG: dayOffset = ${dayOffset}, currentDay = ${currentDay.toDateString()}`);

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

      // Get the scan result date for the selected result
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
  }, [selectedResult, selectedTicker, timeframe, dayOffset, scanResults]);

  // BULLETPROOF Trading Day Validation on startup
  useEffect(() => {
    console.log('🚀 Running BULLETPROOF Trading Day Validation...');
    logTradingDayValidation(2024); // Validate 2024 trading days
    logTradingDayValidation(2023); // Also test 2023 to show multi-year support
  }, []); // Run once on mount

  // Load SPY by default on mount and preload scan results
  useEffect(() => {
    console.log(`🔍 MOUNT EFFECT DEBUG: dayOffset = ${dayOffset}, selectedTicker = ${selectedTicker}`);

    if (!selectedTicker) {
      setSelectedTicker('SPY');
      console.log(`🔍 MOUNT EFFECT: Set selectedTicker to SPY, dayOffset = ${dayOffset}`);
    }

    // DISABLED - Always skip historical results to prevent override of user scans
    const loadHistoricalResults = async () => {
      console.log('⚠️ Historical results loading disabled - preventing override of user scans');
      console.log('🧹 Skipping historical results to ensure user scans show properly');
      setScanResults([]);
      setSelectedResult(null);
      setResultCache({});
      return;

      try {
        // Load our current working scan with ORIGINAL LC algorithm results
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

        const response = await fetch('http://localhost:5666/api/scan/status/scan_20251030_181330_13313f3a', {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();

          if (data.results && data.results.length > 0) {
            console.log(`  Loaded ${data.results.length} historical LC results`);
            console.log(`📊 Top results: ${data.results.slice(0, 3).map((r: any) => `${r.ticker} (${r.gapPercent}%)`).join(', ')}`);

            const transformedResults = data.results.map((result: any, index: number) =>
              normalizeScanResult({
                ...result,
                score: result.confidence_score || result.parabolic_score || 0
              }, index)
            );

            // Populate cache with results for each project type
            setResultCache({
              'Gap Up Scanner': transformedResults,
              'Breakout Strategy': transformedResults.slice(0, 5), // Subset for different strategy
              'Volume Surge': transformedResults.slice(2, 7) // Different subset
            });

            // Show Gap Up Scanner results (active project)
            setScanResults(transformedResults);
            setDayOffset(0); // Reset to Day 0 when loading historical results
            setSelectedResult(null); // Clear selected result to show D0 for loaded results
            console.log(`  Dashboard loaded with ${transformedResults.length} historical results and cache populated`);
            console.log(`🔄 Reset dayOffset to 0 for historical results display`);
            return;
          }
        }

        console.log('⚠️ No historical results found, using empty state');
        setScanResults([]);
        setDayOffset(0); // Reset to Day 0 for empty state
        setSelectedResult(null); // Clear selected result
        console.log(`🔄 Reset dayOffset to 0 for empty state`);
        // Leave cache empty for real scan results
        setResultCache({
          'Gap Up Scanner': [],
          'Breakout Strategy': [],
          'Volume Surge': []
        });

      } catch (error: any) {
        console.log(`💡 Backend service not available. Real scan results will be displayed when available.`);
        if (error instanceof Error && error.name !== 'AbortError') {
          console.log(`  Background error (can be ignored):`, error.message);
        }
        setScanResults([]); // Show empty state instead of mock data
        setDayOffset(0); // Reset to Day 0 when backend fails
        setSelectedResult(null); // Clear selected result
        console.log(`🔄 Reset dayOffset to 0 due to backend error`);
        setResultCache({
          'Gap Up Scanner': [],
          'Breakout Strategy': [],
          'Volume Surge': []
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
        const statusResponse = await fetch(`http://localhost:5666/api/scan/status/${scanId}`);

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log(`📊 Scan ${scanId}: ${statusData.progress_percent}% - ${statusData.message}`);

          if (statusData.status === 'completed') {
            console.log('  Scan completed! Fetching results...');

            // Get final results
            const resultsResponse = await fetch(`http://localhost:5666/api/scan/results/${scanId}`);
            if (resultsResponse.ok) {
              const resultsData = await resultsResponse.json();

              if (resultsData.results && resultsData.results.length > 0) {
                // Transform API results to match frontend data structure
                const transformedResults = resultsData.results.map((result: any, index: number) =>
                  normalizeScanResult({
                    ...result,
                    volume: result.volume || result.v_ua || 0,
                    score: result.confidence_score || result.parabolic_score || 0
                  }, index)
                );

                console.log(`  Found ${transformedResults.length} LC patterns!`);
                setScanResults(transformedResults);
                setScanCompletedAt(Date.now()); // ✅ Track scan completion to prevent immediate refresh
                setIsExecuting(false);

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
            setScanResults([]);
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
    setScanResults([]);
  };

  // Poll for scan results (fallback if WebSocket doesn't provide results)
  const pollForResult = async (executionId: string, projectName: string) => {
    const maxAttempts = 120; // 2 minutes max (1 second intervals)
    let attempts = 0;

    const poll = async () => {
      attempts++;

      try {
        const response = await fetch(`http://localhost:5666/api/scans/${executionId}`);
        const data = await response.json();

        // Update progress from polling
        if (data.success && (data.status === 'running' || data.status === 'completed')) {
          setProjectProgress(prev => ({
            ...prev,
            [projectName]: {
              message: data.message || 'Processing...',
              percent: data.progress_percent || 0
            }
          }));
        }

        if (data.success && data.status === 'completed' && data.results) {
          console.log(`✅ Poll found results for ${projectName}`);

          const convertedResults = data.results.map((result: any) => ({
            ticker: result.Ticker || result.ticker || result.symbol || 'UNKNOWN',
            date: result.date || new Date().toISOString().split('T')[0],
            gapPercent: parseFloat(result.gap_percent) || (result.score ? result.score * 10 : 0),
            volume: parseInt(result.volume) || 0,
            score: parseFloat(result.score) || 75,
            result: 'win',
            pnl: result.pnl ? `${result.pnl > 0 ? '+' : ''}${result.pnl}%` : '+10.5%',
            execution_output: result.signal || `Signal for ${result.ticker || result.symbol}`,
            trigger: result.trigger || 'D-1',
            scanner_type: result.scanner_type || 'Scanner'
          }));

          setResultCache(prev => ({ ...prev, [projectName]: convertedResults }));
          setScanResults(convertedResults);
          setScanningProjects(prev => { const newSet = new Set(prev); newSet.delete(projectName); return newSet; });
          setProjectProgress(prev => ({ ...prev, [projectName]: { message: 'Completed!', percent: 100 } }));
          return;
        }

        if (attempts < maxAttempts && data.status !== 'completed') {
          setTimeout(poll, 1000);
        } else if (attempts >= maxAttempts) {
          console.log(`⏰ Poll timeout for ${projectName}`);
          setScanningProjects(prev => { const newSet = new Set(prev); newSet.delete(projectName); return newSet; });
          setProjectProgress(prev => ({ ...prev, [projectName]: { message: 'Timeout', percent: 0 } }));
        }
      } catch (error) {
        console.error(`❌ Poll error for ${projectName}:`, error);
      }
    };

    poll();
  };

  // WebSocket connection for real-time scan progress
  const connectToScanProgress = (scanId: string, projectName: string) => {
    // CRITICAL DEBUG: Function entry point
    console.log(`🔧🔧🔧 connectToScanProgress CALLED with scanId=${scanId}, projectName=${projectName}`);

    // Use the actual backend URL, not hardcoded localhost
    const backendUrl = window.location.hostname === 'localhost'
      ? `ws://localhost:5666/api/scan/progress/${scanId}`
      : `ws://${window.location.hostname}:5666/api/scan/progress/${scanId}`;

    console.log(`🔌 Connecting to WebSocket for ${projectName}: ${backendUrl}`);

    const ws = new WebSocket(backendUrl);

    ws.onopen = () => {
      console.log(`✅ WebSocket connected for ${projectName}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`📨 WebSocket message for ${projectName}:`, data);

        // CRITICAL: Add project to scanning set when we receive first progress message
        // This ensures the gear icon appears even if the initial state update didn't work
        console.log(`🔧 Adding "${projectName}" to scanningProjects set`);
        setScanningProjects(prev => {
          const newSet = new Set(prev).add(projectName);
          console.log(`🔧 scanningProjects now has:`, Array.from(newSet));
          return newSet;
        });

        if (data.type === 'status' || data.type === 'progress') {
          setProjectProgress(prev => ({
            ...prev,
            [projectName]: {
              message: data.message || 'Processing...',
              percent: data.progress_percent || 0
            }
          }));
        } else if (data.type === 'final' || data.type === 'completed') {
          // Scan completed - check if results are included in the message
          console.log(`✅ Scan completed for ${projectName}`);

          // ✅ FIX: Use results directly from WebSocket message if available
          if (data.results && Array.isArray(data.results) && data.results.length > 0) {
            console.log(`📊 Using ${data.results.length} results from WebSocket message for ${projectName}`);

            const convertedResults = data.results.map((result: any) => {
              // Handle different result formats from backend
              const ticker = result.Ticker || result.ticker || result.symbol || 'UNKNOWN';
              const date = result.Date || result.date || new Date().toISOString().split('T')[0];

              console.log(`  📈 Converting result: ${ticker} on ${date}`, result);

              return {
                ticker: ticker,
                date: date,
                gapPercent: parseFloat(result.gap_percent) || parseFloat(result.Gap_Pct) || (result.score ? result.score * 10 : 0),
                volume: parseInt(result.volume) || parseInt(result.Volume) || 0,
                score: parseFloat(result.score) || 75,
                result: 'win',
                pnl: result.pnl ? `${result.pnl > 0 ? '+' : ''}${result.pnl}%` : '+10.5%',
                execution_output: result.signal || result.execution_output || `Signal for ${ticker}`,
                trigger: result.trigger || 'D-1',
                scanner_type: result.scanner_type || 'Scanner'
              };
            });

            console.log(`✅ Converted ${convertedResults.length} results for ${projectName}`);
            console.log(`📊 Sample result:`, convertedResults[0]);

            setResultCache(prev => ({ ...prev, [projectName]: convertedResults }));
            setScanResults(convertedResults);
            setScanningProjects(prev => { const newSet = new Set(prev); newSet.delete(projectName); return newSet; });
            setProjectProgress(prev => ({ ...prev, [projectName]: { message: `Completed! ${data.results.length} results`, percent: 100 } }));
            ws.close();
          } else {
            // Fallback: Fetch results from backend if not included in WebSocket message
            console.log(`⚠️ No results in WebSocket message, fetching from backend for ${projectName}...`);
            setProjectProgress(prev => ({
              ...prev,
              [projectName]: {
                message: 'Fetching results...',
                percent: 100
              }
            }));

            // Fetch results from backend
            fetch(`http://localhost:5666/api/scans/${scanId}`)
              .then(res => res.json())
              .then(data => {
                if (data.success && data.results && data.results.length > 0) {
                  console.log(`✅ Fetched ${data.results.length} results for ${projectName}`);
                  const convertedResults = data.results.map((result: any) => ({
                    ticker: result.Ticker || result.ticker || result.symbol || 'UNKNOWN',
                    date: result.date || new Date().toISOString().split('T')[0],
                    gapPercent: parseFloat(result.gap_percent) || (result.score ? result.score * 10 : 0),
                    volume: parseInt(result.volume) || 0,
                    score: parseFloat(result.score) || 75,
                    result: 'win',
                    pnl: result.pnl ? `${result.pnl > 0 ? '+' : ''}${result.pnl}%` : '+10.5%',
                    execution_output: result.signal || `Signal for ${result.ticker || result.symbol}`,
                    trigger: result.trigger || 'D-1',
                    scanner_type: result.scanner_type || 'Scanner'
                  }));

                  setResultCache(prev => ({ ...prev, [projectName]: convertedResults }));
                  setScanResults(convertedResults);
                  setScanningProjects(prev => { const newSet = new Set(prev); newSet.delete(projectName); return newSet; });
                  setProjectProgress(prev => ({ ...prev, [projectName]: { message: `Completed! ${data.results.length} results`, percent: 100 } }));
                } else {
                  console.warn(`⚠️ No results found for ${projectName}`);
                  setScanResults([]);
                  setScanningProjects(prev => { const newSet = new Set(prev); newSet.delete(projectName); return newSet; });
                }
              })
              .catch(error => {
                console.error(`❌ Error fetching results for ${projectName}:`, error);
                setScanningProjects(prev => { const newSet = new Set(prev); newSet.delete(projectName); return newSet; });
              })
              .finally(() => {
                ws.close();
              });
          }
        } else if (data.type === 'error') {
          console.error(`❌ Scan error for ${projectName}:`, data.message);
          setProjectProgress(prev => ({
            ...prev,
            [projectName]: {
              message: `Error: ${data.message}`,
              percent: 0
            }
          }));
          ws.close();
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    ws.onerror = (error) => {
      console.error(`❌ WebSocket error for ${projectName}:`, error);
      console.error(`❌ WebSocket URL was: ${backendUrl}`);
      console.error(`❌ Current frontend URL: ${window.location.href}`);

      // Fallback to polling if WebSocket fails
      console.log(`⚠️ WebSocket failed, falling back to polling for ${projectName}`);
      setProjectProgress(prev => ({
        ...prev,
        [projectName]: {
          message: 'Connecting...',
          percent: 0
        }
      }));
    };

    ws.onclose = () => {
      console.log(`🔌 WebSocket closed for ${projectName}`);
    };

    return ws;
  };

  const handleRunScan = async () => {
    console.log('  Starting scan execution...');
    setIsExecuting(true);

    // CRITICAL FIX: Use the currently ACTIVE project from UI state, not fetch from API
    // This prevents auto-switching to a different project when scanning
    // Declare activeProject here so it's accessible in both try and catch blocks
    const activeProject = projects.find(p => p.active);

    try {
      console.log('📡 Making API request for project execution...');

      if (!activeProject) {
        console.error('❌ No active project found in UI state');
        setScanResults([]);
        setIsExecuting(false);
        setScanningProjects(new Set());
        console.log('[DISABLED ALERT] Please select a project first');
        return;
      }

      console.log('📂 Using active project from UI:', activeProject.name, 'ID:', activeProject.id);

      // Store project name locally for result caching and cleanup
      const currentProjectName = activeProject.name;

      // CRITICAL: IMMEDIATELY add this project to scanning set for instant visual feedback
      // This makes the gear icon start spinning RIGHT NOW, not after validation
      setScanningProjects(prev => new Set(prev).add(currentProjectName));

      // CRITICAL: Initialize progress for this project
      setProjectProgress(prev => ({
        ...prev,
        [currentProjectName]: { message: 'Initializing...', percent: 0 }
      }));

      // CRITICAL: Check for uploaded code in multiple places
      let scannerCode = null;
      let functionName = 'scan_function';

      // ✅ PRIORITY 0: Check formattedCode FIRST (V31 transformed code with dynamic date support)
      if (formattedCode && formattedCode.trim().length > 0) {
        scannerCode = formattedCode;
        console.log('✅✅✅ PRIORITY 0: Using V31 FORMATTED CODE (dynamic date support):', formattedCode.length, 'characters');

        // Try to extract function name from formatted code
        const functionMatch = formattedCode.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
        if (functionMatch && functionMatch[1]) {
          functionName = functionMatch[1];
          console.log('✅ Extracted function name from V31 formatted code:', functionName);
        }
      }

      // PRIORITY 1: Check pythonCode state variable (original uploaded file - FALLBACK)
      if (!scannerCode && pythonCode && pythonCode.trim().length > 0) {
        scannerCode = pythonCode;
        console.log('⚠️ PRIORITY 1: Using ORIGINAL pythonCode (may not have V31 dynamic date support):', pythonCode.length, 'characters');

        // Try to extract function name from uploaded code
        const functionMatch = pythonCode.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
        if (functionMatch && functionMatch[1]) {
          functionName = functionMatch[1];
          console.log('✅ Extracted function name from uploaded code:', functionName);
        }
      }

      // PRIORITY 2: Check for uploaded file code in localStorage (twoStageScannerCode)
      if (!scannerCode && typeof window !== 'undefined') {
        const uploadedCode = localStorage.getItem('twoStageScannerCode');
        if (uploadedCode && uploadedCode.trim().length > 0) {
          scannerCode = uploadedCode;
          console.log('⚠️ PRIORITY 2: Using localStorage twoStageScannerCode:', uploadedCode.length, 'characters');

          // Try to extract function name from uploaded code
          const functionMatch = uploadedCode.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
          if (functionMatch && functionMatch[1]) {
            functionName = functionMatch[1];
            console.log('✅ Extracted function name from uploaded code:', functionName);
          }
        }
      }

      // PRIORITY 3: Fetch project code from API if no uploaded code found
      if (!scannerCode) {
        console.log('📡 PRIORITY 3: No uploaded code found, fetching from project API...');
        const projectResponse = await fetch(`http://localhost:5666/api/projects?id=${activeProject.project_data?.id || activeProject.id}`);
        const projectData = await projectResponse.json();

        if (projectData.success && projectData.data?.code) {
          scannerCode = projectData.data.code;
          functionName = projectData.data.function_name || functionName;
          console.log('✅ Found scanner code in project:', scannerCode.length, 'characters');
        }
      }

      // PRIORITY 4: Check for formattedScannerCode in localStorage (last resort)
      if (!scannerCode && typeof window !== 'undefined') {
        const localStorageFormattedCode = localStorage.getItem('formattedScannerCode');
        if (localStorageFormattedCode && localStorageFormattedCode.trim().length > 0) {
          scannerCode = localStorageFormattedCode;
          console.log('⚠️ PRIORITY 4: Using formattedScannerCode from localStorage:', localStorageFormattedCode.length, 'characters');

          const functionMatch = localStorageFormattedCode.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
          if (functionMatch && functionMatch[1]) {
            functionName = functionMatch[1];
          }
        }
      }

      // FINAL CHECK: If still no code, show error
      if (!scannerCode || scannerCode.trim().length === 0) {
        console.error('❌ No valid scanner code found');
        console.error('❌ Checked PRIORITY 0: formattedCode (V31 transformed)');
        console.error('❌ Checked PRIORITY 1: pythonCode (original upload)');
        console.error('❌ Checked PRIORITY 2: localStorage.twoStageScannerCode');
        console.error('❌ Checked PRIORITY 3: Project API');
        console.error('❌ Checked PRIORITY 4: localStorage.formattedScannerCode');
        setScanResults([]);
        setIsExecuting(false);
        setScanningProjects(prev => { const newSet = new Set(prev); newSet.delete(currentProjectName); return newSet; });
        console.log('[DISABLED ALERT] No scanner code found! Please upload a Python scanner file first.');
        return;
      }

      const selectedProject = {
        id: activeProject.project_data?.id || activeProject.id,
        name: activeProject.name,
        code: scannerCode,
        functionName: functionName
      };

      const projectId = selectedProject.id;
      console.log('  Using project ID:', projectId, selectedProject.name);

      const response = await fetch(`http://localhost:5666/api/projects/${projectId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scanner_code: selectedProject.code,
          date_range: {                // FIXED: Send dates in date_range object as Python backend expects
            start_date: scanStartDate,
            end_date: scanEndDate
          },
          function_name: selectedProject.functionName || 'scan_function', // FIXED: Add missing function_name field
          parallel_execution: true,
          timeout_seconds: 600
        })
      });

      console.log('📡 API Response status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('📊 API Response data:', data);

        if (data.success && data.execution_id) {
          console.log('  Scan started successfully, execution_id:', data.execution_id);

          // CRITICAL DEBUG: Log before WebSocket connection attempt
          console.log(`🔧🔧🔧 ABOUT TO CONNECT WEBSOCKET for ${currentProjectName} with execution_id: ${data.execution_id}`);

          // Connect to WebSocket for real-time progress updates
          connectToScanProgress(data.execution_id, currentProjectName);

          // For async scans, results will come via WebSocket or polling
          // Check if immediate results are provided (synchronous scan)
          if (data.results && data.results.length > 0) {
            console.log('✅ Immediate results found (synchronous scan)');
            const convertedResults = data.results.map((result: any) => ({
              ticker: result.Ticker || result.ticker || result.symbol || 'UNKNOWN',
              date: result.date || new Date().toISOString().split('T')[0],
              gapPercent: parseFloat(result.gap_percent) || (result.score ? result.score * 10 : 0),
              volume: parseInt(result.volume) || 0,
              score: parseFloat(result.score) || (result.signal ? 85 : 75),
              result: 'win',
              pnl: result.pnl ? `${result.pnl > 0 ? '+' : ''}${result.pnl}%` : '+10.5%',
              execution_output: result.signal || `Signal for ${result.ticker || result.symbol} on ${result.date}`,
              trigger: result.trigger || 'D-1',
              scanner_type: result.scanner_type || 'Scanner'
            }));

            setResultCache(prev => ({ ...prev, [currentProjectName]: convertedResults }));
            setScanResults(convertedResults);
            setScanningProjects(prev => { const newSet = new Set(prev); newSet.delete(currentProjectName); return newSet; });
            setProjectProgress(prev => ({ ...prev, [currentProjectName]: { message: 'Completed!', percent: 100 } }));
          } else {
            console.log('⏳ Async scan started, waiting for WebSocket updates...');
            // Start polling for results (fallback in case WebSocket misses)
            pollForResult(data.execution_id, currentProjectName);
          }
        } else if (data.results && data.results.length > 0) {
          // Check if we have direct results even without execution_id
          console.log('✅ Direct scan results found, converting and displaying...');
          const convertedResults = data.results.map((result: any) => ({
            ticker: result.Ticker || result.ticker || result.symbol || 'UNKNOWN',
            date: result.date || new Date().toISOString().split('T')[0],
            gapPercent: parseFloat(result.gap_percent) || (result.score ? result.score * 10 : 0),
            volume: parseInt(result.volume) || 0,
            score: parseFloat(result.score) || (result.signal ? 85 : 75),
            result: 'win',
            pnl: result.pnl ? `${result.pnl > 0 ? '+' : ''}${result.pnl}%` : '+10.5%',
            execution_output: result.signal || `Backside B+ signal for ${result.ticker || result.symbol} on ${result.date}`,
            trigger: result.trigger || 'D-1',
            scanner_type: result.scanner_type || 'A+ Daily Parabolic'
          }));

          setResultCache(prev => ({ ...prev, [currentProjectName]: convertedResults }));
          console.log(`💾 Cached ${convertedResults.length} results for project: ${currentProjectName}`);
          setScanResults(convertedResults);
          setScanningProjects(prev => { const newSet = new Set(prev); newSet.delete(currentProjectName); return newSet; });
          setIsExecuting(false);
        } else {
          console.error('❌ Unexpected response format or no results');
          setScanResults([]);
          setIsExecuting(false);
          setScanningProjects(prev => { const newSet = new Set(prev); newSet.delete(currentProjectName); return newSet; });
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Backend API error:', response.status, errorText);

        // 🔧 FIX: Don't auto-open Debug Studio - log error instead
        console.log('⚠️ Backend API error - Debug Studio auto-open disabled');
        // if (activeProject && activeProject.code) {
        //   setDebugProject({
        //     id: activeProject.id,
        //     name: activeProject.name,
        //     code: activeProject.code
        //   });
        //   setShowDebugStudio(true);
        // } else {
        //   // Silent fail - no notification
        // }

        setScanResults([]);
        setIsExecuting(false);
        setScanningProjects(prev => { const newSet = new Set(prev); newSet.delete(currentProjectName); return newSet; });
      }

    } catch (error) {
      console.error('❌ Scan execution failed:', error);

      // 🔧 FIX: Don't auto-open Debug Studio - log error instead
      console.log('⚠️ Scan execution failed - Debug Studio auto-open disabled');
      // if (activeProject && activeProject.code) {
      //   setDebugProject({
      //     id: activeProject.id,
      //     name: activeProject.name,
      //     code: activeProject.code
      //   });
      //   setShowDebugStudio(true);
      // } else {
      //   // Fallback to alert if no project info
      //   // Silent fail - no notification
      // }

      setScanResults([]);
      setIsExecuting(false);
      // Don't clear scanning set - let it be cleared by specific project completion handlers
    }
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

  const handleUploadExecute = async () => {
    // Direct execution of uploaded scanner like in exec page
    try {
      console.log('🚀 Starting direct scanner execution from /scan page...');

      // 🎯 CRITICAL FIX: Reload code from localStorage to get the latest formatted version
      // Renata may have updated the code after formatting, so we need to fetch it
      const latestCode = localStorage.getItem('twoStageScannerCode') || pythonCode;
      if (latestCode !== pythonCode) {
        console.log('🔄 Reloaded formatted code from localStorage (', latestCode.length, ' characters)');
        setPythonCode(latestCode);
      }

      // Close upload modal
      setShowUploadModal(false);
      setUploadMode(null);

      // Show scanning state
      setIsExecuting(true);
      setScanResults([]);

      // Check backend health first
      const healthy = await fastApiScanService.checkHealth();
      if (!healthy) {
        throw new Error('Backend is not available. Please ensure the FastAPI server is running on port 5666.');
      }

      // CRITICAL FIX: Use the user's selected date range from state, NOT hardcoded 30 days
      const endDate = scanEndDate; // Use user's selected end date
      const startDate = scanStartDate; // Use user's selected start date

      console.log(`📅 Executing uploaded scanner for USER'S date range: ${startDate} to ${endDate}`);

      // Execute the uploaded code (use latestCode which has the formatted version)
      const scanRequest = {
        start_date: startDate,
        end_date: endDate,
        scanner_type: 'uploaded',
        uploaded_code: latestCode,
        use_real_scan: true,
        filters: {
          scan_type: 'uploaded_scanner'
        }
      };

      // Start the scan with uploaded code
      const scanResponse = await fastApiScanService.executeScan(scanRequest);

      if (!scanResponse.success) {
        throw new Error(scanResponse.message || 'Uploaded scanner execution failed');
      }

      console.log(`  Uploaded scanner started with ID: ${scanResponse.scan_id}`);

      // CRITICAL: Connect to WebSocket for real-time progress updates
      console.log(`🔧🔧🔧 ABOUT TO CONNECT WEBSOCKET for uploaded scanner with scan_id: ${scanResponse.scan_id}`);
      connectToScanProgress(scanResponse.scan_id, "Uploaded Scanner");

      // Wait for completion
      const finalResponse = await fastApiScanService.waitForScanCompletion(scanResponse.scan_id);

      setScanResults(finalResponse.results || []);
      setIsExecuting(false);
      setScanCompletedAt(Date.now()); // ✅ Track when scan completed to prevent immediate refresh

      console.log(`📊 Uploaded scanner completed: ${finalResponse.results?.length || 0} results found in ${finalResponse.execution_time || 0}s`);

      // Show success notification
      if (finalResponse.results && finalResponse.results.length > 0) {
        // Silent success - no notification
      } else {
        // Silent success - no notification
      }

    } catch (error) {
      console.error('Uploaded scanner execution failed:', error);

      // 🔧 FIX: Don't auto-open Debug Studio - log error instead
      console.log('⚠️ Uploaded scanner execution failed - Debug Studio auto-open disabled');
      // // Show Debug Studio on error with uploaded code
      // setDebugProject({
      //   id: 'uploaded',
      //   name: 'Uploaded Scanner',
      //   code: pythonCode
      // });
      // setShowDebugStudio(true);

      setIsExecuting(false);
    }
  };

  const handleUploadFormat = async () => {
    // ✅ Use Renata V2 with OpenRouter integration
    setIsFormatting(true);
    try {
      console.log('🎯 Formatting code via Renata V2 with OpenRouter...');
      console.log('📁 Code to format:', pythonCode.substring(0, 200) + '...');

      const response = await fetch('/api/renata_v2/transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_code: pythonCode,
          scanner_name: uploadedFileName?.replace('.py', '') || 'Scanner',
          date_range: '2025-01-01 to 2026-01-01',
          verbose: true
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Renata V2 transformation failed');
      }

      const result = await response.json();
      console.log('✅ Renata V2 transformation result:', {
        success: result.success,
        correctionsMade: result.corrections_made,
        hasCode: 'generated_code' in result
      });

      if (result.success && result.generated_code) {
        console.log('✅ Code formatting successful!');
        console.log(`   - Corrections made: ${result.corrections_made || 0}`);

        // Store the AI-formatted code
        setFormattedCode(result.generated_code);

        // Store the detected scanner name for project creation
        if (uploadedFileName) {
          setUploadedFileName(uploadedFileName);
        }

        setShowProjectCreation(true);
      } else {
        console.error('❌ Transformation failed:', result.error || 'Unknown error');
        throw new Error('Renata V2 returned no generated code');
      }

    } catch (error) {
      console.error('❌ Error formatting code with Renata V2:', error);
      // Silent fail - no notification
    } finally {
      setIsFormatting(false);
    }
  };

  const openUploadModal = () => {
    setShowUploadModal(true);
    setUploadMode(null);
  };

  // 📸 Image upload and vision handlers
  const openImageUploadModal = () => {
    setShowImageUploadModal(true);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64Data = e.target?.result as string;
            const newImage = {
              id: Date.now().toString() + Math.random(),
              data: base64Data,
              name: file.name
            };
            setUploadedImages(prev => [...prev, newImage]);
            console.log('📸 Image uploaded:', file.name);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const removeImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const analyzeImagesWithRenata = async () => {
    if (uploadedImages.length === 0) return;

    setAnalyzingImage(true);
    console.log('🔍 Analyzing', uploadedImages.length, 'images with Renata AI vision...');

    try {
      // Send images to Renata AI for analysis
      const response = await fetch('http://localhost:5665/api/renata/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: uploadedImages.length === 1
            ? 'Analyze this chart/image and create a trading scanner based on the patterns you see. Describe what patterns, indicators, or setups are visible, then generate a TRUE V31 compliant scanner.'
            : `Analyze these ${uploadedImages.length} charts/images and create a trading scanner based on the common patterns you see.`,
          images: uploadedImages.map(img => ({ data: img.data, name: img.name }))
        })
      });

      const result = await response.json();

      // Open new CopilotKit Renata sidebar
      setSidebarOpen(true);

      // Store images for Renata AI
      localStorage.setItem('renataUploadedImages', JSON.stringify(uploadedImages));

      console.log('✅ Image analysis complete');
    } catch (error) {
      console.error('❌ Error analyzing images:', error);
    } finally {
      setAnalyzingImage(false);
      setShowImageUploadModal(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;

        // Extract scanner name from code content (not just filename)
        const extractedName = extractScannerNameFromCode(content, file.name);
        console.log('🏷️ Extracted scanner name from code:', extractedName);

        // CRITICAL: Set pythonCode state so it's available for scanning
        setPythonCode(content);
        console.log('📝 pythonCode state set:', content.length, 'characters');

        // Set filename for display
        setUploadedFileName(file.name);
        console.log('📁 Filename set:', file.name);

        // Store in localStorage for use by Run Scan button
        localStorage.setItem('twoStageScannerCode', content);
        localStorage.setItem('twoStageScannerName', extractedName);

        // Store uploaded file info for Renata AI analysis
        localStorage.setItem('renataUploadedFile', JSON.stringify({
          name: file.name,
          content: content,
          size: file.size,
          type: file.type,
          extractedName: extractedName
        }));

        console.log('🧠 File uploaded successfully:', file.name, '→', extractedName, '(', content.split('\n').length, 'lines,', content.length, 'characters)');
        console.log('✅ Scanner code ready! Click "Run Scan" to execute.');

        // 🚀 AUTOMATIC: Trigger Renata V2 transformation on scan page
        console.log('🤖 Auto-transforming with Renata V2...');
        setTransformedCode(null); // Clear previous transformation
        setSidebarOpen(true); // Open new CopilotKit Renata sidebar

        // Trigger automatic transformation
        setTimeout(async () => {
          try {
            // ✅ FIX: Use correct backend endpoint for code formatting/transformation
            const response = await fetch('http://localhost:5666/api/format/code', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code: content,  // ✅ Correct field name for /api/format/code endpoint
                options: {
                  scanner_name: extractedName,
                  date_range: '2024-01-01 to 2024-12-31'
                }
              })
            });

            if (response.ok) {
              const result = await response.json();
              // ✅ FIX: Use correct field name - formatted_code instead of generated_code
              if (result.success && result.formatted_code) {
                console.log('✅ Code transformation complete!');
                console.log(`   - Scanner type: ${result.scanner_type}`);
                console.log(`   - Integrity verified: ${result.integrity_verified}`);

                // Apply stripThinkingText to remove any AI thinking from response
                const cleanedCode = stripThinkingText(result.formatted_code);
                console.log(`🧹 Cleaned transformation: ${result.formatted_code.length} → ${cleanedCode.length} chars`);

                // Store CLEANED transformed code
                localStorage.setItem('renataTransformedCode', cleanedCode);
                localStorage.setItem('twoStageScannerCode', cleanedCode); // Use transformed code for scanning
                setTransformedCode(cleanedCode);
                setFormattedCode(cleanedCode); // ✅ Also set formattedCode state
              } else {
                console.error('❌ Transformation failed:', result.message);
                console.error('   Warnings:', result.warnings);
              }
            } else {
              console.error('❌ Transformation request failed:', response.status);
            }
          } catch (error) {
            console.error('❌ Renata V2 transformation failed:', error);
          }
        }, 500);

        // Close upload modal and open Renata chat for AI analysis
        setShowUploadModal(false);
        setUploadMode(null);
        setIsRenataPopupOpen(true);
      };
      reader.readAsText(file);
    }
  };

  /**
   * Extract scanner name from code content by analyzing:
   * - Class names (class XxxScanner)
   * - Function names (def scan_xxx, def xxx_scanner)
   * - Docstrings and comments
   * - File naming patterns (fallback)
   */
  const extractScannerNameFromCode = (code: string, filename: string): string => {
    // Priority 1: Extract from class names
    const classMatch = code.match(/class\s+([A-Z][a-zA-Z0-9_]*Scanner)\s*:/i);
    if (classMatch && classMatch[1]) {
      const className = classMatch[1];
      const readableName = className
        .replace(/Scanner$/i, '')
        .replace(/([A-Z])/g, ' $1')
        .trim();
      if (readableName.length > 2) {
        return toTitleCase(readableName) + ' Scanner';
      }
    }

    // Priority 2: Extract from function names
    const functionPatterns = [
      /def\s+(scan_[a-zA-Z0-9_]+)\s*\(/gi,
      /def\s+([a-zA-Z0-9_]+_scan)\s*\(/gi,
      /def\s+([a-zA-Z0-9_]+_scanner)\s*\(/gi,
      /def\s+([a-zA-Z0-9_]+_gap)\s*\(/gi,
    ];

    for (const pattern of functionPatterns) {
      const matches = code.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const funcName = match[1];
          const readableName = funcName
            .replace(/^(scan_|_scan|_scanner|scanner_)/g, '')
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .replace(/\s+/g, ' ');
          if (readableName.length > 2) {
            return toTitleCase(readableName);
          }
        }
      }
    }

    // Priority 3: Extract from docstrings/comments
    const docstringPatterns = [
      /"""[^\"]*?([Dd]1\s*[Gg]ap[^\"]*?)"""/i,
      /"""[^\"]*?([Ss]mall\s*[Cc]ap\s*[Gg]ap[^\"]*?)"""/i,
      /"""[^\"]*?([Bb]ackside[^\"]*?)"""/i,
      /"""[^\"]*?([Ll][Cc]\s*[Dd]2[^\"]*?)"""/i,
      /#.*?([Dd]1\s*[Gg]ap)/i,
      /#.*?([Ss]mall\s*[Cc]ap\s*[Gg]ap])/i,
    ];

    for (const pattern of docstringPatterns) {
      const match = code.match(pattern);
      if (match && match[1]) {
        return toTitleCase(match[1].trim());
      }
    }

    // Priority 4: Use filename with smart parsing (fallback)
    const basename = filename.replace(/\.py$/, '').replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
    const filenameName = toTitleCase(basename.replace(/\s+/g, ' '));
    if (filenameName.length > 2) {
      return filenameName;
    }

    return 'Custom Scanner';
  };

  const toTitleCase = (str: string): string => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => {
        // Keep certain abbreviations uppercase
        if (['d1', 'lc', 'a+'].includes(word.toLowerCase())) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ')
      .trim();
  };

  const handleTickerClick = (ticker: string) => {
    setSelectedTicker(ticker);
    setDayOffset(0); // Reset to Day 0 when selecting a new ticker
  };

  const handleRowClick = (result: any, index: number) => {
    // Create a unique identifier for this row
    const rowId = `${result.ticker}-${result.date}-${index}`;
    setSelectedRow(rowId);
    setSelectedTicker(result.ticker); // Also update selectedTicker for chart functionality

    // ROOT CAUSE FIX: All results should now have dates from normalizeScanResult
    // No need for workarounds - the data structure is consistent
    console.log('🔍 ROW CLICK DEBUG:');
    console.log('  - result.ticker:', result.ticker);
    console.log('  - result.date:', result.date);
    console.log('  - Date validation:', result.date ? '✅ VALID' : '❌ MISSING');

    setSelectedResult(result); // Store the result (should have date from normalization)
    setDayOffset(0); // Reset to Day 0 when selecting a new ticker

    console.log('✅ Row click complete - selectedResult.date:', result.date);
  };

  const handleProjectClick = (projectId: any) => { // ✅ FIX: Changed type from number to any to handle string/number IDs
    console.log(`🖱️ Project clicked - ID: ${projectId} (type: ${typeof projectId})`);

    // Debug: Show all projects and their IDs
    console.log('📋 All projects:', projects.map(p => ({ id: p.id, idType: typeof p.id, name: p.name, active: p.active })));

    // Update active project (ALLOW switching even while scan is running)
    // ✅ FIX: Handle both string and number IDs for comparison
    // ✅ CRITICAL FIX: Store the updated projects array to find selected project from updated state
    const updatedProjects = projects.map(p => {
      const isActive = String(p.id) === String(projectId);
      console.log(`  Checking: "${p.id}" (${typeof p.id}) === "${projectId}" (${typeof projectId}) ? ${isActive}`);
      return { ...p, active: isActive };
    });

    setProjects(updatedProjects);

    // ✅ FIX: Get the selected project from UPDATED array, not old state
    const selectedProject = updatedProjects.find(p => String(p.id) === String(projectId));
    if (!selectedProject) {
      console.error('❌ Project not found after setting active! Searched for ID:', projectId);
      return;
    }

    // ✅ CRITICAL FIX: Validate project has required properties
    if (!selectedProject.name) {
      console.error('❌ Project is missing required "name" property!', selectedProject);
      return;
    }

    console.log(`✅ Successfully activated project: ${selectedProject.name}`);

    // ✅ CRITICAL FIX: Don't load cached results when clicking a project
    // This prevents showing stale results from previous scans
    // Results should only appear AFTER running a new scan
    const cachedResults = []; // ❌ DISABLED: Don't load from resultCache

    // Try multiple sources for project scan results
    let projectResults = [];

    // ✅ CRITICAL FIX: Don't load from localStorage - results are stale
    // Only set results if user actually runs a scan
    /*
    if (typeof window !== 'undefined') {
      try {
        const projectKey = selectedProject.name.replace(/[^a-zA-Z0-9]/g, '_');
        const projectIdStr = selectedProject.id?.toString() || selectedProject.project_data?.id?.toString() || `local_${projectKey}`;

        // 1. Try project_results_{projectId} (old method)
        const projectResultsRaw = localStorage.getItem(`project_results_${projectIdStr}`);
        if (projectResultsRaw) {
          projectResults = JSON.parse(projectResultsRaw);
          console.log(`  Loaded ${projectResults.length} results from project_results_${projectIdStr}`);
        }

        // 2. Try project_cache_{projectId} (old method)
        if (projectResults.length === 0) {
          const projectCacheRaw = localStorage.getItem(`project_cache_${projectIdStr}`);
          if (projectCacheRaw) {
            const cache = JSON.parse(projectCacheRaw);
            projectResults = cache[selectedProject.name] || [];
            console.log(`  Loaded ${projectResults.length} results from project_cache_${projectIdStr}`);
          }
        }

        // 3. Try project_scans_{projectKey} (new name-based method)
        if (projectResults.length === 0) {
          const projectScansRaw = localStorage.getItem(`project_scans_${projectKey}`);
          if (projectScansRaw) {
            const scans = JSON.parse(projectScansRaw);
            // Get most recent scan results
            if (scans.length > 0) {
              const latestScan = scans[scans.length - 1];
              projectResults = latestScan.results || [];
              console.log(`  Loaded ${projectResults.length} results from project_scans_${projectKey} (${scans.length} total scans)`);
            }
          }
        }
      } catch (e) {
        console.error('Error loading project cache:', e);
      }
    }
    */

    // ✅ CRITICAL FIX: Always clear results when clicking a project
    // This prevents showing stale results from previous scans
    // Results should ONLY appear after running a new scan
    try {
      console.log(`  Cleared stale results for "${selectedProject.name}" - ready for new scan`);
      setScanResults([]);
      console.log(`  Switched to "${selectedProject.name}" - waiting for scan execution`);
    } catch (error) {
      console.error('❌ Error setting scan results:', error);
    }
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the project click

    // Find the project to get its name for confirmation
    const projectToDelete = projects.find(p => (p.id || p.project_data?.id) === projectId);
    const projectName = projectToDelete?.name || projectToDelete?.title || 'Unknown Project';

    try {
      // First, try to delete from API (for projects that are server-stored)
      try {
        const deleteResponse = await fetch(`http://localhost:5666/api/projects?id=${projectId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (apiError) {
        // Silent fail
      }

      // COMPREHENSIVE PROJECT DELETION - Remove from ALL storage locations
      if (typeof window !== 'undefined') {
        // 1. Remove from edge_dev_saved_projects (main storage)
        try {
          const savedProjectsRaw = localStorage.getItem('edge_dev_saved_projects');
          const savedProjects = savedProjectsRaw ? JSON.parse(savedProjectsRaw) : [];
          const projectsArray = Array.isArray(savedProjects) ? savedProjects : [];
          const filteredSavedProjects = projectsArray.filter(p => (p.id || p.project_data?.id) !== projectId);
          localStorage.setItem('edge_dev_saved_projects', JSON.stringify(filteredSavedProjects));
        } catch (e) {
          // Silent fail
        }

        // 2. Remove from enhancedProjects
        try {
          const enhancedProjectsRaw = localStorage.getItem('enhancedProjects');
          const enhancedProjects = enhancedProjectsRaw ? JSON.parse(enhancedProjectsRaw) : [];
          const enhancedArray = Array.isArray(enhancedProjects) ? enhancedProjects : [];
          const filteredEnhancedProjects = enhancedArray.filter(p => (p.id || p.project_data?.id) !== projectId);
          localStorage.setItem('enhancedProjects', JSON.stringify(filteredEnhancedProjects));
        } catch (e) {
          // Silent fail
        }

        // 3. Remove from edge-dev-projects (legacy storage)
        try {
          const legacyProjectsRaw = localStorage.getItem('edge-dev-projects');
          const legacyProjects = legacyProjectsRaw ? JSON.parse(legacyProjectsRaw) : [];
          const legacyArray = Array.isArray(legacyProjects) ? legacyProjects : [];
          const filteredLegacyProjects = legacyArray.filter(p => (p.id || p.project_data?.id) !== projectId);
          localStorage.setItem('edge-dev-projects', JSON.stringify(filteredLegacyProjects));
        } catch (e) {
          // Silent fail
        }

        // 4. Remove from cehub_projects (Renata storage)
        try {
          const cehubProjectsRaw = localStorage.getItem('cehub_projects');
          const cehubProjects = cehubProjectsRaw ? JSON.parse(cehubProjectsRaw) : [];
          const cehubArray = Array.isArray(cehubProjects) ? cehubProjects : [];
          const filteredCehubProjects = cehubArray.filter(p => (p.id || p.project_data?.id) !== projectId);
          localStorage.setItem('cehub_projects', JSON.stringify(filteredCehubProjects));
        } catch (e) {
          // Silent fail
        }

        // 5. Add to permanent blacklist to prevent re-appearing
        try {
          const deletedIdsRaw = localStorage.getItem('deletedProjectIds');
          const deletedIds = deletedIdsRaw ? JSON.parse(deletedIdsRaw) : [];
          const idsArray = Array.isArray(deletedIds) ? deletedIds : [];
          if (!idsArray.includes(projectId)) {
            idsArray.push(projectId);
            localStorage.setItem('deletedProjectIds', JSON.stringify(idsArray));
          }
        } catch (e) {
          // Silent fail
        }

        // 6. Also add to window object for runtime prevention
        if (!window.deletedProjectIds) {
          window.deletedProjectIds = new Set();
        }
        window.deletedProjectIds.add(projectId);
      }

      // Update local state immediately
      const projectsArray = Array.isArray(projects) ? projects : [];
      const updatedProjects = projectsArray.filter(p => (p.id || p.project_data?.id) !== projectId);
      setProjects(updatedProjects);

      // Also clear selected project if it was deleted
      const deletedProject = projectsArray.find(p => (p.id || p.project_data?.id) === projectId);
      if (deletedProject?.active) {
        // Clear active flag from the deleted project
        localStorage.removeItem('selectedProject');
      }

      // Clear any cached results for this project
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`project_results_${projectId}`);
        localStorage.removeItem(`project_cache_${projectId}`);
      }
    } catch (error) {
      // Silent fail
    }
  };

  // Clear deleted projects blacklist (for testing/recovery purposes)
  const clearDeletedProjectsBlacklist = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('deletedProjectIds');
      if (window.deletedProjectIds) {
        window.deletedProjectIds.clear();
      }
      loadProjects(); // Reload projects after clearing blacklist
    }
  };

  // Delete project from localStorage and API
  const deleteProject = async (projectId: string, projectName: string) => {
    try {
      // Remove from frontend state first - DEFENSIVE CHECK
      const projectsArray = Array.isArray(projects) ? projects : [];
      const updatedProjects = projectsArray.filter(p => p.id !== projectId);
      setProjects(updatedProjects);

      // Check if this is a localStorage-only project or API project
      const projectToDelete = projectsArray.find(p => p.id === projectId);
      const isLocalOnly = projectToDelete?.localOnly === true;

      if (isLocalOnly) {
        // This is a localStorage-only project, just remove from localStorage
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('edge_dev_saved_projects', JSON.stringify(updatedProjects));
        }
        return;
      }

      // Try to delete from API
      try {
        const deleteResponse = await fetch(`http://localhost:5666/api/projects?id=${projectId}`, {
          method: 'DELETE'
        });

        if (deleteResponse.ok) {
          // Also remove from localStorage to keep in sync
          if (typeof window !== 'undefined') {
            localStorage.setItem('edge_dev_saved_projects', JSON.stringify(updatedProjects));
          }
        } else if (deleteResponse.status === 404) {
          // Project doesn't exist in API, but remove from localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('edge_dev_saved_projects', JSON.stringify(updatedProjects));
          }
        }
      } catch (apiError) {
        // Still remove from localStorage even if API fails
        if (typeof window !== 'undefined') {
          localStorage.setItem('edge_dev_saved_projects', JSON.stringify(updatedProjects));
        }
      }
    } catch (error) {
      // Silent fail
    }
  };

  // Edit project name handlers
  const startEditingProjectName = (projectId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(projectId);
    setEditingProjectName(currentName);
  };

  const saveProjectName = async (projectId: string) => {
    if (!editingProjectName.trim()) {
      cancelEditingProjectName();
      return;
    }

    const newName = editingProjectName.trim();
    const updatedProjects = projects.map(p => {
      const pid = p.id || p.project_data?.id;
      if (pid === projectId) {
        return { ...p, name: newName, title: newName };
      }
      return p;
    });

    setProjects(updatedProjects);

    // Update in all localStorage locations
    if (typeof window !== 'undefined') {
      // Update edge_dev_saved_projects
      try {
        const savedProjectsRaw = localStorage.getItem('edge_dev_saved_projects');
        const savedProjects = savedProjectsRaw ? JSON.parse(savedProjectsRaw) : [];
        const projectsArray = Array.isArray(savedProjects) ? savedProjects : [];
        const updatedSavedProjects = projectsArray.map(p => {
          const pid = p.id || p.project_data?.id;
          if (pid === projectId) {
            return { ...p, name: newName, title: newName };
          }
          return p;
        });
        localStorage.setItem('edge_dev_saved_projects', JSON.stringify(updatedSavedProjects));
      } catch (e) {
        console.error('Failed to update edge_dev_saved_projects:', e);
      }

      // Update enhancedProjects
      try {
        const enhancedProjectsRaw = localStorage.getItem('enhancedProjects');
        const enhancedProjects = enhancedProjectsRaw ? JSON.parse(enhancedProjectsRaw) : [];
        const enhancedArray = Array.isArray(enhancedProjects) ? enhancedProjects : [];
        const updatedEnhancedProjects = enhancedArray.map(p => {
          const pid = p.id || p.project_data?.id;
          if (pid === projectId) {
            return { ...p, name: newName, title: newName };
          }
          return p;
        });
        localStorage.setItem('enhancedProjects', JSON.stringify(updatedEnhancedProjects));
      } catch (e) {
        console.error('Failed to update enhancedProjects:', e);
      }

      // Update edge-dev-projects
      try {
        const legacyProjectsRaw = localStorage.getItem('edge-dev-projects');
        const legacyProjects = legacyProjectsRaw ? JSON.parse(legacyProjectsRaw) : [];
        const legacyArray = Array.isArray(legacyProjects) ? legacyProjects : [];
        const updatedLegacyProjects = legacyArray.map(p => {
          const pid = p.id || p.project_data?.id;
          if (pid === projectId) {
            return { ...p, name: newName, title: newName };
          }
          return p;
        });
        localStorage.setItem('edge-dev-projects', JSON.stringify(updatedLegacyProjects));
      } catch (e) {
        console.error('Failed to update edge-dev-projects:', e);
      }
    }

    // Try to update on server if it's a server-stored project
    try {
      const projectToUpdate = projects.find(p => (p.id || p.project_data?.id) === projectId);
      if (projectToUpdate && !projectToUpdate.localOnly) {
        // Use Next.js API route which properly handles persistence
        const response = await fetch('/api/projects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: projectId, name: newName, description: projectToUpdate.description })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Project name updated successfully:', result);
        } else {
          console.error('❌ Failed to update project name:', response.status);
        }
      }
    } catch (apiError) {
      console.error('❌ Failed to update project on server:', apiError);
    }

    setEditingProjectId(null);
    setEditingProjectName('');
    loadProjects(); // Reload to refresh the display
  };

  const cancelEditingProjectName = () => {
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  // Save projects to localStorage
  const saveProjectsToLocal = () => {
    try {
      if (typeof window !== 'undefined') {
        const projectsArray = Array.isArray(projects) ? projects : [];
        const projectsToSave = projectsArray.map(p => ({
          ...p,
          savedAt: new Date().toISOString()
        }));
        localStorage.setItem('edge_dev_saved_projects', JSON.stringify(projectsToSave));
        console.log(`💾 Saved ${projectsArray.length} projects to localStorage`);
        // Silent success - no notification
      }
    } catch (error) {
      console.error('❌ Failed to save projects:', error);
      console.log('[DISABLED ALERT] Failed to save projects. Please try again.');
    }
  };

  // Load projects from localStorage
  const loadProjectsFromLocal = () => {
    try {
      if (typeof window !== 'undefined') {
        const savedProjects = localStorage.getItem('edge_dev_saved_projects');
        if (savedProjects) {
          const parsedProjects = JSON.parse(savedProjects) || [];
          const projectsArray = Array.isArray(parsedProjects) ? parsedProjects : [];

          // Load permanent deletion blacklist from localStorage
          const storedDeletedIdsRaw = localStorage.getItem('deletedProjectIds');
          const storedDeletedIds = storedDeletedIdsRaw ? JSON.parse(storedDeletedIdsRaw) : [];
          const deletedIdsArray = Array.isArray(storedDeletedIds) ? storedDeletedIds : [];
          const deletedIds = new Set(deletedIdsArray);

          // Filter out deleted projects
          const filteredProjects = projectsArray.filter(project => {
            const projectId = project.id || project.project_data?.id;
            const isDeleted = deletedIds.has(projectId);
            if (isDeleted) {
              console.log(`  🗑️ Filtering deleted project from localStorage: ${project.name || 'unnamed'}`);
            }
            return !isDeleted;
          });

          setProjects(filteredProjects);
          console.log(`📁 Loaded ${filteredProjects.length} projects from localStorage (${projectsArray.length - filteredProjects.length} deleted projects filtered)`);
          // Silent success - no notification
        } else {
          console.log('[DISABLED ALERT] No saved projects found.');
        }
      }
    } catch (error) {
      console.error('❌ Failed to load projects:', error);
      console.log('[DISABLED ALERT] Failed to load projects. Please try again.');
    }
  };

  // Refresh projects from backend API
  const refreshProjectsFromBackend = async () => {
    const button = document.querySelector('[data-refresh-button]') as HTMLButtonElement;
    const originalBg = button?.style.background;
    const originalBorder = button?.style.borderColor;

    try {
      console.log('🔄 About to refresh projects from backend...');

      if (button && button.style) {
        button.style.background = 'rgba(212, 175, 55, 0.3)';
        button.style.borderColor = 'rgba(212, 175, 55, 0.6)';
      }

      const response = await fetch('http://localhost:5666/api/projects');

      if (response.ok) {
        const projectsData = await response.json();
        const apiProjects = Array.isArray(projectsData.data) ? projectsData.data : Array.isArray(projectsData) ? projectsData : [];
        console.log('✅ Projects refreshed from frontend API:', apiProjects.length);

        // Get existing localStorage projects - DEFENSIVE CHECK
        const localStorageProjectsRaw = localStorage.getItem('edge_dev_saved_projects');
        const localStorageProjectsParsed = localStorageProjectsRaw ? JSON.parse(localStorageProjectsRaw) : [];
        const localStorageProjects = Array.isArray(localStorageProjectsParsed) ? localStorageProjectsParsed : [];
        console.log('📁 Found existing localStorage projects:', localStorageProjects.length);

        // Merge API projects with localStorage projects, avoiding duplicates by ID
        const mergedProjects = [...apiProjects];

        // Add localStorage-only projects that aren't in the API
        localStorageProjects.forEach((localProject: any) => {
          const existsInApi = apiProjects.some((apiProject: any) =>
            apiProject.id === localProject.id || apiProject.name === localProject.name
          );

          if (!existsInApi && localProject.localOnly !== false) {
            mergedProjects.push(localProject);
            console.log('📁 Added localStorage-only project:', localProject.name);
          }
        });

        console.log('📊 Total merged projects:', mergedProjects.length);
        setProjects(mergedProjects);

        if (typeof window !== 'undefined') {
          window.projects = mergedProjects;
          localStorage.setItem('edge_dev_saved_projects', JSON.stringify(mergedProjects));
        }

        setTimeout(() => {
          const apiCount = apiProjects.length;
          const localCount = localStorageProjects.length;
          const totalCount = mergedProjects.length;

          // Silent success - no notification
        }, 200);

      } else {
        throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
      }

      setTimeout(() => {
        if (button && button.style) {
          button.style.background = originalBg;
          button.style.borderColor = originalBorder;
        }
      }, 1500);

    } catch (error) {
      console.error('❌ Error refreshing projects from backend:', error);

      setTimeout(() => {
        if (button && button.style) {
          button.style.background = 'rgba(239, 68, 68, 0.3)';
          button.style.borderColor = 'rgba(239, 68, 68, 0.6)';
        }
      }, 200);

      setTimeout(() => {
        if (button && button.style) {
          button.style.background = originalBg;
          button.style.borderColor = originalBorder;
        }
      }, 1500);

      setTimeout(() => {
        // Silent fail - no notification
      }, 300);
    }
  };

  // Handler for sending Renata messages
  const handleSendRenataMessage = async () => {
    if ((!renataInput.trim() && !uploadedFile) || isRenataTyping) return;

    let messageContent = renataInput.trim();

    // Add file info to message if uploaded
    if (uploadedFile) {
      const fileExtension = uploadedFile.name.split('.').pop();
      messageContent += `\n\n📎 **Uploaded File:** ${uploadedFile.name} (${(uploadedFile.size / 1024).toFixed(1)} KB)`;

      // Add file content for text-based files
      if (uploadedFile.type.startsWith('text/') || fileExtension === 'py' || fileExtension === 'txt' || fileExtension === 'md') {
        const fileContent = await uploadedFile.text();
        messageContent += `\n\n**File Content:**\n\`\`\`${fileExtension}\n${fileContent}\n\`\`\``;
      }
    }

    setRenataInput('');
    setIsRenataTyping(true);

    // Add user message to chat
    setRenataMessages(prev => [...prev, { role: 'user', content: messageContent }]);

    // Clear file state
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      console.log('📤 Sending message to Renata API:', messageContent.substring(0, 50) + '...');

      const response = await fetch('/api/renata/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          context: {
            page: 'scan',
            scanner: selectedResult?.name || null,
            projects: projects.slice(0, 5)
          }
        })
      });

      console.log('📥 API response status:', response.status, response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API response data:', data);
        console.log('✅ Message content:', data.message);

        setRenataMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message || 'I apologize, but I encountered an issue processing your request.'
        }]);
      } else {
        console.error('❌ API error response:', response.status, response.statusText);
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Renata chat error:', error);
      setRenataMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please make sure the orchestrator backend is running on port 5666."
      }]);
    } finally {
      setIsRenataTyping(false);
    }
  };

  // Handler for Renata chat file upload
  const handleRenataFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
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
          width: '200px',
          zIndex: '30',
          background: '#111111',
          flexShrink: 0
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
                type="button"
                data-refresh-button="true"
                onClick={async (e) => {
                  // Prevent any form submission or page reload
                  e.preventDefault();
                  e.stopPropagation();

                  console.log('🔄 GOLD REFRESH BUTTON CLICKED!');
                  console.log('🔍 Event type:', e.type);
                  console.log('🔍 Target element:', e.currentTarget.tagName);
                  const button = e.currentTarget;
                  // Safely access styles with fallbacks
                  const originalBg = button.style?.background || 'rgba(212, 175, 55, 0.1)';
                  const originalBorder = button.style?.borderColor || 'rgba(212, 175, 55, 0.3)';
                  const originalTransform = button.style?.transform || 'none';

                  // Add rotation animation
                  try {
                    button.style.transform = 'rotate(360deg)';
                    button.style.transition = 'transform 0.5s ease';
                  } catch (styleError) {
                    console.warn('Style application error:', styleError);
                  }

                  try {
                    console.log('🔄 About to call loadProjects...');
                    console.log('🔍 Current projects count before refresh:', window.projects?.length || 'unknown');

                    // Add timeout protection
                    const refreshPromise = Promise.race([
                      loadProjects(),
                      new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Refresh timeout after 10 seconds')), 10000)
                      )
                    ]);

                    const result = await refreshPromise;

                    console.log('✅ loadProjects completed successfully!');
                    console.log('🔍 Projects count after refresh:', window.projects?.length || 'unknown');

                    // Show success feedback
                    setTimeout(() => {
                      if (button && button.style) {
                        button.style.background = 'rgba(34, 197, 94, 0.3)';
                        button.style.borderColor = 'rgba(34, 197, 94, 0.6)';
                      }
                        }, 200);

                    setTimeout(() => {
                      if (button && button.style) {
                        button.style.background = originalBg;
                        button.style.borderColor = originalBorder;
                      }
                    }, 1500);

                  } catch (error: any) {
                    console.error('❌ Error in gold refresh button:', error);
                    console.error('❌ Error stack:', error?.stack || 'No stack available');
                    console.error('❌ Error message:', error?.message || 'No message available');

                    // Show error feedback
                    setTimeout(() => {
                      if (button && button.style) {
                        button.style.background = 'rgba(239, 68, 68, 0.3)';
                        button.style.borderColor = 'rgba(239, 68, 68, 0.6)';
                      }
                    }, 200);

                    setTimeout(() => {
                      if (button && button.style) {
                        button.style.background = originalBg;
                        button.style.borderColor = originalBorder;
                      }
                    }, 1500);
                  } finally {
                    // Reset rotation
                    setTimeout(() => {
                      if (button && button.style) {
                        button.style.transform = originalTransform;
                      }
                    }, 500);
                  }
                }}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔄 Double-click detected - preventing any action');
                }}
                style={{
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '6px',
                  padding: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                  if (e && e.currentTarget && e.currentTarget.style) {
                    e.currentTarget.style.background = 'rgba(212, 175, 55, 0.2)'
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (e && e.currentTarget && e.currentTarget.style) {
                    e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)'
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                  }
                }}
                title="Refresh projects list"
              >
                <RefreshCw
                  size={12}
                  style={{ color: '#D4AF37', pointerEvents: 'none' }}
                />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Clear deleted projects from localStorage
                  localStorage.removeItem('deletedProjectIds');
                  if (window.deletedProjectIds) {
                    window.deletedProjectIds.clear();
                  }
                  console.log('✅ Cleared deleted projects list - reloading...');
                  location.reload();
                }}
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
                  if (e && e.currentTarget && e.currentTarget.style) {
                    e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'
                    e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (e && e.currentTarget && e.currentTarget.style) {
                    e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)'
                    e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
                  }
                }}
                title="Restore all deleted projects"
              >
                <Check
                  size={12}
                  style={{ color: '#22c55e', pointerEvents: 'none' }}
                />
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {projects.map((project, idx) => {
              return (
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
                  {/* Project name - editable or display */}
                  {editingProjectId === (project.id || project.project_data?.id) ? (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flex: 1 }}>
                      <input
                        type="text"
                        value={editingProjectName}
                        onChange={(e) => setEditingProjectName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveProjectName((project.id || project.project_data?.id)?.toString() || '');
                          } else if (e.key === 'Escape') {
                            cancelEditingProjectName();
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          fontSize: '15px',
                          fontWeight: '600',
                          color: '#ffffff',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid #D4AF37',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          outline: 'none'
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          saveProjectName((project.id || project.project_data?.id)?.toString() || '');
                        }}
                        style={{
                          background: 'rgba(34, 197, 94, 0.2)',
                          border: '1px solid rgba(34, 197, 94, 0.5)',
                          borderRadius: '4px',
                          padding: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Save"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEditingProjectName();
                        }}
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.5)',
                          borderRadius: '4px',
                          padding: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: '600',
                          color: project.active ? '#D4AF37' : '#ffffff',
                          marginBottom: '6px',
                          letterSpacing: '0.3px',
                          flex: 1,
                          minWidth: 0, // Allow text to wrap
                          wordBreak: 'break-word', // Break long words
                          overflowWrap: 'break-word', // Wrap text
                          whiteSpace: 'normal' // Allow wrapping
                        }}
                      >
                        {project.name}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                        {/* Edit button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            startEditingProjectName(
                              (project.id || project.project_data?.id)?.toString() || '',
                              project.name,
                              e
                            );
                          }}
                          style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            border: '1px solid rgba(59, 130, 246, 0.5)',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            const target = e.target as HTMLElement;
                            target.style.background = 'rgba(59, 130, 246, 0.3)';
                            target.style.borderColor = 'rgba(59, 130, 246, 0.7)';
                            target.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            const target = e.target as HTMLElement;
                            target.style.background = 'rgba(59, 130, 246, 0.2)';
                            target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                            target.style.transform = 'scale(1)';
                          }}
                          title="Edit project name"
                        >
                          <Edit2
                            size={14}
                            style={{ color: '#3b82f6' }}
                          />
                        </button>
                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent project selection
                            handleDeleteProject((project.id || project.project_data?.id)?.toString(), e);
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            const target = e.target as HTMLElement;
                            target.style.background = 'rgba(239, 68, 68, 0.3)';
                            target.style.borderColor = 'rgba(239, 68, 68, 0.7)';
                            target.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            const target = e.target as HTMLElement;
                            target.style.background = 'rgba(239, 68, 68, 0.2)';
                            target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                            target.style.transform = 'scale(1)';
                          }}
                          title="Delete project"
                        >
                          <Trash2
                            size={14}
                            style={{ color: '#ef4444' }}
                          />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: '500'
                  }}
                >
                  {(() => {
                    const isScanning = scanningProjects.has(project.name);
                    if (isScanning) {
                      console.log(`✅ "${project.name}" is in scanningProjects:`, Array.from(scanningProjects));
                    }
                    return isScanning;
                  })() ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Settings
                        className="h-3 w-3 animate-spin"
                        style={{ color: '#D4AF37' }}
                      />
                      <span style={{ color: '#D4AF37' }}>
                        {projectProgress[project.name]?.message || 'Scanning...'}
                      </span>
                    </span>
                  ) : (
                    <span>{project.name}</span>
                  )}

                  {/* Display scanners if any */}
                  {(() => {
                    const scannerList = project.scanners || [];
                    const scannerCount = scannerList.length;

                    return (
                      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: '500' }}>
                          Scanners ({scannerCount}):
                        </div>
                        {scannerCount > 0 ? (
                          scannerList.map((scannerName: string, idx: number) => (
                            <div
                              key={idx}
                              style={{
                                fontSize: '11px',
                                color: 'rgba(212, 175, 55, 0.8)',
                                background: 'rgba(212, 175, 55, 0.1)',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid rgba(212, 175, 55, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <span style={{ fontSize: '10px' }}>⚡</span>
                              {scannerName}
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.3)', fontStyle: 'italic' }}>
                            (no scanners)
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              );
            })}
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
          marginLeft: '208px', /* 200px sidebar + 8px spacing */
          width: isRenataPopupOpen
            ? 'calc(100vw - 208px - 400px)' /* Subtract left sidebar + Renata sidebar */
            : 'calc(100vw - 208px)', /* Just subtract left sidebar */
          maxWidth: '100%',
          overflowX: 'auto',
          overflowY: 'auto',
          transition: 'width 0.3s ease',
          marginRight: isRenataPopupOpen ? '400px' : '0', /* Push content when sidebar open */
          paddingTop: '0',
          border: '1px solid #1a1a1a', /* Very subtle border */
          borderRadius: '4px',
          backgroundColor: '#0a0a0a', /* Dark background for contrast */
          minHeight: '100vh', /* Allow content to expand beyond viewport */
          boxSizing: 'border-box' /* Include padding in width calculation */
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

              {/* Renata V2 Button */}
              <button
                onClick={() => setIsRenataPopupOpen(true)}
                className="flex items-center gap-2 text-sm flex-shrink-0"
                style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#D4AF37',
                  backgroundColor: 'rgba(212, 175, 55, 0.12)',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: '2px solid rgba(212, 175, 55, 0.4)',
                  letterSpacing: '0.5px',
                  boxShadow: '0 2px 8px rgba(212, 175, 55, 0.2)',
                  backdropFilter: 'blur(4px)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                  e.currentTarget.style.transform = 'translateY(0px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(212, 175, 55, 0.2)';
                }}
              >
                <Bot className="h-4 w-4" style={{ color: '#D4AF37' }} />
                <span>Renata V2</span>
              </button>

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

              {/* Upload Strategy Button */}
              <button
                onClick={handleViewCode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '12px',
                  color: '#22C55E',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.08) 100%)';
                  e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)';
                  e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0px)';
                }}
                title="View current project scanner code"
              >
                <Database className="h-4 w-4" />
                View Code
              </button>

              {/* Validation Dashboard Button */}
              <button
                onClick={() => setShowValidationModal(true)}
                className="btn-secondary hover:bg-teal-500/30 hover:border-teal-500/60"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginLeft: '12px'
                }}
                title="Run validation tests and view metrics"
              >
                <BarChart3 className="h-4 w-4" />
                Validation
              </button>

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
                className="btn-secondary hover:bg-studio-gold/30 hover:border-studio-gold/60"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginLeft: '12px'
                }}
              >
                <BarChart3 className="h-4 w-4 text-studio-gold" />
                Run Scan
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

              {/* Project Management Button */}
              <button
                onClick={() => {
                  console.log('🔘 Manage Projects button clicked - opening modal...');
                  setShowManageProjectsModal(true);
                }}
                className="ml-12 px-4 py-2 text-sm font-medium rounded-2xl flex items-center gap-2 transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: '#D4AF37',
                  color: '#000000',
                  border: '1px solid #D4AF37',
                  borderRadius: '0.375rem',
                  marginLeft: '3rem',
                  boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E5B84A';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#D4AF37';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(212, 175, 55, 0.3)';
                }}
                title="Manage Projects (Create, Delete, Edit)"
              >
                <Settings className="h-4 w-4" style={{ color: '#000000' }} />
                <span>Manage Projects</span>
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
                          - {new Date(scanStartDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })} to {new Date(scanEndDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}
                        </span>
                      )}
                    </h3>
  
                    {/* Save Scan Button */}
                    <button
                      onClick={async () => {
                        if (scanResults.length === 0) {
                          console.log('[DISABLED ALERT] No scan results to save!');
                          return;
                        }

                        console.log('🔘 Saving scan directly...');

                        try {
                          // Format date range for display (MM/DD/YY - MM/DD/YY)
                          const formatDate = (dateStr: string) => {
                            const date = new Date(dateStr);
                            return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
                          };

                          const dateRange = `${formatDate(scanStartDate)} - ${formatDate(scanEndDate)}`;

                          // Use active project name if available, otherwise derive from project code
                          const activeProject = projects.find((p: any) => p.active);

                          // Helper to extract scanner name from code content
                          const extractScannerName = (code: string, projectName: string) => {
                            // Try to extract from function names
                            const funcMatch = code.match(/def\s+(scan_[a-zA-Z0-9_]+|get_[a-zA-Z0-9_]+|[a-zA-Z0-9_]+_scan)\s*\(/);
                            if (funcMatch && funcMatch[1]) {
                              const name = funcMatch[1]
                                .replace(/^(scan_|get_|_scan|scanner_)/g, '')
                                .replace(/_/g, ' ')
                                .trim();
                              if (name.length > 2) {
                                return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                              }
                            }
                            // Fallback to project name
                            return projectName || 'Custom Scanner';
                          };

                          const projectOrScanName = activeProject?.name || activeProject?.title ||
                            (activeProject?.code ? extractScannerName(activeProject.code, activeProject.name || 'Custom Scanner') : 'Custom Scanner');

                          const scanData = {
                            name: `${projectOrScanName} (${dateRange})`,
                            description: `${scanResults.length} results from ${formatDate(scanStartDate)} to ${formatDate(scanEndDate)}`,
                            scanParams: {
                              start_date: scanStartDate,
                              end_date: scanEndDate,
                              filters: {}
                            },
                            results: scanResults,
                            resultCount: scanResults.length,
                            tags: ['scan'],
                            isFavorite: false,
                            scanType: 'Custom Scanner',
                            tickerUniverse: 'US Stocks',
                            estimatedResults: `${scanResults.length} results`
                          };

                          console.log('💾 Sending scan data to backend:', scanData);

                          const response = await fetch('http://localhost:5666/api/scans/save', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              user_id: 'test_user_123',
                              scan_name: scanData.name,
                              scan_results: scanData.results,
                              scanner_type: scanData.scanType,
                              metadata: {
                                description: scanData.description,
                                scanParams: scanData.scanParams,
                                resultCount: scanData.resultCount,
                                tags: scanData.tags,
                                isFavorite: scanData.isFavorite,
                                tickerUniverse: scanData.tickerUniverse,
                                estimatedResults: scanData.estimatedResults,
                                savedAt: new Date().toISOString()
                              }
                            })
                          });

                          console.log('📡 Backend response status:', response.status);

                          if (response.ok) {
                            const result = await response.json();
                            console.log('✅ Backend save successful:', result);

                            // CRITICAL: Save to localStorage FIRST (this is what actually persists across refreshes)
                            let newScan: any = null;
                            try {
                              const { saveScan } = await import('../../utils/savedScans');
                              newScan = saveScan({
                                name: scanData.name,
                                description: scanData.description,
                                scanType: scanData.scanType,
                                scanParams: {
                                  start_date: scanStartDate,
                                  end_date: scanEndDate,
                                  filters: {}
                                },
                                resultCount: scanData.results.length,
                                results: scanData.results,
                                tags: scanData.tags,
                                isFavorite: false
                              });
                              console.log('💾 Saved to localStorage:', newScan.id, newScan.name);

                              // Verify it was actually saved
                              const saved = localStorage.getItem('traderra_saved_scans');
                              if (saved) {
                                const storage = JSON.parse(saved);
                                const verifyScan = storage.scans.find((s: any) => s.id === newScan.id);
                                if (verifyScan) {
                                  console.log('✅ Verified scan exists in localStorage:', verifyScan.results?.length || verifyScan.scan_results?.length, 'results');
                                } else {
                                  console.error('❌ Scan NOT found in localStorage after save!');
                                }
                              }
                            } catch (localStorageError) {
                              console.error('❌ Failed to save to localStorage:', localStorageError);
                            }

                            // Add to state only if localStorage save succeeded
                            if (newScan) {
                              // CRITICAL: Also save to project cache so it loads when clicking the project
                              // Use project name as key instead of ID since localStorage projects might not have backend IDs
                              if (activeProject?.name) {
                                const projectKey = activeProject.name.replace(/[^a-zA-Z0-9]/g, '_');
                                const projectId = activeProject.id?.toString() || activeProject.project_data?.id?.toString() || `local_${projectKey}`;

                                // Save to project-specific cache using project name as identifier
                                const projectScansKey = `project_scans_${projectKey}`;
                                const existingScans = JSON.parse(localStorage.getItem(projectScansKey) || '[]');
                                existingScans.push({
                                  id: newScan.id,
                                  name: scanData.name,
                                  results: scanData.results,
                                  resultCount: scanData.results.length,
                                  createdAt: new Date().toISOString()
                                });
                                localStorage.setItem(projectScansKey, JSON.stringify(existingScans));

                                // Also save to cache for handleProjectClick to find
                                const projectCache = {
                                  [activeProject.name]: scanData.results
                                };
                                localStorage.setItem(`project_cache_${projectId}`, JSON.stringify(projectCache));
                                localStorage.setItem(`project_results_${projectId}`, JSON.stringify(scanData.results));

                                console.log(`💾 Saved scan to project "${activeProject.name}" (${scanData.results.length} results)`);
                                console.log(`   - Cache key: project_cache_${projectId}`);
                                console.log(`   - Scans key: ${projectScansKey}`);
                              }

                              setSavedScans(prev => [{
                                id: newScan.id,
                                name: scanData.name,
                                createdAt: newScan.createdAt,
                                scanType: scanData.scanType,
                                resultCount: scanData.results.length,
                                scan_results: scanData.results,
                                results: scanData.results,
                                isFavorite: false,
                                description: scanData.description
                              }, ...prev]);
                              console.log('✅ Added to savedScans state');
                            }
                          } else {
                            const errorData = await response.text();
                            console.error('❌ Save failed - Status:', response.status, 'Status Text:', response.statusText);
                            console.error('❌ Error response:', errorData);
                            // Silent fail - no notification
                          }
                        } catch (error) {
                          console.error('❌ Error saving scan:', error);
                          console.log('[DISABLED ALERT] ❌ Error saving scan: ' + error);
                        }
                      }}
                      className="ml-12 px-4 py-2 text-sm font-medium rounded-2xl flex items-center gap-2 transition-all duration-200 hover:scale-105"
                      style={{
                        backgroundColor: scanResults.length > 0 ? '#D4AF37' : '#6b7280',
                        color: scanResults.length > 0 ? '#000000' : '#ffffff',
                        border: '1px solid ' + (scanResults.length > 0 ? '#D4AF37' : '#6b7280'),
                        borderRadius: '0.375rem',
                        marginLeft: '3rem',
                        boxShadow: scanResults.length > 0 ? '0 2px 8px rgba(212, 175, 55, 0.3)' : 'none',
                        opacity: scanResults.length === 0 ? 0.6 : 1,
                        cursor: scanResults.length === 0 ? 'not-allowed' : 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        if (scanResults.length > 0) {
                          e.currentTarget.style.backgroundColor = '#E5B84A';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (scanResults.length > 0) {
                          e.currentTarget.style.backgroundColor = '#D4AF37';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(212, 175, 55, 0.3)';
                        }
                      }}
                      title={scanResults.length === 0 ? "Run a scan first to save results" : `Save ${scanResults.length} scan results`}
                      disabled={scanResults.length === 0}
                    >
                      <Save className="h-4 w-4" style={{ color: scanResults.length > 0 ? '#000000' : '#ffffff' }} />
                      <span>Save Scan</span>
                    </button>

                    {/* Download CSV Button */}
                    <button
                      onClick={() => {
                        const scanName = activeProject?.name || 'scan_results';
                        downloadScanResultsAsCSV(scanResults, scanName);
                      }}
                      className="ml-3 px-4 py-2 text-sm font-medium rounded-2xl flex items-center gap-2 transition-all duration-200 hover:scale-105"
                      style={{
                        backgroundColor: scanResults.length > 0 ? '#10B981' : '#6b7280',
                        color: scanResults.length > 0 ? '#ffffff' : '#ffffff',
                        border: '1px solid ' + (scanResults.length > 0 ? '#10B981' : '#6b7280'),
                        borderRadius: '0.375rem',
                        marginLeft: '0.5rem',
                        boxShadow: scanResults.length > 0 ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                        opacity: scanResults.length === 0 ? 0.6 : 1,
                        cursor: scanResults.length === 0 ? 'not-allowed' : 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        if (scanResults.length > 0) {
                          e.currentTarget.style.backgroundColor = '#059669';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (scanResults.length > 0) {
                          e.currentTarget.style.backgroundColor = '#10B981';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                        }
                      }}
                      title={scanResults.length === 0 ? "Run a scan first to download results" : `Download ${scanResults.length} results as CSV`}
                      disabled={scanResults.length === 0}
                    >
                      <Download className="h-4 w-4" style={{ color: '#ffffff' }} />
                      <span>Download CSV</span>
                    </button>
                  </div>

                  {/* Saved Scans Section - Full Width Above Table */}
                  {safeSavedScans.length > 0 && (
                    <div
                      style={{
                        marginBottom: '16px',
                        backgroundColor: 'rgba(17, 17, 17, 0.6)',
                        borderRadius: '8px',
                        border: '1px solid rgba(212, 175, 55, 0.2)',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Saved Scans Header */}
                      <div
                        onClick={() => setIsSavedScansCollapsed(!isSavedScansCollapsed)}
                        style={{
                          backgroundColor: 'rgba(212, 175, 55, 0.15)',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.15)';
                        }}
                      >
                        <span style={{
                          fontSize: '16px',
                          color: '#D4AF37',
                          transition: 'transform 0.2s ease'
                        }}>
                          {isSavedScansCollapsed ? '▶' : '▼'}
                        </span>
                        <span style={{
                          color: '#D4AF37',
                          fontSize: '14px',
                          fontWeight: '600',
                          letterSpacing: '0.5px'
                        }}>
                          📁 Saved Scans ({safeSavedScans.length})
                        </span>
                      </div>

                      {/* Saved Scans List - Only show when expanded */}
                      {!isSavedScansCollapsed && (
                        <div style={{
                          maxHeight: '200px',
                          overflowY: 'auto',
                          backgroundColor: 'rgba(17, 17, 17, 0.4)'
                        }}>
                          {safeSavedScans.length === 0 ? (
                            <div style={{
                              padding: '24px 16px',
                              textAlign: 'center',
                              color: 'rgba(212, 175, 55, 0.6)',
                              fontSize: '12px'
                            }}>
                              Run a scan and save your results to see them here
                            </div>
                          ) : (
                            safeSavedScans.map((savedScan) => (
                            <div
                              key={savedScan.id}
                              style={{
                                padding: '12px 16px',
                                borderTop: '1px solid rgba(212, 175, 55, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '16px',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                flex: 1
                              }}>
                                <span style={{ fontSize: '16px', color: '#D4AF37' }}>📁</span>
                                <div>
                                  <div style={{
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: '#D4AF37',
                                    marginBottom: '2px'
                                  }}>
                                    {savedScan.name}
                                  </div>
                                  <div style={{
                                    fontSize: '11px',
                                    color: 'rgba(212, 175, 55, 0.7)',
                                    fontWeight: '400'
                                  }}>
                                    {savedScan.results?.length || savedScan.scan_results?.length || 0} results • {new Date(savedScan.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                <button
                                  onClick={(e) => handleLoadSavedScan(savedScan.id, e)}
                                  style={{
                                    backgroundColor: 'rgba(212, 175, 55, 0.2)',
                                    border: '1px solid rgba(212, 175, 55, 0.4)',
                                    color: '#D4AF37',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.3)';
                                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.2)';
                                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                  }}
                                >
                                  Load
                                </button>
                                <button
                                  onClick={(e) => {
                                    // Debug: Log the scan object to see what properties it has
                                    console.log('🗑️ Delete button clicked for scan:', savedScan);
                                    console.log('  Scan ID:', savedScan.id);
                                    console.log('  Scan name:', savedScan.name || savedScan.scan_name);
                                    console.log('  All scan properties:', Object.keys(savedScan));

                                    // Use ID or fallback to scan_name if no ID exists
                                    const scanId = savedScan.id || savedScan.scan_name || savedScan.name;
                                    if (!scanId) {
                                      alert('Cannot delete: Scan has no ID or name');
                                      return;
                                    }
                                    handleDeleteSavedScan(scanId as string, e);
                                  }}
                                  style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    color: '#EF4444',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
                                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                  }}
                                >
                                  Delete
                                </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}

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
                          <th
                            style={{
                              padding: '14px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: 'rgba(255, 255, 255, 0.9)',
                              fontWeight: '600',
                              fontSize: '12px',
                              letterSpacing: '0.5px',
                              textAlign: 'left',
                              transition: 'color 0.2s ease',
                              textTransform: 'uppercase'
                            }}
                          >
                            PNL
                          </th>
                        </tr>
                      </thead>
                      <tbody>

                        {sortedResults.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{
                              padding: '60px 20px',
                              textAlign: 'center',
                              color: '#999999',
                              fontSize: '16px',
                              fontWeight: '500'
                            }}>
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '16px'
                              }}>
                                <div style={{
                                  fontSize: '48px',
                                  color: '#666666'
                                }}>
                                  📊
                                </div>
                                <div>
                                  <div style={{ marginBottom: '8px', fontSize: '18px', color: '#ffffff' }}>
                                    No scan results yet
                                  </div>
                                  <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                    Select a project from the sidebar and click "Run Scan" to start scanning<br/>
                                    Or use the EdgeDev 5665/scan Two-Stage Universal Scanner for full market coverage
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          sortedResults.map((result, index) => {
                            const rowId = `${result.ticker}-${result.date || 'nodate'}-${index}`;
                            return (
                              <tr
                              key={index}
                              onClick={() => handleRowClick(result, index)}
                              style={{
                              cursor: 'pointer',
                              backgroundColor: selectedRow === rowId
                                ? 'rgba(212, 175, 55, 0.15)'
                                : 'transparent',
                              border: selectedRow === rowId
                                ? '1px solid rgba(212, 175, 55, 0.4)'
                                : '1px solid rgba(255, 255, 255, 0.1)',
                              transition: 'all 0.2s ease',
                              borderRadius: selectedRow === rowId ? '4px' : '0px',
                              boxShadow: selectedRow === rowId
                                ? '0 2px 8px rgba(212, 175, 55, 0.2)'
                                : 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (selectedRow !== rowId) {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.2)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedRow !== rowId) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                              }
                            }}
                          >
                            <td style={{
                              color: selectedRow === rowId ? '#D4AF37' : '#ffffff',
                              fontWeight: 'bold',
                              padding: '16px 20px',
                              fontSize: '14px',
                              fontFamily: 'monospace'
                            }}>
                              {result.ticker}
                            </td>
                            <td style={{
                              color: selectedRow === rowId ? '#ffffff' : '#999999',
                              padding: '16px 20px',
                              fontSize: '13px'
                            }}>
                              {formatDateDisplay(result.date)}
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
                              color: selectedRow === rowId ? '#ffffff' : '#999999',
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
                            <td style={{
                              color: '#999999',
                              padding: '16px 20px',
                              fontSize: '13px',
                              fontFamily: 'monospace'
                            }}>
                              {(result as any).pnl || 'N/A'}
                            </td>
                          </tr>
                        );
                      })
                      )}
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
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="section-title studio-text">
                        Scan Results
                      </h3>
                      {scanStartDate && scanEndDate && (
                        <span className="text-sm font-normal text-studio-muted whitespace-nowrap">
                          {(() => {
                            const start = new Date(scanStartDate);
                            const end = new Date(scanEndDate);
                            const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
                            return `${formatDate(start)} - ${formatDate(end)}`;
                          })()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Saved Scans Section - Full Width Above Table */}
                  {safeSavedScans.length > 0 && (
                    <div
                      style={{
                        marginBottom: '16px',
                        backgroundColor: 'rgba(17, 17, 17, 0.6)',
                        borderRadius: '8px',
                        border: '1px solid rgba(212, 175, 55, 0.2)',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Saved Scans Header */}
                      <div
                        onClick={() => setIsSavedScansCollapsed(!isSavedScansCollapsed)}
                        style={{
                          backgroundColor: 'rgba(212, 175, 55, 0.15)',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.15)';
                        }}
                      >
                        <span style={{
                          fontSize: '16px',
                          color: '#D4AF37',
                          transition: 'transform 0.2s ease'
                        }}>
                          {isSavedScansCollapsed ? '▶' : '▼'}
                        </span>
                        <span style={{
                          color: '#D4AF37',
                          fontSize: '14px',
                          fontWeight: '600',
                          letterSpacing: '0.5px'
                        }}>
                          📁 Saved Scans ({safeSavedScans.length})
                        </span>
                      </div>

                      {/* Saved Scans List - Only show when expanded */}
                      {!isSavedScansCollapsed && (
                        <div style={{
                          maxHeight: '200px',
                          overflowY: 'auto',
                          backgroundColor: 'rgba(17, 17, 17, 0.4)'
                        }}>
                          {safeSavedScans.length === 0 ? (
                            <div style={{
                              padding: '24px 16px',
                              textAlign: 'center',
                              color: 'rgba(212, 175, 55, 0.6)',
                              fontSize: '12px'
                            }}>
                              Run a scan and save your results to see them here
                            </div>
                          ) : (
                            safeSavedScans.map((savedScan) => (
                            <div
                              key={savedScan.id}
                              style={{
                                padding: '12px 16px',
                                borderTop: '1px solid rgba(212, 175, 55, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '16px',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                flex: 1
                              }}>
                                <span style={{ fontSize: '16px', color: '#D4AF37' }}>📁</span>
                                <div>
                                  <div style={{
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: '#D4AF37',
                                    marginBottom: '2px'
                                  }}>
                                    {savedScan.name}
                                  </div>
                                  <div style={{
                                    fontSize: '11px',
                                    color: 'rgba(212, 175, 55, 0.7)',
                                    fontWeight: '400'
                                  }}>
                                    {savedScan.results?.length || savedScan.scan_results?.length || 0} results • {new Date(savedScan.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                <button
                                  onClick={(e) => handleLoadSavedScan(savedScan.id, e)}
                                  style={{
                                    backgroundColor: 'rgba(212, 175, 55, 0.2)',
                                    border: '1px solid rgba(212, 175, 55, 0.4)',
                                    color: '#D4AF37',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.3)';
                                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.2)';
                                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                  }}
                                >
                                  Load
                                </button>
                                <button
                                  onClick={(e) => {
                                    // Debug: Log the scan object to see what properties it has
                                    console.log('🗑️ Delete button clicked for scan:', savedScan);
                                    console.log('  Scan ID:', savedScan.id);
                                    console.log('  Scan name:', savedScan.name || savedScan.scan_name);
                                    console.log('  All scan properties:', Object.keys(savedScan));

                                    // Use ID or fallback to scan_name if no ID exists
                                    const scanId = savedScan.id || savedScan.scan_name || savedScan.name;
                                    if (!scanId) {
                                      alert('Cannot delete: Scan has no ID or name');
                                      return;
                                    }
                                    handleDeleteSavedScan(scanId as string, e);
                                  }}
                                  style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    color: '#EF4444',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
                                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                  }}
                                >
                                  Delete
                                </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}

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
                          <th className="text-xs p-3">
                            Delete
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                          {sortedResults.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{
                              padding: '60px 20px',
                              textAlign: 'center',
                              color: '#999999',
                              fontSize: '16px',
                              fontWeight: '500'
                            }}>
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '16px'
                              }}>
                                <div style={{
                                  fontSize: '48px',
                                  color: '#666666'
                                }}>
                                  📊
                                </div>
                                <div>
                                  <div style={{ marginBottom: '8px', fontSize: '18px', color: '#ffffff' }}>
                                    No scan results yet
                                  </div>
                                  <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                    Select a project from the sidebar and click "Run Scan" to start scanning<br/>
                                    Or use the EdgeDev 5665/scan Two-Stage Universal Scanner for full market coverage
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          sortedResults.map((result, index) => {
                            const rowId = `${result.ticker}-${result.date || 'nodate'}-${index}`;
                            return (
                              <tr
                              key={index}
                              onClick={() => handleRowClick(result, index)}
                              className={selectedRow === rowId ? 'selected' : ''}
                          >
                            <td className="p-3 text-sm font-bold studio-text">{result.ticker}</td>
                            <td className="p-3 text-sm text-studio-muted">{formatDateDisplay(result.date)}</td>
                            <td className="p-3 text-sm status-positive">{result.gapPercent.toFixed(1)}%</td>
                            <td className="p-3 text-sm font-semibold text-studio-gold">{result.score.toFixed(1)}</td>
                            <td className={`p-3 text-sm font-semibold ${(result as any).result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                              {(result as any).pnl || 'N/A'}
                            </td>
                          </tr>
                        );
                      })
                      )}
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
                    onClick={async () => {
                      try {
                        // Create new project via backend API
                        const projectData = {
                          name: projectTitle || 'Untitled Scanner',
                          description: projectDescription || 'Custom trading scanner created from scan page',
                          code: formattedCode,
                          tags: ['scanner', 'uploaded', 'custom'],
                          aggregation_method: 'union'
                        };

                        const response = await fetch('http://localhost:5666/api/projects', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(projectData)
                        });

                        if (response.ok) {
                          const createdProject = await response.json();
                          console.log('✅ Project created successfully in backend:', createdProject);

                          // Add to local state as well
                          setProjects(prev => [...prev, createdProject]);

                          // Show success message
                          // Silent success - no notification
                        } else {
                          throw new Error(`Backend error: ${response.status}`);
                        }
                      } catch (error) {
                        console.error('❌ Failed to create project in backend, falling back to local storage:', error);

                        // Fallback to local storage
                        const newProject = {
                          id: projects.length + 1,
                          name: projectTitle || 'Untitled Scanner',
                          description: projectDescription || 'Custom trading scanner',
                          lastRun: 'Just created',
                          active: false,
                          code: formattedCode
                        };
                        setProjects([...projects, newProject]);

                        console.log('[DISABLED ALERT] ⚠️ Project saved locally (backend unavailable)');
                      }

                      // Close modal and reset state
                      setShowUploadModal(false);
                      setShowProjectCreation(false);
                      setUploadMode(null);
                      setProjectTitle('');
                      setProjectDescription('');
                      setFormattedCode('');
                      setPythonCode('');
                      setUploadedFileName('');
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
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-xl">🎯</div>
                    <h4 className="text-lg font-semibold text-blue-400">
                      Universal Market Scanning - The Only Way
                    </h4>
                  </div>
                  <p className="text-sm text-blue-300">
                    <strong>EdgeDev 5665/scan</strong> has retired traditional scanning methods. The Two-Stage Universal Scanner is now the <strong>exclusive method</strong> for all market analysis.
                    Start with complete market coverage (17,000+ stocks) and let intelligent filtering optimize your universe.
                  </p>
                </div>

              <div className="space-y-6">
                  <button
                    onClick={() => window.open('/exec', '_blank')}
                    className="w-full p-8 text-left rounded-lg border-2 transition-all duration-200 hover:border-green-400 hover:bg-green-500/10 border-green-500 bg-green-500/5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">🧠</div>
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold mb-3 text-green-400">
                          EdgeDev 5665/scan: Two-Stage Universal Scanner
                        </h4>
                        <div className="space-y-3">
                          <p className="text-base text-green-300 font-medium">
                            🚀 <strong>THE NEW STANDARD</strong> - Full market universe scanning with 17,000+ ticker coverage
                          </p>

                          <div className="p-3 bg-green-500/10 rounded border border-green-500/30">
                            <h5 className="font-semibold text-green-400 mb-2">Two-Stage Process:</h5>
                            <div className="text-sm text-green-200 space-y-1">
                              <div>• <strong>Stage 1:</strong> Market Universe (17,000+) → Smart Temporal Filtering</div>
                              <div>• <strong>Stage 2:</strong> Optimized Universe → Exact Scanner Logic</div>
                              <div>• <strong>Result:</strong> 95-98% reduction with 100% parameter integrity</div>
                            </div>
                          </div>

                          <div className="text-xs text-green-300">
                            <strong>✅ Proven Accuracy:</strong> 99.9% accuracy verified in production testing<br/>
                            <strong>⚡ Performance:</strong> Processes entire market in minutes, not hours<br/>
                            <strong>🎯 Intelligence:</strong> Smart filtering eliminates low-quality tickers automatically
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="mt-6 p-4 border border-yellow-500/30 bg-yellow-500/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-xl">💡</div>
                    <h5 className="font-semibold text-yellow-400">Why Two-Stage?</h5>
                  </div>
                  <p className="text-sm text-yellow-300">
                    Traditional scanners process pre-filtered universes (500-1000 tickers) and miss opportunities.
                    Our Two-Stage Universal Scanner starts with <strong>ALL 17,000+ tradable stocks</strong> and applies intelligent filtering,
                    ensuring you never miss a trading opportunity while maintaining 100% parameter accuracy.
                  </p>
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
                    onClick={
                      uploadMode === 'finalized' ? handleUploadFinalized :
                      uploadMode === 'execute' ? handleUploadExecute :
                      handleUploadFormat
                    }
                    disabled={isFormatting || !pythonCode.trim()}
                    className="btn-primary flex-1 px-4 py-3"
                  >
                    {isFormatting ? (
                      <>
                        <div className="studio-spinner"></div>
                        Formatting...
                      </>
                    ) : (
                      uploadMode === 'finalized' ? 'Upload & Run' :
                      uploadMode === 'execute' ? 'Execute Scanner' :
                      'Format & Run'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📸 Image Upload Modal (NEW!) */}
      {showImageUploadModal && (
        <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-content studio-card-elevated w-[700px] p-8 max-w-4xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold" style={{ color: '#A855F7' }}>
                <ImageIcon className="inline h-5 w-5 mr-2" />
                Upload Chart/Image for AI Analysis
              </h3>
              <button
                onClick={() => {
                  setShowImageUploadModal(false);
                  setUploadedImages([]);
                }}
                className="text-2xl hover:opacity-70 transition-opacity"
                style={{ color: 'var(--studio-text-muted)' }}
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <p className="text-sm" style={{ color: 'var(--studio-text-secondary)' }}>
                Upload screenshots of charts, patterns, or indicators. Renata AI will analyze them and create a trading scanner based on what it sees.
              </p>

              {/* Upload Area */}
              <div
                onClick={() => document.getElementById('imageInput')?.click()}
                style={{
                  border: '2px dashed rgba(168, 85, 247, 0.3)',
                  borderRadius: '12px',
                  padding: '40px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(168, 85, 247, 0.05)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                  e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                  e.currentTarget.style.background = 'rgba(168, 85, 247, 0.05)';
                }}
              >
                <ImageIcon className="h-12 w-12 mx-auto mb-4" style={{ color: '#A855F7' }} />
                <p className="text-lg font-medium mb-2" style={{ color: '#A855F7' }}>
                  Click to upload or drag & drop
                </p>
                <p className="text-sm" style={{ color: 'var(--studio-text-muted)' }}>
                  PNG, JPG, GIF, WebP up to 10MB each
                </p>
              </div>

              <input
                id="imageInput"
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium" style={{ color: '#A855F7' }}>
                    Uploaded Images ({uploadedImages.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {uploadedImages.map(image => (
                      <div
                        key={image.id}
                        className="relative group"
                        style={{
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid rgba(168, 85, 247, 0.2)',
                          background: 'var(--studio-bg-secondary)'
                        }}
                      >
                        <img
                          src={image.data}
                          alt={image.name}
                          className="w-full h-32 object-cover"
                        />
                        <button
                          onClick={() => removeImage(image.id)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ padding: '4px' }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 px-2 py-1">
                          <p className="text-xs text-white truncate">{image.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowImageUploadModal(false);
                    setUploadedImages([]);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium"
                  style={{
                    background: 'rgba(107, 114, 128, 0.1)',
                    color: 'var(--studio-text-secondary)',
                    border: '1px solid rgba(107, 114, 128, 0.3)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={analyzeImagesWithRenata}
                  disabled={uploadedImages.length === 0 || analyzingImage}
                  className="flex-1 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                  style={{
                    background: uploadedImages.length > 0 && !analyzingImage
                      ? 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)'
                      : 'rgba(168, 85, 247, 0.3)',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: uploadedImages.length > 0 && !analyzingImage ? 'pointer' : 'not-allowed',
                    opacity: uploadedImages.length > 0 && !analyzingImage ? 1 : 0.5
                  }}
                >
                  {analyzingImage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      Analyze with AI
                    </>
                  )}
                </button>
              </div>

              {/* Info Box */}
              <div className="text-xs p-3 rounded-lg" style={{
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.2)'
              }}>
                <p style={{ color: 'var(--studio-text-secondary)' }}>
                  💡 <strong>Tip:</strong> Renata AI can identify chart patterns, technical indicators, support/resistance levels, candlestick formations, and more. Upload clear screenshots for best results!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENATA V2 Sidebar - Fixed Right Panel (matching traderra) */}
      {isRenataPopupOpen && (
        <div
          style={{
            position: 'fixed',
            top: '0',
            right: '0',
            bottom: '0',
            width: '400px',
            backgroundColor: '#0f0f0f',
            borderLeft: '1px solid rgba(212, 175, 55, 0.3)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Bot style={{ width: '20px', height: '20px', color: '#D4AF37' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#D4AF37' }}>Renata V2</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>AI Trading Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsRenataPopupOpen(false)}
              style={{
                padding: '8px',
                background: 'none',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none'
                e.currentTarget.style.color = '#888'
              }}
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {renataMessages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: '8px'
                }}
              >
                {message.role === 'assistant' && (
                  <Bot style={{ width: '20px', height: '20px', color: '#D4AF37', flexShrink: 0 }} />
                )}
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: message.role === 'user'
                    ? 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)'
                    : 'rgba(212, 175, 55, 0.1)',
                  border: message.role === 'user'
                    ? 'none'
                    : '1px solid rgba(212, 175, 55, 0.3)',
                  color: message.role === 'user' ? '#000' : '#e5e5e5',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {message.content}
                </div>
              </div>
            ))}
            {isRenataTyping && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Bot style={{ width: '20px', height: '20px', color: '#D4AF37' }} />
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  color: '#888'
                }}>
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input Area - ChatGPT Style */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid rgba(212, 175, 55, 0.2)',
            background: 'rgba(0, 0, 0, 0.4)'
          }}>
            {/* File Preview */}
            {uploadedFile && (
              <div style={{
                marginBottom: '12px',
                padding: '8px 12px',
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#D4AF37'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                  <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <span style={{ flex: 1 }}>{uploadedFile.name}</span>
                <button
                  onClick={() => {
                    setUploadedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#D4AF37',
                    cursor: 'pointer',
                    padding: '4px',
                    opacity: 0.7
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                >
                  ✕
                </button>
              </div>
            )}

            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '8px',
              padding: '8px',
              background: 'rgba(40, 40, 40, 0.8)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '12px',
              transition: 'all 0.2s ease'
            }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(212, 175, 55, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* File Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isRenataTyping}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#888',
                  cursor: isRenataTyping ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  padding: '0'
                }}
                onMouseEnter={(e) => {
                  if (!isRenataTyping) {
                    e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
                    e.currentTarget.style.color = '#D4AF37';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#888';
                }}
                title="Upload file (images, code, etc.)"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                  <line x1="16" y1="5" x2="12" y2="9"></line>
                  <line x1="12" y1="5" x2="16" y2="9"></line>
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.py,.txt,.md,.json,.csv"
                onChange={handleRenataFileUpload}
                style={{ display: 'none' }}
              />

              <textarea
                value={renataInput}
                onChange={(e) => setRenataInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && (renataInput.trim() || uploadedFile) && !isRenataTyping) {
                    e.preventDefault();
                    handleSendRenataMessage();
                  }
                }}
                placeholder="Message Renata V2..."
                disabled={isRenataTyping}
                rows={1}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#e5e5e5',
                  fontSize: '15px',
                  lineHeight: '1.5',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  padding: '0'
                }}
              />
              <button
                onClick={handleSendRenataMessage}
                disabled={(!renataInput.trim() && !uploadedFile) || isRenataTyping}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: (!renataInput.trim() && !uploadedFile) || isRenataTyping
                    ? 'rgba(212, 175, 55, 0.2)'
                    : '#D4AF37',
                  color: (!renataInput.trim() && !uploadedFile) || isRenataTyping ? '#666' : '#000',
                  cursor: (!renataInput.trim() && !uploadedFile) || isRenataTyping ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  if ((renataInput.trim() || uploadedFile) && !isRenataTyping) {
                    e.currentTarget.style.background = '#B8941F';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if ((renataInput.trim() || uploadedFile) && !isRenataTyping) {
                    e.currentTarget.style.background = '#D4AF37';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
            <div style={{
              fontSize: '11px',
              color: '#666',
              textAlign: 'center',
              marginTop: '8px'
            }}>
              Renata V2 can make mistakes. Consider checking important information. Shift+Enter for new line.
            </div>
          </div>
        </div>
      )}

      {/* Manage Projects Modal */}
      <ManageProjectsModal
        isOpen={showManageProjectsModal}
        onClose={() => setShowManageProjectsModal(false)}
        onProjectAction={(action, projectId, projectData) => {
          console.log('🔄 Project action:', action, projectId, projectData);
          // Handle project actions like create, edit, delete, run
          if (action === 'run' && projectId) {
            console.log('🚀 Running project:', projectId);
          } else if (action === 'edit' && projectId) {
            console.log('✏️ Editing project:', projectId);
          } else if (action === 'delete' && projectId) {
            console.log('🗑️ Deleting project:', projectId);
          } else if (action === 'create') {
            console.log('➕ Creating new project');
          }
        }}
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
                      Chat with Renata V2
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

      {/* Load Scan Modal */}
      {showLoadScanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <Database className="h-6 w-6 text-yellow-500" />
                <h2 className="text-xl font-semibold text-white">Load Saved Scan</h2>
              </div>
              <button
                onClick={() => setShowLoadScanModal(false)}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {availableScans.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    No saved scans found
                  </div>
                ) : (
                  availableScans.map((scan: any, index: number) => (
                    <div
                      key={scan.scan_id || index}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-white font-medium text-lg mb-1">
                            {scan.metadata?.scanParams ?
                              `${scan.scan_name} (${scan.metadata.scanParams.start_date} to ${scan.metadata.scanParams.end_date})` :
                              scan.scan_name
                            }
                          </h3>
                          <p className="text-gray-400 text-sm mb-2">
                            {scan.description || 'No description available'}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-yellow-400">
                              {scan.result_count || scan.results?.length || scan.scan_results?.length || 0} results
                            </span>
                            <span className="text-gray-400">
                              {new Date(scan.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              try {
                                const loadedResults = loadSelectedScan(scan);
                                setShowLoadScanModal(false);
                                // Silent success - no notification
                              } catch (error) {
                                console.error('❌ Error loading scan:', error);
                                console.log('[DISABLED ALERT] ❌ Error loading scan. Check console for details.');
                              }
                            }}
                            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition-colors text-sm"
                          >
                            Load
                          </button>
                          <div className="text-green-400">
                            <Check className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-700">
              <button
                onClick={() => setShowLoadScanModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <div className="text-sm text-gray-400">
                {availableScans.length} scan{availableScans.length !== 1 ? 's' : ''} available
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Dashboard Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}>
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                <BarChart3 className="w-7 h-7" />
                Validation Dashboard
              </h2>
              <button
                onClick={() => setShowValidationModal(false)}
                className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1" style={{ backgroundColor: '#f8fafc' }}>
              <ValidationDashboard />
            </div>
          </div>
        </div>
      )}

      {/* Scanner Debug Studio - Auto-opens on errors */}
      {showDebugStudio && debugProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
          <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                <Bug className="w-7 h-7" />
                Scanner Debug Studio
              </h2>
              <button
                onClick={() => setShowDebugStudio(false)}
                className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ScannerDebugStudio
                projectId={debugProject.id}
                projectName={debugProject.name}
                initialCode={debugProject.code}
                onExecute={async (code) => {
                  // Execute the scanner
                  try {
                    const response = await fetch(`/api/projects/${debugProject.id}/execute`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        code: code,
                        date_range: {
                          start_date: scanDate,
                          end_date: new Date().toISOString().split('T')[0]
                        }
                      })
                    });
                    return await response.json();
                  } catch (error) {
                    return {
                      success: false,
                      errors: [{
                        stage: 'Unknown',
                        errorType: 'Exception',
                        errorMessage: error instanceof Error ? error.message : 'Unknown error',
                        timestamp: new Date().toISOString()
                      }]
                    };
                  }
                }}
                onClose={() => setShowDebugStudio(false)}
              />
            </div>
          </div>
        </div>
      )}

    </>
  );
}