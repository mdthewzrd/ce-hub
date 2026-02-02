const { chromium } = require('playwright');

async function debugRenataVisibility() {
  console.log('🔍 Debugging Renata AI component visibility...');

  const browser = await chromium.launch({
    headless: false,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });

  try {
    console.log('📱 Navigating to localhost:5657...');
    await page.goto('http://localhost:5657', { waitUntil: 'networkidle' });

    console.log('⏳ Waiting for page to fully load...');
    await page.waitForTimeout(5000);

    // Debug Renata container
    const renataDebug = await page.evaluate(() => {
      // Find the Renata container
      const containers = Array.from(document.querySelectorAll('div')).filter(div =>
        div.className && div.className.includes('fixed') && div.className.includes('top-4')
      );

      let renataContainer = null;
      let aguiComponent = null;

      if (containers.length > 0) {
        renataContainer = containers[0];
        aguiComponent = renataContainer.querySelector('*');
      }

      return {
        containerFound: !!renataContainer,
        containerClasses: renataContainer ? renataContainer.className : null,
        containerStyle: renataContainer ? window.getComputedStyle(renataContainer) : null,
        containerRect: renataContainer ? renataContainer.getBoundingClientRect() : null,
        hasChildren: renataContainer ? renataContainer.children.length : 0,
        childrenInfo: renataContainer ? Array.from(renataContainer.children).map(child => ({
          tagName: child.tagName,
          className: child.className,
          text: child.textContent ? child.textContent.substring(0, 100) : '',
          visible: window.getComputedStyle(child).display !== 'none',
          opacity: window.getComputedStyle(child).opacity,
          rect: child.getBoundingClientRect()
        })) : []
      };
    });

    console.log('\n📊 Renata Container Debug Info:');
    console.log('   Container Found:', renataDebug.containerFound ? '✅ YES' : '❌ NO');

    if (renataDebug.containerFound) {
      console.log('   Container Classes:', renataDebug.containerClasses);
      console.log('   Container Position:', {
        top: renataDebug.containerRect.top,
        right: renataDebug.containerRect.right,
        width: renataDebug.containerRect.width,
        height: renataDebug.containerRect.height
      });
      console.log('   Has Children:', renataDebug.hasChildren);

      if (renataDebug.childrenInfo.length > 0) {
        console.log('\n🔍 Child Component Info:');
        renataDebug.childrenInfo.forEach((child, i) => {
          console.log(`   Child ${i + 1}:`, {
            tag: child.tagName,
            class: child.className,
            visible: child.visible,
            opacity: child.opacity,
            hasText: child.text.length > 0,
            position: `${child.rect.width}x${child.rect.height} at (${child.rect.top}, ${child.rect.left})`
          });
        });
      }
    }

    // Check for specific Renata-related elements
    const renataElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        const className = el.className || '';
        return text.toLowerCase().includes('renata') ||
               className.toLowerCase().includes('renata') ||
               text.toLowerCase().includes('ai assistant');
      });

      return elements.map(el => ({
        tagName: el.tagName,
        className: el.className,
        text: (el.textContent || '').substring(0, 200),
        visible: window.getComputedStyle(el).display !== 'none',
        rect: el.getBoundingClientRect()
      }));
    });

    console.log('\n🎯 Renata-related Elements:');
    renataElements.forEach((el, i) => {
      console.log(`   Element ${i + 1}:`, {
        tag: el.tagName,
        visible: el.visible,
        text: el.text.substring(0, 50) + '...',
        position: `${el.rect.width}x${el.rect.height}`
      });
    });

    // Take screenshot
    console.log('\n📸 Taking debug screenshot...');
    await page.screenshot({
      path: '/Users/michaeldurante/ai dev/ce-hub/edge-dev/renata_debug.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: renata_debug.png');

    // Add a temporary red border to the Renata container for visibility
    await page.evaluate(() => {
      const containers = Array.from(document.querySelectorAll('div')).filter(div =>
        div.className && div.className.includes('fixed') && div.className.includes('top-4')
      );

      if (containers.length > 0) {
        containers[0].style.border = '5px solid red';
        containers[0].style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        console.log('🔴 Added red border to Renata container for visibility');
      }
    });

    await page.waitForTimeout(2000);

    console.log('\n📸 Taking highlighted screenshot...');
    await page.screenshot({
      path: '/Users/michaeldurante/ai dev/ce-hub/edge-dev/renata_debug_highlighted.png',
      fullPage: true
    });

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    console.log('\n🔄 Keeping browser open for manual inspection...');
    console.log('📝 Check the screenshots and browser to debug the issue');
    console.log('📝 Press Ctrl+C when done...');
    await new Promise(() => {}); // Keep browser open
  }
}

debugRenataVisibility().catch(console.error);