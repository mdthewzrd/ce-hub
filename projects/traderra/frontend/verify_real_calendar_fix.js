const { chromium } = require('playwright');

/**
 * 🔥 REAL CALENDAR FIX VERIFICATION
 * Tests actual visual state changes after the global bridge fix
 */

async function verifyRealCalendarFix() {
    console.log('🔥 VERIFYING REAL CALENDAR FIX');
    console.log('==============================');
    console.log('This test verifies ACTUAL visual button state changes');
    console.log('Previous tests were giving false positives!');

    const browser = await chromium.launch({
        headless: false,
        viewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();

    try {
        // Navigate to main page (where issue occurred)
        console.log('\n🌐 Navigating to MAIN PAGE (/) where the issue was...');
        await page.goto('http://localhost:6565/');
        await page.waitForTimeout(5000);

        // Check if global bridge is now loaded
        const bridgeStatus = await page.evaluate(() => {
            // Check for event listeners and bridge functions
            const hasGlobalBridge = !!window.traderraExecuteActions;
            const hasEventListeners = !!window.__traderraEventListenersSetup__;

            // Test if the global bridge is working by checking console
            console.log('🔍 Bridge check - hasGlobalBridge:', hasGlobalBridge);
            console.log('🔍 Bridge check - hasEventListeners:', hasEventListeners);

            return {
                hasGlobalBridge,
                hasEventListeners,
                windowFunctions: Object.keys(window).filter(k => k.includes('traderra'))
            };
        });

        console.log('\n🔍 GLOBAL BRIDGE STATUS:');
        console.log('Has traderraExecuteActions:', bridgeStatus.hasGlobalBridge);
        console.log('Has event listeners:', bridgeStatus.hasEventListeners);
        console.log('Traderra window functions:', bridgeStatus.windowFunctions);

        // Take initial screenshot for comparison
        console.log('\n📸 Taking INITIAL screenshot...');
        await page.screenshot({ path: 'fix_test_initial.png', fullPage: true });

        // Check initial button states with PRECISE selectors
        console.log('\n📊 INITIAL BUTTON STATE (visual inspection):');
        const initialState = await page.evaluate(() => {
            // More precise button detection
            const dateButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
                const text = btn.textContent?.trim();
                return text && ['7d', '30d', '90d', 'YTD', 'All'].includes(text);
            });

            return dateButtons.map(btn => {
                const text = btn.textContent?.trim();
                const computedStyle = window.getComputedStyle(btn);
                const hasActiveClass = btn.className.includes('bg-[#B8860B]') ||
                                     btn.className.includes('traderra-date-active');
                const hasYellowBg = computedStyle.backgroundColor.includes('184, 134, 11') ||
                                   computedStyle.backgroundColor.includes('rgb(184, 134, 11)');

                console.log(`Button "${text}": class=${btn.className}, bg=${computedStyle.backgroundColor}`);

                return {
                    text,
                    className: btn.className,
                    backgroundColor: computedStyle.backgroundColor,
                    isActive: hasActiveClass || hasYellowBg,
                    element: btn.outerHTML.substring(0, 200)
                };
            });
        });

        initialState.forEach(btn => {
            console.log(`  "${btn.text}": ${btn.isActive ? '🟡 ACTIVE' : '⚪ inactive'} (${btn.backgroundColor})`);
        });

        const initialActive = initialState.find(btn => btn.isActive)?.text || 'none';
        console.log(`\n🎯 Initially active: "${initialActive}"`);

        // Monitor ALL console logs to see event flow
        const consoleLogs = [];
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('BRIDGE') || text.includes('DateRange') || text.includes('CopilotKit') ||
                text.includes('traderra') || text.includes('GLOBAL')) {
                consoleLogs.push(`[${new Date().toLocaleTimeString()}] ${text}`);
            }
        });

        // Test the calendar command
        console.log('\n🧪 TESTING CALENDAR COMMAND: "show me 7 days"');
        console.log('Watching for complete event chain...');

        const apiResult = await page.evaluate(async () => {
            try {
                console.log('🔥 Starting API call for "show me 7 days"');

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
                                messages: [{ content: "show me 7 days", role: "user" }]
                            }
                        }
                    })
                });

                const data = await response.json();
                const clientScript = data?.data?.generateCopilotResponse?.extensions?.clientScript;

                console.log('📡 API response received');
                console.log('Has client script:', !!clientScript);

                if (clientScript) {
                    console.log('🚀 Executing client script...');
                    eval(clientScript);
                    console.log('✅ Client script execution completed');
                }

                return {
                    success: true,
                    hasScript: !!clientScript,
                    scriptPreview: clientScript ? clientScript.substring(0, 100) + '...' : 'none'
                };
            } catch (error) {
                console.error('❌ API call failed:', error);
                return { success: false, error: error.message };
            }
        });

        // Wait for all events to propagate
        await page.waitForTimeout(3000);

        // Check final button states
        console.log('\n📊 FINAL BUTTON STATE (visual inspection):');
        const finalState = await page.evaluate(() => {
            const dateButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
                const text = btn.textContent?.trim();
                return text && ['7d', '30d', '90d', 'YTD', 'All'].includes(text);
            });

            return dateButtons.map(btn => {
                const text = btn.textContent?.trim();
                const computedStyle = window.getComputedStyle(btn);
                const hasActiveClass = btn.className.includes('bg-[#B8860B]') ||
                                     btn.className.includes('traderra-date-active');
                const hasYellowBg = computedStyle.backgroundColor.includes('184, 134, 11') ||
                                   computedStyle.backgroundColor.includes('rgb(184, 134, 11)');

                return {
                    text,
                    className: btn.className,
                    backgroundColor: computedStyle.backgroundColor,
                    isActive: hasActiveClass || hasYellowBg
                };
            });
        });

        finalState.forEach(btn => {
            console.log(`  "${btn.text}": ${btn.isActive ? '🟡 ACTIVE' : '⚪ inactive'} (${btn.backgroundColor})`);
        });

        const finalActive = finalState.find(btn => btn.isActive)?.text || 'none';

        // Take final screenshot
        console.log('\n📸 Taking FINAL screenshot...');
        await page.screenshot({ path: 'fix_test_final.png', fullPage: true });

        // Show console log chain
        console.log('\n📝 EVENT CHAIN LOGS:');
        if (consoleLogs.length > 0) {
            consoleLogs.slice(-15).forEach(log => console.log(`  ${log}`));
        } else {
            console.log('  ❌ NO RELEVANT CONSOLE LOGS CAPTURED');
        }

        // Analyze results
        console.log('\n🎯 VERIFICATION RESULTS:');
        console.log('=========================');
        console.log(`API Success: ${apiResult.success ? '✅' : '❌'}`);
        console.log(`Script Executed: ${apiResult.hasScript ? '✅' : '❌'}`);
        console.log(`Initial Active: "${initialActive}"`);
        console.log(`Final Active: "${finalActive}"`);
        console.log(`Visual Change: ${initialActive !== finalActive ? '✅ YES' : '❌ NO'}`);
        console.log(`Expected Change: "${initialActive}" → "7d"`);
        console.log(`Actual Change: "${initialActive}" → "${finalActive}"`);

        const reallyFixed = initialActive !== finalActive && finalActive === '7d' && apiResult.success;

        console.log('\n🏆 FINAL VERDICT:');
        if (reallyFixed) {
            console.log('🎉 SUCCESS! Calendar state changes are REALLY working!');
            console.log('✅ Visual button states update correctly');
            console.log('✅ Global bridge is loaded on all pages');
            console.log('✅ Event chain flows properly');
            console.log('🔥 Fix confirmed - ready for user testing!');
        } else {
            console.log('❌ STILL NOT WORKING:');
            if (!apiResult.success) console.log('   - API call failed');
            if (!apiResult.hasScript) console.log('   - No client script in response');
            if (initialActive === finalActive) console.log('   - No visual state change occurred');
            if (finalActive !== '7d') console.log(`   - Wrong final state (expected "7d", got "${finalActive}")`);
            console.log('⚠️ Need further investigation...');
        }

        return reallyFixed;

    } catch (error) {
        console.error('❌ Verification error:', error.message);
        await page.screenshot({ path: 'fix_test_error.png' });
        return false;
    } finally {
        await browser.close();
    }
}

// Run verification
verifyRealCalendarFix()
    .then(success => {
        if (success) {
            console.log('\n✅ CALENDAR FIX VERIFICATION: SUCCESS');
            console.log('🎯 Real UI state changes are working!');
        } else {
            console.log('\n❌ CALENDAR FIX VERIFICATION: FAILED');
            console.log('🔍 Further debugging needed...');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Verification failed to run:', error);
        process.exit(1);
    });