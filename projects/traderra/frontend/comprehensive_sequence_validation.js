const { chromium } = require('playwright');

/**
 * 🔥 COMPREHENSIVE SEQUENCE VALIDATION
 * Tests REAL end-to-end multi-message sequences with actual UI state validation
 */

async function comprehensiveSequenceValidation() {
    console.log('🔥 COMPREHENSIVE SEQUENCE VALIDATION');
    console.log('====================================');
    console.log('Testing REAL multi-message sequences with actual UI state changes');

    const browser = await chromium.launch({
        headless: false,
        viewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();

    try {
        // Navigate to dashboard
        console.log('\n🌐 Navigating to dashboard...');
        await page.goto('http://localhost:6565/dashboard');
        await page.waitForTimeout(5000);

        // Test sequences - each is a series of commands that should work together
        const testSequences = [
            {
                name: "Basic Date Sequence",
                commands: [
                    { cmd: "show me 7 days", expectedButton: "7d", expectedPage: "dashboard" },
                    { cmd: "now show 30 days", expectedButton: "30d", expectedPage: "dashboard" },
                    { cmd: "change to 90 days", expectedButton: "90d", expectedPage: "dashboard" }
                ]
            },
            {
                name: "Custom Date + Navigation Sequence",
                commands: [
                    { cmd: "august til now", expectedButton: "90d", expectedPage: "dashboard" },
                    { cmd: "go to statistics page", expectedButton: "90d", expectedPage: "statistics" },
                    { cmd: "show me year to date", expectedButton: "YTD", expectedPage: "statistics" }
                ]
            },
            {
                name: "Complex Multi-Action Sequence",
                commands: [
                    { cmd: "switch to trades page and show 7 days", expectedButton: "7d", expectedPage: "trades" },
                    { cmd: "change to r mode and show 90 days", expectedButton: "90d", expectedPage: "trades" },
                    { cmd: "back to dashboard in dollar mode", expectedButton: "90d", expectedPage: "dashboard" }
                ]
            },
            {
                name: "Custom Date Complex Sequence",
                commands: [
                    { cmd: "since september", expectedButton: "90d", expectedPage: "dashboard" },
                    { cmd: "go to statistics", expectedButton: "90d", expectedPage: "statistics" },
                    { cmd: "from october to now", expectedButton: "30d", expectedPage: "statistics" },
                    { cmd: "show all time", expectedButton: "All", expectedPage: "statistics" }
                ]
            }
        ];

        const sequenceResults = [];

        for (let seqIndex = 0; seqIndex < testSequences.length; seqIndex++) {
            const sequence = testSequences[seqIndex];
            console.log(`\n🔥 SEQUENCE ${seqIndex + 1}/${testSequences.length}: ${sequence.name}`);
            console.log('=' + '='.repeat(sequence.name.length + 20));

            const commandResults = [];
            let sequenceSuccess = true;

            for (let cmdIndex = 0; cmdIndex < sequence.commands.length; cmdIndex++) {
                const test = sequence.commands[cmdIndex];
                console.log(`\n📋 Command ${cmdIndex + 1}/${sequence.commands.length}: "${test.cmd}"`);
                console.log(`Expected: "${test.expectedButton}" button active on "${test.expectedPage}" page`);

                // Get before state
                const beforeState = await page.evaluate(() => {
                    const url = window.location.pathname;
                    const buttons = Array.from(document.querySelectorAll('button')).filter(btn => {
                        const text = btn.textContent?.trim();
                        return text && ['7d', '30d', '90d', 'YTD', 'All'].includes(text);
                    });

                    return {
                        currentPage: url.replace('/', '') || 'dashboard',
                        activeButton: buttons.find(btn =>
                            btn.className.includes('bg-[#B8860B]') ||
                            btn.className.includes('traderra-date-active')
                        )?.textContent?.trim() || 'none',
                        allButtons: buttons.map(btn => ({
                            text: btn.textContent?.trim(),
                            isActive: btn.className.includes('bg-[#B8860B]') ||
                                     btn.className.includes('traderra-date-active')
                        }))
                    };
                });

                console.log(`Before: "${beforeState.activeButton}" active on "${beforeState.currentPage}"`);

                // Send command and capture response
                const apiResult = await page.evaluate(async (command) => {
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
                        const clientScript = data?.data?.generateCopilotResponse?.extensions?.clientScript;
                        const aiMessage = data?.data?.generateCopilotResponse?.messages?.[0]?.content;
                        const actions = data?.data?.generateCopilotResponse?.extensions?.traderraActions || [];

                        if (clientScript) {
                            eval(clientScript);
                        }

                        return {
                            success: response.ok,
                            hasScript: !!clientScript,
                            aiMessage: aiMessage || 'No response',
                            actions: actions,
                            isCleanResponse: !aiMessage.includes('<script') && !aiMessage.includes('BRIDGE')
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error: error.message,
                            aiMessage: 'Error occurred'
                        };
                    }
                }, test.cmd);

                // Wait for changes to apply
                await page.waitForTimeout(3000);

                // Get after state
                const afterState = await page.evaluate(() => {
                    const url = window.location.pathname;
                    const buttons = Array.from(document.querySelectorAll('button')).filter(btn => {
                        const text = btn.textContent?.trim();
                        return text && ['7d', '30d', '90d', 'YTD', 'All'].includes(text);
                    });

                    return {
                        currentPage: url.replace('/', '') || 'dashboard',
                        activeButton: buttons.find(btn =>
                            btn.className.includes('bg-[#B8860B]') ||
                            btn.className.includes('traderra-date-active')
                        )?.textContent?.trim() || 'none',
                        allButtons: buttons.map(btn => ({
                            text: btn.textContent?.trim(),
                            isActive: btn.className.includes('bg-[#B8860B]') ||
                                     btn.className.includes('traderra-date-active')
                        }))
                    };
                });

                console.log(`After:  "${afterState.activeButton}" active on "${afterState.currentPage}"`);
                console.log(`AI Response: "${apiResult.aiMessage}"`);

                // Validate results
                const buttonCorrect = afterState.activeButton === test.expectedButton;
                const pageCorrect = afterState.currentPage === test.expectedPage;
                const stateChanged = beforeState.activeButton !== afterState.activeButton ||
                                   beforeState.currentPage !== afterState.currentPage;
                const responseClean = apiResult.isCleanResponse;

                console.log(`✅ Button Correct: ${buttonCorrect ? '✅' : '❌'} (expected "${test.expectedButton}", got "${afterState.activeButton}")`);
                console.log(`🌐 Page Correct: ${pageCorrect ? '✅' : '❌'} (expected "${test.expectedPage}", got "${afterState.currentPage}")`);
                console.log(`🔄 State Changed: ${stateChanged ? '✅' : '❌'}`);
                console.log(`✨ Response Clean: ${responseClean ? '✅' : '❌'} (no script contamination)`);
                console.log(`📊 API Success: ${apiResult.success ? '✅' : '❌'}`);

                const commandSuccess = buttonCorrect && pageCorrect && responseClean && apiResult.success;
                console.log(`🎯 Command Result: ${commandSuccess ? '🎉 PASSED' : '❌ FAILED'}`);

                if (!commandSuccess) {
                    sequenceSuccess = false;
                }

                commandResults.push({
                    command: test.cmd,
                    expected: test,
                    beforeState,
                    afterState,
                    apiResult,
                    buttonCorrect,
                    pageCorrect,
                    stateChanged,
                    responseClean,
                    commandSuccess
                });

                // Short delay before next command
                await page.waitForTimeout(1000);
            }

            sequenceResults.push({
                sequenceName: sequence.name,
                commandResults,
                sequenceSuccess,
                totalCommands: sequence.commands.length,
                passedCommands: commandResults.filter(r => r.commandSuccess).length
            });

            console.log(`\n🏁 SEQUENCE RESULT: ${sequenceSuccess ? '🎉 ALL PASSED' : '❌ SOME FAILED'}`);
        }

        // Final Summary
        console.log('\n📊 COMPREHENSIVE VALIDATION SUMMARY');
        console.log('====================================');

        const totalSequences = sequenceResults.length;
        const passedSequences = sequenceResults.filter(s => s.sequenceSuccess).length;
        const totalCommands = sequenceResults.reduce((sum, s) => sum + s.totalCommands, 0);
        const passedCommands = sequenceResults.reduce((sum, s) => sum + s.passedCommands, 0);

        console.log(`Sequences Passed: ${passedSequences}/${totalSequences} (${((passedSequences/totalSequences)*100).toFixed(1)}%)`);
        console.log(`Commands Passed: ${passedCommands}/${totalCommands} (${((passedCommands/totalCommands)*100).toFixed(1)}%)`);

        sequenceResults.forEach((result, i) => {
            console.log(`\n${i + 1}. ${result.sequenceName}: ${result.passedCommands}/${result.totalCommands} passed`);
            result.commandResults.forEach((cmd, j) => {
                console.log(`   ${j + 1}. "${cmd.command}" → ${cmd.commandSuccess ? '✅' : '❌'}`);
                if (!cmd.commandSuccess) {
                    if (!cmd.buttonCorrect) console.log(`      - Wrong button (expected "${cmd.expected.expectedButton}", got "${cmd.afterState.activeButton}")`);
                    if (!cmd.pageCorrect) console.log(`      - Wrong page (expected "${cmd.expected.expectedPage}", got "${cmd.afterState.currentPage}")`);
                    if (!cmd.responseClean) console.log(`      - Dirty response (script contamination)`);
                    if (!cmd.apiResult.success) console.log(`      - API failure`);
                }
            });
        });

        const overallSuccess = passedSequences === totalSequences && passedCommands === totalCommands;

        if (overallSuccess) {
            console.log('\n🎉 COMPREHENSIVE VALIDATION: COMPLETE SUCCESS!');
            console.log('✅ ALL sequences work with 100% accuracy');
            console.log('✅ ALL state changes are correct');
            console.log('✅ ALL AI responses are clean');
            console.log('🔥 System is TRULY ready for complex sequences!');
        } else {
            console.log('\n❌ COMPREHENSIVE VALIDATION: ISSUES FOUND');
            console.log('⚠️ System is NOT ready for production sequences');
            console.log('🔍 Further fixes needed');
        }

        return overallSuccess;

    } catch (error) {
        console.error('❌ Validation error:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

comprehensiveSequenceValidation()
    .then(success => {
        console.log(success ? '\n✅ VALIDATION: TRUE SUCCESS' : '\n❌ VALIDATION: FAILED');
        process.exit(success ? 0 : 1);
    });