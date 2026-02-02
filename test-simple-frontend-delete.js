#!/usr/bin/env node

/**
 * SIMPLE FRONTEND DELETE TEST
 * Tests delete functionality at correct URL without changing UI
 */

const puppeteer = require('puppeteer');

async function simpleFrontendDeleteTest() {
  console.log('🔥 SIMPLE FRONTEND DELETE TEST');
  console.log('Testing delete functionality at http://localhost:5656/\n');

  let browser;
  let page;

  try {
    // Step 1: Launch visible browser
    console.log('🌐 Launching visible browser...');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });

    page = await browser.newPage();

    // Step 2: Go to CORRECT frontend URL (root, not /exec)
    console.log('🚀 Navigating to: http://localhost:5656/');
    await page.goto('http://localhost:5656/');

    // Wait for page to load
    await page.waitForSelector('body', { timeout: 10000 });
    console.log('✅ Page loaded successfully');

    // Step 3: Wait for content to render
    console.log('⏳ Waiting for page content to render...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 4: Look for delete buttons WITHOUT changing anything
    console.log('🔍 Looking for delete buttons...');

    const deleteButtons = await page.evaluate(() => {
      // Get ALL buttons and elements that might be delete buttons
      const elements = document.querySelectorAll('button, [role="button"], .delete, [data-testid*="delete"]');
      return Array.from(elements).map(el => ({
        text: el.textContent?.trim() || '',
        className: el.className || '',
        testId: el.getAttribute('data-testid') || '',
        visible: el.offsetWidth > 0 && el.offsetHeight > 0,
        disabled: el.disabled || false,
        tagName: el.tagName.toLowerCase()
      })).filter(el =>
        el.text.toLowerCase().includes('delete') ||
        el.text.toLowerCase().includes('remove') ||
        el.text.toLowerCase().includes('🗑️') ||
        el.text.toLowerCase().includes('×') ||
        el.testId.toLowerCase().includes('delete') ||
        el.className.toLowerCase().includes('delete')
      );
    });

    console.log(`🗑️ Found ${deleteButtons.length} delete buttons:`);
    deleteButtons.forEach((btn, index) => {
      console.log(`  ${index + 1}. ${btn.tagName}: "${btn.text}" (visible: ${btn.visible}, disabled: ${btn.disabled})`);
    });

    // Step 5: Take screenshot
    await page.screenshot({ path: 'frontend-delete-test.png', fullPage: true });
    console.log('📸 Screenshot saved: frontend-delete-test.png');

    // Step 6: Test delete button if found
    if (deleteButtons.length > 0 && deleteButtons.some(btn => btn.visible && !btn.disabled)) {
      console.log('\n🗑️ Testing delete button...');

      const workingButton = deleteButtons.find(btn => btn.visible && !btn.disabled);

      try {
        // Click the delete button
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
          const deleteBtn = buttons.find(btn => {
            const text = btn.textContent?.toLowerCase() || '';
            const className = btn.className?.toLowerCase() || '';
            return (text.includes('delete') || text.includes('remove') || text.includes('🗑️')) &&
                   btn.offsetWidth > 0 && btn.offsetHeight > 0 && !btn.disabled;
          });
          if (deleteBtn) deleteBtn.click();
        });

        console.log('✅ Delete button clicked');

        // Wait for any dialog
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Handle confirmation if needed
        const hasDialog = await page.evaluate(() => {
          const confirmBtn = Array.from(document.querySelectorAll('button'))
            .find(btn => {
              const text = btn.textContent?.toLowerCase() || '';
              return text.includes('confirm') || text.includes('delete') || text.includes('ok');
            });
          if (confirmBtn) {
            confirmBtn.click();
            return true;
          }
          return false;
        });

        if (hasDialog) {
          console.log('✅ Confirmed deletion');
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Delete test completed');

      } catch (error) {
        console.log('❌ Delete test error:', error.message);
      }

    } else {
      console.log('\n⚠️ No working delete buttons found');
      console.log('💡 This might indicate:');
      console.log('   - Delete buttons are dynamically loaded');
      console.log('   - Delete functionality requires user interaction first');
      console.log('   - Delete buttons are in a different section');
    }

    // Step 7: Keep browser open for manual inspection
    console.log('\n👁️ Keeping browser open for manual testing...');
    console.log('💡 You can manually test the delete functionality');
    console.log('⏱️ Browser will stay open for 60 seconds...');

    await new Promise(resolve => setTimeout(resolve, 60000));

    await browser.close();
    console.log('\n✅ Frontend delete test completed');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);

    if (browser) {
      await new Promise(resolve => setTimeout(resolve, 30000));
      await browser.close();
    }
  }
}

// Run the test
simpleFrontendDeleteTest().catch(console.error);