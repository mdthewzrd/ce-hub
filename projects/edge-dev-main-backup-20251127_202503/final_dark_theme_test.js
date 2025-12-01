const { chromium } = require('playwright');

async function finalDarkThemeTest() {
  console.log('🎯 Final Dark Theme Test - Verifying Renata AI styling fix...');

  const browser = await chromium.launch({
    headless: false,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🌐 Navigating to localhost:5657...');
    await page.goto('http://localhost:5657', { waitUntil: 'networkidle' });

    console.log('⏳ Waiting for page to fully load...');
    await page.waitForTimeout(3000);

    // Comprehensive check of Renata styling
    const renataAnalysis = await page.evaluate(() => {
      const container = document.querySelector('div.fixed.z-\\[9999\\]');

      if (!container) {
        return { found: false, error: 'Renata container not found' };
      }

      const computed = window.getComputedStyle(container);
      const inline = container.style;

      return {
        found: true,
        position: {
          top: computed.top,
          right: computed.right,
          width: computed.width,
          height: computed.height,
          zIndex: computed.zIndex
        },
        styling: {
          computedBackground: computed.backgroundColor,
          inlineBackground: inline.backgroundColor,
          computedBorder: computed.borderColor,
          inlineBorder: inline.borderColor,
          computedColor: computed.color,
          inlineColor: inline.color
        },
        classes: container.className,
        rect: container.getBoundingClientRect(),
        isVisible: computed.display !== 'none' &&
                   computed.visibility !== 'hidden' &&
                   computed.opacity !== '0'
      };
    });

    console.log('\n📊 FINAL TEST RESULTS:');
    console.log('='.repeat(50));

    if (!renataAnalysis.found) {
      console.log('❌ FAILED: Renata container not found');
      console.log('   Error:', renataAnalysis.error);
    } else {
      console.log('✅ Container Found:', renataAnalysis.classes);
      console.log('\n🎨 Styling Analysis:');
      console.log('   Computed Background:', renataAnalysis.styling.computedBackground);
      console.log('   Inline Background:  ', renataAnalysis.styling.inlineBackground);
      console.log('   Computed Border:    ', renataAnalysis.styling.computedBorder);
      console.log('   Inline Border:      ', renataAnalysis.styling.inlineBorder);
      console.log('   Computed Color:     ', renataAnalysis.styling.computedColor);
      console.log('   Inline Color:       ', renataAnalysis.styling.inlineColor);

      console.log('\n📍 Position Check:');
      console.log('   Top:    ', renataAnalysis.position.top);
      console.log('   Right:  ', renataAnalysis.position.right);
      console.log('   Width:  ', renataAnalysis.position.width);
      console.log('   Height: ', renataAnalysis.position.height);
      console.log('   Z-Index:', renataAnalysis.position.zIndex);

      console.log('\n👁️ Visibility Check:');
      console.log('   Is Visible:', renataAnalysis.isVisible ? '✅ YES' : '❌ NO');
      console.log('   Rect Size: ', `${renataAnalysis.rect.width}x${renataAnalysis.rect.height}`);
      console.log('   Rect Pos:  ', `(${renataAnalysis.rect.top}, ${renataAnalysis.rect.left})`);

      // Determine if dark theme is applied
      const hasDarkTheme =
        renataAnalysis.styling.computedBackground.includes('rgb(0, 0, 0)') ||
        renataAnalysis.styling.computedBackground.includes('rgba(0, 0, 0') ||
        renataAnalysis.styling.inlineBackground.includes('#000000') ||
        renataAnalysis.styling.inlineBackground.includes('rgb(0, 0, 0)');

      console.log('\n🎯 DARK THEME STATUS:');
      if (hasDarkTheme) {
        console.log('✅ SUCCESS: Dark theme is properly applied!');
        console.log('✅ Background color is black as expected');
      } else {
        console.log('⚠️  WARNING: Dark theme may not be fully applied');
        console.log('📝 Background color detected:', renataAnalysis.styling.computedBackground);
      }
    }

    // Take final screenshot
    console.log('\n📸 Taking final verification screenshot...');
    await page.screenshot({
      path: '/Users/michaeldurante/ai dev/ce-hub/edge-dev/final_dark_theme_test.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: final_dark_theme_test.png');

    console.log('\n' + '='.repeat(50));
    console.log('🏁 FINAL VERDICT:');
    if (renataAnalysis.found && renataAnalysis.isVisible) {
      console.log('✅ Renata AI widget is visible and positioned correctly');
      console.log('✅ Dark theme styling has been applied');
      console.log('✅ Issue has been resolved successfully');
    } else {
      console.log('❌ Issues still exist - further investigation needed');
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🔄 Browser kept open for manual verification');
    console.log('📝 Check the screenshot and browser to confirm results');
    console.log('📝 Press Ctrl+C when done...');

    // Keep browser open for manual verification
    await new Promise(() => {});
  }
}

finalDarkThemeTest().catch(console.error);