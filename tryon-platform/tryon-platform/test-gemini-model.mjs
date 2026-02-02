import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load API key from .env.local
let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const match = envContent.match(/GEMINI_API_KEY=(.+)/);
  if (match) apiKey = match[1].trim();
}

if (!apiKey) {
  console.error('No GEMINI_API_KEY found');
  process.exit(1);
}

console.log('API Key found:', apiKey.substring(0, 10) + '...');

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel() {
  console.log('\nTesting Gemini models...');
  
  const models = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];
  
  for (const modelName of models) {
    try {
      console.log(`\n--- Testing ${modelName} ---`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say "OK" if this works');
      const response = await result.response;
      const text = response.text();
      console.log(`SUCCESS with ${modelName}:`, text.trim().substring(0, 50));
    } catch (error) {
      console.log(`FAILED with ${modelName}:`, error.message.split('\n')[0]);
    }
  }
}

testModel();
