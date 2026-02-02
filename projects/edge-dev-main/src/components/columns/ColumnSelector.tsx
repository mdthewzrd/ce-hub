/**
 * Column Selector Component
 * Allows users to select which columns to display in scan results
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

interface Column {
  id: string;
  name: string;
  label: string;
  type: string;
  visible: boolean;
  order: number;
  tags: string[];
}

interface ColumnSelectorProps {
  scannerType: string;
  onColumnsChange?: (columns: string[]) => void;
  initialColumns?: string[];
}

export function ColumnSelector({
  scannerType,
  onColumnsChange,
  initialColumns
}: ColumnSelectorProps) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());

  // Load columns for scanner type
  useEffect(() => {
    async function loadColumns() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/columns/configure?scanner_type=${scannerType}&action=columns&include_hidden=false`
        );
        const data = await response.json();

        if (data.success) {
          setColumns(data.columns);

          // Initialize selected columns
          const initial: Set<string> = initialColumns
            ? new Set(initialColumns)
            : new Set(data.columns.filter((c: Column) => c.visible).map((c: Column) => c.id));

          setSelectedColumns(initial);
        }
      } catch (error) {
        console.error('Failed to load columns:', error);
      } finally {
        setLoading(false);
      }
    }

    loadColumns();
  }, [scannerType, initialColumns]);

  // Toggle column selection
  const toggleColumn = (columnId: string) => {
    const newSelected = new Set(selectedColumns);

    if (newSelected.has(columnId)) {
      newSelected.delete(columnId);
    } else {
      newSelected.add(columnId);
    }

    setSelectedColumns(newSelected);

    // Notify parent
    if (onColumnsChange) {
      onColumnsChange(Array.from(newSelected));
    }
  };

  // Select all columns
  const selectAll = () => {
    const allIds = new Set(columns.map(c => c.id));
    setSelectedColumns(allIds);

    if (onColumnsChange) {
      onColumnsChange(Array.from(allIds));
    }
  };

  // Clear all selections
  const clearAll = () => {
    setSelectedColumns(new Set());

    if (onColumnsChange) {
      onColumnsChange([]);
    }
  };

  // Apply preset
  const applyPreset = async (presetName: string) => {
    try {
      const response = await fetch(
        `/api/columns/configure?scanner_type=${scannerType}&action=presets`
      );
      const data = await response.json();

      if (data.success) {
        const preset = data.presets.find((p: any) => p.name === presetName);
        if (preset) {
          const visibleIds = preset.columns
            .filter((c: Column) => c.visible)
            .map((c: Column) => c.id);

          setSelectedColumns(new Set(visibleIds));

          if (onColumnsChange) {
            onColumnsChange(visibleIds);
          }
        }
      }
    } catch (error) {
      console.error('Failed to apply preset:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-card">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Display Columns</h3>
          <p className="text-sm text-muted-foreground">
            {selectedColumns.size} of {columns.length} selected
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1 text-xs border rounded hover:bg-accent"
          >
            Select All
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-1 text-xs border rounded hover:bg-accent"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Presets */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => applyPreset('Standard LC D2')}
          className="px-3 py-1 text-xs border rounded hover:bg-accent"
        >
          Standard
        </button>
        <button
          onClick={() => applyPreset('LC D2 Compact')}
          className="px-3 py-1 text-xs border rounded hover:bg-accent"
        >
          Compact
        </button>
        <button
          onClick={() => applyPreset('LC D2 Detailed')}
          className="px-3 py-1 text-xs border rounded hover:bg-accent"
        >
          Detailed
        </button>
      </div>

      {/* Column List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex items-center gap-3 p-2 border rounded hover:bg-accent cursor-pointer"
            onClick={() => toggleColumn(column.id)}
          >
            <input
              type="checkbox"
              checked={selectedColumns.has(column.id)}
              onChange={() => {}}
              className="w-4 h-4"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{column.label}</span>
                <Badge variant="outline" className="text-xs">
                  {column.type}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {column.name}
              </div>
            </div>
            <div className="flex gap-1">
              {column.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Columns Summary */}
      {selectedColumns.size > 0 && (
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-1">Selected:</div>
          <div className="flex flex-wrap gap-1">
            {Array.from(selectedColumns).map(colId => {
              const col = columns.find(c => c.id === colId);
              return col ? (
                <Badge key={colId} variant="default" className="text-xs">
                  {col.label}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
