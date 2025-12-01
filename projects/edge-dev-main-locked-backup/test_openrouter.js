#!/usr/bin/env node

/**
 * Test script to verify OpenRouter DeepSeek integration
 */

const https = require('https');

const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const testData = {
  model: 'deepseek/deepseek-chat',
  messages: [
    {
      role: 'user',
      content: 'Format this Python code: def test(): pass'
    }
  ],
  temperature: 0.1,
  max_tokens: 100
};

console.log('🤖 Testing OpenRouter DeepSeek integration...');

const postData = JSON.stringify(testData);

const options = {
  hostname: 'openrouter.ai',
  path: '/api/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'http://localhost:5657',
    'X-Title': 'Edge-Dev DeepSeek Test',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`📡 Status Code: ${res.statusCode}`);

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅ OpenRouter Response received!');
      console.log('📊 Usage:', response.usage);
      console.log('💰 Cost:', response.usage?.total_cost || 'Not provided');
      console.log('🎯 Model:', response.model);

      if (response.choices && response.choices[0]) {
        console.log('🔧 Formatted result:', response.choices[0].message?.content?.substring(0, 200) + '...');
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.log('📄 Raw response:', data.substring(0, 500) + '...');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.write(postData);
req.end();