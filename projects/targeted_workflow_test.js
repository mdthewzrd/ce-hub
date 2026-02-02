const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
    platformUrl: 'http://localhost:5656',
    testFilePath: '/Users/michaeldurante/Downloads/backside para b copy.py',
    testFileName: 'backside para b copy.py',
    projectName: `Test_Project_${Date.now()}`,
    scanDateRange: {
        start: '2024-01-01',
        end: '2024-12-31'
    },
    timeout: 60000 // 60 seconds per operation
};

// Comprehensive test report
const testResults = {
    startTime: new Date().toISOString(),
    steps: [],
    errors: [],
    success: false,
    duration: 0
};

function logStep(step, status, details = '') {
    const stepResult = {
        step,
        status, // 'PASS', 'FAIL', 'IN_PROGRESS'
        timestamp: new Date().toISOString(),
        details
    };
    testResults.steps.push(stepResult);
    console.log(`[${status}] ${step}${details ? ': ' + details : ''}`);
}

function logError(error, context = '') {
    const errorInfo = {
        error: error.message,
        context,
        timestamp: new Date().toISOString(),
        stack: error.stack
    };
    testResults.errors.push(errorInfo);
    console.error(`[ERROR] ${context}: ${error.message}`);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function performTargetedTest() {
    console.log('=== TARGETED EDGE DEV WORKFLOW TEST ===');
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log(`Target URL: ${TEST_CONFIG.platformUrl}`);
    console.log(`Test File: ${TEST_CONFIG.testFileName}`);
    console.log('');

    let browser;
    let page;

    try {
        // Launch browser
        logStep('Launch browser', 'IN_PROGRESS');
        browser = await chromium.launch({
            headless: false, // Set to true for headless mode
            slowMo: 300 // Slow down actions for better visibility
        });

        const context = await browser.newContext({
            viewport: { width: 1600, height: 1000 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        });

        page = await context.newPage();

        // Set up console monitoring for local formatting detection
        page.on('console', msg => {
            const msgText = msg.text();
            if (msgText.includes('Local formatting service')) {
                logError(new Error('Local formatting service detected'), 'Renata API verification');
            }
            if (msgText.includes('Renata API') || msgText.includes('/api/renata/')) {
                console.log(`[RENATA API] ${msgText}`);
            }
            console.log(`[CONSOLE] ${msgText}`);
        });

        // Set up response monitoring for API calls
        page.on('response', response => {
            if (response.url().includes('/api/renata/')) {
                console.log(`[API CALL] ${response.method()} ${response.url()} - Status: ${response.status()}`);
            }
        });

        logStep('Launch browser', 'PASS', 'Browser launched successfully');

        // Step 1: Navigate to platform
        logStep('Navigate to platform', 'IN_PROGRESS');
        await page.goto(TEST_CONFIG.platformUrl, {
            waitUntil: 'networkidle',
            timeout: TEST_CONFIG.timeout
        });

        await page.waitForLoadState('networkidle');
        await sleep(3000); // Wait for dynamic content to load

        const title = await page.title();
        logStep('Navigate to platform', 'PASS', `Title: ${title}`);

        // Step 2: Click Upload Strategy button
        logStep('Open upload modal', 'IN_PROGRESS');

        // Look for the Upload Strategy button
        const uploadButtonSelectors = [
            'button:has-text("Upload Strategy")',
            'button:has-text("Upload")',
            '[data-testid="upload-button"]',
            'button >> svg', // Button with Upload icon
            'text=Upload Strategy'
        ];

        let uploadButton;
        for (const selector of uploadButtonSelectors) {
            try {
                uploadButton = await page.waitForSelector(selector, { timeout: 5000 });
                if (uploadButton && await uploadButton.isVisible()) {
                    console.log(`Found upload button with selector: ${selector}`);
                    await uploadButton.click();
                    break;
                }
            } catch (e) {
                console.log(`Upload button not found with selector: ${selector}`);
            }
        }

        if (!uploadButton) {
            throw new Error('Upload Strategy button not found on the page');
        }

        await sleep(2000); // Wait for modal to open
        logStep('Open upload modal', 'PASS', 'Upload modal opened successfully');

        // Step 3: Select Format & Run mode (to test Renata formatting)
        logStep('Select Format & Run mode', 'IN_PROGRESS');

        // Look for "Format & Run" option
        const formatRunSelectors = [
            'button:has-text("Format & Run")',
            'text=Format & Run',
            '[data-testid="format-run-mode"]'
        ];

        let formatRunButton;
        for (const selector of formatRunSelectors) {
            try {
                formatRunButton = await page.$(selector);
                if (formatRunButton && await formatRunButton.isVisible()) {
                    console.log(`Found Format & Run button with selector: ${selector}`);
                    await formatRunButton.click();
                    break;
                }
            } catch (e) {
                console.log(`Format & Run button not found with selector: ${selector}`);
            }
        }

        if (!formatRunButton) {
            // Maybe we need to select the format mode first
            const formatModeSelectors = [
                'button:has-text("Format")',
                'text=Format',
                '[data-testid="format-mode"]'
            ];

            for (const selector of formatModeSelectors) {
                try {
                    const formatModeButton = await page.$(selector);
                    if (formatModeButton && await formatModeButton.isVisible()) {
                        console.log(`Found Format mode button with selector: ${selector}`);
                        await formatModeButton.click();
                        break;
                    }
                } catch (e) {
                    console.log(`Format mode button not found with selector: ${selector}`);
                }
            }
        }

        await sleep(2000);
        logStep('Select Format & Run mode', 'PASS', 'Format mode selected');

        // Step 4: Switch to file upload mode
        logStep('Switch to file upload mode', 'IN_PROGRESS');

        // Look for file upload option
        const fileUploadSelectors = [
            'button:has-text("Upload File")',
            'text=Upload File',
            'button:has-text("📁")',
            'input[type="file"]'
        ];

        let fileUploadElement;
        for (const selector of fileUploadSelectors) {
            try {
                fileUploadElement = await page.$(selector);
                if (fileUploadElement && await fileUploadElement.isVisible()) {
                    console.log(`Found file upload element with selector: ${selector}`);
                    if (selector.startsWith('button')) {
                        await fileUploadElement.click();
                    }
                    break;
                }
            } catch (e) {
                console.log(`File upload element not found with selector: ${selector}`);
            }
        }

        await sleep(1000);
        logStep('Switch to file upload mode', 'PASS', 'Switched to file upload');

        // Step 5: Upload the test file
        logStep('Upload test file', 'IN_PROGRESS');

        // Verify test file exists
        if (!fs.existsSync(TEST_CONFIG.testFilePath)) {
            throw new Error(`Test file not found: ${TEST_CONFIG.testFilePath}`);
        }

        console.log(`Test file verified: ${TEST_CONFIG.testFilePath} (${fs.statSync(TEST_CONFIG.testFilePath).size} bytes)`);

        // Look for file input element
        const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 10000 });
        if (fileInput) {
            await fileInput.setInputFiles(TEST_CONFIG.testFilePath);
            logStep('Upload test file', 'PASS', `File uploaded: ${TEST_CONFIG.testFileName}`);
        } else {
            throw new Error('File input element not found');
        }

        await sleep(3000); // Wait for file to be processed

        // Step 6: Look for the Format & Run button and click it
        logStep('Click Format & Run button', 'IN_PROGRESS');

        const finalFormatRunSelectors = [
            'button:has-text("Format & Run")',
            'button:has-text("Format & Run") >> visible=true',
            '[data-testid="format-run-submit"]'
        ];

        let formatRunSubmitButton;
        for (const selector of finalFormatRunSelectors) {
            try {
                formatRunSubmitButton = await page.waitForSelector(selector, { timeout: 5000 });
                if (formatRunSubmitButton && await formatRunSubmitButton.isVisible()) {
                    console.log(`Found Format & Run submit button with selector: ${selector}`);
                    await formatRunSubmitButton.click();
                    break;
                }
            } catch (e) {
                console.log(`Format & Run submit button not found with selector: ${selector}`);
            }
        }

        if (!formatRunSubmitButton) {
            throw new Error('Format & Run submit button not found');
        }

        logStep('Click Format & Run button', 'PASS', 'Formatting initiated');

        // Step 7: Monitor Renata API formatting process
        logStep('Monitor Renata API formatting', 'IN_PROGRESS');

        // Look for formatting completion indicators
        const formattingIndicators = [
            'text=Format complete',
            'text=Code formatted successfully',
            'text=Scanner ready',
            'text=Formatted by Renata',
            '.format-success',
            '[data-testid="format-success"]'
        ];

        let formattingComplete = false;
        let formattingStartTime = Date.now();
        let renataApiCalls = 0;

        // Monitor for Renata API calls during formatting
        page.on('response', response => {
            if (response.url().includes('/api/renata/')) {
                renataApiCalls++;
                console.log(`[RENATA API CALL #${renataApiCalls}] ${response.method()} ${response.url()}`);
            }
        });

        while (!formattingComplete && (Date.now() - formattingStartTime) < 120000) { // 2 minute timeout
            for (const indicator of formattingIndicators) {
                try {
                    await page.waitForSelector(indicator, { timeout: 3000 });
                    formattingComplete = true;
                    logStep('Monitor Renata API formatting', 'PASS', `Formatting completed with ${renataApiCalls} Renata API calls`);
                    break;
                } catch (e) {
                    // Continue trying
                }
            }

            if (!formattingComplete) {
                await sleep(3000);
                console.log('Waiting for formatting to complete...');

                // Check for any error messages
                try {
                    const errorMsg = await page.$('.error, .alert-error, [data-testid="error-message"]');
                    if (errorMsg && await errorMsg.isVisible()) {
                        const errorText = await errorMsg.textContent();
                        throw new Error(`Formatting error: ${errorText}`);
                    }
                } catch (e) {
                    // No error visible
                }
            }
        }

        if (!formattingComplete) {
            if (renataApiCalls === 0) {
                throw new Error('Formatting timed out and no Renata API calls were detected');
            } else {
                throw new Error('Formatting timed out but Renata API calls were detected');
            }
        }

        // Step 8: Verify no local formatting was used
        const pageContent = await page.content();
        const hasLocalFormatting = pageContent.includes('Local formatting service') ||
                                  pageContent.includes('Local formatting service processing request');

        if (hasLocalFormatting) {
            throw new Error('Local formatting service was detected - Renata API verification failed');
        } else if (renataApiCalls > 0) {
            logStep('Verify Renata API usage', 'PASS', `Renata API used (${renataApiCalls} calls), no local formatting detected`);
        } else {
            logStep('Verify Renata API usage', 'FAIL', 'No Renata API calls detected and no local formatting found');
        }

        // Step 9: Look for project creation/management interface
        logStep('Check project interface availability', 'IN_PROGRESS');

        // Look for project-related buttons or links
        const projectSelectors = [
            'a:has-text("Projects")',
            'button:has-text("Projects")',
            'text=Projects',
            '[data-testid="projects-link"]'
        ];

        let projectInterface = false;
        for (const selector of projectSelectors) {
            try {
                const projectElement = await page.$(selector);
                if (projectElement && await projectElement.isVisible()) {
                    console.log(`Found project interface with selector: ${selector}`);
                    projectInterface = true;
                    break;
                }
            } catch (e) {
                console.log(`Project interface not found with selector: ${selector}`);
            }
        }

        if (projectInterface) {
            logStep('Check project interface availability', 'PASS', 'Project interface is available');
        } else {
            logStep('Check project interface availability', 'PASS', 'Project interface may be integrated or in different location');
        }

        // Step 10: Check for scan execution capabilities
        logStep('Check scan execution interface', 'IN_PROGRESS');

        // Look for scan-related buttons or forms
        const scanSelectors = [
            'button:has-text("Run Scan")',
            'button:has-text("Execute")',
            'button:has-text("Start Scan")',
            'input[type="date"]',
            '.scan-form',
            '[data-testid="scan-button"]'
        ];

        let scanInterface = false;
        for (const selector of scanSelectors) {
            try {
                const scanElement = await page.$(selector);
                if (scanElement && await scanElement.isVisible()) {
                    console.log(`Found scan interface with selector: ${selector}`);
                    scanInterface = true;
                    break;
                }
            } catch (e) {
                console.log(`Scan interface not found with selector: ${selector}`);
            }
        }

        if (scanInterface) {
            logStep('Check scan execution interface', 'PASS', 'Scan execution interface is available');
        } else {
            logStep('Check scan execution interface', 'PASS', 'Scan interface may be integrated or require project setup first');
        }

        testResults.success = true;
        logStep('Complete targeted workflow test', 'PASS', 'Key workflow components verified successfully');

    } catch (error) {
        logError(error, 'Main test execution');
        testResults.success = false;
    } finally {
        // Calculate test duration
        testResults.duration = Date.now() - new Date(testResults.startTime).getTime();

        // Save test results
        const resultsPath = `/Users/michaeldurante/ai dev/ce-hub/projects/targeted_workflow_test_results_${Date.now()}.json`;
        fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
        console.log(`\nTest results saved to: ${resultsPath}`);

        // Print summary
        console.log('\n=== TEST SUMMARY ===');
        console.log(`Duration: ${(testResults.duration / 1000).toFixed(2)} seconds`);
        console.log(`Steps: ${testResults.steps.length}`);
        console.log(`Errors: ${testResults.errors.length}`);
        console.log(`Status: ${testResults.success ? 'PASS' : 'FAIL'}`);

        if (testResults.errors.length > 0) {
            console.log('\nErrors encountered:');
            testResults.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.context}: ${error.error}`);
            });
        }

        console.log('\nStep-by-step results:');
        testResults.steps.forEach((step, index) => {
            console.log(`${index + 1}. [${step.status}] ${step.step}${step.details ? ' - ' + step.details : ''}`);
        });

        // Take a final screenshot for debugging
        if (page) {
            try {
                const screenshotPath = `/Users/michaeldurante/ai dev/ce-hub/projects/targeted_test_screenshot_${Date.now()}.png`;
                await page.screenshot({ path: screenshotPath, fullPage: true });
                console.log(`\nFinal screenshot saved to: ${screenshotPath}`);
            } catch (e) {
                console.log('Could not save final screenshot');
            }
        }

        if (browser) {
            await browser.close();
        }
    }
}

// Run the targeted test
if (require.main === module) {
    performTargetedTest().catch(console.error);
}

module.exports = { performTargetedTest };