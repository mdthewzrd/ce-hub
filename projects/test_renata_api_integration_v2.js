const { chromium } = require('playwright');
const path = require('path');

async function testRenataAPIIntegration() {
    console.log('🧪 Starting Renata API Integration Test v2...\n');

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
        const msgText = msg.text();
        consoleMessages.push({
            type: msg.type(),
            text: msgText,
            timestamp: new Date().toISOString()
        });

        // Only log important messages to reduce noise
        if (msgText.includes('Local formatting service') ||
            msgText.includes('Renata') ||
            msgText.includes('API') ||
            msgText.includes('formatting') ||
            msg.type() === 'error' ||
            msg.type() === 'warning') {
            console.log(`[${msg.type().toUpperCase()}] ${msgText}`);
        }
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

        if (request.url().includes('renata') ||
            request.url().includes('chat') ||
            request.url().includes('format') ||
            request.url().includes('api')) {
            console.log(`🌐 [${request.method()}] ${request.url()}`);
        }
    });

    page.on('response', response => {
        if (response.url().includes('renata') ||
            response.url().includes('chat') ||
            response.url().includes('format') ||
            response.url().includes('api')) {
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
        await page.waitForTimeout(5000);

        // Step 2: Switch to file upload mode
        console.log('\n📁 Step 2: Switching to file upload mode...');

        // Look for the "Upload File" button
        const uploadFileButton = await page.locator('button:has-text("Upload File")').first();
        if (await uploadFileButton.isVisible()) {
            await uploadFileButton.click();
            console.log('✅ Clicked "Upload File" button');
        } else {
            console.log('⚠️  "Upload File" button not found, trying alternative selectors...');
            const altUploadButton = await page.locator('button:has-text("📁 Upload File")').first();
            if (await altUploadButton.isVisible()) {
                await altUploadButton.click();
                console.log('✅ Clicked alternative upload button');
            }
        }

        // Wait for file upload area to appear
        await page.waitForTimeout(2000);

        // Step 3: Upload the test file
        console.log('\n📁 Step 3: Uploading test file...');
        const testFilePath = '/Users/michaeldurante/Downloads/backside para b copy.py';

        // Look for the hidden file input with id 'fileInput'
        const fileInput = await page.locator('#fileInput').first();
        if (await fileInput.count() > 0) {
            await fileInput.setInputFiles(testFilePath);
            console.log(`✅ File uploaded: ${path.basename(testFilePath)}`);
        } else {
            console.log('⚠️  #fileInput not found, looking for other file inputs...');
            const allFileInputs = await page.locator('input[type="file"]').all();
            if (allFileInputs.length > 0) {
                await allFileInputs[0].setInputFiles(testFilePath);
                console.log(`✅ File uploaded using first available input: ${path.basename(testFilePath)}`);
            } else {
                throw new Error('No file input elements found');
            }
        }

        // Wait for file to be processed
        await page.waitForTimeout(3000);

        // Look for file confirmation
        try {
            const fileConfirm = await page.locator('text=/backside para b copy.py/i').first();
            if (await fileConfirm.isVisible({ timeout: 2000 })) {
                console.log('✅ File name confirmed in interface');
            } else {
                console.log('⚠️  File name not immediately visible, but may still be processed');
            }
        } catch (e) {
            console.log('⚠️  File confirmation not found, continuing...');
        }

        // Step 4: Look for Format & Run button
        console.log('\n🚀 Step 4: Looking for Format & Run button...');

        const formatRunSelectors = [
            'button:has-text("Format & Run")',
            'button:has-text("Format and Run")',
            'button:has-text("Run Scan")',
            'button:has-text("Execute")',
            'button:has-text("Run")',
            '[data-testid="format-run-button"]',
            '.format-run-button',
            'button.bg-yellow-500', // Yellow button typical for main actions
            'button.primary',
            'button:has-text("Format")'
        ];

        let formatRunButton = null;
        for (const selector of formatRunSelectors) {
            try {
                const button = page.locator(selector).first();
                if (await button.isVisible({ timeout: 1000 })) {
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
                    if (text && text.trim()) {
                        console.log(`   Button ${i}: "${text.trim()}"`);
                    }
                }
            }
        }

        // Take screenshot before clicking
        await page.screenshot({ path: 'test_before_click_v2.png', fullPage: true });
        console.log('📸 Screenshot saved: test_before_click_v2.png');

        // Clear recent console history to focus on new activity
        consoleMessages.length = 0;

        if (formatRunButton) {
            // Step 5: Click Format & Run button
            console.log('\n⚡ Step 5: Clicking Format & Run button...');
            await formatRunButton.click();

            // Wait for processing - monitor for activity
            console.log('⏳ Waiting for processing (45 seconds max)...');

            let activityDetected = false;
            const startTime = Date.now();
            const maxWaitTime = 45000; // 45 seconds

            while (Date.now() - startTime < maxWaitTime) {
                await page.waitForTimeout(2000);

                // Check for new console messages indicating activity
                const recentMessages = consoleMessages.slice(-10);
                const hasActivity = recentMessages.some(msg =>
                    msg.text.includes('Renata') ||
                    msg.text.includes('formatting') ||
                    msg.text.includes('Local formatting service')
                );

                if (hasActivity && !activityDetected) {
                    activityDetected = true;
                    console.log('🔄 Activity detected in console...');
                }

                // Check for network requests
                const recentRequests = networkRequests.slice(-5);
                const hasRenataRequests = recentRequests.some(req =>
                    req.url.includes('renata') ||
                    req.url.includes('chat') ||
                    req.url.includes('format')
                );

                if (hasRenataRequests) {
                    console.log('🌐 Renata API requests detected!');
                    break;
                }
            }

            // Take screenshot after processing
            await page.screenshot({ path: 'test_after_click_v2.png', fullPage: true });
            console.log('📸 Screenshot saved: test_after_click_v2.png');

        } else {
            console.log('❌ Could not find Format & Run button to click');
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        await page.screenshot({ path: 'test_error.png', fullPage: true });
        console.log('📸 Error screenshot saved: test_error.png');
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

        // Look for Renata-related messages
        const renataMessages = consoleMessages.filter(msg =>
            msg.text.toLowerCase().includes('renata')
        );

        if (renataMessages.length > 0) {
            console.log('\n🤖 Renata-related messages found:');
            renataMessages.forEach(msg => {
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
        console.log('💡 Screenshots saved for reference: test_before_click_v2.png, test_after_click_v2.png');
    }
}

// Run the test
testRenataAPIIntegration().catch(console.error);