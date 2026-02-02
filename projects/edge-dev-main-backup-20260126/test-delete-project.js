const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture all console messages
  page.on('console', msg => {
    console.log(`CONSOLE: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log(`ERROR: ${error}`);
  });

  try {
    console.log('🌐 Opening localhost:5665/scan...');
    await page.goto('http://localhost:5665/scan');
    await page.waitForLoadState('networkidle');

    console.log('⏳ Waiting 3 seconds for page to fully load...');
    await page.waitForTimeout(3000);

    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ path: '/tmp/delete-test-initial.png', fullPage: true });

    // Look for a project by text (Backside B or D1 Gap)
    console.log('🔍 Looking for projects in sidebar...');

    // Try to find project by text content
    const projectLocator = await page.locator('text=Backside B, text=D1 Gap').first();

    if (await projectLocator.isVisible({ timeout: 5000 })) {
      console.log('✅ Found project, clicking to show menu...');

      // Click on the project to potentially show menu/options
      await projectLocator.click();
      await page.waitForTimeout(1000);

      console.log('📸 After clicking project...');
      await page.screenshot({ path: '/tmp/delete-test-after-click.png', fullPage: true });

      // Look for any button with "delete" in text (case insensitive)
      const deleteButton = await page.locator('button', { hasText: /delete/i }).first();

      if (await deleteButton.isVisible({ timeout: 2000 })) {
        console.log('✅ Found delete button, clicking...');
        await deleteButton.click();
        await page.waitForTimeout(500);

        console.log('📸 After clicking delete button...');
        await page.screenshot({ path: '/tmp/delete-test-after-delete-click.png', fullPage: true });

        // Handle browser confirm dialog
        page.on('dialog', async dialog => {
          console.log('✅ Confirmation dialog detected:', dialog.message());
          await dialog.accept();
        });

        await page.waitForTimeout(2000);

        console.log('📸 Taking final screenshot...');
        await page.screenshot({ path: '/tmp/delete-test-final.png', fullPage: true });

        console.log('✅ Delete test completed! Check screenshots.');
      } else {
        console.log('❌ Delete button not found - checking all buttons...');
        const allButtons = await page.locator('button').all();
        console.log(`Found ${allButtons.length} buttons on page`);
        for (let i = 0; i < Math.min(5, allButtons.length); i++) {
          const text = await allButtons[i].textContent();
          console.log(`  Button ${i}: "${text}"`);
        }
        await page.screenshot({ path: '/tmp/delete-test-no-button.png', fullPage: true });
      }
    } else {
      console.log('❌ No projects found in sidebar');
    }

    // Keep browser open for manual inspection
    console.log('🔍 Browser will stay open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: '/tmp/delete-test-error.png', fullPage: true });
  }

  await browser.close();
})();
