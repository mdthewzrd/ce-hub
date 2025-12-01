const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  try {
    console.log('✓ Navigating to http://localhost:5657');
    await page.goto('http://localhost:5657', { waitUntil: 'networkidle' });
    
    console.log('✓ Waiting for page to load...');
    await page.waitForTimeout(3000);
    
    console.log('✓ Taking screenshot of initial state');
    await page.screenshot({ path: './screenshots/01_initial_state.png', fullPage: false });
    
    console.log('✓ Looking for "Ask Renata AI" button');
    const renataBtn = await page.$('button:has-text("Ask Renata AI")');
    
    if (!renataBtn) {
      console.log('✗ Could not find "Ask Renata AI" button');
      const buttons = await page.$$('button');
      console.log('✓ Found ' + buttons.length + ' buttons');
      for (let i = 0; i < Math.min(5, buttons.length); i++) {
        const text = await buttons[i].textContent();
        console.log('  Button ' + i + ': ' + (text ? text.trim().substring(0, 50) : 'empty'));
      }
    } else {
      console.log('✓ Found "Ask Renata AI" button');
      console.log('✓ Clicking "Ask Renata AI" button');
      await renataBtn.click();
      
      console.log('✓ Waiting for popup to appear');
      await page.waitForTimeout(1000);
      
      console.log('✓ Taking screenshot after clicking (popup open)');
      await page.screenshot({ path: './screenshots/02_popup_open.png', fullPage: false });
      
      console.log('✓ Clicking button again to collapse');
      await renataBtn.click();
      await page.waitForTimeout(500);
      
      console.log('✓ Taking screenshot after collapse');
      await page.screenshot({ path: './screenshots/03_popup_collapsed.png', fullPage: false });
      
      console.log('✓ Re-opening popup');
      await renataBtn.click();
      await page.waitForTimeout(500);
      
      console.log('✓ Taking screenshot after re-open');
      await page.screenshot({ path: './screenshots/04_popup_reopened.png', fullPage: false });
    }
    
    console.log('\n✓✓✓ Test completed! ✓✓✓');
    
  } catch (error) {
    console.error('✗ Test error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

test();
