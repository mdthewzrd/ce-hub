/**
 * 🧪 Comprehensive Multi-Agent System Test Suite
 *
 * Tests across multiple code styles, scanner types, and edge cases
 * to ensure 100% V31 compliance in all scenarios
 */

const testCases = [
  // Test 1: Minimal backside scanner
  {
    name: 'Test 1: Minimal Backside Scanner',
    code: `
class ScannerConfig:
    min_price = 10

class BacksideBScanner:
    def __init__(self):
        self.config = ScannerConfig()

    def execute(self, data):
        return []
`,
    expectedScore: 100,
    description: 'Basic scanner with deprecated execute() method'
  },

  // Test 2: Scanner with wrong imports
  {
    name: 'Test 2: Wrong Import Names',
    code: `
import pandas_module as pd
import numpy
import calendar

class ScannerConfig:
    min_price = 10

class Scanner:
    def run(self, start, end):
        return []
`,
    expectedScore: 100,
    description: 'Non-standard import names that need fixing'
  },

  // Test 3: Frontside scanner with old structure
  {
    name: 'Test 3: Frontside Scanner (Legacy)',
    code: `
import pandas as pd
import numpy as np

class FrontsideScanner:
    def __init__(self):
        pass

    def fetch_all_data(self):
        return pd.DataFrame()

    def run_and_save(self):
        data = self.fetch_all_data()
        return data
`,
    expectedScore: 100,
    description: 'Legacy scanner with deprecated methods'
  },

  // Test 4: Gap scanner with groupby issues
  {
    name: 'Test 4: Gap Scanner with groupby',
    code: `
class GapScanner:
    def analyze(self, data):
        results = []
        for symbol, df in data.groupby('symbol'):
            gap = df['close'].diff()
            results.append(gap)
        return results
`,
    expectedScore: 100,
    description: 'Scanner using inefficient groupby iteration'
  },

  // Test 5: D1/D2 scanner with wrong date variables
  {
    name: 'Test 5: D1/D2 Scanner',
    code: `
class D1D2Scanner:
    def __init__(self):
        self.d0_start = None
        self.d0_end = None

    def scan(self, start_date, end_date):
        self.d0_start = start_date
        self.d0_end = end_date
        return []
`,
    expectedScore: 100,
    description: 'Scanner using wrong date variable names (d0_start vs d0_start_user)'
  },

  // Test 6: Scanner with ADV20_$ column naming issue
  {
    name: 'Test 6: Scanner with ADV20_$ Column',
    code: `
class VolumeScanner:
    def __init__(self):
        pass

    def scan(self):
        df = pd.DataFrame()
        df['ADV20_$'] = df['volume'].rolling(20).mean()
        return df
`,
    expectedScore: 100,
    description: 'Scanner with invalid column name ($ special character)'
  },

  // Test 7: Complex multi-pattern scanner
  {
    name: 'Test 7: Multi-Pattern Scanner',
    code: `
import pandas as pd
import numpy as np

class MultiPatternScanner:
    def __init__(self):
        self.config = {'min_price': 10, 'max_price': 1000}

    def execute(self, data):
        results = []

        # Pattern 1: Moving average crossover
        for symbol, df in data.groupby('symbol'):
            df['ma_20'] = df['close'].rolling(20).mean()
            df['ma_50'] = df['close'].rolling(50).mean()

            if df['ma_20'].iloc[-1] > df['ma_50'].iloc[-1]:
                results.append({'pattern': 'bullish_crossover'})

        # Pattern 2: Volume spike
        for symbol, df in data.groupby('symbol'):
            if df['volume'].iloc[-1] > df['volume'].mean() * 2:
                results.append({'pattern': 'volume_spike'})

        return results
`,
    expectedScore: 100,
    description: 'Complex scanner with multiple patterns and groupby iterations'
  },

  // Test 8: Scanner missing all required methods
  {
    name: 'Test 8: Bare Bones Scanner',
    code: `
class Scanner:
    pass
`,
    expectedScore: 100,
    description: 'Empty scanner class - maximum transformation needed'
  },

  // Test 9: Scanner with wrong fetch method name
  {
    name: 'Test 9: Wrong fetch() Method',
    code: `
class Scanner:
    def __init__(self):
        pass

    def fetch_all_grouped_data(self):
        return pd.DataFrame()

    def run_scan(self):
        data = self.fetch_all_grouped_data()
        return data
`,
    expectedScore: 100,
    description: 'Scanner using fetch_all_grouped_data instead of fetch_grouped_data'
  },

  // Test 10: Well-structured scanner (should remain mostly unchanged)
  {
    name: 'Test 10: Already V31 Compliant',
    code: `
import pandas as pd
import numpy as np
import mcal
from typing import List, Dict, Any

class ScannerConfig:
    min_price = 10

class WellStructuredScanner:
    def __init__(self):
        self.config = ScannerConfig()
        self.calendar = mcal.get_calendar('XNYS')
        self.d0_start_user = None
        self.d0_end_user = None

    def run_scan(self, d0_start_user: str, d0_end_user: str) -> List[Dict[str, Any]]:
        self.d0_start_user = d0_start_user
        self.d0_end_user = d0_end_user

        data = self.fetch_grouped_data()
        data = self.apply_smart_filters(data)
        data = self.compute_simple_features(data)
        data = self.compute_full_features(data)
        signals = self.detect_patterns(data)
        return signals

    def fetch_grouped_data(self) -> pd.DataFrame:
        trading_days = self.calendar.valid_days(start=self.d0_start_user, end=self.d0_end_user)
        return pd.DataFrame()

    def apply_smart_filters(self, data: pd.DataFrame) -> pd.DataFrame:
        return data[data['close'] >= self.config.min_price]

    def compute_simple_features(self, data: pd.DataFrame) -> pd.DataFrame:
        data['ma20'] = data['close'].rolling(20, min_periods=1).mean()
        return data

    def compute_full_features(self, data: pd.DataFrame) -> pd.DataFrame:
        return data

    def detect_patterns(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        return []
`,
    expectedScore: 100,
    description: 'Already V31 compliant - should preserve structure'
  },

  // Test 11: Scanner with lookahead bias
  {
    name: 'Test 11: Scanner with Lookahead Bias',
    code: `
class Scanner:
    def compute_features(self, data):
        # Lookahead bias - using future data
        data['future_return'] = data['close'].pct_change().shift(-1)
        data['ma_20'] = data['close'].rolling(20).mean()  # No min_periods
        return data
`,
    expectedScore: 100,
    description: 'Scanner with lookahead bias and no min_periods protection'
  },

  // Test 12: Scanner with complex type hints already present
  {
    name: 'Test 12: Scanner with Type Hints',
    code: `
from typing import List, Dict, Optional
import pandas as pd

class TypedScanner:
    def __init__(self) -> None:
        self.data: Optional[pd.DataFrame] = None

    def scan(self, dates: tuple) -> List[Dict]:
        return []
`,
    expectedScore: 100,
    description: 'Scanner with existing type hints - should enhance them'
  },

  // Test 13: Scanner with docstrings
  {
    name: 'Test 13: Well-Documented Scanner',
    code: `
"""
Trading Scanner Module
====================

This module provides scanning functionality for trading patterns.
"""

class DocumentedScanner:
    """
    A scanner that finds trading opportunities.

    Attributes:
        config: Configuration parameters
    """

    def __init__(self):
        """Initialize the scanner."""
        self.config = {'min_price': 10}

    def find_opportunities(self):
        """
        Find trading opportunities.

        Returns:
            List of opportunities found
        """
        return []
`,
    expectedScore: 100,
    description: 'Scanner with comprehensive documentation - should preserve docs'
  },

  // Test 14: Scanner with configuration parameters
  {
    name: 'Test 14: Scanner with Config Parameters',
    code: `
class ScannerConfig:
    # Price filters
    min_price = 10
    max_price = 1000

    # Volume filters
    min_volume = 1000000
    max_volume = 10000000

    # Date range
    lookback_days = 20

    # Pattern parameters
    ma_short = 20
    ma_long = 50

class ParameterizedScanner:
    def __init__(self):
        self.cfg = ScannerConfig()

    def scan(self):
        # Uses all configuration parameters
        return []
`,
    expectedScore: 100,
    description: 'Scanner with extensive configuration - must preserve all parameters'
  },

  // Test 15: Scanner with nested classes
  {
    name: 'Test 15: Scanner with Nested Classes',
    code: `
class OuterScanner:
    class InnerConfig:
        threshold = 10

    def __init__(self):
        self.inner = self.InnerConfig()

    def scan(self):
        return []
`,
    expectedScore: 100,
    description: 'Scanner with nested class structures'
  }
];

async function runComprehensiveTests() {
  console.log('🧪 COMPREHENSIVE MULTI-AGENT SYSTEM TEST SUITE\n');
  console.log('=' .repeat(80));
  console.log(`Testing ${testCases.length} diverse scenarios...\n`);

  const results = [];
  let totalScore = 0;
  let perfectScores = 0;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const testNum = i + 1;

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 TEST ${testNum}: ${testCase.name}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`📝 Description: ${testCase.description}\n`);

    try {
      const startTime = Date.now();

      const response = await fetch('http://localhost:5665/api/renata/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Transform this scanner code to V31 standards:\n\`\`\`python\n${testCase.code}\n\`\`\``,
          context: {}
        })
      });

      const transformTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const transformedCode = result.data?.formattedCode || '';

      // Run V31 compliance checks
      const checks = {
        '✅ pandas import': transformedCode.includes('import pandas as pd'),
        '✅ numpy import': transformedCode.includes('import numpy as np'),
        '✅ mcal import': transformedCode.includes('import mcal') && (transformedCode.match(/import mcal/g) || []).length === 1,
        '✅ typing import': transformedCode.includes('from typing import'),
        '✅ run_scan()': transformedCode.includes('def run_scan('),
        '✅ d0_start_user': transformedCode.includes('d0_start_user'),
        '✅ d0_end_user': transformedCode.includes('d0_end_user'),
        '✅ fetch_grouped_data()': transformedCode.includes('def fetch_grouped_data(') && !transformedCode.includes('fetch_all'),
        '✅ apply_smart_filters()': transformedCode.includes('def apply_smart_filters('),
        '✅ compute_simple_features()': transformedCode.includes('def compute_simple_features('),
        '✅ compute_full_features()': transformedCode.includes('def compute_full_features('),
        '✅ detect_patterns()': transformedCode.includes('def detect_patterns('),
        "✅ mcal.get_calendar('XNYS')": transformedCode.includes("mcal.get_calendar('XNYS')"),
        '✅ calendar.valid_days': transformedCode.includes('calendar.valid_days'),
        '❌ NO execute()': !transformedCode.includes('def execute('),
        '❌ NO run_and_save()': !transformedCode.includes('def run_and_save('),
      };

      const passCount = Object.values(checks).filter(Boolean).length;
      const score = Math.round((passCount / Object.keys(checks).length) * 100);

      totalScore += score;
      if (score === 100) perfectScores++;

      // Display results
      console.log(`⏱️  Transformation Time: ${transformTime}ms`);
      console.log(`📊 V31 Compliance Score: ${score}% (${passCount}/${Object.keys(checks).length})`);

      console.log(`\n🔍 Detailed Checks:`);
      Object.entries(checks).forEach(([check, passed]) => {
        console.log(`  ${passed ? '✅' : '❌'} ${check}`);
      });

      // Show code preview
      console.log(`\n📄 Transformed Code Preview (first 25 lines):`);
      console.log('─'.repeat(80));
      const preview = transformedCode.split('\n').slice(0, 25).join('\n');
      console.log(preview);
      if (transformedCode.split('\n').length > 25) {
        console.log(`\n... (${transformedCode.split('\n').length - 25} more lines)`);
      }
      console.log('─'.repeat(80));

      // Store result
      results.push({
        test: testCase.name,
        score,
        expected: testCase.expectedScore,
        passed: score >= testCase.expectedScore,
        transformTime,
        code: transformedCode
      });

      if (score >= testCase.expectedScore) {
        console.log(`\n✅ TEST PASSED (Score: ${score}% >= Expected: ${testCase.expectedScore}%)`);
      } else {
        console.log(`\n❌ TEST FAILED (Score: ${score}% < Expected: ${testCase.expectedScore}%)`);
      }

    } catch (error) {
      console.error(`\n❌ TEST ERROR: ${error.message}`);
      results.push({
        test: testCase.name,
        score: 0,
        expected: testCase.expectedScore,
        passed: false,
        error: error.message
      });
    }
  }

  // Summary
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('📊 COMPREHENSIVE TEST SUMMARY');
  console.log(`${'='.repeat(80)}\n`);

  const avgScore = Math.round(totalScore / testCases.length);
  const passRate = Math.round((results.filter(r => r.passed).length / results.length) * 100);

  console.log(`Total Tests Run: ${testCases.length}`);
  console.log(`Average V31 Score: ${avgScore}%`);
  console.log(`Perfect Scores (100%): ${perfectScores}/${testCases.length}`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log(`\nIndividual Results:`);

  results.forEach((result, i) => {
    const status = result.passed ? '✅' : '❌';
    const scoreBar = '█'.repeat(Math.floor(result.score / 10)) + '░'.repeat(10 - Math.floor(result.score / 10));
    console.log(`  ${status} Test ${i + 1}: ${result.score}% ${scoreBar} ${result.test}`);
  });

  console.log(`\n${'='.repeat(80)}`);
  if (passRate === 100 && avgScore === 100) {
    console.log('🎉 ALL TESTS PASSED! System is production-ready!');
  } else if (passRate >= 80) {
    console.log('✅ System is working well with room for improvement');
  } else {
    console.log('⚠️  System needs attention - some tests failing');
  }
  console.log(`${'='.repeat(80)}\n`);
}

// Run the comprehensive test suite
runComprehensiveTests().then(() => {
  console.log('✅ Comprehensive testing complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
