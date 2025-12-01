const { chromium } = require('playwright');
const fs = require('fs');

async function testBacksideFile() {
  console.log('🧪 TESTING BACKSIDE FILE (should work perfectly)');
  console.log('=' .repeat(60));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Monitor console for progress tracking
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('%') || text.includes('Progress') || text.includes('Analysis')) {
      console.log(`🌐 FRONTEND: ${text}`);
    }
  });

  try {
    console.log('📍 Navigating to localhost:5657...');
    await page.goto('http://localhost:5657');
    await page.waitForTimeout(2000);

    console.log('📤 Clicking Upload Strategy...');
    const uploadButton = page.locator('text=Upload Strategy').first();
    await uploadButton.click();
    await page.waitForTimeout(1000);

    console.log('📄 Loading backside para b file (should work smoothly)...');
    const backsidePath = '/Users/michaeldurante/Downloads/backside para b copy.py';

    if (!fs.existsSync(backsidePath)) {
      console.log('❌ Backside file not found');
      return;
    }

    const fileContent = fs.readFileSync(backsidePath, 'utf8');
    console.log(`📊 File size: ${fileContent.length} characters (much smaller than LC D2)`);

    console.log('📝 Pasting code into textarea...');
    const textarea = page.locator('textarea');
    await textarea.fill(fileContent);
    await page.waitForTimeout(1000);

    console.log('⏳ Monitoring progress for 60 seconds...');
    // Monitor for 1 minute to see if progress behaves normally
    for (let i = 0; i < 60; i++) {
      try {
        // Check for progress elements
        const progressElements = await page.locator('text=/%/').all();
        for (const element of progressElements) {
          const text = await element.textContent();
          if (text.includes('%')) {
            console.log(`📊 Progress detected: ${text}`);
          }
        }

        // Check for completion
        const completeElements = await page.locator('text=/Complete|Success|Ready/').all();
        if (completeElements.length > 0) {
          console.log('✅ Analysis appears complete');
          break;
        }

        await page.waitForTimeout(1000);
      } catch (e) {
        // Continue monitoring
      }
    }

    await page.screenshot({ path: 'backside_test_result.png' });

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  } finally {
    console.log('🔍 Keeping browser open for 10 seconds to observe...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testBacksideFile().catch(console.error);