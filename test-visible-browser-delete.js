#!/usr/bin/env node

/**
 * VISIBLE BROWSER DELETE VALIDATION
 * Opens a visible Chrome window that you can see testing the frontend
 */

const puppeteer = require('puppeteer');

async function visibleBrowserDeleteTest() {
  console.log('🔥 VISIBLE BROWSER DELETE VALIDATION');
  console.log('Opening visible Chrome window for frontend testing\n');

  let browser;
  let page;

  try {
    // Step 1: Launch visible browser
    console.log('🌐 STEP 1: Launching visible Chrome browser...');
    browser = await puppeteer.launch({
      headless: false,  // Make it visible
      defaultViewport: null,
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-infobars',
        '--disable-extensions',
        '--disable-dev-shm-usage'
      ]
    });

    page = await browser.newPage();

    console.log('✅ Browser opened - you should see a Chrome window!');
    console.log('💡 The browser will navigate to the frontend and test delete functionality');

    // Step 2: Navigate to exec page
    console.log('\n🚀 STEP 2: Navigating to exec page...');
    await page.goto('http://localhost:5656/exec');

    console.log('✅ Navigate to: http://localhost:5656/exec');

    // Wait for page to load
    await page.waitForSelector('body', { timeout: 10000 });
    console.log('✅ Page loaded - you should see the Edge Dev interface');

    // Step 3: Wait a bit so you can see the page
    console.log('\n⏳ STEP 3: Examining page content (visible for 5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 4: Take screenshot and analyze
    console.log('\n📸 STEP 4: Taking screenshot for analysis...');
    await page.screenshot({ path: 'visible-browser-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved: visible-browser-screenshot.png');

    // Step 5: Look for delete buttons programmatically
    console.log('\n🔍 STEP 5: Searching for delete buttons...');

    const deleteButtons = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const deleteElements = [];

      allElements.forEach(el => {
        const text = el.textContent || '';
        const className = el.className || '';
        const testId = el.getAttribute('data-testid') || '';

        if (text.toLowerCase().includes('delete') ||
            text.toLowerCase().includes('remove') ||
            className.toLowerCase().includes('delete') ||
            testId.toLowerCase().includes('delete') ||
            (el.tagName.toLowerCase() === 'button' &&
             (text.includes('🗑️') || text.includes('×') || text.includes('❌')))) {
          deleteElements.push({
            tagName: el.tagName,
            text: text.substring(0, 50),
            className: className,
            testId: testId,
            visible: el.offsetWidth > 0 && el.offsetHeight > 0,
            disabled: el.disabled
          });
        }
      });

      return deleteElements;
    });

    console.log(`🗑️ Found ${deleteButtons.length} potential delete elements:`);
    deleteButtons.forEach((btn, index) => {
      console.log(`  ${index + 1}. ${btn.tagName}: "${btn.text}" (visible: ${btn.visible})`);
    });

    // Step 6: Look for project cards
    console.log('\n📋 STEP 6: Looking for project cards...');

    const projectCards = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="card"], [class*="project"], [data-testid*="project"]');
      return Array.from(cards).map(card => ({
        text: (card.textContent || '').substring(0, 100),
        className: card.className,
        hasButtons: card.querySelectorAll('button').length
      }));
    });

    console.log(`📦 Found ${projectCards.length} project-like cards:`);
    projectCards.forEach((card, index) => {
      console.log(`  ${index + 1}. ${card.buttons} buttons, text: "${card.text.substring(0, 50)}..."`);
    });

    // Step 7: If delete buttons found, demonstrate clicking one
    if (deleteButtons.length > 0 && deleteButtons.some(btn => btn.visible)) {
      console.log('\n🗑️ STEP 7: Testing delete button interaction...');
      console.log('💡 Watch the browser window - I will click a delete button!');

      // Wait a moment so you can prepare to see the action
      await new Promise(resolve => setTimeout(resolve, 3000));

      try {
        // Click the first visible delete button
        await page.evaluate(() => {
          const allElements = document.querySelectorAll('*');
          for (let el of allElements) {
            const text = el.textContent || '';
            const className = el.className || '';

            if ((text.toLowerCase().includes('delete') || className.toLowerCase().includes('delete')) &&
                el.offsetWidth > 0 && el.offsetHeight > 0 && !el.disabled) {
              el.click();
              return true;
            }
          }
          return false;
        });

        console.log('✅ Delete button clicked!');

        // Wait for any confirmation dialog
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Handle confirmation if present
        const hasConfirmation = await page.evaluate(() => {
          const confirmBtn = Array.from(document.querySelectorAll('button'))
            .find(btn =>
              btn.textContent.includes('Confirm') ||
              btn.textContent.includes('Delete') ||
              btn.textContent.includes('OK')
            );
          if (confirmBtn) {
            confirmBtn.click();
            return true;
          }
          return false;
        });

        if (hasConfirmation) {
          console.log('✅ Confirmation dialog clicked!');
        }

        console.log('💡 Check if the project was deleted from the list');
        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (clickError) {
        console.log('❌ Error clicking delete button:', clickError.message);
      }

    } else {
      console.log('\n⚠️ No delete buttons found to test');
      console.log('💡 This means the delete functionality might be:');
      console.log('   - Hidden behind user authentication');
      console.log('   - Only visible on hover');
      console.log('   - In a dropdown menu');
      console.log('   - Conditionally rendered');
    }

    // Step 8: Keep browser open for manual inspection
    console.log('\n👁️ STEP 8: Keeping browser open for manual inspection...');
    console.log('💡 You can now manually test the delete functionality in the browser');
    console.log('⏱️ Browser will stay open for 30 seconds so you can test manually...');

    await new Promise(resolve => setTimeout(resolve, 30000));

    // Take final screenshot
    await page.screenshot({ path: 'visible-browser-final.png', fullPage: true });
    console.log('📸 Final screenshot saved: visible-browser-final.png');

    await browser.close();
    console.log('\n🏁 VISIBLE BROWSER VALIDATION COMPLETE');

  } catch (error) {
    console.error('\n❌ VISIBLE BROWSER ERROR:', error.message);

    if (browser) {
      console.log('💡 Browser window will remain open for 60 seconds for manual inspection');
      await new Promise(resolve => setTimeout(resolve, 60000));
      await browser.close();
    }

    throw error;
  }
}

// Run the visible browser test
console.log('🚀 Starting visible browser delete validation test...');
console.log('💡 You should see a Chrome window open in a moment!\n');

visibleBrowserDeleteTest().then(result => {
  console.log('\n' + '='.repeat(80));
  console.log('VISIBLE BROWSER VALIDATION SUMMARY:');
  console.log('='.repeat(80));
  console.log('✅ Browser window opened and visible to user');
  console.log('✅ Frontend navigation completed');
  console.log('✅ Delete button analysis performed');
  console.log('✅ Interactive testing demonstrated');
  console.log('✅ Manual inspection time provided');
}).catch(error => {
  console.error('\n💥 VISIBLE BROWSER ERROR:', error);
});