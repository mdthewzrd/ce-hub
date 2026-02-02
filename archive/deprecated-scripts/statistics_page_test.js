/**
 * STATISTICS PAGE VALIDATION TEST
 * Test the specific issue user reported on the statistics page
 */

const { chromium } = require('playwright');

async function statisticsPageTest() {
  console.log('📊 Statistics Page Validation Test - Testing AI Agent Scenario');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1500
  });

  try {
    const page = await browser.newPage();

    // Capture console logs
    page.on('console', msg => {
      if (msg.text().includes('🎯') || msg.text().includes('🗓️')) {
        console.log(`📺 BROWSER: ${msg.text()}`);
      }
    });

    console.log('📍 Step 1: Navigate to statistics page...');
    await page.goto('http://localhost:6565/statistics');
    await page.waitForTimeout(4000); // Wait for mounting

    console.log('📍 Step 2: Check initial state of date buttons...');
    const initialState = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const dateButtons = ['7d', '30d', '90d', 'All'].map(label => {
        const btn = allButtons.find(b => b.textContent?.trim() === label);
        return {
          label,
          found: !!btn,
          hasActiveClass: btn?.classList.contains('traderra-date-active') || false,
          hasGoldBg: btn?.classList.contains('bg-[#B8860B]') || false,
          dataActive: btn?.getAttribute('data-active') === 'true',
          computedBg: btn ? window.getComputedStyle(btn).backgroundColor : 'none',
          allClasses: btn ? Array.from(btn.classList) : []
        };
      });

      return { dateButtons };
    });

    console.log('📊 Initial button states on statistics page:');
    initialState.dateButtons.forEach(btn => {
      const isActive = btn.hasActiveClass || btn.hasGoldBg || btn.dataActive;
      console.log(`  ${btn.label}: found=${btn.found}, active=${isActive}`);
      if (btn.found) {
        console.log(`    classes=[${btn.allClasses.join(', ')}]`);
      }
    });

    console.log('📍 Step 3: Click All button and validate...');
    await page.click('button:has-text("All")');
    await page.waitForTimeout(2000);

    const afterAllClick = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const btnAll = allButtons.find(b => b.textContent?.trim() === 'All');
      return {
        found: !!btnAll,
        hasActiveClass: btnAll?.classList.contains('traderra-date-active') || false,
        hasGoldBg: btnAll?.classList.contains('bg-[#B8860B]') || false,
        dataActive: btnAll?.getAttribute('data-active') === 'true',
        computedBg: btnAll ? window.getComputedStyle(btnAll).backgroundColor : 'none',
        inlineStyle: btnAll?.style.backgroundColor || 'none',
        allClasses: btnAll ? Array.from(btnAll.classList) : []
      };
    });

    console.log('📊 All button state after click:');
    console.log(JSON.stringify(afterAllClick, null, 2));

    const allButtonActive = afterAllClick.hasActiveClass || afterAllClick.hasGoldBg ||
                           afterAllClick.dataActive || afterAllClick.inlineStyle === 'rgb(184, 134, 11)';

    console.log('📍 Step 4: Simulate AI agent validation check...');

    // Simulate the same validation the AI agent might be doing
    const validationCheck = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));

      // Check multiple detection methods
      const btn7d = allButtons.find(b => b.textContent?.trim() === '7d');
      const btn30d = allButtons.find(b => b.textContent?.trim() === '30d');
      const btn90d = allButtons.find(b => b.textContent?.trim() === '90d');
      const btnAll = allButtons.find(b => b.textContent?.trim() === 'All');

      return {
        btn7d: btn7d ? {
          hasActiveClass: btn7d.classList.contains('traderra-date-active'),
          hasGoldBg: btn7d.classList.contains('bg-[#B8860B]'),
          dataActive: btn7d.getAttribute('data-active') === 'true'
        } : { found: false },
        btn30d: btn30d ? {
          hasActiveClass: btn30d.classList.contains('traderra-date-active'),
          hasGoldBg: btn30d.classList.contains('bg-[#B8860B]'),
          dataActive: btn30d.getAttribute('data-active') === 'true'
        } : { found: false },
        btn90d: btn90d ? {
          hasActiveClass: btn90d.classList.contains('traderra-date-active'),
          hasGoldBg: btn90d.classList.contains('bg-[#B8860B]'),
          dataActive: btn90d.getAttribute('data-active') === 'true'
        } : { found: false },
        btnAll: btnAll ? {
          hasActiveClass: btnAll.classList.contains('traderra-date-active'),
          hasGoldBg: btnAll.classList.contains('bg-[#B8860B]'),
          dataActive: btnAll.getAttribute('data-active') === 'true'
        } : { found: false }
      };
    });

    console.log('📊 AI Agent Validation Simulation:');
    Object.entries(validationCheck).forEach(([btn, state]) => {
      if (state.found !== false) {
        const isActive = state.hasActiveClass || state.hasGoldBg || state.dataActive;
        console.log(`  ${btn}: ${isActive ? '✅ ACTIVE' : '❌ INACTIVE'}`);
      }
    });

    // Determine what the AI agent would detect as the current range
    let detectedRange = 'none';
    if (validationCheck.btnAll.hasActiveClass || validationCheck.btnAll.hasGoldBg || validationCheck.btnAll.dataActive) {
      detectedRange = 'all';
    } else if (validationCheck.btn90d.hasActiveClass || validationCheck.btn90d.hasGoldBg || validationCheck.btn90d.dataActive) {
      detectedRange = '90d';
    } else if (validationCheck.btn30d.hasActiveClass || validationCheck.btn30d.hasGoldBg || validationCheck.btn30d.dataActive) {
      detectedRange = '30d';
    } else if (validationCheck.btn7d.hasActiveClass || validationCheck.btn7d.hasGoldBg || validationCheck.btn7d.dataActive) {
      detectedRange = '7d';
    }

    console.log(`\\n🔍 AI AGENT DETECTION RESULT: Current range detected as '${detectedRange}'`);

    await page.screenshot({ path: 'statistics_page_validation_test.png', fullPage: true });

    if (detectedRange === 'all') {
      console.log('✅ SUCCESS: AI agent should correctly detect "all" range');
      return true;
    } else {
      console.log('❌ FAILURE: AI agent detecting incorrect range - this explains the validation error!');
      console.log(`   Expected: 'all', Detected: '${detectedRange}'`);
      return false;
    }

  } catch (error) {
    console.error('💥 Statistics page test error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

statisticsPageTest().then(success => {
  console.log(`\\n🏁 RESULT: ${success ? 'STATISTICS PAGE WORKING' : 'STATISTICS PAGE HAS VALIDATION ISSUES'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});