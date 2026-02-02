/**
 * Quick Dashboard Check
 * Simple test to see current dashboard state
 */

const { chromium } = require('playwright');

async function quickDashboardCheck() {
  console.log('🔍 Quick Dashboard Check...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('📍 Going to dashboard...');
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForTimeout(3000);

    // Check for any Renata references
    const pageContent = await page.evaluate(() => {
      return {
        hasRenataAI: document.body.innerHTML.includes('Renata AI'),
        hasStandaloneChat: document.body.innerHTML.includes('Standalone Trading Assistant'),
        hasAguiChat: document.body.innerHTML.includes('AGUI'),
        allText: document.body.innerText.substring(0, 500), // First 500 chars
        totalButtons: document.querySelectorAll('button').length
      };
    });

    console.log('📋 Dashboard Content Check:', JSON.stringify(pageContent, null, 2));

    // Wait so user can see the page
    console.log('⏳ Page will stay open for 10 seconds so you can see the current state...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.log('💥 Error:', error.message);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  quickDashboardCheck().then(() => process.exit(0));
}

module.exports = { quickDashboardCheck };