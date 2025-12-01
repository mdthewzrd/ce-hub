/**
 * Chart Component Page Object Model
 *
 * Specialized component for interacting with trading charts in the Edge.dev platform.
 * Handles Plotly.js charts and other visualization components.
 */

class ChartComponent {
  constructor(page, selector = '.chart-container, [data-testid="chart-container"]') {
    this.page = page;
    this.selector = selector;
    this.container = page.locator(selector);
  }

  /**
   * Chart Loading and Visibility
   */
  async waitForChart(timeout = 15000) {
    // Wait for container to be visible
    await this.container.waitFor({ state: 'visible', timeout });

    // Wait for chart content
    await this.page.waitForFunction((sel) => {
      const container = document.querySelector(sel);
      if (!container) return false;

      // Check for Plotly chart
      const plotlyDiv = container.querySelector('.plotly-graph-div');
      if (plotlyDiv) {
        return plotlyDiv.querySelector('.plot-container') !== null;
      }

      // Check for canvas
      const canvas = container.querySelector('canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return imageData.data.some(pixel => pixel !== 0);
      }

      // Check for SVG
      const svg = container.querySelector('svg');
      if (svg) {
        return svg.children.length > 0;
      }

      return false;
    }, this.selector, { timeout });

    // Additional stabilization wait
    await this.page.waitForTimeout(1000);
  }

  async isVisible() {
    try {
      await this.waitForChart(5000);
      return true;
    } catch {
      return false;
    }
  }

  async isLoading() {
    const loadingIndicators = [
      '.chart-container:has-text("Loading")',
      '.chart-container .loading',
      '.chart-container .spinner',
      '[data-testid="chart-loading"]'
    ];

    for (const indicator of loadingIndicators) {
      if (await this.page.locator(indicator).isVisible()) {
        return true;
      }
    }

    return false;
  }

  /**
   * Chart Data and Content
   */
  async getChartType() {
    return await this.page.evaluate((sel) => {
      const container = document.querySelector(sel);
      if (!container) return null;

      if (container.querySelector('.plotly-graph-div')) return 'plotly';
      if (container.querySelector('canvas')) return 'canvas';
      if (container.querySelector('svg')) return 'svg';

      return 'unknown';
    }, this.selector);
  }

  async getPlotlyData() {
    const chartType = await this.getChartType();
    if (chartType !== 'plotly') {
      throw new Error(`Chart type is ${chartType}, not plotly`);
    }

    return await this.page.evaluate((sel) => {
      const container = document.querySelector(sel);
      const plotlyDiv = container?.querySelector('.plotly-graph-div');

      if (plotlyDiv && plotlyDiv.data) {
        return {
          data: plotlyDiv.data,
          layout: plotlyDiv.layout || {},
          config: plotlyDiv.config || {}
        };
      }

      return null;
    }, this.selector);
  }

  async getChartDimensions() {
    const box = await this.container.boundingBox();
    return box ? { width: box.width, height: box.height } : null;
  }

  async hasData() {
    const chartType = await this.getChartType();

    switch (chartType) {
      case 'plotly':
        const plotlyData = await this.getPlotlyData();
        return plotlyData && plotlyData.data && plotlyData.data.length > 0;

      case 'canvas':
        return await this.page.evaluate((sel) => {
          const canvas = document.querySelector(sel + ' canvas');
          if (!canvas) return false;

          const ctx = canvas.getContext('2d');
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          return imageData.data.some(pixel => pixel !== 0);
        }, this.selector);

      case 'svg':
        return await this.page.evaluate((sel) => {
          const svg = document.querySelector(sel + ' svg');
          return svg && svg.children.length > 0;
        }, this.selector);

      default:
        return false;
    }
  }

  /**
   * Chart Interactions
   */
  async hover(xPercent = 0.5, yPercent = 0.5) {
    const box = await this.container.boundingBox();
    if (!box) throw new Error('Chart container not found');

    const x = box.x + box.width * xPercent;
    const y = box.y + box.height * yPercent;

    await this.page.mouse.move(x, y);
    await this.page.waitForTimeout(500); // Wait for hover effects
  }

  async click(xPercent = 0.5, yPercent = 0.5) {
    const box = await this.container.boundingBox();
    if (!box) throw new Error('Chart container not found');

    const x = box.x + box.width * xPercent;
    const y = box.y + box.height * yPercent;

    await this.page.mouse.click(x, y);
    await this.page.waitForTimeout(300);
  }

  async drag(fromX, fromY, toX, toY) {
    const box = await this.container.boundingBox();
    if (!box) throw new Error('Chart container not found');

    const startX = box.x + box.width * fromX;
    const startY = box.y + box.height * fromY;
    const endX = box.x + box.width * toX;
    const endY = box.y + box.height * toY;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(endX, endY);
    await this.page.mouse.up();
    await this.page.waitForTimeout(500);
  }

  async zoom(factor = 1.5) {
    const box = await this.container.boundingBox();
    if (!box) throw new Error('Chart container not found');

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await this.page.mouse.move(centerX, centerY);

    // Simulate mouse wheel for zoom
    await this.page.mouse.wheel(0, factor > 1 ? -100 : 100);
    await this.page.waitForTimeout(500);
  }

  /**
   * Timeframe Operations
   */
  async getAvailableTimeframes() {
    const timeframeSelectors = [
      'button[data-timeframe]',
      '.timeframe-button',
      'button:has-text("1m")',
      'button:has-text("5m")',
      'button:has-text("15m")',
      'button:has-text("1h")',
      'button:has-text("1d")'
    ];

    const timeframes = [];
    for (const selector of timeframeSelectors) {
      const elements = await this.page.locator(selector).all();
      for (const element of elements) {
        const text = await element.textContent();
        if (text && !timeframes.includes(text.trim())) {
          timeframes.push(text.trim());
        }
      }
    }

    return timeframes;
  }

  async changeTimeframe(timeframe) {
    const timeframeButton = this.page.locator(
      `button[data-timeframe="${timeframe}"], button:has-text("${timeframe}")`
    );

    if (await timeframeButton.isVisible({ timeout: 2000 })) {
      await timeframeButton.click();
      await this.page.waitForTimeout(1000);
      await this.waitForChart(); // Wait for chart to re-render
    } else {
      throw new Error(`Timeframe "${timeframe}" not available`);
    }
  }

  async getCurrentTimeframe() {
    return await this.page.evaluate(() => {
      // Look for active timeframe button
      const activeButton = document.querySelector('button[data-timeframe].active, .timeframe-button.active');
      if (activeButton) {
        return activeButton.textContent?.trim() || activeButton.getAttribute('data-timeframe');
      }

      // Fallback: look for selected state in other ways
      const buttons = document.querySelectorAll('button[data-timeframe], .timeframe-button');
      for (const button of buttons) {
        if (button.classList.contains('selected') ||
            button.classList.contains('active') ||
            button.getAttribute('aria-selected') === 'true') {
          return button.textContent?.trim() || button.getAttribute('data-timeframe');
        }
      }

      return null;
    });
  }

  /**
   * Chart Analysis
   */
  async getCandlestickData() {
    const chartType = await this.getChartType();
    if (chartType !== 'plotly') {
      throw new Error('Candlestick data only available for Plotly charts');
    }

    return await this.page.evaluate((sel) => {
      const container = document.querySelector(sel);
      const plotlyDiv = container?.querySelector('.plotly-graph-div');

      if (plotlyDiv && plotlyDiv.data) {
        const candlestickTrace = plotlyDiv.data.find(trace => trace.type === 'candlestick');
        if (candlestickTrace) {
          return {
            x: candlestickTrace.x || [],
            open: candlestickTrace.open || [],
            high: candlestickTrace.high || [],
            low: candlestickTrace.low || [],
            close: candlestickTrace.close || [],
            volume: candlestickTrace.volume || []
          };
        }
      }

      return null;
    }, this.selector);
  }

  async getVolumeData() {
    const chartType = await this.getChartType();
    if (chartType !== 'plotly') {
      throw new Error('Volume data only available for Plotly charts');
    }

    return await this.page.evaluate((sel) => {
      const container = document.querySelector(sel);
      const plotlyDiv = container?.querySelector('.plotly-graph-div');

      if (plotlyDiv && plotlyDiv.data) {
        const volumeTrace = plotlyDiv.data.find(trace =>
          trace.name && trace.name.toLowerCase().includes('volume')
        );
        if (volumeTrace) {
          return {
            x: volumeTrace.x || [],
            y: volumeTrace.y || []
          };
        }
      }

      return null;
    }, this.selector);
  }

  async getLastPrice() {
    const candlestickData = await this.getCandlestickData();
    if (candlestickData && candlestickData.close.length > 0) {
      return candlestickData.close[candlestickData.close.length - 1];
    }
    return null;
  }

  async getPriceRange() {
    const candlestickData = await this.getCandlestickData();
    if (candlestickData) {
      const highs = candlestickData.high;
      const lows = candlestickData.low;

      if (highs.length > 0 && lows.length > 0) {
        return {
          high: Math.max(...highs),
          low: Math.min(...lows)
        };
      }
    }
    return null;
  }

  /**
   * Chart State Validation
   */
  async validateChartRender() {
    const validations = {
      containerVisible: await this.container.isVisible(),
      hasData: await this.hasData(),
      chartType: await this.getChartType(),
      dimensions: await this.getChartDimensions()
    };

    // Additional checks based on chart type
    if (validations.chartType === 'plotly') {
      try {
        const plotlyData = await this.getPlotlyData();
        validations.plotlyDataValid = plotlyData && plotlyData.data && plotlyData.data.length > 0;
      } catch {
        validations.plotlyDataValid = false;
      }
    }

    return validations;
  }

  async waitForDataUpdate(timeout = 10000) {
    const initialData = await this.hasData() ? await this.getLastPrice() : null;

    await this.page.waitForFunction((sel, initial) => {
      const container = document.querySelector(sel);
      const plotlyDiv = container?.querySelector('.plotly-graph-div');

      if (plotlyDiv && plotlyDiv.data) {
        const candlestickTrace = plotlyDiv.data.find(trace => trace.type === 'candlestick');
        if (candlestickTrace && candlestickTrace.close) {
          const currentLast = candlestickTrace.close[candlestickTrace.close.length - 1];
          return currentLast !== initial;
        }
      }

      return false;
    }, this.selector, initialData, { timeout });
  }

  /**
   * Screenshot and Visual Testing
   */
  async takeScreenshot(name) {
    await this.waitForChart();
    return await this.container.screenshot({
      path: `test-results/screenshots/chart-${name}-${Date.now()}.png`
    });
  }

  async compareVisual(expectedScreenshot) {
    await this.waitForChart();
    // This would integrate with visual comparison tools
    return await this.container.screenshot({
      path: `test-results/screenshots/chart-current-${Date.now()}.png`
    });
  }
}

module.exports = { ChartComponent };