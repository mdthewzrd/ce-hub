import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/lib/gemini';
import fs from 'fs';
import path from 'path';
import { Job, Task } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    console.log(`\n🔄 Processing job: ${jobId}`);

    // Load jobs data
    const jobsDataPath = path.join(process.cwd(), 'data', 'jobs.json');
    if (!fs.existsSync(jobsDataPath)) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const jobsData = fs.readFileSync(jobsDataPath, 'utf-8');
    const jobs: Job[] = JSON.parse(jobsData);

    // Find the job
    const jobIndex = jobs.findIndex(j => j.id === jobId);
    if (jobIndex === -1) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = jobs[jobIndex];
    console.log(`📋 Job has ${job.tasks.length} tasks`);

    // Update job status to processing
    jobs[jobIndex].status = 'processing';
    jobs[jobIndex].updatedAt = new Date();
    fs.writeFileSync(jobsDataPath, JSON.stringify(jobs, null, 2));

    // Load project data if this job has a project
    let projectData: any = null;
    if (job.projectId) {
      const projectsDataPath = path.join(process.cwd(), 'data', 'projects.json');
      if (fs.existsSync(projectsDataPath)) {
        const projectsData = fs.readFileSync(projectsDataPath, 'utf-8');
        const projects = JSON.parse(projectsData);
        projectData = projects.find((p: any) => p.id === job.projectId);
        console.log(`📁 Using project: ${projectData?.name || 'Unknown'}`);
        console.log(`👓 Project has ${projectData?.glassesFiles?.length || 0} glasses files`);
      }
    }

    // Process each task
    for (let taskIndex = 0; taskIndex < job.tasks.length; taskIndex++) {
      const task = job.tasks[taskIndex];
      console.log(`\n🎯 Processing task ${taskIndex + 1}/${job.tasks.length}: ${task.id}`);

      // Update task status to running
      jobs[jobIndex].tasks[taskIndex].status = 'running';
      jobs[jobIndex].tasks[taskIndex].progress = 10;
      fs.writeFileSync(jobsDataPath, JSON.stringify(jobs, null, 2));

      // Build full paths for subject and glasses files
      const subjectPath = path.join(process.cwd(), 'public', task.subjectFile.url);

      // Convert glasses URLs to full paths
      const glassesPaths = task.glassesFiles.map(glassesFile => {
        // If it's a project file (already in uploads), use the full path
        if (glassesFile.url.startsWith('/uploads/projects/')) {
          return path.join(process.cwd(), 'public', glassesFile.url);
        }
        // Otherwise it's a newly uploaded file
        return path.join(process.cwd(), 'public', glassesFile.url);
      });

      console.log(`  📸 Subject: ${task.subjectFile.name}`);
      console.log(`  👓 Glasses: ${glassesPaths.map(p => path.basename(p)).join(', ')}`);

      // Check if files exist
      if (!fs.existsSync(subjectPath)) {
        throw new Error(`Subject file not found: ${subjectPath}`);
      }

      for (const glassesPath of glassesPaths) {
        if (!fs.existsSync(glassesPath)) {
          throw new Error(`Glasses file not found: ${glassesPath}`);
        }
      }

      // Use project sizing info if available
      const sizingInfo = projectData?.sizingInfo;
      if (sizingInfo) {
        console.log(`  📐 Using project sizing info: ${sizingInfo.exact?.model || 'N/A'}`);
      }

      // Process the try-on
      jobs[jobIndex].tasks[taskIndex].progress = 30;
      fs.writeFileSync(jobsDataPath, JSON.stringify(jobs, null, 2));

      const result = await geminiService.processTryOn(
        subjectPath,
        glassesPaths,
        task.params || {
          guidance: 0.6,
          refStrength: 0.85,
          lightingWeight: 0.7,
          reflectionWeight: 0.8,
          colorMatchWeight: 0.15,
          seed: 12345
        },
        task.id,
        sizingInfo
      );

      // Save result
      jobs[jobIndex].tasks[taskIndex].progress = 90;
      jobs[jobIndex].tasks[taskIndex].status = 'completed';
      jobs[jobIndex].tasks[taskIndex].result = {
        imageUrl: result.resultImagePath.replace(process.cwd(), '').replace('/public', ''),
        reportUrl: result.report ? result.report.taskId : '',
        editReport: result.report
      };
      jobs[jobIndex].tasks[taskIndex].updatedAt = new Date();
      fs.writeFileSync(jobsDataPath, JSON.stringify(jobs, null, 2));

      console.log(`  ✅ Task complete: ${result.resultImagePath}`);
    }

    // Update job status to completed
    jobs[jobIndex].status = 'completed';
    jobs[jobIndex].updatedAt = new Date();
    fs.writeFileSync(jobsDataPath, JSON.stringify(jobs, null, 2));

    console.log(`\n✅ Job ${jobId} completed successfully`);

    return NextResponse.json({
      success: true,
      jobId,
      status: 'completed',
      tasks: jobs[jobIndex].tasks
    });

  } catch (error: any) {
    console.error('❌ Job processing error:', error);

    // Try to update job status to failed
    try {
      const jobsDataPath = path.join(process.cwd(), 'data', 'jobs.json');
      const jobsData = fs.readFileSync(jobsDataPath, 'utf-8');
      const jobs: Job[] = JSON.parse(jobsData);
      const jobIndex = jobs.findIndex(j => j.id === (await request.json()).jobId);

      if (jobIndex !== -1) {
        jobs[jobIndex].status = 'failed';
        jobs[jobIndex].updatedAt = new Date();
        fs.writeFileSync(jobsDataPath, JSON.stringify(jobs, null, 2));
      }
    } catch (saveError) {
      console.error('Failed to update job status:', saveError);
    }

    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Job Processor API',
    usage: 'POST with { jobId: string } to process a job'
  });
}
