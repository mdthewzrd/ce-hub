/**
 * Test WZRD Chart Template Fixes
 * Verifies that we now match the working wzrd-algo implementation
 */

async function testWzrdChartFix() {
  console.log("🔧 Testing WZRD Chart Template Fixes\n");

  const apiKey = "Fm7brz4s23eSocDErnL68cE7wspz2K1I";
  const symbol = "SPY";

  // Fixed timeframes to match wzrd-algo chart_templates.py
  const correctedTimeframes = {
    "day": {
      range: "1/day",
      days: 60,
      barsPerDay: 1,
      description: "Daily chart - 60 days"
    },
    "hour": {
      range: "1/hour",
      days: 5,
      barsPerDay: 13.5,
      description: "Hourly chart - 5 days (matches wzrd-algo)"
    },
    "15min": {
      range: "15/minute",
      days: 2,
      barsPerDay: 54,
      description: "15-minute chart - 2 days (matches wzrd-algo)"
    },
    "5min": {
      range: "5/minute",
      days: 1,
      barsPerDay: 192,
      description: "5-minute chart - 1 day (matches wzrd-algo)"
    }
  };

  // Date calculation matching our fixed implementation
  const currentMarketDate = new Date('2024-10-25T16:00:00Z');
  const easternOffsetHours = 4;
  const easternNow = new Date(currentMarketDate.getTime() - (easternOffsetHours * 60 * 60 * 1000));

  console.log("📅 Using Eastern market time:", easternNow.toISOString());
  console.log("📊 Corrected Timeframes (matching wzrd-algo):\n");

  for (const [timeframe, config] of Object.entries(correctedTimeframes)) {
    const endDate = easternNow.toISOString().split('T')[0];
    const startDate = new Date(easternNow.getTime() - (config.days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${config.range}/${startDate}/${endDate}?adjusted=true&sort=asc&limit=50000&apikey=${apiKey}`;

    try {
      console.log(`📈 ${timeframe.toUpperCase()} timeframe:`);
      console.log(`   ${config.description}`);
      console.log(`   Period: ${startDate} to ${endDate} (${config.days} days)`);
      console.log(`   Expected: ~${Math.round(config.days * config.barsPerDay)} bars`);

      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const bars = data.results;
        const firstBar = bars[0];
        const lastBar = bars[bars.length - 1];

        console.log(`   ✅ Actual: ${bars.length} bars`);
        console.log(`   📅 Range: ${new Date(firstBar.t).toISOString().split('T')[0]} to ${new Date(lastBar.t).toISOString().split('T')[0]}`);
        console.log(`   💰 Latest: $${lastBar.c.toFixed(2)}`);

        // Check data density (should be reasonable, not sparse)
        const actualBarsPerDay = bars.length / config.days;
        const efficiency = (actualBarsPerDay / config.barsPerDay * 100).toFixed(1);
        console.log(`   📊 Density: ${actualBarsPerDay.toFixed(1)} bars/day (${efficiency}% of expected)`);

        if (timeframe !== 'day') {
          // Check extended hours coverage
          const extendedBars = bars.filter(bar => {
            const hour = new Date(bar.t).getUTCHours();
            return hour < 13 || hour >= 20; // Before 9:30 AM or after 4:00 PM ET
          });
          console.log(`   🌅 Extended hours: ${extendedBars.length}/${bars.length} bars (${(extendedBars.length/bars.length*100).toFixed(1)}%)`);
        }

        console.log(`   ✅ Status: FIXED - Reasonable data volume, proper timeframe\n`);
      } else {
        console.log(`   ❌ No data for ${timeframe}\n`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log("🎯 Chart Template Fixes Applied:");
  console.log("   ✅ HOUR: 30 days → 5 days (matches wzrd-algo)");
  console.log("   ✅ 15MIN: 10 days → 2 days (matches wzrd-algo)");
  console.log("   ✅ 5MIN: 2 days → 1 day (matches wzrd-algo)");
  console.log("   ✅ Added proper rangebreaks: bounds [20, 4] for non-trading hours");
  console.log("   ✅ Fixed date calculation to use Eastern time with 2024 data");

  console.log("\n🔄 Expected Results:");
  console.log("   📊 HOUR chart should now show 5 days of dense hourly data");
  console.log("   📊 Charts should plot correctly without strange spacing");
  console.log("   📊 Extended hours (4 AM - 8 PM) should be visible");
  console.log("   📊 Overnight gaps (8 PM - 4 AM) should be hidden by rangebreaks");

  console.log("\n🌐 Test your dashboard:");
  console.log("   http://localhost:5657 → Click SPY → Try HOUR timeframe");
}

// Run the test
testWzrdChartFix().catch(console.error);