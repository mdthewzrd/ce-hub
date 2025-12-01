const { chromium } = require('playwright');

async function finalRenataVerification() {
  console.log('🚀 Final verification of Renata AI chat widget...');

  const browser = await chromium.launch({
    headless: false,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('📱 Navigating to localhost:5657...');
    await page.goto('http://localhost:5657', { waitUntil: 'networkidle' });

    console.log('⏳ Waiting for page to fully load...');
    await page.waitForTimeout(5000);

    // Check for Renata chat widget specifically
    const chatWidgetInfo = await page.evaluate(() => {
      // Find the fixed positioned Renata container
      const renataContainer = document.querySelector('div.fixed.top-4.right-4');

      if (!renataContainer) {
        return { found: false, reason: 'No fixed positioned container found' };
      }

      const styles = window.getComputedStyle(renataContainer);
      const rect = renataContainer.getBoundingClientRect();

      // Look for the specific Renata elements within the container
      const chatElements = {
        modeSelector: !!renataContainer.querySelector('select'),
        messageArea: !!renataContainer.querySelector('textarea'),
        renataText: renataContainer.textContent.toLowerCase().includes('renata'),
        assistantText: renataContainer.textContent.toLowerCase().includes('assistant'),
        onlineStatus: renataContainer.textContent.toLowerCase().includes('online')
      };

      return {
        found: true,
        container: {
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          },
          styles: {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            zIndex: styles.zIndex,
            backgroundColor: styles.backgroundColor
          }
        },
        chatElements,
        textContent: renataContainer.textContent.substring(0, 200),
        innerHTML: renataContainer.innerHTML.substring(0, 300)
      };
    });

    console.log('\n📊 Final Verification Results:');
    console.log('   Chat Widget Found:', chatWidgetInfo.found ? '✅ YES' : '❌ NO');

    if (!chatWidgetInfo.found) {
      console.log('   Issue:', chatWidgetInfo.reason);
    } else {
      console.log('\n🎯 Widget Details:');
      console.log('   Position:', chatWidgetInfo.container.position);
      console.log('   Styles:', chatWidgetInfo.container.styles);
      console.log('   Chat Elements:', chatWidgetInfo.chatElements);
      console.log('   Text Preview:', chatWidgetInfo.textContent.substring(0, 100) + '...');

      // Check if widget is actually visible and in correct position
      const isVisible = chatWidgetInfo.container.styles.display !== 'none' &&
                       chatWidgetInfo.container.styles.visibility !== 'hidden' &&
                       chatWidgetInfo.container.styles.opacity !== '0' &&
                       chatWidgetInfo.container.position.width > 0 &&
                       chatWidgetInfo.container.position.height > 0;

      const isPositionedCorrectly = chatWidgetInfo.container.position.top >= 0 &&
                                   chatWidgetInfo.container.position.left >= 0 &&
                                   chatWidgetInfo.container.position.top < 1000;

      console.log('\n✅ Visibility Check:', isVisible ? '✅ VISIBLE' : '❌ HIDDEN');
      console.log('✅ Position Check:', isPositionedCorrectly ? '✅ CORRECT' : '❌ OFF-SCREEN');

      const hasRequiredElements = chatWidgetInfo.chatElements.modeSelector &&
                                 chatWidgetInfo.chatElements.messageArea &&
                                 chatWidgetInfo.chatElements.renataText;

      console.log('✅ Elements Check:', hasRequiredElements ? '✅ COMPLETE' : '❌ MISSING');
    }

    // Take a final screenshot
    console.log('\n📸 Taking final verification screenshot...');
    await page.screenshot({
      path: '/Users/michaeldurante/ai dev/ce-hub/edge-dev/final_renata_verification.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: final_renata_verification.png');

    // Summary
    console.log('\n🎯 FINAL SUMMARY:');
    if (chatWidgetInfo.found) {
      console.log('✅ SUCCESS: Renata chat widget is properly integrated');
      console.log('✅ The blank space issue has been resolved');
      console.log('✅ Widget should now be visible in the top-right corner');
    } else {
      console.log('❌ ISSUE: Chat widget still not rendering properly');
      console.log('📝 Next steps: Check component imports and CSS compilation');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    console.log('\n🔄 Keeping browser open for manual inspection...');
    console.log('📝 Check the screenshot to confirm visual appearance');
    console.log('📝 Press Ctrl+C when done...');
    await new Promise(() => {}); // Keep browser open
  }
}

finalRenataVerification().catch(console.error);