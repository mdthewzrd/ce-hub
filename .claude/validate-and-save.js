#!/usr/bin/env node

/**
 * CE-Hub Validate and Save - THE ONLY VALIDATION COMMAND
 *
 * This is the single command that ALL Claude agents MUST use.
 * It validates changes AND saves results automatically.
 * No thinking required - just run it.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function main() {
    console.log('🔍 CE-HUB VALIDATION - This is required for all changes');

    try {
        // Run the validation
        console.log('⏳ Running validation (30 seconds)...');
        const result = execSync(
            'cd "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main" && npm run test:quick',
            { encoding: 'utf8', timeout: 45000 }
        );

        // Parse results
        const passed = result.includes('passed') && !result.includes('failed');
        const testCount = (result.match(/\d+ passed/g) || ['0'])[0];
        const totalTests = (result.match(/\d+ failed/g) || ['0'])[0];

        // Save validation status
        const status = {
            timestamp: new Date().toISOString(),
            status: passed ? 'PASSED' : 'FAILED',
            confidence: passed ? 85 : 45,
            tests: `${testCount}/${parseInt(testCount) + parseInt(totalTests)}`,
            details: passed ? 'All critical tests passed' : 'Some tests failed - review needed'
        };

        fs.writeFileSync(
            '/Users/michaeldurante/ai dev/ce-hub/.last-validation.json',
            JSON.stringify(status, null, 2)
        );

        console.log('\n' + '='.repeat(50));
        console.log(`✅ Validation ${status.status} (${status.confidence}% confidence)`);
        console.log(`Tests: ${status.tests}`);
        console.log(`Status: ${status.details}`);
        console.log('='.repeat(50));

        // Return the status for Claude to use
        console.log('\n📋 CLAUDE RESPONSE:');
        if (passed) {
            console.log('✅ **Validation Results: PASSED** (85% confidence)');
            console.log('- Changes validated successfully');
            console.log('- Ready for production use');
        } else {
            console.log('⚠️ **Validation Results: NEEDS ATTENTION** (45% confidence)');
            console.log('- Some tests failed - review above output');
            console.log('- Fix issues before considering complete');
        }

        process.exit(passed ? 0 : 1);

    } catch (error) {
        const status = {
            timestamp: new Date().toISOString(),
            status: 'ERROR',
            confidence: 0,
            tests: '0/0',
            details: error.message
        };

        fs.writeFileSync(
            '/Users/michaeldurante/ai dev/ce-hub/.last-validation.json',
            JSON.stringify(status, null, 2)
        );

        console.log('\n❌ VALIDATION ERROR');
        console.log('Error:', error.message);
        console.log('\n📋 CLAUDE RESPONSE:');
        console.log('❌ **Validation Results: ERROR**');
        console.log('- Could not complete validation');
        console.log('- Check development server status');

        process.exit(1);
    }
}

main();