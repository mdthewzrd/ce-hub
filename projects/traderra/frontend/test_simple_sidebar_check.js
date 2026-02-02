/**
 * Simple Sidebar Check
 * Quick test to show where the reset button is located
 */

const { chromium } = require('playwright');

async function testSimpleSidebarCheck() {
  console.log('🔍 Simple Sidebar Check...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('📍 Going to main page first...');
    await page.goto('http://localhost:6565/', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Check which page we're on
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    // Try going to dashboard
    console.log('📍 Trying to navigate to dashboard...');
    await page.goto('http://localhost:6565/dashboard', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'current_page_state.png', fullPage: true });

    // Look for any buttons in the page
    const pageButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return {
        totalButtons: buttons.length,
        buttons: buttons.slice(0, 20).map(btn => ({ // First 20 buttons
          text: btn.textContent?.trim(),
          title: btn.title,
          className: btn.className,
          id: btn.id,
          hasIcon: !!btn.querySelector('svg'),
          visible: btn.offsetParent !== null
        }))
      };
    });

    console.log('🔍 Page Analysis:');
    console.log(`   Total buttons found: ${pageButtons.totalButtons}`);
    console.log('   First 20 buttons:', JSON.stringify(pageButtons.buttons, null, 2));

    // Look specifically for Brain/AI related elements
    const aiElements = await page.evaluate(() => {
      const brains = document.querySelectorAll('[class*="brain"], svg');
      const aiText = Array.from(document.querySelectorAll('*')).filter(el =>
        el.textContent?.toLowerCase().includes('ai') ||
        el.textContent?.toLowerCase().includes('renata')
      );

      return {
        brainElements: brains.length,
        aiTextElements: aiText.length,
        hasRenata: document.body.innerHTML.includes('Renata'),
        hasBrain: document.body.innerHTML.includes('Brain')
      };
    });

    console.log('🧠 AI Elements:', aiElements);

  } catch (error) {
    console.log('💥 Error:', error.message);
  } finally {
    console.log('\n💡 KEY INSIGHT:');
    console.log('   The reset button is in the RENATA CHAT SIDEBAR');
    console.log('   You need to OPEN the chat sidebar to see it');
    console.log('   Look for a Brain 🧠 or AI button in the top navigation');

    await page.waitForTimeout(5000);
    await browser.close();
  }
}

if (require.main === module) {
  testSimpleSidebarCheck().then(() => process.exit(0));
}

module.exports = { testSimpleSidebarCheck };