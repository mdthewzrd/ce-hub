// Debug LC D2 Scan - Check what's happening with specific tickers
const apiKey = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy';
const baseUrl = 'https://api.polygon.io';

// Test with a few popular tickers that should have good data
const testTickers = ['AAPL', 'TSLA', 'NVDA', 'SMCI', 'AMD'];
const scanDate = '2024-02-23'; // During the big AI rally period

async function debugTicker(ticker) {
  try {
    console.log(`\n=== DEBUGGING ${ticker} ===`);

    // Get 60 days of data
    const endDate = new Date(scanDate);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 60);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const url = `${baseUrl}/v2/aggs/ticker/${ticker}/range/1/day/${startStr}/${endStr}`;
    const params = new URLSearchParams({
      adjusted: 'true',
      sort: 'asc',
      apikey: apiKey
    });

    console.log(`Fetching: ${url}?${params}`);

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    if (!data.results || data.results.length < 20) {
      console.log(`❌ Insufficient data: ${data.results?.length || 0} bars`);
      return;
    }

    console.log(`✓ Got ${data.results.length} bars of data`);

    // Get latest and previous day
    const bars = data.results;
    const latest = bars[bars.length - 1];
    const previous = bars[bars.length - 2];

    console.log(`Latest day: ${new Date(latest.t).toDateString()}`);
    console.log(`- Open: $${latest.o.toFixed(2)}, High: $${latest.h.toFixed(2)}, Low: $${latest.l.toFixed(2)}, Close: $${latest.c.toFixed(2)}`);
    console.log(`- Volume: ${(latest.v / 1000000).toFixed(1)}M, Dollar Volume: $${((latest.v * latest.c) / 1000000).toFixed(0)}M`);

    console.log(`Previous day: ${new Date(previous.t).toDateString()}`);
    console.log(`- Open: $${previous.o.toFixed(2)}, High: $${previous.h.toFixed(2)}, Low: $${previous.l.toFixed(2)}, Close: $${previous.c.toFixed(2)}`);

    // Calculate technical indicators
    const closes = bars.map(b => b.c);
    const ema9 = calculateEMA(closes, 9);
    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const atr = calculateATR(bars);

    const currentATR = atr[atr.length - 1];
    const currentEMA9 = ema9[ema9.length - 1];
    const currentEMA20 = ema20[ema20.length - 1];
    const currentEMA50 = ema50[ema50.length - 1];

    console.log(`\nTechnical Indicators:`);
    console.log(`- ATR: ${currentATR.toFixed(3)}`);
    console.log(`- EMA9: $${currentEMA9.toFixed(2)}, EMA20: $${currentEMA20.toFixed(2)}, EMA50: $${currentEMA50.toFixed(2)}`);

    // Test each LC D2 Extended criteria
    console.log(`\nLC D2 Extended Criteria Check:`);

    const higherHigh = latest.h >= previous.h;
    console.log(`1. Higher High: ${higherHigh} (${latest.h.toFixed(2)} >= ${previous.h.toFixed(2)})`);

    const higherLow = latest.l >= previous.l;
    console.log(`2. Higher Low: ${higherLow} (${latest.l.toFixed(2)} >= ${previous.l.toFixed(2)})`);

    const highChangeATR = (latest.h - latest.o) / currentATR;
    const highChangeATRPass = highChangeATR >= 1.5;
    console.log(`3. High Change ATR: ${highChangeATRPass} (${highChangeATR.toFixed(2)} >= 1.5)`);

    const bullishClose = latest.c >= latest.o;
    console.log(`4. Bullish Close: ${bullishClose} (${latest.c.toFixed(2)} >= ${latest.o.toFixed(2)})`);

    const ema9DistanceATR = (latest.h - currentEMA9) / currentATR;
    const ema9Pass = ema9DistanceATR >= 2;
    console.log(`5. 9EMA Distance ATR: ${ema9Pass} (${ema9DistanceATR.toFixed(2)} >= 2)`);

    const ema20DistanceATR = (latest.h - currentEMA20) / currentATR;
    const ema20Pass = ema20DistanceATR >= 3;
    console.log(`6. 20EMA Distance ATR: ${ema20Pass} (${ema20DistanceATR.toFixed(2)} >= 3)`);

    const volumePass = latest.v >= 10000000;
    console.log(`7. Volume: ${volumePass} (${(latest.v / 1000000).toFixed(1)}M >= 10M)`);

    const dollarVolumePass = latest.c * latest.v >= 500000000;
    console.log(`8. Dollar Volume: ${dollarVolumePass} ($${((latest.c * latest.v) / 1000000).toFixed(0)}M >= $500M)`);

    const emaStack = currentEMA9 >= currentEMA20 && currentEMA20 >= currentEMA50;
    console.log(`9. EMA Stack: ${emaStack} (EMA9: ${currentEMA9.toFixed(2)} >= EMA20: ${currentEMA20.toFixed(2)} >= EMA50: ${currentEMA50.toFixed(2)})`);

    const priceAbove5 = latest.c >= 5;
    console.log(`10. Price ≥ $5: ${priceAbove5} ($${latest.c.toFixed(2)} >= $5)`);

    const allMet = higherHigh && higherLow && highChangeATRPass && bullishClose &&
                   ema9Pass && ema20Pass && volumePass && dollarVolumePass &&
                   emaStack && priceAbove5;

    console.log(`\n🎯 PASSES LC D2 EXTENDED: ${allMet ? '✅ YES!' : '❌ NO'}`);

    if (allMet) {
      const gap = (latest.o - previous.c) / previous.c;
      const parabolicScore = Math.abs(gap) * 10 +
                            (latest.v / 1000000) +
                            (highChangeATR * 2) +
                            (ema9DistanceATR * 1.5);
      console.log(`🚀 Parabolic Score: ${parabolicScore.toFixed(1)}`);
    } else {
      const failedCriteria = [
        !higherHigh && 'Higher High',
        !higherLow && 'Higher Low',
        !highChangeATRPass && 'High Change ATR',
        !bullishClose && 'Bullish Close',
        !ema9Pass && '9EMA Distance ATR',
        !ema20Pass && '20EMA Distance ATR',
        !volumePass && 'Volume',
        !dollarVolumePass && 'Dollar Volume',
        !emaStack && 'EMA Stack',
        !priceAbove5 && 'Price'
      ].filter(Boolean);
      console.log(`❌ Failed criteria: ${failedCriteria.join(', ')}`);
    }

  } catch (error) {
    console.error(`Error analyzing ${ticker}:`, error.message);
  }
}

function calculateATR(data, period = 14) {
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

  const atr = [];
  for (let i = period - 1; i < atrValues.length; i++) {
    const sum = atrValues.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    atr.push(sum / period);
  }

  return atr;
}

function calculateEMA(data, period) {
  const multiplier = 2 / (period + 1);
  const ema = [data[0]];

  for (let i = 1; i < data.length; i++) {
    ema.push((data[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
  }

  return ema;
}

async function runDebug() {
  console.log(`🔍 Debugging LC D2 Scan for ${scanDate}`);
  console.log(`Testing tickers: ${testTickers.join(', ')}`);

  for (const ticker of testTickers) {
    await debugTicker(ticker);
    await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
  }
}

runDebug().catch(console.error);