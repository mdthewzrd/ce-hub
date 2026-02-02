import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load API key
let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const match = envContent.match(/GEMINI_API_KEY=(.+)/);
  if (match) apiKey = match[1].trim();
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testImageGeneration() {
  console.log('Testing image generation with gemini-2.0-flash-exp...\n');
  
  // Find a test subject image
  const uploadsDir = 'public/uploads';
  let subjectImage = null;
  
  // Find any subject image
  if (fs.existsSync(uploadsDir)) {
    const findImage = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = `${dir}/${entry.name}`;
        if (entry.isDirectory()) {
          const found = findImage(fullPath);
          if (found) return found;
        } else if (entry.name.includes('subject') && (entry.name.endsWith('.jpg') || entry.name.endsWith('.png'))) {
          return fullPath;
        }
      }
      return null;
    };
    subjectImage = findImage(uploadsDir);
  }
  
  if (!subjectImage) {
    console.log('No subject image found, creating a simple test...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent('Generate a simple test image of sunglasses on a white background');
    console.log('Text response received:', (await result.response).text().substring(0, 200));
    return;
  }
  
  console.log('Using subject image:', subjectImage);
  
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  
  const imageData = fs.readFileSync(subjectImage);
  const promptParts = [
    {
      inline_data: {
        mime_type: 'image/jpeg',
        data: imageData.toString('base64')
      }
    },
    { text: 'Please describe what you see in this image in one sentence.' }
  ];
  
  const result = await model.generateContent(promptParts);
  const response = await result.response;
  console.log('Image analysis response:', response.text());
  console.log('\nSUCCESS: Model can process images!');
}

testImageGeneration().catch(console.error);
