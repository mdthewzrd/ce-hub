#!/usr/bin/env node

/**
 * Verify AI Enhancement Buttons
 * Check if the AI Scanner Builder and Validation buttons are visible
 */

const { chromium } = require('playwright');

async function verifyButtons() {
  console.log('🔍 Verifying AI Enhancement Buttons on http://localhost:5665/scan\n');
  console.log('='.repeat(70));

  let browser;
  let page;

  try {
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();

    // Navigate to scan page
    console.log('📍 Navigating to http://localhost:5665/scan');
    await page.goto('http://localhost:5665/scan', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for page to fully load
    console.log('⏳ Waiting for page to fully load...');
    await page.waitForTimeout(5000);

    // Take screenshot of initial state
    await page.screenshot({ path: 'button_check_initial.png', fullPage: true });
    console.log('📸 Screenshot saved: button_check_initial.png');

    // Search for buttons
    console.log('\n🔍 Searching for AI Enhancement Buttons...\n');

    const buttonTests = [
      {
        name: 'AI Scanner Builder',
        selectors: [
          'button:has-text("AI Scanner Builder")',
          '[class*="bg-indigo-600"]',
          'button:has-text("Scanner Builder")'
        ],
        keywords: ['AI', 'Scanner', 'Builder']
      },
      {
        name: 'Validation',
        selectors: [
          'button:has-text("Validation")',
          '[class*="bg-teal-600"]',
          'button:has-text("Validation")'
        ],
        keywords: ['Validation']
      }
    ];

    const results = {};

    for (const buttonTest of buttonTests) {
      console.log(`\n🔎 Looking for: ${buttonTest.name}`);

      let found = false;
      let foundInfo = null;

      // Try each selector
      for (const selector of buttonTest.selectors) {
        try {
          const elements = await page.$$(selector);
          for (const element of elements) {
            const isVisible = await element.isVisible();
            if (isVisible) {
              const text = await element.textContent();
              const className = await element.getAttribute('class');

              console.log(`  ✅ FOUND with selector: ${selector}`);
              console.log(`     Text: "${text}"`);
              console.log(`     Classes: ${className ? className.substring(0, 100) + '...' : 'none'}`);

              foundInfo = {
                selector,
                text: text.trim(),
                className: className || '',
                element
              };
              found = true;
              break;
            }
          }
          if (found) break;
        } catch (e) {
          // Selector didn't match
        }
      }

      // If not found with selectors, search page HTML
      if (!found) {
        console.log(`  ⚠️  Not found with selectors, searching HTML...`);

        const pageHTML = await page.content();
        const htmlLower = pageHTML.toLowerCase();

        let keywordFound = false;
        for (const keyword of buttonTest.keywords) {
          if (htmlLower.includes(keyword.toLowerCase())) {
            keywordFound = true;
            break;
          }
        }

        if (keywordFound) {
          console.log(`  ℹ️  Keywords found in HTML but button may not be visible`);
        } else {
          console.log(`  ❌ Not found in HTML`);
        }
      }

      results[buttonTest.name] = {
        found,
        info: foundInfo
      };
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 Button Verification Summary');
    console.log('='.repeat(70));

    const foundCount = Object.values(results).filter(r => r.found).length;
    const totalCount = Object.keys(results).length;

    console.log(`\nFound: ${foundCount}/${totalCount} buttons`);

    for (const [name, result] of Object.entries(results)) {
      if (result.found) {
        console.log(`  ✅ ${name}`);
      } else {
        console.log(`  ❌ ${name} - NOT FOUND`);
      }
    }

    // If buttons not found, check page structure
    if (foundCount < totalCount) {
      console.log('\n' + '='.repeat(70));
      console.log('🔍 Additional Debugging');
      console.log('='.repeat(70));

      // Get all buttons on page
      const allButtons = await page.$$eval('button', buttons =>
        buttons.map(btn => ({
          text: btn.textContent?.trim() || '',
          className: btn.className || '',
          visible: btn.offsetWidth > 0 && btn.offsetHeight > 0
        }))
      );

      console.log(`\nAll visible buttons on page (${allButtons.length} total):`);
      allButtons
        .filter(btn => btn.visible && btn.text)
        .forEach(btn => {
          console.log(`  • "${btn.text}"`);
          if (btn.className.length < 200) {
            console.log(`    Class: ${btn.className}`);
          }
        });

      // Check if our components are in the DOM
      console.log('\n🔍 Checking if ScannerBuilder component exists...');
      const hasScannerBuilder = await page.evaluate(() => {
        return document.documentElement.outerHTML.includes('ScannerBuilder');
      });
      console.log(`  ScannerBuilder in HTML: ${hasScannerBuilder ? '✅' : '❌'}`);

      console.log('\n🔍 Checking if ValidationDashboard component exists...');
      const hasValidationDashboard = await page.evaluate(() => {
        return document.documentElement.outerHTML.includes('ValidationDashboard');
      });
      console.log(`  ValidationDashboard in HTML: ${hasValidationDashboard ? '✅' : '❌'}`);
    }

    // Keep browser open for manual inspection
    console.log('\n' + '='.repeat(70));
    console.log('🔍 Keeping browser open for 10 seconds for manual verification');
    console.log('='.repeat(70));
    console.log('\nPlease verify manually:');
    console.log('1. Look for "AI Scanner Builder" button (purple/indigo)');
    console.log('2. Look for "Validation" button (teal/cyan)');
    console.log('3. Check if they are in the expected location');

    await page.waitForTimeout(10000);

    // Final verdict
    console.log('\n' + '='.repeat(70));
    console.log('🎯 Verification Complete');
    console.log('='.repeat(70));

    if (foundCount === totalCount) {
      console.log('\n🎉 SUCCESS! All AI Enhancement buttons are present and visible!');
      return true;
    } else {
      console.log(`\n⚠️  PARTIAL SUCCESS: ${foundCount}/${totalCount} buttons found`);
      console.log('\nNext steps:');
      console.log('1. Check the screenshots');
      console.log('2. Verify the page has fully loaded');
      console.log('3. Check if Next.js needs restart');
      console.log('4. Look at browser console (F12) for errors');
      return false;
    }

  } catch (error) {
    console.error('\n❌ Test error:', error.message);

    if (page) {
      await page.screenshot({ path: 'button_check_error.png' });
      console.log('📸 Error screenshot saved: button_check_error.png');
    }

    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run test
verifyButtons().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
