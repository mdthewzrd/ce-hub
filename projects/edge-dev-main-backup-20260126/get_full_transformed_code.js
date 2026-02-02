/**
 * Get Full Transformed Code for V31 Analysis
 */

async function getFullCode() {
  try {
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

    const testMessage = `Transform this backside scanner code to V31 standards:

\`\`\`python
${testScannerCode}
\`\`\`
`;

    console.log('📤 Sending request to get full transformed code...\n');

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

    if (result.data && result.data.formattedCode) {
      const fullCode = result.data.formattedCode;
      
      console.log('📄 FULL TRANSFORMED CODE:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log(fullCode);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Perform detailed V31 analysis
      console.log('🔍 DETAILED V31 COMPLIANCE ANALYSIS:\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      const checks = {
        '1. run_scan() Entry Point': {
          required: true,
          present: fullCode.includes('def run_scan('),
          description: 'Main entry point for scanner execution',
          snippet: fullCode.match(/def run_scan\(.*?\):/s)?.[0] || 'NOT FOUND'
        },
        '2. d0_start_user Variables': {
          required: true,
          present: fullCode.includes('d0_start_user') && fullCode.includes('d0_end_user'),
          description: 'User-defined date range variables',
          snippet: fullCode.match(/d0_start_user\s*=/)?.[0] || 'NOT FOUND'
        },
        '3. fetch_grouped_data() Method': {
          required: true,
          present: fullCode.includes('def fetch_grouped_data(') && !fullCode.includes('fetch_all'),
          description: 'Data fetching method (NOT fetch_all)',
          snippet: fullCode.match(/def fetch_grouped_data\(.*?\):/s)?.[0]?.substring(0, 50) + '...' || 'NOT FOUND'
        },
        '4. apply_smart_filters() Method': {
          required: true,
          present: fullCode.includes('def apply_smart_filters('),
          description: 'Smart filtering for D0 range only',
          snippet: fullCode.match(/def apply_smart_filters\(.*?\):/s)?.[0]?.substring(0, 50) + '...' || 'NOT FOUND'
        },
        '5. compute_features Methods': {
          required: true,
          present: fullCode.includes('def compute_simple_features(') || fullCode.includes('def compute_full_features('),
          description: 'Feature computation methods',
          snippet: (fullCode.match(/def compute_simple_features\(.*?\):/s) || fullCode.match(/def compute_full_features\(.*?\):/s))?.[0]?.substring(0, 50) + '...' || 'NOT FOUND'
        },
        '6. adv20_usd Column Naming': {
          required: true,
          present: fullCode.includes('adv20_usd') && !fullCode.includes('ADV20_'),
          description: 'Valid Python identifiers (no $)',
          snippet: fullCode.includes('adv20_usd') ? '✅ Uses adv20_usd' : '⚠️  No ADV20 columns in this scanner'
        },
        '7. No Deprecated Methods': {
          required: true,
          present: !fullCode.includes('def execute(') && !fullCode.includes('def run_and_save('),
          description: 'Removed execute() and run_and_save()',
          snippet: !fullCode.includes('def execute(') ? '✅ Removed' : '❌ Still present'
        },
        '8. Market Calendar': {
          required: true,
          present: fullCode.includes('mcal.get_calendar'),
          description: 'Uses mcal.get_calendar for trading days',
          snippet: fullCode.match(/import.*mcal/)?.[0] || 'NOT FOUND'
        }
      };

      let passCount = 0;
      let failCount = 0;
      let notApplicable = 0;

      Object.entries(checks).forEach(([name, check]) => {
        let status, explanation;
        
        if (check.present) {
          status = '✅ PASS';
          passCount++;
          explanation = 'Present in code';
        } else if (name === '6. adv20_usd Column Naming' && !fullCode.includes('ADV20_')) {
          status = '⚠️  N/A';
          notApplicable++;
          explanation = 'No ADV20 columns needed for this scanner';
        } else {
          status = '❌ FAIL';
          failCount++;
          explanation = 'Missing from code';
        }

        console.log(`${status}: ${name}`);
        console.log(`   Description: ${check.description}`);
        console.log(`   Status: ${explanation}`);
        console.log(`   Code: ${check.snippet}\n`);
      });

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`\n📊 SUMMARY:`);
      console.log(`   ✅ Passed: ${passCount}`);
      console.log(`   ❌ Failed: ${failCount}`);
      console.log(`   ⚠️  Not Applicable: ${notApplicable}`);
      
      const adjustedTotal = Object.keys(checks).length - notApplicable;
      const adjustedScore = Math.round((passCount / adjustedTotal) * 100);
      console.log(`   📈 Adjusted Score: ${adjustedScore}% (${passCount}/${adjustedTotal} applicable checks)\n`);

      if (failCount > 0) {
        console.log('❌ MISSING ITEMS TO FIX:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (!checks['8. Market Calendar'].present) {
          console.log('\n1. Add Market Calendar:');
          console.log('   ```python');
          console.log('   import pandas as pd');
          console.log('   import numpy as np');
          console.log('   import mcal');
          console.log('   ');
          console.log('   # In fetch_grouped_data():');
          console.log('   calendar = mcal.get_calendar(\'XNYS\')');
          console.log('   trading_days = calendar.valid_days(start=self.d0_start_user, end=self.d0_end_user)');
          console.log('   ```\n');
        }

        if (!checks['5. compute_features Methods'].present) {
          console.log('2. Add Feature Computation Methods:');
          console.log('   ```python');
          console.log('   def compute_simple_features(self, data: pd.DataFrame) -> pd.DataFrame:');
          console.log('       """Compute basic features like moving averages"""');
          console.log('       data[\'ma_20\'] = data[\'close\'].rolling(20, min_periods=1).mean()');
          console.log('       data[\'ma_50\'] = data[\'close\'].rolling(50, min_periods=1).mean()');
          console.log('       return data');
          console.log('   ');
          console.log('   def compute_full_features(self, data: pd.DataFrame) -> pd.DataFrame:');
          console.log('       """Compute all remaining features"""');
          console.log('       # Add more features here');
          console.log('       return data');
          console.log('   ```\n');
        }
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getFullCode();
