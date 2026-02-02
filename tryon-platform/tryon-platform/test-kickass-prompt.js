const fs = require('fs');
const path = require('path');

async function testKickassPrompt() {
  try {
    console.log('🚀 Testing KICKASS prompt with your actual glasses and user photos...');

    // Your photos
    const userImagePath = '/Users/michaeldurante/Downloads/SnapInsta.to_501164083_17959239593943917_3742289706627119932_n.jpg';
    const glassesImagePath = '/Users/michaeldurante/Downloads/51MW03oVN+L._AC_UY1000_.jpg';

    // Read images as base64
    const userImageBuffer = fs.readFileSync(userImagePath);
    const userImageBase64 = userImageBuffer.toString('base64');

    const glassesImageBuffer = fs.readFileSync(glassesImagePath);
    const glassesImageBase64 = glassesImageBuffer.toString('base64');

    console.log(`👤 User photo: ${userImagePath}`);
    console.log(`👓 Glasses photo: ${glassesImagePath}`);

    // KICKASS PROMPT
    const kickassPrompt = `You are a world-class AI photo editor specializing in hyper-realistic virtual glasses try-on. Your task is to make it look like the person in the first photo is ACTUALLY WEARING the exact glasses shown in the second photo.

🎯 CRITICAL MISSION:
- Place the EXACT glasses from photo #2 onto the person in photo #1
- Make it look 100% REALISTIC - like an actual photograph
- No cartoon effects, no fake overlays, no product placement

🔬 FACE ANALYSIS - DO THIS FIRST:
1. Locate both eyes PRECISELY in photo #1
2. Measure exact distance between pupils (interpupillary distance)
3. Find nose bridge position and width
4. Determine head angle and face shape
5. Note lighting direction and shadows in the scene

👓 GLASSES ANALYSIS - DO THIS SECOND:
1. Extract the EXACT frame shape and style from photo #2
2. Note the frame color, thickness, and material
3. Identify lens tint/color if visible
4. Measure temple arm length and curve
5. Understand how the glasses should sit on a human face

🎨 REALISTIC PLACEMENT RULES:
1. Frame MUST align perfectly with person's eyes
2. Lenses should sit directly over the pupils
3. Nose pads should rest on the person's nose bridge
4. Temple arms should angle toward ears naturally
5. Scale should match person's face size proportionally

💡 REALISM ENHANCEMENTS:
- Cast subtle shadows under the frame on the nose
- Add realistic lens reflections matching scene lighting
- Blend frame edges naturally with skin tone
- Maintain original photo's lighting and color balance
- Keep eyes visible through the lenses
- Add subtle reflections on lenses for realism

❌ HARD NEGATIVES - AVOID THESE:
- NO white background or box around glasses
- NO floating or detached glasses
- NO wrong scale (too big/too small)
- NO wrong positioning (covering eyebrows, too low/high)
- NO cartoonish or fake appearance
- NO changes to person's face shape/features
- NO background alterations

🎯 SUCCESS CRITERIA:
- Result must look like a real photo of someone wearing glasses
- Frame should be the exact style from photo #2
- Placement should be anatomically correct
- Lighting and shadows should match the original scene
- Quality should be photograph-level realistic

Generate a single image that shows the person wearing these glasses realistically.`;

    // Build request for Gemini
    const requestBody = {
      contents: [{
        parts: [
          { text: kickassPrompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: glassesImageBase64
            }
          },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: userImageBase64
            }
          }
        ]
      }]
    };

    console.log('📡 Sending KICKASS prompt to Gemini AI...');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=AIzaSyA8uX4JWkeqePK97p9ZhCGifDiUSWAcDik`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    console.log('📊 Response status:', response.status);

    if (result.candidates && result.candidates[0]?.content) {
      const content = result.candidates[0].content;
      console.log('✅ Gemini responded with KICKASS prompt!');
      console.log('📝 Response parts:', content.parts.length);

      // Check for generated image
      const imagePart = content.parts.find(part => part.inline_data);
      if (imagePart) {
        console.log('🖼️ IMAGE GENERATED! This is what we want!');

        // Save the generated image
        const imageBuffer = Buffer.from(imagePart.inline_data.data, 'base64');
        const outputPath = '/Users/michaeldurante/ai dev/ce-hub/tryon-platform/tryon-platform/public/kickass-prompt-result.jpg';
        fs.writeFileSync(outputPath, imageBuffer);

        console.log('💾 KICKASS result saved to:', outputPath);
        console.log('🌐 View at: http://localhost:7771/kickass-prompt-result.jpg');
        console.log(`📊 File size: ${(imageBuffer.length / 1024).toFixed(1)}KB`);

        // Open the result
        setTimeout(() => {
          console.log('🖼️ Opening KICKASS result...');
          require('child_process').exec(`open ${outputPath}`);
        }, 1000);

      } else {
        console.log('📝 Text response received:');
        content.parts.forEach((part, index) => {
          if (part.text) {
            console.log(`Part ${index + 1}: ${part.text}`);
          }
        });
      }
    } else {
      console.log('❌ No valid response from Gemini');
      console.log('Full response:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ KICKASS prompt test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testKickassPrompt();