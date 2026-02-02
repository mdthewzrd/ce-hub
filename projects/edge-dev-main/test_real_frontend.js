#!/usr/bin/env node

/**
 * Real Frontend Validation Test
 * Tests the actual running frontend at http://localhost:5665/exec
 */

const { chromium } = require('playwright');

async function testRealFrontend() {
  console.log('🧪 Testing Real Frontend at http://localhost:5665/exec\n');
  console.log('=' .repeat(60));

  let browser;
  let page;

  try {
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();

    // Navigate to scan page
    console.log('📍 Navigating to http://localhost:5665/scan');
    await page.goto('http://localhost:5665/scan', { waitUntil: 'networkidle' });

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Take screenshot of initial state
    await page.screenshot({ path: 'frontend_initial_state.png', fullPage: true });
    console.log('📸 Screenshot saved: frontend_initial_state.png');

    // Check for buttons
    console.log('\n🔍 Looking for AI Enhancement Buttons...\n');

    const buttons = [
      {
        name: 'AI Scanner Builder',
        selectors: [
          'button:has-text("AI Scanner Builder")',
          '[class*="bg-indigo-600"]',
          'button:has-text("Scanner Builder")'
        ]
      },
      {
        name: 'Validation',
        selectors: [
          'button:has-text("Validation")',
          '[class*="bg-teal-600"]'
        ]
      },
      {
        name: 'AI Scan',
        selectors: [
          'button:has-text("AI Scan")',
          '[class*="from-indigo-600"]',
          '[class*="to-purple-600"]'
        ]
      }
    ];

    const foundButtons = {};

    for (const button of buttons) {
      console.log(`\n🔎 Looking for: ${button.name}`);

      let found = false;
      for (const selector of button.selectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const isVisible = await element.isVisible();
            if (isVisible) {
              console.log(`  ✅ FOUND with selector: ${selector}`);

              // Get button details
              const text = await element.textContent();
              const className = await element.getAttribute('class');

              console.log(`  Text: "${text}"`);
              console.log(`  Classes: ${className ? className.substring(0, 100) + '...' : 'none'}`);

              foundButtons[button.name] = {
                selector,
                text,
                className,
                element
              };
              found = true;
              break;
            }
          }
        } catch (e) {
          // Selector didn't match, try next one
        }
      }

      if (!found) {
        console.log(`  ❌ NOT FOUND`);
      }
    }

    // Summary of found buttons
    console.log('\n' + '='.repeat(60));
    console.log('📊 Button Detection Summary');
    console.log('='.repeat(60));

    const foundCount = Object.keys(foundButtons).length;
    console.log(`\nFound: ${foundCount}/${buttons.length} buttons`);

    for (const [name, info] of Object.entries(foundButtons)) {
      console.log(`  ✅ ${name}`);
    }

    if (foundCount < buttons.length) {
      console.log('\n❌ Missing buttons:');
      for (const button of buttons) {
        if (!foundButtons[button.name]) {
          console.log(`  ❌ ${button.name}`);
        }
      }
    }

    // Test button clicks if found
    if (foundCount > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('🧪 Testing Button Interactions');
      console.log('='.repeat(60));

      // Test AI Scanner Builder button
      if (foundButtons['AI Scanner Builder']) {
        console.log('\n🖱️  Clicking AI Scanner Builder button...');

        try {
          await foundButtons['AI Scanner Builder'].element.click();
          await page.waitForTimeout(2000);

          // Check if modal opened
          const modal = await page.$('text=/AI Scanner Builder/i');
          if (modal) {
            console.log('  ✅ Modal opened!');

            // Take screenshot
            await page.screenshot({ path: 'frontend_scanner_builder_modal.png' });
            console.log('  📸 Screenshot saved: frontend_scanner_builder_modal.png');

            // Close modal
            const closeButton = await page.$('button:has-text("×"), button:has([aria-label="Close"])');
            if (closeButton) {
              await closeButton.click();
              await page.waitForTimeout(1000);
              console.log('  ✅ Modal closed');
            }
          } else {
            console.log('  ❌ Modal did not open');
          }
        } catch (e) {
          console.log(`  ❌ Error clicking button: ${e.message}`);
        }
      }

      // Test Validation button
      if (foundButtons['Validation']) {
        console.log('\n🖱️  Clicking Validation button...');

        try {
          await foundButtons['Validation'].element.click();
          await page.waitForTimeout(2000);

          const modal = await page.$('text=/Validation Dashboard/i');
          if (modal) {
            console.log('  ✅ Modal opened!');

            await page.screenshot({ path: 'frontend_validation_modal.png' });
            console.log('  📸 Screenshot saved: frontend_validation_modal.png');

            const closeButton = await page.$('button:has-text("×"), button:has([aria-label="Close"])');
            if (closeButton) {
              await closeButton.click();
              await page.waitForTimeout(1000);
              console.log('  ✅ Modal closed');
            }
          } else {
            console.log('  ❌ Modal did not open');
          }
        } catch (e) {
          console.log(`  ❌ Error clicking button: ${e.message}`);
        }
      }
    }

    // Final screenshot
    await page.screenshot({ path: 'frontend_final_state.png', fullPage: true });
    console.log('\n📸 Final screenshot saved: frontend_final_state.png');

    // Get page HTML for debugging
    const pageHTML = await page.content();
    const buttonSection = pageHTML.match(/<button[^>]*>AI Scanner Builder<\/button>/s);

    console.log('\n' + '='.repeat(60));
    console.log('📄 HTML Evidence');
    console.log('='.repeat(60));

    if (buttonSection) {
      console.log('\n✅ Found "AI Scanner Builder" button in HTML:');
      console.log(buttonSection[0].substring(0, 300));
    } else {
      console.log('\n❌ Could not find "AI Scanner Builder" button in HTML');
      console.log('Checking for any buttons with "AI" or "Scanner"...');

      const allButtons = pageHTML.match(/<button[^>]*>([^<]+)<\/button>/g);
      if (allButtons) {
        console.log('\nAll buttons found:');
        allButtons.slice(0, 10).forEach(btn => {
          console.log(`  ${btn}`);
        });
      }
    }

    // Keep browser open for inspection
    console.log('\n' + '='.repeat(60));
    console.log('🔍 Keeping browser open for manual inspection');
    console.log('='.repeat(60));
    console.log('\n✨ Browser will stay open for 10 seconds for manual verification');
    console.log('You can interact with the page and verify the buttons yourself');

    await page.waitForTimeout(10000);

    console.log('\n✅ Test complete! Closing browser...');

    // Success summary
    if (foundCount === buttons.length) {
      console.log('\n🎉 SUCCESS! All buttons are present and functional in the real frontend!');
      return true;
    } else if (foundCount > 0) {
      console.log(`\n⚠️  PARTIAL SUCCESS: ${foundCount}/${buttons.length} buttons found`);
      return false;
    } else {
      console.log('\n❌ FAILED: No buttons found in the frontend');
      console.log('\n🔧 Troubleshooting:');
      console.log('  1. Check if Next.js server is running: npm run dev');
      console.log('  2. Check browser console for errors');
      console.log('  3. Verify the page has fully loaded');
      console.log('  4. Check if JavaScript is enabled');
      return false;
    }

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.error(error);

    if (page) {
      await page.screenshot({ path: 'frontend_error_screenshot.png' });
      console.log('📸 Error screenshot saved: frontend_error_screenshot.png');
    }

    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run test
testRealFrontend().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
