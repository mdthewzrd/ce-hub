const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function exploreFrontendInterface() {
    console.log('🔍 Exploring Frontend Scanner Interface');
    console.log('==========================================');

    // Launch browser
    const browser = await chromium.launch({
        headless: false,
        slowMo: 800
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    try {
        // Step 1: Navigate to Edge Dev frontend
        console.log('📱 Navigating to http://localhost:5656...');
        await page.goto('http://localhost:5656', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        await page.waitForTimeout(5000);
        console.log('✅ Frontend loaded');

        // Step 2: Explore the interface
        console.log('🔍 Exploring available elements...');

        // Look for any clickable elements related to scanning
        const scanButtons = await page.locator('button, a, [role="button"]').all();
        console.log(`Found ${scanButtons.length} clickable elements`);

        for (let i = 0; i < Math.min(scanButtons.length, 10); i++) {
            try {
                const button = scanButtons[i];
                const isVisible = await button.isVisible();
                const text = await button.textContent();
                console.log(`  Button ${i}: "${text?.trim()}" (visible: ${isVisible})`);
            } catch (e) {
                // Continue
            }
        }

        // Look for file inputs
        const fileInputs = await page.locator('input[type="file"]').all();
        console.log(`Found ${fileInputs.length} file inputs`);

        for (let i = 0; i < fileInputs.length; i++) {
            try {
                const input = fileInputs[i];
                const isVisible = await input.isVisible();
                console.log(`  File Input ${i}: visible: ${isVisible}`);
            } catch (e) {
                // Continue
            }
        }

        // Look for sections or areas that might contain scanner functionality
        const scanSections = await page.locator('[class*="scanner"], [class*="scan"], [class*="upload"], [class*="pattern"], [class*="execute"]').all();
        console.log(`Found ${scanSections.length} scanner-related sections`);

        for (let i = 0; i < Math.min(scanSections.length, 5); i++) {
            try {
                const section = scanSections[i];
                const isVisible = await section.isVisible();
                console.log(`  Scanner Section ${i}: visible: ${isVisible}`);
            } catch (e) {
                // Continue
            }
        }

        // Step 3: Try different navigation approaches
        console.log('🔍 Trying different navigation approaches...');

        // Check for any dropdowns or menus
        const dropdowns = await page.locator('select, [role="combobox"]').all();
        console.log(`Found ${dropdowns.length} dropdown elements`);

        // Check for any modal or popup triggers
        const modals = await page.locator('[class*="modal"], [class*="popup"], button[onclick]').all();
        console.log(`Found ${modals.length} modal/popup elements`);

        // Look for any text that might indicate scanner functionality
        const allText = await page.textContent();
        const scannerKeywords = ['upload', 'scanner', 'scan', 'execute', 'run', 'pattern', 'code', 'analyze'];
        const foundKeywords = [];

        for (const keyword of scannerKeywords) {
            if (allText.toLowerCase().includes(keyword)) {
                foundKeywords.push(keyword);
            }
        }

        console.log('Found keywords:', foundKeywords);

        // Step 4: Take comprehensive screenshot
        await page.screenshot({
            path: 'explore_interface_comprehensive.png',
            fullPage: true
        });
        console.log('📸 Comprehensive interface screenshot saved');

        console.log('✅ Frontend exploration completed');

    } catch (error) {
        console.error('❌ Exploration failed:', error.message);

        await page.screenshot({
            path: 'explore_interface_error.png',
            fullPage: true
        });
        console.log('📸 Error screenshot saved');

    } finally {
        await browser.close();
        console.log('🏁 Browser closed');
    }
}

// Run the exploration
exploreFrontendInterface().catch(console.error);