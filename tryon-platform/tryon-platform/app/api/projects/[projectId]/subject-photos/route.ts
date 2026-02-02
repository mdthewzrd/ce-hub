import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// POST - Add a subject photo to a project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const data = await request.formData();
    const file = data.get('file') as File;
    const sourceUrl = data.get('sourceUrl') as string | null;

    if (!file && !sourceUrl) {
      return NextResponse.json(
        { error: 'File or sourceUrl is required' },
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

    // Initialize subjectPhotos array if it doesn't exist
    if (!project.subjectPhotos) {
      project.subjectPhotos = [];
    }

    let subjectPhoto: any;

    if (file) {
      // Save uploaded file to project directory
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'projects', projectId, 'subjects');
      fs.mkdirSync(uploadsDir, { recursive: true });

      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `subject_${uuidv4()}_${file.name}`;
      const filepath = path.join(uploadsDir, filename);

      fs.writeFileSync(filepath, buffer);

      subjectPhoto = {
        id: uuidv4(),
        name: file.name,
        type: 'subject',
        url: `/uploads/projects/${projectId}/subjects/${filename}`,
        size: file.size,
        addedAt: new Date().toISOString()
      };
    } else if (sourceUrl) {
      // Save from URL (copy from temporary location)
      try {
        let sourcePath: string;
        if (sourceUrl.startsWith('http')) {
          const urlObj = new URL(sourceUrl);
          sourcePath = path.join(process.cwd(), urlObj.pathname);
        } else {
          sourcePath = path.join(process.cwd(), sourceUrl);
        }

        if (fs.existsSync(sourcePath)) {
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'projects', projectId, 'subjects');
          fs.mkdirSync(uploadsDir, { recursive: true });

          const ext = path.extname(sourcePath) || '.jpg';
          const filename = `subject_${uuidv4()}${ext}`;
          const destPath = path.join(uploadsDir, filename);

          fs.copyFileSync(sourcePath, destPath);

          subjectPhoto = {
            id: uuidv4(),
            name: path.basename(sourcePath),
            type: 'subject',
            url: `/uploads/projects/${projectId}/subjects/${filename}`,
            size: fs.statSync(sourcePath).size,
            addedAt: new Date().toISOString()
          };
        } else {
          return NextResponse.json({ error: 'Source file not found' }, { status: 404 });
        }
      } catch (error) {
        console.error('Error copying subject file:', error);
        return NextResponse.json({ error: 'Failed to copy subject file' }, { status: 500 });
      }
    }

    // Check if this subject photo already exists (by URL)
    const existingIndex = project.subjectPhotos.findIndex((p: any) => p.url === sourceUrl);

    if (existingIndex >= 0) {
      // Update existing
      project.subjectPhotos[existingIndex] = subjectPhoto;
    } else {
      // Add new
      project.subjectPhotos.push(subjectPhoto);
    }

    // Update project timestamp
    project.updatedAt = new Date().toISOString();

    // Save updated projects
    fs.writeFileSync(projectsDataPath, JSON.stringify(projects, null, 2));

    return NextResponse.json({ success: true, subjectPhoto });

  } catch (error) {
    console.error('Add subject photo error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get all subject photos for a project
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

    return NextResponse.json(project.subjectPhotos || []);

  } catch (error) {
    console.error('Get subject photos error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a subject photo from a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json(
        { error: 'photoId is required' },
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

    if (!project.subjectPhotos) {
      return NextResponse.json({ error: 'No subject photos found' }, { status: 404 });
    }

    // Find and remove the subject photo
    const photoIndex = project.subjectPhotos.findIndex((p: any) => p.id === photoId);

    if (photoIndex === -1) {
      return NextResponse.json({ error: 'Subject photo not found' }, { status: 404 });
    }

    const deletedPhoto = project.subjectPhotos[photoIndex];
    project.subjectPhotos.splice(photoIndex, 1);
    project.updatedAt = new Date().toISOString();

    // Save updated projects
    fs.writeFileSync(projectsDataPath, JSON.stringify(projects, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Subject photo deleted successfully',
      subjectPhoto: deletedPhoto
    });

  } catch (error) {
    console.error('Delete subject photo error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
