const { chromium } = require('playwright');

async function takeScreenshot() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    try {
        console.log('📸 Taking screenshot of frontend...');

        // Navigate to frontend
        await page.goto('http://localhost:5656', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Wait for page to load
        await page.waitForTimeout(5000);

        // Take screenshot
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const screenshotPath = `frontend_dashboard_${timestamp}.png`;

        await page.screenshot({
            path: screenshotPath,
            fullPage: true
        });

        console.log(`✅ Screenshot saved: ${screenshotPath}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
        console.log('🏁 Browser closed');
    }
}

takeScreenshot().catch(console.error);