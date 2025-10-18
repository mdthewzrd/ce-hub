import { test, expect, Page } from '@playwright/test';

// Configuration for the correct test URL
const TEST_URL = 'http://localhost:6565/statistics';

/**
 * Comprehensive Playwright test for Traderra Trading Statistics page
 *
 * This test validates:
 * 1. Page navigation and loading
 * 2. 3-tab navigation structure (Overview, Analytics, Performance)
 * 3. TraderVueDetailedStats 3-column grid layout
 * 4. CSS classes and styling validation
 * 5. Responsive behavior
 * 6. Interactive elements functionality
 * 7. Console error detection
 * 8. Screenshot capture for visual validation
 */

test.describe('Traderra Statistics Page Layout Validation', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the statistics page
    await page.goto(TEST_URL);

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Wait for React to hydrate
    await page.waitForTimeout(2000);
  });

  test('should load the statistics page successfully', async ({ page }) => {
    // Verify page title contains "Trading Statistics"
    await expect(page.locator('h1')).toContainText('Trading Statistics');

    // Check that the page is accessible
    const response = await page.goto(TEST_URL);
    expect(response?.status()).toBe(200);
  });

  test('should display 3-tab navigation (Overview, Analytics, Performance)', async ({ page }) => {
    // Locate the tab navigation container
    const tabNavigation = page.locator('[class*="flex space-x-6"]');

    // Verify all three tabs are present
    const overviewTab = page.locator('button', { hasText: 'Overview' });
    const analyticsTab = page.locator('button', { hasText: 'Analytics' });
    const performanceTab = page.locator('button', { hasText: 'Performance' });

    await expect(overviewTab).toBeVisible();
    await expect(analyticsTab).toBeVisible();
    await expect(performanceTab).toBeVisible();

    // Verify Overview tab is active by default
    await expect(overviewTab).toHaveClass(/border-primary.*text-primary/);
  });

  test('should validate TraderVueDetailedStats 3-column grid layout', async ({ page }) => {
    // Locate the main stats grid container
    const statsContainer = page.locator('.grid.grid-cols-1.md\\:grid-cols-3');

    // Verify the grid container exists
    await expect(statsContainer).toBeVisible();

    // Verify the grid has the correct CSS classes
    await expect(statsContainer).toHaveClass(/grid.*grid-cols-1.*md:grid-cols-3.*gap-0.*border.*border-studio-border.*rounded-lg.*overflow-hidden/);

    // Verify there are exactly 3 columns
    const columns = statsContainer.locator('> div');
    await expect(columns).toHaveCount(3);

    // Verify each column has the correct structure
    const leftColumn = columns.nth(0);
    const centerColumn = columns.nth(1);
    const rightColumn = columns.nth(2);

    // Check left column has border-r class
    await expect(leftColumn).toHaveClass(/border-r.*border-studio-border/);

    // Check center column has border-r class
    await expect(centerColumn).toHaveClass(/border-r.*border-studio-border/);

    // Check right column doesn't have border-r (last column)
    await expect(rightColumn).not.toHaveClass(/border-r/);

    // Verify each column contains statistical data
    const leftColumnStats = leftColumn.locator('.flex.justify-between.items-center');
    const centerColumnStats = centerColumn.locator('.flex.justify-between.items-center');
    const rightColumnStats = rightColumn.locator('.flex.justify-between.items-center');

    await expect(leftColumnStats).toHaveCount(10); // Expected number of stats in left column
    await expect(centerColumnStats).toHaveCount(10); // Expected number of stats in center column
    await expect(rightColumnStats).toHaveCount(10); // Expected number of stats in right column
  });

  test('should validate individual stat row borders', async ({ page }) => {
    const statsContainer = page.locator('.grid.grid-cols-1.md\\:grid-cols-3');

    // Get all stat rows within the grid
    const statRows = statsContainer.locator('.flex.justify-between.items-center.py-3');

    // Verify stat rows have border-b class (except the last in each column)
    const rowsWithBorder = statsContainer.locator('.border-b.border-studio-border\\/50');

    // Should have border-bottom on most rows (not the last row in each column)
    expect(await rowsWithBorder.count()).toBeGreaterThan(20);

    // Verify specific key metrics are visible
    await expect(page.locator('text=Total Gain/Loss:')).toBeVisible();
    await expect(page.locator('text=Largest Gain')).toBeVisible();
    await expect(page.locator('text=Largest Loss')).toBeVisible();
    await expect(page.locator('text=Maximum Drawdown')).toBeVisible();
  });

  test('should validate responsive behavior on different screen sizes', async ({ page }) => {
    // Test desktop layout (1200px)
    await page.setViewportSize({ width: 1200, height: 800 });

    const statsContainer = page.locator('.grid.grid-cols-1.md\\:grid-cols-3');

    // On desktop, should display as 3 columns side by side
    await expect(statsContainer).toHaveCSS('grid-template-columns', '1fr 1fr 1fr');

    // Test tablet layout (768px)
    await page.setViewportSize({ width: 768, height: 800 });
    await page.waitForTimeout(500); // Allow for responsive changes

    // Should still be 3 columns on md breakpoint
    await expect(statsContainer).toBeVisible();

    // Test mobile layout (375px)
    await page.setViewportSize({ width: 375, height: 800 });
    await page.waitForTimeout(500);

    // On mobile, should collapse to single column
    await expect(statsContainer).toHaveCSS('grid-template-columns', '1fr');
  });

  test('should validate tab navigation functionality', async ({ page }) => {
    // Test clicking Analytics tab
    const analyticsTab = page.locator('button', { hasText: 'Analytics' });
    await analyticsTab.click();

    // Verify Analytics tab becomes active
    await expect(analyticsTab).toHaveClass(/border-primary.*text-primary/);

    // Verify Overview tab is no longer active
    const overviewTab = page.locator('button', { hasText: 'Overview' });
    await expect(overviewTab).not.toHaveClass(/border-primary.*text-primary/);

    // Test clicking Performance tab
    const performanceTab = page.locator('button', { hasText: 'Performance' });
    await performanceTab.click();

    // Verify Performance tab becomes active
    await expect(performanceTab).toHaveClass(/border-primary.*text-primary/);

    // Return to Overview tab
    await overviewTab.click();
    await expect(overviewTab).toHaveClass(/border-primary.*text-primary/);
  });

  test('should validate chart sections with Performance/Distribution toggles', async ({ page }) => {
    // Look for chart containers with toggle buttons
    const chartContainers = page.locator('.studio-surface').filter({ hasText: 'Distribution' });

    // Should have multiple chart sections
    expect(await chartContainers.count()).toBeGreaterThan(0);

    // Find a chart with Performance/Distribution toggle
    const chartWithToggle = chartContainers.first();

    // Verify toggle buttons exist
    const performanceButton = chartWithToggle.locator('button', { hasText: 'Performance' });
    const distributionButton = chartWithToggle.locator('button', { hasText: 'Distribution' });

    if (await performanceButton.count() > 0) {
      await expect(performanceButton).toBeVisible();
      await expect(distributionButton).toBeVisible();

      // Test toggle functionality
      await distributionButton.click();
      await expect(distributionButton).toHaveClass(/bg-primary.*text-white/);

      await performanceButton.click();
      await expect(performanceButton).toHaveClass(/bg-primary.*text-white/);
    }
  });

  test('should validate date range selector is present', async ({ page }) => {
    // Look for DateRangeSelector component
    const dateRangeSelector = page.locator('[class*="date-range"], button').filter({ hasText: /date|range/i });

    // Should have some form of date range control
    expect(await dateRangeSelector.count()).toBeGreaterThan(0);
  });

  test('should check for console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Navigate and interact with the page
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    // Click through tabs to trigger any errors
    await page.locator('button', { hasText: 'Analytics' }).click();
    await page.waitForTimeout(1000);
    await page.locator('button', { hasText: 'Performance' }).click();
    await page.waitForTimeout(1000);
    await page.locator('button', { hasText: 'Overview' }).click();
    await page.waitForTimeout(1000);

    // Report errors (but don't fail the test for warnings)
    if (consoleErrors.length > 0) {
      console.log('Console Errors Found:', consoleErrors);
    }
    if (consoleWarnings.length > 0) {
      console.log('Console Warnings Found:', consoleWarnings);
    }

    // Fail test only for critical errors
    const criticalErrors = consoleErrors.filter(error =>
      !error.includes('Warning') &&
      !error.includes('favicon') &&
      !error.includes('sourcemap')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('should capture screenshots for visual validation', async ({ page }) => {
    // Full page screenshot
    await page.screenshot({
      path: 'test-results/statistics-page-full.png',
      fullPage: true
    });

    // Screenshot of the stats grid specifically
    const statsContainer = page.locator('.grid.grid-cols-1.md\\:grid-cols-3').first();
    if (await statsContainer.count() > 0) {
      await statsContainer.screenshot({
        path: 'test-results/statistics-grid-layout.png'
      });
    }

    // Test different tabs
    const tabs = ['Analytics', 'Performance'];
    for (const tabName of tabs) {
      await page.locator('button', { hasText: tabName }).click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: `test-results/statistics-${tabName.toLowerCase()}-tab.png`,
        fullPage: true
      });
    }
  });

  test('should validate specific CSS classes are applied correctly', async ({ page }) => {
    const statsContainer = page.locator('.grid.grid-cols-1.md\\:grid-cols-3').first();

    // Verify border classes
    await expect(statsContainer).toHaveClass(/border/);
    await expect(statsContainer).toHaveClass(/border-studio-border/);
    await expect(statsContainer).toHaveClass(/rounded-lg/);
    await expect(statsContainer).toHaveClass(/overflow-hidden/);

    // Verify grid classes
    await expect(statsContainer).toHaveClass(/grid/);
    await expect(statsContainer).toHaveClass(/grid-cols-1/);
    await expect(statsContainer).toHaveClass(/md:grid-cols-3/);
    await expect(statsContainer).toHaveClass(/gap-0/);

    // Verify column border classes
    const columns = statsContainer.locator('> div');
    const leftColumn = columns.nth(0);
    const centerColumn = columns.nth(1);

    await expect(leftColumn).toHaveClass(/border-r/);
    await expect(leftColumn).toHaveClass(/border-studio-border/);
    await expect(centerColumn).toHaveClass(/border-r/);
    await expect(centerColumn).toHaveClass(/border-studio-border/);
  });

  test('should validate DOM structure integrity', async ({ page }) => {
    // Verify the main page structure
    await expect(page.locator('h1')).toContainText('Trading Statistics');

    // Verify stats container structure
    const statsContainer = page.locator('.grid.grid-cols-1.md\\:grid-cols-3').first();
    await expect(statsContainer).toBeVisible();

    // Verify each column has proper content
    const columns = statsContainer.locator('> div');

    for (let i = 0; i < 3; i++) {
      const column = columns.nth(i);
      await expect(column).toBeVisible();

      // Each column should have padding
      await expect(column).toHaveClass(/p-6/);

      // Each column should contain stat rows
      const statRows = column.locator('.flex.justify-between.items-center');
      expect(await statRows.count()).toBeGreaterThan(5);
    }
  });

  test('should validate layout is not displaying as simple list', async ({ page }) => {
    const statsContainer = page.locator('.grid.grid-cols-1.md\\:grid-cols-3').first();

    // On desktop viewports, the grid should NOT be displaying as a single column
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);

    // Get computed style to check actual layout
    const gridTemplateColumns = await statsContainer.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });

    // Should be 3 equal columns, not 1 column (which would appear as a list)
    expect(gridTemplateColumns).toBe('1fr 1fr 1fr');

    // Verify the columns are actually positioned side by side
    const columns = statsContainer.locator('> div');
    const leftColumnBox = await columns.nth(0).boundingBox();
    const centerColumnBox = await columns.nth(1).boundingBox();
    const rightColumnBox = await columns.nth(2).boundingBox();

    // All columns should be visible
    expect(leftColumnBox).toBeTruthy();
    expect(centerColumnBox).toBeTruthy();
    expect(rightColumnBox).toBeTruthy();

    if (leftColumnBox && centerColumnBox && rightColumnBox) {
      // Center column should be to the right of left column
      expect(centerColumnBox.x).toBeGreaterThan(leftColumnBox.x);

      // Right column should be to the right of center column
      expect(rightColumnBox.x).toBeGreaterThan(centerColumnBox.x);

      // All columns should be roughly the same height (indicating proper grid layout)
      const heightTolerance = 50; // Allow some variation
      expect(Math.abs(leftColumnBox.height - centerColumnBox.height)).toBeLessThan(heightTolerance);
      expect(Math.abs(centerColumnBox.height - rightColumnBox.height)).toBeLessThan(heightTolerance);
    }
  });

});

// Additional helper test for development debugging
test.describe('Development Debugging Helpers', () => {
  test('should log detailed layout information for debugging', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Log detailed information about the stats container
    const statsContainer = page.locator('.grid.grid-cols-1.md\\:grid-cols-3').first();

    if (await statsContainer.count() > 0) {
      const classList = await statsContainer.getAttribute('class');
      const computedStyle = await statsContainer.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          display: style.display,
          gridTemplateColumns: style.gridTemplateColumns,
          gap: style.gap,
          border: style.border,
          borderRadius: style.borderRadius,
          overflow: style.overflow
        };
      });

      console.log('Stats Container Classes:', classList);
      console.log('Stats Container Computed Style:', computedStyle);

      // Log column information
      const columns = statsContainer.locator('> div');
      const columnCount = await columns.count();
      console.log('Number of columns found:', columnCount);

      for (let i = 0; i < columnCount; i++) {
        const column = columns.nth(i);
        const columnClass = await column.getAttribute('class');
        const columnBox = await column.boundingBox();
        console.log(`Column ${i + 1} classes:`, columnClass);
        console.log(`Column ${i + 1} bounding box:`, columnBox);
      }
    } else {
      console.log('Stats container not found!');

      // Try to find any grid elements
      const allGrids = page.locator('[class*="grid"]');
      const gridCount = await allGrids.count();
      console.log('Total grid elements found:', gridCount);

      for (let i = 0; i < Math.min(gridCount, 5); i++) {
        const grid = allGrids.nth(i);
        const gridClass = await grid.getAttribute('class');
        console.log(`Grid ${i + 1} classes:`, gridClass);
      }
    }
  });
});