const { chromium } = require('playwright');

async function testRunButtonAccess() {
  console.log('🔍 TESTING RUN BUTTON ACCESS AFTER UPLOAD');
  console.log('=' .repeat(50));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable detailed console logging
  page.on('console', msg => {
    console.log(`🌐 BROWSER: ${msg.text()}`);
  });

  try {
    console.log('📍 Step 1: Navigate to localhost:5657');
    await page.goto('http://localhost:5657');
    await page.waitForTimeout(3000);

    console.log('📤 Step 2: Click Upload Strategy button');
    const uploadButton = page.locator('text=Upload Strategy').first();
    await uploadButton.click();
    await page.waitForTimeout(2000);

    console.log('📄 Step 3: Load and paste LC D2 file');
    const fs = require('fs');
    const lcD2Path = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py';

    if (!fs.existsSync(lcD2Path)) {
      console.log('❌ LC D2 file not found');
      return;
    }

    const fileContent = fs.readFileSync(lcD2Path, 'utf8');
    const textarea = page.locator('textarea');
    await textarea.fill(fileContent);
    await page.waitForTimeout(2000);

    console.log('⏳ Step 4: Wait for analysis and auto-confirmation to complete (2 minutes max)');
    let autoConfirmationComplete = false;
    let maxWait = 120; // 2 minutes
    let elapsed = 0;

    while (elapsed < maxWait && !autoConfirmationComplete) {
      try {
        // Check for auto-confirmation completion
        const modalClosedElements = await page.locator('text=/modal.*closed|closing.*modal|auto.*upload.*completed/i').all();

        if (modalClosedElements.length > 0) {
          console.log('✅ Auto-confirmation appears to be complete');
          autoConfirmationComplete = true;
          break;
        }

        // Check if we can see the run button without modal blocking
        const runButton = page.locator('text=Run Scan');
        const isRunButtonVisible = await runButton.isVisible();

        if (isRunButtonVisible) {
          // Try to check if there are any modal overlays
          const modalOverlays = await page.locator('.fixed.inset-0.bg-black').all();
          console.log(`🔍 Found ${modalOverlays.length} modal overlays`);

          if (modalOverlays.length === 0) {
            console.log('✅ No modal overlays detected - Run button should be accessible');
            autoConfirmationComplete = true;
            break;
          } else {
            console.log(`⚠️  ${modalOverlays.length} modal overlays still present`);
            // List visible overlays
            for (let i = 0; i < modalOverlays.length; i++) {
              const overlay = modalOverlays[i];
              const isVisible = await overlay.isVisible();
              const text = await overlay.textContent();
              console.log(`   Overlay ${i+1}: visible=${isVisible}, text="${text?.substring(0, 100)}..."`);
            }
          }
        }

        await page.waitForTimeout(2000);
        elapsed += 2;

        if (elapsed % 10 === 0) {
          console.log(`⏳ Waiting... ${elapsed}s elapsed`);
        }

      } catch (error) {
        console.log(`⚠️  Monitoring error: ${error.message}`);
        await page.waitForTimeout(2000);
        elapsed += 2;
      }
    }

    if (!autoConfirmationComplete) {
      console.log('❌ Auto-confirmation did not complete within time limit');
      await page.screenshot({ path: 'auto_confirmation_timeout.png' });
    }

    console.log('🔍 Step 5: Analyze current page state');

    // Check for all visible modals
    const allModals = await page.locator('.fixed.inset-0').all();
    console.log(`📊 Total modal containers found: ${allModals.length}`);

    for (let i = 0; i < allModals.length; i++) {
      const modal = allModals[i];
      const isVisible = await modal.isVisible();
      const className = await modal.getAttribute('class');
      console.log(`   Modal ${i+1}: visible=${isVisible}, class="${className}"`);
    }

    // Check run button accessibility
    console.log('🔍 Step 6: Test Run button accessibility');
    const runButton = page.locator('text=Run Scan');
    const isRunButtonVisible = await runButton.isVisible();
    console.log(`🎯 Run button visible: ${isRunButtonVisible}`);

    if (isRunButtonVisible) {
      try {
        // Try to click with a short timeout to see what blocks it
        await runButton.click({ timeout: 5000 });
        console.log('✅ Run button clicked successfully!');
      } catch (error) {
        console.log(`❌ Run button click failed: ${error.message}`);

        // Take a screenshot for debugging
        await page.screenshot({ path: 'run_button_blocked.png' });

        // Try to identify what's blocking the click
        const blockingElements = await page.locator('.fixed.inset-0.bg-black').all();
        console.log(`🚫 Found ${blockingElements.length} potential blocking elements:`);

        for (let i = 0; i < blockingElements.length; i++) {
          const element = blockingElements[i];
          const isVisible = await element.isVisible();
          const zIndex = await element.evaluate(el => window.getComputedStyle(el).zIndex);
          const className = await element.getAttribute('class');
          console.log(`   Blocker ${i+1}: visible=${isVisible}, z-index=${zIndex}, class="${className}"`);
        }
      }
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    await page.screenshot({ path: 'test_failed.png' });
  } finally {
    console.log('🔍 Keeping browser open for manual inspection (30 seconds)');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

testRunButtonAccess().catch(console.error);