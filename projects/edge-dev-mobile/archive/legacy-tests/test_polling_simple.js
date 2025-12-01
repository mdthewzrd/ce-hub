#!/usr/bin/env node

/**
 * Simplified Polling Optimization Test
 * Tests the backend scan completion patterns and polling behavior
 */

const https = require('http');
const fs = require('fs');

const BACKEND_URL = 'http://localhost:8000';
const TEST_RESULTS = [];
const POLLING_LOG = [];

async function makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data) {
            const postData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const result = {
                        status: res.statusCode,
                        headers: res.headers,
                        body: body ? JSON.parse(body) : null,
                        timestamp: new Date().toISOString()
                    };
                    resolve(result);
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: body,
                        timestamp: new Date().toISOString()
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function simulatePollingBehavior(scanId) {
    console.log(`📊 Simulating optimized polling for scan: ${scanId}`);

    const pollingPatterns = [];
    let currentInterval = 5000; // Start with 5 seconds
    const maxInterval = 30000; // Max 30 seconds
    const backoffMultiplier = 1.2; // Gradual increase
    const maxAttempts = 50;

    let attempt = 0;
    let scanComplete = false;
    const startTime = Date.now();

    while (attempt < maxAttempts && !scanComplete) {
        const pollStartTime = Date.now();

        try {
            const response = await makeRequest(`${BACKEND_URL}/api/scan/status/${scanId}`);

            const pollData = {
                attempt: attempt + 1,
                interval: currentInterval,
                status: response.status,
                scanStatus: response.body?.status || 'unknown',
                timestamp: new Date().toISOString(),
                elapsed: Date.now() - startTime
            };

            pollingPatterns.push(pollData);
            POLLING_LOG.push(pollData);

            console.log(`   Poll ${attempt + 1}: ${response.status} (${response.body?.status}) - interval: ${currentInterval}ms`);

            if (response.status === 200) {
                const scanData = response.body;

                if (scanData.status === 'completed' || scanData.status === 'error') {
                    scanComplete = true;
                    console.log(`   ✅ Scan completed with status: ${scanData.status}`);
                    break;
                }

                if (scanData.status === 'running') {
                    // Implement exponential backoff for running scans
                    currentInterval = Math.min(currentInterval * backoffMultiplier, maxInterval);
                }
            } else if (response.status === 404) {
                console.log(`   ⚠️  Scan ${scanId} not found (expired)`);
                break;
            }

        } catch (error) {
            console.log(`   ❌ Poll error: ${error.message}`);
            pollingPatterns.push({
                attempt: attempt + 1,
                interval: currentInterval,
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString(),
                elapsed: Date.now() - startTime
            });
        }

        attempt++;

        // Wait for the current interval before next poll
        if (!scanComplete && attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, currentInterval));
        }
    }

    const totalTime = Date.now() - startTime;

    return {
        pollingPatterns,
        totalTime,
        totalPolls: attempt,
        scanCompleted: scanComplete,
        averageInterval: totalTime / attempt
    };
}

async function testPollingOptimization() {
    console.log('🔬 Starting Simplified Polling Optimization Tests');
    console.log('=' * 60);

    // Test 1: Start a real scan and measure polling patterns
    console.log('\n📝 Test 1: Real scan with optimized polling');

    const scanRequest = {
        start_date: '2024-10-28',
        end_date: '2024-10-30',
        use_real_scan: true, // Use real scan to test actual performance
        filters: {
            lc_frontside_d2_extended: true,
            min_gap: 0.5
        }
    };

    let scanId = null;
    let pollingResults = null;

    try {
        // Start scan
        const scanResponse = await makeRequest(`${BACKEND_URL}/api/scan/execute`, 'POST', scanRequest);

        if (scanResponse.status === 200 && scanResponse.body.success) {
            scanId = scanResponse.body.scan_id;
            console.log(`   ✅ Scan started: ${scanId}`);

            // Simulate optimized polling
            pollingResults = await simulatePollingBehavior(scanId);

            console.log(`   📊 Total polling time: ${pollingResults.totalTime}ms`);
            console.log(`   📊 Total polls: ${pollingResults.totalPolls}`);
            console.log(`   📊 Average interval: ${Math.round(pollingResults.averageInterval)}ms`);
            console.log(`   📊 Scan completed: ${pollingResults.scanCompleted}`);

            // Verify exponential backoff
            const intervals = pollingResults.pollingPatterns.map(p => p.interval);
            const hasExponentialBackoff = intervals.length >= 3 &&
                                         intervals[0] <= 5000 &&
                                         intervals[1] >= 6000 &&
                                         intervals[2] >= 7000;

            TEST_RESULTS.push({
                test: 'Real scan with optimized polling',
                expected: 'Exponential backoff and completion',
                actual: `${pollingResults.totalPolls} polls, backoff: ${hasExponentialBackoff}`,
                passed: pollingResults.scanCompleted && hasExponentialBackoff,
                details: {
                    scan_id: scanId,
                    total_time: pollingResults.totalTime,
                    total_polls: pollingResults.totalPolls,
                    average_interval: pollingResults.averageInterval,
                    exponential_backoff: hasExponentialBackoff,
                    intervals_sample: intervals.slice(0, 5)
                },
                timestamp: new Date().toISOString()
            });

        } else {
            console.log(`   ❌ Failed to start scan: ${scanResponse.status}`);
            TEST_RESULTS.push({
                test: 'Real scan with optimized polling',
                expected: 'Successful scan start',
                actual: `HTTP ${scanResponse.status}`,
                passed: false,
                details: scanResponse.body,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.log(`   ❌ Test error: ${error.message}`);
        TEST_RESULTS.push({
            test: 'Real scan with optimized polling',
            expected: 'Successful execution',
            actual: 'error',
            passed: false,
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }

    // Test 2: Performance comparison - calculate improvement
    console.log('\n📝 Test 2: Performance improvement calculation');

    if (pollingResults) {
        // Calculate baseline (old system: poll every 5 seconds consistently)
        const estimatedOldSystemPolls = Math.ceil(pollingResults.totalTime / 5000);
        const actualPolls = pollingResults.totalPolls;
        const reductionPercentage = ((estimatedOldSystemPolls - actualPolls) / estimatedOldSystemPolls) * 100;

        console.log(`   📊 Estimated old system polls: ${estimatedOldSystemPolls}`);
        console.log(`   📊 Actual optimized polls: ${actualPolls}`);
        console.log(`   📊 Polling reduction: ${reductionPercentage.toFixed(1)}%`);

        TEST_RESULTS.push({
            test: 'Polling frequency reduction',
            expected: '60%+ reduction from baseline',
            actual: `${reductionPercentage.toFixed(1)}% reduction`,
            passed: reductionPercentage >= 60,
            details: {
                estimated_old_polls: estimatedOldSystemPolls,
                actual_optimized_polls: actualPolls,
                reduction_percentage: reductionPercentage,
                baseline_description: 'Poll every 5 seconds consistently',
                optimized_description: 'Exponential backoff with coordination'
            },
            timestamp: new Date().toISOString()
        });
    }

    // Test 3: Verify scan completion performance target
    console.log('\n📝 Test 3: Scan completion performance validation');

    if (pollingResults && pollingResults.scanCompleted) {
        const scanCompletionTime = pollingResults.totalTime / 1000; // Convert to seconds
        const meetsPerfTarget = scanCompletionTime <= 30; // Target: <30 seconds

        console.log(`   📊 Scan completion time: ${scanCompletionTime.toFixed(1)} seconds`);
        console.log(`   📊 Performance target (<30s): ${meetsPerfTarget ? 'MET' : 'NOT MET'}`);

        TEST_RESULTS.push({
            test: 'Scan completion performance',
            expected: 'Complete within 30 seconds',
            actual: `${scanCompletionTime.toFixed(1)} seconds`,
            passed: meetsPerfTarget,
            details: {
                completion_time_seconds: scanCompletionTime,
                target_seconds: 30,
                meets_target: meetsPerfTarget
            },
            timestamp: new Date().toISOString()
        });
    }

    // Generate test report
    console.log('\n📊 POLLING OPTIMIZATION TEST RESULTS');
    console.log('=' * 60);

    const passedTests = TEST_RESULTS.filter(t => t.passed).length;
    const totalTests = TEST_RESULTS.length;

    console.log(`Overall: ${passedTests}/${totalTests} tests passed\n`);

    TEST_RESULTS.forEach((test, i) => {
        const status = test.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${i + 1}. ${test.test}`);
        console.log(`   ${status} - Expected: ${test.expected}, Actual: ${test.actual}`);
        console.log(`   Timestamp: ${test.timestamp}\n`);
    });

    // Save detailed results
    const reportPath = '/Users/michaeldurante/ai dev/ce-hub/edge-dev/polling_optimization_test_results.json';
    fs.writeFileSync(reportPath, JSON.stringify({
        summary: {
            total_tests: totalTests,
            passed_tests: passedTests,
            success_rate: `${((passedTests / totalTests) * 100).toFixed(1)}%`,
            test_timestamp: new Date().toISOString()
        },
        test_results: TEST_RESULTS,
        polling_log: POLLING_LOG
    }, null, 2));

    console.log(`📄 Detailed results saved to: ${reportPath}`);

    return {
        passed: passedTests,
        total: totalTests,
        success_rate: (passedTests / totalTests) * 100
    };
}

// Run the tests
testPollingOptimization()
    .then(summary => {
        console.log(`\n🎯 Final Summary: ${summary.success_rate.toFixed(1)}% success rate`);
        process.exit(summary.success_rate >= 70 ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });