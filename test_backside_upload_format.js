#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');

async function testBacksideUploadAndFormat() {
  console.log('🧪 Testing Backside Para B Upload + Format Flow...');

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

    // Click the Renata AI Assistant button in the sidebar to open the chat
    console.log('🤖 Looking for Renata AI Assistant button');
    const buttons = await page.$$('button');
    let renataFound = false;

    for (let button of buttons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
      console.log(`🔍 Found button: "${buttonText}"`);
      if (buttonText && buttonText.includes('Renata')) {
        console.log('✅ Found Renata button, clicking to open chat');
        await button.click();
        renataFound = true;
        break;
      }
    }

    if (!renataFound) {
      console.log('❌ Renata button not found');
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Look for the Format Code button in the chat
    console.log('📝 Looking for Format Code button');
    const formatButtons = await page.$$('button');
    let formatButtonFound = false;

    for (let button of formatButtons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
      console.log(`🔍 Checking button: "${buttonText}"`);
      if (buttonText && buttonText.includes('Format Code')) {
        console.log('✅ Found Format Code button');
        formatButtonFound = true;

        // Click the Format Code button first to trigger the format message
        console.log('📝 Clicking Format Code button');
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;
      }
    }

    // Now look for file upload input
    console.log('📁 Looking for file upload input');
    const fileInput = await page.$('input[type="file"]');

    if (!fileInput) {
      console.log('❌ File input not found');
      return;
    }

    // Read the backside para b file
    const backsideFilePath = '/Users/michaeldurante/.anaconda/working code/backside daily para/backside para b copy.py';

    if (!fs.existsSync(backsideFilePath)) {
      console.log(`❌ File not found: ${backsideFilePath}`);
      return;
    }

    console.log('✅ Found backside para b file, uploading...');
    await fileInput.uploadFile(backsideFilePath);
    console.log('✅ File uploaded');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Look for the send/message button
    console.log('📤 Looking for send button');
    const sendButtons = await page.$$('button');
    let sendButtonFound = false;

    for (let button of sendButtons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
      console.log(`🔍 Checking send button: "${buttonText}"`);
      if (buttonText && (buttonText.includes('Send') || buttonText.includes('send') || (buttonText.trim() === '' && button.parentElement?.querySelector('svg')))) {
        console.log('✅ Found send button');
        sendButtonFound = true;

        // Click the send button to submit the file
        console.log('📤 Clicking send button');
        await button.click();
        break;
      }
    }

    // If no explicit send button, try to find and click any button that might send
    if (!sendButtonFound) {
      console.log('🔍 Looking for any submit/send button');
      // Try clicking on the input field and pressing Enter
      const chatInput = await page.$('input, textarea');
      if (chatInput) {
        console.log('⌨️ Found chat input, pressing Enter');
        await chatInput.press('Enter');
      }
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check for AI response
    console.log('🤖 Checking for AI response...');

    // Look for assistant messages or response content
    const messages = await page.$$eval('div', elements => {
      return elements.map(el => {
        const text = el.textContent || '';
        if (text.includes('Scanner Ready') || text.includes('Two-Stage') || text.includes('backside') || text.includes('analysis')) {
          return text.substring(0, 200);
        }
        return null;
      }).filter(text => text !== null);
    });

    console.log(`📊 Found ${messages.length} relevant messages:`, messages);

    // Look specifically for action buttons
    const actionButtons = await page.$$eval('button', buttons => {
      return buttons.map(el => el.textContent).filter(text =>
        text.includes('Add to Project') ||
        text.includes('Show Full Code') ||
        text.includes('Execute Scanner') ||
        text.includes('Format Code')
      );
    });

    console.log(`🎯 Found action buttons:`, actionButtons);

    if (actionButtons.length > 0) {
      console.log('✅ SUCCESS: Action buttons are present!');

      // Click on one of the action buttons to test functionality
      for (const buttonText of actionButtons) {
        if (buttonText.includes('Show Full Code') || buttonText.includes('Execute Scanner')) {
          console.log(`🎯 Clicking button: ${buttonText}`);
          const targetButton = await page.$(`button:contains("${buttonText}")`) ||
                           (await page.$$eval('button', buttons =>
                             buttons.find(el => el.textContent.includes(buttonText))
                           )).then(index => index !== undefined ? page.$$('button').then(btns => btns[index]) : null);

          if (targetButton) {
            await targetButton.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            break;
          }
        }
      }
    } else {
      console.log('❌ No action buttons found');
    }

    // Check if localStorage has the scanner data
    const localStorageData = await page.evaluate(() => {
      return {
        twoStageScannerCode: localStorage.getItem('twoStageScannerCode'),
        twoStageScannerName: localStorage.getItem('twoStageScannerName')
      };
    });

    console.log('💾 LocalStorage data:', {
      hasCode: !!localStorageData.twoStageScannerCode,
      codeLength: localStorageData.twoStageScannerCode?.length || 0,
      name: localStorageData.twoStageScannerName
    });

    console.log('🧪 Test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Keep browser open for manual inspection
    console.log('🌐 Keeping browser open for 30 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    await browser.close();
  }
}

testBacksideUploadAndFormat();