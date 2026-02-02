#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');

async function testRenataStage3Optimization() {
  console.log('🧪 Testing Renata Stage 3 Optimization...');
  console.log('📁 Reading input file...');

  // Read the Backside B scanner file
  const inputPath = '/Users/michaeldurante/Downloads/Backside_B_scanner (17).py';
  let originalCode;

  try {
    originalCode = fs.readFileSync(inputPath, 'utf8');
    console.log(`✅ File loaded (${originalCode.length} characters)`);
  } catch (error) {
    console.error('❌ Could not read file:', error.message);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // Navigate to scan page
    console.log('📍 Navigating to http://localhost:5665/scan');
    await page.goto('http://localhost:5665/scan', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Look for and click Renata AI Assistant button
    console.log('🤖 Looking for Renata AI Assistant button');
    const buttons = await page.$$('button');
    let renataFound = false;

    for (let button of buttons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
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

    // Upload the file
    console.log('📁 Looking for file upload option');
    const fileInput = await page.$('input[type="file"]');

    if (!fileInput) {
      console.log('❌ File input not found');
      return;
    }

    console.log('✅ Found file input, uploading Backside B scanner');
    await fileInput.uploadFile(inputPath);
    console.log('✅ File uploaded');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Click the "Format Code" button to trigger Renata
    console.log('🔘 Looking for "Format Code" button...');

    // Try to find any button with "Format" in the text
    const allButtons = await page.$$('button');
    let formatClicked = false;

    for (let btn of allButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Format')) {
        console.log(`✅ Found button: "${text}", clicking...`);
        await btn.click();
        formatClicked = true;
        break;
      }
    }

    if (!formatClicked) {
      console.log('⚠️  Format Code button not found');
    } else {
      console.log('✅ Format Code button clicked');
    }

    // Wait for Renata to process the code
    console.log('⏳ Waiting for Renata to format the code (45 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 45000));

    // Look for Renata's response and action buttons
    console.log('🤖 Checking for Renata response...');

    // Look for formatted code response or action buttons
    const pageContent = await page.content();

    // Check for various possible responses
    const hasShowFullCode = pageContent.includes('Show Full Code') || pageContent.includes('Download');
    const hasAddToProject = pageContent.includes('Add to Project');

    console.log(`📊 Page content check:`);
    console.log(`  - Show Full Code/Download: ${hasShowFullCode ? '✅' : '❌'}`);
    console.log(`  - Add to Project: ${hasAddToProject ? '✅' : '❌'}`);

    // Take screenshots
    await page.screenshot({ path: '/tmp/renata_stage3_before.png', fullPage: true });
    console.log('📸 Screenshot saved to /tmp/renata_stage3_before.png');

    // Look for code blocks or formatted output
    const codeBlocks = await page.$$eval('pre, code, [class*="code"]', elements => {
      return elements.map(el => el.textContent);
    });

    console.log(`📊 Found ${codeBlocks.length} code blocks`);
    if (codeBlocks.length > 0) {
      // Save the largest code block
      const largestBlock = codeBlocks.reduce((a, b) => a.length > b.length ? a : b);
      fs.writeFileSync('/tmp/renata_stage3_output.py', largestBlock);
      console.log(`✅ Code saved to /tmp/renata_stage3_output.py (${largestBlock.length} characters)`);
    }

    // Wait for user to see the result
    console.log('⏳ Waiting 30 seconds for you to review...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    console.log('✅ Test completed - Check /tmp/renata_stage3_output.py for the formatted code');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testRenataStage3Optimization();
