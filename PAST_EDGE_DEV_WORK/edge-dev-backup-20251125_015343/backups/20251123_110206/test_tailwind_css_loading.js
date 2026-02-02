const { chromium } = require('playwright');

async function testTailwindCSSLoading() {
  console.log('🚀 Testing Tailwind CSS loading and spacing display...');

  const browser = await chromium.launch({
    headless: false,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('📱 Navigating to localhost:5657...');
    await page.goto('http://localhost:5657');

    console.log('⏳ Waiting for page to fully load...');
    await page.waitForTimeout(5000); // Give extra time for CSS to load

    console.log('🔍 Checking Tailwind CSS loading...');

    // Check if Tailwind CSS classes are properly applied
    const tailwindTest = await page.evaluate(() => {
      // Create a test element with known Tailwind classes
      const testElement = document.createElement('div');
      testElement.className = 'px-6 py-4 bg-red-500';
      testElement.style.visibility = 'hidden';
      testElement.style.position = 'absolute';
      testElement.style.top = '-1000px';
      document.body.appendChild(testElement);

      const computedStyle = window.getComputedStyle(testElement);
      const results = {
        paddingLeft: computedStyle.paddingLeft,
        paddingTop: computedStyle.paddingTop,
        backgroundColor: computedStyle.backgroundColor,
        hasComputedStyles: computedStyle.paddingLeft !== '' && computedStyle.paddingLeft !== '0px'
      };

      document.body.removeChild(testElement);
      return results;
    });

    console.log('📋 Tailwind Test Results:', tailwindTest);

    if (tailwindTest.hasComputedStyles) {
      console.log('✅ Tailwind CSS is loading properly');
      console.log(`📏 px-6 resolves to: ${tailwindTest.paddingLeft}`);
      console.log(`📏 py-4 resolves to: ${tailwindTest.paddingTop}`);
    } else {
      console.log('❌ Tailwind CSS appears to not be loading');
      console.log('⚠️ This would explain why spacing appears as 0px');
    }

    // Check specific Renata component styling
    console.log('🔍 Checking Renata component actual styling...');

    const renataAnalysis = await page.evaluate(() => {
      // Find elements with Renata text
      const elements = Array.from(document.querySelectorAll('*')).filter(el =>
        el.textContent && el.textContent.includes('Renata AI')
      );

      if (elements.length === 0) {
        return { error: 'No Renata elements found' };
      }

      const results = [];

      elements.forEach((element, index) => {
        // Find the closest container with padding classes
        let current = element;
        while (current && current !== document.body) {
          const classes = current.className || '';
          if (classes.includes('px-') || classes.includes('py-') || classes.includes('p-')) {
            const computedStyle = window.getComputedStyle(current);
            results.push({
              index,
              element: current.tagName.toLowerCase(),
              classes: classes,
              computedPadding: {
                left: computedStyle.paddingLeft,
                top: computedStyle.paddingTop,
                right: computedStyle.paddingRight,
                bottom: computedStyle.paddingBottom
              },
              position: {
                position: computedStyle.position,
                top: computedStyle.top,
                right: computedStyle.right
              }
            });
            break;
          }
          current = current.parentElement;
        }
      });

      return { results, totalRenataElements: elements.length };
    });

    if (renataAnalysis.error) {
      console.log('❌', renataAnalysis.error);
    } else {
      console.log(`📋 Found ${renataAnalysis.totalRenataElements} Renata elements`);
      renataAnalysis.results.forEach((result, i) => {
        console.log(`\n🎯 Renata Element ${i + 1}:`);
        console.log(`   Tag: ${result.element}`);
        console.log(`   Classes: ${result.classes}`);
        console.log(`   Computed Padding:`, result.computedPadding);
        console.log(`   Position:`, result.position);

        const hasCorrectPadding = result.computedPadding.left === '24px' &&
                                 (result.computedPadding.top === '16px' || result.computedPadding.top === '12px');

        if (hasCorrectPadding) {
          console.log('   ✅ Correct spacing applied');
        } else {
          console.log('   ⚠️ Spacing needs attention');
        }
      });
    }

    // Check for any CSS load errors
    console.log('🔍 Checking for CSS load errors...');
    const cssErrors = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      const errors = [];

      stylesheets.forEach((sheet, index) => {
        try {
          if (sheet.href && sheet.href.includes('/_next/static/css/')) {
            const rules = sheet.cssRules || sheet.rules;
            errors.push({
              index,
              href: sheet.href,
              rulesCount: rules ? rules.length : 0,
              status: 'loaded'
            });
          }
        } catch (e) {
          errors.push({
            index,
            href: sheet.href || 'inline',
            error: e.message,
            status: 'error'
          });
        }
      });

      return errors;
    });

    console.log('📋 CSS Load Status:', cssErrors);

    console.log('\n✅ Tailwind CSS and spacing analysis completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('🔄 Keeping browser open for manual inspection...');
    console.log('📝 Press Ctrl+C when done...');
    // Keep browser open for manual inspection
    await new Promise(() => {}); // This will keep the process running
  }
}

testTailwindCSSLoading().catch(console.error);