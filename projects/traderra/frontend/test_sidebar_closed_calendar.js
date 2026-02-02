const { chromium } = require('playwright');

/**
 * 🔥 CRITICAL TEST: Calendar with Sidebar CLOSED
 * Tests the fix to ensure calendar hooks are registered even when chat sidebar is closed
 */

async function testSidebarClosedCalendar() {
    console.log('🔥 TESTING: Calendar functionality with sidebar CLOSED');
    console.log('=======================================================');

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

        // CRITICAL: Ensure sidebar is closed
        console.log('\n🔒 ENSURING SIDEBAR IS CLOSED...');
        const sidebarStatus = await page.evaluate(() => {
            // Look for the sidebar element
            const sidebar = document.querySelector('[class*="right-0"][class*="w-[480px]"]');
            return {
                sidebarExists: !!sidebar,
                sidebarVisible: sidebar ? sidebar.offsetParent !== null : false
            };
        });

        console.log(`Sidebar exists: ${sidebarStatus.sidebarExists}`);
        console.log(`Sidebar visible: ${sidebarStatus.sidebarVisible}`);

        if (sidebarStatus.sidebarVisible) {
            console.log('📌 Sidebar is open - closing it first...');
            // Click the AI toggle to close sidebar
            await page.click('button[aria-label="Toggle AI Assistant"], [data-testid="ai-toggle"], button:has-text("AI")');
            await page.waitForTimeout(1000);

            const newStatus = await page.evaluate(() => {
                const sidebar = document.querySelector('[class*="right-0"][class*="w-[480px]"]');
                return !!sidebar && sidebar.offsetParent !== null;
            });

            console.log(`Sidebar now visible: ${newStatus}`);
        } else {
            console.log('✅ Sidebar is already closed - perfect!');
        }

        // Check initial calendar state
        console.log('\n📊 INITIAL CALENDAR STATE:');
        const initialState = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')).filter(btn => {
                const text = btn.textContent?.trim();
                return text && (text === '7d' || text === '30d' || text === '90d' || text === 'YTD' || text === 'All');
            });

            return buttons.map(btn => ({
                text: btn.textContent?.trim(),
                isActive: btn.className.includes('bg-[#B8860B]') || btn.className.includes('traderra-date-active'),
                classes: btn.className
            }));
        });

        initialState.forEach(btn => {
            console.log(`  "${btn.text}": ${btn.isActive ? 'ACTIVE' : 'inactive'}`);
        });

        // Test the critical YTD command with sidebar closed
        console.log('\n🧪 TESTING YTD COMMAND (sidebar closed):');
        console.log('Command: "show me year to date"');

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
                const aiMessage = data?.data?.generateCopilotResponse?.messages?.[0]?.content;

                console.log('📡 API Response received');
                console.log('Has client script:', !!clientScript);
                console.log('AI Message:', aiMessage);

                if (clientScript) {
                    console.log('🚀 Executing client script...');
                    eval(clientScript);
                    console.log('✅ Client script executed');
                } else {
                    console.log('❌ NO CLIENT SCRIPT IN API RESPONSE!');
                }

                return {
                    success: true,
                    hasScript: !!clientScript,
                    aiMessage
                };
            } catch (error) {
                console.error('API call failed:', error);
                return { success: false, error: error.message };
            }
        });

        // Wait for state changes
        await page.waitForTimeout(3000);

        // Check final calendar state
        console.log('\n📊 FINAL CALENDAR STATE:');
        const finalState = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')).filter(btn => {
                const text = btn.textContent?.trim();
                return text && (text === '7d' || text === '30d' || text === '90d' || text === 'YTD' || text === 'All');
            });

            return buttons.map(btn => ({
                text: btn.textContent?.trim(),
                isActive: btn.className.includes('bg-[#B8860B]') || btn.className.includes('traderra-date-active'),
                classes: btn.className
            }));
        });

        finalState.forEach(btn => {
            console.log(`  "${btn.text}": ${btn.isActive ? 'ACTIVE' : 'inactive'}`);
        });

        // Determine success
        const ytdBefore = initialState.find(btn => btn.text === 'YTD')?.isActive || false;
        const ytdAfter = finalState.find(btn => btn.text === 'YTD')?.isActive || false;
        const ytdChanged = ytdBefore !== ytdAfter;

        console.log('\n🎯 TEST RESULTS:');
        console.log('================');
        console.log(`API Success: ${apiResult.success}`);
        console.log(`Client Script Present: ${apiResult.hasScript}`);
        console.log(`YTD Before: ${ytdBefore ? 'active' : 'inactive'}`);
        console.log(`YTD After: ${ytdAfter ? 'active' : 'inactive'}`);
        console.log(`State Changed: ${ytdChanged ? '✅ YES' : '❌ NO'}`);

        if (ytdChanged && apiResult.success) {
            console.log('\n🎉 SUCCESS: Calendar controls work with sidebar CLOSED!');
            console.log('🔥 The hook registration fix is working correctly!');
            return true;
        } else if (!apiResult.hasScript) {
            console.log('\n❌ FAILURE: No client script in API response');
            console.log('   This suggests the CopilotKit action hooks are not registered');
            return false;
        } else if (!ytdChanged) {
            console.log('\n❌ FAILURE: API worked but UI did not update');
            console.log('   Client script executed but state change failed');
            return false;
        } else {
            console.log('\n❌ FAILURE: Unknown issue');
            return false;
        }

    } catch (error) {
        console.error('❌ Test error:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
testSidebarClosedCalendar()
    .then(success => {
        if (success) {
            console.log('\n✅ CALENDAR SIDEBAR-CLOSED TEST: PASSED');
            console.log('🔥 The fix successfully enables calendar control with sidebar closed!');
        } else {
            console.log('\n❌ CALENDAR SIDEBAR-CLOSED TEST: FAILED');
            console.log('❗ Calendar hooks may still not be properly registered');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Test execution failed:', error);
        process.exit(1);
    });