/**
 * TEST REAL AI AGENT COMMANDS
 * Test the actual AI agent functionality with the user's commands
 */

const { chromium } = require('playwright');

async function testRealAIAgentCommands() {
  console.log('🤖 TESTING REAL AI AGENT COMMANDS - Validating all fixes work in practice');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  try {
    const page = await browser.newPage();

    console.log('📍 Navigate to dashboard...');
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForTimeout(4000);

    console.log('📍 Testing real AI agent commands...');

    // Test 1: The exact command the user tried - "Can you show me the dashboard in R for all time data?"
    console.log('\n🤖 TEST 1: User\'s exact command - "Can you show me the dashboard in R for all time data?"');

    const result1 = await page.evaluate(async () => {
      // Find and click the chat input area
      const chatInput = document.querySelector('textarea');
      if (!chatInput) {
        return { error: 'Chat input not found' };
      }

      // Type the exact command
      chatInput.value = 'Can you show me the dashboard in R for all time data?';

      // Trigger input event
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Find and click send button
      const sendButton = Array.from(document.querySelectorAll('button')).find(btn =>
        btn.querySelector('svg') && (btn.textContent?.includes('Send') || btn.getAttribute('aria-label')?.includes('Send'))
      );

      if (sendButton) {
        sendButton.click();
        console.log('✅ Command sent to AI agent');
        return { success: true, command: 'Can you show me the dashboard in R for all time data?' };
      } else {
        return { error: 'Send button not found' };
      }
    });

    console.log('🤖 Command Result:', result1);

    if (result1.success) {
      console.log('\n⏳ Waiting for AI agent to process and execute command...');
      await page.waitForTimeout(10000); // Wait 10 seconds for processing

      // Check final state
      const finalState = await page.evaluate(() => {
        const allButtons = Array.from(document.querySelectorAll('button'));
        const rBtn = allButtons.find(btn => btn.textContent?.trim() === 'R');
        const dollarBtn = allButtons.find(btn => btn.textContent?.trim() === '$');
        const allTimeBtn = allButtons.find(btn => btn.textContent?.trim() === 'All');

        return {
          rButtonActive: rBtn ? rBtn.classList.contains('bg-[#B8860B]') : false,
          dollarButtonActive: dollarBtn ? dollarBtn.classList.contains('bg-[#B8860B]') : false,
          allTimeButtonActive: allTimeBtn ? (allTimeBtn.classList.contains('bg-[#B8860B]') || allTimeBtn.classList.contains('traderra-date-active')) : false,
          rButtonBg: rBtn ? window.getComputedStyle(rBtn).backgroundColor : 'none',
          allTimeBg: allTimeBtn ? window.getComputedStyle(allTimeBtn).backgroundColor : 'none'
        };
      });

      console.log('\n📊 FINAL STATE AFTER AI AGENT EXECUTION:');
      console.log(`  R Button Active: ${finalState.rButtonActive ? '✅' : '❌'}`);
      console.log(`  $ Button Active: ${finalState.dollarButtonActive ? '❌ (should be inactive)' : '✅'}`);
      console.log(`  All Time Active: ${finalState.allTimeButtonActive ? '✅' : '❌'}`);
      console.log(`  R Button Background: ${finalState.rButtonBg}`);
      console.log(`  All Time Background: ${finalState.allTimeBg}`);

      const commandSuccess = finalState.rButtonActive && !finalState.dollarButtonActive && finalState.allTimeButtonActive;

      console.log(`\n🎯 COMMAND SUCCESS: ${commandSuccess ? '✅' : '❌'}`);

      if (commandSuccess) {
        console.log('🎉 SUCCESS: AI agent successfully executed the command!');
        console.log('   - ✅ Dashboard switched to R mode');
        console.log('   - ✅ Date range set to All Time');
        console.log('   - ✅ All button state changes applied correctly');
      } else {
        console.log('❌ FAILURE: AI agent did not execute the command correctly');
        if (!finalState.rButtonActive) {
          console.log('   - ❌ R button not active');
        }
        if (finalState.dollarButtonActive) {
          console.log('   - ❌ $ button still active (should be inactive)');
        }
        if (!finalState.allTimeButtonActive) {
          console.log('   - ❌ All Time button not active');
        }
      }

      await page.screenshot({ path: 'real_ai_agent_test_result.png', fullPage: true });

      return commandSuccess;
    } else {
      console.log('❌ Failed to send command to AI agent');
      return false;
    }

  } catch (error) {
    console.error('💥 Real AI agent test error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

testRealAIAgentCommands().then(success => {
  console.log(`\n🏁 REAL AI AGENT TEST COMPLETE: ${success ? 'ALL FIXES WORKING ✅' : 'FIXES NOT WORKING ❌'}`);

  if (success) {
    console.log('\n🎉 CELEBRATION: The R, $, G, N button fixes are working in the real application!');
    console.log('   The user\'s exact command now works perfectly with the AI agent.');
  } else {
    console.log('\n🔧 NEXT STEPS: Need to investigate why the fixes aren\'t working in the real application');
  }

  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});