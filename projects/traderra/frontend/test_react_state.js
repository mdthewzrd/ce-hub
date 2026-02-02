#!/usr/bin/env node

/**
 * Test React State Directly
 * Check if the React component state is being updated
 */

const { chromium } = require('playwright');

async function testReactState() {
  console.log('🧪 Testing React State Directly\n');
  console.log('='.repeat(70));

  let browser;
  let page;

  try {
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('\n📍 Navigating to http://localhost:6565/trades');
    await page.goto('http://localhost:6565/trades', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Function to check React state by traversing the fiber tree
    const checkReactState = async () => {
      return await page.evaluate(() => {
        // Find the AppLayout component by looking for its unique pattern
        // The sidebar div has className "fixed right-0 top-16"
        const sidebarDiv = document.querySelector('.fixed.right-0.top-16');
        if (!sidebarDiv) return { error: 'Sidebar div not found' };

        // Traverse up to find the AppLayout component
        let fiber = sidebarDiv;
        let depth = 0;
        while (fiber && depth < 50) {
          // Check for fiber key
          const fiberKey = Object.keys(fiber).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
          if (fiberKey) {
            const currentFiber = fiber[fiberKey];

            // Look for AppLayout by checking component name or state
          if (currentFiber?.type?.name === 'AppLayout' ||
              currentFiber?.elementType?.name === 'AppLayout') {

            // Found AppLayout, now extract its state
            const state = {
              componentName: currentFiber.type?.name || currentFiber.elementType?.name || 'unknown',
              memoizedState: currentFiber.memoizedState,
              memoizedProps: currentFiber.memoizedProps,
              hooks: [],
            };

            // Traverse hooks to find aiSidebarOpen
            let hookNode = currentFiber.memoizedState;
            let hookIndex = 0;
            while (hookNode && hookIndex < 20) {
              const hook = {
                index: hookIndex,
                state: hookNode.memoizedState,
                queue: hookNode.queue ? {
                  pending: hookNode.queue.pending,
                  dispatch: hookNode.queue.dispatch?.toString().substring(0, 100),
                } : null,
              };
              state.hooks.push(hook);
              hookNode = hookNode.next;
              hookIndex++;
            }

            return state;
          }
          }
          // Move up to parent
          fiber = fiber.parentElement;
          depth++;
        }

        return { error: 'AppLayout component not found in fiber tree', depth };
      });
    };

    // Check initial state
    console.log('\n🔍 Checking React state (initial)...');
    const initialState = await checkReactState();
    console.log('  Initial state:', JSON.stringify(initialState, null, 2));

    // Click toggle button
    console.log('\n🖱️  Clicking toggle button...');
    const button = await page.$('[data-testid="renata-ai-toggle-button"]');
    if (button) {
      await button.click();
      await page.waitForTimeout(500);

      console.log('\n🔍 Checking React state (after click)...');
      const afterClickState = await checkReactState();
      console.log('  State after click:', JSON.stringify(afterClickState, null, 2));
    }

    // Also check how many sidebar elements exist
    const sidebarCount = await page.evaluate(() => {
      return document.querySelectorAll('.fixed.right-0.top-16').length;
    });
    console.log(`\n  Number of sidebar elements: ${sidebarCount}`);

    // Check the parent structure
    const parentInfo = await page.evaluate(() => {
      const sidebarDiv = document.querySelector('.fixed.right-0.top-16');
      if (!sidebarDiv) return null;

      let parent = sidebarDiv.parentElement;
      const structure = [];
      while (parent && structure.length < 10) {
        structure.push({
          tagName: parent.tagName,
          className: parent.className,
          id: parent.id,
          childCount: parent.children.length,
        });
        parent = parent.parentElement;
      }
      return structure;
    });
    console.log('  Parent structure:', JSON.stringify(parentInfo, null, 2));

    console.log('\n' + '='.repeat(70));
    console.log('🔍 Keeping browser open for 20 seconds for manual inspection');
    console.log('='.repeat(70));
    await page.waitForTimeout(20000);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run test
testReactState().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
