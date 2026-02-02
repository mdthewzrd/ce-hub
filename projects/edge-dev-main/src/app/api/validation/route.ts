/**
 * Validation Testing API
 * Run validation tests, compare scanners, and generate reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { getValidationTestingService } from '@/services/validationTestingService';
import type { ValidationLevel, TestType } from '@/services/validationTestingService';

// POST /api/validation - Run validation tests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const validationService = getValidationTestingService();

    let result;

    switch (action) {
      case 'run':
        // Run validation suite
        const summary = await validationService.runValidation(
          data.level || 'standard',
          data.scanner_types
        );
        result = {
          success: true,
          summary
        };
        break;

      case 'test':
        // Run single test case
        if (!data.test_case_id) {
          return NextResponse.json({
            success: false,
            error: 'test_case_id is required'
          }, { status: 400 });
        }

        const suite = validationService.getTestSuiteById(data.suite_id);
        if (!suite) {
          return NextResponse.json({
            success: false,
            error: 'Test suite not found'
          }, { status: 404 });
        }

        const testCase = suite.test_cases.find(tc => tc.id === data.test_case_id);
        if (!testCase) {
          return NextResponse.json({
            success: false,
            error: 'Test case not found'
          }, { status: 404 });
        }

        const testResult = await validationService.runTestCase(testCase);
        result = {
          success: true,
          result: testResult
        };
        break;

      case 'compare':
        // Compare two scanners
        if (!data.scanner_a || !data.scanner_b) {
          return NextResponse.json({
            success: false,
            error: 'Both scanner_a and scanner_b are required'
          }, { status: 400 });
        }

        const comparison = validationService.compareScanners(data.scanner_a, data.scanner_b);
        result = {
          success: true,
          comparison
        };
        break;

      case 'regression':
        // Run regression test suite
        if (!data.baseline_version || !data.current_version) {
          return NextResponse.json({
            success: false,
            error: 'Both baseline_version and current_version are required'
          }, { status: 400 });
        }

        const regressionReport = await validationService.runRegressionTestSuite(
          data.baseline_version,
          data.current_version
        );
        result = {
          success: true,
          report: regressionReport
        };
        break;

      case 'create-suite':
        // Create custom test suite
        if (!data.name || !data.test_cases) {
          return NextResponse.json({
            success: false,
            error: 'name and test_cases are required'
          }, { status: 400 });
        }

        const newSuite: any = {
          id: `suite-${Date.now()}`,
          name: data.name,
          description: data.description || '',
          test_cases: data.test_cases,
          level: data.level || 'standard',
          created_at: new Date()
        };

        validationService.addTestSuite(newSuite);
        result = {
          success: true,
          suite: newSuite
        };
        break;

      case 'set-baseline':
        // Set baseline metrics
        if (!data.version || !data.metrics) {
          return NextResponse.json({
            success: false,
            error: 'version and metrics are required'
          }, { status: 400 });
        }

        validationService.setBaseline(data.version, data.metrics);
        result = {
          success: true,
          message: `Baseline set for version ${data.version}`
        };
        break;

      case 'clear-history':
        // Clear test history
        validationService.clearTestHistory();
        result = {
          success: true,
          message: 'Test history cleared'
        };
        break;

      default:
        result = {
          success: false,
          error: 'Unknown action. Use: run, test, compare, regression, create-suite, set-baseline, clear-history'
        };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Validation POST API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/validation - Get validation info and results
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'info';

    const validationService = getValidationTestingService();

    let result;

    switch (action) {
      case 'info':
        // Get service information
        result = {
          success: true,
          service: 'Validation Testing Service',
          version: '1.0.0',
          available_levels: ['basic', 'standard', 'comprehensive', 'exhaustive'],
          available_types: ['single-scan', 'multi-scan', 'integration', 'regression', 'performance'],
          supported_actions: [
            'run',
            'test',
            'compare',
            'regression',
            'create-suite',
            'set-baseline'
          ]
        };
        break;

      case 'suites':
        // Get all test suites
        result = {
          success: true,
          suites: validationService.getTestSuites()
        };
        break;

      case 'suite':
        // Get specific test suite
        const suiteId = searchParams.get('id');
        if (!suiteId) {
          return NextResponse.json({
            success: false,
            error: 'suite id is required'
          }, { status: 400 });
        }

        const suite = validationService.getTestSuiteById(suiteId);
        if (!suite) {
          return NextResponse.json({
            success: false,
            error: `Suite '${suiteId}' not found`
          }, { status: 404 });
        }

        result = {
          success: true,
          suite
        };
        break;

      case 'history':
        // Get test history
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
        result = {
          success: true,
          history: validationService.getTestHistory(limit)
        };
        break;

      case 'baseline':
        // Get baseline metrics
        const version = searchParams.get('version');
        if (!version) {
          return NextResponse.json({
            success: false,
            error: 'version is required'
          }, { status: 400 });
        }

        const baseline = validationService.getBaseline(version);
        if (!baseline) {
          return NextResponse.json({
            success: false,
            error: `Baseline for version '${version}' not found`
          }, { status: 404 });
        }

        result = {
          success: true,
          baseline
        };
        break;

      case 'metrics':
        // Get accuracy and performance metrics
        const history = validationService.getTestHistory(100);

        if (history.length === 0) {
          result = {
            success: true,
            metrics: {
              accuracy: null,
              performance: null,
              message: 'No test history available'
            }
          };
        } else {
          const accuracyMetrics = validationService.calculateAccuracyMetrics(history);
          const performanceMetrics = validationService.calculatePerformanceMetrics(history);

          result = {
            success: true,
            metrics: {
              accuracy: accuracyMetrics,
              performance: performanceMetrics
            }
          };
        }
        break;

      case 'recommendations':
        // Get recommendations based on test history
        const recHistory = validationService.getTestHistory(50);

        if (recHistory.length === 0) {
          result = {
            success: true,
            recommendations: [
              'Run validation tests to get recommendations'
            ]
          };
        } else {
          const accuracy = validationService.calculateAccuracyMetrics(recHistory);
          const performance = validationService.calculatePerformanceMetrics(recHistory);

          result = {
            success: true,
            accuracy,
            performance,
            recommendations: [
              'Validation complete - review metrics above',
              `Accuracy: ${JSON.stringify(accuracy)}`,
              `Performance: ${JSON.stringify(performance)}`
            ]
          };
        }
        break;

      default:
        result = {
          success: false,
          error: 'Unknown action. Use: info, suites, suite, history, baseline, metrics, recommendations'
        };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Validation GET API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
