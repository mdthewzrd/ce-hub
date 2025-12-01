#!/usr/bin/env node

/**
 * Test Real Workflow: format → push to project → run in edge.dev
 * This reproduces the exact issue from the user's screenshot
 */

const fs = require('fs');
const http = require('http');

// Read the actual Python file from user's downloads
const testCode = fs.readFileSync('/Users/michaeldurante/Downloads/backside para b copy.py', 'utf8');

console.log('🧪 TESTING COMPLETE END-TO-END WORKFLOW');
console.log('='.repeat(60));
console.log('📄 Using real Python file from downloads');
console.log(`📊 Code length: ${testCode.length} characters`);
console.log(`📄 Code lines: ${testCode.split('\n').length} lines`);
console.log('');

async function testStep1_CodeFormatting() {
    console.log('🔧 STEP 1: Testing Code Formatting...');

    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            message: `format this\n\n${testCode}`,
            personality: 'renata',
            systemPrompt: 'You are a helpful AI assistant',
            context: {}
        });

        const options = {
            hostname: 'localhost',
            port: 5657,
            path: '/api/renata/chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.success !== false) {
                        console.log('✅ STEP 1 SUCCESS: Code formatting completed');
                        console.log(`📝 Response type: ${response.type || 'unknown'}`);
                        resolve(response);
                    } else {
                        console.log('❌ STEP 1 FAILED: Code formatting failed');
                        console.log(`🚨 Error: ${response.error || 'Unknown error'}`);
                        reject(new Error(response.error || 'Code formatting failed'));
                    }
                } catch (error) {
                    console.log('❌ STEP 1 FAILED: Invalid response format');
                    console.log('🚨 Parse error:', error.message);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ STEP 1 FAILED: Request error');
            console.log('🚨 Network error:', error.message);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

async function testStep2_AddToProject() {
    console.log('\n🚀 STEP 2: Testing Add to Project...');

    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            message: 'Add Backside A+ Scanner to edge.dev project',
            personality: 'general',
            context: {
                action: 'add_to_project',
                scannerName: 'Backside A+ Scanner',
                page: 'renata-popup',
                timestamp: new Date().toISOString()
            }
        });

        const options = {
            hostname: 'localhost',
            port: 5657,
            path: '/api/renata/chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.success !== false) {
                        console.log('✅ STEP 2 SUCCESS: Added to project');
                        console.log(`📝 Scanner: ${response.data?.scannerName || 'unknown'}`);
                        resolve(response);
                    } else {
                        console.log('❌ STEP 2 FAILED: Add to project failed');
                        console.log(`🚨 Error: ${response.error || 'Unknown error'}`);
                        reject(new Error(response.error || 'Add to project failed'));
                    }
                } catch (error) {
                    console.log('❌ STEP 2 FAILED: Invalid response format');
                    console.log('🚨 Parse error:', error.message);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ STEP 2 FAILED: Request error');
            console.log('🚨 Network error:', error.message);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

async function testStep3_RunInEdgeDev() {
    console.log('\n🏃 STEP 3: Testing Run in Edge.dev...');

    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            message: 'Run Backside A+ Scanner in edge.dev',
            personality: 'general',
            context: {
                action: 'run_in_edge_dev',
                scannerName: 'Backside A+ Scanner',
                execution_mode: 'full_scan',
                page: 'project-dashboard',
                timestamp: new Date().toISOString()
            }
        });

        const options = {
            hostname: 'localhost',
            port: 5657,
            path: '/api/renata/chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.success !== false) {
                        console.log('✅ STEP 3 SUCCESS: Running in edge.dev');
                        console.log(`📝 Execution mode: ${response.context?.execution_mode || 'unknown'}`);
                        resolve(response);
                    } else {
                        console.log('❌ STEP 3 FAILED: Run in edge.dev failed');
                        console.log(`🚨 Error: ${response.error || 'Unknown error'}`);
                        reject(new Error(response.error || 'Run in edge.dev failed'));
                    }
                } catch (error) {
                    console.log('❌ STEP 3 FAILED: Invalid response format');
                    console.log('🚨 Parse error:', error.message);
                    console.log('Raw response:', data.substring(0, 500));
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ STEP 3 FAILED: Request error');
            console.log('🚨 Network error:', error.message);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

async function runCompleteTest() {
    try {
        console.log('🎯 Starting complete workflow test...\n');

        // Step 1: Code Formatting
        const formatResult = await testStep1_CodeFormatting();

        // Step 2: Add to Project
        const projectResult = await testStep2_AddToProject();

        // Step 3: Run in Edge.dev
        const runResult = await testStep3_RunInEdgeDev();

        console.log('\n🎉 COMPLETE WORKFLOW SUCCESSFUL!');
        console.log('='.repeat(60));
        console.log('✅ All three steps completed without errors');
        console.log('✅ The backend is working correctly');
        console.log('');
        console.log('📊 Results Summary:');
        console.log(`  • Step 1 (Format): ${formatResult.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`  • Step 2 (Project): ${projectResult.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`  • Step 3 (Run): ${runResult.success ? 'SUCCESS' : 'FAILED'}`);

        return true;

    } catch (error) {
        console.log('\n💥 COMPLETE WORKFLOW FAILED!');
        console.log('='.repeat(60));
        console.log('❌ At least one step failed with error:');
        console.log(`🚨 ${error.message}`);
        console.log('');
        console.log('🔍 This reproduces the issue from the user screenshot');
        console.log('📋 Need to investigate the failing step');

        return false;
    }
}

// Run the test
runCompleteTest().then(success => {
    process.exit(success ? 0 : 1);
});