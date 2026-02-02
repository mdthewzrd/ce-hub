const { test, expect } = require('../../fixtures/test-fixtures');
const { TradingDashboard } = require('../../page-objects/pages/TradingDashboard');
const { ScanResultsTable } = require('../../page-objects/components/ScanResultsTable');

/**
 * Trading Interface Element Tests
 *
 * This test suite validates the trading-specific functionality of the Edge.dev platform:
 * - Scan execution and results
 * - Trading data accuracy and validation
 * - Real-time data handling
 * - Trading workflow operations
 * - Code upload and project management
 * - Market data integrity
 */

test.describe('Trading Interface Elements', () => {
  let dashboard;
  let scanTable;

  test.beforeEach(async ({ tradingPage }) => {
    dashboard = new TradingDashboard(tradingPage);
    scanTable = new ScanResultsTable(tradingPage);

    await dashboard.goto();
    await dashboard.waitForLoadingToComplete();
  });

  test.describe('Scan Execution and Results', () => {
    test('should execute scan and display results', async ({ tradingPage, performanceMonitor }) => {
      // Execute a scan
      await dashboard.runScan();

      // Verify scan results are displayed
      expect(await scanTable.isVisible()).toBe(true);
      expect(await scanTable.isEmpty()).toBe(false);

      const rowCount = await scanTable.getRowCount();
      expect(rowCount).toBeGreaterThan(0);

      // Performance check
      const metrics = await performanceMonitor.getMetrics();
      expect(metrics.loadComplete).toBeLessThan(10000); // 10 seconds max for scan
    });

    test('should display scan results with correct structure', async ({ tradingPage }) => {
      await dashboard.runScan();

      // Validate table headers
      const expectedHeaders = ['TICKER', 'GAP %', 'VOLUME', 'R-MULT'];
      const headerValidation = await scanTable.validateHeaders(expectedHeaders);
      expect(headerValidation.valid).toBe(true);

      // Validate first row data structure
      const firstRowData = await scanTable.getRowData(0);
      expect(firstRowData).toHaveProperty('ticker');
      expect(firstRowData).toHaveProperty('gap_%');
      expect(firstRowData).toHaveProperty('volume');
      expect(firstRowData).toHaveProperty('r-mult');

      // Validate data formats
      expect(firstRowData.ticker).toMatch(/^[A-Z]{1,5}$/);
      expect(firstRowData['gap_%']).toMatch(/\d+\.?\d*%/);
      expect(firstRowData.volume).toMatch(/\d+\.?\d*M?/);
      expect(firstRowData['r-mult']).toMatch(/\d+\.?\d*R?/);
    });

    test('should validate scan result data integrity', async ({ tradingPage }) => {
      await dashboard.runScan();

      // Validate GAP % column
      const gapValidation = await scanTable.validateNumericColumn('GAP %', {
        minValue: -50,
        maxValue: 1000,
        allowNegative: true
      });
      expect(gapValidation.valid).toBe(true);

      // Validate VOLUME column
      const volumeValidation = await scanTable.validateNumericColumn('VOLUME', {
        minValue: 0,
        allowNegative: false
      });
      expect(volumeValidation.valid).toBe(true);

      // Validate R-MULT column
      const rMultValidation = await scanTable.validateNumericColumn('R-MULT', {
        minValue: 0,
        allowNegative: false
      });
      expect(rMultValidation.valid).toBe(true);
    });

    test('should allow ticker selection from scan results', async ({ tradingPage }) => {
      await dashboard.runScan();

      const allResults = await scanTable.getAllRowsData();
      expect(allResults.length).toBeGreaterThan(0);

      const firstTicker = allResults[0].ticker;
      await scanTable.clickRowByTicker(firstTicker);

      // Verify ticker is selected
      const selectedRow = await scanTable.getSelectedRow();
      expect(selectedRow).not.toBeNull();
      expect(selectedRow.data.ticker).toBe(firstTicker);

      // Chart should load for selected ticker
      const chartVisible = await dashboard.isChartVisible();
      expect(chartVisible).toBe(true);
    });

    test('should support scan result sorting', async ({ tradingPage }) => {
      await dashboard.runScan();

      // Test sorting by GAP %
      await scanTable.sortByColumn('GAP %');
      await tradingPage.waitForTimeout(1000);

      const sortDirection = await scanTable.getSortDirection('GAP %');
      expect(['asc', 'desc']).toContain(sortDirection);

      // Verify sort is applied
      const gapColumn = await scanTable.getSortedColumn('GAP %');
      expect(gapColumn.length).toBeGreaterThan(1);

      // Test second sort to reverse order
      await scanTable.sortByColumn('GAP %');
      await tradingPage.waitForTimeout(1000);

      const newSortDirection = await scanTable.getSortDirection('GAP %');
      expect(newSortDirection).not.toBe(sortDirection);
    });

    test('should provide scan result statistics', async ({ tradingPage }) => {
      await dashboard.runScan();

      const stats = await dashboard.getStatistics();

      // Verify statistics are present and valid
      expect(stats).toHaveProperty('Total Results');
      expect(stats).toHaveProperty('Avg Gap %');

      const totalResults = parseInt(stats['Total Results']);
      expect(totalResults).toBeGreaterThan(0);

      const rowCount = await scanTable.getRowCount();
      expect(totalResults).toBe(rowCount);

      // Validate average calculations
      const gapStats = await scanTable.getColumnStats('GAP %');
      if (gapStats) {
        expect(gapStats.average).toBeGreaterThan(0);
        expect(gapStats.count).toBe(totalResults);
      }
    });
  });

  test.describe('Trading Data Accuracy', () => {
    test('should display realistic trading data ranges', async ({ tradingPage }) => {
      await dashboard.runScan();

      const allResults = await scanTable.getAllRowsData();

      for (const result of allResults.slice(0, 5)) { // Check first 5 results
        // Ticker format validation
        expect(result.ticker).toMatch(/^[A-Z]{1,5}$/);

        // Gap percentage should be within reasonable range
        const gapPercent = parseFloat(result['gap_%'].replace('%', ''));
        expect(gapPercent).toBeGreaterThan(-90); // Not more than 90% down
        expect(gapPercent).toBeLessThan(1000);   // Not more than 1000% up

        // Volume should be positive
        const volumeStr = result.volume.replace(/[M,]/g, '');
        const volume = parseFloat(volumeStr);
        expect(volume).toBeGreaterThan(0);

        // R-Multiple should be reasonable
        const rMult = parseFloat(result['r-mult'].replace('R', ''));
        expect(rMult).toBeGreaterThan(0);
        expect(rMult).toBeLessThan(1000);
      }
    });

    test('should maintain data consistency across views', async ({ tradingPage }) => {
      await dashboard.runScan();

      // Get data in table view
      const tableViewData = await scanTable.getAllRowsData();

      // Switch to chart view and back
      await dashboard.switchToChartView();
      await tradingPage.waitForTimeout(1000);
      await dashboard.switchToTableView();
      await tradingPage.waitForTimeout(1000);

      // Data should remain consistent
      const newTableViewData = await scanTable.getAllRowsData();
      expect(newTableViewData.length).toBe(tableViewData.length);

      // Compare first few rows
      for (let i = 0; i < Math.min(3, tableViewData.length); i++) {
        expect(newTableViewData[i].ticker).toBe(tableViewData[i].ticker);
        expect(newTableViewData[i]['gap_%']).toBe(tableViewData[i]['gap_%']);
      }
    });

    test('should handle ticker symbol validation', async ({ tradingPage }) => {
      await dashboard.runScan();

      const allResults = await scanTable.getAllRowsData();

      for (const result of allResults) {
        const ticker = result.ticker;

        // Valid ticker format
        expect(ticker).toMatch(/^[A-Z]{1,5}$/);

        // No invalid characters
        expect(ticker).not.toMatch(/[^A-Z]/);

        // Reasonable length
        expect(ticker.length).toBeGreaterThanOrEqual(1);
        expect(ticker.length).toBeLessThanOrEqual(5);
      }
    });

    test('should validate market data timestamps', async ({ tradingPage, mockData }) => {
      // This test validates that any timestamp data is reasonable
      await dashboard.runScan();

      const scanResults = await scanTable.getAllRowsData();
      if (scanResults.length > 0) {
        await scanTable.clickRowByTicker(scanResults[0].ticker);
        await dashboard.waitForChart();

        // Check if chart has timestamp data
        const chartType = await tradingPage.evaluate(() => {
          const container = document.querySelector('.chart-container, [data-testid="chart-container"]');
          const plotlyDiv = container?.querySelector('.plotly-graph-div');
          return plotlyDiv ? 'plotly' : 'unknown';
        });

        if (chartType === 'plotly') {
          const timestamps = await tradingPage.evaluate(() => {
            const container = document.querySelector('.chart-container');
            const plotlyDiv = container?.querySelector('.plotly-graph-div');
            if (plotlyDiv && plotlyDiv.data) {
              const candlestickTrace = plotlyDiv.data.find(trace => trace.type === 'candlestick');
              return candlestickTrace ? candlestickTrace.x : null;
            }
            return null;
          });

          if (timestamps && timestamps.length > 0) {
            // Validate timestamp format and reasonableness
            for (let i = 0; i < Math.min(5, timestamps.length); i++) {
              const timestamp = new Date(timestamps[i]);
              expect(timestamp).toBeInstanceOf(Date);
              expect(timestamp.getTime()).toBeGreaterThan(new Date('2020-01-01').getTime());
              expect(timestamp.getTime()).toBeLessThan(new Date('2030-01-01').getTime());
            }
          }
        }
      }
    });
  });

  test.describe('Real-time Data Handling', () => {
    test('should handle data refresh operations', async ({ tradingPage }) => {
      await dashboard.runScan();

      const initialResults = await scanTable.getAllRowsData();
      const initialCount = initialResults.length;

      // Run scan again to simulate data refresh
      await dashboard.runScan();

      const refreshedResults = await scanTable.getAllRowsData();
      expect(refreshedResults.length).toBeGreaterThan(0);

      // Data should be present (may be same or different)
      expect(refreshedResults.length).toBeGreaterThanOrEqual(1);
    });

    test('should maintain UI responsiveness during data updates', async ({ tradingPage, performanceMonitor }) => {
      await dashboard.runScan();

      const scanResults = await scanTable.getAllRowsData();
      if (scanResults.length > 0) {
        // Rapidly select different tickers
        for (let i = 0; i < Math.min(3, scanResults.length); i++) {
          const startTime = Date.now();

          await scanTable.clickRowByTicker(scanResults[i].ticker);
          await tradingPage.waitForTimeout(500);

          const responseTime = Date.now() - startTime;
          expect(responseTime).toBeLessThan(3000); // UI should respond within 3 seconds
        }

        // Check memory usage hasn't grown excessively
        const metrics = await performanceMonitor.getMetrics();
        if (metrics.memoryUsage) {
          expect(metrics.memoryUsage.used).toBeLessThan(200 * 1024 * 1024); // 200MB
        }
      }
    });

    test('should handle concurrent scan operations gracefully', async ({ tradingPage }) => {
      // Start first scan
      const scanPromise1 = dashboard.runScan();

      // Wait a moment then try another scan
      await tradingPage.waitForTimeout(500);

      try {
        // This should either queue or handle gracefully
        await dashboard.runScan();
        expect(true).toBe(true); // If we get here, concurrent handling works
      } catch (error) {
        // Or it should fail gracefully
        expect(error.message).toContain('disabled');
      }

      // First scan should complete
      await scanPromise1;
      expect(await scanTable.isVisible()).toBe(true);
    });
  });

  test.describe('Code Upload and Project Management', () => {
    test('should open upload modal correctly', async ({ tradingPage }) => {
      await dashboard.openUploadModal();

      await expect(dashboard.uploadModal).toBeVisible();

      // Should show upload options
      const finalizedButton = tradingPage.locator('button:has-text("Upload Finalized Code")');
      const formatButton = tradingPage.locator('button:has-text("Format Code with AI")');

      expect(await finalizedButton.isVisible()).toBe(true);
      expect(await formatButton.isVisible()).toBe(true);
    });

    test('should handle code upload workflow', async ({ tradingPage }) => {
      const sampleCode = `
import pandas as pd
import yfinance as yf

def scan_stocks():
    tickers = ['AAPL', 'MSFT', 'GOOGL']
    results = []

    for ticker in tickers:
        data = yf.download(ticker, period='1d')
        results.append({
            'ticker': ticker,
            'close': data['Close'].iloc[-1]
        })

    return results

if __name__ == "__main__":
    results = scan_stocks()
    print(results)
      `.trim();

      await dashboard.openUploadModal();

      // Select finalized code upload
      await tradingPage.click('button:has-text("Upload Finalized Code")');

      // Should show code input area
      await expect(tradingPage.locator('textarea')).toBeVisible();

      // Enter code
      await tradingPage.fill('textarea', sampleCode);

      // Verify code was entered
      const enteredCode = await tradingPage.locator('textarea').inputValue();
      expect(enteredCode).toBe(sampleCode);

      // Submit button should be enabled
      const submitButton = tradingPage.locator('button:has-text("Upload & Run")');
      expect(await submitButton.isEnabled()).toBe(true);
    });

    test('should manage project selection', async ({ tradingPage }) => {
      const projects = await dashboard.getProjects();
      expect(projects.length).toBeGreaterThan(0);

      const currentActive = projects.find(p => p.active);
      expect(currentActive).toBeDefined();

      // Select a different project if available
      const inactiveProject = projects.find(p => !p.active);
      if (inactiveProject) {
        await dashboard.selectProject(inactiveProject.name);

        // Verify project changed
        const newProjects = await dashboard.getProjects();
        const newActive = newProjects.find(p => p.active);
        expect(newActive.name).toBe(inactiveProject.name);
      }
    });

    test('should display project information correctly', async ({ tradingPage }) => {
      const projects = await dashboard.getProjects();

      for (const project of projects) {
        expect(project.name).toBeTruthy();
        expect(typeof project.active).toBe('boolean');

        // Project names should be reasonable
        expect(project.name.length).toBeGreaterThan(0);
        expect(project.name.length).toBeLessThan(100);
      }

      // Exactly one project should be active
      const activeProjects = projects.filter(p => p.active);
      expect(activeProjects.length).toBe(1);
    });
  });

  test.describe('Market Data Integration', () => {
    test('should handle different market conditions', async ({ tradingPage, mockData }) => {
      const marketStatus = mockData.getMarketStatus();
      expect(['open', 'closed', 'after-hours']).toContain(marketStatus);

      await dashboard.runScan();

      // Data should be available regardless of market status
      expect(await scanTable.isEmpty()).toBe(false);

      const scanResults = await scanTable.getAllRowsData();
      expect(scanResults.length).toBeGreaterThan(0);
    });

    test('should validate financial data formats', async ({ tradingPage }) => {
      await dashboard.runScan();

      const allResults = await scanTable.getAllRowsData();

      for (const result of allResults.slice(0, 3)) {
        // Volume formatting
        const volume = result.volume;
        expect(volume).toMatch(/^\d+(\.\d+)?[M]?$/); // Like "50.5M" or "1000"

        // Gap percentage formatting
        const gapPercent = result['gap_%'];
        expect(gapPercent).toMatch(/^-?\d+(\.\d+)?%$/); // Like "5.2%" or "-2.1%"

        // R-Multiple formatting
        const rMult = result['r-mult'];
        expect(rMult).toMatch(/^\d+(\.\d+)?(R)?$/); // Like "2.5R" or "1.8"
      }
    });

    test('should handle edge cases in financial data', async ({ tradingPage }) => {
      await dashboard.runScan();

      const stats = await dashboard.getStatistics();
      const totalResults = parseInt(stats['Total Results']);

      if (totalResults > 0) {
        // Find any extreme values
        const gapStats = await scanTable.getColumnStats('GAP %');
        const volumeStats = await scanTable.getColumnStats('VOLUME');

        if (gapStats) {
          // Extreme gaps should still be reasonable
          expect(gapStats.max).toBeLessThan(2000); // No more than 2000% gap
          expect(gapStats.min).toBeGreaterThan(-99); // No more than 99% down
        }

        if (volumeStats) {
          // Volume should be positive
          expect(volumeStats.min).toBeGreaterThanOrEqual(0);
          expect(volumeStats.max).toBeLessThan(1e12); // Reasonable volume limit
        }
      }
    });
  });

  test.describe('Trading Workflow Integration', () => {
    test('should support complete analysis workflow', async ({ tradingPage }) => {
      // 1. Execute scan
      await dashboard.runScan();
      expect(await scanTable.isEmpty()).toBe(false);

      // 2. Select ticker
      const scanResults = await scanTable.getAllRowsData();
      await scanTable.clickRowByTicker(scanResults[0].ticker);

      // 3. Analyze chart
      const chartVisible = await dashboard.isChartVisible();
      expect(chartVisible).toBe(true);

      // 4. Switch views
      await dashboard.switchToChartView();
      await dashboard.switchToTableView();

      // 5. Check statistics
      const stats = await dashboard.getStatistics();
      expect(stats).toHaveProperty('Total Results');

      // Workflow should complete without errors
      expect(await dashboard.isPageLoaded()).toBe(true);
    });

    test('should maintain state during complex operations', async ({ tradingPage }) => {
      // Perform multiple operations
      await dashboard.runScan();
      const originalResults = await scanTable.getAllRowsData();

      await dashboard.switchToChartView();
      await scanTable.clickRowByTicker(originalResults[0].ticker);
      await dashboard.switchToTableView();

      // State should be maintained
      const newResults = await scanTable.getAllRowsData();
      expect(newResults.length).toBe(originalResults.length);

      const selectedRow = await scanTable.getSelectedRow();
      expect(selectedRow).not.toBeNull();
      expect(selectedRow.data.ticker).toBe(originalResults[0].ticker);
    });

    test('should handle rapid user interactions', async ({ tradingPage }) => {
      await dashboard.runScan();
      const scanResults = await scanTable.getAllRowsData();

      // Rapidly interact with different elements
      for (let i = 0; i < Math.min(5, scanResults.length); i++) {
        await scanTable.clickRowByTicker(scanResults[i].ticker);
        await tradingPage.waitForTimeout(200);
        await dashboard.switchToChartView();
        await tradingPage.waitForTimeout(200);
        await dashboard.switchToTableView();
        await tradingPage.waitForTimeout(200);
      }

      // Application should remain stable
      expect(await dashboard.isPageLoaded()).toBe(true);
      expect(await scanTable.isVisible()).toBe(true);
    });
  });
});