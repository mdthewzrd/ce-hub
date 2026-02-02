/**
 * 📁 PROJECT MANAGEMENT API ROUTES
 *
 * Handles: Create, Read, Update, Delete projects for trading scanners
 * Integrates with ProjectManager backend system
 * Provides RESTful API for frontend project interface
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Types for our project system
interface TradingProject {
  id: string;
  name: string;
  description: string;
  scannerType: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'formatted' | 'tested' | 'production' | 'archived';
  scannerCode: string;
  results: any[];
  configuration: Record<string, any>;
  metadata: Record<string, any>;
  scanners?: Array<{
    id: string;
    scanner_id: string;
    scanner_file: string;
    enabled: boolean;
    weight: number;
    addedAt: string;
    parameters?: any[];
    lastExecuted?: string;
    executionCount?: number;
  }>;
}

// Data storage path
const PROJECTS_DIR = path.join(process.cwd(), 'projects-data');
const PROJECTS_FILE = path.join(PROJECTS_DIR, 'projects.json');

// Ensure projects directory exists
async function ensureProjectsDir() {
  try {
    await fs.access(PROJECTS_DIR);
  } catch {
    await fs.mkdir(PROJECTS_DIR, { recursive: true });
    // Initialize with empty projects array
    await fs.writeFile(PROJECTS_FILE, JSON.stringify({ projects: [] }, null, 2));
  }
}

// Read all projects
async function readProjects(): Promise<{ projects: TradingProject[] }> {
  await ensureProjectsDir();
  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { projects: [] };
  }
}

// Write projects to storage
async function writeProjects(data: { projects: TradingProject[] }): Promise<void> {
  await ensureProjectsDir();
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(data, null, 2));
}

// GET: List all projects
export async function GET() {
  try {
    const data = await readProjects();
    return NextResponse.json({
      success: true,
      projects: data.projects,
      count: data.projects.length
    });
  } catch (error) {
    console.error('Error reading projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read projects' },
      { status: 500 }
    );
  }
}

// POST: Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, scannerType, scannerCode, configuration, aggregation_method, tags } = body;

    // Validate required fields - accept either Renata format or API format
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    const data = await readProjects();

    // Check for duplicate names
    const existingProject = data.projects.find(p => p.name === name);
    if (existingProject) {
      return NextResponse.json(
        { success: false, error: 'Project with this name already exists' },
        { status: 409 }
      );
    }

    // Create new project - handle both Renata format and API format
    const newProject: TradingProject = {
      id: uuidv4(),
      name,
      description: description || '',
      scannerType: scannerType || 'trading', // Default for Renata requests
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      scannerCode: scannerCode || '# Default scanner code\nsymbols = []', // Default for Renata requests
      results: [],
      configuration: configuration || {},
      metadata: {
        aggregation_method: aggregation_method || 'union',
        tags: tags || []
      },
      scanners: []
    };

    data.projects.push(newProject);
    await writeProjects(data);

    return NextResponse.json({
      success: true,
      project: newProject,
      message: 'Project created successfully'
    });

  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

// PUT: Update existing project
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const data = await readProjects();
    const projectIndex = data.projects.findIndex(p => p.id === id);

    if (projectIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Update project with new data
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