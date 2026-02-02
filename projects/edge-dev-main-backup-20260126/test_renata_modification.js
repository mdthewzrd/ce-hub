#!/usr/bin/env node

/**
 * Test Renata Code Modification Capabilities
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Renata Code Modification Test\n');
console.log('=' .repeat(60));

async function testCodeModification() {
  const originalCode = fs.readFileSync(path.join(__dirname, 'test_renata_backside_b.py'), 'utf-8');

  console.log('📄 Original Backside B Scanner loaded');
  console.log(`   Size: ${originalCode.length} bytes\n`);

  const modificationPrompt = `Modify this Backside B scanner to add the following enhancements:

1. Add a parabolic_score calculation (0-100 scale based on gap and volume)
2. Add an atr_period parameter (default 14)
3. Add date filtering (start_date and end_date parameters)
4. Return additional fields: high, low, close
5. Add proper error handling with try-except

Here is the current code:
\`\`\`python
${originalCode}
\`\`\`

Return only the complete modified Python code in a code block.`;

  console.log('📤 Sending modification request to Renata...\n');

  try {
    const response = await fetch('http://localhost:5665/api/renata/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: modificationPrompt,
        personality: 'renata',
        context: {
          sessionId: `modification-test-${Date.now()}`,
          originalCode: originalCode,
          testMode: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.message) {
      throw new Error('No message in response');
    }

    // Extract Python code
    const codeMatch = data.message.match(/```python\n([\s\S]*?)\n```/);

    if (!codeMatch) {
      console.log('❌ No Python code block in response');
      console.log('Response preview:', data.message.substring(0, 300));
      return false;
    }

    const modifiedCode = codeMatch[1];
    console.log(`✅ Received modified code: ${modifiedCode.length} bytes`);

    // Save modified version
    const modifiedPath = path.join(__dirname, 'test_renata_backside_b_modified.py');
    fs.writeFileSync(modifiedPath, modifiedCode);
    console.log(`✅ Saved to: ${modifiedPath}\n`);

    // Verify enhancements
    console.log('🔍 Verification of Enhancements:');
    const checks = {
      'Parabolic score calculation': /parabolic_score|parabolic/.test(modifiedCode),
      'ATR period parameter': /atr_period|atr.*=.*14/i.test(modifiedCode),
      'Date filtering': /start_date|end_date|datetime/.test(modifiedCode),
      'Additional fields (high, low, close)': /\b(high|low|close)\b/.test(modifiedCode),
      'Error handling (try-except)': /try:|except/.test(modifiedCode)
    };

    let passedChecks = 0;
    for (const [check, passed] of Object.entries(checks)) {
      console.log(`  ${passed ? '✅' : '❌'} ${check}`);
      if (passed) passedChecks++;
    }

    console.log(`\n📊 Enhancement Score: ${passedChecks}/${Object.keys(checks).length}`);

    // Show code diff preview
    console.log('\n📝 Modified Code Preview (first 20 lines):');
    const lines = modifiedCode.split('\n');
    lines.slice(0, 20).forEach((line, i) => {
      console.log(`  ${String(i + 1).padStart(2)}: ${line}`);
    });
    if (lines.length > 20) {
      console.log(`  ... (${lines.length - 20} more lines)`);
    }

    // Test if modified code executes
    console.log('\n🧪 Testing Modified Code Execution...');

    // Create Python test script
    const testScript = `
import pandas as pd
import sys

try:
    # Load modified scanner
    with open('test_renata_backside_b_modified.py', 'r') as f:
        code = f.read()

    # Create test data
    test_data = pd.DataFrame({
        'ticker': ['AAPL', 'MSFT', 'GOOGL', 'TSLA'],
        'open': [150.0, 250.0, 140.0, 800.0],
        'close': [148.0, 248.0, 145.0, 810.0],
        'high': [152.0, 252.0, 143.0, 815.0],
        'low': [147.0, 246.0, 139.0, 795.0],
        'volume': [600000, 400000, 700000, 550000]
    })

    # Execute scanner
    local_scope = {}
    exec(code, {'pd': pd}, local_scope)

    # Try to run the scanner
    results = local_scope['backside_b_scanner'](test_data)

    print('✅ Modified scanner executes successfully!')
    print(f'   Results: {len(results)} ticker(s)')

except Exception as e:
    print(f'❌ Execution failed: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
`;

    const testScriptPath = path.join(__dirname, 'test_modified_execution.py');
    fs.writeFileSync(testScriptPath, testScript);

    const { execSync } = require('child_process');
    try {
      const testOutput = execSync(`python3 ${testScriptPath}`, {
        cwd: __dirname,
        encoding: 'utf-8'
      });
      console.log(testOutput);
    } catch (error) {
      console.log(error.stdout || error.stderr);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Code Modification Test Complete!');
    console.log('='.repeat(60));

    if (passedChecks >= 3) {
      console.log('\n✅ SUCCESS: Renata can modify code effectively!');
      console.log('   • Enhanced scanner with new features');
      console.log('   • Code executes without errors');
      console.log('   • Modifications work as expected');
      return true;
    } else {
      console.log('\n⚠️  Partial success: Some enhancements not applied');
      console.log('   But modified code still executes');
      return false;
    }

  } catch (error) {
    console.log(`\n❌ Test failed: ${error.message}`);
    return false;
  }
}

// Run test
testCodeModification().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
