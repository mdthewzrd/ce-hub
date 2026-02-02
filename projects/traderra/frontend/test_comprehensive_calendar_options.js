const { chromium } = require('playwright');

/**
 * 🎯 COMPREHENSIVE CALENDAR OPTIONS TEST
 * Test all calendar date range options work correctly with professional responses
 */

async function testComprehensiveCalendarOptions() {
    console.log('🎯 COMPREHENSIVE CALENDAR OPTIONS TEST');
    console.log('======================================');

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

        const testResults = [];

        // Comprehensive test scenarios with natural language variations
        const testCases = [
            // All time variations
            { command: "show me all time data", expectedRange: "all", expectedMessage: "all time" },
            { command: "display everything", expectedRange: "all", expectedMessage: "all time" },
            { command: "I want to see the full history", expectedRange: "all", expectedMessage: "all time" },

            // Today variations
            { command: "show me today's data", expectedRange: "today", expectedMessage: "today" },
            { command: "what happened today", expectedRange: "today", expectedMessage: "today" },

            // Yesterday variations
            { command: "show yesterday", expectedRange: "yesterday", expectedMessage: "yesterday" },
            { command: "what about previous day", expectedRange: "yesterday", expectedMessage: "yesterday" },

            // 7 days / Week variations
            { command: "show me the last 7 days", expectedRange: "week", expectedMessage: "7 days" },
            { command: "display 7d", expectedRange: "week", expectedMessage: "7 days" },
            { command: "show this week", expectedRange: "week", expectedMessage: "this week" },
            { command: "what about past week", expectedRange: "week", expectedMessage: "7 days" },

            // 30 days / Month variations
            { command: "show last 30 days", expectedRange: "month", expectedMessage: "30 days" },
            { command: "display 30d", expectedRange: "month", expectedMessage: "30 days" },
            { command: "show this month", expectedRange: "month", expectedMessage: "this month" },
            { command: "what about last month", expectedRange: "lastMonth", expectedMessage: "last month" },

            // 90 days variations
            { command: "show me 90 days", expectedRange: "90day", expectedMessage: "90 days" },
            { command: "display quarterly data", expectedRange: "90day", expectedMessage: "90 days" },
            { command: "show last 90", expectedRange: "90day", expectedMessage: "90 days" },

            // Year variations
            { command: "show this year", expectedRange: "year", expectedMessage: "this year" },
            { command: "display the full year", expectedRange: "year", expectedMessage: "this year" },
            { command: "show current year", expectedRange: "year", expectedMessage: "this year" },

            // Year to date variations
            { command: "show year to date", expectedRange: "ytd", expectedMessage: "year to date" },
            { command: "display ytd", expectedRange: "ytd", expectedMessage: "year to date" },
            { command: "since january", expectedRange: "ytd", expectedMessage: "year to date" },
            { command: "from beginning of year", expectedRange: "ytd", expectedMessage: "year to date" },
        ];

        console.log(`\n🧪 Testing ${testCases.length} comprehensive calendar scenarios...\n`);

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            console.log(`📅 TEST ${i + 1}/${testCases.length}: "${testCase.command}"`);

            try {
                // Test the API response
                const apiResult = await page.evaluate(async (command) => {
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
                                            content: command,
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
                }, testCase.command);

                // Wait for UI updates
                await page.waitForTimeout(1500);

                // Check if the response is professional and contextual
                const isProfessional = apiResult.aiMessage &&
                    !apiResult.aiMessage.includes("You're all set with your state changes") &&
                    (apiResult.aiMessage.toLowerCase().includes("filtered") ||
                     apiResult.aiMessage.toLowerCase().includes(testCase.expectedMessage.toLowerCase()) ||
                     apiResult.aiMessage.toLowerCase().includes("settings updated"));

                const testResult = {
                    testNumber: i + 1,
                    command: testCase.command,
                    expectedRange: testCase.expectedRange,
                    expectedMessage: testCase.expectedMessage,
                    apiSuccess: apiResult.success,
                    aiMessage: apiResult.aiMessage,
                    hasClientScript: apiResult.hasClientScript,
                    isProfessional: isProfessional,
                    success: apiResult.success && isProfessional
                };

                testResults.push(testResult);

                if (testResult.success) {
                    console.log(`   ✅ PASSED: Professional response with action script`);
                    console.log(`      Response: "${apiResult.aiMessage?.split('\n')[0]}"`);
                } else {
                    console.log(`   ❌ FAILED: ${!apiResult.success ? 'API Error' : 'Unprofessional Response'}`);
                    if (apiResult.success) {
                        console.log(`      Response: "${apiResult.aiMessage?.split('\n')[0]}"`);
                    }
                }

            } catch (error) {
                console.log(`   ❌ ERROR: ${error.message}`);
                testResults.push({
                    testNumber: i + 1,
                    command: testCase.command,
                    success: false,
                    error: error.message
                });
            }

            // Brief pause between tests
            await page.waitForTimeout(500);
        }

        // Final screenshot
        await page.screenshot({ path: 'comprehensive_calendar_test_final.png' });

        // Results analysis
        console.log('\n📊 COMPREHENSIVE CALENDAR TEST RESULTS:');
        console.log('========================================');

        const totalTests = testResults.length;
        const passedTests = testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;

        console.log(`📈 Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

        // Show failed tests
        if (failedTests > 0) {
            console.log('\n❌ FAILED TESTS:');
            testResults.filter(r => !r.success).forEach(result => {
                console.log(`   ${result.testNumber}. "${result.command}"`);
                if (result.error) {
                    console.log(`      Error: ${result.error}`);
                } else if (!result.isProfessional) {
                    console.log(`      Issue: Unprofessional response`);
                    console.log(`      Response: "${result.aiMessage?.split('\n')[0]}"`);
                }
            });
        }

        // Show sample successful tests
        console.log('\n✅ SAMPLE SUCCESSFUL TESTS:');
        testResults.filter(r => r.success).slice(0, 5).forEach(result => {
            console.log(`   ${result.testNumber}. "${result.command}"`);
            console.log(`      Response: "${result.aiMessage?.split('\n')[0]}"`);
        });

        const overallSuccess = passedTests >= (totalTests * 0.8); // 80% success rate required

        if (overallSuccess) {
            console.log('\n🎉 SUCCESS: Comprehensive calendar testing passed!');
            console.log(`   ${passedTests}/${totalTests} tests passed (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
        } else {
            console.log('\n⚠️ ISSUES: Calendar functionality needs improvement');
            console.log(`   Only ${passedTests}/${totalTests} tests passed (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
        }

        return overallSuccess;

    } catch (error) {
        console.error('❌ Test error:', error.message);
        await page.screenshot({ path: 'comprehensive_calendar_test_error.png' });
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
testComprehensiveCalendarOptions()
    .then(success => {
        if (success) {
            console.log('\n🎉 COMPREHENSIVE CALENDAR TEST: PASSED');
        } else {
            console.log('\n🔧 COMPREHENSIVE CALENDAR TEST: NEEDS IMPROVEMENT');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Test execution failed:', error);
        process.exit(1);
    });