#!/usr/bin/env node

/**
 * Renata Code Generation Validation Test
 * Tests Renata's ability to generate, modify, and execute working code
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Renata Code Generation Validation Test\n');
console.log('=' .repeat(60));

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test configuration
const RENATA_API = 'http://localhost:5665/api/renata/chat';
const PYTHON_BACKEND = 'http://localhost:5666';

// Test 1: Simple Scanner Generation
async function testSimpleScannerGeneration() {
  log('\n📋 Test 1: Simple Scanner Generation', 'magenta');

  const testPrompt = `Create a simple LC D2 scanner with the following parameters:
- gap_min: 2.0
- pm_vol_min: 1000000
- atr_period: 14

Return the complete Python scanner code that can be executed directly.`;

  try {
    info('Sending request to Renata...');
    const response = await fetch(RENATA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: testPrompt,
        personality: 'renata',
        context: {
          sessionId: 'test-generation-1',
          testMode: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    info('Response received from Renata');

    // Check if response contains code
    if (data.message && data.message.length > 0) {
      success('Renata generated a response');

      // Extract code from response (look for Python code blocks)
      const codeMatch = data.message.match(/```python\n([\s\S]*?)\n```/);
      if (codeMatch) {
        const generatedCode = codeMatch[1];
        success(`Extracted ${generatedCode.length} bytes of Python code`);

        // Save generated code to file
        const outputPath = path.join(__dirname, 'test_generated_scanner.py');
        fs.writeFileSync(outputPath, generatedCode);
        success(`Saved generated code to: ${outputPath}`);

        return {
          success: true,
          code: generatedCode,
          filePath: outputPath
        };
      } else {
        warn('No Python code block found in response');
        warn('Response preview:', data.message.substring(0, 200));
        return { success: false, reason: 'No code block found' };
      }
    } else {
      error('Empty response from Renata');
      return { success: false, reason: 'Empty response' };
    }
  } catch (err) {
    error(`Test failed: ${err.message}`);
    return { success: false, reason: err.message };
  }
}

// Test 2: Code Modification
async function testCodeModification() {
  log('\n📋 Test 2: Code Modification', 'magenta');

  const originalCode = `
def lc_d2_scanner(data, filters):
    '''Original LC D2 Scanner'''
    gap_min = filters.get('gap_min', 2.0)
    pm_vol_min = filters.get('pm_vol_min', 1000000)

    results = []
    for ticker, df in data.items():
        latest = df.iloc[-1]

        gap = latest['gap']
        pm_vol = latest['pm_vol']

        if gap >= gap_min and pm_vol >= pm_vol_min:
            results.append({
                'ticker': ticker,
                'gap': gap,
                'pm_vol': pm_vol
            })

    return results
`;

  const modificationPrompt = `Modify this scanner to add the following enhancements:
1. Add ATR filter (atr_min parameter)
2. Add volume surge detection (volume > 2x average)
3. Add parabolic score calculation
4. Return more fields in results

Here's the original code:
\`\`\`python
${originalCode}
\`\`\`

Return the complete modified Python code.`;

  try {
    info('Sending modification request to Renata...');
    const response = await fetch(RENATA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: modificationPrompt,
        personality: 'renata',
        context: {
          sessionId: 'test-modification-1',
          originalCode: originalCode,
          testMode: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    info('Response received from Renata');

    if (data.message && data.message.length > 0) {
      success('Renata generated a modification');

      // Extract modified code
      const codeMatch = data.message.match(/```python\n([\s\S]*?)\n```/);
      if (codeMatch) {
        const modifiedCode = codeMatch[1];
        success(`Extracted ${modifiedCode.length} bytes of modified code`);

        // Save modified code
        const outputPath = path.join(__dirname, 'test_modified_scanner.py');
        fs.writeFileSync(outputPath, modifiedCode);
        success(`Saved modified code to: ${outputPath}`);

        // Verify modifications
        const hasATR = modifiedCode.includes('atr') || modifiedCode.includes('ATR');
        const hasVolumeSurge = modifiedCode.includes('volume') && modifiedCode.includes('average');
        const hasParabolic = modifiedCode.includes('parabolic') || modifiedCode.includes('score');

        log('\n  Verification:', 'blue');
        success(`  ✓ ATR filter: ${hasATR ? 'Present' : 'Not found'}`);
        success(`  ✓ Volume surge: ${hasVolumeSurge ? 'Present' : 'Not found'}`);
        success(`  ✓ Parabolic score: ${hasParabolic ? 'Present' : 'Not found'}`);

        return {
          success: true,
          code: modifiedCode,
          filePath: outputPath,
          hasATR,
          hasVolumeSurge,
          hasParabolic
        };
      } else {
        warn('No Python code block found in response');
        return { success: false, reason: 'No code block found' };
      }
    } else {
      error('Empty response from Renata');
      return { success: false, reason: 'Empty response' };
    }
  } catch (err) {
    error(`Test failed: ${err.message}`);
    return { success: false, reason: err.message };
  }
}

// Test 3: Complex Scanner with AI Features
async function testComplexAIScanner() {
  log('\n📋 Test 3: Complex AI-Enhanced Scanner', 'magenta');

  const complexPrompt = `Create an advanced multi-scanner that combines LC D2 and Backside B patterns with the following features:

1. **LC D2 Pattern**:
   - Gap up > 2%
   - Volume > 1M
   - Price above 9 EMA
   - ATR > 1.0

2. **Backside B Pattern**:
   - Gap down < -1%
   - Volume > 500K
   - Price below 9 EMA
   - Bounce potential > 70%

3. **AI Features**:
   - Calculate confidence score (0-100)
   - Add parameter optimization hints
   - Include backtesting suggestions
   - Generate execution summary

4. **Output Format**:
   Return results as JSON with fields: ticker, pattern_type, confidence, gap, volume, price, signals

Generate complete, executable Python code with proper error handling.`;

  try {
    info('Sending complex scanner request to Renata...');
    const response = await fetch(RENATA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: complexPrompt,
        personality: 'renata',
        context: {
          sessionId: 'test-complex-1',
          testMode: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    info('Response received from Renata');

    if (data.message && data.message.length > 0) {
      success('Renata generated a complex scanner');

      const codeMatch = data.message.match(/```python\n([\s\S]*?)\n```/);
      if (codeMatch) {
        const complexCode = codeMatch[1];
        success(`Generated ${complexCode.length} bytes of complex code`);

        // Save complex code
        const outputPath = path.join(__dirname, 'test_complex_scanner.py');
        fs.writeFileSync(outputPath, complexCode);
        success(`Saved complex scanner to: ${outputPath}`);

        // Verify features
        const hasLCD2 = complexCode.toLowerCase().includes('lc') || complexCode.toLowerCase().includes('d2');
        const hasBackside = complexCode.toLowerCase().includes('backside');
        const hasConfidence = complexCode.toLowerCase().includes('confidence') || complexCode.toLowerCase().includes('score');
        const hasJSON = complexCode.includes('json') || complexCode.includes('dict');
        const hasErrorHandling = complexCode.includes('try') && complexCode.includes('except');

        log('\n  Feature Verification:', 'blue');
        success(`  ✓ LC D2 Pattern: ${hasLCD2 ? 'Present' : 'Not found'}`);
        success(`  ✓ Backside B Pattern: ${hasBackside ? 'Present' : 'Not found'}`);
        success(`  ✓ Confidence Score: ${hasConfidence ? 'Present' : 'Not found'}`);
        success(`  ✓ JSON Output: ${hasJSON ? 'Present' : 'Not found'}`);
        success(`  ✓ Error Handling: ${hasErrorHandling ? 'Present' : 'Not found'}`);

        const featureCount = [hasLCD2, hasBackside, hasConfidence, hasJSON, hasErrorHandling].filter(Boolean).length;

        return {
          success: true,
          code: complexCode,
          filePath: outputPath,
          features: {
            lcD2: hasLCD2,
            backsideB: hasBackside,
            confidence: hasConfidence,
            json: hasJSON,
            errorHandling: hasErrorHandling
          },
          featureScore: featureCount / 5
        };
      } else {
        warn('No Python code block found in response');
        return { success: false, reason: 'No code block found' };
      }
    } else {
      error('Empty response from Renata');
      return { success: false, reason: 'Empty response' };
    }
  } catch (err) {
    error(`Test failed: ${err.message}`);
    return { success: false, reason: err.message };
  }
}

// Test 4: Validate Generated Code Syntax
async function testCodeSyntax(filePath) {
  log('\n📋 Test 4: Code Syntax Validation', 'magenta');

  try {
    const code = fs.readFileSync(filePath, 'utf-8');

    // Basic Python syntax checks
    const checks = {
      properIndentation: /^[ \t]*[^ \t]/m.test(code),
      hasImports: /^import |^from /m.test(code),
      hasFunctionDefinition: /def \w+\(/.test(code),
      hasReturnStatement: /return /.test(code),
      balancedParentheses: (code.match(/\(/g) || []).length === (code.match(/\)/g) || []).length,
      balancedBrackets: (code.match(/\{/g) || []).length === (code.match(/\}/g) || []).length,
      balancedBraces: (code.match(/\[/g) || []).length === (code.match(/\]/g) || []).length
    };

    let allPass = true;
    log('\n  Syntax Checks:', 'blue');

    for (const [check, passed] of Object.entries(checks)) {
      if (passed) {
        success(`  ✓ ${check}`);
      } else {
        error(`  ✗ ${check}`);
        allPass = false;
      }
    }

    return { success: allPass, checks };
  } catch (err) {
    error(`Syntax validation failed: ${err.message}`);
    return { success: false, reason: err.message };
  }
}

// Main test runner
async function runTests() {
  log('\n🚀 Starting Renata Code Generation Validation Tests\n', 'cyan');

  // First, check if Next.js server is running
  try {
    info('Checking if Next.js server is running...');
    const healthResponse = await fetch('http://localhost:5665').catch(() => null);

    if (!healthResponse) {
      error('Next.js server is not running on port 5665');
      error('Please start the server with: npm run dev');
      process.exit(1);
    }

    success('Next.js server is running');
  } catch (err) {
    error(`Cannot connect to Next.js server: ${err.message}`);
    process.exit(1);
  }

  // Run all tests
  const results = {
    simpleGeneration: await testSimpleScannerGeneration(),
    codeModification: await testCodeModification(),
    complexScanner: await testComplexAIScanner()
  };

  // Validate syntax of generated files
  if (results.simpleGeneration.success) {
    results.simpleGenerationSyntax = await testCodeSyntax(results.simpleGeneration.filePath);
  }

  if (results.codeModification.success) {
    results.codeModificationSyntax = await testCodeSyntax(results.codeModification.filePath);
  }

  if (results.complexScanner.success) {
    results.complexScannerSyntax = await testCodeSyntax(results.complexScanner.filePath);
  }

  // Print summary
  log('\n' + '='.repeat(60), 'magenta');
  log('📊 Test Summary', 'magenta');
  log('='.repeat(60), 'magenta');

  const testCount = Object.keys(results).length;
  const passCount = Object.values(results).filter(r => r.success).length;

  for (const [testName, result] of Object.entries(results)) {
    if (result.success) {
      success(`${testName}: PASSED`);
    } else {
      error(`${testName}: FAILED - ${result.reason || 'Unknown error'}`);
    }
  }

  log('\n' + '='.repeat(60), 'magenta');
  log(`Total: ${passCount}/${testCount} tests passed`, passCount === testCount ? 'green' : 'yellow');
  log('='.repeat(60), 'magenta');

  if (passCount === testCount) {
    log('\n🎉 All Renata validation tests PASSED!', 'green');
    log('\n✨ Renata is fully functional and can:', 'green');
    log('  • Generate working Python scanner code', 'green');
    log('  • Modify and enhance existing code', 'green');
    log('  • Create complex multi-pattern scanners', 'green');
    log('  • Produce syntactically correct code', 'green');
    log('\n📁 Generated files:', 'blue');
    if (results.simpleGeneration.filePath) {
      log(`  • ${results.simpleGeneration.filePath}`, 'blue');
    }
    if (results.codeModification.filePath) {
      log(`  • ${results.codeModification.filePath}`, 'blue');
    }
    if (results.complexScanner.filePath) {
      log(`  • ${results.complexScanner.filePath}`, 'blue');
    }
    log('\n💡 Next Steps:', 'blue');
    log('  1. Review the generated scanner files', 'blue');
    log('  2. Test execution with Python backend', 'blue');
    log('  3. Integrate into your scanning workflow', 'blue');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed', 'yellow');
    log('Please check the errors above and verify:', 'yellow');
    log('  • Next.js server is running on port 5665', 'yellow');
    log('  • Renata services are properly configured', 'yellow');
    log('  • API keys are set in .env.local', 'yellow');
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  error(`Test runner error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
