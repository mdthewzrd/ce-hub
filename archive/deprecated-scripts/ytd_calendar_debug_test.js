#!/usr/bin/env node

/**
 * YTD CALENDAR DROPDOWN DEBUG TEST
 * Specifically tests the calendar dropdown navigation for "year to date" command
 */

const { chromium } = require('playwright');

class YTDCalendarDebugger {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async init() {
        console.log('🗓️ YTD CALENDAR DROPDOWN DEBUG TEST');
        console.log('🎯 Testing: "Go to dashboard, switch to year to date and dollars"');

        this.browser = await chromium.launch({
            headless: false,
            slowMo: 1000 // Slow down to see what's happening
        });
        this.page = await this.browser.newPage();

        // Enhanced console monitoring
        this.page.on('console', msg => {
            const text = msg.text();
            if (text.includes('🎯') || text.includes('Multi-command') || text.includes('PRECISION') ||
                text.includes('CALENDAR') || text.includes('YTD') || text.includes('calendar_ytd')) {
                console.log(`[BROWSER] ${text}`);
            }
        });
    }

    async navigateToApp() {
        console.log('📍 Navigating to Traderra dashboard...');
        await this.page.goto('http://localhost:6565/dashboard');

        // Wait longer for React component to fully load
        await this.page.waitForTimeout(5000);
        console.log('✅ Dashboard loaded, waiting for components...');

        // Wait for specific components to be ready
        try {
            await this.page.waitForSelector('button[data-mode-value], .lucide-calendar', { timeout: 10000 });
            console.log('✅ UI components detected');
        } catch (error) {
            console.log('⚠️ Some UI components not detected, continuing anyway...');
        }

        return true;
    }

    async waitForFunctionsToLoad() {
        console.log('\n⏳ Waiting for multi-command functions to load...');

        // Wait up to 15 seconds for functions to be exposed
        for (let i = 0; i < 15; i++) {
            const functionsAvailable = await this.page.evaluate(() => {
                return {
                    parseMultiCommand: typeof window.parseMultiCommand === 'function',
                    executeMultiCommand: typeof window.executeMultiCommand === 'function',
                    precisionClick: typeof window.precisionClick === 'function'
                };
            });

            if (functionsAvailable.executeMultiCommand) {
                console.log('✅ Multi-command functions are now available!');
                return functionsAvailable;
            }

            console.log(`   Attempt ${i + 1}/15: Functions not yet available, waiting...`);
            await this.page.waitForTimeout(1000);
        }

        console.log('⚠️ Functions not available after 15 seconds, testing AI agent instead');
        return { functionsAvailable: false };
    }

    async testDirectFunctionCall() {
        console.log('\n🧪 TESTING DIRECT FUNCTION CALL');

        const result = await this.page.evaluate(async () => {
            try {
                if (typeof window.executeMultiCommand === 'function') {
                    const testCommand = "Go to dashboard, switch to year to date and dollars";
                    console.log('🎯 Calling executeMultiCommand directly with:', testCommand);

                    const result = await window.executeMultiCommand(testCommand);

                    return {
                        success: true,
                        result: result,
                        totalActions: result.totalActions,
                        successfulActions: result.successfulActions,
                        executionResults: result.executionResults
                    };
                } else {
                    return {
                        success: false,
                        error: 'executeMultiCommand function not available'
                    };
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        if (result.success) {
            console.log('✅ DIRECT EXECUTION SUCCESSFUL:');
            console.log(`   Total Actions: ${result.totalActions}`);
            console.log(`   Successful: ${result.successfulActions}`);
            console.log('   Execution Results:');
            result.result.executionResults.forEach((res, index) => {
                const status = res.success ? '✅' : '❌';
                console.log(`     ${index + 1}. ${status} ${res.action}: ${res.details}`);
            });
        } else {
            console.log('❌ DIRECT EXECUTION FAILED:', result.error);
        }

        return result;
    }

    async testViaAIAgent() {
        console.log('\n🤖 TESTING VIA AI AGENT');

        try {
            // Find AI agent input
            const chatInput = await this.page.locator('textarea, input[placeholder*="message"], [contenteditable="true"]').first();

            if (await chatInput.isVisible()) {
                console.log('✅ AI Agent input found');

                const testCommand = "Go to dashboard, switch to year to date and dollars";
                console.log(`📝 Sending: "${testCommand}"`);

                await chatInput.fill(testCommand);
                await this.page.keyboard.press('Enter');

                // Wait for processing
                console.log('⏳ Waiting for AI agent to process command...');
                await this.page.waitForTimeout(8000);

                return { success: true };
            } else {
                console.log('❌ AI Agent input not found');
                return { success: false };
            }
        } catch (error) {
            console.log('❌ AI Agent test failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    async checkFinalState() {
        console.log('\n📊 CHECKING FINAL STATE');

        const state = await this.page.evaluate(() => {
            return {
                url: window.location.href,
                displayMode: window.displayModeContext?.displayMode || 'unknown',
                dateRange: window.dateRangeContext?.selectedRange || 'unknown',
                hasDisplayContext: !!window.displayModeContext,
                hasDateContext: !!window.dateRangeContext
            };
        });

        console.log('Final System State:');
        console.log(`  URL: ${state.url}`);
        console.log(`  Display Mode: ${state.displayMode}`);
        console.log(`  Date Range: ${state.dateRange}`);
        console.log(`  Has Display Context: ${state.hasDisplayContext}`);
        console.log(`  Has Date Context: ${state.hasDateContext}`);

        // Check if YTD was successfully set
        const ytdSuccess = state.dateRange === 'year' ||
                          state.dateRange === 'calendar_ytd' ||
                          state.dateRange === 'ytd';

        const dollarSuccess = state.displayMode === 'dollar' || state.displayMode === '$';

        console.log('\n🎯 SUCCESS ANALYSIS:');
        console.log(`  YTD Date Range: ${ytdSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`  Dollar Display Mode: ${dollarSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);

        return {
            state,
            ytdSuccess,
            dollarSuccess,
            overallSuccess: ytdSuccess && dollarSuccess
        };
    }

    async runDebugTest() {
        try {
            await this.navigateToApp();

            const functionsStatus = await this.waitForFunctionsToLoad();

            let directTestResult = null;
            if (functionsStatus.executeMultiCommand) {
                directTestResult = await this.testDirectFunctionCall();
            }

            const aiAgentResult = await this.testViaAIAgent();
            const finalState = await this.checkFinalState();

            console.log('\n🗓️ YTD CALENDAR DEBUG SUMMARY');
            console.log('═'.repeat(50));

            if (directTestResult) {
                console.log(`Direct Function Call: ${directTestResult.success ? '✅ Working' : '❌ Failed'}`);
            } else {
                console.log('Direct Function Call: ⚠️ Functions not available');
            }

            console.log(`AI Agent Test: ${aiAgentResult.success ? '✅ Working' : '❌ Failed'}`);
            console.log(`Final State: ${finalState.overallSuccess ? '✅ COMPLETE SUCCESS' : '❌ PARTIAL/FAILED'}`);

            if (!finalState.ytdSuccess) {
                console.log('\n💡 YTD ISSUE: The calendar dropdown navigation is not working properly');
                console.log('   Expected date range: "year", "calendar_ytd", or "ytd"');
                console.log(`   Actual date range: "${finalState.state.dateRange}"`);
            }

            return {
                functionsAvailable: functionsStatus.executeMultiCommand,
                directTest: directTestResult,
                aiAgentTest: aiAgentResult,
                finalState,
                recommendation: finalState.overallSuccess ? 'SYSTEM WORKING' : 'NEEDS CALENDAR DROPDOWN FIX'
            };

        } catch (error) {
            console.error('💥 Debug test error:', error.message);
            return { error: error.message };
        }
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 YTD debug test cleanup completed');
        }
    }
}

// Main execution
async function runYTDDebugTest() {
    const debugTool = new YTDCalendarDebugger();

    try {
        await debugTool.init();
        const results = await debugTool.runDebugTest();

        if (results.finalState?.overallSuccess) {
            console.log('\n🎉 YTD CALENDAR DROPDOWN TEST PASSED');
            console.log('✅ Multi-command execution is working correctly!');
        } else {
            console.log('\n🔧 YTD CALENDAR DROPDOWN NEEDS ATTENTION');
            console.log('📋 Issue found with calendar dropdown navigation');
        }

        return results;
    } finally {
        await debugTool.cleanup();
    }
}

if (require.main === module) {
    runYTDDebugTest().catch(console.error);
}

module.exports = { YTDCalendarDebugger };