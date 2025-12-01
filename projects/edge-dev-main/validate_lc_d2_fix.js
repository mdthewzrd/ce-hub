// LC D2 Scanner Fix Validation Script
// Run this after implementing the critical fixes to verify they work

console.log('🔧 LC D2 Scanner Fix Validation Script');
console.log('=' .repeat(50));

async function validateFix() {
    try {
        // Test the scanner with the same parameters that should now work
        const testData = {
            tickers: ["NVDA", "TSLA", "SMCI"],
            date: "2024-10-25"
        };

        console.log('📊 Testing with:', testData);

        const response = await fetch('http://localhost:5657/api/systematic/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        const result = await response.json();

        console.log('\n📋 VALIDATION RESULTS:');
        console.log('=' .repeat(50));

        if (result.results && result.results.length > 0) {
            console.log('✅ SUCCESS: Scanner now returns results!');
            console.log(`📈 Results found: ${result.results.length}`);

            console.log('\n📊 Sample Result:');
            const sample = result.results[0];
            console.log(JSON.stringify(sample, null, 2));

            // Validate that the fix includes the critical field
            const hasRequiredField = sample.highest_high_5_dist_to_lowest_low_20_pct_1 !== undefined;
            if (hasRequiredField) {
                console.log('✅ Critical field present: highest_high_5_dist_to_lowest_low_20_pct_1');
            } else {
                console.log('❌ Critical field still missing: highest_high_5_dist_to_lowest_low_20_pct_1');
            }

        } else {
            console.log('❌ FAILED: Scanner still returns 0 results');
            console.log('🔍 Check that all critical fixes were implemented:');
            console.log('  1. highest_high_5_dist_to_lowest_low_20_pct_1 calculation added');
            console.log('  2. Price tier logic updated with distance requirements');
            console.log('  3. Enhanced price tier logic for D2 Extended 1');
        }

        console.log('\n📝 Full Response:');
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('❌ Validation Error:', error);
    }
}

// Helper function to test individual components
async function testIndividualComponents() {
    console.log('\n🧪 Individual Component Tests:');
    console.log('=' .repeat(50));

    // Test with a single ticker to isolate issues
    const singleTickerTest = {
        tickers: ["NVDA"],
        date: "2024-10-25"
    };

    try {
        const response = await fetch('http://localhost:5657/api/systematic/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(singleTickerTest)
        });

        const result = await response.json();

        if (result.results && result.results.length > 0) {
            console.log('✅ Single ticker test: PASS');

            const nvdaResult = result.results[0];
            console.log('\n📊 NVDA Pattern Analysis:');
            console.log(`  🎯 Pattern Types Found:`);
            console.log(`     - D2 Extended: ${nvdaResult.lc_frontside_d2_extended || false}`);
            console.log(`     - D2 Extended 1: ${nvdaResult.lc_frontside_d2_extended_1 || false}`);
            console.log(`     - D3 Extended 1: ${nvdaResult.lc_frontside_d3_extended_1 || false}`);

            console.log(`  📈 Key Metrics:`);
            console.log(`     - Parabolic Score: ${nvdaResult.parabolic_score || 'N/A'}`);
            console.log(`     - Volume: ${nvdaResult.volume?.toLocaleString() || 'N/A'}`);
            console.log(`     - Price: $${nvdaResult.close || 'N/A'}`);

        } else {
            console.log('❌ Single ticker test: FAIL');
            console.log('   Even NVDA on 2024-10-25 should pass with correct implementation');
        }

    } catch (error) {
        console.error('❌ Individual component test error:', error);
    }
}

// Run validation
async function runValidation() {
    await validateFix();
    await testIndividualComponents();

    console.log('\n🎯 VALIDATION SUMMARY:');
    console.log('=' .repeat(50));
    console.log('If you see results above, the critical fixes are working!');
    console.log('If you see 0 results, check the implementation against the report.');
}

runValidation().catch(console.error);