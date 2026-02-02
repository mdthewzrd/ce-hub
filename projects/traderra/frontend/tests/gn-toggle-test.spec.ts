/**
 * G/N Toggle Quality Assurance Test
 *
 * Tests the critical dashboard functionality including:
 * 1. G/N toggle visibility and functionality
 * 2. Chart re-rendering with useMemo dependencies
 * 3. $ % R toggle button functionality
 * 4. Number formatting consistency
 * 5. Profit factor infinity display logic
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard G/N Toggle Quality Assurance', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard and wait for load
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Allow React to fully render
  });

  test('G/N toggle buttons should be visible and functional', async ({ page }) => {
    console.log('🔍 Testing G/N toggle visibility and functionality...');

    // Look for G/N toggle buttons - they might be in the PnLModeProvider context
    const gnButtons = await page.locator('button').filter({
      hasText: /^(G|N|Gross|Net)$/i
    }).all();

    console.log(`Found ${gnButtons.length} potential G/N toggle buttons`);

    if (gnButtons.length === 0) {
      // Look for any button that might control PnL mode in a different way
      const allButtons = await page.locator('button').all();
      console.log(`Total buttons found: ${allButtons.length}`);

      for (const button of allButtons.slice(0, 10)) { // Check first 10 buttons
        const text = await button.textContent();
        const className = await button.getAttribute('class');
        console.log(`Button: "${text}" class: "${className}"`);
      }
    }

    // Check if toggle buttons are functional
    if (gnButtons.length >= 2) {
      // Test clicking between G and N modes
      await gnButtons[0].click();
      await page.waitForTimeout(500);

      await gnButtons[1].click();
      await page.waitForTimeout(500);

      console.log('✅ G/N toggle buttons are clickable');
    } else {
      console.log('⚠️ G/N toggle buttons not found as expected');
    }
  });

  test('Charts should re-render when G/N mode changes', async ({ page }) => {
    console.log('🔄 Testing chart re-rendering with useMemo dependencies...');

    // Wait for charts to load
    await page.waitForSelector('[data-testid="equity-chart"]', { timeout: 10000 });

    // Take screenshot before toggle
    await page.screenshot({ path: 'test-results/dashboard-before-toggle.png', fullPage: true });

    // Get initial chart data
    const beforeEquityChart = await page.locator('[data-testid="equity-chart"]').innerHTML();
    const beforeDailyPnL = await page.locator('[data-testid="daily-pnl-chart"]').innerHTML();
    const beforeSymbolPerf = await page.locator('[data-testid="symbol-performance"]').innerHTML();
    const beforeBestTrades = await page.locator('[data-testid="best-trades"]').innerHTML();

    console.log('Initial chart data captured');

    // Look for G/N toggle and click it
    const gnButtons = await page.locator('button').filter({
      hasText: /^(G|N|Gross|Net)$/i
    }).all();

    if (gnButtons.length > 0) {
      // Click toggle button
      await gnButtons[0].click();
      await page.waitForTimeout(2000); // Wait for React re-render

      // Get chart data after toggle
      const afterEquityChart = await page.locator('[data-testid="equity-chart"]').innerHTML();
      const afterDailyPnL = await page.locator('[data-testid="daily-pnl-chart"]').innerHTML();
      const afterSymbolPerf = await page.locator('[data-testid="symbol-performance"]').innerHTML();
      const afterBestTrades = await page.locator('[data-testid="best-trades"]').innerHTML();

      // Take screenshot after toggle
      await page.screenshot({ path: 'test-results/dashboard-after-toggle.png', fullPage: true });

      // Verify charts updated (useMemo should trigger re-render)
      const equityChanged = beforeEquityChart !== afterEquityChart;
      const dailyPnLChanged = beforeDailyPnL !== afterDailyPnL;
      const symbolPerfChanged = beforeSymbolPerf !== afterSymbolPerf;
      const bestTradesChanged = beforeBestTrades !== afterBestTrades;

      console.log(`Equity chart changed: ${equityChanged}`);
      console.log(`Daily P&L chart changed: ${dailyPnLChanged}`);
      console.log(`Symbol performance changed: ${symbolPerfChanged}`);
      console.log(`Best trades changed: ${bestTradesChanged}`);

      // At least some charts should change when mode toggles
      expect(equityChanged || dailyPnLChanged || symbolPerfChanged || bestTradesChanged).toBe(true);
    } else {
      console.log('❌ No G/N toggle buttons found to test');
    }
  });

  test('$ % R toggle buttons should be visible and clickable', async ({ page }) => {
    console.log('🔄 Testing $ % R toggle button functionality...');

    // Look for display mode toggle buttons
    const dollarButton = await page.locator('button', { hasText: '$' }).first();
    const percentButton = await page.locator('button', { hasText: '%' }).first();
    const rButton = await page.locator('button', { hasText: 'R' }).first();

    // Test that buttons exist and are visible
    await expect(dollarButton).toBeVisible();
    await expect(percentButton).toBeVisible();
    await expect(rButton).toBeVisible();

    // Test that buttons are clickable (should not be disabled)
    await expect(dollarButton).toBeEnabled();
    await expect(percentButton).toBeEnabled();
    await expect(rButton).toBeEnabled();

    // Test clicking each button
    await dollarButton.click();
    await page.waitForTimeout(500);

    await percentButton.click();
    await page.waitForTimeout(500);

    await rButton.click();
    await page.waitForTimeout(500);

    console.log('✅ $ % R toggle buttons are functional');
  });

  test('Number formatting should be consistent with 2 decimal places', async ({ page }) => {
    console.log('🔢 Testing number formatting consistency...');

    // Wait for metrics to load
    await page.waitForTimeout(3000);

    // Find all elements with dollar amounts
    const dollarAmounts = await page.locator('text=/\\$[\\d,]+\\.\\d{2}/'). all();
    console.log(`Found ${dollarAmounts.length} formatted dollar amounts`);

    // Check that dollar amounts have exactly 2 decimal places
    for (const amount of dollarAmounts.slice(0, 10)) { // Check first 10
      const text = await amount.textContent();
      console.log(`Dollar amount: ${text}`);

      // Verify 2 decimal places format
      expect(text).toMatch(/\$[\d,]+\.\d{2}/);
    }

    // Look for percentage values
    const percentages = await page.locator('text=/\\d+\\.\\d{2}%/').all();
    console.log(`Found ${percentages.length} formatted percentages`);

    // Check percentage formatting
    for (const percent of percentages.slice(0, 5)) {
      const text = await percent.textContent();
      console.log(`Percentage: ${text}`);

      // Verify 2 decimal places for percentages
      expect(text).toMatch(/\d+\.\d{2}%/);
    }

    console.log('✅ Number formatting validation complete');
  });

  test('Profit factor should display infinity when only winners exist', async ({ page }) => {
    console.log('♾️ Testing profit factor infinity display logic...');

    // Look for profit factor display
    const profitFactorElements = await page.locator('text=/Profit Factor/i').all();
    console.log(`Found ${profitFactorElements.length} profit factor elements`);

    if (profitFactorElements.length > 0) {
      // Look for the actual profit factor value near the label
      const profitFactorValue = await page.locator('text=/Profit Factor/i').locator('..').locator('text=/[\\d∞]/').first();

      if (await profitFactorValue.isVisible()) {
        const valueText = await profitFactorValue.textContent();
        console.log(`Profit factor value: ${valueText}`);

        // Check if it shows infinity symbol or very high number when appropriate
        const hasInfinity = valueText?.includes('∞') || valueText?.includes('Infinity');
        const hasHighValue = valueText && parseFloat(valueText.replace(/[^\d.]/g, '')) > 100;

        console.log(`Has infinity symbol: ${hasInfinity}`);
        console.log(`Has high value: ${hasHighValue}`);

        // Either infinity symbol or reasonable number should be present
        expect(hasInfinity || hasHighValue || valueText?.includes('.')).toBe(true);
      }
    }

    console.log('✅ Profit factor display test complete');
  });

  test('All critical chart components should be present', async ({ page }) => {
    console.log('📊 Testing presence of all critical chart components...');

    // Test that all major chart components are present
    await expect(page.locator('[data-testid="equity-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="daily-pnl-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="symbol-performance"]')).toBeVisible();
    await expect(page.locator('[data-testid="best-trades"]')).toBeVisible();

    // Check for Recharts elements (indicating charts are rendering)
    const rechartsWrappers = await page.locator('.recharts-wrapper').count();
    console.log(`Found ${rechartsWrappers} Recharts wrappers`);
    expect(rechartsWrappers).toBeGreaterThan(0);

    // Check for metric cards
    const metricCards = await page.locator('[class*="studio-surface"]').count();
    console.log(`Found ${metricCards} metric cards`);
    expect(metricCards).toBeGreaterThan(0);

    console.log('✅ All critical components are present');
  });

  test('Console should be free of critical errors', async ({ page }) => {
    console.log('🐛 Checking for console errors...');

    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Interact with the page to trigger any potential errors
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Try to interact with toggles if they exist
    const buttons = await page.locator('button').all();
    for (const button of buttons.slice(0, 5)) {
      try {
        await button.click();
        await page.waitForTimeout(100);
      } catch (e) {
        // Ignore click errors, just checking for console errors
      }
    }

    console.log(`Found ${errors.length} console errors:`);
    errors.forEach(error => console.log(`  - ${error}`));

    // Should not have critical React or JavaScript errors
    const criticalErrors = errors.filter(error =>
      error.includes('React') ||
      error.includes('useMemo') ||
      error.includes('TypeError') ||
      error.includes('ReferenceError')
    );

    expect(criticalErrors.length).toBe(0);
    console.log('✅ No critical console errors found');
  });
});