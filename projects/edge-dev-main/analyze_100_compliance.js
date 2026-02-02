async function getFullCodeFor100() {
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

  const response = await fetch('http://localhost:5665/api/renata/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Transform to V31 standards:\n\`\`\`python\n${testScannerCode}\n\`\`\``,
      context: {}
    })
  });

  const result = await response.json();

  if (result.data?.formattedCode) {
    const code = result.data.formattedCode;

    console.log('📄 FULL TRANSFORMED CODE:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(code);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // V31 Compliance Check
    const checks = {
      '1. import pandas': code.includes('import pandas as pd'),
      '2. import numpy': code.includes('import numpy as np'),
      '3. import mcal': code.includes('import mcal'),
      '4. typing imports': code.includes('from typing import'),
      '5. run_scan()': code.includes('def run_scan('),
      '6. d0_start_user': code.includes('d0_start_user'),
      '7. fetch_grouped_data()': code.includes('def fetch_grouped_data(') && !code.includes('fetch_all'),
      '8. apply_smart_filters()': code.includes('def apply_smart_filters('),
      '9. compute_simple_features()': code.includes('def compute_simple_features('),
      '10. compute_full_features()': code.includes('def compute_full_features('),
      '11. detect_patterns()': code.includes('def detect_patterns('),
      '12. calendar in __init__': code.includes("self.calendar = mcal.get_calendar('XNYS')"),
      '13. calendar.valid_days': code.includes('self.calendar.valid_days'),
      '14. no execute()': !code.includes('def execute('),
      '15. no run_and_save()': !code.includes('def run_and_save('),
    };

    console.log('\n🔍 100% V31 COMPLIANCE CHECK:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let passCount = 0;
    Object.entries(checks).forEach(([name, passed]) => {
      const status = passed ? '✅' : '❌';
      if (passed) passCount++;
      console.log(`${status} ${name}`);
    });

    const score = Math.round((passCount / Object.keys(checks).length) * 100);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📊 OVERALL SCORE: ${score}% (${passCount}/${Object.keys(checks).length})\n`);

    // Show what's missing
    const missing = Object.entries(checks).filter(([key, val]) => !val);
    if (missing.length > 0) {
      console.log('❌ MISSING FOR 100%:\n');
      missing.forEach(([name]) => console.log(`   • ${name}`));
      console.log('');
    }
  }
}

getFullCodeFor100();
