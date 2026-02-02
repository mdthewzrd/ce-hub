const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Global Setup for Edge.dev Trading Platform Tests
 *
 * This setup performs the following:
 * 1. Validates test environment
 * 2. Sets up authentication if needed
 * 3. Prepares test data
 * 4. Validates API connectivity
 * 5. Warms up application cache
 */

async function globalSetup(config) {
  console.log('🚀 Starting Edge.dev Trading Platform Test Suite Setup...');

  const setupStartTime = Date.now();

  try {
    // 1. Validate environment variables
    console.log('📋 Validating test environment...');
    validateEnvironment();

    // 2. Create test directories if they don't exist
    console.log('📁 Creating test output directories...');
    createTestDirectories();

    // 3. Setup authentication state (if needed)
    console.log('🔐 Setting up authentication state...');
    await setupAuthentication(config);

    // 4. Validate application availability
    console.log('🌐 Validating application availability...');
    await validateApplicationHealth(config);

    // 5. Prepare test data
    console.log('📊 Preparing test data...');
    await prepareTestData();

    // 6. Warm up application cache
    console.log('⚡ Warming up application cache...');
    await warmupApplication(config);

    const setupDuration = Date.now() - setupStartTime;
    console.log(`✅ Global setup completed successfully in ${setupDuration}ms`);

    // Save setup metadata
    const setupMetadata = {
      timestamp: new Date().toISOString(),
      duration: setupDuration,
      environment: process.env.NODE_ENV || 'test',
      baseURL: config.use?.baseURL || 'http://localhost:5657',
      platform: process.platform,
      nodeVersion: process.version
    };

    fs.writeFileSync(
      path.join(__dirname, '../fixtures/setup-metadata.json'),
      JSON.stringify(setupMetadata, null, 2)
    );

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

function validateEnvironment() {
  const requiredEnvVars = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  // Set default test environment variables
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';

  console.log(`  ✓ Environment: ${process.env.NODE_ENV}`);
  console.log(`  ✓ Platform: ${process.platform}`);
  console.log(`  ✓ Node.js: ${process.version}`);
}

function createTestDirectories() {
  const directories = [
    'test-results',
    'test-results/screenshots',
    'test-results/videos',
    'test-results/traces',
    'test-results/html-report',
    'tests/fixtures/auth',
    'tests/fixtures/data',
    'tests/fixtures/mock-api'
  ];

  for (const dir of directories) {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`  ✓ Created directory: ${dir}`);
    }
  }
}

async function setupAuthentication(config) {
  // For now, Edge.dev doesn't require authentication
  // This is a placeholder for future authentication setup

  const authState = {
    cookies: [],
    origins: [
      {
        origin: config.use?.baseURL || 'http://localhost:5657',
        localStorage: [],
        sessionStorage: []
      }
    ]
  };

  const authPath = path.join(__dirname, '../fixtures/auth/test-auth-state.json');
  fs.writeFileSync(authPath, JSON.stringify(authState, null, 2));

  console.log('  ✓ Authentication state prepared');
}

async function validateApplicationHealth(config) {
  const baseURL = config.use?.baseURL || 'http://localhost:5657';

  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Set longer timeout for initial load
    page.setDefaultTimeout(30000);

    console.log(`  📡 Checking application at ${baseURL}...`);
    await page.goto(baseURL, { waitUntil: 'networkidle' });

    // Verify the page loads correctly
    const title = await page.title();
    console.log(`  ✓ Application loaded: ${title}`);

    // Check for critical elements
    const hasLogo = await page.locator('[data-testid="app-logo"], h1:has-text("Edge.dev")').isVisible();
    if (hasLogo) {
      console.log('  ✓ Main application UI detected');
    } else {
      console.log('  ⚠️  Main UI not immediately visible (may be loading)');
    }

    await browser.close();

  } catch (error) {
    console.error(`  ❌ Application health check failed: ${error.message}`);
    throw error;
  }
}

async function prepareTestData() {
  // Mock trading data for consistent testing
  const mockTradingData = {
    scanResults: [
      { ticker: 'AAPL', gapPercent: 5.2, volume: 50000000, rMultiple: 2.5 },
      { ticker: 'TSLA', gapPercent: 8.7, volume: 75000000, rMultiple: 3.2 },
      { ticker: 'MSFT', gapPercent: 3.1, volume: 35000000, rMultiple: 1.8 },
      { ticker: 'GOOGL', gapPercent: 6.4, volume: 25000000, rMultiple: 2.9 },
      { ticker: 'NVDA', gapPercent: 12.3, volume: 100000000, rMultiple: 4.1 }
    ],
    chartData: {
      SPY: {
        timeframes: ['5min', '15min', 'hour', 'day'],
        sampleData: {
          dates: Array.from({length: 100}, (_, i) => new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()),
          opens: Array.from({length: 100}, () => 400 + Math.random() * 50),
          highs: Array.from({length: 100}, () => 420 + Math.random() * 30),
          lows: Array.from({length: 100}, () => 390 + Math.random() * 20),
          closes: Array.from({length: 100}, () => 410 + Math.random() * 40),
          volumes: Array.from({length: 100}, () => 50000000 + Math.random() * 20000000)
        }
      }
    },
    projects: [
      { id: 1, name: 'Gap Up Scanner', active: true, description: 'Test scanner project' },
      { id: 2, name: 'Breakout Strategy', active: false, description: 'Test breakout project' },
      { id: 3, name: 'Volume Surge', active: false, description: 'Test volume project' }
    ]
  };

  const testDataPath = path.join(__dirname, '../fixtures/data/mock-trading-data.json');
  fs.writeFileSync(testDataPath, JSON.stringify(mockTradingData, null, 2));

  console.log('  ✓ Test trading data prepared');

  // Create sample market calendar data
  const marketCalendar = {
    tradingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    marketHours: {
      premarket: { start: '04:00', end: '09:30' },
      regular: { start: '09:30', end: '16:00' },
      afterhours: { start: '16:00', end: '20:00' }
    },
    timezone: 'America/New_York',
    holidays: ['2024-12-25', '2024-01-01', '2024-07-04']
  };

  const calendarPath = path.join(__dirname, '../fixtures/data/market-calendar.json');
  fs.writeFileSync(calendarPath, JSON.stringify(marketCalendar, null, 2));

  console.log('  ✓ Market calendar data prepared');
}

async function warmupApplication(config) {
  const baseURL = config.use?.baseURL || 'http://localhost:5657';

  try {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    console.log('  🔥 Warming up application...');

    // Load main page and let it settle
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Interact with key elements to trigger loading
    try {
      // Click on different projects to warm up data loading
      await page.click('[data-testid="project-item"], .sidebar-project-item', { timeout: 5000 });
      await page.waitForTimeout(1000);

      // Trigger scan if button is available
      const scanButton = page.locator('button:has-text("Run Scan"), button[data-testid="run-scan"]');
      if (await scanButton.isVisible({ timeout: 2000 })) {
        await scanButton.click();
        await page.waitForTimeout(2000);
      }

      // Interact with chart if available
      const chartContainer = page.locator('[data-testid="chart-container"], .chart-container');
      if (await chartContainer.isVisible({ timeout: 2000 })) {
        await chartContainer.hover();
        console.log('  ✓ Chart container detected and warmed up');
      }

    } catch (warmupError) {
      console.log('  ⚠️  Warmup interactions partially completed');
    }

    await browser.close();
    console.log('  ✓ Application warmup completed');

  } catch (error) {
    console.log(`  ⚠️  Application warmup had issues: ${error.message}`);
    // Don't fail setup for warmup issues
  }
}

module.exports = globalSetup;