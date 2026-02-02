const { chromium } = require('playwright');

async function testSimpleCopilotActions() {
    console.log('🚀 TESTING SIMPLE COPILOT ACTIONS');

    const browser = await chromium.launch({
        headless: false,
        viewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();

    try {
        console.log('🌐 Navigating to dashboard...');
        await page.goto('http://localhost:6565/dashboard');
        await page.waitForTimeout(3000);

        console.log('🤖 Finding chat input...');
        const chatInput = await page.waitForSelector('textarea[placeholder*="Ask"]', { timeout: 10000 });

        // Test 1: Simple display mode change
        console.log('🧪 Test 1: "switch to dollar mode"');
        await chatInput.click();
        await chatInput.fill('switch to dollar mode');
        await chatInput.press('Enter');
        await page.waitForTimeout(3000);

        // Test 2: Another display mode change
        console.log('🧪 Test 2: "show in R multiples"');
        await chatInput.click();
        await chatInput.fill('show in R multiples');
        await chatInput.press('Enter');
        await page.waitForTimeout(3000);

        // Test 3: Simple navigation
        console.log('🧪 Test 3: "go to trades page"');
        await chatInput.click();
        await chatInput.fill('go to trades page');
        await chatInput.press('Enter');
        await page.waitForTimeout(3000);

        // Test 4: Simple date range (this might work differently)
        console.log('🧪 Test 4: "show last month"');
        await chatInput.click();
        await chatInput.fill('show last month');
        await chatInput.press('Enter');
        await page.waitForTimeout(3000);

        console.log('✅ All tests completed');
        console.log('📊 Check dev server logs for any handler execution');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await browser.close();
    }
}

testSimpleCopilotActions().catch(console.error);