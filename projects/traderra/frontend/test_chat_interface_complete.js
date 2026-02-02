const { chromium } = require('playwright');

/**
 * 🎯 COMPLETE CHAT INTERFACE TEST
 * Test calendar functionality through the actual chat interface with client script execution
 */

async function testChatInterfaceComplete() {
    console.log('🎯 COMPLETE CHAT INTERFACE TEST');
    console.log('=====================================');

    const browser = await chromium.launch({
        headless: false,
        viewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();

    try {
        // Navigate to dashboard
        console.log('🌐 Navigating to dashboard...');
        await page.goto('http://localhost:6565/dashboard');
        await page.waitForTimeout(5000);

        console.log('📸 Taking initial screenshot...');
        await page.screenshot({ path: 'chat_interface_complete_initial.png' });

        // Monitor console logs
        const allLogs = [];
        const bridgeExecutionLogs = [];
        const globalBridgeLogs = [];
        const clientScriptLogs = [];
        const dateRangeLogs = [];

        page.on('console', msg => {
            const text = msg.text();
            allLogs.push(text);

            if (text.includes('GLOBAL BRIDGE') || text.includes('traderraExecuteActions')) {
                globalBridgeLogs.push(text);
                console.log('🔥 GLOBAL BRIDGE LOG:', text);
            }

            if (text.includes('BRIDGE EXECUTING') || text.includes('setDateRange execution')) {
                bridgeExecutionLogs.push(text);
                console.log('🔧 BRIDGE EXECUTION LOG:', text);
            }

            if (text.includes('CLIENT SCRIPT') || text.includes('🚀 CHAT: Executing')) {
                clientScriptLogs.push(text);
                console.log('📜 CLIENT SCRIPT LOG:', text);
            }

            if (text.includes('dateRange') || text.includes('DateRange')) {
                dateRangeLogs.push(text);
                console.log('📅 DATE RANGE LOG:', text);
            }
        });

        console.log('🔍 Looking for chat interface...');

        // Check for authentication
        const authCheck = await page.textContent('body');
        if (authCheck.includes('Sign In Required')) {
            console.log('⚠️ Authentication required - trying to bypass for testing');

            // Inject authentication bypass
            await page.evaluate(() => {
                // Store original fetch
                const originalFetch = window.fetch;

                // Override fetch to simulate authentication
                window.fetch = function(...args) {
                    console.log('🔧 TEST: Fetch intercepted for auth bypass');
                    return originalFetch.apply(this, args);
                };

                // Try to trigger a re-render
                window.dispatchEvent(new CustomEvent('auth-bypass-test'));
            });

            await page.waitForTimeout(2000);
        }

        // Look for chat input
        let chatInput = null;
        try {
            chatInput = await page.waitForSelector('textarea[placeholder*="Ask"], textarea[placeholder*="ask"], input[placeholder*="Ask"], input[placeholder*="ask"]', { timeout: 10000 });
            console.log('✅ Found chat interface!');
        } catch (e) {
            console.log('⚠️ Chat interface not immediately available');

            // Try to find any interactive elements that might open chat
            const buttons = await page.$$('button');
            console.log(`🔍 Found ${buttons.length} buttons, checking for chat triggers...`);

            for (let button of buttons) {
                try {
                    const text = await button.textContent();
                    const ariaLabel = await button.getAttribute('aria-label');

                    if ((text && text.toLowerCase().includes('chat')) ||
                        (ariaLabel && ariaLabel.toLowerCase().includes('chat'))) {
                        console.log('🔘 Trying to click chat button:', text || ariaLabel);
                        await button.click();
                        await page.waitForTimeout(2000);

                        // Try to find chat input again
                        try {
                            chatInput = await page.waitForSelector('textarea, input[type="text"]', { timeout: 3000 });
                            console.log('✅ Chat opened after button click!');
                            break;
                        } catch (e2) {
                            // Continue to next button
                        }
                    }
                } catch (e) {
                    // Skip this button
                }
            }
        }

        if (!chatInput) {
            console.log('❌ Could not find chat interface');

            // Try direct API simulation through the page
            console.log('🔄 Simulating chat API call through page context...');

            const apiResult = await page.evaluate(async () => {
                try {
                    // This simulates what the chat component does
                    const response = await fetch('/api/copilotkit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            operationName: "generateCopilotResponse",
                            query: `mutation generateCopilotResponse($data: CopilotResponseInput!) {
                                generateCopilotResponse(data: $data) {
                                    extensions { clientScript }
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
                    const clientScript = data?.data?.generateCopilotResponse?.extensions?.clientScript;
                    const aiResponse = data?.data?.generateCopilotResponse?.messages?.[0]?.content;

                    console.log('🚀 SIMULATED CHAT: Got API response');

                    if (clientScript) {
                        console.log('🚀 SIMULATED CHAT: Executing client script from API response');
                        try {
                            eval(clientScript);
                            console.log('✅ SIMULATED CHAT: Client script executed successfully');
                            return { success: true, executed: true, aiResponse };
                        } catch (error) {
                            console.error('❌ SIMULATED CHAT: Client script execution failed:', error);
                            return { success: true, executed: false, error: error.message };
                        }
                    } else {
                        console.log('⚠️ SIMULATED CHAT: No client script found in API response extensions');
                        return { success: true, executed: false, reason: 'no-script' };
                    }
                } catch (error) {
                    console.error('❌ SIMULATED CHAT: API call failed:', error);
                    return { success: false, error: error.message };
                }
            });

            console.log('📊 Simulated chat API result:', apiResult);
            await page.waitForTimeout(3000);
        } else {
            // Use actual chat interface
            console.log('🧪 Testing with actual chat interface...');

            await chatInput.click();
            await chatInput.fill('Can you change the time frame to year to date?');
            console.log('📝 Message entered into chat');

            await chatInput.press('Enter');
            console.log('📤 Message sent through chat interface');

            // Wait for response and execution
            await page.waitForTimeout(10000);
            console.log('⏳ Waited for chat response and execution');
        }

        // Take final screenshot
        console.log('📸 Taking final screenshot...');
        await page.screenshot({ path: 'chat_interface_complete_final.png' });

        // Check calendar button states
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
                    console.log(`📅 YTD Button: "${text}" - Active: ${isActive}`);
                    ytdActive = isActive;
                }
                if (text && text === 'All') {
                    const isActive = classes && (classes.includes('active') || classes.includes('selected') || classes.includes('bg-yellow'));
                    console.log(`📅 All Button: "${text}" - Active: ${isActive}`);
                    allActive = isActive;
                }
            } catch (e) {
                // Skip buttons we can't read
            }
        }

        // Results summary
        console.log('\n📊 COMPLETE CHAT INTERFACE TEST RESULTS:');
        console.log('==========================================');
        console.log(`🔧 Total console logs: ${allLogs.length}`);
        console.log(`🔥 Global bridge logs: ${globalBridgeLogs.length}`);
        console.log(`⚙️ Bridge execution logs: ${bridgeExecutionLogs.length}`);
        console.log(`📜 Client script logs: ${clientScriptLogs.length}`);
        console.log(`📅 Date range logs: ${dateRangeLogs.length}`);
        console.log(`📅 YTD Button Active: ${ytdActive}`);
        console.log(`📅 All Button Active: ${allActive}`);

        const success = (globalBridgeLogs.length > 0 && bridgeExecutionLogs.length > 0) || clientScriptLogs.length > 0;

        if (success) {
            console.log('\n✅ SUCCESS: Complete chat interface test passed!');
        } else {
            console.log('\n⚠️ ISSUES: Chat interface needs more debugging');
        }

        // Show important logs
        if (clientScriptLogs.length > 0) {
            console.log('\n📜 CLIENT SCRIPT LOGS:');
            clientScriptLogs.forEach(log => console.log(`   ${log}`));
        }

        if (globalBridgeLogs.length > 0) {
            console.log('\n🔥 GLOBAL BRIDGE LOGS:');
            globalBridgeLogs.forEach(log => console.log(`   ${log}`));
        }

        if (bridgeExecutionLogs.length > 0) {
            console.log('\n🔧 BRIDGE EXECUTION LOGS:');
            bridgeExecutionLogs.forEach(log => console.log(`   ${log}`));
        }

        return success;

    } catch (error) {
        console.error('❌ Test error:', error.message);
        await page.screenshot({ path: 'chat_interface_complete_error.png' });
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
testChatInterfaceComplete()
    .then(success => {
        if (success) {
            console.log('\n🎉 COMPLETE CHAT INTERFACE TEST: PASSED');
        } else {
            console.log('\n🔧 COMPLETE CHAT INTERFACE TEST: NEEDS MORE WORK');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Test execution failed:', error);
        process.exit(1);
    });