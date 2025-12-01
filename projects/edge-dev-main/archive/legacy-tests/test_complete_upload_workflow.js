#!/usr/bin/env node

/**
 * Complete Upload Scanner Workflow Test
 * Simulates the exact frontend behavior when uploading scanner and clicking "Run Scan"
 */

const fs = require('fs');
const { fetch } = require('undici');

async function testCompleteUploadWorkflow() {
    console.log('🧪 TESTING COMPLETE UPLOAD SCANNER WORKFLOW');
    console.log('=' * 70);

    try {
        // Step 1: Load the scanner file (simulates file upload)
        const scannerPath = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py';

        if (!fs.existsSync(scannerPath)) {
            console.log('❌ Scanner file not found:', scannerPath);
            return false;
        }

        const scannerCode = fs.readFileSync(scannerPath, 'utf8');
        console.log(`✅ STEP 1: Scanner file loaded (${scannerCode.length} characters)`);

        // Step 2: Format the uploaded code (what happens when user uploads)
        console.log('\n🔧 STEP 2: Formatting uploaded scanner code...');

        const formatResponse = await fetch('http://localhost:8000/api/format/code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: scannerCode }),
        });

        if (!formatResponse.ok) {
            console.log('❌ Format request failed:', formatResponse.status, formatResponse.statusText);
            const errorText = await formatResponse.text();
            console.log('Error details:', errorText);
            return false;
        }

        const formatResult = await formatResponse.json();
        console.log('✅ Code formatting successful:');
        console.log(`   - Scanner type: ${formatResult.scanner_type}`);
        console.log(`   - Integrity: ${formatResult.integrity_verified}`);
        console.log(`   - Parameters: ${Object.keys(formatResult.metadata?.parameters || {}).length}`);

        // Step 3: Execute the scan (what happens when "Run Scan" is clicked)
        console.log('\n🚀 STEP 3: Executing uploaded scanner (Run Scan clicked)...');

        const scanRequest = {
            start_date: "2025-10-06",
            end_date: "2025-11-05",
            use_real_scan: true,
            scanner_type: "uploaded",
            uploaded_code: formatResult.formatted_code || scannerCode
        };

        console.log('📊 Scan request details:');
        console.log(`   - Date range: ${scanRequest.start_date} to ${scanRequest.end_date}`);
        console.log(`   - Scanner type: ${scanRequest.scanner_type}`);
        console.log(`   - Code length: ${scanRequest.uploaded_code.length} characters`);

        const scanStartTime = Date.now();
        const scanResponse = await fetch('http://localhost:8000/api/scan/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(scanRequest),
        });

        if (!scanResponse.ok) {
            console.log('❌ Scan execution failed:', scanResponse.status, scanResponse.statusText);
            const errorText = await scanResponse.text();
            console.log('Error details:', errorText);
            return false;
        }

        const scanResult = await scanResponse.json();
        console.log('✅ Scan request accepted by backend:');
        console.log(`   - Success: ${scanResult.success}`);
        console.log(`   - Scan ID: ${scanResult.scan_id}`);
        console.log(`   - Message: ${scanResult.message}`);

        // Step 4: Monitor scan progress (what frontend polling does)
        console.log('\n📊 STEP 4: Monitoring scan progress...');

        if (!scanResult.scan_id) {
            console.log('❌ No scan ID returned - cannot monitor progress');
            return false;
        }

        let attempts = 0;
        const maxAttempts = 30; // 1 minute timeout
        let lastStatus = null;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            attempts++;

            console.log(`   📡 Polling attempt ${attempts}/${maxAttempts}...`);

            const statusResponse = await fetch(`http://localhost:8000/api/scan/status/${scanResult.scan_id}`);

            if (!statusResponse.ok) {
                console.log(`   ⚠️ Status check failed: ${statusResponse.status}`);
                continue;
            }

            const status = await statusResponse.json();

            // Only log if status changed
            if (JSON.stringify(status) !== JSON.stringify(lastStatus)) {
                console.log(`   📊 Status: ${status.status} | Progress: ${status.progress_percent}% | Message: ${status.message}`);

                if (status.results && status.results.length > 0) {
                    console.log(`   📋 Results: ${status.results.length} found`);
                }

                lastStatus = status;
            }

            // Check for completion
            if (status.status === 'completed') {
                const scanEndTime = Date.now();
                const totalTime = (scanEndTime - scanStartTime) / 1000;

                console.log('\n🎯 STEP 5: SCAN COMPLETED SUCCESSFULLY!');
                console.log(`   ⏱️ Total time: ${totalTime.toFixed(1)}s`);
                console.log(`   📊 Results: ${status.results?.length || 0}`);
                console.log(`   📈 Progress: ${status.progress_percent}%`);
                console.log(`   💬 Final message: ${status.message}`);

                // Test what frontend would do with results
                console.log('\n🎨 STEP 6: Frontend UI state simulation...');

                const results = status.results || [];
                if (results.length > 0) {
                    console.log(`✅ setScanMessage("LC scan completed: ${results.length} results found")`);
                    console.log('✅ setScanResults(formattedResults)');
                    console.log(`✅ setScanTotalFound(${results.length})`);

                    // Show a few sample results
                    console.log('\n📋 Sample results:');
                    results.slice(0, 3).forEach((result, index) => {
                        console.log(`   ${index + 1}. ${result.symbol || result.ticker || 'N/A'}: ${result.date || 'N/A'}`);
                    });
                } else {
                    console.log('✅ setScanMessage("LC scan completed: No matching opportunities found")');
                    console.log('✅ setScanResults([])');
                    console.log('✅ setScanTotalFound(0)');
                }

                console.log('✅ setScanProgress(100)');
                console.log('✅ setIsExecuting(false)');
                console.log('✅ UI should show "Run Scan" button again');

                return true;
            }

            // Check for failure
            if (status.status === 'failed' || status.status === 'error') {
                console.log('\n❌ SCAN FAILED:');
                console.log(`   📊 Status: ${status.status}`);
                console.log(`   💬 Message: ${status.message}`);
                console.log(`   🔍 Error: ${status.error || 'No error details'}`);

                console.log('\n🎨 Frontend would show:');
                console.log(`❌ setScanMessage("Scan failed: ${status.message}")`);
                console.log('❌ setIsExecuting(false)');
                console.log('❌ UI should show "Run Scan" button again');

                return false;
            }
        }

        console.log('\n⏰ SCAN TIMEOUT:');
        console.log(`   ⚠️ Scan did not complete within ${maxAttempts * 2} seconds`);
        console.log('   🔍 This might indicate a backend processing issue');

        return false;

    } catch (error) {
        console.error('\n❌ WORKFLOW TEST FAILED:', error.message);
        console.log('\n🔧 TROUBLESHOOTING CHECKLIST:');
        console.log('1. ✅ Backend running on port 8000?', '- Check uvicorn process');
        console.log('2. ✅ Frontend running on port 5657?', '- Check npm dev process');
        console.log('3. ✅ Scanner file exists?', '- Check file path');
        console.log('4. ✅ Network connectivity?', '- Check fetch requests');
        console.log('5. ✅ CORS settings?', '- Check API headers');

        return false;
    }
}

async function compareBehaviorTypes() {
    console.log('\n🔍 COMPARING DIFFERENT SCAN BEHAVIORS');
    console.log('=' * 60);

    try {
        // Test 1: Default LC scanner
        console.log('\n1️⃣ TESTING DEFAULT LC SCANNER:');
        const defaultScanRequest = {
            start_date: "2025-10-06",
            end_date: "2025-11-05",
            use_real_scan: true,
            filters: {
                lc_frontside_d2_extended: true,
                lc_frontside_d3_extended_1: true,
                min_gap: 0.5,
                min_pm_vol: 5000000,
                min_prev_close: 0.75
            },
            max_concurrent_chunks: 2
        };

        const defaultResponse = await fetch('http://localhost:8000/api/scan/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(defaultScanRequest),
        });

        if (defaultResponse.ok) {
            const defaultResult = await defaultResponse.json();
            console.log(`   ✅ Default scanner: Success=${defaultResult.success}, Results=${defaultResult.results?.length || 0}`);
        } else {
            console.log(`   ❌ Default scanner failed: ${defaultResponse.status}`);
        }

        // Test 2: Uploaded scanner
        console.log('\n2️⃣ TESTING UPLOADED SCANNER:');
        const scannerCode = fs.readFileSync('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py', 'utf8');

        const uploadedScanRequest = {
            start_date: "2025-10-06",
            end_date: "2025-11-05",
            use_real_scan: true,
            scanner_type: "uploaded",
            uploaded_code: scannerCode
        };

        const uploadedResponse = await fetch('http://localhost:8000/api/scan/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(uploadedScanRequest),
        });

        if (uploadedResponse.ok) {
            const uploadedResult = await uploadedResponse.json();
            console.log(`   ✅ Uploaded scanner: Success=${uploadedResult.success}, Results=${uploadedResult.results?.length || 0}`);
        } else {
            console.log(`   ❌ Uploaded scanner failed: ${uploadedResponse.status}`);
        }

        console.log('\n📊 BEHAVIOR COMPARISON COMPLETE');

    } catch (error) {
        console.log('❌ Comparison failed:', error.message);
    }
}

if (require.main === module) {
    testCompleteUploadWorkflow().then(async (success) => {
        if (success) {
            console.log('\n🎉 COMPLETE WORKFLOW TEST PASSED!');
            console.log('✅ The uploaded scanner execution workflow is working correctly');
            console.log('✅ Frontend should properly handle the scan results');
        } else {
            console.log('\n❌ WORKFLOW TEST FAILED');
            console.log('🔍 This explains why the "Run Scan" button issue occurs');
        }

        // Run comparison test
        await compareBehaviorTypes();

        console.log('\n📋 SUMMARY FOR USER:');
        console.log('🌐 Frontend: http://localhost:5657 (Chromium should be open)');
        console.log('📁 Upload file: /Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py');
        console.log('🖱️ Click "Run Scan" and watch for status changes');
        console.log('🔧 Check browser console (F12) for any JavaScript errors');
        console.log('📊 Expected: Status changes from "Active • Ready" → "Running" → Results');
    });
}

module.exports = { testCompleteUploadWorkflow };