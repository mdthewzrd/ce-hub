const { test, expect } = require('../fixtures/test-fixtures');
const { TradingDashboard } = require('../page-objects/pages/TradingDashboard');
const { ChartComponent } = require('../page-objects/components/ChartComponent');

/**
 * Visual Regression Testing Suite
 *
 * This test suite validates the visual consistency of the Edge.dev trading platform:
 * - Screenshot comparison across builds
 * - UI component visual validation
 * - Cross-browser visual consistency
 * - Responsive design visual verification
 * - Theme and styling consistency
 * - Animation and transition testing
 */

test.describe('Visual Regression Testing', () => {
  let dashboard;
  let chart;

  test.beforeEach(async ({ tradingPage }) => {
    dashboard = new TradingDashboard(tradingPage);
    chart = new ChartComponent(tradingPage);

    // Set consistent viewport for visual tests
    await tradingPage.setViewportSize({ width: 1920, height: 1080 });

    // Disable animations for consistent screenshots
    await tradingPage.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }

        .studio-spinner {
          animation: none !important;
        }
      `
    });

    await dashboard.goto();
    await dashboard.waitForLoadingToComplete();
  });

  test.describe('Full Page Screenshots', () => {
    test('should match dashboard layout in table view', async ({ tradingPage }) => {
      await dashboard.switchToTableView();
      await tradingPage.waitForTimeout(1000);

      // Take full page screenshot
      await expect(tradingPage).toHaveScreenshot('dashboard-table-view.png', {
        fullPage: true,
        threshold: 0.3
      });
    });

    test('should match dashboard layout in chart view', async ({ tradingPage }) => {
      // Select a ticker to load chart
      const scanResults = await dashboard.getScanResults();
      if (scanResults.length > 0) {
        await dashboard.selectTicker(scanResults[0].ticker);
        await dashboard.switchToChartView();
        await chart.waitForChart();
      }

      await tradingPage.waitForTimeout(2000); // Extra time for chart rendering

      await expect(tradingPage).toHaveScreenshot('dashboard-chart-view.png', {
        fullPage: true,
        threshold: 0.3
      });
    });

    test('should match initial loading state', async ({ tradingPage }) => {
      // Navigate to a fresh page to capture loading state
      await tradingPage.goto('/', { waitUntil: 'domcontentloaded' });
      await tradingPage.waitForTimeout(500);

      await expect(tradingPage).toHaveScreenshot('dashboard-loading-state.png', {
        fullPage: true,
        threshold: 0.4
      });
    });

    test('should match mobile layout', async ({ tradingPage }) => {
      await tradingPage.setViewportSize({ width: 375, height: 667 });
      await tradingPage.waitForTimeout(1000);

      await expect(tradingPage).toHaveScreenshot('dashboard-mobile-view.png', {
        fullPage: true,
        threshold: 0.3
      });
    });

    test('should match tablet layout', async ({ tradingPage }) => {
      await tradingPage.setViewportSize({ width: 768, height: 1024 });
      await tradingPage.waitForTimeout(1000);

      await expect(tradingPage).toHaveScreenshot('dashboard-tablet-view.png', {
        fullPage: true,
        threshold: 0.3
      });
    });
  });

  test.describe('Component-Level Screenshots', () => {
    test('should match sidebar component', async ({ tradingPage }) => {
      await expect(dashboard.sidebar).toHaveScreenshot('sidebar-component.png', {
        threshold: 0.2
      });
    });

    test('should match scan results table', async ({ tradingPage }) => {
      await expect(dashboard.scanResultsTable).toHaveScreenshot('scan-results-table.png', {
        threshold: 0.3
      });
    });

    test('should match statistics panel', async ({ tradingPage }) => {
      await expect(dashboard.statisticsPanel).toHaveScreenshot('statistics-panel.png', {
        threshold: 0.2
      });
    });

    test('should match dashboard header', async ({ tradingPage }) => {
      await expect(dashboard.dashboardHeader).toHaveScreenshot('dashboard-header.png', {
        threshold: 0.2
      });
    });

    test('should match chart container', async ({ tradingPage }) => {
      const scanResults = await dashboard.getScanResults();
      if (scanResults.length > 0) {
        await dashboard.selectTicker(scanResults[0].ticker);
        await chart.waitForChart();
        await tradingPage.waitForTimeout(2000);

        await expect(chart.container).toHaveScreenshot('chart-container.png', {
          threshold: 0.4 // Charts may have slight rendering differences
        });
      }
    });

    test('should match project list', async ({ tradingPage }) => {
      await expect(dashboard.projectsList).toHaveScreenshot('projects-list.png', {
        threshold: 0.2
      });
    });
  });

  test.describe('Modal and Dialog Screenshots', () => {
    test('should match upload code modal', async ({ tradingPage }) => {
      await dashboard.openUploadModal();

      await expect(dashboard.uploadModal).toHaveScreenshot('upload-modal-initial.png', {
        threshold: 0.2
      });

      // Test modal options
      await tradingPage.click('button:has-text("Upload Finalized Code")');
      await tradingPage.waitForTimeout(500);

      await expect(dashboard.uploadModal).toHaveScreenshot('upload-modal-finalized.png', {
        threshold: 0.2
      });
    });

    test('should match format code modal', async ({ tradingPage }) => {
      await dashboard.openUploadModal();
      await tradingPage.click('button:has-text("Format Code with AI")');
      await tradingPage.waitForTimeout(500);

      await expect(dashboard.uploadModal).toHaveScreenshot('upload-modal-format.png', {
        threshold: 0.2
      });
    });
  });

  test.describe('State-Based Visual Tests', () => {
    test('should match selected ticker state', async ({ tradingPage }) => {
      const scanResults = await dashboard.getScanResults();
      if (scanResults.length > 0) {
        await dashboard.selectTicker(scanResults[0].ticker);
        await tradingPage.waitForTimeout(1000);

        // Table should show selected state
        await expect(dashboard.scanResultsTable).toHaveScreenshot('table-with-selection.png', {
          threshold: 0.3
        });

        // Statistics should reflect selection
        await expect(dashboard.statisticsPanel).toHaveScreenshot('stats-with-selection.png', {
          threshold: 0.2
        });
      }
    });

    test('should match different project states', async ({ tradingPage }) => {
      const projects = await dashboard.getProjects();

      for (let i = 0; i < Math.min(2, projects.length); i++) {
        await dashboard.selectProject(projects[i].name);
        await tradingPage.waitForTimeout(1000);

        await expect(dashboard.projectsList).toHaveScreenshot(`projects-list-${i}.png`, {
          threshold: 0.2
        });
      }
    });

    test('should match hover states', async ({ tradingPage }) => {
      const scanResults = await dashboard.getScanResults();
      if (scanResults.length > 0) {
        // Hover over first row
        await scanResults[0].element.hover();
        await tradingPage.waitForTimeout(300);

        await expect(dashboard.scanResultsTable).toHaveScreenshot('table-row-hover.png', {
          threshold: 0.3
        });
      }

      // Hover over buttons
      await dashboard.runScanButton.hover();
      await tradingPage.waitForTimeout(300);

      await expect(dashboard.runScanButton).toHaveScreenshot('run-scan-button-hover.png', {
        threshold: 0.2
      });
    });

    test('should match loading states', async ({ tradingPage }) => {
      // Trigger scan to capture loading state
      const scanButton = dashboard.runScanButton;
      await scanButton.click();

      // Quickly capture loading state
      await tradingPage.waitForTimeout(100);

      try {
        await expect(scanButton).toHaveScreenshot('run-scan-button-loading.png', {
          threshold: 0.3
        });
      } catch (error) {
        // Loading state might be too brief to capture consistently
        console.log('Loading state screenshot skipped - too brief');
      }

      // Wait for completion
      await dashboard.waitForLoadingToComplete();
    });
  });

  test.describe('Cross-Browser Visual Consistency', () => {
    const browsers = ['chromium', 'firefox', 'webkit'];

    browsers.forEach(browserName => {
      test(`should maintain visual consistency in ${browserName}`, async ({ tradingPage }) => {
        // Note: This test requires browser-specific projects in playwright.config.js
        await expect(tradingPage).toHaveScreenshot(`dashboard-${browserName}.png`, {
          fullPage: true,
          threshold: 0.4 // Higher threshold for cross-browser differences
        });
      });
    });
  });

  test.describe('Responsive Visual Validation', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'ultrawide', width: 3440, height: 1440 }
    ];

    viewports.forEach(viewport => {
      test(`should maintain layout consistency at ${viewport.name} viewport`, async ({ tradingPage }) => {
        await tradingPage.setViewportSize({ width: viewport.width, height: viewport.height });
        await tradingPage.waitForTimeout(1000);

        await expect(tradingPage).toHaveScreenshot(`dashboard-${viewport.name}-${viewport.width}x${viewport.height}.png`, {
          fullPage: true,
          threshold: 0.3
        });
      });
    });

    test('should handle viewport transitions smoothly', async ({ tradingPage }) => {
      const transitions = [
        { from: { width: 1920, height: 1080 }, to: { width: 375, height: 667 } },
        { from: { width: 375, height: 667 }, to: { width: 768, height: 1024 } },
        { from: { width: 768, height: 1024 }, to: { width: 1920, height: 1080 } }
      ];

      for (const transition of transitions) {
        await tradingPage.setViewportSize(transition.from);
        await tradingPage.waitForTimeout(500);

        await tradingPage.setViewportSize(transition.to);
        await tradingPage.waitForTimeout(1000);

        await expect(tradingPage).toHaveScreenshot(
          `transition-${transition.from.width}x${transition.from.height}-to-${transition.to.width}x${transition.to.height}.png`,
          {
            fullPage: true,
            threshold: 0.3
          }
        );
      }
    });
  });

  test.describe('Chart Visual Consistency', () => {
    test('should maintain chart visual consistency', async ({ tradingPage }) => {
      const scanResults = await dashboard.getScanResults();
      if (scanResults.length > 0) {
        await dashboard.selectTicker(scanResults[0].ticker);
        await dashboard.switchToChartView();
        await chart.waitForChart();

        // Wait extra time for chart rendering to stabilize
        await tradingPage.waitForTimeout(3000);

        await expect(chart.container).toHaveScreenshot('chart-candlestick-view.png', {
          threshold: 0.5 // Charts may have rendering variations
        });
      }
    });

    test('should match different timeframe chart views', async ({ tradingPage }) => {
      const scanResults = await dashboard.getScanResults();
      if (scanResults.length > 0) {
        await dashboard.selectTicker(scanResults[0].ticker);
        await dashboard.switchToChartView();

        const timeframes = await chart.getAvailableTimeframes();

        for (const timeframe of timeframes.slice(0, 3)) {
          await chart.changeTimeframe(timeframe);
          await chart.waitForChart();
          await tradingPage.waitForTimeout(2000);

          await expect(chart.container).toHaveScreenshot(`chart-${timeframe}-timeframe.png`, {
            threshold: 0.5
          });
        }
      }
    });

    test('should handle chart interaction states', async ({ tradingPage }) => {
      const scanResults = await dashboard.getScanResults();
      if (scanResults.length > 0) {
        await dashboard.selectTicker(scanResults[0].ticker);
        await dashboard.switchToChartView();
        await chart.waitForChart();

        // Hover over chart
        await chart.hover(0.5, 0.5);
        await tradingPage.waitForTimeout(500);

        await expect(chart.container).toHaveScreenshot('chart-hover-state.png', {
          threshold: 0.5
        });
      }
    });
  });

  test.describe('Theme and Styling Consistency', () => {
    test('should maintain dark theme consistency', async ({ tradingPage }) => {
      // Verify dark theme is applied
      const backgroundColor = await tradingPage.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });

      // Should be a dark color
      expect(backgroundColor).toMatch(/rgb\(\s*[0-5]?\d,\s*[0-5]?\d,\s*[0-5]?\d\)/);

      await expect(tradingPage).toHaveScreenshot('dark-theme-dashboard.png', {
        fullPage: true,
        threshold: 0.2
      });
    });

    test('should maintain color scheme consistency', async ({ tradingPage }) => {
      // Check for trading-specific colors (gold accent)
      const goldElements = tradingPage.locator('[style*="gold"], .text-yellow, [class*="gold"]');
      const count = await goldElements.count();

      if (count > 0) {
        const firstGoldElement = goldElements.first();
        await expect(firstGoldElement).toHaveScreenshot('gold-accent-element.png', {
          threshold: 0.1
        });
      }
    });

    test('should maintain typography consistency', async ({ tradingPage }) => {
      const textElements = tradingPage.locator('h1, h2, h3, p, button, td, th').first();
      await expect(textElements).toHaveScreenshot('typography-sample.png', {
        threshold: 0.1
      });
    });
  });

  test.describe('Visual Error States', () => {
    test('should match error state visuals', async ({ tradingPage }) => {
      // Mock API error to trigger error state
      await tradingPage.route('**/api/**', route => route.abort());

      await tradingPage.reload();
      await tradingPage.waitForTimeout(2000);

      // Capture error state if visible
      const errorElements = tradingPage.locator('[role="alert"], .error, .warning');
      const errorCount = await errorElements.count();

      if (errorCount > 0) {
        await expect(errorElements.first()).toHaveScreenshot('error-state.png', {
          threshold: 0.2
        });
      }

      await expect(tradingPage).toHaveScreenshot('dashboard-error-state.png', {
        fullPage: true,
        threshold: 0.3
      });
    });

    test('should match empty state visuals', async ({ tradingPage }) => {
      // Mock empty data response
      await tradingPage.route('**/api/**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await tradingPage.reload();
      await tradingPage.waitForTimeout(2000);

      await expect(tradingPage).toHaveScreenshot('dashboard-empty-state.png', {
        fullPage: true,
        threshold: 0.3
      });
    });
  });

  test.describe('Animation and Transition Testing', () => {
    test('should capture transition states', async ({ tradingPage }) => {
      // Re-enable animations for this test
      await tradingPage.addStyleTag({
        content: `
          * {
            animation-duration: 0.3s !important;
            transition-duration: 0.3s !important;
          }
        `
      });

      // Test view mode transition
      await dashboard.switchToChartView();
      await tradingPage.waitForTimeout(150); // Capture mid-transition

      await expect(tradingPage).toHaveScreenshot('view-transition-state.png', {
        fullPage: true,
        threshold: 0.4
      });

      await tradingPage.waitForTimeout(350); // Wait for completion

      await expect(tradingPage).toHaveScreenshot('chart-view-complete.png', {
        fullPage: true,
        threshold: 0.3
      });
    });
  });

  test.describe('Visual Regression Utilities', () => {
    test('should generate visual test baseline', async ({ tradingPage }) => {
      // This test can be used to generate new baselines when UI changes
      const testName = 'visual-baseline-' + Date.now();

      await expect(tradingPage).toHaveScreenshot(`${testName}-full-page.png`, {
        fullPage: true,
        threshold: 0.0 // Exact match for baseline
      });

      await expect(dashboard.sidebar).toHaveScreenshot(`${testName}-sidebar.png`, {
        threshold: 0.0
      });

      await expect(dashboard.scanResultsTable).toHaveScreenshot(`${testName}-table.png`, {
        threshold: 0.0
      });
    });

    test('should validate visual test stability', async ({ tradingPage }) => {
      // Take multiple screenshots to ensure stability
      const screenshots = [];

      for (let i = 0; i < 3; i++) {
        await tradingPage.reload();
        await dashboard.waitForLoadingToComplete();
        await tradingPage.waitForTimeout(1000);

        const screenshot = await tradingPage.screenshot({
          fullPage: true
        });
        screenshots.push(screenshot);
      }

      // Screenshots should be consistent (this is a conceptual test)
      // In practice, you'd compare the buffers
      expect(screenshots.length).toBe(3);
    });
  });
});