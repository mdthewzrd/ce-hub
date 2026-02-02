const { chromium } = require('playwright');

async function testWithCodeUpload() {
  console.log('🚀 Starting Test With Code Upload...');

  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();

  // Enable console logging from the page
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Renata') || text.includes('formatting') || text.includes('scan') || text.includes('error')) {
      console.log('🎯 CONSOLE:', msg.type(), text);
    }
  });

  // Enable network request logging
  page.on('request', request => {
    const url = request.url();
    if (url.includes('format') || url.includes('scan') || url.includes('renata') || url.includes('5659')) {
      console.log('📤 REQUEST:', request.method(), url);
      if (request.postData()) {
        console.log('📤 Body:', request.postData().substring(0, 300));
      }
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('format') || url.includes('scan') || url.includes('renata') || url.includes('5659')) {
      console.log('📥 RESPONSE:', response.status(), url);
      response.text().then(body => {
        console.log('📥 Body:', body.substring(0, 300));
      }).catch(() => {});
    }
  });

  try {
    console.log('📍 Navigating to frontend...');
    await page.goto('http://localhost:5657', { waitUntil: 'networkidle' });

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Look for ways to input code
    console.log('🔍 Looking for code input methods...');

    // First, look for the code input area
    const codeInputSelectors = [
      'textarea[placeholder*="code"]',
      'textarea[placeholder*="python"]',
      'textarea[placeholder*="scanner"]',
      'textarea',
      '[contenteditable="true"]'
    ];

    let codeInput = null;
    for (const selector of codeInputSelectors) {
      try {
        codeInput = await page.$(selector);
        if (codeInput && await codeInput.isVisible()) {
          console.log(`✅ Found code input: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (codeInput) {
      console.log('✅ Found code input, entering test code...');

      // Create comprehensive test code that should trigger Renata API
      const testScannerCode = `import requests
import pandas as pd
from datetime import datetime

def backside_gap_scanner():
    """
    Backside Gap Scanner - Test Code for Renata API
    """
    # Configuration
    api_key = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
    gap_threshold = 0.75
    volume_multiplier = 1.5
    min_market_cap = 100000000

    def scan_symbol(symbol):
        try:
            print(f"Scanning {symbol}...")
            # Simulate gap calculation
            return {
                'symbol': symbol,
                'gap_percent': gap_threshold,
                'volume_ratio': volume_multiplier,
                'market_cap': min_market_cap
            }
        except Exception as e:
            print(f"Error scanning {symbol}: {e}")
            return None

    # Test symbols
    symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA']
    results = []

    for symbol in symbols:
        result = scan_symbol(symbol)
        if result:
            results.append(result)

    print(f"Found {len(results)} trading opportunities")
    return results

if __name__ == "__main__":
    backside_gap_scanner()`;

      await codeInput.fill(testScannerCode);
      await page.waitForTimeout(2000);

      // Now click Run Scan to trigger the Renata API
      console.log('🚀 Clicking Run Scan button...');
      const runScanButton = await page.locator('button:has-text("Run Scan")').first();

      if (await runScanButton.isVisible()) {
        await runScanButton.click();
        await page.waitForTimeout(3000);

        // Wait for processing and check for results
        console.log('⏳ Waiting for Renata API processing...');

        // Monitor for specific error messages or success
        let foundError = false;
        let foundSuccess = false;

        for (let i = 0; i < 10; i++) {
          await page.waitForTimeout(2000);

          const pageText = await page.textContent('body');

          if (pageText && pageText.includes('Local formatting service processing request')) {
            console.log('🎯 FOUND THE "Local formatting service processing request" MESSAGE!');
            foundError = true;

            // Try to find the exact element containing this message
            const elements = await page.locator('text=Local formatting service processing request').all();
            console.log(`📍 Found ${elements.length} elements with this message`);

            for (let j = 0; j < elements.length; j++) {
              const element = elements[j];
              const parent = await element.evaluateHandle(el => el.parentElement);
              const parentText = await parent.textContent();
              console.log(`📍 Element ${j + 1} parent:`, parentText);
            }
            break;
          }

          if (pageText && (pageText.includes('formatting complete') || pageText.includes('execution complete'))) {
            console.log('✅ Found success message - Renata API working!');
            foundSuccess = true;
            break;
          }

          if (pageText && pageText.includes('Error') && !pageText.includes('No scanner code available')) {
            console.log('❌ Found error message:', pageText.substring(0, 200));
            foundError = true;
            break;
          }
        }

        if (!foundError && !foundSuccess) {
          console.log('⏳ Processing may still be ongoing or no clear message found');
        }

        // Take final screenshot
        await page.screenshot({ path: 'test-frontend-04-final-results.png', fullPage: true });
        console.log('📸 Final screenshot taken');

      } else {
        console.log('❌ Run Scan button not visible');
      }

    } else {
      console.log('❌ No code input area found');

      // Look for file upload option
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        console.log('✅ Found file input, but need file upload test');
      }

      // Check page source for the message
      const pageContent = await page.content();
      if (pageContent.includes('Local formatting service processing request')) {
        console.log('🎯 FOUND "Local formatting service processing request" in page source!');
      }
    }

    console.log('✅ Test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testWithCodeUpload().catch(console.error);