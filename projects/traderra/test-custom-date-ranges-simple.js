/**
 * Simple test for custom date range functionality
 */

const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCustomDateRangesSimple() {
  console.log('🚀 Starting simple custom date range testing...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Navigate to the app
    console.log('📍 Navigating to Traderra app...');
    await page.goto('http://localhost:6565');
    await sleep(5000);

    // Take screenshot to see what's on the page
    await page.screenshot({
      path: `/Users/michaeldurante/ai dev/ce-hub/projects/traderra/page_structure.png`,
      fullPage: false
    });

    // Check page title
    const title = await page.title();
    console.log('Page title:', title);

    // Look for any Renata-related elements
    const renataElements = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const renataElements = [];

      allElements.forEach(el => {
        const className = el.className || '';
        const id = el.id || '';
        const textContent = el.textContent?.slice(0, 100) || '';

        if (
          className.toLowerCase().includes('renata') ||
          id.toLowerCase().includes('renata') ||
          textContent.toLowerCase().includes('renata') ||
          className.toLowerCase().includes('chat') ||
          id.toLowerCase().includes('chat') ||
          el.tagName.toLowerCase() === 'textarea'
        ) {
          renataElements.push({
            tag: el.tagName,
            className: className,
            id: id,
            text: textContent,
            visible: el.offsetParent !== null
          });
        }
      });

      return renataElements;
    });

    console.log(`Found ${renataElements.length} potential Renata/chat elements:`);
    renataElements.forEach((el, i) => {
      console.log(`${i + 1}. ${el.tag} - ${el.className} - ${el.visible ? 'visible' : 'hidden'} - "${el.text}"`);
    });

    // Try to click on any visible textarea or input
    if (renataElements.length > 0) {
      const visibleTextarea = renataElements.find(el => el.visible && el.tag === 'TEXTAREA');
      if (visibleTextarea) {
        console.log('✅ Found visible textarea, attempting to type...');

        // Test the custom date range command
        await page.evaluate(() => {
          const textarea = document.querySelector('textarea');
          if (textarea) {
            textarea.value = 'from january 1st to january 31st';
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });

        await sleep(2000);

        // Look for send button
        const sendButtons = await page.evaluate(() => {
          const buttons = document.querySelectorAll('button');
          const sendButtons = [];

          buttons.forEach(btn => {
            const text = btn.textContent?.toLowerCase() || '';
            const className = btn.className?.toLowerCase() || '';

            if (text.includes('send') || text.includes('submit') || className.includes('send')) {
              sendButtons.push({
                text: text,
                className: className,
                visible: btn.offsetParent !== null
              });
            }
          });

          return sendButtons;
        });

        console.log(`Found ${sendButtons.length} potential send buttons:`, sendButtons);

        if (sendButtons.length > 0) {
          const visibleSendButton = sendButtons.find(btn => btn.visible);
          if (visibleSendButton) {
            await page.evaluate(() => {
              const buttons = document.querySelectorAll('button');
              for (let btn of buttons) {
                const text = btn.textContent?.toLowerCase() || '';
                if (text.includes('send') || text.includes('submit')) {
                  btn.click();
                  break;
                }
              }
            });

            console.log('✅ Clicked send button');
            await sleep(5000);

            // Take final screenshot
            await page.screenshot({
              path: `/Users/michaeldurante/ai dev/ce-hub/projects/traderra/after_command.png`,
              fullPage: false
            });

            // Check for any response in the page
            const hasResponse = await page.evaluate(() => {
              const allText = document.body.textContent || '';
              return allText.includes('I\'ll set the date range') ||
                     allText.includes('january 1st') ||
                     allText.includes('custom date');
            });

            console.log('Has response:', hasResponse);
          }
        }
      }
    }

    console.log('\n📊 Simple custom date range testing complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testCustomDateRangesSimple().catch(console.error);