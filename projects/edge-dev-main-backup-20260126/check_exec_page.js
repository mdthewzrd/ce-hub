const { chromium } = require('playwright');

async function checkExecPage() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    try {
        console.log('📸 Taking screenshot of exec page...');

        // Navigate to exec page
        await page.goto('http://localhost:5656/exec', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Wait for page to load
        await page.waitForTimeout(5000);

        // Take screenshot
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const screenshotPath = `exec_dashboard_${timestamp}.png`;

        await page.screenshot({
            path: screenshotPath,
            fullPage: true
        });

        console.log(`✅ Screenshot saved: ${screenshotPath}`);

        // Check if there are any projects loaded
        const projectsText = await page.textContent();
        if (projectsText.includes('Enhanced Backside B Scanner')) {
            console.log('✅ Found our project in the exec page!');
        } else {
            console.log('❌ Project not found in exec page');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
        console.log('🏁 Browser closed');
    }
}

checkExecPage().catch(console.error);