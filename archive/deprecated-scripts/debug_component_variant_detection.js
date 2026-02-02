/**
 * DEBUG COMPONENT VARIANT DETECTION
 * Determine which DisplayModeToggle variant is actually being used
 */

const { chromium } = require('playwright');

async function debugComponentVariantDetection() {
  console.log('🔍 DEBUG COMPONENT VARIANT - Determining which variant is being used');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  try {
    const page = await browser.newPage();

    console.log('📍 Navigate to dashboard...');
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForTimeout(4000);

    console.log('📍 Analyzing component structure...');

    const analysis = await page.evaluate(() => {
      console.log('🔧 Analyzing DisplayModeToggle component structure...');

      const allButtons = Array.from(document.querySelectorAll('button'));
      const rBtn = allButtons.find(btn => btn.textContent?.trim() === 'R');
      const dollarBtn = allButtons.find(btn => btn.textContent?.trim() === '$');

      if (!rBtn || !dollarBtn) {
        return { error: 'R or $ button not found', foundButtons: allButtons.map(b => b.textContent?.trim()).filter(t => t) };
      }

      // Analyze parent structure to determine variant
      const parent = rBtn.parentElement;
      const grandParent = parent ? parent.parentElement : null;

      const analysis = {
        buttonStructure: {
          rButton: {
            classes: Array.from(rBtn.classList),
            parentClasses: parent ? Array.from(parent.classList) : [],
            grandParentClasses: grandParent ? Array.from(grandParent.classList) : [],
            parentTagName: parent ? parent.tagName : null,
            siblings: parent ? Array.from(parent.children).map(child => ({
              tagName: child.tagName,
              textContent: child.textContent?.trim(),
              classes: Array.from(child.classList)
            })) : []
          }
        },
        likelyVariant: 'unknown',
        variantEvidence: {}
      };

      const parentClasses = analysis.buttonStructure.rButton.parentClasses;

      // Determine likely variant based on parent container structure
      if (parentClasses.includes('bg-gray-800')) {
        if (parentClasses.some(cls => cls.includes('p-1'))) {
          analysis.likelyVariant = 'compact';
          analysis.variantEvidence.compact = 'Parent has bg-gray-800 and p-1 classes';
        } else {
          analysis.likelyVariant = 'default';
          analysis.variantEvidence.default = 'Parent has bg-gray-800 but no specific variant indicators';
        }
      } else if (parentClasses.some(cls => cls.includes('gap-1'))) {
        analysis.likelyVariant = 'flat';
        analysis.variantEvidence.flat = 'Parent has gap-1 class (flat variant signature)';
      } else if (parentClasses.some(cls => cls.includes('space-x-1'))) {
        analysis.likelyVariant = 'icon-only';
        analysis.variantEvidence.iconOnly = 'Parent has space-x-1 class';
      }

      // Additional checks
      const hasBackground = parentClasses.includes('bg-gray-800');
      const hasGap = parentClasses.some(cls => cls.includes('gap-'));
      const hasSpacing = parentClasses.some(cls => cls.includes('space-x-'));
      const hasPadding = parentClasses.some(cls => cls.includes('p-'));

      analysis.variantEvidence.classAnalysis = {
        hasBackground,
        hasGap,
        hasSpacing,
        hasPadding,
        allParentClasses: parentClasses
      };

      return analysis;
    });

    console.log('\n🔬 === COMPONENT VARIANT ANALYSIS ===');
    console.log('====================================');

    if (analysis.error) {
      console.log(`❌ Error: ${analysis.error}`);
      console.log('Found buttons:', analysis.foundButtons);
      return false;
    }

    console.log(`\n🎯 Likely Variant: ${analysis.likelyVariant}`);
    console.log('\n📊 Evidence:');
    Object.entries(analysis.variantEvidence).forEach(([key, evidence]) => {
      if (typeof evidence === 'string') {
        console.log(`  ${key}: ${evidence}`);
      } else if (typeof evidence === 'object') {
        console.log(`  ${key}:`);
        Object.entries(evidence).forEach(([subKey, subValue]) => {
          console.log(`    ${subKey}: ${subValue}`);
        });
      }
    });

    console.log('\n🏗️ Button Structure:');
    console.log(`  Parent Tag: ${analysis.buttonStructure.rButton.parentTagName}`);
    console.log(`  Parent Classes: [${analysis.buttonStructure.rButton.parentClasses.join(', ')}]`);
    console.log(`  Siblings: ${analysis.buttonStructure.rButton.siblings.length} buttons`);

    // Determine the actual variant being used
    const actualVariant = analysis.likelyVariant;

    console.log('\n🔍 CONCLUSION:');
    if (actualVariant === 'flat') {
      console.log('  ✅ Using FLAT variant - This is where I made the fixes');
      console.log('  💡 The issue might be that the fixes need more work or there are other issues');
    } else {
      console.log(`  ❌ Using ${actualVariant.toUpperCase()} variant - I fixed the wrong variant!`);
      console.log('  💡 Need to apply fixes to the actual variant being used');
    }

    await page.screenshot({ path: 'component_variant_debug.png', fullPage: true });

    return { actualVariant, needsFixInCorrectVariant: actualVariant !== 'flat' };

  } catch (error) {
    console.error('💥 Component variant debug error:', error);
    return { actualVariant: 'unknown', needsFixInCorrectVariant: true };
  } finally {
    await browser.close();
  }
}

debugComponentVariantDetection().then(({ actualVariant, needsFixInCorrectVariant }) => {
  console.log(`\n🏁 COMPONENT VARIANT DETECTION COMPLETE`);
  console.log(`  Actual Variant: ${actualVariant}`);
  console.log(`  Needs Fix in Correct Variant: ${needsFixInCorrectVariant ? '✅ YES' : '❌ NO'}`);

  if (needsFixInCorrectVariant) {
    console.log('\n🎯 NEXT STEP: Apply R button fixes to the correct variant');
  }

  process.exit(needsFixInCorrectVariant ? 1 : 0);
}).catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});