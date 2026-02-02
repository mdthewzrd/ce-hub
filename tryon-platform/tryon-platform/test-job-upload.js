const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testJobSubmission() {
  try {
    console.log('🧪 Testing job submission with actual file uploads...');

    // Create form data
    const form = new FormData();

    // Add the subject image
    const userImagePath = '/Users/michaeldurante/Downloads/SnapInsta.to_501164083_17959239593943917_3742289706627119932_n.jpg';
    const userImageBuffer = fs.readFileSync(userImagePath);
    form.append('subjects', userImageBuffer, {
      filename: 'user_photo.jpg',
      contentType: 'image/jpeg'
    });

    // Add project ID instead of glasses files
    form.append('projectId', 'e6f29e6f-8c5e-493c-a8d2-497fd725734e');

    // Add params
    form.append('params', JSON.stringify({
      guidance: 0.6,
      refStrength: 0.85,
      lightingWeight: 0.7,
      reflectionWeight: 0.8,
      colorMatchWeight: 0.15,
      seed: 12345
    }));

    // Submit the request
    const response = await fetch('http://localhost:7771/api/jobs', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const result = await response.json();
    console.log('📤 Job submission result:', result);

    if (result.success) {
      console.log(`✅ Job created successfully! ID: ${result.jobId}`);
      return result.jobId;
    } else {
      console.error('❌ Job submission failed:', result);
      return null;
    }

  } catch (error) {
    console.error('💥 Error during job submission:', error);
    return null;
  }
}

testJobSubmission();