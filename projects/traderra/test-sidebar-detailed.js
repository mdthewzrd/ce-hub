/**
 * Detailed test to understand sidebar visibility issue
 */

const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSidebarDetailed() {
  console.log('🔍 Detailed sidebar visibility analysis...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Navigate to dashboard
    console.log('📍 Navigating to dashboard...');
    await page.goto('http://localhost:6565/dashboard');
    await sleep(4000); // Longer wait for React to settle

    // Deep analysis of the sidebar element
    const sidebarAnalysis = await page.evaluate(() => {
      // Find the sidebar element using multiple selectors
      const sidebarSelectors = [
        '.fixed.right-0.top-16.bottom-0.w-\\[480px\\]',
        '.fixed.right-0.top-16.bottom-0.w-[480px]',
        '[class*="fixed"][class*="right-0"]',
        '.fixed.right-0'
      ];

      let sidebarElement = null;
      for (const selector of sidebarSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          sidebarElement = element;
          break;
        }
      }

      if (!sidebarElement) {
        return { found: false, reason: 'No sidebar element found with any selector' };
      }

      // Get computed styles and visibility info
      const computedStyle = window.getComputedStyle(sidebarElement);
      const rect = sidebarElement.getBoundingClientRect();

      return {
        found: true,
        element: {
          tagName: sidebarElement.tagName,
          className: sidebarElement.className,
          id: sidebarElement.id,
        },
        visibility: {
          offsetParent: sidebarElement.offsetParent !== null,
          offsetWidth: sidebarElement.offsetWidth,
          offsetHeight: sidebarElement.offsetHeight,
          clientWidth: sidebarElement.clientWidth,
          clientHeight: sidebarElement.clientHeight,
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          zIndex: computedStyle.zIndex,
        },
        position: {
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        },
        isInViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth,
        hasContent: sidebarElement.innerHTML.length > 0,
        childElements: sidebarElement.children.length,
      };
    });

    console.log('🔍 Sidebar Analysis:');
    console.log(JSON.stringify(sidebarAnalysis, null, 2));

    // Check for any console errors or React hydration issues
    const consoleErrors = await page.evaluate(() => {
      const errors = [];
      const originalError = console.error;
      console.error = (...args) => {
        errors.push(args.join(' '));
        originalError.apply(console, args);
      };
      return errors;
    });

    if (consoleErrors.length > 0) {
      console.log('🚨 Console Errors Found:');
      consoleErrors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
    }

    // Take a final screenshot
    await page.screenshot({
      path: `/Users/michaeldurante/ai dev/ce-hub/projects/traderra/sidebar_detailed_analysis.png`,
      fullPage: false
    });

    console.log('\n📸 Screenshot saved: sidebar_detailed_analysis.png');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testSidebarDetailed().catch(console.error);