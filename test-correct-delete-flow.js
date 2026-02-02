#!/usr/bin/env node

/**
 * CORRECT DELETE FLOW TEST
 * Tests the proper user flow: click project reset → then delete projects
 */

const puppeteer = require('puppeteer');

async function testCorrectDeleteFlow() {
  console.log('🔥 CORRECT DELETE FLOW TEST');
  console.log('Testing: Project Reset → Projects Appear → Delete Buttons Visible\n');

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

    // Step 2: Go to frontend
    console.log('🚀 Navigating to: http://localhost:5656/');
    await page.goto('http://localhost:5656/');

    await page.waitForSelector('body', { timeout: 10000 });
    console.log('✅ Page loaded');

    // Step 3: Look for project reset button
    console.log('\n🔍 Looking for project reset button...');

    const resetButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      return buttons.map(btn => ({
        text: btn.textContent?.trim() || '',
        className: btn.className || '',
        visible: btn.offsetWidth > 0 && btn.offsetHeight > 0,
        disabled: btn.disabled || false
      })).filter(btn =>
        btn.text.toLowerCase().includes('reset') ||
        btn.text.toLowerCase().includes('project') ||
        btn.text.toLowerCase().includes('reload') ||
        btn.text.toLowerCase().includes('refresh')
      );
    });

    console.log(`🔄 Found ${resetButtons.length} reset-related buttons:`);
    resetButtons.forEach((btn, index) => {
      console.log(`  ${index + 1}. "${btn.text}" (visible: ${btn.visible})`);
    });

    if (resetButtons.length === 0 || !resetButtons.some(btn => btn.visible)) {
      console.log('❌ No reset button found - taking screenshot for analysis...');
      await page.screenshot({ path: 'no-reset-button-found.png', fullPage: true });

      // Look for any clickable elements that might be the reset
      const allClickables = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        return Array.from(elements).map(el => ({
          text: (el.textContent || '').substring(0, 50),
          tagName: el.tagName.toLowerCase(),
          className: el.className || '',
          onClick: el.getAttribute('onclick') || '',
          hasClick: !!el.onclick
        })).filter(el =>
          el.text.toLowerCase().includes('project') ||
          el.text.toLowerCase().includes('reset') ||
          el.onClick.includes('project') ||
          el.hasClick
        ).slice(0, 10);
      });

      console.log('🔍 Potentially clickable elements:');
      allClickables.forEach((el, index) => {
        console.log(`  ${index + 1}. ${el.tagName}: "${el.text}"`);
      });
    }

    // Step 4: Click the reset button
    let resetClicked = false;
    if (resetButtons.length > 0 && resetButtons.some(btn => btn.visible)) {
      const resetButton = resetButtons.find(btn => btn.visible);

      console.log(`\n🔄 Clicking reset button: "${resetButton.text}"`);

      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
        const resetBtn = buttons.find(btn => {
          const text = btn.textContent?.toLowerCase() || '';
          return (text.includes('reset') || text.includes('project') || text.includes('reload')) &&
                 btn.offsetWidth > 0 && btn.offsetHeight > 0;
        });
        if (resetBtn) resetBtn.click();
      });

      resetClicked = true;
      console.log('✅ Reset button clicked');

      // Wait for projects to load
      console.log('⏳ Waiting for projects to load after reset...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Step 5: Now look for delete buttons
    console.log('\n🔍 Looking for delete buttons after reset...');

    const deleteButtons = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
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
      console.log(`  ${index + 1}. ${btn.tagName}: "${btn.text}" (visible: ${btn.visible})`);
    });

    // Step 6: Look for project cards
    const projectCards = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="project"], [class*="card"], [data-testid*="project"]');
      return Array.from(cards).map(card => ({
        text: (card.textContent || '').substring(0, 100),
        className: card.className,
        buttonCount: card.querySelectorAll('button').length
      }));
    });

    console.log(`📦 Found ${projectCards.length} project cards after reset`);

    // Step 7: Take screenshot showing the current state
    await page.screenshot({ path: `after-reset-${resetClicked ? 'clicked' : 'not-clicked'}.png`, fullPage: true });
    console.log(`📸 Screenshot saved: after-reset-${resetClicked ? 'clicked' : 'not-clicked'}.png`);

    // Step 8: Test delete functionality if delete buttons found
    if (deleteButtons.length > 0 && deleteButtons.some(btn => btn.visible && !btn.disabled)) {
      console.log('\n🗑️ Testing delete functionality...');

      try {
        // Click first visible delete button
        await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          for (let el of elements) {
            const text = el.textContent?.toLowerCase() || '';
            if ((text.includes('delete') || text.includes('remove') || text.includes('🗑️')) &&
                el.offsetWidth > 0 && el.offsetHeight > 0 && !el.disabled) {
              el.click();
              return;
            }
          }
        });

        console.log('✅ Delete button clicked');

        // Handle confirmation if needed
        await new Promise(resolve => setTimeout(resolve, 2000));

        const handledConfirmation = await page.evaluate(() => {
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

        if (handledConfirmation) {
          console.log('✅ Confirmation handled');
        }

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Take final screenshot
        await page.screenshot({ path: 'after-delete-test.png', fullPage: true });
        console.log('📸 Final screenshot saved: after-delete-test.png');

      } catch (deleteError) {
        console.log('❌ Delete test error:', deleteError.message);
      }
    }

    // Step 9: Keep browser open for manual testing
    console.log('\n👁️ Browser will stay open for manual testing...');
    console.log('💡 You can manually test the complete flow');
    console.log('⏱️ 60 seconds for manual testing...');

    await new Promise(resolve => setTimeout(resolve, 60000));

    await browser.close();
    console.log('\n✅ Correct delete flow test completed');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);

    if (browser) {
      await new Promise(resolve => setTimeout(resolve, 30000));
      await browser.close();
    }
  }
}

// Run the test
console.log('🚀 Testing correct delete flow: Reset → Projects → Delete\n');
testCorrectDeleteFlow().catch(console.error);