const { chromium } = require('playwright');

async function testFrontendInterface() {
  console.log('🚀 Starting Frontend Interface Test v2...');

  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();

  // Enable console logging from the page
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Local formatting') || text.includes('formatting service') || text.includes('Renata')) {
      console.log('🎯 KEY CONSOLE LOG:', msg.type(), text);
    }
  });

  // Enable network request logging
  page.on('request', request => {
    const url = request.url();
    if (url.includes('format') || url.includes('scan') || url.includes('renata') || url.includes('5659')) {
      console.log('📤 Network Request:', request.method(), url);
      if (request.postData()) {
        console.log('📤 Request body:', request.postData());
      }
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('format') || url.includes('scan') || url.includes('renata') || url.includes('5659')) {
      console.log('📥 Network Response:', response.status(), url);
      response.text().then(body => {
        console.log('📥 Response body:', body.substring(0, 200));
      }).catch(() => {});
    }
  });

  try {
    console.log('📍 Navigating to frontend...');
    await page.goto('http://localhost:5657', { waitUntil: 'networkidle' });

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Look for the "Run Scan" button and click it
    console.log('🔍 Looking for "Run Scan" button...');
    const runScanButton = await page.locator('button:has-text("Run Scan")').first();

    if (await runScanButton.isVisible()) {
      console.log('✅ Found "Run Scan" button, clicking it...');
      await runScanButton.click();
      await page.waitForTimeout(2000);

      // Look for any input areas that appear
      console.log('🔍 Looking for code input areas after clicking Run Scan...');

      // Wait for potential modal or input to appear
      await page.waitForTimeout(3000);

      // Try to find any textarea or contenteditable
      const textareas = await page.$$('textarea');
      const contentEditables = await page.$$('[contenteditable="true"]');

      console.log(`📝 Found ${textareas.length} textareas and ${contentEditables.length} contenteditable elements`);

      let inputElement = null;

      // Check textareas first
      for (const textarea of textareas) {
        const isVisible = await textarea.isVisible();
        if (isVisible) {
          console.log('✅ Found visible textarea');
          inputElement = textarea;
          break;
        }
      }

      // If no textarea, check contenteditables
      if (!inputElement) {
        for (const contentEditable of contentEditables) {
          const isVisible = await contentEditable.isVisible();
          if (isVisible) {
            console.log('✅ Found visible contenteditable');
            inputElement = contentEditable;
            break;
          }
        }
      }

      if (inputElement) {
        console.log('✅ Found input element, entering test code...');

        // Create test scanner code that should trigger formatting
        const testCode = `def backside_b_scanner():
    # Backside B Scanner Test
    import requests
    import pandas as pd

    api_key = "your_api_key_here"
    gap_threshold = 0.75
    volume_multiplier = 1.5

    def scan_symbol(symbol):
        print(f"Scanning {symbol}...")
        # This should trigger the formatting service
        return {"gap": gap_threshold, "volume": volume_multiplier}

    return scan_symbol("AAPL")`;

        await inputElement.fill(testCode);
        await page.waitForTimeout(2000);

        // Look for submit or execute button
        const submitSelectors = [
          'button:has-text("Submit")',
          'button:has-text("Execute")',
          'button:has-text("Format")',
          'button:has-text("Run")',
          'button[type="submit"]',
          '.submit-button',
          '.execute-button'
        ];

        let submitButton = null;
        for (const selector of submitSelectors) {
          try {
            submitButton = await page.$(selector);
            if (submitButton && await submitButton.isVisible()) {
              console.log(`✅ Found submit button: ${selector}`);
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }

        if (submitButton) {
          console.log('🚀 Clicking submit button to trigger formatting...');
          await submitButton.click();

          // Wait for processing - this is where the "Local formatting service" message should appear
          console.log('⏳ Waiting for formatting process...');
          await page.waitForTimeout(10000);

          // Take screenshot of any results
          await page.screenshot({ path: 'test-frontend-03-formatting-results.png', fullPage: true });
          console.log('📸 Screenshot taken: test-frontend-03-formatting-results.png');

          // Check page content for the specific message
          const pageText = await page.textContent('body');
          if (pageText && pageText.includes('Local formatting service')) {
            console.log('🎯 FOUND "Local formatting service" message in page!');

            // Try to find the exact element containing this text
            const elements = await page.$$('text=Local formatting service');
            for (let i = 0; i < elements.length; i++) {
              console.log(`📍 Found element ${i + 1} with Local formatting service text`);
              const parent = await elements[i].evaluateHandle(el => el.parentElement);
              console.log('Parent element text:', await parent.textContent());
            }
          }

        } else {
          console.log('❌ No submit button found after code entry');
        }

      } else {
        console.log('❌ No input element found after clicking Run Scan');
      }

    } else {
      console.log('❌ "Run Scan" button not found or not visible');
    }

    // Also try looking for any file upload areas
    console.log('🔍 Looking for file upload functionality...');
    const fileInputs = await page.$$('input[type="file"]');
    console.log(`📁 Found ${fileInputs.length} file inputs`);

    if (fileInputs.length > 0) {
      console.log('✅ Found file upload capability');
    }

    // Check for any text containing "Local formatting service" in the entire page source
    const pageContent = await page.content();
    if (pageContent.includes('Local formatting service')) {
      console.log('🎯 FOUND "Local formatting service" in page HTML source!');
    }

    // Look for any JavaScript files that might contain this message
    const scripts = await page.$$('script[src]');
    for (const script of scripts) {
      const src = await script.getAttribute('src');
      if (src && (src.includes('format') || src.includes('scanner'))) {
        console.log('📜 Found relevant script:', src);
      }
    }

    console.log('✅ Frontend interface test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Don't close browser immediately so we can inspect
    console.log('🌐 Keeping browser open for inspection. Press Ctrl+C to exit...');
    await new Promise(() => {}); // Keep running indefinitely
  }
}

testFrontendInterface().catch(console.error);