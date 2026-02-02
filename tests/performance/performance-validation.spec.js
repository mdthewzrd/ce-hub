/**
 * Performance Validation Tests for CE-Hub
 *
 * These tests validate that the application performs within acceptable limits
 * for optimal user experience, including load times, interactions, and resource usage.
 */

const { test, expect } = require('@playwright/test');

test.describe('Performance Validation', () => {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:5657';

  test('Page load performance meets standards', async ({ page }) => {
    console.log('Testing page load performance...');

    // Start performance monitoring
    const performanceEntries = [];

    page.on('response', response => {
      performanceEntries.push({
        url: response.url(),
        status: response.status(),
        timing: Date.now()
      });
    });

    const startTime = Date.now();

    // Navigate to page
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;

    // Validate load time is within acceptable limits
    expect(loadTime).toBeLessThan(8000); // 8 seconds max for complex apps
    console.log(`✓ Page loaded in ${loadTime}ms`);

    // Check Core Web Vitals metrics if available
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals = {};

            entries.forEach(entry => {
              if (entry.entryType === 'largest-contentful-paint') {
                vitals.LCP = entry.renderTime || entry.loadTime;
              }
              if (entry.entryType === 'first-input') {
                vitals.FID = entry.processingStart - entry.startTime;
              }
              if (entry.entryType === 'layout-shift') {
                if (!entry.hadRecentInput) {
                  vitals.CLS = (vitals.CLS || 0) + entry.value;
                }
              }
            });

            resolve(vitals);
            observer.disconnect();
          });

          observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

          // Fallback timeout
          setTimeout(() => resolve({}), 5000);
        } else {
          resolve({});
        }
      });
    });

    // Validate Core Web Vitals (if available)
    if (webVitals.LCP) {
      expect(webVitals.LCP).toBeLessThan(4000); // 4 seconds
      console.log(`✓ Largest Contentful Paint: ${webVitals.LCP}ms`);
    }

    if (webVitals.FID) {
      expect(webVitals.FID).toBeLessThan(300); // 300ms
      console.log(`✓ First Input Delay: ${webVitals.FID}ms`);
    }

    if (webVitals.CLS) {
      expect(webVitals.CLS).toBeLessThan(0.25); // 0.25
      console.log(`✓ Cumulative Layout Shift: ${webVitals.CLS}`);
    }

    // Check resource loading performance
    const resourceTiming = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return {
        totalResources: resources.length,
        totalSize: resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0),
        slowResources: resources.filter(resource => resource.duration > 2000).length,
        failedResources: resources.filter(resource => {
          const entries = performance.getEntriesByName(resource.name);
          return entries.some(entry => entry.decodedBodyLength === 0 && entry.transferSize === 0);
        }).length
      };
    });

    console.log(`✓ Loaded ${resourceTiming.totalResources} resources`);
    console.log(`✓ Total transfer size: ${(resourceTiming.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`✓ Slow resources: ${resourceTiming.slowResources}`);
    console.log(`✓ Failed resources: ${resourceTiming.failedResources}`);

    expect(resourceTiming.failedResources).toBeLessThan(3);
    expect(resourceTiming.slowResources).toBeLessThan(5);
  });

  test('Interaction performance is responsive', async ({ page }) => {
    console.log('Testing interaction performance...');

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Test click responsiveness
    const clickableElements = page.locator('button, [role="button"], a[href]');
    const clickableCount = await clickableElements.count();

    if (clickableCount > 0) {
      const firstClickable = clickableElements.first();
      if (await firstClickable.isVisible()) {
        const clickStartTime = Date.now();

        await firstClickable.click();

        const clickResponseTime = Date.now() - clickStartTime;
        expect(clickResponseTime).toBeLessThan(500); // 500ms max response time
        console.log(`✓ Click response time: ${clickResponseTime}ms`);

        // Wait for any potential navigation or state change
        await page.waitForTimeout(1000);
      }
    }

    // Test form input responsiveness
    const inputElements = page.locator('input, textarea, select');
    const inputCount = await inputElements.count();

    if (inputCount > 0) {
      const firstInput = inputElements.first();
      if (await firstInput.isVisible()) {
        const inputStartTime = Date.now();

        await firstInput.focus();
        await firstInput.fill('test input');

        const inputResponseTime = Date.now() - inputStartTime;
        expect(inputResponseTime).toBeLessThan(300); // 300ms max for input
        console.log(`✓ Input response time: ${inputResponseTime}ms`);

        // Clear input for cleanup
        await firstInput.fill('');
      }
    }

    // Test hover responsiveness
    const hoverableElements = page.locator('button, [role="button"], .card, .component');
    const hoverableCount = await hoverableElements.count();

    if (hoverableCount > 0) {
      const firstHoverable = hoverableElements.first();
      if (await firstHoverable.isVisible()) {
        const hoverStartTime = Date.now();

        await firstHoverable.hover();

        const hoverResponseTime = Date.now() - hoverStartTime;
        expect(hoverResponseTime).toBeLessThan(200); // 200ms max for hover
        console.log(`✓ Hover response time: ${hoverResponseTime}ms`);
      }
    }
  });

  test('Memory usage and stability', async ({ page }) => {
    console.log('Testing memory usage and stability...');

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });

    if (initialMemory) {
      console.log(`Initial memory usage: ${(initialMemory.used / 1024 / 1024).toFixed(2)} MB`);

      // Perform some interactions to test memory growth
      for (let i = 0; i < 5; i++) {
        // Scroll up and down
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight / 2);
        });
        await page.waitForTimeout(500);

        await page.evaluate(() => {
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(500);

        // Try to interact with elements if available
        const buttons = page.locator('button, [role="button"]');
        if (await buttons.count() > 0) {
          const visibleButtons = buttons.filter({ hasVisible: true });
          const buttonCount = await visibleButtons.count();
          if (buttonCount > 0) {
            await visibleButtons.nth(i % buttonCount).hover();
            await page.waitForTimeout(200);
          }
        }
      }

      // Check final memory usage
      const finalMemory = await page.evaluate(() => {
        if (performance.memory) {
          return {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          };
        }
        return null;
      });

      if (finalMemory) {
        const memoryGrowth = finalMemory.used - initialMemory.used;
        const memoryGrowthMB = memoryGrowth / 1024 / 1024;

        console.log(`Final memory usage: ${(finalMemory.used / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Memory growth: ${memoryGrowthMB.toFixed(2)} MB`);

        // Memory growth should be reasonable (< 50MB for basic interactions)
        expect(memoryGrowthMB).toBeLessThan(50);

        // Final memory usage should be reasonable (< 200MB)
        const finalMemoryMB = finalMemory.used / 1024 / 1024;
        expect(finalMemoryMB).toBeLessThan(200);

        console.log('✓ Memory usage within acceptable limits');
      }
    } else {
      console.log('⚠️  Memory API not available in this browser');
    }
  });

  test('Network performance and optimization', async ({ page }) => {
    console.log('Testing network performance...');

    const networkRequests = [];

    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      });
    });

    page.on('response', response => {
      const request = networkRequests.find(req => req.url === response.url());
      if (request) {
        request.status = response.status();
        request.responseTime = Date.now() - request.timestamp;
        request.size = response.headers()['content-length'] || 0;
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Wait for delayed requests

    // Analyze network requests
    const completedRequests = networkRequests.filter(req => req.status && req.responseTime);

    console.log(`✓ Made ${completedRequests.length} network requests`);

    if (completedRequests.length > 0) {
      const slowRequests = completedRequests.filter(req => req.responseTime > 3000);
      const failedRequests = completedRequests.filter(req => req.status >= 400);

      console.log(`✓ Slow requests (>3s): ${slowRequests.length}`);
      console.log(`✓ Failed requests (4xx/5xx): ${failedRequests.length}`);

      // Log slow requests for debugging
      slowRequests.forEach(req => {
        console.log(`  - ${req.url}: ${req.responseTime}ms`);
      });

      expect(failedRequests.length).toBeLessThan(3);
      expect(slowRequests.length).toBeLessThan(completedRequests.length * 0.1); // Less than 10% slow

      // Check for optimized resource loading
      const cssRequests = completedRequests.filter(req => req.url.includes('.css'));
      const jsRequests = completedRequests.filter(req => req.url.includes('.js'));

      console.log(`✓ CSS files loaded: ${cssRequests.length}`);
      console.log(`✓ JS files loaded: ${jsRequests.length}`);

      // Check for compression (content-encoding header)
      const compressedResponses = await page.evaluate(() => {
        return performance.getEntriesByType('resource').filter(entry => {
          // This is a simplified check - in real implementation you'd check headers
          return entry.name.includes('.js') || entry.name.includes('.css');
        }).length;
      });

      console.log(`✓ Compressible resources: ${compressedResponses}`);
    }
  });

  test('Rendering performance and smoothness', async ({ page }) => {
    console.log('Testing rendering performance...');

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Test scrolling performance
    const scrollStartTime = Date.now();

    await page.evaluate(async () => {
      const scrollContainer = document.documentElement || document.body;
      const totalHeight = scrollContainer.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollDistance = Math.max(0, totalHeight - viewportHeight);

      // Smooth scroll in chunks
      const chunkSize = 200;
      for (let i = 0; i <= scrollDistance; i += chunkSize) {
        window.scrollTo(0, i);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Scroll back up
      for (let i = scrollDistance; i >= 0; i -= chunkSize) {
        window.scrollTo(0, i);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    });

    const scrollDuration = Date.now() - scrollStartTime;
    console.log(`✓ Scroll performance test completed in ${scrollDuration}ms`);

    // Test frame rate during interactions
    const frameData = await page.evaluate(async () => {
      return new Promise((resolve) => {
        let frameCount = 0;
        let lastTime = performance.now();

        function countFrames() {
          frameCount++;
          const currentTime = performance.now();

          if (currentTime - lastTime >= 1000) { // 1 second
            resolve({
              frames: frameCount,
              duration: currentTime - lastTime,
              fps: frameCount
            });
          } else {
            requestAnimationFrame(countFrames);
          }
        }

        requestAnimationFrame(countFrames);

        // Fallback timeout
        setTimeout(() => resolve({
          frames: frameCount,
          duration: performance.now() - lastTime,
          fps: frameCount
        }), 2000);
      });
    });

    console.log(`✓ Measured ${frameData.fps} frames per second`);

    // 60 FPS is ideal, 30 FPS is acceptable for complex applications
    expect(frameData.fps).toBeGreaterThan(25);

    // Test CSS animations performance (if any)
    const animatedElements = page.locator('[style*="animation"], [style*="transition"]');
    const animatedCount = await animatedElements.count();

    if (animatedCount > 0) {
      console.log(`✓ Found ${animatedCount} animated/transitioned elements`);

      // Test that animations complete smoothly
      await page.waitForTimeout(1000);

      // Check for unfinished animations
      const unfinishedAnimations = await page.evaluate(() => {
        const elements = document.querySelectorAll('[style*="animation"], [style*="transition"]');
        return Array.from(elements).filter(el => {
          const style = window.getComputedStyle(el);
          return style.animationPlayState === 'running' ||
                 (style.transition && style.transition !== 'none 0s ease 0s');
        }).length;
      });

      console.log(`✓ Unfinished animations: ${unfinishedAnimations}`);
    }
  });
});