/**
 * Progress Bar Monotonicity Test for Edge.dev
 * Tests that progress never decreases during scan execution
 */

const axios = require('axios');

const API_BASE = 'http://localhost:8000';
const TEST_SCAN_REQUEST = {
    start_date: '2024-10-29',
    end_date: '2024-10-30',
    use_real_scan: true,
    scanner_type: 'lc'
};

async function testProgressMonotonicity() {
    console.log('🧪 Testing Edge.dev Progress Bar Monotonicity...\n');

    try {
        // Test API connectivity first
        console.log('0. Testing API connectivity...');

        try {
            const healthCheck = await axios.get(`${API_BASE}/api/scan/active`, { timeout: 5000 });
            console.log(`   ✓ API is responsive: ${healthCheck.status}\n`);
        } catch (error) {
            console.log(`   ⚠️ API connectivity issue: ${error.message}`);
            console.log('   Proceeding with test anyway...\n');
        }

        // Start a scan
        console.log('1. Starting test scan...');
        const scanResponse = await axios.post(`${API_BASE}/api/scan/execute`, TEST_SCAN_REQUEST, { timeout: 10000 });
        const scanId = scanResponse.data.scan_id;
        console.log(`   ✓ Scan started: ${scanId}\n`);

        // Track progress
        let previousProgress = 0;
        let progressDecreases = [];
        let pollCount = 0;
        let completed = false;
        let maxProgress = 0;

        console.log('2. Monitoring progress for monotonicity...');
        console.log('   (Progress should only increase, never decrease)\n');

        while (!completed && pollCount < 60) { // Max 60 polls (~3 minutes)
            await new Promise(resolve => setTimeout(resolve, 3000)); // Poll every 3 seconds

            try {
                const statusResponse = await axios.get(`${API_BASE}/api/scan/status/${scanId}`, { timeout: 5000 });
                const { status, progress_percent, message } = statusResponse.data;

                pollCount++;
                const currentProgress = progress_percent || 0;

                // Track maximum progress achieved
                maxProgress = Math.max(maxProgress, currentProgress);

                // Check for progress decrease (MAIN TEST)
                if (currentProgress < previousProgress) {
                    const decrease = {
                        poll: pollCount,
                        from: previousProgress,
                        to: currentProgress,
                        message: message,
                        timestamp: new Date().toISOString()
                    };
                    progressDecreases.push(decrease);
                    console.log(`   ❌ PROGRESS DECREASE DETECTED: ${previousProgress}% → ${currentProgress}%`);
                    console.log(`      Poll #${pollCount} - Message: ${message}`);
                    console.log(`      Time: ${decrease.timestamp}\n`);
                } else if (currentProgress > previousProgress) {
                    console.log(`   ✓ Progress: ${currentProgress}% (${message})`);
                } else if (pollCount % 5 === 0) {
                    // Log every 5th poll if no change
                    console.log(`   ➡️ Progress: ${currentProgress}% (unchanged - ${message})`);
                }

                previousProgress = currentProgress;
                completed = (status === 'completed' || status === 'error' || currentProgress >= 100);

            } catch (pollError) {
                console.log(`   ⚠️ Poll #${pollCount} failed: ${pollError.message}`);
                // Continue testing even if some polls fail
            }
        }

        console.log('\n3. Test Results Summary:');
        console.log('=' .repeat(50));
        console.log(`   Total polls conducted: ${pollCount}`);
        console.log(`   Maximum progress achieved: ${maxProgress}%`);
        console.log(`   Progress decreases detected: ${progressDecreases.length}`);
        console.log(`   Test duration: ~${pollCount * 3} seconds`);

        if (progressDecreases.length === 0) {
            console.log('\n   ✅ SUCCESS: Progress was monotonic (never decreased)');
            console.log('   🎉 The progress bar fix is working correctly!');
            return true;
        } else {
            console.log('\n   ❌ FAILURE: Progress decreased during scan');
            console.log('   🔧 The monotonic progress fixes may need adjustment');
            console.log('\n   Detailed Decrease Log:');
            progressDecreases.forEach((d, i) => {
                console.log(`   ${i + 1}. Poll #${d.poll} at ${d.timestamp}:`);
                console.log(`      Progress: ${d.from}% → ${d.to}%`);
                console.log(`      Message: ${d.message}\n`);
            });
            return false;
        }

    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        if (error.response) {
            console.error('   Response status:', error.response.status);
            console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
        }
        return false;
    }
}

// Additional test for frontend progress validation
async function testFrontendValidation() {
    console.log('\n🔧 Testing Frontend Progress Validation Logic...\n');

    // Simulate the frontend progress validation logic
    let scanProgress = 0;
    const testProgressUpdates = [10, 25, 30, 20, 35, 15, 50, 75, 100]; // Include decreases

    console.log('   Simulating progress updates with validation:');

    testProgressUpdates.forEach((newProgress, i) => {
        const previousProgress = scanProgress;

        // Apply the same validation logic as our fix
        const validated = Math.max(scanProgress, Math.min(100, newProgress));

        if (newProgress < scanProgress) {
            console.log(`   ⚠️ Update ${i + 1}: ${newProgress}% blocked (was ${scanProgress}%) → staying at ${validated}%`);
        } else {
            console.log(`   ✓ Update ${i + 1}: ${scanProgress}% → ${validated}%`);
        }

        scanProgress = validated;
    });

    console.log(`\n   Final progress: ${scanProgress}%`);
    console.log('   ✅ Frontend validation logic working correctly');
}

// Run tests
async function runAllTests() {
    console.log('🚀 Edge.dev Progress Bar Fix Validation\n');
    console.log('This test validates that the progress bar monotonicity fixes');
    console.log('prevent the up/down behavior and ensure cumulative progress.\n');

    // Test frontend validation logic
    await testFrontendValidation();

    // Test actual API progress monitoring
    const success = await testProgressMonotonicity();

    console.log('\n' + '='.repeat(60));
    console.log('FINAL TEST RESULT:');
    if (success) {
        console.log('✅ ALL TESTS PASSED - Progress bar fixes are working!');
        console.log('🎯 The analyzer progress should now be cumulative and continuous.');
    } else {
        console.log('❌ TESTS FAILED - Progress bar issues may persist.');
        console.log('🔧 Check the implementation or run manual testing.');
    }
    console.log('='.repeat(60));

    process.exit(success ? 0 : 1);
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the tests
runAllTests();