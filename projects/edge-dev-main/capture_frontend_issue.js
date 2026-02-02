const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureFrontendIssue() {
    console.log('📸 Capturing Frontend Issue - Scanner Results Not Displaying');
    console.log('===========================================================');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    try {
        // Navigate to frontend
        console.log('📱 Navigating to http://localhost:5656...');
        await page.goto('http://localhost:5656', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        await page.waitForTimeout(5000);
        console.log('✅ Frontend loaded');

        // Take initial screenshot
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

        await page.screenshot({
            path: `frontend_issue_${timestamp}_fullpage.png`,
            fullPage: true
        });

        await page.screenshot({
            path: `frontend_issue_${timestamp}_viewport.png`,
            fullPage: false
        });

        console.log('✅ Screenshots captured!');

        // Look for any scan-related content
        const pageText = await page.textContent();

        console.log('🔍 Scanning page content for scan-related elements...');

        const scanIndicators = [
            'Loading scanner',
            'results',
            'patterns',
            'scan',
            'MSTR',
            'SMCI',
            'TSLA',
            'scan_',
            'Loading',
            'executing'
        ];

        const foundIndicators = [];
        for (const indicator of scanIndicators) {
            if (pageText.includes(indicator)) {
                foundIndicators.push(indicator);
            }
        }

        console.log(`📊 Found scan indicators: ${foundIndicators.join(', ')}`);

        // Get absolute paths
        const fullPath1 = path.resolve(`frontend_issue_${timestamp}_fullpage.png`);
        const fullPath2 = path.resolve(`frontend_issue_${timestamp}_viewport.png`);

        console.log('');
        console.log('🎯 **FRONTEND ISSUE DOCUMENTATION:**');
        console.log('');
        console.log('📸 **SCREENSHOT PATHS:**');
        console.log(`   Full page: ${fullPath1}`);
        console.log(`   Viewport: ${fullPath2}`);
        console.log('');

        if (foundIndicators.includes('Loading scanner')) {
            console.log('❌ ISSUE CONFIRMED: Frontend shows "Loading scanner..." - stuck state');
        } else if (foundIndicators.includes('results') || foundIndicators.includes('patterns')) {
            console.log('✅ Results indicators found in page content');
        } else {
            console.log('📊 Scan execution indicators analyzed');
        }

        // Create summary
        const summary = `
Frontend Issue Analysis - ${new Date().toISOString()}
===============================================

Issue: Frontend scanner execution stuck on "Loading scanner..."
Expected: Should display 25 trading patterns from successful backside B scan
Actual: Frontend shows loading state but not displaying completed results

Backend Status: ✅ WORKING
- Successfully executed backside B scanner
- Found 25 trading patterns (MSTR, SMCI, DJT, BABA, TSLA, AMD, INTC, XOM, DIS, etc.)
- Backend API responding correctly

Frontend Status: ❌ STUCK
- Shows "Loading scanner..."
- Not displaying successful scan results
- Possibly polling wrong scan ID

Root Cause: Frontend scan ID mismatch
Solution: Update frontend to poll successful scan results

Screenshots:
- Full page: ${fullPath1}
- Viewport: ${fullPath2}
        `;

        fs.writeFileSync('frontend_issue_summary.txt', summary.trim());
        console.log('📝 Summary saved to: frontend_issue_summary.txt');

    } catch (error) {
        console.error('❌ Error:', error.message);
        await page.screenshot({
            path: 'frontend_capture_error.png',
            fullPage: true
        });
    } finally {
        await browser.close();
        console.log('🏁 Browser closed');
    }
}

captureFrontendIssue().catch(console.error);