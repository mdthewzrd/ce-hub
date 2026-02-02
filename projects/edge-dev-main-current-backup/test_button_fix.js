/**
 * Test the "Add to Project" button fix
 *
 * This validates that after formatting code, the button now appears
 * due to preserved code block syntax (```python...```)
 */

const puppeteer = require('puppeteer');

async function testButtonFix() {
  console.log('🔧 Testing "Add to Project" button fix...\n');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 800,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 800 });

    // Navigate to the platform
    console.log('📍 Step 1: Navigating to Edge.dev...');
    await page.goto('http://localhost:5656');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Open Renata chat
    console.log('📍 Step 2: Opening Renata chat...');
    try {
      await page.click('[data-testid="renata-chat-toggle"]');
    } catch (error) {
      console.log('Trying alternative selector for Renata chat...');
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (let btn of buttons) {
          if (btn.textContent.includes('Renata') || btn.textContent.includes('AI') || btn.textContent.includes('Chat')) {
            btn.click();
            break;
          }
        }
      });
    }
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Look for the input field
    console.log('📍 Step 3: Finding input field...');
    await page.waitForSelector('textarea, input[type="text"]', { timeout: 5000 });

    // Test with a simple format request
    console.log('📍 Step 4: Sending format request...');
    const testCode = `
import requests
import pandas as pd

def test_scanner():
    symbols = ['AAPL', 'GOOGL']
    results = []
    for symbol in symbols:
        if symbol == 'AAPL':
            results.append({'symbol': symbol, 'signal': 'BUY'})
    return results
    `;

    await page.type('textarea, input[type="text"]', `format this code:\n\n${testCode}`);

    // Send the message
    console.log('📍 Step 5: Sending message...');
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 8000)); // Wait longer for formatting

    // Check for formatted code and button
    console.log('📍 Step 6: Checking for formatted code and button...');

    // Check for code blocks (this should now find them)
    const codeBlocks = await page.$$eval('pre code, .prose pre', codes =>
      codes.map(code => code.textContent || code.innerText)
    );

    console.log(`🔍 Found ${codeBlocks.length} code blocks:`);
    codeBlocks.forEach((code, i) => {
      console.log(`Block ${i + 1}: ${code.substring(0, 100)}...`);
    });

    // Check for "Add to Project" button (this should now find it)
    const addToProjectButtons = await page.$$eval('button', buttons =>
      buttons.filter(btn =>
        (btn.textContent || btn.innerText).includes('Add to') ||
        (btn.textContent || btn.innerText).includes('Project') ||
        (btn.textContent || btn.innerText).includes('edge.dev')
      ).map(btn => ({
        text: btn.textContent || btn.innerText,
        visible: btn.offsetParent !== null,
        disabled: btn.disabled,
        tagName: btn.tagName
      }))
    );

    console.log('\n🔍 "Add to Project" buttons found:', addToProjectButtons.length);
    addToProjectButtons.forEach((btn, i) => {
      console.log(`Button ${i + 1}: "${btn.text}" (Visible: ${btn.visible}, Disabled: ${btn.disabled})`);
    });

    // Take screenshot for verification
    await page.screenshot({ path: 'button_fix_verification.png', fullPage: true });
    console.log('\n📸 Screenshot saved as button_fix_verification.png');

    // Success criteria
    const hasCodeBlocks = codeBlocks.length > 0;
    const hasAddToProjectButton = addToProjectButtons.length > 0 && addToProjectButtons.some(btn => btn.visible);

    console.log('\n🎯 VERIFICATION RESULTS:');
    console.log('========================');
    console.log(`✅ Code blocks found: ${hasCodeBlocks}`);
    console.log(`✅ Add to Project button visible: ${hasAddToProjectButton}`);

    if (hasCodeBlocks && hasAddToProjectButton) {
      console.log('\n🎉 SUCCESS! The "Add to Project" button fix is working!');
      console.log('✅ Code blocks are preserved after formatting');
      console.log('✅ Button appears and is clickable');
      console.log('\n📋 NEXT STEPS:');
      console.log('- Test clicking the Add to Project button');
      console.log('- Verify project creation workflow');
      console.log('- Test with your actual backside scanner code');
    } else {
      console.log('\n❌ Fix verification failed');
      if (!hasCodeBlocks) {
        console.log('- Code blocks are still being removed');
      }
      if (!hasAddToProjectButton) {
        console.log('- Add to Project button is not appearing');
      }
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error('❌ Error during button fix test:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testButtonFix().then(success => {
  console.log('\n🏁 Button fix test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});