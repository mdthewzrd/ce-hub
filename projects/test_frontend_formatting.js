const { chromium } = require('playwright');

async function testFrontendFormatting() {
  console.log('🚀 Starting Frontend Formatting Test...');

  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();

  // Enable console logging from the page
  page.on('console', msg => {
    console.log('🌐 Browser Console:', msg.type(), msg.text());
  });

  // Enable network request logging
  page.on('request', request => {
    const url = request.url();
    if (url.includes('format') || url.includes('scan') || url.includes('renata')) {
      console.log('📤 Network Request:', request.method(), url);
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('format') || url.includes('scan') || url.includes('renata')) {
      console.log('📥 Network Response:', response.status(), url);
    }
  });

  try {
    console.log('📍 Navigating to frontend...');
    await page.goto('http://localhost:5657', { waitUntil: 'networkidle' });

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Take a screenshot
    await page.screenshot({ path: 'test-frontend-01-initial-load.png', fullPage: true });
    console.log('📸 Screenshot taken: test-frontend-01-initial-load.png');

    // Look for code upload or scan input areas
    console.log('🔍 Looking for code upload/scan functionality...');

    // Try to find file upload input or text area for code
    const uploadSelectors = [
      'input[type="file"]',
      'textarea[placeholder*="code"]',
      'textarea[placeholder*="scanner"]',
      'div[contenteditable="true"]',
      '.code-input',
      '.scanner-input'
    ];

    let inputElement = null;
    for (const selector of uploadSelectors) {
      try {
        inputElement = await page.$(selector);
        if (inputElement) {
          console.log(`✅ Found input element: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!inputElement) {
      // Look for any button that might trigger code input
      const buttons = await page.$$('button');
      console.log(`🔍 Found ${buttons.length} buttons on the page`);

      for (let i = 0; i < buttons.length; i++) {
        const text = await buttons[i].textContent();
        if (text && (text.toLowerCase().includes('upload') ||
                     text.toLowerCase().includes('format') ||
                     text.toLowerCase().includes('scan') ||
                     text.toLowerCase().includes('code'))) {
          console.log(`✅ Found relevant button: "${text}"`);
          inputElement = buttons[i];
          break;
        }
      }
    }

    if (inputElement) {
      console.log('✅ Found input element, testing code submission...');

      // Create test scanner code
      const testCode = `
def test_scanner():
    # Test scanner code
    api_key = "test_key"
    gap_threshold = 0.75
    volume_min = 1000000

    print("Scanner executed successfully")
    return {"results": []}

if __name__ == "__main__":
    test_scanner()
`;

      // If it's a textarea, fill it directly
      if (await inputElement.getAttribute('type') !== 'file') {
        await inputElement.fill(testCode);
        await page.waitForTimeout(1000);

        // Look for submit button
        const submitButton = await page.$('button[type="submit"], button:has-text("Submit"), button:has-text("Format"), button:has-text("Execute")');

        if (submitButton) {
          console.log('🚀 Clicking submit button...');
          await submitButton.click();

          // Wait for processing
          await page.waitForTimeout(5000);

          // Take screenshot of results
          await page.screenshot({ path: 'test-frontend-02-after-submit.png', fullPage: true });
          console.log('📸 Screenshot taken: test-frontend-02-after-submit.png');
        } else {
          console.log('❌ No submit button found');
        }
      } else {
        console.log('📁 File input detected, would need file upload testing');
      }
    } else {
      console.log('❌ No code input element found');

      // Try to find any text content that mentions "Local formatting service"
      const pageText = await page.textContent('body');
      if (pageText && pageText.includes('Local formatting service')) {
        console.log('🎯 FOUND "Local formatting service" text in page!');

        // Highlight the element containing this text
        const elements = await page.$$('text=Local formatting service');
        for (const element of elements) {
          console.log('📍 Found element with Local formatting service text');
          // Take a screenshot of just this area
          await element.screenshot({ path: 'test-frontend-local-formatting-element.png' });
        }
      }
    }

    // Also check page source for any formatting-related JavaScript
    const pageContent = await page.content();
    if (pageContent.includes('Local formatting service')) {
      console.log('🎯 FOUND "Local formatting service" in page source!');
    }

    console.log('✅ Frontend test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testFrontendFormatting().catch(console.error);