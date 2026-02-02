import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Project data interface
interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived' | 'draft';
  scannerCount: number;
  lastScanDate?: string;
  // Enhanced fields for scanner projects from Renata chat
  title?: string;
  type?: string;
  functionName?: string;
  enhanced?: boolean;
  code?: string;
  aggregation_method?: string;
  tags?: string[];
  features?: {
    hasParameters: boolean;
    hasMarketData: boolean;
    hasEnhancedFormatting: boolean;
  };
}

// File-based persistent storage
const PROJECTS_FILE = join(process.cwd(), 'data', 'projects.json');

// Ensure data directory exists and load projects
async function ensureDataDirectory() {
  try {
    await mkdir(process.cwd() + '/data', { recursive: true });
  } catch (error) {
    // Directory might already exist, that's fine
  }
}

// Load projects from file
async function loadProjects(): Promise<Project[]> {
  try {
    await ensureDataDirectory();
    const data = await readFile(PROJECTS_FILE, 'utf-8');
    const parsed = JSON.parse(data);

    // Handle both formats: direct array or object with data property
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (parsed && Array.isArray(parsed.data)) {
      return parsed.data;
    } else {
      console.warn('Invalid projects data format, using default projects');
      return [];
    }
  } catch (error) {
    // If file doesn't exist or is empty, start with default projects
    const defaultProjects: Project[] = [
      {
        id: '1',
        name: 'Market Scanner Project',
        description: 'Comprehensive market analysis and scanning system',
        createdAt: new Date('2024-01-15').toISOString(),
        updatedAt: new Date('2024-12-01').toISOString(),
        status: 'active',
        scannerCount: 3,
        lastScanDate: new Date('2024-12-01').toISOString()
      },
      {
        id: '2',
        name: 'Backtesting Engine',
        description: 'Historical strategy validation and optimization',
        createdAt: new Date('2024-02-20').toISOString(),
        updatedAt: new Date('2024-11-15').toISOString(),
        status: 'active',
        scannerCount: 5,
        lastScanDate: new Date('2024-11-15').toISOString()
      },
      {
        id: '3',
        name: 'AI Trading Signals',
        description: 'Machine learning powered trading signals',
        createdAt: new Date('2024-03-10').toISOString(),
        updatedAt: new Date('2024-10-30').toISOString(),
        status: 'draft',
        scannerCount: 2
      }
    ];

    // Save default projects to file
    await saveProjects(defaultProjects);
    return defaultProjects;
  }
}

// Save projects to file
async function saveProjects(projects: Project[]): Promise<void> {
  try {
    await ensureDataDirectory();
    // Save in the same format with data property for consistency
    const dataToSave = {
      data: projects,
      timestamp: new Date().toISOString(),
      count: projects.length
    };
    await writeFile(PROJECTS_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save projects:', error);
  }
}

// GET all projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Load projects from persistent storage
    const projects = await loadProjects();
    let filteredProjects = projects;

    if (status) {
      filteredProjects = projects.filter(p => p.status === status);
    }

    return NextResponse.json({
      success: true,
      data: filteredProjects,
      count: filteredProjects.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Projects GET Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch projects',
      message: 'Unable to retrieve projects at this time'
    }, { status: 500 });
  }
}

// POST create new project (supports both dashboard and Renata chat)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle Add to Project from Renata chat
    if (body.code && body.name) {
      return await handleAddToProject(body);
    }

    // Handle regular project creation from dashboard
    return await handleCreateProject(body);
  } catch (error) {
    console.error('Projects POST Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create project',
      message: 'Unable to create project at this time'
    }, { status: 500 });
  }
}

// Handle Add to Project from Renata chat
async function handleAddToProject(body: any) {
  const { code, name, description, language = 'python', tags = [] } = body;

  if (!code) {
    return NextResponse.json({
      success: false,
      error: 'Code is required',
      message: 'Please provide scanner code'
    }, { status: 400 });
  }

  // Extract the actual function name from the code for the project name
  // Look for the first function definition in the user's original code
  const originalCode = code;

  // Known infrastructure function names to exclude (added by sophisticated formatter)
  const infrastructureFunctions = [
    'get_proper_date_range',
    'get_full_ticker_universe',
    'fetch_aggregates_enhanced',
    'fetch_and_scan_a_plus',
    'fetch_data_enhanced',
    'fetch_and_scan_custom',
    'run_enhanced_a_plus_scan',
    'run_enhanced_custom_scan',
    'run_enhanced_lc_scan',
    'dates_before_after',
    'get_offsets'
  ];

  // Find all function definitions in the code
  const allFunctions = originalCode.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g) || [];

  // Extract function names and filter out infrastructure functions
  const userFunctions = allFunctions
    .map((match: string) => match.replace(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(.*/, '$1'))
    .filter((funcName: string) => !infrastructureFunctions.includes(funcName));

  // Use provided name (filename-based) instead of function name
  const functionName = userFunctions[0] || null;
  const scannerName = name || 'Enhanced Trading Scanner';

  console.log('🔄 Proxying "Add to Project" request to FastAPI backend...');

  // 🔥 CRITICAL FIX: Proxy to FastAPI backend which stores in ../../projects/ directories
  // This ensures projects appear in the frontend which reads from the same backend
  try {
    const backendResponse = await fetch('http://localhost:5666/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: scannerName,
        description: description || 'Auto-formatted Python trading scanner with enhanced structure',
        code: code,
        function_name: functionName || 'scan_function',
        aggregation_method: 'single',
        tags: [...tags, 'scanner', 'python', 'trading', 'enhanced', 'renata-v2']
      })
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('❌ FastAPI backend error:', backendResponse.status, errorText);
      throw new Error(`Backend returned ${backendResponse.status}: ${errorText}`);
    }

    const backendData = await backendResponse.json();
    console.log('✅ FastAPI backend created project:', backendData);

    // Return the backend's response
    return NextResponse.json({
      success: true,
      message: `✅ "${scannerName}" successfully added to your project!`,
      project: backendData.data || backendData,
      totalProjects: (backendData.data?.count || 0) + 1,
      timestamp: new Date().toISOString(),
      _backendResponse: true  // Flag indicating proxied to backend
    });
  } catch (error) {
    console.error('❌ Failed to proxy to FastAPI backend:', error);

    // Fallback: Save to local file storage
    console.log('⚠️  Falling back to local file storage...');

    // Extract basic info from the code
    const hasParameters = code.includes('P = {') || code.includes('parameters');
    const hasMarketData = code.includes('data[') || code.includes('.iloc[');

    // Create project object that works with both systems
    const newProject: Project = {
      id: Date.now().toString(),
      name: scannerName,
      title: scannerName,
      type: 'Trading Scanner',
      functionName: functionName || 'scan_symbol', // Store the actual function name
      enhanced: true,
      code,
      description: description || 'Auto-formatted Python trading scanner with enhanced structure',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      scannerCount: 1,
      aggregation_method: 'single',
      tags: [...tags, 'scanner', 'python', 'trading', 'enhanced'],
      features: {
        hasParameters,
        hasMarketData,
        hasEnhancedFormatting: true
      }
    };

    // Load existing projects, add new one, and save
    const projects = await loadProjects();
    projects.push(newProject);
    await saveProjects(projects);

    console.log('✅ Scanner project added to local file storage (fallback):', {
      id: newProject.id,
      name: newProject.name,
      type: newProject.type,
      totalProjects: projects.length
    });

    return NextResponse.json({
      success: true,
      message: `✅ "${scannerName}" successfully added to your project! (Local storage - backend unavailable)`,
      project: newProject,
      totalProjects: projects.length,
      timestamp: new Date().toISOString(),
      _fallback: true  // Flag indicating used fallback storage
    });
  }
}

// Handle regular project creation from dashboard
async function handleCreateProject(body: any) {
  const { name, description } = body;

  if (!name) {
    return NextResponse.json({
      success: false,
      error: 'Project name is required',
      message: 'Please provide a name for the project'
    }, { status: 400 });
  }

  // Load existing projects to get proper ID
  const projects = await loadProjects();

  const newProject: Project = {
    id: (projects.length + 1).toString(),
    name,
    title: name,
    description: description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft',
    scannerCount: 0,
    aggregation_method: 'weighted'
  };

  projects.push(newProject);
  await saveProjects(projects);

  return NextResponse.json({
    success: true,
    data: newProject,
    message: 'Project created successfully',
    timestamp: new Date().toISOString()
  }, { status: 201 });
}

// PUT update project
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, status } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Project ID is required',
        message: 'Please provide a project ID to update'
      }, { status: 400 });
    }

    // Load projects from persistent storage
    const projects = await loadProjects();
    const projectIndex = projects.findIndex(p => p.id === id);

    if (projectIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Project not found',
        message: `Project with ID ${id} does not exist`
      }, { status: 404 });
    }

    const updatedProject = {
      ...projects[projectIndex],
      name: name || projects[projectIndex].name,
      description: description !== undefined ? description : projects[projectIndex].description,
      status: status || projects[projectIndex].status,
      updatedAt: new Date().toISOString()
    };

    projects[projectIndex] = updatedProject;
    await saveProjects(projects);

    return NextResponse.json({
      success: true,
      data: updatedProject,
      message: 'Project updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Projects PUT Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update project',
      message: 'Unable to update project at this time'
    }, { status: 500 });
  }
}

// DELETE project - handles both /projects?id=xxx and /projects/xxx
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);

    // Try to get ID from query parameter first
    let id = url.searchParams.get('id');

    // If not in query params, try to get from URL pathname
    if (!id) {
      const pathname = url.pathname;
      // Handle /projects/[id] pattern
      const pathParts = pathname.split('/');
      if (pathParts.length >= 3 && pathParts[1] === 'projects') {
        id = pathParts[2];
      }
    }

    if (!id) {
      console.log('❌ DELETE: No project ID found in query params or path');
      return NextResponse.json({
        success: false,
        error: 'Project ID is required',
        message: 'Please provide a project ID to delete',
        debug: {
          query: url.searchParams.toString(),
          pathname: url.pathname,
          searchParamsId: url.searchParams.get('id'),
          pathParts: url.pathname.split('/')
        }
      }, { status: 400 });
    }

    // Load projects from persistent storage
    const projects = await loadProjects();

    console.log(`🗑️ DELETE: Attempting to delete project with ID: ${id}`);
    console.log(`📋 Current projects:`, projects.map(p => ({ id: p.id, name: p.name })));

    const projectIndex = projects.findIndex(p => p.id === id);

    if (projectIndex === -1) {
      console.log(`❌ DELETE: Project with ID ${id} not found`);
      return NextResponse.json({
        success: false,
        error: 'Project not found',
        message: `Project with ID ${id} does not exist`,
        debug: {
          requestedId: id,
          availableIds: projects.map(p => p.id)
        }
      }, { status: 404 });
    }

    const deletedProject = projects[projectIndex];
    projects.splice(projectIndex, 1);

    // Save updated projects to persistent storage
    await saveProjects(projects);

    console.log(`✅ DELETE: Successfully deleted project "${deletedProject.name}" (ID: ${id})`);
    console.log(`📊 Remaining projects: ${projects.length}`);

    return NextResponse.json({
      success: true,
      data: deletedProject,
      message: `Project "${deletedProject.name}" deleted successfully`,
      totalProjects: projects.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Projects DELETE Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete project',
      message: 'Unable to delete project at this time',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}