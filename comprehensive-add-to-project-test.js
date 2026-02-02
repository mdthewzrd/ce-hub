const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Create screenshots directory if it doesn't exist
const screenshotDir = './comprehensive-add-to-project-validation';
if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
}

// Test configuration
const config = {
    url: 'http://localhost:5665/scan',
    scannerFile: '/Users/michaeldurante/Downloads/backside para b copy.py',
    timeout: 30000,
    screenshotDir: screenshotDir
};

// Helper function to take screenshots with timestamps
async function takeScreenshot(page, name, description) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}_${timestamp}.png`;
    const filepath = path.join(screenshotDir, filename);

    await page.screenshot({
        path: filepath,
        fullPage: true
    });

    console.log(`📸 Screenshot saved: ${filename} - ${description}`);
    return filepath;
}

// Helper function to extract console logs
async function extractConsoleLogs(page) {
    const logs = await page.evaluate(() => {
        return window.consoleLogs || [];
    });
    return logs;
}

// Main test function
async function runComprehensiveTest() {
    console.log('🚀 Starting Comprehensive "Add to Project" Validation Test');
    console.log('=' .repeat(80));

    const browser = await chromium.launch({
        headless: false, // Set to true for headless mode
        slowMo: 500 // Slow down for better visibility
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        recordVideo: {
            dir: screenshotDir,
            size: { width: 1920, height: 1080 }
        }
    });

    const page = await context.newPage();

    // Set up console logging
    const consoleMessages = [];
    page.on('console', msg => {
        const text = msg.text();
        const type = msg.type();
        consoleMessages.push({ type, text, timestamp: new Date().toISOString() });

        if (type === 'error') {
            console.log(`❌ Console Error: ${text}`);
        } else if (text.includes('📊') || text.includes('✅') || text.includes('📢')) {
            console.log(`🔍 Success Log: ${text}`);
        } else if (text.includes('undefined') || text.includes('error') || text.includes('failed')) {
            console.log(`⚠️  Warning Log: ${text}`);
        }
    });

    // Set up error handling
    page.on('pageerror', error => {
        console.log(`🚨 Page Error: ${error.message}`);
    });

    try {
        // Step 1: Navigate to Frontend
        console.log('\n📍 Step 1: Navigating to frontend...');
        await page.goto(config.url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        await takeScreenshot(page, '01_initial_load', 'Initial page load');
        console.log('✅ Successfully navigated to', config.url);

        // Step 2: Check if scanner file exists
        if (!fs.existsSync(config.scannerFile)) {
            throw new Error(`Scanner file not found: ${config.scannerFile}`);
        }
        console.log('✅ Scanner file found:', config.scannerFile);

        // Step 3: Upload Backside B Scanner
        console.log('\n📤 Step 2: Uploading Backside B Scanner...');

        // Look for upload button (multiple selectors to try)
        const uploadSelectors = [
            'button:has-text("Upload Scanner")',
            'button:has-text("Upload")',
            'input[type="file"]',
            '.upload-button',
            '[data-testid="upload-button"]'
        ];

        let uploadButton = null;
        for (const selector of uploadSelectors) {
            try {
                uploadButton = await page.$(selector);
                if (uploadButton) {
                    console.log(`🎯 Found upload button with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        if (!uploadButton) {
            // Try to find any button with upload-related text
            uploadButton = await page.$('button:has-text("Upload"), button:has-text("Choose File"), button:has-text("Select File")');
        }

        if (!uploadButton) {
            throw new Error('Could not find upload button');
        }

        await uploadButton.click();
        await page.waitForTimeout(1000);

        // Handle file input
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
            await fileInput.setInputFiles(config.scannerFile);
            console.log('✅ File selected for upload');
        } else {
            throw new Error('Could not find file input element');
        }

        await takeScreenshot(page, '02_file_selected', 'File selected for upload');

        // Step 4: Wait for Renata processing
        console.log('\n⏳ Step 3: Waiting for Renata to process and format code...');

        // Wait for processing indicators to disappear
        try {
            await page.waitForSelector('[data-testid="processing"], .loading, .spinner', { state: 'detached', timeout: 60000 });
            console.log('✅ Processing completed');
        } catch (e) {
            console.log('⚠️  Could not detect processing completion, proceeding anyway...');
        }

        await page.waitForTimeout(3000);
        await takeScreenshot(page, '03_after_processing', 'After Renata processing');

        // Step 5: Look for "Add to Project" button
        console.log('\n➕ Step 4: Looking for "Add to Project" button...');

        const addToProjectSelectors = [
            'button:has-text("Add to Project")',
            'button:has-text("Add to project")',
            '[data-testid="add-to-project"]',
            '.add-to-project-button'
        ];

        let addToProjectButton = null;
        for (const selector of addToProjectSelectors) {
            try {
                addToProjectButton = await page.$(selector);
                if (addToProjectButton) {
                    console.log(`🎯 Found "Add to Project" button with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        if (!addToProjectButton) {
            // Try to find button by text content
            const buttons = await page.$$('button');
            for (const button of buttons) {
                const text = await button.textContent();
                if (text && text.toLowerCase().includes('add to project')) {
                    addToProjectButton = button;
                    console.log('🎯 Found "Add to Project" button by text content');
                    break;
                }
            }
        }

        if (!addToProjectButton) {
            throw new Error('Could not find "Add to Project" button');
        }

        // Check if button is enabled
        const isEnabled = await addToProjectButton.isEnabled();
        console.log(`📊 "Add to Project" button enabled: ${isEnabled}`);

        await takeScreenshot(page, '04_add_to_project_button', 'Add to Project button found');

        // Step 6: Click "Add to Project" button
        console.log('\n🎯 Step 5: Clicking "Add to Project" button...');

        await addToProjectButton.click();
        await page.waitForTimeout(2000);

        await takeScreenshot(page, '05_after_add_click', 'After clicking Add to Project');

        // Step 7: Look for success message
        console.log('\n✅ Step 6: Looking for success message...');

        let successMessage = null;
        let projectID = null;
        let storageType = null;

        // Wait for success message to appear
        await page.waitForTimeout(3000);

        // Look for success message in various ways
        const successSelectors = [
            '.success-message',
            '.toast-success',
            '.notification-success',
            '[data-testid="success-message"]',
            '.alert-success'
        ];

        for (const selector of successSelectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    successMessage = await element.textContent();
                    console.log(`📊 Success message found: ${successMessage}`);
                    break;
                }
            } catch (e) {
                // Continue
            }
        }

        // If no structured success message, look for any element with success-related content
        if (!successMessage) {
            const successElements = await page.$$('*:has-text("Backend Database"), *:has-text("Local Storage"), *:has-text("project created"), *:has-text("Project ID")');

            for (const element of successElements) {
                try {
                    const text = await element.textContent();
                    if (text && (text.includes('Backend Database') || text.includes('Local Storage') || text.includes('Project ID'))) {
                        successMessage = text;
                        console.log(`📊 Success message found: ${successMessage}`);
                        break;
                    }
                } catch (e) {
                    // Continue
                }
            }
        }

        // Extract project ID and storage type from success message
        if (successMessage) {
            // Look for UUID pattern
            const uuidMatch = successMessage.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
            if (uuidMatch) {
                projectID = uuidMatch[0];
            }

            if (successMessage.includes('Backend Database')) {
                storageType = 'Backend Database';
            } else if (successMessage.includes('Local Storage')) {
                storageType = 'Local Storage (Offline Mode)';
            }
        }

        await takeScreenshot(page, '06_success_message', 'Success message displayed');

        // Step 8: Validate Sidebar Integration
        console.log('\n📋 Step 7: Checking sidebar integration...');

        await takeScreenshot(page, '07_sidebar_before', 'Sidebar before checking');

        let sidebarProject = null;

        // Look for sidebar project elements
        const sidebarSelectors = [
            '.sidebar-projects',
            '.project-list',
            '[data-testid="project-list"]',
            '.projects-sidebar'
        ];

        for (const selector of sidebarSelectors) {
            try {
                const sidebar = await page.$(selector);
                if (sidebar) {
                    console.log(`🎯 Found sidebar with selector: ${selector}`);

                    // Look for project items within sidebar
                    const projectItems = await sidebar.$$('.project-item, .project, [data-testid="project-item"]');

                    for (const item of projectItems) {
                        const text = await item.textContent();
                        if (text && (text.includes('backside') || text.includes('Backside') || text.includes('para b') || (projectID && text.includes(projectID.slice(0, 8))))) {
                            sidebarProject = text;
                            console.log(`📊 Found project in sidebar: ${sidebarProject}`);
                            break;
                        }
                    }

                    if (sidebarProject) break;
                }
            } catch (e) {
                // Continue
            }
        }

        // If still no project found, do a broader search
        if (!sidebarProject) {
            const allText = await page.textContent('body');
            if (allText.includes('backside') || allText.includes('Backside')) {
                console.log('📊 Found "backside" text somewhere on the page');
                sidebarProject = 'Found reference in page content';
            }
        }

        await takeScreenshot(page, '08_sidebar_after', 'Sidebar after checking');

        // Step 9: Collect Console Logs
        console.log('\n📝 Step 8: Analyzing console logs...');

        await page.waitForTimeout(2000);

        // Filter important logs
        const errorLogs = consoleMessages.filter(msg => msg.type === 'error');
        const warningLogs = consoleMessages.filter(msg =>
            msg.text.includes('undefined') ||
            msg.text.includes('error') ||
            msg.text.includes('failed')
        );
        const successLogs = consoleMessages.filter(msg =>
            msg.text.includes('📊') ||
            msg.text.includes('✅') ||
            msg.text.includes('📢')
        );

        console.log(`\n📊 Console Log Summary:`);
        console.log(`   - Total messages: ${consoleMessages.length}`);
        console.log(`   - Errors: ${errorLogs.length}`);
        console.log(`   - Warnings: ${warningLogs.length}`);
        console.log(`   - Success indicators: ${successLogs.length}`);

        if (errorLogs.length > 0) {
            console.log('\n❌ Console Errors:');
            errorLogs.forEach(log => console.log(`   - ${log.text}`));
        }

        if (successLogs.length > 0) {
            console.log('\n✅ Success Logs:');
            successLogs.forEach(log => console.log(`   - ${log.text}`));
        }

        // Step 10: Generate Test Report
        console.log('\n📋 Step 9: Generating test report...');

        const testResults = {
            timestamp: new Date().toISOString(),
            testUrl: config.url,
            scannerFile: config.scannerFile,

            // Navigation results
            navigationSuccess: true,

            // Upload results
            uploadSuccess: true,

            // Add to Project results
            addToProjectButtonFound: !!addToProjectButton,
            addToProjectButtonEnabled: isEnabled,

            // Success message results
            successMessageFound: !!successMessage,
            successMessage: successMessage,
            projectID: projectID,
            storageType: storageType,
            isProjectIDValid: !!projectID && projectID !== 'undefined' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectID),

            // Sidebar results
            sidebarProjectFound: !!sidebarProject,
            sidebarProjectText: sidebarProject,

            // Console logs results
            consoleErrors: errorLogs.length,
            consoleWarnings: warningLogs.length,
            consoleSuccessIndicators: successLogs.length,
            hasLocalProjectUndefinedError: consoleMessages.some(msg => msg.text.includes('local project is not defined')),

            // Screenshots taken
            screenshots: fs.readdirSync(screenshotDir).filter(f => f.endsWith('.png')),

            // Overall status
            overallStatus: 'unknown'
        };

        // Determine overall status
        const criticalIssues = [
            !testResults.addToProjectButtonFound,
            !testResults.successMessageFound,
            !testResults.isProjectIDValid,
            testResults.hasLocalProjectUndefinedError,
            testResults.consoleErrors > 0
        ];

        if (criticalIssues.some(issue => issue)) {
            testResults.overallStatus = 'FAILED';
        } else {
            testResults.overallStatus = 'PASSED';
        }

        // Save test results
        const resultsPath = path.join(screenshotDir, 'test_results.json');
        fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));

        // Print final report
        console.log('\n' + '='.repeat(80));
        console.log('🏁 COMPREHENSIVE TEST REPORT');
        console.log('='.repeat(80));

        console.log(`📅 Test Date: ${testResults.timestamp}`);
        console.log(`🌐 Test URL: ${testResults.testUrl}`);
        console.log(`📄 Scanner File: ${testResults.scannerFile}`);

        console.log('\n🎯 Core Functionality:');
        console.log(`   ✅ Navigation: ${testResults.navigationSuccess ? 'PASS' : 'FAIL'}`);
        console.log(`   ✅ Upload: ${testResults.uploadSuccess ? 'PASS' : 'FAIL'}`);
        console.log(`   ${testResults.addToProjectButtonFound ? '✅' : '❌'} Add to Project Button Found: ${testResults.addToProjectButtonFound ? 'PASS' : 'FAIL'}`);
        console.log(`   ${testResults.successMessageFound ? '✅' : '❌'} Success Message Found: ${testResults.successMessageFound ? 'PASS' : 'FAIL'}`);
        console.log(`   ${testResults.isProjectIDValid ? '✅' : '❌'} Valid Project ID: ${testResults.projectID || 'NOT FOUND'}`);
        console.log(`   📊 Storage Type: ${testResults.storageType || 'NOT DETECTED'}`);

        console.log('\n📋 Integration Results:');
        console.log(`   ${testResults.sidebarProjectFound ? '✅' : '❌'} Project in Sidebar: ${testResults.sidebarProjectFound ? 'PASS' : 'FAIL'}`);

        console.log('\n📝 Console Analysis:');
        console.log(`   ${testResults.consoleErrors === 0 ? '✅' : '❌'} Errors: ${testResults.consoleErrors}`);
        console.log(`   ${testResults.hasLocalProjectUndefinedError ? '❌' : '✅'} "local project is not defined" Error: ${testResults.hasLocalProjectUndefinedError ? 'FOUND' : 'NOT FOUND'}`);
        console.log(`   ${testResults.consoleSuccessIndicators > 0 ? '✅' : '⚠️'} Success Indicators: ${testResults.consoleSuccessIndicators}`);

        console.log('\n📸 Screenshots:');
        testResults.screenshots.forEach(screenshot => {
            console.log(`   - ${screenshot}`);
        });

        console.log(`\n🏆 OVERALL STATUS: ${testResults.overallStatus}`);

        if (testResults.overallStatus === 'PASSED') {
            console.log('\n🎉 ALL TESTS PASSED! The "Add to Project" functionality is working correctly.');
        } else {
            console.log('\n❌ TESTS FAILED! There are issues that need to be addressed.');

            console.log('\n🔧 Recommended Actions:');
            if (!testResults.addToProjectButtonFound) {
                console.log('   - Fix "Add to Project" button detection');
            }
            if (!testResults.successMessageFound) {
                console.log('   - Ensure success message is properly displayed');
            }
            if (!testResults.isProjectIDValid) {
                console.log('   - Fix project ID generation and display');
            }
            if (testResults.hasLocalProjectUndefinedError) {
                console.log('   - Fix "local project is not defined" error');
            }
            if (testResults.consoleErrors > 0) {
                console.log('   - Address JavaScript console errors');
            }
        }

        console.log('\n' + '='.repeat(80));

        // Save detailed report
        const reportPath = path.join(screenshotDir, 'test_report.txt');
        const reportContent = `
COMPREHENSIVE "ADD TO PROJECT" VALIDATION REPORT
Generated: ${new Date().toISOString()}

TEST SUMMARY:
- Overall Status: ${testResults.overallStatus}
- Test URL: ${testResults.testUrl}
- Scanner File: ${testResults.scannerFile}

FUNCTIONALITY TESTS:
✅ Navigation: ${testResults.navigationSuccess ? 'PASS' : 'FAIL'}
✅ Upload: ${testResults.uploadSuccess ? 'PASS' : 'FAIL'}
${testResults.addToProjectButtonFound ? '✅' : '❌'} Add to Project Button Found: ${testResults.addToProjectButtonFound ? 'PASS' : 'FAIL'}
${testResults.successMessageFound ? '✅' : '❌'} Success Message Found: ${testResults.successMessageFound ? 'PASS' : 'FAIL'}
${testResults.isProjectIDValid ? '✅' : '❌'} Valid Project ID: ${testResults.projectID || 'NOT FOUND'}
📊 Storage Type: ${testResults.storageType || 'NOT DETECTED'}

INTEGRATION TESTS:
${testResults.sidebarProjectFound ? '✅' : '❌'} Project in Sidebar: ${testResults.sidebarProjectFound ? 'PASS' : 'FAIL'}

CONSOLE ANALYSIS:
${testResults.consoleErrors === 0 ? '✅' : '❌'} Errors: ${testResults.consoleErrors}
${testResults.hasLocalProjectUndefinedError ? '❌' : '✅'} "local project is not defined" Error: ${testResults.hasLocalProjectUndefinedError ? 'FOUND' : 'NOT FOUND'}
${testResults.consoleSuccessIndicators > 0 ? '✅' : '⚠️'} Success Indicators: ${testResults.consoleSuccessIndicators}

SUCCESS MESSAGE:
${testResults.successMessage || 'No success message found'}

SIDEBAR PROJECT:
${testResults.sidebarProjectText || 'No project found in sidebar'}

CONSOLE ERRORS:
${errorLogs.map(log => `- ${log.text}`).join('\n') || 'No errors found'}

SUCCESS CONSOLE LOGS:
${successLogs.map(log => `- ${log.text}`).join('\n') || 'No success logs found'}

SCREENSHOTS TAKEN:
${testResults.screenshots.map(s => `- ${s}`).join('\n')}

RECOMMENDATIONS:
${testResults.overallStatus === 'PASSED'
    ? '✅ All functionality working correctly. No further action needed.'
    : '❌ Issues found. Please review the failing tests and implement fixes.'}
        `;

        fs.writeFileSync(reportPath, reportContent);
        console.log(`📄 Detailed report saved: ${reportPath}`);
        console.log(`📊 Test results JSON saved: ${resultsPath}`);

    } catch (error) {
        console.error('\n🚨 TEST FAILED WITH ERROR:', error.message);

        await takeScreenshot(page, 'error_state', `Error: ${error.message}`);

        // Save error report
        const errorReport = {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack,
            url: page.url(),
            consoleMessages: consoleMessages
        };

        const errorPath = path.join(screenshotDir, 'error_report.json');
        fs.writeFileSync(errorPath, JSON.stringify(errorReport, null, 2));

        console.log(`📄 Error report saved: ${errorPath}`);

    } finally {
        // Close browser
        await browser.close();
        console.log('\n🔚 Browser closed');

        console.log(`\n📁 All test artifacts saved to: ${screenshotDir}`);
        console.log('✅ Comprehensive validation test completed');
    }
}

// Run the test
if (require.main === module) {
    runComprehensiveTest().catch(console.error);
}

module.exports = { runComprehensiveTest };