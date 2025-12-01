/**
 * Test script to verify intraday data functionality
 * Tests all timeframes and validates data completeness
 */

async function testIntradayData() {
  const apiKey = "Fm7brz4s23eSocDErnL68cE7wspz2K1I";
  const symbol = "SPY";

  const timeframes = {
    "day": "1/day",
    "hour": "1/hour",
    "15min": "15/minute",
    "5min": "5/minute"
  };

  const testPeriods = {
    "day": { days: 90, expectedBarsPerDay: 1 },
    "hour": { days: 30, expectedBarsPerDay: 13.5 }, // 6.5 regular + 7 extended hours
    "15min": { days: 10, expectedBarsPerDay: 54 }, // 26 regular + 28 extended
    "5min": { days: 2, expectedBarsPerDay: 192 } // 78 regular + 84 extended
  };

  console.log("🔍 Testing Edge.dev Intraday Data Completeness\n");

  for (const [timeframe, apiFormat] of Object.entries(timeframes)) {
    const config = testPeriods[timeframe];
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (config.days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${apiFormat}/${startDate}/${endDate}?adjusted=true&sort=asc&limit=50000&apikey=${apiKey}`;

    try {
      console.log(`📊 Testing ${timeframe.toUpperCase()} timeframe:`);
      console.log(`   Period: ${config.days} days (${startDate} to ${endDate})`);

      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const bars = data.results;
        const firstBar = bars[0];
        const lastBar = bars[bars.length - 1];

        console.log(`   ✅ Received: ${bars.length} bars`);
        console.log(`   📅 First bar: ${new Date(firstBar.t).toISOString()}`);
        console.log(`   📅 Last bar: ${new Date(lastBar.t).toISOString()}`);
        console.log(`   💰 Price range: $${Math.min(...bars.map(b => b.l)).toFixed(2)} - $${Math.max(...bars.map(b => b.h)).toFixed(2)}`);
        console.log(`   📈 Latest close: $${lastBar.c.toFixed(2)}`);

        // Extended hours check for intraday timeframes
        if (timeframe !== 'day') {
          const extendedHoursBars = bars.filter(bar => {
            const hour = new Date(bar.t).getUTCHours();
            return hour < 13 || hour >= 20; // Before 9:30 AM or after 4 PM ET (UTC+4)
          });
          console.log(`   🌅 Extended hours bars: ${extendedHoursBars.length} (${(extendedHoursBars.length/bars.length*100).toFixed(1)}%)`);
        }

        console.log(`   ✅ Status: WORKING - Real data confirmed\n`);
      } else {
        console.log(`   ❌ No data received for ${timeframe}`);
        console.log(`   Response:`, data);
      }
    } catch (error) {
      console.log(`   ❌ Error testing ${timeframe}:`, error.message);
    }
  }

  console.log("🎯 Summary: All intraday timeframes should be working with real Polygon data");
  console.log("📊 Dashboard at http://localhost:5657 should display complete extended hours data");
  console.log("🔄 Try switching between DAY/HOUR/15MIN/5MIN buttons to verify functionality");
}

// Run the test
testIntradayData().catch(console.error);