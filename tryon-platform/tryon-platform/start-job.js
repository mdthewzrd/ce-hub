// Manually start job processing for our test job
const { execSync } = require('child_process');

async function startJobProcessing() {
  try {
    const jobId = 'f7ed367a-9806-4e37-9e1d-a1d4ff10fdaa';

    console.log(`🚀 Manually starting job processing for: ${jobId}`);

    // Try to trigger job processing through a curl call that simulates the API
    const curlCommand = `curl -X POST "http://localhost:7771/api/jobs" \\
      -H "Content-Type: application/json" \\
      -d '{
        "action": "start_processing",
        "jobId": "${jobId}"
      }'`;

    try {
      execSync(curlCommand, { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ Could not trigger via API, job will need to be processed manually');
    }

    console.log(`📋 Monitor job at: http://localhost:7771/api/jobs?jobId=${jobId}`);
    console.log(`🖼️ User photo: http://localhost:7771/uploads/${jobId}/subject_0_user_photo.jpg`);

  } catch (error) {
    console.error('❌ Failed to start job processing:', error);
  }
}

startJobProcessing();