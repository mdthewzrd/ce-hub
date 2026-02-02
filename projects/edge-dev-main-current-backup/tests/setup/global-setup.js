/**
 * Global Setup for CE-Hub Playwright Tests
 *
 * This setup file prepares the test environment for all CE-Hub validation tests,
 * ensuring proper server startup, database state, and test data preparation.
 */

const { chromium } = require('@playwright/test');
const path = require('path');

async function globalSetup(config) {
  console.log('🚀 Setting up CE-Hub test environment...');

  const baseURL = config.webServer?.url || 'http://localhost:5657';

  // Launch browser to verify server is ready
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for server to be ready
    console.log('⏳ Waiting for CE-Hub server to be ready...');
    await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 120000 });

    // Verify main application is loaded
    await page.waitForSelector('body', { timeout: 30000 });

    // Check for critical application elements
    const title = await page.title();
    console.log(`✓ Server ready - Page title: ${title}`);

    // Setup test data if needed
    await setupTestData(page);

    console.log('✅ CE-Hub test environment ready');

  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

async function setupTestData(page) {
  // Create baseline test data if needed
  // This could include default users, sample projects, etc.
  console.log('📊 Setting up test data...');

  try {
    // Check if we can access the API
    const response = await page.goto('/api/health');
    if (response && response.ok()) {
      console.log('✓ API health check passed');
    } else {
      console.log('⚠️  API health check failed, continuing anyway...');
    }
  } catch (error) {
    console.log('⚠️  Could not reach API endpoint, continuing anyway...');
  }
}

module.exports = globalSetup;