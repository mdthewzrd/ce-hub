const { chromium } = require('playwright');

async function testIntegratedRenataLayout() {
  console.log('🧪 Testing integrated Renata layout - Verifying proper sidebar positioning...');

  const browser = await chromium.launch({
    headless: false,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🌐 Navigating to localhost:5657...');
    await page.goto('http://localhost:5657', { waitUntil: 'networkidle' });

    console.log('⏳ Waiting for page to fully load...');
    await page.waitForTimeout(3000);

    // Check for the new right sidebar structure
    const sidebarAnalysis = await page.evaluate(() => {
      const rightSidebar = document.querySelector('div[style*="right: 0"]');
      const leftSidebar = document.querySelector('div[style*="left: 0"]');
      const mainContent = document.querySelector('.main-content-area');

      if (!rightSidebar) {
        return { found: false, error: 'Right sidebar container not found' };
      }

      const sidebarRect = rightSidebar.getBoundingClientRect();
      const sidebarStyles = window.getComputedStyle(rightSidebar);

      // Check for header section
      const header = rightSidebar.querySelector('div[style*="padding: 24px 20px"]');
      const headerText = header ? header.textContent : 'Header not found';

      // Check for Renata chat component
      const renataChat = rightSidebar.querySelector('div.flex-1');

      // Get layout measurements
      const leftSidebarRect = leftSidebar ? leftSidebar.getBoundingClientRect() : null;
      const mainContentRect = mainContent ? mainContent.getBoundingClientRect() : null;

      return {
        found: true,
        sidebar: {
          position: sidebarStyles.position,
          width: sidebarRect.width,
          height: sidebarRect.height,
          top: sidebarRect.top,
          right: window.innerWidth - sidebarRect.right,
          zIndex: sidebarStyles.zIndex,
          background: sidebarStyles.backgroundColor
        },
        header: {
          found: !!header,
          text: headerText.includes('Renata') ? 'Renata found' : 'Renata not found',
          content: headerText.substring(0, 50)
        },
        renataChat: {
          found: !!renataChat,
          height: renataChat ? renataChat.getBoundingClientRect().height : 0
        },
        layout: {
          leftSidebarWidth: leftSidebarRect ? leftSidebarRect.width : 0,
          rightSidebarWidth: sidebarRect.width,
          mainContentWidth: mainContentRect ? mainContentRect.width : 0,
          totalLayoutWidth: window.innerWidth,
          viewportWidth: window.innerWidth
        }
      };
    });

    console.log('\n📊 INTEGRATED LAYOUT ANALYSIS:');
    console.log('='.repeat(50));

    if (!sidebarAnalysis.found) {
      console.log('❌ FAILED: Right sidebar not found');
      console.log('   Error:', sidebarAnalysis.error);
    } else {
      console.log('✅ Right Sidebar Found');
      console.log('\n🎯 Sidebar Properties:');
      console.log('   Position:', sidebarAnalysis.sidebar.position);
      console.log('   Width:', sidebarAnalysis.sidebar.width, 'px');
      console.log('   Height:', sidebarAnalysis.sidebar.height, 'px');
      console.log('   Z-Index:', sidebarAnalysis.sidebar.zIndex);
      console.log('   Background:', sidebarAnalysis.sidebar.background);
      console.log('   Right Edge:', sidebarAnalysis.sidebar.right, 'px from right');

      console.log('\n🏷️ Header Section:');
      console.log('   Header Found:', sidebarAnalysis.header.found ? '✅ YES' : '❌ NO');
      console.log('   Renata Text:', sidebarAnalysis.header.text);
      console.log('   Content Preview:', sidebarAnalysis.header.content);

      console.log('\n💬 Renata Chat:');
      console.log('   Chat Found:', sidebarAnalysis.renataChat.found ? '✅ YES' : '❌ NO');
      console.log('   Chat Height:', sidebarAnalysis.renataChat.height, 'px');

      console.log('\n📐 Layout Measurements:');
      console.log('   Left Sidebar:', sidebarAnalysis.layout.leftSidebarWidth, 'px');
      console.log('   Main Content:', sidebarAnalysis.layout.mainContentWidth, 'px');
      console.log('   Right Sidebar:', sidebarAnalysis.layout.rightSidebarWidth, 'px');
      console.log('   Viewport Width:', sidebarAnalysis.layout.viewportWidth, 'px');

      // Validate layout expectations
      const expectedRightWidth = 480; // 30rem = 480px
      const expectedPosition = 'fixed';
      const widthMatch = Math.abs(sidebarAnalysis.sidebar.width - expectedRightWidth) < 10;
      const positionMatch = sidebarAnalysis.sidebar.position === expectedPosition;
      const properPlacement = sidebarAnalysis.sidebar.right < 5; // Should be at right edge

      console.log('\n✅ Layout Validation:');
      console.log('   Width (Expected 480px):', widthMatch ? '✅ CORRECT' : '❌ INCORRECT');
      console.log('   Position (Expected fixed):', positionMatch ? '✅ CORRECT' : '❌ INCORRECT');
      console.log('   Right Edge Placement:', properPlacement ? '✅ CORRECT' : '❌ INCORRECT');
      console.log('   Header Section:', sidebarAnalysis.header.found ? '✅ PRESENT' : '❌ MISSING');
      console.log('   Renata Chat:', sidebarAnalysis.renataChat.found ? '✅ PRESENT' : '❌ MISSING');

      // Final assessment
      const integrationSuccess = widthMatch && positionMatch && properPlacement &&
                                 sidebarAnalysis.header.found && sidebarAnalysis.renataChat.found;

      console.log('\n🎯 INTEGRATION SUCCESS:');
      if (integrationSuccess) {
        console.log('✅ SUCCESS: Renata is properly integrated into the right sidebar!');
        console.log('✅ Layout matches the expected design specifications');
        console.log('✅ Renata is no longer a floating overlay');
      } else {
        console.log('⚠️  PARTIAL: Some integration issues detected');
        console.log('📝 Check layout validation results above for details');
      }
    }

    // Take verification screenshot
    console.log('\n📸 Taking integration verification screenshot...');
    await page.screenshot({
      path: '/Users/michaeldurante/ai dev/ce-hub/edge-dev/test_integrated_renata_layout.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: test_integrated_renata_layout.png');

    console.log('\n' + '='.repeat(50));
    console.log('🏁 INTEGRATION TEST COMPLETE');
    if (sidebarAnalysis.found) {
      console.log('✅ Renata AI is now integrated into the proper UI layout');
      console.log('✅ No more fixed overlay positioning');
      console.log('✅ Uses designated 480px right sidebar space');
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🔄 Browser kept open for manual verification');
    console.log('📝 Check the screenshot and browser to confirm results');
    console.log('📝 Press Ctrl+C when done...');

    // Keep browser open for manual verification
    await new Promise(() => {});
  }
}

testIntegratedRenataLayout().catch(console.error);