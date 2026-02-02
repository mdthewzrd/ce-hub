/**
 * Comprehensive Playwright Test for Scan Page Historical Data Validation
 *
 * This test validates that the scan page at http://localhost:5665/scan
 * correctly displays historical test data (SPY, QQQ, NVDA from July, September, October 2025)
 * instead of being empty or showing old TSLA/AAPL data.
 *
 * Prerequisites:
 * - Node.js with Playwright installed
 * - Server running on http://localhost:5665
 * - Historical test data loaded in the system
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class ScanPageValidator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.screenshotDir = './test-screenshots';
        this.testResults = {
            timestamp: new Date().toISOString(),
            url: 'http://localhost:5665/scan',
            pageLoadSuccess: false,
            headerCorrect: false,
            tableFound: false,
            rowCount: 0,
            historicalDataFound: false,
            expectedSymbols: ['SPY', 'QQQ', 'NVDA'],
            expectedMonths: ['July', 'September', 'October'],
            actualData: [],
            screenshotPath: '',
            errors: [],
            validationDetails: {}
        };
    }

    /**
     * Initialize browser and page
     */
    async initialize() {
        try {
            console.log('🚀 Initializing browser...');
            this.browser = await chromium.launch({
                headless: false, // Set to true for headless mode
                slowMo: 100 // Slow down actions for better visibility
            });
            this.page = await this.browser.newPage();

            // Set viewport size for consistent screenshots
            await this.page.setViewportSize({ width: 1920, height: 1080 });

            // Create screenshots directory if it doesn't exist
            if (!fs.existsSync(this.screenshotDir)) {
                fs.mkdirSync(this.screenshotDir, { recursive: true });
            }

            console.log('✅ Browser initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize browser:', error);
            this.testResults.errors.push(`Browser initialization failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Navigate to the scan page and wait for it to load
     */
    async navigateToScanPage() {
        try {
            console.log('📍 Navigating to scan page...');
            await this.page.goto('http://localhost:5665/scan', {
                waitUntil: 'networkidle',
                timeout: 30000
            });

            // Wait a bit more for any dynamic content to load
            await this.page.waitForTimeout(2000);

            this.testResults.pageLoadSuccess = true;
            console.log('✅ Successfully navigated to scan page');

            // Take initial screenshot
            await this.takeScreenshot('01-page-loaded');

            return true;
        } catch (error) {
            console.error('❌ Failed to navigate to scan page:', error);
            this.testResults.errors.push(`Navigation failed: ${error.message}`);
            await this.takeScreenshot('ERROR-navigation-failed');
            return false;
        }
    }

    /**
     * Verify the page header shows "Test Scan 2"
     */
    async verifyPageHeader() {
        try {
            console.log('🔍 Verifying page header...');

            // Look for header in various possible selectors
            const headerSelectors = [
                'h1', 'h2', 'h3',
                '[data-testid="scan-title"]',
                '.scan-title',
                '.page-title',
                '.header-title',
                'title'
            ];

            let headerFound = false;
            let headerText = '';

            for (const selector of headerSelectors) {
                try {
                    const element = await this.page.locator(selector).first();
                    if (await element.isVisible()) {
                        headerText = await element.textContent();
                        console.log(`📝 Found header (${selector}): "${headerText}"`);

                        if (headerText && headerText.includes('Test Scan 2')) {
                            this.testResults.headerCorrect = true;
                            headerFound = true;
                            console.log('✅ Header verification passed');
                            break;
                        }
                    }
                } catch (e) {
                    // Continue to next selector
                }
            }

            // Also check page title as fallback
            if (!headerFound) {
                const pageTitle = await this.page.title();
                console.log(`📝 Page title: "${pageTitle}"`);
                if (pageTitle.includes('Test Scan 2')) {
                    this.testResults.headerCorrect = true;
                    headerFound = true;
                }
            }

            this.testResults.validationDetails.headerText = headerText;

            if (!headerFound) {
                console.log('⚠️ Header "Test Scan 2" not found, but continuing test...');
                this.testResults.errors.push('Header "Test Scan 2" not found');
            }

            return true;
        } catch (error) {
            console.error('❌ Header verification failed:', error);
            this.testResults.errors.push(`Header verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Find and analyze the scan results table
     */
    async analyzeScanResultsTable() {
        try {
            console.log('📊 Analyzing scan results table...');

            // Look for table with various possible selectors
            const tableSelectors = [
                'table',
                '[data-testid="scan-results"]',
                '.scan-results',
                '.results-table',
                '.data-table',
                '#results'
            ];

            let table = null;
            let tableSelector = '';

            for (const selector of tableSelectors) {
                try {
                    const candidateTable = this.page.locator(selector);
                    if (await candidateTable.isVisible()) {
                        table = candidateTable;
                        tableSelector = selector;
                        console.log(`📋 Found table with selector: ${selector}`);
                        break;
                    }
                } catch (e) {
                    // Continue to next selector
                }
            }

            if (!table) {
                // Try to find any table element
                const anyTable = await this.page.$('table');
                if (anyTable) {
                    table = this.page.locator('table');
                    tableSelector = 'table';
                    console.log('📋 Found generic table element');
                }
            }

            if (!table) {
                console.log('❌ No scan results table found');
                this.testResults.errors.push('No scan results table found on page');
                await this.takeScreenshot('ERROR-no-table-found');
                return false;
            }

            this.testResults.tableFound = true;
            this.testResults.validationDetails.tableSelector = tableSelector;

            // Count rows in the table
            const rows = await table.locator('tr').all();
            this.testResults.rowCount = rows.length;
            console.log(`📈 Found ${rows.length} rows in the table`);

            // Extract data from table
            await this.extractTableData(table);

            // Validate historical data
            await this.validateHistoricalData();

            // Take screenshot of table
            await this.takeScreenshot('02-table-analysis');

            return true;
        } catch (error) {
            console.error('❌ Table analysis failed:', error);
            this.testResults.errors.push(`Table analysis failed: ${error.message}`);
            await this.takeScreenshot('ERROR-table-analysis-failed');
            return false;
        }
    }

    /**
     * Extract data from the scan results table
     */
    async extractTableData(table) {
        try {
            console.log('📤 Extracting table data...');

            // Get all rows
            const rows = await table.locator('tr').all();
            const tableData = [];

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];

                // Get all cells in the row
                const cells = await row.locator('td, th').all();
                const rowData = [];

                for (const cell of cells) {
                    const cellText = await cell.textContent();
                    rowData.push(cellText ? cellText.trim() : '');
                }

                if (rowData.length > 0) {
                    tableData.push({
                        rowNumber: i,
                        data: rowData,
                        text: rowData.join(' | ')
                    });
                }
            }

            this.testResults.actualData = tableData;
            console.log(`📋 Extracted data from ${tableData.length} rows`);

            // Log first few rows for debugging
            console.log('\n📄 First 5 rows of table data:');
            tableData.slice(0, 5).forEach((row, index) => {
                console.log(`  Row ${index}: ${row.text}`);
            });

            return tableData;
        } catch (error) {
            console.error('❌ Data extraction failed:', error);
            this.testResults.errors.push(`Data extraction failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Validate that historical data is present
     */
    async validateHistoricalData() {
        try {
            console.log('🔍 Validating historical data...');

            const tableText = this.testResults.actualData.map(row => row.text).join(' ').toLowerCase();
            const foundSymbols = [];
            const foundMonths = [];

            // Check for expected symbols
            for (const symbol of this.testResults.expectedSymbols) {
                if (tableText.includes(symbol.toLowerCase())) {
                    foundSymbols.push(symbol);
                }
            }

            // Check for expected months
            for (const month of this.testResults.expectedMonths) {
                if (tableText.includes(month.toLowerCase())) {
                    foundMonths.push(month);
                }
            }

            // Check for 2025
            const has2025 = tableText.includes('2025');

            this.testResults.validationDetails.foundSymbols = foundSymbols;
            this.testResults.validationDetails.foundMonths = foundMonths;
            this.testResults.validationDetails.has2025 = has2025;

            // Determine if historical data is valid
            const hasExpectedSymbols = foundSymbols.length >= 2; // At least 2 of 3 symbols
            const hasExpectedMonths = foundMonths.length >= 2; // At least 2 of 3 months
            const hasExpectedYear = has2025;
            const hasReasonableRowCount = this.testResults.rowCount >= 20; // Expecting around 24 rows

            this.testResults.historicalDataFound = hasExpectedSymbols && hasExpectedMonths && hasExpectedYear && hasReasonableRowCount;

            console.log('\n📊 Historical Data Validation Results:');
            console.log(`  Expected Symbols: ${this.testResults.expectedSymbols.join(', ')}`);
            console.log(`  Found Symbols: ${foundSymbols.join(', ')}`);
            console.log(`  Expected Months: ${this.testResults.expectedMonths.join(', ')}`);
            console.log(`  Found Months: ${foundMonths.join(', ')}`);
            console.log(`  Has 2025: ${has2025}`);
            console.log(`  Row Count: ${this.testResults.rowCount}`);
            console.log(`  Historical Data Valid: ${this.testResults.historicalDataFound}`);

            // Check for old unwanted data
            const hasOldTSAA = tableText.includes('tsla') || tableText.includes('aapl');
            this.testResults.validationDetails.hasOldData = hasOldTSAA;

            if (hasOldTSAA) {
                console.log('⚠️ Warning: Old TSLA/AAPL data still present');
                this.testResults.errors.push('Old TSLA/AAPL data still present in results');
            }

            return this.testResults.historicalDataFound;
        } catch (error) {
            console.error('❌ Historical data validation failed:', error);
            this.testResults.errors.push(`Historical data validation failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Take a screenshot with timestamp
     */
    async takeScreenshot(name) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${name}-${timestamp}.png`;
            const filepath = path.join(this.screenshotDir, filename);

            await this.page.screenshot({
                path: filepath,
                fullPage: true
            });

            console.log(`📸 Screenshot saved: ${filepath}`);

            if (name === '02-table-analysis') {
                this.testResults.screenshotPath = filepath;
            }

            return filepath;
        } catch (error) {
            console.error('❌ Screenshot failed:', error);
            return null;
        }
    }

    /**
     * Log comprehensive test results
     */
    logTestResults() {
        console.log('\n' + '='.repeat(80));
        console.log('📋 COMPREHENSIVE TEST RESULTS');
        console.log('='.repeat(80));

        console.log(`\n🕐 Test Timestamp: ${this.testResults.timestamp}`);
        console.log(`🌐 URL Tested: ${this.testResults.url}`);

        console.log('\n📊 VALIDATION RESULTS:');
        console.log(`  ✅ Page Load Success: ${this.testResults.pageLoadSuccess}`);
        console.log(`  ✅ Header Correct: ${this.testResults.headerCorrect}`);
        console.log(`  ✅ Table Found: ${this.testResults.tableFound}`);
        console.log(`  📈 Row Count: ${this.testResults.rowCount}`);
        console.log(`  ✅ Historical Data Found: ${this.testResults.historicalDataFound}`);

        if (this.testResults.validationDetails.headerText) {
            console.log(`  📝 Header Text: "${this.testResults.validationDetails.headerText}"`);
        }

        if (this.testResults.validationDetails.foundSymbols) {
            console.log(`  🎯 Found Symbols: ${this.testResults.validationDetails.foundSymbols.join(', ')}`);
        }

        if (this.testResults.validationDetails.foundMonths) {
            console.log(`  📅 Found Months: ${this.testResults.validationDetails.foundMonths.join(', ')}`);
        }

        console.log(`  📅 Has 2025: ${this.testResults.validationDetails.has2025 || false}`);
        console.log(`  ⚠️ Has Old Data: ${this.testResults.validationDetails.hasOldData || false}`);

        if (this.testResults.screenshotPath) {
            console.log(`  📸 Screenshot: ${this.testResults.screenshotPath}`);
        }

        if (this.testResults.errors.length > 0) {
            console.log('\n❌ ERRORS ENCOUNTERED:');
            this.testResults.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }

        console.log('\n📄 ACTUAL TABLE DATA:');
        if (this.testResults.actualData.length > 0) {
            console.log(`Total rows: ${this.testResults.actualData.length}`);
            this.testResults.actualData.forEach((row, index) => {
                console.log(`  Row ${index}: ${row.text}`);
            });
        } else {
            console.log('  No data extracted from table');
        }

        // Overall assessment
        console.log('\n🎯 OVERALL ASSESSMENT:');
        const allChecksPassed = this.testResults.pageLoadSuccess &&
                               this.testResults.tableFound &&
                               this.testResults.historicalDataFound &&
                               this.testResults.rowCount >= 20;

        if (allChecksPassed) {
            console.log('✅ ALL CHECKS PASSED - Historical test data is displaying correctly!');
        } else {
            console.log('❌ SOME CHECKS FAILED - Issues detected with historical data display');
        }

        console.log('='.repeat(80));
    }

    /**
     * Save test results to JSON file
     */
    async saveTestResults() {
        try {
            const resultsFile = `scan-validation-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            const filepath = path.join(this.screenshotDir, resultsFile);

            fs.writeFileSync(filepath, JSON.stringify(this.testResults, null, 2));
            console.log(`💾 Test results saved to: ${filepath}`);

            return filepath;
        } catch (error) {
            console.error('❌ Failed to save test results:', error);
            return null;
        }
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        try {
            if (this.browser) {
                await this.browser.close();
                console.log('🧹 Browser closed');
            }
        } catch (error) {
            console.error('❌ Cleanup failed:', error);
        }
    }

    /**
     * Run the complete validation test
     */
    async runCompleteTest() {
        try {
            console.log('🎯 Starting comprehensive scan page validation test...\n');

            // Step 1: Initialize
            if (!await this.initialize()) {
                return this.testResults;
            }

            // Step 2: Navigate to page
            if (!await this.navigateToScanPage()) {
                await this.cleanup();
                return this.testResults;
            }

            // Step 3: Verify header
            await this.verifyPageHeader();

            // Step 4: Analyze table
            await this.analyzeScanResultsTable();

            // Step 5: Log results
            this.logTestResults();

            // Step 6: Save results
            await this.saveTestResults();

            return this.testResults;
        } catch (error) {
            console.error('❌ Test execution failed:', error);
            this.testResults.errors.push(`Test execution failed: ${error.message}`);
            return this.testResults;
        } finally {
            await this.cleanup();
        }
    }
}

/**
 * Main execution function
 */
async function main() {
    const validator = new ScanPageValidator();
    const results = await validator.runCompleteTest();

    // Exit with appropriate code
    const exitCode = (results.pageLoadSuccess && results.tableFound && results.historicalDataFound) ? 0 : 1;
    process.exit(exitCode);
}

// Handle script execution
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Script execution failed:', error);
        process.exit(1);
    });
}

module.exports = ScanPageValidator;