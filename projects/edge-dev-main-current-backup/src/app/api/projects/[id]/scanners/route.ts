/**
 * 📁 PROJECT SCANNER MANAGEMENT API ROUTES
 *
 * Handles: Add, Update, Delete scanners within projects
 * Scanner execution and parameter management
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Data storage paths
const PROJECTS_DIR = path.join(process.cwd(), 'projects-data');
const PROJECTS_FILE = path.join(PROJECTS_DIR, 'projects.json');

// Types
interface Scanner {
  id: string;
  scanner_id: string;
  scanner_file: string;
  enabled: boolean;
  weight: number;
  addedAt: string;
  parameters?: any[];
  lastExecuted?: string;
  executionCount?: number;
}

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

// GET: List all scanners in a project
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
      scanners: project.scanners || [],
      count: (project.scanners || []).length
    });

  } catch (error) {
    console.error('Error reading project scanners:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read project scanners' },
      { status: 500 }
    );
  }
}

// POST: Add scanner to project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scannerRequest = await request.json();

    // Validate required fields
    if (!scannerRequest.scanner_id || !scannerRequest.scanner_file) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: scanner_id, scanner_file' },
        { status: 400 }
      );
    }

    const data = await readProjects();
    const projectIndex = data.projects.findIndex((p: any) => p.id === id);

    if (projectIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Initialize scanners array if it doesn't exist
    if (!data.projects[projectIndex].scanners) {
      data.projects[projectIndex].scanners = [];
    }

    // Check for duplicate scanner_id
    const existingScanner = data.projects[projectIndex].scanners.find((s: any) => s.scanner_id === scannerRequest.scanner_id);
    if (existingScanner) {
      return NextResponse.json(
        { success: false, error: 'Scanner with this ID already exists in the project' },
        { status: 409 }
      );
    }

    // Create new scanner
    const newScanner: Scanner = {
      id: uuidv4(),
      scanner_id: scannerRequest.scanner_id,
      scanner_file: scannerRequest.scanner_file,
      enabled: scannerRequest.enabled !== undefined ? scannerRequest.enabled : true,
      weight: scannerRequest.weight || 1.0,
      addedAt: new Date().toISOString(),
      parameters: scannerRequest.parameters || [],
      executionCount: 0
    };

    // Add scanner to project
    data.projects[projectIndex].scanners.push(newScanner);
    data.projects[projectIndex].updatedAt = new Date().toISOString();

    await writeProjects(data);

    return NextResponse.json({
      success: true,
      scanner: newScanner,
      message: 'Scanner added to project successfully'
    });

  } catch (error) {
    console.error('Error adding scanner to project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add scanner to project' },
      { status: 500 }
    );
  }
}

// PUT: Update scanner in project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { scanner_id, updates } = await request.json();

    if (!scanner_id) {
      return NextResponse.json(
        { success: false, error: 'Scanner ID is required' },
        { status: 400 }
      );
    }

    const data = await readProjects();
    const projectIndex = data.projects.findIndex((p: any) => p.id === id);

    if (projectIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    if (!data.projects[projectIndex].scanners) {
      return NextResponse.json(
        { success: false, error: 'No scanners found in project' },
        { status: 404 }
      );
    }

    const scannerIndex = data.projects[projectIndex].scanners.findIndex((s: any) => s.scanner_id === scanner_id);

    if (scannerIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Scanner not found in project' },
        { status: 404 }
      );
    }

    // Update scanner
    data.projects[projectIndex].scanners[scannerIndex] = {
      ...data.projects[projectIndex].scanners[scannerIndex],
      ...updates
    };

    data.projects[projectIndex].updatedAt = new Date().toISOString();

    await writeProjects(data);

    return NextResponse.json({
      success: true,
      scanner: data.projects[projectIndex].scanners[scannerIndex],
      message: 'Scanner updated successfully'
    });

  } catch (error) {
    console.error('Error updating scanner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update scanner' },
      { status: 500 }
    );
  }
}

// DELETE: Remove scanner from project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const scanner_id = searchParams.get('scanner_id');

    if (!scanner_id) {
      return NextResponse.json(
        { success: false, error: 'Scanner ID is required' },
        { status: 400 }
      );
    }

    const data = await readProjects();
    const projectIndex = data.projects.findIndex((p: any) => p.id === id);

    if (projectIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    if (!data.projects[projectIndex].scanners) {
      return NextResponse.json(
        { success: false, error: 'No scanners found in project' },
        { status: 404 }
      );
    }

    const initialCount = data.projects[projectIndex].scanners.length;
    data.projects[projectIndex].scanners = data.projects[projectIndex].scanners.filter(
      (s: any) => s.scanner_id !== scanner_id
    );

    if (data.projects[projectIndex].scanners.length === initialCount) {
      return NextResponse.json(
        { success: false, error: 'Scanner not found in project' },
        { status: 404 }
      );
    }

    data.projects[projectIndex].updatedAt = new Date().toISOString();

    await writeProjects(data);

    return NextResponse.json({
      success: true,
      message: 'Scanner removed from project successfully'
    });

  } catch (error) {
    console.error('Error removing scanner from project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove scanner from project' },
      { status: 500 }
    );
  }
}