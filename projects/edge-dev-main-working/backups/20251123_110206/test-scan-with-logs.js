const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    console.log(`BROWSER: ${text}`);
  });

  // Capture console errors
  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
  });

  try {
    console.log('🚀 Testing scan with detailed logging...');
    await page.goto('http://localhost:5657');
    await page.waitForLoadState('networkidle');

    console.log('📸 Taking before screenshot...');
    await page.screenshot({ path: 'before-scan-debug.png', fullPage: true });

    console.log('🔍 Clicking Run Scan button...');
    await page.click('button:has-text("🔍 Run Scan")');

    // Wait for scan to complete
    console.log('⏳ Waiting for scan to complete...');
    await page.waitForFunction(() => {
      const button = document.querySelector('button[data-test-id="run-scan"]') ||
                     document.querySelector('button:contains("🔍 Run Scan")') ||
                     document.querySelector('button:contains("Run Scan")');
      return button && !button.disabled;
    }, { timeout: 30000 });

    // Wait a bit more for UI updates
    await page.waitForTimeout(2000);

    console.log('📸 Taking after screenshot...');
    await page.screenshot({ path: 'after-scan-debug.png', fullPage: true });

    // Check final results
    const finalTickers = await page.$$eval('tr td:first-child', tds =>
      tds.map(td => td.textContent.trim()).filter(text => text && text !== 'TICKER')
    );

    console.log('🎯 Final scan results:', finalTickers);
    console.log('📝 All console logs captured:', logs.length, 'entries');

    // Show relevant logs
    const scanLogs = logs.filter(log =>
      log.includes('🔍') || log.includes('📡') || log.includes('📊') ||
      log.includes('✅') || log.includes('❌') || log.includes('🔄')
    );
    console.log('🔍 Scan-related logs:');
    scanLogs.forEach(log => console.log(`  ${log}`));

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }

  await browser.close();
})();