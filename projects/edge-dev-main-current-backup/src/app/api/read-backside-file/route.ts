import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Path to the Backside B scanner file
    const backsideBFilePath = path.join(process.cwd(), 'backend/backside para b copy.py');

    // Read the file content
    const fileContent = await fs.readFile(backsideBFilePath, 'utf8');

    return NextResponse.json({
      success: true,
      content: fileContent,
      length: fileContent.length,
      filename: 'backside para b copy.py'
    });
  } catch (error) {
    console.error('Error reading Backside B file:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to read Backside B file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}