const { chromium } = require('playwright');

/**
 * 🔥 COMPREHENSIVE CALENDAR TEST
 * Tests all calendar functions to ensure complete functionality restoration
 */

async function comprehensiveCalendarTest() {
    console.log('🔥 COMPREHENSIVE CALENDAR FUNCTIONALITY TEST');
    console.log('===========================================');

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

        // Test commands with expected outcomes
        const testCommands = [
            {
                command: "show me 7 days",
                expected: "7d",
                description: "7-day view"
            },
            {
                command: "show me 30 days",
                expected: "30d",
                description: "30-day view"
            },
            {
                command: "show me 90 days",
                expected: "90d",
                description: "90-day view"
            },
            {
                command: "show me year to date",
                expected: "YTD",
                description: "Year-to-date view"
            },
            {
                command: "show me all time",
                expected: "All",
                description: "All-time view"
            },
            {
                command: "set calendar to this week",
                expected: "7d",
                description: "Weekly view (alternative phrasing)"
            },
            {
                command: "change date range to ytd",
                expected: "YTD",
                description: "YTD (alternative phrasing)"
            }
        ];

        const results = [];

        for (let i = 0; i < testCommands.length; i++) {
            const test = testCommands[i];
            console.log(`\n📋 TEST ${i + 1}/${testCommands.length}: ${test.description}`);
            console.log(`Command: "${test.command}"`);
            console.log(`Expected: "${test.expected}" button active`);

            // Get before state
            const beforeState = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button')).filter(btn => {
                    const text = btn.textContent?.trim();
                    return text && (text === '7d' || text === '30d' || text === '90d' || text === 'YTD' || text === 'All');
                });

                return buttons.map(btn => ({
                    text: btn.textContent?.trim(),
                    isActive: btn.className.includes('bg-[#B8860B]') || btn.className.includes('traderra-date-active')
                }));
            });

            const activeBefore = beforeState.find(btn => btn.isActive)?.text || 'none';
            console.log(`Before: "${activeBefore}" active`);

            // Send API command
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
                                    messages: [{ content: command, role: "user" }]
                                }
                            }
                        })
                    });

                    const data = await response.json();
                    const clientScript = data?.data?.generateCopilotResponse?.extensions?.clientScript;

                    if (clientScript) {
                        eval(clientScript);
                    }

                    return {
                        success: true,
                        hasScript: !!clientScript,
                        aiMessage: data?.data?.generateCopilotResponse?.messages?.[0]?.content
                    };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }, test.command);

            // Wait for changes
            await page.waitForTimeout(2000);

            // Get after state
            const afterState = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button')).filter(btn => {
                    const text = btn.textContent?.trim();
                    return text && (text === '7d' || text === '30d' || text === '90d' || text === 'YTD' || text === 'All');
                });

                return buttons.map(btn => ({
                    text: btn.textContent?.trim(),
                    isActive: btn.className.includes('bg-[#B8860B]') || btn.className.includes('traderra-date-active')
                }));
            });

            const activeAfter = afterState.find(btn => btn.isActive)?.text || 'none';
            console.log(`After:  "${activeAfter}" active`);

            // Determine success
            const expectedActive = activeAfter === test.expected;
            const stateChanged = activeBefore !== activeAfter;

            console.log(`Expected "${test.expected}": ${expectedActive ? '✅' : '❌'}`);
            console.log(`State changed: ${stateChanged ? '✅' : '❌'}`);
            console.log(`API success: ${apiResult.success ? '✅' : '❌'}`);
            console.log(`Script executed: ${apiResult.hasScript ? '✅' : '❌'}`);

            const testPassed = expectedActive && apiResult.success && apiResult.hasScript;
            console.log(`Result: ${testPassed ? '🎉 PASSED' : '❌ FAILED'}`);

            results.push({
                ...test,
                activeBefore,
                activeAfter,
                expectedActive,
                stateChanged,
                testPassed,
                apiResult
            });

            // Short delay before next test
            await page.waitForTimeout(1000);
        }

        // Summary
        console.log('\n📊 COMPREHENSIVE TEST SUMMARY');
        console.log('==============================');

        const passedTests = results.filter(r => r.testPassed).length;
        const totalTests = results.length;

        console.log(`Tests passed: ${passedTests}/${totalTests}`);
        console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

        results.forEach((result, i) => {
            console.log(`\n${i + 1}. ${result.description}`);
            console.log(`   Command: "${result.command}"`);
            console.log(`   Expected: "${result.expected}", Got: "${result.activeAfter}"`);
            console.log(`   Result: ${result.testPassed ? '✅ PASSED' : '❌ FAILED'}`);

            if (!result.testPassed) {
                console.log(`   Issues:`);
                if (!result.expectedActive) console.log(`     - Wrong button active (expected "${result.expected}", got "${result.activeAfter}")`);
                if (!result.apiResult.success) console.log(`     - API call failed`);
                if (!result.apiResult.hasScript) console.log(`     - No client script in response`);
            }
        });

        const overallSuccess = passedTests === totalTests;

        if (overallSuccess) {
            console.log('\n🎉 ALL TESTS PASSED!');
            console.log('🔥 Calendar functionality is fully restored!');
            console.log('✅ Renata AI can now control ALL calendar functions!');
        } else {
            console.log(`\n⚠️ ${totalTests - passedTests} tests failed`);
            console.log('❌ Some calendar functions may need additional fixes');
        }

        return overallSuccess;

    } catch (error) {
        console.error('❌ Test error:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

// Run comprehensive test
comprehensiveCalendarTest()
    .then(success => {
        if (success) {
            console.log('\n✅ COMPREHENSIVE CALENDAR TEST: COMPLETE SUCCESS');
            console.log('🎯 All calendar commands work perfectly!');
            console.log('🔥 Ready for the user\'s 500+ message testing sequences!');
        } else {
            console.log('\n❌ COMPREHENSIVE CALENDAR TEST: PARTIAL FAILURE');
            console.log('⚠️ Some functions may need additional work');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Test execution failed:', error);
        process.exit(1);
    });