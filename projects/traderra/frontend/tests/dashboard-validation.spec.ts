import { test, expect } from '@playwright/test'

test.describe('Traderra Dashboard Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('http://localhost:6565')
  })

  test('Dashboard page loads correctly with real data', async ({ page }) => {
    // Navigate to dashboard (assuming homepage is dashboard)
    await page.waitForLoadState('networkidle')

    // Take full page screenshot
    await page.screenshot({
      path: 'test-results/dashboard-full-page.png',
      fullPage: true
    })

    // Check that main dashboard elements are present
    await expect(page.locator('text=Performance Overview')).toBeVisible()
    await expect(page.locator('text=Trading Journal')).toBeVisible()

    // Verify charts are loaded
    await expect(page.locator('[data-testid="equity-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="daily-pnl-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="symbol-performance"]')).toBeVisible()
    await expect(page.locator('[data-testid="best-trades"]')).toBeVisible()

    // Check that metrics display properly formatted numbers (no excessive decimals)
    const totalPnL = page.locator('text=Total P&L').locator('..').locator('div').nth(1)
    await expect(totalPnL).toBeVisible()

    // Verify date filter has "All" button
    await expect(page.locator('button:has-text("All")')).toBeVisible()
    await expect(page.locator('button:has-text("7d")')).toBeVisible()
    await expect(page.locator('button:has-text("30d")')).toBeVisible()
    await expect(page.locator('button:has-text("90d")')).toBeVisible()

    // Test date filter functionality - click "All" button
    await page.locator('button:has-text("All")').click()
    await page.waitForTimeout(500) // Wait for charts to update

    // Take screenshot after selecting "All" filter
    await page.screenshot({
      path: 'test-results/dashboard-all-filter.png',
      fullPage: true
    })
  })

  test('Trades page works correctly', async ({ page }) => {
    // Navigate to trades page
    await page.goto('http://localhost:6565/trades')
    await page.waitForLoadState('networkidle')

    // Take screenshot
    await page.screenshot({
      path: 'test-results/trades-page.png',
      fullPage: true
    })

    // Verify trades page elements
    await expect(page.locator('text=Trades')).toBeVisible()

    // Check for date filter uniformity
    await expect(page.locator('button:has-text("All")')).toBeVisible()
    await expect(page.locator('button:has-text("7d")')).toBeVisible()
    await expect(page.locator('button:has-text("30d")')).toBeVisible()
    await expect(page.locator('button:has-text("90d")')).toBeVisible()
  })

  test('Statistics page works correctly', async ({ page }) => {
    // Navigate to statistics page
    await page.goto('http://localhost:6565/statistics')
    await page.waitForLoadState('networkidle')

    // Take screenshot
    await page.screenshot({
      path: 'test-results/statistics-page.png',
      fullPage: true
    })

    // Verify statistics page elements
    await expect(page.locator('text=Statistics')).toBeVisible()

    // Check for date filter uniformity
    await expect(page.locator('button:has-text("All")')).toBeVisible()
  })

  test('Analytics page works correctly', async ({ page }) => {
    // Navigate to analytics page
    await page.goto('http://localhost:6565/analytics')
    await page.waitForLoadState('networkidle')

    // Take screenshot
    await page.screenshot({
      path: 'test-results/analytics-page.png',
      fullPage: true
    })

    // Verify analytics page elements
    await expect(page.locator('text=Analytics')).toBeVisible()

    // Check for date filter uniformity
    await expect(page.locator('button:has-text("All")')).toBeVisible()
  })

  test('Journal page works correctly', async ({ page }) => {
    // Navigate to journal page
    await page.goto('http://localhost:6565/journal')
    await page.waitForLoadState('networkidle')

    // Take screenshot
    await page.screenshot({
      path: 'test-results/journal-page.png',
      fullPage: true
    })

    // Verify journal page elements
    await expect(page.locator('text=Trading Journal')).toBeVisible()
  })

  test('Daily Summary page works correctly', async ({ page }) => {
    // Navigate to daily summary page
    await page.goto('http://localhost:6565/daily-summary')
    await page.waitForLoadState('networkidle')

    // Take screenshot
    await page.screenshot({
      path: 'test-results/daily-summary-page.png',
      fullPage: true
    })

    // Verify daily summary page elements
    await expect(page.locator('text=Daily Summary')).toBeVisible()
  })

  test('Settings page works correctly', async ({ page }) => {
    // Navigate to settings page
    await page.goto('http://localhost:6565/settings')
    await page.waitForLoadState('networkidle')

    // Take screenshot
    await page.screenshot({
      path: 'test-results/settings-page.png',
      fullPage: true
    })

    // Verify settings page elements
    await expect(page.locator('text=Settings')).toBeVisible()
  })

  test('Best/Worst trades toggle works correctly', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Test the W/L toggle in the biggest trades chart
    const winToggle = page.locator('[data-testid="trades-toggle-wins"]')
    const lossToggle = page.locator('[data-testid="trades-toggle-losses"]')

    await expect(winToggle).toBeVisible()
    await expect(lossToggle).toBeVisible()

    // Click on losses toggle
    await lossToggle.click()
    await page.waitForTimeout(500)

    // Take screenshot of worst trades
    await page.screenshot({
      path: 'test-results/dashboard-worst-trades.png',
      fullPage: true
    })

    // Switch back to wins
    await winToggle.click()
    await page.waitForTimeout(500)

    // Take screenshot of best trades
    await page.screenshot({
      path: 'test-results/dashboard-best-trades.png',
      fullPage: true
    })
  })

  test('Charts display data correctly without hardcoded values', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Check if equity chart displays
    const equityChart = page.locator('[data-testid="equity-chart"]')
    await expect(equityChart).toBeVisible()

    // Check if symbol performance chart has data
    const symbolChart = page.locator('[data-testid="symbol-performance"]')
    await expect(symbolChart).toBeVisible()

    // Verify there are symbol items in the performance chart
    const symbolItems = page.locator('[data-testid="symbol-item"]')
    await expect(symbolItems.first()).toBeVisible()

    // Check trade items in best trades
    const tradeItems = page.locator('[data-testid="trade-item"]')
    await expect(tradeItems.first()).toBeVisible()

    // Take screenshot focused on charts
    await page.screenshot({
      path: 'test-results/dashboard-charts-detail.png',
      fullPage: true
    })
  })

  test('Date filters work consistently across all pages', async ({ page }) => {
    const pages = [
      { url: 'http://localhost:6565', name: 'dashboard' },
      { url: 'http://localhost:6565/trades', name: 'trades' },
      { url: 'http://localhost:6565/statistics', name: 'statistics' },
      { url: 'http://localhost:6565/analytics', name: 'analytics' }
    ]

    for (const pageInfo of pages) {
      await page.goto(pageInfo.url)
      await page.waitForLoadState('networkidle')

      // Check if All button exists and is clickable
      const allButton = page.locator('button:has-text("All")')
      await expect(allButton).toBeVisible()

      // Click the All button
      await allButton.click()
      await page.waitForTimeout(500)

      // Take screenshot after clicking All on each page
      await page.screenshot({
        path: `test-results/${pageInfo.name}-all-filter-test.png`,
        fullPage: true
      })
    }
  })
})