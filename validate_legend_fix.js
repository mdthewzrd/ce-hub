const puppeteer = require('puppeteer');

async function validateLegendFix() {
  console.log('🔍 Starting legend fix validation...');

  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Enable console logging from the page
    page.on('console', msg => {
      console.log('📝 Browser Console:', msg.text());
    });

    console.log('📊 Navigating to scan page...');
    await page.goto('http://localhost:5665/scan', { waitUntil: 'networkidle2' });

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Look for 12/8 test scan in localStorage and load it
    console.log('📂 Looking for 12/8 test scan...');

    const hasTestScan = await page.evaluate(() => {
      const saved = localStorage.getItem('traderra_saved_scans');
      if (saved) {
        const data = JSON.parse(saved);
        const scan = data.scans.find(s => s.name.includes('12/8'));
        if (scan) {
          console.log('✅ Found 12/8 test scan:', scan.name);
          // Trigger scan selection by dispatching custom event
          window.dispatchEvent(new CustomEvent('loadSavedScan', { detail: scan }));
          return true;
        }
      }
      return false;
    });

    if (hasTestScan) {
      console.log('⏳ Waiting for scan to load and chart to render...');
      await page.waitForTimeout(5000);

      // Check the legend display
      const legendInfo = await page.evaluate(() => {
        // Look for legend elements
        const legendElements = document.querySelectorAll('[class*="legend"], [class*="Legend"]');
        const dayNavElements = document.querySelectorAll('[class*="day"], [class*="Day"]');

        let legendText = '';
        let dayNavText = '';

        legendElements.forEach(el => {
          if (el.textContent && (el.textContent.includes('Day') || el.textContent.includes('D+') || el.textContent.includes('D0'))) {
            legendText += el.textContent.trim() + ' | ';
          }
        });

        dayNavElements.forEach(el => {
          if (el.textContent && (el.textContent.includes('Day') || el.textContent.includes('D+') || el.textContent.includes('D0'))) {
            dayNavText += el.textContent.trim() + ' | ';
          }
        });

        // Also check for any element with "D+" or "Day" text
        const allElements = document.querySelectorAll('*');
        let allDayTexts = [];
        allElements.forEach(el => {
          if (el.children.length === 0 && el.textContent) {
            const text = el.textContent.trim();
            if ((text.includes('D+') || text.includes('Day 0') || text.includes('Day +')) && text.length < 20) {
              allDayTexts.push(text);
            }
          }
        });

        return {
          legendTexts: legendText,
          dayNavTexts: dayNavText,
          allDayTexts: allDayTexts,
          uniqueTexts: [...new Set(allDayTexts)]
        };
      });

      console.log('🏷️ Legend Information:');
      console.log('  Legend texts:', legendInfo.legendTexts);
      console.log('  Day nav texts:', legendInfo.dayNavTexts);
      console.log('  All day-related texts:', legendInfo.allDayTexts);
      console.log('  Unique texts:', legendInfo.uniqueTexts);

      // Check if D+1 is still showing
      const hasDPlus1 = legendInfo.uniqueTexts.some(text => text.includes('D+') && text.includes('1'));
      const hasD0 = legendInfo.uniqueTexts.some(text => text.includes('Day 0') || text.includes('D0'));

      if (hasDPlus1) {
        console.log('❌ LEGEND ISSUE: Still showing D+1 in idle state');
        console.log('   Problematic texts:', legendInfo.uniqueTexts.filter(t => t.includes('D+') && t.includes('1')));
      } else if (hasD0) {
        console.log('✅ LEGEND FIXED: Showing Day 0 correctly');
      } else {
        console.log('⚠️ UNCLEAR: Could not determine legend state');
      }

    } else {
      console.log('❌ No 12/8 test scan found in localStorage');
    }

    // Take screenshot for verification
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'legend_validation_screenshot.png', fullPage: true });
    console.log('   Screenshot saved as: legend_validation_screenshot.png');

    await browser.close();
    console.log('✅ Validation complete');

  } catch (error) {
    console.error('❌ Validation error:', error);
  }
}

validateLegendFix();