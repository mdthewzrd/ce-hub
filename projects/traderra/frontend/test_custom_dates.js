const { chromium } = require('playwright');

/**
 * 🔥 CUSTOM DATE RANGE TEST
 * Tests enhanced date detection for complex requests like "august til now"
 */

async function testCustomDateRanges() {
    console.log('🔥 CUSTOM DATE RANGE TEST');
    console.log('========================');

    const browser = await chromium.launch({
        headless: false,
        viewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();

    try {
        // Navigate to main page
        console.log('\n🌐 Navigating to main page...');
        await page.goto('http://localhost:6565/');
        await page.waitForTimeout(3000);

        // Test custom date commands
        const customDateCommands = [
            {
                command: "show me august til now",
                expectedRange: "90day",
                description: "August to November (3+ months)"
            },
            {
                command: "since september",
                expectedRange: "90day",
                description: "Since September (2+ months)"
            },
            {
                command: "from october to now",
                expectedRange: "month",
                description: "October to November (1+ month)"
            },
            {
                command: "last 3 months",
                expectedRange: "90day",
                description: "Past 3 months"
            },
            {
                command: "show me Q4 data",
                expectedRange: "90day",
                description: "Q4 quarter"
            }
        ];

        const results = [];

        for (let i = 0; i < customDateCommands.length; i++) {
            const test = customDateCommands[i];
            console.log(`\n📋 TEST ${i + 1}/${customDateCommands.length}: ${test.description}`);
            console.log(`Command: "${test.command}"`);
            console.log(`Expected: ${test.expectedRange} range activation`);

            // Send API command and capture response
            const result = await page.evaluate(async (command) => {
                try {
                    const response = await fetch('/api/copilotkit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            operationName: "generateCopilotResponse",
                            query: `mutation generateCopilotResponse($data: CopilotResponseInput!) {
                                generateCopilotResponse(data: $data) {
                                    extensions { clientScript traderraActions }
                                    messages { content }
                                }
                            }`,
                            variables: {
                                data: {
                                    messages: [{ content: command, role: "user" }]
                                }
                            }
                        })
                    });

                    const data = await response.json();
                    const traderraActions = data?.data?.generateCopilotResponse?.extensions?.traderraActions || [];
                    const aiMessage = data?.data?.generateCopilotResponse?.messages?.[0]?.content;

                    // Find date range action
                    const dateAction = traderraActions.find(action => action.type === 'setDateRange');

                    return {
                        success: response.ok,
                        hasDateAction: !!dateAction,
                        detectedRange: dateAction?.payload?.range || 'none',
                        aiMessage: aiMessage || 'No response',
                        allActions: traderraActions
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        detectedRange: 'error'
                    };
                }
            }, test.command);

            console.log(`💬 AI Response: "${result.aiMessage}"`);
            console.log(`🔍 Detected Range: "${result.detectedRange}"`);
            console.log(`✅ Expected Range: "${test.expectedRange}"`);

            const rangeMatches = result.detectedRange === test.expectedRange;
            console.log(`🎯 Range Match: ${rangeMatches ? '✅ CORRECT' : '❌ WRONG'}`);
            console.log(`📊 API Success: ${result.success ? '✅' : '❌'}`);
            console.log(`🔧 Has Date Action: ${result.hasDateAction ? '✅' : '❌'}`);

            const testPassed = rangeMatches && result.success && result.hasDateAction;
            console.log(`📈 Result: ${testPassed ? '🎉 PASSED' : '❌ FAILED'}`);

            results.push({
                ...test,
                result,
                rangeMatches,
                testPassed
            });

            await page.waitForTimeout(1000);
        }

        // Summary
        console.log('\n📊 CUSTOM DATE RANGE TEST SUMMARY');
        console.log('==================================');

        const passedTests = results.filter(r => r.testPassed).length;
        const totalTests = results.length;

        console.log(`Passed tests: ${passedTests}/${totalTests}`);
        console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

        results.forEach((result, i) => {
            console.log(`\n${i + 1}. ${result.description}`);
            console.log(`   Command: "${result.command}"`);
            console.log(`   Expected: "${result.expectedRange}", Got: "${result.result.detectedRange}"`);
            console.log(`   Response: "${result.result.aiMessage}"`);
            console.log(`   Result: ${result.testPassed ? '✅ PASSED' : '❌ FAILED'}`);

            if (!result.testPassed) {
                if (!result.rangeMatches) console.log(`     - Wrong range detected`);
                if (!result.result.success) console.log(`     - API call failed`);
                if (!result.result.hasDateAction) console.log(`     - No date action generated`);
            }
        });

        const overallSuccess = passedTests === totalTests;

        if (overallSuccess) {
            console.log('\n🎉 ALL CUSTOM DATE TESTS PASSED!');
            console.log('✅ Complex date range requests now work perfectly!');
            console.log('🔥 "august til now", "since september", etc. are supported!');
        } else {
            console.log(`\n⚠️ ${totalTests - passedTests} custom date tests failed`);
        }

        return overallSuccess;

    } catch (error) {
        console.error('❌ Test error:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

testCustomDateRanges()
    .then(success => {
        console.log(success ? '\n✅ CUSTOM DATE TEST: SUCCESS' : '\n❌ CUSTOM DATE TEST: FAILED');
        process.exit(success ? 0 : 1);
    });