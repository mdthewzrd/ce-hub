import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const body = await request.json();
    const { fileIndex, fileName } = body;

    if (fileIndex === undefined) {
      return NextResponse.json(
        { error: 'File index required' },
        { status: 400 }
      );
    }

    // Load projects
    const projectsDataPath = path.join(process.cwd(), 'data', 'projects.json');

    if (!fs.existsSync(projectsDataPath)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectsData = fs.readFileSync(projectsDataPath, 'utf-8');
    const projects = JSON.parse(projectsData);

    // Find the project
    const projectIndex = projects.findIndex((p: any) => p.id === projectId);

    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projects[projectIndex];

    // Check if fileIndex is valid
    if (fileIndex < 0 || fileIndex >= project.glassesFiles.length) {
      return NextResponse.json({ error: 'Invalid file index' }, { status: 400 });
    }

    // Get the file to delete
    const fileToDelete = project.glassesFiles[fileIndex];

    // Delete the physical file if it exists
    if (fileToDelete.url) {
      const filePath = path.join(process.cwd(), 'public', fileToDelete.url);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        } catch (err) {
          console.error(`Failed to delete file ${filePath}:`, err);
        }
      }
    }

    // Remove file from project
    project.glassesFiles.splice(fileIndex, 1);
    project.updatedAt = new Date();

    // Save updated projects
    fs.writeFileSync(projectsDataPath, JSON.stringify(projects, null, 2));

    return NextResponse.json({
      message: 'Glasses deleted successfully',
      project: project
    });

  } catch (error) {
    console.error('Glasses deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
