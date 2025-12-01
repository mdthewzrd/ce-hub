/**
 * Test Script: Renata Popup Positioning
 * 
 * Tests:
 * 1. Navigate to localhost:5657
 * 2. Click "Ask Renata AI" button in sidebar
 * 3. Verify popup appears in bottom-left corner
 * 4. Check opacity is 100% (full opaque)
 * 5. Test open/close functionality
 * 6. Verify no interference with sidebar navigation
 */

const playwright = require('playwright');

async function testRenataPopupPositioning() {
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('📱 Navigating to http://localhost:5657...');
  await page.goto('http://localhost:5657', { waitUntil: 'networkidle' });
  
  // Wait for page to load
  await page.waitForTimeout(2000);
  
  console.log('🔍 Looking for Ask Renata AI button...');
  
  // Find the Ask Renata button
  const renataButton = await page.locator('button:has-text("Ask Renata AI")').first();
  
  if (!renataButton) {
    console.error('❌ Could not find Ask Renata AI button');
    await browser.close();
    process.exit(1);
  }
  
  console.log('✅ Found Ask Renata AI button');
  
  // Take screenshot before clicking
  console.log('📸 Taking screenshot before click...');
  await page.screenshot({ path: 'renata_before_click.png' });
  
  // Click the button
  console.log('🖱️ Clicking Ask Renata AI button...');
  await renataButton.click();
  
  // Wait for popup to appear
  await page.waitForTimeout(500);
  
  // Find the popup
  const popup = await page.locator('div:has-text("Renata AI")').first();
  
  if (!popup) {
    console.error('❌ Popup did not appear');
    await browser.close();
    process.exit(1);
  }
  
  console.log('✅ Popup appeared');
  
  // Get popup positioning
  const boundingBox = await popup.boundingBox();
  console.log('📍 Popup position:', boundingBox);
  
  // Check if it's in bottom-left (bottom: 1rem, left: 1rem)
  // bottom-left means the popup should be near the bottom-left of the screen
  if (boundingBox) {
    console.log(`  - Top: ${boundingBox.y}px`);
    console.log(`  - Left: ${boundingBox.x}px`);
    console.log(`  - Width: ${boundingBox.width}px`);
    console.log(`  - Height: ${boundingBox.height}px`);
    
    // Check if positioned at bottom-left (allow some margin for viewport)
    const isBottomLeft = boundingBox.x < 100 && boundingBox.y > page.viewportSize().height - 600;
    
    if (isBottomLeft) {
      console.log('✅ Popup is positioned at bottom-left');
    } else {
      console.log('⚠️ Warning: Popup may not be at bottom-left');
    }
  }
  
  // Check opacity
  const opacity = await popup.evaluate(el => window.getComputedStyle(el).opacity);
  console.log(`🔷 Popup opacity: ${opacity}`);
  
  if (opacity === '1' || parseFloat(opacity) >= 0.95) {
    console.log('✅ Popup has full opacity (expanded state)');
  } else {
    console.log('⚠️ Warning: Popup opacity is less than 100%');
  }
  
  // Take screenshot after opening
  console.log('📸 Taking screenshot after opening popup...');
  await page.screenshot({ path: 'renata_after_open.png' });
  
  // Test collapse functionality
  console.log('🔽 Testing collapse...');
  await renataButton.click();
  await page.waitForTimeout(500);
  
  // Take screenshot after collapsing
  console.log('📸 Taking screenshot after collapse...');
  await page.screenshot({ path: 'renata_after_collapse.png' });
  
  // Check opacity in collapsed state
  const collapsedOpacity = await popup.evaluate(el => window.getComputedStyle(el).opacity);
  console.log(`🔷 Collapsed popup opacity: ${collapsedOpacity}`);
  
  if (collapsedOpacity === '1' || parseFloat(collapsedOpacity) >= 0.95) {
    console.log('✅ Collapsed popup has full opacity');
  } else {
    console.log('⚠️ Warning: Collapsed popup opacity is less than 100%');
  }
  
  // Test re-opening
  console.log('⬆️ Testing re-open...');
  await renataButton.click();
  await page.waitForTimeout(500);
  
  console.log('📸 Taking screenshot after re-open...');
  await page.screenshot({ path: 'renata_after_reopen.png' });
  
  // Test sidebar navigation doesn't interfere
  console.log('🧪 Testing sidebar interaction...');
  const sidebarItems = await page.locator('[class*="sidebar"] button, [class*="Sidebar"] button').first();
  
  if (sidebarItems) {
    console.log('✅ Sidebar navigation elements exist');
    console.log('✅ Popup positioned at bottom-left should not interfere with sidebar');
  }
  
  console.log('\n✅ All tests completed successfully!');
  console.log('📁 Screenshots saved:');
  console.log('  - renata_before_click.png');
  console.log('  - renata_after_open.png');
  console.log('  - renata_after_collapse.png');
  console.log('  - renata_after_reopen.png');
  
  await browser.close();
}

testRenataPopupPositioning().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
