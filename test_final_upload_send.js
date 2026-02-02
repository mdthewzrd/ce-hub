#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');

async function testFinalUploadAndSend() {
  console.log('🧪 Testing Final Upload + Send Flow...');

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

    // Click the Renata AI Assistant button
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

    // Upload the file first
    console.log('📁 Uploading backside para b file');
    const fileInput = await page.$('input[type="file"]');
    const backsideFilePath = '/Users/michaeldurante/.anaconda/working code/backside daily para/backside para b copy.py';

    if (fileInput && fs.existsSync(backsideFilePath)) {
      await fileInput.uploadFile(backsideFilePath);
      console.log('✅ File uploaded');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Now type a message and send it to trigger the AI
    console.log('⌨️ Typing message to send with file');
    const chatInput = await page.$('input[placeholder*="message"], textarea');

    if (chatInput) {
      await chatInput.type('Please analyze this Python backside scanner code for Two-Stage Universal Scanning');
      console.log('✅ Message typed');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Look for and click the send button
    console.log('📤 Looking for send button to trigger AI');
    const allButtons = await page.$$('button');

    for (let button of allButtons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
      const buttonHtml = await page.evaluate(el => el.innerHTML, button);

      // Look for send button (could be just an icon)
      if ((buttonText && (buttonText.includes('Send') || buttonText.toLowerCase().includes('send'))) ||
          (buttonHtml && (buttonHtml.includes('svg') || buttonHtml.includes('paper-plane') || buttonHtml.includes('arrow')))) {
        console.log('✅ Found potential send button, clicking...');
        await button.click();
        break;
      }
    }

    // If no send button found, try pressing Enter on the input
    const inputField = await page.$('input[placeholder*="message"], textarea');
    if (inputField) {
      console.log('⌨️ Pressing Enter to send message');
      await inputField.press('Enter');
    }

    console.log('⏳ Waiting for AI response...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Check for AI response
    console.log('🤖 Checking for AI response...');

    // Look for new messages that contain AI analysis
    const messages = await page.$$eval('div[class*="message"], div[class*="chat"]', elements => {
      return elements.map(el => {
        const text = el.textContent || '';
        if (text.includes('Scanner Ready') ||
            text.includes('Two-Stage') ||
            text.includes('backside') ||
            text.includes('analysis') ||
            text.includes('Python') ||
            text.includes('characters')) {
          return {
            text: text.substring(0, 300),
            hasScannerReady: text.includes('Scanner Ready'),
            hasBackside: text.includes('backside'),
            hasTwoStage: text.includes('Two-Stage')
          };
        }
        return null;
      }).filter(item => item !== null);
    });

    console.log(`📊 Found ${messages.length} AI-related messages:`, messages);

    // Check for action buttons
    const actionButtons = await page.$$eval('button', buttons => {
      return buttons.map(el => ({
        text: el.textContent,
        visible: el.offsetParent !== null
      })).filter(btn =>
        btn.visible && (
          btn.text.includes('Add to Project') ||
          btn.text.includes('Show Full Code') ||
          btn.text.includes('Execute Scanner')
        )
      );
    });

    console.log(`🎯 Found action buttons:`, actionButtons);

    // Check localStorage
    const localStorageData = await page.evaluate(() => {
      return {
        twoStageScannerCode: localStorage.getItem('twoStageScannerCode'),
        twoStageScannerName: localStorage.getItem('twoStageScannerName'),
        hasCode: !!localStorage.getItem('twoStageScannerCode'),
        codeLength: localStorage.getItem('twoStageScannerCode')?.length || 0
      };
    });

    console.log('💾 LocalStorage data:', localStorageData);

    // Determine success
    const hasAIResponse = messages.length > 0;
    const hasActionButtons = actionButtons.length > 0;
    const hasLocalStorageCode = localStorageData.hasCode;

    if (hasAIResponse && hasActionButtons && hasLocalStorageCode) {
      console.log('🎉 COMPLETE SUCCESS: AI response + Action buttons + LocalStorage code all present!');
    } else if (hasAIResponse) {
      console.log('✅ PARTIAL SUCCESS: AI response received');
    } else if (hasActionButtons) {
      console.log('✅ PARTIAL SUCCESS: Action buttons present');
    } else {
      console.log('❌ Issues detected - check above logs');
    }

    console.log('🧪 Test completed - keeping browser open for inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testFinalUploadAndSend();