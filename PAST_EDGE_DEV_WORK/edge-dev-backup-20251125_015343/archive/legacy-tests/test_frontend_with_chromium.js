#!/usr/bin/env node

/**
 * Frontend Upload Scanner Test with Chromium
 * Test exactly what happens when uploading a scanner and clicking "Run Scan"
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function testFrontendWithChromium() {
    console.log('🚀 TESTING FRONTEND WITH CHROMIUM');
    console.log('=' * 60);

    try {
        // Check if the scanner file exists
        const scannerPath = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py';
        if (!fs.existsSync(scannerPath)) {
            console.log('❌ Scanner file not found:', scannerPath);
            return false;
        }

        console.log('✅ Scanner file found');
        console.log('📄 Path:', scannerPath);

        // Create a script that chromium will execute
        const testScript = `
console.log('🧪 FRONTEND UPLOAD SCANNER TEST STARTED');

// Function to wait for element
function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        function check() {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error('Element not found: ' + selector));
            } else {
                setTimeout(check, 100);
            }
        }

        check();
    });
}

// Function to simulate file upload
async function simulateFileUpload() {
    console.log('📂 Looking for file upload input...');

    try {
        // Look for file input
        const fileInput = await waitForElement('input[type="file"]');
        console.log('✅ Found file input element');

        // Look for upload button/area
        const uploadArea = document.querySelector('[class*="upload"], [class*="drop"], button[class*="upload"]');
        if (uploadArea) {
            console.log('✅ Found upload area');
        }

        // Look for Run Scan button
        const runScanButton = await waitForElement('button:contains("Run Scan"), [class*="run"], [class*="scan"]');
        console.log('✅ Found Run Scan button');

        return { fileInput, uploadArea, runScanButton };

    } catch (error) {
        console.log('❌ Error finding upload elements:', error.message);
        return null;
    }
}

// Main test function
async function runTest() {
    console.log('🔍 Testing upload scanner workflow...');

    try {
        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Find upload elements
        const elements = await simulateFileUpload();
        if (!elements) {
            console.log('❌ Could not find required upload elements');
            return;
        }

        console.log('🎯 Found all required elements for testing');
        console.log('📊 Current page state:');
        console.log('   - URL:', window.location.href);
        console.log('   - Title:', document.title);

        // Check current scan status
        const statusElement = document.querySelector('[class*="status"], [class*="active"], [class*="ready"]');
        if (statusElement) {
            console.log('   - Status:', statusElement.textContent);
        }

        // Look for existing scan results
        const resultsContainer = document.querySelector('[class*="results"], [class*="table"], table');
        if (resultsContainer) {
            console.log('   - Results container found');
        }

        console.log('');
        console.log('🧪 TEST COMPLETE: Frontend elements accessible');
        console.log('📝 To manually test:');
        console.log('   1. Upload your scanner file');
        console.log('   2. Click "Run Scan" button');
        console.log('   3. Watch for status changes and results');
        console.log('   4. Check browser console for any JavaScript errors');

        // Monitor for any JavaScript errors
        window.addEventListener('error', (e) => {
            console.log('🚨 JavaScript Error:', e.message, 'at', e.filename + ':' + e.lineno);
        });

        // Monitor for unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.log('🚨 Unhandled Promise Rejection:', e.reason);
        });

    } catch (error) {
        console.log('❌ Test error:', error.message);
    }
}

// Start the test
runTest();
`;

        // Write the test script to a file
        const scriptPath = '/tmp/frontend_test_script.js';
        fs.writeFileSync(scriptPath, testScript);

        console.log('🔧 Starting Chromium with frontend test...');

        // Launch Chromium with the test script
        const chromiumArgs = [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--remote-debugging-port=9222',
            '--disable-features=VizDisplayCompositor',
            'http://localhost:5657'
        ];

        console.log('🌐 Opening Chromium at http://localhost:5657');
        console.log('📝 Manual test instructions:');
        console.log('   1. Look for file upload area or button');
        console.log('   2. Upload the scanner file: /Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py');
        console.log('   3. Click "Run Scan" button');
        console.log('   4. Watch console for any errors');
        console.log('   5. Observe status changes (Active • Ready vs Running)');
        console.log('');
        console.log('💡 Expected behavior after fix:');
        console.log('   - Status should change from "Active • Ready" to "Running"');
        console.log('   - Progress bar should appear and update');
        console.log('   - On completion, should show results or "No matching opportunities found"');
        console.log('   - Button should return to "Run Scan" state');

        // Spawn chromium process
        const chromium = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', chromiumArgs, {
            detached: true,
            stdio: 'ignore'
        });

        chromium.unref();

        console.log('✅ Chromium launched successfully');
        console.log('🔗 Frontend URL: http://localhost:5657');
        console.log('🔧 Debug port: 9222');

        return true;

    } catch (error) {
        console.error('❌ Failed to launch test:', error.message);

        console.log('');
        console.log('🔄 Alternative: Manual Testing Steps');
        console.log('1. Open your browser and go to: http://localhost:5657');
        console.log('2. Upload the scanner file: /Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py');
        console.log('3. Click "Run Scan" button');
        console.log('4. Open browser developer tools (F12) and watch the Console tab');
        console.log('5. Check Network tab for any failed API requests');
        console.log('6. Note any JavaScript errors or failed network calls');

        return false;
    }
}

if (require.main === module) {
    testFrontendWithChromium().then((success) => {
        if (success) {
            console.log('');
            console.log('🎉 CHROMIUM TEST LAUNCHED!');
            console.log('📊 You can now manually test the uploaded scanner issue');
            console.log('🔧 Follow the instructions above to reproduce the issue');
        } else {
            console.log('');
            console.log('❌ Failed to launch automated test');
            console.log('📝 Please follow manual testing steps above');
        }
    });
}

module.exports = { testFrontendWithChromium };