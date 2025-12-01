import { test, expect } from '@playwright/test';

// Comprehensive Quality Validation Test Suite for Edge-dev
// Tests all critical functionality, styling, and user experience elements

test.describe('Edge-dev Comprehensive Quality Validation', () => {

  // Development Server Validation
  test.describe('Development Server Validation', () => {
    test('should load site successfully within 10 seconds', async ({ page }) => {
      const startTime = Date.now();

      // Navigate with extended timeout
      await page.goto('http://localhost:5657', { timeout: 10000 });

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(10000);

      // Verify page loaded successfully
      await expect(page).toHaveTitle(/Edge.*Dev|Edge.*Dashboard/i);
    });

    test('should have no critical JavaScript errors in console', async ({ page }) => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('http://localhost:5657');
      await page.waitForLoadState('networkidle');

      // Filter out minor errors, focus on critical ones
      const criticalErrors = errors.filter(error =>
        !error.includes('Favicon') &&
        !error.includes('404') &&
        !error.toLowerCase().includes('warning')
      );

      expect(criticalErrors).toHaveLength(0);
    });

    test('should have proper CSS compilation without errors', async ({ page }) => {
      const cssErrors = [];
      page.on('response', response => {
        if (response.url().includes('.css') && !response.ok()) {
          cssErrors.push(response.url());
        }
      });

      await page.goto('http://localhost:5657');
      await page.waitForLoadState('networkidle');

      expect(cssErrors).toHaveLength(0);
    });
  });

  // UI/UX Validation
  test.describe('UI/UX Validation', () => {
    test('should display Traderra professional dark theme', async ({ page }) => {
      await page.goto('http://localhost:5657');
      await page.waitForLoadState('networkidle');

      // Check for dark theme background
      const body = page.locator('body');
      const backgroundColor = await body.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );

      // Should be dark (RGB values all < 128)
      const isDark = backgroundColor.includes('rgb') &&
        backgroundColor.match(/\d+/g)?.every(val => parseInt(val) < 128);

      expect(isDark).toBe(true);
    });

    test('should have essential UI components visible', async ({ page }) => {
      await page.goto('http://localhost:5657');
      await page.waitForLoadState('networkidle');

      // Check for header/navigation
      const header = page.locator('header, nav, [class*="header"], [class*="nav"]').first();
      await expect(header).toBeVisible();

      // Check for main content area
      const main = page.locator('main, [class*="main"], [class*="content"]').first();
      await expect(main).toBeVisible();
    });

    test('should have working navigation', async ({ page }) => {
      await page.goto('http://localhost:5657');
      await page.waitForLoadState('networkidle');

      // Look for navigation links
      const navLinks = page.locator('a[href], button[role="button"]');
      const linkCount = await navLinks.count();

      expect(linkCount).toBeGreaterThan(0);

      // Test clicking first navigation element
      if (linkCount > 0) {
        const firstLink = navLinks.first();
        await firstLink.click();
        // Wait for any navigation to complete
        await page.waitForTimeout(1000);
      }
    });

    test('should display scanning/backtesting UI elements', async ({ page }) => {
      await page.goto('http://localhost:5657');
      await page.waitForLoadState('networkidle');

      // Look for scanning or trading related elements
      const scanElements = page.locator('[class*="scan"], [class*="chart"], [class*="trade"], [class*="backtest"]');
      const scanCount = await scanElements.count();

      // Should have at least one scanning/trading related element
      expect(scanCount).toBeGreaterThan(0);
    });
  });

  // Technical Verification
  test.describe('Technical Verification', () => {
    test('should load Tailwind CSS utilities', async ({ page }) => {
      await page.goto('http://localhost:5657');
      await page.waitForLoadState('networkidle');

      // Check if Tailwind utilities are available
      const hasUtilities = await page.evaluate(() => {
        const testElement = document.createElement('div');
        testElement.className = 'flex justify-center items-center';
        document.body.appendChild(testElement);

        const styles = window.getComputedStyle(testElement);
        const hasFlexDisplay = styles.display === 'flex';
        const hasJustifyCenter = styles.justifyContent === 'center';

        document.body.removeChild(testElement);
        return hasFlexDisplay && hasJustifyCenter;
      });

      expect(hasUtilities).toBe(true);
    });

    test('should have custom CSS properties working', async ({ page }) => {
      await page.goto('http://localhost:5657');
      await page.waitForLoadState('networkidle');

      // Check for CSS custom properties
      const hasCustomProps = await page.evaluate(() => {
        const rootStyles = window.getComputedStyle(document.documentElement);
        const customProp = rootStyles.getPropertyValue('--background') ||
                         rootStyles.getPropertyValue('--primary') ||
                         rootStyles.getPropertyValue('--foreground');
        return customProp.trim() !== '';
      });

      expect(hasCustomProps).toBe(true);
    });

    test('should be responsive on mobile devices', async ({ page }) => {
      await page.goto('http://localhost:5657');
      await page.waitForLoadState('networkidle');

      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      // Check if layout adapts to mobile
      const body = page.locator('body');
      const width = await body.boundingBox();

      expect(width?.width).toBeLessThanOrEqual(375);
    });
  });

  // Functionality Tests
  test.describe('Core Functionality', () => {
    test('should handle Renata AI chat interface if present', async ({ page }) => {
      await page.goto('http://localhost:5657');
      await page.waitForLoadState('networkidle');

      // Look for chat elements
      const chatElements = page.locator('[class*="chat"], [class*="ai"], [class*="renata"]');
      const chatCount = await chatElements.count();

      if (chatCount > 0) {
        // Test first chat element is visible
        await expect(chatElements.first()).toBeVisible();

        // Look for input field
        const chatInput = page.locator('input[type="text"], textarea, [contenteditable]');
        const inputCount = await chatInput.count();

        if (inputCount > 0) {
          await expect(chatInput.first()).toBeVisible();
        }
      }
    });

    test('should handle dashboard toggle functionality', async ({ page }) => {
      await page.goto('http://localhost:5657');
      await page.waitForLoadState('networkidle');

      // Look for toggle elements
      const toggles = page.locator('button[role="switch"], input[type="checkbox"], [class*="toggle"]');
      const toggleCount = await toggles.count();

      if (toggleCount > 0) {
        const firstToggle = toggles.first();
        await expect(firstToggle).toBeVisible();

        // Test toggle interaction
        await firstToggle.click();
        await page.waitForTimeout(500);
      }
    });

    test('should load without network errors', async ({ page }) => {
      const failedRequests = [];

      page.on('response', response => {
        if (!response.ok() && response.status() >= 400) {
          failedRequests.push({
            url: response.url(),
            status: response.status()
          });
        }
      });

      await page.goto('http://localhost:5657');
      await page.waitForLoadState('networkidle');

      // Filter out expected 404s (like favicon)
      const criticalFailures = failedRequests.filter(req =>
        !req.url.includes('favicon') &&
        !req.url.includes('.ico') &&
        req.status !== 404
      );

      expect(criticalFailures).toHaveLength(0);
    });
  });

  // Performance Quality Gates
  test.describe('Performance Quality Gates', () => {
    test('should meet performance benchmarks', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('http://localhost:5657');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Quality gates
      expect(loadTime).toBeLessThan(10000); // 10 second max load time

      // Check for performance marks
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as any;
        return {
          domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
          loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart
        };
      });

      // Basic performance validation
      expect(performanceMetrics.domContentLoaded).toBeGreaterThan(0);
    });
  });

  // Security Validation
  test.describe('Security Validation', () => {
    test('should not expose sensitive information in console', async ({ page }) => {
      const suspiciousLogs = [];

      page.on('console', msg => {
        const text = msg.text().toLowerCase();
        if (text.includes('password') || text.includes('token') || text.includes('secret') || text.includes('key')) {
          suspiciousLogs.push(text);
        }
      });

      await page.goto('http://localhost:5657');
      await page.waitForLoadState('networkidle');

      expect(suspiciousLogs).toHaveLength(0);
    });

    test('should use HTTPS headers when available', async ({ page }) => {
      const response = await page.goto('http://localhost:5657');
      const headers = response?.headers() || {};

      // In development, we don't expect all security headers, but check what we can
      const hasSecurityHeaders = Object.keys(headers).some(header =>
        header.toLowerCase().includes('security') ||
        header.toLowerCase().includes('content-security-policy')
      );

      // This is informational for development environment
      console.log('Security headers present:', hasSecurityHeaders);
    });
  });
});