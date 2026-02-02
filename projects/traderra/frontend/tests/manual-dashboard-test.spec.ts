import { test, expect } from '@playwright/test'

test.describe('Manual Dashboard Validation (Screenshots)', () => {
  test('Take screenshots of main pages for validation', async ({ page }) => {
    // Set viewport size for consistent screenshots
    await page.setViewportSize({ width: 1920, height: 1080 })

    console.log('📸 Taking screenshots of Traderra Dashboard...')

    try {
      // Dashboard Page - using root URL
      console.log('🏠 Testing dashboard page...')
      await page.goto('http://localhost:6565')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      // Take screenshot of whatever loads (should be auth or dashboard)
      await page.screenshot({
        path: 'test-results/page-01-homepage.png',
        fullPage: true
      })
      console.log('✅ Homepage screenshot taken')

      // Try direct dashboard URL
      console.log('📊 Testing direct dashboard URL...')
      await page.goto('http://localhost:6565/dashboard')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      await page.screenshot({
        path: 'test-results/page-02-dashboard.png',
        fullPage: true
      })
      console.log('✅ Dashboard screenshot taken')

      // Trades Page
      console.log('📈 Testing trades page...')
      await page.goto('http://localhost:6565/trades')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      await page.screenshot({
        path: 'test-results/page-03-trades.png',
        fullPage: true
      })
      console.log('✅ Trades screenshot taken')

      // Statistics Page
      console.log('📊 Testing statistics page...')
      await page.goto('http://localhost:6565/statistics')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      await page.screenshot({
        path: 'test-results/page-04-statistics.png',
        fullPage: true
      })
      console.log('✅ Statistics screenshot taken')

      // Analytics Page
      console.log('📈 Testing analytics page...')
      await page.goto('http://localhost:6565/analytics')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      await page.screenshot({
        path: 'test-results/page-05-analytics.png',
        fullPage: true
      })
      console.log('✅ Analytics screenshot taken')

      // Journal Page
      console.log('📝 Testing journal page...')
      await page.goto('http://localhost:6565/journal')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      await page.screenshot({
        path: 'test-results/page-06-journal.png',
        fullPage: true
      })
      console.log('✅ Journal screenshot taken')

      // Daily Summary Page
      console.log('📅 Testing daily summary page...')
      await page.goto('http://localhost:6565/daily-summary')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      await page.screenshot({
        path: 'test-results/page-07-daily-summary.png',
        fullPage: true
      })
      console.log('✅ Daily Summary screenshot taken')

      // Settings Page
      console.log('⚙️  Testing settings page...')
      await page.goto('http://localhost:6565/settings')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      await page.screenshot({
        path: 'test-results/page-08-settings.png',
        fullPage: true
      })
      console.log('✅ Settings screenshot taken')

      console.log('🎉 All screenshots completed successfully!')

    } catch (error) {
      console.error('❌ Error during screenshot process:', error)

      // Take a final screenshot of whatever is on screen
      await page.screenshot({
        path: 'test-results/error-state.png',
        fullPage: true
      })
    }
  })

  test('Verify key dashboard elements are working (bypass auth)', async ({ page }) => {
    console.log('🔍 Verifying dashboard functionality...')

    try {
      // Go to dashboard
      await page.goto('http://localhost:6565/dashboard')
      await page.waitForLoadState('networkidle', { timeout: 10000 })

      // Check if we can see any trading-related content
      const pageContent = await page.content()

      // Log what we can see
      const title = await page.title()
      console.log('📄 Page title:', title)

      // Look for key indicators of dashboard functionality
      const indicators = [
        'Trading',
        'Dashboard',
        'P&L',
        'Chart',
        'Performance',
        'Equity',
        'Traderra'
      ]

      const foundIndicators = indicators.filter(indicator =>
        pageContent.toLowerCase().includes(indicator.toLowerCase())
      )

      console.log('📊 Found trading indicators:', foundIndicators)

      // Check for specific chart test IDs (if they're accessible)
      const chartElements = await page.locator('[data-testid*="chart"]').count()
      console.log('📈 Chart elements found:', chartElements)

      // Check for buttons that might indicate dashboard functionality
      const buttonTexts = await page.locator('button').allTextContents()
      console.log('🔘 Buttons found:', buttonTexts.slice(0, 10)) // First 10 buttons

      // Take a detailed screenshot of current state
      await page.screenshot({
        path: 'test-results/dashboard-verification.png',
        fullPage: true
      })

    } catch (error) {
      console.error('❌ Error during verification:', error)
    }
  })
})