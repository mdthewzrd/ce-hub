const { chromium } = require('playwright');

async function testRenataBottomSpacingFix() {
  console.log('🚀 Testing Renata bottom section spacing fix...');

  const browser = await chromium.launch({
    headless: false,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console logs to capture our debug messages
  page.on('console', msg => {
    if (msg.text().includes('🟡') || msg.text().includes('🟢') || msg.text().includes('🟠') || msg.text().includes('🎯') || msg.text().includes('📁')) {
      console.log('🔍 DRAG DEBUG:', msg.text());
    } else if (msg.text().includes('Renata') || msg.text().includes('AguiRenataChat')) {
      console.log('🤖 RENATA:', msg.text());
    } else if (msg.type() === 'error') {
      console.log('❌ ERROR:', msg.text());
    }
  });

  try {
    console.log('📱 Navigating to localhost:5657...');
    await page.goto('http://localhost:5657');

    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);

    console.log('🔍 Looking for Renata AI components...');

    // Look for text content that indicates our AguiRenataChat is loaded
    const renataText = await page.textContent('body');
    if (renataText.includes('Renata AI')) {
      console.log('✅ Found Renata AI text on page');
    } else {
      console.log('❌ No Renata AI text found');
      return;
    }

    // Test the bottom section spacing specifically
    console.log('🎯 Testing bottom section spacing fix...');

    const bottomSectionAnalysis = await page.evaluate(() => {
      // Find the Renata container
      const renataContainers = Array.from(document.querySelectorAll('div')).filter(div => {
        const text = div.textContent || '';
        return text.includes('Renata AI') && div.style.position === 'fixed';
      });

      if (renataContainers.length === 0) {
        return { error: 'No Renata container found' };
      }

      const mainContainer = renataContainers[0];

      // Find the bottom section with border-t (the input area)
      const bottomSections = Array.from(mainContainer.querySelectorAll('div')).filter(div => {
        return div.className && div.className.includes('border-t');
      });

      if (bottomSections.length === 0) {
        return { error: 'No bottom section with border-t found' };
      }

      const bottomSection = bottomSections[0];
      const bottomStyle = window.getComputedStyle(bottomSection);

      // Find the flex container inside with gap
      const flexContainers = Array.from(bottomSection.querySelectorAll('div')).filter(div => {
        return div.className && div.className.includes('flex-col');
      });

      let gapAnalysis = null;
      if (flexContainers.length > 0) {
        const flexContainer = flexContainers[0];
        const flexStyle = window.getComputedStyle(flexContainer);
        gapAnalysis = {
          gap: flexStyle.gap,
          rowGap: flexStyle.rowGap,
          columnGap: flexStyle.columnGap
        };
      }

      // Find textarea element and its container
      const textarea = bottomSection.querySelector('textarea');
      let textareaAnalysis = null;
      if (textarea) {
        const textareaStyle = window.getComputedStyle(textarea);
        const textareaParent = textarea.parentElement;
        const parentStyle = textareaParent ? window.getComputedStyle(textareaParent) : null;

        textareaAnalysis = {
          textareaPadding: textareaStyle.padding,
          textareaHeight: textareaStyle.height,
          parentMargin: parentStyle ? parentStyle.margin : null,
          parentPadding: parentStyle ? parentStyle.padding : null
        };
      }

      return {
        bottomSection: {
          padding: bottomStyle.padding,
          paddingTop: bottomStyle.paddingTop,
          paddingBottom: bottomStyle.paddingBottom,
          paddingLeft: bottomStyle.paddingLeft,
          paddingRight: bottomStyle.paddingRight,
          borderTop: bottomStyle.borderTopWidth
        },
        gapAnalysis,
        textareaAnalysis,
        success: true
      };
    });

    if (bottomSectionAnalysis.error) {
      console.log('❌', bottomSectionAnalysis.error);
    } else {
      console.log('\n📋 Bottom Section Analysis:');
      console.log('🎯 Bottom Container Padding:', bottomSectionAnalysis.bottomSection);

      if (bottomSectionAnalysis.gapAnalysis) {
        console.log('🎯 Flex Container Gap:', bottomSectionAnalysis.gapAnalysis);

        // Check if gap is now 1rem (16px)
        const gap = bottomSectionAnalysis.gapAnalysis.gap;
        if (gap === '16px' || gap === '1rem') {
          console.log('✅ Gap spacing fixed! Now using 1rem (16px) instead of 0.5rem');
        } else {
          console.log(`⚠️ Gap spacing may need adjustment: current=${gap}, expected=1rem/16px`);
        }
      } else {
        console.log('⚠️ Could not find flex container with gap');
      }

      if (bottomSectionAnalysis.textareaAnalysis) {
        console.log('🎯 Textarea Analysis:', bottomSectionAnalysis.textareaAnalysis);

        // Check textarea padding
        const textareaPadding = bottomSectionAnalysis.textareaAnalysis.textareaPadding;
        if (textareaPadding.includes('16px') || textareaPadding.includes('1rem')) {
          console.log('✅ Textarea padding is properly set');
        } else {
          console.log('⚠️ Textarea padding may need attention:', textareaPadding);
        }
      } else {
        console.log('⚠️ Could not find textarea element');
      }

      // Check overall bottom section padding
      const bottomPadding = bottomSectionAnalysis.bottomSection;
      if (bottomPadding.paddingLeft === '24px' && bottomPadding.paddingRight === '24px') {
        console.log('✅ Bottom section horizontal padding is correct (24px/1.5rem)');
      } else {
        console.log('⚠️ Bottom section horizontal padding needs attention:', bottomPadding);
      }

      if (bottomPadding.paddingTop === '16px' && bottomPadding.paddingBottom === '16px') {
        console.log('✅ Bottom section vertical padding is correct (16px/1rem)');
      } else {
        console.log('⚠️ Bottom section vertical padding needs attention:', bottomPadding);
      }
    }

    // Take screenshot for visual verification
    console.log('📸 Taking screenshot of bottom section...');
    const renataContainer = await page.locator('[style*="position: fixed"][style*="right: 0"]').first();
    if (await renataContainer.count() > 0) {
      await renataContainer.screenshot({ path: '/Users/michaeldurante/ai dev/ce-hub/edge-dev/renata_bottom_spacing_fix_validation.png' });
      console.log('✅ Screenshot saved: renata_bottom_spacing_fix_validation.png');
    }

    console.log('\n✅ Bottom section spacing validation completed!');
    console.log('📝 Summary: Testing gap increase from 0.5rem to 1rem for better visual separation');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('🔄 Keeping browser open for manual inspection...');
    console.log('📝 Press Ctrl+C when done...');
    // Keep browser open for manual inspection
    await new Promise(() => {}); // This will keep the process running
  }
}

testRenataBottomSpacingFix().catch(console.error);