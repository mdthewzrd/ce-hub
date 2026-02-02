const { chromium } = require('playwright');

async function testRenataSpacingValidation() {
  console.log('🚀 Testing Renata spacing and layout validation...');

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

    // Look for the actual Renata component by text content
    const renataText = await page.textContent('body');
    if (renataText.includes('Renata AI')) {
      console.log('✅ Found Renata AI text on page');
    } else {
      console.log('❌ No Renata AI text found');
      return;
    }

    // Test specific layout and spacing - look for AguiRenataChat component elements
    console.log('🔍 Testing AguiRenataChat component layout...');

    // Look for Renata header elements
    const renataHeader = await page.locator('text="Renata AI"').first();
    if (await renataHeader.count() > 0) {
      console.log('✅ Found Renata AI header');

      // Check if it's in a proper header container
      const headerContainer = renataHeader.locator('..'); // Parent element
      const headerBox = await headerContainer.boundingBox();
      if (headerBox) {
        console.log(`📏 Header container: width=${headerBox.width}, height=${headerBox.height}`);

        // Check for proper padding (should be px-6 py-4 = 24px horizontal, 16px vertical)
        const headerStyles = await page.evaluate((element) => {
          const computedStyle = window.getComputedStyle(element);
          return {
            paddingLeft: computedStyle.paddingLeft,
            paddingRight: computedStyle.paddingRight,
            paddingTop: computedStyle.paddingTop,
            paddingBottom: computedStyle.paddingBottom,
            backgroundColor: computedStyle.backgroundColor,
            borderBottom: computedStyle.borderBottomWidth
          };
        }, await headerContainer.elementHandle());

        console.log('📋 Header spacing:', headerStyles);

        if (headerStyles.paddingLeft === '24px' && headerStyles.paddingTop === '16px') {
          console.log('✅ Header has correct px-6 py-4 spacing');
        } else {
          console.log('⚠️ Header spacing may need adjustment');
        }
      }
    }

    // Test for status bar with Traderra gold styling
    console.log('🔍 Testing status bar styling...');
    const statusElements = await page.locator('text="Active"').first();
    if (await statusElements.count() > 0) {
      console.log('✅ Found status indicator');

      const statusStyles = await page.evaluate((element) => {
        const parent = element.closest('[class*="px-6"]') || element.parentElement;
        if (parent) {
          const computedStyle = window.getComputedStyle(parent);
          return {
            paddingLeft: computedStyle.paddingLeft,
            paddingTop: computedStyle.paddingTop,
            backgroundColor: computedStyle.backgroundColor,
            borderBottom: computedStyle.borderBottomWidth
          };
        }
        return null;
      }, await statusElements.elementHandle());

      if (statusStyles) {
        console.log('📋 Status bar spacing:', statusStyles);

        if (statusStyles.paddingLeft === '24px') {
          console.log('✅ Status bar has correct px-6 spacing');
        } else {
          console.log('⚠️ Status bar spacing needs adjustment');
        }
      }
    }

    // Test chat area spacing
    console.log('🔍 Testing chat messages area...');
    const chatArea = await page.locator('[class*="overflow-y-auto"]').first();
    if (await chatArea.count() > 0) {
      console.log('✅ Found chat messages area');

      const chatStyles = await page.evaluate((element) => {
        const computedStyle = window.getComputedStyle(element);
        return {
          paddingLeft: computedStyle.paddingLeft,
          paddingTop: computedStyle.paddingTop,
          marginBottom: computedStyle.marginBottom
        };
      }, await chatArea.elementHandle());

      console.log('📋 Chat area spacing:', chatStyles);

      if (chatStyles.paddingLeft === '24px' && chatStyles.paddingTop === '16px') {
        console.log('✅ Chat area has correct px-6 py-4 spacing');
      } else {
        console.log('⚠️ Chat area spacing needs adjustment');
      }
    }

    // Test input area
    console.log('🔍 Testing input area styling...');
    const textareaElement = await page.locator('textarea').first();
    if (await textareaElement.count() > 0) {
      console.log('✅ Found textarea input');

      const inputStyles = await page.evaluate((element) => {
        const parent = element.parentElement;
        const computedStyle = window.getComputedStyle(parent);
        const textareaStyle = window.getComputedStyle(element);
        return {
          parentPaddingLeft: computedStyle.paddingLeft,
          parentPaddingTop: computedStyle.paddingTop,
          textareaPadding: textareaStyle.padding,
          borderColor: textareaStyle.borderColor,
          borderRadius: textareaStyle.borderRadius
        };
      }, await textareaElement.elementHandle());

      console.log('📋 Input area styling:', inputStyles);

      if (inputStyles.parentPaddingLeft === '24px') {
        console.log('✅ Input container has correct px-6 spacing');
      } else {
        console.log('⚠️ Input container spacing needs adjustment');
      }
    }

    // Test overall component container
    console.log('🔍 Testing overall component container...');
    const componentContainer = await page.evaluate(() => {
      // Look for the main component container
      const containers = Array.from(document.querySelectorAll('div')).filter(div => {
        const text = div.textContent || '';
        return text.includes('Renata AI') && div.style.position === 'fixed';
      });

      if (containers.length > 0) {
        const container = containers[0];
        const style = window.getComputedStyle(container);
        return {
          position: style.position,
          right: style.right,
          top: style.top,
          width: style.width,
          height: style.height,
          backgroundColor: style.backgroundColor,
          borderLeft: style.borderLeftWidth,
          zIndex: style.zIndex
        };
      }
      return null;
    });

    if (componentContainer) {
      console.log('📋 Component container styling:', componentContainer);

      if (componentContainer.position === 'fixed' && componentContainer.right === '0px') {
        console.log('✅ Component is properly positioned as fixed right sidebar');
      } else {
        console.log('⚠️ Component positioning needs adjustment');
      }

      if (componentContainer.width === '480px') { // 30rem = 480px
        console.log('✅ Component has correct width (30rem/480px)');
      } else {
        console.log('⚠️ Component width needs adjustment');
      }
    } else {
      console.log('❌ Could not find fixed positioned component container');
    }

    // Test drag and drop functionality
    console.log('🎯 Testing drag and drop functionality...');
    await page.evaluate(() => {
      console.log('🔧 Starting client-side drag simulation...');

      // Create a fake file
      const file = new File(['def test_scanner():\n    print("Test file")\n    return True'], 'test_scanner.py', {
        type: 'text/plain'
      });

      // Find the main Renata container
      const renataContainers = Array.from(document.querySelectorAll('div')).filter(div => {
        const text = div.textContent || '';
        return text.includes('Renata AI') && div.style.position === 'fixed';
      });

      if (renataContainers.length === 0) {
        console.log('❌ Renata container not found for drag test');
        return;
      }

      const mainContainer = renataContainers[0];
      console.log('✅ Found Renata container for drag test');

      // Create drag events with proper dataTransfer
      const createDragEvent = (type) => {
        const event = new DragEvent(type, {
          bubbles: true,
          cancelable: true,
          dataTransfer: new DataTransfer()
        });
        if (type === 'drop') {
          event.dataTransfer.items.add(file);
        }
        return event;
      };

      console.log('🟡 Dispatching dragenter event...');
      mainContainer.dispatchEvent(createDragEvent('dragenter'));

      setTimeout(() => {
        console.log('🟢 Dispatching dragover event...');
        mainContainer.dispatchEvent(createDragEvent('dragover'));
      }, 100);

      setTimeout(() => {
        console.log('🎯 Dispatching drop event...');
        mainContainer.dispatchEvent(createDragEvent('drop'));
      }, 200);
    });

    await page.waitForTimeout(1000);

    console.log('✅ Renata spacing and layout validation completed!');
    console.log('📝 Review the spacing measurements above to verify improvements');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('🔄 Keeping browser open for manual inspection...');
    console.log('📝 Press Ctrl+C when done...');
    // Keep browser open for manual inspection
    await new Promise(() => {}); // This will keep the process running
  }
}

testRenataSpacingValidation().catch(console.error);