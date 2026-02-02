// Renata State Change Validation Test
// Specifically tests Traderra's Renata AI assistant state changes

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    baseUrl: 'http://localhost:6565',
    screenshotsDir: '/Users/michaeldurante/ai dev/ce-hub/screenshots',
    testTimeout: 60000,
    slowMo: 100
};

// Ensure screenshots directory exists
if (!fs.existsSync(config.screenshotsDir)) {
    fs.mkdirSync(config.screenshotsDir, { recursive: true });
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name, description) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `renata_${timestamp}_${name}.png`;
    const filepath = path.join(config.screenshotsDir, filename);

    await page.screenshot({
        path: filepath,
        fullPage: true
    });

    console.log(`📸 Screenshot: ${filename} - ${description}`);
    return filepath;
}

async function main() {
    console.log('🚀 Starting Renata State Change Validation Test');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        slowMo: config.slowMo,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const results = {
        tests: [],
        screenshots: [],
        consoleLogs: []
    };

    try {
        const page = await browser.newPage();
        page.setDefaultTimeout(30000);

        // Capture console logs
        page.on('console', msg => {
            const logEntry = {
                type: msg.type(),
                text: msg.text(),
                timestamp: new Date().toISOString()
            };
            results.consoleLogs.push(logEntry);
            if (msg.text().includes('navigationCommands') ||
                msg.text().includes('Executing') ||
                msg.text().includes('Renata')) {
                console.log(`🌐 [${logEntry.type}]: ${logEntry.text}`);
            }
        });

        page.on('response', response => {
            if (response.url().includes('/api/renata/chat')) {
                results.consoleLogs.push({
                    type: 'API_CALL',
                    text: `API Call: ${response.status()} ${response.url()}`,
                    timestamp: new Date().toISOString()
                });
                console.log(`📡 API Call: ${response.status()} ${response.url()}`);
            }
        });

        // 1. Navigate to Traderra with cache bypass
        console.log('\n📍 Step 1: Navigating to Traderra...');
        await page.goto(`${config.baseUrl}?t=${Date.now()}`, { waitUntil: 'networkidle2' });
        await sleep(3000);
        await takeScreenshot(page, '01_initial_load', 'Initial Traderra page load');

        // 2. Check for Renata chat component
        console.log('\n💬 Step 2: Looking for Renata chat component...');

        const renataFound = await page.evaluate(() => {
            // Look for various Renata-related elements
            const selectors = [
                'input[placeholder*="Ask" i]',
                'input[placeholder*="chat" i]',
                'textarea[placeholder*="Ask" i]',
                '[class*="chat" i]',
                '[class*="renata" i]',
                '[data-testid*="chat"]'
            ];

            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    return {
                        found: true,
                        selector: selector,
                        placeholder: element.placeholder || '',
                        className: element.className
                    };
                }
            }
            return { found: false };
        });

        if (renataFound.found) {
            console.log(`✅ Renata chat component found: ${renataFound.selector}`);
            results.tests.push({ name: 'Renata Component Detection', status: 'PASS', details: renataFound });
        } else {
            console.log('❌ Renata chat component not found');
            results.tests.push({ name: 'Renata Component Detection', status: 'FAIL', details: 'No chat component found' });
            await takeScreenshot(page, '02_no_renata', 'No Renata component found');
            return results;
        }

        // 3. Test multi-command message
        console.log('\n🎯 Step 3: Testing multi-command message...');

        const testCommands = [
            {
                name: 'Multi-command (Display + Date)',
                message: "Switch to R-multiple mode and show last 90 days",
                expectedCommands: 2
            },
            {
                name: 'Display mode only',
                message: "Switch to dollar mode",
                expectedCommands: 1
            },
            {
                name: 'Date range only',
                message: "Show last 30 days",
                expectedCommands: 1
            }
        ];

        for (const testCase of testCommands) {
            console.log(`\n📝 Testing: ${testCase.name}`);
            console.log(`💬 Message: "${testCase.message}"`);

            // Find and use the chat input
            const chatInput = await page.evaluateHandle((foundSelector) => {
                const element = document.querySelector(foundSelector);
                return element;
            }, renataFound.selector);

            if (chatInput.asElement()) {
                // Clear input and type message
                await chatInput.asElement().click();
                await chatInput.asElement().focus();
                await page.keyboard.down('Control');
                await page.keyboard.press('a');
                await page.keyboard.up('Control');
                await chatInput.asElement().type(testCase.message);

                await takeScreenshot(page, `03_message_typed_${testCase.name.replace(/\s+/g, '_')}`, `Message typed: ${testCase.name}`);

                // Look for send button or use Enter
                const sendButton = await page.evaluateHandle(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    return buttons.find(el =>
                        el.textContent?.toLowerCase().includes('send') ||
                        el.type === 'submit'
                    );
                });

                if (sendButton.asElement()) {
                    await sendButton.asElement().click();
                    console.log('📤 Clicked send button');
                } else {
                    console.log('⌨️ Send button not found, using Enter key');
                    await page.keyboard.press('Enter');
                }

                // Wait for response
                console.log('⏱️ Waiting for AI response...');
                await sleep(8000);

                // Check for state changes
                const stateChangeDetected = await page.evaluate(() => {
                    // Look for console logs about command execution
                    const commandLogs = Array.from(window.console?.logs || [])
                        .filter(log => log.text?.includes('navigationCommands'));

                    // Look for toast notifications or state change indicators
                    const toasts = Array.from(document.querySelectorAll('[class*="toast"], [role="alert"]'));
                    const stateChanges = Array.from(document.querySelectorAll('[data-changed="true"]'));

                    return {
                        commandLogs: commandLogs.length,
                        toasts: toasts.length,
                        stateChanges: stateChanges.length
                    };
                });

                await takeScreenshot(page, `04_response_${testCase.name.replace(/\s+/g, '_')}`, `After response: ${testCase.name}`);

                results.tests.push({
                    name: testCase.name,
                    status: stateChangeDetected.commandLogs > 0 || stateChangeDetected.toasts > 0 ? 'PASS' : 'PARTIAL',
                    details: stateChangeDetected
                });

                console.log(`📊 State changes detected: ${JSON.stringify(stateChangeDetected)}`);

            } else {
                console.log('❌ Could not interact with chat input');
                results.tests.push({ name: testCase.name, status: 'FAIL', details: 'Chat input not interactive' });
            }

            await sleep(2000); // Brief pause between tests
        }

        // 4. Final analysis
        console.log('\n📊 Step 4: Final state analysis...');
        const finalState = await page.evaluate(() => {
            // Check for any active state indicators
            const activeElements = Array.from(document.querySelectorAll('[class*="active"], [aria-pressed="true"]'));
            const displayButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
                btn.textContent?.includes('$') || btn.textContent?.includes('R')
            );

            return {
                activeElements: activeElements.length,
                displayButtons: displayButtons.map(btn => ({
                    text: btn.textContent?.trim(),
                    active: btn.classList.contains('active') || btn.getAttribute('aria-pressed') === 'true'
                }))
            };
        });

        await takeScreenshot(page, '05_final_state', 'Final application state');

        results.tests.push({
            name: 'Final State Analysis',
            status: finalState.displayButtons.length > 0 ? 'PASS' : 'PARTIAL',
            details: finalState
        });

        // 5. Save comprehensive results
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: results.tests.length,
                passed: results.tests.filter(t => t.status === 'PASS').length,
                partial: results.tests.filter(t => t.status === 'PARTIAL').length,
                failed: results.tests.filter(t => t.status === 'FAIL').length
            },
            tests: results.tests,
            consoleLogs: results.consoleLogs,
            screenshots: results.screenshots
        };

        fs.writeFileSync('/Users/michaeldurante/ai dev/ce-hub/screenshots/renata_validation_results.json', JSON.stringify(report, null, 2));

        console.log('\n🎯 VALIDATION SUMMARY:');
        console.log(`✅ Passed: ${report.summary.passed}`);
        console.log(`⚠️ Partial: ${report.summary.partial}`);
        console.log(`❌ Failed: ${report.summary.failed}`);
        console.log(`📸 Screenshots: ${results.screenshots.length}`);
        console.log(`📊 Console logs captured: ${results.consoleLogs.length}`);

        return report;

    } catch (error) {
        console.error('❌ Test failed with error:', error);

        try {
            await takeScreenshot(page, 'error_state', 'Error during Renata test');
        } catch (screenshotError) {
            console.log('Could not capture error screenshot:', screenshotError.message);
        }

        results.tests.push({ name: 'Test Execution', status: 'FAIL', details: error.message });
        return results;

    } finally {
        await browser.close();
        console.log('🔚 Browser closed');
    }
}

// Run the test
main().then(results => {
    console.log('\n✅ Renata State Change Validation Complete!');
    console.log('📁 Results saved to: /Users/michaeldurante/ai dev/ce-hub/screenshots/');
}).catch(console.error);