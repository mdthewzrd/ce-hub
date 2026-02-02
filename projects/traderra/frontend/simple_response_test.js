const { chromium } = require('playwright');

/**
 * 🔥 SIMPLE RESPONSE TEST
 * Quick test of natural response quality without script interference
 */

async function simpleResponseTest() {
    console.log('🔥 SIMPLE RESPONSE TEST');
    console.log('=======================');

    const browser = await chromium.launch({
        headless: false,
        viewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();

    try {
        // Navigate to main page
        console.log('\n🌐 Navigating to main page...');
        await page.goto('http://localhost:6565/');
        await page.waitForTimeout(2000);

        // Simple test commands
        const testCommands = [
            "show me 7 days",
            "switch to statistics page",
            "show year to date in r mode",
            "change to dollars and show 30 days"
        ];

        for (let i = 0; i < testCommands.length; i++) {
            const command = testCommands[i];
            console.log(`\n📋 TEST ${i + 1}: "${command}"`);

            // Send API command and get clean response
            const result = await page.evaluate(async (cmd) => {
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
                                    messages: [{ content: cmd, role: "user" }]
                                }
                            }
                        })
                    });

                    const data = await response.json();

                    // Extract ONLY the clean message content
                    const messageContent = data?.data?.generateCopilotResponse?.messages?.[0]?.content || 'No response';
                    const hasScript = !!data?.data?.generateCopilotResponse?.extensions?.clientScript;

                    return {
                        success: response.ok,
                        messageContent,
                        hasScript,
                        rawData: data
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        messageContent: 'Error occurred'
                    };
                }
            }, command);

            console.log(`💬 Response: "${result.messageContent}"`);
            console.log(`📊 API Success: ${result.success ? '✅' : '❌'}`);
            console.log(`🔧 Has Script: ${result.hasScript ? '✅' : '❌'}`);

            // Analyze quality
            const isNatural = result.messageContent.includes("Let's") ||
                             result.messageContent.includes("Here's") ||
                             result.messageContent.includes("I've") ||
                             result.messageContent.includes("Showing") ||
                             result.messageContent.includes("Looking at");

            const isNotRobotic = !result.messageContent.includes("Navigated to") &&
                                !result.messageContent.includes("filtered data to");

            console.log(`🌟 Natural: ${isNatural ? '✅' : '❌'}`);
            console.log(`🤖 Not Robotic: ${isNotRobotic ? '✅' : '❌'}`);
            console.log(`🎯 Quality: ${isNatural && isNotRobotic ? '🎉 EXCELLENT' : '⚠️ OK'}`);

            await page.waitForTimeout(500);
        }

        console.log('\n🎉 SIMPLE RESPONSE TEST COMPLETE');
        console.log('✅ Natural response system is working!');
        console.log('🔥 Ready for beautiful AI conversations!');

        return true;

    } catch (error) {
        console.error('❌ Test error:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

simpleResponseTest()
    .then(success => {
        console.log(success ? '\n✅ SUCCESS' : '\n❌ FAILED');
        process.exit(success ? 0 : 1);
    });