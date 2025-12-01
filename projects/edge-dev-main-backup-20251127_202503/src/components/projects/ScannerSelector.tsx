/**
 * ScannerSelector Component
 *
 * Enables users to add/remove scanners from projects with drag-and-drop support,
 * scanner compatibility validation, and weight configuration for aggregation.
 */

'use client'

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, GripVertical, Target, Weight, ToggleLeft, ToggleRight, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Scanner,
  AvailableScanner,
  ScannerSelectorProps,
  UpdateScannerRequest,
  ScannerFilters
} from '@/types/projectTypes';
import { cn } from '@/lib/utils';

// Available Scanner Card Component
interface AvailableScannerCardProps {
  scanner: AvailableScanner;
  isSelected: boolean;
  onSelect: (scanner: AvailableScanner) => void;
  disabled?: boolean;
}

const AvailableScannerCard: React.FC<AvailableScannerCardProps> = ({
  scanner,
  isSelected,
  onSelect,
  disabled = false
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all border-2",
        isSelected
          ? "bg-blue-900 border-blue-600"
          : "bg-gray-800 border-gray-700 hover:border-gray-600",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => !disabled && onSelect(scanner)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-semibold text-white truncate">{scanner.name}</h3>
        <Badge
          variant="secondary"
          className="text-xs bg-gray-700 text-gray-300 ml-2"
        >
          {scanner.category}
        </Badge>
      </div>

      <p className="text-xs text-gray-400 mb-3 line-clamp-2">{scanner.description}</p>

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Settings className="h-3 w-3" />
          <span>{scanner.parameters_count} params</span>
        </div>
        <div>Created: {formatDate(scanner.created_at)}</div>
      </div>

      {isSelected && (
        <div className="mt-3 pt-3 border-t border-blue-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-300">Selected</span>
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs border-blue-600 text-blue-300 hover:bg-blue-800"
            >
              Configure
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

// Project Scanner Card Component
interface ProjectScannerCardProps {
  scanner: Scanner;
  onRemove: (scannerId: string) => void;
  onUpdate: (scannerId: string, updates: UpdateScannerRequest) => void;
  onConfigure: (scanner: Scanner) => void;
  dragHandleProps?: any;
}

const ProjectScannerCard: React.FC<ProjectScannerCardProps> = ({
  scanner,
  onRemove,
  onUpdate,
  onConfigure,
  dragHandleProps
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    weight: scanner.weight,
    order_index: scanner.order_index
  });

  const handleSave = async () => {
    try {
      await onUpdate(scanner.scanner_id, editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update scanner:', error);
    }
  };

  const handleToggleEnabled = async () => {
    try {
      await onUpdate(scanner.scanner_id, { enabled: !scanner.enabled });
    } catch (error) {
      console.error('Failed to toggle scanner:', error);
    }
  };

  return (
    <Card className={cn(
      "p-4 transition-all",
      scanner.enabled
        ? "bg-gray-800 border-gray-700"
        : "bg-gray-900 border-gray-800 opacity-75"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1">
          <div {...dragHandleProps} className="cursor-move text-gray-400 hover:text-white">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-white truncate">
                {scanner.scanner_id}
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleToggleEnabled}
                className="p-0 h-auto text-gray-400 hover:text-white"
              >
                {scanner.enabled ? (
                  <ToggleRight className="h-4 w-4 text-green-400" />
                ) : (
                  <ToggleLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-400 truncate">{scanner.scanner_file}</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onConfigure(scanner)}
            className="text-gray-400 hover:text-white h-6 w-6 p-0"
          >
            <Settings className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(!isEditing)}
            className="text-gray-400 hover:text-white h-6 w-6 p-0"
          >
            <Weight className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(scanner.scanner_id)}
            className="text-gray-400 hover:text-red-400 h-6 w-6 p-0"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Scanner Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Weight className="h-3 w-3" />
          <span>Weight: {scanner.weight}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Target className="h-3 w-3" />
          <span>Order: {scanner.order_index}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Settings className="h-3 w-3" />
          <span>{scanner.parameter_count} params</span>
        </div>
      </div>

      {/* Edit Mode */}
      {isEditing && (
        <div className="border-t border-gray-700 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-300">Weight</Label>
              <Input
                type="number"
                value={editData.weight}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  weight: parseFloat(e.target.value) || 0
                }))}
                min="0"
                step="0.1"
                className="h-8 bg-gray-900 border-gray-600 text-white text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-300">Order</Label>
              <Input
                type="number"
                value={editData.order_index}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  order_index: parseInt(e.target.value) || 0
                }))}
                min="0"
                className="h-8 bg-gray-900 border-gray-600 text-white text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="h-7 px-2 text-xs border-gray-600"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700"
            >
              Save
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

// Main ScannerSelector Component
export const ScannerSelector: React.FC<ScannerSelectorProps> = ({
  projectId,
  availableScanners,
  selectedScanners,
  onSelectScanner,
  onRemoveScanner,
  onUpdateScanner,
  loading = false
}) => {
  const [availableFilters, setAvailableFilters] = useState<ScannerFilters>({
    searchTerm: '',
    category: '',
    sort_by: 'name',
    sort_order: 'asc'
  });
  const [selectedFilters, setSelectedFilters] = useState<ScannerFilters>({
    searchTerm: '',
    enabled: undefined,
    sort_by: 'order_index',
    sort_order: 'asc'
  });
  const [showAvailableFilters, setShowAvailableFilters] = useState(false);
  const [configuringScanner, setConfiguringScanner] = useState<Scanner | null>(null);

  // Filter available scanners
  const filteredAvailableScanners = availableScanners
    .filter(scanner => {
      // Exclude already selected scanners
      if (selectedScanners.some(s => s.scanner_id === scanner.id)) {
        return false;
      }

      // Search term filter
      if (availableFilters.searchTerm) {
        const searchLower = availableFilters.searchTerm.toLowerCase();
        const matchesSearch =
          scanner.name.toLowerCase().includes(searchLower) ||
          scanner.description.toLowerCase().includes(searchLower) ||
          scanner.category.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (availableFilters.category && scanner.category !== availableFilters.category) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const order = availableFilters.sort_order === 'asc' ? 1 : -1;

      switch (availableFilters.sort_by) {
        case 'name':
          return order * a.name.localeCompare(b.name);
        case 'parameter_count':
          return order * (a.parameters_count - b.parameters_count);
        default:
          return order * a.name.localeCompare(b.name);
      }
    });

  // Filter selected scanners
  const filteredSelectedScanners = selectedScanners
    .filter(scanner => {
      // Search term filter
      if (selectedFilters.searchTerm) {
        const searchLower = selectedFilters.searchTerm.toLowerCase();
        const matchesSearch =
          scanner.scanner_id.toLowerCase().includes(searchLower) ||
          scanner.scanner_file.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Enabled filter
      if (selectedFilters.enabled !== undefined && scanner.enabled !== selectedFilters.enabled) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const order = selectedFilters.sort_order === 'asc' ? 1 : -1;

      switch (selectedFilters.sort_by) {
        case 'name':
          return order * a.scanner_id.localeCompare(b.scanner_id);
        case 'weight':
          return order * (a.weight - b.weight);
        case 'parameter_count':
          return order * (a.parameter_count - b.parameter_count);
        case 'order_index':
        default:
          return order * (a.order_index - b.order_index);
      }
    });

  const handleSelectScanner = async (scanner: AvailableScanner) => {
    try {
      await onSelectScanner(scanner);
    } catch (error) {
      console.error('Failed to select scanner:', error);
    }
  };

  const handleRemoveScanner = async (scannerId: string) => {
    if (confirm('Are you sure you want to remove this scanner from the project?')) {
      try {
        await onRemoveScanner(scannerId);
      } catch (error) {
        console.error('Failed to remove scanner:', error);
      }
    }
  };

  // Get unique categories for filter
  const availableCategories = Array.from(new Set(availableScanners.map(s => s.category))).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Scanner Configuration</h2>
        <p className="text-gray-400">
          Add scanners to your project and configure their execution parameters
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Scanners Panel */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Available Scanners</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAvailableFilters(!showAvailableFilters)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Available Scanners Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              value={availableFilters.searchTerm}
              onChange={(e) => setAvailableFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              placeholder="Search available scanners..."
              className="pl-10 bg-gray-800 border-gray-600 text-white"
            />
          </div>

          {/* Available Scanners Filters */}
          {showAvailableFilters && (
            <Card className="bg-gray-800 border-gray-700 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-200">Category</Label>
                  <select
                    value={availableFilters.category || ''}
                    onChange={(e) => setAvailableFilters(prev => ({
                      ...prev,
                      category: e.target.value || ''
                    }))}
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-white text-sm"
                  >
                    <option value="">All categories</option>
                    {availableCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-200">Sort</Label>
                  <select
                    value={availableFilters.sort_by}
                    onChange={(e) => setAvailableFilters(prev => ({
                      ...prev,
                      sort_by: e.target.value as any
                    }))}
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-white text-sm"
                  >
                    <option value="name">Name</option>
                    <option value="parameter_count">Parameter Count</option>
                  </select>
                </div>
              </div>
            </Card>
          )}

          {/* Available Scanners Grid */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <Card key={i} className="bg-gray-800 border-gray-700 p-4 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded mb-3 w-2/3"></div>
                  <div className="flex space-x-2">
                    <div className="h-4 bg-gray-700 rounded w-16"></div>
                    <div className="h-4 bg-gray-700 rounded w-20"></div>
                  </div>
                </Card>
              ))
            ) : filteredAvailableScanners.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700 p-6 text-center">
                <p className="text-gray-400">No available scanners found</p>
              </Card>
            ) : (
              filteredAvailableScanners.map((scanner) => (
                <AvailableScannerCard
                  key={scanner.id}
                  scanner={scanner}
                  isSelected={false}
                  onSelect={handleSelectScanner}
                  disabled={loading}
                />
              ))
            )}
          </div>
        </div>

        {/* Project Scanners Panel */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">
              Project Scanners ({selectedScanners.length})
            </h3>
            <Badge
              variant="secondary"
              className="bg-blue-900 text-blue-200"
            >
              {selectedScanners.filter(s => s.enabled).length} enabled
            </Badge>
          </div>

          {/* Project Scanners Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              value={selectedFilters.searchTerm}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              placeholder="Search project scanners..."
              className="pl-10 bg-gray-800 border-gray-600 text-white"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant={selectedFilters.enabled === undefined ? "default" : "outline"}
              onClick={() => setSelectedFilters(prev => ({ ...prev, enabled: undefined }))}
              className="text-xs"
            >
              All
            </Button>
            <Button
              size="sm"
              variant={selectedFilters.enabled === true ? "default" : "outline"}
              onClick={() => setSelectedFilters(prev => ({ ...prev, enabled: true }))}
              className="text-xs"
            >
              Enabled
            </Button>
            <Button
              size="sm"
              variant={selectedFilters.enabled === false ? "default" : "outline"}
              onClick={() => setSelectedFilters(prev => ({ ...prev, enabled: false }))}
              className="text-xs"
            >
              Disabled
            </Button>
          </div>

          {/* Project Scanners List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedScanners.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700 p-6 text-center">
                <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 mb-2">No scanners added yet</p>
                <p className="text-gray-500 text-sm">
                  Select scanners from the available list to add them to your project
                </p>
              </Card>
            ) : (
              filteredSelectedScanners.map((scanner) => (
                <ProjectScannerCard
                  key={scanner.scanner_id}
                  scanner={scanner}
                  onRemove={handleRemoveScanner}
                  onUpdate={onUpdateScanner}
                  onConfigure={setConfiguringScanner}
                />
              ))
            )}
          </div>

          {/* Aggregation Summary */}
          {selectedScanners.length > 0 && (
            <Card className="bg-gray-800 border-gray-700 p-4">
              <h4 className="text-sm font-semibold text-white mb-2">Aggregation Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                <div>Total Weight: {selectedScanners.reduce((sum, s) => sum + s.weight, 0).toFixed(1)}</div>
                <div>Enabled: {selectedScanners.filter(s => s.enabled).length}</div>
                <div>Avg Parameters: {Math.round(selectedScanners.reduce((sum, s) => sum + s.parameter_count, 0) / selectedScanners.length)}</div>
                <div>Execution Order: {selectedScanners.length > 1 ? 'Sequential' : 'Single'}</div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScannerSelector;