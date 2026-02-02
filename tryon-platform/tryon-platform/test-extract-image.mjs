import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const match = envContent.match(/GEMINI_API_KEY=(.+)/);
  if (match) apiKey = match[1].trim();
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testImageExtraction() {
  console.log('Testing image extraction from Gemini response...\n');
  
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  
  const prompt = `Generate a simple image of red sunglasses on a white background. Return it as a base64 encoded image.`;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  console.log('Full response preview:', text.substring(0, 500));
  
  // Extract base64 from markdown code block
  const base64Match = text.match(/```base64\n([\s\S]+?)\n```/);
  if (base64Match) {
    const base64Data = base64Match[1].trim();
    console.log('\nExtracted base64 data, length:', base64Data.length);
    
    // Try to decode and save as image
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const outputPath = 'public/uploads/test-generated.png';
      fs.writeFileSync(outputPath, buffer);
      console.log('SUCCESS: Image saved to', outputPath);
      console.log('Image size:', buffer.length, 'bytes');
    } catch (e) {
      console.log('Failed to decode base64:', e.message);
    }
  } else {
    console.log('No base64 code block found in response');
  }
}

testImageExtraction();
