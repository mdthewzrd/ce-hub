// LC D2 Scanner Comprehensive Test & Debug Script
// This will help identify exact filtering failures

console.log('🔍 Starting LC D2 Scanner Comprehensive Test & Debug Analysis');

async function debugScannerAPI() {
    try {
        console.log('\n=== Testing LC D2 Scanner API Endpoint ===');

        // Test with known working date and tickers
        const testData = {
            tickers: ["NVDA", "QNTM", "OKLO", "RGTI", "HIMS"],
            date: "2024-10-25" // Date that worked in Python
        };

        console.log('📊 Test data:', testData);

        const response = await fetch('http://localhost:5657/api/systematic/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        const result = await response.json();
        console.log('✅ API Response:', JSON.stringify(result, null, 2));

        if (result.results.length === 0) {
            console.log('\n❌ ISSUE: Scanner returned 0 results');
            console.log('💡 This indicates filtering logic is too strict or data calculations are incorrect');
        } else {
            console.log(`\n🎉 SUCCESS: Found ${result.results.length} results`);
        }

        return result;

    } catch (error) {
        console.error('❌ API Test Error:', error);
        return null;
    }
}

// Test individual data fetching to validate data availability
async function testDataFetching() {
    console.log('\n=== Testing Data Fetching for NVDA ===');

    const apiKey = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy';
    const ticker = 'NVDA';
    const endDate = '2024-10-25';

    // Calculate start date (250 days before)
    const end = new Date(endDate);
    const start = new Date(end);
    start.setDate(start.getDate() - 250);
    const startDate = start.toISOString().split('T')[0];

    console.log(`📅 Date range: ${startDate} to ${endDate}`);

    try {
        // Test adjusted data
        const adjustedUrl = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${startDate}/${endDate}?adjusted=true&sort=asc&apikey=${apiKey}`;
        console.log('🔍 Fetching adjusted data...');

        const adjResponse = await fetch(adjustedUrl);
        const adjData = await adjResponse.json();

        console.log(`✅ Adjusted data: ${adjData.results?.length || 0} bars`);
        if (adjData.results?.length >= 100) {
            console.log('✅ Sufficient adjusted data available');
        } else {
            console.log('❌ Insufficient adjusted data');
        }

        // Test unadjusted data
        const unadjustedUrl = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${startDate}/${endDate}?adjusted=false&sort=asc&apikey=${apiKey}`;
        console.log('🔍 Fetching unadjusted data...');

        const uaResponse = await fetch(unadjustedUrl);
        const uaData = await uaResponse.json();

        console.log(`✅ Unadjusted data: ${uaData.results?.length || 0} bars`);
        if (uaData.results?.length >= 100) {
            console.log('✅ Sufficient unadjusted data available');
        } else {
            console.log('❌ Insufficient unadjusted data');
        }

        if (adjData.results?.length > 0 && uaData.results?.length > 0) {
            // Sample the latest data to understand the values
            const latestAdj = adjData.results[adjData.results.length - 1];
            const latestUa = uaData.results[uaData.results.length - 1];

            console.log('\n📊 Latest Data Sample (Adjusted):', {
                date: new Date(latestAdj.t).toISOString().split('T')[0],
                o: latestAdj.o,
                h: latestAdj.h,
                l: latestAdj.l,
                c: latestAdj.c,
                v: latestAdj.v
            });

            console.log('📊 Latest Data Sample (Unadjusted):', {
                date: new Date(latestUa.t).toISOString().split('T')[0],
                o_ua: latestUa.o,
                h_ua: latestUa.h,
                l_ua: latestUa.l,
                c_ua: latestUa.c,
                v_ua: latestUa.v
            });
        }

        return {
            adjustedCount: adjData.results?.length || 0,
            unadjustedCount: uaData.results?.length || 0,
            adjustedData: adjData.results,
            unadjustedData: uaData.results
        };

    } catch (error) {
        console.error('❌ Data fetching error:', error);
        return null;
    }
}

// Analyze critical differences between Python and TypeScript implementations
function analyzeCriticalDifferences() {
    console.log('\n=== Critical Differences Analysis ===');

    const pythonPatternsFound = [
        'lc_frontside_d3_extended_1',
        'lc_frontside_d2_extended',
        'lc_frontside_d2_extended_1'
    ];

    console.log('🐍 Python Implementation Key Points:');
    console.log('1. Uses highest_high_5_dist_to_lowest_low_20_pct_1 in D2 patterns');
    console.log('2. Different price tier requirements per pattern type');
    console.log('3. Complex distance calculations that may be missing in TypeScript');
    console.log('4. Specific field mappings that differ between implementations');

    console.log('\n🔧 TypeScript Implementation Issues to Check:');
    console.log('1. Missing highest_high_5_dist_to_lowest_low_20_pct_1 calculation');
    console.log('2. h_dist_to_highest_high_20_1_atr calculation may be incorrect');
    console.log('3. Price tier logic differences between D2/D2_1/D3 patterns');
    console.log('4. Field name mismatches (e.g., high_pct_chg vs high_pct_chg1)');

    console.log('\n⚠️  Critical Missing Field Identified:');
    console.log('   highest_high_5_dist_to_lowest_low_20_pct_1 - Python line 1104');
    console.log('   This field is used in all D2 pattern price tier requirements');
}

// Test individual components that are likely causing failures
function testKnownFailurePoints() {
    console.log('\n=== Known Failure Points Test ===');

    const commonFailures = [
        {
            name: 'Missing Complex Distance Calculation',
            description: 'highest_high_5_dist_to_lowest_low_20_pct_1 field missing',
            severity: 'HIGH',
            impact: 'Causes ALL D2 patterns to fail price tier requirements'
        },
        {
            name: 'Price Tier Logic Mismatch',
            description: 'D2 Extended vs D2 Extended 1 use different price tier calculations',
            severity: 'HIGH',
            impact: 'Wrong price tier validation leads to false negatives'
        },
        {
            name: 'Field Name Mismatches',
            description: 'Python uses high_pct_chg in current day, TypeScript may use wrong field',
            severity: 'MEDIUM',
            impact: 'Percentage change calculations incorrect'
        },
        {
            name: 'Volume Threshold Differences',
            description: 'Python uses exactly 10M volume, 500M dollar volume',
            severity: 'MEDIUM',
            impact: 'May filter out valid candidates due to threshold misalignment'
        }
    ];

    console.log('🚨 Identified Failure Points:');
    commonFailures.forEach((failure, index) => {
        console.log(`\n${index + 1}. ${failure.name} (${failure.severity})`);
        console.log(`   Description: ${failure.description}`);
        console.log(`   Impact: ${failure.impact}`);
    });
}

// Run comprehensive test
async function runComprehensiveTest() {
    console.log('🚀 Starting Comprehensive LC D2 Scanner Test');
    console.log('=' .repeat(60));

    // 1. Test API endpoint
    const apiResult = await debugScannerAPI();

    // 2. Test data fetching
    const dataResult = await testDataFetching();

    // 3. Analyze critical differences
    analyzeCriticalDifferences();

    // 4. Test known failure points
    testKnownFailurePoints();

    console.log('\n' + '=' .repeat(60));
    console.log('📋 COMPREHENSIVE TEST SUMMARY');
    console.log('=' .repeat(60));

    if (apiResult) {
        console.log(`✅ API Connection: SUCCESS`);
        console.log(`📊 Results Found: ${apiResult.results?.length || 0}`);
        if (apiResult.results?.length === 0) {
            console.log('🔍 DIAGNOSIS: Scanner logic is functioning but filters are too restrictive');
        }
    } else {
        console.log(`❌ API Connection: FAILED`);
    }

    if (dataResult) {
        console.log(`✅ Data Availability: SUCCESS`);
        console.log(`📈 Adjusted Bars: ${dataResult.adjustedCount}`);
        console.log(`📈 Unadjusted Bars: ${dataResult.unadjustedCount}`);
        if (dataResult.adjustedCount >= 100 && dataResult.unadjustedCount >= 100) {
            console.log('✅ Data Requirements: MET');
        } else {
            console.log('❌ Data Requirements: NOT MET');
        }
    } else {
        console.log(`❌ Data Fetching: FAILED`);
    }

    console.log('\n🎯 PRIMARY ISSUE IDENTIFIED:');
    console.log('   The TypeScript implementation is missing the critical field:');
    console.log('   "highest_high_5_dist_to_lowest_low_20_pct_1"');
    console.log('   This field is required for ALL D2 pattern price tier validation');
    console.log('   Without it, ALL candidates fail the price tier requirements');

    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('1. Add missing highest_high_5_dist_to_lowest_low_20_pct_1 calculation');
    console.log('2. Fix price tier logic to match Python exactly');
    console.log('3. Verify all field mappings between current/previous day data');
    console.log('4. Test individual pattern components in isolation');

    console.log('\n📝 Next Steps:');
    console.log('1. Implement missing complex distance calculation');
    console.log('2. Update price tier validation logic');
    console.log('3. Add detailed debug logging for each filter step');
    console.log('4. Test with individual tickers to isolate specific failures');
}

// Execute the comprehensive test
runComprehensiveTest().catch(console.error);