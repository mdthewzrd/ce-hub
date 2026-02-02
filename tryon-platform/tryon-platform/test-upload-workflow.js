const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function createTestJob() {
  try {
    console.log('🧪 Creating test job with SnapInsta photo and Ra Popp glasses...');

    // Read the user photo
    const userImagePath = '/Users/michaeldurante/Downloads/SnapInsta.to_501164083_17959239593943917_3742289706627119932_n.jpg';
    const userImageBuffer = fs.readFileSync(userImagePath);

    // Create job directory
    const jobId = uuidv4();
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', jobId);
    fs.mkdirSync(uploadsDir, { recursive: true });

    // Copy user photo to uploads directory
    const userFileName = 'subject_0_user_photo.jpg';
    const userFilePath = path.join(uploadsDir, userFileName);
    fs.writeFileSync(userFilePath, userImageBuffer);

    console.log(`📸 User photo copied to: ${userFilePath}`);

    // Load projects to get Ra Popp glasses
    const projectsDataPath = path.join(process.cwd(), 'data', 'projects.json');
    const projectsData = fs.readFileSync(projectsDataPath, 'utf-8');
    const projects = JSON.parse(projectsData);
    const raPoppProject = projects.find((p) => p.name.toLowerCase().includes('popp') && p.name.toLowerCase().includes('daylight'));

    if (!raPoppProject) {
      console.error('❌ Ra Popp project not found');
      return;
    }

    console.log(`👓 Using project: ${raPoppProject.name}`);

    // Create job structure
    const job = {
      id: jobId,
      tasks: [{
        id: uuidv4(),
        jobId: jobId,
        subjectFile: {
          id: uuidv4(),
          name: 'user_photo.jpg',
          type: 'subject',
          url: `/uploads/${jobId}/${userFileName}`,
          size: userImageBuffer.length,
          width: 0,
          height: 0
        },
        glassesFiles: raPoppProject.glassesFiles,
        status: 'queued',
        progress: 0,
        params: {
          guidance: 0.7,
          refStrength: 0.9,
          lightingWeight: 0.8,
          reflectionWeight: 0.9,
          colorMatchWeight: 0.2,
          seed: 54321
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }],
      status: 'queued',
      createdAt: new Date(),
      updatedAt: new Date(),
      projectId: raPoppProject.id
    };

    // Save job to jobs.json
    let existingJobs = [];
    if (fs.existsSync(projectsDataPath.replace('projects.json', 'jobs.json'))) {
      const jobsData = fs.readFileSync(projectsDataPath.replace('projects.json', 'jobs.json'), 'utf-8');
      existingJobs = JSON.parse(jobsData);
    }

    existingJobs.push(job);
    const jobsDataPath = path.join(process.cwd(), 'data', 'jobs.json');
    fs.writeFileSync(jobsDataPath, JSON.stringify(existingJobs, null, 2));

    console.log(`✅ Job created: ${jobId}`);
    console.log(`📋 Job URL: http://localhost:7771/api/jobs?jobId=${jobId}`);
    console.log(`🖼️ User photo: http://localhost:7771/uploads/${jobId}/${userFileName}`);

    // Trigger job processing
    console.log(`🚀 Starting job processing...`);

    try {
      const { startJobProcessing } = require('./lib/workers/jobProcessor');
      startJobProcessing(jobId);
      console.log(`✅ Job processing started!`);
    } catch (error) {
      console.error('⚠️ Could not trigger auto-processing, but job is ready');
    }

    // Wait a moment and then check status
    console.log(`⏳ Waiting 15 seconds before checking status...`);
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Check job status
    const statusResponse = await fetch(`http://localhost:7771/api/jobs?jobId=${jobId}`);
    const statusResult = await statusResponse.json();

    console.log(`📊 Job status: ${statusResult.status}`);
    statusResult.tasks.forEach((task, index) => {
      console.log(`   Task ${index + 1}: ${task.status} (${task.progress}%)`);
      if (task.error) {
        console.log(`     ❌ Error: ${task.error}`);
      }
      if (task.result) {
        console.log(`   ✨ Result image: http://localhost:7771${task.result.imageUrl}`);
        console.log(`   📊 Quality report: http://localhost:7771${task.result.reportUrl}`);

        // Open the result image
        setTimeout(() => {
          console.log(`🖼️ Opening result image...`);
          require('child_process').exec(`open http://localhost:7771${task.result.imageUrl}`);
        }, 2000);
      }
    });

    return jobId;

  } catch (error) {
    console.error('❌ Test job creation failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

createTestJob();