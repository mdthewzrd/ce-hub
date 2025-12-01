#!/usr/bin/env node

/**
 * Test OpenRouter API formatting with the new model
 */

const { glmCodeFormatter } = require('./src/utils/glmCodeFormatter.ts');

const testCode = `
def scan_symbol(ticker, from_date, to_date):
    # Simple test scanner
    print(f"Scanning {ticker} from {from_date} to {to_date}")
    gap_percent = 5.0
    volume_ratio = 2.0
    return {
        'ticker': ticker,
        'gap_percent': gap_percent,
        'volume_ratio': volume_ratio,
        'signal': 'BUY'
    }
`;

async function testFormatting() {
    console.log('🧪 Testing OpenRouter API formatting with new model...\n');

    try {
        console.log('📊 Test code length:', testCode.length, 'characters');
        console.log('📄 Test code lines:', testCode.split('\n').length, 'lines');

        const result = await glmCodeFormatter.formatCode(testCode, {
            scannerType: 'custom',
            maxTokens: 1000,
            temperature: 0.1
        });

        console.log('\n✅ SUCCESS! OpenRouter API working with new model');
        console.log('📊 Results:');
        console.log('  - Success:', result.success);
        console.log('  - Scanner Type:', result.scannerType);
        console.log('  - Integrity Verified:', result.integrityVerified);
        console.log('  - Processing Time:', result.metadata.processingTime);
        console.log('  - Model Used:', result.metadata.model);
        console.log('  - Original Lines:', result.metadata.originalLines);
        console.log('  - Formatted Lines:', result.metadata.formattedLines);
        console.log('  - Parameters Preserved:', result.metadata.parameterCount);

        if (result.optimizations.length > 0) {
            console.log('  - Optimizations:', result.optimizations.join(', '));
        }

        if (result.warnings.length > 0) {
            console.log('  - Warnings:', result.warnings.join(', '));
        }

        if (result.errors.length > 0) {
            console.log('  - Errors:', result.errors.join(', '));
        }

        console.log('\n📝 Formatted Code Preview:');
        console.log('─'.repeat(50));
        console.log(result.formattedCode.substring(0, 500) + (result.formattedCode.length > 500 ? '...' : ''));
        console.log('─'.repeat(50));

        return true;

    } catch (error) {
        console.error('\n❌ FAILED! OpenRouter API error:');
        console.error('Error:', error.message);
        if (error.message.includes('model')) {
            console.error('💡 This appears to be a model name issue');
        } else if (error.message.includes('API')) {
            console.error('💡 This appears to be an API connectivity issue');
        } else if (error.message.includes('key')) {
            console.error('💡 This appears to be an API key issue');
        }
        return false;
    }
}

testFormatting().then(success => {
    process.exit(success ? 0 : 1);
});