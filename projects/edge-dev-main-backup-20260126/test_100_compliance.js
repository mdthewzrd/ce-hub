async function test100() {
  const testCode = `import pandas as pd
import numpy as np

class ScannerConfig:
    min_price = 10

class BacksideBScanner:
    def __init__(self):
        self.config = ScannerConfig()

    def execute(self, data):
        return []`;

  const res = await fetch('http://localhost:5665/api/renata/chat', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      message: 'Transform to V31:\n```python\n' + testCode + '\n```',
      context: {}
    })
  });

  const result = await res.json();
  const code = result.data?.formattedCode || '';

  console.log('🎯 100% V31 COMPLIANCE TEST\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const checks = {
    '✅ import pandas as pd': code.includes('import pandas as pd'),
    '✅ import numpy as np': code.includes('import numpy as np'),
    '✅ import mcal (no dups)': code.includes('import mcal') && (code.match(/import mcal/g) || []).length === 1,
    '✅ from typing import': code.includes('from typing import'),
    '✅ def run_scan(': code.includes('def run_scan('),
    '✅ d0_start_user': code.includes('d0_start_user'),
    '✅ d0_end_user': code.includes('d0_end_user'),
    '✅ def fetch_grouped_data(': code.includes('def fetch_grouped_data('),
    '✅ def apply_smart_filters(': code.includes('def apply_smart_filters('),
    '✅ def compute_simple_features(': code.includes('def compute_simple_features('),
    '✅ def compute_full_features(': code.includes('def compute_full_features('),
    '✅ def detect_patterns(': code.includes('def detect_patterns('),
    "✅ mcal.get_calendar('XNYS')": code.includes("mcal.get_calendar('XNYS')"),
    '✅ calendar.valid_days': code.includes('calendar.valid_days'),
    '✅ NO execute()': !code.includes('def execute('),
    '✅ NO run_and_save()': !code.includes('def run_and_save('),
  };

  let pass = 0;
  Object.entries(checks).forEach(([name, result]) => {
    if (result) {
      pass++;
      console.log(name + ' ✅');
    } else {
      console.log(name.replace(/^[✅❌]\s/, '') + ' ❌');
    }
  });

  const total = Object.keys(checks).length;
  const score = Math.round((pass / total) * 100);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n📊 SCORE: ${score}% (${pass}/${total})\n`);

  if (score === 100) {
    console.log('🎉 ACHIEVED 100% V31 COMPLIANCE!\n');
    console.log('Transformed code:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(code);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } else {
    console.log('❌ NOT 100% YET\n');
    console.log('Transformed code:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(code);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

test100();
