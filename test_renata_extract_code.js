#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');

async function testRenataCodeExtraction() {
  console.log('🧪 Testing Renata Code Formatting & Extraction...');
  console.log('📁 Reading input file...');

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

    // Click Renata button
    console.log('🤖 Looking for Renata AI Assistant button');
    const buttons = await page.$$('button');
    let renataFound = false;

    for (let button of buttons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
      if (buttonText && buttonText.includes('Renata')) {
        console.log('✅ Found Renata button, clicking...');
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
    console.log('📁 Uploading file...');
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      console.log('❌ File input not found');
      return;
    }

    await fileInput.uploadFile(inputPath);
    console.log('✅ File uploaded');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Click Format Code button
    console.log('🔘 Clicking Format Code button...');
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
      console.log('❌ Format Code button not found');
      return;
    }

    // Wait for formatted code to appear - poll for it
    console.log('⏳ Waiting for Renata to format code (polling for up to 60 seconds)...');

    let formattedCode = null;
    let attempts = 0;
    const maxAttempts = 12; // 12 * 5 seconds = 60 seconds

    while (!formattedCode && attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Try multiple selectors to find the formatted code
      const selectors = [
        'pre',
        'code',
        '[class*="code"]',
        '[class*="Code"]',
        '[class*="python"]',
        'textarea',
        '.message-content',
        '[class*="message"]',
        '[class*="response"]'
      ];

      for (let selector of selectors) {
        try {
          const elements = await page.$$(selector);
          for (let element of elements) {
            const text = await page.evaluate(el => el.textContent, element);
            if (text && text.length > 1000 && text.includes('def add_full_metrics')) {
              console.log(`✅ Found formatted code with selector: ${selector}`);
              formattedCode = text;
              break;
            }
          }
          if (formattedCode) break;
        } catch (e) {
          // Selector might not be valid, continue
        }
      }

      if (formattedCode) {
        break;
      }

      console.log(`  Attempt ${attempts}/${maxAttempts} - Waiting for code...`);
    }

    if (formattedCode) {
      // Clean up the formatted code
      console.log(`✅ Found formatted code (${formattedCode.length} characters)`);

      // Save to file
      const outputPath = '/tmp/backside_scanner_renata_formatted.py';
      fs.writeFileSync(outputPath, formattedCode);
      console.log(`✅ Formatted code saved to: ${outputPath}`);

      // Show a preview of the add_full_metrics method
      const addFullMetricsMatch = formattedCode.match(/def add_full_metrics\(self[^}]+return df/s);
      if (addFullMetricsMatch) {
        console.log('\n📊 Preview of add_full_metrics method:');
        console.log('='*70);
        console.log(addFullMetricsMatch[0].substring(0, 500) + '...');
        console.log('='*70);

        // Check if it uses groupby
        if (addFullMetricsMatch[0].includes('groupby')) {
          console.log('\n⚠️  WARNING: Code still contains groupby operations!');
          console.log('   This means Renata did NOT apply the optimized Stage 3 pattern.');
        } else {
          console.log('\n✅ SUCCESS: Code does NOT use groupby operations!');
          console.log('   Renata correctly applied the optimized Stage 3 pattern.');
        }
      }

    } else {
      console.log('❌ Could not find formatted code in Renata response');

      // Take screenshot for debugging
      await page.screenshot({ path: '/tmp/renata_no_code_found.png', fullPage: true });
      console.log('📸 Screenshot saved to /tmp/renata_no_code_found.png');

      // Try to get page content for debugging
      const pageContent = await page.content();
      console.log('\n📄 Page contains:');
      console.log(`  - "Show Full Code": ${pageContent.includes('Show Full Code') ? 'Yes' : 'No'}`);
      console.log(`  - "Download": ${pageContent.includes('Download') ? 'Yes' : 'No'}`);
      console.log(`  - "Add to Project": ${pageContent.includes('Add to Project') ? 'Yes' : 'No'}`);
      console.log(`  - "def add_full_metrics": ${pageContent.includes('def add_full_metrics') ? 'Yes' : 'No'}`);
    }

    // Keep browser open for review
    console.log('\n⏳ Keeping browser open for 30 seconds for review...');
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testRenataCodeExtraction();
