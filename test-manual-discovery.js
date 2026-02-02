#!/usr/bin/env node

/**
 * MANUAL DISCOVERY TEST
 * Opens browser for manual testing to discover the correct flow
 */

const puppeteer = require('puppeteer');

async function manualDiscoveryTest() {
  console.log('🔥 MANUAL DISCOVERY TEST');
  console.log('Opening browser for manual testing to discover the project reset button\n');

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

    console.log('\n👁️ Browser is now open for manual testing');
    console.log('💡 Please manually click around to find:');
    console.log('   1. The project reset/refresh button');
    console.log('   2. How to make projects appear');
    console.log('   3. Where the delete buttons are located');
    console.log('   4. The complete user flow');

    console.log('\n📋 Current page analysis:');

    // Get all clickable elements
    const clickables = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, [role="button"], a, div[onclick], [class*="button"]');
      return Array.from(elements).map((el, index) => {
        const rect = el.getBoundingClientRect();
        return {
          index,
          tagName: el.tagName.toLowerCase(),
          text: (el.textContent || '').trim().substring(0, 50),
          className: el.className || '',
          id: el.id || '',
          visible: rect.width > 0 && rect.height > 0,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        };
      }).filter(el => el.visible && (el.text || el.tagName === 'button'));
    });

    console.log(`🖱️ Found ${clickables.length} clickable elements:`);
    clickables.forEach((el, index) => {
      console.log(`  ${index + 1}. ${el.tagName}: "${el.text}" at (${Math.round(el.x)}, ${Math.round(el.y)}) size: ${Math.round(el.width)}x${Math.round(el.height)}`);
    });

    // Take initial screenshot
    await page.screenshot({ path: 'manual-discovery-initial.png', fullPage: true });
    console.log('\n📸 Initial screenshot saved: manual-discovery-initial.png');

    console.log('\n⏱️ Browser will stay open for 120 seconds for manual testing...');
    console.log('💡 Test the complete flow and observe what happens');
    console.log('🔍 Look for:');
    console.log('   - Reset/refresh buttons');
    console.log('   - How projects appear');
    console.log('   - Delete button locations');
    console.log('   - Any error messages in console');

    // Enable console logging
    page.on('console', msg => {
      console.log(`🌐 BROWSER CONSOLE: ${msg.text()}`);
    });

    page.on('pageerror', error => {
      console.log(`❌ BROWSER ERROR: ${error.message}`);
    });

    // Keep browser open for testing
    await new Promise(resolve => setTimeout(resolve, 120000));

    // Take final screenshot
    await page.screenshot({ path: 'manual-discovery-final.png', fullPage: true });
    console.log('\n📸 Final screenshot saved: manual-discovery-final.png');

    await browser.close();
    console.log('\n✅ Manual discovery test completed');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);

    if (browser) {
      await new Promise(resolve => setTimeout(resolve, 30000));
      await browser.close();
    }
  }
}

// Run the manual discovery test
manualDiscoveryTest().catch(console.error);