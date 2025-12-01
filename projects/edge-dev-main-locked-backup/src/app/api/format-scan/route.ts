import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 API Route: Forwarding format-scan request to backend');

    // Check if the request is form data (file upload) or JSON (pasted code)
    const contentType = request.headers.get('content-type') || '';

    let code: string = '';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (file) {
        console.log('📁 Processing uploaded file:', file.name);
        code = await file.text();
      } else {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        );
      }
    } else {
      // Handle JSON request (pasted code)
      const body = await request.json();
      code = body.code || '';

      if (!code) {
        return NextResponse.json(
          { success: false, error: 'No code provided' },
          { status: 400 }
        );
      }
    }

    // Forward to backend API
    const backendUrl = 'http://localhost:5659/api/format/code';

    console.log('📤 Forwarding to backend:', backendUrl);
    console.log('📝 Code length:', code.length);

    // Make request to backend with JSON
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    console.log('📊 Backend response status:', response.status);

    // Get response data
    const responseData = await response.json();
    console.log('📦 Backend response received');

    // Return the backend response
    if (response.ok) {
      return NextResponse.json(responseData);
    } else {
      console.error('❌ Backend error:', responseData);
      return NextResponse.json(
        {
          success: false,
          error: responseData.error || 'Backend request failed',
          details: responseData
        },
        { status: response.status }
      );
    }

  } catch (error) {
    console.error('❌ API Route Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'API route error: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}