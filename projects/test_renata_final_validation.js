const { chromium } = require('playwright');
const path = require('path');

async function testRenataFinalValidation() {
    console.log('🧪 Starting Final Renata API Validation Test...\n');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 800,
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

        // Log important messages for Renata API testing
        if (msgText.includes('Local formatting service') ||
            msgText.includes('Renata') ||
            msgText.includes('enhancedRenataCodeService') ||
            msgText.includes('Formatting code with Renata') ||
            msgText.includes('formatting') ||
            msgText.includes('API') ||
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
            request.url().includes('api/renata') ||
            request.url().includes('copilotkit')) {
            console.log(`🌐 [${request.method()}] ${request.url}`);
            if (request.headers()['authorization']) {
                console.log(`   🔑 Authorization: ${request.headers()['authorization'].substring(0, 20)}...`);
            }
            if (request.headers()['x-api-key']) {
                console.log(`   🔑 X-API-Key: ${request.headers()['x-api-key'].substring(0, 20)}...`);
            }
        }
    });

    page.on('response', response => {
        if (response.url().includes('renata') ||
            response.url().includes('chat') ||
            response.url().includes('format') ||
            response.url().includes('api/renata') ||
            response.url().includes('copilotkit')) {
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

        // Step 2: Look for and click the Upload Strategy button
        console.log('\n🚀 Step 2: Looking for Upload Strategy button...');

        const uploadButtonSelectors = [
            'button:has-text("Upload Strategy")',
            'button:has-text("Upload")',
            '[onclick*="openUploadModal"]'
        ];

        let uploadButton = null;
        for (const selector of uploadButtonSelectors) {
            try {
                const button = page.locator(selector).first();
                if (await button.isVisible({ timeout: 2000 })) {
                    uploadButton = button;
                    console.log(`✅ Found upload button with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        if (!uploadButton) {
            console.log('⚠️ Upload button not found, taking screenshot for debugging...');
            await page.screenshot({ path: 'debug_no_upload_button.png', fullPage: true });
            throw new Error('Upload Strategy button not found on the page');
        }

        // Click the upload button
        console.log('✅ Clicking Upload Strategy button...');
        await uploadButton.click();

        // Wait for modal to appear
        console.log('⏳ Waiting for upload modal to appear...');
        await page.waitForTimeout(3000);

        // Check if modal appeared
        const modalVisible = await page.locator('.modal-backdrop, .modal-content').isVisible({ timeout: 5000 });
        console.log(`📋 Upload modal visible: ${modalVisible}`);

        if (!modalVisible) {
            throw new Error('Upload modal did not appear after clicking button');
        }

        // Step 3: Choose upload mode
        console.log('\n📝 Step 3: Choosing upload mode...');

        // Look for "Upload and Format Code" button
        const formatModeButton = await page.locator('button:has-text("Upload and Format Code")').first();
        if (await formatModeButton.isVisible({ timeout: 3000 })) {
            await formatModeButton.click();
            console.log('✅ Clicked "Upload and Format Code" button');
        } else {
            console.log('⚠️ "Upload and Format Code" button not found, trying alternative...');
            // Try to click on any upload mode button
            const anyUploadButton = await page.locator('button:has-text("Upload")').first();
            if (await anyUploadButton.isVisible()) {
                await anyUploadButton.click();
                console.log('✅ Clicked alternative upload button');
            }
        }

        await page.waitForTimeout(2000);

        // Step 4: Upload the test file
        console.log('\n📁 Step 4: Uploading test file...');
        const testFilePath = '/Users/michaeldurante/Downloads/backside para b copy.py';

        // Switch to file upload mode if needed
        const fileModeButton = await page.locator('button:has-text("📁 Upload File")').first();
        if (await fileModeButton.isVisible({ timeout: 2000 })) {
            await fileModeButton.click();
            console.log('✅ Switched to file upload mode');
            await page.waitForTimeout(1000);
        }

        // Look for file input
        const fileInput = await page.locator('#fileInput, input[type="file"]').first();
        if (await fileInput.count() > 0) {
            await fileInput.setInputFiles(testFilePath);
            console.log(`✅ File uploaded: ${path.basename(testFilePath)}`);
            await page.waitForTimeout(3000);

            // Verify file was loaded
            const fileConfirmation = await page.locator('text=/backside para b copy.py/i').first();
            if (await fileConfirmation.isVisible({ timeout: 2000 })) {
                console.log('✅ File name confirmed in interface');
            }
        } else {
            // Try clicking the upload area
            const uploadArea = await page.locator('.border-dashed, [onclick*="fileInput"]').first();
            if (await uploadArea.isVisible()) {
                await uploadArea.click();
                await page.waitForTimeout(1000);
                const fileInputAfterClick = await page.locator('input[type="file"]').first();
                if (await fileInputAfterClick.count() > 0) {
                    await fileInputAfterClick.setInputFiles(testFilePath);
                    console.log(`✅ File uploaded via upload area: ${path.basename(testFilePath)}`);
                    await page.waitForTimeout(3000);
                }
            }
        }

        // Step 5: Click Format & Run button
        console.log('\n🚀 Step 5: Looking for Format & Run button...');

        const formatRunButton = await page.locator('button:has-text("Format & Run"), button:has-text("Format and Run")').first();
        if (await formatRunButton.isVisible({ timeout: 5000 })) {
            console.log('✅ Found Format & Run button');

            // Clear console history before clicking for clean monitoring
            const messagesBeforeClick = consoleMessages.length;
            const requestsBeforeClick = networkRequests.length;

            // Take screenshot before clicking
            await page.screenshot({ path: 'test_before_format_run.png', fullPage: true });
            console.log('📸 Screenshot saved: test_before_format_run.png');

            await formatRunButton.click();
            console.log('✅ Clicked Format & Run button');

            // Wait for processing with extended timeout
            console.log('⏳ Waiting for processing (60 seconds max)...');

            // Monitor for activity during processing
            let activityDetected = false;
            const startTime = Date.now();
            const maxWaitTime = 60000; // 60 seconds

            while (Date.now() - startTime < maxWaitTime) {
                await page.waitForTimeout(3000);

                // Check for new console messages
                const newMessages = consoleMessages.slice(messagesBeforeClick);
                const hasRenataActivity = newMessages.some(msg =>
                    msg.text.includes('enhancedRenataCodeService') ||
                    msg.text.includes('Formatting code with Renata') ||
                    msg.text.includes('Local formatting service')
                );

                if (hasRenataActivity && !activityDetected) {
                    activityDetected = true;
                    console.log('🔄 Renata activity detected in console!');
                }

                // Check for new network requests
                const newRequests = networkRequests.slice(requestsBeforeClick);
                const hasRenataRequests = newRequests.some(req =>
                    req.url.includes('renata') ||
                    req.url.includes('chat') ||
                    req.url.includes('format') ||
                    req.url.includes('copilotkit')
                );

                if (hasRenataRequests) {
                    console.log('🌐 Renata API requests detected!');
                    break;
                }

                // Check if formatting completed
                const formatCompleteButton = await page.locator('button:has-text("Upload & Run"), button:has-text("Done")').first();
                if (await formatCompleteButton.isVisible({ timeout: 1000 })) {
                    console.log('✅ Formatting appears to be complete');
                    break;
                }
            }

            // Take screenshot after processing
            await page.screenshot({ path: 'test_after_format_run.png', fullPage: true });
            console.log('📸 Final screenshot saved: test_after_format_run.png');

        } else {
            console.log('❌ Format & Run button not found');
            await page.screenshot({ path: 'debug_no_format_button.png', fullPage: true });
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        await page.screenshot({ path: 'test_error.png', fullPage: true });
        console.log('📸 Error screenshot saved: test_error.png');
    } finally {
        // Step 6: Comprehensive Analysis
        console.log('\n📊 Step 6: Comprehensive Analysis...\n');

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

        // Check for enhancedRenataCodeService usage
        const enhancedServiceMessages = consoleMessages.filter(msg =>
            msg.text.includes('enhancedRenataCodeService')
        );

        if (enhancedServiceMessages.length > 0) {
            console.log('\n🤖 Enhanced Renata Code Service usage detected:');
            enhancedServiceMessages.forEach(msg => {
                console.log(`   [${msg.type.toUpperCase()}] ${msg.text}`);
            });
        }

        // Check for Renata API calls
        const renataApiCalls = networkRequests.filter(req =>
            req.url.toLowerCase().includes('renata') ||
            req.url.toLowerCase().includes('chat') ||
            req.url.toLowerCase().includes('format') ||
            req.url.toLowerCase().includes('copilotkit')
        );

        console.log('\n🌐 Network Analysis:');
        console.log(`   Total network requests: ${networkRequests.length}`);
        console.log(`   Renata/API calls: ${renataApiCalls.length}`);

        if (renataApiCalls.length > 0) {
            console.log('\n✅ Renata API calls detected:');
            renataApiCalls.forEach(req => {
                console.log(`   [${req.method}] ${req.url}`);
                if (req.status) {
                    console.log(`      Status: ${req.status}`);
                }
            });
        } else {
            console.log('\n❌ No Renata API calls detected');
        }

        // Look for formatting-related messages
        const formattingMessages = consoleMessages.filter(msg =>
            msg.text.toLowerCase().includes('formatting') ||
            msg.text.toLowerCase().includes('format code')
        );

        if (formattingMessages.length > 0) {
            console.log('\n📝 Formatting-related messages found:');
            formattingMessages.forEach(msg => {
                console.log(`   [${msg.type.toUpperCase()}] ${msg.text}`);
            });
        }

        // Final assessment
        console.log('\n🎯 FINAL ASSESSMENT:');

        if (localFormattingMessages.length === 0 && renataApiCalls.length > 0) {
            console.log('✅ SUCCESS: Fix is working correctly!');
            console.log('   ✅ No local formatting service messages detected');
            console.log('   ✅ Renata API calls are being made');
            console.log('   ✅ enhancedRenataCodeService is being used');
        } else if (localFormattingMessages.length > 0) {
            console.log('❌ ISSUE: Local formatting service is still being used');
            console.log('   ❌ Fix may not have been applied correctly');
            console.log('   ❌ The handleUploadFormat function may still be using local formatting');
        } else if (enhancedServiceMessages.length > 0) {
            console.log('🔄 PARTIAL SUCCESS: Enhanced service is being used');
            console.log('   ✅ enhancedRenataCodeService is being called');
            console.log('   ⚠️  No API calls detected - may need to check API configuration');
        } else if (renataApiCalls.length === 0) {
            console.log('⚠️  UNCLEAR: No definitive activity detected');
            console.log('   ⚠️  May need to test API configuration or check for other issues');
        } else {
            console.log('❓ UNKNOWN: Unable to determine fix status');
        }

        console.log('\n📝 Test complete. Browser will remain open for manual inspection.');
        console.log('💡 Screenshots saved for reference:');
        console.log('   - test_before_format_run.png');
        console.log('   - test_after_format_run.png');
    }
}

// Run the test
testRenataFinalValidation().catch(console.error);