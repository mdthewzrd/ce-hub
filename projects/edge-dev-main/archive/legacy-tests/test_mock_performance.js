#!/usr/bin/env node

/**
 * Mock Performance Test to validate optimization impact
 */

const https = require('http');
const fs = require('fs');

const BACKEND_URL = 'http://localhost:8000';
const TEST_RESULTS = [];

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

async function testMockPerformance() {
    console.log('🔬 Starting Mock Performance Validation');
    console.log('=' * 60);

    // Wait for potential rate limit reset
    console.log('⏳ Waiting 75 seconds for clean slate...');
    await new Promise(resolve => setTimeout(resolve, 75000));

    // Test mock scan performance (should be instant)
    console.log('\n📝 Test 1: Mock scan performance validation');

    const mockScanRequest = {
        start_date: '2024-10-28',
        end_date: '2024-10-30',
        use_real_scan: false, // Mock scan for performance testing
        filters: {
            lc_frontside_d2_extended: true,
            min_gap: 0.5
        }
    };

    try {
        const startTime = Date.now();
        const response = await makeRequest(`${BACKEND_URL}/api/scan/execute`, 'POST', mockScanRequest);
        const duration = Date.now() - startTime;

        console.log(`   📊 Response time: ${duration}ms`);
        console.log(`   📊 Status: ${response.status}`);

        if (response.status === 200 && response.body.success) {
            const results = response.body.results || [];
            const isInstant = duration < 1000; // Should be under 1 second

            console.log(`   📊 Results count: ${results.length}`);
            console.log(`   📊 Instant response: ${isInstant ? 'YES' : 'NO'}`);

            TEST_RESULTS.push({
                test: 'Mock scan performance',
                expected: 'Instant response (<1s)',
                actual: `${duration}ms`,
                passed: isInstant && response.body.success,
                details: {
                    duration_ms: duration,
                    results_count: results.length,
                    scan_id: response.body.scan_id
                },
                timestamp: new Date().toISOString()
            });

        } else {
            console.log(`   ❌ Mock scan failed: ${response.status}`);
            TEST_RESULTS.push({
                test: 'Mock scan performance',
                expected: 'Successful mock scan',
                actual: `HTTP ${response.status}`,
                passed: false,
                details: response.body,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        TEST_RESULTS.push({
            test: 'Mock scan performance',
            expected: 'Successful execution',
            actual: 'error',
            passed: false,
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }

    // Test 2: Validate optimizations are in place
    console.log('\n📝 Test 2: Optimization configuration validation');

    try {
        const perfResponse = await makeRequest(`${BACKEND_URL}/api/performance`);

        if (perfResponse.status === 200) {
            const perfData = perfResponse.body;

            // Check key optimization parameters
            const hasRateLimit = perfData.rate_limit === "2 scans per minute per IP";
            const hasConcurrencyControl = perfData.max_concurrent_scans === 2;
            const hasCleanup = perfData.scan_cleanup_interval === "3600 seconds";

            console.log(`   📊 Rate limiting: ${hasRateLimit ? 'CONFIGURED' : 'MISSING'}`);
            console.log(`   📊 Concurrency control: ${hasConcurrencyControl ? 'CONFIGURED' : 'MISSING'}`);
            console.log(`   📊 Scan cleanup: ${hasCleanup ? 'CONFIGURED' : 'MISSING'}`);

            const allOptimizationsPresent = hasRateLimit && hasConcurrencyControl && hasCleanup;

            TEST_RESULTS.push({
                test: 'Optimization configuration',
                expected: 'All optimizations configured',
                actual: `Rate limit: ${hasRateLimit}, Concurrency: ${hasConcurrencyControl}, Cleanup: ${hasCleanup}`,
                passed: allOptimizationsPresent,
                details: perfData,
                timestamp: new Date().toISOString()
            });

        } else {
            throw new Error(`Performance endpoint failed: ${perfResponse.status}`);
        }

    } catch (error) {
        console.log(`   ❌ Configuration check error: ${error.message}`);
        TEST_RESULTS.push({
            test: 'Optimization configuration',
            expected: 'Successful configuration check',
            actual: 'error',
            passed: false,
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }

    // Test 3: System responsiveness under optimization
    console.log('\n📝 Test 3: System responsiveness validation');

    try {
        const responseTimes = [];
        const testCount = 5;

        for (let i = 0; i < testCount; i++) {
            const startTime = Date.now();
            const healthResponse = await makeRequest(`${BACKEND_URL}/api/health`);
            const responseTime = Date.now() - startTime;

            responseTimes.push(responseTime);
            console.log(`   Response ${i + 1}: ${responseTime}ms`);

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        const maxResponseTime = Math.max(...responseTimes);
        const systemResponsive = avgResponseTime < 100 && maxResponseTime < 200;

        console.log(`   📊 Average response time: ${avgResponseTime.toFixed(1)}ms`);
        console.log(`   📊 Max response time: ${maxResponseTime}ms`);
        console.log(`   📊 System responsive: ${systemResponsive ? 'YES' : 'NO'}`);

        TEST_RESULTS.push({
            test: 'System responsiveness',
            expected: 'Fast response times (<100ms avg)',
            actual: `${avgResponseTime.toFixed(1)}ms avg, ${maxResponseTime}ms max`,
            passed: systemResponsive,
            details: {
                response_times: responseTimes,
                average_response_time: avgResponseTime,
                max_response_time: maxResponseTime
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.log(`   ❌ Responsiveness test error: ${error.message}`);
        TEST_RESULTS.push({
            test: 'System responsiveness',
            expected: 'Successful responsiveness test',
            actual: 'error',
            passed: false,
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }

    // Generate test report
    console.log('\n📊 MOCK PERFORMANCE TEST RESULTS');
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
    const reportPath = '/Users/michaeldurante/ai dev/ce-hub/edge-dev/mock_performance_test_results.json';
    fs.writeFileSync(reportPath, JSON.stringify({
        summary: {
            total_tests: totalTests,
            passed_tests: passedTests,
            success_rate: `${((passedTests / totalTests) * 100).toFixed(1)}%`,
            test_timestamp: new Date().toISOString()
        },
        test_results: TEST_RESULTS
    }, null, 2));

    console.log(`📄 Detailed results saved to: ${reportPath}`);

    return {
        passed: passedTests,
        total: totalTests,
        success_rate: (passedTests / totalTests) * 100
    };
}

// Run the tests
testMockPerformance()
    .then(summary => {
        console.log(`\n🎯 Final Summary: ${summary.success_rate.toFixed(1)}% success rate`);
        process.exit(summary.success_rate >= 80 ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });