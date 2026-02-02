# Edge.dev Playwright Tests - Quick Reference

## 🚀 Quick Start

```bash
# Setup (one-time)
npm install
npm run test:setup

# Run all tests
npm test

# Run with visual browser
npm run test:headed

# Debug mode
npm run test:debug
```

## 📂 Test Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── page-load-basic.spec.js      # Core functionality
│   ├── charts/                      # Chart testing
│   ├── trading/                     # Trading features
│   └── mobile/                      # Mobile responsive
├── visual/                 # Visual regression
├── fixtures/              # Test utilities & data
├── page-objects/          # Page Object Models
└── setup/                # Global setup/teardown
```

## 🎯 Test Categories

| Category | Command | Purpose |
|----------|---------|---------|
| **Basic** | `npm run test:basic` | Page load, navigation, core UI |
| **Charts** | `npm run test:charts` | Chart interactions, data viz |
| **Trading** | `npm run test:trading` | Scans, data validation, workflows |
| **Mobile** | `npm run test:mobile-responsive` | Cross-device compatibility |
| **Visual** | `npm run test:visual` | Screenshot comparisons |

## 🌐 Browser Testing

```bash
npm run test:chromium     # Chrome
npm run test:firefox      # Firefox
npm run test:webkit       # Safari
npm run test:mobile       # Mobile browsers
npm run test:tablet       # Tablet view
```

## 🛠️ Development Commands

```bash
# Interactive testing
npm run test:ui           # Playwright UI mode
npm run test:codegen      # Record new tests

# Debugging
npm run test:debug        # Step-by-step debugging
npm run test:show-report  # View last test report
npm run test:show-trace   # View execution trace

# Maintenance
npm run test:clean        # Clear test artifacts
npm run test:update-snapshots  # Update visual baselines
```

## 📊 CI/CD Commands

```bash
npm run test:ci           # Full CI test suite
npm run test:smoke        # Quick validation
npm run test:full         # Multi-browser suite
npm run ci:test           # Build + test
```

## 🎭 Page Object Usage

```javascript
// Trading Dashboard
const dashboard = new TradingDashboard(page);
await dashboard.goto();
await dashboard.runScan();
const results = await dashboard.getScanResults();

// Chart Component
const chart = new ChartComponent(page);
await chart.waitForChart();
await chart.changeTimeframe('1d');
const data = await chart.getCandlestickData();

// Scan Results Table
const table = new ScanResultsTable(page);
await table.clickRowByTicker('AAPL');
await table.sortByColumn('GAP %');
```

## 🧪 Test Fixtures

```javascript
test('trading test', async ({
  tradingPage,           // Pre-configured trading page
  mockData,             // Trading data generators
  performanceMonitor,   // Performance tracking
  chartHelper,          // Chart testing utilities
  tradingActions        // Common trading actions
}) => {
  // Your test code here
});
```

## ⚡ Performance Testing

```bash
npm run test:performance  # Performance test suite

# Custom performance thresholds
test('should load fast', async ({ performanceMonitor }) => {
  await performanceMonitor.assertPerformance({
    loadTime: 3000,        # 3 second max load
    memoryUsage: 100MB,    # 100MB max memory
    chartRenderTime: 2000  # 2 second max chart render
  });
});
```

## 📱 Mobile Testing

```bash
npm run test:mobile       # All mobile tests

# Specific device testing
test.describe('iPhone', () => {
  test.use({ ...devices['iPhone 12'] });
  // Tests run on iPhone 12 simulation
});
```

## 👁️ Visual Testing

```bash
npm run test:visual                    # Run visual tests
npm run test:update-snapshots         # Update baselines

# Custom visual comparisons
await expect(page).toHaveScreenshot('dashboard.png', {
  fullPage: true,
  threshold: 0.3
});
```

## 🚨 Common Issues & Solutions

### Tests timing out
```bash
npm run test:timeout      # Increase timeout
npm run test:serial       # Run one at a time
```

### Chart not loading
- Check app is running on localhost:5657
- Use `npm run test:debug` to see browser
- Verify chart data in browser console

### Visual tests failing
```bash
npm run test:update-snapshots  # Update after UI changes
```

### Memory issues
- Use performance project: `npm run test:performance`
- Check for memory leaks in charts
- Reduce parallel workers

## 📈 Test Reports

After running tests:
- **HTML Report**: `test-results/html-report/index.html`
- **JSON Results**: `test-results/results.json`
- **Screenshots**: `test-results/screenshots/`
- **Traces**: `test-results/traces/`

## 🔧 Configuration

Main config: `playwright.config.js`
- Timeouts optimized for financial data
- Multiple browser/device projects
- NYC timezone for trading hours
- Performance thresholds
- Visual regression settings

## 📝 Writing New Tests

1. **Use appropriate test category** (`e2e/`, `visual/`, etc.)
2. **Import fixtures**: `const { test, expect } = require('../fixtures/test-fixtures');`
3. **Use page objects**: Always use existing page objects
4. **Add meaningful assertions**: Test both UI and data
5. **Handle async operations**: Wait for financial data loading
6. **Test error scenarios**: Network failures, bad data, etc.

## 🎯 Test Guidelines

### ✅ Do
- Use page objects for all UI interactions
- Wait for data loading before assertions
- Test realistic financial data scenarios
- Include mobile and visual testing
- Mock external APIs appropriately

### ❌ Don't
- Use hardcoded waits (`page.waitForTimeout()`)
- Test with unrealistic financial data
- Skip error scenario testing
- Ignore performance implications
- Mix test concerns (keep tests focused)

## 📚 Further Reading

- [Full Testing Guide](../PLAYWRIGHT_TESTING_GUIDE.md)
- [Playwright Documentation](https://playwright.dev/)
- [Page Object Pattern](https://playwright.dev/docs/pom)
- [Visual Testing](https://playwright.dev/docs/test-screenshots)

---

**Need Help?** Check the full guide or run `npm run test:list` to see all available tests.