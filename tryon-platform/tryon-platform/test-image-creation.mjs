import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const match = envContent.match(/GEMINI_API_KEY=(.+)/);
  if (match) apiKey = match[1].trim();
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testImageCreation() {
  console.log('Testing if Gemini can CREATE (generate) images...\n');
  
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  
  const prompt = `Create an image of a pair of sunglasses on a white background.
  
  IMPORTANT: Generate a NEW image - don't just describe one. Return the image as base64 data.`;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  
  console.log('Response candidates:', response.candidates?.length);
  
  if (response.candidates && response.candidates[0]?.content?.parts) {
    const parts = response.candidates[0].content.parts;
    console.log('Number of parts:', parts.length);
    
    let foundImage = false;
    for (const part of parts) {
      if (part.inline_data) {
        console.log('FOUND IMAGE DATA!');
        console.log('MIME type:', part.inline_data.mime_type);
        console.log('Data length:', part.inline_data.data?.length || 'no data');
        foundImage = true;
      }
      if (part.text) {
        console.log('Text part:', part.text.substring(0, 200));
      }
    }
    
    if (!foundImage) {
      console.log('\nNO IMAGE GENERATED - Only text response');
      console.log('This model does NOT support image generation, only text analysis');
    }
  } else {
    console.log('Text response:', response.text().substring(0, 300));
  }
}

testImageCreation();
