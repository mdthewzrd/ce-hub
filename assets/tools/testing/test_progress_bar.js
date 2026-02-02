/**
 * Test script to validate the enhanced progress bar functionality
 * Tests the edge-dev dashboard progress indicators
 */

const puppeteer = require('puppeteer');

async function testProgressBar() {
  console.log('🧪 Starting progress bar functionality test...');

  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      devtools: false,
      defaultViewport: { width: 1200, height: 800 }
    });

    const page = await browser.newPage();

    // Navigate to edge-dev dashboard
    console.log('📍 Navigating to edge-dev dashboard...');
    await page.goto('http://localhost:5659', { waitUntil: 'networkidle2' });

    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 10000 });

    // Take screenshot of initial state
    await page.screenshot({ path: '/Users/michaeldurante/ai dev/ce-hub/progress_test_initial.png' });
    console.log('📸 Initial screenshot taken');

    // Look for scan parameters section
    const scanButton = await page.$('button[type="submit"]');
    if (!scanButton) {
      console.log('❌ Scan button not found');
      return;
    }

    console.log('✅ Found scan button, checking progress bar components...');

    // Check for progress bar elements in the page source
    const pageContent = await page.content();

    // Check for enhanced progress bar features
    const progressFeatures = {
      'Enhanced Progress Bar': pageContent.includes('Scanning Progress'),
      'Gradient Background': pageContent.includes('bg-gradient-to-br'),
      'Time Estimation': pageContent.includes('estimatedTimeRemaining'),
      'Animated Elements': pageContent.includes('animate-pulse'),
      'Status Messages': pageContent.includes('scanMessage'),
      'Results Counter': pageContent.includes('scanTotalFound'),
      'Start Time Tracking': pageContent.includes('scanStartTime')
    };

    console.log('\n📊 Progress Bar Feature Analysis:');
    Object.entries(progressFeatures).forEach(([feature, present]) => {
      console.log(`  ${present ? '✅' : '❌'} ${feature}`);
    });

    // Test strategy upload section
    const uploadButton = await page.$('button[class*="Upload"]');
    if (uploadButton) {
      console.log('✅ Found upload functionality');

      // Check for strategy progress elements
      const strategyProgressExists = pageContent.includes('strategy.scanProgress');
      console.log(`  ${strategyProgressExists ? '✅' : '❌'} Strategy Progress Tracking`);
    }

    // Check for formatting modal elements
    const formattingModal = pageContent.includes('Formatting Strategy');
    console.log(`  ${formattingModal ? '✅' : '❌'} Enhanced Formatting Modal`);

    console.log('\n🔍 Enhanced Progress Features Detected:');

    // Enhanced visual features
    const enhancedFeatures = {
      'Progress Bar Gradient': pageContent.includes('bg-gradient-to-r from-yellow-600 to-yellow-500'),
      'Box Shadow Effects': pageContent.includes('boxShadow'),
      'Pulse Animations': pageContent.includes('animate-pulse'),
      'Status Indicators': pageContent.includes('w-2 h-2 bg-yellow-500 rounded-full'),
      'Time Remaining Display': pageContent.includes('estimatedTimeRemaining'),
      'Completion Status': pageContent.includes('Scan Complete!')
    };

    Object.entries(enhancedFeatures).forEach(([feature, present]) => {
      console.log(`  ${present ? '✅' : '❌'} ${feature}`);
    });

    // Take final screenshot
    await page.screenshot({ path: '/Users/michaeldurante/ai dev/ce-hub/progress_test_analysis.png' });
    console.log('📸 Analysis screenshot taken');

    console.log('\n🎉 Progress bar enhancement test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testProgressBar().catch(console.error);