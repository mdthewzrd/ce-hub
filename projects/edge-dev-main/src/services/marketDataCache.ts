/**
 * Market Data Cache Service
 *
 * Centralized caching system to eliminate redundant Polygon API calls
 * and optimize data flow between scan results and visualization components.
 */

interface CacheEntry {
  data: any[];
  timestamp: number;
  ticker: string;
  timeframe: string;
  dateRange: {
    start: string;
    end: string;
  };
}

interface ScanResultsCache {
  [ticker: string]: {
    date: string;
    data: any;
    indicators?: any;
  };
}

class MarketDataCache {
  private cache = new Map<string, CacheEntry>();
  private scanResultsCache = new Map<string, ScanResultsCache>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly SCAN_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for scan results

  // Cache key generation
  private generateCacheKey(ticker: string, timeframe: string, startDate: string, endDate: string): string {
    return `${ticker}-${timeframe}-${startDate}-${endDate}`;
  }

  // Store individual ticker data
  setTickerData(ticker: string, timeframe: string, data: any[], startDate: string, endDate: string): void {
    const key = this.generateCacheKey(ticker, timeframe, startDate, endDate);

    // Remove old entry if it exists
    this.cache.delete(key);

    // Add new entry
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ticker,
      timeframe,
      dateRange: {
        start: startDate,
        end: endDate
      }
    });
  }

  // Get cached ticker data
  getTickerData(ticker: string, timeframe: string, startDate: string, endDate: string): any[] | null {
    const key = this.generateCacheKey(ticker, timeframe, startDate, endDate);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache is still valid
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Store scan results for multiple tickers
  setScanResults(scanDate: string, results: any[]): void {
    // Clear old scan results cache
    this.scanResultsCache.clear();

    // Organize results by ticker
    const tickerData: ScanResultsCache = {};

    results.forEach(result => {
      const ticker = result.ticker || result.symbol;
      if (ticker) {
        tickerData[ticker] = {
          date: result.date || scanDate,
          data: result,
          indicators: this.calculateIndicators(result)
        };
      }
    });

    this.scanResultsCache.set(scanDate, tickerData);
    console.log(`📊 Cached scan results for ${Object.keys(tickerData).length} tickers for date ${scanDate}`);
  }

  // Get cached scan results
  getScanResults(scanDate: string, ticker?: string): any | null {
    const dateCache = this.scanResultsCache.get(scanDate);

    if (!dateCache) {
      return null;
    }

    // Check if cache is still valid
    const cacheAge = Date.now() - (dateCache as any).timestamp;
    if (cacheAge > this.SCAN_CACHE_DURATION) {
      this.scanResultsCache.delete(scanDate);
      return null;
    }

    if (ticker) {
      return dateCache[ticker] || null;
    }

    return dateCache;
  }

  // Calculate indicators for cached data
  private calculateIndicators(data: any): any {
    try {
      if (!data || typeof data !== 'object') {
        return {};
      }

      const indicators: any = {};

      // Add common indicators if we have price/volume data
      if (data.close && Array.isArray(data.close)) {
        const closes = data.close.slice(); // Copy array
        if (closes.length > 1) {
          // Calculate 20-day SMA
          const sma20 = closes.slice(-20).reduce((a: number, b: number) => a + b, 0) / Math.min(20, closes.length);
          indicators.sma20 = sma20;

          // Calculate latest return
          const latestReturn = ((closes[closes.length - 1] / closes[closes.length - 2]) - 1) * 100;
          indicators.latestReturn = latestReturn;
        }
      }

      // Add volume indicators
      if (data.volume && Array.isArray(data.volume)) {
        const volumes = data.volume.slice();
        const avgVolume = volumes.slice(-20).reduce((a: number, b: number) => a + b, 0) / Math.min(20, volumes.length);
        indicators.avgVolume = avgVolume;
      }

      return indicators;
    } catch (error) {
      console.warn('Error calculating indicators:', error);
      return {};
    }
  }

  // Get cached data or fetch if not available
  async getOrFetch(ticker: string, timeframe: string, startDate: string, endDate: string, fetchFunction: () => Promise<any[]>): Promise<any[]> {
    // Try to get cached data first
    const cachedData = this.getTickerData(ticker, timeframe, startDate, endDate);
    if (cachedData) {
      console.log(`🎯 Cache hit for ${ticker} ${timeframe} (${startDate} to ${endDate})`);
      return cachedData;
    }

    // Fetch new data
    console.log(`🌐 Cache miss for ${ticker} ${timeframe} (${startDate} to ${endDate}) - fetching...`);
    const data = await fetchFunction();

    // Cache the fetched data
    this.setTickerData(ticker, timeframe, data, startDate, endDate);

    return data;
  }

  // Check if we have cached data for a date range
  hasCachedData(ticker: string, timeframe: string, startDate: string, endDate: string): boolean {
    return this.getTickerData(ticker, timeframe, startDate, endDate) !== null;
  }

  // Check if we have scan results for a specific date
  hasScanResults(scanDate: string): boolean {
    const dateCache = this.scanResultsCache.get(scanDate);
    return !!(dateCache && Object.keys(dateCache).length > 0);
  }

  // Clear all cache
  clearCache(): void {
    this.cache.clear();
    this.scanResultsCache.clear();
    console.log('🧹 Market data cache cleared');
  }

  // Clear cache for specific ticker
  clearTickerCache(ticker: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((value, key) => {
      if (value.ticker === ticker) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));

    console.log(`🧹 Cleared cache for ticker ${ticker}`);
  }

  // Get cache statistics
  getCacheStats(): any {
    const cacheSize = this.cache.size;
    const scanCacheSize = this.scanResultsCache.size;

    return {
      individualTickerCache: cacheSize,
      scanResultsCache: scanCacheSize,
      totalEntries: cacheSize + scanCacheSize
    };
  }

  // Optimize cache by removing old entries
  optimizeCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`🧹 Optimized cache: removed ${keysToDelete.length} expired entries`);
    }
  }
}

// Export singleton instance
export const marketDataCache = new MarketDataCache();
export default marketDataCache;