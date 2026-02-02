const { chromium } = require('playwright');

/**
 * 🔬 DIRECT GLOBAL BRIDGE TEST
 * Test if global bridge event listeners are working by manually triggering events
 */

async function testGlobalBridgeDirect() {
    console.log('🔬 DIRECT GLOBAL BRIDGE TEST');
    console.log('===============================');

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

        console.log('📸 Taking initial screenshot...');
        await page.screenshot({ path: 'global_bridge_direct_initial.png' });

        // Monitor console logs
        const allLogs = [];
        const bridgeExecutionLogs = [];
        const globalBridgeLogs = [];

        page.on('console', msg => {
            const text = msg.text();
            allLogs.push(text);

            if (text.includes('GLOBAL BRIDGE') || text.includes('traderraExecuteActions')) {
                globalBridgeLogs.push(text);
                console.log('🔥 GLOBAL BRIDGE LOG:', text);
            }

            if (text.includes('BRIDGE EXECUTING') || text.includes('setDateRange execution')) {
                bridgeExecutionLogs.push(text);
                console.log('🔧 BRIDGE EXECUTION LOG:', text);
            }
        });

        console.log('\n🧪 STEP 1: Check if global bridge setup is loaded...');
        const bridgeStatus = await page.evaluate(() => {
            return {
                globalBridgeExists: typeof window.traderraExecuteActions === 'function',
                traderraActionBridgeExists: typeof window.TraderraActionBridge !== 'undefined',
                consoleMessage: '🔍 Bridge status checked'
            };
        });
        console.log('📊 Bridge Status:', bridgeStatus);

        console.log('\n🧪 STEP 2: Manually trigger traderra-actions event...');
        await page.evaluate(() => {
            console.log('🚀 MANUAL TEST: Dispatching traderra-actions event');
            const testAction = {
                type: 'setDateRange',
                payload: { range: 'ytd' },
                timestamp: Date.now()
            };

            window.dispatchEvent(new CustomEvent('traderra-actions', {
                detail: [testAction]
            }));
        });

        await page.waitForTimeout(2000);
        console.log('⏳ Waited for event processing');

        console.log('\n🧪 STEP 3: Manually trigger traderraExecuteActions function...');
        await page.evaluate(() => {
            console.log('🚀 MANUAL TEST: Calling traderraExecuteActions function');
            if (typeof window.traderraExecuteActions === 'function') {
                const testAction = {
                    type: 'setDateRange',
                    payload: { range: 'ytd' },
                    timestamp: Date.now()
                };

                window.traderraExecuteActions([testAction]);
            } else {
                console.log('❌ traderraExecuteActions function not available');
            }
        });

        await page.waitForTimeout(2000);
        console.log('⏳ Waited for function execution');

        console.log('\n🧪 STEP 4: Check calendar state...');
        await page.screenshot({ path: 'global_bridge_direct_final.png' });

        // Check for YTD button activation
        const buttons = await page.$$('button');
        let ytdActive = false;
        let allActive = false;

        for (let button of buttons) {
            try {
                const text = await button.textContent();
                const classes = await button.getAttribute('class');

                if (text && (text.includes('YTD') || text.toLowerCase().includes('year'))) {
                    const isActive = classes && (classes.includes('active') || classes.includes('selected') || classes.includes('bg-yellow'));
                    console.log(`📅 YTD Button: "${text}" - Active: ${isActive}`);
                    ytdActive = isActive;
                }
                if (text && text === 'All') {
                    const isActive = classes && (classes.includes('active') || classes.includes('selected') || classes.includes('bg-yellow'));
                    console.log(`📅 All Button: "${text}" - Active: ${isActive}`);
                    allActive = isActive;
                }
            } catch (e) {
                // Skip buttons we can't read
            }
        }

        // Results summary
        console.log('\n📊 DIRECT BRIDGE TEST RESULTS:');
        console.log('================================');
        console.log(`🔧 Total console logs: ${allLogs.length}`);
        console.log(`🔥 Global bridge logs: ${globalBridgeLogs.length}`);
        console.log(`⚙️ Bridge execution logs: ${bridgeExecutionLogs.length}`);
        console.log(`📊 Global bridge function exists: ${bridgeStatus.globalBridgeExists}`);
        console.log(`📊 TraderraActionBridge exists: ${bridgeStatus.traderraActionBridgeExists}`);
        console.log(`📅 YTD Button Active: ${ytdActive}`);
        console.log(`📅 All Button Active: ${allActive}`);

        const success = bridgeStatus.globalBridgeExists && (globalBridgeLogs.length > 0 || bridgeExecutionLogs.length > 0);

        if (success) {
            console.log('\n✅ SUCCESS: Global bridge direct test passed!');
        } else {
            console.log('\n⚠️ ISSUES: Global bridge not working properly');

            if (globalBridgeLogs.length > 0) {
                console.log('\n🔥 GLOBAL BRIDGE LOGS:');
                globalBridgeLogs.forEach(log => console.log(`   ${log}`));
            }

            if (bridgeExecutionLogs.length > 0) {
                console.log('\n🔧 BRIDGE EXECUTION LOGS:');
                bridgeExecutionLogs.forEach(log => console.log(`   ${log}`));
            }
        }

        return success;

    } catch (error) {
        console.error('❌ Test error:', error.message);
        await page.screenshot({ path: 'global_bridge_direct_error.png' });
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
testGlobalBridgeDirect()
    .then(success => {
        if (success) {
            console.log('\n🎉 GLOBAL BRIDGE DIRECT TEST: PASSED');
        } else {
            console.log('\n🔧 GLOBAL BRIDGE DIRECT TEST: NEEDS DEBUGGING');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Test execution failed:', error);
        process.exit(1);
    });