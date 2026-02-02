import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { taskId, jobId, subjectFile, glassesFiles, imageUrl, editReport, params: generationParams } = body;

    if (!taskId || !imageUrl) {
      return NextResponse.json(
        { error: 'taskId and imageUrl are required' },
        { status: 400 }
      );
    }

    // Load projects
    const projectsDataPath = path.join(process.cwd(), 'data', 'projects.json');

    if (!fs.existsSync(projectsDataPath)) {
      return NextResponse.json({ error: 'Projects file not found' }, { status: 404 });
    }

    const projectsData = fs.readFileSync(projectsDataPath, 'utf-8');
    const projects = JSON.parse(projectsData);
    const projectIndex = projects.findIndex((p: any) => p.id === projectId);

    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projects[projectIndex];

    // Initialize results array if it doesn't exist
    if (!project.results) {
      project.results = [];
    }

    // Copy subject image to permanent storage
    let permanentSubjectUrl = subjectFile.url;
    let addedToProjectPhotos = false;
    if (subjectFile && subjectFile.url) {
      try {
        // Determine the source path (handle both relative and absolute URLs)
        let sourcePath: string;
        if (subjectFile.url.startsWith('http')) {
          // It's a full URL, extract the path
          const urlObj = new URL(subjectFile.url);
          sourcePath = path.join(process.cwd(), urlObj.pathname);
        } else {
          // It's a relative path
          sourcePath = path.join(process.cwd(), subjectFile.url);
        }

        // Create permanent storage directory for project subjects
        const permanentDir = path.join(process.cwd(), 'public', 'project-subjects', projectId);
        if (!fs.existsSync(permanentDir)) {
          fs.mkdirSync(permanentDir, { recursive: true });
        }

        // Copy subject image to permanent location
        const ext = path.extname(sourcePath) || '.jpg';
        const permanentFileName = `${taskId}${ext}`;
        const permanentPath = path.join(permanentDir, permanentFileName);

        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, permanentPath);
          // Store the permanent URL (served from /public)
          permanentSubjectUrl = `/project-subjects/${projectId}/${permanentFileName}`;
          console.log(`Copied subject image to permanent storage: ${permanentSubjectUrl}`);

          // Also add to project's subject photos collection if not already there
          if (!project.subjectPhotos) {
            project.subjectPhotos = [];
          }

          // Check if this subject photo URL already exists
          const existsInProject = project.subjectPhotos.some((p: any) =>
            p.url === permanentSubjectUrl || p.sourceUrl === subjectFile.url
          );

          if (!existsInProject) {
            project.subjectPhotos.push({
              id: taskId,
              name: subjectFile.name || `subject_${taskId}`,
              type: 'subject',
              url: permanentSubjectUrl,
              sourceUrl: subjectFile.url,
              addedAt: new Date().toISOString(),
              size: fs.statSync(sourcePath).size
            });
            addedToProjectPhotos = true;
            console.log(`Added subject photo to project collection`);
          }
        } else {
          console.warn(`Source subject file not found: ${sourcePath}, keeping original URL`);
        }
      } catch (error) {
        console.error('Error copying subject file:', error);
        // Keep original URL if copy fails
      }
    }

    // Check if result already exists (by taskId)
    const existingIndex = project.results.findIndex((r: any) => r.taskId === taskId);

    const newResult = {
      taskId,
      jobId,
      subjectFile: {
        ...subjectFile,
        url: permanentSubjectUrl,
        permanent: true
      },
      glassesFiles,
      imageUrl,
      editReport,
      params: generationParams,
      completedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      // Update existing result
      project.results[existingIndex] = newResult;
    } else {
      // Add new result
      project.results.push(newResult);
    }

    // Update project timestamp
    project.updatedAt = new Date().toISOString();

    // Save updated projects
    fs.writeFileSync(projectsDataPath, JSON.stringify(projects, null, 2));

    return NextResponse.json({ success: true, result: newResult });

  } catch (error) {
    console.error('Save result error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Load projects
    const projectsDataPath = path.join(process.cwd(), 'data', 'projects.json');

    if (!fs.existsSync(projectsDataPath)) {
      return NextResponse.json({ error: 'Projects file not found' }, { status: 404 });
    }

    const projectsData = fs.readFileSync(projectsDataPath, 'utf-8');
    const projects = JSON.parse(projectsData);
    const project = projects.find((p: any) => p.id === projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project.results || []);

  } catch (error) {
    console.error('Get results error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      );
    }

    // Load projects
    const projectsDataPath = path.join(process.cwd(), 'data', 'projects.json');

    if (!fs.existsSync(projectsDataPath)) {
      return NextResponse.json({ error: 'Projects file not found' }, { status: 404 });
    }

    const projectsData = fs.readFileSync(projectsDataPath, 'utf-8');
    const projects = JSON.parse(projectsData);
    const projectIndex = projects.findIndex((p: any) => p.id === projectId);

    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projects[projectIndex];

    if (!project.results) {
      return NextResponse.json({ error: 'No results found' }, { status: 404 });
    }

    // Find and remove the result
    const resultIndex = project.results.findIndex((r: any) => r.taskId === taskId);

    if (resultIndex === -1) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    const deletedResult = project.results[resultIndex];
    project.results.splice(resultIndex, 1);
    project.updatedAt = new Date().toISOString();

    // Save updated projects
    fs.writeFileSync(projectsDataPath, JSON.stringify(projects, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Result deleted successfully',
      result: deletedResult
    });

  } catch (error) {
    console.error('Delete result error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
