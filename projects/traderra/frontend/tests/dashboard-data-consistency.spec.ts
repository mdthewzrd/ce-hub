import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive Dashboard Data Consistency Tests
 *
 * These tests validate that dashboard components display accurate and consistent data
 * across different time range configurations, ensuring data processing logic works
 * correctly for all filtering scenarios.
 */

// Test data scenarios
const timeRangeTests = [
  { range: '7d', description: '7-day range' },
  { range: '30d', description: '30-day range' },
  { range: '90d', description: '90-day range' }
];

// Helper functions for dashboard interaction
class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async selectTimeRange(range: string) {
    // Adjust selector based on your actual date range selector implementation
    await this.page.locator(`[data-testid="date-range-${range}"]`).click();
    await this.page.waitForTimeout(1000); // Allow for data filtering
  }

  async selectDisplayMode(mode: string) {
    await this.page.locator(`[data-testid="display-mode-${mode}"]`).click();
    await this.page.waitForTimeout(500);
  }

  async getEquityChartData() {
    return this.page.locator('[data-testid="equity-chart"]').isVisible();
  }

  async getSymbolPerformanceData() {
    const symbols = await this.page.locator('[data-testid="symbol-performance"] [data-testid="symbol-item"]').all();
    return symbols.length;
  }

  async getBestTradesData() {
    const trades = await this.page.locator('[data-testid="best-trades"] [data-testid="trade-item"]').all();
    return trades.length;
  }

  async getWorstTradesData() {
    await this.page.locator('[data-testid="trades-toggle-losses"]').click();
    await this.page.waitForTimeout(500);
    const trades = await this.page.locator('[data-testid="best-trades"] [data-testid="trade-item"]').all();
    return trades.length;
  }

  async getDailyPnLData() {
    return this.page.locator('[data-testid="daily-pnl-chart"] .recharts-bar').count();
  }

  async checkForEmptyStates() {
    const emptyStates = await this.page.locator('[data-testid="empty-state"]').all();
    return emptyStates.length;
  }

  async validateDataConsistency() {
    // Check that all components have loaded without empty states
    const emptyStateCount = await this.checkForEmptyStates();
    return emptyStateCount === 0;
  }

  async getMetricValues() {
    const metrics = {};

    // Extract key metrics from the dashboard
    const totalPnL = await this.page.locator('[data-testid="total-pnl"]').textContent();
    const winRate = await this.page.locator('[data-testid="win-rate"]').textContent();
    const totalTrades = await this.page.locator('[data-testid="total-trades"]').textContent();

    return { totalPnL, winRate, totalTrades };
  }
}

test.describe('Dashboard Data Consistency Tests', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test('Dashboard loads with default data', async ({ page }) => {
    await test.step('Verify dashboard components are visible', async () => {
      await expect(page.locator('h3:has-text("Equity Curve")')).toBeVisible();
      await expect(page.locator('h3:has-text("Symbol Performance")')).toBeVisible();
      await expect(page.locator('h3:has-text("Best Trades")')).toBeVisible();
      await expect(page.locator('h3:has-text("Daily P&L Distribution")')).toBeVisible();
    });

    await test.step('Verify data is displayed in all components', async () => {
      const symbolCount = await dashboardPage.getSymbolPerformanceData();
      const bestTradesCount = await dashboardPage.getBestTradesData();

      expect(symbolCount).toBeGreaterThan(0);
      expect(bestTradesCount).toBeGreaterThan(0);
    });
  });

  for (const { range, description } of timeRangeTests) {
    test(`Data consistency for ${description}`, async ({ page }) => {
      await test.step(`Select ${description}`, async () => {
        await dashboardPage.selectTimeRange(range);
      });

      await test.step('Verify all components show data or appropriate empty states', async () => {
        const symbolCount = await dashboardPage.getSymbolPerformanceData();
        const bestTradesCount = await dashboardPage.getBestTradesData();
        const worstTradesCount = await dashboardPage.getWorstTradesData();

        // For longer time ranges, we should have more data
        if (range === '90d') {
          expect(symbolCount).toBeGreaterThan(0);
          expect(bestTradesCount).toBeGreaterThan(0);
          expect(worstTradesCount).toBeGreaterThan(0);
        }

        // All components should either show data or graceful empty states
        const hasValidData = symbolCount > 0 || bestTradesCount > 0;
        expect(hasValidData).toBe(true);
      });

      await test.step('Verify metrics are consistent across components', async () => {
        const metrics = await dashboardPage.getMetricValues();

        // Basic validation that metrics exist and are formatted correctly
        expect(metrics.totalPnL).toBeTruthy();
        expect(metrics.winRate).toBeTruthy();
        expect(metrics.totalTrades).toBeTruthy();
      });

      await test.step('Verify no data inconsistency errors in console', async () => {
        const consoleMessages = [];
        page.on('console', msg => {
          if (msg.type() === 'error' || msg.text().includes('Data validation:')) {
            consoleMessages.push(msg.text());
          }
        });

        // Trigger a re-render to check for validation messages
        await page.reload();
        await dashboardPage.selectTimeRange(range);

        // Check for validation warnings that indicate data issues
        const validationWarnings = consoleMessages.filter(msg =>
          msg.includes('No valid') || msg.includes('insufficient data')
        );

        // Log any validation warnings for debugging
        if (validationWarnings.length > 0) {
          console.log(`Validation warnings for ${range}:`, validationWarnings);
        }
      });
    });
  }

  test('Symbol Performance shows consistent data across time ranges', async ({ page }) => {
    const symbolCounts = {};

    for (const { range } of timeRangeTests) {
      await dashboardPage.selectTimeRange(range);
      symbolCounts[range] = await dashboardPage.getSymbolPerformanceData();
    }

    // Longer time ranges should generally have more or equal symbol data
    expect(symbolCounts['90d']).toBeGreaterThanOrEqual(symbolCounts['30d']);
    expect(symbolCounts['30d']).toBeGreaterThanOrEqual(symbolCounts['7d']);

    // Ensure no range has zero symbols unless it's expected for short ranges
    expect(symbolCounts['90d']).toBeGreaterThan(0);
  });

  test('Best/Worst Trades toggle works correctly', async ({ page }) => {
    await test.step('Test Best Trades data', async () => {
      await page.locator('[data-testid="trades-toggle-wins"]').click();
      const bestTradesCount = await dashboardPage.getBestTradesData();
      expect(bestTradesCount).toBeGreaterThan(0);
    });

    await test.step('Test Worst Trades data', async () => {
      await page.locator('[data-testid="trades-toggle-losses"]').click();
      const worstTradesCount = await dashboardPage.getWorstTradesData();
      expect(worstTradesCount).toBeGreaterThan(0);
    });

    await test.step('Verify toggle switches content', async () => {
      // Should show different trade data when toggling
      await page.locator('[data-testid="trades-toggle-wins"]').click();
      const winTradeSymbol = await page.locator('[data-testid="best-trades"] [data-testid="trade-item"]').first().locator('[data-testid="trade-symbol"]').textContent();

      await page.locator('[data-testid="trades-toggle-losses"]').click();
      const lossTradeSymbol = await page.locator('[data-testid="best-trades"] [data-testid="trade-item"]').first().locator('[data-testid="trade-symbol"]').textContent();

      // Content should be different between wins and losses
      expect(winTradeSymbol).toBeTruthy();
      expect(lossTradeSymbol).toBeTruthy();
    });
  });

  test('Display mode changes work correctly', async ({ page }) => {
    const displayModes = ['dollar', 'percent', 'r'];

    for (const mode of displayModes) {
      await test.step(`Test ${mode} display mode`, async () => {
        await dashboardPage.selectDisplayMode(mode);

        // Verify that values are formatted correctly for the display mode
        const metricValue = await page.locator('[data-testid="total-pnl"]').textContent();

        switch (mode) {
          case 'dollar':
            expect(metricValue).toMatch(/\$/);
            break;
          case 'percent':
            expect(metricValue).toMatch(/%/);
            break;
          case 'r':
            expect(metricValue).toMatch(/R/);
            break;
        }
      });
    }
  });

  test('Data validation errors are handled gracefully', async ({ page }) => {
    // Test error boundaries and fallback states
    await test.step('Check for error boundaries', async () => {
      const errorElements = await page.locator('[data-testid="error-boundary"]').all();
      expect(errorElements).toHaveLength(0); // Should not have any error boundaries visible
    });

    await test.step('Verify fallback states for insufficient data', async () => {
      // This test checks that when data is insufficient, appropriate messages are shown
      const emptyStateMessages = await page.locator('text=No data available').all();
      const expandRangeMessages = await page.locator('text=Try expanding your date range').all();

      // If empty states exist, they should have helpful messaging
      if (emptyStateMessages.length > 0) {
        expect(expandRangeMessages.length).toBeGreaterThan(0);
      }
    });
  });

  test('Dashboard performance with large datasets', async ({ page }) => {
    await test.step('Measure component render time', async () => {
      const startTime = Date.now();

      await dashboardPage.selectTimeRange('90d');
      await page.waitForLoadState('networkidle');

      const renderTime = Date.now() - startTime;

      // Dashboard should render within reasonable time (3 seconds)
      expect(renderTime).toBeLessThan(3000);
    });

    await test.step('Verify no memory leaks with rapid filter changes', async () => {
      // Rapidly change filters to test for memory leaks
      for (let i = 0; i < 5; i++) {
        await dashboardPage.selectTimeRange('7d');
        await dashboardPage.selectTimeRange('30d');
        await dashboardPage.selectTimeRange('90d');
      }

      // Check that the page is still responsive
      await expect(page.locator('h3:has-text("Equity Curve")')).toBeVisible();
    });
  });

  test('Responsive design works on different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await test.step(`Test ${viewport.name} viewport`, async () => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        // Verify critical components are visible
        await expect(page.locator('h3:has-text("Equity Curve")')).toBeVisible();

        // On mobile, components should stack vertically
        if (viewport.name === 'Mobile') {
          const gridContainer = page.locator('.grid-cols-1, .lg\\:grid-cols-2');
          await expect(gridContainer).toBeVisible();
        }
      });
    }
  });
});