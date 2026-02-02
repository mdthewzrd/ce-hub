#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testActionButtonsManual() {
  console.log('🧪 Manual Test: Action Buttons Functionality...');

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
    console.log('📝 Manual Steps to Test:');
    console.log('   1. Click "Format Code" button');
    console.log('   2. Upload a Python file');
    console.log('   3. Send the message');
    console.log('   4. Click "Add to Project" button - should auto-send message');
    console.log('   5. Click "View Full Code" button - should auto-send message');
    console.log('   6. Verify no "Execute Scanner" button exists');
    console.log('   7. Check AI responses are clean and professional');

    // Keep browser open for manual testing
    console.log('🌐 Keeping browser open for 60 seconds for manual testing...');
    await new Promise(resolve => setTimeout(resolve, 60000));

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testActionButtonsManual();