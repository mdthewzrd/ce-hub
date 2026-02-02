#!/usr/bin/env node

/**
 * Test Renata Button Click
 * Verify the Renata button works and popup opens
 */

const { chromium } = require('playwright');

async function testRenataButton() {
  console.log('🧪 Testing Renata Button Click\n');
  console.log('='.repeat(70));

  let browser;
  let page;

  try {
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Renata') || text.includes('popup') || text.includes('state')) {
        console.log(`  📝 ${text}`);
      }
    });

    console.log('📍 Navigating to http://localhost:6565/scan');
    await page.goto('http://localhost:6565/scan', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({ path: 'renata_before_click.png' });
    console.log('📸 Screenshot saved: renata_before_click.png');

    // Look for Renata button
    console.log('\n🔍 Looking for Renata button...');

    const renataButtonSelectors = [
      '[data-testid="renata-chat-open-button"]',  // PRIMARY: Most specific selector
      '[data-renata="true"]',                       // FALLBACK 1: Custom data attribute
      'button:has([data-testid="renata-chat-open-button"])',  // FALLBACK 2: Button containing testid
      'button:has-text("Renata"):has-text("AI Assistant")'  // FALLBACK 3: Specific text combination
    ];

    let renataButton = null;
    for (const selector of renataButtonSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const isVisible = await element.isVisible();
          if (isVisible) {
            console.log(`  ✅ FOUND Renata button with selector: ${selector}`);
            renataButton = element;
            break;
          }
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!renataButton) {
      console.log('  ❌ Renata button not found');
      console.log('\nTaking screenshot of page...');
      await page.screenshot({ path: 'renata_button_not_found.png', fullPage: true });
      console.log('📸 Screenshot saved: renata_button_not_found.png');
      return false;
    }

    // Click the Renata button
    console.log('\n🖱️  Clicking Renata button...');
    await renataButton.click();

    // Wait for popup to appear
    console.log('⏳ Waiting for popup to appear...');
    await page.waitForTimeout(2000);

    // Take screenshot after click
    await page.screenshot({ path: 'renata_after_click.png', fullPage: true });
    console.log('📸 Screenshot saved: renata_after_click.png');

    // Check if popup appeared
    console.log('\n🔍 Checking for Renata popup...');

    const popupSelectors = [
      'text=/Renata/i',
      '[class*="chat"]',
      '[class*="popup"]',
      '[class*="modal"]'
    ];

    let popupFound = false;
    for (const selector of popupSelectors) {
      try {
        const elements = await page.$$(selector);
        for (const element of elements) {
          const isVisible = await element.isVisible();
          if (isVisible) {
            const text = await element.textContent();
            if (text && (text.includes('Renata') || text.includes('AI') || text.includes('chat') || text.includes('message'))) {
              console.log(`  ✅ FOUND popup element with selector: ${selector}`);
              console.log(`     Text: "${text.substring(0, 100)}..."`);
              popupFound = true;
              break;
            }
          }
        }
        if (popupFound) break;
      } catch (e) {
        // Try next selector
      }
    }

    // Check page state
    const pageContent = await page.content();
    const hasChatInterface = pageContent.includes('chat') || pageContent.includes('message') || pageContent.includes('input');
    const hasRenataPopup = pageContent.includes('Renata') && pageContent.includes('popup');

    console.log('\n' + '='.repeat(70));
    console.log('📊 Test Results');
    console.log('='.repeat(70));
    console.log(`Renata button: ✅ FOUND`);
    console.log(`Popup detected: ${popupFound ? '✅ YES' : '❌ NO'}`);
    console.log(`Chat interface in HTML: ${hasChatInterface ? '✅ YES' : '❌ NO'}`);
    console.log(`Renata popup in HTML: ${hasRenataPopup ? '✅ YES' : '❌ NO'}`);

    // Keep browser open for manual inspection
    console.log('\n' + '='.repeat(70));
    console.log('🔍 Keeping browser open for 10 seconds for manual verification');
    console.log('='.repeat(70));
    console.log('\nPlease check manually:');
    console.log('1. Did clicking the Renata button do anything?');
    console.log('2. Did a popup or modal appear?');
    console.log('3. Is there a chat interface visible?');
    console.log('4. Check browser console (F12) for errors');

    await page.waitForTimeout(10000);

    // Final verdict
    console.log('\n' + '='.repeat(70));
    console.log('🎯 Test Complete');
    console.log('='.repeat(70));

    if (popupFound) {
      console.log('\n🎉 SUCCESS! Renata popup appeared after clicking button');
      return true;
    } else {
      console.log('\n❌ FAILED: Renata popup did not appear');
      console.log('\nPossible issues:');
      console.log('1. Component has rendering errors');
      console.log('2. Z-index issue (popup hidden behind other elements)');
      console.log('3. State not updating properly');
      console.log('4. Component file has errors');
      return false;
    }

  } catch (error) {
    console.error('\n❌ Test error:', error.message);

    if (page) {
      await page.screenshot({ path: 'renata_test_error.png' });
      console.log('📸 Error screenshot saved: renata_test_error.png');
    }

    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run test
testRenataButton().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
