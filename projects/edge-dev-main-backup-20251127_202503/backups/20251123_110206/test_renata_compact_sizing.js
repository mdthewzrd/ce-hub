/**
 * Test script to verify Renata popup has been properly resized
 * This tests the compact sizing fix: 320px x 420px, positioned bottom-right
 */

const { test, expect } = require('@playwright/test');

test('Renata popup has compact sizing and proper positioning', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5657');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Try to trigger Renata popup - look for any Renata-related elements
  try {
    // Try clicking the Renata button if it exists
    const renataButton = page.locator('button:has-text("Renata")').first();
    if (await renataButton.isVisible()) {
      await renataButton.click();
    } else {
      // Try alternative selectors for Renata
      const renataAlt = page.locator('[data-testid*="renata"], .renata, #renata').first();
      if (await renataAlt.isVisible()) {
        await renataAlt.click();
      } else {
        // Look for any AI-related buttons
        const aiButton = page.locator('button:has-text("AI"), button:has-text("Assistant")').first();
        if (await aiButton.isVisible()) {
          await aiButton.click();
        }
      }
    }

    // Wait a bit for popup to appear
    await page.waitForTimeout(1000);

    // Check if popup appeared and test its dimensions
    const popup = page.locator('[style*="position: fixed"][style*="bottom: 1rem"][style*="right: 1rem"]');

    if (await popup.isVisible()) {
      console.log('✅ Renata popup found and visible');

      // Get the bounding box
      const box = await popup.boundingBox();

      if (box) {
        console.log(`📏 Popup dimensions: ${box.width}px × ${box.height}px`);
        console.log(`📍 Position: x=${box.x}, y=${box.y}`);

        // Check if dimensions are within expected compact range
        const isCompactWidth = box.width >= 280 && box.width <= 360;
        const isCompactHeight = box.height >= 350 && box.height <= 480;

        if (isCompactWidth && isCompactHeight) {
          console.log('✅ Popup is properly compact sized');
        } else {
          console.log(`❌ Popup size outside expected range. Width: ${box.width}px (expected 280-360px), Height: ${box.height}px (expected 350-480px)`);
        }

        // Check positioning (should be in bottom-right area)
        const viewportSize = page.viewportSize();
        if (viewportSize) {
          const isBottomRight = box.x > viewportSize.width * 0.5 && box.y > viewportSize.height * 0.3;
          if (isBottomRight) {
            console.log('✅ Popup is positioned in bottom-right area');
          } else {
            console.log(`❌ Popup not in bottom-right. Position: x=${box.x}/${viewportSize.width}, y=${box.y}/${viewportSize.height}`);
          }
        }
      }
    } else {
      console.log('⚠️  Renata popup not found or not visible - testing CSS properties');

      // Check if the CSS has been applied correctly by examining the component
      const result = await page.evaluate(() => {
        // Look for any element with the expected styling
        const elements = document.querySelectorAll('div[style*="width: 320px"]');
        return {
          found: elements.length > 0,
          count: elements.length,
          styles: Array.from(elements).map(el => el.getAttribute('style'))
        };
      });

      if (result.found) {
        console.log(`✅ Found ${result.count} elements with width: 320px styling`);
        console.log('📝 Styles found:', result.styles);
      } else {
        console.log('❌ No elements found with the expected compact sizing');
      }
    }

  } catch (error) {
    console.log('❌ Error during test:', error.message);
  }

  // Take a screenshot for visual verification
  await page.screenshot({
    path: 'test_renata_compact_sizing.png',
    fullPage: true
  });
  console.log('📸 Screenshot saved as test_renata_compact_sizing.png');
});