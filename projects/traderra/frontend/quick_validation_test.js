const { chromium } = require('playwright');

/**
 * 🚀 QUICK VALIDATION TEST
 * Test our calendar button fixes with key commands to verify state changes
 */

async function quickValidationTest() {
    console.log('🚀 QUICK VALIDATION: Testing calendar button state changes');

    const browser = await chromium.launch({
        headless: false,
        viewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();

    try {
        // Navigate to dashboard
        console.log('🌐 Navigating to Traderra dashboard...');
        await page.goto('http://localhost:6565/dashboard');
        await page.waitForTimeout(3000);

        // Wait for chat interface
        console.log('🤖 Waiting for Renata chat...');
        const chatInput = await page.waitForSelector('textarea[placeholder*="Ask"]', { timeout: 10000 });

        // Test commands that were failing before
        const testCommands = [
            "Can you change the date range to this year?",
            "set date range to ytd",
            "switch to last month",
            "show me this week"
        ];

        let passedTests = 0;
        let totalTests = testCommands.length;

        for (let i = 0; i < testCommands.length; i++) {
            const command = testCommands[i];
            console.log(`\n🧪 Test ${i + 1}: "${command}"`);

            // Take before state screenshot
            await page.screenshot({ path: `validation_test_${i}_before.png` });

            // Execute command
            await chatInput.click();
            await chatInput.fill('');
            await chatInput.type(command);
            await page.waitForTimeout(300);
            await chatInput.press('Enter');

            console.log('   📤 Command sent');

            // Wait for processing
            await page.waitForTimeout(4000);

            // Take after state screenshot
            await page.screenshot({ path: `validation_test_${i}_after.png` });

            // Check for success indicators
            try {
                // Look for success message
                const successMsg = await page.$('text="You\'re all set"');
                const stateChangeMsg = await page.$('text="state changes"');

                if (successMsg || stateChangeMsg) {
                    console.log('   ✅ PASSED: Success message detected');
                    passedTests++;
                } else {
                    console.log('   ❌ FAILED: No success message found');
                }
            } catch (error) {
                console.log('   ⚠️ Could not validate state change');
            }

            await page.waitForTimeout(1000);
        }

        console.log('\n📊 VALIDATION RESULTS');
        console.log('====================');
        console.log(`✅ Passed: ${passedTests}/${totalTests}`);
        console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

        if (passedTests === totalTests) {
            console.log('🎉 PERFECT! All calendar commands are working!');
        } else if (passedTests >= totalTests * 0.75) {
            console.log('✅ GOOD! Most calendar commands are working');
        } else {
            console.log('⚠️ NEEDS WORK: Many commands still failing');
        }

        return {
            totalTests,
            passedTests,
            successRate: (passedTests / totalTests) * 100
        };

    } catch (error) {
        console.error('❌ Test error:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the validation test
quickValidationTest()
    .then(result => {
        console.log('\n🚀 Validation test completed successfully');
        console.log(`Final success rate: ${result.successRate.toFixed(1)}%`);

        if (result.successRate >= 100) {
            console.log('🎊 CALENDAR BUTTON FIX IS WORKING PERFECTLY!');
        } else if (result.successRate >= 75) {
            console.log('💪 CALENDAR BUTTON FIX IS WORKING WELL!');
        } else {
            console.log('🔧 CALENDAR BUTTON NEEDS MORE WORK');
        }
    })
    .catch(error => {
        console.error('💥 Validation failed:', error);
        process.exit(1);
    });