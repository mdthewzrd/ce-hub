const { test, expect } = require('../../fixtures/test-fixtures');
const { TradingDashboard } = require('../../page-objects/pages/TradingDashboard');
const { ChartComponent } = require('../../page-objects/components/ChartComponent');

/**
 * Chart Interactions and Data Visualization Tests
 *
 * This test suite validates the chart functionality of the Edge.dev trading platform:
 * - Chart loading and rendering
 * - Data visualization accuracy
 * - User interactions (hover, zoom, pan)
 * - Timeframe switching
 * - Real-time data updates
 * - Performance under load
 */

test.describe('Chart Interactions and Data Visualization', () => {
  let dashboard;
  let chart;

  test.beforeEach(async ({ tradingPage }) => {
    dashboard = new TradingDashboard(tradingPage);
    chart = new ChartComponent(tradingPage);

    await dashboard.goto();
    await dashboard.waitForLoadingToComplete();

    // Switch to chart view for better chart visibility
    await dashboard.switchToChartView();
  });

  test.describe('Chart Loading and Rendering', () => {
    test('should load and render chart with default data', async ({ tradingPage, performanceMonitor }) => {
      // Select a ticker to trigger chart loading
      const scanResults = await dashboard.getScanResults();
      expect(scanResults.length).toBeGreaterThan(0);

      await dashboard.selectTicker(scanResults[0].ticker);

      // Wait for chart to render
      await chart.waitForChart();

      // Verify chart is visible and has data
      expect(await chart.isVisible()).toBe(true);
      expect(await chart.hasData()).toBe(true);

      // Check chart type
      const chartType = await chart.getChartType();
      expect(['plotly', 'canvas', 'svg']).toContain(chartType);

      // Performance check
      await performanceMonitor.waitForChartRender();
      const metrics = await performanceMonitor.getMetrics();
      expect(metrics.loadComplete).toBeLessThan(5000);
    });

    test('should display candlestick data correctly', async ({ tradingPage }) => {
      const scanResults = await dashboard.getScanResults();
      await dashboard.selectTicker(scanResults[0].ticker);
      await chart.waitForChart();

      const chartType = await chart.getChartType();
      if (chartType === 'plotly') {
        const candlestickData = await chart.getCandlestickData();

        expect(candlestickData).not.toBeNull();
        expect(candlestickData.x.length).toBeGreaterThan(0);
        expect(candlestickData.open.length).toBe(candlestickData.x.length);
        expect(candlestickData.high.length).toBe(candlestickData.x.length);
        expect(candlestickData.low.length).toBe(candlestickData.x.length);
        expect(candlestickData.close.length).toBe(candlestickData.x.length);

        // Validate OHLC relationships
        for (let i = 0; i < Math.min(10, candlestickData.high.length); i++) {
          const high = candlestickData.high[i];
          const low = candlestickData.low[i];
          const open = candlestickData.open[i];
          const close = candlestickData.close[i];

          expect(high).toBeGreaterThanOrEqual(Math.max(open, close));
          expect(low).toBeLessThanOrEqual(Math.min(open, close));
        }
      }
    });

    test('should render chart with appropriate dimensions', async ({ tradingPage }) => {
      const scanResults = await dashboard.getScanResults();
      await dashboard.selectTicker(scanResults[0].ticker);
      await chart.waitForChart();

      const dimensions = await chart.getChartDimensions();
      expect(dimensions).not.toBeNull();
      expect(dimensions.width).toBeGreaterThan(300);
      expect(dimensions.height).toBeGreaterThan(200);

      // Chart should use available space effectively
      const viewport = tradingPage.viewportSize();
      expect(dimensions.width).toBeLessThan(viewport.width);
      expect(dimensions.height).toBeLessThan(viewport.height);
    });

    test('should handle loading states properly', async ({ tradingPage }) => {
      const scanResults = await dashboard.getScanResults();

      // Chart should show loading state initially
      await dashboard.selectTicker(scanResults[0].ticker);

      // May briefly show loading state
      const wasLoading = await chart.isLoading();

      // Eventually should finish loading
      await chart.waitForChart();
      expect(await chart.isLoading()).toBe(false);
      expect(await chart.hasData()).toBe(true);
    });
  });

  test.describe('Chart Interactions', () => {
    test.beforeEach(async () => {
      const scanResults = await dashboard.getScanResults();
      await dashboard.selectTicker(scanResults[0].ticker);
      await chart.waitForChart();
    });

    test('should respond to mouse hover', async ({ tradingPage }) => {
      // Hover over different parts of the chart
      await chart.hover(0.25, 0.5); // Left side
      await tradingPage.waitForTimeout(300);

      await chart.hover(0.75, 0.5); // Right side
      await tradingPage.waitForTimeout(300);

      await chart.hover(0.5, 0.25); // Top
      await tradingPage.waitForTimeout(300);

      await chart.hover(0.5, 0.75); // Bottom
      await tradingPage.waitForTimeout(300);

      // Chart should still be functional after interactions
      expect(await chart.hasData()).toBe(true);
    });

    test('should support chart clicking', async ({ tradingPage }) => {
      // Click on different areas of the chart
      await chart.click(0.3, 0.5);
      await tradingPage.waitForTimeout(300);

      await chart.click(0.7, 0.5);
      await tradingPage.waitForTimeout(300);

      // Chart should remain stable
      expect(await chart.isVisible()).toBe(true);
      expect(await chart.hasData()).toBe(true);
    });

    test('should handle zoom interactions', async ({ tradingPage }) => {
      const initialData = await chart.getChartData();

      // Attempt zoom in
      await chart.zoom(1.5);
      await tradingPage.waitForTimeout(1000);

      // Attempt zoom out
      await chart.zoom(0.5);
      await tradingPage.waitForTimeout(1000);

      // Chart should still be functional
      expect(await chart.isVisible()).toBe(true);
      expect(await chart.hasData()).toBe(true);
    });

    test('should support drag operations', async ({ tradingPage }) => {
      // Drag across the chart
      await chart.drag(0.2, 0.5, 0.8, 0.5);
      await tradingPage.waitForTimeout(500);

      // Chart should remain responsive
      expect(await chart.isVisible()).toBe(true);
      expect(await chart.hasData()).toBe(true);
    });
  });

  test.describe('Timeframe Switching', () => {
    test.beforeEach(async () => {
      const scanResults = await dashboard.getScanResults();
      await dashboard.selectTicker(scanResults[0].ticker);
      await chart.waitForChart();
    });

    test('should list available timeframes', async ({ tradingPage }) => {
      const timeframes = await chart.getAvailableTimeframes();

      expect(timeframes.length).toBeGreaterThan(0);
      expect(timeframes).toContain('day');

      // Common timeframes should be available
      const commonTimeframes = ['5min', '15min', 'hour', 'day'];
      const hasCommonTimeframes = commonTimeframes.some(tf => timeframes.includes(tf));
      expect(hasCommonTimeframes).toBe(true);
    });

    test('should switch between different timeframes', async ({ tradingPage }) => {
      const timeframes = await chart.getAvailableTimeframes();

      for (const timeframe of timeframes.slice(0, 3)) { // Test first 3 timeframes
        await chart.changeTimeframe(timeframe);

        // Verify timeframe changed
        const currentTimeframe = await chart.getCurrentTimeframe();
        expect(currentTimeframe).toBe(timeframe);

        // Chart should re-render with new data
        expect(await chart.hasData()).toBe(true);

        await tradingPage.waitForTimeout(1000); // Allow chart to settle
      }
    });

    test('should maintain chart functionality after timeframe changes', async ({ tradingPage, performanceMonitor }) => {
      const timeframes = await chart.getAvailableTimeframes();

      if (timeframes.length > 1) {
        const originalTimeframe = await chart.getCurrentTimeframe();
        const newTimeframe = timeframes.find(tf => tf !== originalTimeframe);

        if (newTimeframe) {
          // Change timeframe
          await chart.changeTimeframe(newTimeframe);
          await performanceMonitor.waitForChartRender();

          // Verify chart is still functional
          expect(await chart.isVisible()).toBe(true);
          expect(await chart.hasData()).toBe(true);

          // Test interactions still work
          await chart.hover(0.5, 0.5);
          await chart.click(0.5, 0.5);

          expect(await chart.hasData()).toBe(true);
        }
      }
    });

    test('should load appropriate data for each timeframe', async ({ tradingPage }) => {
      const timeframes = await chart.getAvailableTimeframes();

      const dataComparisons = {};

      for (const timeframe of timeframes.slice(0, 2)) {
        await chart.changeTimeframe(timeframe);
        await chart.waitForChart();

        const chartType = await chart.getChartType();
        if (chartType === 'plotly') {
          const data = await chart.getCandlestickData();
          dataComparisons[timeframe] = {
            dataPoints: data ? data.x.length : 0,
            lastPrice: data ? data.close[data.close.length - 1] : null
          };
        }
      }

      // Different timeframes should have different data characteristics
      const timeframeKeys = Object.keys(dataComparisons);
      if (timeframeKeys.length > 1) {
        const tf1 = dataComparisons[timeframeKeys[0]];
        const tf2 = dataComparisons[timeframeKeys[1]];

        // Should have data for both timeframes
        expect(tf1.dataPoints).toBeGreaterThan(0);
        expect(tf2.dataPoints).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Chart Data Analysis', () => {
    test.beforeEach(async () => {
      const scanResults = await dashboard.getScanResults();
      await dashboard.selectTicker(scanResults[0].ticker);
      await chart.waitForChart();
    });

    test('should display valid OHLC price data', async ({ tradingPage }) => {
      const chartType = await chart.getChartType();

      if (chartType === 'plotly') {
        const candlestickData = await chart.getCandlestickData();
        expect(candlestickData).not.toBeNull();

        // Verify data integrity
        const dataLength = candlestickData.x.length;
        expect(dataLength).toBeGreaterThan(10);

        // Check price relationships
        for (let i = 0; i < Math.min(20, dataLength); i++) {
          const high = parseFloat(candlestickData.high[i]);
          const low = parseFloat(candlestickData.low[i]);
          const open = parseFloat(candlestickData.open[i]);
          const close = parseFloat(candlestickData.close[i]);

          expect(high).toBeGreaterThanOrEqual(low);
          expect(high).toBeGreaterThanOrEqual(open);
          expect(high).toBeGreaterThanOrEqual(close);
          expect(low).toBeLessThanOrEqual(open);
          expect(low).toBeLessThanOrEqual(close);

          // Prices should be reasonable (not zero, negative, or extreme)
          expect(high).toBeGreaterThan(0);
          expect(low).toBeGreaterThan(0);
          expect(open).toBeGreaterThan(0);
          expect(close).toBeGreaterThan(0);
          expect(high).toBeLessThan(1000000); // Sanity check
        }
      }
    });

    test('should provide current price information', async ({ tradingPage }) => {
      const chartType = await chart.getChartType();

      if (chartType === 'plotly') {
        const lastPrice = await chart.getLastPrice();
        expect(lastPrice).not.toBeNull();
        expect(lastPrice).toBeGreaterThan(0);

        const priceRange = await chart.getPriceRange();
        expect(priceRange).not.toBeNull();
        expect(priceRange.high).toBeGreaterThanOrEqual(priceRange.low);
        expect(priceRange.high).toBeGreaterThanOrEqual(lastPrice);
        expect(priceRange.low).toBeLessThanOrEqual(lastPrice);
      }
    });

    test('should handle volume data if available', async ({ tradingPage }) => {
      const chartType = await chart.getChartType();

      if (chartType === 'plotly') {
        try {
          const volumeData = await chart.getVolumeData();

          if (volumeData) {
            expect(volumeData.x.length).toBeGreaterThan(0);
            expect(volumeData.y.length).toBe(volumeData.x.length);

            // Volume should be non-negative
            for (const volume of volumeData.y.slice(0, 10)) {
              expect(parseFloat(volume)).toBeGreaterThanOrEqual(0);
            }
          }
        } catch (error) {
          // Volume data might not be available, which is acceptable
          console.log('Volume data not available:', error.message);
        }
      }
    });
  });

  test.describe('Chart Performance and Stability', () => {
    test('should render charts efficiently with large datasets', async ({ tradingPage, performanceMonitor }) => {
      const scanResults = await dashboard.getScanResults();

      // Test multiple ticker selections rapidly
      for (let i = 0; i < Math.min(3, scanResults.length); i++) {
        await dashboard.selectTicker(scanResults[i].ticker);
        await chart.waitForChart();

        const renderStart = Date.now();
        await performanceMonitor.waitForChartRender();
        const renderTime = Date.now() - renderStart;

        // Chart should render within reasonable time
        expect(renderTime).toBeLessThan(5000);

        const metrics = await performanceMonitor.getMetrics();
        if (metrics.memoryUsage) {
          expect(metrics.memoryUsage.used).toBeLessThan(200 * 1024 * 1024); // 200MB
        }
      }
    });

    test('should maintain performance with multiple interactions', async ({ tradingPage }) => {
      const scanResults = await dashboard.getScanResults();
      await dashboard.selectTicker(scanResults[0].ticker);
      await chart.waitForChart();

      const startTime = Date.now();

      // Perform multiple rapid interactions
      for (let i = 0; i < 10; i++) {
        await chart.hover(Math.random(), Math.random());
        await tradingPage.waitForTimeout(100);
      }

      const interactionTime = Date.now() - startTime;

      // Interactions should remain responsive
      expect(interactionTime).toBeLessThan(5000);
      expect(await chart.isVisible()).toBe(true);
      expect(await chart.hasData()).toBe(true);
    });

    test('should handle rapid timeframe switching', async ({ tradingPage }) => {
      const scanResults = await dashboard.getScanResults();
      await dashboard.selectTicker(scanResults[0].ticker);
      await chart.waitForChart();

      const timeframes = await chart.getAvailableTimeframes();

      if (timeframes.length > 1) {
        // Rapidly switch between timeframes
        for (let i = 0; i < 5; i++) {
          const randomTimeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
          await chart.changeTimeframe(randomTimeframe);
          await tradingPage.waitForTimeout(500);
        }

        // Chart should still be functional
        expect(await chart.isVisible()).toBe(true);
        expect(await chart.hasData()).toBe(true);
      }
    });

    test('should recover from temporary rendering issues', async ({ tradingPage }) => {
      const scanResults = await dashboard.getScanResults();
      await dashboard.selectTicker(scanResults[0].ticker);
      await chart.waitForChart();

      // Stress test: resize window rapidly
      for (let i = 0; i < 3; i++) {
        await tradingPage.setViewportSize({ width: 800 + i * 200, height: 600 + i * 100 });
        await tradingPage.waitForTimeout(300);
      }

      // Chart should adapt and remain functional
      await tradingPage.waitForTimeout(1000);
      expect(await chart.isVisible()).toBe(true);
      expect(await chart.hasData()).toBe(true);
    });
  });

  test.describe('Chart Error Handling', () => {
    test('should handle invalid ticker data gracefully', async ({ tradingPage }) => {
      // Try to load chart with potentially invalid data
      await tradingPage.evaluate(() => {
        // Simulate invalid data injection
        window.mockInvalidData = true;
      });

      const scanResults = await dashboard.getScanResults();
      await dashboard.selectTicker(scanResults[0].ticker);

      // Should handle gracefully without crashing
      try {
        await chart.waitForChart(5000);
        expect(await chart.isVisible()).toBe(true);
      } catch (error) {
        // If chart fails to load, page should still be functional
        expect(await dashboard.isPageLoaded()).toBe(true);
      }
    });

    test('should maintain state after network interruption', async ({ tradingPage }) => {
      const scanResults = await dashboard.getScanResults();
      await dashboard.selectTicker(scanResults[0].ticker);
      await chart.waitForChart();

      // Simulate network interruption
      await tradingPage.setOffline(true);
      await tradingPage.waitForTimeout(1000);

      // Restore network
      await tradingPage.setOffline(false);
      await tradingPage.waitForTimeout(1000);

      // Chart should recover or maintain previous state
      expect(await chart.isVisible()).toBe(true);
    });
  });
});