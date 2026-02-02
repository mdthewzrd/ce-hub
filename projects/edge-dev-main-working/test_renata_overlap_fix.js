const { chromium } = require('playwright');

async function testRenataOverlapFix() {
  console.log('🚀 Testing Renata component overlap fix...');

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

    // Comprehensive overlap analysis
    console.log('🎯 Testing overlap fix comprehensively...');

    const overlapAnalysis = await page.evaluate(() => {
      // Find the Renata container
      const renataContainers = Array.from(document.querySelectorAll('div')).filter(div => {
        const text = div.textContent || '';
        return text.includes('Renata AI') && div.style.position === 'fixed';
      });

      if (renataContainers.length === 0) {
        return { error: 'No Renata container found' };
      }

      const mainContainer = renataContainers[0];
      const containerStyle = window.getComputedStyle(mainContainer);
      const containerRect = mainContainer.getBoundingClientRect();

      // Find messages container
      const messagesContainer = Array.from(mainContainer.querySelectorAll('div')).find(div => {
        return div.className && div.className.includes('overflow-y-auto');
      });

      let messagesAnalysis = null;
      if (messagesContainer) {
        const messagesStyle = window.getComputedStyle(messagesContainer);
        const messagesRect = messagesContainer.getBoundingClientRect();
        messagesAnalysis = {
          padding: messagesStyle.padding,
          paddingBottom: messagesStyle.paddingBottom,
          height: messagesRect.height,
          top: messagesRect.top,
          bottom: messagesRect.bottom
        };
      }

      // Find input area
      const inputContainer = Array.from(mainContainer.querySelectorAll('div')).find(div => {
        return div.className && div.className.includes('border-t');
      });

      let inputAnalysis = null;
      if (inputContainer) {
        const inputStyle = window.getComputedStyle(inputContainer);
        const inputRect = inputContainer.getBoundingClientRect();
        inputAnalysis = {
          padding: inputStyle.padding,
          height: inputRect.height,
          top: inputRect.top,
          bottom: inputRect.bottom
        };
      }

      // Check for overlap
      let overlapDetected = false;
      let overlapDistance = 0;
      if (messagesAnalysis && inputAnalysis) {
        if (messagesAnalysis.bottom > inputAnalysis.top) {
          overlapDetected = true;
          overlapDistance = messagesAnalysis.bottom - inputAnalysis.top;
        }
      }

      // Find textarea specifically
      const textarea = mainContainer.querySelector('textarea');
      let textareaAnalysis = null;
      if (textarea) {
        const textareaStyle = window.getComputedStyle(textarea);
        const textareaRect = textarea.getBoundingClientRect();
        textareaAnalysis = {
          padding: textareaStyle.padding,
          height: textareaRect.height,
          top: textareaRect.top,
          bottom: textareaRect.bottom,
          visible: textareaRect.height > 0 && textareaRect.width > 0
        };
      }

      return {
        mainContainer: {
          padding: containerStyle.padding,
          paddingBottom: containerStyle.paddingBottom,
          height: containerRect.height,
          width: containerRect.width
        },
        messagesAnalysis,
        inputAnalysis,
        textareaAnalysis,
        overlapDetected,
        overlapDistance,
        viewportHeight: window.innerHeight,
        success: true
      };
    });

    if (overlapAnalysis.error) {
      console.log('❌', overlapAnalysis.error);
    } else {
      console.log('\n📋 Comprehensive Overlap Analysis:');

      // Main Container Analysis
      console.log('🏠 Main Container:');
      console.log('   Padding Bottom:', overlapAnalysis.mainContainer.paddingBottom);
      console.log('   Container Height:', overlapAnalysis.mainContainer.height + 'px');
      console.log('   Viewport Height:', overlapAnalysis.viewportHeight + 'px');

      if (overlapAnalysis.mainContainer.paddingBottom === '32px' || overlapAnalysis.mainContainer.paddingBottom === '2rem') {
        console.log('   ✅ Main container has proper bottom padding (2rem/32px)');
      } else {
        console.log('   ⚠️ Main container bottom padding needs attention:', overlapAnalysis.mainContainer.paddingBottom);
      }

      // Messages Container Analysis
      if (overlapAnalysis.messagesAnalysis) {
        console.log('\n💬 Messages Container:');
        console.log('   Padding Bottom:', overlapAnalysis.messagesAnalysis.paddingBottom);
        console.log('   Messages Height:', overlapAnalysis.messagesAnalysis.height + 'px');
        console.log('   Messages Bottom:', overlapAnalysis.messagesAnalysis.bottom + 'px');

        if (overlapAnalysis.messagesAnalysis.paddingBottom === '32px' || overlapAnalysis.messagesAnalysis.paddingBottom === '2rem') {
          console.log('   ✅ Messages container has proper bottom padding (2rem/32px)');
        } else {
          console.log('   ⚠️ Messages container bottom padding needs attention:', overlapAnalysis.messagesAnalysis.paddingBottom);
        }
      }

      // Input Area Analysis
      if (overlapAnalysis.inputAnalysis) {
        console.log('\n⌨️ Input Container:');
        console.log('   Input Padding:', overlapAnalysis.inputAnalysis.padding);
        console.log('   Input Height:', overlapAnalysis.inputAnalysis.height + 'px');
        console.log('   Input Top:', overlapAnalysis.inputAnalysis.top + 'px');

        if (overlapAnalysis.inputAnalysis.padding.includes('16px') && overlapAnalysis.inputAnalysis.padding.includes('24px')) {
          console.log('   ✅ Input container has proper padding (16px 24px)');
        } else {
          console.log('   ⚠️ Input container padding needs attention:', overlapAnalysis.inputAnalysis.padding);
        }
      }

      // Textarea Analysis
      if (overlapAnalysis.textareaAnalysis) {
        console.log('\n📝 Textarea Element:');
        console.log('   Textarea Padding:', overlapAnalysis.textareaAnalysis.padding);
        console.log('   Textarea Height:', overlapAnalysis.textareaAnalysis.height + 'px');
        console.log('   Textarea Visible:', overlapAnalysis.textareaAnalysis.visible);

        if (overlapAnalysis.textareaAnalysis.visible && overlapAnalysis.textareaAnalysis.height >= 50) {
          console.log('   ✅ Textarea is properly visible and sized');
        } else {
          console.log('   ⚠️ Textarea visibility or sizing needs attention');
        }
      }

      // Overlap Detection
      console.log('\n🔄 Overlap Detection:');
      if (overlapAnalysis.overlapDetected) {
        console.log(`   ❌ OVERLAP DETECTED! Distance: ${overlapAnalysis.overlapDistance}px`);
        console.log('   📊 Messages bottom overlaps input top by this amount');
      } else {
        console.log('   ✅ NO OVERLAP DETECTED - Components properly separated');
      }

      // Overall Assessment
      console.log('\n🎯 Overall Assessment:');
      const hasProperPadding = overlapAnalysis.mainContainer.paddingBottom === '32px' ||
                              overlapAnalysis.mainContainer.paddingBottom === '2rem';
      const hasProperMessagesPadding = overlapAnalysis.messagesAnalysis?.paddingBottom === '32px' ||
                                      overlapAnalysis.messagesAnalysis?.paddingBottom === '2rem';
      const noOverlap = !overlapAnalysis.overlapDetected;
      const textareaVisible = overlapAnalysis.textareaAnalysis?.visible;

      if (hasProperPadding && hasProperMessagesPadding && noOverlap && textareaVisible) {
        console.log('   ✅ ALL TESTS PASSED - Overlap fix successful!');
      } else {
        console.log('   ⚠️ Some issues detected - check individual components above');
      }
    }

    // Take screenshot for visual verification
    console.log('\n📸 Taking screenshot for visual verification...');
    const renataContainer = await page.locator('[style*="position: fixed"][style*="right: 0"]').first();
    if (await renataContainer.count() > 0) {
      await renataContainer.screenshot({ path: '/Users/michaeldurante/ai dev/ce-hub/edge-dev/renata_overlap_fix_validation.png' });
      console.log('✅ Screenshot saved: renata_overlap_fix_validation.png');
    }

    console.log('\n✅ Overlap fix validation completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('🔄 Keeping browser open for manual inspection...');
    console.log('📝 Press Ctrl+C when done...');
    // Keep browser open for manual inspection
    await new Promise(() => {}); // This will keep the process running
  }
}

testRenataOverlapFix().catch(console.error);