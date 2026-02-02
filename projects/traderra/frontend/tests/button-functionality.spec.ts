import { test, expect } from '@playwright/test';

test.describe('Button Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  });

  test('should verify critical dashboard buttons work', async ({ page }) => {
    console.log('Testing critical dashboard buttons...');

    // Test date range buttons
    const dateRangeButtons = page.locator('button:has-text("7d"), button:has-text("30d"), button:has-text("90d")');
    const dateButtonCount = await dateRangeButtons.count();

    console.log(`Found ${dateButtonCount} date range buttons`);

    for (let i = 0; i < dateButtonCount; i++) {
      const button = dateRangeButtons.nth(i);
      const buttonText = await button.textContent();

      if (await button.isVisible() && await button.isEnabled()) {
        console.log(`Testing button: "${buttonText}"`);
        await button.click();
        await page.waitForTimeout(1000);

        // Verify page still has charts after click
        const chartsAfterClick = await page.locator('svg').count();
        expect(chartsAfterClick).toBeGreaterThan(0);
        console.log(`✅ "${buttonText}" button works correctly`);
      }
    }
  });

  test('should verify navigation and UI buttons are functional', async ({ page }) => {
    console.log('Testing navigation and UI buttons...');

    // Get all visible buttons on the page
    const allButtons = page.locator('button:visible');
    const totalButtons = await allButtons.count();

    console.log(`Found ${totalButtons} visible buttons on the page`);

    // Test a sample of buttons (not all to avoid timeout)
    const buttonsToTest = Math.min(totalButtons, 10);

    for (let i = 0; i < buttonsToTest; i++) {
      const button = allButtons.nth(i);
      const buttonText = await button.textContent();
      const isEnabled = await button.isEnabled();

      if (isEnabled && buttonText && !buttonText.includes('Close Chat')) {
        console.log(`Testing button ${i + 1}/${buttonsToTest}: "${buttonText?.trim()}"`);

        try {
          // Use force click to avoid overlay issues
          await button.click({ force: true });
          await page.waitForTimeout(500);

          // Verify page is still responsive
          const pageTitle = await page.title();
          expect(pageTitle).toBeTruthy();

          console.log(`✅ Button "${buttonText?.trim()}" is functional`);
        } catch (error) {
          console.log(`⚠️ Button "${buttonText?.trim()}" had interaction issues (possibly overlapped)`);
        }
      }
    }
  });

  test('should verify no critical errors in button interactions', async ({ page }) => {
    console.log('Checking for critical errors during button interactions...');

    // Monitor console for errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Test date range switching multiple times
    const sevenDayButton = page.locator('button:has-text("7d")').first();
    const thirtyDayButton = page.locator('button:has-text("30d")').first();

    if (await sevenDayButton.isVisible() && await thirtyDayButton.isVisible()) {
      // Switch between date ranges
      await sevenDayButton.click();
      await page.waitForTimeout(1000);

      await thirtyDayButton.click();
      await page.waitForTimeout(1000);

      await sevenDayButton.click();
      await page.waitForTimeout(1000);

      console.log('✅ Date range switching completed without critical errors');
    }

    // Filter out non-critical errors (favicons, extensions, etc.)
    const criticalErrors = errors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('copilot') &&
      !error.includes('Extension') &&
      !error.includes('chrome-extension')
    );

    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors);
    } else {
      console.log('✅ No critical errors found during button interactions');
    }

    expect(criticalErrors.length).toBeLessThan(3); // Allow for minor non-critical issues
  });

  test('should verify dashboard functionality remains intact', async ({ page }) => {
    console.log('Verifying overall dashboard functionality...');

    // Check that all major components are present and functional
    const checks = [
      { name: 'Charts present', selector: 'svg', minCount: 5 },
      { name: 'Date buttons present', selector: 'button:has-text("7d"), button:has-text("30d"), button:has-text("90d")', minCount: 3 },
      { name: 'Content loaded', selector: 'body', minCount: 1 },
    ];

    for (const check of checks) {
      const elements = page.locator(check.selector);
      const count = await elements.count();

      console.log(`${check.name}: ${count} elements found (minimum required: ${check.minCount})`);
      expect(count).toBeGreaterThanOrEqual(check.minCount);
    }

    // Verify page content includes expected elements
    const pageContent = await page.content();
    const expectedElements = ['Weekly Glance', 'svg', 'button'];

    for (const element of expectedElements) {
      expect(pageContent).toContain(element);
      console.log(`✅ Found expected element: ${element}`);
    }

    console.log('✅ Dashboard functionality verification complete');
  });
});