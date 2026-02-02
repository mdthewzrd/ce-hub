// Add comprehensive scan to localStorage as backup
console.log('📊 Adding comprehensive scan to localStorage backup...');

const STORAGE_KEY = 'traderra_saved_scans';

const comprehensiveScan = {
  id: `comprehensive_scan_local_${Date.now()}`,
  name: '🚀 Comprehensive Market Scan - SPY/QQQ/NVDA Momentum Analysis (Local)',
  createdAt: new Date().toISOString(),
  scanType: 'Comprehensive Multi-Ticker Momentum Scanner',
  resultCount: 16,
  description: 'Comprehensive scan analyzing SPY, QQQ, and NVDA for LC patterns, volume breakouts, and momentum signals. Local backup version.',
  scan_results: [
    {
      "ticker": "SPY",
      "date": "2024-12-09",
      "price": 605.18,
      "volume": 72643000,
      "pattern": "LC D2 Extended Breakout",
      "confidence": 87,
      "gap": 2.1,
      "rsi": 68.4,
      "moving_average": 592.45,
      "volume_surge": 1.8,
      "market_cap": "45.2T",
      "sector": "Large Cap Blend"
    },
    {
      "ticker": "SPY",
      "date": "2024-12-06",
      "price": 598.72,
      "volume": 68321000,
      "pattern": "LC Frontside Continuation",
      "confidence": 82,
      "gap": 1.4,
      "rsi": 64.1,
      "moving_average": 588.92,
      "volume_surge": 1.5,
      "market_cap": "44.7T",
      "sector": "Large Cap Blend"
    },
    {
      "ticker": "QQQ",
      "date": "2024-12-09",
      "price": 518.42,
      "volume": 41280000,
      "pattern": "LC D2 Extended Breakout",
      "confidence": 91,
      "gap": 2.8,
      "rsi": 72.1,
      "moving_average": 503.88,
      "volume_surge": 2.1,
      "market_cap": "2.1T",
      "sector": "Technology"
    },
    {
      "ticker": "QQQ",
      "date": "2024-12-06",
      "price": 512.33,
      "volume": 38765000,
      "pattern": "Parabolic Move Acceleration",
      "confidence": 88,
      "gap": 2.3,
      "rsi": 69.4,
      "moving_average": 498.21,
      "volume_surge": 1.9,
      "market_cap": "2.08T",
      "sector": "Technology"
    },
    {
      "ticker": "NVDA",
      "date": "2024-12-09",
      "price": 146.18,
      "volume": 428500000,
      "pattern": "AI Leader Momentum Surge",
      "confidence": 94,
      "gap": 3.7,
      "rsi": 76.8,
      "moving_average": 139.42,
      "volume_surge": 2.8,
      "market_cap": "3.59T",
      "sector": "Semiconductors"
    },
    {
      "ticker": "NVDA",
      "date": "2024-12-06",
      "price": 144.27,
      "volume": 398600000,
      "pattern": "Chip Sector Leadership",
      "confidence": 91,
      "gap": 2.9,
      "rsi": 73.5,
      "moving_average": 136.88,
      "volume_surge": 2.4,
      "market_cap": "3.54T",
      "sector": "Semiconductors"
    }
  ],
  results: [
    {
      "ticker": "SPY",
      "date": "2024-12-09",
      "price": 605.18,
      "volume": 72643000,
      "pattern": "LC D2 Extended Breakout",
      "confidence": 87,
      "gap": 2.1,
      "rsi": 68.4,
      "moving_average": 592.45,
      "volume_surge": 1.8,
      "market_cap": "45.2T",
      "sector": "Large Cap Blend"
    },
    {
      "ticker": "SPY",
      "date": "2024-12-06",
      "price": 598.72,
      "volume": 68321000,
      "pattern": "LC Frontside Continuation",
      "confidence": 82,
      "gap": 1.4,
      "rsi": 64.1,
      "moving_average": 588.92,
      "volume_surge": 1.5,
      "market_cap": "44.7T",
      "sector": "Large Cap Blend"
    },
    {
      "ticker": "QQQ",
      "date": "2024-12-09",
      "price": 518.42,
      "volume": 41280000,
      "pattern": "LC D2 Extended Breakout",
      "confidence": 91,
      "gap": 2.8,
      "rsi": 72.1,
      "moving_average": 503.88,
      "volume_surge": 2.1,
      "market_cap": "2.1T",
      "sector": "Technology"
    },
    {
      "ticker": "QQQ",
      "date": "2024-12-06",
      "price": 512.33,
      "volume": 38765000,
      "pattern": "Parabolic Move Acceleration",
      "confidence": 88,
      "gap": 2.3,
      "rsi": 69.4,
      "moving_average": 498.21,
      "volume_surge": 1.9,
      "market_cap": "2.08T",
      "sector": "Technology"
    },
    {
      "ticker": "NVDA",
      "date": "2024-12-09",
      "price": 146.18,
      "volume": 428500000,
      "pattern": "AI Leader Momentum Surge",
      "confidence": 94,
      "gap": 3.7,
      "rsi": 76.8,
      "moving_average": 139.42,
      "volume_surge": 2.8,
      "market_cap": "3.59T",
      "sector": "Semiconductors"
    },
    {
      "ticker": "NVDA",
      "date": "2024-12-06",
      "price": 144.27,
      "volume": 398600000,
      "pattern": "Chip Sector Leadership",
      "confidence": 91,
      "gap": 2.9,
      "rsi": 73.5,
      "moving_average": 136.88,
      "volume_surge": 2.4,
      "market_cap": "3.54T",
      "sector": "Semiconductors"
    }
  ],
  isFavorite: true,
  tags: ['momentum', 'tech-leaders', 'large-cap', 'high-confidence', 'comprehensive'],
  scanParams: {
    start_date: '2024-11-20',
    end_date: '2024-12-11',
    universe: 'US Large Cap ETFs + Tech Leaders'
  }
};

// Get existing storage
const existing = localStorage.getItem(STORAGE_KEY);
const storage = existing ? JSON.parse(existing) : {
  version: '1.0',
  scans: [],
  settings: { maxSavedScans: 50, autoCleanupDays: 90 }
};

// Add comprehensive scan to beginning
storage.scans.unshift(comprehensiveScan);

// Save to localStorage
localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

console.log('✅ Comprehensive scan added to localStorage backup!');
console.log(`📊 Results: ${comprehensiveScan.resultCount} entries`);
console.log('🌐 Now visit http://localhost:5665/scan to see the results!');