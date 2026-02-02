import { NextRequest, NextResponse } from 'next/server';
import { renataValidator, type ComprehensiveValidation, type ValidationOptions } from '@/services/renataValidator';

/**
 * Renata Code Validation API
 *
 * Validates AI-generated scanner code before execution
 * Checks structure, syntax, and logic in ~3 seconds
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, scannerType, strictMode = false, checkRuleCompliance = true } = body;

    // Validate required fields
    if (!code) {
      return NextResponse.json({
        success: false,
        error: 'Code is required for validation'
      }, { status: 400 });
    }

    console.log('🔍 Renata Validation API called');
    console.log(`📊 Scanner type: ${scannerType || 'not specified'}`);
    console.log(`📏 Code length: ${code.length} characters`);

    // Run comprehensive validation
    const validation: ComprehensiveValidation = await renataValidator.validate(code, {
      scannerType,
      strictMode,
      checkRuleCompliance
    });

    console.log(`✅ Validation complete: ${validation.overall.score}/100 (${validation.overall.status})`);
    console.log(`⏱️  Validation time: ${validation.executionTime}ms`);

    // Format response for clarity
    const response = {
      success: true,
      validation,

      // Quick summary
      summary: {
        overallScore: validation.overall.score,
        status: validation.overall.status,
        passed: validation.overall.passed,
        canDeploy: validation.overall.canDeploy,
        totalIssues: validation.structure.issues.length +
                     validation.syntax.issues.length +
                     validation.logic.issues.length,
        criticalIssues: validation.structure.issues.filter(i => i.severity === 'critical').length +
                         validation.syntax.issues.filter(i => i.severity === 'critical').length +
                         validation.logic.issues.filter(i => i.severity === 'critical').length,
        errorIssues: validation.structure.issues.filter(i => i.severity === 'error').length +
                      validation.syntax.issues.filter(i => i.severity === 'error').length +
                      validation.logic.issues.filter(i => i.severity === 'error').length,
        warningIssues: validation.structure.issues.filter(i => i.severity === 'warning').length +
                        validation.syntax.issues.filter(i => i.severity === 'warning').length +
                        validation.logic.issues.filter(i => i.severity === 'warning').length
      },

      // Recommendations
      recommendations: validation.overall.recommendations,

      // Detailed breakdown
      breakdown: {
        structure: {
          score: validation.structure.score,
          passed: validation.structure.passed,
          issueCount: validation.structure.issues.length,
          issues: validation.structure.issues
        },
        syntax: {
          score: validation.syntax.score,
          passed: validation.syntax.passed,
          issueCount: validation.syntax.issues.length,
          issues: validation.syntax.issues
        },
        logic: {
          score: validation.logic.score,
          passed: validation.logic.passed,
          issueCount: validation.logic.issues.length,
          issues: validation.logic.issues
        }
      },

      metadata: {
        validationTime: validation.executionTime,
        timestamp: validation.timestamp,
        validatorVersion: '1.0.0'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Validation API error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
