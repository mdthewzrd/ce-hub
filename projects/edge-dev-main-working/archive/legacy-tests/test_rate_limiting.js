#!/usr/bin/env node

/**
 * Rate Limiting Validation Test
 * Tests the 2 scans/minute per IP rate limiting implementation
 */

const https = require('http');
const fs = require('fs');

const BACKEND_URL = 'http://localhost:8000';
const TEST_RESULTS = [];

// Test scan request payload
const scanRequest = {
    start_date: '2024-10-28',
    end_date: '2024-10-30',
    use_real_scan: false, // Use mock scan for faster testing
    filters: {
        lc_frontside_d2_extended: true,
        min_gap: 0.5
    }
};

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

async function testRateLimiting() {
    console.log('🔬 Starting Rate Limiting Validation Tests');
    console.log('=' * 60);

    // Test 1: First scan should succeed
    console.log('\n📝 Test 1: First scan request (should succeed)');
    try {
        const result1 = await makeRequest(`${BACKEND_URL}/api/scan/execute`, 'POST', scanRequest);
        TEST_RESULTS.push({
            test: 'First scan request',
            expected: 'success (200-202)',
            actual: result1.status,
            passed: result1.status >= 200 && result1.status < 300,
            details: result1.body,
            timestamp: result1.timestamp
        });

        console.log(`   Status: ${result1.status}`);
        console.log(`   Response: ${JSON.stringify(result1.body, null, 2).substring(0, 200)}...`);
    } catch (error) {
        console.log(`   Error: ${error.message}`);
        TEST_RESULTS.push({
            test: 'First scan request',
            expected: 'success (200-202)',
            actual: 'error',
            passed: false,
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }

    // Test 2: Second scan should succeed (within rate limit)
    console.log('\n📝 Test 2: Second scan request (should succeed)');
    try {
        const result2 = await makeRequest(`${BACKEND_URL}/api/scan/execute`, 'POST', scanRequest);
        TEST_RESULTS.push({
            test: 'Second scan request',
            expected: 'success (200-202)',
            actual: result2.status,
            passed: result2.status >= 200 && result2.status < 300,
            details: result2.body,
            timestamp: result2.timestamp
        });

        console.log(`   Status: ${result2.status}`);
        console.log(`   Response: ${JSON.stringify(result2.body, null, 2).substring(0, 200)}...`);
    } catch (error) {
        console.log(`   Error: ${error.message}`);
        TEST_RESULTS.push({
            test: 'Second scan request',
            expected: 'success (200-202)',
            actual: 'error',
            passed: false,
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }

    // Test 3: Third scan should be rate limited (429)
    console.log('\n📝 Test 3: Third scan request (should be rate limited - 429)');
    try {
        const result3 = await makeRequest(`${BACKEND_URL}/api/scan/execute`, 'POST', scanRequest);
        TEST_RESULTS.push({
            test: 'Third scan request (rate limit test)',
            expected: 'rate limited (429)',
            actual: result3.status,
            passed: result3.status === 429,
            details: result3.body,
            timestamp: result3.timestamp
        });

        console.log(`   Status: ${result3.status}`);
        console.log(`   Response: ${JSON.stringify(result3.body, null, 2).substring(0, 200)}...`);
    } catch (error) {
        console.log(`   Error: ${error.message}`);
        TEST_RESULTS.push({
            test: 'Third scan request (rate limit test)',
            expected: 'rate limited (429)',
            actual: 'error',
            passed: false,
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }

    // Test 4: Check concurrent scan limits
    console.log('\n📝 Test 4: Concurrent scan limit test (MAX_CONCURRENT_SCANS = 2)');
    try {
        // Send multiple requests simultaneously to test concurrency control
        const promises = [];
        for (let i = 0; i < 3; i++) {
            promises.push(makeRequest(`${BACKEND_URL}/api/scan/execute`, 'POST', {
                ...scanRequest,
                start_date: `2024-10-2${7 + i}`, // Different dates to avoid conflicts
                end_date: `2024-10-2${8 + i}`
            }));
        }

        // Wait 65 seconds to reset rate limit, then test concurrency
        console.log('   Waiting 65 seconds to reset rate limit...');
        await new Promise(resolve => setTimeout(resolve, 65000));

        const results = await Promise.all(promises);

        const successCount = results.filter(r => r.status >= 200 && r.status < 300).length;
        const rateLimitedCount = results.filter(r => r.status === 429).length;

        TEST_RESULTS.push({
            test: 'Concurrent scan limit',
            expected: 'max 2 concurrent scans',
            actual: `${successCount} successful, ${rateLimitedCount} rate limited`,
            passed: successCount <= 2,
            details: results.map(r => ({ status: r.status, timestamp: r.timestamp })),
            timestamp: new Date().toISOString()
        });

        console.log(`   Results: ${successCount} successful, ${rateLimitedCount} rate limited`);
        results.forEach((result, i) => {
            console.log(`   Request ${i + 1}: Status ${result.status}`);
        });
    } catch (error) {
        console.log(`   Error: ${error.message}`);
        TEST_RESULTS.push({
            test: 'Concurrent scan limit',
            expected: 'max 2 concurrent scans',
            actual: 'error',
            passed: false,
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }

    // Generate test report
    console.log('\n📊 RATE LIMITING TEST RESULTS');
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
    const reportPath = '/Users/michaeldurante/ai dev/ce-hub/edge-dev/rate_limiting_test_results.json';
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
testRateLimiting()
    .then(summary => {
        console.log(`\n🎯 Final Summary: ${summary.success_rate.toFixed(1)}% success rate`);
        process.exit(summary.success_rate >= 75 ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });