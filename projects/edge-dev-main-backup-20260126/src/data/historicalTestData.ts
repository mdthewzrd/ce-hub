'use client'

/**
 * Historical Test Scan Data for Chart Validation
 * Tests SPY, QQQ, NVDA across July, October, September 2025
 * Includes weekends and holidays for proper market calendar validation
 */

export interface HistoricalScanResult {
  ticker: string;
  date: string; // YYYY-MM-DD format
  gapPercent: number;
  volume: number;
  score: number;
  trigger: string;
  price?: number;
  dayOffset?: number; // 0 = LC day, 1 = Day +1, 2 = Day +2
}

// 2025 Historical Test Data with strategic date selection
export const historicalTestData2025: HistoricalScanResult[] = [
  // === JULY 2025: Includes Independence Day holiday (July 4th) ===
  {
    ticker: 'SPY',
    date: '2025-07-02', // Day before Independence Day
    gapPercent: 3.2,
    volume: 125000000,
    score: 85,
    trigger: 'LC_D2_EXT',
    price: 552.50,
    dayOffset: 0
  },
  {
    ticker: 'SPY',
    date: '2025-07-03', // Day before Independence Day (early close)
    gapPercent: 2.1,
    volume: 98000000,
    score: 78,
    trigger: 'LC_D2_EXT',
    price: 565.80,
    dayOffset: 1
  },
  {
    ticker: 'SPY',
    date: '2025-07-08', // First trading day after July 4th holiday (Monday)
    gapPercent: 1.8,
    volume: 145000000,
    score: 82,
    trigger: 'LC_D2_EXT',
    price: 576.30,
    dayOffset: 2
  },

  {
    ticker: 'QQQ',
    date: '2025-07-15', // Mid-July, normal trading week
    gapPercent: 4.5,
    volume: 67000000,
    score: 91,
    trigger: 'LC_D2_EXT',
    price: 485.20,
    dayOffset: 0
  },
  {
    ticker: 'QQQ',
    date: '2025-07-16', // Day +1
    gapPercent: 2.3,
    volume: 62000000,
    score: 88,
    trigger: 'LC_D2_EXT',
    price: 496.80,
    dayOffset: 1
  },
  {
    ticker: 'QQQ',
    date: '2025-07-17', // Day +2
    gapPercent: 1.9,
    volume: 71000000,
    score: 84,
    trigger: 'LC_D2_EXT',
    price: 506.70,
    dayOffset: 2
  },

  {
    ticker: 'NVDA',
    date: '2025-07-24', // Thursday before weekend
    gapPercent: 6.8,
    volume: 185000000,
    score: 94,
    trigger: 'LC_D2_EXT',
    price: 118.50,
    dayOffset: 0
  },
  {
    ticker: 'NVDA',
    date: '2025-07-25', // Friday
    gapPercent: 3.2,
    volume: 156000000,
    score: 89,
    trigger: 'LC_D2_EXT',
    price: 122.10,
    dayOffset: 1
  },
  {
    ticker: 'NVDA',
    date: '2025-07-29', // Monday (after weekend)
    gapPercent: 2.1,
    volume: 178000000,
    score: 86,
    trigger: 'LC_D2_EXT',
    price: 124.70,
    dayOffset: 2
  },

  // === SEPTEMBER 2025: Includes Labor Day (Sept 1st) ===
  {
    ticker: 'SPY',
    date: '2025-08-29', // Friday before Labor Day weekend
    gapPercent: 2.8,
    volume: 112000000,
    score: 83,
    trigger: 'LC_D2_EXT',
    price: 578.90,
    dayOffset: 0
  },
  {
    ticker: 'SPY',
    date: '2025-09-02', // First trading day after Labor Day
    gapPercent: 2.4,
    volume: 135000000,
    score: 87,
    trigger: 'LC_D2_EXT',
    price: 592.30,
    dayOffset: 1
  },
  {
    ticker: 'SPY',
    date: '2025-09-03', // Day +2
    gapPercent: 1.7,
    volume: 124000000,
    score: 81,
    trigger: 'LC_D2_EXT',
    price: 601.10,
    dayOffset: 2
  },

  {
    ticker: 'NVDA',
    date: '2025-09-10', // Mid-September
    gapPercent: 5.2,
    volume: 167000000,
    score: 92,
    trigger: 'LC_D2_EXT',
    price: 127.80,
    dayOffset: 0
  },
  {
    ticker: 'NVDA',
    date: '2025-09-11', // Day +1
    gapPercent: 3.8,
    volume: 145000000,
    score: 88,
    trigger: 'LC_D2_EXT',
    price: 132.40,
    dayOffset: 1
  },
  {
    ticker: 'NVDA',
    date: '2025-09-12', // Day +2
    gapPercent: 2.6,
    volume: 171000000,
    score: 85,
    trigger: 'LC_D2_EXT',
    price: 135.90,
    dayOffset: 2
  },

  // === OCTOBER 2025: Normal month with various weekends ===
  {
    ticker: 'QQQ',
    date: '2025-10-02', // Thursday
    gapPercent: 3.9,
    volume: 71000000,
    score: 89,
    trigger: 'LC_D2_EXT',
    price: 512.60,
    dayOffset: 0
  },
  {
    ticker: 'QQQ',
    date: '2025-10-03', // Friday
    gapPercent: 2.7,
    volume: 68000000,
    score: 86,
    trigger: 'LC_D2_EXT',
    price: 525.80,
    dayOffset: 1
  },
  {
    ticker: 'QQQ',
    date: '2025-10-07', // Monday (after weekend)
    gapPercent: 2.2,
    volume: 73500000,
    score: 84,
    trigger: 'LC_D2_EXT',
    price: 537.90,
    dayOffset: 2
  },

  {
    ticker: 'SPY',
    date: '2025-10-16', // Thursday
    gapPercent: 4.1,
    volume: 138000000,
    score: 90,
    trigger: 'LC_D2_EXT',
    price: 612.40,
    dayOffset: 0
  },
  {
    ticker: 'SPY',
    date: '2025-10-17', // Friday
    gapPercent: 2.9,
    volume: 129000000,
    score: 87,
    trigger: 'LC_D2_EXT',
    price: 628.70,
    dayOffset: 1
  },
  {
    ticker: 'SPY',
    date: '2025-10-21', // Monday (after weekend)
    gapPercent: 2.3,
    volume: 142000000,
    score: 85,
    trigger: 'LC_D2_EXT',
    price: 643.80,
    dayOffset: 2
  },

  {
    ticker: 'NVDA',
    date: '2025-10-29', // Wednesday before month-end
    gapPercent: 7.2,
    volume: 192000000,
    score: 95,
    trigger: 'LC_D2_EXT',
    price: 142.60,
    dayOffset: 0
  },
  {
    ticker: 'NVDA',
    date: '2025-10-30', // Thursday
    gapPercent: 4.8,
    volume: 178000000,
    score: 91,
    trigger: 'LC_D2_EXT',
    price: 149.20,
    dayOffset: 1
  },
  {
    ticker: 'NVDA',
    date: '2025-10-31', // Friday (Halloween)
    gapPercent: 3.5,
    volume: 165000000,
    score: 88,
    trigger: 'LC_D2_EXT',
    price: 154.30,
    dayOffset: 2
  }
];

// Helper functions for testing
export function getHistoricalScansByTicker(ticker: string): HistoricalScanResult[] {
  return historicalTestData2025.filter(scan => scan.ticker === ticker);
}

export function getHistoricalScansByMonth(month: number): HistoricalScanResult[] {
  return historicalTestData2025.filter(scan => {
    const scanMonth = new Date(scan.date).getMonth() + 1;
    return scanMonth === month;
  });
}

export function getHistoricalScansByDayOffset(dayOffset: number): HistoricalScanResult[] {
  return historicalTestData2025.filter(scan => scan.dayOffset === dayOffset);
}

// Test scenarios for validation
export const testScenarios = {
  julyHolidayWeekend: {
    description: "July 4th Independence Day + weekend navigation",
    dates: ['2025-07-02', '2025-07-03', '2025-07-07'],
    expectedBehavior: "Skip July 4th holiday, show proper trading days only"
  },

  septemberLaborDay: {
    description: "Labor Day weekend navigation",
    dates: ['2025-08-29', '2025-09-02', '2025-09-03'],
    expectedBehavior: "Skip Labor Day (Sept 1), navigate from Friday to Tuesday"
  },

  normalWeekendNavigation: {
    description: "Regular weekend skipping",
    dates: ['2025-10-02', '2025-10-03', '2025-10-06'],
    expectedBehavior: "Skip Saturday/Sunday, show Friday then Monday"
  },

  multiTickerValidation: {
    description: "Multiple tickers with different volatilities",
    tickers: ['SPY', 'QQQ', 'NVDA'],
    expectedBehavior: "Proper legend display for each ticker's Day 0/Day+1/Day+2"
  }
};

export default historicalTestData2025;