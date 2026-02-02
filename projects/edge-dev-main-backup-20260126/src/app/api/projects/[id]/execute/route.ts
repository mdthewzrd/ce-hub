/**
 * Project Execution API Route
 *
 * This route handles project execution by forwarding requests to the backend scanner execution service.
 * It bridges the gap between the frontend project management system and the backend scanner execution.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { fastApiScanService } from '@/services/fastApiScanService';

// Load projects from persistent storage
async function loadProjects() {
  try {
    const projectsFile = join(process.cwd(), 'data', 'projects.json');
    console.log('📁 Loading projects from:', projectsFile);
    const data = await readFile(projectsFile, 'utf-8');
    const projects = JSON.parse(data);
    console.log('📊 Loaded projects:', projects.data?.length || 0, 'projects');
    return projects;
  } catch (error) {
    console.error('❌ Failed to load projects:', error);
    return { data: [] };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    console.log(`🚀 Project Execution API: Executing project ${projectId}`);

    // Parse the execution configuration from the request body
    const execConfig = await request.json();
    console.log(`📊 Execution config:`, execConfig);

    // Load projects from persistent storage to get the scanner code
    const projectsData = await loadProjects();
    const projects = projectsData.data || projectsData; // Handle nested data structure
    const project = projects.find((p: any) => p.id === projectId);

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: `Project with ID ${projectId} not found`
        },
        { status: 404 }
      );
    }

    // Extract execution parameters
    const {
      date_range,
      start_date,
      end_date,
      timeout_seconds = 300,
      max_workers = 4,
      ...otherConfig
    } = execConfig;

    // Handle both date_range format and direct start_date/end_date format
    let startDate, endDate;

    if (date_range) {
      startDate = date_range.start_date || '2025-01-01';
      endDate = date_range.end_date || '2025-11-01';
    } else if (start_date && end_date) {
      startDate = start_date;
      endDate = end_date;
    } else {
      // Default to reasonable range
      startDate = '2025-01-01';
      endDate = '2025-11-01';
    }

    // Validate and ensure start_date is before end_date
    if (startDate >= endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setTime(end.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days before end
      startDate = start.toISOString().split('T')[0];
    }
    let scannerCode = '';

    // Get scanner code from stored project
    if (project.code) {
      scannerCode = project.code;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Project does not contain scanner code'
        },
        { status: 400 }
      );
    }

      console.log(`🔧 Using FastApiScanService for project execution`);
    console.log(`📅 Date range: ${startDate} to ${endDate}`);
    console.log(`📝 Scanner code length: ${scannerCode.length} characters`);

    // Use the FastApiScanService instead of calling Python backend directly
    // This will handle date validation and prevent 422 errors
    try {
      const scanRequest = {
        start_date: startDate,
        end_date: endDate,
        scanner_type: 'uploaded',
        uploaded_code: scannerCode,
        use_real_scan: true,
        function_name: project.functionName,
        parallel_execution: true,
        timeout_seconds: timeout_seconds
      };

      console.log('📊 Sending scan request to FastApiScanService:', scanRequest);

      // Use the FastApiScanService which has date validation built-in
      const backendResponse = await fastApiScanService.executeScan(scanRequest);

      // FastApiScanService returns a ScanResponse directly
      const backendResult = backendResponse;
      console.log(`✅ Backend execution completed:`, backendResult);

      // Transform the response to match the project execution format
      const response = {
        success: backendResult.success || true,
        execution_id: backendResult.scan_id || `exec_${Date.now()}`,
        message: backendResult.message || 'Project execution completed successfully',
        scan_id: backendResult.scan_id,
        status: 'completed', // Changed from 'started' to 'completed' since we now get synchronous results
        timestamp: new Date().toISOString(),
        // Include the actual scan results from the backend
        results: backendResult.results || [],
        total_found: backendResult.total_found || (backendResult.results ? backendResult.results.length : 0),
        execution_time: backendResult.execution_time || null
      };

      console.log(`✅ Project execution API response with results:`, {
        success: response.success,
        results_count: response.results.length,
        total_found: response.total_found,
        execution_id: response.execution_id
      });

      return NextResponse.json(response);

    } catch (error: any) {
      console.error(`❌ Backend request failed:`, error);

      // Handle rate limiting specifically with helpful message
      if (error?.message && error.message.includes('429 Too Many Requests')) {
        return NextResponse.json(
          {
            success: false,
            error: 'API Rate Limit Exceeded',
            details: 'The scanner is working correctly but hit Polygon API rate limits. Please wait a few minutes and try again. This is a common issue when running multiple scans quickly.',
            suggestion: 'Wait 2-3 minutes before running another scan to allow API limits to reset.',
            timestamp: new Date().toISOString()
          },
          { status: 429 }
        );
      }

      // Return a more informative error for debugging
      return NextResponse.json(
        {
          success: false,
          error: `Backend request failed: ${error.name}`,
          details: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Project execution API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for execution status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('execution_id');
    const scanId = searchParams.get('scan_id');

    if (!executionId && !scanId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing execution_id or scan_id parameter'
        },
        { status: 400 }
      );
    }

    // Forward to backend status endpoint
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5666';
    const statusId = executionId || scanId;

    console.log(`🔍 Checking execution status: ${statusId}`);

    const backendResponse = await fetch(`${backendUrl}/api/scan/status/${statusId}`);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`❌ Backend status check failed:`, errorText);

      return NextResponse.json(
        {
          success: false,
          error: `Status check failed: ${backendResponse.status}`,
          details: errorText.substring(0, 500)
        },
        { status: backendResponse.status }
      );
    }

    const statusResult = await backendResponse.json();
    console.log(`✅ Backend status response:`, statusResult);

    // Transform to match project execution status format
    const response = {
      success: true,
      execution_id: statusId,
      status: statusResult.status,
      progress_percent: statusResult.progress_percent || 0,
      message: statusResult.message || '',
      results: statusResult.results || null,
      total_found: statusResult.total_found || 0,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Project execution status API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown status error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}