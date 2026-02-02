const fs = require('fs');
const path = require('path');
const { jobProcessor } = require('./lib/workers/jobProcessor');

async function testDirectProcessor() {
  try {
    console.log('🧪 Testing job processor directly with Canvas implementation...');

    // Find the existing job that was created
    const jobsDataPath = path.join(process.cwd(), 'data', 'jobs.json');
    if (!fs.existsSync(jobsDataPath)) {
      console.error('❌ No jobs data found');
      return;
    }

    const jobsData = fs.readFileSync(jobsDataPath, 'utf-8');
    const jobs = JSON.parse(jobsData);

    if (jobs.length === 0) {
      console.error('❌ No jobs found');
      return;
    }

    // Get the most recent job
    const latestJob = jobs[jobs.length - 1];
    console.log(`📋 Processing job: ${latestJob.id}`);
    console.log(`👤 Tasks: ${latestJob.tasks.length}`);

    // Process the job directly
    await jobProcessor.processJob(latestJob.id);

    console.log('✅ Job processing completed!');

    // Check the results
    const updatedJobsData = fs.readFileSync(jobsDataPath, 'utf-8');
    const updatedJobs = JSON.parse(updatedJobsData);
    const updatedJob = updatedJobs.find(j => j.id === latestJob.id);

    if (updatedJob) {
      console.log(`📊 Final job status: ${updatedJob.status}`);
      updatedJob.tasks.forEach((task, index) => {
        console.log(`  Task ${index + 1}: ${task.status} (${task.progress}%)`);
        if (task.result) {
          console.log(`    Result: ${task.result.imageUrl}`);
        }
        if (task.error) {
          console.log(`    Error: ${task.error}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Direct processor test failed:', error);
  }
}

testDirectProcessor();