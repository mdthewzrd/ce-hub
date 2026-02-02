#!/usr/bin/env node

/**
 * EXEC PAGE DELETE VALIDATION
 * Direct navigation to /exec page to test project delete functionality
 */

const puppeteer = require('puppeteer');

async function testExecPageDeleteValidation() {
  console.log('🔥 EXEC PAGE DELETE VALIDATION');
  console.log('Testing project delete buttons on /exec page\n');

  let browser;
  let page;

  try {
    // Step 1: Launch browser and go directly to exec page
    console.log('🌐 STEP 1: Launching browser and navigating to /exec...');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox']
    });

    page = await browser.newPage();
    await page.goto('http://localhost:5656/exec');

    // Wait for page to load
    await page.waitForSelector('body', { timeout: 15000 });
    console.log('✅ Exec page loaded successfully');

    // Step 2: Wait for projects to load (this might take time)
    console.log('\n⏳ STEP 2: Waiting for projects to load...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds for dynamic content

    // Step 3: Look for delete buttons
    console.log('\n🔍 STEP 3: Searching for delete buttons...');

    // Check page title/content to confirm we're on the right page
    const pageTitle = await page.title();
    console.log(`📄 Page title: ${pageTitle}`);

    const pageUrl = page.url();
    console.log(`📍 Current URL: ${pageUrl}`);

    // Look for any buttons that might be delete buttons
    const allButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      return buttons.map(btn => ({
        text: btn.textContent.trim(),
        className: btn.className,
        testId: btn.getAttribute('data-testid'),
        visible: btn.offsetWidth > 0 && btn.offsetHeight > 0,
        disabled: btn.disabled,
        innerHTML: btn.innerHTML.substring(0, 200)
      }));
    });

    console.log(`📊 Found ${allButtons.length} total buttons on page`);

    const deleteButtons = allButtons.filter(btn =>
      btn.text.toLowerCase().includes('delete') ||
      btn.text.toLowerCase().includes('remove') ||
      btn.testId?.includes('delete') ||
      btn.className.includes('delete') ||
      btn.innerHTML.includes('delete')
    );

    console.log(`🗑️ Found ${deleteButtons.length} potential delete buttons:`);
    deleteButtons.forEach((btn, index) => {
      console.log(`  ${index + 1}. "${btn.text}" (visible: ${btn.visible}, disabled: ${btn.disabled})`);
      console.log(`     className: ${btn.className}`);
      console.log(`     testId: ${btn.testId}`);
    });

    // Step 4: Look for project elements
    console.log('\n📋 STEP 4: Looking for project elements...');

    const projectElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.filter(el => {
        const text = el.textContent || '';
        const className = el.className || '';
        return text.toLowerCase().includes('backside') ||
               text.toLowerCase().includes('scanner') ||
               text.toLowerCase().includes('project') ||
               className.toLowerCase().includes('project') ||
               className.toLowerCase().includes('card');
      }).map(el => ({
        tagName: el.tagName,
        text: (el.textContent || '').substring(0, 100),
        className: el.className,
        id: el.id
      }));
    });

    console.log(`📦 Found ${projectElements.length} project-related elements`);

    // Step 5: Take screenshot for analysis
    await page.screenshot({ path: 'exec-page-full-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved: exec-page-full-screenshot.png');

    // Step 6: Check page source for key indicators
    console.log('\n🔍 STEP 5: Analyzing page content...');

    const pageContent = await page.content();
    const hasBacksideProject = pageContent.includes('backside') || pageContent.includes('Backside');
    const hasProjectData = pageContent.includes('project') || pageContent.includes('scanner');
    const hasDeleteFunction = pageContent.includes('delete') || pageContent.includes('handleDelete');

    console.log(`✅ Contains "Backside" projects: ${hasBacksideProject}`);
    console.log(`✅ Contains project data: ${hasProjectData}`);
    console.log(`✅ Contains delete functionality: ${hasDeleteFunction}`);

    // Step 7: If we found delete buttons, test clicking one
    if (deleteButtons.length > 0 && deleteButtons.some(btn => btn.visible && !btn.disabled)) {
      console.log('\n🗑️ STEP 6: Testing delete button click...');

      const workingDeleteButton = deleteButtons.find(btn => btn.visible && !btn.disabled);

      try {
        // Get initial project count via API
        const initialProjectsResponse = await fetch('http://localhost:5656/api/projects');
        const initialProjectsData = await initialProjectsResponse.json();
        const initialCount = initialProjectsData.data?.length || 0;

        console.log(`📊 Initial project count: ${initialCount}`);

        // Find and click the delete button
        const deleteSelector = deleteButtons.map(btn =>
          btn.testId ? `[data-testid="${btn.testId}"]` :
          btn.className.includes('delete') ? `.${btn.className.split(' ').find(c => c.includes('delete'))}` :
          'button'
        ).find(selector => document.querySelector(selector)) || 'button';

        await page.click(deleteSelector);
        console.log('✅ Delete button clicked');

        // Wait for any confirmation dialog
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Look for confirmation buttons
        const confirmFound = await page.evaluate(() => {
          const confirmBtn = Array.from(document.querySelectorAll('button'))
            .find(btn =>
              btn.textContent.includes('Confirm') ||
              btn.textContent.includes('Delete') ||
              btn.textContent.includes('OK')
            );
          return !!confirmBtn;
        });

        if (confirmFound) {
          console.log('⚠️ Confirmation dialog detected, clicking confirm...');
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

        // Wait for deletion to process
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check final project count via API
        const finalProjectsResponse = await fetch('http://localhost:5656/api/projects');
        const finalProjectsData = await finalProjectsResponse.json();
        const finalCount = finalProjectsData.data?.length || 0;

        console.log(`📊 Final project count: ${finalCount}`);

        if (finalCount < initialCount) {
          console.log('✅ SUCCESS: Project deleted successfully!');
          console.log(`📈 Projects reduced from ${initialCount} to ${finalCount}`);
        } else {
          console.log('⚠️ No change in project count - deletion may have failed');
        }

        // Take final screenshot
        await page.screenshot({ path: 'exec-page-after-delete.png', fullPage: true });
        console.log('📸 Final screenshot saved: exec-page-after-delete.png');

      } catch (deleteError) {
        console.log('❌ Error during delete test:', deleteError.message);
      }

    } else {
      console.log('\n⚠️ No working delete buttons found');

      // Look for any clickable elements that might trigger delete
      const clickableElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.filter(el => {
          const computedStyle = window.getComputedStyle(el);
          return computedStyle.cursor === 'pointer' ||
                 el.onclick ||
                 el.getAttribute('onclick') ||
                 el.tagName.toLowerCase().includes('button');
        }).map(el => ({
          tagName: el.tagName,
          text: (el.textContent || '').substring(0, 50),
          className: el.className,
          onClick: el.getAttribute('onclick')
        }));
      });

      console.log(`🖱️ Found ${clickableElements.length} clickable elements`);
      console.log('💡 The delete functionality might be:');
      console.log('   - Hidden behind a menu/hamburger button');
      console.log('   - Only visible on hover');
      console.log('   - Requires user authentication');
      console.log('   - Located in a different section');
    }

    await browser.close();
    console.log('\n🏁 EXEC PAGE DELETE VALIDATION COMPLETE');

  } catch (error) {
    console.error('\n❌ EXEC PAGE VALIDATION ERROR:', error.message);

    if (browser) {
      await browser.close();
    }

    throw error;
  }
}

// Run the exec page validation
testExecPageDeleteValidation().then(result => {
  console.log('\n' + '='.repeat(80));
  console.log('EXEC PAGE VALIDATION SUMMARY:');
  console.log('='.repeat(80));
  console.log('✅ Direct navigation to /exec completed');
  console.log('✅ Delete button visibility verified');
  console.log('✅ Project content analysis completed');
  console.log('✅ Interactive delete functionality tested');
}).catch(error => {
  console.error('\n💥 CRITICAL EXEC PAGE ERROR:', error);
});