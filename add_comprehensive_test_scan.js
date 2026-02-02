// Create comprehensive test scan with SPY, QQQ, NVDA data
console.log('📊 Adding comprehensive test scan with SPY, QQQ, NVDA data...');

const STORAGE_KEY = 'traderra_saved_scans';

// Realistic market data for comprehensive test scan
const comprehensiveResults = [
  // SPY - S&P 500 ETF Results
  {
    ticker: 'SPY',
    date: '2024-12-09',
    price: 605.18,
    volume: 72643000,
    pattern: 'LC D2 Extended Breakout',
    confidence: 87,
    gap: 2.1,
    rsi: 68.4,
    moving_average: 592.45,
    volume_surge: 1.8,
    market_cap: '45.2T',
    sector: 'Large Cap Blend'
  },
  {
    ticker: 'SPY',
    date: '2024-12-06',
    price: 598.72,
    volume: 68321000,
    pattern: 'LC Frontside Continuation',
    confidence: 82,
    gap: 1.4,
    rsi: 64.1,
    moving_average: 588.92,
    volume_surge: 1.5,
    market_cap: '44.7T',
    sector: 'Large Cap Blend'
  },
  {
    ticker: 'SPY',
    date: '2024-12-04',
    price: 593.25,
    volume: 72456000,
    pattern: 'Volume Spike Confirmation',
    confidence: 79,
    gap: 1.8,
    rsi: 61.7,
    moving_average: 585.33,
    volume_surge: 2.2,
    market_cap: '44.3T',
    sector: 'Large Cap Blend'
  },
  {
    ticker: 'SPY',
    date: '2024-12-02',
    price: 587.91,
    volume: 69128000,
    pattern: 'LC D3 Support Rejection',
    confidence: 75,
    gap: 1.2,
    rsi: 58.9,
    moving_average: 581.67,
    volume_surge: 1.3,
    market_cap: '43.9T',
    sector: 'Large Cap Blend'
  },

  // QQQ - Invesco QQQ Trust Results
  {
    ticker: 'QQQ',
    date: '2024-12-09',
    price: 518.42,
    volume: 41280000,
    pattern: 'LC D2 Extended Breakout',
    confidence: 91,
    gap: 2.8,
    rsi: 72.1,
    moving_average: 503.88,
    volume_surge: 2.1,
    market_cap: '2.1T',
    sector: 'Technology'
  },
  {
    ticker: 'QQQ',
    date: '2024-12-06',
    price: 512.33,
    volume: 38765000,
    pattern: 'Parabolic Move Acceleration',
    confidence: 88,
    gap: 2.3,
    rsi: 69.4,
    moving_average: 498.21,
    volume_surge: 1.9,
    market_cap: '2.08T',
    sector: 'Technology'
  },
  {
    ticker: 'QQQ',
    date: '2024-12-04',
    price: 506.18,
    volume: 35491000,
    pattern: 'Tech Leadership Breakout',
    confidence: 85,
    gap: 1.9,
    rsi: 66.2,
    moving_average: 492.76,
    volume_surge: 1.7,
    market_cap: '2.05T',
    sector: 'Technology'
  },
  {
    ticker: 'QQQ',
    date: '2024-12-02',
    price: 498.77,
    volume: 36843000,
    pattern: 'Gap and Go Continuation',
    confidence: 81,
    gap: 2.1,
    rsi: 63.8,
    moving_average: 487.33,
    volume_surge: 1.8,
    market_cap: '2.02T',
    sector: 'Technology'
  },
  {
    ticker: 'QQQ',
    date: '2024-11-27',
    price: 491.56,
    volume: 33128000,
    pattern: 'LC Backside Bounce',
    confidence: 77,
    gap: 1.6,
    rsi: 60.3,
    moving_average: 481.92,
    volume_surge: 1.4,
    market_cap: '1.99T',
    sector: 'Technology'
  },

  // NVDA - NVIDIA Results
  {
    ticker: 'NVDA',
    date: '2024-12-09',
    price: 146.18,
    volume: 428500000,
    pattern: 'AI Leader Momentum Surge',
    confidence: 94,
    gap: 3.7,
    rsi: 76.8,
    moving_average: 139.42,
    volume_surge: 2.8,
    market_cap: '3.59T',
    sector: 'Semiconductors'
  },
  {
    ticker: 'NVDA',
    date: '2024-12-06',
    price: 144.27,
    volume: 398600000,
    pattern: 'Chip Sector Leadership',
    confidence: 91,
    gap: 2.9,
    rsi: 73.5,
    moving_average: 136.88,
    volume_surge: 2.4,
    market_cap: '3.54T',
    sector: 'Semiconductors'
  },
  {
    ticker: 'NVDA',
    date: '2024-12-04',
    price: 141.33,
    volume: 367200000,
    pattern: 'Hype Train Continuation',
    confidence: 88,
    gap: 2.4,
    rsi: 70.9,
    moving_average: 133.91,
    volume_surge: 2.1,
    market_cap: '3.47T',
    sector: 'Semiconductors'
  },
  {
    ticker: 'NVDA',
    date: '2024-12-02',
    price: 138.92,
    volume: 341500000,
    pattern: 'Mega Cap Breakout',
    confidence: 86,
    gap: 2.1,
    rsi: 68.7,
    moving_average: 131.76,
    volume_surge: 1.9,
    market_cap: '3.41T',
    sector: 'Semiconductors'
  },
  {
    ticker: 'NVDA',
    date: '2024-11-27',
    price: 134.67,
    volume: 312800000,
    pattern: 'AI Infrastructure Play',
    confidence: 83,
    gap: 1.8,
    rsi: 65.4,
    moving_average: 128.93,
    volume_surge: 1.6,
    market_cap: '3.31T',
    sector: 'Semiconductors'
  },
  {
    ticker: 'NVDA',
    date: '2024-11-25',
    price: 132.18,
    volume: 298600000,
    pattern: 'Black Friday Rally',
    confidence: 80,
    gap: 1.5,
    rsi: 62.9,
    moving_average: 126.41,
    volume_surge: 1.5,
    market_cap: '3.25T',
    sector: 'Semiconductors'
  }
];

// Create comprehensive scan object
const comprehensiveScan = {
  id: `comprehensive_scan_${Date.now()}`,
  name: '🚀 Comprehensive Market Scan - SPY/QQQ/NVDA Momentum Analysis',
  createdAt: new Date().toISOString(),
  scanParams: {
    start_date: '2024-11-20',
    end_date: '2024-12-11',
    universe: 'US Large Cap ETFs + Tech Leaders',
    min_market_cap: '100B+',
    min_volume: '10M+ shares',
    patterns: ['LC_D2_Extended', 'LC_Frontside', 'Volume_Spike', 'Parabolic_Move'],
    confidence_threshold: 75,
    gap_threshold: 1.2
  },
  resultCount: comprehensiveResults.length,
  scanType: 'Comprehensive Multi-Ticker Momentum Scanner',
  description: 'Comprehensive scan analyzing SPY, QQQ, and NVDA for LC patterns, volume breakouts, and momentum signals. Focuses on large-cap tech and market leaders with high confidence setups.',
  scan_results: comprehensiveResults,
  results: comprehensiveResults,
  metadata: {
    scanner_type: 'Advanced LC D2 Extended + Volume Analysis',
    timeframe: 'Daily',
    generated_at: new Date().toISOString(),
    total_scanned: 5000,
    analysis_version: 'v2.1',
    market_conditions: 'Bullish Momentum with Tech Leadership',
    avg_confidence: (comprehensiveResults.reduce((sum, r) => sum + r.confidence, 0) / comprehensiveResults.length).toFixed(1),
    highest_confidence: Math.max(...comprehensiveResults.map(r => r.confidence)),
    tickers_found: [...new Set(comprehensiveResults.map(r => r.ticker))].join(', ')
  },
  isFavorite: true,
  tags: ['momentum', 'tech-leaders', 'large-cap', 'high-confidence', 'comprehensive'],
  stats: {
    by_ticker: {
      'SPY': comprehensiveResults.filter(r => r.ticker === 'SPY').length,
      'QQQ': comprehensiveResults.filter(r => r.ticker === 'QQQ').length,
      'NVDA': comprehensiveResults.filter(r => r.ticker === 'NVDA').length
    },
    by_pattern: {
      'LC D2 Extended Breakout': comprehensiveResults.filter(r => r.pattern.includes('D2 Extended')).length,
      'Volume Spike': comprehensiveResults.filter(r => r.pattern.includes('Volume')).length,
      'Parabolic Move': comprehensiveResults.filter(r => r.pattern.includes('Parabolic')).length,
      'Gap and Go': comprehensiveResults.filter(r => r.pattern.includes('Gap')).length,
      'LC Frontside': comprehensiveResults.filter(r => r.pattern.includes('Frontside')).length
    },
    performance_metrics: {
      avg_gap: (comprehensiveResults.reduce((sum, r) => sum + (r.gap || 0), 0) / comprehensiveResults.length).toFixed(2),
      avg_volume_surge: (comprehensiveResults.reduce((sum, r) => sum + (r.volume_surge || 0), 0) / comprehensiveResults.length).toFixed(2),
      high_confidence_count: comprehensiveResults.filter(r => r.confidence >= 85).length
    }
  }
};

// Get existing storage
const existing = localStorage.getItem(STORAGE_KEY);
const storage = existing ? JSON.parse(existing) : {
  version: '1.0',
  scans: [],
  settings: { maxSavedScans: 50, autoCleanupDays: 90 }
};

// Add comprehensive scan
storage.scans.unshift(comprehensiveScan); // Add to beginning for visibility

// Save to localStorage
localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

console.log('🎉 Comprehensive scan created successfully!');
console.log(`📊 Scan Name: ${comprehensiveScan.name}`);
console.log(`🔢 Total Results: ${comprehensiveResults.length}`);
console.log(`📈 SPY Results: ${comprehensiveResults.filter(r => r.ticker === 'SPY').length}`);
console.log(`📈 QQQ Results: ${comprehensiveResults.filter(r => r.ticker === 'QQQ').length}`);
console.log(`📈 NVDA Results: ${comprehensiveResults.filter(r => r.ticker === 'NVDA').length}`);
console.log(`⭐ Average Confidence: ${comprehensiveScan.metadata.avg_confidence}%`);
console.log(`🎯 High Confidence (85+): ${comprehensiveScan.stats.performance_metrics.high_confidence_count} setups`);
console.log('🌐 Now visit http://localhost:5665/scan to see the comprehensive scan!');