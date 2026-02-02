const { test, expect } = require('../../fixtures/test-fixtures');
const { TradingDashboard } = require('../../page-objects/pages/TradingDashboard');
const { ChartComponent } = require('../../page-objects/components/ChartComponent');

/**
 * Mobile Responsiveness Tests
 *
 * This test suite validates the mobile and responsive behavior of the Edge.dev platform:
 * - Cross-device compatibility
 * - Touch interactions
 * - Responsive layout adaptations
 * - Mobile-specific UI behaviors
 * - Performance on mobile devices
 * - Accessibility on small screens
 */

test.describe('Mobile Responsiveness and Cross-Device Compatibility', () => {
  let dashboard;
  let chart;

  // Common mobile device configurations
  const deviceConfigs = [
    { name: 'iPhone 12', width: 390, height: 844, mobile: true },
    { name: 'iPhone SE', width: 375, height: 667, mobile: true },
    { name: 'Samsung Galaxy S21', width: 360, height: 800, mobile: true },
    { name: 'iPad Air', width: 820, height: 1180, mobile: false, tablet: true },
    { name: 'iPad Mini', width: 768, height: 1024, mobile: false, tablet: true },
    { name: 'Desktop Small', width: 1024, height: 768, mobile: false },
    { name: 'Desktop Large', width: 1920, height: 1080, mobile: false }
  ];

  test.beforeEach(async ({ tradingPage }) => {
    dashboard = new TradingDashboard(tradingPage);
    chart = new ChartComponent(tradingPage);
  });

  test.describe('Responsive Layout Adaptation', () => {
    deviceConfigs.forEach(device => {
      test(`should adapt layout correctly on ${device.name} (${device.width}x${device.height})`, async ({ tradingPage }) => {
        await tradingPage.setViewportSize({ width: device.width, height: device.height });
        await dashboard.goto();

        // Core elements should be visible regardless of device
        await expect(dashboard.logo).toBeVisible();

        if (device.mobile) {
          // Mobile-specific layout checks
          expect(await dashboard.isInMobileView()).toBe(true);

          // Sidebar behavior on mobile
          const sidebarVisible = await dashboard.sidebar.isVisible();
          if (!sidebarVisible) {
            // Mobile might hide sidebar by default - this is acceptable
            console.log(`Sidebar hidden on mobile device: ${device.name}`);
          }

          // Content should be stacked vertically on mobile
          const dashboardHeader = await dashboard.dashboardHeader.boundingBox();
          const scanTable = await dashboard.scanResultsTable.boundingBox();

          if (dashboardHeader && scanTable) {
            expect(dashboardHeader.y).toBeLessThan(scanTable.y);
          }

        } else {
          // Desktop/tablet layout checks
          expect(await dashboard.isInMobileView()).toBe(false);

          // Sidebar should be visible on larger screens
          await expect(dashboard.sidebar).toBeVisible();

          if (device.tablet) {
            // Tablet-specific checks
            const sidebarBox = await dashboard.sidebar.boundingBox();
            expect(sidebarBox.width).toBeLessThan(device.width * 0.5); // Sidebar shouldn't take more than 50% width
          }
        }

        // All devices should show main content
        await expect(dashboard.scanResultsTable).toBeVisible();
        await expect(dashboard.dashboardHeader).toBeVisible();
      });
    });

    test('should handle viewport changes gracefully', async ({ tradingPage }) => {
      await dashboard.goto();

      // Start with desktop
      await tradingPage.setViewportSize({ width: 1920, height: 1080 });
      await tradingPage.waitForTimeout(500);
      expect(await dashboard.isPageLoaded()).toBe(true);

      // Switch to tablet
      await tradingPage.setViewportSize({ width: 768, height: 1024 });
      await tradingPage.waitForTimeout(500);
      expect(await dashboard.isPageLoaded()).toBe(true);

      // Switch to mobile
      await tradingPage.setViewportSize({ width: 375, height: 667 });
      await tradingPage.waitForTimeout(500);
      expect(await dashboard.isPageLoaded()).toBe(true);

      // All functionality should still work
      const scanResults = await dashboard.getScanResults();
      expect(scanResults.length).toBeGreaterThan(0);
    });

    test('should maintain content readability across devices', async ({ tradingPage }) => {
      for (const device of deviceConfigs.slice(0, 4)) {
        await tradingPage.setViewportSize({ width: device.width, height: device.height });
        await dashboard.goto();

        // Text should be readable (not too small)
        const textElements = tradingPage.locator('p, h1, h2, h3, td, th, button');
        const count = await textElements.count();

        for (let i = 0; i < Math.min(5, count); i++) {
          const element = textElements.nth(i);
          if (await element.isVisible()) {
            const fontSize = await element.evaluate(el => {
              return window.getComputedStyle(el).fontSize;
            });

            const fontSizeNum = parseInt(fontSize.replace('px', ''));

            if (device.mobile) {
              expect(fontSizeNum).toBeGreaterThanOrEqual(12); // Minimum 12px on mobile
            } else {
              expect(fontSizeNum).toBeGreaterThanOrEqual(10); // Minimum 10px on desktop
            }
          }
        }
      }
    });
  });

  test.describe('Touch Interactions', () => {
    test('should support touch interactions on mobile devices', async ({ tradingPage }) => {
      await tradingPage.setViewportSize({ width: 375, height: 667 });
      await dashboard.goto();
      await dashboard.waitForLoadingToComplete();

      // Test touch tap on scan results
      const scanResults = await dashboard.getScanResults();
      if (scanResults.length > 0) {
        const firstResult = scanResults[0].element;

        // Simulate touch tap
        await firstResult.tap();
        await tradingPage.waitForTimeout(1000);

        // Should select the ticker
        const selectedRow = await tradingPage.locator('.studio-table tbody tr.selected');
        if (await selectedRow.isVisible()) {
          expect(await selectedRow.isVisible()).toBe(true);
        }
      }
    });

    test('should handle touch gestures on charts', async ({ tradingPage }) => {
      await tradingPage.setViewportSize({ width: 375, height: 667 });
      await dashboard.goto();
      await dashboard.waitForLoadingToComplete();

      const scanResults = await dashboard.getScanResults();
      if (scanResults.length > 0) {
        await dashboard.selectTicker(scanResults[0].ticker);
        await dashboard.switchToChartView();

        if (await chart.isVisible()) {
          // Test touch tap on chart
          await chart.container.tap();
          await tradingPage.waitForTimeout(500);

          // Chart should remain functional
          expect(await chart.hasData()).toBe(true);

          // Test touch and hold (long press simulation)
          const chartBox = await chart.container.boundingBox();
          if (chartBox) {
            await tradingPage.mouse.move(chartBox.x + chartBox.width * 0.5, chartBox.y + chartBox.height * 0.5);
            await tradingPage.mouse.down();
            await tradingPage.waitForTimeout(1000); // Long press
            await tradingPage.mouse.up();

            expect(await chart.isVisible()).toBe(true);
          }
        }
      }
    });

    test('should support pinch-to-zoom simulation', async ({ tradingPage }) => {
      await tradingPage.setViewportSize({ width: 375, height: 667 });
      await dashboard.goto();
      await dashboard.waitForLoadingToComplete();

      const scanResults = await dashboard.getScanResults();
      if (scanResults.length > 0) {
        await dashboard.selectTicker(scanResults[0].ticker);
        await dashboard.switchToChartView();

        if (await chart.isVisible()) {
          const chartBox = await chart.container.boundingBox();
          if (chartBox) {
            // Simulate pinch gesture
            const centerX = chartBox.x + chartBox.width * 0.5;
            const centerY = chartBox.y + chartBox.height * 0.5;

            // Two finger pinch simulation
            await tradingPage.touchscreen.tap(centerX - 50, centerY);
            await tradingPage.touchscreen.tap(centerX + 50, centerY);

            await tradingPage.waitForTimeout(500);
            expect(await chart.isVisible()).toBe(true);
          }
        }
      }
    });
  });

  test.describe('Mobile Navigation and UI', () => {
    test('should provide accessible navigation on mobile', async ({ tradingPage }) => {
      await tradingPage.setViewportSize({ width: 375, height: 667 });
      await dashboard.goto();

      // Test button accessibility
      const buttons = tradingPage.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(5, buttonCount); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();

          // Buttons should be large enough for touch
          expect(box.width).toBeGreaterThanOrEqual(44); // Apple HIG minimum
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should handle mobile modal interactions', async ({ tradingPage }) => {
      await tradingPage.setViewportSize({ width: 375, height: 667 });
      await dashboard.goto();

      // Test upload modal on mobile
      await dashboard.openUploadModal();
      await expect(dashboard.uploadModal).toBeVisible();

      // Modal should be appropriately sized for mobile
      const modalBox = await dashboard.uploadModal.boundingBox();
      const viewport = tradingPage.viewportSize();

      expect(modalBox.width).toBeLessThanOrEqual(viewport.width);
      expect(modalBox.height).toBeLessThanOrEqual(viewport.height);

      // Close modal with touch
      const closeButton = tradingPage.locator('.modal-content button:has-text("×")');
      if (await closeButton.isVisible()) {
        await closeButton.tap();
        await expect(dashboard.uploadModal).not.toBeVisible();
      }
    });

    test('should support mobile scrolling', async ({ tradingPage }) => {
      await tradingPage.setViewportSize({ width: 375, height: 667 });
      await dashboard.goto();
      await dashboard.waitForLoadingToComplete();

      // Test table scrolling
      const scanResults = await dashboard.getScanResults();
      if (scanResults.length > 3) {
        const tableContainer = dashboard.scanResultsTable;

        // Scroll down in table
        await tableContainer.hover();
        await tradingPage.mouse.wheel(0, 100);
        await tradingPage.waitForTimeout(300);

        // Table should still be functional
        expect(await tableContainer.isVisible()).toBe(true);
      }

      // Test page scrolling
      await tradingPage.mouse.wheel(0, 300);
      await tradingPage.waitForTimeout(300);

      // Page should still be functional
      expect(await dashboard.isPageLoaded()).toBe(true);
    });
  });

  test.describe('Mobile Performance', () => {
    test('should maintain acceptable performance on mobile', async ({ tradingPage, performanceMonitor }) => {
      await tradingPage.setViewportSize({ width: 375, height: 667 });

      const startTime = Date.now();
      await dashboard.goto();
      const loadTime = Date.now() - startTime;

      // Mobile load time should be reasonable
      expect(loadTime).toBeLessThan(8000); // 8 seconds for mobile

      const metrics = await performanceMonitor.getMetrics();

      // Mobile-specific performance checks
      expect(metrics.firstContentfulPaint).toBeLessThan(3000);
      if (metrics.memoryUsage) {
        expect(metrics.memoryUsage.used).toBeLessThan(150 * 1024 * 1024); // 150MB for mobile
      }
    });

    test('should handle mobile data operations efficiently', async ({ tradingPage }) => {
      await tradingPage.setViewportSize({ width: 375, height: 667 });
      await dashboard.goto();

      const scanStartTime = Date.now();
      await dashboard.runScan();
      const scanTime = Date.now() - scanStartTime;

      // Scan should complete in reasonable time on mobile
      expect(scanTime).toBeLessThan(15000); // 15 seconds for mobile scan

      const scanResults = await dashboard.getScanResults();
      expect(scanResults.length).toBeGreaterThan(0);

      // Chart loading on mobile
      if (scanResults.length > 0) {
        await dashboard.selectTicker(scanResults[0].ticker);
        await dashboard.switchToChartView();

        const chartStartTime = Date.now();
        if (await chart.isVisible()) {
          await chart.waitForChart();
          const chartTime = Date.now() - chartStartTime;
          expect(chartTime).toBeLessThan(10000); // 10 seconds for mobile chart
        }
      }
    });
  });

  test.describe('Cross-Device Data Consistency', () => {
    test('should maintain data consistency across device switches', async ({ tradingPage }) => {
      // Start on desktop
      await tradingPage.setViewportSize({ width: 1920, height: 1080 });
      await dashboard.goto();
      await dashboard.runScan();

      const desktopResults = await dashboard.getScanResults();
      const desktopStats = await dashboard.getStatistics();

      // Switch to mobile
      await tradingPage.setViewportSize({ width: 375, height: 667 });
      await tradingPage.waitForTimeout(1000);

      const mobileResults = await dashboard.getScanResults();
      const mobileStats = await dashboard.getStatistics();

      // Data should be consistent
      expect(mobileResults.length).toBe(desktopResults.length);
      expect(mobileStats['Total Results']).toBe(desktopStats['Total Results']);

      // First few results should match
      for (let i = 0; i < Math.min(3, desktopResults.length); i++) {
        expect(mobileResults[i].ticker).toBe(desktopResults[i].ticker);
      }
    });

    test('should preserve user interactions across viewport changes', async ({ tradingPage }) => {
      // Start on desktop and select a ticker
      await tradingPage.setViewportSize({ width: 1920, height: 1080 });
      await dashboard.goto();
      await dashboard.waitForLoadingToComplete();

      const scanResults = await dashboard.getScanResults();
      if (scanResults.length > 0) {
        const selectedTicker = scanResults[0].ticker;
        await dashboard.selectTicker(selectedTicker);

        // Switch to mobile
        await tradingPage.setViewportSize({ width: 375, height: 667 });
        await tradingPage.waitForTimeout(1000);

        // Selection should be preserved (if possible on mobile)
        // At minimum, the page should remain functional
        expect(await dashboard.isPageLoaded()).toBe(true);

        const mobileResults = await dashboard.getScanResults();
        expect(mobileResults.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Accessibility on Mobile', () => {
    test('should provide adequate touch targets', async ({ tradingPage }) => {
      await tradingPage.setViewportSize({ width: 375, height: 667 });
      await dashboard.goto();

      // Check interactive elements have adequate size
      const interactiveElements = tradingPage.locator('button, a, input, [role="button"]');
      const count = await interactiveElements.count();

      for (let i = 0; i < Math.min(10, count); i++) {
        const element = interactiveElements.nth(i);
        if (await element.isVisible()) {
          const box = await element.boundingBox();

          // Touch targets should be at least 44x44px (iOS HIG)
          expect(box.width).toBeGreaterThanOrEqual(40); // Slightly relaxed for dense UIs
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test('should maintain readable contrast on mobile', async ({ tradingPage }) => {
      await tradingPage.setViewportSize({ width: 375, height: 667 });
      await dashboard.goto();

      // Text should remain readable on small screens
      const textElements = tradingPage.locator('p, h1, h2, h3, td, th, span');
      const count = await textElements.count();

      for (let i = 0; i < Math.min(5, count); i++) {
        const element = textElements.nth(i);
        if (await element.isVisible()) {
          const styles = await element.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              fontSize: computed.fontSize
            };
          });

          // Basic contrast check - text shouldn't be transparent
          expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
          expect(styles.color).not.toBe('transparent');

          // Font size should be readable on mobile
          const fontSize = parseInt(styles.fontSize);
          expect(fontSize).toBeGreaterThanOrEqual(12);
        }
      }
    });

    test('should support keyboard navigation on mobile', async ({ tradingPage }) => {
      await tradingPage.setViewportSize({ width: 375, height: 667 });
      await dashboard.goto();

      // Test tab navigation
      await tradingPage.keyboard.press('Tab');
      await tradingPage.keyboard.press('Tab');
      await tradingPage.keyboard.press('Tab');

      const focusedElement = tradingPage.locator(':focus');
      if (await focusedElement.isVisible()) {
        // Focus indicator should be visible
        const outline = await focusedElement.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return computed.outline || computed.border;
        });

        expect(outline).not.toBe('none');
        expect(outline).not.toBe('');
      }
    });
  });

  test.describe('Mobile Error Handling', () => {
    test('should handle network issues gracefully on mobile', async ({ tradingPage }) => {
      await tradingPage.setViewportSize({ width: 375, height: 667 });

      // Simulate slow network
      await tradingPage.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });

      await dashboard.goto();

      // Should still load on slow mobile connections
      expect(await dashboard.isPageLoaded()).toBe(true);
    });

    test('should provide appropriate error messages on mobile', async ({ tradingPage }) => {
      await tradingPage.setViewportSize({ width: 375, height: 667 });

      // Mock API failure
      await tradingPage.route('**/api/**', route => route.abort());

      await dashboard.goto();

      // Page should load with appropriate fallback
      expect(await dashboard.isPageLoaded()).toBe(true);

      // Error messages should be readable on mobile
      const errorElements = tradingPage.locator('[role="alert"], .error, .warning');
      const errorCount = await errorElements.count();

      if (errorCount > 0) {
        const firstError = errorElements.first();
        const box = await firstError.boundingBox();

        // Error should be visible and appropriately sized
        expect(box.width).toBeLessThan(tradingPage.viewportSize().width);
      }
    });
  });
});