const { chromium } = require('playwright');

async function debugConsoleOutput() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 500
    });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // Monitor console output
    const consoleMessages = [];
    page.on('console', msg => {
        consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            location: msg.location()
        });
        console.log(`🖥️ CONSOLE [${msg.type()}]: ${msg.text()}`);
    });

    // Monitor network requests
    const networkRequests = [];
    page.on('request', request => {
        if (request.url().includes('/api/') && (request.url().includes('/execute') || request.url().includes('/projects'))) {
            networkRequests.push({
                url: request.url(),
                method: request.method(),
                timestamp: new Date().toISOString()
            });
            console.log(`📡 NETWORK: ${request.method} ${request.url()}`);
        }
    });

    try {
        console.log('🔍 Debugging Console Output When Run Scan is Clicked');
        console.log('====================================================');

        // Navigate to main dashboard
        console.log('📍 Navigating to main dashboard...');
        await page.goto('http://localhost:5656', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        await page.waitForTimeout(3000);

        // Clear console and network logs
        consoleMessages.length = 0;
        networkRequests.length = 0;

        // Find and click Run Scan button
        console.log('🔍 Looking for Run Scan button...');
        const runScanButton = page.locator('text="Run Scan"').first();

        if (await runScanButton.isVisible()) {
            console.log('✅ Found Run Scan button');
            console.log('🖱️ Clicking Run Scan button...');
            console.log('👂 Listening for console output and network requests...');

            await runScanButton.click();

            // Wait for activity and capture console output
            await page.waitForTimeout(5000);

            console.log('\n📊 CONSOLE OUTPUT ANALYSIS:');
            console.log('============================');

            if (consoleMessages.length === 0) {
                console.log('❌ NO CONSOLE OUTPUT DETECTED');
                console.log('   This means handleRunScan function is likely NOT being called');
            } else {
                console.log(`✅ Found ${consoleMessages.length} console messages:`);
                consoleMessages.forEach((msg, index) => {
                    console.log(`${index + 1}. [${msg.type()}] ${msg.text}`);
                    if (msg.location) {
                        console.log(`   Location: ${msg.location.url}:${msg.location.lineNumber}`);
                    }
                });
            }

            console.log('\n📡 NETWORK ACTIVITY ANALYSIS:');
            console.log('===============================');

            if (networkRequests.length === 0) {
                console.log('❌ NO NETWORK REQUESTS DETECTED');
                console.log('   This confirms no API calls are being made');
            } else {
                console.log(`✅ Found ${networkRequests.length} network requests:`);
                networkRequests.forEach((req, index) => {
                    console.log(`${index + 1}. ${req.method} ${req.url}`);
                });
            }

            // Look for specific patterns in console output
            const startScanMessage = consoleMessages.find(msg =>
                msg.text.includes('Starting scan execution')
            );
            const projectSelectionMessage = consoleMessages.find(msg =>
                msg.text.includes('Using project ID')
            );
            const apiRequestMessage = consoleMessages.find(msg =>
                msg.text.includes('Making API request')
            );

            console.log('\n🎯 KEY FUNCTION CALLS DETECTED:');
            console.log('===================================');

            if (startScanMessage) {
                console.log('✅ handleRunScan function STARTED');
            } else {
                console.log('❌ handleRunScan function NOT STARTED');
            }

            if (apiRequestMessage) {
                console.log('✅ Projects API call made');
            } else {
                console.log('❌ Projects API call NOT made');
            }

            if (projectSelectionMessage) {
                console.log('✅ Project selection completed');
                console.log(`   ${projectSelectionMessage.text}`);
            } else {
                console.log('❌ Project selection FAILED or NOT REACHED');
            }

            const executionRequest = networkRequests.find(req =>
                req.url.includes('/execute') && req.method === 'POST'
            );

            if (executionRequest) {
                console.log('✅ Execution API call made');
            } else {
                console.log('❌ Execution API call NOT made');
            }

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

debugConsoleOutput().catch(console.error);