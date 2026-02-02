const puppeteer = require('puppeteer');

async function checkScansDropdown() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });

  try {
    const page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => {
      console.log('Browser console:', msg.text());
    });

    console.log('Navigating to scanning page...');
    await page.goto('http://localhost:5665/scan', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });

    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Look for the dropdown and check if it contains the scans
    const dropdownContent = await page.evaluate(() => {
      // Check localStorage for saved scans
      const savedScans = localStorage.getItem('savedScans');
      console.log('localStorage savedScans:', savedScans);

      if (savedScans) {
        const scans = JSON.parse(savedScans);
        console.log('Parsed scans:', scans);
        return {
          count: scans.length,
          scans: scans.map(scan => ({
            name: scan.name,
            results: scan.results?.length || 0,
            date: scan.date
          }))
        };
      }
      return { count: 0, scans: [] };
    });

    console.log('Dropdown content analysis:', dropdownContent);

    // Look for dropdown elements on the page
    const dropdownExists = await page.evaluate(() => {
      const dropdowns = document.querySelectorAll('select, [role="combobox"], .dropdown, [data-testid*="scan"], [id*="scan"], button');
      return {
        count: dropdowns.length,
        elements: Array.from(dropdowns).map(el => ({
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          textContent: el.textContent?.substring(0, 100)
        }))
      };
    });

    console.log('Found dropdown elements:', dropdownExists);

    // Look for any elements containing "saved scans" or similar text
    const scanElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements
        .filter(el => el.textContent && (
          el.textContent.includes('saved scan') ||
          el.textContent.includes('NVDA') ||
          el.textContent.includes('Gap Up') ||
          el.textContent.includes('LC Patterns') ||
          el.textContent.includes('Volume Surge') ||
          el.textContent.includes('Breakout')
        ))
        .map(el => ({
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          textContent: el.textContent?.substring(0, 200)
        }));
    });

    console.log('Found scan-related elements:', scanElements);

    // Take a screenshot
    await page.screenshot({
      path: '/Users/michaeldurante/ai dev/ce-hub/scans_dropdown_screenshot.png',
      fullPage: true
    });

    console.log('Screenshot saved to scans_dropdown_screenshot.png');

    // Try to find and click on the dropdown to open it
    const dropdownSelector = 'select, [role="combobox"], .dropdown-toggle, [data-testid*="scan"], [id*="scan"]';
    const dropdownElement = await page.$(dropdownSelector);

    if (dropdownElement) {
      console.log('Found dropdown element, attempting to open it...');
      await dropdownElement.click();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Take another screenshot with dropdown open
      await page.screenshot({
        path: '/Users/michaeldurante/ai dev/ce-hub/scans_dropdown_open_screenshot.png',
        fullPage: true
      });

      console.log('Open dropdown screenshot saved');
    }

    // Try to click on buttons to reveal dropdown content
    const buttons = await page.$$('button');
    for (let i = 0; i < buttons.length; i++) {
      const buttonText = await page.evaluate(el => el.textContent, buttons[i]);
      if (buttonText && (
        buttonText.includes('scan') ||
        buttonText.includes('Load') ||
        buttonText.includes('Saved')
      )) {
        console.log(`Clicking button: ${buttonText}`);
        await buttons[i].click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.screenshot({
          path: `/Users/michaeldurante/ai dev/ce-hub/scans_button_${i}_screenshot.png`,
          fullPage: true
        });
        break;
      }
    }

    return dropdownContent;

  } catch (error) {
    console.error('Error checking dropdown:', error);
    return null;
  } finally {
    await browser.close();
  }
}

checkScansDropdown().then(result => {
  console.log('Final result:', result);
}).catch(console.error);