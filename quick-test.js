#!/usr/bin/env node

const puppeteer = require('puppeteer-core');

const FRONTEND_URL = 'http://localhost:5656/';
const BROWSER_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function quickTest() {
    console.log('🚀 Quick test of StandaloneRenataChat...\n');

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
            executablePath: BROWSER_PATH,
            defaultViewport: null,
            args: ['--start-maximized', '--no-sandbox', '--disable-web-security']
        });

        const page = await browser.newPage();

        console.log(`📍 Navigating to ${FRONTEND_URL}...`);
        await page.goto(FRONTEND_URL, {
            waitUntil: ['networkidle2', 'domcontentloaded'],
            timeout: 15000
        });

        await page.waitForSelector('body', { timeout: 5000 });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Find Renata button and click
        const buttonFound = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const renataBtn = buttons.find(btn =>
                btn.textContent && btn.textContent.toLowerCase().includes('renata')
            );

            if (renataBtn) {
                console.log('✅ Found Renata button, clicking...');
                renataBtn.click();
                return true;
            }
            return false;
        });

        if (!buttonFound) {
            console.log('❌ Renata button not found');
            return false;
        }

        await new Promise(resolve => setTimeout(resolve, 1500));

        // Check for any popup or modal
        const anyPopup = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            const popupElements = Array.from(elements).filter(el => {
                const style = window.getComputedStyle(el);
                const text = el.textContent || '';

                return (text.includes('Renata') || text.includes('trading')) &&
                       style.display !== 'none' &&
                       parseFloat(style.opacity) > 0 &&
                       (style.position === 'fixed' || style.position === 'absolute');
            });

            return {
                count: popupElements.length,
                elements: popupElements.slice(0, 3).map(el => ({
                    tagName: el.tagName,
                    className: el.className,
                    text: el.textContent.substring(0, 50),
                    display: window.getComputedStyle(el).display,
                    position: window.getComputedStyle(el).position
                }))
            };
        });

        console.log('\n📊 Popup results:');
        console.log(`  Found ${anyPopup.count} popup elements`);

        if (anyPopup.count > 0) {
            console.log('\n🎉 Popup elements found:');
            anyPopup.elements.forEach((el, i) => {
                console.log(`  ${i + 1}: ${el.tagName} - "${el.text}" - ${el.position}`);
            });
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        return anyPopup.count > 0;

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        return false;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

quickTest()
    .then(success => {
        console.log(`\n${success ? '✅' : '❌'} Quick test ${success ? 'PASSED' : 'FAILED'}!`);
        process.exit(success ? 0 : 1);
    });