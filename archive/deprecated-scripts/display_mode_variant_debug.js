/**
 * DISPLAY MODE VARIANT DEBUG
 * Debug which variant of DisplayModeToggle is being used and why R mode styling fails
 */

const { chromium } = require('playwright');

async function displayModeVariantDebug() {
  console.log('🔧 DISPLAY MODE VARIANT DEBUG - Component Analysis');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  try {
    const page = await browser.newPage();

    console.log('📍 Navigate to dashboard...');
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForTimeout(3000);

    console.log('📍 Analyzing DisplayModeToggle component...');

    const componentAnalysis = await page.evaluate(() => {
      console.log('🔍 Analyzing DisplayModeToggle component structure...');

      const allButtons = Array.from(document.querySelectorAll('button'));
      const rBtn = allButtons.find(b => b.textContent?.trim() === 'R');
      const dollarBtn = allButtons.find(b => b.textContent?.trim() === '$');

      if (!rBtn || !dollarBtn) {
        return {
          error: 'R or $ button not found',
          foundButtons: allButtons.map(b => b.textContent?.trim()).filter(t => t)
        };
      }

      // Analyze parent structure to determine variant
      const rParent = rBtn.parentElement;
      const dollarParent = dollarBtn.parentElement;

      const getParentInfo = (parent) => {
        if (!parent) return null;
        return {
          tagName: parent.tagName,
          classes: Array.from(parent.classList),
          style: parent.style.cssText || 'none',
          children: Array.from(parent.children).map(child => ({
            tagName: child.tagName,
            textContent: child.textContent?.trim(),
            classes: Array.from(child.classList)
          }))
        };
      };

      const analysis = {
        rButton: {
          textContent: rBtn.textContent?.trim(),
          classes: Array.from(rBtn.classList),
          style: rBtn.style.cssText || 'none',
          computedBackgroundColor: window.getComputedStyle(rBtn).backgroundColor,
          computedColor: window.getComputedStyle(rBtn).color,
          parent: getParentInfo(rParent)
        },
        dollarButton: {
          textContent: dollarBtn.textContent?.trim(),
          classes: Array.from(dollarBtn.classList),
          style: dollarBtn.style.cssText || 'none',
          computedBackgroundColor: window.getComputedStyle(dollarBtn).backgroundColor,
          computedColor: window.getComputedStyle(dollarBtn).color,
          parent: getParentInfo(dollarParent)
        },
        currentContext: window.displayModeContext ? {
          displayMode: window.displayModeContext.displayMode,
          available: true
        } : { available: false }
      };

      return analysis;
    });

    console.log('\n📊 COMPONENT ANALYSIS:');
    console.log('=======================');

    if (componentAnalysis.error) {
      console.log(`❌ Error: ${componentAnalysis.error}`);
      console.log('Found buttons:', componentAnalysis.foundButtons);
      return false;
    }

    console.log('🎯 Current Context State:');
    console.log(`   Available: ${componentAnalysis.currentContext.available}`);
    console.log(`   Display Mode: ${componentAnalysis.currentContext.displayMode}`);

    console.log('\n💲 Dollar Button:');
    console.log(`   Text: "${componentAnalysis.dollarButton.textContent}"`);
    console.log(`   Classes: [${componentAnalysis.dollarButton.classes.join(', ')}]`);
    console.log(`   Background Color: ${componentAnalysis.dollarButton.computedBackgroundColor}`);
    console.log(`   Text Color: ${componentAnalysis.dollarButton.computedColor}`);

    console.log('\n🎯 R Button:');
    console.log(`   Text: "${componentAnalysis.rButton.textContent}"`);
    console.log(`   Classes: [${componentAnalysis.rButton.classes.join(', ')}]`);
    console.log(`   Background Color: ${componentAnalysis.rButton.computedBackgroundColor}`);
    console.log(`   Text Color: ${componentAnalysis.rButton.computedColor}`);

    console.log('\n🏗️ Parent Container Analysis:');
    console.log(`   Parent Classes: [${componentAnalysis.rButton.parent.classes.join(', ')}]`);
    console.log(`   Children Count: ${componentAnalysis.rButton.parent.children.length}`);

    // Determine likely variant based on parent structure
    const parentClasses = componentAnalysis.rButton.parent.classes;
    let likelyVariant = 'unknown';
    if (parentClasses.includes('bg-gray-800')) {
      likelyVariant = 'default or compact';
    } else if (parentClasses.some(cls => cls.includes('gap-1'))) {
      likelyVariant = 'flat';
    } else if (parentClasses.some(cls => cls.includes('space-x-1'))) {
      likelyVariant = 'icon-only';
    }

    console.log(`   🎯 Likely Variant: ${likelyVariant}`);

    // Now test setting R mode and analyzing changes
    console.log('\n📍 Testing R mode activation...');

    const afterRModeTest = await page.evaluate(async () => {
      console.log('🔧 Setting display mode to R and analyzing...');

      if (window.displayModeContext && window.displayModeContext.setDisplayMode) {
        window.displayModeContext.setDisplayMode('r');

        // Wait a bit for potential re-render
        await new Promise(resolve => setTimeout(resolve, 500));

        const allButtons = Array.from(document.querySelectorAll('button'));
        const rBtn = allButtons.find(b => b.textContent?.trim() === 'R');
        const dollarBtn = allButtons.find(b => b.textContent?.trim() === '$');

        return {
          contextState: window.displayModeContext.displayMode,
          rButton: {
            classes: Array.from(rBtn.classList),
            computedBackgroundColor: window.getComputedStyle(rBtn).backgroundColor,
            computedColor: window.getComputedStyle(rBtn).color,
            hasActiveClass: rBtn.classList.contains('bg-[#B8860B]'),
            hasActiveTextColor: rBtn.classList.contains('text-black'),
            hasActiveShadow: rBtn.classList.contains('shadow-lg')
          },
          dollarButton: {
            classes: Array.from(dollarBtn.classList),
            computedBackgroundColor: window.getComputedStyle(dollarBtn).backgroundColor,
            computedColor: window.getComputedStyle(dollarBtn).color,
            hasActiveClass: dollarBtn.classList.contains('bg-[#B8860B]')
          }
        };
      }

      return { error: 'Context not available' };
    });

    console.log('\n📊 AFTER R MODE ACTIVATION:');
    console.log('============================');

    if (afterRModeTest.error) {
      console.log(`❌ ${afterRModeTest.error}`);
      return false;
    }

    console.log(`🎯 Context State: ${afterRModeTest.contextState}`);
    console.log(`🎯 R Button Active Styling:`);
    console.log(`   Has bg-[#B8860B]: ${afterRModeTest.rButton.hasActiveClass}`);
    console.log(`   Has text-black: ${afterRModeTest.rButton.hasActiveTextColor}`);
    console.log(`   Has shadow-lg: ${afterRModeTest.rButton.hasActiveShadow}`);
    console.log(`   Computed BG: ${afterRModeTest.rButton.computedBackgroundColor}`);
    console.log(`   Computed Color: ${afterRModeTest.rButton.computedColor}`);

    const isRButtonProperlyStyled = afterRModeTest.contextState === 'r' &&
                                   afterRModeTest.rButton.hasActiveClass &&
                                   afterRModeTest.rButton.hasActiveTextColor;

    console.log(`\n🎯 R Button Working Correctly: ${isRButtonProperlyStyled ? '✅' : '❌'}`);

    if (!isRButtonProperlyStyled) {
      console.log('\n🔍 ISSUE DIAGNOSIS:');
      if (afterRModeTest.contextState !== 'r') {
        console.log('❌ Context state not updating to R mode');
      } else if (!afterRModeTest.rButton.hasActiveClass) {
        console.log('❌ R button not receiving active CSS classes');
        console.log('💡 Component might not be re-rendering when context changes');
      }
    }

    await page.screenshot({ path: 'display_mode_variant_debug.png', fullPage: true });

    return isRButtonProperlyStyled;

  } catch (error) {
    console.error('💥 Display mode variant debug error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

displayModeVariantDebug().then(success => {
  console.log(`\n🏁 DISPLAY MODE VARIANT DEBUG: ${success ? 'R BUTTON WORKING' : 'R BUTTON ISSUE IDENTIFIED'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});