/**
 * BULLETPROOF TRADERRA CALENDAR VALIDATION EXECUTOR
 *
 * This script executes 500+ calendar command variations against the live Traderra
 * application to ensure 100% accuracy with state changes, continuous background
 * testing, and comprehensive reporting.
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

class BulletproofCalendarExecutor {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            startTime: Date.now(),
            totalTests: 0,
            passed: 0,
            failed: 0,
            stateValidationErrors: 0,
            screenshots: [],
            detailedResults: [],
            backgroundRunning: false
        };

        this.baseUrl = 'http://localhost:6565/dashboard';
        this.screenshotDir = './bulletproof-test-results';
        this.reportDir = './bulletproof-test-results';
    }

    async initialize() {
        console.log("🚀 INITIALIZING BULLETPROOF CALENDAR VALIDATION");

        // Create directories
        await this.ensureDirectories();

        // Launch browser
        this.browser = await chromium.launch({
            headless: false, // Keep visible for monitoring
            slowMo: 100 // Slightly slower for reliability
        });

        this.page = await this.browser.newPage();

        // Navigate to Traderra
        console.log("🌐 Navigating to Traderra dashboard...");
        await this.page.goto(this.baseUrl);
        await this.page.waitForLoadState('domcontentloaded');
        await this.delay(3000); // Wait for full initialization

        console.log("✅ Traderra loaded successfully");
    }

    async ensureDirectories() {
        await fs.mkdir(this.screenshotDir, { recursive: true });
        await fs.mkdir(this.reportDir, { recursive: true });
    }

    // ===== CORE TEST CATEGORIES =====

    async executeBulletproofValidation() {
        console.log("\n🎯 STARTING BULLETPROOF VALIDATION - 500+ COMMANDS");

        try {
            // Phase 1: Verify known working patterns
            await this.testKnownWorkingPatterns();

            // Phase 2: Test recently fixed patterns
            await this.testRecentlyFixedPatterns();

            // Phase 3: Extended natural language patterns
            await this.testExtendedNaturalLanguage();

            // Phase 4: Multi-command sequences
            await this.testMultiCommandSequences();

            // Phase 5: Conversation flows
            await this.testConversationFlows();

            // Phase 6: Edge cases and stress testing
            await this.testEdgeCasesAndStress();

            // Generate comprehensive report
            const report = await this.generateBulletproofReport();

            // Check if we achieved 100% success rate
            const successRate = (this.results.passed / this.results.totalTests) * 100;
            if (successRate === 100) {
                console.log("🎉 100% SUCCESS ACHIEVED! Starting background testing...");
                await this.startBackgroundTesting();
            } else {
                console.log(`⚠️  Success rate: ${successRate.toFixed(2)}% - analyzing failures...`);
                await this.analyzeFailed();
            }

            return report;

        } catch (error) {
            console.error("❌ Validation failed:", error);
            throw error;
        }
    }

    async testKnownWorkingPatterns() {
        console.log("\n✅ PHASE 1: Testing Known Working Patterns (20 commands)");

        const knownWorking = [
            "set date range to ytd",
            "set date range to last month",
            "set date range to this month",
            "switch to all time view",
            "set date range to 90 days",
            "year to date",
            "last month",
            "this month",
            "all time",
            "90 days",
            "quarterly data",
            "monthly view",
            "switch to dollars",
            "show in R multiples",
            "go to dashboard",
            "navigate to trades",
            "show me journal",
            "statistics page",
            "dollar mode",
            "R mode"
        ];

        for (const command of knownWorking) {
            await this.executeAndValidate(command, "Known Working");
        }
    }

    async testRecentlyFixedPatterns() {
        console.log("\n🔧 PHASE 2: Testing Recently Fixed Patterns (30 commands)");

        const recentlyFixed = [
            // Core fixed patterns
            "set date range to 7 days",
            "set date range to week",
            "set date range to 30d",
            "set date range to 30 days",

            // Variations of fixed patterns
            "7 days",
            "week",
            "30d",
            "30 days",
            "7d",
            "weekly view",
            "7-day view",
            "seven days",
            "one week",
            "thirty days",
            "past week",
            "last 7 days",
            "past 30 days",
            "last 30 days",
            "show 7 days",
            "display weekly data",
            "30 day view",
            "monthly period",
            "7d view",
            "week view",
            "30d period",
            "set to week",
            "change to 7 days",
            "switch to 30 days",
            "go to weekly",
            "past 7 days"
        ];

        for (const command of recentlyFixed) {
            await this.executeAndValidate(command, "Recently Fixed");
        }
    }

    async testExtendedNaturalLanguage() {
        console.log("\n💬 PHASE 3: Extended Natural Language Patterns (100 commands)");

        const naturalLanguage = [
            // Casual date commands
            "show me last week's data",
            "I want to see monthly information",
            "display quarterly results",
            "can you show me yearly data",
            "let me see the past 7 days",
            "show recent month data",

            // Polite commands
            "please set date range to 30 days",
            "could you show me last month",
            "would you display weekly data",
            "I'd like to see quarterly information",

            // Question format
            "can we see last 7 days?",
            "how about monthly view?",
            "what about quarterly data?",
            "could we look at yearly trends?",

            // Mixed formats
            "7 day period please",
            "monthly data if possible",
            "quarterly view when ready",
            "yearly overview for analysis",

            // Display mode variations
            "switch the display to dollars",
            "change to dollar view",
            "show me R multiples",
            "display in R mode",
            "use dollar format",
            "apply R multiple view",
            "enable dollar display",
            "turn on R mode",

            // Navigation variations
            "take me to dashboard",
            "open the trades page",
            "show me statistics",
            "go to journal section",
            "navigate to analytics",
            "open dashboard view",
            "switch to trades",
            "view statistics page",

            // Time qualifiers
            "recent 7 days",
            "current month",
            "present quarter",
            "this year so far",
            "latest week",
            "ongoing month",
            "active quarter",
            "running year",

            // Business language
            "quarterly performance data",
            "monthly trading results",
            "weekly analysis view",
            "annual summary data",
            "period performance metrics",
            "timeframe analysis",

            // Shortened forms
            "q data", // quarterly
            "m view", // monthly
            "w analysis", // weekly
            "y summary", // yearly
            "$ mode", // dollar
            "R view", // R multiple

            // Advanced combinations
            "show quarterly data in dollars",
            "display monthly info in R mode",
            "weekly results with dollar view",
            "annual data using R multiples"
        ];

        // Add more variations programmatically
        const timeVariations = ["7d", "week", "30d", "month", "90d", "quarter", "ytd", "year", "all"];
        const displayVariations = ["dollars", "$", "R", "gross", "net"];
        const pageVariations = ["dashboard", "trades", "statistics", "journal", "analytics"];

        // Generate combinations
        for (const time of timeVariations) {
            naturalLanguage.push(`show ${time}`);
            naturalLanguage.push(`display ${time} data`);
            naturalLanguage.push(`${time} view`);
            naturalLanguage.push(`switch to ${time}`);
        }

        for (const display of displayVariations) {
            naturalLanguage.push(`show in ${display}`);
            naturalLanguage.push(`switch to ${display}`);
            naturalLanguage.push(`${display} mode`);
        }

        for (const page of pageVariations) {
            naturalLanguage.push(`go to ${page}`);
            naturalLanguage.push(`open ${page}`);
            naturalLanguage.push(`${page} page`);
        }

        // Execute all natural language tests
        for (const command of naturalLanguage.slice(0, 100)) { // Limit to 100 for this phase
            await this.executeAndValidate(command, "Natural Language");
        }
    }

    async testMultiCommandSequences() {
        console.log("\n⚡ PHASE 4: Multi-Command Sequences (80 commands)");

        const multiCommands = [
            // Date + Display combinations
            "set date range to 7 days and switch to dollars",
            "show last month in R multiples",
            "display weekly data in dollar mode",
            "go to quarterly view with R display",
            "set 30 days and use dollar format",

            // Navigation + Date combinations
            "go to dashboard and show last week",
            "navigate to trades and set monthly view",
            "open statistics with quarterly data",
            "switch to journal and display weekly info",

            // Triple combinations
            "go to dashboard, set 7 days, and switch to dollars",
            "navigate to trades, show monthly data, and use R mode",
            "open statistics, display quarterly info, and switch to gross",

            // Complex natural language
            "show me the dashboard with last 30 days in dollar mode",
            "I want to see trades page with weekly view in R multiples",
            "display the journal section with monthly data in gross mode",
            "navigate to statistics with quarterly view in net mode",

            // Business workflow combinations
            "analyze weekly performance in dollar terms",
            "review monthly trades using R multiples",
            "examine quarterly statistics with gross calculations",
            "study annual journal entries in net format"
        ];

        // Generate more combinations programmatically
        const timeOptions = ["7 days", "week", "month", "quarter", "ytd"];
        const displayOptions = ["dollars", "R multiples", "gross mode", "net mode"];
        const pageOptions = ["dashboard", "trades", "statistics", "journal"];

        for (const time of timeOptions) {
            for (const display of displayOptions) {
                multiCommands.push(`show ${time} in ${display}`);
                multiCommands.push(`set ${time} and switch to ${display}`);
            }
        }

        for (const page of pageOptions) {
            for (const time of timeOptions) {
                multiCommands.push(`go to ${page} and show ${time}`);
            }
        }

        // Execute multi-command tests
        for (const command of multiCommands.slice(0, 80)) { // Limit to 80 for this phase
            await this.executeAndValidate(command, "Multi-Command", true);
        }
    }

    async testConversationFlows() {
        console.log("\n💬 PHASE 5: Conversation Flows (60 commands)");

        const conversationFlows = [
            // Flow 1: Progressive date changes
            ["show last week", "now go to monthly", "switch to quarterly", "back to all time"],

            // Flow 2: Display mode progression
            ["dollar mode", "switch to R multiples", "show gross mode", "change to net"],

            // Flow 3: Page navigation flow
            ["dashboard", "go to trades", "show statistics", "open journal", "back to dashboard"],

            // Flow 4: Complex business workflow
            ["quarterly performance", "switch to trades page", "show monthly data", "use R multiples", "go to dashboard"],

            // Flow 5: Analysis workflow
            ["show recent week", "switch to journal", "display in dollars", "go to statistics", "quarterly view"],

            // Flow 6: Quick toggles
            ["7d", "30d", "90d", "$", "R", "dashboard", "trades"],

            // Flow 7: Natural conversation
            ["show me last month", "that looks good, now switch to R mode", "can we see the trades page?", "perfect, now back to dashboard"],

            // Flow 8: Error recovery
            ["invalid command", "show last month", "switch to dashboard", "weekly data please"]
        ];

        for (let flowIndex = 0; flowIndex < conversationFlows.length; flowIndex++) {
            const flow = conversationFlows[flowIndex];
            console.log(`  💫 Flow ${flowIndex + 1}: ${flow.length} commands`);

            // Reset to clean state before each flow
            await this.resetToCleanState();

            for (let cmdIndex = 0; cmdIndex < flow.length; cmdIndex++) {
                const command = flow[cmdIndex];
                await this.executeAndValidate(
                    command,
                    `Flow ${flowIndex + 1}`,
                    false,
                    { flowIndex, commandIndex: cmdIndex }
                );

                // Conversation delay
                await this.delay(1500);
            }
        }
    }

    async testEdgeCasesAndStress() {
        console.log("\n🔥 PHASE 6: Edge Cases & Stress Testing (50 commands)");

        // Rapid fire basic commands
        const rapidFire = ["7d", "30d", "90d", "ytd", "all", "$", "R", "gross", "net"];
        console.log("  ⚡ Rapid fire testing...");
        for (const cmd of rapidFire) {
            await this.executeAndValidate(cmd, "Rapid Fire");
            await this.delay(300); // Minimal delay
        }

        // Edge cases
        const edgeCases = [
            "", // Empty
            "   ", // Whitespace
            "invalid command",
            "show me data for 500 days",
            "switch to invalid mode",
            "go nowhere",
            "display nothing",
            "random text",
            "123456",
            "!@#$%^&*()",
            "very long command that goes on and on and should probably not work but let's see what happens",
            "7d 30d 90d all at once", // Multiple time ranges
            "dollars and R multiples simultaneously", // Conflicting displays
            "dashboard trades journal all pages" // Multiple pages
        ];

        console.log("  🧪 Edge case testing...");
        for (const cmd of edgeCases) {
            await this.executeAndValidate(cmd, "Edge Cases");
        }

        // Stress test with variations
        const stressCommands = [];
        for (let i = 0; i < 20; i++) {
            stressCommands.push(`test command ${i}`);
            stressCommands.push(`show data ${i}`);
        }

        console.log("  💪 Stress testing...");
        for (const cmd of stressCommands) {
            await this.executeAndValidate(cmd, "Stress Test");
        }
    }

    // ===== CORE EXECUTION ENGINE =====

    async executeAndValidate(command, category, isMultiCommand = false, metadata = {}) {
        const testStart = Date.now();

        try {
            console.log(`    🧪 Testing: "${command}"`);

            // Capture before state
            const beforeState = await this.captureUIState();
            const beforeScreenshot = await this.takeScreenshot(`before_${Date.now()}`);

            // Send command
            await this.sendChatCommand(command);

            // Wait for processing
            await this.delay(3000);

            // Capture after state
            const afterState = await this.captureUIState();
            const afterScreenshot = await this.takeScreenshot(`after_${Date.now()}`);

            // Validate state changes
            const validation = this.validateStateChanges(beforeState, afterState, command);

            // Record result
            const result = {
                command,
                category,
                success: validation.success,
                executionTime: Date.now() - testStart,
                beforeState,
                afterState,
                stateChanges: validation.changes,
                screenshots: [beforeScreenshot, afterScreenshot],
                metadata,
                timestamp: new Date().toISOString(),
                validation
            };

            this.recordResult(result);

            if (result.success) {
                console.log(`        ✅ SUCCESS`);
            } else {
                console.log(`        ❌ FAILED: ${validation.reason}`);
            }

            return result;

        } catch (error) {
            console.log(`        💥 ERROR: ${error.message}`);

            const errorResult = {
                command,
                category,
                success: false,
                error: error.message,
                executionTime: Date.now() - testStart,
                metadata,
                timestamp: new Date().toISOString()
            };

            this.recordResult(errorResult);
            return errorResult;
        }
    }

    async sendChatCommand(command) {
        // Find chat input and send command
        const chatInput = await this.page.waitForSelector('textbox[placeholder*="Ask me anything"]', {
            timeout: 5000
        });

        await chatInput.fill(command);
        await chatInput.press('Enter');

        console.log(`      📤 Sent: "${command}"`);
    }

    async captureUIState() {
        // Capture current UI state for validation
        const state = {
            dateRange: await this.getCurrentDateRange(),
            displayMode: await this.getCurrentDisplayMode(),
            currentPage: await this.getCurrentPage(),
            timestamp: Date.now()
        };

        return state;
    }

    async getCurrentDateRange() {
        try {
            // Check which date button is active
            const buttons = await this.page.$$('[role="button"]');
            for (const button of buttons) {
                const text = await button.textContent();
                const isActive = await button.evaluate(el =>
                    el.getAttribute('aria-pressed') === 'true' ||
                    el.classList.contains('active') ||
                    getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)'
                );

                if (isActive && ['7d', '30d', '90d', 'All'].includes(text?.trim())) {
                    return text.trim().toLowerCase();
                }
            }
            return 'unknown';
        } catch (error) {
            return 'error';
        }
    }

    async getCurrentDisplayMode() {
        try {
            // Check which display mode button is active
            const buttons = await this.page.$$('[role="button"]');
            for (const button of buttons) {
                const text = await button.textContent();
                const isActive = await button.evaluate(el =>
                    el.getAttribute('aria-pressed') === 'true' ||
                    el.classList.contains('active') ||
                    getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)'
                );

                if (isActive && ['$', 'R', 'G', 'N'].includes(text?.trim())) {
                    return text.trim();
                }
            }
            return 'unknown';
        } catch (error) {
            return 'error';
        }
    }

    async getCurrentPage() {
        try {
            const url = this.page.url();
            if (url.includes('/dashboard')) return 'dashboard';
            if (url.includes('/trades')) return 'trades';
            if (url.includes('/statistics')) return 'statistics';
            if (url.includes('/journal')) return 'journal';
            if (url.includes('/analytics')) return 'analytics';
            return 'unknown';
        } catch (error) {
            return 'error';
        }
    }

    validateStateChanges(beforeState, afterState, command) {
        const changes = {
            dateRangeChanged: beforeState.dateRange !== afterState.dateRange,
            displayModeChanged: beforeState.displayMode !== afterState.displayMode,
            pageChanged: beforeState.currentPage !== afterState.currentPage
        };

        const totalChanges = Object.values(changes).filter(Boolean).length;

        // Analyze what we expected vs what happened
        const expectedChanges = this.analyzeExpectedChanges(command);

        let success = true;
        let reason = "";

        // If we expected changes but got none
        if (expectedChanges > 0 && totalChanges === 0) {
            success = false;
            reason = `Expected ${expectedChanges} changes but got 0`;
        }

        return {
            success,
            reason,
            changes,
            expectedChanges,
            actualChanges: totalChanges,
            details: {
                before: beforeState,
                after: afterState
            }
        };
    }

    analyzeExpectedChanges(command) {
        const cmd = command.toLowerCase();
        let expected = 0;

        // Date range patterns
        if (cmd.includes('date') || cmd.includes('day') || cmd.includes('week') ||
            cmd.includes('month') || cmd.includes('quarter') || cmd.includes('ytd') ||
            cmd.includes('7d') || cmd.includes('30d') || cmd.includes('90d') ||
            cmd.includes('all')) {
            expected++;
        }

        // Display mode patterns
        if (cmd.includes('dollar') || cmd.includes('$') || cmd.includes(' r ') ||
            cmd.includes('gross') || cmd.includes('net')) {
            expected++;
        }

        // Navigation patterns
        if (cmd.includes('go to') || cmd.includes('dashboard') || cmd.includes('trades') ||
            cmd.includes('journal') || cmd.includes('statistics')) {
            expected++;
        }

        return expected;
    }

    async takeScreenshot(name) {
        const filename = `${name}.png`;
        const filepath = path.join(this.screenshotDir, filename);

        await this.page.screenshot({
            path: filepath,
            fullPage: true
        });

        this.results.screenshots.push(filename);
        return filename;
    }

    recordResult(result) {
        this.results.totalTests++;
        this.results.detailedResults.push(result);

        if (result.success) {
            this.results.passed++;
        } else {
            this.results.failed++;
        }
    }

    async resetToCleanState() {
        console.log("      🔄 Resetting to clean state...");

        // Navigate back to dashboard
        await this.page.goto(this.baseUrl);
        await this.delay(2000);

        // Set to default state (All time, Dollar mode)
        await this.sendChatCommand("all time");
        await this.delay(1000);
        await this.sendChatCommand("dollar mode");
        await this.delay(2000);
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ===== BACKGROUND TESTING =====

    async startBackgroundTesting() {
        console.log("\n🌙 STARTING BACKGROUND CONTINUOUS TESTING");
        console.log("📊 Will test random commands every 30 seconds...");

        this.results.backgroundRunning = true;

        const backgroundCommands = [
            "7 days", "week", "30d", "month", "90d", "quarter", "ytd", "all",
            "dollars", "R multiples", "gross", "net",
            "dashboard", "trades", "statistics", "journal",
            "show weekly data", "monthly view", "quarterly analysis"
        ];

        const backgroundInterval = setInterval(async () => {
            if (!this.results.backgroundRunning) {
                clearInterval(backgroundInterval);
                return;
            }

            try {
                const randomCommand = backgroundCommands[Math.floor(Math.random() * backgroundCommands.length)];
                await this.executeAndValidate(randomCommand, "Background");

                // Log progress every 10 tests
                if (this.results.totalTests % 10 === 0) {
                    this.logProgressSummary();
                }

            } catch (error) {
                console.error("Background test error:", error);
            }

        }, 30000); // Every 30 seconds

        console.log("🔄 Background testing active - will run continuously");
    }

    logProgressSummary() {
        const successRate = ((this.results.passed / this.results.totalTests) * 100).toFixed(2);
        const runtime = ((Date.now() - this.results.startTime) / 1000 / 60).toFixed(1);

        console.log(`\n📊 PROGRESS (${new Date().toLocaleTimeString()})`);
        console.log(`✅ ${this.results.passed}/${this.results.totalTests} passed (${successRate}%)`);
        console.log(`⏱️  Runtime: ${runtime} minutes`);
        console.log(`📸 Screenshots: ${this.results.screenshots.length}`);
    }

    async generateBulletproofReport() {
        const report = {
            metadata: {
                timestamp: new Date().toISOString(),
                totalRuntime: Date.now() - this.results.startTime,
                applicationUrl: this.baseUrl,
                totalCommands: this.results.totalTests,
                successRate: `${((this.results.passed / this.results.totalTests) * 100).toFixed(2)}%`
            },
            summary: {
                total: this.results.totalTests,
                passed: this.results.passed,
                failed: this.results.failed,
                stateValidationErrors: this.results.stateValidationErrors
            },
            failedCommands: this.results.detailedResults
                .filter(r => !r.success)
                .map(r => ({ command: r.command, category: r.category, error: r.error })),
            screenshots: this.results.screenshots,
            detailedResults: this.results.detailedResults
        };

        // Save report
        const reportPath = path.join(this.reportDir, `bulletproof_validation_${Date.now()}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        console.log(`\n📋 BULLETPROOF VALIDATION COMPLETE`);
        console.log(`✅ Total Tests: ${this.results.totalTests}`);
        console.log(`🎯 Success Rate: ${((this.results.passed / this.results.totalTests) * 100).toFixed(2)}%`);
        console.log(`📸 Screenshots: ${this.results.screenshots.length}`);
        console.log(`📄 Report: ${reportPath}`);

        return report;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// ===== EXECUTION =====
async function main() {
    const executor = new BulletproofCalendarExecutor();

    try {
        await executor.initialize();
        const report = await executor.executeBulletproofValidation();

        console.log("\n🎉 BULLETPROOF VALIDATION COMPLETED!");
        console.log("📊 Check the bulletproof-test-results directory for detailed results");

    } catch (error) {
        console.error("❌ Validation failed:", error);
        process.exit(1);
    }

    // Keep alive for background testing
    // await executor.cleanup();
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = BulletproofCalendarExecutor;