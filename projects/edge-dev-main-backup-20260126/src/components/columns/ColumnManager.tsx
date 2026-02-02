/**
 * Column Manager Component
 * Advanced column management: add, edit, remove, reorder
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, GripVertical, Save, X } from 'lucide-react';

interface Column {
  id: string;
  name: string;
  label: string;
  type: string;
  data_type: string;
  description?: string;
  visible: boolean;
  order: number;
  width?: number;
  tags: string[];
  scanner_types: string[];
}

interface ColumnManagerProps {
  scannerType: string;
  onColumnUpdate?: () => void;
}

export function ColumnManager({ scannerType, onColumnUpdate }: ColumnManagerProps) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Load columns
  useEffect(() => {
    async function loadColumns() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/columns/configure?scanner_type=${scannerType}&action=columns&include_hidden=true`
        );
        const data = await response.json();

        if (data.success) {
          setColumns(data.columns.sort((a: Column, b: Column) => a.order - b.order));
        }
      } catch (error) {
        console.error('Failed to load columns:', error);
      } finally {
        setLoading(false);
      }
    }

    loadColumns();
  }, [scannerType]);

  // Toggle visibility
  const toggleVisibility = async (columnId: string) => {
    try {
      const response = await fetch('/api/columns/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_visibility',
          column_id: columnId
        })
      });

      if (response.ok) {
        // Update local state
        setColumns(columns.map(col =>
          col.id === columnId ? { ...col, visible: !col.visible } : col
        ));

        if (onColumnUpdate) {
          onColumnUpdate();
        }
      }
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
    }
  };

  // Delete column
  const deleteColumn = async (columnId: string) => {
    if (!confirm('Are you sure you want to delete this column?')) {
      return;
    }

    try {
      const response = await fetch('/api/columns/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_column',
          column_id: columnId
        })
      });

      if (response.ok) {
        setColumns(columns.filter(col => col.id !== columnId));

        if (onColumnUpdate) {
          onColumnUpdate();
        }
      }
    } catch (error) {
      console.error('Failed to delete column:', error);
    }
  };

  // Save column edits
  const saveColumn = async (column: Column) => {
    try {
      const response = await fetch('/api/columns/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit_column',
          column_id: column.id,
          updates: column
        })
      });

      if (response.ok) {
        setColumns(columns.map(col =>
          col.id === column.id ? column : col
        ));
        setEditingColumn(null);

        if (onColumnUpdate) {
          onColumnUpdate();
        }
      }
    } catch (error) {
      console.error('Failed to save column:', error);
    }
  };

  // Reorder columns
  const moveColumn = async (fromIndex: number, toIndex: number) => {
    const newColumns = [...columns];
    const [removed] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, removed);

    // Update orders
    const reorderedColumns = newColumns.map((col, idx) => ({
      ...col,
      order: idx
    }));

    setColumns(reorderedColumns);

    try {
      const response = await fetch('/api/columns/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reorder_columns',
          column_ids: reorderedColumns.map(c => c.id)
        })
      });

      if (response.ok && onColumnUpdate) {
        onColumnUpdate();
      }
    } catch (error) {
      console.error('Failed to reorder columns:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 border rounded-lg bg-card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
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
          <h3 className="text-xl font-semibold">Column Manager</h3>
          <p className="text-sm text-muted-foreground">
            Manage columns for {scannerType.replace('_', ' ').toUpperCase()}
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Column
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="p-4 border rounded-lg bg-accent space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Add New Column</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            To add custom columns, use the API directly or create a computed column
          </p>
          <div className="text-xs text-muted-foreground">
            API Endpoint: POST /api/columns/configure with action='add_column'
          </div>
        </div>
      )}

      {/* Column List */}
      <div className="space-y-2">
        {columns.map((column, index) => (
          <div
            key={column.id}
            className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent transition-colors"
          >
            {/* Drag Handle */}
            <div className="flex flex-col gap-1 text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto"
                onClick={() => moveColumn(index, Math.max(0, index - 1))}
                disabled={index === 0}
              >
                ▲
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto"
                onClick={() => moveColumn(index, Math.min(columns.length - 1, index + 1))}
                disabled={index === columns.length - 1}
              >
                ▼
              </Button>
            </div>

            {/* Column Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{column.label}</span>
                <Badge variant="outline" className="text-xs">
                  {column.type}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {column.data_type}
                </Badge>
                {!column.visible && (
                  <Badge variant="destructive" className="text-xs">
                    Hidden
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {column.name}
                {column.description && ` • ${column.description}`}
              </div>
              {column.tags.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {column.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleVisibility(column.id)}
                title={column.visible ? 'Hide' : 'Show'}
              >
                {column.visible ? '👁️' : '👁️‍🗨️'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingColumn(column)}
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteColumn(column.id)}
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingColumn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg border max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Edit Column</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingColumn(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Label</label>
                <input
                  type="text"
                  value={editingColumn.label}
                  onChange={(e) => setEditingColumn({
                    ...editingColumn,
                    label: e.target.value
                  })}
                  className="w-full mt-1 px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={editingColumn.description || ''}
                  onChange={(e) => setEditingColumn({
                    ...editingColumn,
                    description: e.target.value
                  })}
                  className="w-full mt-1 px-3 py-2 border rounded"
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm font-medium">Width</label>
                  <input
                    type="number"
                    value={editingColumn.width || ''}
                    onChange={(e) => setEditingColumn({
                      ...editingColumn,
                      width: parseInt(e.target.value) || undefined
                    })}
                    className="w-full mt-1 px-3 py-2 border rounded"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingColumn(null)}
              >
                Cancel
              </Button>
              <Button onClick={() => saveColumn(editingColumn)}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="pt-4 border-t text-sm text-muted-foreground">
        Total: {columns.length} columns • {columns.filter(c => c.visible).length} visible
      </div>
    </div>
  );
}
