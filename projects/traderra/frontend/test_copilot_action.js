const { chromium } = require('playwright');

async function testCopilotAction() {
    console.log('🚀 TESTING BASIC COPILOT ACTION EXECUTION');

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

        // Test simple test action
        console.log('🧪 Testing: "run test action"');
        await chatInput.click();
        await chatInput.fill('run test action');
        await chatInput.press('Enter');
        await page.waitForTimeout(3000);

        // Test with different phrasing
        console.log('🧪 Testing: "execute testAction"');
        await chatInput.click();
        await chatInput.fill('execute testAction');
        await chatInput.press('Enter');
        await page.waitForTimeout(3000);

        // Test with direct action name
        console.log('🧪 Testing: "testAction"');
        await chatInput.click();
        await chatInput.fill('testAction');
        await chatInput.press('Enter');
        await page.waitForTimeout(3000);

        console.log('✅ Test completed - check logs for action execution');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await browser.close();
    }
}

testCopilotAction().catch(console.error);