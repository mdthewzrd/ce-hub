/**
 * ParameterEditor Component
 *
 * Allows individual scanner parameter customization within projects.
 * Provides dynamic form generation, validation, real-time preview,
 * parameter history, and versioning capabilities.
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Save, RotateCcw, History, AlertCircle, CheckCircle, Info, Edit3, Copy, Upload, Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Scanner,
  ScannerParameters,
  ParameterSnapshot,
  ParameterEditorProps,
  ScannerParameter,
  ParameterValidation,
  ValidationResult
} from '@/types/projectTypes';
import { cn } from '@/lib/utils';

// Parameter Input Component
interface ParameterInputProps {
  parameter: ScannerParameter;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

const ParameterInput: React.FC<ParameterInputProps> = ({
  parameter,
  value,
  onChange,
  error,
  disabled = false
}) => {
  const { key, type, description, validation } = parameter;

  const renderInput = () => {
    switch (type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={Boolean(value)}
              onCheckedChange={(checked) => onChange(checked)}
              disabled={disabled}
            />
            <Label className="text-sm text-gray-300">
              {value ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => {
              const numValue = parseFloat(e.target.value);
              onChange(isNaN(numValue) ? null : numValue);
            }}
            min={validation?.min}
            max={validation?.max}
            step={type === 'number' ? 'any' : undefined}
            disabled={disabled}
            className="bg-gray-800 border-gray-600 text-white"
          />
        );

      case 'array':
        const arrayValue = Array.isArray(value) ? value.join(', ') : '';
        return (
          <div className="space-y-2">
            <Input
              value={arrayValue}
              onChange={(e) => {
                const items = e.target.value
                  .split(',')
                  .map(item => item.trim())
                  .filter(item => item);
                onChange(items);
              }}
              placeholder="Enter comma-separated values"
              disabled={disabled}
              className="bg-gray-800 border-gray-600 text-white"
            />
            <p className="text-xs text-gray-500">
              Separate multiple values with commas
            </p>
          </div>
        );

      case 'object':
        try {
          const jsonValue = typeof value === 'object'
            ? JSON.stringify(value, null, 2)
            : value || '';
          return (
            <textarea
              value={jsonValue}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  onChange(parsed);
                } catch {
                  // Keep the raw value for editing
                  onChange(e.target.value);
                }
              }}
              placeholder="Enter JSON object"
              rows={4}
              disabled={disabled}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white font-mono text-sm resize-none"
            />
          );
        } catch {
          return (
            <textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Enter JSON object"
              rows={4}
              disabled={disabled}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white font-mono text-sm resize-none"
            />
          );
        }

      case 'string':
      default:
        if (validation?.options) {
          return (
            <select
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white"
            >
              <option value="">Select an option</option>
              {validation.options.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );
        }

        if (validation?.pattern) {
          return (
            <Input
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              pattern={validation.pattern}
              placeholder={description}
              disabled={disabled}
              className="bg-gray-800 border-gray-600 text-white"
            />
          );
        }

        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={description}
            disabled={disabled}
            className="bg-gray-800 border-gray-600 text-white"
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-200">
          {key}
          {validation?.required && <span className="text-red-400 ml-1">*</span>}
        </Label>
        <Badge
          variant="secondary"
          className="text-xs bg-gray-700 text-gray-400"
        >
          {type}
        </Badge>
      </div>

      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}

      {renderInput()}

      {error && (
        <div className="flex items-center space-x-2 text-red-400">
          <AlertCircle className="h-3 w-3" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      {parameter.default !== undefined && value === undefined && (
        <p className="text-xs text-gray-500">
          Default: {JSON.stringify(parameter.default)}
        </p>
      )}
    </div>
  );
};

// Parameter History Component
interface ParameterHistoryProps {
  history: ParameterSnapshot[];
  onLoadSnapshot: (snapshotId: string) => void;
  currentParameters: ScannerParameters;
}

const ParameterHistory: React.FC<ParameterHistoryProps> = ({
  history,
  onLoadSnapshot,
  currentParameters
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const compareParameters = (snapshot: ParameterSnapshot) => {
    const currentKeys = Object.keys(currentParameters);
    const snapshotKeys = Object.keys(snapshot.parameters);

    const added = currentKeys.filter(key => !snapshotKeys.includes(key));
    const removed = snapshotKeys.filter(key => !currentKeys.includes(key));
    const modified = currentKeys.filter(key =>
      snapshotKeys.includes(key) &&
      JSON.stringify(currentParameters[key]) !== JSON.stringify(snapshot.parameters[key])
    );

    return { added, removed, modified };
  };

  if (history.length === 0) {
    return (
      <Card className="bg-gray-800 border-gray-700 p-6 text-center">
        <History className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-400">No parameter history available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((snapshot, index) => {
        const changes = compareParameters(snapshot);
        const hasChanges = changes.added.length > 0 || changes.removed.length > 0 || changes.modified.length > 0;

        return (
          <Card key={snapshot.snapshot_id} className="bg-gray-800 border-gray-700 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-semibold text-white">
                    {snapshot.description || `Snapshot ${index + 1}`}
                  </h4>
                  {index === 0 && (
                    <Badge className="text-xs bg-blue-900 text-blue-200">
                      Latest
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {formatDate(snapshot.created_at)}
                  {snapshot.created_by && ` by ${snapshot.created_by}`}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onLoadSnapshot(snapshot.snapshot_id)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Load
              </Button>
            </div>

            {hasChanges && (
              <div className="space-y-2">
                {changes.modified.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Edit3 className="h-3 w-3 text-yellow-400" />
                    <span className="text-xs text-gray-400">
                      Modified: {changes.modified.join(', ')}
                    </span>
                  </div>
                )}
                {changes.added.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-xs text-gray-400">
                      Added: {changes.added.join(', ')}
                    </span>
                  </div>
                )}
                {changes.removed.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-3 w-3 text-red-400" />
                    <span className="text-xs text-gray-400">
                      Removed: {changes.removed.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 text-xs text-gray-500">
              {Object.keys(snapshot.parameters).length} parameters
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// Main ParameterEditor Component
export const ParameterEditor: React.FC<ParameterEditorProps> = ({
  projectId,
  scanner,
  parameters,
  parameterHistory,
  onParameterChange,
  onSaveParameters,
  onLoadSnapshot,
  loading = false
}) => {
  const [localParameters, setLocalParameters] = useState<ScannerParameters>(parameters);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('parameters');
  const [importData, setImportData] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  // Update local parameters when props change
  useEffect(() => {
    setLocalParameters(parameters);
    setHasChanges(false);
    setValidationErrors({});
  }, [parameters]);

  // Check for changes
  useEffect(() => {
    const hasAnyChanges = JSON.stringify(localParameters) !== JSON.stringify(parameters);
    setHasChanges(hasAnyChanges);
  }, [localParameters, parameters]);

  // Generate parameter schema from current values (simplified version)
  const generateParameterSchema = useCallback((): ScannerParameter[] => {
    return Object.entries(localParameters).map(([key, value]) => {
      let type: ScannerParameter['type'] = 'string';

      if (typeof value === 'boolean') type = 'boolean';
      else if (typeof value === 'number') type = 'number';
      else if (Array.isArray(value)) type = 'array';
      else if (typeof value === 'object' && value !== null) type = 'object';

      return {
        key,
        value,
        type,
        description: `Parameter: ${key}`,
        validation: {
          required: false
        }
      };
    });
  }, [localParameters]);

  const handleParameterChange = (key: string, value: any) => {
    setLocalParameters(prev => ({
      ...prev,
      [key]: value
    }));
    onParameterChange(key, value);

    // Clear validation error for this parameter
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validateParameters = (): ValidationResult => {
    const errors: string[] = [];
    const paramErrors: Record<string, string> = {};

    const schema = generateParameterSchema();

    schema.forEach(param => {
      const value = localParameters[param.key];
      const validation = param.validation;

      if (validation?.required && (value === undefined || value === null || value === '')) {
        paramErrors[param.key] = 'This parameter is required';
        errors.push(`${param.key} is required`);
      }

      if (param.type === 'number' && value !== undefined && value !== null) {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          paramErrors[param.key] = 'Must be a valid number';
          errors.push(`${param.key} must be a valid number`);
        } else {
          if (validation?.min !== undefined && numValue < validation.min) {
            paramErrors[param.key] = `Must be at least ${validation.min}`;
            errors.push(`${param.key} must be at least ${validation.min}`);
          }
          if (validation?.max !== undefined && numValue > validation.max) {
            paramErrors[param.key] = `Must be at most ${validation.max}`;
            errors.push(`${param.key} must be at most ${validation.max}`);
          }
        }
      }

      if (param.type === 'object' && value && typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch {
          paramErrors[param.key] = 'Must be valid JSON';
          errors.push(`${param.key} must be valid JSON`);
        }
      }
    });

    setValidationErrors(paramErrors);

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const validation = validateParameters();

      if (!validation.isValid) {
        console.error('Validation failed:', validation.errors);
        return;
      }

      await onSaveParameters();
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save parameters:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all changes? This cannot be undone.')) {
      setLocalParameters(parameters);
      setValidationErrors({});
      setHasChanges(false);
    }
  };

  const handleImport = () => {
    try {
      const imported = JSON.parse(importData);
      if (typeof imported === 'object' && imported !== null) {
        setLocalParameters({ ...localParameters, ...imported });
        setImportData('');
        setShowImportModal(false);
      } else {
        alert('Invalid JSON format');
      }
    } catch (error) {
      alert('Invalid JSON format');
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(localParameters, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${scanner.scanner_id}_parameters.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const parameterSchema = generateParameterSchema();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Parameter Editor</h2>
          <p className="text-gray-400">
            Configure parameters for {scanner.scanner_id}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleExport}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving || Object.keys(validationErrors).length > 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      {hasChanges && (
        <Card className="bg-yellow-900 border-yellow-700 p-3">
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-yellow-400" />
            <p className="text-yellow-200 text-sm">
              You have unsaved changes. Click "Save Changes" to apply them.
            </p>
          </div>
        </Card>
      )}

      {/* Error Summary */}
      {Object.keys(validationErrors).length > 0 && (
        <Card className="bg-red-900 border-red-700 p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <h3 className="text-red-200 font-medium">Parameter Validation Errors</h3>
          </div>
          <ul className="list-disc list-inside text-red-300 text-sm space-y-1">
            {Object.entries(validationErrors).map(([key, error]) => (
              <li key={key}>{key}: {error}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="parameters" className="text-gray-300 data-[state=active]:text-white">
            Parameters ({parameterSchema.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="text-gray-300 data-[state=active]:text-white">
            History ({parameterHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parameters">
          <div className="space-y-6">
            {parameterSchema.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700 p-8 text-center">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Parameters</h3>
                <p className="text-gray-400">
                  This scanner has no configurable parameters
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {parameterSchema.map((parameter) => (
                  <Card key={parameter.key} className="bg-gray-800 border-gray-700 p-4">
                    <ParameterInput
                      parameter={parameter}
                      value={localParameters[parameter.key]}
                      onChange={(value) => handleParameterChange(parameter.key, value)}
                      error={validationErrors[parameter.key]}
                      disabled={loading || saving}
                    />
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <ParameterHistory
            history={parameterHistory}
            onLoadSnapshot={onLoadSnapshot}
            currentParameters={localParameters}
          />
        </TabsContent>
      </Tabs>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl bg-gray-900 border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Import Parameters</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-200">
                Paste JSON parameters
              </Label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste your JSON parameters here..."
                rows={8}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white font-mono text-sm resize-none"
              />

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowImportModal(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Import
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ParameterEditor;