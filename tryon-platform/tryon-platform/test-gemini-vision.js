// Test Gemini vision with your photo and glasses
const fs = require('fs');
const path = require('path');

async function testGeminiVision() {
  try {
    // Read images as base64
    const userImagePath = '/Users/michaeldurante/Downloads/SnapInsta.to_501164083_17959239593943917_3742289706627119932_n.jpg';
    const userImageBuffer = fs.readFileSync(userImagePath);
    const userImageBase64 = userImageBuffer.toString('base64');

    // Get glasses image
    const dataPath = path.join(process.cwd(), 'data', 'projects.json');
    const projectsData = fs.readFileSync(dataPath, 'utf-8');
    const projects = JSON.parse(projectsData);
    const raPoppProject = projects.find((p) => p.name.toLowerCase().includes('popp') && p.name.toLowerCase().includes('daylight'));

    if (!raPoppProject) {
      console.error('❌ Ra Popp project not found');
      return;
    }

    const glassesUrl = raPoppProject.glassesFiles[0].url;
    const glassesPath = path.join(process.cwd(), 'public', glassesUrl);
    const glassesBuffer = fs.readFileSync(glassesPath);
    const glassesBase64 = glassesBuffer.toString('base64');

    console.log('🤖 Testing Gemini AI vision directly...');
    console.log('👤 User photo loaded:', userImagePath);
    console.log('👓 Glasses loaded:', glassesPath);

    // Build the prompt for realistic glasses placement
    const prompt = `You are an expert AI photo editor specializing in realistic virtual try-on.

TASK: Generate a photorealistic image of the person in the first photo wearing the glasses shown in the second photo.

CRITICAL REQUIREMENTS:
1. **Face Analysis**: Identify eye position, nose bridge, face angle, and head pose
2. **Realistic Placement**: Position glasses frame so it aligns perfectly with the person's eyes
3. **Natural Integration**: Glasses must appear to be actually worn, not overlaid
4. **Physical Accuracy**: Proper perspective, scale, and lighting integration

STEP 1 - ANALYZE THE PERSON:
- Locate both eyes precisely and measure interpupillary distance
- Identify nose bridge position and width
- Assess face shape and head angle
- Note lighting direction and existing shadows

STEP 2 - ANALYZE THE GLASSES:
- Extract the frame shape and style from the reference photo
- Note lens tint, frame material, and temple arm design
- Understand proportions relative to human face

STEP 3 - PLACE REALISTICALLY:
- Position frame so pupils sit naturally within lens openings
- Align nose pads with the person's nose bridge
- Angle temple arms to suggest they go over ears
- Scale appropriately for the person's face size

STEP 4 - INTEGRATE REALISTICALLY:
- Cast subtle shadows under frame and on nose bridge
- Add realistic lens reflections matching scene lighting
- Blend frame edges with skin tone and hair
- Maintain original lighting direction and quality

The result must look like a real photograph of someone actually wearing the glasses.`;

    // Call Gemini API directly
    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: glassesBase64
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

    console.log('📡 Sending request to Gemini AI...');
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
      console.log('✅ Gemini AI responded successfully!');
      console.log('📝 Response length:', content.parts[0]?.text?.length || 0, 'characters');

      // Check if image was generated
      const imagePart = content.parts.find(part => part.inline_data);
      if (imagePart) {
        console.log('🖼️ Image generated successfully!');

        // Save the generated image
        const imageBuffer = Buffer.from(imagePart.inline_data.data, 'base64');
        const outputPath = '/Users/michaeldurante/ai dev/ce-hub/tryon-platform/tryon-platform/public/gemini-vision-result.jpg';
        fs.writeFileSync(outputPath, imageBuffer);

        console.log('💾 Result saved to:', outputPath);
        console.log('🌐 View at: http://localhost:7771/gemini-vision-result.jpg');

        // Open the result
        require('child_process').exec(`open ${outputPath}`);
      } else {
        console.log('📝 Text response received (no image generated)');
        console.log('Response:', content.parts[0]?.text);
      }
    } else {
      console.log('❌ No valid response from Gemini');
      console.log('Full response:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Gemini vision test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testGeminiVision();