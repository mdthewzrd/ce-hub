/**
 * Comprehensive test for custom date range functionality
 * Tests both backend parsing and frontend execution
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

async function testCustomDateRanges() {
  console.log('🚀 Starting comprehensive custom date range testing...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Enable console logging from the page
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🤖') || text.includes('✅') || text.includes('❌') || text.includes('📅')) {
        console.log('PAGE:', text);
      }
    });

    // Navigate to the app
    console.log('📍 Navigating to Traderra app...');
    await page.goto('http://localhost:6565');
    await sleep(3000);

    // Test custom date range commands
    const testCommands = [
      'from january 1st to january 31st',
      'from december 1st through december 31st',
      'between march 1 and march 15',
      'from 12/1/2024 to 12/31/2024'
    ];

    for (let i = 0; i < testCommands.length; i++) {
      const command = testCommands[i];
      console.log(`\n🧪 Testing command ${i + 1}: "${command}"`);

      // Find the Renata input
      const inputSelector = 'textarea[placeholder*="message"], textarea[placeholder*="ask"], .renata-input, textarea';
      await page.waitForSelector(inputSelector, { timeout: 10000 });

      // Clear input and type command
      await page.click(inputSelector);
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');
      await page.type(inputSelector, command);

      // Send message
      const sendSelector = 'button[aria-label*="send"], .send-button, button[type="submit"]';
      await page.click(sendSelector);

      // Wait for response and processing
      await sleep(4000);

      // Check for UI action response in console or DOM
      const hasUiAction = await page.evaluate(() => {
        const logs = Array.from(document.querySelectorAll('*')).map(el =>
          el.textContent || ''
        ).join(' ');

        return logs.includes('I\'ll set the date range') ||
               logs.includes('custom date range') ||
               logs.includes('start_date') ||
               logs.includes('end_date');
      });

      if (hasUiAction) {
        console.log(`✅ Command "${command}" processed successfully`);

        // Check if localStorage was updated with custom date range
        const customDateSet = await page.evaluate(() => {
          const customDates = localStorage.getItem('traderra_custom_date_range');
          if (customDates) {
            try {
              return JSON.parse(customDates);
            } catch (e) {
              return null;
            }
          }
          return null;
        });

        if (customDateSet && customDateSet.startDate && customDateSet.endDate) {
          console.log(`📅 Custom date range set: ${customDateSet.startDate} to ${customDateSet.endDate}`);
        } else {
          console.log(`⚠️ No custom date range found in localStorage`);
        }
      } else {
        console.log(`❌ Command "${command}" failed to process`);
      }

      // Screenshot after each command
      const timestamp = createTimestamp();
      await page.screenshot({
        path: `/Users/michaeldurante/ai dev/ce-hub/projects/traderra/custom_date_test_${timestamp}.png`,
        fullPage: false
      });

      // Clear input for next test
      await page.click(inputSelector);
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');
      await sleep(1000);
    }

    // Test direct calendar button clicking
    console.log('\n🗓️ Testing calendar button clicking...');

    // Look for calendar button
    const calendarButtons = await page.$$('button, [role="button"], [class*="button"]');
    console.log(`Found ${calendarButtons.length} potential calendar buttons`);

    for (let i = 0; i < calendarButtons.length; i++) {
      const buttonText = await calendarButtons[i].evaluate(el =>
        el.textContent?.toLowerCase() || ''
      );

      if (buttonText.includes('calendar') || buttonText.includes('date')) {
        console.log(`🎯 Found potential calendar button: "${buttonText}"`);
        await calendarButtons[i].click();
        await sleep(2000);

        // Check if calendar opened
        const calendarVisible = await page.evaluate(() => {
          const calendarElements = document.querySelectorAll('[class*="calendar"], [class*="date-picker"], [role="dialog"]');
          return Array.from(calendarElements).some(el =>
            el.offsetParent !== null && el.offsetWidth > 0 && el.offsetHeight > 0
          );
        });

        if (calendarVisible) {
          console.log('✅ Calendar opened successfully');

          // Screenshot calendar
          const timestamp = createTimestamp();
          await page.screenshot({
            path: `/Users/michaeldurante/ai dev/ce-hub/projects/traderra/calendar_open_${timestamp}.png`,
            fullPage: false
          });

          // Try to close calendar by clicking escape
          await page.keyboard.press('Escape');
          await sleep(1000);
        } else {
          console.log('❌ Calendar did not open');
        }
      }
    }

    console.log('\n📊 Custom date range testing complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testCustomDateRanges().catch(console.error);