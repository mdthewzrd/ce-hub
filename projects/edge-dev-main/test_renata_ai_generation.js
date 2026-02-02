#!/usr/bin/env node

/**
 * Test Renata AI Code Generation
 * Verify AI can create unique, properly standardized code
 */

const { chromium } = require('playwright');

async function testRenataAICodeGeneration() {
  console.log('🧪 Testing Renata AI Code Generation\n');
  console.log('='.repeat(70));

  let browser;
  let page;

  try {
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();

    // Navigate to scan page
    console.log('📍 Navigating to http://localhost:5665/scan');
    await page.goto('http://localhost:5665/scan', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Find and click Renata button
    console.log('\n🔍 Looking for Renata button...');

    const renataButtonSelectors = [
      '[data-testid="renata-chat-open-button"]',  // PRIMARY: Most specific selector
      '[data-renata="true"]',                       // FALLBACK 1: Custom data attribute
      'button:has-text("Renata"):has-text("AI Assistant")',  // FALLBACK 2: Specific text combo
      'button:has-text("Renata")'  // FALLBACK 3: Generic (may match other yellow buttons)
    ];

    let renataButton = null;
    for (const selector of renataButtonSelectors) {
      try {
        renataButton = await page.$(selector);
        if (renataButton) {
          const isVisible = await renataButton.isVisible();
          if (isVisible) {
            console.log(`✅ Found Renata button with selector: ${selector}`);
            break;
          }
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!renataButton) {
      console.log('❌ Renata button not found');
      return false;
    }

    console.log('✅ Found Renata button - clicking to open chat...');
    await renataButton.click();
    await page.waitForTimeout(2000);

    // Take screenshot of initial chat state
    await page.screenshot({ path: 'renata_chat_initial.png' });
    console.log('📸 Screenshot saved: renata_chat_initial.png');

    // Find the message input field
    console.log('\n📝 Looking for message input field...');

    const inputSelectors = [
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="Renata"]',
      'textarea[placeholder*="Ask"]',
      'textarea',
      'input[type="text"]'
    ];

    let inputField = null;
    for (const selector of inputSelectors) {
      try {
        inputField = await page.$(selector);
        if (inputField) {
          const isVisible = await inputField.isVisible();
          if (isVisible) {
            console.log(`✅ Found input field: ${selector}`);
            break;
          }
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!inputField) {
      console.log('❌ Could not find message input field');
      return false;
    }

    // Type the test prompt
    const testPrompt = `Create a Frontside A+ Gap Scanner that is DIFFERENT from Backside B.

Requirements:
1. Use class-based structure like Backside B
2. Connect to Polygon API for market data
3. Implement FRONTSIDE A+ pattern logic (opposite of backside):
   - Look for stocks gapping DOWN on high volume (not up)
   - Then showing strength the next day (bullish reversal)
   - D1 red candle, D2 green candle reversal
4. Use these parameters (different from Backside B):
   - price_min: 5.0 (lower than Backside B's 8.0)
   - gap_down_min: -3.0% (minimum gap down)
   - d1_volume_min: 10_000_000 (volume requirement)
   - d2_green_min: 1.0% (minimum green candle)
   - rsi_max: 40.0 (oversold condition)
5. Generate UNIQUE code - do not copy Backside B
6. Follow proper Python standardization

Make it production-ready with proper error handling.`;

    console.log('\n📝 Sending test prompt to Renata AI...');
    console.log('Prompt:', testPrompt.substring(0, 100) + '...');

    await inputField.fill(testPrompt);
    await page.waitForTimeout(1000);

    // Find and click send button
    console.log('\n📤 Looking for send button...');
    const sendButtonSelectors = [
      'button:has-text("Send")',
      'button:has([data-lucide="send"])',
      'button[type="submit"]',
      'button:has(svg)'
    ];

    let sendButton = null;
    for (const selector of sendButtonSelectors) {
      try {
        const buttons = await page.$$(selector);
        for (const button of buttons) {
          const isVisible = await button.isVisible();
          const text = await button.textContent();
          if (isVisible && (text?.includes('Send') || !text || text === '')) {
            sendButton = button;
            console.log(`✅ Found send button: ${selector}`);
            break;
          }
        }
        if (sendButton) break;
      } catch (e) {
        // Try next selector
      }
    }

    if (sendButton) {
      await sendButton.click();
      console.log('✅ Message sent to Renata AI');
    } else {
      // Try pressing Enter as fallback
      console.log('⚠️  Send button not found, trying Enter key...');
      await inputField.press('Enter');
    }

    // Wait for AI response
    console.log('\n⏳ Waiting for Renata AI to generate code (this may take 30-60 seconds)...');
    await page.waitForTimeout(60000); // Wait 60 seconds for AI to generate

    // Take screenshot of response
    await page.screenshot({ path: 'renata_ai_response.png', fullPage: true });
    console.log('📸 Screenshot saved: renata_ai_response.png');

    // Check for code in response
    console.log('\n🔍 Analyzing Renata AI response...');

    const pageContent = await page.content();

    const hasCode = pageContent.includes('class ') && pageContent.includes('def ');
    const hasFrontside = pageContent.toLowerCase().includes('frontside');
    const hasGapDown = pageContent.toLowerCase().includes('gap down') || pageContent.toLowerCase().includes('gap_down');
    const hasPolygon = pageContent.includes('polygon.io') || pageContent.includes('Polygon');
    const hasParameters = pageContent.includes('price_min') || pageContent.includes('gap_down_min');

    console.log('\n' + '='.repeat(70));
    console.log('📊 Code Generation Analysis');
    console.log('='.repeat(70));
    console.log(`Has Python class structure: ${hasCode ? '✅ YES' : '❌ NO'}`);
    console.log(`Frontside A+ logic: ${hasFrontside ? '✅ YES' : '❌ NO'}`);
    console.log(`Gap down pattern: ${hasGapDown ? '✅ YES' : '❌ NO'}`);
    console.log(`Polygon API: ${hasPolygon ? '✅ YES' : '❌ NO'}`);
    console.log(`Custom parameters: ${hasParameters ? '✅ YES' : '❌ NO'}`);

    // Check if it's different from Backside B
    const notBackside = !pageContent.toLowerCase().includes('backside');
    const notBacksideB = !pageContent.toLowerCase().includes('backside b');
    const hasDifferentLogic = pageContent.includes('gap down') || pageContent.includes('reversal');

    console.log(`\nDifferent from Backside B: ${notBackside && notBacksideB ? '✅ YES' : '❌ NO'}`);
    console.log(`Has unique logic: ${hasDifferentLogic ? '✅ YES' : '❌ NO'}`);

    // Keep browser open for manual inspection
    console.log('\n' + '='.repeat(70));
    console.log('🔍 Keeping browser open for 20 seconds for manual verification');
    console.log('='.repeat(70));
    console.log('\nPlease review the generated code:');
    console.log('1. Is it a proper Python class?');
    console.log('2. Does it implement Frontside A+ (not Backside B)?');
    console.log('3. Are the parameters different?');
    console.log('4. Is the code properly standardized?');
    console.log('5. Would it actually run?');

    await page.waitForTimeout(20000);

    // Final verdict
    console.log('\n' + '='.repeat(70));
    console.log('🎯 Test Complete');
    console.log('='.repeat(70));

    const allChecks = [hasCode, hasFrontside, hasGapDown, hasPolygon, hasParameters, notBackside, hasDifferentLogic];
    const passedChecks = allChecks.filter(check => check).length;

    if (passedChecks >= 5) {
      console.log(`\n🎉 SUCCESS! Renata AI generated proper code (${passedChecks}/7 checks passed)`);
      console.log('\n✅ Renata AI is working correctly and generating unique code!');
      return true;
    } else {
      console.log(`\n⚠️  PARTIAL SUCCESS: ${passedChecks}/7 checks passed`);
      console.log('\nRenata AI may need some adjustments.');
      return false;
    }

  } catch (error) {
    console.error('\n❌ Test error:', error.message);

    if (page) {
      await page.screenshot({ path: 'renata_test_error.png' });
      console.log('📸 Error screenshot saved: renata_test_error.png');
    }

    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run test
testRenataAICodeGeneration().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
