/**
 * Parameter Master API
 * Full CRUD operations on scanner parameters
 */

import { NextRequest, NextResponse } from 'next/server';
import { getParameterMaster } from '@/services/parameterMasterService';

// GET /api/parameters - Retrieve parameters or templates
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const scannerType = searchParams.get('scanner_type') || 'lc_d2';
    const action = searchParams.get('action') || 'parameters';
    const templateId = searchParams.get('template_id');

    const paramMaster = getParameterMaster();

    let result;

    switch (action) {
      case 'parameters':
        // Get all parameters for scanner type
        result = {
          success: true,
          scanner_type: scannerType,
          parameters: paramMaster.getParametersForScanner(scannerType)
        };
        break;

      case 'mass':
        // Get mass parameters (apply to all)
        result = {
          success: true,
          parameters: paramMaster.getMassParameters()
        };
        break;

      case 'individual':
        // Get individual parameters for scanner type
        result = {
          success: true,
          scanner_type: scannerType,
          parameters: paramMaster.getIndividualParameters(scannerType)
        };
        break;

      case 'parameter':
        // Get specific parameter
        const paramId = searchParams.get('parameter_id');
        if (!paramId) {
          return NextResponse.json({
            success: false,
            error: 'parameter_id is required'
          }, { status: 400 });
        }
        const param = paramMaster.getParameter(paramId);
        result = {
          success: !!param,
          parameter: param
        };
        break;

      case 'templates':
        // Get templates for scanner type
        result = {
          success: true,
          scanner_type: scannerType,
          templates: paramMaster.getTemplates(scannerType)
        };
        break;

      case 'template':
        // Get specific template
        if (!templateId) {
          return NextResponse.json({
            success: false,
            error: 'template_id is required'
          }, { status: 400 });
        }
        const template = paramMaster.getTemplate(templateId);
        result = {
          success: !!template,
          template: template
        };
        break;

      case 'validate':
        // Validate parameters
        const validateType = searchParams.get('validate_type'); // 'parameter' or 'template'
        const validateId = searchParams.get('validate_id');

        if (!validateId) {
          return NextResponse.json({
            success: false,
            error: 'validate_id is required'
          }, { status: 400 });
        }

        if (validateType === 'template') {
          const validationResult = paramMaster.validateTemplate(validateId);
          result = {
            success: validationResult.valid,
            validation: validationResult
          };
        } else {
          // Validate single parameter (need value from body)
          result = {
            success: false,
            error: 'Use POST to validate parameter values'
          };
        }
        break;

      case 'suggestions':
        // Get optimization suggestions
        result = {
          success: true,
          scanner_type: scannerType,
          suggestions: paramMaster.getOptimizationSuggestions(scannerType)
        };
        break;

      case 'conflicts':
        // Detect parameter conflicts
        result = {
          success: true,
          scanner_type: scannerType,
          conflicts: paramMaster.detectConflicts(scannerType)
        };
        break;

      case 'stats':
        // Get service statistics
        result = {
          success: true,
          stats: paramMaster.getStats()
        };
        break;

      case 'export':
        // Export parameters to JSON
        const exportType = searchParams.get('export_type') || 'scanner_type';
        const json = paramMaster.exportParameters(exportType === 'all' ? undefined : scannerType);
        result = {
          success: true,
          json: json,
          count: JSON.parse(json).length
        };
        break;

      default:
        result = {
          success: false,
          error: 'Unknown action. Use: parameters, mass, individual, parameter, templates, template, validate, suggestions, conflicts, stats, export'
        };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Parameter GET API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/parameters - Create or validate parameters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const paramMaster = getParameterMaster();

    let result;

    switch (action) {
      case 'create':
        // Create new parameter
        try {
          const created = paramMaster.createParameter(data.parameter);
          result = {
            success: true,
            message: 'Parameter created successfully',
            parameter: created
          };
        } catch (error) {
          result = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create parameter'
          };
        }
        break;

      case 'update':
        // Update parameter
        const updated = paramMaster.updateParameter(data.parameter_id, data.updates);
        result = {
          success: updated,
          message: updated ? 'Parameter updated successfully' : 'Parameter not found'
        };
        break;

      case 'delete':
        // Delete parameter
        const deleted = paramMaster.deleteParameter(data.parameter_id);
        result = {
          success: deleted,
          message: deleted ? 'Parameter deleted successfully' : 'Parameter not found'
        };
        break;

      case 'validate_parameter':
        // Validate a parameter value
        const validationResult = paramMaster.validateParameterValue(
          data.parameter_id,
          data.value
        );
        result = {
          success: validationResult.valid,
          validation: validationResult
        };
        break;

      case 'validate_template':
        // Validate all parameters in a template
        const templateValidation = paramMaster.validateTemplate(data.template_id);
        result = {
          success: templateValidation.valid,
          validation: templateValidation
        };
        break;

      case 'save_template':
        // Save a parameter template
        try {
          const template = paramMaster.saveTemplate(data.template);
          result = {
            success: true,
            message: 'Template saved successfully',
            template: template
          };
        } catch (error) {
          result = {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to save template'
          };
        }
        break;

      case 'apply_template':
        // Apply a template (update current values)
        const applied = paramMaster.applyTemplate(data.template_id);
        result = {
          success: true,
          message: 'Template applied successfully'
        };
        break;

      case 'delete_template':
        // Delete a template
        const templateDeleted = paramMaster.deleteTemplate(data.template_id);
        result = {
          success: templateDeleted,
          message: templateDeleted ? 'Template deleted successfully' : 'Template not found or cannot delete default'
        };
        break;

      case 'import':
        // Import parameters from JSON
        const importResult = paramMaster.importParameters(data.json);
        result = {
          success: importResult.success,
          imported: importResult.imported,
          errors: importResult.errors
        };
        break;

      default:
        result = {
          success: false,
          error: 'Unknown action. Use: create, update, delete, validate_parameter, validate_template, save_template, apply_template, delete_template, import'
        };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Parameter POST API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT /api/parameters - Update parameters or templates
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const paramMaster = getParameterMaster();

    let result;

    switch (action) {
      case 'update_parameter':
        // Update a parameter (alias for POST update)
        const updated = paramMaster.updateParameter(data.parameter_id, data.updates);
        result = {
          success: updated,
          message: updated ? 'Parameter updated successfully' : 'Parameter not found'
        };
        break;

      case 'update_template':
        // Update a template
        const template = paramMaster.getTemplate(data.template_id);
        if (template) {
          const updatedTemplate = paramMaster.updateTemplate(data.template_id, data.updates);
          result = {
            success: true,
            message: 'Template updated successfully',
            template: updatedTemplate
          };
        } else {
          result = {
            success: false,
            error: 'Template not found'
          };
        }
        break;

      default:
        result = {
          success: false,
          error: 'Unknown action. Use: update_parameter, update_template'
        };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Parameter PUT API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/parameters - Delete parameters or templates
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'delete';
    const parameterId = searchParams.get('parameter_id');
    const templateId = searchParams.get('template_id');

    const paramMaster = getParameterMaster();

    let result;

    if (action === 'delete_parameter' && parameterId) {
      const deleted = paramMaster.deleteParameter(parameterId);
      result = {
        success: deleted,
        message: deleted ? 'Parameter deleted successfully' : 'Parameter not found'
      };
    } else if (action === 'delete_template' && templateId) {
      const deleted = paramMaster.deleteTemplate(templateId);
      result = {
        success: deleted,
        message: deleted ? 'Template deleted successfully' : 'Template not found or cannot delete default'
      };
    } else {
      result = {
        success: false,
        error: 'Missing required parameters or unknown action'
      };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Parameter DELETE API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
