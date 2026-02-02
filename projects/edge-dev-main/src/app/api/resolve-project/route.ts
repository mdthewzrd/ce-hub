import { NextRequest, NextResponse } from 'next/server';

/**
 * Resolve Project API Endpoint
 *
 * This endpoint handles project resolution requests that may be coming
 * from client-side components or cached requests. It provides project
 * information and redirection capabilities.
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 /api/resolve-project - GET request received');

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');
    const projectName = searchParams.get('name');
    const redirect = searchParams.get('redirect');

    console.log('📋 Query params:', { projectId, projectName, redirect });

    // If no parameters provided, return basic info
    if (!projectId && !projectName) {
      return NextResponse.json({
        success: true,
        message: 'Project resolution endpoint is active',
        usage: {
          methods: ['GET', 'POST'],
          parameters: {
            id: 'Project ID to resolve',
            name: 'Project name to search for',
            redirect: 'Optional redirect path'
          },
          examples: [
            '/api/resolve-project?id=project-123',
            '/api/resolve-project?name=My%20Project',
            '/api/resolve-project?id=project-123&redirect=/exec'
          ]
        }
      });
    }

    // Try to find the project
    const projectsResponse = await fetch(`${request.nextUrl.origin}/api/projects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (projectsResponse.ok) {
      const projectsData = await projectsResponse.json();
      const projects = projectsData.data || projectsData.projects || projectsData;

      let resolvedProject = null;

      if (projectId) {
        // Find by ID
        resolvedProject = projects.find((p: any) => p.id === projectId);
      } else if (projectName) {
        // Find by name (case-insensitive)
        resolvedProject = projects.find((p: any) =>
          p.name?.toLowerCase() === projectName.toLowerCase() ||
          p.title?.toLowerCase() === projectName.toLowerCase()
        );
      }

      if (resolvedProject) {
        console.log('✅ Project resolved:', resolvedProject.name);

        // If redirect requested, return redirect info
        if (redirect) {
          return NextResponse.json({
            success: true,
            project: resolvedProject,
            redirectUrl: `${redirect}?id=${resolvedProject.id}`,
            message: 'Project resolved and redirect available'
          });
        }

        return NextResponse.json({
          success: true,
          project: resolvedProject,
          message: 'Project resolved successfully'
        });
      } else {
        console.log('❌ Project not found:', { projectId, projectName });

        return NextResponse.json({
          success: false,
          error: 'Project not found',
          message: `No project found with ${projectId ? 'ID: ' + projectId : 'name: ' + projectName}`,
          suggestions: {
            checkId: projectId ? 'Verify the project ID is correct' : null,
            checkName: projectName ? 'Verify the project name is exact' : null,
            listProjects: 'Use /api/projects to list all available projects'
          }
        }, { status: 404 });
      }
    } else {
      throw new Error('Failed to fetch projects');
    }

  } catch (error) {
    console.error('❌ /api/resolve-project error:', error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 /api/resolve-project - POST request received');

    const body = await request.json();
    console.log('📋 Request body:', body);

    const { projectId, projectName, action, createIfNotFound } = body;

    // Handle different actions
    switch (action) {
      case 'resolve':
        // Similar to GET but with POST body
        const projectsResponse = await fetch(`${request.nextUrl.origin}/api/projects`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          const projects = projectsData.data || projectsData.projects || projectsData;

          let resolvedProject = projects.find((p: any) =>
            p.id === projectId ||
            p.name === projectName ||
            p.title === projectName
          );

          if (resolvedProject) {
            return NextResponse.json({
              success: true,
              project: resolvedProject,
              message: 'Project resolved successfully'
            });
          } else if (createIfNotFound && projectName) {
            // Create new project if requested
            const createResponse = await fetch(`${request.nextUrl.origin}/api/projects`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: projectName,
                description: `Auto-created project: ${projectName}`,
                aggregation_method: 'universal',
                tags: ['auto-created']
              }),
            });

            if (createResponse.ok) {
              const newProject = await createResponse.json();
              return NextResponse.json({
                success: true,
                project: newProject,
                message: 'New project created and resolved'
              });
            }
          }

          return NextResponse.json({
            success: false,
            error: 'Project not found',
            message: `No project found with the provided criteria`
          }, { status: 404 });
        }
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          message: 'Supported actions: resolve',
          usage: {
            action: 'resolve',
            projectId: 'string (optional)',
            projectName: 'string (optional)',
            createIfNotFound: 'boolean (optional)'
          }
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ /api/resolve-project POST error:', error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// Handle other HTTP methods
export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'Only GET and POST methods are supported'
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'Only GET and POST methods are supported'
  }, { status: 405 });
}