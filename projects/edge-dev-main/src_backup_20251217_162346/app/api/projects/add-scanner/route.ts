import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for development (in production, use a database)
const projectStorage: any[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, description, language = 'python', tags = [] } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    const scannerName = name || 'Enhanced Trading Scanner';

    // Extract basic info from the code
    const functionName = code.match(/def\s+(\w+)/)?.[1] || 'scan_symbol';
    const hasParameters = code.includes('P = {') || code.includes('parameters');
    const hasMarketData = code.includes('data[') || code.includes('.iloc[');

    // Create project object
    const project = {
      id: Date.now().toString(),
      name: scannerName,
      type: 'Trading Scanner',
      functionName,
      enhanced: true,
      code,
      description: description || 'Auto-formatted Python trading scanner with enhanced structure',
      tags: [...tags, 'scanner', 'python', 'trading'],
      features: {
        hasParameters,
        hasMarketData,
        hasEnhancedFormatting: true
      },
      timestamp: new Date().toISOString()
    };

    // Store in memory (for development)
    projectStorage.push(project);

    console.log('📝 Adding scanner to project:', {
      name: scannerName,
      functionName,
      hasParameters,
      hasMarketData,
      codeLength: code.length,
      totalProjects: projectStorage.length
    });

    return NextResponse.json({
      success: true,
      message: `✅ "${scannerName}" successfully added to your project!`,
      project,
      totalProjects: projectStorage.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Add scanner error:', error);
    return NextResponse.json(
      {
        error: 'Failed to add scanner to project',
        message: 'Please try again or contact support if the issue persists'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve all projects
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      projects: projectStorage,
      count: projectStorage.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve projects',
        projects: [],
        count: 0
      },
      { status: 500 }
    );
  }
}