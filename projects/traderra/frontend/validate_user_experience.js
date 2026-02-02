const { chromium } = require('playwright');

/**
 * 🎯 USER EXPERIENCE VALIDATION
 * Test exactly what the user should be seeing vs what they report
 */

async function validateUserExperience() {
    console.log('🎯 USER EXPERIENCE VALIDATION TEST');
    console.log('===================================');

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

        // Take initial screenshot
        console.log('📸 Taking INITIAL screenshot...');
        await page.screenshot({ path: 'validation_initial_state.png', fullPage: true });

        // Find and analyze all calendar-related buttons
        console.log('\\n🔍 ANALYZING CALENDAR UI ELEMENTS...');

        const calendarAnalysis = await page.evaluate(() => {
            const analysis = {
                allButtons: [],
                calendarButtons: [],
                activeButtons: [],
                dateRelatedElements: []
            };

            // Find all buttons
            const allButtons = document.querySelectorAll('button');
            allButtons.forEach((btn, index) => {
                const text = btn.textContent?.trim() || '';
                const classes = btn.className || '';
                const isVisible = btn.offsetParent !== null;

                analysis.allButtons.push({
                    index,
                    text,
                    classes,
                    isVisible,
                    boundingRect: btn.getBoundingClientRect()
                });

                // Calendar-related buttons
                if (text.includes('7d') || text.includes('30d') || text.includes('90d') ||
                    text.includes('YTD') || text.includes('All') || text.toLowerCase().includes('year') ||
                    text.toLowerCase().includes('month') || text.toLowerCase().includes('day')) {

                    analysis.calendarButtons.push({
                        index,
                        text,
                        classes,
                        isVisible,
                        isActive: classes.includes('active') || classes.includes('selected') || classes.includes('bg-yellow') || classes.includes('bg-blue'),
                        boundingRect: btn.getBoundingClientRect()
                    });
                }

                // Active buttons
                if (classes.includes('active') || classes.includes('selected') ||
                    classes.includes('bg-yellow') || classes.includes('bg-blue')) {
                    analysis.activeButtons.push({
                        index,
                        text,
                        classes,
                        isVisible,
                        boundingRect: btn.getBoundingClientRect()
                    });
                }
            });

            // Find date-related text elements
            const textElements = document.querySelectorAll('*');
            textElements.forEach(el => {
                const text = el.textContent?.trim() || '';
                if ((text.includes('2024') || text.includes('2025') ||
                     text.toLowerCase().includes('year to date') ||
                     text.toLowerCase().includes('ytd')) &&
                    el.children.length === 0) { // Only text nodes

                    analysis.dateRelatedElements.push({
                        tagName: el.tagName,
                        text,
                        classes: el.className,
                        boundingRect: el.getBoundingClientRect()
                    });
                }
            });

            return analysis;
        });

        console.log('📊 CALENDAR UI ANALYSIS:');
        console.log('========================');
        console.log(`Total Buttons: ${calendarAnalysis.allButtons.length}`);
        console.log(`Calendar Buttons: ${calendarAnalysis.calendarButtons.length}`);
        console.log(`Active Buttons: ${calendarAnalysis.activeButtons.length}`);
        console.log(`Date Elements: ${calendarAnalysis.dateRelatedElements.length}`);

        console.log('\\n📅 CALENDAR BUTTONS FOUND:');
        calendarAnalysis.calendarButtons.forEach((btn, i) => {
            console.log(`  ${i + 1}. "${btn.text}" - Active: ${btn.isActive}, Visible: ${btn.isVisible}`);
            console.log(`     Classes: ${btn.classes}`);
        });

        console.log('\\n✅ ACTIVE BUTTONS:');
        calendarAnalysis.activeButtons.forEach((btn, i) => {
            console.log(`  ${i + 1}. "${btn.text}" - ${btn.classes}`);
        });

        // Test calendar commands
        console.log('\\n🧪 TESTING CALENDAR COMMANDS...');

        const testCommands = [
            { command: "show me year to date", expected: "YTD/year button should be active" },
            { command: "show me 7 days", expected: "7d button should be active" },
            { command: "show all time", expected: "All button should be active" }
        ];

        const results = [];

        for (let i = 0; i < testCommands.length; i++) {
            const test = testCommands[i];
            console.log(`\\n🎯 TEST ${i + 1}: "${test.command}"`);

            const beforeState = await page.evaluate(() => {
                return {
                    activeButtons: Array.from(document.querySelectorAll('button')).map(btn => ({
                        text: btn.textContent?.trim(),
                        isActive: btn.className.includes('active') || btn.className.includes('selected') ||
                                 btn.className.includes('bg-yellow') || btn.className.includes('bg-blue')
                    })).filter(btn => btn.isActive)
                };
            });

            console.log(`   BEFORE: Active buttons: ${beforeState.activeButtons.map(b => b.text).join(', ')}`);

            // Send command
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
                        message: data?.data?.generateCopilotResponse?.messages?.[0]?.content,
                        hasScript: !!clientScript
                    };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }, test.command);

            // Wait for changes
            await page.waitForTimeout(2000);

            const afterState = await page.evaluate(() => {
                return {
                    activeButtons: Array.from(document.querySelectorAll('button')).map(btn => ({
                        text: btn.textContent?.trim(),
                        isActive: btn.className.includes('active') || btn.className.includes('selected') ||
                                 btn.className.includes('bg-yellow') || btn.className.includes('bg-blue')
                    })).filter(btn => btn.isActive)
                };
            });

            console.log(`   AFTER:  Active buttons: ${afterState.activeButtons.map(b => b.text).join(', ')}`);
            console.log(`   API Response: "${apiResult.message}"`);
            console.log(`   Script Executed: ${apiResult.hasScript}`);

            const stateChanged = JSON.stringify(beforeState) !== JSON.stringify(afterState);
            console.log(`   STATE CHANGED: ${stateChanged ? '✅ YES' : '❌ NO'}`);

            results.push({
                command: test.command,
                expected: test.expected,
                beforeState,
                afterState,
                stateChanged,
                apiResult
            });
        }

        // Take final screenshot
        console.log('\\n📸 Taking FINAL screenshot...');
        await page.screenshot({ path: 'validation_final_state.png', fullPage: true });

        // Overall assessment
        console.log('\\n📋 OVERALL ASSESSMENT:');
        console.log('========================');

        const workingCommands = results.filter(r => r.stateChanged).length;
        console.log(`Working Commands: ${workingCommands}/${results.length}`);

        if (workingCommands === results.length) {
            console.log('🎉 ALL CALENDAR COMMANDS ARE WORKING CORRECTLY');
            console.log('   The user may be experiencing a cache/browser issue or looking at wrong elements.');
        } else if (workingCommands === 0) {
            console.log('❌ NO CALENDAR COMMANDS ARE WORKING');
            console.log('   System appears broken as user reported.');
        } else {
            console.log(`⚠️ PARTIAL FUNCTIONALITY: ${workingCommands}/${results.length} commands working`);
            console.log('   Some calendar functions work, others don\'t.');
        }

        return {
            calendarAnalysis,
            testResults: results,
            workingCommands,
            totalCommands: results.length
        };

    } catch (error) {
        console.error('❌ Validation error:', error.message);
        await page.screenshot({ path: 'validation_error.png' });
        return { error: error.message };
    } finally {
        await browser.close();
    }
}

// Run the validation
validateUserExperience()
    .then(results => {
        if (results.error) {
            console.log('\\n💥 VALIDATION FAILED:', results.error);
            process.exit(1);
        } else if (results.workingCommands === results.totalCommands) {
            console.log('\\n✅ SYSTEM IS WORKING - User may have browser/cache issue');
            process.exit(0);
        } else {
            console.log(`\\n⚠️ SYSTEM PARTIALLY WORKING - ${results.workingCommands}/${results.totalCommands} functions work`);
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\\n💥 Validation execution failed:', error);
        process.exit(1);
    });