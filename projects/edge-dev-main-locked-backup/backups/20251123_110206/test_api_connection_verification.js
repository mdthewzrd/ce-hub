const { chromium } = require('playwright');

async function testApiConnectionVerification() {
  console.log('🚀 Testing API connection fix verification...');

  const browser = await chromium.launch({
    headless: false,
    devtools: false
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console logs and network requests
  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().includes('Failed to fetch')) {
      console.log('❌ API ERROR:', msg.text());
    } else if (msg.type() === 'error') {
      console.log('❌ ERROR:', msg.text());
    }
  });

  page.on('response', response => {
    if (response.url().includes('localhost:8000')) {
      console.log(`📡 API Response: ${response.status()} ${response.url()}`);
    }
  });

  page.on('request', request => {
    if (request.url().includes('localhost:8000')) {
      console.log(`📤 API Request: ${request.method()} ${request.url()}`);
    }
  });

  try {
    console.log('📱 Navigating to localhost:5657...');
    await page.goto('http://localhost:5657', { waitUntil: 'networkidle' });

    console.log('⏳ Waiting for page to fully load...');
    await page.waitForTimeout(5000);

    // Test the API connection manually
    console.log('🔍 Testing API connection manually...');

    const apiTestResult = await page.evaluate(async () => {
      try {
        // Test health endpoint
        const healthResponse = await fetch('http://localhost:8000/api/health');
        const healthData = await healthResponse.json();

        // Test scan endpoint
        const scanResponse = await fetch('http://localhost:8000/api/scan/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: 'data' })
        });
        const scanData = await scanResponse.json();

        return {
          healthCheck: {
            status: healthResponse.status,
            data: healthData
          },
          scanCheck: {
            status: scanResponse.status,
            data: scanData
          },
          success: true
        };
      } catch (error) {
        return {
          error: error.message,
          success: false
        };
      }
    });

    console.log('\\n📋 API Connection Test Results:');
    if (apiTestResult.success) {
      console.log('✅ Health Check:', apiTestResult.healthCheck.status, apiTestResult.healthCheck.data.status);
      console.log('✅ Scan Check:', apiTestResult.scanCheck.status, apiTestResult.scanCheck.data.status);
      console.log('\\n🎯 SUCCESS! API connection fix is working properly');
    } else {
      console.log('❌ API Test Failed:', apiTestResult.error);
    }

    // Check for Renata component
    console.log('\\n🔍 Checking if Renata component is present...');
    const renataCheck = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      return {
        hasRenataText: bodyText.includes('Renata AI'),
        hasFixedPosition: Array.from(document.querySelectorAll('div')).some(div =>
          div.style.position === 'fixed' && div.textContent && div.textContent.includes('Renata')
        )
      };
    });

    if (renataCheck.hasRenataText) {
      console.log('✅ Renata AI component found in page content');
    } else {
      console.log('⚠️ Renata AI component not found in page content');
    }

    if (renataCheck.hasFixedPosition) {
      console.log('✅ Renata component has fixed positioning');
    } else {
      console.log('⚠️ Renata component may not have proper positioning');
    }

    // Take screenshot
    console.log('\\n📸 Taking verification screenshot...');
    await page.screenshot({
      path: '/Users/michaeldurante/ai dev/ce-hub/edge-dev/api_connection_verification.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: api_connection_verification.png');

    console.log('\\n✅ API connection verification completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\\n🔄 Closing browser...');
    await browser.close();
  }
}

testApiConnectionVerification().catch(console.error);