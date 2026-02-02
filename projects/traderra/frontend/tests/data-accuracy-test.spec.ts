import { test, expect } from '@playwright/test'

test.describe('Data Accuracy Investigation', () => {
  test('Comprehensive data accuracy analysis', async ({ page }) => {
    console.log('🔍 Starting comprehensive data accuracy investigation...')

    // Set viewport size for consistent testing
    await page.setViewportSize({ width: 1920, height: 1080 })

    try {
      // Navigate to the app
      console.log('📱 Navigating to Traderra...')
      await page.goto('http://localhost:6565')
      await page.waitForLoadState('networkidle', { timeout: 15000 })

      // Take initial screenshot
      await page.screenshot({
        path: 'test-results/data-accuracy-01-initial.png',
        fullPage: true
      })

      // Navigate to trades page
      console.log('📊 Navigating to trades page...')
      await page.goto('http://localhost:6565/trades')
      await page.waitForLoadState('networkidle', { timeout: 15000 })

      await page.screenshot({
        path: 'test-results/data-accuracy-02-trades-page.png',
        fullPage: true
      })

      // Check if there are any trades loaded
      const tradesTableExists = await page.locator('table').count() > 0
      console.log('📋 Trades table exists:', tradesTableExists)

      if (tradesTableExists) {
        // Count visible trades
        const tradeRows = await page.locator('table tbody tr').count()
        console.log('📊 Visible trade rows:', tradeRows)

        // Take screenshot of trades table
        await page.screenshot({
          path: 'test-results/data-accuracy-03-trades-table.png',
          fullPage: true
        })
      }

      // Navigate to dashboard to check metrics
      console.log('📈 Navigating to dashboard...')
      await page.goto('http://localhost:6565/dashboard')
      await page.waitForLoadState('networkidle', { timeout: 15000 })

      await page.screenshot({
        path: 'test-results/data-accuracy-04-dashboard.png',
        fullPage: true
      })

      // Wait for any dynamic content to load
      await page.waitForTimeout(3000)

      // Look for key metrics on the dashboard
      const dashboardMetrics = await page.evaluate(() => {
        const metrics = {
          totalPnL: null as string | null,
          totalTrades: null as string | null,
          winRate: null as string | null,
          sharpeRatio: null as string | null,
          profitFactor: null as string | null
        }

        // Try to find P&L value - look for currency formatted numbers
        const pnlElements = document.querySelectorAll('*')
        for (const element of pnlElements) {
          const text = element.textContent?.trim()
          if (text && text.match(/\$[\d,]+\.?\d*/)) {
            // Look for large dollar amounts that could be total P&L
            const match = text.match(/\$([\d,]+\.?\d*)/)
            if (match) {
              const value = parseFloat(match[1].replace(/,/g, ''))
              if (value > 1000) { // Likely total P&L if over $1000
                metrics.totalPnL = text
                break
              }
            }
          }
        }

        // Look for trade count
        const numberElements = document.querySelectorAll('*')
        for (const element of numberElements) {
          const text = element.textContent?.trim()
          if (text && text.match(/^\d+$/) && parseInt(text) > 10 && parseInt(text) < 10000) {
            // Could be trade count
            if (!metrics.totalTrades || parseInt(text) > parseInt(metrics.totalTrades)) {
              metrics.totalTrades = text
            }
          }
        }

        // Look for percentage values (win rate, etc.)
        for (const element of pnlElements) {
          const text = element.textContent?.trim()
          if (text && text.includes('%')) {
            if (!metrics.winRate && text.match(/\d+\.?\d*%/)) {
              metrics.winRate = text
            }
          }
        }

        return metrics
      })

      console.log('📊 Dashboard metrics found:', dashboardMetrics)

      // Navigate to statistics page for more detailed analysis
      console.log('📈 Navigating to statistics page...')
      await page.goto('http://localhost:6565/statistics')
      await page.waitForLoadState('networkidle', { timeout: 15000 })

      await page.screenshot({
        path: 'test-results/data-accuracy-05-statistics.png',
        fullPage: true
      })

      // Extract all visible statistics
      const statisticsData = await page.evaluate(() => {
        const stats: { [key: string]: string } = {}

        // Look for any elements that contain currency or percentage values
        const allElements = document.querySelectorAll('*')

        for (const element of allElements) {
          const text = element.textContent?.trim()
          if (text) {
            // Currency values
            if (text.match(/\$[\d,]+\.?\d*/)) {
              const parent = element.parentElement
              const label = parent?.querySelector('*')?.textContent?.trim()
              if (label && label !== text) {
                stats[label] = text
              }
            }

            // Percentage values
            if (text.match(/\d+\.?\d*%/)) {
              const parent = element.parentElement
              const label = parent?.querySelector('*')?.textContent?.trim()
              if (label && label !== text) {
                stats[label] = text
              }
            }

            // Number values
            if (text.match(/^\d{1,6}\.?\d*$/)) {
              const parent = element.parentElement
              const label = parent?.querySelector('*')?.textContent?.trim()
              if (label && label !== text && !label.includes(text)) {
                stats[label] = text
              }
            }
          }
        }

        return stats
      })

      console.log('📊 Statistics page data:', statisticsData)

      // Take a final comprehensive screenshot
      await page.screenshot({
        path: 'test-results/data-accuracy-06-final-state.png',
        fullPage: true
      })

      // Try to access browser console logs for any data-related information
      const consoleLogs: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'log' || msg.type() === 'error') {
          consoleLogs.push(`${msg.type()}: ${msg.text()}`)
        }
      })

      // Test the API directly
      console.log('🔌 Testing API endpoints...')

      const apiResponse = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/trades')
          if (response.ok) {
            const data = await response.json()
            return {
              success: true,
              tradeCount: data.trades?.length || 0,
              sampleTrade: data.trades?.[0] || null,
              totalPnL: data.trades?.reduce((sum: number, trade: any) => sum + (trade.pnl || 0), 0) || 0
            }
          } else {
            return { success: false, error: response.statusText }
          }
        } catch (error) {
          return { success: false, error: error.message }
        }
      })

      console.log('🔌 API Response:', apiResponse)

      // Create a comprehensive report
      const report = {
        timestamp: new Date().toISOString(),
        dashboardMetrics,
        statisticsData,
        apiResponse,
        consoleLogs: consoleLogs.slice(-20), // Last 20 console messages
        tradesTableExists,
        visibleTradeRows: tradesTableExists ? await page.locator('table tbody tr').count() : 0
      }

      console.log('\n📋 COMPREHENSIVE DATA ACCURACY REPORT')
      console.log('=====================================')
      console.log(JSON.stringify(report, null, 2))

      // Save report to file
      await page.evaluate((reportData) => {
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'data-accuracy-report.json'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, report)

    } catch (error) {
      console.error('❌ Error during data accuracy test:', error)

      // Take error screenshot
      await page.screenshot({
        path: 'test-results/data-accuracy-error.png',
        fullPage: true
      })

      throw error
    }
  })

  test('Trade data consistency check', async ({ page }) => {
    console.log('🔄 Testing trade data consistency...')

    await page.goto('http://localhost:6565/trades')
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    // Check if data loads consistently across page refreshes
    const results = []

    for (let i = 0; i < 3; i++) {
      console.log(`🔄 Consistency check ${i + 1}/3...`)

      await page.reload()
      await page.waitForLoadState('networkidle', { timeout: 15000 })
      await page.waitForTimeout(2000) // Wait for any async loading

      const tradeCount = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/trades')
          if (response.ok) {
            const data = await response.json()
            return {
              count: data.trades?.length || 0,
              totalPnL: data.trades?.reduce((sum: number, trade: any) => sum + (trade.pnl || 0), 0) || 0
            }
          }
          return { count: 0, totalPnL: 0 }
        } catch {
          return { count: 0, totalPnL: 0 }
        }
      })

      results.push(tradeCount)

      await page.screenshot({
        path: `test-results/consistency-check-${i + 1}.png`,
        fullPage: true
      })
    }

    console.log('📊 Consistency results:', results)

    // Check if all results are the same
    const isConsistent = results.every(result =>
      result.count === results[0].count &&
      Math.abs(result.totalPnL - results[0].totalPnL) < 0.01
    )

    console.log('✅ Data consistency:', isConsistent ? 'CONSISTENT' : 'INCONSISTENT')

    if (!isConsistent) {
      console.warn('⚠️  CONSISTENCY ISSUE DETECTED!')
      console.log('Results variation:', results)
    }
  })
})