#!/usr/bin/env node

/**
 * DEBUG MULTI-COMMAND EXECUTION
 * Tests the complete execution pipeline to find where it's failing
 */

const { chromium } = require('playwright');

class MultiCommandDebugger {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async init() {
        console.log('🔍 MULTI-COMMAND EXECUTION DEBUGGER');
        console.log('Testing: "Go to dashboard, switch to year to date and dollars"');

        this.browser = await chromium.launch({
            headless: false,
            slowMo: 1000 // Slow down to see what's happening
        });
        this.page = await this.browser.newPage();

        // Enhanced console monitoring
        this.page.on('console', msg => {
            const text = msg.text();
            if (text.includes('🎯') || text.includes('MULTI-COMMAND') || text.includes('PRECISION') ||
                text.includes('ERROR') || text.includes('Failed') || text.includes('❌')) {
                console.log(`[BROWSER] ${text}`);
            }
        });
    }

    async navigateToApp() {
        console.log('📍 Navigating to Traderra...');
        await this.page.goto('http://localhost:6565/dashboard');
        await this.page.waitForTimeout(3000);
        return true;
    }

    async testCommandParsing() {
        console.log('\n🧠 STEP 1: Testing Command Parsing');

        const parseResult = await this.page.evaluate(() => {
            if (typeof window.parseMultiCommand === 'function') {
                return window.parseMultiCommand('Go to dashboard, switch to year to date and dollars');
            }
            return null;
        });

        if (parseResult) {
            console.log('✅ Command Parser Available');
            console.log('Navigation:', parseResult.navigation);
            console.log('Date Range:', parseResult.dateRange);
            console.log('Display Mode:', parseResult.displayMode);
            console.log('Actions:', parseResult.detectedActions);
        } else {
            console.log('❌ Command Parser NOT AVAILABLE in browser');
        }

        return parseResult !== null;
    }

    async testMultiCommandExecutor() {
        console.log('\n⚙️ STEP 2: Testing Multi-Command Executor');

        const executorTest = await this.page.evaluate(async () => {
            try {
                if (typeof window.executeMultiCommand === 'function') {
                    console.log('🎯 Multi-Command Executor found in window');
                    const result = await window.executeMultiCommand('Go to dashboard, switch to year to date and dollars');
                    return { available: true, result };
                }
                return { available: false, error: 'executeMultiCommand not in window' };
            } catch (error) {
                return { available: false, error: error.message };
            }
        });

        if (executorTest.available) {
            console.log('✅ Multi-Command Executor Available');
            console.log('Execution Result:', executorTest.result);
        } else {
            console.log('❌ Multi-Command Executor Issue:', executorTest.error);
        }

        return executorTest.available;
    }

    async testCalendarDropdown() {
        console.log('\n🗓️ STEP 3: Testing Calendar Dropdown Detection');

        const calendarTest = await this.page.evaluate(() => {
            const calendarSelectors = [
                'button:has(.lucide-calendar)',
                'button[data-range="custom"]',
                '.traderra-date-btn:has(.lucide-calendar)',
                'button.traderra-date-btn:has-text("📅")'
            ];

            const results = {};
            calendarSelectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    results[selector] = elements.length;
                } catch (error) {
                    results[selector] = `Error: ${error.message}`;
                }
            });

            return results;
        });

        console.log('Calendar Button Detection Results:');
        Object.entries(calendarTest).forEach(([selector, count]) => {
            if (typeof count === 'number' && count > 0) {
                console.log(`  ✅ ${selector}: Found ${count} elements`);
            } else {
                console.log(`  ❌ ${selector}: ${count}`);
            }
        });

        return Object.values(calendarTest).some(count => typeof count === 'number' && count > 0);
    }

    async testAIAgentIntegration() {
        console.log('\n🤖 STEP 4: Testing AI Agent Integration');

        try {
            const chatInput = await this.page.locator('textarea, input[placeholder*="message"], [contenteditable="true"]').first();

            if (await chatInput.isVisible()) {
                console.log('✅ AI Agent Input Found');

                await chatInput.fill('Go to dashboard, switch to year to date and dollars');
                console.log('📝 Sending command to AI agent...');

                await this.page.keyboard.press('Enter');
                await this.page.waitForTimeout(8000); // Wait for processing

                return true;
            } else {
                console.log('❌ AI Agent Input Not Found');
                return false;
            }
        } catch (error) {
            console.log('❌ AI Agent Integration Error:', error.message);
            return false;
        }
    }

    async testFinalState() {
        console.log('\n📊 STEP 5: Checking Final State');

        const finalState = await this.page.evaluate(() => {
            return {
                url: window.location.href,
                displayMode: window.displayModeContext?.displayMode || 'unknown',
                dateRange: window.dateRangeContext?.selectedRange || 'unknown'
            };
        });

        console.log('Final State:');
        console.log(`  URL: ${finalState.url}`);
        console.log(`  Display Mode: ${finalState.displayMode}`);
        console.log(`  Date Range: ${finalState.dateRange}`);

        return finalState;
    }

    async runDebugSession() {
        try {
            await this.navigateToApp();

            const parsingWorking = await this.testCommandParsing();
            const executorWorking = await this.testMultiCommandExecutor();
            const calendarWorking = await this.testCalendarDropdown();
            const aiAgentWorking = await this.testAIAgentIntegration();
            const finalState = await this.testFinalState();

            console.log('\n🔍 DEBUG ANALYSIS COMPLETE');
            console.log('═'.repeat(50));
            console.log(`Command Parsing: ${parsingWorking ? '✅ Working' : '❌ Failed'}`);
            console.log(`Multi-Command Executor: ${executorWorking ? '✅ Working' : '❌ Failed'}`);
            console.log(`Calendar Dropdown: ${calendarWorking ? '✅ Found' : '❌ Not Found'}`);
            console.log(`AI Agent Integration: ${aiAgentWorking ? '✅ Working' : '❌ Failed'}`);

            if (!parsingWorking) {
                console.log('\n💡 ISSUE: Command parsing not available in browser');
            }
            if (!executorWorking) {
                console.log('\n💡 ISSUE: Multi-command executor not working');
            }
            if (!calendarWorking) {
                console.log('\n💡 ISSUE: Calendar dropdown selectors not finding elements');
            }

            return {
                parsingWorking,
                executorWorking,
                calendarWorking,
                aiAgentWorking,
                finalState
            };

        } catch (error) {
            console.error('💥 Debug session error:', error.message);
            return { error: error.message };
        }
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 Debug session cleanup completed');
        }
    }
}

// Main execution
async function runDebugSession() {
    const debugTool = new MultiCommandDebugger();

    try {
        await debugTool.init();
        const results = await debugTool.runDebugSession();
        return results;
    } finally {
        await debugTool.cleanup();
    }
}

if (require.main === module) {
    runDebugSession().catch(console.error);
}

module.exports = { MultiCommandDebugger };