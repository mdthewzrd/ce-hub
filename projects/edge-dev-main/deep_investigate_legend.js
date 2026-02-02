#!/usr/bin/env node

/**
 * Deep Investigation of Default Legend Issue
 * Investigates where the default legend gets its date data
 */

const puppeteer = require('puppeteer');

async function deepInvestigateLegend() {
  console.log('🔍 DEEP LEGEND INVESTIGATION');
  console.log('=============================');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Capture ALL console output
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🏷️') || text.includes('🔧') || text.includes('formatDateTime') ||
          text.includes('ChartLegend') || text.includes('legend') ||
          text.includes('BABA') || text.includes('Aug 1') || text.includes('Aug 14') || text.includes('Aug 15')) {
        console.log('🔍 CONSOLE:', msg.type(), text);
      }
    });

    console.log('\n📡 Step 1: Navigate to localhost:5657...');
    await page.goto('http://localhost:5657', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Inject debugging into the page
    await page.evaluate(() => {
      // Override formatDateTime to log calls
      if (window.formatDateTime) {
        const originalFormatDateTime = window.formatDateTime;
        window.formatDateTime = function(...args) {
          console.log('🔧 FORMAT DATETIME CALLED:', args);
          const result = originalFormatDateTime.apply(this, args);
          console.log('🔧 FORMAT DATETIME RESULT:', result);
          return result;
        };
      }

      // Monitor ChartLegend renders
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) { // Element node
                const text = node.textContent || '';
                if (text.includes('O:') || text.includes('H:') || text.includes('L:') || text.includes('C:') || text.includes('Aug')) {
                  console.log('🏷️ ChartLegend render detected:', text.substring(0, 100));
                }
              }
            });
          }
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });
    });

    console.log('\n📂 Step 2: Click Load button...');
    await page.evaluate(() => {
      const loadButton = Array.from(document.querySelectorAll('button, div[role="button"], div[class*="button"]'))
        .find(btn => btn.textContent && btn.textContent.includes('Load'));
      if (loadButton) {
        console.log('Found Load button:', loadButton.textContent);
        loadButton.click();
      } else {
        console.log('Load button not found');
      }
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n📊 Step 3: Click on a scan result...');
    await page.evaluate(() => {
      const results = Array.from(document.querySelectorAll('tr, td, div[onclick], [role="row"]'));
      const scanResult = results.find(el => {
        const text = el.textContent;
        return text && (text.includes('BABA') || text.includes('backside') || text.includes('Aug'));
      });
      if (scanResult) {
        console.log('Found scan result:', scanResult.textContent);
        scanResult.click();
      } else {
        console.log('Scan result not found');
      }
    });

    // Wait for chart to load
    await new Promise(resolve => setTimeout(resolve, 7000));

    console.log('\n🔍 Step 4: Deep analysis of chart data...');

    // Get comprehensive chart data analysis
    const analysis = await page.evaluate(() => {
      // Find all chart-related elements
      const chartElements = {
        plotlyCharts: document.querySelectorAll('.js-plotly-plot'),
        legendElements: document.querySelectorAll('[style*="rgba(0, 0, 0, 0.85)"], [style*="backdrop-blur"]'),
        dateElements: Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent?.trim();
          return text && (text.includes('Aug') && text.includes('2025'));
        }),
        dataElements: Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent?.trim();
          return text && (text.includes('O:') || text.includes('H:') || text.includes('L:') || text.includes('C:'));
        })
      };

      // Get localStorage data
      const localStorageData = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('scan') || key.includes('chart') || key.includes('traderra'))) {
          localStorageData[key] = localStorage.getItem(key);
        }
      }

      // Check if there are any hidden data sources
      const scripts = Array.from(document.querySelectorAll('script')).map(script => ({
        src: script.src,
        content: script.textContent?.substring(0, 500) || ''
      }));

      return {
        chartElements: {
          plotlyCharts: chartElements.plotlyCharts.length,
          legendElements: chartElements.legendElements.length,
          dateElements: chartElements.dateElements.map(el => ({
            text: el.textContent?.trim(),
            tag: el.tagName,
            class: el.className
          })),
          dataElements: chartElements.dataElements.map(el => ({
            text: el.textContent?.trim(),
            tag: el.tagName
          }))
        },
        localStorageData,
        scripts: scripts.filter(s => s.content.includes('Aug') || s.content.includes('formatDateTime'))
      };
    });

    console.log('\n📊 ANALYSIS RESULTS:');
    console.log('===================');

    console.log(`📈 Plotly charts found: ${analysis.chartElements.plotlyCharts}`);
    console.log(`🏷️ Legend elements found: ${analysis.chartElements.legendElements}`);

    if (analysis.chartElements.dateElements.length > 0) {
      console.log('\n📅 Date elements found:');
      analysis.chartElements.dateElements.forEach((el, index) => {
        console.log(`  ${index + 1}. ${el.text} (${el.tag}.${el.class})`);
      });
    }

    if (analysis.chartElements.dataElements.length > 0) {
      console.log('\n📊 Data elements found:');
      analysis.chartElements.dataElements.forEach((el, index) => {
        console.log(`  ${index + 1}. ${el.text} (${el.tag})`);
      });
    }

    if (Object.keys(analysis.localStorageData).length > 0) {
      console.log('\n💾 LocalStorage data found:');
      Object.keys(analysis.localStorageData).forEach(key => {
        const data = analysis.localStorageData[key];
        if (data.includes('BABA') || data.includes('Aug')) {
          console.log(`  ${key}: ${data.substring(0, 200)}...`);
        } else {
          console.log(`  ${key}: [data present]`);
        }
      });
    }

    if (analysis.scripts.length > 0) {
      console.log('\n📜 Scripts with date references:');
      analysis.scripts.forEach((script, index) => {
        console.log(`  ${index + 1}. ${script.src || 'inline'}`);
      });
    }

    console.log('\n🎯 KEY FINDINGS:');
    console.log('================');

    // Check for hardcoded dates or other issues
    const hasHardcodedDates = analysis.chartElements.dateElements.some(el =>
      el.text.includes('Aug 15, 2025')
    );

    const hasLocalStorageData = Object.keys(analysis.localStorageData).some(key => {
      const data = analysis.localStorageData[key];
      return data && (data.includes('Aug 15') || data.includes('BABA'));
    });

    console.log(`❓ Has hardcoded Aug 15 dates: ${hasHardcodedDates}`);
    console.log(`❓ Has localStorage data with Aug 15: ${hasLocalStorageData}`);

    console.log('\n🖥️  Browser window is open for manual inspection...');
    console.log('⏹️  Press Ctrl+C to close browser and finish test');

    await new Promise(resolve => {
      process.on('SIGINT', resolve);
    });

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

deepInvestigateLegend().catch(console.error);