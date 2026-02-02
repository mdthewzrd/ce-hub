# Edge.dev 1-Minute Base Data API Integration Guide

## Overview

Edge.dev now uses a **1-minute base data architecture** for all intraday charts (5min, 15min, hour) with **extended hours coverage (4am-8pm)** and **enhanced fake print detection**.

## Architecture Benefits

### 🎯 **Data Quality**
- **Single Source of Truth**: All timeframes derived from 1-minute data
- **Enhanced Fake Print Detection**: More accurate on granular 1-minute level
- **Extended Hours**: Continuous 4am-8pm coverage (no 8am data gap)
- **Consistency**: Eliminates discrepancies between timeframes

### 📊 **Visual Enhancements**
- **Pre-market Shading**: 4:00am - 9:30am (light gray)
- **After-hours Shading**: 4:00pm - 8:00pm (light gray)
- **Regular Hours**: 9:30am - 4:00pm (normal background)
- **Overnight Gap**: 8:00pm - 4:00am (darker gray, minimal)

## API Integration Requirements

### 1. Data Provider Configuration

**Polygon.io Example Request:**
```typescript
// For 1-minute base data with extended hours
const params = {
  symbol: 'SPY',
  timespan: 'minute',        // Always request 1-minute
  multiplier: 1,             // 1-minute intervals
  from: '2024-10-20',        // Start date
  to: '2024-10-25',          // End date
  adjusted: true,            // Split/dividend adjusted
  sort: 'asc',              // Chronological order
  limit: 50000,             // Max results per request

  // Extended hours parameters
  'include_otc': false,      // Exclude OTC data
  'asof': undefined,         // Real-time data
  'order': 'asc',           // Chronological

  // Custom extended hours (API-specific)
  'premarket': true,         // 4:00am - 9:30am
  'afterhours': true,        // 4:00pm - 8:00pm
  'extended_hours': true     // Full extended session
};
```

### 2. Request Flow

```typescript
// 1. Request extended hours 1-minute data
const rawData = await fetchPolygonData(params);

// 2. Process and clean the data
const processedData = processRawMarketData(rawData, requestedTimeframe);

// 3. Apply fake print detection
const cleanData = detectFakePrints(processedData);

// 4. Resample to target timeframe (if not daily)
const finalData = requestedTimeframe === 'day'
  ? cleanData
  : resampleCandles(cleanData, requestedTimeframe);

// 5. Convert to chart format
const chartData = convertToChartFormat(finalData);
```

### 3. Extended Hours Time Mapping

```typescript
const EXTENDED_HOURS_SCHEDULE = {
  // Pre-market: 4:00 AM - 9:30 AM ET
  premarket: {
    start: '04:00:00',
    end: '09:30:00',
    shading: 'rgba(100, 100, 100, 0.2)'
  },

  // Regular hours: 9:30 AM - 4:00 PM ET
  regular: {
    start: '09:30:00',
    end: '16:00:00',
    shading: 'transparent' // No shading
  },

  // After-hours: 4:00 PM - 8:00 PM ET
  afterhours: {
    start: '16:00:00',
    end: '20:00:00',
    shading: 'rgba(100, 100, 100, 0.2)'
  },

  // Overnight gap: 8:00 PM - 4:00 AM+1 ET
  overnight: {
    start: '20:00:00',
    end: '04:00:00', // Next day
    shading: 'rgba(50, 50, 50, 0.3)' // Darker
  }
};
```

## Fake Print Detection Parameters

### Default Thresholds
```typescript
const FAKE_PRINT_THRESHOLDS = {
  spikeMultiplier: 15,    // 15x average price range
  volumeMultiplier: 100,  // 100x average volume
  minVolume: 1000         // Minimum valid volume
};
```

### Detection Logic
1. **Price Spike Detection**: Current range > 15x rolling 20-minute average range
2. **Volume Spike Detection**: Current volume > 100x rolling 20-minute average volume
3. **OHLC Validation**: Ensure logical price relationships (high ≥ low, etc.)
4. **Minimum Volume**: Filter out zero/low volume prints

## Implementation Checklist

### ✅ **Data Pipeline Setup**
- [ ] Configure API for extended hours (4am-8pm)
- [ ] Implement 1-minute base data requests
- [ ] Add fake print detection on 1-minute level
- [ ] Implement resampling for 5min/15min/hour timeframes
- [ ] Test data continuity (no gaps between 4am-8pm)

### ✅ **Chart Enhancements**
- [x] Pre/post market session shading
- [x] Extended hours time labels
- [x] Edge-to-edge data scaling
- [x] 1-minute base data indicators in UI

### ✅ **Quality Assurance**
- [ ] Verify extended hours data coverage
- [ ] Test fake print detection accuracy
- [ ] Validate resampling consistency
- [ ] Performance testing with large datasets

## Sample API Endpoints

### Polygon.io Extended Hours
```bash
GET /v2/aggs/ticker/{symbol}/range/1/minute/{from}/{to}?adjusted=true&sort=asc&limit=50000&premarket=true&afterhours=true
```

### Alpha Vantage Extended Hours
```bash
GET /query?function=TIME_SERIES_INTRADAY&symbol={symbol}&interval=1min&outputsize=full&extended_hours=true
```

### IEX Cloud Extended Hours
```bash
GET /stable/stock/{symbol}/chart/5d?includeToday=true&format=json&token={token}&chartByDay=false&includeAfterHours=true
```

## Data Quality Monitoring

```typescript
// Monitor data quality in real-time
const qualityMetrics = getDataQualityMetrics(oneMinuteCandles);

console.log(`Data Quality: ${qualityMetrics.dataQuality}`);
console.log(`Completeness: ${(qualityMetrics.completeness * 100).toFixed(1)}%`);
console.log(`Total Candles: ${qualityMetrics.totalCandles}`);
```

## Performance Considerations

### Memory Optimization
- **Streaming Processing**: Process data in chunks for large datasets
- **Lazy Loading**: Load historical data on-demand
- **Compression**: Compress 1-minute data for storage

### API Rate Limits
- **Batch Requests**: Group multiple symbols per request
- **Caching**: Cache 1-minute data locally
- **Incremental Updates**: Only fetch new data since last update

## Error Handling

```typescript
try {
  const rawData = await fetchExtendedHoursData(symbol, timeframe, days);
  const processedData = processRawMarketData(rawData, timeframe);

  // Validate data quality
  const quality = getDataQualityMetrics(processedData);
  if (quality.completeness < 0.85) {
    console.warn(`Low data quality: ${quality.completeness}`);
  }

  return processedData;
} catch (error) {
  console.error('Data processing failed:', error);
  // Fallback to cached data or error state
  return getCachedData(symbol, timeframe);
}
```

## Migration Guide

### From Current System
1. **Update API calls** to request 1-minute data with extended hours
2. **Implement data processing pipeline** with fake print detection
3. **Add resampling logic** for intraday timeframes
4. **Update chart rendering** with session shading
5. **Test thoroughly** with real trading data

This architecture provides the foundation for **accurate gap scanning**, **reliable R-multiple calculations**, and **professional chart analysis** with extended hours coverage and enhanced data quality.