/**
 * Parameter Master Service
 * Full CRUD operations on scanner parameters with templates and validation
 */

// ========== TYPES ==========

export type ParameterType = 'number' | 'string' | 'boolean' | 'range' | 'array' | 'object';
export type ParameterScope = 'mass' | 'individual' | 'both';
export type ValidationRule = 'min' | 'max' | 'range' | 'pattern' | 'custom';

export interface ParameterDefinition {
  id: string;
  name: string;
  display_name: string;
  type: ParameterType;
  scope: ParameterScope;
  description?: string;
  default_value?: any;
  current_value?: any;
  validation?: ValidationRule[];
  options?: any[]; // For enum/select parameters
  min_value?: number;
  max_value?: number;
  step?: number; // For numeric parameters
  unit?: string; // e.g., "%", "$", "days"
  category?: string; // e.g., "Price", "Volume", "Time"
  advanced: boolean; // Show in advanced section?
  required: boolean;
  scanner_types: string[]; // Which scanners use this parameter
  tags: string[];
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface ParameterTemplate {
  id: string;
  name: string;
  description?: string;
  scanner_type: string;
  parameters: Record<string, any>; // Parameter ID -> value mapping
  created_at: Date;
  updated_at: Date;
  is_default: boolean;
  created_by?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  parameter_id: string;
  parameter_name: string;
  error: string;
  severity: 'critical' | 'error';
}

export interface ValidationWarning {
  parameter_id: string;
  parameter_name: string;
  warning: string;
  suggestion?: string;
}

export interface ParameterSuggestion {
  type: 'optimization' | 'conflict' | 'best_practice';
  parameter_id: string;
  suggestion: string;
  current_value: any;
  suggested_value: any;
  reason: string;
  confidence: number; // 0-1
}

// ========== DEFAULT PARAMETERS ==========

// Mass parameters (apply to all scanners/patterns)
const MASS_PARAMETERS: ParameterDefinition[] = [
  {
    id: 'min_close_price',
    name: 'min_close_price',
    display_name: 'Minimum Close Price',
    type: 'number',
    scope: 'mass',
    description: 'Minimum closing price for stock consideration',
    default_value: 5.0,
    current_value: 5.0,
    validation: [{ type: 'min', value: 0 } as any],
    min_value: 0,
    max_value: 10000,
    step: 0.5,
    unit: '$',
    category: 'Price',
    advanced: false,
    required: false,
    scanner_types: ['*'],
    tags: ['price', 'liquidity', 'filter'],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'min_volume',
    name: 'min_volume',
    display_name: 'Minimum Volume',
    type: 'number',
    scope: 'mass',
    description: 'Minimum daily trading volume',
    default_value: 1000000,
    current_value: 1000000,
    validation: [{ type: 'min', value: 0 } as any],
    min_value: 0,
    max_value: 10000000000,
    step: 100000,
    unit: 'shares',
    category: 'Volume',
    advanced: false,
    required: false,
    scanner_types: ['*'],
    tags: ['volume', 'liquidity', 'filter'],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'max_gap_percent',
    name: 'max_gap_percent',
    display_name: 'Maximum Gap %',
    type: 'number',
    scope: 'mass',
    description: 'Maximum gap percentage to consider',
    default_value: 100,
    current_value: 100,
    validation: [{ type: 'min', value: 0 } as any],
    min_value: 0,
    max_value: 500,
    step: 1,
    unit: '%',
    category: 'Price',
    advanced: true,
    required: false,
    scanner_types: ['*'],
    tags: ['gap', 'price', 'filter'],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'start_date',
    name: 'start_date',
    display_name: 'Start Date',
    type: 'string',
    scope: 'mass',
    description: 'Scan start date (YYYY-MM-DD)',
    default_value: '2025-01-01',
    current_value: '2025-01-01',
    validation: [{ type: 'pattern', value: /^\d{4}-\d{2}-\d{2}$/ } as any],
    category: 'Time',
    advanced: false,
    required: false,
    scanner_types: ['*'],
    tags: ['date', 'time', 'range'],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'end_date',
    name: 'end_date',
    display_name: 'End Date',
    type: 'string',
    scope: 'mass',
    description: 'Scan end date (YYYY-MM-DD)',
    default_value: '2025-12-31',
    current_value: '2025-12-31',
    validation: [{ type: 'pattern', value: /^\d{4}-\d{2}-\d{2}$/ } as any],
    category: 'Time',
    advanced: false,
    required: false,
    scanner_types: ['*'],
    tags: ['date', 'time', 'range'],
    created_at: new Date(),
    updated_at: new Date()
  }
];

// LC D2 specific individual parameters
const LC_D2_PARAMETERS: ParameterDefinition[] = [
  {
    id: 'lc_gap_threshold',
    name: 'lc_gap_threshold',
    display_name: 'LC Gap Threshold',
    type: 'number',
    scope: 'individual',
    description: 'Minimum gap percentage for LC D2 pattern',
    default_value: 5.0,
    current_value: 5.0,
    validation: [{ type: 'min', value: 0 } as any],
    min_value: 0,
    max_value: 50,
    step: 0.5,
    unit: '%',
    category: 'Price',
    advanced: false,
    required: true,
    scanner_types: ['lc_d2', 'lc'],
    tags: ['lc', 'gap', 'pattern'],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'lc_atr_period',
    name: 'lc_atr_period',
    display_name: 'LC ATR Period',
    type: 'number',
    scope: 'individual',
    description: 'Average True Range period for volatility',
    default_value: 14,
    current_value: 14,
    validation: [{ type: 'min', value: 1 }, { type: 'max', value: 100 }] as any,
    min_value: 1,
    max_value: 100,
    step: 1,
    unit: 'days',
    category: 'Technical',
    advanced: true,
    required: false,
    scanner_types: ['lc_d2', 'lc'],
    tags: ['lc', 'atr', 'volatility'],
    created_at: new Date(),
    updated_at: new Date()
  }
];

// Backside B specific individual parameters
const BACKSIDE_B_PARAMETERS: ParameterDefinition[] = [
  {
    id: 'bs_para_b_threshold',
    name: 'bs_para_b_threshold',
    display_name: 'Para B Threshold',
    type: 'number',
    scope: 'individual',
    description: 'Price cap for Para B pattern qualification',
    default_value: 5.0,
    current_value: 5.0,
    validation: [{ type: 'min', value: 0 } as any],
    min_value: 0,
    max_value: 1000,
    step: 0.5,
    unit: '$',
    category: 'Price',
    advanced: false,
    required: true,
    scanner_types: ['backside_b', 'backside'],
    tags: ['backside', 'para_b', 'price'],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'bs_min_drop',
    name: 'bs_min_drop',
    display_name: 'Minimum Drop %',
    type: 'number',
    scope: 'individual',
    description: 'Minimum downward gap for Backside pattern',
    default_value: 5.0,
    current_value: 5.0,
    validation: [{ type: 'min', value: 0 } as any],
    min_value: 0,
    max_value: 50,
    step: 0.5,
    unit: '%',
    category: 'Price',
    advanced: true,
    required: true,
    scanner_types: ['backside_b', 'backside'],
    tags: ['backside', 'gap', 'drop'],
    created_at: new Date(),
    updated_at: new Date()
  }
];

// ========== SERVICE ==========

export class ParameterMasterService {
  private parameters: Map<string, ParameterDefinition> = new Map();
  private templates: Map<string, ParameterTemplate> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.initializeDefaults();
  }

  /**
   * Initialize with default parameters and templates
   */
  private initializeDefaults() {
    // Register mass parameters
    MASS_PARAMETERS.forEach(param => {
      this.parameters.set(param.id, param);
    });

    // Register individual parameters
    LC_D2_PARAMETERS.forEach(param => {
      this.parameters.set(param.id, param);
    });

    BACKSIDE_B_PARAMETERS.forEach(param => {
      this.parameters.set(param.id, param);
    });

    // Create default templates
    this.createDefaultTemplates();

    this.initialized = true;
  }

  /**
   * Create default parameter templates
   */
  private createDefaultTemplates() {
    // LC D2 Default Template
    const lcD2Template: ParameterTemplate = {
      id: 'lc_d2_default',
      name: 'LC D2 Default',
      description: 'Default LC D2 scanner parameters',
      scanner_type: 'lc_d2',
      parameters: {
        min_close_price: 5.0,
        min_volume: 1000000,
        max_gap_percent: 100,
        lc_gap_threshold: 5.0,
        lc_atr_period: 14
      },
      created_at: new Date(),
      updated_at: new Date(),
      is_default: true
    };
    this.templates.set(lcD2Template.id, lcD2Template);

    // Backside B Default Template
    const backsideBTemplate: ParameterTemplate = {
      id: 'backside_b_default',
      name: 'Backside B Default',
      description: 'Default Backside B scanner parameters',
      scanner_type: 'backside_b',
      parameters: {
        min_close_price: 5.0,
        min_volume: 1000000,
        bs_para_b_threshold: 5.0,
        bs_min_drop: 5.0
      },
      created_at: new Date(),
      updated_at: new Date(),
      is_default: true
    };
    this.templates.set(backsideBTemplate.id, backsideBTemplate);
  }

  // ========== CRUD OPERATIONS ==========

  /**
   * Get all parameters for a scanner type
   */
  getParametersForScanner(scannerType: string): ParameterDefinition[] {
    const allParams = Array.from(this.parameters.values());

    return allParams.filter(param =>
      param.scanner_types.includes('*') ||
      param.scanner_types.includes(scannerType) ||
      param.scanner_types.includes(scannerType.replace('_', '').toLowerCase())
    ).sort((a, b) => {
      // Sort by category, then by required, then by name
      if (a.category !== b.category) return (a.category || '').localeCompare(b.category || '');
      if (a.required !== b.required) return a.required ? -1 : 1;
      return a.display_name.localeCompare(b.display_name);
    });
  }

  /**
   * Get mass parameters (apply to all)
   */
  getMassParameters(): ParameterDefinition[] {
    return Array.from(this.parameters.values())
      .filter(p => p.scope === 'mass' || p.scope === 'both')
      .sort((a, b) => a.display_name.localeCompare(b.display_name));
  }

  /**
   * Get individual parameters for scanner type
   */
  getIndividualParameters(scannerType: string): ParameterDefinition[] {
    return this.getParametersForScanner(scannerType)
      .filter(p => p.scope === 'individual' || p.scope === 'both');
  }

  /**
   * Get a single parameter by ID
   */
  getParameter(parameterId: string): ParameterDefinition | null {
    return this.parameters.get(parameterId) || null;
  }

  /**
   * Create a new parameter
   */
  createParameter(parameter: Omit<ParameterDefinition, 'id' | 'created_at' | 'updated_at'>): ParameterDefinition {
    const newParam: ParameterDefinition = {
      ...parameter,
      id: this.generateParameterId(parameter.name),
      created_at: new Date(),
      updated_at: new Date()
    };

    this.parameters.set(newParam.id, newParam);
    return newParam;
  }

  /**
   * Update a parameter
   */
  updateParameter(parameterId: string, updates: Partial<ParameterDefinition>): boolean {
    const param = this.parameters.get(parameterId);
    if (!param) {
      return false;
    }

    const updated = {
      ...param,
      ...updates,
      id: param.id, // Ensure ID doesn't change
      updated_at: new Date()
    };

    this.parameters.set(parameterId, updated);
    return true;
  }

  /**
   * Delete a parameter
   */
  deleteParameter(parameterId: string): boolean {
    return this.parameters.delete(parameterId);
  }

  // ========== VALIDATION ==========

  /**
   * Validate a parameter value
   */
  validateParameterValue(parameterId: string, value: any): ValidationResult {
    const param = this.parameters.get(parameterId);
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!param) {
      errors.push({
        parameter_id: parameterId,
        parameter_name: 'Unknown',
        error: 'Parameter not found',
        severity: 'critical'
      });
      return { valid: false, errors, warnings };
    }

    // Check required
    if (param.required && (value === undefined || value === null || value === '')) {
      errors.push({
        parameter_id: parameterId,
        parameter_name: param.display_name,
        error: 'Required parameter is missing',
        severity: 'error'
      });
    }

    // Run validation rules
    if (param.validation && value !== undefined && value !== null) {
      for (const rule of param.validation) {
        const result = this.validateRule(rule, value, param);
        if (!result.valid) {
          errors.push({
            parameter_id: parameterId,
            parameter_name: param.display_name,
            error: result.error || 'Validation failed',
            severity: 'error'
          });
        }
        if (result.warning) {
          warnings.push({
            parameter_id: parameterId,
            parameter_name: param.display_name,
            warning: result.warning
          });
        }
      }
    }

    // Check min/max for numeric types
    if (param.type === 'number' && typeof value === 'number') {
      if (param.min_value !== undefined && value < param.min_value) {
        errors.push({
          parameter_id: parameterId,
          parameter_name: param.display_name,
          error: `Value ${value} is below minimum ${param.min_value}`,
          severity: 'error'
        });
      }
      if (param.max_value !== undefined && value > param.max_value) {
        errors.push({
          parameter_id: parameterId,
          parameter_name: param.display_name,
          error: `Value ${value} is above maximum ${param.max_value}`,
          severity: 'error'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate all parameters in a template
   */
  validateTemplate(templateId: string): ValidationResult {
    const template = this.templates.get(templateId);
    if (!template) {
      return {
        valid: false,
        errors: [{
          parameter_id: 'template',
          parameter_name: 'Template',
          error: 'Template not found',
          severity: 'critical'
        }],
        warnings: []
      };
    }

    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];

    for (const [paramId, value] of Object.entries(template.parameters)) {
      const result = this.validateParameterValue(paramId, value);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Validate a single rule
   */
  private validateRule(rule: ValidationRule, value: any, param: ParameterDefinition): { valid: boolean; error?: string; warning?: string } {
    const r = rule as any;
    switch (r.type) {
      case 'min':
        if (typeof value === 'number' && value < r.value) {
          return { valid: false, error: `Value must be at least ${r.value}` };
        }
        break;

      case 'max':
        if (typeof value === 'number' && value > (r.value as number)) {
          return { valid: false, error: `Value must be at most ${r.value}` };
        }
        break;

      case 'range':
        const [min, max] = r.value as [number, number];
        if (typeof value === 'number' && (value < min || value > max)) {
          return { valid: false, error: `Value must be between ${min} and ${max}` };
        }
        break;

      case 'pattern':
        if (typeof value === 'string' && !r.value.test(value)) {
          return { valid: false, error: 'Invalid format' };
        }
        break;

      case 'custom':
        // Custom validation would be handled by external validator
        break;
    }

    return { valid: true };
  }

  // ========== TEMPLATE MANAGEMENT ==========

  /**
   * Get templates for scanner type
   */
  getTemplates(scannerType: string): ParameterTemplate[] {
    return Array.from(this.templates.values())
      .filter(t => t.scanner_type === scannerType)
      .sort((a, b) => a.is_default ? -1 : 1);
  }

  /**
   * Get a template by ID
   */
  getTemplate(templateId: string): ParameterTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Save a template
   */
  saveTemplate(template: Omit<ParameterTemplate, 'id' | 'created_at' | 'updated_at'>): ParameterTemplate {
    const newTemplate: ParameterTemplate = {
      ...template,
      id: this.generateTemplateId(template.name, template.scanner_type),
      created_at: new Date(),
      updated_at: new Date()
    };

    this.templates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  /**
   * Update a template
   */
  updateTemplate(templateId: string, updates: Partial<ParameterTemplate>): boolean {
    const template = this.templates.get(templateId);
    if (!template) {
      return false;
    }

    const updated = {
      ...template,
      ...updates,
      id: templateId, // Ensure ID doesn't change
      updated_at: new Date()
    };

    this.templates.set(templateId, updated);
    return true;
  }

  /**
   * Delete a template
   */
  deleteTemplate(templateId: string): boolean {
    const template = this.templates.get(templateId);
    if (template && template.is_default) {
      // Don't allow deleting default templates
      return false;
    }
    return this.templates.delete(templateId);
  }

  /**
   * Apply template values to parameters
   */
  applyTemplate(templateId: string): void {
    const template = this.templates.get(templateId);
    if (!template) {
      return;
    }

    // Update current values for all parameters in template
    for (const [paramId, value] of Object.entries(template.parameters)) {
      const param = this.parameters.get(paramId);
      if (param) {
        param.current_value = value;
        this.parameters.set(paramId, param);
      }
    }
  }

  // ========== OPTIMIZATION & SUGGESTIONS ==========

  /**
   * Get optimization suggestions for parameters
   */
  getOptimizationSuggestions(scannerType: string): ParameterSuggestion[] {
    const suggestions: ParameterSuggestion[] = [];
    const params = this.getParametersForScanner(scannerType);

    // Check for common optimizations

    // 1. Volume parameter optimization
    const minVolParam = params.find(p => p.id === 'min_volume');
    if (minVolParam && minVolParam.current_value === minVolParam.default_value) {
      suggestions.push({
        type: 'optimization',
        parameter_id: 'min_volume',
        suggestion: 'Consider adjusting minimum volume based on market conditions',
        current_value: minVolParam.current_value,
        suggested_value: minVolParam.default_value * 1.5,
        reason: 'Higher volume filter improves liquidity quality',
        confidence: 0.7
      });
    }

    // 2. Gap threshold optimization
    const gapParam = params.find(p => p.id === 'lc_gap_threshold');
    if (gapParam && gapParam.current_value === gapParam.default_value) {
      suggestions.push({
        type: 'optimization',
        parameter_id: 'lc_gap_threshold',
        suggestion: 'Consider testing different gap thresholds',
        current_value: gapParam.current_value,
        suggested_value: 3.0,
        reason: 'Lower threshold may capture more opportunities',
        confidence: 0.6
      });
    }

    return suggestions;
  }

  /**
   * Detect parameter conflicts
   */
  detectConflicts(scannerType: string): ParameterSuggestion[] {
    const conflicts: ParameterSuggestion[] = [];
    const params = this.getParametersForScanner(scannerType);

    // Check for conflicting ranges
    const minPrice = params.find(p => p.id === 'min_close_price');
    const paraCap = params.find(p => p.id === 'bs_para_b_threshold');

    if (minPrice && paraCap && minPrice.current_value > paraCap.current_value) {
      conflicts.push({
        type: 'conflict',
        parameter_id: 'min_close_price',
        suggestion: 'Min close price exceeds Para B threshold',
        current_value: minPrice.current_value,
        suggested_value: paraCap.current_value * 0.9,
        reason: 'Stocks above Para B cap cannot trigger pattern',
        confidence: 1.0
      });
    }

    // Check date range conflicts
    const startDate = params.find(p => p.id === 'start_date');
    const endDate = params.find(p => p.id === 'end_date');

    if (startDate && endDate && startDate.current_value > endDate.current_value) {
      conflicts.push({
        type: 'conflict',
        parameter_id: 'start_date',
        suggestion: 'Start date is after end date',
        current_value: startDate.current_value,
        suggested_value: endDate.current_value,
        reason: 'Date range is invalid',
        confidence: 1.0
      });
    }

    return conflicts;
  }

  // ========== UTILITY METHODS ==========

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalParameters: this.parameters.size,
      massParameters: Array.from(this.parameters.values()).filter(p => p.scope === 'mass').length,
      individualParameters: Array.from(this.parameters.values()).filter(p => p.scope === 'individual').length,
      totalTemplates: this.templates.size,
      scannerTypes: [...new Set(
        Array.from(this.parameters.values())
          .flatMap(p => p.scanner_types)
          .filter(t => t !== '*')
      )],
      initialized: this.initialized
    };
  }

  /**
   * Export parameters to JSON
   */
  exportParameters(scannerType?: string): string {
    const params = scannerType
      ? this.getParametersForScanner(scannerType)
      : Array.from(this.parameters.values());

    return JSON.stringify(params, null, 2);
  }

  /**
   * Import parameters from JSON
   */
  importParameters(json: string): { success: boolean; imported: number; errors: string[] } {
    const errors: string[] = [];
    let imported = 0;

    try {
      const params: ParameterDefinition[] = JSON.parse(json);

      for (const param of params) {
        try {
          // Check if updating or creating
          if (this.parameters.has(param.id)) {
            this.updateParameter(param.id, param);
          } else {
            this.createParameter(param);
          }
          imported++;
        } catch (error) {
          errors.push(`Failed to import parameter ${param.name}: ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        imported,
        errors
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [`Invalid JSON: ${error}`]
      };
    }
  }

  /**
   * Generate unique parameter ID
   */
  private generateParameterId(name: string): string {
    const base = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    return `${base}_${Date.now()}`;
  }

  /**
   * Generate unique template ID
   */
  private generateTemplateId(name: string, scannerType: string): string {
    const base = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    return `${scannerType}_${base}_${Date.now()}`;
  }
}

// ========== EXPORT SINGLETON ==========

let _instance: ParameterMasterService | null = null;

export const getParameterMaster = (): ParameterMasterService => {
  if (!_instance) {
    _instance = new ParameterMasterService();
  }
  return _instance;
};

export const parameterMaster = new Proxy({} as ParameterMasterService, {
  get(target, prop) {
    const instance = getParameterMaster();
    const value = instance[prop as keyof ParameterMasterService];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});
