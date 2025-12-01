/**
 * Debug Rangebreak Issue for SMCI 2/18/25 Charts
 * Test if the hardcoded Presidents' Day rangebreak is causing rendering issues
 */

// Mock data similar to SMCI structure
const mockSMCIData = {
    x: [
        "2025-02-14T19:50:00", "2025-02-14T19:55:00", // Friday end
        "2025-02-18T04:00:00", "2025-02-18T04:05:00", "2025-02-18T04:10:00", // Tuesday start
        "2025-02-18T09:25:00", "2025-02-18T09:30:00", "2025-02-18T09:35:00", // Market open
        "2025-02-18T19:50:00", "2025-02-18T19:55:00"  // Tuesday end
    ],
    open: [48.5, 48.6, 48.7, 48.8, 48.9, 49.0, 49.1, 49.2, 49.3, 49.4],
    high: [48.7, 48.8, 48.9, 49.0, 49.1, 49.2, 49.3, 49.4, 49.5, 49.6],
    low: [48.3, 48.4, 48.5, 48.6, 48.7, 48.8, 48.9, 49.0, 49.1, 49.2],
    close: [48.6, 48.7, 48.8, 48.9, 49.0, 49.1, 49.2, 49.3, 49.4, 49.5],
    volume: [100000, 110000, 120000, 130000, 140000, 150000, 160000, 170000, 180000, 190000]
};

function generateRangebreaksWithPresidentsDay() {
    const rangebreaks = [];

    // Weekend rangebreak
    rangebreaks.push({ bounds: ["sat", "mon"] });

    // PROBLEMATIC: Hardcoded Presidents' Day rangebreak
    rangebreaks.push({
        bounds: ["2025-02-14T20:00:00", "2025-02-18T09:30:00"]
    });

    return rangebreaks;
}

function generateRangebreaksWithoutPresidentsDay() {
    const rangebreaks = [];

    // Weekend rangebreak only
    rangebreaks.push({ bounds: ["sat", "mon"] });

    return rangebreaks;
}

function analyzeRangebreakImpact(data, rangebreaks) {
    console.log('📊 Rangebreak Analysis:');
    console.log(`   Total rangebreaks: ${rangebreaks.length}`);

    rangebreaks.forEach((rb, index) => {
        console.log(`   Rangebreak ${index + 1}:`, rb);
    });

    // Check which data points fall within rangebreak bounds
    const presidentsRangebreak = rangebreaks.find(rb =>
        rb.bounds && rb.bounds[0] === "2025-02-14T20:00:00"
    );

    if (presidentsRangebreak) {
        console.log('🎯 Presidents\' Day Rangebreak Impact:');
        const hiddenPoints = data.x.filter(timestamp => {
            const ts = new Date(timestamp);
            const startBound = new Date("2025-02-14T20:00:00");
            const endBound = new Date("2025-02-18T09:30:00");

            return ts >= startBound && ts <= endBound;
        });

        console.log(`   Hidden timestamps: ${hiddenPoints.length}`);
        console.log(`   Hidden range: ${hiddenPoints[0]} to ${hiddenPoints[hiddenPoints.length - 1]}`);

        // This could cause visual issues if it hides too much data or creates gaps
        console.log('❗ Potential Issues:');
        console.log(`   - Hides ${hiddenPoints.length} data points`);
        console.log(`   - Creates gap of ${(new Date("2025-02-18T09:30:00") - new Date("2025-02-14T20:00:00")) / (1000 * 60 * 60)} hours`);
        console.log(`   - May compress chart visualization`);

    } else {
        console.log('✅ No Presidents\' Day rangebreak found');
    }

    return presidentsRangebreak !== undefined;
}

function debugRangebreakIssue() {
    console.log('🔍 Debug: SMCI Rangebreak Issue Investigation');
    console.log('============================================');

    console.log('\n📈 Test Data Structure:');
    console.log(`   Data points: ${mockSMCIData.x.length}`);
    console.log(`   Date range: ${mockSMCIData.x[0]} to ${mockSMCIData.x[mockSMCIData.x.length - 1]}`);

    console.log('\n🔍 Analysis WITH Presidents\' Day Rangebreak:');
    const rangebreaksWithPD = generateRangebreaksWithPresidentsDay();
    const hasPresidentsRangebreak = analyzeRangebreakImpact(mockSMCIData, rangebreaksWithPD);

    console.log('\n✅ Analysis WITHOUT Presidents\' Day Rangebreak:');
    const rangebreaksWithoutPD = generateRangebreaksWithoutPresidentsDay();
    analyzeRangebreakImpact(mockSMCIData, rangebreaksWithoutPD);

    console.log('\n🎯 ROOT CAUSE ANALYSIS:');
    if (hasPresidentsRangebreak) {
        console.log('❌ ISSUE IDENTIFIED: Hardcoded Presidents\' Day rangebreak');
        console.log('   Location: globalChartConfig.ts line 225-228');
        console.log('   Problem: rangebreaks.push({ bounds: ["2025-02-14T20:00:00", "2025-02-18T09:30:00"] });');
        console.log('   Impact: Hides market data from 2/14 8PM to 2/18 9:30AM');
        console.log('   Symptoms: Charts appear compressed/flattened on 2/18/25');

        console.log('\n📋 RECOMMENDED FIX:');
        console.log('1. Remove or modify the hardcoded Presidents\' Day rangebreak');
        console.log('2. Use dynamic holiday detection instead of hardcoded dates');
        console.log('3. Apply rangebreaks only when necessary (holidays, weekends)');
        console.log('4. Test with SMCI and other tickers on 2/18/25');
    } else {
        console.log('✅ No issues detected with rangebreaks');
    }
}

// Run the debug analysis
debugRangebreakIssue();