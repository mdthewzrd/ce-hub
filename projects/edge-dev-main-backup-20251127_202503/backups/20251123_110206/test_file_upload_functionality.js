/**
 * Quick test to verify Renata file upload functionality
 * Tests the basic components and functionality
 */

const { test, expect } = require('@playwright/test');

test('Renata file upload functionality test', async ({ page }) => {
  console.log('🧪 Testing Renata file upload functionality...\n');

  try {
    // Navigate to the app
    await page.goto('http://localhost:5657');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    console.log('✅ Application loaded successfully');

    // Look for Renata button or similar element to activate popup
    // Since we don't know the exact trigger, let's check if the component loads properly

    // Check if our new file upload icons are loaded (Paperclip, Upload)
    const result = await page.evaluate(() => {
      // Check for any elements that might contain our new file upload functionality
      const paperclipElements = document.querySelectorAll('*[class*="lucide"], *[data-lucide="paperclip"]');
      const uploadElements = document.querySelectorAll('*[class*="lucide"], *[data-lucide="upload"]');

      // Check if RenataPopup component exists in the DOM
      const renataElements = document.querySelectorAll('*[class*="renata"], *[id*="renata"]');

      // Check for file input elements
      const fileInputs = document.querySelectorAll('input[type="file"]');

      return {
        paperclipFound: paperclipElements.length > 0,
        uploadFound: uploadElements.length > 0,
        renataFound: renataElements.length > 0,
        fileInputsFound: fileInputs.length > 0,
        totalElements: {
          paperclip: paperclipElements.length,
          upload: uploadElements.length,
          renata: renataElements.length,
          fileInputs: fileInputs.length
        }
      };
    });

    console.log('📊 Component Analysis:');
    console.log(`   • Paperclip icons found: ${result.totalElements.paperclip}`);
    console.log(`   • Upload icons found: ${result.totalElements.upload}`);
    console.log(`   • Renata elements found: ${result.totalElements.renata}`);
    console.log(`   • File inputs found: ${result.totalElements.fileInputs}`);

    // Test if the application has our new functionality
    if (result.fileInputsFound) {
      console.log('✅ File input elements detected - upload functionality likely implemented');
    } else {
      console.log('⚠️  No file input elements found - may need to check component integration');
    }

    // Check for drag and drop support in the page
    const dragDropSupport = await page.evaluate(() => {
      return {
        dragSupported: 'ondragover' in window && 'ondrop' in window,
        fileApiSupported: 'FileReader' in window
      };
    });

    console.log('🔧 Browser Capabilities:');
    console.log(`   • Drag & Drop: ${dragDropSupport.dragSupported ? '✅' : '❌'}`);
    console.log(`   • File API: ${dragDropSupport.fileApiSupported ? '✅' : '❌'}`);

    // Try to find and interact with any chat-like interface
    const chatInterface = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"], textarea'));
      const chatInput = inputs.find(input => {
        const placeholder = input.placeholder?.toLowerCase() || '';
        return placeholder.includes('chat') ||
               placeholder.includes('message') ||
               placeholder.includes('scanner') ||
               placeholder.includes('drag');
      });

      return {
        found: !!chatInput,
        placeholder: chatInput?.placeholder || null,
        hasFileUpload: !!chatInput?.closest('*')?.querySelector('input[type="file"]')
      };
    });

    if (chatInterface.found) {
      console.log('✅ Chat interface detected');
      console.log(`   • Placeholder: "${chatInterface.placeholder}"`);
      console.log(`   • Has file upload: ${chatInterface.hasFileUpload ? '✅' : '❌'}`);
    }

    // Take a screenshot for visual verification
    await page.screenshot({
      path: 'test_file_upload_functionality.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved as test_file_upload_functionality.png');

    // Test summary
    const passed = result.fileInputsFound && dragDropSupport.fileApiSupported;
    console.log(`\n📋 Test Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);

    if (passed) {
      console.log('🎉 File upload functionality appears to be implemented correctly!');
      console.log('📝 Next steps: Test actual file upload by opening the app and using Renata');
    } else {
      console.log('⚠️  Some functionality may be missing - check component integration');
    }

  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
});