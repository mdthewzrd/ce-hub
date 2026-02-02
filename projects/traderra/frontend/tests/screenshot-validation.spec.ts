import { test, expect } from '@playwright/test'

test('Screenshot validation of chat command execution', async ({ page }) => {
  console.log('🔍 === SCREENSHOT VALIDATION TEST ===')

  // Go to statistics page
  await page.goto('/statistics')
  await page.waitForSelector('textarea[placeholder*="Ask Renata"]')

  // Wait a bit for the page to fully load
  await page.waitForTimeout(2000)

  // Take initial screenshot
  console.log('\n📸 Taking initial screenshot...')
  await page.screenshot({
    path: 'tests/screenshots/before-command.png',
    fullPage: true
  })

  // Record initial button states with detailed inspection
  console.log('\n🔍 === INITIAL BUTTON STATE ANALYSIS ===')

  const initialButtonStates = await page.evaluate(() => {
    const dollarButton = document.querySelector('button[aria-label*="Switch to Dollar display mode"]')
    const rButton = document.querySelector('button[aria-label*="Switch to Risk Multiple display mode"]')

    // Look for date buttons by text content
    const allButtons = Array.from(document.querySelectorAll('button'))
    const btn90d = allButtons.find(btn => btn.textContent?.trim() === '90d')
    const btnAll = allButtons.find(btn => btn.textContent?.trim() === 'All')

    // Get all button classes for inspection
    const dollarClasses = dollarButton?.getAttribute('class') || 'NOT FOUND'
    const rClasses = rButton?.getAttribute('class') || 'NOT FOUND'
    const btn90dClasses = btn90d?.getAttribute('class') || 'NOT FOUND'
    const btnAllClasses = btnAll?.getAttribute('class') || 'NOT FOUND'

    return {
      dollar: {
        found: !!dollarButton,
        active: dollarButton?.classList.contains('bg-[#B8860B]') || false,
        classes: dollarClasses
      },
      r: {
        found: !!rButton,
        active: rButton?.classList.contains('bg-[#B8860B]') || false,
        classes: rClasses
      },
      btn90d: {
        found: !!btn90d,
        active: btn90d?.classList.contains('bg-[#B8860B]') || btn90d?.classList.contains('traderra-date-active') || false,
        classes: btn90dClasses
      },
      btnAll: {
        found: !!btnAll,
        active: btnAll?.classList.contains('bg-[#B8860B]') || btnAll?.classList.contains('traderra-date-active') || false,
        classes: btnAllClasses
      }
    }
  })

  console.log('Initial button states:')
  console.log(`  💰 Dollar button: found=${initialButtonStates.dollar.found}, active=${initialButtonStates.dollar.active}`)
  console.log(`  🎯 R button: found=${initialButtonStates.r.found}, active=${initialButtonStates.r.active}`)
  console.log(`  📅 90d button: found=${initialButtonStates.btn90d.found}, active=${initialButtonStates.btn90d.active}`)
  console.log(`  📅 All button: found=${initialButtonStates.btnAll.found}, active=${initialButtonStates.btnAll.active}`)

  console.log('\nButton classes for debugging:')
  console.log(`  💰 Dollar: ${initialButtonStates.dollar.classes}`)
  console.log(`  🎯 R: ${initialButtonStates.r.classes}`)
  console.log(`  📅 90d: ${initialButtonStates.btn90d.classes}`)
  console.log(`  📅 All: ${initialButtonStates.btnAll.classes}`)

  // Send the problematic command
  console.log('\n💬 === SENDING CHAT COMMAND ===')
  const testCommand = 'Can we look at the dashboard page for the last 90 days in R?'
  console.log(`Command: "${testCommand}"`)

  await page.fill('textarea[placeholder*="Ask Renata"]', testCommand)
  await page.press('textarea[placeholder*="Ask Renata"]', 'Enter')

  // Wait for the navigation message
  console.log('\n⏳ Waiting for chat response...')
  await page.waitForTimeout(3000)

  // Take screenshot after sending command but before full processing
  console.log('\n📸 Taking screenshot after command sent...')
  await page.screenshot({
    path: 'tests/screenshots/after-command-sent.png',
    fullPage: true
  })

  // Wait longer for parsing functions to execute
  console.log('\n⏱️  === WAITING FOR PARSING FUNCTIONS ===')
  await page.waitForTimeout(6000)

  // Take screenshot after parsing should be complete
  console.log('\n📸 Taking final screenshot...')
  await page.screenshot({
    path: 'tests/screenshots/after-parsing.png',
    fullPage: true
  })

  // Record final button states
  console.log('\n🔍 === FINAL BUTTON STATE ANALYSIS ===')

  const finalButtonStates = await page.evaluate(() => {
    const dollarButton = document.querySelector('button[aria-label*="Switch to Dollar display mode"]')
    const rButton = document.querySelector('button[aria-label*="Switch to Risk Multiple display mode"]')

    // Look for date buttons by text content
    const allButtons = Array.from(document.querySelectorAll('button'))
    const btn90d = allButtons.find(btn => btn.textContent?.trim() === '90d')
    const btnAll = allButtons.find(btn => btn.textContent?.trim() === 'All')

    // Get all button classes for inspection
    const dollarClasses = dollarButton?.getAttribute('class') || 'NOT FOUND'
    const rClasses = rButton?.getAttribute('class') || 'NOT FOUND'
    const btn90dClasses = btn90d?.getAttribute('class') || 'NOT FOUND'
    const btnAllClasses = btnAll?.getAttribute('class') || 'NOT FOUND'

    return {
      dollar: {
        found: !!dollarButton,
        active: dollarButton?.classList.contains('bg-[#B8860B]') || false,
        classes: dollarClasses
      },
      r: {
        found: !!rButton,
        active: rButton?.classList.contains('bg-[#B8860B]') || false,
        classes: rClasses
      },
      btn90d: {
        found: !!btn90d,
        active: btn90d?.classList.contains('bg-[#B8860B]') || btn90d?.classList.contains('traderra-date-active') || false,
        classes: btn90dClasses
      },
      btnAll: {
        found: !!btnAll,
        active: btnAll?.classList.contains('bg-[#B8860B]') || btnAll?.classList.contains('traderra-date-active') || false,
        classes: btnAllClasses
      }
    }
  })

  console.log('Final button states:')
  console.log(`  💰 Dollar button: found=${finalButtonStates.dollar.found}, active=${finalButtonStates.dollar.active}`)
  console.log(`  🎯 R button: found=${finalButtonStates.r.found}, active=${finalButtonStates.r.active}`)
  console.log(`  📅 90d button: found=${finalButtonStates.btn90d.found}, active=${finalButtonStates.btn90d.active}`)
  console.log(`  📅 All button: found=${finalButtonStates.btnAll.found}, active=${finalButtonStates.btnAll.active}`)

  console.log('\nButton classes after parsing:')
  console.log(`  💰 Dollar: ${finalButtonStates.dollar.classes}`)
  console.log(`  🎯 R: ${finalButtonStates.r.classes}`)
  console.log(`  📅 90d: ${finalButtonStates.btn90d.classes}`)
  console.log(`  📅 All: ${finalButtonStates.btnAll.classes}`)

  // Analyze changes
  console.log('\n📊 === CHANGE ANALYSIS ===')
  const dollarChanged = initialButtonStates.dollar.active !== finalButtonStates.dollar.active
  const rChanged = initialButtonStates.r.active !== finalButtonStates.r.active
  const btn90dChanged = initialButtonStates.btn90d.active !== finalButtonStates.btn90d.active
  const btnAllChanged = initialButtonStates.btnAll.active !== finalButtonStates.btnAll.active

  console.log(`💰 Dollar button changed: ${dollarChanged} (${initialButtonStates.dollar.active} → ${finalButtonStates.dollar.active})`)
  console.log(`🎯 R button changed: ${rChanged} (${initialButtonStates.r.active} → ${finalButtonStates.r.active})`)
  console.log(`📅 90d button changed: ${btn90dChanged} (${initialButtonStates.btn90d.active} → ${finalButtonStates.btn90d.active})`)
  console.log(`📅 All button changed: ${btnAllChanged} (${initialButtonStates.btnAll.active} → ${finalButtonStates.btnAll.active})`)

  // Expected state analysis
  console.log('\n🎯 === EXPECTED VS ACTUAL ===')
  console.log('Command: "Can we look at the dashboard page for the last 90 days in R?"')
  console.log('Expected state:')
  console.log('  💰 Dollar button: INACTIVE (should switch from $ to R)')
  console.log('  🎯 R button: ACTIVE (user requested R mode)')
  console.log('  📅 90d button: ACTIVE (user requested 90 days)')
  console.log('  📅 All button: INACTIVE (90d requested, not All)')

  console.log('\nActual final state:')
  console.log(`  💰 Dollar button: ${finalButtonStates.dollar.active ? 'ACTIVE' : 'INACTIVE'}`)
  console.log(`  🎯 R button: ${finalButtonStates.r.active ? 'ACTIVE' : 'INACTIVE'}`)
  console.log(`  📅 90d button: ${finalButtonStates.btn90d.active ? 'ACTIVE' : 'INACTIVE'}`)
  console.log(`  📅 All button: ${finalButtonStates.btnAll.active ? 'ACTIVE' : 'INACTIVE'}`)

  // Success analysis
  const dollarCorrect = finalButtonStates.dollar.active === false  // Should be inactive
  const rCorrect = finalButtonStates.r.active === true           // Should be active
  const btn90dCorrect = finalButtonStates.btn90d.active === true    // Should be active
  const btnAllCorrect = finalButtonStates.btnAll.active === false   // Should be inactive

  const allCorrect = dollarCorrect && rCorrect && btn90dCorrect && btnAllCorrect

  console.log('\n✅ === SUCCESS VALIDATION ===')
  console.log(`💰 Dollar button correct (should be inactive): ${dollarCorrect}`)
  console.log(`🎯 R button correct (should be active): ${rCorrect}`)
  console.log(`📅 90d button correct (should be active): ${btn90dCorrect}`)
  console.log(`📅 All button correct (should be inactive): ${btnAllCorrect}`)
  console.log(`\n🎯 Overall success: ${allCorrect}`)

  if (allCorrect) {
    console.log('\n✅ SUCCESS - All buttons are in the expected state!')
  } else {
    console.log('\n❌ FAILURE - Buttons are not in the expected state')
    console.log('🔧 This indicates the parsing functions are not working correctly')
  }

  // Get the chat response content
  console.log('\n💬 === CHAT RESPONSE ANALYSIS ===')
  const chatMessages = await page.locator('.space-y-4 > div').allTextContents()
  const lastMessage = chatMessages[chatMessages.length - 1]
  console.log(`Last chat message: "${lastMessage}"`)

  // Check if we're getting false success claims
  if (lastMessage?.includes('✅') && !allCorrect) {
    console.log('⚠️  WARNING: Chat is claiming success but buttons are not in correct state!')
    console.log('This indicates the validation system is providing false positives.')
  }

  console.log('\n📸 Screenshots saved:')
  console.log('  - tests/screenshots/before-command.png')
  console.log('  - tests/screenshots/after-command-sent.png')
  console.log('  - tests/screenshots/after-parsing.png')
})