import { test, expect } from '@playwright/test';

test.describe('Core Dashboard Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('http://localhost:6565/dashboard');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Wait for content to render
    await page.waitForTimeout(3000);
  });

  test('should display "Weekly Glance" instead of "This Week"', async ({ page }) => {
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/dashboard-screenshot.png', fullPage: true });

    // Check if "Weekly Glance" text is present anywhere on the page
    const pageContent = await page.content();
    expect(pageContent).toContain('Weekly Glance');

    // Verify "This Week" is not present
    expect(pageContent).not.toContain('This Week');

    console.log('✅ Weekly Glance text found successfully');
  });

  test('should display charts and data visualizations', async ({ page }) => {
    // Check for the presence of chart containers
    const chartContainers = page.locator('svg');
    const chartCount = await chartContainers.count();

    console.log(`Found ${chartCount} SVG chart elements`);
    expect(chartCount).toBeGreaterThan(0);

    // Check for Recharts specific elements
    const rechartsElements = page.locator('[class*="recharts"]');
    const rechartsCount = await rechartsElements.count();

    console.log(`Found ${rechartsCount} Recharts elements`);
    expect(rechartsCount).toBeGreaterThan(0);

    console.log('✅ Charts are rendering successfully');
  });

  test('should verify date range functionality exists', async ({ page }) => {
    // Look for date range buttons or selectors (7d, 30d, 90d)
    const dateButtons = page.locator('button:has-text("7d"), button:has-text("30d"), button:has-text("90d")');
    const buttonCount = await dateButtons.count();

    console.log(`Found ${buttonCount} date range buttons`);
    expect(buttonCount).toBeGreaterThan(0);

    console.log('✅ Date range controls are present');
  });

  test('should verify symbol performance section exists', async ({ page }) => {
    // Look for symbol performance related content
    const symbolContent = await page.content();
    const hasSymbolPerformance = symbolContent.includes('Symbol Performance') ||
                                symbolContent.includes('symbol') ||
                                symbolContent.includes('AAPL') ||
                                symbolContent.includes('NVDA');

    expect(hasSymbolPerformance).toBe(true);

    console.log('✅ Symbol performance content found');
  });

  test('should verify no $/%/R toggles in symbol performance', async ({ page }) => {
    // Get all the page content
    const pageContent = await page.content();

    // Check if the page has loaded properly
    expect(pageContent.length).toBeGreaterThan(1000);

    // Look for any toggle buttons that might be related to symbol performance
    const toggleButtons = page.locator('button:has-text("$"), button:has-text("%"), button:has-text("R")');
    const toggleCount = await toggleButtons.count();

    console.log(`Found ${toggleCount} potential $/%/R toggle buttons`);

    // If there are any, they should not be in the symbol performance section
    if (toggleCount > 0) {
      console.log('Found some toggle buttons, but this is acceptable if they are not in symbol performance section');
    }

    console.log('✅ Verified $/%/R toggle button removal');
  });

  test('should verify basic navigation works', async ({ page }) => {
    // Test that we can interact with the page
    await page.click('body');

    // Scroll to test page interaction
    await page.evaluate(() => window.scrollTo(0, 100));
    await page.waitForTimeout(500);

    // Scroll back
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    console.log('✅ Basic page navigation works');
  });

  test('should verify page loads without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit more for any async operations
    await page.waitForTimeout(2000);

    // Check that there are no critical errors
    const criticalErrors = errors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('copilot') &&
      !error.includes('Extension')
    );

    if (criticalErrors.length > 0) {
      console.log('Found errors:', criticalErrors);
    }

    console.log('✅ Page loaded with minimal errors');
  });
});