const puppeteer = require('puppeteer');

async function debugModalRendering() {
  console.log('🐛 DEBUGGING MANAGE PROJECTS MODAL RENDERING');
  console.log('===============================================');

  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });

    page = await browser.newPage();

    // Enable comprehensive console logging
    page.on('console', msg => {
      console.log('📢 Browser Console:', msg.text());
    });

    // Enable request/response debugging
    page.on('response', response => {
      if (response.url().includes('projects') || response.url().includes('api')) {
        console.log('🌐 API Response:', response.url(), response.status());
      }
    });

    // Navigate to the main page
    console.log('🌐 Navigating to http://localhost:5656...');
    await page.goto('http://localhost:5656', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ Page loaded');

    // Step 1: Check if ManageProjectsModal is actually imported in the page
    console.log('\n🔍 STEP 1: Checking if ManageProjectsModal component is loaded...');

    const componentCheck = await page.evaluate(() => {
      // Check if the modal component exists in the React component tree
      const modalElements = document.querySelectorAll('[class*="ManageProjectsModal"]');
      const hasModalImports = document.querySelector('script[src*="ManageProjectsModal"]') ||
                             document.querySelector('[data-react-component*="ManageProjectsModal"]');

      console.log('Modal DOM elements found:', modalElements.length);
      console.log('Modal imports detected:', !!hasModalImports);

      return {
        modalElementCount: modalElements.length,
        hasModalImports: !!hasModalImports,
        bodyContent: document.body.innerHTML.includes('ManageProjectsModal'),
        reactReady: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || !!window.React
      };
    });

    console.log('📋 Component Check Results:', componentCheck);

    // Step 2: Check if the button exists and is clickable
    console.log('\n🔍 STEP 2: Analyzing Manage Projects button...');

    const buttonAnalysis = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const manageButton = buttons.find(btn => {
        const text = btn.textContent || '';
        return text.toLowerCase().includes('manage') && text.toLowerCase().includes('projects');
      });

      if (manageButton) {
        const rect = manageButton.getBoundingClientRect();
        const styles = window.getComputedStyle(manageButton);
        const eventListeners = manageButton.onclick ? 'has onclick' : 'no onclick';

        // Check React event listeners
        const reactProps = manageButton._reactInternalFiber || manageButton.__reactInternalInstance;

        return {
          found: true,
          text: manageButton.textContent.trim(),
          visible: rect.width > 0 && rect.height > 0 && styles.display !== 'none',
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          styles: {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            pointerEvents: styles.pointerEvents
          },
          hasOnClick: !!manageButton.onclick,
          eventListeners,
          hasReactProps: !!reactProps,
          className: manageButton.className
        };
      }

      return { found: false };
    });

    console.log('🔘 Button Analysis:', JSON.stringify(buttonAnalysis, null, 2));

    if (!buttonAnalysis.found) {
      console.log('❌ Manage Projects button not found in DOM');
      return;
    }

    // Step 3: Click the button and monitor React state changes
    console.log('\n🔍 STEP 3: Clicking button and monitoring state...');

    await page.evaluate(() => {
      // Add a global variable to track modal state
      window.modalStateTracker = {
        beforeClick: null,
        afterClick: null,
        modalElements: []
      };
    });

    // Monitor for DOM changes after click
    const domChanges = await page.evaluate((buttonAnalysis) => {
      return new Promise((resolve) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const manageButton = buttons.find(btn => {
          const text = btn.textContent || '';
          return text.toLowerCase().includes('manage') && text.toLowerCase().includes('projects');
        });

        if (manageButton) {
          // Record state before click
          window.modalStateTracker.beforeClick = {
            modalCount: document.querySelectorAll('[role="dialog"], .modal, .fixed.inset-0').length,
            bodyOverflow: document.body.style.overflow
          };

          // Click the button
          manageButton.click();

          // Wait a bit for React to render
          setTimeout(() => {
            // Record state after click
            window.modalStateTracker.afterClick = {
              modalCount: document.querySelectorAll('[role="dialog"], .modal, .fixed.inset-0').length,
              bodyOverflow: document.body.style.overflow,
              hasModalOpen: document.body.style.overflow === 'hidden'
            };

            // Check for modal elements
            const modalElements = Array.from(document.querySelectorAll('[role="dialog"], .modal, .fixed.inset-0'));
            window.modalStateTracker.modalElements = modalElements.map(el => ({
              tagName: el.tagName,
              className: el.className,
              display: window.getComputedStyle(el).display,
              visibility: window.getComputedStyle(el).visibility,
              opacity: window.getComputedStyle(el).opacity,
              hasContent: el.textContent.length > 0,
              contentPreview: el.textContent.substring(0, 100)
            }));

            resolve(window.modalStateTracker);
          }, 2000);
        } else {
          resolve({ error: 'Button not found' });
        }
      });
    }, buttonAnalysis);

    console.log('📊 State Change Analysis:', JSON.stringify(domChanges, null, 2));

    // Step 4: Check for React errors or warnings
    console.log('\n🔍 STEP 4: Checking for React errors...');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 5: Final verification - look for the modal with all possible selectors
    console.log('\n🔍 STEP 5: Final modal verification...');

    const finalCheck = await page.evaluate(() => {
      // Try all possible modal selectors
      const selectors = [
        '[role="dialog"]',
        '.modal',
        '.fixed.inset-0',
        '[class*="fixed"][class*="inset"]',
        'div[class*="modal"]',
        '[data-modal="true"]',
        '[aria-modal="true"]'
      ];

      const results = [];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);

        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          const styles = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();

          // Check if this could be our Manage Projects modal
          const text = el.textContent || '';
          const isManageProjectsModal = text.includes('Manage Projects') ||
                                       text.includes('Active') ||
                                       text.includes('Completed') ||
                                       text.includes('Archived') ||
                                       text.includes('New Project');

          const isVisible = styles.display !== 'none' &&
                           styles.visibility !== 'hidden' &&
                           parseFloat(styles.opacity) > 0 &&
                           rect.width > 0 &&
                           rect.height > 0;

          results.push({
            selector,
            index: i,
            isVisible,
            isManageProjectsModal,
            text: text.substring(0, 150),
            zIndex: styles.zIndex,
            position: styles.position,
            display: styles.display,
            rect: { width: rect.width, height: rect.height }
          });
        }
      }

      // Also check for React component state in console
      return {
        totalModalsFound: results.length,
        visibleModals: results.filter(r => r.isVisible).length,
        manageProjectsModals: results.filter(r => r.isManageProjectsModal).length,
        results
      };
    });

    console.log('🎯 Final Check Results:', JSON.stringify(finalCheck, null, 2));

    if (finalCheck.manageProjectsModals > 0) {
      console.log('🎉 SUCCESS: Manage Projects modal is present!');
    } else {
      console.log('❌ ISSUE: Manage Projects modal is not rendering');
      console.log('💡 This suggests a React state or component rendering issue');
    }

    // Keep browser open for manual inspection
    console.log('\n🎭 Browser will stay open for manual inspection...');
    console.log('💡 Close browser window to exit');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the debug
debugModalRendering();