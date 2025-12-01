/**
 * Test Infrastructure Validator
 *
 * Validates that the Playwright testing infrastructure is properly configured
 * and all components are working correctly for the Edge.dev trading platform.
 */

const fs = require('fs');
const path = require('path');

class TestValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  /**
   * Run all validation checks
   */
  async validate() {
    console.log('🔍 Validating Edge.dev Playwright Testing Infrastructure...\n');

    await this.validateFileStructure();
    await this.validateConfiguration();
    await this.validateDependencies();
    await this.validateTestFiles();
    await this.validatePageObjects();
    await this.validateFixtures();
    await this.validateScripts();

    this.printResults();
    return this.errors.length === 0;
  }

  /**
   * Validate directory and file structure
   */
  async validateFileStructure() {
    console.log('📁 Validating file structure...');

    const requiredDirs = [
      'tests',
      'tests/e2e',
      'tests/e2e/charts',
      'tests/e2e/trading',
      'tests/e2e/mobile',
      'tests/visual',
      'tests/fixtures',
      'tests/fixtures/data',
      'tests/fixtures/auth',
      'tests/page-objects',
      'tests/page-objects/pages',
      'tests/page-objects/components',
      'tests/setup',
      'tests/utils'
    ];

    const requiredFiles = [
      'playwright.config.js',
      'tests/setup/global-setup.js',
      'tests/setup/global-teardown.js',
      'tests/fixtures/test-fixtures.js',
      'tests/page-objects/pages/TradingDashboard.js',
      'tests/page-objects/components/ChartComponent.js',
      'tests/page-objects/components/ScanResultsTable.js',
      'tests/e2e/page-load-basic.spec.js',
      'tests/e2e/charts/chart-interactions.spec.js',
      'tests/e2e/trading/trading-interface.spec.js',
      'tests/e2e/mobile/mobile-responsiveness.spec.js',
      'tests/visual/visual-regression.spec.js',
      '.github/workflows/playwright-tests.yml'
    ];

    // Check directories
    for (const dir of requiredDirs) {
      if (fs.existsSync(dir)) {
        this.passed.push(`✓ Directory exists: ${dir}`);
      } else {
        this.errors.push(`✗ Missing directory: ${dir}`);
      }
    }

    // Check files
    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        this.passed.push(`✓ File exists: ${file}`);
      } else {
        this.errors.push(`✗ Missing file: ${file}`);
      }
    }
  }

  /**
   * Validate Playwright configuration
   */
  async validateConfiguration() {
    console.log('⚙️  Validating Playwright configuration...');

    try {
      const configPath = 'playwright.config.js';
      if (!fs.existsSync(configPath)) {
        this.errors.push('✗ playwright.config.js not found');
        return;
      }

      const configContent = fs.readFileSync(configPath, 'utf8');

      // Check for required configuration elements
      const requiredConfig = [
        'testDir',
        'timeout',
        'projects',
        'webServer',
        'globalSetup',
        'globalTeardown'
      ];

      for (const config of requiredConfig) {
        if (configContent.includes(config)) {
          this.passed.push(`✓ Config includes: ${config}`);
        } else {
          this.errors.push(`✗ Config missing: ${config}`);
        }
      }

      // Check for trading-specific configuration
      const tradingConfig = [
        'baseURL',
        'timezoneId',
        'America/New_York',
        'localhost:5657'
      ];

      for (const config of tradingConfig) {
        if (configContent.includes(config)) {
          this.passed.push(`✓ Trading config includes: ${config}`);
        } else {
          this.warnings.push(`⚠ Trading config missing: ${config}`);
        }
      }

      // Check for multiple browser projects
      const browserProjects = [
        'chromium-desktop',
        'firefox-desktop',
        'webkit-desktop',
        'mobile-chrome'
      ];

      let browserCount = 0;
      for (const browser of browserProjects) {
        if (configContent.includes(browser)) {
          browserCount++;
          this.passed.push(`✓ Browser project: ${browser}`);
        }
      }

      if (browserCount < 3) {
        this.warnings.push('⚠ Less than 3 browser projects configured');
      }

    } catch (error) {
      this.errors.push(`✗ Error reading config: ${error.message}`);
    }
  }

  /**
   * Validate package.json dependencies and scripts
   */
  async validateDependencies() {
    console.log('📦 Validating dependencies and scripts...');

    try {
      const packagePath = 'package.json';
      if (!fs.existsSync(packagePath)) {
        this.errors.push('✗ package.json not found');
        return;
      }

      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      // Check for required dependencies
      const requiredDeps = [
        'playwright',
        '@playwright/test'
      ];

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      for (const dep of requiredDeps) {
        if (allDeps[dep]) {
          this.passed.push(`✓ Dependency: ${dep}`);
        } else {
          this.errors.push(`✗ Missing dependency: ${dep}`);
        }
      }

      // Check for test scripts
      const requiredScripts = [
        'test',
        'test:headed',
        'test:debug',
        'test:ui',
        'test:chromium',
        'test:mobile',
        'test:visual',
        'test:setup',
        'test:ci'
      ];

      for (const script of requiredScripts) {
        if (packageJson.scripts && packageJson.scripts[script]) {
          this.passed.push(`✓ Script: ${script}`);
        } else {
          this.errors.push(`✗ Missing script: ${script}`);
        }
      }

    } catch (error) {
      this.errors.push(`✗ Error reading package.json: ${error.message}`);
    }
  }

  /**
   * Validate test files syntax and structure
   */
  async validateTestFiles() {
    console.log('🧪 Validating test files...');

    const testFiles = [
      'tests/e2e/page-load-basic.spec.js',
      'tests/e2e/charts/chart-interactions.spec.js',
      'tests/e2e/trading/trading-interface.spec.js',
      'tests/e2e/mobile/mobile-responsiveness.spec.js',
      'tests/visual/visual-regression.spec.js'
    ];

    for (const testFile of testFiles) {
      try {
        if (!fs.existsSync(testFile)) {
          this.errors.push(`✗ Test file not found: ${testFile}`);
          continue;
        }

        const content = fs.readFileSync(testFile, 'utf8');

        // Check for required test patterns
        const patterns = [
          /test\.describe\s*\(/,
          /test\s*\(/,
          /expect\s*\(/,
          /require.*test-fixtures/
        ];

        let patternCount = 0;
        for (const pattern of patterns) {
          if (pattern.test(content)) {
            patternCount++;
          }
        }

        if (patternCount >= 3) {
          this.passed.push(`✓ Test file valid: ${testFile}`);
        } else {
          this.warnings.push(`⚠ Test file may have issues: ${testFile}`);
        }

        // Check for trading-specific patterns
        const tradingPatterns = [
          /dashboard/i,
          /chart/i,
          /trading/i,
          /scan/i
        ];

        let tradingCount = 0;
        for (const pattern of tradingPatterns) {
          if (pattern.test(content)) {
            tradingCount++;
          }
        }

        if (tradingCount > 0) {
          this.passed.push(`✓ Trading patterns found in: ${testFile}`);
        }

      } catch (error) {
        this.errors.push(`✗ Error validating test file ${testFile}: ${error.message}`);
      }
    }
  }

  /**
   * Validate page object models
   */
  async validatePageObjects() {
    console.log('🎭 Validating page object models...');

    const pageObjects = [
      {
        file: 'tests/page-objects/pages/TradingDashboard.js',
        expectedMethods: ['goto', 'runScan', 'getScanResults', 'selectTicker', 'switchToChartView']
      },
      {
        file: 'tests/page-objects/components/ChartComponent.js',
        expectedMethods: ['waitForChart', 'hasData', 'hover', 'getChartType', 'changeTimeframe']
      },
      {
        file: 'tests/page-objects/components/ScanResultsTable.js',
        expectedMethods: ['waitForTable', 'getRowCount', 'clickRowByTicker', 'getAllRowsData']
      }
    ];

    for (const pageObject of pageObjects) {
      try {
        if (!fs.existsSync(pageObject.file)) {
          this.errors.push(`✗ Page object not found: ${pageObject.file}`);
          continue;
        }

        const content = fs.readFileSync(pageObject.file, 'utf8');

        // Check for class definition
        if (content.includes('class ') && content.includes('constructor')) {
          this.passed.push(`✓ Page object class: ${pageObject.file}`);
        } else {
          this.errors.push(`✗ Invalid page object class: ${pageObject.file}`);
        }

        // Check for expected methods
        let methodCount = 0;
        for (const method of pageObject.expectedMethods) {
          if (content.includes(`async ${method}`) || content.includes(`${method}(`)) {
            methodCount++;
          }
        }

        if (methodCount >= pageObject.expectedMethods.length * 0.8) {
          this.passed.push(`✓ Page object methods: ${pageObject.file}`);
        } else {
          this.warnings.push(`⚠ Missing methods in: ${pageObject.file}`);
        }

      } catch (error) {
        this.errors.push(`✗ Error validating page object ${pageObject.file}: ${error.message}`);
      }
    }
  }

  /**
   * Validate test fixtures
   */
  async validateFixtures() {
    console.log('🔧 Validating test fixtures...');

    try {
      const fixturesFile = 'tests/fixtures/test-fixtures.js';
      if (!fs.existsSync(fixturesFile)) {
        this.errors.push('✗ Test fixtures file not found');
        return;
      }

      const content = fs.readFileSync(fixturesFile, 'utf8');

      // Check for required fixtures
      const requiredFixtures = [
        'tradingPage',
        'mockData',
        'performanceMonitor',
        'chartHelper',
        'tradingActions'
      ];

      for (const fixture of requiredFixtures) {
        if (content.includes(fixture)) {
          this.passed.push(`✓ Fixture: ${fixture}`);
        } else {
          this.errors.push(`✗ Missing fixture: ${fixture}`);
        }
      }

      // Check for Playwright imports
      if (content.includes('@playwright/test')) {
        this.passed.push('✓ Playwright test imports');
      } else {
        this.errors.push('✗ Missing Playwright test imports');
      }

    } catch (error) {
      this.errors.push(`✗ Error validating fixtures: ${error.message}`);
    }
  }

  /**
   * Validate npm scripts
   */
  async validateScripts() {
    console.log('📜 Validating npm scripts...');

    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const scripts = packageJson.scripts || {};

      // Check script categories
      const scriptCategories = {
        'Basic Testing': ['test', 'test:headed', 'test:debug'],
        'Browser Testing': ['test:chromium', 'test:firefox', 'test:webkit'],
        'Device Testing': ['test:mobile', 'test:tablet'],
        'Test Types': ['test:visual', 'test:e2e', 'test:performance'],
        'CI/CD': ['test:ci', 'test:smoke', 'test:full'],
        'Utilities': ['test:setup', 'test:clean', 'test:show-report']
      };

      for (const [category, scriptList] of Object.entries(scriptCategories)) {
        let foundCount = 0;
        for (const script of scriptList) {
          if (scripts[script]) {
            foundCount++;
          }
        }

        if (foundCount >= scriptList.length * 0.7) {
          this.passed.push(`✓ ${category} scripts (${foundCount}/${scriptList.length})`);
        } else {
          this.warnings.push(`⚠ Incomplete ${category} scripts (${foundCount}/${scriptList.length})`);
        }
      }

    } catch (error) {
      this.errors.push(`✗ Error validating scripts: ${error.message}`);
    }
  }

  /**
   * Print validation results
   */
  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 VALIDATION RESULTS');
    console.log('='.repeat(60));

    if (this.passed.length > 0) {
      console.log('\n✅ PASSED:');
      this.passed.forEach(item => console.log(`  ${item}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(item => console.log(`  ${item}`));
    }

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(item => console.log(`  ${item}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 SUMMARY: ${this.passed.length} passed, ${this.warnings.length} warnings, ${this.errors.length} errors`);

    if (this.errors.length === 0) {
      console.log('🎉 All validation checks passed! Your Playwright testing infrastructure is ready.');
      console.log('\nNext steps:');
      console.log('  1. Run: npm run test:setup');
      console.log('  2. Start your app: npm run dev');
      console.log('  3. Run tests: npm run test:smoke');
    } else {
      console.log('🔧 Please fix the errors above before running tests.');
    }

    console.log('='.repeat(60));
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new TestValidator();
  validator.validate().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { TestValidator };