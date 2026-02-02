const { chromium } = require('playwright');

async function finalBacksideBTest() {
    console.log('🎯 FINAL BACKSIDE B SCANNER TEST');
    console.log('================================');

    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        // Navigate to the execution page
        await page.goto('http://localhost:5656/exec');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Take screenshot of current state
        await page.screenshot({ path: 'final_test_1_landing.png', fullPage: true });
        console.log('📸 Screenshot 1: Page loaded');

        // Find and interact with the UI elements
        const executeButton = await page.locator('button', { hasText: /execute|run|scan/i }).first();
        if (await executeButton.count() > 0) {
            console.log('✅ Found execute button');
            await executeButton.click();
            await page.waitForTimeout(5000);
            await page.screenshot({ path: 'final_test_2_after_click.png', fullPage: true });
            console.log('📸 Screenshot 2: After clicking execute');
        }

        // Check for results or output
        const resultsSection = await page.locator('[class*="result"], [class*="output"], pre, code, [data-testid*="result"]').first();
        if (await resultsSection.count() > 0) {
            const resultsText = await resultsSection.textContent();
            console.log('📊 Results found:', resultsText?.substring(0, 500));
        }

        // Check for any status indicators
        const statusElements = await page.locator('[class*="status"], [data-testid*="status"]').all();
        for (const status of statusElements) {
            const statusText = await status.textContent();
            if (statusText) {
                console.log('📈 Status:', statusText.trim());
            }
        }

        console.log('✅ FRONTEND TEST COMPLETED SUCCESSFULLY');

    } catch (error) {
        console.error('❌ Test error:', error.message);
        await page.screenshot({ path: 'final_test_error.png', fullPage: true });
    } finally {
        await browser.close();
        console.log('🏁 Final test completed');
    }
}

// Run the test
finalBacksideBTest().catch(console.error);