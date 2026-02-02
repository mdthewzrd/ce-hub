import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

// Load API key
let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const match = envContent.match(/GEMINI_API_KEY=(.+)/);
  if (match) apiKey = match[1].trim();
}

const ai = new GoogleGenAI({ apiKey });

async function testExactGeminiChatReplication() {
  console.log('Testing EXACT Gemini Chat replication\n');
  console.log('This is exactly what the user does in Gemini Chat:\n');

  // These are the exact images from the user's test
  const subjectPath = 'public/uploads/e498da81-8bdd-4dde-a995-a0b2d6610a4d/subject_0_SnapInsta.to_501164083_17959239593943917_3742289706627119932_n.jpg';
  const glassesPath = 'public/uploads/projects/e6f29e6f-8c5e-493c-a8d2-497fd725734e/glasses_1_popp-daylight-raoptics-blueblockers-visual-eyes-1160875506_1024x1024.webp';

  if (!fs.existsSync(subjectPath) || !fs.existsSync(glassesPath)) {
    console.log('ERROR: Test images not found');
    console.log('Looking for:', subjectPath);
    console.log('Looking for:', glassesPath);
    return;
  }

  const subjectImage = fs.readFileSync(subjectPath).toString('base64');
  const glassesImage = fs.readFileSync(glassesPath).toString('base64');

  console.log('Images loaded:');
  console.log('  Subject:', subjectPath.split('/').pop());
  console.log('  Glasses:', glassesPath.split('/').pop());
  console.log('');

  // EXACT prompt that user sends to Gemini Chat
  const prompt = `I need you to create a realistic image of this person wearing these glasses.

Here is what I need you to do:
1. Study the person's face, expression, pose, and environment from the first photo
2. Study the exact glasses style, frame shape, color from the second photo
3. Generate a NEW photograph showing the SAME PERSON wearing the SAME GLASSES
4. The glasses should look naturally part of their face with proper perspective
5. Match the lighting and environment from the original photo
6. Make it 100% photorealistic - indistinguishable from a real photo

Important: The person is facing forward in the first photo. Make sure the glasses are adjusted to match their front-facing perspective. Don't just copy the glasses - morph and adjust them to look natural on their face.`;

  console.log('Sending to Gemini 2.5 Flash Image (same as Gemini Chat)...');
  console.log('');

  try {
    // This is EXACTLY how Gemini Chat processes it
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        { inlineData: { mimeType: 'image/jpeg', data: subjectImage } },
        { inlineData: { mimeType: 'image/webp', data: glassesImage } },
        { text: prompt }
      ],
      config: {
        responseModalities: ['IMAGE', 'TEXT']
      }
    });

    console.log('Response received!');
    console.log('');

    // Check what we got back
    let hasImage = false;
    let hasText = false;

    if (response.candidates && response.candidates[0]?.content?.parts) {
      const parts = response.candidates[0].content.parts;

      for (const part of parts) {
        if (part.inlineData?.data) {
          hasImage = true;
          const imageData = Buffer.from(part.inlineData.data, 'base64');
          fs.writeFileSync('glasses-result.png', imageData);
          console.log('*** IMAGE GENERATED! ***');
          console.log(`Saved as: glasses-result.png (${imageData.length} bytes)`);
          console.log(`Type: ${part.inlineData.mimeType}`);
        }
        if (part.text) {
          hasText = true;
          console.log('Text:', part.text.substring(0, 200) + '...');
        }
      }
    }

    console.log('');
    if (hasImage) {
      console.log('SUCCESS! Gemini generated an image just like in Gemini Chat!');
    } else {
      console.log('FAILED! No image was generated - only text returned.');
      console.log('This means the API is NOT working the same as Gemini Chat.');
    }

  } catch (error) {
    console.log('ERROR:', error.message);
  }
}

testExactGeminiChatReplication().catch(console.error);
