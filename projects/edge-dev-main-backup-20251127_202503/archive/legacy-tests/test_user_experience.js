const { chromium } = require('playwright');

async function testUserExperience() {
  console.log('🔍 TESTING REAL USER EXPERIENCE');
  console.log('=' .repeat(50));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 2000, // Very slow for manual observation
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Enhanced logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('❌') || text.includes('✅') || text.includes('Error') || text.includes('Failed')) {
      console.log(`🌐 IMPORTANT: ${text}`);
    }
  });

  try {
    console.log('📍 Step 1: Navigate and wait for full load');
    await page.goto('http://localhost:5657');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('📤 Step 2: Click Upload Strategy');
    const uploadButton = page.locator('text=Upload Strategy').first();
    await uploadButton.waitFor({ state: 'visible' });
    await uploadButton.click();
    await page.waitForTimeout(2000);

    console.log('📄 Step 3: Load LC D2 file');
    const fs = require('fs');
    const lcD2Path = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py';

    if (!fs.existsSync(lcD2Path)) {
      console.log('❌ LC D2 file not found');
      return;
    }

    const fileContent = fs.readFileSync(lcD2Path, 'utf8');
    console.log(`📊 File size: ${fileContent.length} characters`);

    console.log('📝 Step 4: Paste code and monitor EVERY step');
    const textarea = page.locator('textarea');
    await textarea.waitFor({ state: 'visible' });
    await textarea.fill(fileContent);

    console.log('⏳ Monitoring analysis progress in real-time...');

    // Monitor for 3 minutes, checking every 500ms
    for (let i = 0; i < 360; i++) {
      try {
        // Check for errors
        const errorElements = await page.locator('text=/Error|Failed|error/i').all();
        if (errorElements.length > 0) {
          console.log('❌ ERROR DETECTED:');
          for (let j = 0; j < errorElements.length; j++) {
            const text = await errorElements[j].textContent();
            console.log(`   Error ${j+1}: ${text}`);
          }
          await page.screenshot({ path: 'user_error_detected.png' });
          break;
        }

        // Check analysis progress
        const progressElements = await page.locator('text=/\\d+%/').all();
        for (let j = 0; j < progressElements.length; j++) {
          const text = await progressElements[j].textContent();
          if (text.includes('%')) {
            console.log(`📊 Progress detected: ${text}`);
          }
        }

        // Check modal state
        const modals = await page.locator('.fixed.inset-0').all();
        if (modals.length > 0) {
          const visibleModals = [];
          for (let j = 0; j < modals.length; j++) {
            if (await modals[j].isVisible()) {
              const className = await modals[j].getAttribute('class');
              visibleModals.push(className);
            }
          }
          if (visibleModals.length > 0) {
            console.log(`📋 ${visibleModals.length} modal(s) visible`);
          }
        }

        // Check for Run button
        const runButton = page.locator('text=Run Scan');
        if (await runButton.isVisible()) {
          console.log('🎯 Run button is visible!');

          // Try to click it
          try {
            await runButton.click({ timeout: 1000 });
            console.log('✅ Run button clicked successfully!');

            // Monitor scan execution
            console.log('📊 Monitoring scan execution...');
            await page.waitForTimeout(5000); // Wait for scan to start

            const scanElements = await page.locator('text=/scan|running|executing/i').all();
            if (scanElements.length > 0) {
              console.log('✅ Scan execution detected');
            }

            break;
          } catch (clickError) {
            console.log(`❌ Run button click failed: ${clickError.message}`);
            await page.screenshot({ path: 'run_button_blocked.png' });
          }
        }

        await page.waitForTimeout(500);
      } catch (monitorError) {
        console.log(`⚠️  Monitor error: ${monitorError.message}`);
      }
    }

    console.log('📸 Taking final diagnostic screenshot');
    await page.screenshot({ path: 'user_experience_final.png' });

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    await page.screenshot({ path: 'user_experience_error.png' });
  }

  console.log('🔍 Browser staying open for manual inspection');
  console.log('   Check localhost:5657 manually to see current state');
  console.log('   Press Ctrl+C when done');

  // Keep open indefinitely for manual inspection
  await new Promise(() => {}); // Never resolves
}

testUserExperience().catch(console.error);