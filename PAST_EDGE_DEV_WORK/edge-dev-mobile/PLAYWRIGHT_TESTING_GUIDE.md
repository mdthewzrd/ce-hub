# Edge.dev Playwright Testing Infrastructure Guide

## Overview

This comprehensive Playwright testing infrastructure is specifically designed for the Edge.dev trading platform, providing robust end-to-end testing capabilities for financial applications with real-time data, complex charts, and multi-device support.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Infrastructure Overview](#test-infrastructure-overview)
3. [Test Categories](#test-categories)
4. [Running Tests](#running-tests)
5. [Configuration](#configuration)
6. [Page Object Models](#page-object-models)
7. [Test Fixtures](#test-fixtures)
8. [CI/CD Integration](#cicd-integration)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

- Node.js 20.x or later
- npm or yarn
- Edge.dev application running on localhost:5657

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run test:setup

# Run smoke tests to verify setup
npm run test:smoke
```

### Basic Test Execution

```bash
# Run all tests
npm test

# Run tests with UI mode
npm run test:ui

# Run specific test categories
npm run test:basic
npm run test:charts
npm run test:trading
npm run test:mobile-responsive
npm run test:visual
```

## Test Infrastructure Overview

### Directory Structure

```
tests/
├── e2e/                          # End-to-end tests
│   ├── charts/                   # Chart interaction tests
│   ├── trading/                  # Trading interface tests
│   ├── mobile/                   # Mobile responsiveness tests
│   └── navigation/               # Navigation and workflow tests
├── visual/                       # Visual regression tests
├── performance/                  # Performance tests
├── integration/                  # Integration tests
├── fixtures/                     # Test data and utilities
│   ├── data/                     # Mock trading data
│   ├── auth/                     # Authentication fixtures
│   └── mock-api/                 # API mocking utilities
├── page-objects/                 # Page Object Models
│   ├── pages/                    # Full page objects
│   └── components/               # Component objects
├── setup/                        # Global setup and teardown
└── utils/                        # Testing utilities
```

### Key Features

- **Financial-Specific Testing**: Specialized for trading platforms with market data validation
- **Real-time Data Handling**: Tests account for dynamic financial data updates
- **Chart Testing**: Comprehensive chart interaction and data visualization testing
- **Mobile Trading**: Full responsive testing for mobile trading scenarios
- **Visual Regression**: Screenshot comparison for UI consistency
- **Performance Monitoring**: Load time and memory usage validation
- **Cross-Browser Support**: Chrome, Firefox, Safari, and mobile browsers

## Test Categories

### 1. Page Load & Basic Functionality (`tests/e2e/page-load-basic.spec.js`)

Tests core application functionality:
- Application loading and initial state
- Navigation and UI elements
- Page structure and accessibility
- Error handling and resilience
- Basic user interactions

**Run with:**
```bash
npm run test:basic
```

### 2. Chart Interactions (`tests/e2e/charts/`)

Tests trading chart functionality:
- Chart loading and rendering
- Data visualization accuracy
- User interactions (hover, zoom, pan)
- Timeframe switching
- Real-time data updates
- Performance under load

**Run with:**
```bash
npm run test:charts
```

### 3. Trading Interface (`tests/e2e/trading/`)

Tests trading-specific features:
- Scan execution and results
- Trading data accuracy and validation
- Real-time data handling
- Code upload and project management
- Market data integrity

**Run with:**
```bash
npm run test:trading
```

### 4. Mobile Responsiveness (`tests/e2e/mobile/`)

Tests cross-device compatibility:
- Responsive layout adaptation
- Touch interactions
- Mobile navigation and UI
- Performance on mobile devices
- Cross-device data consistency

**Run with:**
```bash
npm run test:mobile-responsive
```

### 5. Visual Regression (`tests/visual/`)

Tests visual consistency:
- Screenshot comparison across builds
- Cross-browser visual consistency
- Responsive design visual verification
- Component-level visual validation

**Run with:**
```bash
npm run test:visual
```

## Running Tests

### Development Testing

```bash
# Run tests in headed mode (browser visible)
npm run test:headed

# Debug mode with step-by-step execution
npm run test:debug

# Interactive UI mode
npm run test:ui

# Run with live development server
npm run dev:test
```

### Browser-Specific Testing

```bash
# Test specific browsers
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Mobile browsers
npm run test:mobile

# Tablet testing
npm run test:tablet
```

### CI/CD Testing

```bash
# Full CI test suite
npm run test:ci

# Smoke tests for quick validation
npm run test:smoke

# Full multi-browser suite
npm run test:full
```

### Test Utilities

```bash
# Update visual regression snapshots
npm run test:update-snapshots

# Clean test artifacts
npm run test:clean

# Validate test configuration
npm run test:validate

# List all available tests
npm run test:list

# Show test reports
npm run test:show-report

# Record new test actions
npm run test:codegen
```

## Configuration

### Playwright Configuration (`playwright.config.js`)

The configuration is optimized for financial trading applications:

- **Timeout Settings**: Extended timeouts for chart rendering and API calls
- **Multiple Projects**: Different browser and device configurations
- **Financial Data**: NYC timezone and US locale for consistent data
- **Performance**: Memory and load time thresholds
- **Visual Testing**: Screenshot comparison with appropriate thresholds

### Environment Variables

```bash
# Test environment
NODE_ENV=test

# Application URL (default: http://localhost:5657)
BASE_URL=http://localhost:5657

# API endpoints (if needed)
API_BASE_URL=http://localhost:3001/api

# Test data configuration
MOCK_DATA_ENABLED=true
```

### Browser Configuration

Each test project is configured for specific scenarios:

- **chromium-desktop**: Primary development browser (1920x1080)
- **firefox-desktop**: Cross-browser compatibility
- **webkit-desktop**: Safari compatibility
- **mobile-chrome**: Mobile Chrome (Pixel 5)
- **mobile-safari**: Mobile Safari (iPhone 12)
- **tablet-chrome**: Tablet testing (iPad Pro)
- **performance-chrome**: Performance testing with special flags
- **visual-chrome**: Visual regression with consistent rendering

## Page Object Models

### TradingDashboard (`tests/page-objects/pages/TradingDashboard.js`)

Main page object for the trading dashboard:

```javascript
const dashboard = new TradingDashboard(page);

// Navigation
await dashboard.goto();
await dashboard.waitForPageLoad();

// Project management
const projects = await dashboard.getProjects();
await dashboard.selectProject('Gap Scanner');

// Scan operations
await dashboard.runScan();
const results = await dashboard.getScanResults();
await dashboard.selectTicker('AAPL');

// View switching
await dashboard.switchToChartView();
await dashboard.switchToTableView();

// Chart operations
const chartVisible = await dashboard.isChartVisible();
await dashboard.changeTimeframe('1d');
```

### ChartComponent (`tests/page-objects/components/ChartComponent.js`)

Specialized chart testing component:

```javascript
const chart = new ChartComponent(page);

// Chart loading
await chart.waitForChart();
const hasData = await chart.hasData();

// Interactions
await chart.hover(0.5, 0.5);
await chart.click(0.3, 0.7);
await chart.zoom(1.5);

// Data analysis
const candlestickData = await chart.getCandlestickData();
const lastPrice = await chart.getLastPrice();
const priceRange = await chart.getPriceRange();

// Timeframes
const timeframes = await chart.getAvailableTimeframes();
await chart.changeTimeframe('1h');
```

### ScanResultsTable (`tests/page-objects/components/ScanResultsTable.js`)

Trading scan results table component:

```javascript
const scanTable = new ScanResultsTable(page);

// Table operations
await scanTable.waitForTable();
const rowCount = await scanTable.getRowCount();
const allData = await scanTable.getAllRowsData();

// Data validation
const gapValidation = await scanTable.validateNumericColumn('GAP %');
const stats = await scanTable.getColumnStats('VOLUME');

// Interactions
await scanTable.clickRowByTicker('TSLA');
await scanTable.sortByColumn('R-MULT');
```

## Test Fixtures

### Trading Fixtures (`tests/fixtures/test-fixtures.js`)

Custom fixtures for trading application testing:

```javascript
// Use trading-specific page
test('should analyze market data', async ({ tradingPage }) => {
  // tradingPage comes pre-configured with trading context
});

// Use mock trading data
test('should handle market data', async ({ mockData }) => {
  const realtimeUpdate = mockData.generateRealtimeUpdate('AAPL');
  const chartData = mockData.generateChartData('SPY', '1d', 100);
});

// Performance monitoring
test('should meet performance standards', async ({ performanceMonitor }) => {
  const metrics = await performanceMonitor.getMetrics();
  await performanceMonitor.assertPerformance({
    loadTime: 3000,
    memoryUsage: 100 * 1024 * 1024
  });
});

// Chart testing helpers
test('should interact with charts', async ({ chartHelper }) => {
  await chartHelper.waitForChart();
  await chartHelper.hoverChart(0.5, 0.5);
  await chartHelper.changeTimeframe('1h');
});

// Trading actions
test('should execute trading workflows', async ({ tradingActions }) => {
  await tradingActions.selectTicker('AAPL');
  await tradingActions.runScan();
  await tradingActions.toggleViewMode('chart');
});
```

### Test Data

Mock trading data is automatically generated with realistic:
- Stock tickers and prices
- Gap percentages and volume data
- R-multiple calculations
- Chart OHLCV data
- Market calendar information

## CI/CD Integration

### GitHub Actions Workflow (`.github/workflows/playwright-tests.yml`)

The CI/CD pipeline includes:

1. **Smoke Tests**: Quick validation (10 minutes)
2. **Full Test Suite**: Comprehensive cross-browser testing (60 minutes)
3. **Visual Regression**: Screenshot comparison (30 minutes)
4. **Performance Tests**: Load time and memory validation (20 minutes)
5. **Mobile Tests**: Responsive design validation (25 minutes)
6. **Quality Gates**: Pass/fail criteria and notifications

### Test Execution Matrix

Tests run across multiple configurations:
- **Browsers**: Chrome, Firefox, Safari
- **Devices**: Desktop, tablet, mobile
- **Viewports**: Various screen sizes
- **Performance**: Different performance profiles

### Reporting

- **HTML Reports**: Detailed test execution reports
- **JSON/JUnit**: Machine-readable results for integrations
- **GitHub Pages**: Published test reports
- **PR Comments**: Automated result summaries
- **Artifact Storage**: Test screenshots and traces

## Best Practices

### Writing Tests

1. **Use Page Objects**: Always use page object models for UI interactions
2. **Wait Strategies**: Use appropriate waits for financial data loading
3. **Data Validation**: Validate financial data formats and ranges
4. **Error Handling**: Test error scenarios and recovery
5. **Performance**: Monitor load times and memory usage

### Test Organization

1. **Logical Grouping**: Group tests by functionality (charts, trading, mobile)
2. **Test Independence**: Each test should be independent and repeatable
3. **Data Management**: Use fixtures for consistent test data
4. **Naming**: Use descriptive test names that explain the scenario

### Debugging

1. **Visual Debugging**: Use `npm run test:headed` to see browser actions
2. **Step Debugging**: Use `npm run test:debug` for step-by-step execution
3. **Screenshots**: Automatic screenshots on failure
4. **Traces**: Full execution traces for complex failures
5. **Logs**: Comprehensive logging for financial data operations

### Performance Considerations

1. **Parallel Execution**: Tests run in parallel by default
2. **Resource Management**: Monitor memory usage during chart testing
3. **Network Optimization**: Mock APIs when appropriate
4. **Browser Reuse**: Browsers are reused across tests when possible

## Troubleshooting

### Common Issues

#### Tests Timing Out
```bash
# Increase timeout for specific tests
npm run test:timeout

# Run tests serially
npm run test:serial
```

#### Chart Rendering Issues
- Ensure application is running on localhost:5657
- Check for console errors in browser
- Verify chart data is loading correctly
- Use visual debugging mode

#### Visual Regression Failures
```bash
# Update snapshots after intentional UI changes
npm run test:update-snapshots

# Check for rendering differences across platforms
npm run test:visual --project=visual-chrome
```

#### Memory Issues
- Monitor test execution with performance project
- Check for memory leaks in chart components
- Reduce parallel execution if needed

#### Mobile Test Failures
- Verify touch interactions work correctly
- Check responsive design implementations
- Test on actual mobile devices when possible

### Debugging Commands

```bash
# Generate debugging traces
npx playwright test --trace on

# Show trace viewer
npm run test:show-trace test-results/trace.zip

# Run specific test file with debugging
npx playwright test tests/e2e/charts/chart-interactions.spec.js --debug

# Check test configuration
npm run test:validate
```

### Getting Help

1. **Playwright Documentation**: https://playwright.dev/
2. **Test Results**: Check HTML reports in `test-results/`
3. **CI Logs**: Review GitHub Actions workflow logs
4. **Issue Templates**: Use provided issue templates for bug reports

## Advanced Usage

### Custom Test Configuration

Create custom test configurations for specific scenarios:

```javascript
// Custom config for load testing
const loadTestConfig = {
  ...baseConfig,
  workers: 1,
  timeout: 120000,
  use: {
    ...baseConfig.use,
    launchOptions: {
      args: ['--disable-web-security']
    }
  }
};
```

### API Testing Integration

Combine UI tests with API validation:

```javascript
test('should validate trading data flow', async ({ page, request }) => {
  // API validation
  const apiResponse = await request.get('/api/scan-results');
  expect(apiResponse.ok()).toBeTruthy();

  // UI validation
  await page.goto('/');
  const uiResults = await dashboard.getScanResults();

  // Cross-validation
  expect(uiResults.length).toBe(apiResponse.data.length);
});
```

### Custom Reporters

Add custom reporting for trading-specific metrics:

```javascript
// Custom reporter for trading metrics
class TradingReporter {
  onTestEnd(test, result) {
    if (test.title.includes('performance')) {
      // Log performance metrics
      console.log(`Performance: ${result.duration}ms`);
    }
  }
}
```

---

## Conclusion

This Playwright testing infrastructure provides comprehensive coverage for the Edge.dev trading platform, ensuring reliability, performance, and user experience across all supported devices and browsers. The modular design allows for easy maintenance and extension as the platform evolves.

For questions or contributions, please refer to the project's contribution guidelines and testing standards.