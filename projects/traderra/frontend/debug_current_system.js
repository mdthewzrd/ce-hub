const { chromium } = require('playwright');

/**
 * 🔍 DEBUG CURRENT SYSTEM
 * Let's see what's actually happening in the browser when we make a calendar request
 */

async function debugCurrentSystem() {
    console.log('🔍 DEBUGGING CURRENT SYSTEM');
    console.log('============================');

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

        // Monitor all console messages
        console.log('\n📺 BROWSER CONSOLE MONITORING:');
        page.on('console', msg => {
            console.log(`   BROWSER: ${msg.text()}`);
        });

        console.log('\n🧪 Testing "show me year to date"...');

        // Test what happens when we make a YTD request
        const result = await page.evaluate(async () => {
            try {
                console.log('🚀 Making YTD request...');

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
                                messages: [{
                                    content: "show me year to date",
                                    role: "user"
                                }]
                            }
                        }
                    })
                });

                const data = await response.json();
                console.log('📦 Response received:', JSON.stringify(data, null, 2));

                const clientScript = data?.data?.generateCopilotResponse?.extensions?.clientScript;
                console.log('🔧 Client script exists:', !!clientScript);

                if (clientScript) {
                    console.log('🚀 Executing client script...');
                    eval(clientScript);
                }

                // Check if any global functions exist
                console.log('🔍 Window functions available:');
                console.log('  - window.traderraExecuteActions:', typeof window.traderraExecuteActions);
                console.log('  - window.dispatchEvent:', typeof window.dispatchEvent);

                return {
                    success: true,
                    hasClientScript: !!clientScript,
                    clientScript: clientScript?.slice(0, 200) + '...' // First 200 chars
                };

            } catch (error) {
                console.error('❌ Error in browser test:', error);
                return { success: false, error: error.message };
            }
        });

        console.log('\n📊 BROWSER TEST RESULT:');
        console.log('========================');
        console.log('Success:', result.success);
        console.log('Has Client Script:', result.hasClientScript);
        if (result.clientScript) {
            console.log('Client Script Preview:', result.clientScript);
        }
        if (result.error) {
            console.log('Error:', result.error);
        }

        // Wait a bit to see if anything happens
        await page.waitForTimeout(2000);

        // Check final state
        console.log('\n📸 Taking screenshot of final state...');
        await page.screenshot({ path: 'debug_current_system.png' });

        return result.success;

    } catch (error) {
        console.error('❌ Test error:', error.message);
        await page.screenshot({ path: 'debug_current_system_error.png' });
        return false;
    } finally {
        await browser.close();
    }
}

// Run the debug
debugCurrentSystem()
    .then(success => {
        if (success) {
            console.log('\n✅ DEBUG COMPLETE: Check logs above for analysis');
        } else {
            console.log('\n❌ DEBUG FAILED: System has issues');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Debug execution failed:', error);
        process.exit(1);
    });