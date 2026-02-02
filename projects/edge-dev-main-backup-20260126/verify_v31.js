// Verify TRUE V31 Architecture Features
const testCode = `
import pandas as pd

class TestScanner:
    def scan(self):
        data = pd.DataFrame()
        return data
`;

async function verifyTrueV31() {
  try {
    const response = await fetch('http://localhost:5665/api/renata/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Transform this scanner code to V31 standards:\n\`\`\`python\n${testCode}\n\`\`\``
      })
    });

    const result = await response.json();
    const code = result.data?.formattedCode || result.content || '';

    console.log('🔍 TRUE V31 Architecture Verification:\n');

    // Check all required methods
    const checks = {
      '✅ run_scan() method': code.includes('def run_scan('),
      '✅ fetch_grouped_data() method': code.includes('def fetch_grouped_data('),
      '✅ compute_simple_features() method': code.includes('def compute_simple_features('),
      '✅ apply_smart_filters() method': code.includes('def apply_smart_filters('),
      '✅ compute_full_features() method': code.includes('def compute_full_features('),
      '✅ detect_patterns() method': code.includes('def detect_patterns('),

      // TRUE V31 features
      '✅ Uses grouped endpoint': code.includes('/v2/aggs/grouped/locale/us/market/stocks/'),
      '✅ Preserves historical data': code.includes('df_historical') && code.includes('df_combined'),
      '✅ Per-ticker ADV20': code.includes("groupby('ticker')"),
      '✅ Multi-stage pipeline': code.includes('stage1_data') || code.includes('Stage 1'),
      '✅ Only D0 pattern detection': code.includes('df_d0') && code.includes('D0 range'),
      '✅ O(n) optimization': code.includes('.transform('),

      // Required imports
      '✅ import pandas as pd': code.includes('import pandas as pd'),
      '✅ import numpy as np': code.includes('import numpy as np'),
      '✅ import mcal': code.includes('import mcal'),
      '✅ from typing import List': code.includes('from typing import List, Dict, Any')
    };

    for (const [check, passed] of Object.entries(checks)) {
      console.log(`  ${passed ? '✅' : '❌'} ${check}`);
    }

    const allPassed = Object.values(checks).every(v => v);
    console.log(`\n${allPassed ? '🎉' : '⚠️'} TRUE V31 Architecture: ${allPassed ? 'VERIFIED' : 'INCOMPLETE'}`);

    // Show a snippet of the multi-stage pipeline
    if (code.includes('stage1_data') || code.includes('Stage 1')) {
      console.log('\n📋 Multi-Stage Pipeline Snippet:');
      const pipelineMatch = code.match(/Stage 1.*?(?=Stage 2|Stage 3|$)/s);
      if (pipelineMatch) {
        console.log(pipelineMatch[0].substring(0, 300) + '...');
      }
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyTrueV31();
