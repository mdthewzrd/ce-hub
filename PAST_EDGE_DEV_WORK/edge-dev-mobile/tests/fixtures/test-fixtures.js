const { test: base } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Test Fixtures for Edge.dev Trading Platform
 *
 * Custom fixtures for financial trading application testing:
 * - Trading data management
 * - Market simulation
 * - Chart data injection
 * - Authentication helpers
 * - Performance monitoring
 */

// Load test data
const testDataPath = path.join(__dirname, 'data/mock-trading-data.json');
const mockTradingData = fs.existsSync(testDataPath)
  ? JSON.parse(fs.readFileSync(testDataPath, 'utf8'))
  : {};

const marketCalendarPath = path.join(__dirname, 'data/market-calendar.json');
const marketCalendar = fs.existsSync(marketCalendarPath)
  ? JSON.parse(fs.readFileSync(marketCalendarPath, 'utf8'))
  : {};

const test = base.extend({
  /**
   * Trading Dashboard Page - Provides pre-configured page with trading context
   */
  tradingPage: async ({ page }, use) => {
    // Set up trading-specific context
    await page.addInitScript(() => {
      // Mock real-time data updates
      window.mockTradingMode = true;
      window.mockDataUpdateInterval = 1000; // 1 second updates

      // Override console.error for cleaner test output
      const originalError = console.error;
      window.console.error = (...args) => {
        // Filter out expected API errors in test mode
        const message = args.join(' ');
        if (!message.includes('Failed to fetch') &&
            !message.includes('Network Error') &&
            !message.includes('API_KEY')) {
          originalError(...args);
        }
      };
    });

    // Set viewport for trading dashboard
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Add trading-specific CSS for test stability
    await page.addStyleTag({
      content: `
        /* Stabilize animations for testing */
        *, *::before, *::after {
          animation-duration: 0.01s !important;
          animation-delay: 0s !important;
          transition-duration: 0.01s !important;
          transition-delay: 0s !important;
        }

        /* Ensure charts render quickly */
        .chart-container, [data-testid="chart-container"] {
          transition: none !important;
        }

        /* Stabilize loading states */
        .studio-spinner {
          animation: none !important;
        }
      `
    });

    await use(page);
  },

  /**
   * Mock Trading Data - Provides consistent test data
   */
  mockData: async ({}, use) => {
    const data = {
      ...mockTradingData,

      // Real-time data simulation
      generateRealtimeUpdate: (ticker) => ({
        ticker,
        price: 100 + Math.random() * 50,
        volume: Math.floor(Math.random() * 1000000),
        timestamp: new Date().toISOString(),
        change: -5 + Math.random() * 10
      }),

      // Chart data generation
      generateChartData: (symbol, timeframe, bars = 100) => ({
        symbol,
        timeframe,
        data: {
          x: Array.from({length: bars}, (_, i) =>
            new Date(Date.now() - i * getTimeframeMs(timeframe)).toISOString()
          ).reverse(),
          open: Array.from({length: bars}, () => 100 + Math.random() * 50),
          high: Array.from({length: bars}, () => 120 + Math.random() * 30),
          low: Array.from({length: bars}, () => 90 + Math.random() * 20),
          close: Array.from({length: bars}, () => 110 + Math.random() * 40),
          volume: Array.from({length: bars}, () => 1000000 + Math.random() * 500000)
        }
      }),

      // Market status
      getMarketStatus: () => {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();

        if (day === 0 || day === 6) return 'closed'; // Weekend
        if (hour < 9 || hour >= 16) return 'after-hours';
        return 'open';
      }
    };

    await use(data);
  },

  /**
   * Performance Monitor - Tracks page performance metrics
   */
  performanceMonitor: async ({ page }, use) => {
    const metrics = {
      navigationStart: 0,
      loadComplete: 0,
      chartRenderTime: 0,
      apiResponseTimes: [],
      memoryUsage: []
    };

    // Monitor navigation timing
    await page.addInitScript(() => {
      window.performanceMetrics = {
        navigationStart: performance.now(),
        loadComplete: 0,
        chartRenderTime: 0,
        apiCalls: []
      };

      // Monitor fetch requests
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const start = performance.now();
        try {
          const response = await originalFetch(...args);
          const end = performance.now();
          window.performanceMetrics.apiCalls.push({
            url: args[0],
            duration: end - start,
            timestamp: new Date().toISOString()
          });
          return response;
        } catch (error) {
          const end = performance.now();
          window.performanceMetrics.apiCalls.push({
            url: args[0],
            duration: end - start,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          throw error;
        }
      };
    });

    const monitor = {
      // Get current performance metrics
      getMetrics: async () => {
        return await page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          const metrics = window.performanceMetrics || {};

          return {
            ...metrics,
            domContentLoaded: navigation?.domContentLoadedEventEnd || 0,
            loadComplete: navigation?.loadEventEnd || 0,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
            memoryUsage: performance.memory ? {
              used: performance.memory.usedJSHeapSize,
              total: performance.memory.totalJSHeapSize,
              limit: performance.memory.jsHeapSizeLimit
            } : null
          };
        });
      },

      // Wait for chart rendering
      waitForChartRender: async (timeout = 10000) => {
        await page.waitForFunction(() => {
          const charts = document.querySelectorAll('.chart-container, [data-testid="chart-container"]');
          return charts.length > 0 &&
                 Array.from(charts).some(chart =>
                   chart.querySelector('canvas, svg') ||
                   chart.textContent.includes('Loading') === false
                 );
        }, { timeout });
      },

      // Assert performance thresholds
      assertPerformance: async (thresholds = {}) => {
        const metrics = await monitor.getMetrics();
        const defaults = {
          loadTime: 5000,
          chartRenderTime: 3000,
          memoryUsage: 100 * 1024 * 1024 // 100MB
        };

        const limits = { ...defaults, ...thresholds };

        if (metrics.loadComplete > limits.loadTime) {
          throw new Error(`Load time ${metrics.loadComplete}ms exceeds limit ${limits.loadTime}ms`);
        }

        if (metrics.memoryUsage && metrics.memoryUsage.used > limits.memoryUsage) {
          throw new Error(`Memory usage ${metrics.memoryUsage.used} exceeds limit ${limits.memoryUsage}`);
        }

        return metrics;
      }
    };

    await use(monitor);
  },

  /**
   * Chart Helper - Utilities for chart testing
   */
  chartHelper: async ({ page }, use) => {
    const helper = {
      // Wait for chart to load and render
      waitForChart: async (selector = '.chart-container, [data-testid="chart-container"]', timeout = 15000) => {
        await page.waitForSelector(selector, { timeout });

        // Wait for chart content (canvas or svg)
        await page.waitForFunction((sel) => {
          const container = document.querySelector(sel);
          if (!container) return false;

          const hasCanvas = container.querySelector('canvas');
          const hasSvg = container.querySelector('svg');
          const hasPlotly = container.querySelector('.plotly-graph-div');

          return hasCanvas || hasSvg || hasPlotly;
        }, selector, { timeout });

        // Additional wait for chart rendering
        await page.waitForTimeout(1000);
      },

      // Get chart data points
      getChartData: async (selector = '.chart-container') => {
        return await page.evaluate((sel) => {
          const container = document.querySelector(sel);
          if (!container) return null;

          // Try to get Plotly data
          const plotlyDiv = container.querySelector('.plotly-graph-div');
          if (plotlyDiv && window.Plotly) {
            return plotlyDiv.data || null;
          }

          // Try to get canvas data (if available)
          const canvas = container.querySelector('canvas');
          if (canvas) {
            return {
              width: canvas.width,
              height: canvas.height,
              hasContent: canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some(pixel => pixel !== 0)
            };
          }

          return null;
        }, selector);
      },

      // Interact with chart (hover, click)
      hoverChart: async (selector = '.chart-container', x = 0.5, y = 0.5) => {
        const chartElement = page.locator(selector);
        const box = await chartElement.boundingBox();

        if (box) {
          await page.mouse.move(
            box.x + box.width * x,
            box.y + box.height * y
          );
          await page.waitForTimeout(500); // Wait for hover effects
        }
      },

      // Change timeframe
      changeTimeframe: async (timeframe) => {
        const timeframeButton = page.locator(`button:has-text("${timeframe}"), [data-testid="timeframe-${timeframe}"]`);
        if (await timeframeButton.isVisible({ timeout: 2000 })) {
          await timeframeButton.click();
          await page.waitForTimeout(1000);
        }
      }
    };

    await use(helper);
  },

  /**
   * Trading Actions - Common trading interface interactions
   */
  tradingActions: async ({ page }, use) => {
    const actions = {
      // Select a ticker from scan results
      selectTicker: async (ticker) => {
        const tickerElement = page.locator(`tr:has-text("${ticker}"), [data-ticker="${ticker}"]`).first();
        await tickerElement.click();
        await page.waitForTimeout(1000); // Wait for data loading
      },

      // Run a scan
      runScan: async () => {
        const scanButton = page.locator('button:has-text("Run Scan"), [data-testid="run-scan"]');
        await scanButton.click();

        // Wait for scan completion
        await page.waitForFunction(() => {
          const button = document.querySelector('button:has-text("Run Scan"), [data-testid="run-scan"]');
          return button && !button.disabled && !button.textContent.includes('Running');
        }, { timeout: 30000 });
      },

      // Toggle view mode (table/chart)
      toggleViewMode: async (mode = 'chart') => {
        const toggleButton = page.locator(`[data-testid="view-toggle-${mode}"], button:has-text("${mode}")`.replace('chart', 'C').replace('table', 'T'));
        if (await toggleButton.isVisible({ timeout: 2000 })) {
          await toggleButton.click();
          await page.waitForTimeout(500);
        }
      },

      // Upload code
      uploadCode: async (code, mode = 'finalized') => {
        await page.click('button:has-text("Upload Code")');
        await page.waitForSelector('.modal-content');

        if (mode === 'finalized') {
          await page.click('button:has-text("Upload Finalized Code")');
        } else {
          await page.click('button:has-text("Format Code with AI")');
        }

        await page.fill('textarea', code);
        await page.click('button:has-text("Upload & Run"), button:has-text("Format & Run")');
      }
    };

    await use(actions);
  }
});

// Helper function to convert timeframe to milliseconds
function getTimeframeMs(timeframe) {
  const multipliers = {
    '1min': 60 * 1000,
    '5min': 5 * 60 * 1000,
    '15min': 15 * 60 * 1000,
    'hour': 60 * 60 * 1000,
    'day': 24 * 60 * 60 * 1000
  };

  return multipliers[timeframe] || multipliers['day'];
}

const { expect } = require('@playwright/test');

module.exports = { test, expect };