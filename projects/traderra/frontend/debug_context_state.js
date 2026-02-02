const { chromium } = require('playwright');

/**
 * 🔍 DEBUG CONTEXT STATE
 * Check what the DateRangeContext state actually is when buttons render
 */

async function debugContextState() {
    console.log('🔍 CONTEXT STATE DEBUG');
    console.log('======================');

    const browser = await chromium.launch({
        headless: false,
        viewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();

    try {
        // Navigate to dashboard
        console.log('🌐 Navigating to dashboard...');
        await page.goto('http://localhost:6565/dashboard');
        await page.waitForTimeout(3000);

        // Inject context state monitoring
        await page.evaluate(() => {
            // Override console.log to capture DateSelector logs
            const originalLog = console.log;
            window.dateRangeState = {
                selectedRange: null,
                lastUpdate: null,
                logs: []
            };

            console.log = function(...args) {
                const message = args.join(' ');

                // Capture DateSelector logs
                if (message.includes('🎯 DateSelector: selectedRange=') ||
                    message.includes('📅 DateRangeContext:') ||
                    message.includes('🗓️ DateRangeContext:')) {
                    window.dateRangeState.logs.push({
                        timestamp: Date.now(),
                        message: message
                    });
                }

                // Extract selectedRange value
                if (message.includes('selectedRange=')) {
                    const match = message.match(/selectedRange=([^,\\s]+)/);
                    if (match) {
                        window.dateRangeState.selectedRange = match[1];
                        window.dateRangeState.lastUpdate = Date.now();
                    }
                }

                return originalLog.apply(console, args);
            };
        });

        // Get initial state
        const initialState = await page.evaluate(() => ({
            contextState: window.dateRangeState?.selectedRange,
            windowContext: window.dateRangeContext ? {
                selectedRange: window.dateRangeContext.selectedRange,
                currentDateRange: window.dateRangeContext.currentDateRange
            } : null
        }));

        console.log('📊 INITIAL STATE:');
        console.log('==================');
        console.log('Context selectedRange:', initialState.contextState);
        console.log('Window context:', JSON.stringify(initialState.windowContext, null, 2));

        // Test YTD command
        console.log('\\n🧪 TESTING YTD COMMAND...');

        const apiResult = await page.evaluate(async () => {
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
                                messages: [{ content: "show me year to date", role: "user" }]
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
        });

        // Wait for state updates
        await page.waitForTimeout(3000);

        // Get final state
        const finalState = await page.evaluate(() => {
            // Get all button states
            const buttons = Array.from(document.querySelectorAll('button')).map(btn => {
                const text = btn.textContent?.trim();
                const classes = btn.className;
                const isActive = classes.includes('traderra-date-active') || classes.includes('bg-[#B8860B]');
                const isInactive = classes.includes('traderra-date-inactive');

                if (text && (text.includes('d') || text.includes('YTD') || text.includes('All'))) {
                    return {
                        text,
                        isActive,
                        isInactive,
                        dataRange: btn.getAttribute('data-range'),
                        dataActive: btn.getAttribute('data-active'),
                        classes: classes.split(' ').filter(c => c.includes('traderra-date') || c.includes('bg-')).join(' ')
                    };
                }
                return null;
            }).filter(Boolean);

            return {
                contextState: window.dateRangeState?.selectedRange,
                lastUpdate: window.dateRangeState?.lastUpdate,
                logs: window.dateRangeState?.logs || [],
                windowContext: window.dateRangeContext ? {
                    selectedRange: window.dateRangeContext.selectedRange,
                    currentDateRange: window.dateRangeContext.currentDateRange
                } : null,
                buttons
            };
        });

        console.log('\\n📊 FINAL STATE ANALYSIS:');
        console.log('==========================');
        console.log('API Result:', apiResult);
        console.log('Context selectedRange:', finalState.contextState);
        console.log('Last Update:', finalState.lastUpdate ? new Date(finalState.lastUpdate).toLocaleTimeString() : 'None');
        console.log('Window context:', JSON.stringify(finalState.windowContext, null, 2));

        console.log('\\n📅 BUTTON STATES:');
        console.log('==================');
        finalState.buttons.forEach((btn, i) => {
            console.log(`  ${i + 1}. "${btn.text}"`);
            console.log(`     Active: ${btn.isActive}, Inactive: ${btn.isInactive}`);
            console.log(`     data-range: ${btn.dataRange}, data-active: ${btn.dataActive}`);
            console.log(`     Classes: ${btn.classes}`);
        });

        if (finalState.logs.length > 0) {
            console.log('\\n📝 CAPTURED LOGS:');
            console.log('==================');
            finalState.logs.slice(-10).forEach((log, i) => {
                const time = new Date(log.timestamp).toLocaleTimeString();
                console.log(`  ${time}: ${log.message}`);
            });
        }

        // Analysis
        const ytdButton = finalState.buttons.find(b => b.text === 'YTD');
        const allButton = finalState.buttons.find(b => b.text === 'All');

        console.log('\\n🎯 ANALYSIS:');
        console.log('=============');
        console.log(`Context says selectedRange: "${finalState.contextState}"`);
        console.log(`YTD button (expects "year"): Active=${ytdButton?.isActive}, data-active=${ytdButton?.dataActive}`);
        console.log(`All button (expects "all"): Active=${allButton?.isActive}, data-active=${allButton?.dataActive}`);

        const contextMatchesExpected = finalState.contextState === 'year';
        const ytdButtonCorrect = ytdButton?.isActive === true;
        const allButtonCorrect = allButton?.isActive === false;

        console.log(`\\nContext correctly set to "year": ${contextMatchesExpected ? '✅' : '❌'}`);
        console.log(`YTD button correctly active: ${ytdButtonCorrect ? '✅' : '❌'}`);
        console.log(`All button correctly inactive: ${allButtonCorrect ? '✅' : '❌'}`);

        const allWorking = contextMatchesExpected && ytdButtonCorrect && allButtonCorrect;

        if (allWorking) {
            console.log('\\n🎉 SYSTEM IS WORKING CORRECTLY');
        } else {
            console.log('\\n❌ DISCONNECT BETWEEN CONTEXT AND UI');
            if (contextMatchesExpected && !ytdButtonCorrect) {
                console.log('   Issue: Context updates but YTD button doesn\'t reflect it');
            } else if (!contextMatchesExpected) {
                console.log('   Issue: Context state is not updating properly');
            }
        }

        return allWorking;

    } catch (error) {
        console.error('❌ Debug error:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

// Run the debug
debugContextState()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('💥 Debug execution failed:', error);
        process.exit(1);
    });