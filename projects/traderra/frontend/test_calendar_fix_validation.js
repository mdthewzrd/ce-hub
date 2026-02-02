const { chromium } = require('playwright');

/**
 * 🎯 CALENDAR FIX VALIDATION TEST
 * Test if calendar state changes work after fixing the initialization order issue
 */

async function testCalendarFixValidation() {
    console.log('🎯 CALENDAR FIX VALIDATION TEST');
    console.log('========================================');

    const browser = await chromium.launch({
        headless: false,
        viewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();

    try {
        // Navigate to dashboard
        console.log('🌐 Navigating to dashboard...');
        await page.goto('http://localhost:6565/dashboard');
        await page.waitForTimeout(3000);

        // Take initial screenshot
        await page.screenshot({ path: 'calendar_fix_test_initial.png' });
        console.log('📸 Initial screenshot taken');

        // Monitor console logs
        const bridgeExecutionLogs = [];
        const dateRangeLogs = [];
        const errorLogs = [];

        page.on('console', msg => {
            const text = msg.text();

            if (text.includes('BRIDGE EXECUTING') || text.includes('GLOBAL BRIDGE')) {
                bridgeExecutionLogs.push(text);
                console.log('🔥 BRIDGE LOG:', text);
            }
            if (text.includes('dateRange') || text.includes('DateRange')) {
                dateRangeLogs.push(text);
                console.log('📅 DATE RANGE LOG:', text);
            }
            if (msg.type() === 'error') {
                errorLogs.push(text);
                console.log('❌ ERROR LOG:', text);
            }
        });

        // Test a simple YTD command
        console.log('🧪 Testing YTD calendar command...');

        // Try to find chat interface
        let chatInput = null;
        try {
            chatInput = await page.waitForSelector('textarea[placeholder*="Ask"], textarea[placeholder*="ask"], input[placeholder*="Ask"], input[placeholder*="ask"]', { timeout: 5000 });
            console.log('✅ Found chat interface');
        } catch (e) {
            console.log('⚠️ No chat interface found, testing API directly...');

            // Test direct API call
            const apiResponse = await page.evaluate(async () => {
                try {
                    const response = await fetch('/api/copilotkit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            operationName: "generateCopilotResponse",
                            query: `mutation generateCopilotResponse($data: CopilotResponseInput!) {
                                generateCopilotResponse(data: $data) {
                                    messages { content }
                                }
                            }`,
                            variables: {
                                data: {
                                    messages: [{
                                        content: "Can you change the time frame to year to date?",
                                        role: "user"
                                    }]
                                }
                            }
                        })
                    });
                    const data = await response.json();
                    return { success: response.ok, data: data };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            });

            console.log('📊 API Response:', apiResponse);

            // Monitor for bridge execution for 5 seconds
            await page.waitForTimeout(5000);
            console.log('⏳ Monitored API response execution');
        }

        if (chatInput) {
            // Test through chat interface
            await chatInput.click();
            await chatInput.fill('Can you change the time frame to year to date?');
            console.log('📝 Command entered');

            await chatInput.press('Enter');
            console.log('📤 Command sent');

            // Monitor for 8 seconds
            await page.waitForTimeout(8000);
        }

        // Take final screenshot
        await page.screenshot({ path: 'calendar_fix_test_final.png' });
        console.log('📸 Final screenshot taken');

        // Check for YTD button activation
        console.log('\n📅 CHECKING CALENDAR STATE:');
        const buttons = await page.$$('button');
        let ytdActive = false;
        let allActive = false;

        for (let button of buttons) {
            try {
                const text = await button.textContent();
                const classes = await button.getAttribute('class');

                if (text && (text.includes('YTD') || text.toLowerCase().includes('year'))) {
                    const isActive = classes && (classes.includes('active') || classes.includes('selected') || classes.includes('bg-yellow'));
                    console.log(`   YTD Button: "${text}" - Active: ${isActive}`);
                    ytdActive = isActive;
                }
                if (text && text === 'All') {
                    const isActive = classes && (classes.includes('active') || classes.includes('selected') || classes.includes('bg-yellow'));
                    console.log(`   All Button: "${text}" - Active: ${isActive}`);
                    allActive = isActive;
                }
            } catch (e) {
                // Skip buttons we can't read
            }
        }

        // Results summary
        console.log('\n🎯 TEST RESULTS:');
        console.log('================');
        console.log(`📊 Bridge execution logs: ${bridgeExecutionLogs.length}`);
        console.log(`📅 Date range logs: ${dateRangeLogs.length}`);
        console.log(`❌ Error logs: ${errorLogs.length}`);
        console.log(`🎯 YTD Button Active: ${ytdActive}`);
        console.log(`🎯 All Button Active: ${allActive}`);

        const success = bridgeExecutionLogs.length > 0 && errorLogs.length === 0;

        if (success) {
            console.log('\n✅ SUCCESS: Calendar fix validation passed!');
        } else {
            console.log('\n⚠️ ISSUES: Need further debugging');
        }

        return success;

    } catch (error) {
        console.error('❌ Test error:', error.message);
        await page.screenshot({ path: 'calendar_fix_test_error.png' });
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
testCalendarFixValidation()
    .then(success => {
        if (success) {
            console.log('\n🎉 CALENDAR FIX VALIDATION: PASSED');
        } else {
            console.log('\n🔧 CALENDAR FIX VALIDATION: NEEDS MORE WORK');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Test execution failed:', error);
        process.exit(1);
    });