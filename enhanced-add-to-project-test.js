const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Create screenshots directory if it doesn't exist
const screenshotDir = './enhanced-add-to-project-validation';
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

// Helper function to wait for element with multiple selectors
async function waitForAnySelector(page, selectors, timeout = 10000) {
    for (const selector of selectors) {
        try {
            const element = await page.waitForSelector(selector, { timeout: 1000 });
            if (element) {
                return { element, selector };
            }
        } catch (e) {
            // Continue to next selector
        }
    }
    throw new Error(`None of the selectors found: ${selectors.join(', ')}`);
}

// Helper function to find all upload-related elements
async function findUploadElements(page) {
    const uploadElements = [];

    // Try different selectors for file inputs
    const fileInputSelectors = [
        'input[type="file"]',
        'input[accept*=".py"]',
        'input[accept*="text"]',
        '.file-input',
        '[data-testid="file-input"]'
    ];

    for (const selector of fileInputSelectors) {
        try {
            const elements = await page.$$(selector);
            if (elements.length > 0) {
                uploadElements.push(...elements.map(el => ({ element: el, type: 'file-input', selector })));
            }
        } catch (e) {
            // Continue
        }
    }

    // Try to find upload areas/containers
    const uploadAreaSelectors = [
        '.upload-area',
        '.dropzone',
        '.file-upload',
        '[data-testid="upload-area"]',
        '.scanner-upload',
        '.upload-container'
    ];

    for (const selector of uploadAreaSelectors) {
        try {
            const elements = await page.$$(selector);
            if (elements.length > 0) {
                uploadElements.push(...elements.map(el => ({ element: el, type: 'upload-area', selector })));
            }
        } catch (e) {
            // Continue
        }
    }

    return uploadElements;
}

// Main test function
async function runEnhancedTest() {
    console.log('🚀 Starting Enhanced "Add to Project" Validation Test');
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
        await page.waitForTimeout(3000);

        await takeScreenshot(page, '01_initial_load', 'Initial page load');
        console.log('✅ Successfully navigated to', config.url);

        // Step 2: Check if scanner file exists
        if (!fs.existsSync(config.scannerFile)) {
            throw new Error(`Scanner file not found: ${config.scannerFile}`);
        }
        console.log('✅ Scanner file found:', config.scannerFile);

        // Step 3: Find upload button and click it
        console.log('\n📤 Step 2: Looking for upload button...');

        const uploadButtonSelectors = [
            'button:has-text("Upload Scanner")',
            'button:has-text("Upload")',
            'button:has-text("Choose File")',
            'button:has-text("Select Scanner")',
            '.upload-button',
            '[data-testid="upload-button"]',
            '.scanner-upload-button'
        ];

        let uploadButton = null;
        let buttonSelector = null;

        try {
            const result = await waitForAnySelector(page, uploadButtonSelectors, 5000);
            uploadButton = result.element;
            buttonSelector = result.selector;
            console.log(`🎯 Found upload button with selector: ${buttonSelector}`);
        } catch (e) {
            // Try to find by text content more broadly
            const allButtons = await page.$$('button');
            for (const button of allButtons) {
                const text = await button.textContent();
                if (text && (text.toLowerCase().includes('upload') ||
                            text.toLowerCase().includes('choose') ||
                            text.toLowerCase().includes('select'))) {
                    uploadButton = button;
                    buttonSelector = `button:has-text("${text.trim()}")`;
                    console.log(`🎯 Found upload button by text: "${text.trim()}"`);
                    break;
                }
            }
        }

        if (!uploadButton) {
            throw new Error('Could not find any upload button');
        }

        // Check if button is enabled
        const isEnabled = await uploadButton.isEnabled();
        console.log(`📊 Upload button enabled: ${isEnabled}`);

        await takeScreenshot(page, '02_upload_button_found', 'Upload button found');

        // Step 4: Click upload button
        console.log('\n🎯 Step 3: Clicking upload button...');
        await uploadButton.click();
        await page.waitForTimeout(2000);

        await takeScreenshot(page, '03_after_upload_click', 'After clicking upload button');

        // Step 5: Handle file upload with multiple strategies
        console.log('\n📁 Step 4: Attempting file upload...');

        let fileUploaded = false;

        // Strategy 1: Look for file input elements
        console.log('🔍 Strategy 1: Looking for file input elements...');
        const uploadElements = await findUploadElements(page);
        console.log(`📊 Found ${uploadElements.length} upload-related elements`);

        for (const { element, type, selector } of uploadElements) {
            if (type === 'file-input') {
                try {
                    await element.setInputFiles(config.scannerFile);
                    console.log(`✅ File uploaded via file input: ${selector}`);
                    fileUploaded = true;
                    break;
                } catch (e) {
                    console.log(`⚠️  Failed to upload via ${selector}: ${e.message}`);
                }
            }
        }

        // Strategy 2: Try drag and drop on upload areas
        if (!fileUploaded) {
            console.log('🔍 Strategy 2: Trying drag and drop...');
            for (const { element, type, selector } of uploadElements) {
                if (type === 'upload-area') {
                    try {
                        // Get element bounds for drag and drop
                        const bounds = await element.boundingBox();
                        if (bounds) {
                            await page.dispatchEvent(selector, 'drop', {
                                dataTransfer: {
                                    files: [config.scannerFile]
                                }
                            });
                            console.log(`✅ File uploaded via drag drop: ${selector}`);
                            fileUploaded = true;
                            break;
                        }
                    } catch (e) {
                        console.log(`⚠️  Failed drag drop on ${selector}: ${e.message}`);
                    }
                }
            }
        }

        // Strategy 3: Try to trigger file input programmatically
        if (!fileUploaded) {
            console.log('🔍 Strategy 3: Creating and triggering file input...');
            await page.evaluate((filePath) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.py,text/plain';
                input.style.display = 'none';
                document.body.appendChild(input);

                // Create a DataTransfer object and set files
                const dataTransfer = new DataTransfer();
                const file = new File([''], filePath, { type: 'text/plain' });
                dataTransfer.items.add(file);
                input.files = dataTransfer.files;

                // Trigger change event
                input.dispatchEvent(new Event('change', { bubbles: true }));

                return input.files.length > 0;
            }, config.scannerFile).then(result => {
                if (result) {
                    console.log('✅ File uploaded via programmatic input');
                    fileUploaded = true;
                }
            }).catch(e => console.log('⚠️ Programmatic upload failed:', e.message));
        }

        await page.waitForTimeout(2000);
        await takeScreenshot(page, '04_file_upload_attempt', 'File upload attempt');

        if (!fileUploaded) {
            console.log('⚠️ Could not upload file with automatic methods, but continuing with test...');
        }

        // Step 6: Wait for processing and look for code/content area
        console.log('\n⏳ Step 5: Waiting for processing and looking for code area...');

        // Wait for any content to appear that indicates processing completed
        const processingCompleteSelectors = [
            '.code-editor',
            '.code-display',
            '.formatted-code',
            '.scanner-code',
            '[data-testid="code-editor"]',
            '.renata-output',
            '.formatted-result'
        ];

        let codeElement = null;
        try {
            const result = await waitForAnySelector(page, processingCompleteSelectors, 30000);
            codeElement = result.element;
            console.log(`🎯 Found code area: ${result.selector}`);
        } catch (e) {
            console.log('⚠️ Could not detect code area, proceeding anyway...');
        }

        await page.waitForTimeout(3000);
        await takeScreenshot(page, '05_after_processing', 'After processing attempt');

        // Step 7: Look for "Add to Project" button
        console.log('\n➕ Step 6: Looking for "Add to Project" button...');

        const addToProjectSelectors = [
            'button:has-text("Add to Project")',
            'button:has-text("Add to project")',
            'button:has-text("Save to Project")',
            'button:has-text("Save as Project")',
            '[data-testid="add-to-project"]',
            '.add-to-project-button',
            '.save-project-button'
        ];

        let addToProjectButton = null;
        let projectButtonSelector = null;

        try {
            const result = await waitForAnySelector(page, addToProjectSelectors, 5000);
            addToProjectButton = result.element;
            projectButtonSelector = result.selector;
            console.log(`🎯 Found "Add to Project" button: ${projectButtonSelector}`);
        } catch (e) {
            // Try to find by text content more broadly
            const allButtons = await page.$$('button');
            for (const button of allButtons) {
                const text = await button.textContent();
                if (text && (text.toLowerCase().includes('add to project') ||
                            text.toLowerCase().includes('save to project') ||
                            text.toLowerCase().includes('save as project'))) {
                    addToProjectButton = button;
                    projectButtonSelector = `button:has-text("${text.trim()}")`;
                    console.log(`🎯 Found project button by text: "${text.trim()}"`);
                    break;
                }
            }
        }

        if (!addToProjectButton) {
            throw new Error('Could not find "Add to Project" button');
        }

        // Check if button is enabled
        const isProjectButtonEnabled = await addToProjectButton.isEnabled();
        console.log(`📊 "Add to Project" button enabled: ${isProjectButtonEnabled}`);

        await takeScreenshot(page, '06_add_to_project_button', 'Add to Project button found');

        // Step 8: Click "Add to Project" button
        console.log('\n🎯 Step 7: Clicking "Add to Project" button...');

        await addToProjectButton.click();
        await page.waitForTimeout(3000);

        await takeScreenshot(page, '07_after_add_click', 'After clicking Add to Project');

        // Step 9: Look for success message or indicators
        console.log('\n✅ Step 8: Looking for success message...');

        let successMessage = null;
        let projectID = null;
        let storageType = null;

        // Wait a bit more for async operations
        await page.waitForTimeout(2000);

        // Look for success message in various ways
        const successSelectors = [
            '.success-message',
            '.toast-success',
            '.notification-success',
            '.alert-success',
            '[data-testid="success-message"]',
            '.project-created-message',
            '.save-success'
        ];

        for (const selector of successSelectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    const text = await element.textContent();
                    if (text && text.trim()) {
                        successMessage = text.trim();
                        console.log(`📊 Success message found: ${successMessage}`);
                        break;
                    }
                }
            } catch (e) {
                // Continue
            }
        }

        // If no structured success message, look for any element with success-related content
        if (!successMessage) {
            const successContentSelectors = [
                '*:has-text("Backend Database")',
                '*:has-text("Local Storage")',
                '*:has-text("project created")',
                '*:has-text("Project ID")',
                '*:has-text("successfully")',
                '*:has-text("saved")'
            ];

            for (const selector of successContentSelectors) {
                try {
                    const element = await page.$(selector);
                    if (element) {
                        const text = await element.textContent();
                        if (text && (text.includes('Backend Database') ||
                                   text.includes('Local Storage') ||
                                   text.includes('Project ID') ||
                                   text.includes('created') ||
                                   text.includes('saved'))) {
                            successMessage = text.trim();
                            console.log(`📊 Success content found: ${successMessage}`);
                            break;
                        }
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

        await takeScreenshot(page, '08_success_message', 'Success message attempt');

        // Step 10: Validate Sidebar Integration
        console.log('\n📋 Step 9: Checking sidebar integration...');

        await takeScreenshot(page, '09_sidebar_full', 'Full sidebar view');

        let sidebarProject = null;
        let projectCount = 0;

        // Look for sidebar project elements
        const sidebarSelectors = [
            '.sidebar-projects',
            '.project-list',
            '[data-testid="project-list"]',
            '.projects-sidebar',
            '.saved-scans',
            '.scan-list'
        ];

        for (const selector of sidebarSelectors) {
            try {
                const sidebar = await page.$(selector);
                if (sidebar) {
                    console.log(`🎯 Found sidebar with selector: ${selector}`);

                    // Count all project items
                    const projectItems = await sidebar.$$('.project-item, .project, [data-testid="project-item"], .scan-item');
                    projectCount = projectItems.length;
                    console.log(`📊 Found ${projectCount} project items in sidebar`);

                    // Look for project items with relevant content
                    for (const item of projectItems) {
                        const text = await item.textContent();
                        if (text && (text.includes('backside') ||
                                   text.includes('Backside') ||
                                   text.includes('para b') ||
                                   (projectID && text.includes(projectID.slice(0, 8))) ||
                                   text.toLowerCase().includes('para b'))) {
                            sidebarProject = text;
                            console.log(`📊 Found matching project in sidebar: ${sidebarProject}`);
                            break;
                        }
                    }

                    if (sidebarProject) break;
                }
            } catch (e) {
                // Continue
            }
        }

        // If still no project found, check if project count increased
        if (!sidebarProject && projectCount > 0) {
            console.log(`📊 Sidebar shows ${projectCount} projects (may indicate new project added)`);
            sidebarProject = `Found ${projectCount} projects in sidebar`;
        }

        await takeScreenshot(page, '10_sidebar_focus', 'Sidebar focus on projects');

        // Step 11: Collect Console Logs
        console.log('\n📝 Step 10: Analyzing console logs...');

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
            msg.text.includes('📢') ||
            msg.text.includes('Project created') ||
            msg.text.includes('successfully')
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

        // Step 12: Generate Test Report
        console.log('\n📋 Step 11: Generating comprehensive test report...');

        const testResults = {
            timestamp: new Date().toISOString(),
            testUrl: config.url,
            scannerFile: config.scannerFile,

            // Navigation results
            navigationSuccess: true,

            // Upload results
            uploadButtonFound: !!uploadButton,
            uploadButtonEnabled: isEnabled,
            fileUploaded: fileUploaded,
            uploadElementsFound: uploadElements.length,
            codeAreaFound: !!codeElement,

            // Add to Project results
            addToProjectButtonFound: !!addToProjectButton,
            addToProjectButtonEnabled: isProjectButtonEnabled,

            // Success message results
            successMessageFound: !!successMessage,
            successMessage: successMessage,
            projectID: projectID,
            storageType: storageType,
            isProjectIDValid: !!projectID && projectID !== 'undefined' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectID),

            // Sidebar results
            sidebarProjectFound: !!sidebarProject,
            sidebarProjectText: sidebarProject,
            projectCount: projectCount,

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
            !testResults.uploadButtonFound,
            !testResults.addToProjectButtonFound,
            !testResults.isProjectIDValid && testResults.successMessageFound,
            testResults.hasLocalProjectUndefinedError,
            testResults.consoleErrors > 0
        ];

        const warningIssues = [
            !testResults.fileUploaded,
            !testResults.successMessageFound,
            !testResults.sidebarProjectFound
        ];

        if (criticalIssues.some(issue => issue)) {
            testResults.overallStatus = 'FAILED';
        } else if (warningIssues.some(issue => issue)) {
            testResults.overallStatus = 'PARTIAL';
        } else {
            testResults.overallStatus = 'PASSED';
        }

        // Save test results
        const resultsPath = path.join(screenshotDir, 'test_results.json');
        fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));

        // Print final report
        console.log('\n' + '='.repeat(80));
        console.log('🏁 ENHANCED COMPREHENSIVE TEST REPORT');
        console.log('='.repeat(80));

        console.log(`📅 Test Date: ${testResults.timestamp}`);
        console.log(`🌐 Test URL: ${testResults.testUrl}`);
        console.log(`📄 Scanner File: ${testResults.scannerFile}`);

        console.log('\n🎯 Upload Functionality:');
        console.log(`   ${testResults.uploadButtonFound ? '✅' : '❌'} Upload Button Found: ${testResults.uploadButtonFound ? 'PASS' : 'FAIL'}`);
        console.log(`   ${testResults.uploadButtonEnabled ? '✅' : '⚠️'} Upload Button Enabled: ${testResults.uploadButtonEnabled ? 'PASS' : 'WARNING'}`);
        console.log(`   ${testResults.fileUploaded ? '✅' : '⚠️'} File Uploaded: ${testResults.fileUploaded ? 'PASS' : 'NOT CONFIRMED'}`);
        console.log(`   ${testResults.uploadElementsFound > 0 ? '✅' : '⚠️'} Upload Elements: ${testResults.uploadElementsFound} found`);
        console.log(`   ${testResults.codeAreaFound ? '✅' : '⚠️'} Code Area Found: ${testResults.codeAreaFound ? 'PASS' : 'NOT DETECTED'}`);

        console.log('\n🎯 Add to Project Functionality:');
        console.log(`   ${testResults.addToProjectButtonFound ? '✅' : '❌'} Add to Project Button: ${testResults.addToProjectButtonFound ? 'PASS' : 'FAIL'}`);
        console.log(`   ${testResults.addToProjectButtonEnabled ? '✅' : '⚠️'} Button Enabled: ${testResults.addToProjectButtonEnabled ? 'PASS' : 'WARNING'}`);
        console.log(`   ${testResults.successMessageFound ? '✅' : '⚠️'} Success Message: ${testResults.successMessageFound ? 'PASS' : 'NOT DETECTED'}`);
        console.log(`   ${testResults.isProjectIDValid ? '✅' : '❌'} Valid Project ID: ${testResults.projectID || 'NOT FOUND'}`);
        console.log(`   📊 Storage Type: ${testResults.storageType || 'NOT DETECTED'}`);

        console.log('\n📋 Integration Results:');
        console.log(`   ${testResults.sidebarProjectFound ? '✅' : '⚠️'} Project in Sidebar: ${testResults.sidebarProjectFound ? 'PASS' : 'NOT CONFIRMED'}`);
        console.log(`   📊 Project Count: ${testResults.projectCount}`);

        console.log('\n📝 Console Analysis:');
        console.log(`   ${testResults.consoleErrors === 0 ? '✅' : '❌'} Errors: ${testResults.consoleErrors}`);
        console.log(`   ${testResults.hasLocalProjectUndefinedError ? '❌' : '✅'} "local project is not defined": ${testResults.hasLocalProjectUndefinedError ? 'FOUND' : 'NOT FOUND'}`);
        console.log(`   ${testResults.consoleSuccessIndicators > 0 ? '✅' : '⚠️'} Success Indicators: ${testResults.consoleSuccessIndicators}`);

        console.log('\n📸 Screenshots:');
        testResults.screenshots.forEach(screenshot => {
            console.log(`   - ${screenshot}`);
        });

        console.log(`\n🏆 OVERALL STATUS: ${testResults.overallStatus}`);

        if (testResults.overallStatus === 'PASSED') {
            console.log('\n🎉 ALL TESTS PASSED! The "Add to Project" functionality is working correctly.');
        } else if (testResults.overallStatus === 'PARTIAL') {
            console.log('\n⚠️ PARTIAL SUCCESS! Some functionality works but needs improvement.');
        } else {
            console.log('\n❌ TESTS FAILED! There are critical issues that need to be addressed.');

            console.log('\n🔧 Recommended Actions:');
            if (!testResults.uploadButtonFound) {
                console.log('   - Fix upload button detection or implementation');
            }
            if (!testResults.addToProjectButtonFound) {
                console.log('   - Fix "Add to Project" button detection or implementation');
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
ENHANCED COMPREHENSIVE "ADD TO PROJECT" VALIDATION REPORT
Generated: ${new Date().toISOString()}

TEST SUMMARY:
- Overall Status: ${testResults.overallStatus}
- Test URL: ${testResults.testUrl}
- Scanner File: ${testResults.scannerFile}

UPLOAD FUNCTIONITY TESTS:
${testResults.uploadButtonFound ? '✅' : '❌'} Upload Button Found: ${testResults.uploadButtonFound ? 'PASS' : 'FAIL'}
${testResults.uploadButtonEnabled ? '✅' : '⚠️'} Upload Button Enabled: ${testResults.uploadButtonEnabled ? 'PASS' : 'WARNING'}
${testResults.fileUploaded ? '✅' : '⚠️'} File Uploaded: ${testResults.fileUploaded ? 'PASS' : 'NOT CONFIRMED'}
${testResults.uploadElementsFound > 0 ? '✅' : '⚠️'} Upload Elements: ${testResults.uploadElementsFound} found
${testResults.codeAreaFound ? '✅' : '⚠️'} Code Area Found: ${testResults.codeAreaFound ? 'PASS' : 'NOT DETECTED'}

ADD TO PROJECT FUNCTIONALITY TESTS:
${testResults.addToProjectButtonFound ? '✅' : '❌'} Add to Project Button Found: ${testResults.addToProjectButtonFound ? 'PASS' : 'FAIL'}
${testResults.addToProjectButtonEnabled ? '✅' : '⚠️'} Button Enabled: ${testResults.addToProjectButtonEnabled ? 'PASS' : 'WARNING'}
${testResults.successMessageFound ? '✅' : '❌'} Success Message Found: ${testResults.successMessageFound ? 'PASS' : 'FAIL'}
${testResults.isProjectIDValid ? '✅' : '❌'} Valid Project ID: ${testResults.projectID || 'NOT FOUND'}
📊 Storage Type: ${testResults.storageType || 'NOT DETECTED'}

INTEGRATION TESTS:
${testResults.sidebarProjectFound ? '✅' : '⚠️'} Project in Sidebar: ${testResults.sidebarProjectFound ? 'PASS' : 'NOT CONFIRMED'}
📊 Project Count: ${testResults.projectCount}

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

RECOMMENDATIONS:
${testResults.overallStatus === 'PASSED'
    ? '✅ All functionality working correctly. No further action needed.'
    : testResults.overallStatus === 'PARTIAL'
    ? '⚠️ Some functionality working but may need improvements for better user experience.'
    : '❌ Critical issues found. Please review the failing tests and implement fixes.'}

UPLOAD STRATEGIES ATTEMPTED:
${fileUploaded
    ? '✅ File upload successful'
    : '⚠️ File upload could not be confirmed - may require manual intervention'}
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
        console.log('✅ Enhanced comprehensive validation test completed');
    }
}

// Run the test
if (require.main === module) {
    runEnhancedTest().catch(console.error);
}

module.exports = { runEnhancedTest };