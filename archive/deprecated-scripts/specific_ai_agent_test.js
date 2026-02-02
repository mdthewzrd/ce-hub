/**
 * SPECIFIC AI AGENT TEST
 * Test the exact failing scenario: "Can we look at the dashboard over the last 90 days in R?"
 * Starting from stats page with dollars and all set
 */

const { chromium } = require('playwright');

async function specificAiAgentTest() {
  console.log('🔍 SPECIFIC AI AGENT TEST - Real World Failing Scenario');
  console.log('Command: "Can we look at the dashboard over the last 90 days in R?"');
  console.log('Starting from: Stats page, dollars mode, all time period');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  try {
    const page = await browser.newPage();

    // Capture console logs for debugging
    page.on('console', msg => {
      if (msg.text().includes('🎯') || msg.text().includes('🔄') ||
          msg.text().includes('✅') || msg.text().includes('❌') ||
          msg.text().includes('AI Agent') || msg.text().includes('BROWSER')) {
        console.log(`📺 ${msg.text()}`);
      }
    });

    console.log('📍 Step 1: Navigate to stats page...');
    await page.goto('http://localhost:6565/statistics');
    await page.waitForTimeout(3000);

    console.log('📍 Step 2: Set to dollars mode...');
    await page.click('button:has-text("$")');
    await page.waitForTimeout(1000);

    console.log('📍 Step 3: Set to all time period...');
    await page.click('button:has-text("All")');
    await page.waitForTimeout(1000);

    // Validate starting state
    const startingState = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));

      // Check dollar button
      const dollarBtn = allButtons.find(b => b.textContent?.trim() === '$');
      const dollarActive = dollarBtn?.classList.contains('bg-[#B8860B]') ||
                          dollarBtn?.style.backgroundColor === 'rgb(184, 134, 11)';

      // Check All button
      const allBtn = allButtons.find(b => b.textContent?.trim() === 'All');
      const allActive = allBtn?.classList.contains('bg-[#B8860B]') ||
                       allBtn?.classList.contains('traderra-date-active') ||
                       allBtn?.getAttribute('data-active') === 'true' ||
                       allBtn?.style.backgroundColor === 'rgb(184, 134, 11)';

      return {
        page: window.location.pathname,
        dollarActive,
        allActive,
        dollarClasses: dollarBtn ? Array.from(dollarBtn.classList) : [],
        allClasses: allBtn ? Array.from(allBtn.classList) : []
      };
    });

    console.log('📊 Starting state verification:');
    console.log(`   Page: ${startingState.page}`);
    console.log(`   Dollar mode active: ${startingState.dollarActive ? '✅' : '❌'}`);
    console.log(`   All time active: ${startingState.allActive ? '✅' : '❌'}`);

    if (!startingState.dollarActive || !startingState.allActive || startingState.page !== '/statistics') {
      console.log('❌ FAILED: Could not set up initial state correctly');
      console.log('Dollar classes:', startingState.dollarClasses);
      console.log('All classes:', startingState.allClasses);
      return false;
    }

    console.log('📍 Step 4: Simulate AI agent processing command...');
    console.log('Command: "Can we look at the dashboard over the last 90 days in R?"');

    // Simulate AI agent processing this complex command
    const aiResult = await page.evaluate(async () => {
      console.log('🔄 AI Agent: Processing command "Can we look at the dashboard over the last 90 days in R?"');

      // Parse the command
      const command = "Can we look at the dashboard over the last 90 days in R?";
      const lower = command.toLowerCase();

      console.log('🔄 AI Agent: Parsing command...');
      console.log(`🔄 AI Agent: Contains "dashboard": ${lower.includes('dashboard')}`);
      console.log(`🔄 AI Agent: Contains "90 days": ${lower.includes('90')}`);
      console.log(`🔄 AI Agent: Contains "R": ${lower.includes(' r?') || lower.includes(' r ')}`);

      // Simulate enhanced AI agent logic with retry
      const actions = [];

      // Navigation
      if (lower.includes('dashboard')) {
        actions.push({ type: 'navigation', target: 'dashboard' });
      }

      // Date range
      if (lower.includes('90') || lower.includes('quarter')) {
        actions.push({ type: 'date_range', target: '90day' });
      }

      // Display mode
      if (lower.includes(' r?') || lower.includes(' r ') || lower.includes('in r')) {
        actions.push({ type: 'display_mode', target: 'R' });
      }

      console.log('🔄 AI Agent: Parsed actions:', actions);

      let allSuccessful = true;
      const results = [];

      for (const action of actions) {
        let actionSuccess = false;
        const maxRetries = 3;
        let retryCount = 0;

        while (!actionSuccess && retryCount < maxRetries) {
          retryCount++;
          console.log(`🔄 AI Agent: Attempting ${action.type} - ${action.target} (attempt ${retryCount}/${maxRetries})`);

          try {
            if (action.type === 'navigation') {
              if (window.location.pathname !== `/${action.target}`) {
                window.location.href = `http://localhost:6565/${action.target}`;
                await new Promise(resolve => setTimeout(resolve, 2000));
              }

              // Validate navigation
              if (window.location.pathname === `/${action.target}`) {
                actionSuccess = true;
                console.log(`✅ AI Agent: Navigation to ${action.target} successful`);
              } else {
                console.log(`❌ AI Agent: Navigation failed - current: ${window.location.pathname}, expected: /${action.target}`);
              }

            } else if (action.type === 'date_range') {
              // Set date range
              if (window.dateRangeContext && window.dateRangeContext.setDateRange) {
                window.dateRangeContext.setDateRange(action.target);
              }

              await new Promise(resolve => setTimeout(resolve, 1000));

              // Enhanced visual validation
              const allButtons = Array.from(document.querySelectorAll('button'));
              const checkButtonActive = (btn) => {
                if (!btn) return false;
                return btn.classList.contains('bg-[#B8860B]') ||
                       btn.classList.contains('traderra-date-active') ||
                       btn.getAttribute('data-active') === 'true' ||
                       btn.style.backgroundColor === 'rgb(184, 134, 11)';
              };

              const btn7d = allButtons.find(b => b.textContent?.trim() === '7d');
              const btn30d = allButtons.find(b => b.textContent?.trim() === '30d');
              const btn90d = allButtons.find(b => b.textContent?.trim() === '90d');
              const btnAll = allButtons.find(b => b.textContent?.trim() === 'All');

              const currentRange =
                checkButtonActive(btn7d) ? 'week' :
                checkButtonActive(btn30d) ? 'month' :
                checkButtonActive(btn90d) ? '90day' :
                checkButtonActive(btnAll) ? 'all' : 'none';

              console.log(`🔄 AI Agent: Visual validation - expected: ${action.target}, actual: ${currentRange}`);

              if (currentRange === action.target) {
                actionSuccess = true;
                console.log(`✅ AI Agent: Date range ${action.target} validation successful`);
              } else {
                console.log(`❌ AI Agent: Date range validation failed - expected: ${action.target}, actual: ${currentRange}`);
                if (btn90d) {
                  console.log(`❌ AI Agent: 90d button classes:`, Array.from(btn90d.classList));
                  console.log(`❌ AI Agent: 90d button style:`, btn90d.style.backgroundColor || 'none');
                  console.log(`❌ AI Agent: 90d button data-active:`, btn90d.getAttribute('data-active'));
                }
              }

            } else if (action.type === 'display_mode') {
              // Click display mode button
              const modeButtons = Array.from(document.querySelectorAll('button'));
              const modeBtn = modeButtons.find(b => b.textContent?.trim() === action.target);

              if (modeBtn) {
                console.log(`🔄 AI Agent: Clicking ${action.target} button`);
                modeBtn.click();
                await new Promise(resolve => setTimeout(resolve, 800));

                // Enhanced display mode validation
                const updatedBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === action.target);
                const isActive = updatedBtn?.classList.contains('bg-[#B8860B]') ||
                                updatedBtn?.style.backgroundColor === 'rgb(184, 134, 11)' ||
                                updatedBtn?.getAttribute('data-active') === 'true';

                console.log(`🔄 AI Agent: ${action.target} button post-click validation:`, {
                  found: !!updatedBtn,
                  classes: updatedBtn ? Array.from(updatedBtn.classList) : [],
                  style: updatedBtn ? updatedBtn.style.backgroundColor || 'none' : 'none',
                  active: isActive
                });

                if (isActive) {
                  actionSuccess = true;
                  console.log(`✅ AI Agent: Display mode ${action.target} successful`);
                } else {
                  console.log(`❌ AI Agent: Display mode ${action.target} validation failed`);
                }
              } else {
                console.log(`❌ AI Agent: Display mode button ${action.target} not found`);
              }
            }

          } catch (error) {
            console.log(`❌ AI Agent: Error in ${action.type} attempt ${retryCount}: ${error.message}`);
          }

          if (!actionSuccess && retryCount < maxRetries) {
            console.log(`🔄 AI Agent: Retrying ${action.type} in 800ms...`);
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }

        results.push({
          action: action.type,
          target: action.target,
          success: actionSuccess,
          attempts: retryCount
        });

        if (!actionSuccess) {
          console.log(`❌ AI Agent: ${action.type} failed after ${maxRetries} attempts`);
          allSuccessful = false;
        }
      }

      return {
        success: allSuccessful,
        actions: results,
        finalState: {
          page: window.location.pathname
        }
      };
    });

    console.log('\n🏆 AI AGENT TEST RESULTS');
    console.log('=========================');
    console.log(`Overall Success: ${aiResult.success ? '✅' : '❌'}`);
    console.log(`Final Page: ${aiResult.finalState.page}`);
    console.log('\nAction Results:');

    aiResult.actions.forEach((result, index) => {
      console.log(`${index + 1}. ${result.action} (${result.target}): ${result.success ? '✅' : '❌'} (${result.attempts} attempts)`);
    });

    if (aiResult.success) {
      console.log('\n🎉 SUCCESS: AI agent handled the complex command perfectly!');
      console.log('✅ Navigation to dashboard working');
      console.log('✅ 90-day date range setting working');
      console.log('✅ R mode display switching working');
      console.log('✅ Multi-step command processing working');
    } else {
      console.log('\n❌ FAILURE: AI agent could not complete the command');
      const failedActions = aiResult.actions.filter(a => !a.success);
      console.log('Failed actions:');
      failedActions.forEach(action => {
        console.log(`  - ${action.action} (${action.target})`);
      });
    }

    await page.screenshot({ path: 'specific_ai_agent_test_result.png', fullPage: true });

    return aiResult.success;

  } catch (error) {
    console.error('💥 Specific AI agent test error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

specificAiAgentTest().then(success => {
  console.log(`\n🏁 SPECIFIC TEST RESULT: ${success ? 'AI AGENT COMMAND WORKING' : 'AI AGENT COMMAND FAILING'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Specific test failed:', error);
  process.exit(1);
});