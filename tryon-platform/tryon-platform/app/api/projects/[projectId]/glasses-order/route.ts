import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { glassesFiles } = body;

    if (!glassesFiles || !Array.isArray(glassesFiles)) {
      return NextResponse.json(
        { error: 'glassesFiles array required' },
        { status: 400 }
      );
    }

    // Load existing projects
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

    // Update project glasses order
    projects[projectIndex].glassesFiles = glassesFiles;
    projects[projectIndex].updatedAt = new Date();

    // Save updated projects
    fs.writeFileSync(projectsDataPath, JSON.stringify(projects, null, 2));

    return NextResponse.json(projects[projectIndex]);

  } catch (error) {
    console.error('Glasses order update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
