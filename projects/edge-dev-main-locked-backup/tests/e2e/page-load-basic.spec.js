const { test, expect } = require('../fixtures/test-fixtures');
const { TradingDashboard } = require('../page-objects/pages/TradingDashboard');

/**
 * Page Load and Basic Functionality Tests
 *
 * This test suite validates the core functionality of the Edge.dev trading platform:
 * - Application loading and initial state
 * - Basic navigation and UI elements
 * - Page structure and accessibility
 * - Error handling and resilience
 */

test.describe('Edge.dev Trading Platform - Page Load & Basic Functionality', () => {
  let dashboard;

  test.beforeEach(async ({ tradingPage }) => {
    dashboard = new TradingDashboard(tradingPage);
  });

  test.describe('Application Loading', () => {
    test('should load the main trading dashboard successfully', async ({ tradingPage }) => {
      await dashboard.goto();

      // Verify page loads completely
      expect(await dashboard.isPageLoaded()).toBe(true);

      // Check page title
      const title = await dashboard.getPageTitle();
      expect(title).toContain('Traderra');

      // Verify URL is correct
      const url = await dashboard.getCurrentURL();
      expect(url).toMatch(/localhost:5657/);
    });

    test('should display all critical UI elements', async ({ tradingPage }) => {
      await dashboard.goto();

      // Logo and branding
      await expect(dashboard.logo).toBeVisible();

      // Main navigation elements
      await expect(dashboard.sidebar).toBeVisible();
      await expect(dashboard.uploadCodeButton).toBeVisible();

      // Dashboard header
      await expect(dashboard.dashboardHeader).toBeVisible();

      // Scan results area
      await expect(dashboard.scanResultsTable).toBeVisible();

      // View toggle controls
      await expect(dashboard.viewToggle).toBeVisible();
    });

    test('should handle slow network conditions gracefully', async ({ tradingPage }) => {
      // Simulate slow network
      await tradingPage.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        await route.continue();
      });

      await dashboard.goto();

      // Should still load within reasonable time
      expect(await dashboard.isPageLoaded()).toBe(true);
    });

    test('should load with appropriate performance metrics', async ({ tradingPage, performanceMonitor }) => {
      await dashboard.goto();

      const metrics = await performanceMonitor.getMetrics();

      // Performance assertions
      expect(metrics.loadComplete).toBeLessThan(5000); // 5 seconds max load time
      expect(metrics.firstContentfulPaint).toBeLessThan(2000); // 2 seconds max FCP

      // Memory usage should be reasonable
      if (metrics.memoryUsage) {
        expect(metrics.memoryUsage.used).toBeLessThan(100 * 1024 * 1024); // 100MB
      }
    });
  });

  test.describe('Page Structure and Accessibility', () => {
    test('should have proper HTML structure', async ({ tradingPage }) => {
      await dashboard.goto();

      // Check semantic HTML structure
      const main = tradingPage.locator('main, [role="main"]');
      const navigation = tradingPage.locator('nav, [role="navigation"]');
      const header = tradingPage.locator('header, [role="banner"]');

      // At least one of these should exist
      const hasSemanticStructure = await main.isVisible() ||
                                   await navigation.isVisible() ||
                                   await header.isVisible();

      expect(hasSemanticStructure).toBe(true);
    });

    test('should support keyboard navigation', async ({ tradingPage }) => {
      await dashboard.goto();

      // Test keyboard navigation through interactive elements
      await tradingPage.keyboard.press('Tab');
      await tradingPage.keyboard.press('Tab');
      await tradingPage.keyboard.press('Tab');

      // Focused element should be visible
      const focusedElement = tradingPage.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should have appropriate color contrast', async ({ tradingPage }) => {
      await dashboard.goto();

      // Check that text elements have sufficient contrast
      const textElements = tradingPage.locator('p, h1, h2, h3, button, td, th');
      const count = await textElements.count();

      // Sample a few text elements to check they're readable
      expect(count).toBeGreaterThan(0);

      // Verify text is not invisible (basic contrast check)
      for (let i = 0; i < Math.min(5, count); i++) {
        const element = textElements.nth(i);
        if (await element.isVisible()) {
          const color = await element.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.color;
          });

          // Color should not be completely transparent
          expect(color).not.toBe('rgba(0, 0, 0, 0)');
          expect(color).not.toBe('transparent');
        }
      }
    });
  });

  test.describe('Initial Data and State', () => {
    test('should load with default project selected', async ({ tradingPage }) => {
      await dashboard.goto();

      const projects = await dashboard.getProjects();
      expect(projects.length).toBeGreaterThan(0);

      // One project should be active
      const activeProjects = projects.filter(p => p.active);
      expect(activeProjects.length).toBe(1);
    });

    test('should display scan results table with data', async ({ tradingPage }) => {
      await dashboard.goto();

      // Wait for scan results to load
      await dashboard.waitForLoadingToComplete();

      const scanResults = await dashboard.getScanResults();
      expect(scanResults.length).toBeGreaterThan(0);

      // Verify result structure
      const firstResult = scanResults[0];
      expect(firstResult).toHaveProperty('ticker');
      expect(firstResult).toHaveProperty('gapPercent');
      expect(firstResult).toHaveProperty('volume');
      expect(firstResult).toHaveProperty('rMultiple');

      // Verify data is reasonable
      expect(firstResult.ticker).toMatch(/^[A-Z]{1,5}$/); // Valid ticker format
    });

    test('should have statistics panel with valid data', async ({ tradingPage }) => {
      await dashboard.goto();
      await dashboard.waitForLoadingToComplete();

      const stats = await dashboard.getStatistics();

      // Check for required statistics
      expect(stats).toHaveProperty('Total Results');
      expect(stats).toHaveProperty('Avg Gap %');

      // Validate data format
      const totalResults = parseInt(stats['Total Results']);
      expect(totalResults).toBeGreaterThan(0);

      const avgGap = stats['Avg Gap %'];
      expect(avgGap).toMatch(/\d+\.?\d*%/); // Format like "5.2%"
    });

    test('should initialize in table view mode by default', async ({ tradingPage }) => {
      await dashboard.goto();

      const currentView = await dashboard.getCurrentViewMode();
      expect(currentView).toBe('table');

      // Table should be more prominent than chart
      const tableVisible = await dashboard.scanResultsTable.isVisible();
      expect(tableVisible).toBe(true);
    });
  });

  test.describe('Basic Interactions', () => {
    test('should allow project selection', async ({ tradingPage }) => {
      await dashboard.goto();

      const projects = await dashboard.getProjects();
      if (projects.length > 1) {
        // Select a different project
        const inactiveProject = projects.find(p => !p.active);
        if (inactiveProject) {
          await dashboard.selectProject(inactiveProject.name);

          // Verify project changed
          const newActiveProject = await dashboard.getActiveProject();
          expect(newActiveProject).toContain(inactiveProject.name);
        }
      }
    });

    test('should support view mode switching', async ({ tradingPage }) => {
      await dashboard.goto();

      // Switch to chart view
      await dashboard.switchToChartView();
      let currentView = await dashboard.getCurrentViewMode();
      expect(currentView).toBe('chart');

      // Switch back to table view
      await dashboard.switchToTableView();
      currentView = await dashboard.getCurrentViewMode();
      expect(currentView).toBe('table');
    });

    test('should allow ticker selection from scan results', async ({ tradingPage }) => {
      await dashboard.goto();
      await dashboard.waitForLoadingToComplete();

      const scanResults = await dashboard.getScanResults();
      if (scanResults.length > 0) {
        const firstTicker = scanResults[0].ticker;

        // Select ticker while in table view
        await dashboard.selectTicker(firstTicker);

        // Switch to chart view to see the chart for selected ticker
        await dashboard.switchToChartView();

        // Verify chart container is present and visible (simplified check for parallel execution)
        await expect(dashboard.chartContainer).toBeVisible({ timeout: 10000 });

        // Verify we're in chart mode
        const currentView = await dashboard.getCurrentViewMode();
        expect(currentView).toBe('chart');
      }
    });

    test('should handle upload code modal', async ({ tradingPage }) => {
      await dashboard.goto();

      await dashboard.openUploadModal();

      // Modal should be visible
      await expect(dashboard.uploadModal).toBeVisible();

      // Close modal
      await tradingPage.keyboard.press('Escape');
      await expect(dashboard.uploadModal).not.toBeVisible();
    });
  });

  test.describe('Error Handling and Resilience', () => {
    test('should handle API failures gracefully', async ({ tradingPage }) => {
      // Mock API failures
      await tradingPage.route('**/api/**', route => route.abort());

      await dashboard.goto();

      // Page should still load even with API failures
      expect(await dashboard.isPageLoaded()).toBe(true);

      // Should show appropriate messaging or fallback data
      const hasContent = await dashboard.scanResultsTable.isVisible();
      expect(hasContent).toBe(true);
    });

    test('should handle missing data scenarios', async ({ tradingPage }) => {
      // Mock empty data responses
      await tradingPage.route('**/api/**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await dashboard.goto();

      // Should handle empty state gracefully
      expect(await dashboard.isPageLoaded()).toBe(true);
    });

    test('should recover from temporary network issues', async ({ tradingPage }) => {
      let failCount = 0;

      // Fail first 2 requests, then succeed
      await tradingPage.route('**/api/**', route => {
        if (failCount < 2) {
          failCount++;
          route.abort();
        } else {
          route.continue();
        }
      });

      await dashboard.goto();

      // Should eventually load successfully
      expect(await dashboard.isPageLoaded()).toBe(true);
    });

    test('should maintain functionality after page refresh', async ({ tradingPage }) => {
      await dashboard.goto();

      // Interact with the page
      const scanResults = await dashboard.getScanResults();
      if (scanResults.length > 0) {
        await dashboard.selectTicker(scanResults[0].ticker);
      }

      // Refresh page
      await tradingPage.reload();

      // Should restore to working state
      expect(await dashboard.isPageLoaded()).toBe(true);
      const newScanResults = await dashboard.getScanResults();
      expect(newScanResults.length).toBeGreaterThan(0);
    });
  });

  test.describe('Responsive Design Basics', () => {
    test('should adapt to different viewport sizes', async ({ tradingPage }) => {
      // Test desktop size
      await tradingPage.setViewportSize({ width: 1920, height: 1080 });
      await dashboard.goto();
      expect(await dashboard.isPageLoaded()).toBe(true);

      // Test tablet size
      await tradingPage.setViewportSize({ width: 1024, height: 768 });
      await tradingPage.waitForTimeout(500);
      expect(await dashboard.sidebar.isVisible()).toBe(true);

      // Test mobile size
      await tradingPage.setViewportSize({ width: 375, height: 667 });
      await tradingPage.waitForTimeout(500);
      expect(await dashboard.isPageLoaded()).toBe(true);
    });

    test('should maintain functionality on mobile', async ({ tradingPage }) => {
      await tradingPage.setViewportSize({ width: 375, height: 667 });
      await dashboard.goto();

      expect(await dashboard.isInMobileView()).toBe(true);

      // Core functionality should still work
      const scanResults = await dashboard.getScanResults();
      expect(scanResults.length).toBeGreaterThan(0);
    });
  });
});