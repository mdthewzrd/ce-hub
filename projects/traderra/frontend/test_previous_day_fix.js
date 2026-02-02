const { chromium } = require('playwright');

/**
 * 🎯 TARGETED "PREVIOUS DAY" TEST
 * Test the specific edge case that was failing: "what about previous day"
 */

async function testPreviousDayFix() {
    console.log('🎯 PREVIOUS DAY EDGE CASE TEST');
    console.log('===============================');

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

        console.log('\n🧪 Testing "what about previous day"...');

        // Test the specific failing command
        const testResult = await page.evaluate(async () => {
            try {
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
                                    content: "what about previous day",
                                    role: "user"
                                }]
                            }
                        }
                    })
                });

                const data = await response.json();
                const aiMessage = data?.data?.generateCopilotResponse?.messages?.[0]?.content;
                const clientScript = data?.data?.generateCopilotResponse?.extensions?.clientScript;

                // Execute the client script if present
                if (clientScript) {
                    eval(clientScript);
                }

                return {
                    success: true,
                    aiMessage,
                    hasClientScript: !!clientScript
                };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Check if the response is professional and contextual
        const isProfessional = testResult.aiMessage &&
            !testResult.aiMessage.includes("You're all set with your state changes") &&
            !testResult.aiMessage.includes("I understand. I'm here to help") &&
            (testResult.aiMessage.toLowerCase().includes("filtered") ||
             testResult.aiMessage.toLowerCase().includes("yesterday") ||
             testResult.aiMessage.toLowerCase().includes("settings updated"));

        console.log('📊 TEST RESULTS:');
        console.log('================');
        console.log(`✅ API Response Success: ${testResult.success}`);
        console.log(`📝 AI Message: "${testResult.aiMessage}"`);
        console.log(`🔧 Has Client Script: ${testResult.hasClientScript}`);
        console.log(`🎯 Professional Response: ${isProfessional}`);

        const success = testResult.success && isProfessional && testResult.hasClientScript;

        if (success) {
            console.log('\n🎉 SUCCESS: "Previous day" edge case is now working!');
            console.log('   The pattern recognition fix resolved the issue.');
        } else {
            console.log('\n❌ FAILED: Edge case still needs work');
            if (!testResult.success) {
                console.log('   - API call failed');
            }
            if (!isProfessional) {
                console.log('   - Response is not professional/contextual');
            }
            if (!testResult.hasClientScript) {
                console.log('   - No client script generated');
            }
        }

        await page.screenshot({ path: 'previous_day_test_result.png' });
        return success;

    } catch (error) {
        console.error('❌ Test error:', error.message);
        await page.screenshot({ path: 'previous_day_test_error.png' });
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
testPreviousDayFix()
    .then(success => {
        if (success) {
            console.log('\n🎉 PREVIOUS DAY EDGE CASE: FIXED');
        } else {
            console.log('\n🔧 PREVIOUS DAY EDGE CASE: NEEDS MORE WORK');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Test execution failed:', error);
        process.exit(1);
    });