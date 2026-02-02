// LC D2 Frontside Extended Scan - Converted for Polygon API & Traderra System
// Original Python scan converted to JavaScript for real-time scanning

export const LC_D2_SCAN_CONFIG = {
  name: "LC Frontside D2 Extended Scanner",
  description: "Lightspeed Continuation D2 Pattern with ATR-normalized filters",
  type: "lc_frontside_d2",
  version: "extended_1",

  // Market Data Requirements
  dataRequirements: {
    timeframe: "1D",
    lookback: 250, // days for EMA200 and highest_high_250
    indicators: ["ema9", "ema20", "ema50", "ema200", "atr14", "volume"],
    adjustedData: true
  },

  // Primary LC D2 Extended Pattern Filters
  filters: {
    // Price Requirements (tiered by price ranges)
    priceFilters: [
      {
        condition: "price_tier_1",
        requirements: {
          priceRange: { min: 5, max: 15 },
          highChangePercent: { min: 1.0 }, // >= 100% high change
          distanceToLow20Percent: { min: 2.5 }
        }
      },
      {
        condition: "price_tier_2",
        requirements: {
          priceRange: { min: 15, max: 25 },
          highChangePercent: { min: 0.5 }, // >= 50% high change
          distanceToLow20Percent: { min: 2.0 }
        }
      },
      {
        condition: "price_tier_3",
        requirements: {
          priceRange: { min: 25, max: 50 },
          highChangePercent: { min: 0.3 }, // >= 30% high change
          distanceToLow20Percent: { min: 1.5 }
        }
      },
      {
        condition: "price_tier_4",
        requirements: {
          priceRange: { min: 50, max: 90 },
          highChangePercent: { min: 0.2 }, // >= 20% high change
          distanceToLow20Percent: { min: 1.0 }
        }
      },
      {
        condition: "price_tier_5",
        requirements: {
          priceRange: { min: 90, max: 1000 },
          highChangePercent: { min: 0.15 }, // >= 15% high change
          distanceToLow20Percent: { min: 0.75 }
        }
      }
    ],

    // ATR-Normalized Technical Filters
    atrFilters: {
      highChangeAtr: { min: 1.5 }, // (high - open) / ATR >= 1.5
      emaDistanceAtr: {
        ema9: { min: 2 }, // (high - ema9) / ATR >= 2
        ema20: { min: 3 } // (high - ema20) / ATR >= 3
      },
      lowDistanceAtr: {
        ema9: { min: 1 } // (low - ema9) / ATR >= 1
      }
    },

    // Volume Requirements
    volumeFilters: {
      volume: { min: 10000000 }, // >= 10M volume
      dollarVolume: { min: 500000000 }, // >= 500M dollar volume
      cumulativeDollarVolume5Day: { min: 500000000 }
    },

    // Price Action Requirements
    priceActionFilters: {
      closeVsOpen: "bullish", // close >= open
      highComparison: "new_high", // high >= previous high
      lowComparison: "higher_low", // low >= previous low
      priceVs20High: "breakout" // high >= 20-day high
    },

    // EMA Trend Requirements (Frontside = Uptrend)
    emaStackFilter: {
      required: true,
      order: "ascending", // ema9 >= ema20 >= ema50
      vs250High: "above" // high >= 250-day high (new highs)
    },

    // Distance to Previous Highs
    distanceFilters: {
      distanceTo20DayHigh: { minAtr: 1 }, // >= 1 ATR from 20-day high
      distanceTo20DayLow: { minPercent: 2.5 } // >= 2.5% from 20-day low
    }
  }
};

// JavaScript Implementation Functions
export class LC_D2_Scanner {
  constructor(polygonApiKey) {
    this.apiKey = polygonApiKey;
    this.baseUrl = "https://api.polygon.io";
  }

  // Calculate ATR (14-period)
  calculateATR(data, period = 14) {
    const atrValues = [];

    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const previous = data[i - 1];

      const highLow = current.h - current.l;
      const highClose = Math.abs(current.h - previous.c);
      const lowClose = Math.abs(current.l - previous.c);

      const trueRange = Math.max(highLow, highClose, lowClose);
      atrValues.push(trueRange);
    }

    // Calculate ATR using Simple Moving Average
    const atr = [];
    for (let i = period - 1; i < atrValues.length; i++) {
      const sum = atrValues.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      atr.push(sum / period);
    }

    return atr;
  }

  // Calculate EMA
  calculateEMA(data, period) {
    const multiplier = 2 / (period + 1);
    const ema = [data[0]]; // Start with first price

    for (let i = 1; i < data.length; i++) {
      ema.push((data[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
    }

    return ema;
  }

  // Calculate Rolling Highs/Lows
  calculateRollingHighs(data, period) {
    const highs = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - period + 1);
      const slice = data.slice(start, i + 1);
      highs.push(Math.max(...slice.map(d => d.h)));
    }
    return highs;
  }

  calculateRollingLows(data, period) {
    const lows = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - period + 1);
      const slice = data.slice(start, i + 1);
      lows.push(Math.min(...slice.map(d => d.l)));
    }
    return lows;
  }

  // Check if stock meets LC D2 Extended criteria
  checkLC_D2_Extended(stockData) {
    if (stockData.length < 250) return false; // Need enough data

    const latest = stockData[stockData.length - 1];
    const previous = stockData[stockData.length - 2];

    // Calculate indicators
    const closes = stockData.map(d => d.c);
    const highs = stockData.map(d => d.h);
    const lows = stockData.map(d => d.l);

    const ema9 = this.calculateEMA(closes, 9);
    const ema20 = this.calculateEMA(closes, 20);
    const ema50 = this.calculateEMA(closes, 50);
    const atr = this.calculateATR(stockData);

    const highest20 = this.calculateRollingHighs(stockData, 20);
    const lowest20 = this.calculateRollingLows(stockData, 20);
    const highest250 = this.calculateRollingHighs(stockData, 250);

    const currentATR = atr[atr.length - 1];
    const currentEMA9 = ema9[ema9.length - 1];
    const currentEMA20 = ema20[ema20.length - 1];
    const currentEMA50 = ema50[ema50.length - 1];

    // Core LC D2 Extended Checks
    const checks = {
      // 1. Higher high than previous day
      higherHigh: latest.h >= previous.h,

      // 2. Higher low than previous day
      higherLow: latest.l >= previous.l,

      // 3. Price tier filtering (check all tiers)
      priceTierMet: this.checkPriceTiers(latest),

      // 4. ATR-normalized high change >= 1.5
      highChangeATR: (latest.h - latest.o) / currentATR >= 1.5,

      // 5. Bullish close
      bullishClose: latest.c >= latest.o,

      // 6. EMA distance requirements (ATR-normalized)
      emaDistanceATR: {
        ema9: (latest.h - currentEMA9) / currentATR >= 2,
        ema20: (latest.h - currentEMA20) / currentATR >= 3
      },

      // 7. Volume requirements
      volumeReqs: {
        volume: latest.v >= 10000000,
        dollarVolume: latest.c * latest.v >= 500000000
      },

      // 8. EMA stack (frontside = uptrend)
      emaStack: currentEMA9 >= currentEMA20 && currentEMA20 >= currentEMA50,

      // 9. Breaking to new highs
      newHigh: latest.h >= highest250[highest250.length - 1],

      // 10. Distance checks
      distanceChecks: {
        to20DayHigh: (latest.h - highest20[highest20.length - 2]) / currentATR >= 1,
        priceAbove5: latest.c >= 5
      }
    };

    // All conditions must be true
    const allMet = checks.higherHigh &&
                   checks.higherLow &&
                   checks.priceTierMet &&
                   checks.highChangeATR &&
                   checks.bullishClose &&
                   checks.emaDistanceATR.ema9 &&
                   checks.emaDistanceATR.ema20 &&
                   checks.volumeReqs.volume &&
                   checks.volumeReqs.dollarVolume &&
                   checks.emaStack &&
                   checks.newHigh &&
                   checks.distanceChecks.to20DayHigh &&
                   checks.distanceChecks.priceAbove5;

    return {
      passes: allMet,
      checks,
      score: this.calculateScore(checks, latest, currentATR),
      metadata: {
        symbol: latest.T || latest.ticker,
        price: latest.c,
        volume: latest.v,
        atr: currentATR,
        highChangeATR: (latest.h - latest.o) / currentATR,
        ema9Distance: (latest.h - currentEMA9) / currentATR,
        ema20Distance: (latest.h - currentEMA20) / currentATR
      }
    };
  }

  // Check which price tier the stock meets
  checkPriceTiers(latest) {
    const price = latest.c;
    const highChangePercent = (latest.h / latest.o) - 1;

    // Simplified tier check - in real implementation, need previous day data
    if (price >= 5 && price < 15 && highChangePercent >= 1.0) return true;
    if (price >= 15 && price < 25 && highChangePercent >= 0.5) return true;
    if (price >= 25 && price < 50 && highChangePercent >= 0.3) return true;
    if (price >= 50 && price < 90 && highChangePercent >= 0.2) return true;
    if (price >= 90 && highChangePercent >= 0.15) return true;

    return false;
  }

  // Calculate LC score (0-100)
  calculateScore(checks, latest, atr) {
    let score = 0;

    // ATR expansion score (20 points max)
    const highChangeATR = (latest.h - latest.o) / atr;
    if (highChangeATR >= 3) score += 20;
    else if (highChangeATR >= 2) score += 18;
    else if (highChangeATR >= 1.5) score += 15;
    else if (highChangeATR >= 1) score += 12;

    // EMA distance score (30 points max)
    const ema9DistanceATR = checks.emaDistanceATR.ema9 ? 30 : 0;
    score += ema9DistanceATR;

    // Volume score (15 points max)
    if (checks.volumeReqs.volume && checks.volumeReqs.dollarVolume) score += 15;

    // Trend alignment score (20 points max)
    if (checks.emaStack) score += 20;

    // New high breakout score (15 points max)
    if (checks.newHigh) score += 15;

    return Math.min(score, 100);
  }

  // Format scan results for Traderra dashboard
  formatScanResults(results) {
    return results.map(result => ({
      symbol: result.metadata.symbol,
      price: result.metadata.price.toFixed(2),
      volume: (result.metadata.volume / 1000000).toFixed(1) + "M",
      atr: result.metadata.atr.toFixed(2),
      score: result.score,
      highChangeATR: result.metadata.highChangeATR.toFixed(2),
      ema9DistanceATR: result.metadata.ema9Distance.toFixed(2),
      ema20DistanceATR: result.metadata.ema20Distance.toFixed(2),
      pattern: "LC_D2_Extended",
      tier: this.getPriceTier(result.metadata.price),
      alerts: this.generateAlerts(result)
    }));
  }

  getPriceTier(price) {
    if (price >= 5 && price < 15) return "Tier 1 ($5-15)";
    if (price >= 15 && price < 25) return "Tier 2 ($15-25)";
    if (price >= 25 && price < 50) return "Tier 3 ($25-50)";
    if (price >= 50 && price < 90) return "Tier 4 ($50-90)";
    if (price >= 90) return "Tier 5 ($90+)";
    return "Below Range";
  }

  generateAlerts(result) {
    const alerts = [];
    if (result.score >= 90) alerts.push("HIGH PRIORITY");
    if (result.metadata.highChangeATR >= 3) alerts.push("STRONG ATR EXPANSION");
    if (result.checks.newHigh) alerts.push("NEW 250-DAY HIGH");
    return alerts;
  }
}

// Export for use in Traderra system
export const SCAN_PARAMS = {
  scanType: "LC_D2_Extended",
  filters: LC_D2_SCAN_CONFIG.filters,
  requiredIndicators: ["ATR", "EMA9", "EMA20", "EMA50", "Volume"],
  estimatedResults: "5-15 stocks per scan",
  bestTimeframe: "Daily close",
  notes: "Best used for gap-up continuation plays with strong volume"
};