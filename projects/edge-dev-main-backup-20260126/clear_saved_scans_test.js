#!/usr/bin/env node

/**
 * Clear Saved Scans Test
 * Clears all cached saved scans from localStorage to test fresh data
 */

const puppeteer = require('puppeteer');

async function clearSavedScans() {
  console.log('🧹 CLEARING SAVED SCANS TEST');
  console.log('============================');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    console.log('\n📡 Step 1: Navigate to localhost:5657...');
    await page.goto('http://localhost:5657', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n🗑️ Step 2: Clear all saved scans from localStorage...');

    // Clear all saved scans from localStorage
    const cleared = await page.evaluate(() => {
      try {
        // Clear the saved scans
        localStorage.removeItem('traderra_saved_scans');

        // Also clear any other scan-related data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes('scan')) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));

        return {
          cleared: true,
          keysRemoved: keysToRemove.length + 1 // including traderra_saved_scans
        };
      } catch (error) {
        return { cleared: false, error: error.message };
      }
    });

    if (cleared.cleared) {
      console.log(`✅ Cleared ${cleared.keysRemoved} scan-related items from localStorage`);
    } else {
      console.log(`❌ Failed to clear: ${cleared.error}`);
    }

    console.log('\n🔄 Step 3: Refresh the page for clean state...');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n📊 Step 4: Check if saved scans are really cleared...');
    const scanCount = await page.evaluate(() => {
      try {
        const storage = localStorage.getItem('traderra_saved_scans');
        if (!storage) return 0;

        const parsed = JSON.parse(storage);
        return parsed.scans ? parsed.scans.length : 0;
      } catch (error) {
        return 0;
      }
    });

    console.log(`📋 Current saved scan count: ${scanCount}`);

    if (scanCount === 0) {
      console.log('✅ SUCCESS: All saved scans cleared!');
      console.log('\n🎯 NEXT STEPS:');
      console.log('1. Run a new scan to generate fresh results');
      console.log('2. Check if the default legend shows correct D0 date');
      console.log('3. The new results should use the fixed timezone logic');
    } else {
      console.log('⚠️  Some saved scans still remain');
    }

    console.log('\n🖥️  Browser window is open for manual verification...');
    console.log('📡 The app is running on http://localhost:5657');
    console.log('⏹️  Press Ctrl+C to close browser and finish test');

    // Keep browser open for manual testing
    await new Promise(resolve => {
      process.on('SIGINT', resolve);
    });

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

clearSavedScans().catch(console.error);