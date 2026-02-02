const puppeteer = require('puppeteer');

async function takeScreenshotAndValidate() {
  console.log('📸 TAKING SCREENSHOT FOR BUTTON STYLING VALIDATION');
  console.log('=====================================================');

  let browser;
  let page;

  try {
    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });

    page = await browser.newPage();

    // Navigate to the main page
    console.log('🌐 Navigating to main page http://localhost:5656...');
    await page.goto('http://localhost:5656', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for page to load
    await page.waitForTimeout(5000);
    console.log('✅ Page loaded successfully');

    // Look for the Load Saved Scans button specifically
    console.log('🔍 Looking for Load Saved Scans button...');

    const buttonInfo = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const loadButton = buttons.find(btn =>
        btn.textContent && btn.textContent.includes('Load Saved Scans')
      );

      if (loadButton) {
        const styles = window.getComputedStyle(loadButton);
        const rect = loadButton.getBoundingClientRect();

        return {
          found: true,
          text: loadButton.textContent.trim(),
          className: loadButton.className,
          borderRadius: styles.borderRadius,
          backgroundColor: styles.backgroundColor,
          marginLeft: styles.marginLeft,
          spacing: {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
          }
        };
      }

      return { found: false };
    });

    console.log('📊 Button Analysis:', JSON.stringify(buttonInfo, null, 2));

    // Take a screenshot of the header area
    console.log('📸 Taking screenshot of header area...');
    await page.screenshot({
      path: 'button_styling_validation.png',
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: 1200,
        height: 200
      }
    });

    console.log('✅ Screenshot saved as button_styling_validation.png');

    // Check if there's proper spacing between date range and button
    if (buttonInfo.found) {
      const hasProperSpacing = parseInt(buttonInfo.spacing.left) > 400; // Arbitrary threshold
      console.log(`📏 Spacing check: Button left position = ${buttonInfo.spacing.left}px`);
      console.log(`📏 Proper spacing: ${hasProperSpacing ? 'YES' : 'NO'}`);

      if (!hasProperSpacing) {
        console.log('❌ ISSUE: Button needs more spacing from date range');
      }

      if (buttonInfo.borderRadius === '0px') {
        console.log('❌ ISSUE: Button has no rounded corners');
      } else {
        console.log(`✅ Button border radius: ${buttonInfo.borderRadius}`);
      }
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    // Keep browser open for manual inspection
    if (browser) {
      console.log('\n🎭 Browser will stay open for manual inspection...');
      console.log('💡 Close browser window to exit');
    }
  }
}

// Run the validation
takeScreenshotAndValidate();