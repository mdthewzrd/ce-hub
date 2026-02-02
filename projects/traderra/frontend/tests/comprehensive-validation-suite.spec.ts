import { test, expect } from '@playwright/test'

test('Comprehensive Chat Validation Suite', async ({ page }) => {
  console.log('🧪 === COMPREHENSIVE VALIDATION SUITE ===')

  let totalTests = 0
  let passedTests = 0
  let failedTests = 0
  const results: Array<{test: string, expected: string, actual: string, passed: boolean}> = []

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const captureButtonStates = async () => {
    return await page.evaluate(() => {
      const dollarActive = document.querySelector('button[aria-label*="Switch to Dollar display mode"]')?.classList.contains('bg-[#B8860B]') || false
      const rActive = document.querySelector('button[aria-label*="Switch to Risk Multiple display mode"]')?.classList.contains('bg-[#B8860B]') || false

      const allButtons = Array.from(document.querySelectorAll('button'))
      const btn7d = allButtons.find(btn => btn.textContent?.trim() === '7d')
      const btn30d = allButtons.find(btn => btn.textContent?.trim() === '30d')
      const btn90d = allButtons.find(btn => btn.textContent?.trim() === '90d')
      const btnAll = allButtons.find(btn => btn.textContent?.trim() === 'All')

      const btn7dActive = btn7d?.classList.contains('bg-[#B8860B]') || btn7d?.classList.contains('traderra-date-active') || false
      const btn30dActive = btn30d?.classList.contains('bg-[#B8860B]') || btn30d?.classList.contains('traderra-date-active') || false
      const btn90dActive = btn90d?.classList.contains('bg-[#B8860B]') || btn90d?.classList.contains('traderra-date-active') || false
      const btnAllActive = btnAll?.classList.contains('bg-[#B8860B]') || btnAll?.classList.contains('traderra-date-active') || false

      return {
        dollar: dollarActive,
        r: rActive,
        day7: btn7dActive,
        day30: btn30dActive,
        day90: btn90dActive,
        all: btnAllActive
      }
    })
  }

  const runTest = async (command: string, expected: any, testName: string) => {
    console.log(`\n🧪 Running test: ${testName}`)
    console.log(`Command: "${command}"`)

    totalTests++

    // Go to statistics page for each test
    await page.goto('/statistics')
    await page.waitForSelector('textarea[placeholder*="Ask Renata"]')
    await sleep(1000)

    // Capture initial state
    const initialState = await captureButtonStates()
    console.log(`Initial state: ${JSON.stringify(initialState)}`)

    // Send command
    await page.fill('textarea[placeholder*="Ask Renata"]', command)
    await page.press('textarea[placeholder*="Ask Renata"]', 'Enter')

    // Wait for processing (longer for navigation commands)
    const isNavigation = command.includes('dashboard') || command.includes('statistics') || command.includes('trades')
    await sleep(isNavigation ? 8000 : 4000)

    // Capture final state
    const finalState = await captureButtonStates()
    console.log(`Final state: ${JSON.stringify(finalState)}`)
    console.log(`Expected: ${JSON.stringify(expected)}`)

    // Check if result matches expectation
    const passed = Object.keys(expected).every(key => finalState[key] === expected[key])

    if (passed) {
      console.log('✅ PASSED')
      passedTests++
    } else {
      console.log('❌ FAILED')
      failedTests++
    }

    results.push({
      test: testName,
      expected: JSON.stringify(expected),
      actual: JSON.stringify(finalState),
      passed
    })

    return passed
  }

  console.log('\n📊 === TESTING NAVIGATION + DISPLAY MODE COMMANDS ===')

  await runTest(
    'Can we look at the statistics page in dollars?',
    { dollar: true, r: false },
    'Statistics + Dollar Mode'
  )

  await runTest(
    'Can we look at the dashboard page in R?',
    { dollar: false, r: true },
    'Dashboard + R Mode'
  )

  console.log('\n📅 === TESTING NAVIGATION + DATE RANGE COMMANDS ===')

  await runTest(
    'Can we look at the statistics page for all time?',
    { all: true, day90: false, day30: false, day7: false },
    'Statistics + All Time'
  )

  await runTest(
    'Can we look at the dashboard page for the last 90 days?',
    { all: false, day90: true, day30: false, day7: false },
    'Dashboard + 90 Days'
  )

  console.log('\n🔄 === TESTING COMBINED COMMANDS ===')

  await runTest(
    'Can we look at the dashboard page for the last 90 days in R?',
    { dollar: false, r: true, all: false, day90: true, day30: false, day7: false },
    'Dashboard + 90 Days + R Mode'
  )

  await runTest(
    'Can we look at the statistics page for all time in dollars?',
    { dollar: true, r: false, all: true, day90: false, day30: false, day7: false },
    'Statistics + All Time + Dollar Mode'
  )

  console.log('\n⚡ === TESTING STANDALONE COMMANDS ===')

  await runTest(
    'R',
    { dollar: false, r: true },
    'Standalone R Command'
  )

  await runTest(
    'Dollar',
    { dollar: true, r: false },
    'Standalone Dollar Command'
  )

  await runTest(
    'All time',
    { all: true, day90: false, day30: false, day7: false },
    'Standalone All Time Command'
  )

  console.log('\n🎯 === TESTING EDGE CASES ===')

  await runTest(
    'Show me the data in R?',
    { dollar: false, r: true },
    'Casual R Request'
  )

  await runTest(
    'Switch to dollar view',
    { dollar: true, r: false },
    'Explicit Dollar Switch'
  )

  console.log('\n📊 === COMPREHENSIVE RESULTS ===')
  console.log(`\n🎯 OVERALL SCORE: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`)
  console.log(`✅ Passed: ${passedTests}`)
  console.log(`❌ Failed: ${failedTests}`)

  console.log('\n📋 DETAILED RESULTS:')
  results.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌'
    console.log(`${status} ${index + 1}. ${result.test}`)
    if (!result.passed) {
      console.log(`   Expected: ${result.expected}`)
      console.log(`   Actual: ${result.actual}`)
    }
  })

  console.log('\n🔍 COMPONENT ANALYSIS:')

  // Analyze by category
  const navigationTests = results.filter(r => r.test.includes('Dashboard') || r.test.includes('Statistics'))
  const displayModeTests = results.filter(r => r.test.includes('Dollar') || r.test.includes('R Mode') || r.test.includes('R Command'))
  const dateRangeTests = results.filter(r => r.test.includes('Time') || r.test.includes('Days'))
  const standaloneTests = results.filter(r => r.test.includes('Standalone'))

  const analyzeCategory = (tests: typeof results, name: string) => {
    const passed = tests.filter(t => t.passed).length
    const total = tests.length
    const percentage = total > 0 ? Math.round(passed/total*100) : 0
    console.log(`${name}: ${passed}/${total} (${percentage}%)`)
    return percentage
  }

  const navigationScore = analyzeCategory(navigationTests, 'Navigation')
  const displayModeScore = analyzeCategory(displayModeTests, 'Display Mode')
  const dateRangeScore = analyzeCategory(dateRangeTests, 'Date Range')
  const standaloneScore = analyzeCategory(standaloneTests, 'Standalone')

  console.log('\n🎖️ === FINAL ASSESSMENT ===')
  console.log(`Overall System Score: ${Math.round(passedTests/totalTests*100)}%`)

  if (passedTests/totalTests >= 0.9) {
    console.log('🏆 EXCELLENT - System is working very well')
  } else if (passedTests/totalTests >= 0.7) {
    console.log('✅ GOOD - System is mostly working with some issues')
  } else if (passedTests/totalTests >= 0.5) {
    console.log('⚠️ NEEDS WORK - System has significant issues')
  } else {
    console.log('❌ CRITICAL - System needs major fixes')
  }

  // Take final screenshot of test results
  await page.screenshot({
    path: 'tests/screenshots/comprehensive-results.png',
    fullPage: true
  })

  console.log('\n📸 Screenshot saved: tests/screenshots/comprehensive-results.png')
})