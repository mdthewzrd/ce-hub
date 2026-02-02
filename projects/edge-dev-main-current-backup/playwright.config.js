/**
 * Playwright Configuration for CE-Hub User Experience Validation
 *
 * This configuration is optimized for comprehensive user experience testing,
 * including visual regression, performance validation, and accessibility testing.
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // Test directory configuration
  testDir: './tests',

  // Test patterns to find our new validation tests
  testMatch: [
    '**/*.spec.js',
    '**/*.spec.ts',
    '**/*.test.js',
    '**/*.test.ts'
  ],

  // Test timeout (extended for comprehensive UX testing)
  timeout: 90 * 1000, // 90 seconds

  // Expect timeout for assertions
  expect: {
    timeout: 20 * 1000, // 20 seconds for UI interactions
    toHaveScreenshot: {
      threshold: 0.2, // Allow for minor rendering differences
      mode: 'auto', // Only compare visual changes if baseline exists
      animations: 'disabled' // Disable animations for consistent screenshots
    }
  },

  // Test execution configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, // No retries in local development for faster feedback
  workers: process.env.CI ? 2 : 4, // More workers in development

  // Reporter configuration for different environments
  reporter: [
    ['html', {
      outputFolder: 'test-results/html',
      open: process.env.CI ? 'never' : 'on-failure'
    }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['line']
  ],

  // Global test configuration
  use: {
    // Application URL - uses the same as your development server
    baseURL: process.env.BASE_URL || 'http://localhost:5657',

    // Browser context options
    ignoreHTTPSErrors: true,
    acceptDownloads: true,

    // Viewport configuration
    viewport: { width: 1920, height: 1080 },

    // Action timeouts (important for UX testing)
    actionTimeout: 15 * 1000,
    navigationTimeout: 45 * 1000,

    // Screenshots and videos for debugging
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // Locale and timezone for consistent testing
    locale: 'en-US',
    timezoneId: 'America/New_York',

    // User agent for consistent behavior
    userAgent: 'CE-Hub-UX-Validation-Agent',

    // Additional context options for comprehensive testing
    permissions: ['geolocation', 'notifications'],
    colorScheme: 'light', // Test default light theme
    reducedMotion: 'reduce', // Reduce motion for accessibility testing

    // Network configuration
    bypassCSP: false,
    offline: false,
    httpCredentials: undefined
  },

  // Projects configuration for multi-device and multi-browser testing
  projects: [
    // Primary desktop browser for most testing
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    // Cross-browser compatibility testing
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

    // Mobile responsiveness testing
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        // Additional mobile-specific settings
        userAgent: 'CE-Hub-Mobile-Validation-Agent'
      },
    },

    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        userAgent: 'CE-Hub-Mobile-Validation-Agent'
      },
    },

    // Tablet testing
    {
      name: 'tablet-chrome',
      use: {
        ...devices['iPad Pro'],
        userAgent: 'CE-Hub-Tablet-Validation-Agent'
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
            '--enable-automation',
            '--no-sandbox',
            '--disable-dev-shm-usage'
          ]
        }
      },
      testMatch: '**/performance/*.spec.js'
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
            '--disable-renderer-backgrounding',
            '--disable-font-subpixel-positioning'
          ]
        }
      },
      testMatch: '**/visual/*.spec.js'
    }
  ],

  // Web server configuration
  webServer: {
    command: 'npm run dev',
    port: 5657,
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // 3 minutes for server startup
    env: {
      NODE_ENV: 'test'
    }
  },

  // Global setup and teardown
  globalSetup: require.resolve('./tests/setup/global-setup.js'),
  globalTeardown: require.resolve('./tests/setup/global-teardown.js'),

  // Output directories
  outputDir: 'test-results/artifacts',

  // Test metadata
  metadata: {
    platform: 'CE-Hub Trading Platform',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'test',
    timestamp: new Date().toISOString(),
    validation_type: 'User Experience'
  },

  // Custom test configuration for UX validation
  grep: process.env.GREP || undefined, // Allow filtering tests with grep
  grepInvert: process.env.GREP_INVERT ? new RegExp(process.env.GREP_INVERT) : undefined,

  // Test organization
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**'
  ]
});