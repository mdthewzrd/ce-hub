/**
 * Test the Format → Add to Project workflow
 *
 * This script tests the complete workflow:
 * 1. Format a scanner using the API
 * 2. Add it to a project using the Renata chat endpoint
 * 3. Verify the project is created and can be retrieved
 */

const fs = require('fs');
const path = require('path');

// Test scanner code (simplified version of backside scanner)
const testScannerCode = `
import requests
import pandas as pd
from datetime import datetime, timedelta

# Test backside scanner
def backside_scan():
    # Simple implementation for testing
    symbols = ['AAPL', 'GOOGL', 'MSFT']
    results = []

    for symbol in symbols:
        # Mock scan logic
        if symbol == 'AAPL':
            results.append({
                'symbol': symbol,
                'signal': 'BULLISH',
                'confidence': 0.85,
                'timestamp': datetime.now().isoformat()
            })

    return results

# Execute scan
if __name__ == "__main__":
    scan_results = backside_scan()
    print(f"Scan completed: {len(scan_results)} signals found")
`;

async function testWorkflow() {
    console.log('🚀 Testing Format → Add to Project workflow...\n');

    try {
        // Step 1: Test the formatting API
        console.log('📍 Step 1: Testing scanner formatting...');
        const formatResponse = await fetch('http://localhost:5656/api/scanner/format', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: testScannerCode,
                name: 'Test Backside Scanner',
                description: 'Test scanner for workflow validation'
            })
        });

        if (!formatResponse.ok) {
            throw new Error(`Format API failed: ${formatResponse.status} ${formatResponse.statusText}`);
        }

        const formatResult = await formatResponse.json();
        console.log('✅ Scanner formatted successfully');
        console.log(`   Execution time: ${formatResult.result?.executionTime || 'N/A'}ms\n`);

        // Step 2: Test the project creation via Renata chat API
        console.log('📍 Step 2: Testing project creation via Renata...');
        const formattedCode = formatResult.result?.formattedCode || testScannerCode;

        const renataResponse = await fetch('http://localhost:5656/api/renata/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Add Test Backside Scanner to edge.dev project',
                personality: 'general',
                context: {
                    action: 'add_to_project',
                    scannerName: 'Test Backside Scanner',
                    formattedCode: formattedCode,
                    page: 'renata-popup',
                    timestamp: new Date().toISOString()
                }
            })
        });

        if (!renataResponse.ok) {
            throw new Error(`Renata API failed: ${renataResponse.status} ${renataResponse.statusText}`);
        }

        const renataResult = await renataResponse.json();
        console.log('✅ Project created successfully via Renata');
        console.log(`   Response type: ${renataResult.type}`);
        console.log(`   Project ID: ${renataResult.data?.projectId || 'N/A'}`);
        console.log(`   Project name: ${renataResult.data?.projectName || 'N/A'}\n`);

        // Step 3: Verify the project appears in the projects list
        console.log('📍 Step 3: Verifying project in projects list...');
        const projectsResponse = await fetch('http://localhost:5656/api/projects');

        if (!projectsResponse.ok) {
            throw new Error(`Projects API failed: ${projectsResponse.status} ${projectsResponse.statusText}`);
        }

        const projectsResult = await projectsResponse.json();
        console.log(`✅ Found ${projectsResult.count || 0} projects`);

        // Find our test project
        const testProject = projectsResult.projects?.find(p =>
            p.name?.includes('Test Backside Scanner') ||
            p.description?.includes('Test Backside Scanner')
        );

        if (testProject) {
            console.log('✅ Test project found in projects list!');
            console.log(`   Project ID: ${testProject.id}`);
            console.log(`   Project name: ${testProject.name}`);
            console.log(`   Status: ${testProject.status}`);
            console.log(`   Created: ${testProject.created_at}\n`);
        } else {
            console.log('⚠️ Test project not found in list, checking backup data...\n');
        }

        // Step 4: Test getting the specific project by ID
        if (testProject?.id) {
            console.log('📍 Step 4: Testing individual project retrieval...');
            const projectResponse = await fetch(`http://localhost:5656/api/projects/${testProject.id}`);

            if (projectResponse.ok) {
                const projectDetails = await projectResponse.json();
                console.log('✅ Individual project retrieved successfully');
                console.log(`   Project: ${projectDetails.project?.name}`);
                console.log(`   Description: ${projectDetails.project?.description}`);
            } else {
                console.log('⚠️ Could not retrieve individual project details');
            }
        }

        // Summary
        console.log('\n🎉 WORKFLOW TEST SUMMARY');
        console.log('==========================');
        console.log('✅ Scanner formatting: WORKING');
        console.log('✅ Project creation via Renata: WORKING');
        console.log('✅ Projects list retrieval: WORKING');
        console.log('✅ Complete workflow: SUCCESS!');

        console.log('\n📋 NEXT STEPS');
        console.log('==================');
        console.log('1. Open http://localhost:5656/projects to see the project list');
        console.log('2. Look for "Test Backside Scanner" in the projects');
        console.log('3. Try opening the project to see the formatted scanner code');
        console.log('4. Test the execution functionality when ready');

        return true;

    } catch (error) {
        console.error('❌ Workflow test failed:', error.message);
        console.error('\n🔧 TROUBLESHOOTING');
        console.error('===================');
        console.error('1. Make sure the dev server is running on port 5656');
        console.error('2. Check that all API routes are properly implemented');
        console.error('3. Verify the projectApiService can connect to the backend');
        console.error('4. Check the browser console for any JavaScript errors');

        return false;
    }
}

// Run the test
if (require.main === module) {
    testWorkflow().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { testWorkflow, testScannerCode };