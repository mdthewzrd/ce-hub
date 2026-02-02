// Use built-in fetch for Node.js 18+
// const fetch = require('node-fetch');

async function debugFormattingResponse() {
  console.log('🔍 DEBUGGING FORMATTING API RESPONSE');
  console.log('=====================================\n');

  const testCode = `
# Test Scanner Code
SYMBOLS = ["AAPL", "MSFT", "GOOGL"]

def test_function():
    print("This is a test scanner")
    return True
`;

  try {
    // Test formatting with simple code
    console.log('📍 Step 1: Testing formatting response...');
    const response = await fetch('http://localhost:5656/api/renata/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'format this backside scanner code:\n\n' + testCode,
        personality: 'general',
        context: {
          page: 'renata-popup',
          timestamp: new Date().toISOString()
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response Success');
      console.log('📋 Response type:', data.type);
      console.log('📄 Message length:', data.message.length);

      // Check for code blocks
      const hasCodeBlocks = data.message.includes('```');
      console.log('🔍 Has code block markers:', hasCodeBlocks);

      if (hasCodeBlocks) {
        const codeBlockMatch = data.message.match(/```(?:python)?\s*([\s\S]*?)\s*```/gi);
        console.log('📊 Code blocks found:', codeBlockMatch ? codeBlockMatch.length : 0);

        if (codeBlockMatch) {
          codeBlockMatch.forEach((block, index) => {
            const code = block.replace(/```(?:python)?\s*/, '').replace(/```\s*$/, '');
            console.log(`📝 Block ${index + 1} length:`, code.length, 'characters');
            console.log(`📝 Block ${index + 1} preview:`, code.substring(0, 100) + '...');
          });
        }
      }

      // Check for universe expansion mentions
      const hasUniverseExpansion = data.message.includes('universe') || data.message.includes('NYSE') || data.message.includes('NASDAQ');
      console.log('🌍 Has universe expansion:', hasUniverseExpansion);

      console.log('\n📄 FULL RESPONSE:');
      console.log('================');
      console.log(data.message);

    } else {
      console.error('❌ API Error:', response.status, await response.text());
    }
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

debugFormattingResponse();