/**
 * Verification Script: Check if Test Scan Appears in UI
 *
 * Run this script after adding the test scan to verify it works correctly
 */

(function() {
    'use strict';

    console.log('🔍 CE-Hub Saved Scans Verification Script');
    console.log('==========================================');

    // Check localStorage
    const storage = localStorage.getItem('traderra_saved_scans');
    if (!storage) {
        console.log('❌ No saved scans found in localStorage');
        return;
    }

    let parsedStorage;
    try {
        parsedStorage = JSON.parse(storage);
    } catch (error) {
        console.log('❌ Error parsing saved scans:', error);
        return;
    }

    console.log('✅ Found saved scans in localStorage');
    console.log('   Storage Version:', parsedStorage.version);
    console.log('   Total Scans:', parsedStorage.scans.length);

    // Look for our test scan
    const testScan = parsedStorage.scans.find(scan =>
        scan.name && scan.name.includes('Test LC Scanner')
    );

    if (!testScan) {
        console.log('❌ Test scan not found in storage');
        console.log('   Available scans:');
        parsedStorage.scans.forEach((scan, index) => {
            console.log(`     ${index + 1}. ${scan.name}`);
        });
        return;
    }

    console.log('✅ Test scan found in storage!');
    console.log('   Scan ID:', testScan.id);
    console.log('   Name:', testScan.name);
    console.log('   Results Count:', testScan.resultCount);
    console.log('   Is Favorite:', testScan.isFavorite);
    console.log('   Created At:', testScan.createdAt);

    // Verify results data
    if (testScan.results && Array.isArray(testScan.results)) {
        console.log('   Results:');
        testScan.results.forEach((result, index) => {
            console.log(`     ${index + 1}. ${result.symbol} (${result.date}) - Gap: ${result.gap_percent}%, Signal: ${result.signal_strength}`);
        });
    } else {
        console.log('❌ No results found in test scan');
    }

    // Check if UI components are likely to find this scan
    console.log('');
    console.log('🎯 UI Compatibility Check:');
    console.log('   ✅ Has required fields:', !!(testScan.id && testScan.name && testScan.scanParams));
    console.log('   ✅ Has scan parameters:', !!(testScan.scanParams && testScan.scanParams.start_date && testScan.scanParams.end_date));
    console.log('   ✅ Has results count:', typeof testScan.resultCount === 'number');
    console.log('   ✅ Has created date:', !!testScan.createdAt);

    console.log('');
    console.log('💡 Next Steps:');
    console.log('   1. Refresh localhost:5665/scan');
    console.log('   2. The saved scans sidebar should show the test scan');
    console.log('   3. The scan should be marked as favorite (⭐)');
    console.log('   4. Click on the scan to load it');

})();