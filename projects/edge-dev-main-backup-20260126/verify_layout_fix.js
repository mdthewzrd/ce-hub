const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to http://localhost:5657...');
    await page.goto('http://localhost:5657', { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for the main content to be visible
    await page.waitForSelector('main', { timeout: 10000 });

    console.log('Taking full page screenshot...');
    await page.screenshot({
      path: 'layout_verification_full.png',
      fullPage: true
    });

    console.log('Taking viewport screenshot...');
    await page.screenshot({
      path: 'layout_verification_viewport.png'
    });

    // Get some layout measurements
    const layoutInfo = await page.evaluate(() => {
      const sidebar = document.querySelector('aside, [class*="sidebar"], nav');
      const main = document.querySelector('main');

      return {
        sidebarInfo: sidebar ? {
          width: sidebar.offsetWidth,
          left: sidebar.getBoundingClientRect().left,
          right: sidebar.getBoundingClientRect().right
        } : null,
        mainInfo: main ? {
          width: main.offsetWidth,
          left: main.getBoundingClientRect().left,
          right: main.getBoundingClientRect().right,
          marginLeft: window.getComputedStyle(main).marginLeft,
          paddingLeft: window.getComputedStyle(main).paddingLeft
        } : null,
        gap: sidebar && main ?
          main.getBoundingClientRect().left - sidebar.getBoundingClientRect().right :
          null
      };
    });

    console.log('\n=== Layout Measurements ===');
    console.log('Sidebar:', layoutInfo.sidebarInfo);
    console.log('Main Content:', layoutInfo.mainInfo);
    console.log('Gap between sidebar and main:', layoutInfo.gap, 'px');
    console.log('\nScreenshots saved:');
    console.log('- layout_verification_full.png (full page)');
    console.log('- layout_verification_viewport.png (viewport)');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
