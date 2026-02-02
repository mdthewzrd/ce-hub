import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Scan EZ API Route
 *
 * Simple scanner execution endpoint - no Renata, no complexity.
 * Just takes uploaded Python code, saves it, and executes it.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scanner_code, scanner_name, start_date, end_date, parameters = {} } = body;

    console.log('🔥 Scan EZ: Executing scanner:', {
      scanner_name,
      start_date,
      end_date,
      parameters
    });

    // Validate required parameters
    if (!scanner_code) {
      return NextResponse.json({
        success: false,
        error: 'Missing scanner_code',
        details: 'Please provide the scanner code to execute'
      }, { status: 400 });
    }

    if (!scanner_name) {
      return NextResponse.json({
        success: false,
        error: 'Missing scanner_name',
        details: 'Please provide a name for the scanner'
      }, { status: 400 });
    }

    if (!start_date) {
      return NextResponse.json({
        success: false,
        error: 'Missing start_date',
        details: 'Please provide a start date'
      }, { status: 400 });
    }

    if (!end_date) {
      return NextResponse.json({
        success: false,
        error: 'Missing end_date',
        details: 'Please provide an end date'
      }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'backend', 'uploaded_scanners');
    const scannerPath = join(uploadDir, `${scanner_name}.py`);

    // Save the uploaded scanner code to a file
    console.log('💾 Saving scanner to:', scannerPath);
    await writeFile(scannerPath, scanner_code, 'utf-8');

    console.log('✅ Scanner saved successfully');

    // Validate date range
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const today = new Date();

    // Ensure dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({
        success: false,
        error: 'Invalid date range',
        details: 'Please provide valid start and end dates'
      }, { status: 400 });
    }

    // Ensure start_date is before end_date
    if (startDate > endDate) {
      return NextResponse.json({
        success: false,
        error: 'Invalid date range',
        details: 'Start date must be before end date'
      }, { status: 400 });
    }

    // Ensure end_date doesn't exceed today
    let adjustedEndDate = endDate;
    if (endDate > today) {
      adjustedEndDate = today;
      console.log('⚠️ End date adjusted to today:', adjustedEndDate.toISOString().split('T')[0]);
    }

    console.log('📅 Scan range:', {
      start_date: startDate.toISOString().split('T')[0],
      end_date: adjustedEndDate.toISOString().split('T')[0]
    });

    // Prepare scan payload for Python backend
    const scanPayload = {
      scanner_file: `${scanner_name}.py`,
      start_date: startDate.toISOString().split('T')[0],
      end_date: adjustedEndDate.toISOString().split('T')[0],
      parameters: parameters
    };

    // Call Python backend to execute the scanner
    console.log('🔥 Calling Python backend...');
    const pythonBackendUrl = 'http://localhost:5666/api/scan/execute-uploaded';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

    try {
      const scanResponse = await fetch(pythonBackendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scanPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!scanResponse.ok) {
        const errorText = await scanResponse.text();
        console.error('❌ Python backend error:', { status: scanResponse.status, errorText });
        return NextResponse.json({
          success: false,
          error: 'Python backend error',
          details: `Status ${scanResponse.status}: ${errorText}`
        }, { status: scanResponse.status });
      }

      const results = await scanResponse.json();
      console.log('✅ Scan completed:', results);

      // Clean up uploaded file
      try {
        await unlink(scannerPath);
        console.log('🧹 Cleaned up uploaded file');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup uploaded file:', cleanupError);
      }

      // Return results
      return NextResponse.json({
        success: true,
        results: results.results || [],
        total_found: results.results?.length || 0,
        execution_time: results.execution_time || 0,
        message: `Scanner executed successfully. Found ${results.results?.length || 0} results.`,
        scan_id: results.scan_id
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError?.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          error: 'Request timeout',
          details: 'Python backend took too long to respond (2 minute limit)'
        }, { status: 504 });
      }

      throw fetchError;
    }

  } catch (error) {
    console.error('❌ Scan EZ API error:', error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
