const { chromium } = require('playwright');

async function testRenataRestoredLayout() {
  console.log('🚀 Testing restored Renata layout...');

  const browser = await chromium.launch({
    headless: false,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console logs to capture any errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ ERROR:', msg.text());
    }
  });

  try {
    console.log('📱 Navigating to localhost:5657...');
    await page.goto('http://localhost:5657');

    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);

    console.log('🔍 Looking for restored Renata AI component...');

    // Check if Renata AI component is present and properly structured
    const renataAnalysis = await page.evaluate(() => {
      // Find elements with Renata text
      const renataElements = Array.from(document.querySelectorAll('*')).filter(el =>
        el.textContent && el.textContent.includes('Renata AI')
      );

      if (renataElements.length === 0) {
        return { error: 'No Renata AI component found' };
      }

      // Find the main container (should be a flexbox layout)
      const mainContainer = renataElements[0].closest('div');
      const containerStyle = window.getComputedStyle(mainContainer);

      // Check for the working layout structure
      const isFlexContainer = containerStyle.display === 'flex';
      const hasProperDirection = containerStyle.flexDirection === 'column';
      const hasProperOverflow = containerStyle.overflow === 'hidden';

      // Look for key elements: mode selector, messages area, input area
      const modeSelector = mainContainer.querySelector('select');
      const messagesArea = Array.from(mainContainer.querySelectorAll('div')).find(div =>
        div.className && div.className.includes('overflow-y-auto')
      );
      const inputArea = mainContainer.querySelector('textarea');

      return {
        containerStructure: {
          display: containerStyle.display,
          flexDirection: containerStyle.flexDirection,
          overflow: containerStyle.overflow,
          height: containerStyle.height,
          maxHeight: containerStyle.maxHeight
        },
        hasElements: {
          modeSelector: !!modeSelector,
          messagesArea: !!messagesArea,
          inputArea: !!inputArea
        },
        layoutAnalysis: {
          isFlexContainer,
          hasProperDirection,
          hasProperOverflow,
          isProperLayout: isFlexContainer && hasProperDirection && hasProperOverflow
        },
        success: true
      };
    });

    if (renataAnalysis.error) {
      console.log('❌', renataAnalysis.error);
    } else {
      console.log('\n📋 Restored Layout Analysis:');

      // Container Structure
      console.log('🏗️ Container Structure:');
      console.log('   Display:', renataAnalysis.containerStructure.display);
      console.log('   Flex Direction:', renataAnalysis.containerStructure.flexDirection);
      console.log('   Overflow:', renataAnalysis.containerStructure.overflow);
      console.log('   Height:', renataAnalysis.containerStructure.height);
      console.log('   Max Height:', renataAnalysis.containerStructure.maxHeight);

      // Element Presence
      console.log('\n🎯 Required Elements:');
      console.log('   Mode Selector:', renataAnalysis.hasElements.modeSelector ? '✅ Found' : '❌ Missing');
      console.log('   Messages Area:', renataAnalysis.hasElements.messagesArea ? '✅ Found' : '❌ Missing');
      console.log('   Input Area:', renataAnalysis.hasElements.inputArea ? '✅ Found' : '❌ Missing');

      // Layout Quality
      console.log('\n📊 Layout Quality:');
      console.log('   Flex Container:', renataAnalysis.layoutAnalysis.isFlexContainer ? '✅ Yes' : '❌ No');
      console.log('   Proper Direction:', renataAnalysis.layoutAnalysis.hasProperDirection ? '✅ Column' : '❌ Wrong');
      console.log('   Proper Overflow:', renataAnalysis.layoutAnalysis.hasProperOverflow ? '✅ Hidden' : '❌ Wrong');

      // Overall Assessment
      console.log('\n🎯 Overall Assessment:');
      if (renataAnalysis.layoutAnalysis.isProperLayout &&
          renataAnalysis.hasElements.modeSelector &&
          renataAnalysis.hasElements.messagesArea &&
          renataAnalysis.hasElements.inputArea) {
        console.log('   ✅ SUCCESS! Restored layout is working properly');
        console.log('   📝 The working backup version has been successfully restored');
      } else {
        console.log('   ⚠️ Some issues still present - may need further adjustments');
      }
    }

    // Take screenshot for visual verification
    console.log('\n📸 Taking screenshot of restored layout...');
    await page.screenshot({
      path: '/Users/michaeldurante/ai dev/ce-hub/edge-dev/renata_restored_layout_validation.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: renata_restored_layout_validation.png');

    console.log('\n✅ Restored layout validation completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('🔄 Keeping browser open for manual inspection...');
    console.log('📝 You can now manually verify the restored Renata layout');
    console.log('📝 Press Ctrl+C when done...');
    // Keep browser open for manual inspection
    await new Promise(() => {}); // This will keep the process running
  }
}

testRenataRestoredLayout().catch(console.error);