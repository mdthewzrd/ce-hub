/**
 * Debug Standalone Chat Test
 * Verify which chat system is actually receiving messages
 */

const { chromium } = require('playwright');

async function testStandaloneChatDebug() {
  console.log('🔍 Debugging Standalone Chat...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to statistics page
    console.log('📍 Navigating to statistics page...');
    await page.goto('http://localhost:6565/statistics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check what chat components are present
    const chatInfo = await page.evaluate(() => {
      // Look for any chat-related elements
      const chatElements = Array.from(document.querySelectorAll('*')).filter(el =>
        el.className.toLowerCase().includes('chat') ||
        el.id.toLowerCase().includes('chat') ||
        el.textContent?.includes('Renata') ||
        el.textContent?.includes('Ask')
      );

      // Look for specific chat components
      const standaloneChat = !!document.querySelector('[class*="standalone"]');
      const aguiChat = !!document.querySelector('[class*="agui"]');
      const copilotKit = !!document.querySelector('[class*="copilot"]');

      // Look for textareas and their properties
      const textareas = Array.from(document.querySelectorAll('textarea')).map(t => ({
        placeholder: t.placeholder,
        className: t.className,
        id: t.id,
        parent: t.parentElement?.className,
        grandparent: t.parentElement?.parentElement?.className
      }));

      return {
        chatElementsCount: chatElements.length,
        standaloneChat,
        aguiChat,
        copilotKit,
        textareas,
        hasStandaloneRenataChat: !!window.StandaloneRenataChat,
        hasRenataInDOM: document.body.innerHTML.includes('Renata'),
        chatKeywords: document.body.innerHTML.match(/chat|renata|standalone/gi) || []
      };
    });

    console.log('🔍 Chat component analysis:', JSON.stringify(chatInfo, null, 2));

    // Look for the textarea specifically
    const textarea = await page.$('textarea[placeholder*="Ask Renata"]');
    if (textarea) {
      console.log('✅ Found Renata chat textarea');

      // Type a test message and monitor console
      console.log('💬 Sending test message: "test ytd"');
      await textarea.fill('test ytd');
      await textarea.press('Enter');

      // Wait and check console
      await page.waitForTimeout(2000);

      // Get console messages from the page
      const logs = await page.evaluate(() => {
        return window.console.history || [];
      });

      console.log('📝 Page console logs:', logs);
    } else {
      console.log('❌ Renata chat textarea not found');
    }

  } catch (error) {
    console.log('💥 Debug test error:', error.message);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  testStandaloneChatDebug().then(() => process.exit(0));
}

module.exports = { testStandaloneChatDebug };