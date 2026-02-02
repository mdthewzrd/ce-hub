import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Extract Polygon API parameters
  const ticker = searchParams.get('ticker');
  const multiplier = searchParams.get('multiplier') || '1';
  const timespan = searchParams.get('timespan') || 'day';
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const adjusted = searchParams.get('adjusted') || 'true';
  const sort = searchParams.get('sort') || 'asc';
  const limit = searchParams.get('limit') || '50000';

  // Validate required parameters
  if (!ticker || !from || !to) {
    return NextResponse.json(
      { error: 'Missing required parameters: ticker, from, to' },
      { status: 400 }
    );
  }

  try {
    // Get Polygon API key from environment variables
    const apiKey = process.env.POLYGON_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Polygon API key not configured' },
        { status: 500 }
      );
    }

    // Construct Polygon API URL
    const polygonUrl = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=${adjusted}&sort=${sort}&limit=${limit}&apikey=${apiKey}`;

    console.log(`🔗 PROXYING POLYGON API: ${polygonUrl.replace(apiKey, '***')}`);

    // Make request to Polygon API
    const response = await fetch(polygonUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Polygon API error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: `Polygon API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ Polygon API success for ${ticker}:`, data?.results?.length || 0, 'bars');

    // Return the data with proper CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('❌ Polygon proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}