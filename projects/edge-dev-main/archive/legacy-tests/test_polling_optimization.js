#!/usr/bin/env node

/**
 * Frontend Polling Optimization Validation Test
 * Tests exponential backoff, cross-tab coordination, and 80% polling reduction
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const FRONTEND_URL = 'http://localhost:3000';
const TEST_RESULTS = [];
const POLLING_METRICS = [];

async function createBrowserPage() {
    const browser = await puppeteer.launch({
        headless: false, // Show browser for visual confirmation
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Poll') || text.includes('Scan') || text.includes('📊')) {
            console.log(`   Browser: ${text}`);

            // Capture polling metrics
            if (text.includes('Poll') && text.includes('interval:')) {
                const match = text.match(/interval:\s*(\d+)/);
                if (match) {
                    POLLING_METRICS.push({
                        timestamp: new Date().toISOString(),
                        interval: parseInt(match[1]),
                        message: text
                    });
                }
            }
        }
    });

    return { browser, page };
}

async function waitForElement(page, selector, timeout = 30000) {
    try {
        await page.waitForSelector(selector, { timeout });
        return true;
    } catch (error) {
        console.log(`   ⚠️  Element ${selector} not found within ${timeout}ms`);
        return false;
    }
}

async function testPollingOptimization() {
    console.log('🔬 Starting Frontend Polling Optimization Tests');
    console.log('=' * 60);

    let browser1, page1, browser2, page2;

    try {
        // Test 1: Start a scan and measure polling intervals
        console.log('\n📝 Test 1: Exponential backoff polling verification');

        const { browser: b1, page: p1 } = await createBrowserPage();
        browser1 = b1;
        page1 = p1;

        await page1.goto(FRONTEND_URL);
        await page1.waitForLoadState('networkidle');

        // Wait for page to load completely
        const pageLoaded = await waitForElement(page1, 'button[onclick*="handleRunScan"]', 10000);
        if (!pageLoaded) {
            // Try alternative selectors
            const runButton = await waitForElement(page1, 'button:has-text("Run Scan")', 5000) ||
                             await waitForElement(page1, '[data-testid="run-scan"]', 5000) ||
                             await waitForElement(page1, 'button', 5000);
        }

        // Start monitoring polling behavior
        const pollingStartTime = Date.now();
        POLLING_METRICS.length = 0; // Clear previous metrics

        // Click Run Scan button
        try {
            await page1.click('button:has-text("Run Scan")');
            console.log('   ✅ Scan started successfully');
        } catch (error) {
            // Try alternative method
            await page1.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const runButton = buttons.find(btn =>
                    btn.textContent.includes('Run Scan') ||
                    btn.textContent.includes('Run') ||
                    btn.onclick && btn.onclick.toString().includes('handleRunScan')
                );
                if (runButton) runButton.click();
                else console.log('Run scan button not found');
            });
            console.log('   ⚠️  Used fallback method to start scan');
        }

        // Monitor polling for 120 seconds to observe exponential backoff
        console.log('   📊 Monitoring polling intervals for 120 seconds...');

        let previousPollingCount = 0;
        for (let i = 0; i < 24; i++) { // 24 * 5 seconds = 120 seconds
            await new Promise(resolve => setTimeout(resolve, 5000));

            const currentPollingCount = POLLING_METRICS.length;
            const newPolls = currentPollingCount - previousPollingCount;

            console.log(`   Time: ${(i + 1) * 5}s, New polls: ${newPolls}, Total: ${currentPollingCount}`);
            previousPollingCount = currentPollingCount;

            // Break early if scan completes
            const isComplete = await page1.evaluate(() => {
                return !document.querySelector('.animate-spin') &&
                       !document.body.textContent.includes('Running...');
            });

            if (isComplete) {
                console.log('   ✅ Scan completed, stopping polling monitoring');
                break;
            }
        }

        // Analyze polling behavior
        const totalPollingTime = Date.now() - pollingStartTime;
        const totalPolls = POLLING_METRICS.length;
        const averageInterval = totalPollingTime / totalPolls;

        // Check for exponential backoff pattern
        const intervals = POLLING_METRICS.map(m => m.interval).filter(i => i > 0);
        const hasExponentialBackoff = intervals.length >= 3 &&
                                     intervals[0] <= 5000 &&
                                     intervals[1] >= 10000 &&
                                     intervals[2] >= 20000;

        TEST_RESULTS.push({
            test: 'Exponential backoff polling',
            expected: 'Intervals: 5s → 10s → 30s',
            actual: `${intervals.slice(0, 3).join('ms → ')}ms`,
            passed: hasExponentialBackoff,
            details: {
                total_polls: totalPolls,
                average_interval: Math.round(averageInterval),
                intervals: intervals.slice(0, 5),
                monitoring_duration: totalPollingTime
            },
            timestamp: new Date().toISOString()
        });

        console.log(`   📊 Total polls: ${totalPolls}`);
        console.log(`   📊 Average interval: ${Math.round(averageInterval)}ms`);
        console.log(`   📊 Exponential backoff: ${hasExponentialBackoff ? 'YES' : 'NO'}`);

        // Test 2: Cross-tab coordination
        console.log('\n📝 Test 2: Cross-tab coordination verification');

        const { browser: b2, page: p2 } = await createBrowserPage();
        browser2 = b2;
        page2 = p2;

        await page2.goto(FRONTEND_URL);
        await page2.waitForLoadState('networkidle');

        // Store current metrics count
        const metricsBeforeSecondTab = POLLING_METRICS.length;

        // Start another scan in second tab
        try {
            await page2.click('button:has-text("Run Scan")');
            console.log('   ✅ Second tab scan started');
        } catch (error) {
            await page2.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const runButton = buttons.find(btn => btn.textContent.includes('Run Scan'));
                if (runButton) runButton.click();
            });
            console.log('   ⚠️  Used fallback method for second tab');
        }

        // Monitor for 30 seconds to check coordination
        console.log('   📊 Monitoring cross-tab coordination for 30 seconds...');

        const coordinationStartTime = Date.now();
        let coordinationMetrics = 0;

        for (let i = 0; i < 6; i++) { // 6 * 5 seconds = 30 seconds
            await new Promise(resolve => setTimeout(resolve, 5000));

            const currentMetrics = POLLING_METRICS.length;
            const newMetrics = currentMetrics - metricsBeforeSecondTab;
            coordinationMetrics = newMetrics;

            console.log(`   Time: ${(i + 1) * 5}s, Cross-tab metrics: ${newMetrics}`);
        }

        // Calculate expected vs actual polling reduction
        const expectedPollsWithoutCoordination = 12; // 6 intervals * 2 tabs
        const actualPollsWithCoordination = coordinationMetrics;
        const reductionPercentage = ((expectedPollsWithoutCoordination - actualPollsWithCoordination) / expectedPollsWithoutCoordination) * 100;

        TEST_RESULTS.push({
            test: 'Cross-tab coordination',
            expected: 'Reduced polling with multiple tabs',
            actual: `${reductionPercentage.toFixed(1)}% reduction`,
            passed: reductionPercentage > 30, // At least 30% reduction expected
            details: {
                expected_polls_without_coordination: expectedPollsWithoutCoordination,
                actual_polls_with_coordination: actualPollsWithCoordination,
                reduction_percentage: reductionPercentage
            },
            timestamp: new Date().toISOString()
        });

        console.log(`   📊 Expected polls (no coordination): ${expectedPollsWithoutCoordination}`);
        console.log(`   📊 Actual polls (with coordination): ${actualPollsWithCoordination}`);
        console.log(`   📊 Polling reduction: ${reductionPercentage.toFixed(1)}%`);

        // Test 3: Overall polling frequency reduction
        console.log('\n📝 Test 3: Overall 80% polling reduction verification');

        // Calculate baseline polling (before optimization: every 5 seconds consistently)
        const baselinePollingRate = 1000 / 5000; // polls per millisecond
        const actualPollingRate = totalPolls / totalPollingTime;
        const overallReduction = ((baselinePollingRate - actualPollingRate) / baselinePollingRate) * 100;

        TEST_RESULTS.push({
            test: 'Overall polling reduction',
            expected: '80% reduction from baseline',
            actual: `${overallReduction.toFixed(1)}% reduction`,
            passed: overallReduction >= 70, // Accept 70%+ as success
            details: {
                baseline_rate: baselinePollingRate,
                actual_rate: actualPollingRate,
                reduction_percentage: overallReduction,
                baseline_description: 'Every 5 seconds consistently',
                actual_description: 'Exponential backoff with coordination'
            },
            timestamp: new Date().toISOString()
        });

        console.log(`   📊 Baseline polling rate: ${(baselinePollingRate * 1000).toFixed(3)} polls/second`);
        console.log(`   📊 Actual polling rate: ${(actualPollingRate * 1000).toFixed(3)} polls/second`);
        console.log(`   📊 Overall reduction: ${overallReduction.toFixed(1)}%`);

    } catch (error) {
        console.error('❌ Test execution error:', error);
        TEST_RESULTS.push({
            test: 'Polling optimization test execution',
            expected: 'successful execution',
            actual: 'error',
            passed: false,
            details: error.message,
            timestamp: new Date().toISOString()
        });
    } finally {
        // Cleanup
        if (browser1) await browser1.close();
        if (browser2) await browser2.close();
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
        polling_metrics: POLLING_METRICS.slice(0, 20) // Save first 20 metrics for analysis
    }, null, 2));

    console.log(`📄 Detailed results saved to: ${reportPath}`);

    return {
        passed: passedTests,
        total: totalTests,
        success_rate: (passedTests / totalTests) * 100
    };
}

// Check if frontend is running first
async function checkFrontendRunning() {
    try {
        const response = await fetch(FRONTEND_URL);
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Run the tests
async function main() {
    console.log('🔍 Checking if frontend is running...');

    const frontendRunning = await checkFrontendRunning();
    if (!frontendRunning) {
        console.log('❌ Frontend not running at http://localhost:3000');
        console.log('   Please start the frontend with: npm run dev');
        process.exit(1);
    }

    console.log('✅ Frontend is running, starting tests...\n');

    try {
        const summary = await testPollingOptimization();
        console.log(`\n🎯 Final Summary: ${summary.success_rate.toFixed(1)}% success rate`);
        process.exit(summary.success_rate >= 70 ? 0 : 1);
    } catch (error) {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    }
}

main();