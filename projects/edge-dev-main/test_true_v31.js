// Test TRUE V31 Architecture Transformation
const testCode = `
import pandas as pd

class TestScanner:
    def scan(self):
        data = pd.DataFrame()
        return data
`;

async function testTrueV31() {
  try {
    const response = await fetch('http://localhost:5665/api/renata/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Transform this scanner code to V31 standards:\n\`\`\`python\n${testCode}\n\`\`\``
      })
    });

    const result = await response.json();
    console.log('✅ TRUE V31 Test Result:');
    console.log(JSON.stringify(result, null, 2));

    if (result.content) {
      console.log('\n📝 Transformed Code Preview (first 50 lines):');
      const lines = result.content.split('\n').slice(0, 50);
      console.log(lines.join('\n'));

      console.log('\n🔍 V31 Architecture Checks:');
      const code = result.content;
      console.log('- Has run_scan() method:', code.includes('def run_scan('));
      console.log('- Has fetch_grouped_data() method:', code.includes('def fetch_grouped_data('));
      console.log('- Has compute_simple_features() method:', code.includes('def compute_simple_features('));
      console.log('- Has apply_smart_filters() method:', code.includes('def apply_smart_filters('));
      console.log('- Has compute_full_features() method:', code.includes('def compute_full_features('));
      console.log('- Has detect_patterns() method:', code.includes('def detect_patterns('));
      console.log('- Uses grouped endpoint:', code.includes('/v2/aggs/grouped/locale/us/market/stocks/'));
      console.log('- Preserves historical data:', code.includes('df_historical') || code.includes('historical'));
      console.log('- Per-ticker ADV20:', code.includes("groupby('ticker')"));
      console.log('- Multi-stage pipeline:', code.includes('Stage 1:') || code.includes('stage1_data'));
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTrueV31();
