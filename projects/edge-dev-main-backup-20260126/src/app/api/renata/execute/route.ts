/**
 * SCANNER EXECUTION API
 * =====================
 *
 * Executes scanner code and returns the signals it generates.
 * Used by the execution validator to compare original vs formatted scanners.
 */

import { NextRequest, NextResponse } from 'next/server';

export interface ExecutionRequest {
  code: string;
  dateRange: {
    start: string;
    end: string;
  };
  tickers?: string[];
  timeout?: number;
}

export interface ExecutionResponse {
  success: boolean;
  signals?: Array<{
    ticker: string;
    date: string;
    confidence?: number;
    [key: string]: any;
  }>;
  scannerType?: string;
  tickersTested?: number;
  error?: string;
  executionTime?: number;
}

/**
 * Execute a scanner by calling the Python backend
 */
export async function POST(request: NextRequest) {
  try {
    const body: ExecutionRequest = await request.json();

    // Validate request
    if (!body.code) {
      return NextResponse.json(
        { success: false, error: 'Missing scanner code' },
        { status: 400 }
      );
    }

    if (!body.dateRange || !body.dateRange.start || !body.dateRange.end) {
      return NextResponse.json(
        { success: false, error: 'Missing date range' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Call the Python backend to execute the scanner
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    // We need to save the scanner code to a temp file and execute it
    // For now, we'll use the existing scan endpoint with a temporary scanner
    const formData = new FormData();
    formData.append('scanner_code', body.code);
    formData.append('start_date', body.dateRange.start);
    formData.append('end_date', body.dateRange.end);

    if (body.tickers && body.tickers.length > 0) {
      formData.append('tickers', JSON.stringify(body.tickers));
    }

    const response = await fetch(`${backendUrl}/api/renata/execute-temp`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(body.timeout || 30000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          success: false,
          error: `Backend execution failed: ${response.status} ${response.statusText}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    const executionTime = Date.now() - startTime;

    // Transform backend response to our format
    const result: ExecutionResponse = {
      success: true,
      signals: data.results?.map((r: any) => ({
        ticker: r.T || r.ticker,
        date: r.Date || r.date || r.timestamp,
        confidence: r.confidence,
        ...r
      })) || [],
      scannerType: data.scanner_type || 'unknown',
      tickersTested: data.tickers_tested || 0,
      executionTime
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Execution API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check if execution service is available
 */
export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    const response = await fetch(`${backendUrl}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });

    const isHealthy = response.ok;

    return NextResponse.json({
      service: 'scanner-execution',
      status: isHealthy ? 'available' : 'unavailable',
      backendUrl,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      service: 'scanner-execution',
      status: 'unavailable',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
