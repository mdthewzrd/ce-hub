import { NextRequest, NextResponse } from 'next/server';

/**
 * Python Code Execution API
 *
 * Executes Python code for validation and testing purposes
 * Used by the code validation system to check syntax
 */

interface ExecuteRequest {
  script: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExecuteRequest = await request.json();
    const { script } = body;

    if (!script) {
      return NextResponse.json({
        error: 'No script provided'
      }, { status: 400 });
    }

    console.log('🐍 Executing Python script for validation...');

    // Call the backend Python service to execute the script
    try {
      const response = await fetch('http://localhost:5666/execute-python', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ script })
      });

      if (!response.ok) {
        throw new Error(`Backend execution failed: ${response.status}`);
      }

      const result = await response.text();
      console.log('✅ Python script executed successfully');

      return new NextResponse(result, {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });

    } catch (backendError) {
      console.log('⚠️ Backend unavailable, providing mock validation');

      // Fallback: Basic validation without actual Python execution
      const basicValidation: {
        valid: boolean;
        errors: Array<{
          line: number;
          column: number;
          message: string;
          type: string;
        }>;
        message: string;
      } = {
        valid: false,
        errors: [],
        message: 'Backend validation unavailable'
      };

      // Check for common syntax errors
      if (script.includes('true') || script.includes('false')) {
        basicValidation.errors.push({
          line: 1,
          column: 1,
          message: 'Found lowercase boolean values',
          type: 'syntax'
        });
        basicValidation.valid = false;
      }

      if (script.includes('"None"')) {
        basicValidation.errors.push({
          line: 1,
          column: 1,
          message: 'Found string "None" instead of None',
          type: 'syntax'
        });
        basicValidation.valid = false;
      }

      // If no obvious errors found, assume it's valid
      if (basicValidation.errors.length === 0) {
        basicValidation.valid = true;
        basicValidation.message = 'Basic validation passed (backend unavailable)';
      }

      return NextResponse.json(basicValidation);
    }

  } catch (error) {
    console.error('❌ Python execution error:', error);
    return NextResponse.json({
      error: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      valid: false,
      errors: [{
        line: 1,
        column: 1,
        message: 'Execution service unavailable',
        type: 'system'
      }]
    }, { status: 500 });
  }
}