const { chromium } = require('playwright');
const path = require('path');

async function testRenataAPIIntegration() {
    console.log('🧪 Starting Renata API Integration Test...\n');

    const browser = await chromium.launch({
        headless: false, // Show browser for debugging
        slowMo: 1000, // Slow down for better observation
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Enable console logging
    const consoleMessages = [];
    page.on('console', msg => {
        consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString()
        });
        console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    // Enable network logging
    const networkRequests = [];
    page.on('request', request => {
        networkRequests.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
            timestamp: new Date().toISOString()
        });

        if (request.url().includes('renata') || request.url().includes('api')) {
            console.log(`🌐 [${request.method()}] ${request.url()}`);
            if (request.headers()['authorization']) {
                console.log(`   🔑 Authorization: ${request.headers()['authorization'].substring(0, 20)}...`);
            }
        }
    });

    page.on('response', response => {
        if (response.url().includes('renata') || response.url().includes('api')) {
            console.log(`📡 [${response.status()}] ${response.url()}`);
        }
    });

    try {
        // Step 1: Navigate to Edge Dev platform
        console.log('\n📍 Step 1: Navigating to http://localhost:5657...');
        await page.goto('http://localhost:5657', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Wait for page to load
        await page.waitForTimeout(3000);

        // Check if page loaded successfully
        const pageTitle = await page.title();
        console.log(`📄 Page title: ${pageTitle}`);

        // Look for file upload area
        const uploadArea = await page.locator('[data-testid="file-upload-area"], .file-upload-area, input[type="file"]').first();
        if (await uploadArea.isVisible()) {
            console.log('✅ File upload area found');
        } else {
            console.log('⚠️  File upload area not immediately visible, looking for alternative selectors...');
            // Try alternative selectors
            const alternativeUpload = await page.locator('input[type="file"]').first();
            if (await alternativeUpload.isVisible()) {
                console.log('✅ Found file input using alternative selector');
            }
        }

        // Step 2: Upload the test file
        console.log('\n📁 Step 2: Uploading test file...');
        const testFilePath = '/Users/michaeldurante/Downloads/backside para b copy.py';

        // Find file input (it might be hidden)
        const fileInput = await page.locator('input[type="file"]').first();
        await fileInput.setInputFiles(testFilePath);
        console.log(`✅ File uploaded: ${path.basename(testFilePath)}`);

        // Wait for file to be processed
        await page.waitForTimeout(2000);

        // Look for file confirmation
        const fileConfirm = await page.locator('text=/backside para b copy.py/i').first();
        if (await fileConfirm.isVisible()) {
            console.log('✅ File name confirmed in interface');
        }

        // Step 3: Look for Format & Run button
        console.log('\n🚀 Step 3: Looking for Format & Run button...');

        const formatRunSelectors = [
            'button:has-text("Format & Run")',
            'button:has-text("Format and Run")',
            'button:has-text("Run Scan")',
            'button:has-text("Execute")',
            '[data-testid="format-run-button"]',
            '.format-run-button',
            'button.primary',
            'button:has-text("Format")'
        ];

        let formatRunButton = null;
        for (const selector of formatRunSelectors) {
            try {
                const button = page.locator(selector).first();
                if (await button.isVisible({ timeout: 2000 })) {
                    formatRunButton = button;
                    console.log(`✅ Found button with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        if (!formatRunButton) {
            console.log('⚠️  Format & Run button not found with standard selectors');
            console.log('🔍 Looking for any visible buttons...');
            const allButtons = await page.locator('button').all();
            for (let i = 0; i < allButtons.length; i++) {
                const button = allButtons[i];
                if (await button.isVisible()) {
                    const text = await button.textContent();
                    console.log(`   Button ${i}: "${text}"`);
                }
            }
        }

        // Step 4: Clear console before clicking
        console.log('\n🧹 Clearing console history and monitoring for Renata API calls...');

        // Take screenshot before clicking
        await page.screenshot({ path: 'test_before_click.png', fullPage: true });
        console.log('📸 Screenshot saved: test_before_click.png');

        if (formatRunButton) {
            // Step 5: Click Format & Run button
            console.log('\n⚡ Step 5: Clicking Format & Run button...');
            await formatRunButton.click();

            // Wait for processing
            console.log('⏳ Waiting for processing (30 seconds max)...');
            await page.waitForTimeout(30000);

            // Take screenshot after processing
            await page.screenshot({ path: 'test_after_click.png', fullPage: true });
            console.log('📸 Screenshot saved: test_after_click.png');

        } else {
            console.log('❌ Could not find Format & Run button to click');
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    } finally {
        // Step 6: Analyze results
        console.log('\n📊 Step 6: Analyzing Results...\n');

        // Check for "Local formatting service processing request" messages
        const localFormattingMessages = consoleMessages.filter(msg =>
            msg.text.toLowerCase().includes('local formatting service') ||
            msg.text.toLowerCase().includes('processing request')
        );

        console.log('🔍 Console Analysis:');
        console.log(`   Total console messages: ${consoleMessages.length}`);
        console.log(`   Local formatting messages: ${localFormattingMessages.length}`);

        if (localFormattingMessages.length > 0) {
            console.log('\n❌ ISSUE DETECTED - Local formatting service messages found:');
            localFormattingMessages.forEach(msg => {
                console.log(`   [${msg.type.toUpperCase()}] ${msg.text}`);
            });
        } else {
            console.log('✅ No local formatting service messages detected');
        }

        // Check for Renata API calls
        const renataApiCalls = networkRequests.filter(req =>
            req.url.toLowerCase().includes('renata') ||
            req.url.toLowerCase().includes('chat') ||
            req.url.toLowerCase().includes('format')
        );

        console.log('\n🌐 Network Analysis:');
        console.log(`   Total network requests: ${networkRequests.length}`);
        console.log(`   Renata/API calls: ${renataApiCalls.length}`);

        if (renataApiCalls.length > 0) {
            console.log('\n✅ Renata API calls detected:');
            renataApiCalls.forEach(req => {
                console.log(`   [${req.method}] ${req.url}`);
            });
        } else {
            console.log('\n❌ No Renata API calls detected');
        }

        // Look for error messages
        const errorMessages = consoleMessages.filter(msg =>
            msg.type === 'error' ||
            msg.text.toLowerCase().includes('error') ||
            msg.text.toLowerCase().includes('failed')
        );

        if (errorMessages.length > 0) {
            console.log('\n⚠️  Error messages found:');
            errorMessages.forEach(msg => {
                console.log(`   [${msg.type.toUpperCase()}] ${msg.text}`);
            });
        }

        // Final assessment
        console.log('\n🎯 FINAL ASSESSMENT:');
        if (localFormattingMessages.length === 0 && renataApiCalls.length > 0) {
            console.log('✅ SUCCESS: Fix appears to be working correctly!');
            console.log('   - No local formatting service messages detected');
            console.log('   - Renata API calls are being made');
        } else if (localFormattingMessages.length > 0) {
            console.log('❌ ISSUE: Local formatting service is still being used');
            console.log('   - Fix may not have been applied correctly');
        } else if (renataApiCalls.length === 0) {
            console.log('⚠️  UNCLEAR: No API activity detected');
            console.log('   - May need to check if the button was clicked or if there are other issues');
        }

        console.log('\n📝 Test complete. Browser will remain open for manual inspection.');

        // Don't close browser immediately for manual inspection
        // await browser.close();
    }
}

// Run the test
testRenataAPIIntegration().catch(console.error);