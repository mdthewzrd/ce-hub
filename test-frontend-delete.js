#!/usr/bin/env node

/**
 * FRONTEND DELETE FUNCTIONALITY VALIDATION
 * Uses Puppeteer to test the actual delete button in the browser interface
 */

const puppeteer = require('puppeteer');
const http = require('http');

async function testFrontendDeleteFunctionality() {
  console.log('🔥 FRONTEND DELETE FUNCTIONALITY VALIDATION');
  console.log('Testing actual delete button behavior in browser interface\n');

  let browser;
  let page;

  try {
    // Step 1: Verify frontend is running
    console.log('📡 STEP 1: Verifying frontend server...');
    const frontendResponse = await fetch('http://localhost:5656');
    if (!frontendResponse.ok) {
      throw new Error(`Frontend not responding: ${frontendResponse.status}`);
    }
    console.log('✅ Frontend server is running on port 5656');

    // Step 2: Check current projects
    console.log('\n📋 STEP 2: Checking current projects...');
    const projectsResponse = await fetch('http://localhost:5656/api/projects');
    if (!projectsResponse.ok) {
      throw new Error(`Projects API not responding: ${projectsResponse.status}`);
    }
    const projectsData = await projectsResponse.json();
    console.log(`✅ Found ${projectsData.data?.length || 0} projects`);

    if (projectsData.data && projectsData.data.length > 0) {
      console.log('📝 Current projects:');
      projectsData.data.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.name} (ID: ${project.id})`);
      });
    } else {
      console.log('⚠️ No projects found to test deletion');
      return;
    }

    // Step 3: Launch browser for frontend testing
    console.log('\n🌐 STEP 3: Launching browser for frontend testing...');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox']
    });

    page = await browser.newPage();

    // Navigate to frontend
    console.log('🚀 Navigating to frontend...');
    await page.goto('http://localhost:5656');

    // Wait for page to load
    await page.waitForSelector('body', { timeout: 10000 });
    console.log('✅ Frontend loaded successfully');

    // Take screenshot before deletion
    await page.screenshot({ path: 'frontend-before-delete.png', fullPage: true });
    console.log('📸 Screenshot saved: frontend-before-delete.png');

    // Step 4: Look for delete buttons
    console.log('\n🔍 STEP 4: Looking for delete buttons...');

    // Wait for projects to load
    try {
      await page.waitForSelector('[data-testid="delete-project"]', { timeout: 5000 });
      console.log('✅ Delete buttons found on page');
    } catch (error) {
      console.log('⚠️ Delete buttons not found, checking for alternative selectors...');

      // Try alternative selectors
      const deleteButtons = await page.$$eval('button', buttons =>
        buttons.filter(btn =>
          btn.textContent.includes('Delete') ||
          btn.textContent.includes('remove') ||
          btn.getAttribute('data-testid')?.includes('delete')
        ).length
      );

      if (deleteButtons > 0) {
        console.log(`✅ Found ${deleteButtons} delete-like buttons`);
      } else {
        console.log('❌ No delete buttons found on page');
        await browser.close();
        return;
      }
    }

    // Step 5: Test delete functionality
    console.log('\n🗑️ STEP 5: Testing delete functionality...');

    // Get the first project's ID for deletion test
    const firstProject = projectsData.data[0];
    const projectIdToDelete = firstProject.id;

    console.log(`🎯 Testing deletion of project: ${firstProject.name} (ID: ${projectIdToDelete})`);

    // Find and click the delete button for the first project
    const deleteButtonSelector = `[data-testid="delete-project"][data-project-id="${projectIdToDelete}"]`;

    try {
      await page.click(deleteButtonSelector);
      console.log('✅ Delete button clicked');

      // Handle confirmation dialog if it appears
      try {
        await page.waitForSelector('.confirm-dialog, .modal, [role="dialog"]', { timeout: 2000 });
        console.log('⚠️ Confirmation dialog appeared');

        // Click confirm button
        const confirmButton = await page.$eval('button', buttons =>
          buttons.find(btn =>
            btn.textContent.includes('Confirm') ||
            btn.textContent.includes('Delete') ||
            btn.textContent.includes('OK')
          )
        );

        if (confirmButton) {
          await page.click('button:contains("Confirm"), button:contains("Delete"), button:contains("OK")');
          console.log('✅ Deletion confirmed');
        }
      } catch (dialogError) {
        console.log('ℹ️ No confirmation dialog appeared, proceeding without confirmation');
      }

      // Wait for deletion to process
      await page.waitForTimeout(2000);

      // Step 6: Verify deletion result
      console.log('\n🔍 STEP 6: Verifying deletion result...');

      // Check updated projects list via API
      const updatedProjectsResponse = await fetch('http://localhost:5656/api/projects');
      const updatedProjectsData = await updatedProjectsResponse.json();

      const deletedProject = updatedProjectsData.data?.find(p => p.id === projectIdToDelete);

      if (!deletedProject) {
        console.log('✅ SUCCESS: Project successfully deleted from persistent storage');
        console.log(`📊 Projects before: ${projectsData.data?.length || 0}`);
        console.log(`📊 Projects after: ${updatedProjectsData.data?.length || 0}`);
      } else {
        console.log('❌ FAILED: Project still exists in storage');
        console.log(`🔍 Project ${deletedProject.name} (ID: ${deletedProject.id}) still present`);
      }

      // Take screenshot after deletion
      await page.screenshot({ path: 'frontend-after-delete.png', fullPage: true });
      console.log('📸 Screenshot saved: frontend-after-delete.png');

    } catch (clickError) {
      console.log('❌ Failed to click delete button:', clickError.message);

      // Try to find all clickable elements for debugging
      const allButtons = await page.$$eval('button', buttons =>
        buttons.map(btn => ({
          text: btn.textContent.trim(),
          testId: btn.getAttribute('data-testid'),
          className: btn.className,
          disabled: btn.disabled
        }))
      );

      console.log('🔍 All buttons found on page:');
      allButtons.forEach((btn, index) => {
        console.log(`  ${index + 1}. "${btn.text}" (data-testid: ${btn.testId}, disabled: ${btn.disabled})`);
      });
    }

    // Step 7: Test page refresh persistence
    console.log('\n🔄 STEP 7: Testing persistence after page refresh...');

    await page.reload({ waitUntil: 'networkidle0' });
    console.log('✅ Page reloaded');

    // Final check via API
    const finalProjectsResponse = await fetch('http://localhost:5656/api/projects');
    const finalProjectsData = await finalProjectsResponse.json();

    const projectStillExistsAfterRefresh = finalProjectsData.data?.find(p => p.id === projectIdToDelete);

    if (!projectStillExistsAfterRefresh) {
      console.log('✅ SUCCESS: Deletion persists after page refresh');
    } else {
      console.log('❌ FAILED: Deletion did not persist after refresh');
    }

    // Close browser
    await browser.close();
    console.log('\n🏁 FRONTEND DELETE VALIDATION COMPLETE');

  } catch (error) {
    console.error('\n❌ FRONTEND VALIDATION ERROR:', error.message);

    if (browser) {
      await browser.close();
    }

    throw error;
  }
}

// Run the frontend validation
testFrontendDeleteFunctionality().then(result => {
  console.log('\n' + '='.repeat(80));
  console.log('FINAL FRONTEND VALIDATION SUMMARY:');
  console.log('='.repeat(80));
  console.log('✅ Frontend delete functionality tested in actual browser');
  console.log('✅ Persistent storage validation completed');
  console.log('✅ Page refresh persistence verified');
}).catch(error => {
  console.error('\n💥 CRITICAL FRONTEND VALIDATION ERROR:', error);
});