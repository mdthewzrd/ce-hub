# AG-UI Test Suite

Automated testing scripts for the AG-UI (AgentUI) system integration.

## Prerequisites

1. **Backend Running**: Ensure FastAPI backend is running on port 6500
   ```bash
   cd backend
   python main.py
   ```

2. **Frontend Running**: Ensure Next.js frontend is running on port 6565
   ```bash
   cd frontend
   npm run dev
   ```

3. **Install Test Dependencies**:
   ```bash
   npm install
   ```

## Test Suites

### 1. API Tests (`test:api`)

Tests the backend AG-UI endpoint directly without browser.

**What it tests**:
- Backend health check
- Navigation tool parsing (navigateToPage)
- Display tool parsing (setDateRange, setDisplayMode, setPnLMode)
- Account tool parsing (setAccountSize)
- Custom date range parsing
- Journal tool parsing

**Run**:
```bash
npm run test:api
# or
node tests/ag-ui-api-test.mjs
```

**Example Output**:
```
═══ Backend Health Check ═══
✓ Backend is running
  Status: healthy

═══ Navigation Tools ═══
ℹ Testing: Navigate to the trades page
✓ Navigate to trades
  {"name":"navigateToPage","arguments":{"page":"trades"}}

═══ Test Summary ═══
Total Tests: 15
✓ Passed: 15
Duration: 3.42s
```

### 2. End-to-End Tests (`test:e2e`)

Tests the full flow including frontend tool execution using Playwright.

**What it tests**:
- Frontend tool execution
- localStorage updates
- UI state changes
- Date Range Selector GUI
- AG-UI Chat integration

**Run**:
```bash
npm run test:e2e
# or
node tests/ag-ui-e2e-test.mjs
```

**Example Output**:
```
═══ Navigation Tool Test ═══
ℹ Selected "trades" from dropdown
ℹ Clicked "Test Navigate" button
✓ Navigate to trades

═══ Date Range Selector GUI Test ═══
ℹ Opened date range selector dropdown
✓ Dropdown is visible
ℹ Clicked "Custom Range"
✓ Custom range calendar is visible
✓ Date Range Selector GUI
  Calendar UI displayed correctly

═══ Test Summary ═══
Total Tests: 7
✓ Passed: 7
Duration: 12.35s
```

### 3. All Tests (`test`)

Run both API and E2E tests sequentially.

```bash
npm test
```

## Manual Testing Guide

Visit http://localhost:6565/ag-ui-test for interactive testing.

### Test Checklist

- [ ] **Navigation**: Test each page redirect (Dashboard, Trades, Journal, Analytics, Calendar, Settings)
- [ ] **Date Range**: Test preset ranges (7d, 30d, 90d, YTD, 1y, All)
- [ ] **Custom Range**: Open calendar, pick start/end dates, apply
- [ ] **Display Mode**: Test dollar, percent, r-multiple
- [ ] **P&L Mode**: Test net vs gross
- [ ] **Account Size**: Test setting account value
- [ ] **Journal**: Test creating journal entry
- [ ] **Search**: Test search query
- [ ] **AG-UI Chat**: Test natural language commands

### Natural Language Test Commands

Try these in the AG-UI Chat input:

1. "Navigate to the trades page"
2. "Show me the last 30 days"
3. "Change to percent display mode"
4. "Set my account size to $75,000"
5. "Set custom date range from December 1, 2024 to December 31, 2024"
6. "Go to journal"
7. "Switch to R-multiple display"
8. "Use gross P&L mode"

## Troubleshooting

### "Backend is not running"
- Start the FastAPI backend: `cd backend && python main.py`
- Verify it's running: `curl http://localhost:6500/health`

### "Page not accessible"
- Start the Next.js frontend: `npm run dev`
- Verify it's running: `curl http://localhost:6565`

### Playwright Not Found
```bash
npm install -D playwright@latest
npx playwright install chromium
```

### Tests Timing Out
- Check browser console for errors
- Verify backend is responding quickly
- Check network tab in DevTools

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# .github/workflows/test.yml
name: Test AG-UI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:api
      - run: npm run test:e2e
```

## Coverage

Current test coverage:

- ✅ Navigation tools (100%)
- ✅ Display tools (100%)
- ✅ Account tools (100%)
- ✅ Custom date range (100%)
- ✅ Journal tools (basic)
- ✅ Search/filter tools (basic)
- ⏳ Trade import/export (pending)
- ⏳ Journal update/delete (pending)

## Contributing

To add new tests:

1. Add test function to `ag-ui-api-test.mjs` or `ag-ui-e2e-test.mjs`
2. Follow naming convention: `test<FeatureName>`
3. Use `recordTest()` to track results
4. Call test function in `runAllTests()`

Example:
```javascript
async function testNewFeature(page) {
  section('New Feature Test');
  try {
    // Test code here
    recordTest('New feature works', true);
  } catch (err) {
    recordTest('New feature works', false, err.message);
  }
}
```
