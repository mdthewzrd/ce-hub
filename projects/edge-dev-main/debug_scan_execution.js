const { chromium } = require('playwright');

async function debugScanExecution() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500
    });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // Monitor network requests
    const networkRequests = [];
    const networkResponses = [];

    page.on('request', request => {
        if (request.url().includes('/api/')) {
            networkRequests.push({
                url: request.url(),
                method: request.method(),
                headers: request.headers(),
                postData: request.postData(),
                timestamp: new Date().toISOString()
            });
            console.log(`📡 REQUEST: ${request.method} ${request.url()}`);
        }
    });

    page.on('response', response => {
        if (response.url().includes('/api/')) {
            networkResponses.push({
                url: response.url(),
                status: response.status(),
                statusText: response.statusText(),
                timestamp: new Date().toISOString()
            });
            console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
        }
    });

    try {
        console.log('🔍 Debugging Scan Execution with Network Monitoring');
        console.log('==================================================');

        // Navigate to main dashboard
        console.log('📍 Navigating to main dashboard...');
        await page.goto('http://localhost:5656', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        await page.waitForTimeout(3000);

        // Find and click Run Scan button
        console.log('🔍 Looking for Run Scan button...');
        const runScanButton = page.locator('text="Run Scan"').first();

        if (await runScanButton.isVisible()) {
            console.log('✅ Found Run Scan button');

            // Clear network logs before clicking
            networkRequests.length = 0;
            networkResponses.length = 0;

            console.log('🖱️ Clicking Run Scan button...');
            await runScanButton.click();

            console.log('⏳ Monitoring network activity during scan...');

            // Wait for scan execution and monitor network activity
            let scanExecutionFound = false;
            for (let i = 0; i < 20; i++) {
                await page.waitForTimeout(1000);

                // Check if we've seen any scan execution requests
                const executionRequests = networkRequests.filter(req =>
                    req.url.includes('/execute') || req.url.includes('/scan')
                );

                if (executionRequests.length > 0) {
                    scanExecutionFound = true;
                    console.log('✅ Scan execution requests detected!');
                    break;
                }

                // Check page state
                const pageText = await page.textContent();
                if (pageText.includes('Running...')) {
                    console.log(`   Scan in progress... (${i + 1}/20 seconds)`);
                } else if (pageText.includes('Total Results:') && !pageText.includes('Total Results: 0')) {
                    console.log('✅ Results detected in dashboard!');
                    break;
                }
            }

            // Analyze network activity
            console.log('\n📊 NETWORK ACTIVITY ANALYSIS:');
            console.log('=================================');

            console.log(`Total API requests: ${networkRequests.length}`);
            console.log(`Total API responses: ${networkResponses.length}`);

            if (networkRequests.length > 0) {
                console.log('\n📡 REQUESTS MADE:');
                networkRequests.forEach((req, index) => {
                    console.log(`${index + 1}. ${req.method} ${req.url}`);
                    if (req.postData) {
                        const data = req.postData.substring(0, 200);
                        console.log(`   Body: ${data}...`);
                    }
                });
            }

            if (networkResponses.length > 0) {
                console.log('\n📥 RESPONSES RECEIVED:');
                networkResponses.forEach((resp, index) => {
                    console.log(`${index + 1}. ${resp.status} ${resp.statusText} ${resp.url}`);
                });
            }

            // Check for successful scan execution
            const executionResponse = networkResponses.find(resp =>
                resp.url.includes('/execute') && resp.status === 200
            );

            if (executionResponse) {
                console.log('\n✅ SCAN EXECUTION SUCCESSFUL!');
                console.log(`   Request: ${executionResponse.url}`);
                console.log(`   Status: ${executionResponse.status}`);
            } else {
                console.log('\n❌ NO SUCCESSFUL SCAN EXECUTION DETECTED');

                // Look for errors
                const errorResponses = networkResponses.filter(resp => resp.status >= 400);
                if (errorResponses.length > 0) {
                    console.log('🚨 ERROR RESPONSES FOUND:');
                    errorResponses.forEach(resp => {
                        console.log(`   ${resp.status} ${resp.url}`);
                    });
                }
            }

            // Take final screenshot
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            await page.screenshot({
                path: `debug_execution_final_${timestamp}.png`,
                fullPage: true
            });
            console.log(`📸 Final screenshot: debug_execution_final_${timestamp}.png`);

        } else {
            console.log('❌ Run Scan button not found');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
        console.log('🏁 Browser closed');
    }
}

debugScanExecution().catch(console.error);