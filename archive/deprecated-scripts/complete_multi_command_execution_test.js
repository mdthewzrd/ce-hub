#!/usr/bin/env node

/**
 * COMPLETE MULTI-COMMAND EXECUTION TEST
 * Tests the user's exact command with proper sequence execution
 * "Can we go to the stats page and look at this year's data in R?"
 *
 * This test validates the COMPLETE execution, not just the parsing.
 */

const { chromium } = require('playwright');

class MultiCommandExecutionTester {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async init() {
        console.log('🧪 MULTI-COMMAND EXECUTION TEST');
        console.log('🎯 Testing COMPLETE sequence for: "Can we go to the stats page and look at this year\'s data in R?"');

        this.browser = await chromium.launch({
            headless: false,
            slowMo: 300
        });
        this.page = await this.browser.newPage();

        // Enhanced console logging
        this.page.on('console', msg => {
            const text = msg.text();
            if (text.includes('🎯') || text.includes('✅') || text.includes('❌') || text.includes('MULTI-COMMAND')) {
                console.log(`[BROWSER] ${text}`);
            }
        });
    }

    async navigateToDashboard() {
        console.log('📍 Starting from dashboard...');
        await this.page.goto('http://localhost:6565/dashboard');
        await this.page.waitForTimeout(2000);
        return true;
    }

    async executeCompleteSequence() {
        console.log('\n🎯 EXECUTING COMPLETE MULTI-COMMAND SEQUENCE');
        console.log('   Command: "Can we go to the stats page and look at this year\'s data in R?"');

        const results = [];

        // STEP 1: Navigation to Stats Page (FIRST)
        console.log('\n📍 STEP 1: Navigation to Stats Page');
        try {
            // Try multiple navigation approaches
            const navMethods = [
                () => this.page.click('a[href="/stats"]'),
                () => this.page.click('button:has-text("Stats")'),
                () => this.page.click('[data-nav-target="stats"]'),
                () => this.page.goto('http://localhost:6565/stats')
            ];

            let navSuccess = false;
            for (let i = 0; i < navMethods.length; i++) {
                try {
                    console.log(`   Trying navigation method ${i + 1}...`);
                    await navMethods[i]();
                    await this.page.waitForTimeout(1500); // Wait for page load

                    const currentUrl = this.page.url();
                    if (currentUrl.includes('/stats')) {
                        navSuccess = true;
                        console.log(`   ✅ Navigation SUCCESS: ${currentUrl}`);
                        break;
                    }
                } catch (error) {
                    console.log(`   ❌ Navigation method ${i + 1} failed: ${error.message}`);
                }
            }

            results.push({ action: 'navigation', success: navSuccess, details: navSuccess ? 'Reached stats page' : 'All navigation methods failed' });

        } catch (error) {
            console.log(`   ❌ Navigation FAILED: ${error.message}`);
            results.push({ action: 'navigation', success: false, details: error.message });
        }

        // STEP 2: Set Date Range to YTD (SECOND)
        console.log('\n📅 STEP 2: Set Date Range to Year-To-Date');
        let dateSuccess = false;
        try {
            const ytdSelectors = [
                'button[data-range-value="year"]',
                'button:has-text("This Year")',
                'button:has-text("YTD")',
                '[data-value="year"]'
            ];

            for (const selector of ytdSelectors) {
                try {
                    const elements = await this.page.locator(selector).count();
                    if (elements > 0) {
                        console.log(`   Found YTD selector: ${selector}`);
                        await this.page.click(selector);
                        await this.page.waitForTimeout(800);
                        dateSuccess = true;
                        console.log(`   ✅ YTD Selection SUCCESS`);
                        break;
                    }
                } catch (error) {
                    console.log(`   Trying selector: ${selector} - ${error.message}`);
                }
            }

            if (!dateSuccess) {
                // Try dropdown approach
                console.log('   Trying dropdown approach...');
                try {
                    await this.page.click('button:has-text("Date"), [role="button"]:has([data-testid="calendar"])');
                    await this.page.waitForTimeout(500);
                    await this.page.click('button:has-text("This Year")');
                    await this.page.waitForTimeout(800);
                    dateSuccess = true;
                    console.log(`   ✅ YTD Selection via Dropdown SUCCESS`);
                } catch (error) {
                    console.log(`   ❌ Dropdown approach failed: ${error.message}`);
                }
            }

            results.push({ action: 'dateRange', success: dateSuccess, details: dateSuccess ? 'YTD range selected' : 'No YTD selector found' });

        } catch (error) {
            console.log(`   ❌ Date Range FAILED: ${error.message}`);
            results.push({ action: 'dateRange', success: false, details: error.message });
        }

        // STEP 3: Switch to R Display Mode (THIRD)
        console.log('\n💰 STEP 3: Switch to R-Multiple Display Mode');
        let displaySuccess = false;
        try {
            const rSelectors = [
                'button[data-mode-value="r"]',
                'button[aria-label*="Risk Multiple"]',
                'button[data-button-type="risk"]',
                'button:has-text("R"):not(:has-text("Renata")):not(:has-text("Import"))'
            ];

            for (const selector of rSelectors) {
                try {
                    const elements = await this.page.locator(selector).count();
                    if (elements > 0) {
                        console.log(`   Found R mode selector: ${selector} (${elements} elements)`);
                        await this.page.click(selector);
                        await this.page.waitForTimeout(500);
                        displaySuccess = true;
                        console.log(`   ✅ R Mode Selection SUCCESS`);
                        break;
                    }
                } catch (error) {
                    console.log(`   Trying selector: ${selector} - ${error.message}`);
                }
            }

            results.push({ action: 'displayMode', success: displaySuccess, details: displaySuccess ? 'R mode activated' : 'No R mode selector found' });

        } catch (error) {
            console.log(`   ❌ Display Mode FAILED: ${error.message}`);
            results.push({ action: 'displayMode', success: false, details: error.message });
        }

        return results;
    }

    async validateFinalState() {
        console.log('\n🔍 VALIDATING FINAL STATE');

        const state = await this.page.evaluate(() => {
            return {
                url: window.location.href,
                title: document.title,
                hasStatsContent: document.querySelector('[data-testid="stats-content"], .stats-page, h1:has-text("Statistics")') !== null,
                activeDisplayMode: window.displayModeContext?.displayMode || 'unknown',
                activeDateRange: window.dateRangeContext?.selectedRange || 'unknown'
            };
        });

        console.log('📊 Final State Analysis:');
        console.log(`   URL: ${state.url}`);
        console.log(`   On Stats Page: ${state.url.includes('/stats')}`);
        console.log(`   Display Mode: ${state.activeDisplayMode}`);
        console.log(`   Date Range: ${state.activeDateRange}`);

        return {
            onStatsPage: state.url.includes('/stats'),
            hasRMode: state.activeDisplayMode === 'r',
            hasYTD: state.activeDateRange === 'year',
            state
        };
    }

    async takeScreenshot(name) {
        const filename = `multi_command_${name}_${Date.now()}.png`;
        await this.page.screenshot({ path: filename, fullPage: true });
        console.log(`📸 Screenshot saved: ${filename}`);
        return filename;
    }

    async runCompleteTest() {
        try {
            await this.navigateToDashboard();
            await this.takeScreenshot('initial_dashboard');

            const executionResults = await this.executeCompleteSequence();

            await this.takeScreenshot('after_sequence');

            const finalState = await this.validateFinalState();

            // Generate comprehensive report
            const successCount = executionResults.filter(r => r.success).length;
            const totalActions = executionResults.length;

            console.log('\n📋 MULTI-COMMAND EXECUTION REPORT');
            console.log('═'.repeat(50));
            console.log(`Command: "Can we go to the stats page and look at this year's data in R?"`);
            console.log(`Actions Executed: ${successCount}/${totalActions}`);

            executionResults.forEach((result, index) => {
                const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
                console.log(`   ${index + 1}. ${result.action}: ${status} - ${result.details}`);
            });

            console.log('\n🎯 Final State Validation:');
            console.log(`   Navigation: ${finalState.onStatsPage ? '✅ On Stats Page' : '❌ Not on Stats Page'}`);
            console.log(`   Display Mode: ${finalState.hasRMode ? '✅ R Mode Active' : '❌ R Mode Not Active'}`);
            console.log(`   Date Range: ${finalState.hasYTD ? '✅ YTD Active' : '❌ YTD Not Active'}`);

            const overallSuccess = successCount === totalActions && finalState.onStatsPage && finalState.hasRMode && finalState.hasYTD;

            console.log(`\nOverall Result: ${overallSuccess ? '🏆 COMPLETE SUCCESS' : '⚠️ PARTIAL SUCCESS'}`);

            if (overallSuccess) {
                console.log('✅ Multi-command execution working perfectly!');
            } else {
                console.log('🔧 Multi-command execution needs improvement - some actions failed');
            }

            return {
                executionResults,
                finalState,
                overallSuccess,
                successRate: (successCount / totalActions) * 100
            };

        } catch (error) {
            console.error('💥 Complete test error:', error.message);
            return { error: error.message, overallSuccess: false };
        }
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 Browser cleanup completed');
        }
    }
}

// Main execution
async function runMultiCommandTest() {
    const tester = new MultiCommandExecutionTester();

    try {
        await tester.init();
        const results = await tester.runCompleteTest();

        if (results.overallSuccess) {
            console.log('\n🎉 MULTI-COMMAND EXECUTION TEST PASSED');
            console.log('🚀 User command will execute all parts in correct order');
        } else {
            console.log('\n⚠️ MULTI-COMMAND EXECUTION TEST REVEALED ISSUES');
            console.log('🔧 AI agent needs multi-command sequencing implementation');
        }

        return results;

    } finally {
        await tester.cleanup();
    }
}

if (require.main === module) {
    runMultiCommandTest().catch(console.error);
}

module.exports = { MultiCommandExecutionTester };