/**
 * TEST SPECIFIC FAILING COMMAND
 * Test the exact command that was failing: "Can we go to the stats page and look at the last 90 days in R?"
 */

const { chromium } = require('playwright');

async function testSpecificFailingCommand() {
  console.log('🎯 TESTING SPECIFIC FAILING COMMAND');
  console.log('Command: "Can we go to the stats page and look at the last 90 days in R?"');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  try {
    const page = await browser.newPage();

    // Navigate to dashboard first
    console.log('📍 Step 1: Navigate to dashboard...');
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForTimeout(3000);

    // Capture console logs for debugging
    page.on('console', msg => {
      if (msg.text().includes('🔄') || msg.text().includes('✅') ||
          msg.text().includes('❌') || msg.text().includes('AI Agent') ||
          msg.text().includes('visual state') || msg.text().includes('validation')) {
        console.log(`🤖 AI: ${msg.text()}`);
      }
    });

    console.log('📍 Step 2: Find and interact with chat input...');

    // Look for chat input - try multiple selectors
    const chatSelectors = [
      'input[placeholder*="chat"]',
      'input[placeholder*="message"]',
      'textarea[placeholder*="chat"]',
      'textarea[placeholder*="message"]',
      'input[type="text"]',
      'textarea'
    ];

    let chatInput = null;
    for (const selector of chatSelectors) {
      try {
        chatInput = await page.waitForSelector(selector, { timeout: 2000 });
        if (chatInput) {
          console.log(`✅ Found chat input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!chatInput) {
      console.log('❌ Could not find chat input. Available inputs:');
      const allInputs = await page.$$eval('input, textarea', inputs =>
        inputs.map(input => ({
          tag: input.tagName,
          type: input.type || 'none',
          placeholder: input.placeholder || 'none',
          id: input.id || 'none',
          class: input.className || 'none'
        }))
      );
      console.log(JSON.stringify(allInputs, null, 2));
      return false;
    }

    console.log('📍 Step 3: Send the specific failing command...');
    const testCommand = "Can we go to the stats page and look at the last 90 days in R?";

    // Clear input and type command
    await chatInput.click();
    await chatInput.fill(''); // Clear the input
    await chatInput.type(testCommand);
    await page.waitForTimeout(500);

    // Submit the command
    await page.keyboard.press('Enter');

    console.log(`📤 Sent command: "${testCommand}"`);
    console.log('📍 Step 4: Waiting for AI agent processing...');

    // Wait for processing and monitor responses
    let responseReceived = false;
    let processingComplete = false;
    let finalResult = null;

    // Monitor for 30 seconds
    const startTime = Date.now();
    const maxWaitTime = 30000;

    while (!processingComplete && (Date.now() - startTime) < maxWaitTime) {
      await page.waitForTimeout(1000);

      // Check if there's any response in chat area
      try {
        const chatMessages = await page.$$eval('[class*="message"], [class*="chat"], [class*="response"]', messages =>
          messages.map(msg => msg.textContent?.trim()).filter(text => text && text.length > 0)
        );

        if (chatMessages.length > 0) {
          responseReceived = true;
          const lastMessage = chatMessages[chatMessages.length - 1];
          console.log(`📥 Response: ${lastMessage}`);

          // Check if processing is complete (no more "processing" or "loading" indicators)
          const isProcessing = await page.$('[class*="loading"], [class*="processing"], [class*="spinner"]') !== null;
          if (!isProcessing) {
            processingComplete = true;
            finalResult = lastMessage;
          }
        }
      } catch (e) {
        // Continue waiting
      }
    }

    console.log('📍 Step 5: Validate final state...');

    // Check final page state
    const finalState = await page.evaluate(() => {
      const currentPath = window.location.pathname;

      // Check button states
      const allButtons = Array.from(document.querySelectorAll('button'));

      // Date range buttons
      const btn7d = allButtons.find(b => b.textContent?.trim() === '7d');
      const btn30d = allButtons.find(b => b.textContent?.trim() === '30d');
      const btn90d = allButtons.find(b => b.textContent?.trim() === '90d');
      const btnAll = allButtons.find(b => b.textContent?.trim() === 'All');

      // Display mode buttons
      const btnR = allButtons.find(b => b.textContent?.trim() === 'R');
      const btnDollar = allButtons.find(b => b.textContent?.trim() === '$');

      const checkButtonActive = (btn) => {
        if (!btn) return false;
        return btn.classList.contains('bg-[#B8860B]') ||
               btn.classList.contains('traderra-date-active') ||
               btn.getAttribute('data-active') === 'true';
      };

      return {
        currentPage: currentPath,
        navigation: currentPath === '/statistics' || currentPath === '/stats',
        dateRange: {
          '7d': checkButtonActive(btn7d),
          '30d': checkButtonActive(btn30d),
          '90d': checkButtonActive(btn90d),
          'All': checkButtonActive(btnAll)
        },
        displayMode: {
          'R': checkButtonActive(btnR),
          'Dollar': checkButtonActive(btnDollar)
        },
        buttonClasses: {
          'R': btnR ? Array.from(btnR.classList) : [],
          'Dollar': btnDollar ? Array.from(btnDollar.classList) : [],
          '90d': btn90d ? Array.from(btn90d.classList) : []
        }
      };
    });

    console.log('\n🏆 FINAL VALIDATION RESULTS');
    console.log('============================');
    console.log(`Current Page: ${finalState.currentPage}`);
    console.log(`Navigation Success: ${finalState.navigation ? '✅' : '❌'} (Expected: /statistics or /stats)`);
    console.log(`90d Active: ${finalState.dateRange['90d'] ? '✅' : '❌'}`);
    console.log(`R Mode Active: ${finalState.displayMode['R'] ? '✅' : '❌'}`);

    console.log('\nButton States:');
    console.log(`  7d: ${finalState.dateRange['7d']}`);
    console.log(`  30d: ${finalState.dateRange['30d']}`);
    console.log(`  90d: ${finalState.dateRange['90d']}`);
    console.log(`  All: ${finalState.dateRange['All']}`);
    console.log(`  R: ${finalState.displayMode['R']}`);
    console.log(`  $: ${finalState.displayMode['Dollar']}`);

    console.log('\nButton Classes (Debug):');
    console.log(`  R button: ${JSON.stringify(finalState.buttonClasses['R'])}`);
    console.log(`  $ button: ${JSON.stringify(finalState.buttonClasses['Dollar'])}`);
    console.log(`  90d button: ${JSON.stringify(finalState.buttonClasses['90d'])}`);

    // Calculate success
    const allCriteriaMet = finalState.navigation &&
                          finalState.dateRange['90d'] &&
                          finalState.displayMode['R'];

    console.log(`\n🎯 OVERALL SUCCESS: ${allCriteriaMet ? '✅ PASSED' : '❌ FAILED'}`);

    if (allCriteriaMet) {
      console.log('🎉 The specific failing command now works perfectly!');
      console.log('✅ Navigation to stats page: Working');
      console.log('✅ 90 day date range setting: Working');
      console.log('✅ R mode display setting: Working');
    } else {
      console.log('❌ Command still failing. Issues:');
      if (!finalState.navigation) console.log('  - Navigation to stats page failed');
      if (!finalState.dateRange['90d']) console.log('  - 90 day date range setting failed');
      if (!finalState.displayMode['R']) console.log('  - R mode display setting failed');
    }

    await page.screenshot({ path: 'specific_command_test_result.png', fullPage: true });

    return allCriteriaMet;

  } catch (error) {
    console.error('💥 Test error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

testSpecificFailingCommand().then(success => {
  console.log(`\n🏁 SPECIFIC COMMAND TEST: ${success ? 'FIXED ✅' : 'STILL FAILING ❌'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});