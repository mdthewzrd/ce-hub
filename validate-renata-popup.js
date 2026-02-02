#!/usr/bin/env node

const puppeteer = require('puppeteer-core');

// Configuration
const FRONTEND_URL = 'http://localhost:5656/';
const BROWSER_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function validateRenataPopup() {
    console.log('🧪 Validating Renata Popup functionality...\n');

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false, // Show browser so we can see what's happening
            executablePath: BROWSER_PATH,
            defaultViewport: null,
            args: [
                '--start-maximized',
                '--no-sandbox',
                '--disable-web-security'
            ]
        });

        const page = await browser.newPage();

        // Enable debugging
        page.on('console', msg => console.log(`📄 Page console: ${msg.text()}`));
        page.on('request', request => {
            if (request.url().includes('localhost')) {
                console.log(`🌐 Request: ${request.url()}`);
            }
        });

        console.log(`📍 Navigating to ${FRONTEND_URL}...`);
        await page.goto(FRONTEND_URL, {
            waitUntil: ['networkidle2', 'domcontentloaded'],
            timeout: 30000
        });

        // Wait for page to be ready
        await page.waitForSelector('body', { timeout: 10000 });

        console.log('\n🔍 Looking for Renata button...');

        // Find the Renata button
        const renataButton = await page.evaluate(() => {
            // Look for button with "Renata" text
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(btn =>
                btn.textContent && btn.textContent.toLowerCase().includes('renata')
            );
        });

        if (!renataButton) {
            console.log('❌ Renata button not found');
            return false;
        }

        console.log('✅ Renata button found');

        // Check if popup exists but is hidden
        const popupExists = await page.evaluate(() => {
            const modals = document.querySelectorAll('[class*="modal"], [class*="popup"], [class*="overlay"]');
            const chatComponents = document.querySelectorAll('[class*="chat"], [class*="renata"]');
            return {
                modals: modals.length,
                chatComponents: chatComponents.length
            };
        });

        console.log(`📊 Found ${popupExists.modals} modals and ${popupExists.chatComponents} chat components`);

        // Take screenshot before clicking
        console.log('\n📸 Taking screenshot BEFORE clicking Renata button...');
        await page.screenshot({
            path: './renata-before-click.png',
            fullPage: true
        });

        console.log('\n🖱️  Clicking Renata button...');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const renataBtn = buttons.find(btn =>
                btn.textContent && btn.textContent.toLowerCase().includes('renata')
            );
            if (renataBtn) {
                renataBtn.click();
                console.log('✅ Renata button clicked programmatically');
                return true;
            }
            return false;
        });

        // Wait a moment for any animations
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check for popup visibility
        const popupState = await page.evaluate(() => {
            const modals = document.querySelectorAll('[class*="modal"], [class*="popup"], [class*="overlay"]');
            const visibleModals = Array.from(modals).filter(modal => {
                const style = window.getComputedStyle(modal);
                return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
            });

            // Check for any elements with isOpen or similar state
            const allElements = document.querySelectorAll('*');
            const popupElements = Array.from(allElements).filter(el => {
                const style = window.getComputedStyle(el);
                return style.position === 'fixed' &&
                       (style.zIndex > 10) &&
                       (style.display !== 'none');
            });

            return {
                totalModals: modals.length,
                visibleModals: visibleModals.length,
                potentialPopups: popupElements.length,
                modalDetails: visibleModals.map(modal => ({
                    tagName: modal.tagName,
                    className: modal.className,
                    display: window.getComputedStyle(modal).display,
                    visibility: window.getComputedStyle(modal).visibility,
                    opacity: window.getComputedStyle(modal).opacity,
                    zIndex: window.getComputedStyle(modal).zIndex
                }))
            };
        });

        console.log('\n📊 Popup state after click:');
        console.log(`  Total modals: ${popupState.totalModals}`);
        console.log(`  Visible modals: ${popupState.visibleModals}`);
        console.log(`  Potential popups: ${popupState.potentialPopups}`);

        if (popupState.modalDetails.length > 0) {
            console.log('\n📋 Modal details:');
            popupState.modalDetails.forEach((modal, i) => {
                console.log(`  Modal ${i + 1}:`);
                console.log(`    Tag: ${modal.tagName}`);
                console.log(`    Class: ${modal.className}`);
                console.log(`    Display: ${modal.display}`);
                console.log(`    Visibility: ${modal.visibility}`);
                console.log(`    Opacity: ${modal.opacity}`);
                console.log(`    Z-index: ${modal.zIndex}`);
            });
        }

        // Take screenshot after clicking
        console.log('\n📸 Taking screenshot AFTER clicking Renata button...');
        await page.screenshot({
            path: './renata-after-click.png',
            fullPage: true
        });

        // Check React state
        const reactState = await page.evaluate(() => {
            // Try to access React DevTools or check for React state
            const hasReact = !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
            return { hasReact };
        });

        console.log(`\n⚛️  React DevTools available: ${reactState.hasReact}`);

        const success = popupState.visibleModals > 0;

        if (success) {
            console.log('\n✅ SUCCESS: Renata popup is working!');
            console.log('💾 Screenshots saved: renata-before-click.png, renata-after-click.png');
        } else {
            console.log('\n❌ FAILED: Renata popup did not appear');
            console.log('💾 Screenshots saved for debugging: renata-before-click.png, renata-after-click.png');
        }

        await new Promise(resolve => setTimeout(resolve, 3000));

        return success;

    } catch (error) {
        console.error('\n❌ Validation failed:', error.message);
        return false;
    } finally {
        if (browser) {
            console.log('\n🔄 Keeping browser open for 5 seconds for inspection...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            await browser.close();
        }
    }
}

// Run the test
validateRenataPopup()
    .then(success => {
        if (success) {
            console.log('\n🎉 Renata popup validation PASSED!');
        } else {
            console.log('\n💥 Renata popup validation FAILED!');
            console.log('   Check the screenshots for debugging information.');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    });