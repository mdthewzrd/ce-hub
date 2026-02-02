const { chromium } = require('playwright');

async function testRenataIntegration() {
  console.log('🚀 Testing AguiRenataChat integration and drag & drop...');

  const browser = await chromium.launch({
    headless: false,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console logs to capture our debug messages
  page.on('console', msg => {
    if (msg.text().includes('🌍') || msg.text().includes('🟡') || msg.text().includes('🟢') || msg.text().includes('🟠') || msg.text().includes('🎯') || msg.text().includes('📁')) {
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
    }

    // Look for our debug console message from the component
    await page.evaluate(() => {
      console.log('🤖 AguiRenataChat component test - checking if loaded');
    });

    // Check if our drag event handlers exist
    const dragHandlersExist = await page.evaluate(() => {
      // Look for elements with drag handlers
      const elements = document.querySelectorAll('*');
      let foundDragHandlers = false;

      for (let element of elements) {
        if (element.ondragover || element.ondragenter || element.ondrop) {
          console.log('🎯 Found drag handlers on element:', element.tagName, element.className);
          foundDragHandlers = true;
        }
      }

      return foundDragHandlers;
    });

    console.log('🎯 Drag handlers found:', dragHandlersExist);

    // Try to find the main drag container by CSS class
    const dragContainer = await page.locator('div[class*="flex h-full flex-col relative"]').first();

    if (await dragContainer.count() > 0) {
      console.log('✅ Found main drag container');

      // Test drag simulation
      console.log('🎯 Testing drag and drop simulation...');

      await page.evaluate(() => {
        console.log('🔧 Starting client-side drag simulation...');

        // Create a fake file
        const file = new File(['def test_scanner():\n    print("Test file")\n    return True'], 'test_scanner.py', {
          type: 'text/plain'
        });

        // Find the main container
        const mainContainer = document.querySelector('[class*="flex h-full flex-col relative"]');

        if (!mainContainer) {
          console.log('❌ Main container not found');
          return;
        }

        console.log('✅ Found main container for drag test');

        // Create and dispatch drag events
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

        console.log('🎯 Dispatching dragenter event...');
        mainContainer.dispatchEvent(createDragEvent('dragenter'));

        setTimeout(() => {
          console.log('🎯 Dispatching dragover event...');
          mainContainer.dispatchEvent(createDragEvent('dragover'));
        }, 100);

        setTimeout(() => {
          console.log('🎯 Dispatching drop event...');
          mainContainer.dispatchEvent(createDragEvent('drop'));
        }, 200);
      });

      await page.waitForTimeout(1000);
      console.log('✅ Drag simulation completed');
    } else {
      console.log('❌ Main drag container not found');
    }

    console.log('⏳ Waiting to observe results...');
    await page.waitForTimeout(2000);

    console.log('✅ Integration test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('🔄 Keeping browser open for manual inspection...');
    console.log('📝 Press Ctrl+C when done...');
    // Keep browser open for manual inspection
    await new Promise(() => {}); // This will keep the process running
  }
}

testRenataIntegration().catch(console.error);