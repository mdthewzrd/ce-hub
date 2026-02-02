const { chromium } = require('playwright');

/**
 * 🔥 TRADERRA ACTION BRIDGE VALIDATION TEST
 * Test the new TraderraActionBridge integration for calendar functionality
 */

async function validateActionBridge() {
    console.log('🔥 BRIDGE VALIDATION: Starting TraderraActionBridge test');

    const browser = await chromium.launch({
        headless: false,
        viewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();

    try {
        // Navigate to dashboard
        console.log('🌐 Navigating to Traderra dashboard...');
        await page.goto('http://localhost:6565/dashboard');
        await page.waitForTimeout(5000); // Give more time for loading

        // Take a screenshot to see current state
        await page.screenshot({ path: 'bridge_test_initial.png' });
        console.log('📸 Initial screenshot taken');

        // Check if Renata chat interface is present
        console.log('🤖 Looking for Renata chat interface...');

        // Try multiple possible selectors
        const chatSelectors = [
            'textarea[placeholder*="Ask"]',
            'textarea[placeholder*="ask"]',
            'input[placeholder*="Ask"]',
            'input[placeholder*="ask"]',
            '[data-testid="chat-input"]',
            '.chat-input',
            'textarea'
        ];

        let chatInput = null;
        for (const selector of chatSelectors) {
            try {
                console.log(`   Trying selector: ${selector}`);
                chatInput = await page.waitForSelector(selector, { timeout: 2000 });
                if (chatInput) {
                    console.log(`✅ Found chat input with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                console.log(`   ❌ Selector failed: ${selector}`);
            }
        }

        if (!chatInput) {
            console.log('❌ Chat interface not found, checking page content...');
            const pageContent = await page.content();
            console.log('Page title:', await page.title());

            // Look for any inputs on the page
            const allInputs = await page.$$('input, textarea');
            console.log(`Found ${allInputs.length} input/textarea elements on page`);

            if (allInputs.length > 0) {
                // Use the last input found
                chatInput = allInputs[allInputs.length - 1];
                console.log('Using last found input element');
            } else {
                throw new Error('No chat input found on page');
            }
        }

        // Test a specific calendar command that was failing before
        const testCommand = "Can you change the date range to year to date?";
        console.log(`\n🧪 Testing command: "${testCommand}"`);

        // Click and enter command
        await chatInput.click();
        await chatInput.fill('');
        await chatInput.type(testCommand);
        await page.waitForTimeout(500);

        console.log('📤 Sending command...');
        await chatInput.press('Enter');

        // Wait for processing and potential state changes
        console.log('⏳ Waiting for response and state changes...');
        await page.waitForTimeout(8000); // Longer wait for processing

        // Take screenshot after command
        await page.screenshot({ path: 'bridge_test_after_command.png' });
        console.log('📸 After command screenshot taken');

        // Check browser console for our bridge logs
        const logs = [];
        page.on('console', msg => {
            if (msg.text().includes('BRIDGE') || msg.text().includes('ACTION')) {
                logs.push(msg.text());
                console.log('🔥 BRIDGE LOG:', msg.text());
            }
        });

        // Wait a bit more for any delayed logs
        await page.waitForTimeout(3000);

        // Check for calendar button changes
        console.log('📅 Checking for calendar button changes...');
        try {
            const calendarButtons = await page.$$('[data-testid*="date"], .date-range, .calendar');
            if (calendarButtons.length > 0) {
                for (let i = 0; i < calendarButtons.length; i++) {
                    const buttonText = await calendarButtons[i].textContent();
                    console.log(`   Calendar element ${i}: "${buttonText}"`);
                }
            } else {
                console.log('   No calendar elements found with standard selectors');
            }
        } catch (error) {
            console.log('   Error checking calendar buttons:', error.message);
        }

        console.log('\n🔍 BRIDGE VALIDATION RESULTS:');
        console.log('==============================');
        console.log('✅ Page loaded successfully');
        console.log('✅ Chat interface found');
        console.log('✅ Command sent successfully');
        console.log(`📝 Console logs captured: ${logs.length}`);

        if (logs.some(log => log.includes('BRIDGE') && log.includes('action'))) {
            console.log('🎉 SUCCESS: TraderraActionBridge is active and processing commands!');
            return true;
        } else {
            console.log('⚠️ PARTIAL: Command sent but no bridge activity detected');
            return false;
        }

    } catch (error) {
        console.error('❌ Test error:', error.message);
        await page.screenshot({ path: 'bridge_test_error.png' });
        return false;
    } finally {
        await browser.close();
    }
}

// Run the validation
validateActionBridge()
    .then(success => {
        if (success) {
            console.log('\n🎊 VALIDATION SUCCESSFUL: TraderraActionBridge is working!');
        } else {
            console.log('\n🔧 VALIDATION INCOMPLETE: Bridge may need additional debugging');
        }
    })
    .catch(error => {
        console.error('\n💥 Validation failed:', error);
        process.exit(1);
    });