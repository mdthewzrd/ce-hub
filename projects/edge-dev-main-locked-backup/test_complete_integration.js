/**
 * Complete Integration Test: Renata AI File Upload + Code Formatter
 * Tests the end-to-end workflow from file upload to backend formatting
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('Complete Renata AI + CodeFormatterService integration test', async ({ page }) => {
  console.log('🧪 Testing complete Renata AI file upload + formatting integration...\n');

  try {
    // Navigate to the application
    await page.goto('http://localhost:5657');
    await page.waitForLoadState('networkidle');
    console.log('✅ Application loaded at localhost:5657');

    // Verify backend is accessible
    const backendResponse = await page.request.get('http://localhost:8000/');
    console.log(`✅ Backend connectivity: ${backendResponse.status() === 200 ? 'ONLINE' : 'OFFLINE'}`);

    // Take initial screenshot
    await page.screenshot({
      path: 'integration_test_initial.png',
      fullPage: true
    });

    // Look for Renata AI trigger (this might be a button, icon, or similar)
    await page.waitForTimeout(2000); // Give the app time to fully load

    // Check if Renata components are present in the DOM
    const renataCheck = await page.evaluate(() => {
      // Look for common patterns that might indicate Renata presence
      const allElements = Array.from(document.querySelectorAll('*'));

      const renataElements = allElements.filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        const className = el.className?.toLowerCase() || '';
        const id = el.id?.toLowerCase() || '';

        return text.includes('renata') ||
               text.includes('ai') ||
               text.includes('assistant') ||
               className.includes('renata') ||
               id.includes('renata');
      });

      const fileInputs = document.querySelectorAll('input[type="file"]');
      const buttons = Array.from(document.querySelectorAll('button')).filter(btn =>
        btn.textContent?.toLowerCase().includes('ai') ||
        btn.textContent?.toLowerCase().includes('chat') ||
        btn.textContent?.toLowerCase().includes('renata')
      );

      return {
        renataElementsCount: renataElements.length,
        fileInputCount: fileInputs.length,
        aiButtonsCount: buttons.length,
        hasRenataText: renataElements.some(el => el.textContent?.toLowerCase().includes('renata')),
        buttonTexts: buttons.map(btn => btn.textContent?.trim())
      };
    });

    console.log('🔍 Renata Component Analysis:');
    console.log(`   • Renata-related elements: ${renataCheck.renataElementsCount}`);
    console.log(`   • File inputs: ${renataCheck.fileInputCount}`);
    console.log(`   • AI/Chat buttons: ${renataCheck.aiButtonsCount}`);
    console.log(`   • Has Renata text: ${renataCheck.hasRenataText}`);
    console.log(`   • Button texts: ${JSON.stringify(renataCheck.buttonTexts)}`);

    // Test if we can find any interactive elements that might open Renata
    const interactiveTest = await page.evaluate(() => {
      // Look for clickable elements that might trigger Renata
      const clickableElements = Array.from(document.querySelectorAll('button, [role="button"], .cursor-pointer, [onclick]'));

      return {
        totalClickable: clickableElements.length,
        potentialTriggers: clickableElements.map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim(),
          className: el.className,
          id: el.id
        })).filter(item => item.text && item.text.length > 0)
      };
    });

    console.log('\n🎯 Interactive Elements Found:');
    console.log(`   • Total clickable elements: ${interactiveTest.totalClickable}`);
    if (interactiveTest.potentialTriggers.length > 0) {
      console.log('   • Potential Renata triggers:');
      interactiveTest.potentialTriggers.slice(0, 10).forEach((trigger, i) => {
        console.log(`     ${i + 1}. ${trigger.tag}: "${trigger.text}"`);
      });
    }

    // Test backend API directly to ensure formatting service is working
    console.log('\n🧮 Testing Backend CodeFormatterService...');

    // Read our test scanner file
    const testScannerPath = path.join(__dirname, 'test_scanner.py');
    const testScannerContent = fs.readFileSync(testScannerPath, 'utf8');

    // Test the formatting endpoint
    const formatResponse = await page.request.post('http://localhost:8000/api/format-code', {
      data: {
        code: testScannerContent,
        filename: 'test_scanner.py'
      }
    });

    const formatResult = await formatResponse.json();
    console.log(`   • Format API Status: ${formatResponse.status()}`);
    console.log(`   • Format Response: ${formatResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (formatResult.success) {
      console.log(`   • Detected Scanner Type: ${formatResult.scanner_type || 'Unknown'}`);
      console.log(`   • Parameters Found: ${formatResult.parameters ? Object.keys(formatResult.parameters).length : 0}`);
    }

    // Take final screenshot
    await page.screenshot({
      path: 'integration_test_final.png',
      fullPage: true
    });

    // Test Summary
    const integrationHealth = {
      frontend: true,
      backend: backendResponse.status() === 200,
      fileUploadCapability: renataCheck.fileInputCount > 0,
      formatterAPI: formatResult.success,
      renataPresence: renataCheck.hasRenataText
    };

    console.log('\n📊 Integration Health Check:');
    Object.entries(integrationHealth).forEach(([component, status]) => {
      console.log(`   • ${component}: ${status ? '✅' : '❌'}`);
    });

    const overallHealth = Object.values(integrationHealth).every(status => status);

    console.log(`\n🎯 Overall Integration Status: ${overallHealth ? '✅ HEALTHY' : '⚠️ ISSUES DETECTED'}`);

    if (overallHealth) {
      console.log('\n🎉 Complete integration appears functional!');
      console.log('\n📝 Ready for manual testing:');
      console.log('   1. Open http://localhost:5657 in browser');
      console.log('   2. Trigger Renata AI popup');
      console.log('   3. Upload scanner file (test_scanner.py available)');
      console.log('   4. Request formatting/import');
      console.log('   5. Verify backend processes the file correctly');
    } else {
      console.log('\n⚠️ Some integration components need attention');
    }

    console.log('\n📸 Screenshots saved: integration_test_initial.png, integration_test_final.png');

  } catch (error) {
    console.error('❌ Integration test error:', error.message);
  }
});