/**
 * Parameter Master Editor Component
 * Full CRUD interface for scanner parameters with validation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  AlertTriangle,
  Settings,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Parameter {
  id: string;
  name: string;
  display_name: string;
  type: string;
  scope: string;
  description?: string;
  default_value?: any;
  current_value?: any;
  validation?: any[];
  min_value?: number;
  max_value?: number;
  step?: number;
  unit?: string;
  category?: string;
  advanced: boolean;
  required: boolean;
  scanner_types: string[];
  tags: string[];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface ParameterMasterEditorProps {
  scannerType: string;
  onParameterUpdate?: () => void;
  showAdvancedOnly?: boolean;
}

export function ParameterMasterEditor({
  scannerType,
  onParameterUpdate,
  showAdvancedOnly = false
}: ParameterMasterEditorProps) {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingParameter, setEditingParameter] = useState<Parameter | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Load parameters
  useEffect(() => {
    async function loadParameters() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/parameters?scanner_type=${scannerType}&action=parameters`
        );
        const data = await response.json();

        if (data.success) {
          setParameters(data.parameters || []);
          // Initialize expanded categories
          const categories: Set<string> = new Set(
            data.parameters
              .map((p: Parameter) => p.category || 'General')
              .filter((cat: string) => cat)
          );
          setExpandedCategories(categories);
        }
      } catch (error) {
        console.error('Failed to load parameters:', error);
      } finally {
        setLoading(false);
      }
    }

    loadParameters();
  }, [scannerType]);

  // Validate parameter
  const validateParameter = async (parameterId: string, value: any) => {
    try {
      const response = await fetch('/api/parameters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate_parameter',
          parameter_id: parameterId,
          value: value
        })
      });

      const data = await response.json();
      if (data.success) {
        setValidationResults(prev => ({
          ...prev,
          [parameterId]: data.validation
        }));
        return data.validation;
      }
    } catch (error) {
      console.error('Failed to validate parameter:', error);
    }
    return { valid: true, errors: [], warnings: [] };
  };

  // Update parameter value
  const updateParameterValue = async (parameterId: string, value: any) => {
    setPendingChanges(prev => ({ ...prev, [parameterId]: value }));
    setHasChanges(true);

    // Validate in real-time
    await validateParameter(parameterId, value);
  };

  // Apply all changes
  const applyChanges = async () => {
    try {
      for (const [parameterId, value] of Object.entries(pendingChanges)) {
        const response = await fetch('/api/parameters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            parameter_id: parameterId,
            updates: { current_value: value }
          })
        });

        if (!response.ok) {
          console.error(`Failed to update parameter ${parameterId}`);
        }
      }

      // Reload parameters
      const response = await fetch(
        `/api/parameters?scanner_type=${scannerType}&action=parameters`
      );
      const data = await response.json();
      if (data.success) {
        setParameters(data.parameters || []);
      }

      setPendingChanges({});
      setHasChanges(false);

      if (onParameterUpdate) {
        onParameterUpdate();
      }
    } catch (error) {
      console.error('Failed to apply changes:', error);
    }
  };

  // Reset all changes
  const resetChanges = () => {
    setPendingChanges({});
    setHasChanges(false);
    setValidationResults({});
  };

  // Reset parameter to default
  const resetToDefault = (parameterId: string) => {
    const param = parameters.find(p => p.id === parameterId);
    if (param && param.default_value !== undefined) {
      updateParameterValue(parameterId, param.default_value);
    }
  };

  // Get current value (pending change or current)
  const getCurrentValue = (param: Parameter) => {
    if (pendingChanges[param.id] !== undefined) {
      return pendingChanges[param.id];
    }
    return param.current_value ?? param.default_value;
  };

  // Group parameters by category
  const groupedParameters = parameters.reduce((acc, param) => {
    const category = param.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(param);
    return acc;
  }, {} as Record<string, Parameter[]>);

  // Filter by advanced setting
  const filteredParameters = Object.entries(groupedParameters).reduce((acc, [category, params]) => {
    const filtered = params.filter(p => {
      if (showAdvancedOnly) return p.advanced;
      if (!showAdvanced) return !p.advanced;
      return true;
    });
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, Parameter[]>);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Render parameter input based on type
  const renderParameterInput = (param: Parameter) => {
    const value = getCurrentValue(param);
    const validation = validationResults[param.id];

    switch (param.type) {
      case 'number':
        return (
          <div className="space-y-2">
            {param.min_value !== undefined && param.max_value !== undefined ? (
              <div className="space-y-1">
                <Slider
                  value={[value]}
                  onValueChange={(v) => updateParameterValue(param.id, v[0])}
                  min={param.min_value}
                  max={param.max_value}
                  step={param.step || 1}
                  className="flex-1"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{param.min_value}</span>
                  <span className="font-medium">{value} {param.unit}</span>
                  <span>{param.max_value}</span>
                </div>
              </div>
            ) : (
              <Input
                type="number"
                value={value}
                onChange={(e) => updateParameterValue(param.id, parseFloat(e.target.value))}
                min={param.min_value}
                max={param.max_value}
                step={param.step || 1}
                className="w-full"
              />
            )}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => updateParameterValue(param.id, e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm text-muted-foreground">
              {value ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        );

      case 'range':
        return (
          <div className="flex space-x-2">
            <Input
              type="number"
              value={value?.[0] || param.min_value || ''}
              onChange={(e) => updateParameterValue(param.id, [parseFloat(e.target.value), value?.[1] || param.max_value])}
              placeholder="Min"
              className="flex-1"
            />
            <Input
              type="number"
              value={value?.[1] || param.max_value || ''}
              onChange={(e) => updateParameterValue(param.id, [value?.[0] || param.min_value, parseFloat(e.target.value)])}
              placeholder="Max"
              className="flex-1"
            />
          </div>
        );

      case 'string':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => updateParameterValue(param.id, e.target.value)}
            className="w-full"
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => updateParameterValue(param.id, e.target.value)}
            className="w-full"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6 border rounded-lg bg-card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg bg-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Parameter Master Editor
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure parameters for {scannerType.replace('_', ' ').toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="gap-2"
          >
            {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAdvanced ? 'Basic' : 'Advanced'}
          </Button>
          {hasChanges && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={resetChanges}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={applyChanges}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Apply ({Object.keys(pendingChanges).length})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground pb-4 border-b">
        <span>Total: {parameters.length} parameters</span>
        <span>•</span>
        <span>Changed: {Object.keys(pendingChanges).length}</span>
        <span>•</span>
        <span>Errors: {Object.values(validationResults).filter(v => !v.valid).length}</span>
      </div>

      {/* Parameters by Category */}
      <div className="space-y-4">
        {Object.entries(filteredParameters).map(([category, categoryParams]) => (
          <Card key={category} className="p-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleCategory(category)}
            >
              <h4 className="font-semibold">{category}</h4>
              <Button variant="ghost" size="sm">
                {expandedCategories.has(category) ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>

            {expandedCategories.has(category) && (
              <div className="mt-4 space-y-4">
                {categoryParams.map(param => {
                  const value = getCurrentValue(param);
                  const validation = validationResults[param.id];
                  const hasPendingChange = pendingChanges[param.id] !== undefined;

                  return (
                    <div
                      key={param.id}
                      className={`p-3 border rounded-lg ${hasPendingChange ? 'border-primary bg-accent' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="font-medium">
                              {param.display_name}
                            </Label>
                            {param.required && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                            {param.advanced && (
                              <Badge variant="secondary" className="text-xs">Advanced</Badge>
                            )}
                            {hasPendingChange && (
                              <Badge variant="outline" className="text-xs">Modified</Badge>
                            )}
                            {param.scope === 'mass' && (
                              <Badge variant="outline" className="text-xs">Global</Badge>
                            )}
                          </div>
                          {param.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {param.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resetToDefault(param.id)}
                          title="Reset to default"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      </div>

                      {renderParameterInput(param)}

                      {/* Validation Errors */}
                      {validation && !validation.valid && (
                        <div className="mt-2 flex items-start gap-2 text-destructive text-sm">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            {validation.errors.map((error, idx) => (
                              <div key={idx}>{error}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Validation Warnings */}
                      {validation && validation.warnings.length > 0 && (
                        <div className="mt-2 flex items-start gap-2 text-yellow-600 text-sm">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            {validation.warnings.map((warning, idx) => (
                              <div key={idx}>{warning}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {param.tags.length > 0 && (
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {param.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
