'use client'

import React, { useState, useEffect } from 'react';
import {
  Save,
  X,
  Calendar,
  BarChart3,
  Tag,
  Star,
  AlertCircle,
  Check,
  TrendingUp,
  Database,
  Filter
} from 'lucide-react';
import { SaveScanModalProps, SavedScan } from '../types/scanTypes';
import { validateScanData } from '../utils/savedScans';

/**
 * Save Scan Modal Component
 * Allows users to save current scan configuration and results
 * Features:
 * - Name and description input
 * - Scan parameter summary
 * - Results preview
 * - Validation and error handling
 * - Quick save vs detailed save options
 */
export const SaveScanModal: React.FC<SaveScanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentScanParams,
  currentResults
}) => {
  const [scanName, setScanName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isQuickSave, setIsQuickSave] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setScanName(generateDefaultName());
      setDescription('');
      setTags([]);
      setNewTag('');
      setIsFavorite(false);
      setIsQuickSave(true);
      setErrors([]);
      setIsSaving(false);
    }
  }, [isOpen, currentScanParams]);

  const generateDefaultName = () => {
    const scanType = detectScanType();
    const dateRange = formatDateRange();
    return `${scanType} - ${dateRange}`;
  };

  const detectScanType = () => {
    const filters = currentScanParams.filters;

    if (filters.lc_frontside_d2_extended) return 'LC Frontside D2 Extended';
    if (filters.lc_frontside_d3_extended_1) return 'LC Frontside D3 Extended';
    if (filters.min_gap) return 'Gap Scanner';

    return 'Custom Scanner';
  };

  const formatDateRange = () => {
    const start = new Date(currentScanParams.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(currentScanParams.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${start} - ${end}`;
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      addTag();
    }
  };

  const validateForm = () => {
    const scanData: Partial<SavedScan> = {
      name: scanName.trim(),
      description: description.trim(),
      scanParams: currentScanParams
    };

    const validation = validateScanData(scanData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);

    try {
      const scanData: Omit<SavedScan, 'id' | 'createdAt'> = {
        name: scanName.trim(),
        description: description.trim() || undefined,
        scanParams: currentScanParams,
        results: currentResults,
        resultCount: currentResults.length,
        tags: tags.length > 0 ? tags : undefined,
        isFavorite,
        scanType: detectScanType(),
        tickerUniverse: 'US Stocks',
        estimatedResults: `${currentResults.length} results`
      };

      await onSave(scanData);
      onClose();

    } catch (error) {
      console.error('Error saving scan:', error);
      setErrors(['Failed to save scan. Please try again.']);
    } finally {
      setIsSaving(false);
    }
  };

  const getScanIcon = () => {
    const scanType = detectScanType();
    if (scanType.includes('LC')) return '🎯';
    if (scanType.includes('Gap')) return '📈';
    return '🔍';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Save className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-white">Save Scan Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick vs Detailed Toggle */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex border border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setIsQuickSave(true)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  isQuickSave
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                ⚡ Quick Save
              </button>
              <button
                onClick={() => setIsQuickSave(false)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  !isQuickSave
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                ⚙️ Detailed
              </button>
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-400 font-medium mb-2">
                <AlertCircle className="h-4 w-4" />
                Please fix the following errors:
              </div>
              <ul className="text-sm text-red-300 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Scan Name *
              </label>
              <input
                type="text"
                value={scanName}
                onChange={(e) => setScanName(e.target.value)}
                placeholder="e.g., LC Frontside D2 - Oct 2024"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                maxLength={100}
                autoFocus
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <div className="text-xs text-gray-500 mt-1">
                {scanName.length}/100 characters
              </div>
            </div>

            {!isQuickSave && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this scan does, when to use it, or any special notes..."
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none resize-none"
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {description.length}/500 characters
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tags (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-gray-400 hover:text-gray-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Add a tag..."
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none text-sm"
                      maxLength={20}
                    />
                    <button
                      onClick={addTag}
                      disabled={!newTag.trim()}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-lg transition-colors text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Favorite Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isFavorite
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                        : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                    Mark as Favorite
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Scan Summary */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{getScanIcon()}</span>
              <h3 className="text-lg font-medium text-white">Scan Summary</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-700/50 p-3 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-300">Scan Type</span>
                </div>
                <div className="text-sm text-white">{detectScanType()}</div>
              </div>

              <div className="bg-gray-700/50 p-3 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-300">Date Range</span>
                </div>
                <div className="text-sm text-white">{formatDateRange()}</div>
              </div>

              <div className="bg-gray-700/50 p-3 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-300">Results</span>
                </div>
                <div className="text-sm text-white">{currentResults.length} tickers</div>
              </div>
            </div>

            {/* Key Filters */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Filter className="h-4 w-4" />
                Key Filters:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {Object.entries(currentScanParams.filters).map(([key, value]) => (
                  <div key={key} className="flex justify-between bg-gray-700/30 px-2 py-1 rounded">
                    <span className="text-gray-400">{key.replace(/_/g, ' ')}</span>
                    <span className="text-white">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Results Preview */}
          {currentResults.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3">Top Results Preview</h3>
              <div className="space-y-2">
                {currentResults.slice(0, 5).map((result, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-700/50 px-3 py-2 rounded text-sm">
                    <span className="font-mono text-white">{result.ticker}</span>
                    <span className="text-green-400">+{(result.gapPercent || 0).toFixed(1)}%</span>
                    <span className="text-gray-400">{((result.volume || 0) / 1000000).toFixed(1)}M vol</span>
                    <span className="text-yellow-400">{(result.score || 0).toFixed(1)} score</span>
                  </div>
                ))}
                {currentResults.length > 5 && (
                  <div className="text-center text-gray-400 text-xs">
                    ... and {currentResults.length - 5} more results
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-400">
              {currentResults.length} results will be saved
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving || !scanName.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-700 disabled:opacity-50 text-black font-medium rounded-lg transition-colors"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Scan
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveScanModal;