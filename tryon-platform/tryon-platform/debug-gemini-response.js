const fs = require('fs');

async function debugGeminiResponse() {
  try {
    // Read images as base64
    const userImagePath = '/Users/michaeldurante/Downloads/SnapInsta.to_501164083_17959239593943917_3742289706627119932_n.jpg';
    const glassesImagePath = '/Users/michaeldurante/Downloads/51MW03oVN+L._AC_UY1000_.jpg';

    const userImageBuffer = fs.readFileSync(userImagePath);
    const userImageBase64 = userImageBuffer.toString('base64');

    const glassesImageBuffer = fs.readFileSync(glassesImagePath);
    const glassesImageBase64 = glassesImageBuffer.toString('base64');

    // Simple prompt to generate an image
    const prompt = `Create a realistic image showing the person in the first photo wearing the glasses from the second photo.`;

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
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

    console.log('📡 Testing image generation with Gemini...');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=AIzaSyA8uX4JWkeqePK97p9ZhCGifDiUSWAcDik`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    console.log('📊 Full response:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugGeminiResponse();