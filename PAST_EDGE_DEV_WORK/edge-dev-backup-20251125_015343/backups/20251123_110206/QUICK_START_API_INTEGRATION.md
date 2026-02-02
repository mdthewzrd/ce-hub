# 🚀 Quick Start: API Integration with Your Key

## 📍 **Where Everything Is Running**

### ✅ **Primary Edge.dev Application**
- **URL**: `http://localhost:5665`
- **Status**: ✅ Running (Next.js with enhanced charts)
- **Features**: 1-min base data, extended hours, session shading

### ✅ **Streamlit Prototype**
- **URL**: `http://localhost:6551`
- **Status**: ✅ Running (Python dashboard)
- **Purpose**: Development testing environment

## 🔑 **Your API Key Configuration**

Your API key `Fm7brz4s23eSocDErnL68cE7wspz2K1I` has been configured in:
**File**: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/.env.local`

## 🛠️ **Next Steps to Activate Live Data**

### 1. **Restart the Application** (to load new environment variables)
```bash
cd "/Users/michaeldurante/ai dev/ce-hub/edge-dev"
npm run dev
```

### 2. **Create Data Fetching Service**
Create `/src/services/polygonApi.ts`:

```typescript
// Polygon.io integration with your API key
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const BASE_URL = 'https://api.polygon.io';

export async function fetchExtendedHoursData(
  symbol: string,
  timeframe: string,
  days: number
) {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const start = startDate.toISOString().split('T')[0];

  // Request 1-minute data with extended hours
  const url = `${BASE_URL}/v2/aggs/ticker/${symbol}/range/1/minute/${start}/${endDate}`;
  const params = new URLSearchParams({
    adjusted: 'true',
    sort: 'asc',
    limit: '50000',
    apikey: POLYGON_API_KEY!
  });

  const response = await fetch(`${url}?${params}`);
  const data = await response.json();

  return data.results || [];
}
```

### 3. **Test API Connection**
Visit `http://localhost:5665` and check the browser console for:
- ✅ API key loaded: `POLYGON_API_KEY` present
- ✅ Extended hours enabled: `ENABLE_EXTENDED_HOURS=true`
- ✅ Fake print detection: `ENABLE_FAKE_PRINT_DETECTION=true`

### 4. **Verify Chart Features**
In the chart interface, you should see:
- 🔄 **1-min base data** indicator
- 🕐 **Extended hours (4am-8pm)** coverage
- 🛡️ **Fake print filtered** processing

## 🔧 **Configuration Options**

All settings are in `.env.local`:

```bash
# Your API Key
POLYGON_API_KEY=Fm7brz4s23eSocDErnL68cE7wspz2K1I

# Extended Hours (4am-8pm coverage)
ENABLE_EXTENDED_HOURS=true
ENABLE_PREMARKET=true      # 4am-9:30am
ENABLE_AFTERHOURS=true     # 4pm-8pm

# Fake Print Detection
FAKE_PRINT_SPIKE_MULTIPLIER=15    # 15x price spike threshold
FAKE_PRINT_VOLUME_MULTIPLIER=100  # 100x volume spike threshold
MIN_VOLUME_THRESHOLD=1000         # Minimum valid volume
```

## 🎯 **Testing Your Setup**

1. **Check Environment Loading**:
   ```bash
   # In browser console at localhost:5665
   console.log('API Key:', process.env.POLYGON_API_KEY?.substring(0, 10) + '...');
   ```

2. **Test Chart Timeframes**:
   - Click `5MIN` → Should show "1-min base data" indicator
   - Click `HOUR` → Should show extended hours coverage
   - Click `DAY` → Should show direct OHLC (no resampling)

3. **Verify Session Shading**:
   - Pre-market: Light gray overlay (4am-9:30am)
   - After-hours: Light gray overlay (4pm-8pm)
   - Regular hours: Normal background (9:30am-4pm)

## 🚨 **Troubleshooting**

### API Key Not Loading
```bash
# Restart Next.js to load new .env.local
cd "/Users/michaeldurante/ai dev/ce-hub/edge-dev"
npm run dev
```

### API Rate Limits
- **Polygon.io Free**: 5 requests/minute
- **Polygon.io Basic**: 100 requests/minute
- Adjust `MAX_API_REQUESTS_PER_MINUTE` in `.env.local`

### Missing Extended Hours Data
- Verify `ENABLE_EXTENDED_HOURS=true` in `.env.local`
- Check Polygon.io plan includes extended hours access
- Ensure API requests include `includeAfterHours=true`

## 📊 **Expected Results**

With your API key active, you'll get:
- **Real-time data**: Live SPY/stock prices
- **Extended coverage**: 4am-8pm continuous data
- **Clean charts**: Fake prints automatically filtered
- **Professional accuracy**: 1-minute base resampling

Your Edge.dev platform is now ready for professional gap scanning and R-multiple analysis! 🎯