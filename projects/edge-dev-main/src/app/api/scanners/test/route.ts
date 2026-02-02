import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, language, testParams } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing scanner:', {
      language,
      codeLength: code.length,
      dryRun: testParams?.dryRun
    });

    // Basic validation of the Python scanner code
    const validation = validatePythonScanner(code);

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        errors: validation.errors,
        message: '❌ Scanner validation failed'
      });
    }

    // Simulate test execution
    const testResult = {
      success: true,
      message: '✅ Scanner validation passed successfully!',
      validation,
      execution: {
        functionName: validation.functionName,
        hasParameters: validation.hasParameters,
        hasMarketDataAccess: validation.hasMarketDataAccess,
        codeQuality: validation.codeQuality,
        estimatedPerformance: validation.estimatedPerformance
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(testResult);

  } catch (error) {
    console.error('Scanner test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test scanner',
        message: 'Please check your code and try again'
      },
      { status: 500 }
    );
  }
}

function validatePythonScanner(code: string) {
  const errors: string[] = [];
  let isValid = true;

  // Check for required function
  const functionMatch = code.match(/def\s+(\w+)\s*\(/);
  const functionName = functionMatch?.[1] || null;

  if (!functionName) {
    errors.push('No valid function found - scanner must have a main function');
    isValid = false;
  }

  if (functionName && !functionName.includes('scan')) {
    errors.push('Function name should include "scan" for clarity');
  }

  // Check for parameters
  const hasParameters = code.includes('P = {') || code.includes('parameters');

  // Check for market data access
  const hasMarketDataAccess = code.includes('data[') || code.includes('.iloc[') || code.includes('.ewm(');

  // Basic code quality checks
  const hasReturnStatement = code.includes('return');
  const hasTryCatch = code.includes('try:') || code.includes('except');
  const hasDocumentation = code.includes('"""') || code.includes("'''");

  const codeQuality = {
    hasReturnStatement,
    hasErrorHandling: hasTryCatch,
    hasDocumentation,
    score: calculateQualityScore(hasReturnStatement, hasTryCatch, hasDocumentation)
  };

  return {
    isValid,
    errors,
    functionName,
    hasParameters,
    hasMarketDataAccess,
    codeQuality,
    estimatedPerformance: hasMarketDataAccess ? 'Optimized' : 'Basic'
  };
}

function calculateQualityScore(hasReturn: boolean, hasErrorHandling: boolean, hasDocs: boolean): number {
  let score = 0;
  if (hasReturn) score += 30;
  if (hasErrorHandling) score += 30;
  if (hasDocs) score += 40;
  return score;
}