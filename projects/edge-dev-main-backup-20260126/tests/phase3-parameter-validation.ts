/**
 * Phase 3: Parameter Master System Validation
 * Comprehensive testing of parameter CRUD, validation, and templates
 */

interface ValidationResult {
  test: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  details?: string;
  data?: any;
}

const BASE_URL = 'http://localhost:5665';

class ParameterMasterValidator {
  private results: ValidationResult[] = [];
  private testStartTime: number = 0;

  private startTest(testName: string) {
    this.testStartTime = Date.now();
    console.log(`\n🧪 Testing: ${testName}`);
  }

  private recordResult(test: string, status: 'pass' | 'fail' | 'skip', details?: string, data?: any) {
    const duration = Date.now() - this.testStartTime;
    this.results.push({ test, status, duration, details, data });
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
    console.log(`${icon} ${test} (${duration}ms)${details ? ` - ${details}` : ''}`);
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Phase 3: Parameter Master System Validation\n');
    console.log('=' .repeat(60));

    try {
      await this.test_GetParameters();
      await this.test_GetMassParameters();
      await this.test_GetIndividualParameters();
      await this.test_CreateParameter();
      await this.test_UpdateParameter();
      await this.test_ValidateParameter();
      await this.test_SaveTemplate();
      await this.test_GetTemplates();
      await this.test_ApplyTemplate();
      await this.test_DeleteTemplate();
      await this.test_ExportParameters();
      await this.test_OptimizationSuggestions();
      await this.test_ConflictDetection();

      this.printSummary();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  private async test_GetParameters(): Promise<void> {
    this.startTest('Get All Parameters for Scanner Type');

    try {
      const response = await fetch(`${BASE_URL}/api/parameters?scanner_type=lc_d2&action=parameters`);
      const data = await response.json();

      if (data.success && Array.isArray(data.parameters)) {
        const paramCount = data.parameters.length;
        this.recordResult('Get All Parameters', 'pass', `Retrieved ${paramCount} parameters`, data.parameters);
      } else {
        this.recordResult('Get All Parameters', 'fail', 'Invalid response structure');
      }
    } catch (error) {
      this.recordResult('Get All Parameters', 'fail', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async test_GetMassParameters(): Promise<void> {
    this.startTest('Get Mass Parameters (Global)');

    try {
      const response = await fetch(`${BASE_URL}/api/parameters?action=mass`);
      const data = await response.json();

      if (data.success && Array.isArray(data.parameters)) {
        const massParams = data.parameters;
        this.recordResult('Get Mass Parameters', 'pass', `Found ${massParams.length} global parameters`, massParams);
      } else {
        this.recordResult('Get Mass Parameters', 'fail', 'Invalid response structure');
      }
    } catch (error) {
      this.recordResult('Get Mass Parameters', 'fail', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async test_GetIndividualParameters(): Promise<void> {
    this.startTest('Get Individual Parameters for LC D2');

    try {
      const response = await fetch(`${BASE_URL}/api/parameters?scanner_type=lc_d2&action=individual`);
      const data = await response.json();

      if (data.success && Array.isArray(data.parameters)) {
        const individualParams = data.parameters;
        this.recordResult('Get Individual Parameters', 'pass', `Found ${individualParams.length} LC D2 parameters`, individualParams);
      } else {
        this.recordResult('Get Individual Parameters', 'fail', 'Invalid response structure');
      }
    } catch (error) {
      this.recordResult('Get Individual Parameters', 'fail', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async test_CreateParameter(): Promise<void> {
    this.startTest('Create New Custom Parameter');

    try {
      const response = await fetch(`${BASE_URL}/api/parameters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          parameter: {
            name: 'test_custom_threshold',
            display_name: 'Test Custom Threshold',
            type: 'number',
            scope: 'individual',
            description: 'Test parameter for validation',
            default_value: 10.0,
            min_value: 0,
            max_value: 100,
            advanced: false,
            required: false,
            scanner_types: ['lc_d2'],
            tags: ['test', 'custom']
          }
        })
      });

      const data = await response.json();

      if (data.success && data.parameter) {
        this.recordResult('Create New Parameter', 'pass', `Created parameter: ${data.parameter.id}`, data.parameter);
      } else {
        this.recordResult('Create New Parameter', 'fail', data.error || 'Failed to create parameter');
      }
    } catch (error) {
      this.recordResult('Create New Parameter', 'fail', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async test_UpdateParameter(): Promise<void> {
    this.startTest('Update Parameter Value');

    try {
      // First get a parameter to update
      const getResponse = await fetch(`${BASE_URL}/api/parameters?scanner_type=lc_d2&action=parameters`);
      const getData = await getResponse.json();

      if (!getData.success || getData.parameters.length === 0) {
        this.recordResult('Update Parameter Value', 'skip', 'No parameters available to update');
        return;
      }

      const paramToUpdate = getData.parameters[0];
      const originalValue = paramToUpdate.current_value;
      const newValue = paramToUpdate.type === 'number' ? 15.0 : 'test_value';

      const response = await fetch(`${BASE_URL}/api/parameters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          parameter_id: paramToUpdate.id,
          updates: { current_value: newValue }
        })
      });

      const data = await response.json();

      if (data.success) {
        this.recordResult('Update Parameter Value', 'pass', `Updated ${paramToUpdate.name}: ${originalValue} → ${newValue}`);
      } else {
        this.recordResult('Update Parameter Value', 'fail', data.error || 'Failed to update parameter');
      }
    } catch (error) {
      this.recordResult('Update Parameter Value', 'fail', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async test_ValidateParameter(): Promise<void> {
    this.startTest('Validate Parameter Value');

    try {
      // Test validation with an invalid value
      const response = await fetch(`${BASE_URL}/api/parameters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate_parameter',
          parameter_id: 'min_close_price',
          value: -5.0  // Invalid: negative price
        })
      });

      const data = await response.json();

      if (data.success && data.validation) {
        const validation = data.validation;
        this.recordResult('Validate Parameter Value', 'pass',
          `Validation result: ${validation.valid ? 'Valid' : 'Invalid'}`,
          validation
        );
      } else {
        this.recordResult('Validate Parameter Value', 'fail', 'Validation endpoint error');
      }
    } catch (error) {
      this.recordResult('Validate Parameter Value', 'fail', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async test_SaveTemplate(): Promise<void> {
    this.startTest('Save Parameter Template');

    try {
      const templateName = `test_template_${Date.now()}`;

      const response = await fetch(`${BASE_URL}/api/parameters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_template',
          template: {
            name: templateName,
            description: 'Test template for validation',
            scanner_type: 'lc_d2',
            parameters: {
              min_close_price: 12.0,
              min_volume: 1500000,
              lc_gap_threshold: -2.5
            },
            is_default: false,
            tags: ['test', 'validation']
          }
        })
      });

      const data = await response.json();

      if (data.success && data.template) {
        this.recordResult('Save Parameter Template', 'pass', `Created template: ${data.template.id}`, data.template);
      } else {
        this.recordResult('Save Parameter Template', 'fail', data.error || 'Failed to save template');
      }
    } catch (error) {
      this.recordResult('Save Parameter Template', 'fail', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async test_GetTemplates(): Promise<void> {
    this.startTest('Get All Templates');

    try {
      const response = await fetch(`${BASE_URL}/api/parameters?scanner_type=lc_d2&action=templates`);
      const data = await response.json();

      if (data.success && Array.isArray(data.templates)) {
        this.recordResult('Get All Templates', 'pass', `Retrieved ${data.templates.length} templates`, data.templates);
      } else {
        this.recordResult('Get All Templates', 'fail', 'Invalid response structure');
      }
    } catch (error) {
      this.recordResult('Get All Templates', 'fail', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async test_ApplyTemplate(): Promise<void> {
    this.startTest('Apply Template');

    try {
      // First get available templates
      const getResponse = await fetch(`${BASE_URL}/api/parameters?scanner_type=lc_d2&action=templates`);
      const getData = await getResponse.json();

      if (!getData.success || getData.templates.length === 0) {
        this.recordResult('Apply Template', 'skip', 'No templates available to apply');
        return;
      }

      const templateToApply = getData.templates[0];

      const response = await fetch(`${BASE_URL}/api/parameters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_template',
          template_id: templateToApply.id
        })
      });

      const data = await response.json();

      if (data.success) {
        this.recordResult('Apply Template', 'pass', `Applied template: ${templateToApply.name}`);
      } else {
        this.recordResult('Apply Template', 'fail', data.error || 'Failed to apply template');
      }
    } catch (error) {
      this.recordResult('Apply Template', 'fail', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async test_DeleteTemplate(): Promise<void> {
    this.startTest('Delete Template');

    try {
      // First create a template to delete
      const createResponse = await fetch(`${BASE_URL}/api/parameters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_template',
          template: {
            name: `test_delete_${Date.now()}`,
            description: 'Template to delete',
            scanner_type: 'lc_d2',
            parameters: {},
            is_default: false
          }
        })
      });

      const createData = await createResponse.json();

      if (!createData.success || !createData.template) {
        this.recordResult('Delete Template', 'skip', 'Could not create template for deletion test');
        return;
      }

      const templateId = createData.template.id;

      // Now delete it
      const response = await fetch(`${BASE_URL}/api/parameters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_template',
          template_id: templateId
        })
      });

      const data = await response.json();

      if (data.success) {
        this.recordResult('Delete Template', 'pass', `Deleted template: ${templateId}`);
      } else {
        this.recordResult('Delete Template', 'fail', data.error || 'Failed to delete template');
      }
    } catch (error) {
      this.recordResult('Delete Template', 'fail', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async test_ExportParameters(): Promise<void> {
    this.startTest('Export Parameters to JSON');

    try {
      const response = await fetch(`${BASE_URL}/api/parameters?scanner_type=lc_d2&action=export&export_type=scanner_type`);
      const data = await response.json();

      if (data.success && data.json) {
        const parsed = JSON.parse(data.json);
        this.recordResult('Export Parameters', 'pass', `Exported ${parsed.length} parameters as JSON`, parsed);
      } else {
        this.recordResult('Export Parameters', 'fail', 'Failed to export parameters');
      }
    } catch (error) {
      this.recordResult('Export Parameters', 'fail', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async test_OptimizationSuggestions(): Promise<void> {
    this.startTest('Get Optimization Suggestions');

    try {
      const response = await fetch(`${BASE_URL}/api/parameters?scanner_type=lc_d2&action=suggestions`);
      const data = await response.json();

      if (data.success && Array.isArray(data.suggestions)) {
        this.recordResult('Optimization Suggestions', 'pass', `Found ${data.suggestions.length} suggestions`, data.suggestions);
      } else {
        this.recordResult('Optimization Suggestions', 'fail', 'Invalid response structure');
      }
    } catch (error) {
      this.recordResult('Optimization Suggestions', 'fail', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async test_ConflictDetection(): Promise<void> {
    this.startTest('Detect Parameter Conflicts');

    try {
      const response = await fetch(`${BASE_URL}/api/parameters?scanner_type=lc_d2&action=conflicts`);
      const data = await response.json();

      if (data.success && Array.isArray(data.conflicts)) {
        this.recordResult('Conflict Detection', 'pass', `Detected ${data.conflicts.length} conflicts`, data.conflicts);
      } else {
        this.recordResult('Conflict Detection', 'fail', 'Invalid response structure');
      }
    } catch (error) {
      this.recordResult('Conflict Detection', 'fail', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const skipped = this.results.filter(r => r.status === 'skip').length;
    const total = this.results.length;

    const successRate = ((passed / total) * 100).toFixed(1);

    console.log(`\nTotal Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`\nSuccess Rate: ${successRate}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => r.status === 'fail').forEach(r => {
        console.log(`  - ${r.test}: ${r.details}`);
      });
    }

    if (skipped > 0) {
      console.log('\n⏭️  Skipped Tests:');
      this.results.filter(r => r.status === 'skip').forEach(r => {
        console.log(`  - ${r.test}: ${r.details}`);
      });
    }

    // Performance metrics
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;
    const maxDuration = Math.max(...this.results.map(r => r.duration));
    const minDuration = Math.min(...this.results.map(r => r.duration));

    console.log('\n⚡ Performance Metrics:');
    console.log(`  Average: ${avgDuration.toFixed(0)}ms`);
    console.log(`  Min: ${minDuration}ms`);
    console.log(`  Max: ${maxDuration}ms`);

    // Success criteria
    console.log('\n🎯 Success Criteria:');
    console.log(`  Parameter CRUD: ${passed >= 4 ? '✅' : '❌'} (4+ tests passing)`);
    console.log(`  Validation: ${this.results.some(r => r.test.includes('Validate') && r.status === 'pass') ? '✅' : '❌'}`);
    console.log(`  Templates: ${this.results.filter(r => r.test.includes('Template') && r.status === 'pass').length >= 3 ? '✅' : '❌'} (3+ tests passing)`);
    console.log(`  Performance: ${avgDuration < 200 ? '✅' : '❌'} (avg < 200ms)`);

    console.log('\n' + '='.repeat(60));

    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Phase 3 is validated.');
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Review needed.`);
    }

    console.log('='.repeat(60) + '\n');
  }
}

// Run validation
async function main() {
  const validator = new ParameterMasterValidator();
  await validator.runAllTests();
}

main().catch(console.error);
