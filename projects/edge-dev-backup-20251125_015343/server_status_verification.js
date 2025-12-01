const { chromium } = require('playwright');

async function serverStatusVerification() {
  console.log('🔍 Server Status Verification - Testing localhost:5657 and Renata integration...');

  const browser = await chromium.launch({
    headless: false,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🌐 Testing server accessibility at localhost:5657...');
    await page.goto('http://localhost:5657', { waitUntil: 'networkidle', timeout: 10000 });

    console.log('⏳ Waiting for page to fully load...');
    await page.waitForTimeout(3000);

    // Test comprehensive page status
    const pageAnalysis = await page.evaluate(() => {
      // Check basic page elements
      const bodyExists = !!document.body;
      const hasContent = document.body.innerHTML.length > 100;

      // Look for the integrated right sidebar
      const rightSidebar = document.querySelector('div[style*="position: fixed"][style*="right: 0"]') ||
                          document.querySelector('div[style*="right:0"]') ||
                          document.querySelector('div[style*="width: 480px"]');

      // Look for Renata-specific elements
      const renataElements = document.querySelectorAll('[class*="renata" i], [id*="renata" i]');
      const renataText = document.body.textContent.toLowerCase().includes('renata');

      // Check for main content area with margin
      const mainContent = document.querySelector('.main-content-area, [style*="margin-right"], [style*="marginRight"]');

      return {
        server: {
          accessible: true,
          bodyExists,
          hasContent,
          title: document.title,
          url: window.location.href
        },
        layout: {
          rightSidebar: {
            found: !!rightSidebar,
            count: rightSidebar ? 1 : 0,
            styles: rightSidebar ? rightSidebar.getAttribute('style') : null,
            rect: rightSidebar ? rightSidebar.getBoundingClientRect() : null
          },
          mainContent: {
            found: !!mainContent,
            styles: mainContent ? mainContent.getAttribute('style') : null
          }
        },
        renata: {
          elementsFound: renataElements.length,
          textFound: renataText,
          elementTypes: Array.from(renataElements).map(el => ({
            tag: el.tagName,
            class: el.className,
            id: el.id
          }))
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
    });

    console.log('\n📊 SERVER & INTEGRATION STATUS:');
    console.log('='.repeat(60));

    // Server Status
    console.log('🖥️  Server Status:');
    console.log('   Accessible:', pageAnalysis.server.accessible ? '✅ YES' : '❌ NO');
    console.log('   Page Title:', pageAnalysis.server.title);
    console.log('   Content Present:', pageAnalysis.server.hasContent ? '✅ YES' : '❌ NO');
    console.log('   Current URL:', pageAnalysis.server.url);

    // Layout Status
    console.log('\n🏗️  Layout Integration:');
    console.log('   Right Sidebar Found:', pageAnalysis.layout.rightSidebar.found ? '✅ YES' : '❌ NO');
    if (pageAnalysis.layout.rightSidebar.found) {
      console.log('   Sidebar Position:', `${pageAnalysis.layout.rightSidebar.rect.width}px wide at right edge`);
      console.log('   Sidebar Styles:', pageAnalysis.layout.rightSidebar.styles?.substring(0, 100) + '...');
    }
    console.log('   Main Content Area:', pageAnalysis.layout.mainContent.found ? '✅ FOUND' : '❌ MISSING');

    // Renata Status
    console.log('\n🤖 Renata AI Status:');
    console.log('   Renata Elements:', pageAnalysis.renata.elementsFound > 0 ? `✅ ${pageAnalysis.renata.elementsFound} found` : '❌ NONE');
    console.log('   Renata Text Present:', pageAnalysis.renata.textFound ? '✅ YES' : '❌ NO');
    if (pageAnalysis.renata.elementTypes.length > 0) {
      console.log('   Element Details:', pageAnalysis.renata.elementTypes);
    }

    // Overall Assessment
    console.log('\n🎯 OVERALL STATUS:');
    const serverWorking = pageAnalysis.server.accessible && pageAnalysis.server.hasContent;
    const layoutIntegrated = pageAnalysis.layout.rightSidebar.found;
    const renataPresent = pageAnalysis.renata.elementsFound > 0 || pageAnalysis.renata.textFound;

    if (serverWorking && layoutIntegrated && renataPresent) {
      console.log('✅ SUCCESS: Server is running and Renata is integrated!');
      console.log('✅ The development environment is ready for use');
    } else if (serverWorking && !renataPresent) {
      console.log('⚠️  PARTIAL: Server working but Renata may need attention');
      console.log('📝 Renata integration may be loading or needs debugging');
    } else if (!serverWorking) {
      console.log('❌ ISSUE: Server accessibility problems detected');
      console.log('📝 Check server logs and restart if needed');
    } else {
      console.log('⚠️  MIXED: Some components working, others need attention');
    }

    // Take screenshot
    console.log('\n📸 Taking verification screenshot...');
    await page.screenshot({
      path: '/Users/michaeldurante/ai dev/ce-hub/edge-dev/server_status_verification.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: server_status_verification.png');

    console.log('\n' + '='.repeat(60));
    console.log('🏁 VERIFICATION COMPLETE');
    console.log('📋 Summary: Server accessibility and Renata integration tested');
    console.log('🔍 Check screenshot and browser for visual confirmation');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Verification failed:', error.message);

    // Still try to take a screenshot for debugging
    try {
      await page.screenshot({
        path: '/Users/michaeldurante/ai dev/ce-hub/edge-dev/server_status_verification_error.png',
        fullPage: true
      });
      console.log('📸 Error screenshot saved: server_status_verification_error.png');
    } catch (screenshotError) {
      console.log('❌ Could not save error screenshot');
    }
  } finally {
    console.log('\n🔄 Browser kept open for manual verification');
    console.log('📝 Press Ctrl+C when done reviewing...');

    // Keep browser open for manual verification
    await new Promise(() => {});
  }
}

serverStatusVerification().catch(console.error);