#!/usr/bin/env node

/**
 * GOLD REFRESH DELETE TEST
 * Tests: Click gold refresh button → Projects appear → Delete buttons visible
 */

const puppeteer = require('puppeteer');

async function testGoldRefreshDelete() {
  console.log('🔥 GOLD REFRESH DELETE TEST');
  console.log('Testing: Click gold refresh → Projects load → Delete buttons work\n');

  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });

    page = await browser.newPage();

    console.log('🚀 Navigating to: http://localhost:5656/');
    await page.goto('http://localhost:5656/');

    await page.waitForSelector('body', { timeout: 10000 });
    console.log('✅ Page loaded');

    // Step 1: Click the gold refresh button (first small button at the top)
    console.log('\n🔄 Clicking gold refresh button...');

    await page.evaluate(() => {
      // Try to find and click the refresh button
      const buttons = document.querySelectorAll('button');
      for (let btn of buttons) {
        const rect = btn.getBoundingClientRect();
        // Look for small buttons at the top (y around 155)
        if (rect.y > 140 && rect.y < 170 && rect.x > 180 && rect.x < 270 && rect.width < 30 && rect.height < 30) {
          console.log('Found potential refresh button:', rect);
          btn.click();
          return true;
        }
      }
      return false;
    });

    console.log('✅ Gold refresh button clicked');

    // Step 2: Wait for projects to load
    console.log('⏳ Waiting for projects to load after refresh...');
    await new Promise(resolve => setTimeout(resolve, 8000)); // Wait 8 seconds for projects

    // Step 3: Look for projects and delete buttons
    console.log('\n🔍 Looking for projects and delete buttons after refresh...');

    const deleteButtons = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      return Array.from(elements).map(el => ({
        text: (el.textContent || '').trim(),
        className: el.className || '',
        visible: el.offsetWidth > 0 && el.offsetHeight > 0,
        disabled: el.disabled || false,
        tagName: el.tagName.toLowerCase()
      })).filter(el =>
        el.text.toLowerCase().includes('delete') ||
        el.text.toLowerCase().includes('remove') ||
        el.text.toLowerCase().includes('🗑️') ||
        el.text.toLowerCase().includes('×')
      );
    });

    console.log(`🗑️ Found ${deleteButtons.length} delete buttons:`);
    deleteButtons.forEach((btn, index) => {
      console.log(`  ${index + 1}. ${btn.tagName}: "${btn.text.substring(0, 30)}..." (visible: ${btn.visible})`);
    });

    // Step 4: Look for project cards
    const projectElements = await page.evaluate(() => {
      const cards = document.querySelectorAll('*');
      return Array.from(cards).filter(el => {
        const text = el.textContent || '';
        return (text.toLowerCase().includes('backside') ||
                text.toLowerCase().includes('scanner') ||
                text.toLowerCase().includes('project')) &&
               el.offsetWidth > 0 && el.offsetHeight > 0;
      }).map(el => ({
        tagName: el.tagName.toLowerCase(),
        text: (el.textContent || '').substring(0, 100),
        buttonCount: el.querySelectorAll('button').length
      }));
    });

    console.log(`📦 Found ${projectElements.length} project-related elements`);

    // Step 5: Take screenshot showing current state
    await page.screenshot({ path: 'after-gold-refresh.png', fullPage: true });
    console.log('📸 Screenshot saved: after-gold-refresh.png');

    // Step 6: Test delete functionality if found
    if (deleteButtons.length > 0 && deleteButtons.some(btn => btn.visible && !btn.disabled)) {
      console.log('\n🗑️ Testing delete button functionality...');

      try {
        // Get project count before deletion
        const projectsBefore = await fetch('http://localhost:5656/api/projects')
          .then(res => res.json())
          .then(data => data.data?.length || 0)
          .catch(() => 0);

        console.log(`📊 Projects before deletion: ${projectsBefore}`);

        // Click delete button
        await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          for (let el of elements) {
            const text = el.textContent?.toLowerCase() || '';
            if ((text.includes('delete') || text.includes('remove') || text.includes('×')) &&
                el.offsetWidth > 0 && el.offsetHeight > 0 && !el.disabled) {
              el.click();
              return true;
            }
          }
          return false;
        });

        console.log('✅ Delete button clicked');

        // Wait for confirmation dialog
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Handle confirmation
        const confirmed = await page.evaluate(() => {
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

        if (confirmed) {
          console.log('✅ Deletion confirmed');
        }

        // Wait for deletion to process
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check project count after deletion
        const projectsAfter = await fetch('http://localhost:5656/api/projects')
          .then(res => res.json())
          .then(data => data.data?.length || 0)
          .catch(() => 0);

        console.log(`📊 Projects after deletion: ${projectsAfter}`);

        if (projectsAfter < projectsBefore) {
          console.log('🎉 SUCCESS: Project deletion worked!');
        } else {
          console.log('⚠️ Project count unchanged - deletion may have failed');
        }

        // Take final screenshot
        await page.screenshot({ path: 'after-delete-test.png', fullPage: true });
        console.log('📸 Final screenshot saved: after-delete-test.png');

      } catch (deleteError) {
        console.log('❌ Delete test error:', deleteError.message);
      }

    } else {
      console.log('\n⚠️ No delete buttons found after refresh');
      console.log('💡 Projects might still be loading or need different interaction');
    }

    // Step 7: Keep browser open for manual testing
    console.log('\n👁️ Browser staying open for manual verification...');
    console.log('⏱️ 60 seconds for manual testing...');

    await new Promise(resolve => setTimeout(resolve, 60000));

    await browser.close();
    console.log('\n✅ Gold refresh delete test completed');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);

    if (browser) {
      await new Promise(resolve => setTimeout(resolve, 30000));
      await browser.close();
    }
  }
}

// Run the test
console.log('🚀 Testing gold refresh → projects → delete flow\n');
testGoldRefreshDelete().catch(console.error);