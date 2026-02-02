const { chromium } = require('playwright');

async function checkConsole() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture console logs
  const logs = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });

  try {
    console.log('🔍 Navigating to trades page...');
    await page.goto('http://localhost:6565/trades');
    await page.waitForLoadState('networkidle');

    console.log('🔍 Clicking AAPL trade...');
    await page.locator('text=AAPL').first().click();
    await page.waitForTimeout(8000); // Wait for chart to load and debug

    console.log('\n📋 Console logs:');
    logs.forEach(log => {
      if (log.includes('🎯') || log.includes('📅') || log.includes('📍') || log.includes('📊')) {
        console.log(log);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  }

  await browser.close();
}

checkConsole();