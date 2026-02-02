import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      source_code,
      scanner_name,
      date_range = "2024-01-01 to 2024-12-31",
      verbose = true
    } = body;

    console.log('🚀 Starting RENATA_V2 transformation...', {
      code_length: source_code?.length,
      scanner_name,
      date_range
    });

    // Validate required parameters
    if (!source_code) {
      return NextResponse.json({
        success: false,
        error: 'source_code is required'
      }, { status: 400 });
    }

    // First check if RENATA_V2 service is healthy
    console.log('Checking RENATA_V2 service health...');
    const healthResponse = await fetch('http://localhost:5666/api/renata_v2/health', {
      method: 'GET'
    });

    if (!healthResponse.ok) {
      console.error('RENATA_V2 health check failed');
      return NextResponse.json({
        success: false,
        error: 'RENATA_V2 service is not available',
        details: 'Health check failed'
      }, { status: 503 });
    }

    const healthData = await healthResponse.json();
    console.log('✅ RENATA_V2 service health:', healthData);

    if (!healthData.available) {
      return NextResponse.json({
        success: false,
        error: 'RENATA_V2 service is not available',
        health: healthData
      }, { status: 503 });
    }

    // Create transformation payload
    const transformPayload = {
      source_code,
      scanner_name: scanner_name || null,
      date_range,
      verbose
    };

    console.log('Sending transformation request to Python backend...');

    // Call Python backend RENATA_V2 transformation endpoint
    const transformResponse = await fetch('http://localhost:5666/api/renata_v2/transform', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformPayload)
    });

    if (!transformResponse.ok) {
      const errorText = await transformResponse.text();
      console.error('RENATA_V2 transformation failed:', {
        status: transformResponse.status,
        errorText
      });
      return NextResponse.json({
        success: false,
        error: 'Transformation failed',
        details: errorText,
        status: transformResponse.status
      }, { status: transformResponse.status });
    }

    const transformResult = await transformResponse.json();
    console.log('✅ Transformation completed:', {
      success: transformResult.success,
      corrections_made: transformResult.corrections_made,
      code_length: transformResult.generated_code?.length
    });

    // Add cache-busting headers
    const response = NextResponse.json(transformResult);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;

  } catch (error) {
    console.error('RENATA_V2 API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint for frontend
  try {
    const response = await fetch('http://localhost:5666/api/renata_v2/health');

    if (!response.ok) {
      return NextResponse.json({
        available: false,
        error: 'RENATA_V2 service unavailable'
      }, { status: response.status });
    }

    const healthData = await response.json();
    return NextResponse.json(healthData);

  } catch (error) {
    return NextResponse.json({
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
