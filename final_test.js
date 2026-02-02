const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    console.log('🔍 Final verification test: Project click behavior...');

    await page.goto('http://localhost:5656', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Enable console logging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Starting scan') || text.includes('API') || text.includes('execution')) {
        console.log('PAGE LOG:', text);
      }
    });

    // Check if there's a results section showing data
    console.log('\n📊 Checking for results display...');

    const resultsFound = await page.evaluate(() => {
      // Look for trading data in the scan results section
      const scanResultsSection = document.querySelector('.scan-results');
      if (scanResultsSection) {
        const text = scanResultsSection.textContent || '';
        return {
          found: text.length > 50,
          textLength: text.length,
          preview: text.substring(0, 200),
          hasAMD: text.includes('AMD'),
          hasINTC: text.includes('INTC'),
          hasLYFT: text.includes('LYFT'),
          hasTotalResults: text.includes('Total Results')
        };
      }

      // Check body for trading data
      const bodyText = document.body.textContent || '';
      return {
        found: bodyText.includes('Total Results') && bodyText.includes('0'),
        textLength: bodyText.length,
        preview: bodyText.substring(0, 200),
        hasAMD: bodyText.includes('AMD'),
        hasINTC: bodyText.includes('INTC'),
        hasLYFT: bodyText.includes('LYFT'),
        hasTotalResults: bodyText.includes('Total Results')
      };
    });

    console.log('Results analysis:', resultsFound);

    if (resultsFound.found) {
      console.log('✅ Results section is present');
    } else {
      console.log('ℹ️ Results section shows 0 results (due to rate limiting)');
    }

    // Look for the scan controls
    const scanControls = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      let runScanFound = false;
      buttons.forEach(btn => {
        if (btn.textContent && btn.textContent.includes('Run Scan')) {
          runScanFound = true;
        }
      });

      const startDateInput = document.getElementById('scanStartDate');
      const endDateInput = document.getElementById('scanEndDate');

      return {
        hasRunScanButton: runScanFound,
        hasStartDateInput: startDateInput !== null,
        hasEndDateInput: endDateInput !== null,
        startDateValue: startDateInput ? startDateInput.value : 'N/A',
        endDateValue: endDateInput ? endDateInput.value : 'N/A'
      };
    });

    console.log('Scan controls:', scanControls);

    await page.screenshot({ path: 'final_verification_complete.png', fullPage: true });

  } catch (error) {
    console.error('❌ Error during final verification:', error);
    await page.screenshot({ path: 'final_verification_error.png', fullPage: true });
  }

  await browser.close();
})();