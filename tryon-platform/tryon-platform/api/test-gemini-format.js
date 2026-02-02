// Test the correct Gemini API format
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiFormat() {
  try {
    const genAI = new GoogleGenerativeAI('AIzaSyA8uX4JWkeqePK97p9ZhCGifDiUSWAcDik');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

    // Test with the correct format
    const testPrompt = [
      {
        text: "Describe this image in detail."
      },
      {
        inline_data: {
          mime_type: "image/jpeg",
          data: "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA=="
        }
      }
    ];

    console.log('Testing Gemini API with corrected format...');
    const result = await model.generateContent(testPrompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ SUCCESS! Gemini API responded:', text);
    return true;

  } catch (error) {
    console.error('❌ FAILED:', error.message);
    return false;
  }
}

testGeminiFormat();