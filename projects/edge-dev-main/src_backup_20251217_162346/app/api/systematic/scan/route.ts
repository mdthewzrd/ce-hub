import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filters, scan_date, enable_progress = false } = body;

    console.log('Starting systematic scan with real backend only - NO MOCK DATA:', filters);

    // Always call the real Python backend on port 8000
    return await callRealPythonBackend(filters, scan_date, enable_progress);

  } catch (error) {
    console.error('Scan API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Call Real Python Backend on Port 8000 - NO FALLBACKS, NO MOCK DATA
async function callRealPythonBackend(filters: any, scan_date: string, enable_progress: boolean = false): Promise<NextResponse> {
  console.log('🔥 CALLING REAL PYTHON BACKEND - NO MOCK DATA:', { filters, scan_date, enable_progress });

  try {
    // Validate required parameters
    if (!scan_date) {
      throw new Error('scan_date is required');
    }

    // First check if the Python backend is healthy
    console.log('Checking Python backend health...');
    const healthResponse = await fetch('http://localhost:8000/api/health');
    if (!healthResponse.ok) {
      throw new Error(`Python backend health check failed: ${healthResponse.status}`);
    }

    const healthData = await healthResponse.json();
    console.log('✅ Python backend is healthy:', healthData);

    // Call the scan endpoint on the Python backend
    console.log('🚀 Executing real scan on Python backend...');

    // Create a proper date range with at least 1 day between start and end
    const scanDate = new Date(scan_date);
    const today = new Date();

    // Use scan_date as end_date, but don't exceed today
    let endDate = new Date(scanDate);
    if (endDate > today) {
      endDate = new Date(today);
    }

    // Set start_date to 7 days before end_date
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);

    const scanPayload = {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      use_real_scan: true,
      filters: filters || {},
      sophisticated_mode: true
    };

    console.log('Scan payload:', JSON.stringify(scanPayload, null, 2));

    const scanResponse = await fetch('http://localhost:8000/api/scan/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scanPayload)
    });

    if (!scanResponse.ok) {
      const errorText = await scanResponse.text();
      console.error('❌ Python scan failed:', { status: scanResponse.status, errorText });
      throw new Error(`Real Python scan failed: ${scanResponse.status} ${errorText}`);
    }

    const results = await scanResponse.json();
    console.log('✅ Real Python scan response:', results);

    // Transform the results to match the expected frontend format
    const transformedResults = transformPythonResultsToFrontendFormat(results.results || []);

    return NextResponse.json({
      success: true,
      results: transformedResults,
      scan_id: results.scan_id,
      message: `Real LC scan completed. Found ${transformedResults.length} qualifying tickers.`,
      total_found: transformedResults.length,
      execution_time: results.execution_time
    });

  } catch (error) {
    console.error('❌ CRITICAL: Python backend scan error:', error);

    // NO FALLBACK TO MOCK DATA - Return error so user knows backend is not working
    return NextResponse.json({
      success: false,
      error: 'Real scan execution failed - Python backend unavailable',
      details: error instanceof Error ? error.message : 'Unknown error',
      message: '❌ NO MOCK DATA - Real backend required. Please ensure Python backend is running on port 8000.',
      results: []
    }, { status: 500 });
  }
}

// Transform Python backend results to match frontend expected format
function transformPythonResultsToFrontendFormat(pythonResults: any[]): any[] {
  console.log(`🔄 Transforming ${pythonResults.length} Python results to frontend format...`);

  return pythonResults.map(result => {
    // Handle different possible field names from Python backend
    return {
      ticker: result.ticker || result.symbol || 'UNKNOWN',
      date: result.date || new Date().toISOString().split('T')[0],
      gap: result.gap || result.gap_pct || 0,
      pm_vol: result.pm_vol || result.volume || 0,
      prev_close: result.prev_close || result.close || 0,
      lc_frontside_d2_extended: Boolean(result.lc_frontside_d2_extended || result.lc_frontside_d2 || false),
      lc_frontside_d3_extended_1: Boolean(result.lc_frontside_d3_extended_1 || result.lc_frontside_d3 || false),
      parabolic_score: result.parabolic_score || result.score || 0,
      atr: result.atr || 1.0,
      high_chg_atr: result.high_chg_atr || 0,
      dist_h_9ema_atr: result.dist_h_9ema_atr || 0,
      dist_h_20ema_atr: result.dist_h_20ema_atr || 0,
      v_ua: result.v_ua || result.volume || 0,
      dol_v: result.dol_v || (result.volume * result.close) || 0,
      c_ua: result.c_ua || result.close || 0,
      close: result.close || 0,
      volume: result.volume || 0
    };
  });
}