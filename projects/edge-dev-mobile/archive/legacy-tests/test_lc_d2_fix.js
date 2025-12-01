const { chromium } = require('playwright');

async function testLCD2Fix() {
  console.log('🧪 TESTING LC D2 SCANNER FIX');
  console.log('=' .repeat(50));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Monitor console for our new logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('✅') || text.includes('❌') || text.includes('Analysis') || text.includes('State')) {
      console.log(`🌐 FRONTEND: ${text}`);
    }
  });

  try {
    console.log('📍 Navigating to localhost:5657...');
    await page.goto('http://localhost:5657');
    await page.waitForTimeout(2000);

    console.log('📤 Looking for and clicking upload button...');
    const uploadButton = page.locator('text=Upload Strategy').first();
    await uploadButton.click();
    await page.waitForTimeout(1000);

    console.log('📄 Reading LC D2 file...');
    const fs = require('fs');
    const lcD2Path = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py';

    if (!fs.existsSync(lcD2Path)) {
      console.log('❌ LC D2 file not found');
      return;
    }

    const fileContent = fs.readFileSync(lcD2Path, 'utf8');
    console.log(`📊 File size: ${fileContent.length} characters`);

    console.log('📝 Pasting code into textarea...');
    const textarea = page.locator('textarea');
    await textarea.fill(fileContent);
    await page.waitForTimeout(1000);

    console.log('⏳ Waiting for analysis to complete...');
    // Wait for analysis completion (up to 2 minutes)
    await page.waitForTimeout(30000); // Give it 30 seconds to complete

    console.log('🔍 Checking for error states...');

    // Check for error displays
    const errorElements = await page.locator('text=/Error|Failed|Analysis Error/').all();
    const errorFound = errorElements.length > 0;

    if (errorFound) {
      console.log(`❌ Found ${errorElements.length} error elements:`);
      for (let i = 0; i < errorElements.length; i++) {
        const text = await errorElements[i].textContent();
        console.log(`   Error ${i+1}: ${text}`);
      }
    } else {
      console.log('✅ No error elements found!');
    }

    // Check for success indicators
    const successElements = await page.locator('text=/Complete|Success|Ready|Run/').all();

    if (successElements.length > 0) {
      console.log(`✅ Found ${successElements.length} success indicators:`);
      for (let i = 0; i < successElements.length; i++) {
        const text = await successElements[i].textContent();
        console.log(`   Success ${i+1}: ${text}`);
      }
    }

    // Take screenshot
    await page.screenshot({ path: 'test_lc_d2_fix.png' });

    if (!errorFound && successElements.length > 0) {
      console.log('🎉 FIX SUCCESSFUL: LC D2 scanner completed without errors!');
    } else if (errorFound) {
      console.log('⚠️  FIX INCOMPLETE: Still showing errors');
    } else {
      console.log('❓ STATUS UNCLEAR: No clear success or error indicators');
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  } finally {
    await page.waitForTimeout(5000); // Wait 5 seconds for review
    await browser.close();
  }
}

testLCD2Fix().catch(console.error);