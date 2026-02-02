#!/usr/bin/env node

/**
 * DEBUG COMPLETE WORKFLOW - Add to Project Button
 *
 * This simulates the complete user workflow to identify where the issue occurs
 */

const http = require('http');

console.log('🔍 DEBUGGING COMPLETE Add to Project Workflow');
console.log('='.repeat(60));

// Step 1: Check if the frontend and backend are accessible
async function checkServers() {
    console.log('\n1️⃣ Checking Server Status...');

    const results = {
        frontend: false,
        backend: false,
        scanPage: false
    };

    try {
        // Check frontend on 5665
        const frontendRes = await fetch('http://localhost:5665/scan');
        if (frontendRes.ok) {
            results.frontend = true;
            results.scanPage = true;
            console.log('✅ Frontend (5665/scan): Accessible');
        }
    } catch (error) {
        console.log('❌ Frontend (5665/scan):', error.message);
    }

    try {
        // Check backend on 5666
        const backendRes = await fetch('http://localhost:5666/api/health');
        if (backendRes.ok) {
            results.backend = true;
            console.log('✅ Backend (5666): Accessible');
        }
    } catch (error) {
        console.log('❌ Backend (5666):', error.message);
    }

    try {
        // Check frontend API endpoints
        const apiRes = await fetch('http://localhost:5665/api/projects');
        if (apiRes.ok) {
            const data = await apiRes.json();
            console.log('✅ Frontend API (5665/api/projects): Working');
            console.log(`   📊 Existing projects: ${data.data?.length || 0}`);
        }
    } catch (error) {
        console.log('❌ Frontend API (5665/api/projects):', error.message);
    }

    return results;
}

// Step 2: Test formatting a scanner
async function testScannerFormatting() {
    console.log('\n2️⃣ Testing Scanner Formatting...');

    const testScanner = `#!/usr/bin/env python3
"""
TEST BACKSIDE B SCANNER FOR RENATA
"""
P = {
    "price_min": 1.50,
    "adv20_min_usd": 2000000,
    "atr_mult": 2.2,
    "vol_mult": 1.1
}

def main():
    print("Scanner test")`;

    try {
        const formatRes = await fetch('http://localhost:5665/api/format-exact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: testScanner,
                filename: 'test_scanner.py',
                useEnhancedService: true,
                validateOutput: true
            })
        });

        if (formatRes.ok) {
            const data = await formatRes.json();
            console.log('✅ Scanner formatting successful!');
            console.log(`   📊 Type: ${data.type}`);
            console.log(`   🔍 Actions: ${data.actions?.addToProject ? 'Add to Project available' : 'No actions'}`);
            console.log(`   📄 Has formattedCode: ${!!data.formattedCode}`);

            return data;
        } else {
            const errorText = await formatRes.text();
            console.log('❌ Scanner formatting failed:', formatRes.status, errorText);
            return null;
        }
    } catch (error) {
        console.log('❌ Error testing formatting:', error.message);
        return null;
    }
}

// Step 3: Test the complete user workflow
async function testCompleteWorkflow() {
    console.log('\n🚀 Testing Complete User Workflow...');

    // Check servers
    const serverStatus = await checkServers();

    if (!serverStatus.frontend || !serverStatus.backend) {
        console.log('❌ Cannot proceed - servers not accessible');
        return;
    }

    // Test formatting
    const formattingResult = await testScannerFormatting();

    if (!formattingResult) {
        console.log('❌ Cannot proceed - formatting failed');
        return;
    }

    console.log('\n📋 WORKFLOW SUMMARY:');
    console.log('='.repeat(40));
    console.log(`1. Frontend Access: ${serverStatus.frontend ? '✅' : '❌'}`);
    console.log(`2. Backend Access: ${serverStatus.backend ? '✅' : '❌'}`);
    console.log(`3. API Endpoints: ${serverStatus.frontend ? '✅' : '❌'}`);
    console.log(`4. Scanner Formatting: ${formattingResult ? '✅' : '❌'}`);
    console.log(`5. Add to Project Available: ${formattingResult?.actions?.addToProject ? '✅' : '❌'}`);

    if (formattingResult?.actions?.addToProject) {
        console.log('\n✅ COMPLETE WORKFLOW WORKING!');
        console.log('\n💡 NEXT STEPS:');
        console.log('1. Go to http://localhost:5665/scan');
        console.log('2. Click "Upload Scanner" and upload your backside_b scanner');
        console.log('3. Wait for Renata to format it');
        console.log('4. Click "Add to Project" when button appears');
        console.log('\n🔧 If it still fails:');
        console.log('- Check browser console for JavaScript errors');
        console.log('- Check network tab for failed requests');
        console.log('- Make sure formatted code is properly preserved');
    } else {
        console.log('\n❌ WORKFLOW BROKEN - Add to Project not available after formatting');
    }
}

// Step 4: Create browser debugging instructions
function showBrowserDebugInstructions() {
    console.log('\n🌐 BROWSER DEBUGGING INSTRUCTIONS:');
    console.log('='.repeat(50));
    console.log('1. Open Chrome DevTools (F12)');
    console.log('2. Go to Console tab');
    console.log('3. Clear console');
    console.log('4. Go to http://localhost:5665/scan');
    console.log('5. Click "Upload Scanner" and upload a scanner');
    console.log('6. Watch for these console logs:');
    console.log('   - "🚀 Enhanced AI Formatting Service"');
    console.log('   - "✅ Enhanced formatting completed successfully"');
    console.log('   - Any error messages');
    console.log('7. When "Add to Project" appears, click it and watch for:');
    console.log('   - Network request to /api/projects');
    console.log('   - "🔄 Adding scanner to project..."');
    console.log('   - Success or error messages');
    console.log('8. Go to Network tab and filter by "projects"');
    console.log('   - Check if POST request to /api/projects appears');
    console.log('   - Check request payload and response');

    console.log('\n🐛 COMMON ISSUES:');
    console.log('- CORS errors (mixed content warnings)');
    console.log('- Network timeouts');
    console.log('- API response format mismatches');
    console.log('- JavaScript errors in browser console');
}

// Run the complete test
async function runDebug() {
    await testCompleteWorkflow();
    showBrowserDebugInstructions();
}

runDebug().catch(console.error);