import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createCanvas, loadImage } from 'canvas';

// Load API key
let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const match = envContent.match(/GEMINI_API_KEY=(.+)/);
  if (match) apiKey = match[1].trim();
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

async function testFaceDetection() {
  console.log('Testing AI face detection...\n');

  // Find a subject image
  const uploadsDir = 'public/uploads';
  let subjectPath = null;

  function findSubject(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = dir + '/' + entry.name;
      if (entry.isDirectory()) {
        const found = findSubject(fullPath);
        if (found) return found;
      } else if (entry.name.includes('subject') && (entry.name.endsWith('.jpg') || entry.name.endsWith('.png'))) {
        return fullPath;
      }
    }
    return null;
  }

  subjectPath = findSubject(uploadsDir);
  if (!subjectPath) {
    console.log('No subject image found');
    return;
  }

  console.log('Subject image:', subjectPath.split('/').pop());
  console.log('');

  const img = await loadImage(subjectPath);
  console.log('Image dimensions:', img.width, 'x', img.height);
  console.log('');

  const imageBuffer = fs.readFileSync(subjectPath);

  const prompt = 'Analyze this photo and provide the face bounding box as percentages of the total image dimensions.\n\nRespond with ONLY a JSON object in this exact format:\n{\n  "faceX": 0-100,\n  "faceY": 0-100,\n  "faceWidth": 0-100,\n  "faceHeight": 0-100\n}\n\nWhere:\n- faceX: left edge of face as % of image width\n- faceY: top of face (forehead/hairline) as % of image height\n- faceWidth: width of face as % of image width\n- faceHeight: height of face as % of image height';

  const result = await model.generateContent([
    { inline_data: { mime_type: 'image/jpeg', data: imageBuffer.toString('base64') } },
    { text: prompt }
  ]);

  const response = await result.response;
  const responseText = response.text();
  console.log('AI Response:', responseText);
  console.log('');

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const faceData = JSON.parse(jsonMatch[0]);

    const faceX = (faceData.faceX / 100) * img.width;
    const faceY = (faceData.faceY / 100) * img.height;
    const faceWidth = (faceData.faceWidth / 100) * img.width;
    const faceHeight = (faceData.faceHeight / 100) * img.height;

    console.log('Face position (pixels):');
    console.log('  x:', Math.round(faceX));
    console.log('  y:', Math.round(faceY));
    console.log('  width:', Math.round(faceWidth));
    console.log('  height:', Math.round(faceHeight));
    console.log('');

    const glassesWidth = faceWidth * 0.85;
    const glassesHeight = glassesWidth * 0.4; // typical aspect ratio
    const glassesX = faceX + (faceWidth - glassesWidth) / 2;
    const glassesY = faceY + (faceHeight * 0.40) - (glassesHeight * 0.3);

    console.log('Glasses position (calculated):');
    console.log('  x:', Math.round(glassesX));
    console.log('  y:', Math.round(glassesY));
    console.log('  width:', Math.round(glassesWidth));
    console.log('  height:', Math.round(glassesHeight));
  } else {
    console.log('Could not parse face detection response');
  }
}

testFaceDetection().catch(console.error);
