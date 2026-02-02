import { test, expect } from '@playwright/test'

test.describe('Simple Button Click Test', () => {
  test('trades page - click 7d button', async ({ page }) => {
    await page.goto('http://localhost:6565/trades')
    // Don't wait for networkidle - just wait for the buttons to appear
    await page.waitForTimeout(3000)

    // Find the 7d button
    const button = page.getByText('7d').first()
    await button.waitFor({ state: 'visible' })

    // Get computed cursor
    const cursor = await button.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).cursor
    })
    console.log(`7d button cursor: ${cursor}`)

    // Get pointer events
    const pointerEvents = await button.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).pointerEvents
    })
    console.log(`7d button pointer-events: ${pointerEvents}`)

    // Check if anything is covering the button
    const box = await button.boundingBox()
    if (box) {
      const elementAtPoint = await page.evaluate((point) => {
        const el = document.elementFromPoint(point.x, point.y)
        return {
          tagName: el?.tagName,
          textContent: el?.textContent?.slice(0, 50),
          isButton: el?.tagName === 'BUTTON'
        }
      }, { x: box.x + box.width / 2, y: box.y + box.height / 2 })
      console.log(`Element at button center:`, elementAtPoint)
    }

    // Try clicking
    console.log('Attempting to click 7d button...')
    await button.click({ timeout: 5000 })
    console.log('Click completed!')

    // Wait a bit and check if button became active
    await page.waitForTimeout(500)
    const isActive = await button.evaluate((el: HTMLElement) => {
      return el.classList.contains('bg-[#B8860B]') ||
             el.getAttribute('data-active') === 'true' ||
             window.getComputedStyle(el).backgroundColor === 'rgb(184, 134, 11)'
    })
    console.log(`7d button active after click: ${isActive}`)
  })

  test('trades page - click G button', async ({ page }) => {
    await page.goto('http://localhost:6565/trades')
    await page.waitForTimeout(3000)

    const button = page.locator('#pnl-mode-gross-button').first()
    await button.waitFor({ state: 'visible' })

    const cursor = await button.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).cursor
    })
    console.log(`G button cursor: ${cursor}`)

    const box = await button.boundingBox()
    if (box) {
      const elementAtPoint = await page.evaluate((point) => {
        const el = document.elementFromPoint(point.x, point.y)
        return {
          tagName: el?.tagName,
          textContent: el?.textContent?.slice(0, 10),
          isButton: el?.tagName === 'BUTTON',
          pointerEvents: el ? window.getComputedStyle(el).pointerEvents : null
        }
      }, { x: box.x + box.width / 2, y: box.y + box.height / 2 })
      console.log(`Element at G button center:`, elementAtPoint)
    }

    console.log('Attempting to click G button...')
    await button.click({ timeout: 5000 })
    console.log('Click completed!')

    await page.waitForTimeout(500)
  })

  test('check console for errors', async ({ page }) => {
    const errors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    page.on('pageerror', error => {
      errors.push(error.toString())
    })

    await page.goto('http://localhost:6565/trades')
    await page.waitForTimeout(5000)

    console.log('Console errors:', errors)
  })
})
