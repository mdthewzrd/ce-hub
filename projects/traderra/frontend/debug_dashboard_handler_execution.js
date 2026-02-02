const { chromium } = require('playwright');

async function testDashboardHandlerExecution() {
    console.log('🚀 TESTING DASHBOARD HANDLER EXECUTION');

    const browser = await chromium.launch({
        headless: false,
        viewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();

    try {
        // Navigate to dashboard
        console.log('🌐 Navigating to Traderra dashboard...');
        await page.goto('http://localhost:6565/dashboard');
        await page.waitForTimeout(3000); // Wait for full load

        // Wait for Renata chat to be available
        console.log('🤖 Waiting for Renata chat interface...');
        await page.waitForSelector('[data-testid="renata-chat-input"], [placeholder*="Ask"], input[type="text"], textarea', { timeout: 15000 });

        // Take initial screenshot
        console.log('📸 Taking initial state screenshot...');
        await page.screenshot({ path: 'debug_initial_state.png' });

        // Find chat input (try multiple selectors)
        let chatInput;
        const selectors = [
            'input[placeholder*="Ask"]',
            'textarea[placeholder*="Ask"]',
            '[data-testid="renata-chat-input"]',
            'input[type="text"]',
            'textarea'
        ];

        for (const selector of selectors) {
            try {
                chatInput = await page.$(selector);
                if (chatInput) {
                    console.log(`✅ Found chat input with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        if (!chatInput) {
            console.log('❌ Could not find chat input');
            // Let's see what's on the page
            const bodyText = await page.textContent('body');
            console.log('📄 Page content preview:', bodyText.substring(0, 500));

            // List all input elements
            const inputs = await page.$$eval('input, textarea', els =>
                els.map(el => ({
                    tag: el.tagName,
                    type: el.type,
                    placeholder: el.placeholder,
                    id: el.id,
                    className: el.className
                }))
            );
            console.log('📝 All inputs found:', JSON.stringify(inputs, null, 2));
            return;
        }

        // Test command: "Can you change the date range to this year?"
        const testCommand = "Can you change the date range to this year?";
        console.log(`🧪 Testing command: "${testCommand}"`);

        // Clear and type command
        await chatInput.click();
        await chatInput.fill('');
        await chatInput.type(testCommand);
        await page.waitForTimeout(500);

        // Submit (try Enter key)
        await chatInput.press('Enter');
        console.log('📤 Command sent');

        // Wait for processing
        console.log('⏳ Waiting for action processing...');
        await page.waitForTimeout(5000);

        // Take screenshot after command
        console.log('📸 Taking post-command screenshot...');
        await page.screenshot({ path: 'debug_post_command_state.png' });

        // Check if date range changed by looking at calendar button or selected state
        const dateRangeElement = await page.$('[data-testid="date-range-display"], .date-range, .calendar-button');
        if (dateRangeElement) {
            const dateText = await dateRangeElement.textContent();
            console.log(`📅 Date range display: "${dateText}"`);
        }

        // Try another command for comparison
        const testCommand2 = "set date range to ytd";
        console.log(`🧪 Testing second command: "${testCommand2}"`);

        await chatInput.click();
        await chatInput.fill('');
        await chatInput.type(testCommand2);
        await page.waitForTimeout(500);
        await chatInput.press('Enter');

        console.log('📤 Second command sent');
        await page.waitForTimeout(5000);

        // Final screenshot
        console.log('📸 Taking final state screenshot...');
        await page.screenshot({ path: 'debug_final_state.png' });

        console.log('✅ Manual testing completed');
        console.log('📊 Check the dev server logs for dashboard handler debug output');
        console.log('📋 Screenshots saved: debug_initial_state.png, debug_post_command_state.png, debug_final_state.png');

    } catch (error) {
        console.error('❌ Error during testing:', error);
        await page.screenshot({ path: 'debug_error_state.png' });
    } finally {
        await browser.close();
    }
}

testDashboardHandlerExecution().catch(console.error);