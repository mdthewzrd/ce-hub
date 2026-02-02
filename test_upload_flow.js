#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testUploadFlow() {
  console.log('🧪 Testing EdgeDev Upload Flow...');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // Navigate to scan page
    console.log('📍 Navigating to http://localhost:5665/scan');
    await page.goto('http://localhost:5665/scan');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Click upload scanner button (try different selectors)
    console.log('📤 Looking for Upload Scanner button');
    const uploadButton = await page.$('button');

    if (uploadButton) {
      const buttonText = await page.evaluate(el => el.textContent, uploadButton);
      console.log(`📊 Found button with text: ${buttonText}`);
      if (buttonText && buttonText.includes('Upload')) {
        await uploadButton.click();
        console.log('📤 Clicked Upload button');
      }
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if modal opens
    const modalVisible = await page.$('.modal-backdrop') !== null;
    console.log(`📋 Modal opened: ${modalVisible}`);

    if (modalVisible) {
      // Click file upload button
      console.log('📁 Looking for file upload option');
      const fileUploadButton = await page.$('button');
      if (fileUploadButton) {
        const fileText = await page.evaluate(el => el.textContent, fileUploadButton);
        if (fileText && fileText.includes('📁')) {
          await fileUploadButton.click();
          console.log('📁 Clicked file upload button');
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create a test file
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

      // Upload the test file
      const fileInput = await page.$('#fileInput');
      if (fileInput) {
        // Convert string to buffer
        const buffer = Buffer.from(testCode);

        // Create file-like object
        const file = {
          name: 'test_scanner.py',
          mimeType: 'text/x-python',
          buffer: buffer
        };

        // Use CDP to upload file (more reliable than direct upload)
        const client = await page.target().createCDPSession();
        await client.send('Page.setFileInputFiles', {
          files: [{
            name: file.name,
            type: file.mimeType,
            data: file.buffer.toString('base64')
          }],
          backendNodeId: await fileInput.evaluateHandle((el) => {
            return { nodeId: el.backendNodeId };
          }).then(h => h._backendNodeProperty)
        });

        console.log('✅ Test file uploaded');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check if auto-redirect happens (it shouldn't anymore)
        const currentUrl = page.url();
        console.log(`🔍 Current URL after upload: ${currentUrl}`);

        if (currentUrl === 'http://localhost:5665/scan') {
          console.log('✅ SUCCESS: No auto-redirect to /exec');
        } else {
          console.log('❌ ISSUE: Still auto-redirecting');
        }

        // Check for response in chat
        const chatVisible = await page.$('.StandaloneRenataChat') !== null;
        console.log(`💬 Chat component visible: ${chatVisible}`);

      } else {
        console.log('❌ File input not found');
      }
    }

    console.log('🧪 Test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testUploadFlow();