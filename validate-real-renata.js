#!/usr/bin/env node

const puppeteer = require('puppeteer-core');

const FRONTEND_URL = 'http://localhost:5656/';
const BROWSER_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function validateRealRenata() {
    console.log('🔍 REAL VALIDATION: Testing Renata popup visibility...\n');

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false, // Show the browser so we can see what's happening
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
        page.on('console', msg => console.log(`📄 ${msg.text()}`));

        console.log(`📍 Navigating to ${FRONTEND_URL}...`);
        await page.goto(FRONTEND_URL, {
            waitUntil: ['networkidle2', 'domcontentloaded'],
            timeout: 30000
        });

        // Wait for page to be fully loaded
        await page.waitForSelector('body', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('\n🔍 STEP 1: Finding Renata button...');

        // Find and get button details
        const buttonInfo = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const renataBtn = buttons.find(btn =>
                btn.textContent && btn.textContent.toLowerCase().includes('renata')
            );

            if (!renataBtn) {
                return { found: false };
            }

            const rect = renataBtn.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(renataBtn);

            return {
                found: true,
                text: renataBtn.textContent?.trim(),
                visible: computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden',
                position: {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                },
                styles: {
                    display: computedStyle.display,
                    visibility: computedStyle.visibility,
                    opacity: computedStyle.opacity,
                    backgroundColor: computedStyle.backgroundColor,
                    color: computedStyle.color
                }
            };
        });

        if (!buttonInfo.found) {
            console.log('❌ FAIL: Renata button not found');
            return false;
        }

        console.log('✅ Found Renata button:', buttonInfo.text);
        console.log('📍 Button position:', buttonInfo.position);
        console.log('🎨 Button styles:', buttonInfo.styles);

        console.log('\n🔍 STEP 2: Taking screenshot BEFORE clicking...');
        await page.screenshot({ path: './renata-before-click.png', fullPage: true });

        console.log('\n🔍 STEP 3: Clicking Renata button...');

        // Click the button and monitor state changes
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const renataBtn = buttons.find(btn =>
                btn.textContent && btn.textContent.toLowerCase().includes('renata')
            );

            if (renataBtn) {
                console.log('🖱️ Clicking Renata button...');
                renataBtn.click();

                // Force a reflow to ensure changes are applied
                void renataBtn.offsetHeight;
                return true;
            }
            return false;
        });

        // Wait for React to update and any animations to complete
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('\n🔍 STEP 4: Taking screenshot AFTER clicking...');
        await page.screenshot({ path: './renata-after-click.png', fullPage: true });

        console.log('\n🔍 STEP 5: Checking for any popup or modal elements...');

        // Comprehensive popup detection
        const popupAnalysis = await page.evaluate(() => {
            // Get all elements that might be popups
            const allElements = document.querySelectorAll('*');
            let popupElements = [];

            allElements.forEach(el => {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                const text = el.textContent || '';

                // Check for popup characteristics
                const isFixed = style.position === 'fixed';
                const isAbsolute = style.position === 'absolute';
                const isVisible = style.display !== 'none' &&
                                 style.visibility !== 'hidden' &&
                                 parseFloat(style.opacity) > 0;
                const hasSize = rect.width > 50 && rect.height > 50;
                const hasZIndex = parseInt(style.zIndex) > 10;
                const hasContent = text.includes('Renata') ||
                                 text.includes('trading') ||
                                 text.includes('assistant') ||
                                 text.includes('Chat') ||
                                 text.includes('AI');

                // Check for chat-like containers
                const hasChatClass = (el.className && el.className.includes) &&
                                   (el.className.includes('chat') ||
                                   el.className.includes('message') ||
                                   el.className.includes('renata'));

                if ((isFixed || isAbsolute) && isVisible && hasSize && (hasZIndex || hasContent || hasChatClass)) {
                    popupElements.push({
                        tagName: el.tagName,
                        className: el.className,
                        id: el.id,
                        text: text.substring(0, 100),
                        position: {
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height
                        },
                        styles: {
                            position: style.position,
                            display: style.display,
                            visibility: style.visibility,
                            opacity: style.opacity,
                            zIndex: style.zIndex,
                            backgroundColor: style.backgroundColor,
                            border: style.border
                        }
                    });
                }
            });

            // Sort by z-index (highest first)
            popupElements.sort((a, b) => parseInt(b.styles.zIndex) - parseInt(a.styles.zIndex));

            return {
                totalElements: allElements.length,
                popupCount: popupElements.length,
                popups: popupElements.slice(0, 10) // Return top 10
            };
        });

        console.log('\n📊 Popup Analysis Results:');
        console.log(`  Total elements on page: ${popupAnalysis.totalElements}`);
        console.log(`  Potential popup elements found: ${popupAnalysis.popupCount}`);

        if (popupAnalysis.popupCount === 0) {
            console.log('\n❌ CRITICAL: NO popup elements detected after clicking Renata button');
            console.log('💾 Screenshots saved: renata-before-click.png, renata-after-click.png');
            console.log('\n🔍 SUGGESTION: Check the after-click screenshot to see what actually happened');
            return false;
        }

        console.log('\n🎯 Popup elements found:');
        popupAnalysis.popups.forEach((popup, i) => {
            console.log(`\n  Popup ${i + 1}:`);
            console.log(`    Tag: ${popup.tagName}`);
            console.log(`    Class: ${popup.className}`);
            console.log(`    ID: ${popup.id || 'none'}`);
            console.log(`    Position: ${popup.position.top}x${popup.position.left} (${popup.position.width}x${popup.position.height})`);
            console.log(`    Z-index: ${popup.styles.zIndex}`);
            console.log(`    Background: ${popup.styles.backgroundColor}`);
            console.log(`    Text: "${popup.text}"`);
        });

        console.log('\n🔍 STEP 6: Checking for React state changes...');

        // Try to detect if React state changed
        const reactState = await page.evaluate(() => {
            // Look for any React component state changes
            const hasReact = !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

            // Check if there are any elements with "isOpen" state indicators
            const openElements = document.querySelectorAll('[data-is-open="true"], [class*="open"], [class*="active"]');

            return {
                hasReactDevTools: hasReact,
                openElementsCount: openElements.length,
                openElements: Array.from(openElements).slice(0, 3).map(el => ({
                    tagName: el.tagName,
                    className: el.className,
                    id: el.id
                }))
            };
        });

        console.log(`\n⚛️  React state analysis:`);
        console.log(`  React DevTools available: ${reactState.hasReactDevTools}`);
        console.log(`  Open elements found: ${reactState.openElementsCount}`);

        if (reactState.openElementsCount > 0) {
            console.log('  Open elements:');
            reactState.openElements.forEach((el, i) => {
                console.log(`    ${i + 1}: ${el.tagName} - ${el.className}`);
            });
        }

        console.log('\n🎉 VALIDATION COMPLETE!');
        const success = popupAnalysis.popupCount > 0;

        if (success) {
            console.log('✅ SUCCESS: Renata popup is visible and working!');
            console.log('💾 Screenshots saved for your reference');
        } else {
            console.log('❌ FAILED: No visible Renata popup detected');
            console.log('💾 Check screenshots: renata-before-click.png, renata-after-click.png');
            console.log('\n🔧 Possible issues:');
            console.log('  1. CSS positioning problem');
            console.log('  2. Z-index conflict');
            console.log('  3. Component not rendering');
            console.log('  4. State not updating');
        }

        // Keep browser open for inspection
        console.log('\n🔄 Keeping browser open for 5 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        return success;

    } catch (error) {
        console.error('\n❌ Validation failed:', error.message);
        return false;
    } finally {
        if (browser) {
            console.log('\n🔄 Closing browser...');
            await browser.close();
        }
    }
}

validateRealRenata()
    .then(success => {
        if (success) {
            console.log('\n🎉 Renata popup validation PASSED!');
            console.log('The popup should now be visible when you click the Renata button.');
        } else {
            console.log('\n💥 Renata popup validation FAILED!');
            console.log('Check the screenshots to see what\'s happening.');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    });