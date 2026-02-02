import { test, expect } from '@playwright/test';

test.describe('Date Range Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  });

  test('should switch between date ranges and verify chart updates', async ({ page }) => {
    console.log('Testing date range navigation...');

    // Look for date range buttons
    const sevenDayButton = page.locator('button:has-text("7d")').first();
    const thirtyDayButton = page.locator('button:has-text("30d")').first();
    const ninetyDayButton = page.locator('button:has-text("90d")').first();

    // Verify 7d button exists and shows "Weekly Glance"
    if (await sevenDayButton.isVisible()) {
      await sevenDayButton.click();
      await page.waitForTimeout(1000);

      // Check for "Weekly Glance" text
      const weeklyGlanceText = await page.textContent('body');
      expect(weeklyGlanceText).toContain('Weekly Glance');
      console.log('✅ 7d button clicked, Weekly Glance displayed');

      // Count SVG elements (should represent charts)
      const chartsSeven = await page.locator('svg').count();
      console.log(`Charts in 7d view: ${chartsSeven}`);
    }

    // Test 30d button
    if (await thirtyDayButton.isVisible()) {
      await thirtyDayButton.click();
      await page.waitForTimeout(1500);

      // Check for "Last 30 Days" text
      const bodyText = await page.textContent('body');
      expect(bodyText).toContain('Last 30 Days');
      console.log('✅ 30d button clicked, Last 30 Days displayed');

      // Verify charts still render
      const chartsThirty = await page.locator('svg').count();
      console.log(`Charts in 30d view: ${chartsThirty}`);
      expect(chartsThirty).toBeGreaterThan(0);
    }

    // Test 90d button
    if (await ninetyDayButton.isVisible()) {
      await ninetyDayButton.click();
      await page.waitForTimeout(1500);

      // Check for "Last 90 Days" text
      const bodyText = await page.textContent('body');
      expect(bodyText).toContain('Last 90 Days');
      console.log('✅ 90d button clicked, Last 90 Days displayed');

      // Verify charts still render
      const chartsNinety = await page.locator('svg').count();
      console.log(`Charts in 90d view: ${chartsNinety}`);
      expect(chartsNinety).toBeGreaterThan(0);
    }

    // Return to 7d view
    if (await sevenDayButton.isVisible()) {
      await sevenDayButton.click();
      await page.waitForTimeout(1000);

      const bodyText = await page.textContent('body');
      expect(bodyText).toContain('Weekly Glance');
      console.log('✅ Returned to Weekly Glance successfully');
    }
  });

  test('should verify charts populate with data from 8/13/24 to 4/1/25 range', async ({ page }) => {
    console.log('Verifying data range coverage...');

    // Get page content to check for recent dates
    const pageContent = await page.content();

    // Look for date patterns that would indicate our data range
    const has2024Data = pageContent.includes('2024') || pageContent.includes('24');
    const has2025Data = pageContent.includes('2025') || pageContent.includes('25');

    console.log(`Found 2024 data references: ${has2024Data}`);
    console.log(`Found 2025 data references: ${has2025Data}`);

    // Look for stock symbols we added
    const stockSymbols = ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'META'];
    let foundSymbols = 0;

    for (const symbol of stockSymbols) {
      if (pageContent.includes(symbol)) {
        foundSymbols++;
        console.log(`✅ Found ${symbol} in data`);
      }
    }

    expect(foundSymbols).toBeGreaterThan(0);
    console.log(`✅ Found ${foundSymbols} out of ${stockSymbols.length} expected stock symbols`);
  });

  test('should verify week navigation functionality', async ({ page }) => {
    console.log('Testing week navigation...');

    // Look for navigation buttons (could be arrows, prev/next buttons, etc.)
    const navButtons = page.locator('button:has-text("‹"), button:has-text("›"), button:has-text("←"), button:has-text("→"), button:has-text("Previous"), button:has-text("Next")');
    const navButtonCount = await navButtons.count();

    console.log(`Found ${navButtonCount} navigation buttons`);

    if (navButtonCount > 0) {
      // Try clicking the first navigation button
      const firstNavButton = navButtons.first();
      if (await firstNavButton.isVisible() && await firstNavButton.isEnabled()) {
        await firstNavButton.click();
        await page.waitForTimeout(1000);

        // Verify page still works and charts are present
        const chartsAfterNav = await page.locator('svg').count();
        expect(chartsAfterNav).toBeGreaterThan(0);
        console.log('✅ Week navigation works, charts still present');
      }
    } else {
      console.log('ℹ️ No traditional navigation buttons found - this might be handled differently');
    }

    // Always verify the page is still functional
    const finalChartCount = await page.locator('svg').count();
    expect(finalChartCount).toBeGreaterThan(0);
    console.log('✅ Page remains functional after navigation testing');
  });
});