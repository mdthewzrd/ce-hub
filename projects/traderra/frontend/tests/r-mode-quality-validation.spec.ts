import { test, expect, type Page } from '@playwright/test';

// Quality Assurance Test Suite for R-Mode Performance Overview Fixes
// Tests comprehensive R-mode functionality across all user interactions

interface MetricData {
  title: string;
  value: string;
  rawValue?: number;
}

interface PerformanceMetrics {
  totalPnL: MetricData;
  winRate: MetricData;
  profitFactor: MetricData;
  expectancy: MetricData;
  maxDrawdown: MetricData;
  avgWinner: MetricData;
  avgLoser: MetricData;
}

class PerformanceOverviewValidator {
  constructor(private page: Page) {}

  async navigateToTestPage() {
    await this.page.goto('http://localhost:6565/dashboard-test');
    await this.page.waitForLoadState('networkidle');

    // Wait for the Performance Overview section to be visible
    await this.page.waitForSelector('text=Performance Overview', { timeout: 10000 });
  }

  async captureMetrics(): Promise<PerformanceMetrics> {
    // Wait for metrics to be visible and stable
    await this.page.waitForSelector('[data-testid="metric-card"], .studio-surface', { timeout: 5000 });

    // Extract all metric cards from the Performance Overview grid
    const metricCards = await this.page.locator('.studio-surface').all();

    const metrics: PerformanceMetrics = {
      totalPnL: { title: 'Total P&L', value: '' },
      winRate: { title: 'Win Rate', value: '' },
      profitFactor: { title: 'Profit Factor', value: '' },
      expectancy: { title: 'Expectancy', value: '' },
      maxDrawdown: { title: 'Max Drawdown', value: '' },
      avgWinner: { title: 'Avg Winner', value: '' },
      avgLoser: { title: 'Avg Loser', value: '' }
    };

    for (const card of metricCards) {
      try {
        const titleElement = await card.locator('.text-sm.studio-muted').first();
        const valueElement = await card.locator('.text-2xl.font-semibold').first();

        const title = await titleElement.textContent();
        const value = await valueElement.textContent();

        if (title && value) {
          const cleanTitle = title.trim();
          const cleanValue = value.trim();

          switch (cleanTitle) {
            case 'Total P&L':
              metrics.totalPnL = { title: cleanTitle, value: cleanValue };
              break;
            case 'Win Rate':
              metrics.winRate = { title: cleanTitle, value: cleanValue };
              break;
            case 'Profit Factor':
              metrics.profitFactor = { title: cleanTitle, value: cleanValue };
              break;
            case 'Expectancy':
              metrics.expectancy = { title: cleanTitle, value: cleanValue };
              break;
            case 'Max Drawdown':
              metrics.maxDrawdown = { title: cleanTitle, value: cleanValue };
              break;
            case 'Avg Winner':
              metrics.avgWinner = { title: cleanTitle, value: cleanValue };
              break;
            case 'Avg Loser':
              metrics.avgLoser = { title: cleanTitle, value: cleanValue };
              break;
          }
        }
      } catch (error) {
        console.warn(`Error extracting metric: ${error}`);
      }
    }

    return metrics;
  }

  async getCurrentDisplayMode(): Promise<string> {
    // Find the active display mode button (highlighted)
    const activeModeButton = await this.page.locator('.bg-blue-600, .bg-[#0066cc], [aria-pressed="true"]').first();
    return await activeModeButton.textContent() || '';
  }

  async getCurrentPnLMode(): Promise<string> {
    // Find the active G/N toggle
    const activeToggle = await this.page.locator('button[class*="bg-blue"], button[class*="bg-[#0066cc]"]').filter({ hasText: /^[GN]$/ }).first();
    return await activeToggle.textContent() || '';
  }

  async setDisplayMode(mode: '$' | '%' | 'R'): Promise<void> {
    const buttonText = mode === '$' ? '$' : mode === '%' ? '%' : 'R';
    await this.page.locator(`button:has-text("${buttonText}")`).click();
    await this.page.waitForTimeout(500); // Allow for state updates
  }

  async setPnLMode(mode: 'G' | 'N'): Promise<void> {
    await this.page.locator(`button:has-text("${mode}")`).click();
    await this.page.waitForTimeout(500); // Allow for state updates
  }

  async setDateRange(range: '7d' | '30d' | '90d' | 'All'): Promise<void> {
    await this.page.locator(`button:has-text("${range}")`).click();
    await this.page.waitForTimeout(1000); // Allow for data filtering and recalculation
  }

  validateRModeFormat(value: string): boolean {
    // R-mode values should end with 'R' and be numeric
    const rModePattern = /^-?\d+(\.\d+)?R$/;
    return rModePattern.test(value);
  }

  validatePercentFormat(value: string): boolean {
    // Percentage values should end with '%' and be numeric
    const percentPattern = /^-?\d+(\.\d+)?%$/;
    return percentPattern.test(value);
  }

  validateDollarFormat(value: string): boolean {
    // Dollar values should start with '$' or '-$' and be numeric with commas
    const dollarPattern = /^-?\$[\d,]+(\.\d{2})?$/;
    return dollarPattern.test(value);
  }

  extractNumericValue(formattedValue: string): number {
    // Remove currency symbols, commas, and percentage signs
    const cleaned = formattedValue.replace(/[$,%R]/g, '').replace(/,/g, '');
    return parseFloat(cleaned) || 0;
  }
}

test.describe('R-Mode Performance Overview Quality Validation', () => {
  let validator: PerformanceOverviewValidator;

  test.beforeEach(async ({ page }) => {
    validator = new PerformanceOverviewValidator(page);
    await validator.navigateToTestPage();
  });

  test('R-Mode Toggle Functionality - Basic State Changes', async ({ page }) => {
    console.log('Testing R-Mode toggle functionality...');

    // Start in dollar mode, capture initial metrics
    await validator.setDisplayMode('$');
    const dollarMetrics = await validator.captureMetrics();

    // Switch to R-mode and capture metrics
    await validator.setDisplayMode('R');
    await page.waitForTimeout(1000); // Allow state to settle
    const rModeMetrics = await validator.captureMetrics();

    // Verify R-mode format for relevant metrics
    expect(validator.validateRModeFormat(rModeMetrics.totalPnL.value)).toBe(true);
    expect(validator.validateRModeFormat(rModeMetrics.expectancy.value)).toBe(true);
    expect(validator.validateRModeFormat(rModeMetrics.maxDrawdown.value)).toBe(true);
    expect(validator.validateRModeFormat(rModeMetrics.avgWinner.value)).toBe(true);
    expect(validator.validateRModeFormat(rModeMetrics.avgLoser.value)).toBe(true);

    // Win Rate and Profit Factor should remain as percentages/ratios
    expect(validator.validatePercentFormat(rModeMetrics.winRate.value)).toBe(true);
    expect(!isNaN(validator.extractNumericValue(rModeMetrics.profitFactor.value))).toBe(true);

    console.log('✓ R-Mode toggle functionality validated');
    console.log('✓ R-Mode format validation passed');
  });

  test('G/N Toggle Integration with R-Mode Calculations', async ({ page }) => {
    console.log('Testing G/N toggle integration with R-mode...');

    // Switch to R-mode first
    await validator.setDisplayMode('R');

    // Test with Gross mode
    await validator.setPnLMode('G');
    await page.waitForTimeout(1000);
    const grossRMetrics = await validator.captureMetrics();

    // Test with Net mode
    await validator.setPnLMode('N');
    await page.waitForTimeout(1000);
    const netRMetrics = await validator.captureMetrics();

    // Verify both modes produce valid R-multiple formats
    expect(validator.validateRModeFormat(grossRMetrics.totalPnL.value)).toBe(true);
    expect(validator.validateRModeFormat(netRMetrics.totalPnL.value)).toBe(true);

    // Extract numeric values for comparison
    const grossTotal = validator.extractNumericValue(grossRMetrics.totalPnL.value);
    const netTotal = validator.extractNumericValue(netRMetrics.totalPnL.value);

    // Mathematical expectation: Net R-multiples should be ≤ Gross R-multiples (due to commissions)
    console.log(`Gross Total R-Multiple: ${grossTotal}R`);
    console.log(`Net Total R-Multiple: ${netTotal}R`);

    // Verify the values are different (indicating the toggle is working)
    expect(grossTotal).not.toBe(netTotal);

    // In most cases, net should be less than gross due to commissions
    // But we'll just verify they're different, as the relationship depends on the specific data
    expect(Math.abs(grossTotal - netTotal) > 0.01).toBe(true);

    console.log('✓ G/N toggle integration with R-mode validated');
    console.log('✓ R-mode calculations respond to PnL mode changes');
  });

  test('Date Range Filtering with R-Mode Metrics Updates', async ({ page }) => {
    console.log('Testing date range filtering with R-mode...');

    // Switch to R-mode
    await validator.setDisplayMode('R');

    // Test different date ranges and capture metrics
    const dateRanges: Array<'7d' | '30d' | '90d' | 'All'> = ['7d', '30d', '90d', 'All'];
    const metricsbyRange: { [key: string]: PerformanceMetrics } = {};

    for (const range of dateRanges) {
      await validator.setDateRange(range);
      await page.waitForTimeout(1500); // Allow for data filtering
      metricsbyRange[range] = await validator.captureMetrics();

      // Verify R-mode format is maintained across date ranges
      expect(validator.validateRModeFormat(metricsbyRange[range].totalPnL.value)).toBe(true);
      expect(validator.validateRModeFormat(metricsbyRange[range].expectancy.value)).toBe(true);

      console.log(`${range} Range - Total P&L: ${metricsbyRange[range].totalPnL.value}`);
    }

    // Verify that different date ranges produce different metrics (at least some should differ)
    const totalPnLValues = dateRanges.map(range =>
      validator.extractNumericValue(metricsbyRange[range].totalPnL.value)
    );

    // Check if we have variation across date ranges
    const uniqueValues = new Set(totalPnLValues);
    expect(uniqueValues.size).toBeGreaterThanOrEqual(2);

    console.log('✓ Date range filtering with R-mode validated');
    console.log('✓ R-mode metrics update correctly for different date ranges');
  });

  test('Data Consistency and Mathematical Accuracy', async ({ page }) => {
    console.log('Testing data consistency and mathematical accuracy...');

    // Test consistency across different display modes
    const modes: Array<'$' | '%' | 'R'> = ['$', '%', 'R'];
    const metricsByMode: { [key: string]: PerformanceMetrics } = {};

    for (const mode of modes) {
      await validator.setDisplayMode(mode);
      await page.waitForTimeout(1000);
      metricsByMode[mode] = await validator.captureMetrics();
    }

    // Win Rate should be identical across all modes (it's always a percentage)
    const winRates = modes.map(mode => metricsByMode[mode].winRate.value);
    expect(new Set(winRates).size).toBe(1); // All should be the same

    // Profit Factor should be identical across all modes (it's always a ratio)
    const profitFactors = modes.map(mode =>
      validator.extractNumericValue(metricsByMode[mode].profitFactor.value)
    );

    // Allow for small floating-point differences
    const profitFactorVariation = Math.max(...profitFactors) - Math.min(...profitFactors);
    expect(profitFactorVariation).toBeLessThan(0.01);

    // Test consistency between G/N modes in R-mode
    await validator.setDisplayMode('R');

    await validator.setPnLMode('G');
    await page.waitForTimeout(500);
    const grossMetrics = await validator.captureMetrics();

    await validator.setPnLMode('N');
    await page.waitForTimeout(500);
    const netMetrics = await validator.captureMetrics();

    // Win rates should be similar between gross and net modes
    const grossWinRate = validator.extractNumericValue(grossMetrics.winRate.value);
    const netWinRate = validator.extractNumericValue(netMetrics.winRate.value);
    expect(Math.abs(grossWinRate - netWinRate)).toBeLessThan(5); // Within 5% is reasonable

    console.log('✓ Data consistency validation passed');
    console.log('✓ Mathematical accuracy verification completed');
  });

  test('Cross-Mode Synchronization Validation', async ({ page }) => {
    console.log('Testing cross-mode synchronization...');

    // Verify that all Performance Overview metrics update together
    await validator.setDisplayMode('$');
    const initialDollarMetrics = await validator.captureMetrics();

    // Switch to R-mode and verify all metrics are updated
    await validator.setDisplayMode('R');
    await page.waitForTimeout(1000);
    const rModeMetrics = await validator.captureMetrics();

    // Verify no metrics are stuck at previous values by comparing formats
    expect(validator.validateDollarFormat(initialDollarMetrics.totalPnL.value)).toBe(true);
    expect(validator.validateRModeFormat(rModeMetrics.totalPnL.value)).toBe(true);

    expect(validator.validateDollarFormat(initialDollarMetrics.expectancy.value)).toBe(true);
    expect(validator.validateRModeFormat(rModeMetrics.expectancy.value)).toBe(true);

    // Test rapid mode switching to ensure no race conditions
    const rapidSwitchModes: Array<'$' | '%' | 'R'> = ['$', 'R', '%', 'R', '$'];

    for (const mode of rapidSwitchModes) {
      await validator.setDisplayMode(mode);
      await page.waitForTimeout(200); // Minimal wait to test responsiveness

      const currentMetrics = await validator.captureMetrics();

      // Verify appropriate format based on current mode
      if (mode === '$') {
        expect(validator.validateDollarFormat(currentMetrics.totalPnL.value) ||
               currentMetrics.totalPnL.value === '∞').toBe(true);
      } else if (mode === '%') {
        expect(validator.validatePercentFormat(currentMetrics.totalPnL.value) ||
               currentMetrics.totalPnL.value === '∞').toBe(true);
      } else if (mode === 'R') {
        expect(validator.validateRModeFormat(currentMetrics.totalPnL.value) ||
               currentMetrics.totalPnL.value === '∞').toBe(true);
      }
    }

    console.log('✓ Cross-mode synchronization validated');
    console.log('✓ Rapid mode switching stability confirmed');
  });

  test('Performance and Responsiveness Validation', async ({ page }) => {
    console.log('Testing performance and responsiveness...');

    // Measure response time for mode switching
    const startTime = Date.now();

    await validator.setDisplayMode('R');
    await page.waitForSelector('.text-2xl.font-semibold', { timeout: 5000 });

    const rModeTime = Date.now() - startTime;
    expect(rModeTime).toBeLessThan(2000); // Should respond within 2 seconds

    // Test G/N toggle responsiveness
    const gnToggleStart = Date.now();
    await validator.setPnLMode('G');
    await page.waitForTimeout(100);
    await validator.setPnLMode('N');
    const gnToggleTime = Date.now() - gnToggleStart;

    expect(gnToggleTime).toBeLessThan(1000); // Should toggle within 1 second

    // Test date range change responsiveness
    const dateRangeStart = Date.now();
    await validator.setDateRange('30d');
    await page.waitForTimeout(500);
    const dateRangeTime = Date.now() - dateRangeStart;

    expect(dateRangeTime).toBeLessThan(2000); // Should update within 2 seconds

    console.log(`R-mode switch time: ${rModeTime}ms`);
    console.log(`G/N toggle time: ${gnToggleTime}ms`);
    console.log(`Date range change time: ${dateRangeTime}ms`);
    console.log('✓ Performance and responsiveness validation passed');
  });

  test('Edge Cases and Error Handling', async ({ page }) => {
    console.log('Testing edge cases and error handling...');

    // Test behavior with potentially empty data
    await validator.setDateRange('7d'); // Smallest range, might have limited data
    await validator.setDisplayMode('R');

    const sevenDayMetrics = await validator.captureMetrics();

    // Verify that even with limited data, R-mode formats are maintained
    // Values might be 0.00R, but should still follow the format
    expect(validator.validateRModeFormat(sevenDayMetrics.totalPnL.value) ||
           sevenDayMetrics.totalPnL.value === '∞' ||
           sevenDayMetrics.totalPnL.value === '0.00R').toBe(true);

    // Test multiple rapid toggles don't break the interface
    for (let i = 0; i < 5; i++) {
      await validator.setPnLMode('G');
      await page.waitForTimeout(50);
      await validator.setPnLMode('N');
      await page.waitForTimeout(50);
    }

    // Verify interface is still functional after rapid toggles
    const finalMetrics = await validator.captureMetrics();
    expect(validator.validateRModeFormat(finalMetrics.totalPnL.value) ||
           finalMetrics.totalPnL.value === '∞').toBe(true);

    console.log('✓ Edge cases and error handling validated');
  });
});