const { chromium } = require('playwright');

async function debugNetworkRequests() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000 // Slow down actions to see what's happening
    });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    try {
        console.log('🌐 Starting network request debugging...');

        // Monitor ALL network requests
        const allRequests = [];
        page.on('request', request => {
            const url = request.url();
            const method = request.method();

            // Log all API requests
            if (url.includes('/api/')) {
                const requestInfo = {
                    url: url,
                    method: method,
                    headers: request.headers(),
                    timestamp: new Date().toISOString(),
                    postData: request.postData()
                };
                allRequests.push(requestInfo);
                console.log(`📡 API REQUEST: ${method} ${url}`);
                if (request.postData()) {
                    console.log(`   Data: ${request.postData().substring(0, 200)}...`);
                }
            }
        });

        // Monitor responses
        page.on('response', response => {
            const url = response.url();
            if (url.includes('/api/')) {
                console.log(`📥 API RESPONSE: ${response.status()} ${url}`);
            }
        });

        // Navigate to main dashboard
        console.log('📍 Navigating to main dashboard...');
        await page.goto('http://localhost:5656', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Wait for page to load
        await page.waitForTimeout(3000);

        // Look for the most recent Backside B Test project
        console.log('🔍 Looking for Backside B Test project...');

        // Find all project links
        const projectLinks = await page.$$('a, div[role="button"], button, div[class*="project"], div[class*="item"]');
        let backsideProjectFound = false;

        // Debug: Log all clickable elements to understand the structure
        console.log('🔍 Debug: Scanning all clickable elements...');
        for (const link of projectLinks) {
            try {
                const text = await link.textContent();
                if (text && text.trim()) {
                    const trimmedText = text.trim();
                    if (trimmedText.includes('Backside') || trimmedText.includes('Test')) {
                        console.log(`   Found element: "${trimmedText}"`);
                    }
                }
            } catch (error) {
                // Skip elements that can't be read
                continue;
            }
        }

        for (const link of projectLinks) {
            try {
                const text = await link.textContent();
                if (text && text.includes('Backside B Test')) {
                    console.log(`✅ Found project: ${text.trim()}`);
                    backsideProjectFound = true;

                    // Scroll into view if needed
                    await link.scrollIntoViewIfNeeded();
                    await page.waitForTimeout(1000);

                    // Click the project
                    console.log('🖱️ Clicking on Backside B Test project...');
                    await link.click();
                    break;
                }
            } catch (error) {
                // Skip elements that can't be read or clicked
                continue;
            }
        }

        if (!backsideProjectFound) {
            console.log('❌ No Backside B Test project found');
            return;
        }

        // Wait for project to load
        await page.waitForTimeout(3000);

        // Clear requests log before clicking Run Scan
        const requestsBeforeScan = allRequests.length;
        console.log(`📊 Requests before Run Scan: ${requestsBeforeScan}`);

        // Look for and click Run Scan button
        console.log('🔍 Looking for Run Scan button...');

        const runScanSelectors = [
            'text="Run Scan"',
            'button:has-text("Run Scan")',
            '[data-testid="run-scan"]',
            '.run-scan-btn'
        ];

        let runScanFound = false;
        for (const selector of runScanSelectors) {
            try {
                const button = await page.$(selector);
                if (button && await button.isVisible()) {
                    console.log(`✅ Found Run Scan button with selector: ${selector}`);
                    runScanFound = true;

                    // Scroll into view
                    await button.scrollIntoViewIfNeeded();
                    await page.waitForTimeout(1000);

                    // Click the button
                    console.log('🖱️ Clicking Run Scan button...');
                    const apiCallCount = allRequests.length;
                    await button.click();

                    // Wait for API call to be made
                    await page.waitForTimeout(2000);

                    // Check if any new API requests were made
                    const newRequests = allRequests.slice(apiCallCount);
                    console.log(`📊 New API requests after clicking Run Scan: ${newRequests.length}`);

                    newRequests.forEach(req => {
                        console.log(`   → ${req.method} ${req.url}`);
                    });

                    break;
                }
            } catch (error) {
                // Try next selector
                continue;
            }
        }

        if (!runScanFound) {
            console.log('❌ No Run Scan button found');
        }

        // Wait a bit longer to capture any delayed API calls
        await page.waitForTimeout(5000);

        // Summary of all API requests
        console.log('\n📋 COMPLETE API REQUEST SUMMARY:');
        console.log('=====================================');

        const apiRequests = allRequests.filter(req => req.url.includes('/api/'));
        apiRequests.forEach((req, index) => {
            console.log(`${index + 1}. ${req.method} ${req.url}`);
            if (req.postData) {
                console.log(`   Body: ${req.postData.substring(0, 100)}...`);
            }
        });

        // Look specifically for scan execution calls
        const scanExecutionCalls = apiRequests.filter(req =>
            req.url.includes('/scan/execute') ||
            req.url.includes('/projects/') && req.url.includes('/execute')
        );

        console.log('\n🎯 SCAN EXECUTION CALLS:');
        console.log('==========================');
        if (scanExecutionCalls.length > 0) {
            scanExecutionCalls.forEach((req, index) => {
                console.log(`${index + 1}. ${req.method} ${req.url}`);
            });
        } else {
            console.log('❌ No scan execution calls found!');
        }

        // Take screenshot of final state
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        await page.screenshot({
            path: `debug_network_final_${timestamp}.png`,
            fullPage: true
        });
        console.log(`📸 Final screenshot saved: debug_network_final_${timestamp}.png`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
        console.log('🏁 Browser closed');
    }
}

debugNetworkRequests().catch(console.error);