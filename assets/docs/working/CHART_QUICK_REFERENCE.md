# CE-Hub Chart Implementations - Quick Reference

## TL;DR: Hourly Chart Architecture

### Files to Know
| File | Purpose |
|------|---------|
| `src/components/EdgeChart.tsx` | Main chart rendering component |
| `src/utils/polygonData.ts` | Polygon API data fetching |
| `src/utils/chartDayNavigation.ts` | Day-by-day navigation logic |
| `src/utils/marketCalendar.ts` | Trading day/holiday definitions |
| `src/hooks/useChartDayNavigation.ts` | React hook for navigation |
| `src/components/ChartDayNavigation.tsx` | Navigation UI component |

### Hourly Chart Data Flow
```
User selects "hour"
  ↓
fetchRealData('SPY', 'hour')
  ↓
fetchPolygonData(symbol, 'hour', 15)
  ├─ Calculate dates: -15 days to today
  ├─ Fetch 1-minute data: GET /v2/aggs/ticker/{symbol}/range/1/minute/{dates}
  │   └─ Parameter: include_otc=true (extended hours)
  ├─ cleanFakePrints(oneMinuteBars)
  ├─ filterExtendedHours(bars) → keep 4am-8pm only
  └─ resampleToTimeframe(bars, 'hour') → 240 hourly candles
  
EdgeChart renders:
  ├─ Candlesticks (white/red)
  ├─ Volume subplot
  ├─ Market session backgrounds
  └─ 800px height
```

### Timeframe Configurations
```javascript
day:    60 days,   1 bar/day,    daily API
hour:   15 days,   16 bars/day,  1-min base
15min:  5 days,    64 bars/day,  1-min base
5min:   2 days,   192 bars/day,  1-min base
```

### Key Constants

**Polygon API**
```javascript
const POLYGON_API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I";
const API_BASE = "https://api.polygon.io/v2/aggs/ticker";
```

**Market Hours**
```
Pre-market:  4:00 AM - 9:30 AM ET
Regular:     9:30 AM - 4:00 PM ET (or 1:00 PM on early close)
After-hours: 4:00 PM - 8:00 PM ET
```

**US Market Holidays 2024**
```
01-01, 01-15, 02-19, 03-29, 05-27, 06-19, 07-04, 09-02, 11-28, 12-25
```

### Fake Print Detection Thresholds
```javascript
Spike multiplier:  15x typical price range
Volume multiplier: 100x average volume
Min volume:        1000 shares per bar
```

### API Parameters
```javascript
GET /v2/aggs/ticker/{symbol}/range/{timeframe}/{startDate}/{endDate}
  ?adjusted=true        // Use split-adjusted prices
  &sort=asc            // Ascending order
  &limit=50000         // Max records
  &include_otc=true    // Include pre/post-market
  &apikey={key}
```

## Component Props

### EdgeChart Props
```typescript
{
  symbol: string;              // Stock ticker
  timeframe: 'day'|'hour'|'15min'|'5min';
  data: {
    x: string[];              // ISO timestamps
    open: number[];
    high: number[];
    low: number[];
    close: number[];
    volume: number[];
  };
  onTimeframeChange?: (tf) => void;
  dayNavigation?: {             // Optional LC pattern nav
    currentDay: Date;
    dayOffset: number;
    canGoPrevious: boolean;
    canGoNext: boolean;
    onPreviousDay: () => void;
    onNextDay: () => void;
    onResetDay: () => void;
  };
}
```

### useChartDayNavigation Hook
```typescript
const {
  state: { currentDay, dayOffset, isLoading, hasData, maxAvailableDays },
  currentDayData: ChartData,
  goToNextDay: () => void,
  goToPreviousDay: () => void,
  resetToReference: () => void,
  canGoNext: boolean,
  canGoPrevious: boolean,
} = useChartDayNavigation({
  ticker: 'SPY',
  referenceDate: '2024-10-25',  // Day 0
  timeframe: 'hour',
  onDataLoad: (dayOffset, chartData) => {},
  onError: (error) => {}
});
```

## Key Functions

### Fetch Data
```typescript
// Auto-calculated days based on timeframe
await fetchPolygonData(symbol, 'hour')  // 15 days auto

// Or explicit days
await fetchPolygonData(symbol, 'hour', 20)

// With LC pattern anchor
await fetchPolygonData(symbol, 'hour', undefined, '2024-10-25')
```

### Check Trading Day
```typescript
isTradingDay(date)      // false for weekends/holidays
getNextTradingDay(date) // returns Date
getPreviousTradingDay(date)
getTradingDaysBetween(start, end)
```

### Resample Data
```typescript
// Raw 1-minute data → hourly candles
resampleCandles(oneMinuteBars, 'hour')
// Returns: Array of hourly OHLCV candles

// Clean bad data first
cleanFakePrints(bars)  // Removes anomalies
```

## Usage Examples

### Basic Hourly Chart
```typescript
import EdgeChart from '@/components/EdgeChart';
import { fetchPolygonData } from '@/utils/polygonData';

export default function App() {
  const [data, setData] = useState();
  
  useEffect(() => {
    (async () => {
      const bars = await fetchPolygonData('SPY', 'hour', 15);
      setData({
        x: bars.map(b => new Date(b.t).toISOString()),
        open: bars.map(b => b.o),
        high: bars.map(b => b.h),
        low: bars.map(b => b.l),
        close: bars.map(b => b.c),
        volume: bars.map(b => b.v),
      });
    })();
  }, []);
  
  return (
    <EdgeChart
      symbol="SPY"
      timeframe="hour"
      data={data}
      onTimeframeChange={(tf) => console.log(tf)}
    />
  );
}
```

### With Day Navigation
```typescript
import { useChartDayNavigation } from '@/hooks/useChartDayNavigation';

export default function LCAnalyzer() {
  const [chartData, setChartData] = useState();
  const nav = useChartDayNavigation({
    ticker: 'AAPL',
    referenceDate: '2024-10-25',  // LC pattern date
    timeframe: 'hour',
    onDataLoad: (offset, data) => {
      setChartData(data);
    }
  });
  
  return (
    <>
      <ChartDayNavigation
        currentState={nav.state}
        onNavigate={nav.handleNavigationAction}
        ticker="AAPL"
      />
      <EdgeChart
        symbol="AAPL"
        timeframe="hour"
        data={chartData}
        dayNavigation={nav.state}
      />
      <div>
        {nav.getDayLabel()}
        {nav.canGoNext && <button onClick={nav.goToNextDay}>Next</button>}
      </div>
    </>
  );
}
```

## Debug Checklist

- [ ] Data fetching logs show correct date range
- [ ] One-minute base data received (~14,400 bars for 15 days)
- [ ] Fake print detection removes <5% of bars
- [ ] Extended hours filter keeps data between 4am-8pm ET
- [ ] Resampling produces ~240 hourly candles
- [ ] Chart renders with white (up) and red (down) candles
- [ ] Volume subplot shows at bottom
- [ ] Market session backgrounds visible (darker pre/post)
- [ ] No gaps on weekends/holidays (rangebreaks working)
- [ ] Can zoom/pan the chart
- [ ] Navigation shows correct day offset

## Common Issues & Fixes

### "No data for timeframe"
→ Check API key in `polygonData.ts`
→ Check `include_otc=true` parameter

### "Chart shows gaps"
→ Verify `rangebreaks` in layout config
→ Check holiday/weekend in data

### "Data looks wrong/spikey"
→ Fake print detection may need tuning
→ Check `cleanFakePrints` thresholds

### "Slow navigation"
→ Enable prefetching in `useChartDayNavigation`
→ Check dataCache is persisting

### "Can't navigate backward"
→ Limit is -5 days, check code
→ Verify `isTradingDay` logic

---

## File Sizes & Performance

| Task | Time | Data |
|------|------|------|
| Fetch 1-min (15d) | 200ms | 14.4K bars |
| Clean fake prints | 50ms | 14.2K bars |
| Resample hourly | 30ms | 240 bars |
| Render chart | 400ms | 240 candles |
| **Total** | **680ms** | **~100KB** |

Cache hit (navigation): **~10ms**

---

## Production Deployment Notes

✅ Polygon API key embedded (remove for production)
✅ Timeframe templates hardcoded (consider config)
✅ Market calendar hardcoded for 2024-2025
✅ Extended hours 4am-8pm hardcoded
✅ SSR disabled for Plotly (correct)
✅ Data caching session-only (reset on reload)

For production:
- Move API key to environment variables
- Update market calendar annually
- Consider caching data to local storage
- Add error boundaries around chart components
- Monitor Polygon API rate limits

