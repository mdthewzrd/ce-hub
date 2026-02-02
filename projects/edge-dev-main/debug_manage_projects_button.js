const puppeteer = require('puppeteer');

async function debugManageProjectsButton() {
  console.log('🐛 DEBUGGING MANAGE PROJECTS BUTTON');
  console.log('=====================================');

  let browser;
  let page;

  try {
    // Launch browser
    console.log('🚀 Launching browser...');
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
    console.log('🌐 Navigating to main page http://localhost:5656...');
    await page.goto('http://localhost:5656', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for the page to load
    await page.waitForTimeout(3000);
    console.log('✅ Page loaded successfully');

    // Look for the Manage Projects button specifically
    console.log('\n🔍 STEP 1: Finding Manage Projects button...');

    const buttonInfo = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      const manageButton = buttons.find(btn => {
        const text = btn.textContent || '';
        return text.toLowerCase().includes('manage') && text.toLowerCase().includes('projects');
      });

      if (manageButton) {
        const styles = window.getComputedStyle(manageButton);
        const rect = manageButton.getBoundingClientRect();

        return {
          found: true,
          text: manageButton.textContent.trim(),
          className: manageButton.className,
          onClick: manageButton.onclick ? 'has onclick' : 'no onclick',
          isVisible: styles.display !== 'none' && styles.visibility !== 'hidden',
          rect: {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
          },
          styles: {
            display: styles.display,
            visibility: styles.visibility,
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            borderRadius: styles.borderRadius
          }
        };
      }

      return { found: false };
    });

    console.log('📊 Manage Projects Button Analysis:', JSON.stringify(buttonInfo, null, 2));

    if (!buttonInfo.found) {
      console.log('❌ ERROR: Manage Projects button not found!');
      return;
    }

    if (!buttonInfo.isVisible) {
      console.log('❌ ERROR: Manage Projects button is not visible!');
      return;
    }

    console.log('✅ Manage Projects button found and is visible');

    // Step 2: Check if React state is working by looking for modal
    console.log('\n🔍 STEP 2: Checking for ManageProjectsModal component...');

    const modalCheck = await page.evaluate(() => {
      // Check if modal exists in DOM (even when hidden)
      const modals = document.querySelectorAll('[role="dialog"], .modal, .fixed.inset-0');
      const manageProjectsModal = Array.from(modals).find(modal => {
        const text = modal.textContent || '';
        return text.includes('Manage Projects') || text.includes('manage projects');
      });

      // Check if React DevTools is available
      const reactRoot = document.querySelector('[data-reactroot]') || document.querySelector('#__next');

      return {
        modalCount: modals.length,
        manageProjectsModalFound: !!manageProjectsModal,
        reactRootFound: !!reactRoot,
        allModals: Array.from(modals).map(m => ({
          hasText: m.textContent.length > 0,
          isHidden: m.style.display === 'none' || m.style.visibility === 'hidden'
        }))
      };
    });

    console.log('📋 Modal Check:', JSON.stringify(modalCheck, null, 2));

    // Step 3: Try clicking the button and monitor for modal appearance
    console.log('\n🔍 STEP 3: Clicking Manage Projects button...');

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      const manageButton = buttons.find(btn => {
        const text = btn.textContent || '';
        return text.toLowerCase().includes('manage') && text.toLowerCase().includes('projects');
      });

      if (manageButton) {
        console.log('🖱️ Clicking Manage Projects button...');
        manageButton.click();
      }
    });

    // Wait for potential modal to appear
    await page.waitForTimeout(2000);

    // Check if modal appeared
    const modalAfterClick = await page.evaluate(() => {
      const modals = document.querySelectorAll('[role="dialog"], .modal, .fixed.inset-0');
      const visibleModal = Array.from(modals).find(modal => {
        const styles = window.getComputedStyle(modal);
        return styles.display !== 'none' &&
               styles.visibility !== 'hidden' &&
               styles.opacity !== '0';
      });

      if (visibleModal) {
        return {
          modalAppeared: true,
          modalText: visibleModal.textContent.substring(0, 200),
          modalStyles: {
            display: window.getComputedStyle(visibleModal).display,
            visibility: window.getComputedStyle(visibleModal).visibility,
            opacity: window.getComputedStyle(visibleModal).opacity,
            zIndex: window.getComputedStyle(visibleModal).zIndex
          }
        };
      }

      return { modalAppeared: false };
    });

    console.log('📋 After Click Check:', JSON.stringify(modalAfterClick, null, 2));

    if (modalAfterClick.modalAppeared) {
      console.log('🎉 SUCCESS: Manage Projects modal appeared!');
    } else {
      console.log('❌ ISSUE: Manage Projects modal did not appear after click');

      // Try to debug React state
      console.log('\n🔍 STEP 4: Checking React state...');

      const reactStateCheck = await page.evaluate(() => {
        // Try to access React DevTools or check for React components
        try {
          // Look for React hooks or state in the DOM
          const hasNextData = !!document.querySelector('#__NEXT_DATA__');
          const hasNextApp = !!document.querySelector('div[data-next-route=""]');

          // Try to find any state-related attributes
          const elementsWithData = document.querySelectorAll('[data-state], [data-modal-open]');

          return {
            hasNextData,
            hasNextApp,
            elementsWithDataCount: elementsWithData.length
          };
        } catch (e) {
          return { error: e.message };
        }
      });

      console.log('📋 React State Check:', JSON.stringify(reactStateCheck, null, 2));
    }

  } catch (error) {
    console.error('❌ DEBUG ERROR:', error.message);
  } finally {
    // Keep browser open for manual inspection
    if (browser) {
      console.log('\n🎭 Browser will stay open for manual inspection...');
      console.log('💡 Close browser window to exit');
      // Don't close the browser automatically
    }
  }
}

// Run the debugging
debugManageProjectsButton();