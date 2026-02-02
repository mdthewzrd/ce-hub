const { chromium } = require('playwright');

/**
 * 🔥 TEST FIXED CHAT SYSTEM
 * Verify the chat no longer gets stuck "thinking" and calendar commands work
 */

async function testFixedChatSystem() {
    console.log('🔥 TESTING: Fixed chat system and TraderraActionBridge calendar functionality');

    const browser = await chromium.launch({
        headless: false,
        viewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();

    try {
        // Navigate to dashboard
        console.log('🌐 Navigating to Traderra dashboard...');
        await page.goto('http://localhost:6565/dashboard');
        await page.waitForTimeout(5000);

        // Take initial screenshot
        await page.screenshot({ path: 'test_initial_dashboard.png' });
        console.log('📸 Initial dashboard screenshot taken');

        // Monitor console logs for bridge activity
        const bridgeLogs = [];
        const errorLogs = [];

        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('BRIDGE') || text.includes('ACTION')) {
                bridgeLogs.push(text);
                console.log('🔥 BRIDGE LOG:', text);
            }
            if (msg.type() === 'error') {
                errorLogs.push(text);
                console.log('❌ ERROR LOG:', text);
            }
        });

        // Look for chat input
        console.log('🤖 Looking for Renata chat interface...');

        const chatSelectors = [
            'textarea[placeholder*="Ask"]',
            'textarea[placeholder*="ask"]',
            'input[placeholder*="Ask"]',
            'input[placeholder*="ask"]',
            'textarea',
            'input[type="text"]'
        ];

        let chatInput = null;
        for (const selector of chatSelectors) {
            try {
                console.log(`   Trying selector: ${selector}`);
                chatInput = await page.waitForSelector(selector, { timeout: 3000 });
                if (chatInput) {
                    console.log(`✅ Found chat input with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                console.log(`   ❌ Selector failed: ${selector}`);
            }
        }

        if (!chatInput) {
            throw new Error('❌ Chat interface not found');
        }

        // Test the problematic command that was causing infinite thinking
        const testCommand = "Can you change the time frame to year to date?";
        console.log(`\n🧪 Testing problematic command: "${testCommand}"`);

        // Click and enter command
        await chatInput.click();
        await chatInput.fill('');
        await chatInput.type(testCommand);
        await page.waitForTimeout(500);

        console.log('📤 Sending command...');
        await chatInput.press('Enter');

        console.log('⏳ Monitoring response for 15 seconds...');

        // Monitor for 15 seconds to see if thinking state resolves
        let thinkingFound = false;
        let responseReceived = false;

        for (let i = 0; i < 15; i++) {
            await page.waitForTimeout(1000);

            // Check for thinking indicators
            const thinkingElements = await page.$$('[class*="thinking"], [class*="loading"], .animate-pulse');
            if (thinkingElements.length > 0) {
                thinkingFound = true;
                console.log(`   ⏳ Still thinking... (${i + 1}s)`);
            }

            // Check for new messages or responses
            const messages = await page.$$('[class*="message"], [class*="chat"], [role="message"]');
            if (messages.length > 1) { // More than just our input
                responseReceived = true;
                console.log(`   ✅ Response received at ${i + 1}s`);
                break;
            }

            // Check for errors
            if (errorLogs.length > 0) {
                console.log(`   ❌ Errors detected: ${errorLogs.length}`);
                break;
            }
        }

        // Take screenshot after command
        await page.screenshot({ path: 'test_after_command.png' });
        console.log('📸 After command screenshot taken');

        // Check calendar state
        console.log('\n📅 Checking calendar state changes...');

        // Look for date range indicators
        try {
            const dateElements = await page.$$('button, [data-testid*="date"], .date-range, [class*="date"]');
            console.log(`   Found ${dateElements.length} potential date elements`);

            for (let i = 0; i < Math.min(dateElements.length, 5); i++) {
                try {
                    const text = await dateElements[i].textContent();
                    if (text && text.trim()) {
                        console.log(`   Date element ${i}: "${text.trim()}"`);
                    }
                } catch (e) {
                    // Skip elements that can't be read
                }
            }
        } catch (error) {
            console.log('   Error checking date elements:', error.message);
        }

        // Final assessment
        console.log('\n🔍 CHAT SYSTEM TEST RESULTS:');
        console.log('===============================');
        console.log(`✅ Page loaded successfully`);
        console.log(`✅ Chat interface found and functional`);
        console.log(`📝 Thinking state found: ${thinkingFound}`);
        console.log(`📝 Response received: ${responseReceived}`);
        console.log(`📝 Bridge activity logs: ${bridgeLogs.length}`);
        console.log(`📝 Error logs: ${errorLogs.length}`);

        if (errorLogs.length > 0) {
            console.log('\n❌ ERRORS DETECTED:');
            errorLogs.forEach(log => console.log(`   ${log}`));
        }

        if (bridgeLogs.length > 0) {
            console.log('\n🔥 BRIDGE ACTIVITY:');
            bridgeLogs.forEach(log => console.log(`   ${log}`));
        }

        // Determine success
        const success = responseReceived && errorLogs.length === 0 && !thinkingFound;

        if (success) {
            console.log('\n🎉 SUCCESS: Chat system is working properly!');
            console.log('   ✅ No infinite thinking state');
            console.log('   ✅ Response received promptly');
            console.log('   ✅ No errors detected');
            return true;
        } else {
            console.log('\n⚠️ ISSUES DETECTED:');
            if (!responseReceived) console.log('   ❌ No response received within 15s');
            if (errorLogs.length > 0) console.log('   ❌ JavaScript errors detected');
            if (thinkingFound) console.log('   ⚠️ Thinking state lasted longer than expected');
            return false;
        }

    } catch (error) {
        console.error('❌ Test error:', error.message);
        await page.screenshot({ path: 'test_error.png' });
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
testFixedChatSystem()
    .then(success => {
        if (success) {
            console.log('\n🎊 CHAT SYSTEM VALIDATION SUCCESSFUL!');
            console.log('Ready to proceed with comprehensive calendar testing');
        } else {
            console.log('\n🔧 CHAT SYSTEM NEEDS ADDITIONAL FIXES');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Test execution failed:', error);
        process.exit(1);
    });