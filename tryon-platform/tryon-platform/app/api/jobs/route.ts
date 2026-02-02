import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { Job, Task, UploadedFile, GenerationParams } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const data = await request.formData();

    const subjectFiles = data.getAll('subjects') as File[];
    const glassesFiles = data.getAll('glasses') as File[];
    const projectId = data.get('projectId') as string;

    // Parse generation parameters
    let params: GenerationParams | undefined;
    const paramsStr = data.get('params') as string;
    if (paramsStr) {
      try {
        params = JSON.parse(paramsStr);
      } catch (error) {
        console.error('Failed to parse params:', error);
        // Use default parameters if parsing fails
        params = {
          guidance: 0.6,
          refStrength: 0.85,
          lightingWeight: 0.7,
          reflectionWeight: 0.8,
          colorMatchWeight: 0.15,
          seed: 12345
        };
      }
    }

    if (subjectFiles.length === 0) {
      return NextResponse.json(
        { error: 'Please upload at least one subject photo' },
        { status: 400 }
      );
    }

    // If no projectId provided, require glasses files
    if (!projectId && glassesFiles.length === 0) {
      return NextResponse.json(
        { error: 'Please upload glasses photos or select a project' },
        { status: 400 }
      );
    }

    // Create job ID
    const jobId = uuidv4();

    // Process uploaded files
    const uploadedSubjectFiles: UploadedFile[] = [];
    const uploadedGlassesFiles: UploadedFile[] = [];

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', jobId);
    fs.mkdirSync(uploadsDir, { recursive: true });

    // Process subject files
    for (let i = 0; i < subjectFiles.length; i++) {
      const file = subjectFiles[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `subject_${i}_${file.name}`;
      const filepath = path.join(uploadsDir, filename);

      fs.writeFileSync(filepath, buffer);

      uploadedSubjectFiles.push({
        id: uuidv4(),
        name: file.name,
        type: 'subject',
        url: `/uploads/${jobId}/${filename}`,
        size: file.size,
        width: 0, // TODO: Get actual dimensions
        height: 0,
      });
    }

    // Get glasses files from project or upload
    if (projectId) {
      // Load glasses files from existing project
      const projectsDataPath = path.join(process.cwd(), 'data', 'projects.json');
      if (fs.existsSync(projectsDataPath)) {
        const projectsData = fs.readFileSync(projectsDataPath, 'utf-8');
        const projects = JSON.parse(projectsData);
        const project = projects.find((p: any) => p.id === projectId);

        if (project && project.glassesFiles) {
          uploadedGlassesFiles.push(...project.glassesFiles);
        }
      }
    } else {
      // Process uploaded glasses files
      for (let i = 0; i < glassesFiles.length; i++) {
      const file = glassesFiles[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `glasses_${i}_${file.name}`;
      const filepath = path.join(uploadsDir, filename);

      fs.writeFileSync(filepath, buffer);

      uploadedGlassesFiles.push({
        id: uuidv4(),
        name: file.name,
        type: 'glasses',
        url: `/uploads/${jobId}/${filename}`,
        size: file.size,
        width: 0, // TODO: Get actual dimensions
        height: 0,
      });
      }
    }

    // Create tasks for each subject photo
    const tasks: Task[] = uploadedSubjectFiles.map((subjectFile) => ({
      id: uuidv4(),
      jobId,
      subjectFile,
      glassesFiles: uploadedGlassesFiles,
      status: 'queued',
      progress: 0,
      params, // Add generation parameters
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Create job
    const job: Job = {
      id: jobId,
      tasks,
      status: 'queued',
      createdAt: new Date(),
      updatedAt: new Date(),
      projectId: projectId || undefined,
    };

    // Save job data (in a real app, this would go to a database)
    const jobsDataPath = path.join(process.cwd(), 'data', 'jobs.json');
    const jobsDataDir = path.dirname(jobsDataPath);

    if (!fs.existsSync(jobsDataDir)) {
      fs.mkdirSync(jobsDataDir, { recursive: true });
    }

    let existingJobs: Job[] = [];
    if (fs.existsSync(jobsDataPath)) {
      const jobsData = fs.readFileSync(jobsDataPath, 'utf-8');
      existingJobs = JSON.parse(jobsData);
    }

    existingJobs.push(job);
    fs.writeFileSync(jobsDataPath, JSON.stringify(existingJobs, null, 2));

    // Trigger processing with the job processor
    const { startJobProcessing } = require('@/lib/workers/jobProcessor');
    startJobProcessing(jobId);

    return NextResponse.json(job, { status: 201 });

  } catch (error) {
    console.error('Job creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      // Get specific job
      const jobsDataPath = path.join(process.cwd(), 'data', 'jobs.json');

      if (!fs.existsSync(jobsDataPath)) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      const jobsData = fs.readFileSync(jobsDataPath, 'utf-8');
      const jobs: Job[] = JSON.parse(jobsData);
      const job = jobs.find(j => j.id === jobId);

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      return NextResponse.json(job);
    } else {
      // List all jobs
      const jobsDataPath = path.join(process.cwd(), 'data', 'jobs.json');

      if (!fs.existsSync(jobsDataPath)) {
        return NextResponse.json([]);
      }

      const jobsData = fs.readFileSync(jobsDataPath, 'utf-8');
      const jobs: Job[] = JSON.parse(jobsData);

      return NextResponse.json(jobs);
    }
  } catch (error) {
    console.error('Job fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mock processing function (in a real app, this would be a background worker)
async function processJob(job: Job) {
  // Update job status to processing
  job.status = 'processing';
  job.updatedAt = new Date();

  // Save updated job status
  const jobsDataPath = path.join(process.cwd(), 'data', 'jobs.json');
  const jobsData = fs.readFileSync(jobsDataPath, 'utf-8');
  const jobs: Job[] = JSON.parse(jobsData);
  const jobIndex = jobs.findIndex(j => j.id === job.id);

  if (jobIndex !== -1) {
    jobs[jobIndex] = job;
    fs.writeFileSync(jobsDataPath, JSON.stringify(jobs, null, 2));
  }

  // Process each task
  for (const task of job.tasks) {
    // Update task status to running
    task.status = 'running';
    task.progress = 25;
    task.updatedAt = new Date();

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Update task progress
    task.progress = 75;
    task.status = 'verifying';

    // Simulate verification time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Complete task (for now, just return the original image)
    task.status = 'completed';
    task.progress = 100;
    task.updatedAt = new Date();

    // In a real implementation, this would be the processed image
    const resultUrl = `/uploads/${job.id}/result_${task.id}.jpg`;

    task.result = {
      imageUrl: task.subjectFile.url, // TODO: Replace with actual processed image
      reportUrl: `/uploads/${job.id}/report_${task.id}.json`,
      editReport: {
        taskId: task.id,
        version: {
          app: "1.0",
          promptPack: "v1.0",
          model: "nano-banana-gemini",
          providerApi: "1.0.0"
        },
        inputs: {
          subject: { assetId: task.subjectFile.id, w: 1024, h: 768 },
          glasses: task.glassesFiles.map(g => g.id)
        },
        generation: {
          seed: Math.floor(Math.random() * 1000000),
          passes: 1,
          guidance: 0.6,
          refStrength: 0.85,
          lightingWeight: 0.7,
          reflectionWeight: 0.8
        },
        quality: {
          ssim: 0.991,
          faceDist: 0.23,
          fit: "pass"
        },
        notes: "Glasses successfully added with realistic lighting and reflections"
      }
    };

    // Save updated task status
    const updatedJobsData = fs.readFileSync(jobsDataPath, 'utf-8');
    const updatedJobs: Job[] = JSON.parse(updatedJobsData);
    const updatedJobIndex = updatedJobs.findIndex(j => j.id === job.id);

    if (updatedJobIndex !== -1) {
      updatedJobs[updatedJobIndex] = job;
      fs.writeFileSync(jobsDataPath, JSON.stringify(updatedJobs, null, 2));
    }
  }

  // Update job status to completed
  job.status = 'completed';
  job.updatedAt = new Date();

  // Final save
  const finalJobsData = fs.readFileSync(jobsDataPath, 'utf-8');
  const finalJobs: Job[] = JSON.parse(finalJobsData);
  const finalJobIndex = finalJobs.findIndex(j => j.id === job.id);

  if (finalJobIndex !== -1) {
    finalJobs[finalJobIndex] = job;
    fs.writeFileSync(jobsDataPath, JSON.stringify(finalJobs, null, 2));
  }
}