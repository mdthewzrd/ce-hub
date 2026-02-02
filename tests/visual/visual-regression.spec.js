/**
 * Visual Regression Tests for CE-Hub
 *
 * These tests capture screenshots of key application states and compare them
 * against baseline images to detect visual changes that might affect user experience.
 */

const { test, expect } = require('@playwright/test');

test.describe('Visual Regression Tests', () => {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:5657';

  test('Homepage visual consistency', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for dynamic content to load
    await page.waitForTimeout(2000);

    // Capture full page screenshot
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      animations: 'disabled'
    });

    // Capture viewport screenshot
    await expect(page).toHaveScreenshot('homepage-viewport.png', {
      fullPage: false,
      animations: 'disabled'
    });
  });

  test('Mobile viewport visual consistency', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Tablet viewport visual consistency', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Dark mode visual consistency (if supported)', async ({ page }) => {
    // Test dark mode if the application supports it
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to enable dark mode
    const darkModeSelectors = [
      '[data-testid="dark-mode-toggle"]',
      '.dark-mode-toggle',
      'button[aria-label*="dark"]',
      '.theme-toggle'
    ];

    let darkModeEnabled = false;
    for (const selector of darkModeSelectors) {
      try {
        const toggle = page.locator(selector);
        if (await toggle.count() > 0 && await toggle.isVisible()) {
          await toggle.click();
          await page.waitForTimeout(1000);
          darkModeEnabled = true;
          break;
        }
      } catch (error) {
        // Continue trying other selectors
      }
    }

    if (darkModeEnabled || await page.evaluate(() => window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      await expect(page).toHaveScreenshot('homepage-dark-mode.png', {
        fullPage: true,
        animations: 'disabled'
      });
      console.log('✓ Dark mode visual regression test completed');
    } else {
      console.log('⚠️  Dark mode not available, skipping dark mode visual test');
    }
  });

  test('Key interactive elements visual consistency', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find key interactive elements
    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      // Hover over first button to test hover states
      const firstButton = buttons.first();
      if (await firstButton.isVisible()) {
        await firstButton.hover();
        await page.waitForTimeout(500);

        await expect(page).toHaveScreenshot('button-hover-state.png', {
          fullPage: false,
          animations: 'disabled'
        });
      }
    }

    // Find form inputs if they exist
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      const firstInput = inputs.first();
      if (await firstInput.isVisible()) {
        await firstInput.focus();
        await page.waitForTimeout(500);

        await expect(page).toHaveScreenshot('input-focus-state.png', {
          fullPage: false,
          animations: 'disabled'
        });
      }
    }
  });

  test('AI assistant visual consistency', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to open AI assistant interface
    const aiSelectors = [
      '[data-testid="ai-assistant"]',
      '[data-testid="renata-chat"]',
      '.ai-assistant',
      '.chat-interface'
    ];

    let aiInterface = null;
    for (const selector of aiSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        aiInterface = element.first();
        break;
      }
    }

    // If no interface found, try to click chat button
    if (!aiInterface) {
      const chatButtonSelectors = [
        '[data-testid="chat-toggle"]',
        '.chat-button',
        'button[aria-label*="chat"]'
      ];

      for (const selector of chatButtonSelectors) {
        try {
          const button = page.locator(selector);
          if (await button.count() > 0 && await button.isVisible()) {
            await button.click();
            await page.waitForTimeout(2000);
            break;
          }
        } catch (error) {
          // Continue trying other selectors
        }
      }
    }

    // Check if AI interface is now visible
    for (const selector of aiSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0 && await element.isVisible()) {
        await expect(element.first()).toHaveScreenshot('ai-assistant-interface.png', {
          animations: 'disabled'
        });
        console.log('✓ AI assistant visual regression test completed');
        return;
      }
    }

    console.log('⚠️  AI assistant interface not found for visual testing');
  });

  test('Navigation and layout consistency', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Test header layout
    const headerSelectors = ['header', '.header', '[data-testid="header"]'];
    for (const selector of headerSelectors) {
      const header = page.locator(selector);
      if (await header.count() > 0 && await header.isVisible()) {
        await expect(header.first()).toHaveScreenshot('header-layout.png', {
          animations: 'disabled'
        });
        break;
      }
    }

    // Test navigation if present
    const navSelectors = ['nav', '.navbar', '[data-testid="navigation"]'];
    for (const selector of navSelectors) {
      const nav = page.locator(selector);
      if (await nav.count() > 0 && await nav.isVisible()) {
        await expect(nav.first()).toHaveScreenshot('navigation-layout.png', {
          animations: 'disabled'
        });
        break;
      }
    }

    // Test footer if present
    const footerSelectors = ['footer', '.footer', '[data-testid="footer"]'];
    for (const selector of footerSelectors) {
      const footer = page.locator(selector);
      if (await footer.count() > 0 && await footer.isVisible()) {
        await expect(footer.first()).toHaveScreenshot('footer-layout.png', {
          animations: 'disabled'
        });
        break;
      }
    }
  });

  test('Content rendering consistency', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Extra time for content loading

    // Test text rendering and layout
    const contentSelectors = [
      'main',
      '.main-content',
      '[data-testid="main-content"]',
      '.content'
    ];

    for (const selector of contentSelectors) {
      const content = page.locator(selector);
      if (await content.count() > 0 && await content.isVisible()) {
        await expect(content.first()).toHaveScreenshot('main-content-layout.png', {
          animations: 'disabled'
        });
        break;
      }
    }

    // Test if there are any cards or components that should be consistent
    const cardSelectors = [
      '.card',
      '[data-testid*="card"]',
      '.component',
      '[data-testid*="component"]'
    ];

    const cards = page.locator(cardSelectors.join(','));
    const cardCount = await cards.count();

    if (cardCount > 0) {
      // Test first card appearance
      const firstCard = cards.first();
      if (await firstCard.isVisible()) {
        await expect(firstCard).toHaveScreenshot('component-card.png', {
          animations: 'disabled'
        });
      }
    }
  });
});