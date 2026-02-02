import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('📋 Retrieving debug logs...');

    const { lastLines = 50 } = await request.json();

    // Try to read recent logs from the development server
    const logs = [];

    // Check for common log file locations
    const logPaths = [
      path.join(process.cwd(), '.next/server.log'),
      path.join(process.cwd(), 'logs/app.log'),
      '/tmp/claude-logs.txt' // If we redirect logs here
    ];

    let logContent = '';
    for (const logPath of logPaths) {
      if (fs.existsSync(logPath)) {
        logContent = fs.readFileSync(logPath, 'utf-8');
        break;
      }
    }

    if (logContent) {
      const lines = logContent.split('\n').filter(line =>
        line.includes('🎨') ||
        line.includes('👓') ||
        line.includes('🤖') ||
        line.includes('📁') ||
        line.includes('✅') ||
        line.includes('❌') ||
        line.includes('🚨') ||
        line.includes('🔄') ||
        line.includes('🔍') ||
        line.includes('📸') ||
        line.includes('📊') ||
        line.includes('Task') ||
        line.includes('Error')
      );

      logs.push(...lines.slice(-lastLines));
    }

    // Also try to get the most recent console output
    const recentErrors = [
      '🎨 Starting Gemini processing',
      '👓 Glasses files loaded',
      '🤖 Calling Gemini model',
      '✅ Gemini responded successfully',
      '🔍 Running quality gates',
      '📁 File paths verification',
      '🚨 Error processing task'
    ];

    return NextResponse.json({
      success: true,
      logs: logs.slice(-50), // Return last 50 relevant log lines
      logCount: logs.length,
      patterns: recentErrors,
      suggestions: [
        'Check console.log output in your terminal for detailed error messages',
        'Look for 🚨 error indicators in the logs',
        'Monitor the progress percentages (25%, 50%, 75%, 100%)'
      ]
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      note: 'Logs are only available during development with npm run dev'
    });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Debug Logs Endpoint',
    instructions: 'Send POST request to retrieve recent processing logs',
    usage: 'POST with { "lastLines": 50 } to get last 50 relevant log lines'
  });
}