const { chromium } = require('playwright');

/**
 * 🔍 LIVE SESSION DEBUG
 * Connect to your actual browser session and see what's happening
 */

async function debugLiveSession() {
    console.log('🔍 LIVE SESSION DEBUG');
    console.log('=====================');

    const browser = await chromium.launch({
        headless: false,
        viewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();

    try {
        // Navigate to your dashboard
        console.log('🌐 Connecting to your dashboard...');
        await page.goto('http://localhost:6565/dashboard');
        await page.waitForTimeout(3000);

        // Check current button states
        console.log('\n📊 CURRENT BUTTON STATES:');
        const currentStates = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')).filter(btn => {
                const text = btn.textContent?.trim();
                return text && (text === '7d' || text === '30d' || text === '90d' || text === 'YTD' || text === 'All');
            });

            return buttons.map(btn => ({
                text: btn.textContent?.trim(),
                classes: btn.className,
                isActive: btn.className.includes('bg-[#B8860B]') || btn.className.includes('traderra-date-active'),
                dataRange: btn.getAttribute('data-range'),
                dataActive: btn.getAttribute('data-active')
            }));
        });

        currentStates.forEach((btn, i) => {
            console.log(`  ${i + 1}. "${btn.text}" - Active: ${btn.isActive}`);
            console.log(`     Classes: ${btn.classes.split(' ').filter(c => c.includes('traderra') || c.includes('bg-')).join(' ')}`);
        });

        // Test a command exactly like you would
        console.log('\n🧪 TESTING: "show me year to date"');

        // Monitor for real-time changes
        await page.evaluate(() => {
            window.debugInfo = {
                beforeState: null,
                afterState: null,
                apiResponse: null,
                stateChanges: []
            };

            // Capture before state
            const captureState = () => {
                return Array.from(document.querySelectorAll('button')).filter(btn => {
                    const text = btn.textContent?.trim();
                    return text && (text === '7d' || text === '30d' || text === '90d' || text === 'YTD' || text === 'All');
                }).map(btn => ({
                    text: btn.textContent?.trim(),
                    isActive: btn.className.includes('bg-[#B8860B]') || btn.className.includes('traderra-date-active')
                }));
            };

            window.debugInfo.beforeState = captureState();

            // Monitor for changes
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const target = mutation.target;
                        if (target.textContent && ['7d', '30d', '90d', 'YTD', 'All'].includes(target.textContent.trim())) {
                            window.debugInfo.stateChanges.push({
                                timestamp: Date.now(),
                                button: target.textContent.trim(),
                                oldClass: mutation.oldValue,
                                newClass: target.className,
                                isNowActive: target.className.includes('bg-[#B8860B]') || target.className.includes('traderra-date-active')
                            });
                        }
                    }
                });
            });

            // Start observing
            document.querySelectorAll('button').forEach(btn => {
                observer.observe(btn, { attributes: true, attributeOldValue: true });
            });

            window.debugObserver = observer;
        });

        // Send the command through chat interface
        const chatResult = await page.evaluate(async () => {
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
                                messages: [{
                                    content: "show me year to date",
                                    role: "user"
                                }]
                            }
                        }
                    })
                });

                const data = await response.json();
                const aiMessage = data?.data?.generateCopilotResponse?.messages?.[0]?.content;
                const clientScript = data?.data?.generateCopilotResponse?.extensions?.clientScript;

                window.debugInfo.apiResponse = { aiMessage, hasScript: !!clientScript };

                // Execute the script
                if (clientScript) {
                    console.log('🔥 Executing client script...');
                    eval(clientScript);
                }

                return {
                    success: true,
                    aiMessage,
                    hasScript: !!clientScript
                };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Wait for changes to occur
        await page.waitForTimeout(4000);

        // Get final state and debug info
        const finalResults = await page.evaluate(() => {
            // Stop observer
            if (window.debugObserver) {
                window.debugObserver.disconnect();
            }

            // Capture final state
            const captureState = () => {
                return Array.from(document.querySelectorAll('button')).filter(btn => {
                    const text = btn.textContent?.trim();
                    return text && (text === '7d' || text === '30d' || text === '90d' || text === 'YTD' || text === 'All');
                }).map(btn => ({
                    text: btn.textContent?.trim(),
                    isActive: btn.className.includes('bg-[#B8860B]') || btn.className.includes('traderra-date-active'),
                    classes: btn.className
                }));
            };

            window.debugInfo.afterState = captureState();

            return window.debugInfo;
        });

        // Analysis
        console.log('\n📊 DETAILED ANALYSIS:');
        console.log('======================');
        console.log(`API Success: ${chatResult.success}`);
        console.log(`AI Message: "${chatResult.aiMessage?.substring(0, 100)}..."`);
        console.log(`Script Executed: ${chatResult.hasScript}`);

        console.log('\n🔄 BEFORE vs AFTER:');
        console.log('Before:');
        finalResults.beforeState.forEach(btn => {
            console.log(`  "${btn.text}": ${btn.isActive ? 'ACTIVE' : 'inactive'}`);
        });

        console.log('After:');
        finalResults.afterState.forEach(btn => {
            console.log(`  "${btn.text}": ${btn.isActive ? 'ACTIVE' : 'inactive'}`);
        });

        console.log('\n🔍 STATE CHANGES DETECTED:');
        if (finalResults.stateChanges.length > 0) {
            finalResults.stateChanges.forEach(change => {
                console.log(`  ${new Date(change.timestamp).toLocaleTimeString()}: "${change.button}" -> ${change.isNowActive ? 'ACTIVE' : 'inactive'}`);
            });
        } else {
            console.log('  ❌ NO STATE CHANGES DETECTED');
        }

        // Check if YTD became active
        const ytdBefore = finalResults.beforeState.find(btn => btn.text === 'YTD')?.isActive;
        const ytdAfter = finalResults.afterState.find(btn => btn.text === 'YTD')?.isActive;
        const ytdChanged = ytdBefore !== ytdAfter;

        console.log('\n🎯 VERDICT:');
        console.log(`YTD button before: ${ytdBefore ? 'ACTIVE' : 'inactive'}`);
        console.log(`YTD button after: ${ytdAfter ? 'ACTIVE' : 'inactive'}`);
        console.log(`YTD state changed: ${ytdChanged ? '✅ YES' : '❌ NO'}`);

        if (!ytdChanged && chatResult.success) {
            console.log('\n🔥 ISSUE CONFIRMED: API works but UI doesn\'t update!');
            console.log('This explains why you see "no state changes".');
        }

        return ytdChanged;

    } catch (error) {
        console.error('❌ Debug error:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

// Run the live debug
debugLiveSession()
    .then(success => {
        if (success) {
            console.log('\n✅ Calendar working correctly');
        } else {
            console.log('\n❌ Calendar UI update issue confirmed');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Live debug failed:', error);
        process.exit(1);
    });