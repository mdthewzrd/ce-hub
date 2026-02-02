// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration for Edge.dev Trading Platform
 *
 * This configuration is optimized for financial trading applications with:
 * - Real-time data handling
 * - Chart interactions
 * - Mobile responsiveness
 * - Visual regression testing
 * - Security validation
 */

module.exports = defineConfig({
  // Test directory and pattern configuration
  testDir: './tests',
  testMatch: [
    '**/*.spec.js',
    '**/*.spec.ts',
    '**/*.test.js',
    '**/*.test.ts'
  ],

  // Global test timeout (extended for financial data loading)
  timeout: 60 * 1000, // 60 seconds for API calls and chart rendering

  // Expect timeout for assertions
  expect: {
    timeout: 15 * 1000, // 15 seconds for element visibility/data loading
    toHaveScreenshot: {
      threshold: 0.3, // Allow for minor chart rendering differences
      mode: 'pixel'
    }
  },

  // Test execution configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry failed tests in CI
  workers: process.env.CI ? 2 : undefined, // Limit workers in CI for stability

  // Reporter configuration for different environments
  reporter: [
    ['html', {
      outputFolder: 'test-results/html-report',
      open: process.env.CI ? 'never' : 'on-failure'
    }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['line']
  ],

  // Global test configuration
  use: {
    // Application URL
    baseURL: 'http://localhost:5657',

    // Browser context options
    ignoreHTTPSErrors: true,
    acceptDownloads: true,

    // Viewport configuration for trading dashboard
    viewport: { width: 1920, height: 1080 },

    // Action timeouts (important for chart interactions)
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,

    // Screenshots and videos for debugging
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // Locale and timezone for consistent financial data
    locale: 'en-US',
    timezoneId: 'America/New_York', // NYSE timezone

    // User agent for consistent behavior
    userAgent: 'Playwright-EdgeDev-TestAgent',

    // Storage state for persistent authentication (if needed)
    // storageState: 'tests/fixtures/auth.json',

    // Additional context options for financial apps
    permissions: ['geolocation', 'notifications'],
    colorScheme: 'dark', // Match trading platform theme
    reducedMotion: 'no-preference', // Allow animations for chart testing

    // Network configuration
    bypassCSP: false,
    offline: false,
    httpCredentials: undefined
  },

  // Projects configuration for multi-browser and multi-device testing
  projects: [
    // Desktop browsers
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    // Mobile devices (important for responsive trading interfaces)
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet devices (common for traders)
    {
      name: 'tablet-chrome',
      use: { ...devices['iPad Pro'] },
    },

    // High DPI displays (common in trading setups)
    {
      name: 'high-dpi-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 2560, height: 1440 },
        deviceScaleFactor: 2
      },
    },

    // Different viewport sizes for trading dashboards
    {
      name: 'ultrawide-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 3440, height: 1440 } // 21:9 ultrawide
      },
    },

    // Performance testing project
    {
      name: 'performance-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--enable-automation'
          ]
        }
      },
    },

    // Visual regression testing project
    {
      name: 'visual-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Force consistent rendering for visual tests
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ]
        }
      },
    }
  ],

  // Web server configuration
  webServer: {
    command: 'npm run dev',
    port: 5657,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for server startup
    env: {
      NODE_ENV: 'test'
    }
  },

  // Global setup and teardown
  globalSetup: require.resolve('./tests/setup/global-setup.js'),
  globalTeardown: require.resolve('./tests/setup/global-teardown.js'),

  // Output directories
  outputDir: 'test-results',

  // Test metadata
  metadata: {
    platform: 'Edge.dev Trading Platform',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'test',
    timestamp: new Date().toISOString()
  }
});