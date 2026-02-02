/**
 * 📁 INDIVIDUAL PROJECT API ROUTES
 *
 * Handles: Get, Update, Delete individual projects
 * File-based project operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Data storage paths
const PROJECTS_DIR = path.join(process.cwd(), 'projects-data');
const PROJECTS_FILE = path.join(PROJECTS_DIR, 'projects.json');

// Read all projects
async function readProjects() {
  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { projects: [] };
  }
}

// Write projects
async function writeProjects(data: any) {
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(data, null, 2));
}

// GET: Individual project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await readProjects();
    const project = data.projects.find((p: any) => p.id === id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project
    });

  } catch (error) {
    console.error('Error reading project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read project' },
      { status: 500 }
    );
  }
}

// PUT: Update individual project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const data = await readProjects();
    const projectIndex = data.projects.findIndex((p: any) => p.id === id);

    if (projectIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Update project
    data.projects[projectIndex] = {
      ...data.projects[projectIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await writeProjects(data);

    return NextResponse.json({
      success: true,
      project: data.projects[projectIndex],
      message: 'Project updated successfully'
    });

  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE: Remove project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const data = await readProjects();
    const initialCount = data.projects.length;
    data.projects = data.projects.filter((p: any) => p.id !== id);

    if (data.projects.length === initialCount) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    await writeProjects(data);

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}