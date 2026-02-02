#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testActionButtonsAutoSend() {
  console.log('🧪 Testing Action Buttons Auto-Send Functionality...');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // Navigate to scan page
    console.log('📍 Navigating to http://localhost:5665/scan');
    await page.goto('http://localhost:5665/scan');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Open Renata chat
    console.log('🤖 Opening Renata chat');
    const buttons = await page.$$('button');
    for (let button of buttons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
      if (buttonText && buttonText.includes('Renata')) {
        await button.click();
        break;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('✅ Chat opened - Browser will stay open for manual testing');
    console.log('📝 Test Steps:');
    console.log('   1. Upload a Python file');
    console.log('   2. Send message to get AI response');
    console.log('   3. Click "Add to Project" - should auto-send user message and get AI response');
    console.log('   4. Click "View Full Code" - should auto-send user message and get AI response');
    console.log('   5. Verify responses are clean and simple (no ugly formatting)');
    console.log('   6. Check that messages appear in chat automatically');

    // Keep browser open for testing
    console.log('🌐 Keeping browser open for 90 seconds for testing...');
    await new Promise(resolve => setTimeout(resolve, 90000));

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testActionButtonsAutoSend();