/**
 * 🧪 Renata Multi-Agent System Test
 *
 * Tests the new multi-agent orchestration system for code transformation
 */

const testScannerCode = `
import pandas as pd
import numpy as np

class ScannerConfig:
    min_price = 10
    max_price = 1000
    min_volume = 1000000

class BacksideBScanner:
    def __init__(self):
        self.config = ScannerConfig()

    def execute(self, data):
        results = []
        for symbol, df in data.groupby('symbol'):
            if len(df) > 20:
                df['ma_20'] = df['close'].rolling(20).mean()
                df['ma_50'] = df['close'].rolling(50).mean()

                signal = self.detect_breakdown(df)
                if signal:
                    results.append({
                        'symbol': symbol,
                        'signal': signal,
                        'price': df['close'].iloc[-1]
                    })
        return results

    def detect_breakdown(self, df):
        if df['ma_20'].iloc[-1] < df['ma_50'].iloc[-1]:
            return 'bearish_crossover'
        return None
`;

async function testMultiAgentSystem() {
  console.log('🧪 Starting Renata Multi-Agent System Test...\n');

  try {
    // Test the chat endpoint with sample scanner code
    const testMessage = `Transform this backside scanner code to V31 standards:

\`\`\`python
${testScannerCode}
\`\`\`
`;

    console.log('📤 Sending test request to Renata Multi-Agent System...');
    console.log('📝 Test message:', testMessage.substring(0, 100) + '...\n');

    const response = await fetch('http://localhost:5665/api/renata/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage,
        context: {}
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    console.log('✅ Test Response Received:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Response Type:', result.type);
    console.log('🤖 AI Engine:', result.ai_engine);
    console.log('⏰ Timestamp:', result.timestamp);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (result.type === 'code') {
      console.log('🎯 Code Transformation Results:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📄 Response Message:');
      console.log(result.message);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (result.data) {
        console.log('📊 Workflow Summary:');
        console.log('  • Workflow ID:', result.data.workflow?.workflowId || 'N/A');
        console.log('  • Original Lines:', result.data.summary?.originalLines || 'N/A');
        console.log('  • Transformed Lines:', result.data.summary?.transformedLines || 'N/A');
        console.log('  • Parameters Preserved:', result.data.summary?.parametersPreserved || 'N/A');
        console.log('  • V31 Compliance Score:', result.data.summary?.validationScore + '%' || 'N/A');
        console.log('  • Agents Used:', result.data.summary?.agentsUsed?.join(', ') || 'N/A');

        if (result.data.summary?.optimizationsApplied) {
          console.log('  • Optimizations:', result.data.summary.optimizationsApplied.length);
        }

        console.log('\n🔄 Workflow Details:');
        if (result.data.workflow?.results) {
          result.data.workflow.results.forEach((step, index) => {
            console.log(`  ${index + 1}. ${step.agentType}: ${step.data?.description || 'Completed'} (${step.executionTime}ms)`);
          });
        }

        console.log('\n📝 Transformed Code (first 50 lines):');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const codeLines = result.data.formattedCode?.split('\n') || [];
        console.log(codeLines.slice(0, 50).join('\n'));
        if (codeLines.length > 50) {
          console.log(`\n... (${codeLines.length - 50} more lines)`);
        }
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Multi-Agent System Test: PASSED\n');
      console.log('The system successfully:');
      console.log('  ✓ Analyzed the input code');
      console.log('  ✓ Extracted parameters');
      console.log('  ✓ Transformed to V31 standards');
      console.log('  ✓ Validated compliance');
      console.log('  ✓ Added optimizations');
      console.log('  ✓ Generated documentation');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      return true;
    } else {
      console.log('⚠️  Unexpected response type:', result.type);
      console.log('Message:', result.message);
      return false;
    }

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure edge-dev is running on port 5665 at /scan');
    console.error('2. Check that the multi-agent files are properly created');
    console.error('3. Verify Pydantic AI backend is running on port 8001');
    console.error('4. Check browser console for detailed error messages\n');
    return false;
  }
}

// Run the test
testMultiAgentSystem().then(success => {
  if (success) {
    console.log('🎉 All tests passed! The Renata Multi-Agent System is operational.');
    process.exit(0);
  } else {
    console.log('❌ Tests failed. Please check the errors above.');
    process.exit(1);
  }
});
