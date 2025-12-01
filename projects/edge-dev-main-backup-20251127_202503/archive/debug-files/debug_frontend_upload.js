// Test the exact frontend upload API calls
// Run this in the browser console on localhost:5657

async function testFrontendUpload() {
    console.log('🧪 Testing Frontend Upload APIs');

    // Load the LC D2 scanner code (you'll need to paste this)
    const lc_d2_code = `// PASTE YOUR LC D2 SCANNER CODE HERE`;

    if (lc_d2_code.length < 100) {
        console.error('❌ Please paste your LC D2 scanner code in the lc_d2_code variable');
        return;
    }

    console.log(`📄 Code length: ${lc_d2_code.length} characters`);

    // Test 1: Frontend parameter extraction call
    console.log('\n🔍 Test 1: Parameter extraction (what frontend should call)');

    try {
        const formatResponse = await fetch('http://localhost:8000/api/format/code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: lc_d2_code })
        });

        console.log(`Format API Status: ${formatResponse.status}`);

        if (formatResponse.ok) {
            const formatData = await formatResponse.json();
            console.log('✅ Format API Success');
            console.log(`Parameters: ${formatData.metadata?.ai_extraction?.total_parameters || 0}`);
            console.log(`Trading filters: ${formatData.metadata?.ai_extraction?.trading_filters || 0}`);
            console.log(`Warnings: ${formatData.warnings?.length || 0}`);

            // Check if this data structure matches what frontend expects
            console.log('\n📊 Data structure check:');
            console.log('metadata exists:', !!formatData.metadata);
            console.log('ai_extraction exists:', !!formatData.metadata?.ai_extraction);
            console.log('intelligent_parameters exists:', !!formatData.metadata?.intelligent_parameters);
            console.log('old parameters exists:', !!formatData.metadata?.parameters);

        } else {
            console.error('❌ Format API failed:', await formatResponse.text());
        }
    } catch (error) {
        console.error('❌ Format API error:', error);
    }

    // Test 2: Frontend scan execution call
    console.log('\n🚀 Test 2: Scan execution (what happens on run button)');

    try {
        const scanRequest = {
            scanner_type: 'uploaded',
            uploaded_code: lc_d2_code,
            start_date: '2025-10-01',
            end_date: '2025-11-01',
            use_real_scan: true,
            filters: { scan_type: 'uploaded_scanner' }
        };

        console.log('Scan request size:', JSON.stringify(scanRequest).length, 'bytes');

        const scanResponse = await fetch('http://localhost:8000/api/scan/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scanRequest)
        });

        console.log(`Scan API Status: ${scanResponse.status}`);

        if (scanResponse.ok) {
            const scanData = await scanResponse.json();
            console.log('✅ Scan API Success');
            console.log(`Scan ID: ${scanData.scan_id}`);
            console.log(`Message: ${scanData.message}`);
        } else {
            console.error('❌ Scan API failed:', await scanResponse.text());
        }
    } catch (error) {
        console.error('❌ Scan API error:', error);
    }

    console.log('\n🏁 Frontend API test complete');
}

// Instructions for user
console.log('📋 INSTRUCTIONS:');
console.log('1. Open browser dev tools on localhost:5657');
console.log('2. Edit the lc_d2_code variable above with your scanner code');
console.log('3. Run: testFrontendUpload()');

// Export for easy access
window.testFrontendUpload = testFrontendUpload;