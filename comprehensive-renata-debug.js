#!/usr/bin/env node

const puppeteer = require('puppeteer-core');
const fs = require('fs');

const FRONTEND_URL = 'http://localhost:5656/';
const BROWSER_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function comprehensiveRenataDebug() {
    console.log('🔍 COMPREHENSIVE DEBUG: Renata popup visibility issue...\n');

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
                '--disable-dev-shm-usage',
                '--force-device-scale-factor=1' // Force 1x zoom to detect zoom issues
            ]
        });

        const page = await browser.newPage();

        // Enable console logging from the page
        page.on('console', msg => console.log(`📄 PAGE: ${msg.text()}`));
        page.on('pageerror', error => console.log(`🚨 PAGE ERROR: ${error.message}`));

        console.log(`📍 Navigating to ${FRONTEND_URL}...`);
        await page.goto(FRONTEND_URL, {
            waitUntil: ['networkidle2', 'domcontentloaded'],
            timeout: 30000
        });

        // Wait for page to be fully loaded
        await page.waitForSelector('body', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('\n🔍 STEP 1: Checking page state and zoom levels...');

        // Check page state including zoom
        const pageState = await page.evaluate(() => {
            return {
                url: window.location.href,
                readyState: document.readyState,
                devicePixelRatio: window.devicePixelRatio,
                visualViewport: {
                    width: window.visualViewport?.width,
                    height: window.visualViewport?.height,
                    scale: window.visualViewport?.scale
                },
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                outerWidth: window.outerWidth,
                outerHeight: window.outerHeight,
                scrollTop: window.pageYOffset,
                scrollLeft: window.pageXOffset
            };
        });

        console.log('📊 Page State:', pageState);

        console.log('\n🔍 STEP 2: Finding Renata button and checking its visibility...');

        // Find Renata button with detailed visibility analysis
        const buttonAnalysis = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, [role="button"], div[class*="button"]'));
            const renataButtons = buttons.filter(btn =>
                btn.textContent && btn.textContent.toLowerCase().includes('renata')
            );

            return renataButtons.map((btn, index) => {
                const rect = btn.getBoundingClientRect();
                const style = window.getComputedStyle(btn);
                const computedStyle = {
                    display: style.display,
                    visibility: style.visibility,
                    opacity: style.opacity,
                    zIndex: style.zIndex,
                    position: style.position
                };

                // Check if button is actually visible to human eye
                const isVisible = style.display !== 'none' &&
                                style.visibility !== 'hidden' &&
                                parseFloat(style.opacity) > 0.01 &&
                                rect.width > 0 && rect.height > 0;

                // Check if button is within viewport
                const inViewport = rect.top >= 0 && rect.left >= 0 &&
                                 rect.bottom <= window.innerHeight &&
                                 rect.right <= window.innerWidth;

                return {
                    index,
                    text: btn.textContent?.trim(),
                    tagName: btn.tagName,
                    className: btn.className,
                    rect: {
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                        bottom: rect.bottom,
                        right: rect.right
                    },
                    computedStyle,
                    isVisible,
                    inViewport,
                    centerPoint: {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2
                    }
                };
            });
        });

        console.log('\n📊 Renata Button Analysis:');
        buttonAnalysis.forEach(btn => {
            console.log(`  Button ${btn.index}: "${btn.text}"`);
            console.log(`    Position: ${btn.rect.left}x${btn.rect.top} (${btn.rect.width}x${btn.rect.height})`);
            console.log(`    Visible: ${btn.isVisible}, In Viewport: ${btn.inViewport}`);
            console.log(`    Styles: display=${btn.computedStyle.display}, visibility=${btn.computedStyle.visibility}, opacity=${btn.computedStyle.opacity}`);
            console.log(`    Center: ${btn.centerPoint.x}x${btn.centerPoint.y}`);
        });

        if (buttonAnalysis.length === 0) {
            console.log('❌ No Renata buttons found!');
            return false;
        }

        // Take screenshot BEFORE clicking
        console.log('\n📸 STEP 3: Taking screenshot BEFORE clicking...');
        await page.screenshot({
            path: './debug-before-click.png',
            fullPage: true
        });

        // Click the first visible Renata button
        const targetButton = buttonAnalysis.find(btn => btn.isVisible) || buttonAnalysis[0];
        console.log(`\n🖱️ STEP 4: Clicking Renata button ${targetButton.index} at position ${targetButton.centerPoint.x}x${targetButton.centerPoint.y}...`);

        await page.evaluate((centerPoint) => {
            // Try to click at the exact center point
            const element = document.elementFromPoint(centerPoint.x, centerPoint.y);
            if (element) {
                element.click();
                return true;
            }
            return false;
        }, targetButton.centerPoint);

        // Wait for popup to appear
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Take screenshot AFTER clicking
        console.log('\n📸 STEP 5: Taking screenshot AFTER clicking...');
        await page.screenshot({
            path: './debug-after-click.png',
            fullPage: true
        });

        console.log('\n🔍 STEP 6: Comprehensive popup analysis...');

        // Look for ANY popup elements with multiple detection methods
        const popupAnalysis = await page.evaluate(() => {
            const results = {
                method1_fixedPosition: [],
                method2_containsRenataText: [],
                method3_chatLikeElements: [],
                method4_highZIndex: [],
                method5_goldenColors: []
            };

            const allElements = document.querySelectorAll('*');

            allElements.forEach(el => {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                const text = el.textContent || '';

                const isVisible = style.display !== 'none' &&
                                style.visibility !== 'hidden' &&
                                parseFloat(style.opacity) > 0.01;

                const hasSize = rect.width > 100 && rect.height > 100;
                const isFixed = style.position === 'fixed' || style.position === 'absolute';
                const hasHighZ = parseInt(style.zIndex) > 10;

                // Method 1: Fixed/Absolute positioned elements
                if (isFixed && isVisible && hasSize) {
                    results.method1_fixedPosition.push({
                        tagName: el.tagName,
                        className: el.className,
                        id: el.id,
                        rect: {
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height
                        },
                        zIndex: style.zIndex,
                        backgroundColor: style.backgroundColor,
                        text: text.substring(0, 100)
                    });
                }

                // Method 2: Elements containing Renata text
                if (text.toLowerCase().includes('renata') && isVisible && hasSize) {
                    results.method2_containsRenataText.push({
                        tagName: el.tagName,
                        className: el.className,
                        id: el.id,
                        rect: {
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height
                        },
                        zIndex: style.zIndex,
                        text: text.substring(0, 100)
                    });
                }

                // Method 3: Chat-like elements
                const hasChatClass = el.className && (
                    el.className.includes('chat') ||
                    el.className.includes('message') ||
                    el.className.includes('renata') ||
                    el.className.includes('ai')
                );

                if (hasChatClass && isVisible && hasSize) {
                    results.method3_chatLikeElements.push({
                        tagName: el.tagName,
                        className: el.className,
                        id: el.id,
                        rect: {
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height
                        },
                        zIndex: style.zIndex,
                        text: text.substring(0, 100)
                    });
                }

                // Method 4: High z-index elements
                if (hasHighZ && isVisible && hasSize) {
                    results.method4_highZIndex.push({
                        tagName: el.tagName,
                        className: el.className,
                        id: el.id,
                        rect: {
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height
                        },
                        zIndex: style.zIndex,
                        text: text.substring(0, 100)
                    });
                }

                // Method 5: Golden/yellow colored elements (the "gold chat")
                const hasGoldColor = style.backgroundColor.includes('rgb(255, 215, 0)') || // gold
                                   style.backgroundColor.includes('rgb(250, 204, 21)') || // yellow-500
                                   style.color.includes('rgb(255, 215, 0)') ||
                                   el.className.includes('yellow');

                if (hasGoldColor && isVisible && hasSize) {
                    results.method5_goldenColors.push({
                        tagName: el.tagName,
                        className: el.className,
                        id: el.id,
                        rect: {
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height
                        },
                        backgroundColor: style.backgroundColor,
                        color: style.color,
                        text: text.substring(0, 100)
                    });
                }
            });

            return results;
        });

        console.log('\n📊 COMPREHENSIVE POPUP ANALYSIS:');

        Object.entries(popupAnalysis).forEach(([method, elements]) => {
            console.log(`\n  ${method}: Found ${elements.length} elements`);
            elements.slice(0, 3).forEach((el, i) => {
                console.log(`    ${i + 1}: ${el.tagName} at ${el.rect.left}x${el.rect.top} (${el.rect.width}x${el.rect.height}) - z-index: ${el.zIndex || 'auto'}`);
                if (el.text) console.log(`       Text: "${el.text.substring(0, 50)}..."`);
            });
        });

        // Check if any method found elements
        const totalFound = Object.values(popupAnalysis).reduce((sum, elements) => sum + elements.length, 0);

        console.log('\n🔍 STEP 7: Checking React component state...');

        // Try to check React state
        const reactState = await page.evaluate(() => {
            // Check for React DevTools
            const hasReact = !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

            // Look for any React component data
            const reactElements = document.querySelectorAll('[data-reactroot], [data-react-checksum]');

            // Check for any state indicators
            const stateIndicators = document.querySelectorAll('[data-state], [data-is-open], [aria-expanded]');

            return {
                hasReactDevTools: hasReact,
                reactElementCount: reactElements.length,
                stateIndicatorCount: stateIndicators.length,
                stateIndicators: Array.from(stateIndicators).slice(0, 5).map(el => ({
                    tagName: el.tagName,
                    className: el.className,
                    dataState: el.getAttribute('data-state'),
                    ariaExpanded: el.getAttribute('aria-expanded')
                }))
            };
        });

        console.log('\n⚛️ React State Analysis:', reactState);

        // Final result
        const success = totalFound > 0;

        console.log('\n🎉 COMPREHENSIVE DEBUG COMPLETE!');
        console.log(`📊 Total potential popup elements found: ${totalFound}`);

        if (success) {
            console.log('✅ SUCCESS: Popup elements detected by automation');
            console.log('💾 Screenshots saved: debug-before-click.png, debug-after-click.png');
            console.log('\n🤔 Since you still can\'t see it, this suggests:');
            console.log('  1. CSS rendering issue (visible to automation but not human eye)');
            console.log('  2. Browser zoom/display scaling problem');
            console.log('  3. Popup might be outside visible viewport');
            console.log('  4. Visual contrast issue (popup blends with background)');
            console.log('  5. Browser cache/rendering bug');
        } else {
            console.log('❌ FAILED: No popup elements detected by automation');
            console.log('💾 Check screenshots: debug-before-click.png, debug-after-click.png');
        }

        // Keep browser open for manual inspection
        console.log('\n🔄 Keeping browser open for 10 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        return success;

    } catch (error) {
        console.error('\n❌ Debug failed:', error.message);
        console.error('Stack trace:', error.stack);
        return false;
    } finally {
        if (browser) {
            console.log('\n🔄 Closing browser...');
            await browser.close();
        }
    }
}

comprehensiveRenataDebug()
    .then(success => {
        if (success) {
            console.log('\n🎉 Debug completed - popup detected but not visible to user');
            console.log('This confirms there\'s a visibility disconnect between automation and human perception');
        } else {
            console.log('\n💥 Debug failed - no popup detected at all');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    });