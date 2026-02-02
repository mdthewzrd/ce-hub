import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

// Load API key
let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const match = envContent.match(/GEMINI_API_KEY=(.+)/);
  if (match) apiKey = match[1].trim();
}

// Use new SDK - @google/genai
const ai = new GoogleGenAI({ apiKey });

async function testNanoBananaImageGeneration() {
  console.log('Testing Gemini 2.5 Flash Image (Nano Banana) with new SDK\n');

  try {
    const prompt = 'Generate a simple photograph of a red apple on a wooden table.';

    console.log('Sending request to Gemini 2.5 Flash Image...');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        responseModalities: ['IMAGE', 'TEXT']
      }
    });

    console.log('Response received, checking for image data...\n');

    // Check for image in response
    let hasImage = false;
    let hasText = false;

    if (response.candidates && response.candidates[0]?.content?.parts) {
      const parts = response.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData?.data) {
          hasImage = true;
          const imageData = Buffer.from(part.inlineData.data, 'base64');
          fs.writeFileSync('test-generated-image.png', imageData);
          console.log(`SUCCESS: Generated image saved as test-generated-image.png`);
          console.log(`Image size: ${imageData.length} bytes`);
          console.log(`MIME type: ${part.inlineData.mimeType}`);
        }
        if (part.text) {
          hasText = true;
          console.log(`Text response: ${part.text.substring(0, 100)}...`);
        }
      }
    }

    if (hasImage) {
      console.log('\n*** IMAGE GENERATION WORKS! ***');
      console.log('The new @google/genai SDK successfully generates images with gemini-2.5-flash-image');
      return true;
    } else {
      console.log('\n*** FAILED: No image generated ***');
      console.log('Model responded but no image was returned');
      return false;
    }

  } catch (error) {
    console.log(`\n*** ERROR: ${error.message} ***`);
    console.log(error.stack);
    return false;
  }
}

testNanoBananaImageGeneration().catch(console.error);
