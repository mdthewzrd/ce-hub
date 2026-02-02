import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Job, Task } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;

    const jobsDataPath = path.join(process.cwd(), 'data', 'jobs.json');

    if (!fs.existsSync(jobsDataPath)) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const jobsData = fs.readFileSync(jobsDataPath, 'utf-8');
    const jobs: Job[] = JSON.parse(jobsData);

    // Find the task across all jobs
    let foundTask: Task | null = null;
    let parentJob: Job | null = null;

    for (const job of jobs) {
      const task = job.tasks.find(t => t.id === taskId);
      if (task) {
        foundTask = task;
        parentJob = job;
        break;
      }
    }

    if (!foundTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      task: foundTask,
      job: parentJob,
    });

  } catch (error) {
    console.error('Task fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    const body = await request.json();
    const { status, error } = body;

    const jobsDataPath = path.join(process.cwd(), 'data', 'jobs.json');

    if (!fs.existsSync(jobsDataPath)) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const jobsData = fs.readFileSync(jobsDataPath, 'utf-8');
    const jobs: Job[] = JSON.parse(jobsData);

    // Find and update the task
    let taskFound = false;
    for (const job of jobs) {
      const taskIndex = job.tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        jobs[taskIndex].tasks[taskIndex].status = status || jobs[taskIndex].tasks[taskIndex].status;
        jobs[taskIndex].tasks[taskIndex].updatedAt = new Date();
        if (error) {
          jobs[taskIndex].tasks[taskIndex].error = error;
        }
        taskFound = true;

        // Update job status if needed
        const allTasks = jobs[taskIndex].tasks;
        const completedTasks = allTasks.filter(t => t.status === 'completed');
        const failedTasks = allTasks.filter(t => t.status === 'failed');

        if (completedTasks.length === allTasks.length) {
          jobs[taskIndex].status = 'completed';
        } else if (failedTasks.length > 0 && completedTasks.length + failedTasks.length === allTasks.length) {
          jobs[taskIndex].status = 'failed';
        }

        break;
      }
    }

    if (!taskFound) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Save updated jobs
    fs.writeFileSync(jobsDataPath, JSON.stringify(jobs, null, 2));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Task update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}