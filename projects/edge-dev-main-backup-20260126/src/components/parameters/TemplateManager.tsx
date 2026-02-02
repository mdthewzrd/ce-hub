/**
 * Template Manager Component
 * Save, load, and manage parameter templates
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Save,
  Play,
  Trash2,
  Edit,
  Plus,
  X,
  Copy,
  Download,
  Upload,
  Check,
  AlertCircle
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description?: string;
  scanner_type: string;
  parameters: Record<string, any>;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
  tags?: string[];
}

interface TemplateManagerProps {
  scannerType: string;
  onTemplateApply?: (templateId: string) => void;
  currentValues?: Record<string, any>;
}

export function TemplateManager({
  scannerType,
  onTemplateApply,
  currentValues
}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null);

  // Form state
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateTags, setTemplateTags] = useState('');

  // Load templates
  useEffect(() => {
    async function loadTemplates() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/parameters?scanner_type=${scannerType}&action=templates`
        );
        const data = await response.json();

        if (data.success) {
          setTemplates(data.templates || []);
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTemplates();
  }, [scannerType]);

  // Save template
  const saveTemplate = async () => {
    if (!templateName.trim()) {
      setValidationResult({ valid: false, message: 'Template name is required' });
      return;
    }

    try {
      const tags = templateTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const response = await fetch('/api/parameters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_template',
          template: {
            name: templateName,
            description: templateDescription,
            scanner_type: scannerType,
            parameters: currentValues || {},
            is_default: false,
            tags: tags
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setValidationResult({ valid: true, message: 'Template saved successfully!' });
        setShowSaveForm(false);
        setTemplateName('');
        setTemplateDescription('');
        setTemplateTags('');

        // Reload templates
        const templatesResponse = await fetch(
          `/api/parameters?scanner_type=${scannerType}&action=templates`
        );
        const templatesData = await templatesResponse.json();
        if (templatesData.success) {
          setTemplates(templatesData.templates || []);
        }

        setTimeout(() => setValidationResult(null), 3000);
      } else {
        setValidationResult({ valid: false, message: data.error || 'Failed to save template' });
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      setValidationResult({ valid: false, message: 'Error saving template' });
    }
  };

  // Apply template
  const applyTemplate = async (templateId: string) => {
    try {
      const response = await fetch('/api/parameters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_template',
          template_id: templateId
        })
      });

      const data = await response.json();

      if (data.success) {
        setValidationResult({ valid: true, message: 'Template applied successfully!' });
        setSelectedTemplate(templates.find(t => t.id === templateId) || null);

        if (onTemplateApply) {
          onTemplateApply(templateId);
        }

        setTimeout(() => setValidationResult(null), 3000);
      } else {
        setValidationResult({ valid: false, message: data.error || 'Failed to apply template' });
      }
    } catch (error) {
      console.error('Failed to apply template:', error);
      setValidationResult({ valid: false, message: 'Error applying template' });
    }
  };

  // Delete template
  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch('/api/parameters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_template',
          template_id: templateId
        })
      });

      const data = await response.json();

      if (data.success) {
        setTemplates(templates.filter(t => t.id !== templateId));
        setValidationResult({ valid: true, message: 'Template deleted successfully!' });
        setTimeout(() => setValidationResult(null), 3000);
      } else {
        setValidationResult({ valid: false, message: data.error || 'Failed to delete template' });
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      setValidationResult({ valid: false, message: 'Error deleting template' });
    }
  };

  // Duplicate template
  const duplicateTemplate = async (template: Template) => {
    try {
      const response = await fetch('/api/parameters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_template',
          template: {
            name: `${template.name} (Copy)`,
            description: template.description,
            scanner_type: scannerType,
            parameters: template.parameters,
            is_default: false,
            tags: template.tags
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        // Reload templates
        const templatesResponse = await fetch(
          `/api/parameters?scanner_type=${scannerType}&action=templates`
        );
        const templatesData = await templatesResponse.json();
        if (templatesData.success) {
          setTemplates(templatesData.templates || []);
        }

        setValidationResult({ valid: true, message: 'Template duplicated successfully!' });
        setTimeout(() => setValidationResult(null), 3000);
      } else {
        setValidationResult({ valid: false, message: data.error || 'Failed to duplicate template' });
      }
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      setValidationResult({ valid: false, message: 'Error duplicating template' });
    }
  };

  // Export template
  const exportTemplate = (template: Template) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.replace(/\s+/g, '_')}_template.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import template
  const importTemplate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const template = JSON.parse(text);

      const response = await fetch('/api/parameters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_template',
          template: template
        })
      });

      const data = await response.json();

      if (data.success) {
        // Reload templates
        const templatesResponse = await fetch(
          `/api/parameters?scanner_type=${scannerType}&action=templates`
        );
        const templatesData = await templatesResponse.json();
        if (templatesData.success) {
          setTemplates(templatesData.templates || []);
        }

        setValidationResult({ valid: true, message: 'Template imported successfully!' });
        setTimeout(() => setValidationResult(null), 3000);
      } else {
        setValidationResult({ valid: false, message: data.error || 'Failed to import template' });
      }
    } catch (error) {
      console.error('Failed to import template:', error);
      setValidationResult({ valid: false, message: 'Error importing template' });
    }

    // Reset input
    event.target.value = '';
  };

  // Get parameter count
  const getParameterCount = (template: Template) => {
    return Object.keys(template.parameters).length;
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
          <h3 className="text-xl font-semibold">Template Manager</h3>
          <p className="text-sm text-muted-foreground">
            Save and load parameter configurations for {scannerType.replace('_', ' ').toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('template-import')?.click()}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <input
            id="template-import"
            type="file"
            accept=".json"
            onChange={importTemplate}
            className="hidden"
          />
          <Button
            size="sm"
            onClick={() => setShowSaveForm(!showSaveForm)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Save Template
          </Button>
        </div>
      </div>

      {/* Validation Result */}
      {validationResult && (
        <div className={`p-3 rounded-lg flex items-start gap-2 ${
          validationResult.valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {validationResult.valid ? (
            <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          )}
          <span>{validationResult.message}</span>
        </div>
      )}

      {/* Save Template Form */}
      {showSaveForm && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Save Current Configuration as Template</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSaveForm(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div>
            <Label>Template Name *</Label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="My Trading Strategy"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Describe this configuration..."
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Tags (comma-separated)</Label>
            <Input
              value={templateTags}
              onChange={(e) => setTemplateTags(e.target.value)}
              placeholder="aggressive, high-volume, backtest"
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSaveForm(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveTemplate} className="gap-2">
              <Save className="w-4 h-4" />
              Save Template
            </Button>
          </div>
        </Card>
      )}

      {/* Template List */}
      <div className="space-y-3">
        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No templates found. Create your first template by clicking "Save Template".
          </div>
        ) : (
          templates.map(template => (
            <Card
              key={template.id}
              className={`p-4 ${
                selectedTemplate?.id === template.id ? 'border-primary' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{template.name}</h4>
                    {template.is_default && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {template.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{getParameterCount(template)} parameters</span>
                    {template.tags && template.tags.length > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex gap-1">
                          {template.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}
                    {template.created_at && (
                      <>
                        <span>•</span>
                        <span>Created {new Date(template.created_at).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => applyTemplate(template.id)}
                    title="Apply template"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicateTemplate(template)}
                    title="Duplicate template"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => exportTemplate(template)}
                    title="Export template"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {!template.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTemplate(template.id)}
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="pt-4 border-t text-sm text-muted-foreground">
        Total: {templates.length} templates • {templates.filter(t => t.is_default).length} default
      </div>
    </div>
  );
}
