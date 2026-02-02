#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testRenataChatUpload() {
  console.log('🧪 Testing Renata Chat Upload Flow...');

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

    // First, click the Renata AI Assistant button in the sidebar to open the chat
    console.log('🤖 Looking for Renata AI Assistant button');
    const renataButton = await page.$('button');

    // Look through all buttons to find the one with "Renata" text
    const buttons = await page.$$('button');
    let renataFound = false;

    for (let button of buttons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
      console.log(`🔍 Found button: ${buttonText}`);
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

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Look for the chat input
    console.log('💬 Looking for chat input');
    const chatInput = await page.$('input[placeholder*="message"], textarea[placeholder*="message"], input');

    if (!chatInput) {
      console.log('❌ Chat input not found');
      return;
    }

    // Create a test Python scanner file
    const testCode = `
import pandas as pd
import numpy as np

def backside_scanner():
    """
    Test Two-Stage Scanner
    """
    results = []
    # Test logic here
    return results

if __name__ == "__main__":
    results = backside_scanner()
    print(f"Found {len(results)} opportunities")
    `.trim();

    // Upload the file through the chat interface
    console.log('📁 Looking for file upload option in chat');

    // Look for file input or upload button in the chat
    const fileInput = await page.$('input[type="file"]');

    if (fileInput) {
      console.log('✅ Found file input, uploading test scanner');

      // Create a temporary file
      const fs = require('fs');
      const filePath = '/tmp/test_scanner.py';
      fs.writeFileSync(filePath, testCode);

      // Upload the file
      await fileInput.uploadFile(filePath);
      console.log('✅ File uploaded');

      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check for response from Renata
      console.log('🤖 Checking for Renata response...');

      // Look for assistant messages
      const messages = await page.$$eval('[data-message], .message, div[class*="message"]', elements => {
        return elements.map(el => el.textContent);
      });

      console.log(`📊 Found ${messages.length} messages:`, messages.slice(0, 3));

      // Look specifically for action buttons
      const actionButtons = await page.$$eval('button', buttons => {
        return buttons.map(el => el.textContent).filter(text =>
          text.includes('Add to Project') ||
          text.includes('Show Full Code') ||
          text.includes('Execute Scanner')
        );
      });

      console.log(`🎯 Found action buttons:`, actionButtons);

      if (actionButtons.length > 0) {
        console.log('✅ SUCCESS: Action buttons are present!');
      } else {
        console.log('❌ No action buttons found');
      }

    } else {
      console.log('❌ File input not found in chat');
    }

    console.log('🧪 Test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testRenataChatUpload();