const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Navigating to http://localhost:3457/exec...');
    await page.goto('http://localhost:3457/exec', { waitUntil: 'networkidle' });

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'site_screenshot.png', fullPage: true });

    console.log('Getting page title and content...');
    const title = await page.title();
    console.log('Page title:', title);

    // Check if the page loaded correctly
    const bodyText = await page.textContent('body');
    console.log('Page has content:', bodyText.length > 0);

    // Look for key elements
    const headerExists = await page.locator('header').count();
    console.log('Header found:', headerExists > 0);

    const execDashboard = await page.locator('text=EXEC Dashboard').count();
    console.log('EXEC Dashboard text found:', execDashboard > 0);

    console.log('✅ Site test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing site:', error.message);
    await page.screenshot({ path: 'error_screenshot.png' });
  }

  await browser.close();
})();