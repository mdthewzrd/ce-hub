const { chromium } = require('playwright');
const fs = require('fs');

async function testCompleteLCD2Workflow() {
  console.log('🔬 COMPLETE LC D2 WORKFLOW TEST');
  console.log('=' .repeat(60));
  console.log('Testing: Upload → Analysis → Run → Results');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000, // Slower for debugging
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Enhanced console monitoring
  page.on('console', msg => {
    const text = msg.text();
    console.log(`🌐 BROWSER: ${text}`);
  });

  // Network monitoring for API calls
  page.on('response', response => {
    if (response.url().includes('format') || response.url().includes('scan')) {
      console.log(`📡 API: ${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log('📍 Step 1: Navigate to localhost:5657');
    await page.goto('http://localhost:5657', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(3000);

    console.log('📤 Step 2: Click Upload Strategy button');
    const uploadButton = page.locator('text=Upload Strategy').first();
    await uploadButton.click();
    await page.waitForTimeout(2000);

    console.log('📄 Step 3: Load LC D2 file');
    const lcD2Path = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py';

    if (!fs.existsSync(lcD2Path)) {
      console.log('❌ LC D2 file not found');
      return;
    }

    const fileContent = fs.readFileSync(lcD2Path, 'utf8');
    console.log(`📊 File loaded: ${fileContent.length} characters`);

    console.log('📝 Step 4: Paste code into textarea');
    const textarea = page.locator('textarea');
    await textarea.fill(fileContent);
    await page.waitForTimeout(2000);

    console.log('⏳ Step 5: Monitor analysis progress (waiting up to 3 minutes)');
    let analysisProgress = 0;
    let analysisComplete = false;
    let maxWaitTime = 180; // 3 minutes
    let elapsed = 0;

    while (elapsed < maxWaitTime && !analysisComplete) {
      try {
        // Check for progress indicators
        const progressElements = await page.locator('text=/%|progress|analyzing|analysis/i').all();

        for (const element of progressElements) {
          const text = await element.textContent();
          if (text.includes('%')) {
            const match = text.match(/(\d+)%/);
            if (match) {
              const currentProgress = parseInt(match[1]);
              if (currentProgress > analysisProgress) {
                analysisProgress = currentProgress;
                console.log(`📊 Analysis progress: ${analysisProgress}%`);
              }

              if (currentProgress >= 95) {
                analysisComplete = true;
                break;
              }
            }
          }
        }

        // Also check for completion indicators
        const completeElements = await page.locator('text=/complete|ready|success/i').all();
        if (completeElements.length > 0 && analysisProgress >= 30) {
          console.log('✅ Analysis appears complete based on success indicators');
          analysisComplete = true;
        }

        // Check if stuck at a certain percentage
        if (analysisProgress >= 40 && analysisProgress < 50) {
          const stuckTime = elapsed;
          if (stuckTime > 30) { // If stuck at 40% for more than 30 seconds
            console.log('⚠️  ISSUE DETECTED: Analysis stuck at 40%+');
            await page.screenshot({ path: 'stuck_at_40_percent.png' });
            break;
          }
        }

        await page.waitForTimeout(2000);
        elapsed += 2;

      } catch (e) {
        console.log(`⚠️  Monitoring error: ${e.message}`);
        await page.waitForTimeout(2000);
        elapsed += 2;
      }
    }

    if (!analysisComplete && analysisProgress < 90) {
      console.log(`❌ Analysis failed to complete. Stuck at ${analysisProgress}%`);
      await page.screenshot({ path: 'analysis_failed.png' });
      return;
    }

    console.log('✅ Analysis completed successfully!');
    await page.screenshot({ path: 'analysis_complete.png' });

    console.log('🔍 Step 6: Look for Run button');
    await page.waitForTimeout(3000); // Give UI time to update

    // Look for run button with multiple selectors
    const runSelectors = [
      'text=Run Scan',
      'text=▶️ Run Scan',
      'button:has-text("Run")',
      'button:has-text("▶️")',
      '[data-testid="run-button"]',
      'text=/run.*scan/i'
    ];

    let runButton = null;
    for (const selector of runSelectors) {
      try {
        const button = page.locator(selector);
        if (await button.isVisible()) {
          runButton = button;
          console.log(`✅ Found run button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!runButton) {
      console.log('❌ Run button not found');
      await page.screenshot({ path: 'no_run_button.png' });

      // Show all visible buttons for debugging
      const allButtons = await page.locator('button').all();
      console.log(`🔍 Found ${allButtons.length} buttons:`);
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const text = await allButtons[i].textContent();
        const visible = await allButtons[i].isVisible();
        console.log(`   Button ${i}: "${text}" (visible: ${visible})`);
      }
      return;
    }

    console.log('🚀 Step 7: Click Run button');
    await runButton.click();
    await page.waitForTimeout(3000);

    console.log('📊 Step 8: Monitor scan execution (waiting up to 10 minutes)');
    let scanRunning = false;
    let scanComplete = false;
    let scanResults = 0;
    maxWaitTime = 600; // 10 minutes
    elapsed = 0;

    while (elapsed < maxWaitTime && !scanComplete) {
      try {
        // Check for running indicators
        const runningElements = await page.locator('text=/scanning|running|progress|pending/i').all();
        if (runningElements.length > 0 && !scanRunning) {
          console.log('🔄 Scan started running!');
          scanRunning = true;
        }

        // Check for completion
        const completeElements = await page.locator('text=/complete|finished|found.*results/i').all();
        if (completeElements.length > 0) {
          for (const element of completeElements) {
            const text = await element.textContent();
            console.log(`✅ Completion indicator: ${text}`);

            // Look for result counts
            const resultMatch = text.match(/found (\d+)/i) || text.match(/(\d+) results/i);
            if (resultMatch) {
              scanResults = parseInt(resultMatch[1]);
              console.log(`📊 Results found: ${scanResults}`);
            }
          }
          scanComplete = true;
          break;
        }

        // Check for errors
        const errorElements = await page.locator('text=/error|failed|timeout/i').all();
        if (errorElements.length > 0) {
          for (const element of errorElements) {
            const text = await element.textContent();
            console.log(`❌ Error detected: ${text}`);
          }
          break;
        }

        if (elapsed % 10 === 0) {
          console.log(`⏳ Scan monitoring... ${elapsed}s elapsed`);
        }

        await page.waitForTimeout(5000);
        elapsed += 5;

      } catch (e) {
        console.log(`⚠️  Scan monitoring error: ${e.message}`);
        await page.waitForTimeout(5000);
        elapsed += 5;
      }
    }

    console.log('📸 Taking final screenshot');
    await page.screenshot({ path: 'final_scan_state.png' });

    // Final status report
    console.log('\n📋 FINAL TEST RESULTS');
    console.log('=' .repeat(40));
    console.log(`Analysis Progress: ${analysisProgress}%`);
    console.log(`Analysis Complete: ${analysisComplete ? '✅' : '❌'}`);
    console.log(`Run Button Found: ${runButton ? '✅' : '❌'}`);
    console.log(`Scan Started: ${scanRunning ? '✅' : '❌'}`);
    console.log(`Scan Completed: ${scanComplete ? '✅' : '❌'}`);
    console.log(`Results Found: ${scanResults}`);

    if (analysisComplete && runButton && scanRunning && scanComplete) {
      console.log('\n🎉 COMPLETE SUCCESS: Full workflow working!');
    } else if (analysisProgress < 90) {
      console.log('\n❌ ISSUE: Analysis not completing properly');
    } else if (!runButton) {
      console.log('\n❌ ISSUE: Run button not available');
    } else if (!scanRunning) {
      console.log('\n❌ ISSUE: Scan not starting after run button click');
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS: Some issues detected');
    }

  } catch (error) {
    console.log(`❌ Test failed with error: ${error.message}`);
    await page.screenshot({ path: 'test_error.png' });
  } finally {
    console.log('\n🔍 Browser left open for manual inspection (5 minutes)');
    await page.waitForTimeout(300000); // Keep open for 5 minutes
    await browser.close();
  }
}

testCompleteLCD2Workflow().catch(console.error);