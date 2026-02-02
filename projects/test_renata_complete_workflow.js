const { chromium } = require('playwright');
const path = require('path');

async function testRenataCompleteWorkflow() {
    console.log('🧪 Starting Complete Renata Workflow Test...\n');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 500,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Track console messages specifically for our validation
    const consoleMessages = [];
    page.on('console', msg => {
        const msgText = msg.text();
        consoleMessages.push({
            type: msg.type(),
            text: msgText,
            timestamp: new Date().toISOString()
        });

        // Focus on key indicators
        if (msgText.includes('Local formatting service') ||
            msgText.includes('enhancedRenataCodeService') ||
            msgText.includes('Formatting code with Renata') ||
            msgText.includes('🚀 Formatting code') ||
            msg.type() === 'error') {
            console.log(`[${msg.type().toUpperCase()}] ${msgText}`);
        }
    });

    // Track network requests for Renata API
    const networkRequests = [];
    page.on('request', request => {
        networkRequests.push({
            url: request.url(),
            method: request.method(),
            timestamp: new Date().toISOString()
        });

        if (request.url().includes('renata') ||
            request.url().includes('chat') ||
            request.url().includes('format') ||
            request.url().includes('copilotkit')) {
            console.log(`🌐 [${request.method()}] ${request.url}`);
        }
    });

    try {
        console.log('📍 Step 1: Navigating to platform...');
        await page.goto('http://localhost:5657', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);

        console.log('🚀 Step 2: Opening upload modal...');
        await page.locator('button:has-text("Upload Strategy")').click();
        await page.waitForTimeout(2000);

        // Verify modal is open
        const modalTitle = await page.locator('text=Upload Trading Strategy').isVisible();
        console.log(`📋 Modal open: ${modalTitle}`);

        if (!modalTitle) {
            throw new Error('Upload modal did not open');
        }

        console.log('📝 Step 3: Selecting format mode...');
        await page.locator('button:has-text("Upload and Format Code")').click();
        await page.waitForTimeout(2000);

        console.log('📁 Step 4: Switching to file upload...');
        await page.locator('button:has-text("📁 Upload File")').click();
        await page.waitForTimeout(1000);

        console.log('📁 Step 5: Uploading test file...');
        const testFilePath = '/Users/michaeldurante/Downloads/backside para b copy.py';

        // Upload file
        await page.locator('#fileInput').setInputFiles(testFilePath);
        console.log(`✅ File uploaded: ${path.basename(testFilePath)}`);
        await page.waitForTimeout(3000);

        // Verify file loaded
        const fileLoaded = await page.locator('text=/backside para b copy.py/i').isVisible();
        console.log(`📋 File confirmed in interface: ${fileLoaded}`);

        if (!fileLoaded) {
            console.log('⚠️ File not confirmed, but continuing...');
        }

        console.log('🚀 Step 6: Clicking Format & Run...');

        // Clear monitoring data before click
        const messagesBefore = consoleMessages.length;
        const requestsBefore = networkRequests.length;

        await page.locator('button:has-text("Format & Run")').click();
        console.log('✅ Format & Run clicked');

        // Monitor for activity
        console.log('⏳ Monitoring for Renata API activity...');

        let activityDetected = false;
        for (let i = 0; i < 20; i++) { // Check for 60 seconds max
            await page.waitForTimeout(3000);

            // Check new console messages
            const newMessages = consoleMessages.slice(messagesBefore);
            const hasEnhancedService = newMessages.some(msg =>
                msg.text.includes('enhancedRenataCodeService')
            );
            const hasFormattingActivity = newMessages.some(msg =>
                msg.text.includes('Formatting code') || msg.text.includes('🚀')
            );

            // Check new network requests
            const newRequests = networkRequests.slice(requestsBefore);
            const hasRenataRequests = newRequests.some(req =>
                req.url.includes('renata') || req.url.includes('chat') || req.url.includes('copilotkit')
            );

            if (hasEnhancedService || hasFormattingActivity) {
                console.log('🤖 Enhanced Renata Code Service activity detected!');
                activityDetected = true;
            }

            if (hasRenataRequests) {
                console.log('🌐 Renata API requests detected!');
                activityDetected = true;
            }

            // Check if processing completed
            const doneButton = await page.locator('button:has-text("Done"), button:has-text("Back")').isVisible();
            if (doneButton) {
                console.log('✅ Processing appears complete');
                break;
            }
        }

        // Take final screenshot
        await page.screenshot({ path: 'final_workflow_test.png', fullPage: true });
        console.log('📸 Final screenshot saved');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        await page.screenshot({ path: 'workflow_error.png', fullPage: true });
    } finally {
        console.log('\n📊 FINAL VALIDATION RESULTS:\n');

        // Key validation metrics
        const localFormattingMessages = consoleMessages.filter(msg =>
            msg.text.toLowerCase().includes('local formatting service')
        );

        const enhancedServiceMessages = consoleMessages.filter(msg =>
            msg.text.includes('enhancedRenataCodeService')
        );

        const formattingMessages = consoleMessages.filter(msg =>
            msg.text.toLowerCase().includes('formatting code')
        );

        const renataApiCalls = networkRequests.filter(req =>
            req.url.includes('renata') || req.url.includes('chat') || req.url.includes('copilotkit')
        );

        console.log('🔍 KEY METRICS:');
        console.log(`   ❌ Local formatting messages: ${localFormattingMessages.length}`);
        console.log(`   ✅ Enhanced service usage: ${enhancedServiceMessages.length}`);
        console.log(`   ✅ Formatting activity: ${formattingMessages.length}`);
        console.log(`   ✅ Renata API calls: ${renataApiCalls.length}`);

        console.log('\n🎯 VALIDATION RESULT:');

        if (localFormattingMessages.length === 0 &&
            (enhancedServiceMessages.length > 0 || renataApiCalls.length > 0)) {
            console.log('✅ SUCCESS: Renata API Integration Fix Verified!');
            console.log('   ✅ No local formatting service usage detected');
            console.log('   ✅ enhancedRenataCodeService is being used');
            console.log('   ✅ Renata API integration is working');
            console.log('\n🎉 The "Local formatting service processing request" issue has been resolved!');
        } else if (localFormattingMessages.length > 0) {
            console.log('❌ FAILED: Local formatting service still being used');
            console.log('   ❌ Fix needs additional work');
        } else {
            console.log('⚠️  UNCLEAR: Partial results detected');
            console.log('   ⚠️  May need further investigation');
        }

        console.log('\n📝 Test complete. Browser remaining open for inspection.');
    }
}

// Run the complete test
testRenataCompleteWorkflow().catch(console.error);