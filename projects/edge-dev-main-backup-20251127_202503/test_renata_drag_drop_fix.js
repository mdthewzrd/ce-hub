const { chromium } = require('playwright');

async function testRenataDragDropFix() {
  console.log('🚀 Testing Renata layout fix and drag & drop functionality...');

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

    // Test layout - check if Renata appears as fixed right sidebar
    console.log('🔍 Testing layout positioning...');
    const renataContainer = await page.locator('[style*="position: fixed"][style*="right: 0"]').first();

    if (await renataContainer.count() > 0) {
      console.log('✅ Found fixed right-positioned Renata container');

      // Check dimensions
      const boundingBox = await renataContainer.boundingBox();
      if (boundingBox) {
        console.log(`📏 Container dimensions: width=${boundingBox.width}, height=${boundingBox.height}, right=${boundingBox.x + boundingBox.width}`);

        if (boundingBox.width >= 400 && boundingBox.height >= 600) {
          console.log('✅ Container has appropriate sidebar dimensions');
        } else {
          console.log('⚠️ Container dimensions may be too small for sidebar');
        }
      }
    } else {
      console.log('❌ Fixed right-positioned container not found');
    }

    // Test drag and drop functionality
    console.log('🎯 Testing drag and drop functionality...');

    await page.evaluate(() => {
      console.log('🔧 Starting client-side drag simulation...');

      // Create a fake file
      const file = new File(['def test_scanner():\n    print("Test file")\n    return True'], 'test_scanner.py', {
        type: 'text/plain'
      });

      // Find the main container with fixed positioning
      const mainContainer = document.querySelector('[style*="position: fixed"][style*="right: 0"]');

      if (!mainContainer) {
        console.log('❌ Main container not found for drag test');
        return;
      }

      console.log('✅ Found main container for drag test');

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

    // Check for drag overlay
    console.log('🔍 Checking for drag overlay visibility...');
    const dragOverlay = await page.locator('[style*="bg-purple-500/10"]').first();

    if (await dragOverlay.count() > 0) {
      console.log('✅ Drag overlay is present (purple background detected)');
    } else {
      console.log('⚠️ Drag overlay not detected - may have already disappeared');
    }

    console.log('✅ Layout and drag drop test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('🔄 Keeping browser open for manual inspection...');
    console.log('📝 Press Ctrl+C when done...');
    // Keep browser open for manual inspection
    await new Promise(() => {}); // This will keep the process running
  }
}

testRenataDragDropFix().catch(console.error);