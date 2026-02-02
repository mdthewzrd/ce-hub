#!/usr/bin/env node

const puppeteer = require('puppeteer-core');

const FRONTEND_URL = 'http://localhost:5656/';
const BROWSER_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function debugRenataButton() {
    console.log('🔍 Debugging Renata Button Issue...\n');

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false, // Show browser
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
            timeout: 45000
        });

        // Wait for everything to load
        await page.waitForSelector('body', { timeout: 10000 });

        console.log('\n⏳ Waiting 5 seconds for complete page load...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check all buttons on page
        console.log('\n🔍 Searching for ALL buttons on page...');
        const allButtons = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.map((btn, index) => ({
                index,
                text: btn.textContent?.trim() || '',
                innerHTML: btn.innerHTML.substring(0, 200),
                className: btn.className,
                visible: btn.offsetParent !== null,
                styles: {
                    display: getComputedStyle(btn).display,
                    visibility: getComputedStyle(btn).visibility,
                    opacity: getComputedStyle(btn).opacity
                }
            }));
        });

        console.log(`📊 Found ${allButtons.length} buttons:`);
        allButtons.forEach(btn => {
            console.log(`  ${btn.index}: "${btn.text}" | Visible: ${btn.visible} | Display: ${btn.styles.display}`);
            if (btn.text.toLowerCase().includes('renata')) {
                console.log(`    🎯 RENATA BUTTON FOUND!`);
                console.log(`    Class: ${btn.className}`);
            }
        });

        // Check specifically for Renata
        const renataButtons = allButtons.filter(btn =>
            btn.text.toLowerCase().includes('renata')
        );

        if (renataButtons.length === 0) {
            console.log('\n❌ No Renata buttons found. Let me check the HTML structure...');

            // Look for divs or other elements that might contain Renata
            const allElements = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('*'));
                return elements.map(el => {
                    const text = el.textContent?.trim() || '';
                    if (text.toLowerCase().includes('renata') || el.className.toLowerCase().includes('renata')) {
                        return {
                            tagName: el.tagName,
                            className: el.className,
                            text: text.substring(0, 100),
                            innerHTML: el.innerHTML.substring(0, 200),
                            visible: el.offsetParent !== null
                        };
                    }
                    return null;
                }).filter(Boolean);
            });

            if (allElements.length > 0) {
                console.log('\n🎯 Found elements containing "Renata":');
                allElements.forEach(el => {
                    console.log(`  ${el.tagName} - Class: ${el.className} - Text: "${el.text.substring(0, 50)}" - Visible: ${el.visible}`);
                });
            } else {
                console.log('\n❌ No elements containing "Renata" found at all.');
            }
        } else {
            console.log('\n✅ Found Renata buttons!');

            // Try to click the first Renata button
            const firstRenata = renataButtons[0];
            console.log(`\n🖱️  Attempting to click: "${firstRenata.text}"`);

            // Take screenshot before click
            await page.screenshot({ path: './before-renata-click.png', fullPage: true });

            // Click the button
            await page.evaluate((index) => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const renataBtn = buttons.find(btn =>
                    btn.textContent?.trim().toLowerCase().includes('renata')
                );
                if (renataBtn) {
                    console.log('✅ Clicking Renata button');
                    renataBtn.click();
                    return true;
                }
                return false;
            }, firstRenata.index);

            // Wait for popup
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Check for popup/modal
            const popupsAfter = await page.evaluate(() => {
                const modals = document.querySelectorAll('[class*="modal"], [class*="popup"], [class*="overlay"]');
                const visibleModals = Array.from(modals).filter(modal => {
                    const style = window.getComputedStyle(modal);
                    return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0;
                });

                return {
                    total: modals.length,
                    visible: visibleModals.length,
                    details: visibleModals.map(modal => ({
                        tagName: modal.tagName,
                        className: modal.className,
                        text: modal.textContent?.substring(0, 100),
                        styles: {
                            display: getComputedStyle(modal).display,
                            position: getComputedStyle(modal).position,
                            zIndex: getComputedStyle(modal).zIndex,
                            opacity: getComputedStyle(modal).opacity
                        }
                    }))
                };
            });

            console.log('\n📊 Popup state after click:');
            console.log(`  Total modals: ${popupsAfter.total}`);
            console.log(`  Visible modals: ${popupsAfter.visible}`);

            if (popupsAfter.details.length > 0) {
                console.log('\n🎉 Popup details:');
                popupsAfter.details.forEach((popup, i) => {
                    console.log(`  ${i + 1}: ${popup.tagName} - "${popup.text}"`);
                });
            }

            // Take screenshot after click
            await page.screenshot({ path: './after-renata-click.png', fullPage: true });

            console.log('\n📸 Screenshots saved: before-renata-click.png, after-renata-click.png');

            const success = popupsAfter.visible > 0;
            if (success) {
                console.log('\n✅ SUCCESS: Renata popup is working!');
            } else {
                console.log('\n❌ FAILED: No popup appeared after clicking Renata button');
            }
        }

        await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
        console.error('\n❌ Debug failed:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

debugRenataButton();