#!/usr/bin/env node

const puppeteer = require('puppeteer-core');

const FRONTEND_URL = 'http://localhost:5656/';
const BROWSER_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function debugRenataState() {
    console.log('🔍 Debugging Renata Modal State Issue...\n');

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
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
        page.on('console', msg => console.log(`📄 Console: ${msg.text()}`));

        console.log(`📍 Navigating to ${FRONTEND_URL}...`);
        await page.goto(FRONTEND_URL, {
            waitUntil: ['networkidle2', 'domcontentloaded'],
            timeout: 30000
        });

        // Wait for page to be ready
        await page.waitForSelector('body', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Find and click Renata button
        console.log('\n🔍 Looking for Renata button...');

        const buttonFound = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const renataBtn = buttons.find(btn =>
                btn.textContent && btn.textContent.toLowerCase().includes('renata')
            );
            return !!renataBtn;
        });

        if (!buttonFound) {
            console.log('❌ Renata button not found');
            return false;
        }

        console.log('✅ Renata button found, clicking...');

        // Click the button and monitor state changes
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const renataBtn = buttons.find(btn =>
                btn.textContent && btn.textContent.toLowerCase().includes('renata')
            );

            if (renataBtn) {
                console.log('🖱️ Clicking Renata button...');
                renataBtn.click();
            }
        });

        // Wait a moment for state to update
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check for modal visibility
        const modalState = await page.evaluate(() => {
            // Check for any modal-like elements
            const modals = document.querySelectorAll('[class*="modal"], [class*="popup"], [class*="overlay"]');
            const visibleModals = Array.from(modals).filter(modal => {
                const style = window.getComputedStyle(modal);
                return style.display !== 'none' &&
                       style.visibility !== 'hidden' &&
                       parseFloat(style.opacity) > 0;
            });

            // Check for fixed positioned elements that might be modals
            const fixedElements = document.querySelectorAll('*');
            const potentialModals = Array.from(fixedElements).filter(el => {
                const style = window.getComputedStyle(el);
                return style.position === 'fixed' &&
                       style.zIndex > 10 &&
                       style.display !== 'none';
            });

            // Check React DevTools for any state information
            const hasReact = !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

            return {
                totalModals: modals.length,
                visibleModals: visibleModals.length,
                potentialModals: potentialModals.length,
                hasReactDevTools: hasReact,
                modalDetails: visibleModals.map(modal => ({
                    tagName: modal.tagName,
                    className: modal.className,
                    display: window.getComputedStyle(modal).display,
                    visibility: window.getComputedStyle(modal).visibility,
                    opacity: window.getComputedStyle(modal).opacity,
                    zIndex: window.getComputedStyle(modal).zIndex,
                    innerHTML: modal.innerHTML.substring(0, 200)
                })),
                potentialModalDetails: potentialModals.slice(0, 5).map(modal => ({
                    tagName: modal.tagName,
                    className: modal.className,
                    zIndex: window.getComputedStyle(modal).zIndex,
                    innerHTML: modal.innerHTML.substring(0, 100)
                }))
            };
        });

        console.log('\n📊 Modal state after click:');
        console.log(`  Total modals: ${modalState.totalModals}`);
        console.log(`  Visible modals: ${modalState.visibleModals}`);
        console.log(`  Potential modals: ${modalState.potentialModals}`);
        console.log(`  React DevTools available: ${modalState.hasReactDevTools}`);

        if (modalState.modalDetails.length > 0) {
            console.log('\n🎉 Visible modal details:');
            modalState.modalDetails.forEach((modal, i) => {
                console.log(`  Modal ${i + 1}: ${modal.tagName} - ${modal.className}`);
            });
        }

        if (modalState.potentialModalDetails.length > 0) {
            console.log('\n🔍 Potential modal elements:');
            modalState.potentialModalDetails.forEach((modal, i) => {
                console.log(`  ${modal.tagName} - z-index: ${modal.zIndex} - ${modal.className}`);
            });
        }

        // Try to find the specific RenataModal by looking for its content
        const renataModalFound = await page.evaluate(() => {
            // Look for elements with "Renata" text content
            const allElements = document.querySelectorAll('*');
            const renataElements = Array.from(allElements).filter(el => {
                const text = el.textContent || '';
                return text.includes('Renata AI') || text.includes('trading assistant') || text.includes('AI trading');
            });

            return {
                count: renataElements.length,
                elements: renataElements.slice(0, 3).map(el => ({
                    tagName: el.tagName,
                    className: el.className,
                    display: window.getComputedStyle(el).display,
                    visibility: window.getComputedStyle(el).visibility,
                    opacity: window.getComputedStyle(el).opacity,
                    zIndex: window.getComputedStyle(el).zIndex,
                    text: el.textContent.substring(0, 100)
                }))
            };
        });

        if (renataModalFound.count > 0) {
            console.log('\n🎯 Found elements containing "Renata":');
            renataModalFound.elements.forEach((el, i) => {
                console.log(`  ${i + 1}: ${el.tagName} - "${el.text.substring(0, 50)}" - Visible: ${el.display !== 'none'}`);
            });
        }

        // Take screenshot
        await page.screenshot({ path: './renata-state-debug.png', fullPage: true });

        const success = modalState.visibleModals > 0 || renataModalFound.count > 0;

        if (success) {
            console.log('\n✅ SUCCESS: Renata modal appears to be working!');
        } else {
            console.log('\n❌ ISSUE: No visible Renata modal detected after button click');
            console.log('💾 Screenshot saved: renata-state-debug.png');
        }

        await new Promise(resolve => setTimeout(resolve, 3000));

        return success;

    } catch (error) {
        console.error('\n❌ Debug failed:', error.message);
        return false;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

debugRenataState()
    .then(success => {
        if (success) {
            console.log('\n🎉 Renata modal state check PASSED!');
        } else {
            console.log('\n💥 Renata modal state check FAILED!');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    });