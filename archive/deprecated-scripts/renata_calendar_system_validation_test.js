#!/usr/bin/env node

/**
 * RENATA ADVANCED CALENDAR INTERACTION SYSTEM VALIDATION TEST
 * Comprehensive validation of the complete calendar system implementation
 * Tests: Natural Language Parsing → Enhanced Multi-Command → CopilotKit Actions → AGUI Components
 */

const { chromium } = require('playwright');

class RenataCalendarSystemValidator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            naturalLanguageParsing: [],
            multiCommandExecution: [],
            copilotKitIntegration: [],
            aguiGeneration: [],
            overallSystem: {
                score: 0,
                maxScore: 100,
                issues: [],
                successes: []
            }
        };
    }

    async init() {
        console.log('🗓️ RENATA CALENDAR SYSTEM VALIDATION TEST');
        console.log('🎯 Testing complete calendar interaction implementation');
        console.log('═'.repeat(60));

        this.browser = await chromium.launch({
            headless: false,
            slowMo: 500
        });
        this.page = await this.browser.newPage();

        // Enhanced console monitoring for calendar functionality
        this.page.on('console', msg => {
            const text = msg.text();
            if (text.includes('📅') || text.includes('🗓️') || text.includes('CALENDAR') ||
                text.includes('ADVANCED DATE') || text.includes('TRADING PATTERN') ||
                text.includes('AGUI') || text.includes('COPILOT')) {
                console.log(`[BROWSER] ${text}`);
            }
        });
    }

    async navigateToApp() {
        console.log('\n📍 SYSTEM INITIALIZATION');
        console.log('   Loading Traderra dashboard...');
        await this.page.goto('http://localhost:6565/dashboard');
        await this.page.waitForTimeout(5000);

        // Wait for enhanced calendar system to load
        try {
            await this.page.waitForSelector('button[data-mode-value], .lucide-calendar, [class*="calendar"]', { timeout: 10000 });
            console.log('   ✅ Base UI components detected');
        } catch (error) {
            console.log('   ⚠️ Some UI components not detected');
        }

        // Wait for enhanced functions to be available
        await this.page.waitForFunction(() => {
            return typeof window.parseMultiCommand === 'function' &&
                   typeof window.executeMultiCommand === 'function';
        }, { timeout: 15000 });

        console.log('   ✅ Enhanced multi-command system loaded');
        return true;
    }

    async testNaturalLanguageParsing() {
        console.log('\n📊 PHASE 1: NATURAL LANGUAGE DATE PARSING');

        const testCases = [
            // Quarter expressions
            { input: "Q1 2024", expected: "quarter", description: "Quarter parsing" },
            { input: "show me Q3 data", expected: "quarter", description: "Quarter with context" },

            // Trading patterns
            { input: "earnings season Q4", expected: "trading", description: "Earnings season pattern" },
            { input: "options expiration dates", expected: "trading", description: "Options expiry pattern" },
            { input: "Fed meeting periods", expected: "trading", description: "FOMC meeting pattern" },

            // Natural date ranges
            { input: "last 6 months", expected: "relative", description: "Relative time range" },
            { input: "year to date", expected: "relative", description: "YTD expression" },
            { input: "March to June 2024", expected: "absolute", description: "Month range" },

            // Calendar interactions
            { input: "show calendar with trading data", expected: "calendar", description: "Calendar generation" },
            { input: "generate trading calendar", expected: "agui", description: "AGUI calendar request" }
        ];

        for (const testCase of testCases) {
            try {
                console.log(`   Testing: "${testCase.input}"`);

                const result = await this.page.evaluate((input) => {
                    // Test the enhanced command parser
                    const parsed = window.parseMultiCommand(input);

                    return {
                        hasDateRange: !!parsed.dateRange,
                        dateRangeType: parsed.dateRange?.type,
                        hasCalendarInteraction: !!parsed.calendarInteraction,
                        calendarType: parsed.calendarInteraction?.type,
                        hasAguiGeneration: !!parsed.aguiGeneration,
                        detectedActions: parsed.detectedActions.length,
                        originalText: parsed.originalText
                    };
                }, testCase.input);

                const success = this.validateParsingResult(result, testCase.expected);

                this.testResults.naturalLanguageParsing.push({
                    testCase,
                    result,
                    success,
                    timestamp: new Date()
                });

                console.log(`      ${success ? '✅' : '❌'} ${testCase.description}: ${success ? 'PASSED' : 'FAILED'}`);
                if (success) this.testResults.overallSystem.score += 5;

            } catch (error) {
                console.log(`      ❌ ${testCase.description}: ERROR - ${error.message}`);
                this.testResults.overallSystem.issues.push(`Parsing error: ${testCase.input} - ${error.message}`);
            }

            await this.page.waitForTimeout(500);
        }
    }

    validateParsingResult(result, expectedType) {
        switch (expectedType) {
            case 'quarter':
                return result.hasDateRange || result.hasCalendarInteraction;
            case 'trading':
                return result.hasCalendarInteraction && result.calendarType === 'trading_pattern';
            case 'relative':
            case 'absolute':
                return result.hasDateRange && result.dateRangeType === 'natural_language';
            case 'calendar':
                return result.hasCalendarInteraction;
            case 'agui':
                return result.hasAguiGeneration && result.hasCalendarInteraction;
            default:
                return result.detectedActions > 0;
        }
    }

    async testMultiCommandExecution() {
        console.log('\n🎯 PHASE 2: ENHANCED MULTI-COMMAND EXECUTION');

        const executionTests = [
            {
                command: "Go to dashboard and show Q1 2024 data",
                expectedActions: ['navigation', 'dateRange'],
                description: "Navigation + Quarter Selection"
            },
            {
                command: "Switch to dollars and show earnings season Q3",
                expectedActions: ['displayMode', 'calendarInteraction'],
                description: "Display Mode + Trading Pattern"
            },
            {
                command: "Generate calendar and set to year to date",
                expectedActions: ['aguiGeneration', 'calendarInteraction'],
                description: "AGUI Generation + YTD Range"
            },
            {
                command: "Show last 6 months in R multiples",
                expectedActions: ['dateRange', 'displayMode'],
                description: "Natural Date + Display Mode"
            }
        ];

        for (const test of executionTests) {
            try {
                console.log(`   Executing: "${test.command}"`);

                const result = await this.page.evaluate(async (command) => {
                    try {
                        const executionResult = await window.executeMultiCommand(command);
                        return {
                            success: true,
                            totalActions: executionResult.totalActions,
                            successfulActions: executionResult.successfulActions,
                            executionResults: executionResult.executionResults,
                            overallSuccess: executionResult.overallSuccess
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error: error.message
                        };
                    }
                }, test.command);

                const success = result.success && result.totalActions > 0 && result.successfulActions > 0;

                this.testResults.multiCommandExecution.push({
                    test,
                    result,
                    success,
                    timestamp: new Date()
                });

                console.log(`      ${success ? '✅' : '❌'} ${test.description}`);
                console.log(`         Actions: ${result.totalActions || 0} total, ${result.successfulActions || 0} successful`);

                if (success) {
                    this.testResults.overallSystem.score += 10;
                    this.testResults.overallSystem.successes.push(test.description);
                } else {
                    this.testResults.overallSystem.issues.push(`Multi-command failed: ${test.command}`);
                }

            } catch (error) {
                console.log(`      ❌ ${test.description}: ERROR - ${error.message}`);
                this.testResults.overallSystem.issues.push(`Execution error: ${test.command} - ${error.message}`);
            }

            await this.page.waitForTimeout(2000);
        }
    }

    async testCopilotKitIntegration() {
        console.log('\n🤖 PHASE 3: COPILOTKIT CALENDAR ACTIONS INTEGRATION');

        // Test if CopilotKit calendar actions are available
        const actionsAvailable = await this.page.evaluate(() => {
            // Check if calendar actions are registered
            const actions = window.__copilotkit_actions__ || [];
            const calendarActions = actions.filter(action =>
                action.name.includes('calendar') ||
                action.name.includes('Date') ||
                action.name.includes('Quarter') ||
                action.name.includes('Trading')
            );

            return {
                totalActions: actions.length,
                calendarActions: calendarActions.length,
                actionNames: calendarActions.map(a => a.name)
            };
        });

        const success = actionsAvailable.calendarActions > 0;
        console.log(`   CopilotKit Calendar Actions: ${actionsAvailable.calendarActions} found`);
        console.log(`      Actions: ${actionsAvailable.actionNames.join(', ')}`);
        console.log(`      ${success ? '✅' : '❌'} CopilotKit Integration: ${success ? 'ACTIVE' : 'NOT DETECTED'}`);

        this.testResults.copilotKitIntegration.push({
            actionsAvailable,
            success,
            timestamp: new Date()
        });

        if (success) {
            this.testResults.overallSystem.score += 15;
            this.testResults.overallSystem.successes.push('CopilotKit calendar actions available');
        } else {
            this.testResults.overallSystem.issues.push('CopilotKit calendar actions not detected');
        }
    }

    async testAguiCalendarComponents() {
        console.log('\n🎨 PHASE 4: AGUI CALENDAR COMPONENTS');

        try {
            // Test AGUI calendar component generation
            const componentTest = await this.page.evaluate(() => {
                // Check if AGUI calendar components are available
                const componentTypes = ['calendar', 'date-picker', 'trading-calendar'];
                const available = componentTypes.map(type => {
                    // Try to find AGUI component renderer
                    return {
                        type,
                        available: typeof window.renderAguiCalendarComponent === 'function'
                    };
                });

                return {
                    componentTypes: available,
                    rendererAvailable: typeof window.renderAguiCalendarComponent === 'function'
                };
            });

            const success = componentTest.rendererAvailable;
            console.log(`   AGUI Calendar Renderer: ${success ? '✅ AVAILABLE' : '❌ NOT FOUND'}`);

            componentTest.componentTypes.forEach(comp => {
                console.log(`      ${comp.type}: ${comp.available ? '✅' : '❌'}`);
            });

            this.testResults.aguiGeneration.push({
                componentTest,
                success,
                timestamp: new Date()
            });

            if (success) {
                this.testResults.overallSystem.score += 10;
                this.testResults.overallSystem.successes.push('AGUI calendar components ready');
            } else {
                this.testResults.overallSystem.issues.push('AGUI calendar components not available');
            }

        } catch (error) {
            console.log(`   ❌ AGUI Test Error: ${error.message}`);
            this.testResults.overallSystem.issues.push(`AGUI error: ${error.message}`);
        }
    }

    async runFullSystemTest() {
        try {
            await this.navigateToApp();
            await this.testNaturalLanguageParsing();
            await this.testMultiCommandExecution();
            await this.testCopilotKitIntegration();
            await this.testAguiCalendarComponents();

            return this.generateReport();

        } catch (error) {
            console.error('💥 System test error:', error.message);
            return { error: error.message };
        }
    }

    generateReport() {
        console.log('\n📊 RENATA CALENDAR SYSTEM VALIDATION REPORT');
        console.log('═'.repeat(60));

        const score = this.testResults.overallSystem.score;
        const percentage = Math.round((score / this.testResults.overallSystem.maxScore) * 100);

        console.log(`Overall System Score: ${score}/${this.testResults.overallSystem.maxScore} (${percentage}%)`);

        if (percentage >= 90) {
            console.log('🎉 PRODUCTION READY - Excellent calendar system implementation!');
        } else if (percentage >= 70) {
            console.log('✅ FUNCTIONAL - Good calendar system with minor issues');
        } else if (percentage >= 50) {
            console.log('⚠️ PARTIAL - Calendar system partially working, needs improvements');
        } else {
            console.log('❌ CRITICAL ISSUES - Calendar system requires major fixes');
        }

        console.log('\nSUCCESSES:');
        this.testResults.overallSystem.successes.forEach(success => {
            console.log(`   ✅ ${success}`);
        });

        if (this.testResults.overallSystem.issues.length > 0) {
            console.log('\nISSUES TO ADDRESS:');
            this.testResults.overallSystem.issues.forEach(issue => {
                console.log(`   ❌ ${issue}`);
            });
        }

        console.log('\nSYSTEM CAPABILITIES VERIFIED:');
        console.log(`   📊 Natural Language Parsing: ${this.testResults.naturalLanguageParsing.filter(t => t.success).length} tests passed`);
        console.log(`   🎯 Multi-Command Execution: ${this.testResults.multiCommandExecution.filter(t => t.success).length} tests passed`);
        console.log(`   🤖 CopilotKit Integration: ${this.testResults.copilotKitIntegration.filter(t => t.success).length ? 'Active' : 'Issues'}`);
        console.log(`   🎨 AGUI Components: ${this.testResults.aguiGeneration.filter(t => t.success).length ? 'Ready' : 'Issues'}`);

        return {
            score: percentage,
            ready: percentage >= 70,
            testResults: this.testResults,
            recommendation: percentage >= 90 ? 'DEPLOY TO PRODUCTION' :
                          percentage >= 70 ? 'READY FOR TESTING' :
                          percentage >= 50 ? 'NEEDS IMPROVEMENT' : 'MAJOR FIXES REQUIRED'
        };
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('\n🧹 Calendar system validation cleanup completed');
        }
    }
}

// Main execution
async function runCalendarSystemValidation() {
    const validator = new RenataCalendarSystemValidator();

    try {
        const results = await validator.runFullSystemTest();

        console.log('\n🗓️ CALENDAR SYSTEM VALIDATION COMPLETE');
        console.log(`Final Recommendation: ${results.recommendation}`);

        return results;
    } finally {
        await validator.cleanup();
    }
}

if (require.main === module) {
    runCalendarSystemValidation().catch(console.error);
}

module.exports = { RenataCalendarSystemValidator };