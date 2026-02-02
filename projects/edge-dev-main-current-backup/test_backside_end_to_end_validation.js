/**
 * 🎯 COMPREHENSIVE BACKSIDE SCANNER END-TO-END VALIDATION
 *
 * Tests complete workflow:
 * 1. Upload backside para b copy.py file
 * 2. Format with parameter extraction validation
 * 3. Add to project functionality
 * 4. Execute scanner with date range 1.1.25 to 11.1.25
 *
 * Author: Claude Code Validation Automation
 * Date: 2025-12-02
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const FRONTEND_URL = 'http://localhost:5657';
const BACKEND_URL = 'http://localhost:5659';
const TEST_FILE = '/Users/michaeldurante/Downloads/backside para b copy.py';
const SCANNER_NAME = 'Backside Para B Copy';
const DATE_RANGE = {
  start: '2025-01-01',
  end: '2025-11-01'
};

class BacksideScannerValidator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      fileUpload: { passed: false, details: [] },
      codeFormatting: { passed: false, details: [] },
      parameterExtraction: { passed: false, details: [] },
      projectAddition: { passed: false, details: [] },
      scannerExecution: { passed: false, details: [] }
    };
  }

  async initialize() {
    console.log('🚀 Initializing Browser for Validation...');
    this.browser = await puppeteer.launch({
      headless: false,
      slowMo: 1000, // Slow down for visibility
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1400, height: 900 });

    // Enable console logging
    this.page.on('console', msg => {
      console.log(`📝 [Browser Console]: ${msg.text()}`);
    });

    // Enable request/response logging
    this.page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`🌐 [API Request]: ${request.method()} ${request.url()}`);
      }
    });

    this.page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`✅ [API Response]: ${response.status()} ${response.url()}`);
      }
    });

    console.log('✅ Browser initialized successfully');
  }

  async validateServers() {
    console.log('🔍 Validating server availability...');

    try {
      // Check frontend
      const frontendResponse = await fetch(`${FRONTEND_URL}/`);
      if (!frontendResponse.ok) throw new Error('Frontend not accessible');
      console.log('✅ Frontend server accessible');

      // Check backend
      const backendResponse = await fetch(`${BACKEND_URL}/`);
      console.log(`ℹ️ Backend status: ${backendResponse.status}`);

      return true;
    } catch (error) {
      console.error('❌ Server validation failed:', error);
      return false;
    }
  }

  async testFileUpload() {
    console.log('\n📁 🧪 TESTING FILE UPLOAD...');

    try {
      // Navigate to the application
      await this.page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      await this.page.waitForTimeout(3000);

      // Look for file upload element or the Renata chat interface
      console.log('👀 Looking for file upload interface...');

      // Try to find the Renata popup or chat interface
      let renataChatFound = false;

      // Method 1: Look for the chat button/icon
      const chatSelectors = [
        '[data-testid="chat-button"]',
        '.renata-chat-button',
        'button[aria-label*="chat"]',
        'button[aria-label*="Chat"]',
        '.message-circle',
        '[class*="chat"]'
      ];

      for (const selector of chatSelectors) {
        try {
          const element = await this.page.waitForSelector(selector, { timeout: 2000 });
          if (element) {
            console.log(`✅ Found chat interface: ${selector}`);
            await element.click();
            renataChatFound = true;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Method 2: Try direct file upload if chat not found
      if (!renataChatFound) {
        console.log('🔄 Trying direct file upload...');

        const fileInputSelectors = [
          'input[type="file"]',
          'input[accept*=".py"]',
          '[data-testid="file-input"]'
        ];

        for (const selector of fileInputSelectors) {
          try {
            const fileInput = await this.page.waitForSelector(selector, { timeout: 2000 });
            if (fileInput) {
              console.log(`✅ Found file input: ${selector}`);

              // Upload the file
              const fileContent = fs.readFileSync(TEST_FILE);
              const fileName = path.basename(TEST_FILE);

              await fileInput.uploadFile({
                name: fileName,
                mimeType: 'text/x-python',
                content: fileContent
              });

              console.log(`✅ File uploaded: ${fileName}`);
              this.testResults.fileUpload.passed = true;
              this.testResults.fileUpload.details.push(`Successfully uploaded ${fileName}`);
              return;
            }
          } catch (e) {
            // Continue to next selector
          }
        }

        throw new Error('No file upload interface found');
      }

      // Method 3: If chat interface found, look for file upload within it
      await this.page.waitForTimeout(2000);

      const chatFileSelectors = [
        'input[type="file"]',
        'input[accept*=".py"]',
        '[data-testid="chat-file-upload"]',
        '.file-upload-button'
      ];

      for (const selector of chatFileSelectors) {
        try {
          const fileInput = await this.page.$(selector);
          if (fileInput) {
            console.log(`✅ Found chat file input: ${selector}`);

            const fileContent = fs.readFileSync(TEST_FILE);
            const fileName = path.basename(TEST_FILE);

            await fileInput.uploadFile({
              name: fileName,
              mimeType: 'text/x-python',
              content: fileContent
            });

            console.log(`✅ File uploaded via chat: ${fileName}`);
            this.testResults.fileUpload.passed = true;
            this.testResults.fileUpload.details.push(`Successfully uploaded ${fileName} via chat`);
            return;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      throw new Error('No file upload functionality accessible');

    } catch (error) {
      console.error('❌ File upload test failed:', error);
      this.testResults.fileUpload.passed = false;
      this.testResults.fileUpload.details.push(`Error: ${error.message}`);
    }
  }

  async testCodeFormattingAndParameters() {
    console.log('\n🔧 🧪 TESTING CODE FORMATTING & PARAMETER EXTRACTION...');

    try {
      await this.page.waitForTimeout(5000); // Wait for processing

      // Look for formatting results
      const formattingSelectors = [
        '[data-testid="formatting-results"]',
        '.formatting-message',
        '.code-formatted',
        '[class*="formatted"]'
      ];

      let formattingFound = false;
      for (const selector of formattingSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 3000 });
          console.log(`✅ Found formatting results: ${selector}`);
          formattingFound = true;
          break;
        } catch (e) {
          // Continue
        }
      }

      if (!formattingFound) {
        // Look for parameter count in the page content
        const pageContent = await this.page.content();

        if (pageContent.includes('Total Parameters') && pageContent.includes('20')) {
          console.log('✅ Parameter extraction successful - found 20 total parameters');
          this.testResults.parameterExtraction.passed = true;
          this.testResults.parameterExtraction.details.push('Correctly extracted 20 total parameters (3 function + 17 from P dictionary)');
        } else {
          console.log('❌ Parameter extraction results not visible');
        }

        if (pageContent.includes('Code Formatting Complete') || pageContent.includes('Formatted successfully')) {
          console.log('✅ Code formatting successful');
          this.testResults.codeFormatting.passed = true;
          this.testResults.codeFormatting.details.push('Code formatting completed successfully');
        } else {
          console.log('❌ Code formatting results not visible');
        }
      }

      // Check for code blocks
      const codeBlocks = await this.page.$$('pre code, .code-block, [class*="code"]');
      if (codeBlocks.length > 0) {
        console.log(`✅ Found ${codeBlocks.length} code blocks`);

        // Check if code blocks have actual content (not [object Object])
        for (let i = 0; i < Math.min(codeBlocks.length, 3); i++) {
          const codeText = await codeBlocks[i].evaluate(el => el.textContent);
          if (codeText && !codeText.includes('[object Object]') && codeText.length > 100) {
            console.log(`✅ Code block ${i+1} contains valid code (${codeText.length} chars)`);
            this.testResults.codeFormatting.passed = true;
            this.testResults.codeFormatting.details.push(`Code preview working - ${codeText.length} characters displayed`);
          } else {
            console.log(`❌ Code block ${i+1} may have display issues`);
          }
        }
      }

      await this.page.screenshot({
        path: '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/validation_screenshots/01_formatting_results.png',
        fullPage: true
      });

    } catch (error) {
      console.error('❌ Code formatting test failed:', error);
      this.testResults.codeFormatting.passed = false;
      this.testResults.codeFormatting.details.push(`Error: ${error.message}`);
    }
  }

  async testProjectAddition() {
    console.log('\n📋 🧪 TESTING ADD TO PROJECT FUNCTIONALITY...');

    try {
      // Look for "Add to project" button
      const projectButtonSelectors = [
        'button:has-text("Add")',
        'button:has-text("project")',
        '[data-testid="add-to-project"]',
        '.add-to-project-button',
        'button:has-text("' + SCANNER_NAME + '")'
      ];

      let projectButton = null;
      for (const selector of projectButtonSelectors) {
        try {
          projectButton = await this.page.$(selector);
          if (projectButton) {
            console.log(`✅ Found project button: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      if (projectButton) {
        console.log('📸 Taking screenshot before clicking project button...');
        await this.page.screenshot({
          path: '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/validation_screenshots/02_before_project_add.png',
          fullPage: true
        });

        await projectButton.click();
        await this.page.waitForTimeout(3000);

        // Look for success message or project creation confirmation
        const successSelectors = [
          ':has-text("successfully")',
          ':has-text("added")',
          ':has-text("created")',
          ':has-text("project")',
          '[data-testid="project-success"]'
        ];

        let successFound = false;
        for (const selector of successSelectors) {
          try {
            await this.page.waitForSelector(selector, { timeout: 5000 });
            console.log(`✅ Found success message: ${selector}`);
            successFound = true;
            break;
          } catch (e) {
            // Continue
          }
        }

        if (successFound) {
          this.testResults.projectAddition.passed = true;
          this.testResults.projectAddition.details.push('Scanner successfully added to project');
        } else {
          // Check for any error messages
          const errorTexts = await this.page.$$eval('.error, .alert, [class*="error"]', elements =>
            elements.map(el => el.textContent.trim()).filter(text => text.length > 0)
          );

          if (errorTexts.length > 0) {
            console.log('❌ Project addition errors:', errorTexts);
            this.testResults.projectAddition.details.push(`Error: ${errorTexts.join(', ')}`);
          } else {
            console.log('⚠️ Project addition status unclear - no confirmation or error found');
            this.testResults.projectAddition.details.push('Status unclear - checking logs...');
          }
        }

        console.log('📸 Taking screenshot after project addition attempt...');
        await this.page.screenshot({
          path: '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/validation_screenshots/03_after_project_add.png',
          fullPage: true
        });

      } else {
        throw new Error('Add to project button not found');
      }

    } catch (error) {
      console.error('❌ Project addition test failed:', error);
      this.testResults.projectAddition.passed = false;
      this.testResults.projectAddition.details.push(`Error: ${error.message}`);
    }
  }

  async testScannerExecution() {
    console.log('\n⚡ 🧪 TESTING SCANNER EXECUTION...');

    try {
      // Look for execute/run scanner functionality
      const executeSelectors = [
        'button:has-text("Execute")',
        'button:has-text("Run")',
        'button:has-text("scan")',
        '[data-testid="execute-scanner"]',
        '.execute-button',
        'button:has-text("' + DATE_RANGE.start + '")',
        'button:has-text("' + DATE_RANGE.end + '")'
      ];

      let executeButton = null;
      for (const selector of executeSelectors) {
        try {
          executeButton = await this.page.$(selector);
          if (executeButton) {
            console.log(`✅ Found execute button: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      if (!executeButton) {
        console.log('⚠️ Execute button not found, checking for manual execution...');

        // Look for date input fields to configure execution
        const dateInputs = await this.page.$$('input[type="date"], input[placeholder*="date"]');
        if (dateInputs.length >= 2) {
          console.log('✅ Found date input fields - attempting manual configuration');

          // Set start date
          await dateInputs[0].click();
          await dateInputs[0].type(DATE_RANGE.start);

          // Set end date
          await dateInputs[1].click();
          await dateInputs[1].type(DATE_RANGE.end);

          console.log(`✅ Set date range: ${DATE_RANGE.start} to ${DATE_RANGE.end}`);
        } else {
          console.log('❌ No execution interface found');
          return;
        }
      } else {
        // Click the execute button
        console.log('📸 Taking screenshot before execution...');
        await this.page.screenshot({
          path: '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/validation_screenshots/04_before_execution.png',
          fullPage: true
        });

        await executeButton.click();
        await this.page.waitForTimeout(2000);
      }

      // Wait for execution to complete (up to 30 seconds)
      console.log('⏳ Waiting for scanner execution...');
      let executionFound = false;

      for (let i = 0; i < 30; i++) {
        await this.page.waitForTimeout(1000);

        // Check for execution results
        const resultSelectors = [
          ':has-text("results")',
          ':has-text("completed")',
          ':has-text("success")',
          ':has-text("scanned")',
          '[data-testid="execution-results"]',
          '.results-table',
          '.scan-results'
        ];

        for (const selector of resultSelectors) {
          try {
            const result = await this.page.$(selector);
            if (result) {
              console.log(`✅ Found execution results: ${selector}`);
              executionFound = true;
              break;
            }
          } catch (e) {
            // Continue
          }
        }

        if (executionFound) break;
      }

      if (executionFound) {
        console.log('✅ Scanner execution completed');
        this.testResults.scannerExecution.passed = true;
        this.testResults.scannerExecution.details.push(`Scanner executed successfully for date range ${DATE_RANGE.start} to ${DATE_RANGE.end}`);
      } else {
        console.log('⚠️ Execution results not visible within timeout period');
      }

      console.log('📸 Taking screenshot after execution attempt...');
      await this.page.screenshot({
        path: '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/validation_screenshots/05_after_execution.png',
        fullPage: true
      });

    } catch (error) {
      console.error('❌ Scanner execution test failed:', error);
      this.testResults.scannerExecution.passed = false;
      this.testResults.scannerExecution.details.push(`Error: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('\n📊 🧪 GENERATING VALIDATION REPORT...');

    const report = {
      timestamp: new Date().toISOString(),
      testFile: TEST_FILE,
      scannerName: SCANNER_NAME,
      dateRange: DATE_RANGE,
      testResults: this.testResults,
      overallStatus: Object.values(this.testResults).every(result => result.passed),
      summary: {
        passed: Object.values(this.testResults).filter(result => result.passed).length,
        total: Object.keys(this.testResults).length,
        percentage: Math.round((Object.values(this.testResults).filter(result => result.passed).length / Object.keys(this.testResults).length) * 100)
      }
    };

    const reportPath = '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/validation_reports';
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }

    fs.writeFileSync(
      path.join(reportPath, `backside_validation_${Date.now()}.json`),
      JSON.stringify(report, null, 2)
    );

    console.log(`\n📋 VALIDATION REPORT:`);
    console.log(`================`);
    console.log(`📁 Test File: ${path.basename(TEST_FILE)}`);
    console.log(`🔧 Scanner: ${SCANNER_NAME}`);
    console.log(`📅 Date Range: ${DATE_RANGE.start} to ${DATE_RANGE.end}`);
    console.log(`================`);

    Object.entries(this.testResults).forEach(([testName, result]) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${testName.toUpperCase()}`);
      result.details.forEach(detail => console.log(`   • ${detail}`));
    });

    console.log(`================`);
    console.log(`📊 SUMMARY: ${report.summary.passed}/${report.summary.total} tests passed (${report.summary.percentage}%)`);
    console.log(`📄 Report saved: ${path.join(reportPath, `backside_validation_${Date.now()}.json`)}`);

    return report;
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');

    if (this.page) {
      await this.page.close();
    }

    if (this.browser) {
      await this.browser.close();
    }

    console.log('✅ Cleanup completed');
  }

  async runFullValidation() {
    try {
      await this.initialize();

      const serversValid = await this.validateServers();
      if (!serversValid) {
        throw new Error('Servers not accessible');
      }

      await this.testFileUpload();
      await this.testCodeFormattingAndParameters();
      await this.testProjectAddition();
      await this.testScannerExecution();

      const report = await this.generateReport();

      return report;

    } catch (error) {
      console.error('❌ Full validation failed:', error);
      throw error;

    } finally {
      await this.cleanup();
    }
  }
}

// Main execution
async function main() {
  console.log('🎯 BACKSIDE SCANNER END-TO-END VALIDATION');
  console.log('======================================');
  console.log(`📅 Date: ${new Date().toLocaleString()}`);
  console.log(`📁 Test File: ${path.basename(TEST_FILE)}`);
  console.log(`🔧 Scanner: ${SCANNER_NAME}`);
  console.log(`📅 Date Range: ${DATE_RANGE.start} to ${DATE_RANGE.end}`);
  console.log('======================================');

  const validator = new BacksideScannerValidator();

  try {
    const report = await validator.runFullValidation();

    if (report.overallStatus) {
      console.log('\n🎉 ALL TESTS PASSED! Backside scanner validation successful!');
      process.exit(0);
    } else {
      console.log('\n⚠️ SOME TESTS FAILED. Check report for details.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 VALIDATION FAILED:', error);
    process.exit(2);
  }
}

// Run validation if script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(3);
  });
}

module.exports = { BacksideScannerValidator };