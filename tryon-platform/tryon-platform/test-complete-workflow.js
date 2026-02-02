const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testCompleteWorkflow() {
  try {
    console.log('🧪 Testing complete workflow with Gemini AI glasses placement...');
    console.log('👤 User photo: /Users/michaeldurante/Downloads/SnapInsta.to_501164083_17959239593943917_3742289706627119932_n.jpg');
    console.log('👓 Project: Ra Popp Daylight');
    console.log('🤖 AI Model: gemini-2.5-flash-image (Nano Banana)');

    // Create form data
    const form = new FormData();

    // Add the subject image
    const userImagePath = '/Users/michaeldurante/Downloads/SnapInsta.to_501164083_17959239593943917_3742289706627119932_n.jpg';
    const userImageBuffer = fs.readFileSync(userImagePath);
    form.append('subjects', userImageBuffer, {
      filename: 'user_photo.jpg',
      contentType: 'image/jpeg'
    });

    // Add the Ra Popp project ID (from earlier API call)
    form.append('projectId', 'e6f29e6f-8c5e-493c-a8d2-497fd725734e');

    // Add generation parameters optimized for realistic placement
    form.append('params', JSON.stringify({
      guidance: 0.7,
      refStrength: 0.9,
      lightingWeight: 0.8,
      reflectionWeight: 0.9,
      colorMatchWeight: 0.2,
      seed: 54321
    }));

    console.log('📤 Submitting job to AI system...');

    // Submit the request
    const response = await fetch('http://localhost:7771/api/jobs', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const result = await response.json();
    console.log('📋 Job submission result:', JSON.stringify(result, null, 2));

    if (result.id) {
      console.log(`✅ Job created successfully! ID: ${result.id}`);
      console.log(`👥 Tasks: ${result.tasks?.length || 0}`);

      // Poll for job completion
      let jobStatus = result.status || 'queued';
      let attempts = 0;
      const maxAttempts = 30; // Wait up to 5 minutes

      while (jobStatus !== 'completed' && jobStatus !== 'failed' && attempts < maxAttempts) {
        attempts++;
        console.log(`⏳ Checking job status (attempt ${attempts}/${maxAttempts}): ${jobStatus}`);

        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

        const statusResponse = await fetch(`http://localhost:7771/api/jobs?jobId=${result.id}`);
        const statusResult = await statusResponse.json();

        jobStatus = statusResult.status;

        // Log task progress
        if (statusResult.tasks) {
          statusResult.tasks.forEach((task, index) => {
            console.log(`   Task ${index + 1}: ${task.status} (${task.progress}%)`);
            if (task.error) {
              console.log(`     Error: ${task.error}`);
            }
          });
        }

        if (jobStatus === 'completed') {
          console.log('🎉 Job completed successfully!');

          // Display results
          statusResult.tasks.forEach((task, index) => {
            if (task.result) {
              console.log(`✨ Task ${index + 1} Result:`);
              console.log(`   🔗 Image: http://localhost:7771${task.result.imageUrl}`);
              console.log(`   📊 Report: http://localhost:7771${task.result.reportUrl}`);
              console.log(`   📈 Quality: SSIM=${task.result.editReport.quality.ssim}, FaceDist=${task.result.editReport.quality.faceDist}, Fit=${task.result.editReport.quality.fit}`);

              // Open the result image
              if (task.result.imageUrl) {
                console.log(`🖼️ Opening result image in browser...`);
                require('child_process').exec(`open http://localhost:7771${task.result.imageUrl}`);
              }
            }
          });
          break;
        }

        if (jobStatus === 'failed') {
          console.log('❌ Job failed!');
          break;
        }
      }

      if (attempts >= maxAttempts) {
        console.log('⏰ Timeout waiting for job completion');
      }

    } else {
      console.error('❌ Job submission failed:', result);
    }

  } catch (error) {
    console.error('💥 Error during workflow test:', error);
    console.error('Stack trace:', error.stack);
  }
}

testCompleteWorkflow();