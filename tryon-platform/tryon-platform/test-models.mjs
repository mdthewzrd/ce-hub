import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const match = envContent.match(/GEMINI_API_KEY=(.+)/);
  if (match) apiKey = match[1].trim();
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testModels() {
  const models = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro'
  ];

  for (const modelName of models) {
    try {
      console.log('Testing:', modelName);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say "OK"');
      const response = await result.response;
      console.log('  SUCCESS:', response.text().trim().substring(0, 50));
      break; // Stop at first working model
    } catch (error) {
      console.log('  FAILED:', error.message.split('\n')[0]);
    }
  }
}

testModels();
