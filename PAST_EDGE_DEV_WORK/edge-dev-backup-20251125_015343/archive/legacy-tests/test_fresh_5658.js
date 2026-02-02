const { chromium } = require('playwright');
const fs = require('fs');

async function testFresh5658() {
  console.log('🧪 TESTING ON FRESH PORT 5658 (should show fixed behavior)');
  console.log('=' .repeat(70));
  console.log('Expected: Normal percentages, no auto-execution, no modal blocking');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Enhanced console monitoring to catch all progress updates
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('%') || text.includes('Progress') || text.includes('Analysis') ||
        text.includes('MANUAL MODE') || text.includes('Auto-confirming') ||
        text.includes('IMMEDIATE CLEANUP') || text.includes('FIXED')) {
      console.log(`🌐 FRONTEND: ${text}`);
    }
  });

  try {
    console.log('📍 Step 1: Navigate to FRESH PORT 5659');
    await page.goto('http://localhost:5659', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(3000);

    console.log('📤 Step 2: Click Upload Strategy');
    const uploadButton = page.locator('text=Upload Strategy').first();
    await uploadButton.click();
    await page.waitForTimeout(2000);

    console.log('📄 Step 3: Load LC D2 file on FRESH instance');
    const lcD2Path = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py';

    if (!fs.existsSync(lcD2Path)) {
      console.log('❌ LC D2 file not found');
      return;
    }

    const fileContent = fs.readFileSync(lcD2Path, 'utf8');
    console.log(`📊 File size: ${fileContent.length} characters`);

    console.log('📝 Step 4: Paste code and monitor for FIXED behavior');
    const textarea = page.locator('textarea');
    await textarea.fill(fileContent);
    await page.waitForTimeout(2000);

    console.log('🔍 Step 5: Monitor analysis progress (looking for NORMAL percentages)');
    let progressSeen = [];
    let manualModeDetected = false;
    let autoExecutionSeen = false;
    let maxProgress = 0;

    // Monitor for 2 minutes to see the complete workflow
    for (let i = 0; i < 120; i++) {
      try {
        // Check for progress elements
        const progressElements = await page.locator('text=/%/').all();
        for (const element of progressElements) {
          const text = await element.textContent();
          if (text.includes('%')) {
            const match = text.match(/(\d+(?:\.\d+)?)%/);
            if (match) {
              const percentage = parseFloat(match[1]);
              progressSeen.push(percentage);
              maxProgress = Math.max(maxProgress, percentage);
              console.log(`📊 Progress detected: ${percentage}%`);

              // Flag if we see impossible percentages (means fixes didn't work)
              if (percentage > 150) {
                console.log(`❌ BROKEN PROGRESS DETECTED: ${percentage}% - Fixes not working!`);
              }
            }
          }
        }

        // Check for manual mode indicators
        const manualElements = await page.locator('text=/MANUAL MODE|manual control|User must review/i').all();
        if (manualElements.length > 0 && !manualModeDetected) {
          manualModeDetected = true;
          console.log('✅ MANUAL MODE DETECTED - Auto-execution disabled correctly');
        }

        // Check for auto-execution (should NOT happen)
        const autoElements = await page.locator('text=/Auto-proceeding|Auto-upload|Auto-checking/i').all();
        if (autoElements.length > 0 && !autoExecutionSeen) {
          autoExecutionSeen = true;
          console.log('❌ AUTO-EXECUTION DETECTED - Fixes not working properly');
        }

        // Check for analysis completion
        const completeElements = await page.locator('text=/Complete|Success|Ready|✅/i').all();
        if (completeElements.length > 0 && maxProgress >= 90) {
          console.log('✅ Analysis completed successfully');
          break;
        }

        await page.waitForTimeout(1000);
      } catch (e) {
        // Continue monitoring
      }
    }

    console.log('🔍 Step 6: Check final state and modal behavior');

    // Look for modal overlays that might block the UI
    const modalOverlays = await page.locator('.fixed.inset-0').all();
    let visibleModals = 0;
    for (const modal of modalOverlays) {
      if (await modal.isVisible()) {
        visibleModals++;
      }
    }

    // Check if Run button is accessible
    const runButton = page.locator('text=Run Scan');
    const runButtonVisible = await runButton.isVisible();

    await page.screenshot({ path: 'fresh_5658_final_state.png' });

    // Final analysis report
    console.log('\n📋 FRESH PORT 5658 TEST RESULTS');
    console.log('=' .repeat(50));
    console.log(`Max progress seen: ${maxProgress}%`);
    console.log(`Progress values seen: ${progressSeen.slice(-10).join(', ')} (last 10)`);
    console.log(`Manual mode detected: ${manualModeDetected ? '✅' : '❌'}`);
    console.log(`Auto-execution seen: ${autoExecutionSeen ? '❌' : '✅ (none)'}`);
    console.log(`Visible modals: ${visibleModals}`);
    console.log(`Run button visible: ${runButtonVisible ? '✅' : '❌'}`);

    // Determine if fixes are working
    const normalProgress = progressSeen.every(p => p <= 100);
    const fixesWorking = normalProgress && manualModeDetected && !autoExecutionSeen;

    if (fixesWorking) {
      console.log('\n🎉 SUCCESS: All fixes working correctly on fresh instance!');
    } else {
      console.log('\n❌ ISSUES FOUND: Fixes not fully working');
      if (!normalProgress) console.log('   - Progress calculation still broken');
      if (!manualModeDetected) console.log('   - Manual mode not working');
      if (autoExecutionSeen) console.log('   - Auto-execution not disabled');
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    await page.screenshot({ path: 'fresh_5658_error.png' });
  } finally {
    console.log('\n🔍 Browser staying open for manual inspection (30 seconds)');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

testFresh5658().catch(console.error);