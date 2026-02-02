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
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-exp' });

async function testGlassesSelection() {
  console.log('Testing AI glasses selection...\n');

  const glassesFiles = [
    'public/uploads/projects/e6f29e6f-8c5e-493c-a8d2-497fd725734e/glasses_0_popp-daylight-raoptics-blueblockers-visual-eyes-1160875504.jpg',
    'public/uploads/projects/e6f29e6f-8c5e-493c-a8d2-497fd725734e/glasses_1_popp-daylight-raoptics-blueblockers-visual-eyes-1160875506_1024x1024.webp',
    'public/uploads/projects/e6f29e6f-8c5e-493c-a8d2-497fd725734e/glasses_2_51MW03oVN+L._AC_UY1000_.jpg',
    'public/uploads/projects/e6f29e6f-8c5e-493c-a8d2-497fd725734e/glasses_3_popp-daylight-raoptics-blueblockers-ra-optics-39542683173085_2048x.webp'
  ];

  let bestScore = -1;
  let bestFile = null;

  for (let i = 0; i < glassesFiles.length; i++) {
    const imagePath = glassesFiles[i];
    console.log('Analyzing ' + (i + 1) + '/' + glassesFiles.length + ': ' + imagePath.split('/').pop());

    // Add delay to avoid rate limiting
    if (i > 0) {
      console.log('  Waiting 2 seconds to avoid rate limiting...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    try {
      const imageBuffer = fs.readFileSync(imagePath);

      const prompt = 'Analyze this glasses photo and rate it for use in a virtual try-on application.\n\nRespond with ONLY a JSON object in this exact format:\n{\n  "isFrontFacing": true/false,\n  "angleQuality": "excellent/good/fair/poor",\n  "clarity": "excellent/good/fair/poor",\n  "backgroundClean": true/false,\n  "score": 0-100,\n  "reason": "brief explanation"\n}\n\nScoring criteria:\n- 90-100: Perfect front-facing view, clean background, excellent clarity\n- 70-89: Good front-facing view with minor issues\n- 50-69: Acceptable but not ideal\n- 0-49: Poor quality (side view, blurry, bad angle)';

      const result = await model.generateContent([
        { inline_data: { mime_type: 'image/jpeg', data: imageBuffer.toString('base64') } },
        { text: prompt }
      ]);

      const response = await result.response;
      const responseText = response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        const score = analysis.score || 0;
        console.log('  Score: ' + score + '/100 - ' + (analysis.reason || ''));

        if (score > bestScore) {
          bestScore = score;
          bestFile = imagePath;
          console.log('  >>> NEW BEST! <<<\n');
        }
      }
    } catch (error) {
      console.log('  Error: ' + error.message + '\n');
    }
  }

  console.log('\nWINNER: ' + bestFile.split('/').pop());
  console.log('Score: ' + bestScore + '/100');
}

testGlassesSelection().catch(console.error);
