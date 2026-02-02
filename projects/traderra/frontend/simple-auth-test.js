/**
 * Simple Authenticated Test
 * Tests if we can access the dashboard with authentication and run validation
 */

const { chromium } = require('playwright');

async function runSimpleAuthTest() {
  console.log('🔐 STARTING SIMPLE AUTHENTICATED TEST')
  console.log('=====================================')

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  try {
    // Go to dashboard page (should redirect to sign-in if not authenticated)
    console.log('📍 Navigating to dashboard...')
    const page = await context.newPage();
    await page.goto('http://localhost:6565/dashboard');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if we need to sign in
    const signInForm = await page.$('form[data-testid="sign-in-form"]');
    if (signInForm) {
      console.log('🔐 Sign-in required - you need to sign in first')
      console.log('❌ Cannot proceed with automated test - manual sign-in required')

      // Keep browser open for manual sign-in
      console.log('🔄 Browser staying open for manual sign-in...')
      console.log('   1. Sign in to your account')
      console.log('   2. Then run the validation tests manually:')
      console.log('      - Paste simple-visual-test.js in console')
      console.log('      - Run: runVisualVerificationTest()')

      // Wait for user to sign in manually
      await page.waitForTimeout(30000); // Wait 30 seconds for manual sign-in

      // Check if signed in after wait
      const chatInput = await page.$('[data-testid="renata-chat-input"]');
      if (chatInput) {
        console.log('✅ Successfully signed in! Chat component found.');

        // Now run the visual test
        console.log('🧪 Running visual verification test...');
        const visualTestCode = require('fs').readFileSync('./simple-visual-test.js', 'utf8');
        await page.evaluate(visualTestCode);

        const results = await page.evaluate(() => {
          return window.runVisualVerificationTest();
        });

        console.log('📊 Test completed. Check browser console for results.');
      } else {
        console.log('❌ Still not signed in or chat component not found.');
      }
    } else {
      // Check if chat component exists (already authenticated)
      const chatInput = await page.$('[data-testid="renata-chat-input"]');
      if (chatInput) {
        console.log('✅ Already authenticated! Chat component found.');

        // Run visual test directly
        console.log('🧪 Running visual verification test...');
        const visualTestCode = require('fs').readFileSync('./simple-visual-test.js', 'utf8');
        await page.evaluate(visualTestCode);

        const results = await page.evaluate(() => {
          return window.runVisualVerificationTest();
        });

        console.log('📊 Test completed. Check browser console for results.');
      } else {
        console.log('❌ No sign-in form and no chat component found.');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Keep browser open for inspection
    console.log('\n⏳ Keeping browser open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

// Run the test
runSimpleAuthTest().then(() => {
  console.log('🏆 Auth test completed');
}).catch(error => {
  console.error('❌ Fatal error:', error);
});