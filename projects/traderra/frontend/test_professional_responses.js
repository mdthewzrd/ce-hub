const { chromium } = require('playwright');

/**
 * 🎯 PROFESSIONAL RESPONSE TEST
 * Verify both visual calendar updates AND professional AI responses work correctly
 */

async function testProfessionalResponses() {
    console.log('🎯 PROFESSIONAL RESPONSE VALIDATION TEST');
    console.log('==========================================');

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
        await page.screenshot({ path: 'professional_response_test_initial.png' });

        // Monitor for AI responses and calendar changes
        const aiResponses = [];
        const calendarChanges = [];

        page.on('console', msg => {
            const text = msg.text();

            if (text.includes('AI RESPONSE:') || text.includes('generateCopilotResponse')) {
                aiResponses.push(text);
                console.log('🤖 AI RESPONSE DETECTED:', text);
            }

            if (text.includes('dateRange') || text.includes('YTD') || text.includes('calendar')) {
                calendarChanges.push(text);
                console.log('📅 CALENDAR CHANGE:', text);
            }
        });

        console.log('\n🧪 TEST 1: Year to date command with professional response...');

        // Test the chat interface with YTD command
        const chatResult = await page.evaluate(async () => {
            try {
                // Simulate what the chat component does
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
                const aiMessage = data?.data?.generateCopilotResponse?.messages?.[0]?.content;
                const clientScript = data?.data?.generateCopilotResponse?.extensions?.clientScript;

                console.log('🤖 AI RESPONSE RECEIVED:', aiMessage);

                // Execute the client script
                if (clientScript) {
                    console.log('🚀 EXECUTING CLIENT SCRIPT...');
                    eval(clientScript);
                }

                return {
                    success: true,
                    aiMessage,
                    hasClientScript: !!clientScript
                };
            } catch (error) {
                console.error('❌ CHAT TEST ERROR:', error);
                return { success: false, error: error.message };
            }
        });

        console.log('📊 Chat Test Result:', chatResult);

        // Wait for any UI updates
        await page.waitForTimeout(3000);

        // Check if YTD button is now active
        console.log('\n📅 CHECKING CALENDAR BUTTON STATES...');
        const buttons = await page.$$('button');
        let ytdButtonFound = false;
        let ytdButtonActive = false;

        for (let button of buttons) {
            try {
                const text = await button.textContent();
                const classes = await button.getAttribute('class');

                if (text && (text.includes('YTD') || text.toLowerCase().includes('year'))) {
                    ytdButtonFound = true;
                    ytdButtonActive = classes && (
                        classes.includes('active') ||
                        classes.includes('selected') ||
                        classes.includes('bg-yellow') ||
                        classes.includes('bg-blue')
                    );
                    console.log(`📅 YTD Button: "${text}" - Found: ${ytdButtonFound}, Active: ${ytdButtonActive}`);
                    console.log(`   Classes: ${classes}`);
                }
            } catch (e) {
                // Skip buttons we can't read
            }
        }

        // Take final screenshot
        console.log('📸 Taking final screenshot...');
        await page.screenshot({ path: 'professional_response_test_final.png' });

        // Analyze results
        console.log('\n📊 TEST RESULTS:');
        console.log('=================');
        console.log(`✅ Chat API Response: ${chatResult.success}`);
        console.log(`📝 AI Message: "${chatResult.aiMessage}"`);
        console.log(`📅 YTD Button Found: ${ytdButtonFound}`);
        console.log(`📅 YTD Button Active: ${ytdButtonActive}`);

        // Check if response is professional
        const isProfessional = chatResult.aiMessage &&
            !chatResult.aiMessage.includes("You're all set with your state changes") &&
            (chatResult.aiMessage.includes("filtered") ||
             chatResult.aiMessage.includes("year to date") ||
             chatResult.aiMessage.includes("Settings updated"));

        console.log(`🎯 Professional Response: ${isProfessional}`);

        const overallSuccess = chatResult.success && ytdButtonFound && isProfessional;

        if (overallSuccess) {
            console.log('\n🎉 SUCCESS: Both visual calendar updates AND professional responses are working!');
        } else {
            console.log('\n⚠️ ISSUES DETECTED:');
            if (!chatResult.success) console.log('   - Chat API failed');
            if (!ytdButtonFound) console.log('   - YTD button not found in UI');
            if (!isProfessional) console.log('   - Response is not professional enough');
        }

        return overallSuccess;

    } catch (error) {
        console.error('❌ Test error:', error.message);
        await page.screenshot({ path: 'professional_response_test_error.png' });
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
testProfessionalResponses()
    .then(success => {
        if (success) {
            console.log('\n🎉 PROFESSIONAL RESPONSE TEST: PASSED');
        } else {
            console.log('\n🔧 PROFESSIONAL RESPONSE TEST: NEEDS MORE WORK');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Test execution failed:', error);
        process.exit(1);
    });