const { chromium } = require('playwright');
const path = require('path');

async function testDragDropDebug() {
  console.log('🚀 Starting drag and drop debug test...');

  const browser = await chromium.launch({
    headless: false,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console logs to capture our debug messages
  page.on('console', msg => {
    if (msg.text().includes('🌍') || msg.text().includes('🟡') || msg.text().includes('🟢') || msg.text().includes('🟠') || msg.text().includes('🎯') || msg.text().includes('📁')) {
      console.log('🔍 DEBUG LOG:', msg.text());
    }
  });

  try {
    console.log('📱 Navigating to localhost:5657...');
    await page.goto('http://localhost:5657');

    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);

    console.log('🔍 Looking for Renata AI section...');
    // Look for the Renata chat component
    const renataSection = await page.locator('[data-testid="renata-chat"], .ag-ui-renata-chat, text="Renata AI"').first();

    if (await renataSection.count() === 0) {
      console.log('❌ Renata section not found, looking for alternative selectors...');
      // Try to find any chat interface
      const chatInterface = await page.locator('textarea, [placeholder*="chat"], [placeholder*="message"]').first();
      if (await chatInterface.count() > 0) {
        console.log('✅ Found chat interface, using that for testing');
      } else {
        console.log('❌ No chat interface found');
        return;
      }
    } else {
      console.log('✅ Found Renata section');
    }

    console.log('📁 Creating test file for drag and drop...');
    // Create a test file to drag
    const testFileContent = `def test_scanner():
    print("This is a test Python file for drag and drop")
    return True`;

    // Use a more direct approach - simulate file drag by creating a DataTransfer
    console.log('🎯 Testing drag and drop with file simulation...');

    await page.evaluate(() => {
      console.log('🔧 Starting client-side drag simulation...');

      // Create a fake file
      const file = new File(['def test_scanner():\n    print("Test file")\n    return True'], 'test_scanner.py', {
        type: 'text/plain'
      });

      // Find the main container (should be the one with drag handlers)
      const mainContainer = document.querySelector('[class*="flex h-full flex-col relative"]');

      if (!mainContainer) {
        console.log('❌ Main container not found');
        return;
      }

      console.log('✅ Found main container:', mainContainer);

      // Create drag events
      const dragEnter = new DragEvent('dragenter', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer()
      });

      const dragOver = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer()
      });

      const drop = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer()
      });

      // Add file to dataTransfer
      drop.dataTransfer.items.add(file);
      dragOver.dataTransfer.items.add(file);
      dragEnter.dataTransfer.items.add(file);

      console.log('🎯 Dispatching dragenter event...');
      mainContainer.dispatchEvent(dragEnter);

      setTimeout(() => {
        console.log('🎯 Dispatching dragover event...');
        mainContainer.dispatchEvent(dragOver);
      }, 100);

      setTimeout(() => {
        console.log('🎯 Dispatching drop event...');
        mainContainer.dispatchEvent(drop);
      }, 200);
    });

    console.log('⏳ Waiting to observe results...');
    await page.waitForTimeout(3000);

    console.log('✅ Test completed. Check debug logs above for drag and drop events.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('🔄 Keeping browser open for manual inspection...');
    console.log('📝 Press Ctrl+C when done...');
    // Keep browser open for manual inspection
    await new Promise(() => {}); // This will keep the process running
  }
}

testDragDropDebug().catch(console.error);