# Scan Page Historical Data Validation Test

This comprehensive Playwright test validates that the scan page at `http://localhost:5665/scan` correctly displays historical test data instead of being empty or showing old data.

## 🎯 Test Purpose

The test ensures that your scan page fixes are working correctly by verifying:
- Historical test data (SPY, QQQ, NVDA) from July, September, October 2025 is displayed
- The page shows approximately 24 scan results instead of being empty
- Old TSLA/AAPL data is no longer present
- The page header shows "Test Scan 2"

## 📋 Files Created

1. **`validate-scan-page-historical-data.js`** - Main Playwright test script
2. **`package-scan-test.json`** - Package configuration with Playwright dependencies
3. **`run-scan-validation.sh`** - Executable script for easy test execution
4. **`README-SCAN-VALIDATION.md`** - This documentation file

## 🚀 Quick Start

### Prerequisites

- Node.js installed (version 14 or higher)
- Server running on `http://localhost:5665`
- Historical test data loaded in your system

### Method 1: Automated Script (Recommended)

```bash
# Run the complete validation test with automatic setup
./run-scan-validation.sh
```

### Method 2: Manual Execution

```bash
# Install Playwright if not already installed
npm install playwright

# Install Playwright browsers (first time only)
npx playwright install

# Run the test
node validate-scan-page-historical-data.js
```

## 🔍 What the Test Does

### Step-by-Step Validation

1. **Browser Initialization**
   - Launches Chrome browser with viewport set to 1920x1080
   - Creates screenshots directory for test artifacts

2. **Page Navigation**
   - Navigates to `http://localhost:5665/scan`
   - Waits for network idle to ensure page is fully loaded
   - Takes initial screenshot for reference

3. **Header Verification**
   - Checks for "Test Scan 2" in page header
   - Tests multiple selector strategies (h1, h2, h3, page title, etc.)
   - Logs the actual header text found

4. **Table Detection & Analysis**
   - Finds the scan results table using multiple selector strategies
   - Counts total rows in the table
   - Extracts all data from the table

5. **Historical Data Validation**
   - Verifies presence of expected symbols: SPY, QQQ, NVDA
   - Checks for expected months: July, September, October
   - Validates that data includes year 2025
   - Ensures row count is reasonable (≥20 rows)
   - Checks that old TSLA/AAPL data is not present

6. **Screenshot Capture**
   - Takes screenshots at key points in the test
   - Saves full-page screenshots with timestamps
   - Creates error screenshots if failures occur

7. **Comprehensive Logging**
   - Logs detailed test results to console
   - Saves complete results to JSON file
   - Provides overall assessment and recommendations

## 📊 Expected Results

### ✅ Successful Test Indicators

- Page loads successfully
- Table with scan results is found
- Row count is approximately 24 (your historical data)
- Header shows "Test Scan 2" (if present)
- Historical symbols (SPY, QQQ, NVDA) are found
- 2025 data is present
- Old TSLA/AAPL data is not present

### ❌ Failure Indicators

- Page fails to load
- No scan results table found
- Row count is 0 or very low
- Only old TSLA/AAPL data present
- No 2025 data found

## 📁 Output Files

The test generates the following artifacts:

### Screenshots
- `test-screenshots/01-page-loaded-[timestamp].png` - Initial page load
- `test-screenshots/02-table-analysis-[timestamp].png` - Table analysis
- `test-screenshots/ERROR-[timestamp].png` - Error screenshots (if any)

### Test Results
- `test-screenshots/scan-validation-results-[timestamp].json` - Complete test results

### Console Output
- Real-time progress updates
- Detailed validation results
- Overall assessment and recommendations

## 🔧 Customization

### Modifying Expected Data

Edit the test script to change expected symbols and months:

```javascript
// In validate-scan-page-historical-data.js
this.expectedSymbols: ['SPY', 'QQQ', 'NVDA'],  // Change these symbols
this.expectedMonths: ['July', 'September', 'October'],  // Change these months
```

### Adjusting Row Count Expectations

Modify the row count validation:

```javascript
// Change the minimum expected row count
const hasReasonableRowCount = this.testResults.rowCount >= 20; // Adjust this number
```

### Running Headless Mode

For automated environments, run the test in headless mode:

```bash
# Using the provided npm script
npm run test:headless

# Or modify the script directly
# In validate-scan-page-historical-data.js, change:
this.browser = await chromium.launch({
    headless: true, // Set to true for headless mode
    slowMo: 100
});
```

## 🐛 Troubleshooting

### Common Issues

1. **Server Not Running**
   ```
   ❌ Server is not responding on port 5665
   ```
   **Solution**: Start your server with `cd projects/edge-dev-main && npm run dev`

2. **Playwright Not Installed**
   ```
   ❌ Playwright is not installed
   ```
   **Solution**: Run `npm install playwright && npx playwright install`

3. **Table Not Found**
   ```
   ❌ No scan results table found
   ```
   **Solution**: Check if your page structure has changed. The test looks for various table selectors.

4. **Old Data Still Present**
   ```
   ⚠️ Warning: Old TSLA/AAPL data still present
   ```
   **Solution**: Verify your historical data upload was successful and cleared old data.

### Debug Mode

For detailed debugging, modify the script to add more logging:

```javascript
// Add this after page navigation
await this.page.waitForTimeout(5000); // Wait longer for dynamic content
console.log('Page content:', await this.page.content()); // Log full HTML
```

## 📞 Support

If you encounter issues:

1. Check the console output for detailed error messages
2. Review the generated screenshots for visual confirmation
3. Examine the JSON results file for comprehensive test data
4. Ensure your server is running and data is loaded correctly

## 🔄 Integration with CI/CD

This test can be integrated into continuous integration pipelines:

```yaml
# Example GitHub Actions step
- name: Run Scan Page Validation
  run: |
    npm install playwright
    npx playwright install
    node validate-scan-page-historical-data.js
```

The test exits with code 0 on success and code 1 on failure, making it suitable for automated validation pipelines.