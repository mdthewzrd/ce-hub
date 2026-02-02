const { chromium } = require('playwright');

async function simpleProjectTest() {
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000
    });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    try {
        console.log('🧪 Simple Project Management Test');
        console.log('==================================');

        // Navigate to main dashboard first
        console.log('📍 Navigating to main dashboard...');
        await page.goto('http://localhost:5656', {
            timeout: 15000
        });

        await page.waitForTimeout(2000);

        // Click the Manage Projects button we added
        console.log('🖱️ Looking for Manage Projects button...');
        const manageButton = page.locator('text="Manage Projects"').first();

        if (await manageButton.isVisible()) {
            console.log('✅ Found Manage Projects button');
            await manageButton.click();
            console.log('✅ Clicked Manage Projects button');

            // Wait for navigation
            await page.waitForTimeout(3000);

            // Check current URL
            const currentUrl = page.url();
            console.log(`📍 Current URL: ${currentUrl}`);

            if (currentUrl.includes('/projects')) {
                console.log('✅ Successfully navigated to projects page');

                // Wait a bit more for content to load
                await page.waitForTimeout(2000);

                // Take screenshot
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                await page.screenshot({
                    path: `projects_page_simple_${timestamp}.png`,
                    fullPage: true
                });
                console.log(`📸 Screenshot saved: projects_page_simple_${timestamp}.png`);

                // Look for ANY elements that might be delete buttons
                console.log('🔍 Looking for delete-related elements...');

                // Check for trash icons
                const trashIcons = await page.locator('svg').filter({ hasText: '' }).count();
                console.log(`Found ${trashIcons} total SVG icons`);

                // Check for buttons
                const allButtons = await page.locator('button').count();
                console.log(`Found ${allButtons} total buttons`);

                // Check for project cards
                const projectCards = await page.locator('.bg-gray-800').count();
                console.log(`Found ${projectCards} gray cards (potential project cards)`);

                // Look specifically for any element with "delete" or "trash" in attributes/classes
                const deleteElements = await page.locator('[class*="delete"], [class*="trash"], [title*="delete"], [title*="remove"]').count();
                console.log(`Found ${deleteElements} elements with delete-related classes/titles`);

            } else {
                console.log('❌ Failed to navigate to projects page');
            }

        } else {
            console.log('❌ Manage Projects button not found');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
        console.log('🏁 Browser closed');
    }
}

simpleProjectTest().catch(console.error);