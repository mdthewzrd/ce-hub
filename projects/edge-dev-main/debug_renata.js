#!/usr/bin/env node

/**
 * Debug Renata Responses
 * Inspect what Renata is actually returning
 */

async function debugRenata() {
  console.log('🔍 Debugging Renata Response Format\n');

  const testPrompt = `Write a simple Python function that calculates the gap percentage between two prices. Return only the code, no explanation.`;

  try {
    console.log('Sending request to Renata...');
    console.log('Prompt:', testPrompt);
    console.log('\n' + '='.repeat(60) + '\n');

    const response = await fetch('http://localhost:5665/api/renata/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: testPrompt,
        personality: 'renata',
        context: {
          sessionId: 'debug-test-1',
          testMode: true
        }
      })
    });

    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
      return;
    }

    const data = await response.json();

    console.log('📥 Response Structure:');
    console.log(JSON.stringify(data, null, 2));

    console.log('\n' + '='.repeat(60) + '\n');
    console.log('💬 Message Content:');
    console.log(data.message || 'No message field');

    console.log('\n' + '='.repeat(60) + '\n');
    console.log('📊 Response Type:', data.type);
    console.log('🤖 AI Engine:', data.ai_engine || 'Not specified');

    // Check for different code patterns
    const message = data.message || '';

    console.log('\n' + '='.repeat(60) + '\n');
    console.log('🔍 Code Pattern Detection:');

    const patterns = {
      'Python code block (```python)': /```python\n([\s\S]*?)\n```/.test(message),
      'Generic code block (```)': /```\n([\s\S]*?)\n```/.test(message),
      'Python function (def)': /def \w+\s*\(/.test(message),
      'Python import (import/from)': /^import |^from /m.test(message),
      'Python keywords (class/def/return)': /\b(class|def|return|if|for|while)\b/.test(message)
    };

    for (const [pattern, found] of Object.entries(patterns)) {
      console.log(`  ${found ? '✅' : '❌'} ${pattern}`);
    }

    // Extract any code found
    if (patterns['Python code block (```python)']) {
      const match = message.match(/```python\n([\s\S]*?)\n```/);
      console.log('\n✅ Found Python code block:');
      console.log(match[1]);
    } else if (patterns['Generic code block (``` )']) {
      const match = message.match(/```\n?([\s\S]*?)\n```/);
      console.log('\n✅ Found generic code block:');
      console.log(match[1]);
    } else if (patterns['Python function (def)']) {
      console.log('\n✅ Found Python function but no code block');
      console.log('Code may be embedded in text');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

debugRenata();
