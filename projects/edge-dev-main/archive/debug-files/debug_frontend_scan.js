#!/usr/bin/env node

/**
 * Debug Frontend Scan Issue
 * Test exactly what happens when the frontend calls the scan API
 */

const fs = require('fs');

async function debugFrontendScan() {
    console.log('🔍 DEBUGGING FRONTEND SCAN EXECUTION');
    console.log('=' * 60);

    try {
        // Test the exact scan request the frontend makes
        console.log('📊 Testing default LC scanner scan request...');

        const scanRequest = {
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
            chunk_size_days: undefined,
            max_concurrent_chunks: 2
        };

        console.log('🔧 Scan request:', JSON.stringify(scanRequest, null, 2));

        // Check backend health first
        console.log('\n🏥 Checking backend health...');
        const healthResponse = await fetch('http://localhost:8000/api/health');
        console.log(`Health check: ${healthResponse.status} ${healthResponse.ok ? '✅' : '❌'}`);

        if (!healthResponse.ok) {
            throw new Error('Backend health check failed');
        }

        // Execute the scan
        console.log('\n🚀 Executing scan...');
        const scanResponse = await fetch('http://localhost:8000/api/scan/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(scanRequest),
        });

        console.log(`📊 Scan response status: ${scanResponse.status}`);

        if (!scanResponse.ok) {
            throw new Error(`Scan failed: ${scanResponse.status} ${scanResponse.statusText}`);
        }

        const result = await scanResponse.json();
        console.log('\n📋 SCAN RESULT:');
        console.log(`   Success: ${result.success}`);
        console.log(`   Scan ID: ${result.scan_id}`);
        console.log(`   Message: ${result.message}`);
        console.log(`   Results count: ${result.results ? result.results.length : 0}`);
        console.log(`   Total found: ${result.total_found || 0}`);
        console.log(`   Execution time: ${result.execution_time || 0}s`);

        if (result.results && result.results.length > 0) {
            console.log('\n📊 SAMPLE RESULTS:');
            result.results.slice(0, 3).forEach((res, i) => {
                console.log(`   ${i + 1}. ${res.symbol || res.ticker}: ${res.date}`);
            });
        } else {
            console.log('\n⚠️ NO RESULTS FOUND');
            console.log('This might be why the frontend shows "Active • Ready" - the scan completes but with 0 results');
        }

        // Test the scan status endpoint if scan_id is available
        if (result.scan_id) {
            console.log('\n🔍 Checking scan status...');
            const statusResponse = await fetch(`http://localhost:8000/api/scan/status/${result.scan_id}`);

            if (statusResponse.ok) {
                const status = await statusResponse.json();
                console.log(`   Status: ${status.status}`);
                console.log(`   Progress: ${status.progress_percent}%`);
                console.log(`   Message: ${status.message}`);
                console.log(`   Results: ${status.results ? status.results.length : 0}`);
            }
        }

        console.log('\n🎯 DIAGNOSIS:');
        if (result.success && (!result.results || result.results.length === 0)) {
            console.log('❌ ISSUE: Scan completes successfully but returns 0 results');
            console.log('🔧 SOLUTION: Frontend needs to handle 0-result case properly');
            console.log('   - Show scan completion message even with 0 results');
            console.log('   - Don\'t treat 0 results as failure');
            console.log('   - Update UI to show "Scan Complete: 0 results found"');
        } else if (!result.success) {
            console.log('❌ ISSUE: Backend scan execution failed');
            console.log('🔧 SOLUTION: Check backend scan logic');
        } else {
            console.log('✅ SUCCESS: Scan working properly with results');
        }

        return result;

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        console.log('\n🔧 TROUBLESHOOTING:');
        console.log('1. Check if backend is running on port 8000');
        console.log('2. Check if frontend can connect to backend');
        console.log('3. Verify scan request format matches backend expectations');
        return null;
    }
}

// Import fetch for Node.js
const { fetch } = require('undici');

if (require.main === module) {
    debugFrontendScan().then(() => {
        console.log('\n✅ Debug complete');
    });
}

module.exports = { debugFrontendScan };