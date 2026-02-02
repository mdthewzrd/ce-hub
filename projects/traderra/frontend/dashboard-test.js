const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    console.log('🚀 Starting Dashboard G/N Toggle Quality Test...');

    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set viewport for consistent testing
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('📍 Navigating to dashboard...');
    await page.goto('http://localhost:6565/dashboard', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for page to fully render
    await page.waitForTimeout(3000);

    console.log('🔍 Testing G/N Toggle Functionality...');

    // Test 1: Check if G/N toggle buttons exist
    const gnToggleTest = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const gnButtons = buttons.filter(btn => {
        const text = btn.textContent && btn.textContent.trim();
        return text === 'G' || text === 'N' || text === 'Gross' || text === 'Net';
      });

      return {
        found: gnButtons.length > 0,
        count: gnButtons.length,
        buttons: gnButtons.map(btn => ({
          text: btn.textContent.trim(),
          className: btn.className,
          visible: btn.offsetWidth > 0 && btn.offsetHeight > 0,
          clickable: !btn.disabled
        }))
      };
    });

    console.log('G/N Toggle Results:', gnToggleTest);

    // Test 2: Check for chart elements
    const chartTest = await page.evaluate(() => {
      return {
        equityChart: document.querySelector('[data-testid="equity-chart"]') !== null,
        dailyPnLChart: document.querySelector('[data-testid="daily-pnl-chart"]') !== null,
        symbolPerformance: document.querySelector('[data-testid="symbol-performance"]') !== null,
        bestTrades: document.querySelector('[data-testid="best-trades"]') !== null,
        rechartsWrappers: document.querySelectorAll('.recharts-wrapper').length
      };
    });

    console.log('Chart Elements Test:', chartTest);

    // Test 3: Check for $ % R toggle buttons
    const displayToggleTest = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const displayButtons = buttons.filter(btn => {
        const text = btn.textContent && btn.textContent.trim();
        return text === '$' || text === '%' || text === 'R';
      });

      return {
        found: displayButtons.length > 0,
        count: displayButtons.length,
        buttons: displayButtons.map(btn => ({
          text: btn.textContent.trim(),
          className: btn.className,
          visible: btn.offsetWidth > 0 && btn.offsetHeight > 0,
          clickable: !btn.disabled
        }))
      };
    });

    console.log('$ % R Toggle Test:', displayToggleTest);

    // Test 4: Check for profit factor display
    const profitFactorTest = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const profitFactorElements = elements.filter(el =>
        el.textContent && (
          el.textContent.includes('Profit Factor') ||
          el.textContent.includes('∞') ||
          el.textContent.includes('Infinity')
        )
      );

      return {
        found: profitFactorElements.length > 0,
        elements: profitFactorElements.map(el => ({
          text: el.textContent.trim(),
          tagName: el.tagName,
          className: el.className
        }))
      };
    });

    console.log('Profit Factor Test:', profitFactorTest);

    // Test 5: Check number formatting
    const numberFormatTest = await page.evaluate(() => {
      const numberElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent;
        return text && /\$[\d,]+\.\d{2}/.test(text);
      });

      return {
        count: numberElements.length,
        samples: numberElements.slice(0, 5).map(el => el.textContent.trim())
      };
    });

    console.log('Number Formatting Test:', numberFormatTest);

    // Test 6: Try to interact with G/N toggle if found
    if (gnToggleTest.found && gnToggleTest.buttons.length > 0) {
      console.log('🔄 Testing G/N toggle interaction...');

      // Take screenshot before toggle
      await page.screenshot({ path: 'dashboard-before-toggle.png', fullPage: true });

      // Get initial chart data
      const beforeData = await page.evaluate(() => {
        const equityChart = document.querySelector('[data-testid="equity-chart"]');
        return {
          equityChartHTML: equityChart ? equityChart.innerHTML.length : 0,
          chartCount: document.querySelectorAll('.recharts-wrapper').length
        };
      });

      // Try to click the G/N toggle
      try {
        await page.click('button:nth-of-type(1)'); // Click first button that might be G/N
        await page.waitForTimeout(2000); // Wait for re-render

        // Get chart data after toggle
        const afterData = await page.evaluate(() => {
          const equityChart = document.querySelector('[data-testid="equity-chart"]');
          return {
            equityChartHTML: equityChart ? equityChart.innerHTML.length : 0,
            chartCount: document.querySelectorAll('.recharts-wrapper').length
          };
        });

        // Take screenshot after toggle
        await page.screenshot({ path: 'dashboard-after-toggle.png', fullPage: true });

        console.log('Chart Data Before Toggle:', beforeData);
        console.log('Chart Data After Toggle:', afterData);

        if (afterData.equityChartHTML !== beforeData.equityChartHTML) {
          console.log('✅ Chart data changed after toggle - G/N toggle working!');
        } else {
          console.log('⚠️ No apparent change in chart data after toggle');
        }

      } catch (error) {
        console.log('❌ Error clicking toggle button:', error.message);
      }
    }

    // Test 7: Try $ % R toggle
    if (displayToggleTest.found && displayToggleTest.buttons.length > 0) {
      console.log('🔄 Testing $ % R toggle interaction...');

      try {
        // Click % button if exists
        const percentButton = await page.$('button:contains("%")');
        if (percentButton) {
          await percentButton.click();
          await page.waitForTimeout(1000);
          console.log('✅ Clicked % button');
        }

        // Click R button if exists
        const rButton = await page.$('button:contains("R")');
        if (rButton) {
          await rButton.click();
          await page.waitForTimeout(1000);
          console.log('✅ Clicked R button');
        }

      } catch (error) {
        console.log('❌ Error testing display toggles:', error.message);
      }
    }

    // Final screenshot
    await page.screenshot({ path: 'dashboard-final.png', fullPage: true });

    console.log('\n📊 Quality Assurance Test Summary:');
    console.log(`${gnToggleTest.found ? '✅' : '❌'} G/N Toggle Found: ${gnToggleTest.count} buttons`);
    console.log(`${chartTest.equityChart ? '✅' : '❌'} Equity Chart Present`);
    console.log(`${chartTest.dailyPnLChart ? '✅' : '❌'} Daily P&L Chart Present`);
    console.log(`${chartTest.symbolPerformance ? '✅' : '❌'} Symbol Performance Chart Present`);
    console.log(`${chartTest.bestTrades ? '✅' : '❌'} Best Trades Chart Present`);
    console.log(`${displayToggleTest.found ? '✅' : '❌'} $ % R Toggles Found: ${displayToggleTest.count} buttons`);
    console.log(`${profitFactorTest.found ? '✅' : '❌'} Profit Factor Display Found`);
    console.log(`${numberFormatTest.count > 0 ? '✅' : '❌'} Number Formatting Found: ${numberFormatTest.count} elements`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
    console.log('🎯 Quality Assurance Test Complete!');
  }
})();