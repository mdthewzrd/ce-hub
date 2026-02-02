/**
 * TARGETED R, $, G, N MULTI-COMMAND TEST
 * Specifically tests the critical display mode buttons and complex multi-command workflows
 * Focuses on navigation + display mode + date range combinations
 */

const { chromium } = require('playwright');

// CRITICAL COMMANDS TO TEST - Focus on R, $, G, N buttons and multi-commands
const criticalCommands = [
  // DISPLAY MODE COMMANDS - The core issue
  { cmd: "show in R", expected: { displayMode: "R" } },
  { cmd: "switch to R", expected: { displayMode: "R" } },
  { cmd: "R mode", expected: { displayMode: "R" } },
  { cmd: "risk multiple", expected: { displayMode: "R" } },
  { cmd: "change to R", expected: { displayMode: "R" } },

  { cmd: "show in dollars", expected: { displayMode: "dollar" } },
  { cmd: "$ mode", expected: { displayMode: "dollar" } },
  { cmd: "switch to dollars", expected: { displayMode: "dollar" } },
  { cmd: "change to $", expected: { displayMode: "dollar" } },

  { cmd: "gross mode", expected: { displayMode: "gross" } },
  { cmd: "show G", expected: { displayMode: "gross" } },
  { cmd: "switch to gross", expected: { displayMode: "gross" } },

  { cmd: "net mode", expected: { displayMode: "net" } },
  { cmd: "show N", expected: { displayMode: "net" } },
  { cmd: "switch to net", expected: { displayMode: "net" } },

  // MULTI-COMMAND COMBINATIONS - The complex workflows
  { cmd: "go to dashboard and show in R", expected: { page: "dashboard", displayMode: "R" } },
  { cmd: "navigate to stats and switch to R", expected: { page: "statistics", displayMode: "R" } },
  { cmd: "dashboard page in R mode", expected: { page: "dashboard", displayMode: "R" } },
  { cmd: "statistics page with R", expected: { page: "statistics", displayMode: "R" } },
  { cmd: "show me dashboard in risk multiple", expected: { page: "dashboard", displayMode: "R" } },

  { cmd: "go to stats and show in dollars", expected: { page: "statistics", displayMode: "dollar" } },
  { cmd: "navigate to dashboard with $ mode", expected: { page: "dashboard", displayMode: "dollar" } },
  { cmd: "dashboard page in dollar view", expected: { page: "dashboard", displayMode: "dollar" } },
  { cmd: "statistics with gross mode", expected: { page: "statistics", displayMode: "gross" } },

  // COMPLEX NAVIGATION + DISPLAY COMBINATIONS
  { cmd: "take me to dashboard and enable R mode", expected: { page: "dashboard", displayMode: "R" } },
  { cmd: "show stats page with R view", expected: { page: "statistics", displayMode: "R" } },
  { cmd: "go to dashboard and change to dollars", expected: { page: "dashboard", displayMode: "dollar" } },
  { cmd: "navigate to statistics and switch to gross", expected: { page: "statistics", displayMode: "gross" } },
  { cmd: "dashboard with net mode", expected: { page: "dashboard", displayMode: "net" } },
];

// MULTI-MESSAGE CHAINS - The most complex scenarios
const multiMessageChains = [
  [
    { cmd: "go to dashboard", expected: { page: "dashboard" } },
    { cmd: "switch to R", expected: { displayMode: "R" } }
  ],
  [
    { cmd: "navigate to statistics", expected: { page: "statistics" } },
    { cmd: "R mode", expected: { displayMode: "R" } }
  ],
  [
    { cmd: "dashboard", expected: { page: "dashboard" } },
    { cmd: "show in dollars", expected: { displayMode: "dollar" } },
    { cmd: "actually change to R", expected: { displayMode: "R" } }
  ],
  [
    { cmd: "stats page", expected: { page: "statistics" } },
    { cmd: "switch to gross", expected: { displayMode: "gross" } },
    { cmd: "go to dashboard instead", expected: { page: "dashboard" } },
    { cmd: "keep gross but change to R", expected: { displayMode: "R" } }
  ],
  [
    { cmd: "go to dashboard", expected: { page: "dashboard" } },
    { cmd: "$ mode", expected: { displayMode: "dollar" } },
    { cmd: "navigate to stats", expected: { page: "statistics" } },
    { cmd: "change to net mode", expected: { displayMode: "net" } },
    { cmd: "back to dashboard", expected: { page: "dashboard" } },
    { cmd: "switch to R", expected: { displayMode: "R" } }
  ]
];

async function targetedRGNMultiCommandTest() {
  console.log('🎯 TARGETED R, $, G, N MULTI-COMMAND TEST');
  console.log('🔥 FOCUS: Display mode buttons and complex multi-command workflows');
  console.log(`Testing ${criticalCommands.length} critical commands + ${multiMessageChains.length} multi-message chains`);
  console.log('TARGET: 100% Success Rate for Complex Scenarios');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = [];

  try {
    const page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('🚀') || msg.text().includes('✅') || msg.text().includes('❌') || msg.text().includes('NUCLEAR')) {
        console.log(`📺 BROWSER: ${msg.text()}`);
      }
    });

    console.log('\n📍 PHASE 1: Critical Display Mode Commands');
    console.log('Testing R, $, G, N button functionality...\n');

    for (let i = 0; i < criticalCommands.length; i++) {
      const test = criticalCommands[i];
      totalTests++;

      console.log(`[${i + 1}/${criticalCommands.length}] Testing: "${test.cmd}"`);

      try {
        // Fresh start for each test
        await page.goto('http://localhost:6565/dashboard');
        await page.waitForTimeout(2000);

        // Send command through AI agent
        const result = await sendAICommand(page, test.cmd, test.expected);

        if (result.success) {
          passedTests++;
          console.log(`  ✅ PASSED: ${result.message}`);
        } else {
          failedTests.push({ command: test.cmd, error: result.error, expected: test.expected });
          console.log(`  ❌ FAILED: ${result.error}`);
        }

        await page.waitForTimeout(1000);

      } catch (error) {
        failedTests.push({ command: test.cmd, error: error.message, expected: test.expected });
        console.log(`  💥 ERROR: ${error.message}`);
      }
    }

    console.log('\n📍 PHASE 2: Multi-Message Chain Testing');
    console.log('Testing complex workflows with multiple actions...\n');

    for (let i = 0; i < multiMessageChains.length; i++) {
      const chain = multiMessageChains[i];
      totalTests++;

      console.log(`[${i + 1}/${multiMessageChains.length}] Testing chain of ${chain.length} messages:`);
      chain.forEach((step, idx) => console.log(`  Step ${idx + 1}: "${step.cmd}"`));

      try {
        // Fresh start for each chain
        await page.goto('http://localhost:6565/dashboard');
        await page.waitForTimeout(2000);

        let chainSuccess = true;
        let chainError = '';

        for (let j = 0; j < chain.length; j++) {
          const step = chain[j];
          console.log(`  🤖 Executing Step ${j + 1}: "${step.cmd}"`);

          const result = await sendAICommand(page, step.cmd, step.expected);

          if (!result.success) {
            chainSuccess = false;
            chainError = `Step ${j + 1} failed: ${result.error}`;
            break;
          }

          await page.waitForTimeout(1500); // Pause between chain steps
        }

        if (chainSuccess) {
          passedTests++;
          console.log(`  ✅ CHAIN PASSED: All ${chain.length} steps successful`);
        } else {
          failedTests.push({
            command: `Chain ${i + 1} (${chain.length} steps)`,
            error: chainError,
            expected: 'Multi-step chain completion'
          });
          console.log(`  ❌ CHAIN FAILED: ${chainError}`);
        }

      } catch (error) {
        failedTests.push({
          command: `Chain ${i + 1}`,
          error: error.message,
          expected: 'Multi-step chain completion'
        });
        console.log(`  💥 CHAIN ERROR: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('💥 Test suite error:', error);
  } finally {
    await browser.close();
  }

  // Calculate results
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log('\n🏆 TARGETED TEST RESULTS');
  console.log('=========================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests.length}`);
  console.log(`Success Rate: ${successRate}%`);

  // Detailed failure analysis
  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');

    const rFailures = failedTests.filter(f => f.command.toLowerCase().includes('r') && !f.command.toLowerCase().includes('gross'));
    const dollarFailures = failedTests.filter(f => f.command.toLowerCase().includes('$') || f.command.toLowerCase().includes('dollar'));
    const gFailures = failedTests.filter(f => f.command.toLowerCase().includes('g') || f.command.toLowerCase().includes('gross'));
    const nFailures = failedTests.filter(f => f.command.toLowerCase().includes('n') || f.command.toLowerCase().includes('net'));
    const chainFailures = failedTests.filter(f => f.command.toLowerCase().includes('chain'));

    console.log(`\n  R Button Failures: ${rFailures.length}`);
    console.log(`  $ Button Failures: ${dollarFailures.length}`);
    console.log(`  G Button Failures: ${gFailures.length}`);
    console.log(`  N Button Failures: ${nFailures.length}`);
    console.log(`  Chain Failures: ${chainFailures.length}`);

    failedTests.slice(0, 10).forEach((test, index) => {
      console.log(`\n${index + 1}. "${test.command}"`);
      console.log(`   Error: ${test.error}`);
      console.log(`   Expected: ${JSON.stringify(test.expected)}`);
    });
  }

  if (successRate === '100.0') {
    console.log('\n🎉 PERFECT SCORE: 100% SUCCESS RATE ACHIEVED!');
    console.log('✅ All R, $, G, N button commands working perfectly');
    console.log('✅ All multi-command workflows successful');
    console.log('✅ Nuclear approach working for complex scenarios');
    return true;
  } else {
    console.log(`\n⚠️ SUCCESS RATE: ${successRate}% - Nuclear approach needs more work`);
    return false;
  }
}

// Send command to AI agent and validate results
async function sendAICommand(page, command, expected) {
  try {
    // Send command via chat interface
    const sendResult = await page.evaluate(async (cmd) => {
      const chatInput = document.querySelector('textarea');
      if (!chatInput) return { error: 'Chat input not found' };

      chatInput.value = '';
      chatInput.value = cmd;
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Enhanced send button detection
      let sendButton = null;

      // Try multiple approaches to find send button
      const chatContainer = chatInput.closest('.p-4') || chatInput.closest('[class*="chat"]');
      if (chatContainer) {
        sendButton = chatContainer.querySelector('button[type="button"]') ||
                    chatContainer.querySelector('button svg') ||
                    chatContainer.querySelector('button');
      }

      if (!sendButton) {
        const allButtons = Array.from(document.querySelectorAll('button'));
        sendButton = allButtons.find(btn => {
          const rect = btn.getBoundingClientRect();
          const textareaRect = chatInput.getBoundingClientRect();
          return rect.left > textareaRect.left &&
                 rect.top >= textareaRect.top &&
                 rect.top <= textareaRect.bottom + 20;
        });
      }

      if (sendButton) {
        sendButton.click();
        return { success: true };
      } else {
        return { error: 'Send button not found' };
      }
    }, command);

    if (!sendResult.success) {
      return { success: false, error: sendResult.error };
    }

    // Wait for AI agent processing
    console.log(`    🤖 AI Agent processing: "${command}"`);
    await page.waitForTimeout(8000); // Extended wait for complex commands

    // Validate results with enhanced logic
    const validation = await validateAIResult(page, expected);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    return { success: true, message: 'AI command executed successfully' };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Enhanced validation for AI agent nuclear approach
async function validateAIResult(page, expected) {
  try {
    // Check navigation
    if (expected.page) {
      const url = await page.url();
      const expectedUrl = expected.page === 'dashboard' ? '/dashboard' : '/statistics';
      if (!url.includes(expectedUrl)) {
        return { success: false, error: `Navigation failed: expected ${expectedUrl}, got ${url}` };
      }
    }

    // Enhanced display mode validation with nuclear approach detection
    if (expected.displayMode) {
      const modeValidation = await page.evaluate((target) => {
        const allButtons = Array.from(document.querySelectorAll('button'));
        let modeBtn = null;

        // Find the correct button based on target
        if (target === 'R') {
          modeBtn = allButtons.find(btn => btn.textContent?.trim() === 'R');
        } else if (target === 'dollar') {
          modeBtn = allButtons.find(btn => btn.textContent?.trim() === '$');
        } else if (target === 'gross') {
          modeBtn = allButtons.find(btn => btn.textContent?.trim() === 'G');
        } else if (target === 'net') {
          modeBtn = allButtons.find(btn => btn.textContent?.trim() === 'N');
        }

        if (!modeBtn) return { success: false, error: `Button ${target} not found` };

        // COMPREHENSIVE validation for nuclear approach
        const hasActiveClass = modeBtn.classList.contains('bg-[#B8860B]');
        const hasActiveAttribute = modeBtn.getAttribute('data-active') === 'true';
        const hasNuclearAttribute = modeBtn.getAttribute('data-nuclear') === 'true';
        const hasCorrectBgColor = modeBtn.style.backgroundColor.includes('184, 134, 11') ||
                                 modeBtn.style.backgroundColor === '#B8860B' ||
                                 modeBtn.style.backgroundColor === 'rgb(184, 134, 11)';
        const hasActiveStyling = window.getComputedStyle(modeBtn).backgroundColor === 'rgb(184, 134, 11)';

        const isActive = hasActiveClass || hasActiveAttribute || hasNuclearAttribute ||
                        hasCorrectBgColor || hasActiveStyling;

        return {
          success: isActive,
          button: target,
          classes: Array.from(modeBtn.classList),
          attributes: {
            'data-active': modeBtn.getAttribute('data-active'),
            'data-nuclear': modeBtn.getAttribute('data-nuclear')
          },
          inlineStyles: modeBtn.style.cssText,
          computedBgColor: window.getComputedStyle(modeBtn).backgroundColor,
          validationChecks: {
            hasActiveClass,
            hasActiveAttribute,
            hasNuclearAttribute,
            hasCorrectBgColor,
            hasActiveStyling
          }
        };
      }, expected.displayMode);

      if (!modeValidation.success) {
        return {
          success: false,
          error: `Display mode ${expected.displayMode} not active. ` +
                `Classes: ${JSON.stringify(modeValidation.classes)}. ` +
                `Attributes: ${JSON.stringify(modeValidation.attributes)}. ` +
                `Computed BG: ${modeValidation.computedBgColor}. ` +
                `Validation: ${JSON.stringify(modeValidation.validationChecks)}`
        };
      }
    }

    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Run the targeted test
targetedRGNMultiCommandTest().then(success => {
  console.log(`\n🏁 TARGETED TEST COMPLETE: ${success ? 'R, $, G, N BUTTONS WORKING 100% ✅' : 'STILL NEEDS FIXES ❌'}`);

  if (success) {
    console.log('\n🎉 BREAKTHROUGH: All critical display mode buttons and multi-commands working!');
    console.log('💡 Nuclear approach achieving 100% success rate for complex workflows');
  } else {
    console.log('\n🔧 CONTINUING FIXES: Need more work on button state management');
  }

  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Targeted test failed:', error);
  process.exit(1);
});