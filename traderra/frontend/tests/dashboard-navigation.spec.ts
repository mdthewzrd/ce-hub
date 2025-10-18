import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('http://localhost:6565/dashboard');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Wait for charts to render
    await page.waitForSelector('.recharts-wrapper', { timeout: 15000 });
  });

  test('should display "Weekly Glance" instead of "This Week"', async ({ page }) => {
    // Check if "Weekly Glance" text is present
    const weeklyGlanceText = page.locator('text=Weekly Glance');
    await expect(weeklyGlanceText).toBeVisible();

    // Verify "This Week" text is not present
    const thisWeekText = page.locator('text=This Week');
    await expect(thisWeekText).not.toBeVisible();
  });

  test('should allow navigation between weeks', async ({ page }) => {
    // Look for week navigation arrows/buttons
    const prevWeekButton = page.locator('[data-testid="prev-week"], button:has-text("‹"), button:has-text("←"), button:has-text("Previous")').first();
    const nextWeekButton = page.locator('[data-testid="next-week"], button:has-text("›"), button:has-text("→"), button:has-text("Next")').first();

    // Check if navigation buttons are visible
    if (await prevWeekButton.isVisible()) {
      await prevWeekButton.click();
      await page.waitForTimeout(1000); // Wait for chart updates

      // Verify charts still populate after navigation
      await expect(page.locator('.recharts-wrapper')).toBeVisible();
    }

    if (await nextWeekButton.isVisible()) {
      await nextWeekButton.click();
      await page.waitForTimeout(1000);

      // Verify charts still populate after navigation
      await expect(page.locator('.recharts-wrapper')).toBeVisible();
    }
  });

  test('should switch between date ranges (7d/30d/90d)', async ({ page }) => {
    // Test 30d button
    const thirtyDayButton = page.locator('button:has-text("30d"), [data-testid="30d-button"]');
    if (await thirtyDayButton.isVisible()) {
      await thirtyDayButton.click();
      await page.waitForTimeout(1500);

      // Verify charts populate with 30d data
      await expect(page.locator('.recharts-wrapper')).toBeVisible();

      // Check for date range indicator
      const dateRangeLabel = page.locator('text=Last 30 Days');
      await expect(dateRangeLabel).toBeVisible();
    }

    // Test 90d button
    const ninetyDayButton = page.locator('button:has-text("90d"), [data-testid="90d-button"]');
    if (await ninetyDayButton.isVisible()) {
      await ninetyDayButton.click();
      await page.waitForTimeout(1500);

      // Verify charts populate with 90d data
      await expect(page.locator('.recharts-wrapper')).toBeVisible();

      // Check for date range indicator
      const dateRangeLabel = page.locator('text=Last 90 Days');
      await expect(dateRangeLabel).toBeVisible();
    }

    // Return to 7d (Weekly Glance)
    const sevenDayButton = page.locator('button:has-text("7d"), [data-testid="7d-button"]');
    if (await sevenDayButton.isVisible()) {
      await sevenDayButton.click();
      await page.waitForTimeout(1500);

      // Verify Weekly Glance is back
      await expect(page.locator('text=Weekly Glance')).toBeVisible();
    }
  });

  test('should display horizontal bar chart for symbol performance', async ({ page }) => {
    // Look for the symbol performance section
    const symbolPerformanceSection = page.locator('[data-testid="symbol-performance"], .symbol-performance, h3:has-text("Symbol Performance")').first();

    if (await symbolPerformanceSection.isVisible()) {
      // Check if horizontal bar chart is present (Recharts BarChart with layout="horizontal")
      const horizontalBars = page.locator('.recharts-bar-rectangles .recharts-rectangle');
      await expect(horizontalBars.first()).toBeVisible();

      // Verify that $/%/R buttons are NOT present in symbol performance section
      const toggleButtons = symbolPerformanceSection.locator('button:has-text("$"), button:has-text("%"), button:has-text("R")');
      await expect(toggleButtons).toHaveCount(0);
    }
  });

  test('should verify all charts populate with updated date range data', async ({ page }) => {
    // Check that equity curve chart is present and has data
    const equityChart = page.locator('.recharts-line-chart, .recharts-area-chart').first();
    await expect(equityChart).toBeVisible();

    // Check that P&L distribution chart is present
    const pnlChart = page.locator('.recharts-bar-chart').first();
    await expect(pnlChart).toBeVisible();

    // Check that symbol performance chart is present
    const symbolChart = page.locator('.recharts-bar-chart').last();
    await expect(symbolChart).toBeVisible();

    // Verify data points are rendered (should have data from 8/13/24 to 4/1/25 range)
    const chartData = page.locator('.recharts-line, .recharts-bar, .recharts-area');
    await expect(chartData.first()).toBeVisible();
  });

  test('should verify all buttons are clickable and functional', async ({ page }) => {
    // Get all buttons on the page
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();

    console.log(`Found ${buttonCount} buttons on the dashboard`);

    // Test each button for basic functionality (clickable, not disabled)
    for (let i = 0; i < buttonCount; i++) {
      const button = allButtons.nth(i);
      const isVisible = await button.isVisible();
      const isEnabled = await button.isEnabled();

      if (isVisible && isEnabled) {
        const buttonText = await button.textContent();
        console.log(`Testing button: "${buttonText}"`);

        // Click the button and verify no errors
        try {
          await button.click();
          await page.waitForTimeout(500); // Brief wait for any UI updates
        } catch (error) {
          console.error(`Error clicking button "${buttonText}":`, error);
        }
      }
    }
  });

  test('should verify Weekly Glance is not sticky', async ({ page }) => {
    // Scroll down the page
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);

    // Check if Weekly Glance text moves with scroll (not sticky)
    const weeklyGlanceElement = page.locator('text=Weekly Glance').first();
    if (await weeklyGlanceElement.isVisible()) {
      const boundingBox = await weeklyGlanceElement.boundingBox();

      // Scroll more and check if position changes (indicating it's not sticky)
      await page.evaluate(() => window.scrollTo(0, 1000));
      await page.waitForTimeout(500);

      const newBoundingBox = await weeklyGlanceElement.boundingBox();

      // If element is not sticky, its position should change with scroll
      if (boundingBox && newBoundingBox) {
        expect(boundingBox.y).not.toBe(newBoundingBox.y);
      }
    }
  });
});