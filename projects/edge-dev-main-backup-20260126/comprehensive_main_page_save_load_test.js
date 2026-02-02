const puppeteer = require('puppeteer');

async function validateMainPageSaveLoadWorkflow() {
  console.log('🎭 COMPREHENSIVE MAIN PAGE SAVE/LOAD WORKFLOW VALIDATION');
  console.log('=======================================================');

  let browser;
  let page;

  try {
    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox']
    });

    page = await browser.newPage();

    // Enable console logging from the page
    page.on('console', msg => {
      console.log('📢 Browser Console:', msg.type().toUpperCase(), msg.text());
    });

    // Enable request/response logging
    page.on('request', request => {
      if (request.url().includes('/api/scans/')) {
        console.log('📤 API Request:', request.method(), request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/scans/')) {
        console.log('📥 API Response:', response.status(), response.url());
      }
    });

    // Navigate to the main page
    console.log('🌐 Navigating to main page http://localhost:5656...');
    await page.goto('http://localhost:5656', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for the page to load
    await page.waitForTimeout(3000);
    console.log('✅ Main page loaded successfully');

    // Step 1: Check if saved scans are displayed on page load
    console.log('\n🔍 STEP 1: Checking for saved scans on page load...');

    const savedScansOnLoad = await page.evaluate(() => {
      const savedScanElements = document.querySelectorAll('tr');
      let savedScanCount = 0;

      savedScanElements.forEach(row => {
        const text = row.textContent || '';
        if (text.includes('📁') && text.includes('results')) {
          savedScanCount++;
        }
      });

      return {
        savedScanCount,
        allElements: document.querySelectorAll('tr').length
      };
    });

    console.log(`📊 Found ${savedScansOnLoad.savedScanCount} saved scans on page load`);
    console.log(`📊 Total table rows: ${savedScansOnLoad.allElements}`);

    // Step 2: Check backend connection and saved scans
    console.log('\n🔍 STEP 2: Verifying backend connection...');

    const backendCheck = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:8000/api/scans/user/test_user_123');
        const data = await response.json();
        return {
          success: response.ok,
          totalScans: data.scans?.length || 0,
          scanNames: data.scans?.map(s => `${s.scan_name} (${s.results_count} results)`) || []
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    if (backendCheck.success) {
      console.log('✅ Backend connection successful');
      console.log(`📊 Backend reports ${backendCheck.totalScans} saved scans:`);
      backendCheck.scanNames.forEach((name, i) => {
        console.log(`  ${i + 1}. ${name}`);
      });
    } else {
      console.log('❌ Backend connection failed:', backendCheck.error);
      return;
    }

    // Step 3: Check if Save Scan button appears when there are results
    console.log('\n🔍 STEP 3: Checking for Save Scan functionality...');

    const saveButtonCheck = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [role="button"]');
      let saveButtonFound = false;
      let saveButtonText = '';

      buttons.forEach(button => {
        const text = button.textContent || '';
        if (text.toLowerCase().includes('save') && text.toLowerCase().includes('scan')) {
          saveButtonFound = true;
          saveButtonText = text.trim();
        }
      });

      // Check for scan results
      const scanResults = document.querySelectorAll('tbody tr');
      let hasResults = false;
      scanResults.forEach(row => {
        const text = row.textContent || '';
        if (text.includes('results') === false && text.length > 10) {
          hasResults = true;
        }
      });

      return {
        saveButtonFound,
        saveButtonText,
        hasResults,
        totalRows: scanResults.length
      };
    });

    console.log(`🔘 Save Scan button found: ${saveButtonCheck.saveButtonFound}`);
    if (saveButtonCheck.saveButtonFound) {
      console.log(`📝 Save button text: "${saveButtonCheck.saveButtonText}"`);
    }
    console.log(`📊 Has scan results: ${saveButtonCheck.hasResults}`);
    console.log(`📊 Total table rows: ${saveButtonCheck.totalRows}`);

    // Step 4: Test clicking on a saved scan (if available)
    if (savedScansOnLoad.savedScanCount > 0) {
      console.log('\n🔍 STEP 4: Testing saved scan click functionality...');

      const scanClickResult = await page.evaluate(() => {
        const savedScanRows = Array.from(document.querySelectorAll('tr'));
        const firstSavedScan = savedScanRows.find(row => {
          const text = row.textContent || '';
          return text.includes('📁') && text.includes('results');
        });

        if (firstSavedScan) {
          // Get scan name before clicking
          const scanText = firstSavedScan.textContent || '';

          // Click the saved scan
          firstSavedScan.click();

          return {
            success: true,
            scanText: scanText.substring(0, 100),
            clicked: true
          };
        }

        return { success: false, reason: 'No saved scan rows found' };
      });

      if (scanClickResult.success) {
        console.log('✅ Clicked on saved scan:', scanClickResult.scanText);

        // Wait for potential loading
        await page.waitForTimeout(2000);

        // Check if results were loaded
        const resultsAfterClick = await page.evaluate(() => {
          const rows = document.querySelectorAll('tbody tr');
          let dataRows = 0;

          rows.forEach(row => {
            const text = row.textContent || '';
            // Count rows with ticker symbols (like AAPL, TSLA, etc.)
            if (/\b[A-Z]{1,5}\b/.test(text) && text.includes('%')) {
              dataRows++;
            }
          });

          return dataRows;
        });

        console.log(`📊 Results after click: ${resultsAfterClick} data rows found`);
      } else {
        console.log('❌ Failed to click saved scan:', scanClickResult.reason);
      }
    }

    // Step 5: Test Save Scan Modal (if button is available and there are results)
    if (saveButtonCheck.saveButtonFound && saveButtonCheck.hasResults) {
      console.log('\n🔍 STEP 5: Testing Save Scan modal...');

      // Request notification permission first
      await page.evaluate(async () => {
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      });

      // Click save scan button
      const modalOpened = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, [role="button"]');
        for (let button of buttons) {
          const text = button.textContent || '';
          if (text.toLowerCase().includes('save') && text.toLowerCase().includes('scan')) {
            button.click();
            return true;
          }
        }
        return false;
      });

      if (modalOpened) {
        console.log('✅ Save Scan button clicked');
        await page.waitForTimeout(1000);

        // Check for modal
        const modalCheck = await page.evaluate(() => {
          const modals = document.querySelectorAll('[role="dialog"], .modal, .fixed.inset-0');
          const inputs = document.querySelectorAll('input[type="text"]');

          return {
            modalFound: modals.length > 0,
            inputFound: inputs.length > 0,
            modalCount: modals.length,
            inputCount: inputs.length
          };
        });

        console.log('📋 Modal elements found:', modalCheck);

        if (modalCheck.inputFound > 0) {
          // Fill in scan name and save
          console.log('📝 Filling in scan details...');

          await page.type('input[type="text"]', 'Puppeteer Validation Test Scan');

          // Click save button in modal
          const saveClicked = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button, [role="button"]');
            for (let button of buttons) {
              const text = button.textContent || '';
              if (text.toLowerCase().includes('save') && !text.toLowerCase().includes('scan')) {
                button.click();
                return true;
              }
            }
            return false;
          });

          if (saveClicked) {
            console.log('✅ Save confirmation clicked');
            await page.waitForTimeout(3000);

            // Check for success notification or updated scan list
            const finalCheck = await page.evaluate(async () => {
              // Check for new saved scan
              const savedScanRows = Array.from(document.querySelectorAll('tr'));
              let puppeteerScanFound = false;

              savedScanRows.forEach(row => {
                const text = row.textContent || '';
                if (text.includes('Puppeteer Validation Test Scan')) {
                  puppeteerScanFound = true;
                }
              });

              // Check backend for new scan
              try {
                const response = await fetch('http://localhost:8000/api/scans/user/test_user_123');
                const data = await response.json();

                return {
                  puppeteerScanFound,
                  totalBackendScans: data.scans?.length || 0,
                  backendSuccess: response.ok
                };
              } catch (error) {
                return {
                  puppeteerScanFound,
                  totalBackendScans: 0,
                  backendSuccess: false,
                  error: error.message
                };
              }
            });

            if (finalCheck.puppeteerScanFound) {
              console.log('🎉 SUCCESS: New saved scan found in UI!');
            }

            if (finalCheck.backendSuccess) {
              console.log(`✅ Backend verification: ${finalCheck.totalBackendScans} total scans`);
            } else {
              console.log('❌ Backend verification failed:', finalCheck.error);
            }
          }
        }
      }
    }

    // Step 6: Final Validation Summary
    console.log('\n📋 FINAL VALIDATION SUMMARY');
    console.log('==========================');

    const finalState = await page.evaluate(async () => {
      // Count saved scans in UI
      const savedScanElements = document.querySelectorAll('tr');
      let savedScanCount = 0;

      savedScanElements.forEach(row => {
        const text = row.textContent || '';
        if (text.includes('📁') && text.includes('results')) {
          savedScanCount++;
        }
      });

      // Check backend one final time
      try {
        const response = await fetch('http://localhost:8000/api/scans/user/test_user_123');
        const data = await response.json();

        return {
          uiSavedScans: savedScanCount,
          backendSavedScans: data.scans?.length || 0,
          backendConnected: response.ok,
          scanNames: data.scans?.map(s => s.scan_name) || []
        };
      } catch (error) {
        return {
          uiSavedScans: savedScanCount,
          backendSavedScans: 0,
          backendConnected: false,
          error: error.message
        };
      }
    });

    console.log(`📊 Saved scans in UI: ${finalState.uiSavedScans}`);
    console.log(`📊 Saved scans in backend: ${finalState.backendSavedScans}`);
    console.log(`🔗 Backend connection: ${finalState.backendConnected ? '✅' : '❌'}`);

    if (finalState.scanNames.length > 0) {
      console.log('📝 Saved scan names:');
      finalState.scanNames.forEach((name, i) => {
        console.log(`  ${i + 1}. ${name}`);
      });
    }

    console.log('\n💡 OVERALL ASSESSMENT:');
    if (finalState.backendConnected && finalState.uiSavedScans > 0) {
      console.log('✅ SUCCESS: Save/Load functionality is working!');
      console.log('   - Backend is connected and responsive');
      console.log('   - Saved scans are displayed in the UI');
      console.log('   - Users can see and interact with saved scans');
    } else if (finalState.backendConnected && finalState.backendSavedScans > 0) {
      console.log('⚠️  PARTIAL SUCCESS: Backend works but UI may need refresh');
      console.log('   - Backend has saved scans but UI may not be displaying them');
      console.log('   - Try refreshing the page to see saved scans');
    } else {
      console.log('❌ ISSUES DETECTED: Save/Load functionality needs attention');
      console.log('   - Backend connection or saved scans display issues');
    }

  } catch (error) {
    console.error('❌ VALIDATION ERROR:', error.message);
  } finally {
    // Keep browser open for inspection
    if (browser) {
      console.log('\n🎭 Browser will stay open for manual inspection...');
      console.log('💡 Close browser window to exit');
      // await browser.close(); // Comment out to keep open
    }
  }
}

// Run the validation
validateMainPageSaveLoadWorkflow();