/**
 * Debug SMCI 2/18/25 Chart Rendering Issue
 * Test the global chart configuration with actual SMCI data
 */

async function debugSMCIChartIssue() {
    console.log('🔍 Debug: SMCI Chart Issue Investigation');
    console.log('=====================================');

    try {
        // Fetch SMCI data for 2/18/25
        const response = await fetch('http://localhost:8000/api/chart/SMCI?timeframe=5min&lc_date=2025-02-18&day_offset=0');
        const data = await response.json();

        console.log('📊 SMCI Data Analysis:');
        console.log(`   Total data points: ${data.chartData.x.length}`);
        console.log(`   Shapes: ${data.shapes.length}`);
        console.log(`   Date range: ${data.chartData.x[0]} to ${data.chartData.x[data.chartData.x.length - 1]}`);

        // Check for 2/18/25 specific data
        const feb18Data = data.chartData.x.filter(x => x.startsWith('2025-02-18'));
        console.log(`   2/18/25 data points: ${feb18Data.length}`);

        if (feb18Data.length > 0) {
            console.log(`   2/18/25 first timestamp: ${feb18Data[0]}`);
            console.log(`   2/18/25 last timestamp: ${feb18Data[feb18Data.length - 1]}`);
        }

        // Check OHLC values for flat line issue
        const lastIndex = data.chartData.x.length - 1;
        const last10Opens = data.chartData.open.slice(-10);
        const last10Highs = data.chartData.high.slice(-10);
        const last10Lows = data.chartData.low.slice(-10);
        const last10Closes = data.chartData.close.slice(-10);

        console.log('💹 Last 10 OHLC values:');
        console.log(`   Opens: ${JSON.stringify(last10Opens)}`);
        console.log(`   Highs: ${JSON.stringify(last10Highs)}`);
        console.log(`   Lows: ${JSON.stringify(last10Lows)}`);
        console.log(`   Closes: ${JSON.stringify(last10Closes)}`);

        // Check for identical values (flat line indicators)
        const allValuesIdentical = (arr) => arr.every(val => val === arr[0]);

        console.log('🔍 Flat Line Analysis:');
        console.log(`   All opens identical: ${allValuesIdentical(last10Opens)}`);
        console.log(`   All highs identical: ${allValuesIdentical(last10Highs)}`);
        console.log(`   All lows identical: ${allValuesIdentical(last10Lows)}`);
        console.log(`   All closes identical: ${allValuesIdentical(last10Closes)}`);

        // Check range calculation
        const allPrices = [
            ...data.chartData.open,
            ...data.chartData.high,
            ...data.chartData.low,
            ...data.chartData.close
        ].filter(p => p != null && !isNaN(p));

        const minPrice = Math.min(...allPrices);
        const maxPrice = Math.max(...allPrices);
        const priceRange = maxPrice - minPrice;

        console.log('📈 Price Range Analysis:');
        console.log(`   Min price: $${minPrice.toFixed(2)}`);
        console.log(`   Max price: $${maxPrice.toFixed(2)}`);
        console.log(`   Price range: $${priceRange.toFixed(2)}`);
        console.log(`   Range ratio: ${(priceRange / minPrice * 100).toFixed(2)}%`);

        // Check for Presidents' Day impact
        console.log('🇺🇸 Presidents\' Day Analysis:');
        const presidentsDay = '2025-02-17';
        const hasPresidentsDay = data.chartData.x.some(x => x.startsWith(presidentsDay));
        console.log(`   Contains Presidents\' Day data: ${hasPresidentsDay}`);

        // Check gap between Friday 2/14 and Tuesday 2/18
        const friday214 = data.chartData.x.filter(x => x.startsWith('2025-02-14'));
        const tuesday218 = data.chartData.x.filter(x => x.startsWith('2025-02-18'));

        console.log(`   Friday 2/14 data points: ${friday214.length}`);
        console.log(`   Tuesday 2/18 data points: ${tuesday218.length}`);

        if (friday214.length > 0) {
            console.log(`   Last Friday timestamp: ${friday214[friday214.length - 1]}`);
        }
        if (tuesday218.length > 0) {
            console.log(`   First Tuesday timestamp: ${tuesday218[0]}`);
        }

        // Sample comparison with another ticker
        console.log('\n🔄 Comparison with AAPL:');
        const aaplResponse = await fetch('http://localhost:8000/api/chart/AAPL?timeframe=5min&lc_date=2025-02-18&day_offset=0');
        const aaplData = await aaplResponse.json();

        const aaplFeb18Data = aaplData.chartData.x.filter(x => x.startsWith('2025-02-18'));
        const aaplLast10Closes = aaplData.chartData.close.slice(-10);

        console.log(`   AAPL 2/18/25 data points: ${aaplFeb18Data.length}`);
        console.log(`   AAPL last 10 closes: ${JSON.stringify(aaplLast10Closes)}`);
        console.log(`   AAPL all closes identical: ${allValuesIdentical(aaplLast10Closes)}`);

    } catch (error) {
        console.error('❌ Error in debug:', error);
    }
}

// For Node.js environment
if (typeof fetch === 'undefined') {
    const fetch = require('node-fetch');
    global.fetch = fetch;
}

// Run the debug
debugSMCIChartIssue();