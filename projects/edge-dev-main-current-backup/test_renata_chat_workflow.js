/**
 * 🤖 RENATA AI CHAT WORKFLOW VALIDATION
 *
 * Tests the complete Renata conversation workflow:
 * 1. Upload backside para b copy.py through Renata chat
 * 2. Verify code formatting and parameter extraction
 * 3. Add scanner to project via Renata commands
 * 4. Execute scanner with specific date range through chat
 *
 * This test interacts with Renata's AI chat interface the way a real user would
 * - typing messages, clicking buttons that Renata provides, etc.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class RenataChatValidator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      renataAccess: { passed: false, details: [] },
      fileUpload: { passed: false, details: [] },
      parameterExtraction: { passed: false, details: [] },
      projectAddition: { passed: false, details: [] },
      scannerExecution: { passed: false, details: [] }
    };
  }

  async initialize() {
    console.log('🤖 Initializing Browser for Renata Chat Validation...');
    this.browser = await puppeteer.launch({
      headless: false,
      slowMo: 2000, // Slow down for visibility
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1400, height: 900 });

    // Enable console logging
    this.page.on('console', msg => {
      if (msg.text().includes('📝') || msg.text().includes('🚀') || msg.text().includes('✅') || msg.text().includes('❌')) {
        console.log(`🤖 [Renata]: ${msg.text()}`);
      }
    });

    console.log('✅ Browser initialized for Renata chat validation');
  }

  async openRenataChat() {
    console.log('\n💬 Opening Renata Chat Interface...');

    try {
      await this.page.goto('http://localhost:5657', { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Look for Renata chat button/interface
      const renataSelectors = [
        'button:has-text("RenataAI Assistant")',
        'button:has-text("Renata")',
        'button:has-text("AI Assistant")',
        '.renata-popup-button',
        '[data-testid="renata-toggle"]',
        'button[aria-label*="Renata"]',
        'button[aria-label*="Chat"]',
        '.message-circle',
        '.ai-chat-toggle'
      ];

      let renataOpened = false;

      // First try clicking on the Renata button text directly
      try {
        await this.page.click('text=RenataAI Assistant');
        console.log('✅ Found and clicked RenataAI Assistant button');
        renataOpened = true;
      } catch (e) {
        console.log('❌ Could not find RenataAI Assistant button, trying other selectors...');

        for (const selector of renataSelectors) {
          try {
            const button = await this.page.waitForSelector(selector, { timeout: 3000 });
            if (button) {
              console.log(`✅ Found Renata button: ${selector}`);
              await button.click();
              renataOpened = true;
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
      }

      if (!renataOpened) {
        throw new Error('Could not find or open Renata chat interface');
      }

      // Wait for Renata chat to open
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify Renata chat is open
      const renataChatSelectors = [
        '.renata-popup',
        '[data-testid="renata-chat"]',
        '.ai-chat-interface',
        '.chat-interface'
      ];

      for (const selector of renataChatSelectors) {
        try {
          const chatInterface = await this.page.$(selector);
          if (chatInterface) {
            const isVisible = await chatInterface.isDisplayed();
            if (isVisible) {
              console.log(`✅ Renata chat opened: ${selector}`);
              this.testResults.renataAccess.passed = true;
              this.testResults.renataAccess.details.push('Successfully opened Renata chat interface');
              break;
            }
          }
        } catch (e) {
          // Continue
        }
      }

      if (!this.testResults.renataAccess.passed) {
        throw new Error('Renata chat interface not visible after opening');
      }

      console.log('📸 Taking screenshot of Renata chat interface...');
      await this.page.screenshot({
        path: '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/validation_screenshots/renata_chat_open.png',
        fullPage: false
      });

    } catch (error) {
      console.error('❌ Failed to open Renata chat:', error);
      this.testResults.renataAccess.passed = false;
      this.testResults.renataAccess.details.push(`Error: ${error.message}`);
    }
  }

  async uploadFileViaRenata() {
    console.log('\n📁 🤖 Uploading File Through Renata Chat...');

    try {
      // Type upload command to Renata
      const uploadCommand = `Please upload this file: backside para b copy.py\n\n--- File: backside para b copy.py ---\n# daily_para_backside_lite_scan.py\n# Daily-only "A+ para, backside" scan — lite mold.\n# Trigger: D-1 (or D-2) fits; trade day (D0) must gap & open > D-1 high.`;

      await this.page.waitForSelector('textarea, [contenteditable="true"], .chat-input', { timeout: 5000 });

      const textArea = await this.page.$('textarea, [contenteditable="true"], .chat-input');
      if (textArea) {
        console.log('✅ Found Renata chat input area');

        // Click to focus and type
        await textArea.click();
        await textArea.type(uploadCommand);
        console.log('✅ Typed upload command to Renata');
      } else {
        throw new Error('Could not find Renata chat input area');
      }

      // Try to find file upload button within Renata
      const fileUploadSelectors = [
        'input[type="file"]',
        '.file-upload-button',
        '[data-testid="renata-file-upload"]',
        'button:has-text("Upload")',
        'button:has-text("Choose File")'
      ];

      let fileUploaded = false;
      for (const selector of fileUploadSelectors) {
        try {
          const fileInput = await this.page.$(selector);
          if (fileInput) {
            console.log(`✅ Found file upload in Renata: ${selector}`);

            // Upload the file
            const fileContent = fs.readFileSync('/Users/michaeldurante/Downloads/backside para b copy.py');

            await fileInput.uploadFile({
              name: 'backside para b copy.py',
              mimeType: 'text/x-python',
              content: fileContent
            });

            console.log('✅ File uploaded to Renata');
            fileUploaded = true;
            this.testResults.fileUpload.passed = true;
            this.testResults.fileUpload.details.push('Successfully uploaded backside para b copy.py to Renata');
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      // Wait for Renata to process the file
      await new Promise(resolve => setTimeout(resolve, 8000));

      console.log('📸 Taking screenshot after file upload...');
      await this.page.screenshot({
        path: '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/validation_screenshots/renata_file_uploaded.png',
        fullPage: false
      });

      if (!fileUploaded) {
        console.log('⚠️ File upload through Renata interface may have issues - continuing with validation...');
      }

    } catch (error) {
      console.error('❌ Renata file upload failed:', error);
      this.testResults.fileUpload.passed = false;
      this.testResults.fileUpload.details.push(`Error: ${error.message}`);
    }
  }

  async verifyFormattingAndParameters() {
    console.log('\n🔧 🤖 Verifying Code Formatting and Parameters...');

    try {
      // Look for Renata's response with formatting results
      const pageContent = await this.page.content();

      // Check for parameter extraction results
      const hasCorrectParameters = pageContent.includes('Total Parameters') && pageContent.includes('20');
      const hasCodeFormatting = pageContent.includes('Code Formatting Complete') || pageContent.includes('Formatted successfully');
      const hasCodePreview = pageContent.includes('```python') || pageContent.includes('Code Block') || pageContent.includes('def scan_symbol');

      console.log(`🔍 Content Analysis:`);
      console.log(`   ✅ Correct Parameters (20): ${hasCorrectParameters}`);
      console.log(`   ✅ Code Formatting: ${hasCodeFormatting}`);
      console.log(`   ✅ Code Preview: ${hasCodePreview}`);

      if (hasCorrectParameters) {
        this.testResults.parameterExtraction.passed = true;
        this.testResults.parameterExtraction.details.push('Renata correctly extracted 20 total parameters');
      } else {
        this.testResults.parameterExtraction.passed = false;
        this.testResults.parameterExtraction.details.push('Renata did not extract correct number of parameters');
      }

      if (hasCodeFormatting) {
        // Update the main codeFormatting result
        this.testResults.codeFormatting = { passed: true, details: ['Renata successfully formatted the code'] };
      }

      console.log('📸 Taking screenshot of formatting results...');
      await this.page.screenshot({
        path: '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/validation_screenshots/renata_formatting_results.png',
        fullPage: false
      });

    } catch (error) {
      console.error('❌ Renata formatting verification failed:', error);
      this.testResults.parameterExtraction.passed = false;
      this.testResults.parameterExtraction.details.push(`Error: ${error.message}`);
    }
  }

  async addProjectViaRenata() {
    console.log('\n📋 🤖 Adding to Project Through Renata...');

    try {
      // Look for "Add to project" button that Renata generates
      const addButtonSelectors = [
        'button:has-text("Add Backside Para B Copy to edge.dev project")',
        'button:has-text("Add")',
        'button:has-text("project")',
        '[data-testid="add-to-project-btn"]',
        '.renata-action-button'
      ];

      let addButtonFound = false;
      for (const selector of addButtonSelectors) {
        try {
          const button = await this.page.waitForSelector(selector, { timeout: 5000 });
          if (button) {
            console.log(`✅ Found Renata's "Add to Project" button: ${selector}`);

            // Check if button is enabled
            const isEnabled = await this.page.evaluate(el => !el.disabled, button);
            if (isEnabled) {
              await button.click();
              console.log('✅ Clicked "Add to Project" button');
              addButtonFound = true;
              break;
            } else {
              console.log('❌ Add to project button is disabled');
            }
          }
        } catch (e) {
          // Continue
        }
      }

      if (!addButtonFound) {
        // Try typing the command instead
        console.log('📝 Typing "Add to project" command to Renata...');

        const textArea = await this.page.$('textarea, [contenteditable="true"], .chat-input');
        if (textArea) {
          await textArea.click();
          await textArea.type('Add Backside Para B Copy to edge.dev project');
          console.log('✅ Typed add to project command');
        }
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check for success or error messages
      const pageContent = await this.page.content();
      const hasSuccess = pageContent.includes('successfully') || pageContent.includes('added') || pageContent.includes('created');
      const hasError = pageContent.includes('error') || pageContent.includes('failed') || pageContent.includes('Error');

      if (hasSuccess) {
        console.log('✅ Project addition successful');
        this.testResults.projectAddition.passed = true;
        this.testResults.projectAddition.details.push('Renata successfully added scanner to project');
      } else if (hasError) {
        console.log('❌ Project addition failed');
        this.testResults.projectAddition.passed = false;
        this.testResults.projectAddition.details.push('Renata reported errors during project addition');
      } else {
        console.log('⚠️ Project addition status unclear');
      }

      console.log('📸 Taking screenshot after project addition...');
      await this.page.screenshot({
        path: '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/validation_screenshots/renata_project_add.png',
        fullPage: false
      });

    } catch (error) {
      console.error('❌ Renata project addition failed:', error);
      this.testResults.projectAddition.passed = false;
      this.testResults.projectAddition.details.push(`Error: ${error.message}`);
    }
  }

  async executeScannerViaRenata() {
    console.log('\n⚡ 🤖 Executing Scanner Through Renata...');

    try {
      // Type execution command to Renata
      const executionCommand = `Execute Backside Para B Copy from ${DATE_RANGE.start} to ${DATE_RANGE.end}`;

      const textArea = await this.page.$('textarea, [contenteditable="true"], .chat-input');
      if (textArea) {
        console.log(`📝 Typing execution command: ${executionCommand}`);

        await textArea.click();
        await textArea.type(executionCommand);
        console.log('✅ Typed execution command to Renata');
      } else {
        throw new Error('Could not find Renata chat input for execution command');
      }

      // Look for execute button that Renata might generate
      const executeButtonSelectors = [
        'button:has-text("Execute")',
        'button:has-text("Run")',
        'button:has-text("Start")',
        'button:has-text("Execute scanner")',
        '[data-testid="execute-btn"]'
      ];

      let executeButtonFound = false;
      for (const selector of executeButtonSelectors) {
        try {
          const button = await this.page.$(selector);
          if (button) {
            console.log(`✅ Found execution button: ${selector}`);
            await button.click();
            executeButtonFound = true;
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      // Wait for execution to complete (up to 60 seconds for long scans)
      console.log('⏳ Waiting for scanner execution...');
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Check for execution results
      const pageContent = await this.page.content();
      const hasResults = pageContent.includes('results') || pageContent.includes('completed') || pageContent.includes('success') || pageContent.includes('executed');
      const hasError = pageContent.includes('error') || pageContent.includes('failed');

      if (hasResults) {
        console.log('✅ Scanner execution completed');
        this.testResults.scannerExecution.passed = true;
        this.testResults.scannerExecution.details.push(`Renata executed scanner for ${DATE_RANGE.start} to ${DATE_RANGE.end}`);
      } else if (hasError) {
        console.log('❌ Scanner execution failed');
        this.testResults.scannerExecution.passed = false;
        this.testResults.scannerExecution.details.push('Renata reported errors during scanner execution');
      } else {
        console.log('⚠️ Scanner execution may still be running or results not visible yet');
      }

      console.log('📸 Taking screenshot after execution...');
      await this.page.screenshot({
        path: '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/validation_screenshots/renata_execution_results.png',
        fullPage: false
      });

    } catch (error) {
      console.error('❌ Renata scanner execution failed:', error);
      this.testResults.scannerExecution.passed = false;
      this.testResults.scannerExecution.details.push(`Error: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('\n📊 🤖 GENERATING RENATA WORKFLOW REPORT...');

    const report = {
      timestamp: new Date().toISOString(),
      testType: 'Renata AI Chat Workflow',
      testFile: '/Users/michaeldurante/Downloads/backside para b copy.py',
      scannerName: 'Backside Para B Copy',
      dateRange: '2025-01-01 to 2025-11-01',
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
      path.join(reportPath, `renata_workflow_${Date.now()}.json`),
      JSON.stringify(report, null, 2)
    );

    console.log(`\n📋 RENATA WORKFLOW REPORT:`);
    console.log(`========================`);
    console.log(`🤖 Interface: Renata AI Chat`);
    console.log(`📁 Test File: backside para b copy.py`);
    console.log(`🔧 Scanner: Backside Para B Copy`);
    console.log(`📅 Date Range: 2025-01-01 to 2025-11-01`);
    console.log(`========================`);

    Object.entries(this.testResults).forEach(([testName, result]) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${testName.toUpperCase()}`);
      result.details.forEach(detail => console.log(`   • ${detail}`));
    });

    console.log(`========================`);
    console.log(`📊 SUMMARY: ${report.summary.passed}/${report.summary.total} tests passed (${report.summary.percentage}%)`);
    console.log(`📄 Report saved: ${path.join(reportPath, `renata_workflow_${Date.now()}.json`)}`);

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

  async runRenataWorkflowValidation() {
    try {
      await this.initialize();
      await this.openRenataChat();
      await this.uploadFileViaRenata();
      await this.verifyFormattingAndParameters();
      await this.addProjectViaRenata();
      await this.executeScannerViaRenata();

      const report = await this.generateReport();

      return report;

    } catch (error) {
      console.error('❌ Renata workflow validation failed:', error);
      throw error;

    } finally {
      await this.cleanup();
    }
  }
}

// Configuration
const DATE_RANGE = {
  start: '2025-01-01',
  end: '2025-11-01'
};

// Main execution
async function main() {
  console.log('🤖 RENATA AI CHAT WORKFLOW VALIDATION');
  console.log('========================================');
  console.log(`📅 Date: ${new Date().toLocaleString()}`);
  console.log(`🤖 Interface: Renata AI Chat`);
  console.log(`📁 Test File: backside para b copy.py`);
  console.log(`🔧 Scanner: Backside Para B Copy`);
  console.log(`📅 Date Range: ${DATE_RANGE.start} to ${DATE_RANGE.end}`);
  console.log('========================================');

  const validator = new RenataChatValidator();

  try {
    const report = await validator.runRenataWorkflowValidation();

    if (report.overallStatus) {
      console.log('\n🎉 ALL RENATA WORKFLOW TESTS PASSED! Renata AI validation successful!');
      process.exit(0);
    } else {
      console.log('\n⚠️ SOME RENATA TESTS FAILED. Check report for details.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 RENATA VALIDATION FAILED:', error);
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

module.exports = { RenataChatValidator };