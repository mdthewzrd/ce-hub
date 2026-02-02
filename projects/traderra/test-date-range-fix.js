/**
 * Final test to verify date range race condition fix
 */

const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testDateRangeFix() {
  console.log('🧪 Testing date range race condition fix...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Monitor console for date range changes
    const dateRangeChanges = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('DateRangeContext') || text.includes('currentDateRange')) {
        dateRangeChanges.push(text);
        console.log('DATE RANGE CHANGE:', text);
      }
    });

    // Navigate to dashboard
    console.log('\n📍 Step 1: Navigating to dashboard...');
    await page.goto('http://localhost:6565/dashboard');
    await sleep(4000);

    // Send the "All of 2025" command
    console.log('\n💬 Step 2: Sending "All of 2025" command...');

    // Clear any existing text and type the command
    await page.evaluate(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.focus();
        textarea.select();
        textarea.value = 'All of 2025';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await sleep(1000);

    // Click send button
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (let btn of buttons) {
        const text = btn.textContent?.toLowerCase() || '';
        if (text.includes('send')) {
          btn.click();
          break;
        }
      }
    });

    // Wait for processing and monitor for race condition
    console.log('\n⏳ Step 3: Monitoring for date range changes...');
    await sleep(5000);

    // Analyze the date range changes
    console.log('\n📊 Date Range Change Analysis:');
    console.log(`Total changes detected: ${dateRangeChanges.length}`);

    dateRangeChanges.forEach((change, i) => {
      console.log(`${i + 1}. ${change}`);
    });

    // Check if there was a race condition (multiple rapid changes)
    const hasRaceCondition = dateRangeChanges.length > 2;
    const finalState = dateRangeChanges[dateRangeChanges.length - 1];

    console.log(`\n🏁 Race condition detected: ${hasRaceCondition ? '❌ Yes' : '✅ No'}`);
    console.log(`Final state: ${finalState}`);

    // Check localStorage for the final state
    const localStorageState = await page.evaluate(() => {
      const dateRange = localStorage.getItem('traderra_date_range');
      const customRange = localStorage.getItem('traderra_custom_date_range');

      return {
        dateRange: dateRange,
        customRange: customRange ? JSON.parse(customRange) : null
      };
    });

    console.log('\n💾 LocalStorage State:');
    console.log(`Date Range: ${localStorageState.dateRange}`);
    console.log(`Custom Range:`, localStorageState.customRange);

    // Check if the custom range was set correctly for 2025
    const customRangeCorrect = localStorageState.customRange &&
                             localStorageState.customRange.start.includes('2025-01-01') &&
                             localStorageState.customRange.end.includes('2025-12-31');

    console.log(`Custom range set correctly: ${customRangeCorrect ? '✅ Yes' : '❌ No'}`);

    // Take final screenshot
    await page.screenshot({
      path: `/Users/michaeldurante/ai dev/ce-hub/projects/traderra/date_range_fix_result.png`,
      fullPage: false
    });

    // Final assessment
    const success = !hasRaceCondition && customRangeCorrect && localStorageState.dateRange === 'custom';

    console.log('\n🎯 FINAL RESULT:');
    console.log(`✅ Race condition fixed: ${!hasRaceCondition}`);
    console.log(`✅ Custom date range working: ${customRangeCorrect}`);
    console.log(`✅ Correct state in localStorage: ${localStorageState.dateRange === 'custom'}`);
    console.log(`\n🏆 OVERALL SUCCESS: ${success ? '✅ YES' : '❌ NO'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testDateRangeFix().catch(console.error);