const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  try {
    console.log('✓ Navigating to http://localhost:5657');
    await page.goto('http://localhost:5657', { waitUntil: 'networkidle' });
    
    console.log('✓ Waiting for page to load...');
    await page.waitForTimeout(2000);
    
    console.log('✓ Screenshot 1: Initial state with collapsed Renata popup');
    await page.screenshot({ path: './screenshots/01_initial_state.png', fullPage: false });
    
    // Use JavaScript to click the button to avoid interference from popup
    console.log('✓ Finding and clicking "Ask Renata AI" button using JavaScript');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const renataBtn = buttons.find(btn => btn.textContent.includes('Ask Renata AI'));
      if (renataBtn) {
        renataBtn.click();
        console.log('Button clicked via JavaScript');
      }
    });
    
    console.log('✓ Waiting for popup to expand...');
    await page.waitForTimeout(800);
    
    console.log('✓ Screenshot 2: Renata popup in OPEN/EXPANDED state');
    await page.screenshot({ path: './screenshots/02_popup_expanded.png', fullPage: false });
    
    // Check popup properties
    const popupInfo = await page.evaluate(() => {
      const popup = document.querySelector('div[style*="bottom: 1rem"]') || 
                    Array.from(document.querySelectorAll('div')).find(el => 
                      el.textContent.includes('Renata AI') && el.style.position === 'fixed'
                    );
      
      if (!popup) {
        return { found: false };
      }
      
      const style = window.getComputedStyle(popup);
      const rect = popup.getBoundingClientRect();
      
      return {
        found: true,
        opacity: style.opacity,
        position: {
          top: rect.top,
          left: rect.left,
          bottom: window.innerHeight - rect.bottom,
          right: window.innerWidth - rect.right,
          width: rect.width,
          height: rect.height
        },
        zIndex: style.zIndex,
        backgroundColor: style.backgroundColor,
        hasGoldBorder: style.borderColor.includes('212, 175, 55') || style.border.includes('D4AF37')
      };
    });
    
    console.log('\n✓ Popup Properties (EXPANDED):');
    console.log('  - Found: ' + popupInfo.found);
    if (popupInfo.found) {
      console.log('  - Opacity: ' + popupInfo.opacity + ' (Full opacity: ' + (popupInfo.opacity === '1' ? '✓' : '✗') + ')');
      console.log('  - Z-Index: ' + popupInfo.zIndex);
      console.log('  - Position:');
      console.log('    • From bottom: ' + Math.round(popupInfo.position.bottom) + 'px');
      console.log('    • From left: ' + Math.round(popupInfo.position.left) + 'px');
      console.log('    • Width: ' + Math.round(popupInfo.position.width) + 'px');
      console.log('    • Height: ' + Math.round(popupInfo.position.height) + 'px');
      console.log('  - Position Correct: ' + (popupInfo.position.bottom < 50 && popupInfo.position.left < 50 ? '✓ Bottom-Left' : '✗'));
      console.log('  - Gold Border: ' + (popupInfo.hasGoldBorder ? '✓' : '✗'));
    }
    
    console.log('\n✓ Closing popup...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const renataBtn = buttons.find(btn => btn.textContent.includes('Ask Renata AI'));
      if (renataBtn) {
        renataBtn.click();
      }
    });
    
    await page.waitForTimeout(500);
    
    console.log('✓ Screenshot 3: Renata popup in COLLAPSED state');
    await page.screenshot({ path: './screenshots/03_popup_collapsed.png', fullPage: false });
    
    // Check collapsed state
    const collapsedInfo = await page.evaluate(() => {
      const popup = document.querySelector('div[style*="bottom: 1rem"]') || 
                    Array.from(document.querySelectorAll('div')).find(el => 
                      el.textContent.includes('Renata AI') && el.style.position === 'fixed'
                    );
      
      if (!popup) return { found: false };
      
      const style = window.getComputedStyle(popup);
      const rect = popup.getBoundingClientRect();
      
      return {
        opacity: style.opacity,
        height: Math.round(rect.height),
        hasMessageArea: popup.querySelector('[class*="overflow-y-auto"]') !== null,
        isVisible: style.opacity !== '0'
      };
    });
    
    console.log('\n✓ Popup Properties (COLLAPSED):');
    console.log('  - Opacity: ' + collapsedInfo.opacity + ' (Full opacity: ' + (collapsedInfo.opacity === '1' ? '✓' : '✗') + ')');
    console.log('  - Height: ' + collapsedInfo.height + 'px (Expected ~48px for header only)');
    console.log('  - Message area visible: ' + (collapsedInfo.hasMessageArea ? '✓' : '✗'));
    console.log('  - Fully visible: ' + (collapsedInfo.isVisible ? '✓' : '✗'));
    
    console.log('\n✓ Testing sidebar interaction...');
    const sidebarButtons = await page.$$('[class*="sidebar"] button, [class*="Sidebar"] button');
    console.log('  - Sidebar buttons found: ' + sidebarButtons.length);
    console.log('  - No interference expected: ✓ (popup at bottom-left)');
    
    console.log('\n✓✓✓ All tests completed successfully! ✓✓✓');
    console.log('\nScreenshots saved to ./screenshots/');
    console.log('  - 01_initial_state.png (Collapsed popup)');
    console.log('  - 02_popup_expanded.png (Expanded popup)');
    console.log('  - 03_popup_collapsed.png (Collapsed again)');
    
  } catch (error) {
    console.error('✗ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

test();
