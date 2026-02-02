const puppeteer = require('puppeteer');

async function simpleTest() {
  console.log('🔍 SIMPLE MANAGE PROJECTS BUTTON TEST');
  console.log('========================================');

  let browser;
  let page;

  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });

    page = await browser.newPage();

    // Navigate to the main page
    console.log('🌐 Navigating to http://localhost:5656...');
    await page.goto('http://localhost:5656', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Page loaded');

    // Step 1: Look for Manage Projects button
    console.log('\n🔍 STEP 1: Looking for Manage Projects button...');

    const buttonFound = await page.evaluate(() => {
      // Find all buttons
      const buttons = Array.from(document.querySelectorAll('button'));

      // Look for Manage Projects button
      const manageButton = buttons.find(btn => {
        const text = btn.textContent || '';
        return text.toLowerCase().includes('manage') && text.toLowerCase().includes('projects');
      });

      if (manageButton) {
        console.log('🔘 Found Manage Projects button:', manageButton.textContent.trim());

        // Check if it's visible
        const rect = manageButton.getBoundingClientRect();
        const styles = window.getComputedStyle(manageButton);

        console.log('📏 Button position:', {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity
        });

        return {
          found: true,
          text: manageButton.textContent.trim(),
          visible: rect.width > 0 && rect.height > 0 && styles.display !== 'none'
        };
      }

      return { found: false };
    });

    if (!buttonFound.found) {
      console.log('❌ Manage Projects button not found');
      return;
    }

    if (!buttonFound.visible) {
      console.log('❌ Manage Projects button is not visible');
      return;
    }

    console.log('✅ Manage Projects button found and is visible');

    // Step 2: Try to click it
    console.log('\n🖱️ STEP 2: Clicking Manage Projects button...');

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const manageButton = buttons.find(btn => {
        const text = btn.textContent || '';
        return text.toLowerCase().includes('manage') && text.toLowerCase().includes('projects');
      });

      if (manageButton) {
        manageButton.click();
        console.log('🖱️ Clicked Manage Projects button');
        return true;
      }
      return false;
    });

    // Wait for modal to appear
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Check for modal
    console.log('\n🔍 STEP 3: Checking for modal...');

    const modalFound = await page.evaluate(() => {
      // Look for any modal-like elements
      const modals = document.querySelectorAll('[role="dialog"], .modal, .fixed.inset-0, .fixed\\:inset-0');

      console.log('🔍 Found', modals.length, 'potential modal elements');

      for (let i = 0; i < modals.length; i++) {
        const modal = modals[i];
        const styles = window.getComputedStyle(modal);
        const rect = modal.getBoundingClientRect();

        console.log(`Modal ${i + 1}:`, {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          zIndex: styles.zIndex,
          width: rect.width,
          height: rect.height,
          hasText: modal.textContent.length > 0,
          textPreview: modal.textContent.substring(0, 100)
        });

        // Check if this modal is visible
        if (styles.display !== 'none' &&
            styles.visibility !== 'hidden' &&
            parseFloat(styles.opacity) > 0 &&
            rect.width > 0 && rect.height > 0) {
          return {
            found: true,
            text: modal.textContent.substring(0, 200),
            element: modal.tagName.toLowerCase() + (modal.className ? '.' + modal.className.split(' ').join('.') : '')
          };
        }
      }

      return { found: false };
    });

    if (modalFound.found) {
      console.log('🎉 SUCCESS: Modal found!');
      console.log('📝 Modal text preview:', modalFound.text);
      console.log('🏷️ Modal element:', modalFound.element);
    } else {
      console.log('❌ No visible modal found after clicking button');

      // Check if there are any React state issues
      console.log('\n🔍 STEP 4: Checking React state...');

      const reactCheck = await page.evaluate(() => {
        // Try to find React internal state
        const root = document.querySelector('#__next');
        if (root) {
          console.log('📦 React root found');

          // Try to access React component tree (if DevTools available)
          try {
            const reactRoot = window.React || window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
            return {
              reactRoot: !!reactRoot,
              devTools: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__
            };
          } catch (e) {
            return { error: e.message };
          }
        }

        return { reactRoot: false };
      });

      console.log('📋 React check:', reactCheck);
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    // Keep browser open for inspection
    if (browser) {
      console.log('\n🎭 Browser will stay open for manual inspection...');
      console.log('💡 Close browser window to exit');
    }
  }
}

// Run the test
simpleTest();