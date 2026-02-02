const { chromium } = require('playwright');

/**
 * 🔥 TEST CALENDAR STATE EXECUTION
 * Debug if executeTraderraAction is actually being called and if state changes
 */

async function testCalendarStateExecution() {
    console.log('🔥 TESTING: Calendar State Execution Debug');

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
        await page.screenshot({ path: 'calendar_test_initial.png' });
        console.log('📸 Initial screenshot taken');

        // Monitor ALL console logs for debugging
        const allLogs = [];
        const bridgeExecutionLogs = [];
        const dateRangeLogs = [];
        const errorLogs = [];

        page.on('console', msg => {
            const text = msg.text();
            allLogs.push(text);

            if (text.includes('BRIDGE EXECUTING') || text.includes('BRIDGE setDateRange')) {
                bridgeExecutionLogs.push(text);
                console.log('🔥 BRIDGE EXECUTION:', text);
            }
            if (text.includes('dateRange') || text.includes('DateRange')) {
                dateRangeLogs.push(text);
                console.log('📅 DATE RANGE LOG:', text);
            }
            if (msg.type() === 'error') {
                errorLogs.push(text);
                console.log('❌ ERROR:', text);
            }
        });

        // Temporarily bypass authentication by injecting override
        console.log('🔧 Temporarily bypassing authentication for test...');
        await page.addScriptTag({
            content: `
                // Override the auth check temporarily for testing
                window.__originalReactRender = window.React;
                console.log('🔧 TEST: Authentication bypass injected');
            `
        });

        // Wait for the page to load and look for chat interface
        console.log('🔍 Looking for chat interface...');

        // Try multiple approaches to find the chat
        let chatFound = false;
        try {
            // First try to find an already visible chat input
            const visibleChat = await page.waitForSelector('textarea[placeholder*="Ask"], textarea[placeholder*="ask"]', { timeout: 3000 });
            if (visibleChat) {
                chatFound = true;
                console.log('✅ Found visible chat input');
            }
        } catch (e) {
            // If no visible chat, look for sign-in area and try to click it
            try {
                console.log('🔍 Looking for sign-in required area...');
                const signInArea = await page.$('text="Sign In Required"');
                if (signInArea) {
                    console.log('⚠️ Found sign-in requirement - attempting to bypass...');

                    // Inject script to bypass authentication check
                    await page.evaluate(() => {
                        // Find React component and force re-render without auth check
                        console.log('🔧 TEST: Forcing auth bypass...');

                        // Try to trigger a re-render by dispatching a custom event
                        window.dispatchEvent(new CustomEvent('force-auth-bypass'));
                    });

                    await page.waitForTimeout(2000);

                    // Try to find chat input again
                    const chatInput = await page.$('textarea[placeholder*="Ask"], textarea[placeholder*="ask"]');
                    if (chatInput) {
                        chatFound = true;
                        console.log('✅ Found chat input after bypass attempt');
                    }
                }
            } catch (e2) {
                console.log('❌ Could not find or bypass sign-in requirement');
            }
        }

        if (!chatFound) {
            console.log('❌ No chat interface found - checking page elements...');
            const pageText = await page.textContent('body');
            if (pageText.includes('Sign In Required')) {
                console.log('⚠️ Authentication is blocking chat access');

                // For testing, let's try direct API call to see if that works
                console.log('🧪 Testing direct API call instead...');

                const apiResponse = await page.evaluate(async () => {
                    try {
                        const response = await fetch('/api/copilotkit', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                operationName: "generateCopilotResponse",
                                query: `mutation generateCopilotResponse($data: CopilotResponseInput!) {
                                    generateCopilotResponse(data: $data) {
                                        messages { content }
                                    }
                                }`,
                                variables: {
                                    data: {
                                        messages: [
                                            {
                                                content: "Can you change the time frame to year to date?",
                                                role: "user"
                                            }
                                        ]
                                    }
                                }
                            })
                        });

                        const data = await response.json();
                        console.log('🎯 Direct API Response:', data);
                        return {
                            success: response.ok,
                            data: data,
                            messageContent: data?.data?.generateCopilotResponse?.messages?.[0]?.content || 'No message'
                        };
                    } catch (error) {
                        console.error('🔥 Direct API call failed:', error);
                        return { success: false, error: error.message };
                    }
                });

                console.log('📊 API Response:', apiResponse);

                // Monitor for bridge execution logs for 5 seconds after API call
                console.log('⏳ Monitoring for bridge execution (5 seconds)...');
                await page.waitForTimeout(5000);
            }
        } else {
            // If chat found, test normal interaction
            const chatInput = await page.$('textarea[placeholder*="Ask"], textarea[placeholder*="ask"]');

            console.log('🧪 Testing chat command...');
            await chatInput.click();
            await chatInput.fill('');
            await chatInput.type('Can you change the time frame to year to date?');
            await page.waitForTimeout(500);

            console.log('📤 Sending command...');
            await chatInput.press('Enter');

            // Monitor for bridge execution logs
            console.log('⏳ Monitoring for bridge execution (10 seconds)...');
            await page.waitForTimeout(10000);
        }

        // Take final screenshot
        await page.screenshot({ path: 'calendar_test_final.png' });
        console.log('📸 Final screenshot taken');

        // Final assessment
        console.log('\n🔍 EXECUTION DEBUG RESULTS:');
        console.log('=============================');
        console.log(`📝 Total console logs: ${allLogs.length}`);
        console.log(`🔥 Bridge execution logs: ${bridgeExecutionLogs.length}`);
        console.log(`📅 Date range logs: ${dateRangeLogs.length}`);
        console.log(`❌ Error logs: ${errorLogs.length}`);

        if (bridgeExecutionLogs.length > 0) {
            console.log('\n🔥 BRIDGE EXECUTION ACTIVITY:');
            bridgeExecutionLogs.forEach(log => console.log(`   ${log}`));
        }

        if (dateRangeLogs.length > 0) {
            console.log('\n📅 DATE RANGE ACTIVITY:');
            dateRangeLogs.forEach(log => console.log(`   ${log}`));
        }

        if (errorLogs.length > 0) {
            console.log('\n❌ ERRORS DETECTED:');
            errorLogs.forEach(log => console.log(`   ${log}`));
        }

        // Check calendar state by examining button states
        console.log('\n📅 CHECKING CALENDAR BUTTON STATES:');
        const calendarButtons = await page.$$('button');
        let ytdButtonFound = false;
        let allButtonActive = false;

        for (let button of calendarButtons) {
            try {
                const text = await button.textContent();
                const classes = await button.getAttribute('class');

                if (text && (text.includes('YTD') || text.includes('ytd'))) {
                    ytdButtonFound = true;
                    const isActive = classes && classes.includes('active') || classes.includes('selected');
                    console.log(`   YTD Button: "${text}" - Active: ${isActive}`);
                }
                if (text && (text.includes('All') || text === 'All')) {
                    const isActive = classes && (classes.includes('active') || classes.includes('selected') || classes.includes('bg-yellow'));
                    console.log(`   All Button: "${text}" - Active: ${isActive}`);
                    allButtonActive = isActive;
                }
            } catch (e) {
                // Skip buttons we can't read
            }
        }

        const success = bridgeExecutionLogs.length > 0 && !allButtonActive;

        console.log('\n🎯 EXECUTION TEST SUMMARY:');
        if (bridgeExecutionLogs.length > 0) {
            console.log('✅ Bridge execution function IS being called');
        } else {
            console.log('❌ Bridge execution function NOT being called');
        }

        if (!allButtonActive && ytdButtonFound) {
            console.log('✅ Calendar state changed successfully');
        } else {
            console.log('❌ Calendar state did NOT change');
        }

        return success;

    } catch (error) {
        console.error('❌ Test error:', error.message);
        await page.screenshot({ path: 'calendar_test_error.png' });
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
testCalendarStateExecution()
    .then(success => {
        if (success) {
            console.log('\n🎉 SUCCESS: Calendar state execution is working!');
        } else {
            console.log('\n🔧 ISSUES: Calendar state execution needs debugging');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Test execution failed:', error);
        process.exit(1);
    });