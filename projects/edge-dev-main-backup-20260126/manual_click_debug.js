const puppeteer = require('puppeteer');

async function manualClickDebug() {
  console.log('🔍 MANUAL CLICK DEBUG FOR MANAGE PROJECTS');
  console.log('==========================================');

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

    // Enable console logging from the page
    page.on('console', msg => {
      console.log('📢 Browser Console:', msg.type().toUpperCase(), msg.text());
    });

    // Enable error logging
    page.on('pageerror', error => {
      console.error('❌ JavaScript Error:', error.message);
    });

    // Navigate to the main page
    console.log('🌐 Navigating to http://localhost:5656...');
    await page.goto('http://localhost:5656', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ Page loaded');

    // Find and examine the Manage Projects button
    console.log('\n🔍 STEP 1: Finding Manage Projects button...');

    const buttonInfo = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const manageButton = buttons.find(btn => {
        const text = btn.textContent || '';
        return text.toLowerCase().includes('manage') && text.toLowerCase().includes('projects');
      });

      if (manageButton) {
        // Get detailed info about the button
        const rect = manageButton.getBoundingClientRect();
        const styles = window.getComputedStyle(manageButton);
        const computedStyle = window.getComputedStyle(manageButton);

        console.log('🔘 Button Details:');
        console.log('  Text:', manageButton.textContent.trim());
        console.log('  Tag:', manageButton.tagName);
        console.log('  Classes:', manageButton.className);
        console.log('  Position:', { left: rect.left, top: rect.top, width: rect.width, height: rect.height });
        console.log('  Display:', computedStyle.display);
        console.log('  Visibility:', computedStyle.visibility);
        console.log('  Z-index:', computedStyle.zIndex);
        console.log('  Background:', computedStyle.backgroundColor);
        console.log('  Has onclick:', !!manageButton.onclick);
        console.log('  Event listeners:', getEventListeners ? getEventListeners(manageButton) : 'N/A');

        return {
          found: true,
          text: manageButton.textContent.trim(),
          position: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
          visible: rect.width > 0 && rect.height > 0,
          styles: {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            zIndex: computedStyle.zIndex,
            backgroundColor: computedStyle.backgroundColor
          }
        };
      }

      return { found: false };
    });

    if (!buttonInfo.found) {
      console.log('❌ Manage Projects button not found');
      return;
    }

    console.log('✅ Manage Projects button found:', buttonInfo);

    // Step 2: Try to simulate a more realistic click
    console.log('\n🖱️ STEP 2: Simulating realistic mouse click...');

    // Get the button position
    const buttonPos = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const manageButton = buttons.find(btn => {
        const text = btn.textContent || '';
        return text.toLowerCase().includes('manage') && text.toLowerCase().includes('projects');
      });

      if (manageButton) {
        const rect = manageButton.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          width: rect.width,
          height: rect.height
        };
      }
      return null;
    });

    if (buttonPos) {
      console.log('🎯 Clicking at position:', buttonPos);

      // Move mouse to the button
      await page.mouse.move(buttonPos.x, buttonPos.y);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Click the button
      await page.mouse.click(buttonPos.x, buttonPos.y, { delay: 100 });
      await new Promise(resolve => setTimeout(resolve, 200));

      console.log('🖱️ Mouse click completed');
    }

    // Step 3: Wait and check for modal
    console.log('\n🔍 STEP 3: Checking for modal after click...');

    await new Promise(resolve => setTimeout(resolve, 1000));

    const modalCheck = await page.evaluate(() => {
      console.log('🔍 Checking for modals...');

      // Look for modal elements
      const modals = document.querySelectorAll('[role="dialog"], .modal, .fixed.inset-0, .fixed\\:inset-0');

      console.log('📊 Found', modals.length, 'potential modal elements');

      for (let i = 0; i < modals.length; i++) {
        const modal = modals[i];
        const styles = window.getComputedStyle(modal);
        const rect = modal.getBoundingClientRect();

        const isVisible = styles.display !== 'none' &&
                         styles.visibility !== 'hidden' &&
                         parseFloat(styles.opacity) > 0 &&
                         rect.width > 0 && rect.height > 0;

        console.log(`Modal ${i + 1}:`, {
          element: modal.tagName.toLowerCase() + (modal.className ? '.' + modal.className.split(' ').join('.') : ''),
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          zIndex: styles.zIndex,
          position: styles.position,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          visible: isVisible,
          hasText: modal.textContent.length > 0,
          textLength: modal.textContent.length
        });

        if (isVisible) {
          return {
            found: true,
            text: modal.textContent.substring(0, 200),
            element: modal.tagName.toLowerCase() + (modal.className ? '.' + modal.className.split(' ').join('.') : ''),
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
          };
        }
      }

      return { found: false };
    });

    if (modalCheck.found) {
      console.log('🎉 SUCCESS: Modal is visible!');
      console.log('📝 Modal content:', modalCheck.text);
      console.log('🏷️ Modal element:', modalCheck.element);
      console.log('📏 Modal position/size:', modalCheck.rect);
    } else {
      console.log('❌ No visible modal found');

      // Check React component state
      console.log('\n🔍 STEP 4: Checking React component state...');

      const reactState = await page.evaluate(() => {
        // Try to find React internal state
        try {
          // Look for React 19 hooks
          const hasReact19 = !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
          const hasReact = !!window.React;

          // Try to find the next root
          const nextRoot = document.querySelector('#__next');
          const hasNextRoot = !!nextRoot;

          // Check if there are any React components in the DOM
          const reactElements = document.querySelectorAll('[data-reactroot]');

          return {
            hasReact19,
            hasReact,
            hasNextRoot,
            reactElementsCount: reactElements.length,
            windowReact: typeof window.React !== 'undefined',
            devTools: typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined'
          };
        } catch (e) {
          return { error: e.message };
        }
      });

      console.log('📋 React state check:', reactState);
    }

    // Step 5: Try clicking again with a different method
    console.log('\n🔁 STEP 5: Trying alternative click method...');

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const manageButton = buttons.find(btn => {
        const text = btn.textContent || '';
        return text.toLowerCase().includes('manage') && text.toLowerCase().includes('projects');
      });

      if (manageButton) {
        console.log('🔄 Triggering click event programmatically...');

        // Create and dispatch click event
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });

        manageButton.dispatchEvent(clickEvent);

        // Also try onclick directly
        if (manageButton.onclick) {
          console.log('🎯 Calling onclick directly...');
          manageButton.onclick(clickEvent);
        }

        return true;
      }
      return false;
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Final check
    const finalModalCheck = await page.evaluate(() => {
      const modals = document.querySelectorAll('[role="dialog"], .modal, .fixed.inset-0, .fixed\\:inset-0');

      for (let i = 0; i < modals.length; i++) {
        const modal = modals[i];
        const styles = window.getComputedStyle(modal);
        const rect = modal.getBoundingClientRect();

        if (styles.display !== 'none' &&
            styles.visibility !== 'hidden' &&
            parseFloat(styles.opacity) > 0 &&
            rect.width > 0 && rect.height > 0) {
          return true;
        }
      }
      return false;
    });

    console.log('\n📋 FINAL RESULT: Modal visible after second attempt:', finalModalCheck);

    if (finalModalCheck) {
      console.log('✅ SUCCESS: Modal appeared on second click!');
    } else {
      console.log('❌ STILL NO MODAL: There may be a React state or event binding issue');
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

// Run the debug
manualClickDebug();