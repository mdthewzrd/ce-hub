/**
 * SIMPLE CSS FIX TEST
 * Quick test to verify the CSS fix for button activation
 */

const { chromium } = require('playwright');

async function simpleCSSTest() {
  console.log('🔧 Simple CSS Test - Verifying Button Activation Fix');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  try {
    const page = await browser.newPage();

    // Capture browser console logs
    page.on('console', msg => {
      if (msg.text().includes('🎯') || msg.text().includes('🗓️')) {
        console.log(`📺 BROWSER: ${msg.text()}`);
      }
    });

    console.log('📍 Navigating to dashboard (no networkidle wait)...');
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForTimeout(3000); // Simple wait instead

    console.log('📍 Taking baseline screenshot...');
    await page.screenshot({ path: 'simple_test_baseline.png', fullPage: true });

    // Test 7d button click
    console.log('📍 Clicking 7d button...');
    await page.click('button:has-text("7d")');
    await page.waitForTimeout(1500); // Wait for state update

    console.log('📍 Taking after-click screenshot...');
    await page.screenshot({ path: 'simple_test_after_click.png', fullPage: true });

    // Check button state
    const buttonState = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const btn7d = allButtons.find(btn => btn.textContent?.trim() === '7d');

      if (!btn7d) return { found: false };

      return {
        found: true,
        hasGoldBg: btn7d.classList.contains('bg-[#B8860B]'),
        hasActiveClass: btn7d.classList.contains('traderra-date-active'),
        dataActive: btn7d.getAttribute('data-active') === 'true',
        computedBg: window.getComputedStyle(btn7d).backgroundColor,
        inlineStyle: btn7d.style.backgroundColor,
        allClasses: Array.from(btn7d.classList)
      };
    });

    console.log('📊 Button state after click:');
    console.log(JSON.stringify(buttonState, null, 2));

    // Check if any active styling was applied
    const hasActiveStyling = buttonState.hasGoldBg ||
                           buttonState.hasActiveClass ||
                           buttonState.dataActive ||
                           buttonState.inlineStyle === 'rgb(184, 134, 11)';

    if (hasActiveStyling) {
      console.log('✅ SUCCESS: Active styling is being applied!');
      return true;
    } else {
      console.log('❌ FAILURE: No active styling detected');
      return false;
    }

  } catch (error) {
    console.error('💥 Test error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

simpleCSSTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});