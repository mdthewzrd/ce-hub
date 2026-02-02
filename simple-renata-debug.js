#!/usr/bin/env node

const puppeteer = require('puppeteer-core');

const FRONTEND_URL = 'http://localhost:5656/';
const BROWSER_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function simpleRenataDebug() {
    console.log('🔍 SIMPLE DEBUG: Renata popup visibility issue...\n');

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false, // Show browser so we can see what's happening
            executablePath: BROWSER_PATH,
            defaultViewport: null,
            args: [
                '--start-maximized',
                '--no-sandbox',
                '--disable-web-security',
                '--force-device-scale-factor=1'
            ]
        });

        const page = await browser.newPage();

        // Enable console logging from the page
        page.on('console', msg => console.log(`📄 PAGE: ${msg.text()}`));

        console.log(`📍 Navigating to ${FRONTEND_URL}...`);
        await page.goto(FRONTEND_URL, {
            waitUntil: ['networkidle2', 'domcontentloaded'],
            timeout: 30000
        });

        await page.waitForSelector('body', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('\n🔍 STEP 1: Find and click Renata button...');

        // Find and click Renata button
        const buttonClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const renataBtn = buttons.find(btn =>
                btn.textContent && btn.textContent.toLowerCase().includes('renata')
            );

            if (renataBtn) {
                console.log('✅ Found Renata button:', renataBtn.textContent.trim());
                renataBtn.click();
                return true;
            }
            return false;
        });

        if (!buttonClicked) {
            console.log('❌ Renata button not found');
            return false;
        }

        // Wait for popup to appear
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('\n🔍 STEP 2: Take screenshot after clicking...');
        await page.screenshot({
            path: './simple-after-click.png',
            fullPage: true
        });

        console.log('\n🔍 STEP 3: Look for ANY popup elements...');

        // Simple popup detection
        const popupResults = await page.evaluate(() => {
            const results = [];
            const allElements = document.querySelectorAll('*');

            allElements.forEach(el => {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                const text = el.textContent || '';

                // Simple check for any visible element that might be a popup
                const isVisible = style.display !== 'none' &&
                                style.visibility !== 'hidden' &&
                                parseFloat(style.opacity) > 0 &&
                                rect.width > 50 &&
                                rect.height > 50;

                const isPopup = (style.position === 'fixed' || style.position === 'absolute') &&
                               (parseInt(style.zIndex) > 10 || text.includes('Renata') || text.includes('AI'));

                if (isVisible && isPopup) {
                    results.push({
                        tagName: el.tagName,
                        className: el.className || '',
                        text: text.substring(0, 100),
                        rect: {
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height
                        },
                        zIndex: style.zIndex,
                        backgroundColor: style.backgroundColor,
                        color: style.color
                    });
                }
            });

            return results;
        });

        console.log('\n📊 Popup detection results:');
        console.log(`Found ${popupResults.length} potential popup elements:`);

        if (popupResults.length === 0) {
            console.log('❌ No popup elements detected');
        } else {
            popupResults.forEach((popup, i) => {
                console.log(`\n  Popup ${i + 1}:`);
                console.log(`    Tag: ${popup.tagName}`);
                console.log(`    Position: ${popup.rect.left}x${popup.rect.top} (${popup.rect.width}x${popup.rect.height})`);
                console.log(`    Z-index: ${popup.zIndex}`);
                console.log(`    Background: ${popup.backgroundColor}`);
                console.log(`    Text: "${popup.text.substring(0, 50)}..."`);
            });
        }

        console.log('\n🔍 STEP 4: Look specifically for StandaloneRenataChat component...');

        // Look for the specific component
        const specificComponent = await page.evaluate(() => {
            // Look for elements with characteristics of our StandaloneRenataChat
            const allElements = document.querySelectorAll('*');

            for (let el of allElements) {
                const style = window.getComputedStyle(el);
                const text = el.textContent || '';
                const className = el.className || '';

                // Check if this is our StandaloneRenataChat component
                if (text.includes('Renata AI') &&
                    text.includes('Live') &&
                    (className.includes('fixed') || style.position === 'fixed') &&
                    text.includes('Hello! I\'m Renata')) {

                    const rect = el.getBoundingClientRect();
                    return {
                        found: true,
                        tagName: el.tagName,
                        className: className,
                        text: text.substring(0, 200),
                        rect: {
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height
                        },
                        style: {
                            position: style.position,
                            display: style.display,
                            visibility: style.visibility,
                            opacity: style.opacity,
                            zIndex: style.zIndex,
                            backgroundColor: style.backgroundColor
                        }
                    };
                }
            }

            return { found: false };
        });

        if (specificComponent.found) {
            console.log('\n✅ FOUND StandaloneRenataChat component!');
            console.log(`  Position: ${specificComponent.rect.left}x${specificComponent.rect.top} (${specificComponent.rect.width}x${specificComponent.rect.height})`);
            console.log(`  Visible: display=${specificComponent.style.display}, visibility=${specificComponent.style.visibility}, opacity=${specificComponent.style.opacity}`);
            console.log(`  Text preview: "${specificComponent.text.substring(0, 100)}..."`);
        } else {
            console.log('\n❌ StandaloneRenataChat component NOT found');
        }

        const success = popupResults.length > 0 || specificComponent.found;

        console.log('\n🎉 DEBUG COMPLETE!');
        console.log(`📊 Result: ${success ? 'POPUP DETECTED' : 'NO POPUP DETECTED'}`);
        console.log('💾 Screenshot saved: simple-after-click.png');

        if (success) {
            console.log('\n🤔 Since automation detects the popup but you can\'t see it:');
            console.log('  1. Check the screenshot to see if it shows the popup');
            console.log('  2. The popup might be outside your visible screen area');
            console.log('  3. There could be a visual contrast issue');
            console.log('  4. Browser zoom level might be affecting visibility');
        } else {
            console.log('\n🚨 No popup detected by automation either - this confirms the issue');
        }

        // Keep browser open for manual inspection
        console.log('\n🔄 Keeping browser open for 5 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        return success;

    } catch (error) {
        console.error('\n❌ Debug failed:', error.message);
        return false;
    } finally {
        if (browser) {
            console.log('\n🔄 Closing browser...');
            await browser.close();
        }
    }
}

simpleRenataDebug()
    .then(success => {
        if (success) {
            console.log('\n🎉 Popup detected by automation - visibility disconnect confirmed');
        } else {
            console.log('\n💥 No popup detected - technical issue confirmed');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    });