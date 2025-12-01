#!/usr/bin/env node

/**
 * End-to-End Performance Validation Test
 * Tests the complete scan performance to validate <30 second target
 */

const https = require('http');
const fs = require('fs');

const BACKEND_URL = 'http://localhost:8000';
const TEST_RESULTS = [];
const PERFORMANCE_METRICS = [];

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

async function measureScanPerformance(scanConfig) {
    console.log(`📊 Testing scan performance for ${scanConfig.name}`);

    const startTime = Date.now();
    let scanId = null;
    let scanCompleted = false;
    let scanResults = [];
    let totalPolls = 0;

    try {
        // Start scan
        const scanResponse = await makeRequest(`${BACKEND_URL}/api/scan/execute`, 'POST', scanConfig.request);

        if (scanResponse.status === 200 && scanResponse.body.success) {
            scanId = scanResponse.body.scan_id;
            console.log(`   ✅ Scan started: ${scanId}`);

            // Poll for completion
            let attempts = 0;
            const maxAttempts = 60; // 10 minutes max
            let currentInterval = 5000; // Start with 5 seconds

            while (attempts < maxAttempts && !scanCompleted) {
                await new Promise(resolve => setTimeout(resolve, currentInterval));

                const statusResponse = await makeRequest(`${BACKEND_URL}/api/scan/status/${scanId}`);
                totalPolls++;
                attempts++;

                console.log(`   Poll ${attempts}: ${statusResponse.status} - ${statusResponse.body?.status || 'unknown'} (${statusResponse.body?.progress_percent || 0}%)`);

                if (statusResponse.status === 200) {
                    const scanData = statusResponse.body;

                    if (scanData.status === 'completed') {
                        scanCompleted = true;
                        scanResults = scanData.results || [];
                        console.log(`   ✅ Scan completed with ${scanResults.length} results`);
                        break;
                    } else if (scanData.status === 'error') {
                        console.log(`   ❌ Scan failed: ${scanData.message}`);
                        break;
                    }

                    // Implement backoff for running scans
                    if (scanData.status === 'running') {
                        currentInterval = Math.min(currentInterval * 1.2, 30000);
                    }
                } else if (statusResponse.status === 404) {
                    console.log(`   ⚠️  Scan ${scanId} not found`);
                    break;
                }
            }

        } else {
            throw new Error(`Scan start failed: ${scanResponse.status} - ${JSON.stringify(scanResponse.body)}`);
        }

    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return {
            success: false,
            error: error.message,
            duration: Date.now() - startTime
        };
    }

    const totalDuration = Date.now() - startTime;

    return {
        success: scanCompleted,
        scanId,
        duration: totalDuration,
        durationSeconds: totalDuration / 1000,
        totalPolls,
        resultsCount: scanResults.length,
        meetsPerformanceTarget: (totalDuration / 1000) <= 30
    };
}

async function testPerformanceValidation() {
    console.log('🔬 Starting End-to-End Performance Validation');
    console.log('=' * 60);

    // Wait for rate limit to reset (70 seconds to be safe)
    console.log('⏳ Waiting 70 seconds for rate limit reset...');
    await new Promise(resolve => setTimeout(resolve, 70000));

    // Test configurations
    const testConfigs = [
        {
            name: 'Real Scan - 3 Days',
            request: {
                start_date: '2024-10-28',
                end_date: '2024-10-30',
                use_real_scan: true,
                filters: {
                    lc_frontside_d2_extended: true,
                    min_gap: 0.5,
                    min_pm_vol: 5000000
                }
            }
        },
        {
            name: 'Real Scan - 1 Week',
            request: {
                start_date: '2024-10-21',
                end_date: '2024-10-27',
                use_real_scan: true,
                filters: {
                    lc_frontside_d2_extended: true,
                    min_gap: 1.0,
                    min_pm_vol: 10000000
                }
            }
        }
    ];

    for (let i = 0; i < testConfigs.length; i++) {
        const config = testConfigs[i];

        console.log(`\n📝 Test ${i + 1}: ${config.name}`);

        const performance = await measureScanPerformance(config);
        PERFORMANCE_METRICS.push(performance);

        if (performance.success) {
            console.log(`   📊 Duration: ${performance.durationSeconds.toFixed(1)} seconds`);
            console.log(`   📊 Results: ${performance.resultsCount} found`);
            console.log(`   📊 Total polls: ${performance.totalPolls}`);
            console.log(`   📊 Meets target (<30s): ${performance.meetsPerformanceTarget ? 'YES' : 'NO'}`);

            TEST_RESULTS.push({
                test: config.name,
                expected: 'Complete within 30 seconds',
                actual: `${performance.durationSeconds.toFixed(1)} seconds`,
                passed: performance.meetsPerformanceTarget,
                details: {
                    scan_id: performance.scanId,
                    duration_ms: performance.duration,
                    duration_seconds: performance.durationSeconds,
                    total_polls: performance.totalPolls,
                    results_count: performance.resultsCount,
                    meets_target: performance.meetsPerformanceTarget
                },
                timestamp: new Date().toISOString()
            });

        } else {
            console.log(`   ❌ Failed: ${performance.error}`);
            console.log(`   📊 Duration before failure: ${performance.duration / 1000} seconds`);

            TEST_RESULTS.push({
                test: config.name,
                expected: 'Successful completion',
                actual: 'error',
                passed: false,
                details: {
                    error: performance.error,
                    duration_before_failure: performance.duration
                },
                timestamp: new Date().toISOString()
            });
        }

        // Wait between tests to avoid rate limiting
        if (i < testConfigs.length - 1) {
            console.log('   ⏳ Waiting 70 seconds before next test...');
            await new Promise(resolve => setTimeout(resolve, 70000));
        }
    }

    // Test 3: Resource usage validation
    console.log('\n📝 Test 3: Resource usage and concurrency validation');

    try {
        const performanceInfo = await makeRequest(`${BACKEND_URL}/api/performance`);

        if (performanceInfo.status === 200) {
            const perfData = performanceInfo.body;

            console.log(`   📊 Max concurrent scans: ${perfData.max_concurrent_scans}`);
            console.log(`   📊 Active scans: ${perfData.active_scans}`);
            console.log(`   📊 CPU cores available: ${perfData.cpu_cores}`);
            console.log(`   📊 Rate limit: ${perfData.rate_limit}`);

            const resourcesOptimal = perfData.max_concurrent_scans === 2 &&
                                   perfData.active_scans <= 2 &&
                                   perfData.cpu_cores >= 4;

            TEST_RESULTS.push({
                test: 'Resource usage validation',
                expected: 'Optimal resource configuration',
                actual: `${perfData.max_concurrent_scans} max concurrent, ${perfData.active_scans} active`,
                passed: resourcesOptimal,
                details: perfData,
                timestamp: new Date().toISOString()
            });

            console.log(`   📊 Resource configuration: ${resourcesOptimal ? 'OPTIMAL' : 'NEEDS REVIEW'}`);

        } else {
            throw new Error(`Performance info request failed: ${performanceInfo.status}`);
        }

    } catch (error) {
        console.log(`   ❌ Resource validation error: ${error.message}`);
        TEST_RESULTS.push({
            test: 'Resource usage validation',
            expected: 'Successful resource check',
            actual: 'error',
            passed: false,
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }

    // Calculate overall performance metrics
    const successfulScans = PERFORMANCE_METRICS.filter(p => p.success);
    const avgDuration = successfulScans.length > 0 ?
        successfulScans.reduce((sum, p) => sum + p.durationSeconds, 0) / successfulScans.length : 0;
    const allMeetTarget = successfulScans.every(p => p.meetsPerformanceTarget);

    console.log('\n📊 PERFORMANCE SUMMARY');
    console.log('=' * 60);
    console.log(`Successful scans: ${successfulScans.length}/${PERFORMANCE_METRICS.length}`);
    console.log(`Average duration: ${avgDuration.toFixed(1)} seconds`);
    console.log(`All meet target (<30s): ${allMeetTarget ? 'YES' : 'NO'}`);

    // Generate test report
    console.log('\n📊 PERFORMANCE VALIDATION TEST RESULTS');
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
    const reportPath = '/Users/michaeldurante/ai dev/ce-hub/edge-dev/performance_validation_test_results.json';
    fs.writeFileSync(reportPath, JSON.stringify({
        summary: {
            total_tests: totalTests,
            passed_tests: passedTests,
            success_rate: `${((passedTests / totalTests) * 100).toFixed(1)}%`,
            average_duration_seconds: avgDuration,
            all_meet_performance_target: allMeetTarget,
            test_timestamp: new Date().toISOString()
        },
        test_results: TEST_RESULTS,
        performance_metrics: PERFORMANCE_METRICS
    }, null, 2));

    console.log(`📄 Detailed results saved to: ${reportPath}`);

    return {
        passed: passedTests,
        total: totalTests,
        success_rate: (passedTests / totalTests) * 100,
        performanceTarget: allMeetTarget
    };
}

// Run the tests
testPerformanceValidation()
    .then(summary => {
        console.log(`\n🎯 Final Summary: ${summary.success_rate.toFixed(1)}% success rate`);
        console.log(`🎯 Performance Target Met: ${summary.performanceTarget ? 'YES' : 'NO'}`);
        process.exit(summary.success_rate >= 75 && summary.performanceTarget ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });