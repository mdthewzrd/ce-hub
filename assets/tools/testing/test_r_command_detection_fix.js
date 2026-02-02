/**
 * QUICK TEST: R COMMAND DETECTION FIX
 * Validate that "show in R" now triggers the nuclear approach
 */

const { chromium } = require('playwright');

async function testRCommandDetectionFix() {
  console.log('🔧 TESTING R COMMAND DETECTION FIX');
  console.log('Target: "show in R" should now trigger nuclear approach');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  try {
    const page = await browser.newPage();

    // Monitor browser console for nuclear approach messages
    page.on('console', msg => {
      if (msg.text().includes('NUCLEAR') || msg.text().includes('🚀')) {
        console.log(`🚀 BROWSER: ${msg.text()}`);
      }
    });

    console.log('\n📍 Navigate to dashboard...');
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForTimeout(3000);

    console.log('📍 Testing "show in R" command...');

    const result = await page.evaluate(async () => {
      // Send the exact command that was failing
      const chatInput = document.querySelector('textarea');
      if (!chatInput) return { error: 'Chat input not found' };

      chatInput.value = 'show in R';
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Find send button
      const allButtons = Array.from(document.querySelectorAll('button'));
      const sendButton = allButtons.find(btn => {
        const rect = btn.getBoundingClientRect();
        const textareaRect = chatInput.getBoundingClientRect();
        return rect.left > textareaRect.left &&
               rect.top >= textareaRect.top &&
               rect.top <= textareaRect.bottom + 20;
      });

      if (sendButton) {
        sendButton.click();
        return { success: true, command: 'show in R' };
      } else {
        return { error: 'Send button not found' };
      }
    });

    console.log('🤖 Command send result:', result);

    if (result.success) {
      console.log('\n⏳ Waiting for AI agent to process and nuclear approach to trigger...');
      await page.waitForTimeout(8000);

      // Check if nuclear approach was executed
      const nuclearCheck = await page.evaluate(() => {
        const allButtons = Array.from(document.querySelectorAll('button'));
        const rBtn = allButtons.find(btn => btn.textContent?.trim() === 'R');

        if (!rBtn) return { error: 'R button not found' };

        return {
          hasNuclearAttribute: rBtn.getAttribute('data-nuclear') === 'true',
          hasActiveAttribute: rBtn.getAttribute('data-active') === 'true',
          hasActiveClass: rBtn.classList.contains('bg-[#B8860B]'),
          hasActiveBgColor: rBtn.style.backgroundColor.includes('184, 134, 11') ||
                           rBtn.style.backgroundColor === '#B8860B',
          classList: Array.from(rBtn.classList),
          inlineStyle: rBtn.style.cssText,
          computedBg: window.getComputedStyle(rBtn).backgroundColor
        };
      });

      console.log('\n🎯 NUCLEAR APPROACH CHECK:');
      console.log(`  Nuclear Attribute: ${nuclearCheck.hasNuclearAttribute ? '✅' : '❌'}`);
      console.log(`  Active Attribute: ${nuclearCheck.hasActiveAttribute ? '✅' : '❌'}`);
      console.log(`  Active Class: ${nuclearCheck.hasActiveClass ? '✅' : '❌'}`);
      console.log(`  Active BG Color: ${nuclearCheck.hasActiveBgColor ? '✅' : '❌'}`);
      console.log(`  Class List: [${nuclearCheck.classList.join(', ')}]`);
      console.log(`  Inline Style: ${nuclearCheck.inlineStyle || 'none'}`);
      console.log(`  Computed BG: ${nuclearCheck.computedBg}`);

      const success = nuclearCheck.hasNuclearAttribute || nuclearCheck.hasActiveAttribute ||
                     nuclearCheck.hasActiveClass || nuclearCheck.hasActiveBgColor;

      console.log(`\n🏆 RESULT: ${success ? 'R COMMAND DETECTION FIXED ✅' : 'STILL NEEDS WORK ❌'}`);

      return success;
    } else {
      console.log('❌ Failed to send command');
      return false;
    }

  } catch (error) {
    console.error('💥 Test error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

testRCommandDetectionFix().then(success => {
  console.log(`\n🏁 R COMMAND DETECTION TEST: ${success ? 'FIXED ✅' : 'NEEDS MORE WORK ❌'}`);

  if (success) {
    console.log('💡 Nuclear approach is now triggering for R commands!');
    console.log('🎯 Ready to test the full targeted test suite');
  } else {
    console.log('🔧 Need to investigate further why nuclear approach isn\'t working');
  }

  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});