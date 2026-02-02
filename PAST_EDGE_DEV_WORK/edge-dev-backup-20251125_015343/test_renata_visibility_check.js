const { chromium } = require('playwright');

async function testRenataVisibility() {
  console.log('🚀 Testing Renata AI visibility...');

  const browser = await chromium.launch({
    headless: false,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('📱 Navigating to localhost:5657...');
    await page.goto('http://localhost:5657', { waitUntil: 'networkidle' });

    console.log('⏳ Waiting for page to fully load...');
    await page.waitForTimeout(5000);

    console.log('🔍 Searching for Renata AI component...');

    const renataAnalysis = await page.evaluate(() => {
      // Look for any text containing "Renata"
      const allText = document.body.textContent || '';
      const hasRenataText = allText.toLowerCase().includes('renata');

      // Look for specific Renata-related elements
      const renataElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        return text.toLowerCase().includes('renata') ||
               el.className.toLowerCase().includes('renata') ||
               el.id.toLowerCase().includes('renata');
      });

      // Look for chat-like components
      const chatElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        const className = el.className || '';
        return text.toLowerCase().includes('chat') ||
               className.toLowerCase().includes('chat') ||
               text.toLowerCase().includes('ai') ||
               className.toLowerCase().includes('ai');
      });

      // Look for common chat UI patterns
      const textareas = document.querySelectorAll('textarea');
      const inputs = document.querySelectorAll('input[type="text"]');
      const buttons = Array.from(document.querySelectorAll('button')).filter(btn =>
        btn.textContent && (
          btn.textContent.toLowerCase().includes('send') ||
          btn.textContent.toLowerCase().includes('submit') ||
          btn.textContent.toLowerCase().includes('chat')
        )
      );

      return {
        hasRenataText,
        renataElementsCount: renataElements.length,
        chatElementsCount: chatElements.length,
        textareasCount: textareas.length,
        textInputsCount: inputs.length,
        chatButtonsCount: buttons.length,
        renataElementsInfo: renataElements.slice(0, 3).map(el => ({
          tagName: el.tagName,
          className: el.className,
          textContent: (el.textContent || '').substring(0, 100)
        })),
        chatElementsInfo: chatElements.slice(0, 3).map(el => ({
          tagName: el.tagName,
          className: el.className,
          textContent: (el.textContent || '').substring(0, 100)
        })),
        bodyHTML: document.body.innerHTML.length
      };
    });

    console.log('\n📊 Renata Visibility Analysis:');
    console.log('   Has Renata Text:', renataAnalysis.hasRenataText ? '✅ YES' : '❌ NO');
    console.log('   Renata Elements Found:', renataAnalysis.renataElementsCount);
    console.log('   Chat Elements Found:', renataAnalysis.chatElementsCount);
    console.log('   Textareas Found:', renataAnalysis.textareasCount);
    console.log('   Text Inputs Found:', renataAnalysis.textInputsCount);
    console.log('   Chat Buttons Found:', renataAnalysis.chatButtonsCount);

    if (renataAnalysis.renataElementsCount > 0) {
      console.log('\n🎯 Renata Elements Details:');
      renataAnalysis.renataElementsInfo.forEach((el, i) => {
        console.log(`   ${i + 1}. ${el.tagName} - ${el.className} - "${el.textContent}"`);
      });
    }

    if (renataAnalysis.chatElementsCount > 0) {
      console.log('\n💬 Chat Elements Details:');
      renataAnalysis.chatElementsInfo.forEach((el, i) => {
        console.log(`   ${i + 1}. ${el.tagName} - ${el.className} - "${el.textContent}"`);
      });
    }

    // Check if page is actually loading properly
    console.log('\n📋 Page Loading Check:');
    console.log('   Body HTML Length:', renataAnalysis.bodyHTML, 'characters');

    if (renataAnalysis.bodyHTML < 1000) {
      console.log('⚠️ WARNING: Page might not be loading properly (very small HTML)');
    }

    // Take a screenshot for visual verification
    console.log('\n📸 Taking screenshot for visual verification...');
    await page.screenshot({
      path: '/Users/michaeldurante/ai dev/ce-hub/edge-dev/renata_visibility_check.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: renata_visibility_check.png');

    // Final assessment
    console.log('\n🎯 Final Assessment:');
    if (renataAnalysis.hasRenataText || renataAnalysis.renataElementsCount > 0) {
      console.log('✅ SUCCESS: Renata AI component appears to be present in the page');
    } else if (renataAnalysis.chatElementsCount > 0 || renataAnalysis.textareasCount > 0) {
      console.log('⚠️ PARTIAL: Chat-like components found, but no explicit Renata branding');
    } else {
      console.log('❌ ISSUE: No Renata AI or chat components found on the page');
      console.log('   This suggests either:');
      console.log('   1. The component is not rendering properly');
      console.log('   2. The page is not loading correctly');
      console.log('   3. The component might be hidden or styled with display:none');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🔄 Keeping browser open for manual inspection...');
    console.log('📝 You can now manually verify what\'s actually on the page');
    console.log('📝 Press Ctrl+C when done...');
    // Keep browser open for manual inspection
    await new Promise(() => {}); // This will keep the process running
  }
}

testRenataVisibility().catch(console.error);