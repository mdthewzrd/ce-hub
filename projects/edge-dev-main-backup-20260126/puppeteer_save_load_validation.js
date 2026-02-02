const puppeteer = require('puppeteer');
const path = require('path');

async function validateSaveLoadFunctionality() {
  console.log('🎭 PUPPETEER VALIDATION: Save/Load Scan Functionality');
  console.log('======================================================');

  let browser;
  let page;

  try {
    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: false, // Set to false for debugging
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

    // Navigate to the execution page
    console.log('🌐 Navigating to execution page...');
    await page.goto('http://localhost:5656/exec', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for the page to load
    await page.waitForSelector('[data-testid="systematic-trading"], .bg-black, h1', { timeout: 10000 });
    console.log('✅ Page loaded successfully');

    // Check if backend is running
    console.log('🔍 Checking backend connectivity...');
    try {
      const backendResponse = await page.evaluate(async () => {
        try {
          const response = await fetch('http://localhost:8000/api/scans/user/test_user_123');
          const data = await response.json();
          return { success: response.ok, data };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      if (backendResponse.success) {
        console.log('✅ Backend is connected and responsive');
        console.log('📊 Existing saved scans:', backendResponse.data.scans?.length || 0);
      } else {
        console.log('❌ Backend connection failed:', backendResponse.error);
        return;
      }
    } catch (error) {
      console.log('❌ Backend check failed:', error.message);
      return;
    }

    // Look for scan results table
    console.log('🔍 Looking for scan results table...');
    try {
      await page.waitForSelector('table, tbody, tr', { timeout: 5000 });
      console.log('✅ Found table elements on page');
    } catch (error) {
      console.log('⚠️  No table found - may need to run a scan first');
    }

    // Check for existing saved scans in the UI
    console.log('🔍 Checking for existing saved scans in UI...');
    const savedScanRows = await page.evaluate(() => {
      const rows = document.querySelectorAll('tr');
      const savedRows = [];
      rows.forEach((row, index) => {
        const text = row.textContent || '';
        if (text.includes('Saved Scan') || text.includes('📁')) {
          savedRows.push({
            index,
            text: text.substring(0, 100) + '...'
          });
        }
      });
      return savedRows;
    });

    console.log('📊 Saved scan rows found in UI:', savedScanRows.length);
    savedScanRows.forEach((row, i) => {
      console.log(`  ${i + 1}. [Row ${row.index}] ${row.text}`);
    });

    // Look for Save Scan button
    console.log('🔍 Looking for Save Scan button...');
    const saveButtonFound = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [role="button"]');
      for (let button of buttons) {
        const text = button.textContent || '';
        if (text.toLowerCase().includes('save') && text.toLowerCase().includes('scan')) {
          return true;
        }
      }
      return false;
    });

    console.log('🔘 Save Scan button found:', saveButtonFound);

    // If no scan results exist, we need to run a scan first
    if (!saveButtonFound) {
      console.log('⚠️  No Save Scan button found - may need to run a scan first');

      // Look for run scan button
      const runScanButton = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, [role="button"]');
        for (let button of buttons) {
          const text = button.textContent || '';
          if (text.toLowerCase().includes('run') && text.toLowerCase().includes('scan')) {
            return button.textContent;
          }
        }
        return null;
      });

      if (runScanButton) {
        console.log('🔘 Found Run Scan button:', runScanButton);
        console.log('💡 Recommendation: Run a scan first to enable save functionality');
      } else {
        console.log('❌ No Run Scan button found either');
      }
    }

    // Test save functionality if button exists
    if (saveButtonFound) {
      console.log('🧪 Testing Save Scan functionality...');

      // Request notification permission
      await page.evaluate(async () => {
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      });

      // Click save scan button
      const saveClicked = await page.evaluate(() => {
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

      if (saveClicked) {
        console.log('✅ Save Scan button clicked');

        // Wait for potential dialog
        await page.waitForTimeout(1000);

        // Look for modal/dialog
        const modalFound = await page.evaluate(() => {
          const modals = document.querySelectorAll('[role="dialog"], .modal, .popup');
          const inputs = document.querySelectorAll('input[type="text"]');
          return {
            modals: modals.length,
            inputs: inputs.length
          };
        });

        console.log('📋 Modal elements found:', modalFound);

        if (modalFound.inputs > 0) {
          // Fill in scan name
          await page.type('input[type="text"]', 'Puppeteer Test Scan');

          // Look for confirm button
          const confirmClicked = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button, [role="button"]');
            for (let button of buttons) {
              const text = button.textContent || '';
              if (text.toLowerCase().includes('save') || text.toLowerCase().includes('confirm') || text.toLowerCase().includes('submit')) {
                button.click();
                return true;
              }
            }
            return false;
          });

          if (confirmClicked) {
            console.log('✅ Save confirmation clicked');

            // Wait for save operation
            await page.waitForTimeout(2000);

            // Check for notification
            const notificationReceived = await page.evaluate(() => {
              // Check if notification was sent (console logs)
              return window.lastNotification || false;
            });

            console.log('🔔 Notification received:', notificationReceived);
          }
        }
      }
    }

    // Test reload functionality
    console.log('🔄 Testing page reload functionality...');

    // Get current state
    const beforeReload = await page.evaluate(() => {
      const rows = document.querySelectorAll('tr');
      const savedRows = [];
      rows.forEach((row, index) => {
        const text = row.textContent || '';
        if (text.includes('Saved Scan') || text.includes('📁')) {
          savedRows.push(index);
        }
      });
      return {
        totalRows: rows.length,
        savedRows: savedRows.length
      };
    });

    console.log('📊 Before reload - Total rows:', beforeReload.totalRows, 'Saved rows:', beforeReload.savedRows);

    // Reload page
    await page.reload({ waitUntil: 'networkidle2' });
    console.log('🔄 Page reloaded');

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Check state after reload
    const afterReload = await page.evaluate(() => {
      const rows = document.querySelectorAll('tr');
      const savedRows = [];
      rows.forEach((row, index) => {
        const text = row.textContent || '';
        if (text.includes('Saved Scan') || text.includes('📁')) {
          savedRows.push(index);
        }
      });
      return {
        totalRows: rows.length,
        savedRows: savedRows.length
      };
    });

    console.log('📊 After reload - Total rows:', afterReload.totalRows, 'Saved rows:', afterReload.savedRows);

    // Final backend verification
    console.log('🔍 Final backend verification...');
    const finalBackendCheck = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:8000/api/scans/user/test_user_123');
        const data = await response.json();
        return {
          success: response.ok,
          totalScans: data.scans?.length || 0,
          scanNames: data.scans?.map(s => s.scan_name) || []
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    if (finalBackendCheck.success) {
      console.log('✅ Final backend check successful');
      console.log('📊 Total saved scans in backend:', finalBackendCheck.totalScans);
      finalBackendCheck.scanNames.forEach((name, i) => {
        console.log(`  ${i + 1}. ${name}`);
      });
    }

    // Summary
    console.log('\n📋 VALIDATION SUMMARY');
    console.log('====================');
    console.log('🔍 Save Scan button found:', saveButtonFound);
    console.log('📊 Saved scans in UI (before):', beforeReload.savedRows);
    console.log('📊 Saved scans in UI (after):', afterReload.savedRows);
    console.log('📊 Saved scans in backend:', finalBackendCheck.totalScans);
    console.log('🔄 Page reload needed:', afterReload.savedRows > beforeReload.savedRows ? 'YES' : 'NO');

    console.log('\n💡 RECOMMENDATIONS:');
    if (finalBackendCheck.totalScans > 0 && afterReload.savedRows === 0) {
      console.log('⚠️  Backend has saved scans but frontend is not loading them');
      console.log('   - Check console for JavaScript errors');
      console.log('   - Verify API calls are being made on page load');
      console.log('   - Check useEffect hooks in SystematicTrading component');
    } else if (afterReload.savedRows > beforeReload.savedRows) {
      console.log('✅ Page reload IS required to see newly saved scans');
    } else if (saveButtonFound && finalBackendCheck.success) {
      console.log('✅ Save/Load functionality appears to be working');
    } else {
      console.log('⚠️  May need to run a scan first to enable save functionality');
    }

  } catch (error) {
    console.error('❌ VALIDATION ERROR:', error.message);
  } finally {
    // Keep browser open for inspection
    if (browser) {
      console.log('\n🎭 Keeping browser open for inspection...');
      console.log('💡 Close browser window to exit');
      // await browser.close(); // Comment out to keep open
    }
  }
}

// Run the validation
validateSaveLoadFunctionality();