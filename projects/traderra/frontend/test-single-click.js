const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🌍 Navigating to journal page...');
    await page.goto('http://localhost:6565/journal-enhanced-v2');
    await page.waitForLoadState('networkidle');

    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ path: 'test-initial.png' });

    console.log('🎯 Looking for Trading Journal folder...');
    const tradingJournalFolder = page.locator('[data-testid="folder-trading-journal"]');

    console.log('⏱️ Waiting for folder to be visible...');
    await tradingJournalFolder.waitFor();

    console.log('👆 Clicking Trading Journal folder ONCE...');
    await tradingJournalFolder.click();

    console.log('⏳ Waiting a moment for changes...');
    await page.waitForTimeout(1000);

    console.log('📸 Taking screenshot after click...');
    await page.screenshot({ path: 'test-after-click.png' });

    // Check if folder is both selected and expanded
    const isSelected = await tradingJournalFolder.evaluate(el =>
      el.classList.toString().includes('bg-primary')
    );

    const subFolders = page.locator('[data-testid="folder-trades-2024"]');
    const isExpanded = await subFolders.isVisible();

    console.log(`✅ Results:`);
    console.log(`   - Folder is selected (highlighted): ${isSelected}`);
    console.log(`   - Folder is expanded (children visible): ${isExpanded}`);

    if (isSelected && isExpanded) {
      console.log('🎉 SUCCESS: Single click works correctly!');
    } else {
      console.log('❌ FAIL: Single click not working');
      if (!isSelected) console.log('   - Folder not highlighted');
      if (!isExpanded) console.log('   - Folder not expanded');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();