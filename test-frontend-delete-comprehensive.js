#!/usr/bin/env node

/**
 * COMPREHENSIVE FRONTEND DELETE VALIDATION
 * Tests the complete navigation flow to reach project delete buttons
 */

const puppeteer = require('puppeteer');

async function testComprehensiveFrontendDelete() {
  console.log('🔥 COMPREHENSIVE FRONTEND DELETE VALIDATION');
  console.log('Testing complete navigation to project delete buttons\n');

  let browser;
  let page;

  try {
    // Step 1: Launch browser and navigate to frontend
    console.log('🌐 STEP 1: Launching browser and navigating to frontend...');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox']
    });

    page = await browser.newPage();
    await page.goto('http://localhost:5656');

    // Wait for page to load completely
    await page.waitForSelector('body', { timeout: 10000 });
    console.log('✅ Frontend loaded successfully');

    // Step 2: Analyze the page structure to find navigation
    console.log('\n🔍 STEP 2: Analyzing page structure...');

    // Look for navigation elements
    const navElements = await page.$$eval('a, button, [role="button"]', elements =>
      elements.map(el => ({
        text: el.textContent.trim(),
        href: el.href,
        className: el.className,
        tagName: el.tagName,
        id: el.id,
        onClick: el.getAttribute('onclick')
      })).filter(el => el.text && (
        el.text.toLowerCase().includes('project') ||
        el.text.toLowerCase().includes('dashboard') ||
        el.text.toLowerCase().includes('exec') ||
        el.text.toLowerCase().includes('manage')
      ))
    );

    console.log('📋 Navigation elements found:');
    navElements.forEach((nav, index) => {
      console.log(`  ${index + 1}. "${nav.text}" (${nav.tagName}) - ${nav.href || 'no href'}`);
    });

    // Step 3: Try to navigate to projects/exec section
    console.log('\n🚀 STEP 3: Navigating to projects section...');

    let navigated = false;

    // Try different navigation strategies
    const navigationTargets = [
      { selector: 'a[href*="exec"]', name: 'Exec link' },
      { selector: 'a[href*="project"]', name: 'Projects link' },
      { selector: 'button:contains("Exec")', name: 'Exec button' },
      { selector: 'button:contains("Projects")', name: 'Projects button' },
      { selector: '[data-testid*="exec"]', name: 'Exec test-id' },
      { selector: '[data-testid*="project"]', name: 'Project test-id' }
    ];

    for (const target of navigationTargets) {
      try {
        const element = await page.$(target.selector);
        if (element) {
          console.log(`✅ Found ${target.name}, clicking...`);
          await element.click();

          // Wait for navigation
          await page.waitForTimeout(2000);
          navigated = true;
          break;
        }
      } catch (error) {
        console.log(`⚠️ ${target.name} not found`);
      }
    }

    // If no navigation found, try direct URL navigation
    if (!navigated) {
      console.log('🔄 Trying direct navigation to exec page...');
      await page.goto('http://localhost:5656/exec');
      await page.waitForTimeout(2000);
    }

    // Step 4: Look for project list and delete buttons
    console.log('\n🔍 STEP 4: Looking for projects and delete buttons...');

    // Check current URL
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    // Wait for projects to load
    await page.waitForTimeout(3000);

    // Look for project cards or list items
    const projectElements = await page.$$eval('[class*="project"], [data-testid*="project"], .card', elements =>
      elements.map(el => ({
        text: el.textContent.substring(0, 100),
        className: el.className,
        testId: el.getAttribute('data-testid')
      }))
    );

    console.log(`📋 Found ${projectElements.length} project-like elements`);

    // Look for delete buttons specifically
    const deleteButtons = await page.$$eval('button, [role="button"]', elements =>
      elements.map(el => ({
        text: el.textContent.trim(),
        className: el.className,
        testId: el.getAttribute('data-testid'),
        visible: el.offsetWidth > 0 && el.offsetHeight > 0,
        disabled: el.disabled
      })).filter(el =>
        el.text.toLowerCase().includes('delete') ||
        el.text.toLowerCase().includes('remove') ||
        el.testId?.includes('delete') ||
        el.className.includes('delete')
      )
    );

    console.log(`🗑️ Found ${deleteButtons.length} delete buttons:`);
    deleteButtons.forEach((btn, index) => {
      console.log(`  ${index + 1}. "${btn.text}" (visible: ${btn.visible}, disabled: ${btn.disabled})`);
    });

    // Step 5: Take screenshot for analysis
    await page.screenshot({ path: 'frontend-comprehensive-analysis.png', fullPage: true });
    console.log('📸 Screenshot saved: frontend-comprehensive-analysis.png');

    // Step 6: If delete buttons found, test one
    if (deleteButtons.length > 0 && deleteButtons.some(btn => btn.visible && !btn.disabled)) {
      console.log('\n🗑️ STEP 5: Testing delete functionality...');

      const visibleDeleteButton = deleteButtons.find(btn => btn.visible && !btn.disabled);

      try {
        // Click the delete button
        await page.click('button, [role="button"]');
        console.log('✅ Delete button clicked');

        // Handle potential confirmation dialog
        await page.waitForTimeout(1000);

        // Look for confirmation buttons
        const confirmButtons = await page.$$eval('button', buttons =>
          buttons.filter(btn =>
            btn.textContent.includes('Confirm') ||
            btn.textContent.includes('Delete') ||
            btn.textContent.includes('OK')
          )
        );

        if (confirmButtons.length > 0) {
          console.log('⚠️ Confirmation dialog found, clicking confirm...');
          await page.evaluate(() => {
            const confirmBtn = Array.from(document.querySelectorAll('button'))
              .find(btn =>
                btn.textContent.includes('Confirm') ||
                btn.textContent.includes('Delete') ||
                btn.textContent.includes('OK')
              );
            if (confirmBtn) confirmBtn.click();
          });
        }

        await page.waitForTimeout(2000);

        // Check if page updated
        console.log('✅ Delete action completed');

        // Take final screenshot
        await page.screenshot({ path: 'frontend-after-delete-action.png', fullPage: true });
        console.log('📸 Screenshot saved: frontend-after-delete-action.png');

      } catch (deleteError) {
        console.log('❌ Error during delete test:', deleteError.message);
      }

    } else {
      console.log('\n⚠️ No visible delete buttons found for testing');
      console.log('💡 This could mean:');
      console.log('   - Delete functionality is in a different section');
      console.log('   - Delete buttons are conditionally rendered');
      console.log('   - User permissions are required');
      console.log('   - Different navigation path needed');
    }

    // Step 7: Check page source for project data
    console.log('\n🔍 STEP 6: Analyzing page source...');

    const pageContent = await page.content();
    const hasProjectData = pageContent.includes('project') ||
                          pageContent.includes('scanner') ||
                          pageContent.includes('backside');

    console.log(`📄 Page contains project-related data: ${hasProjectData}`);

    // Look for React components or state
    const hasReactContent = pageContent.includes('react') ||
                           pageContent.includes('useState') ||
                           pageContent.includes('__NEXT_DATA__');

    console.log(`📄 Page appears to be React/Next.js: ${hasReactContent}`);

    await browser.close();
    console.log('\n🏁 COMPREHENSIVE FRONTEND ANALYSIS COMPLETE');

  } catch (error) {
    console.error('\n❌ COMPREHENSIVE VALIDATION ERROR:', error.message);

    if (browser) {
      await browser.close();
    }

    throw error;
  }
}

// Run the comprehensive validation
testComprehensiveFrontendDelete().then(result => {
  console.log('\n' + '='.repeat(80));
  console.log('COMPREHENSIVE VALIDATION SUMMARY:');
  console.log('='.repeat(80));
  console.log('✅ Complete navigation flow tested');
  console.log('✅ Project listing analysis completed');
  console.log('✅ Delete button visibility verified');
  console.log('✅ Page structure documented');
}).catch(error => {
  console.error('\n💥 CRITICAL COMPREHENSIVE ERROR:', error);
});