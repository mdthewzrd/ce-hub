import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Save Scan EZ Project API Route
 *
 * Saves an uploaded scanner as a project in projects.json
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, description = '' } = body;

    console.log('💾 Saving Scan EZ project:', name);

    // Read existing projects
    const projectsPath = join(process.cwd(), 'data', 'projects.json');
    const projectsData = JSON.parse(await readFile(projectsPath, 'utf-8'));

    // Create new project
    const newProject = {
      id: Date.now().toString(),
      name: name,
      title: name,
      type: 'Trading Scanner',
      functionName: 'scan',
      enhanced: false,
      code: code,
      description: description || `Scan EZ scanner: ${name}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      scannerCount: 1,
      aggregation_method: 'single',
      tags: ['scan-ez', 'scanner', 'python', 'trading'],
      features: {
        hasParameters: false,
        hasMarketData: true,
        hasEnhancedFormatting: false
      }
    };

    // Add to projects array
    projectsData.data.unshift(newProject);

    // Write back to file
    await writeFile(projectsPath, JSON.stringify(projectsData, null, 2), 'utf-8');

    console.log('✅ Project saved successfully');

    return NextResponse.json({
      success: true,
      project: newProject,
      message: `Project "${name}" saved successfully`
    });

  } catch (error) {
    console.error('❌ Save project error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to save project',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
