'use client'

import React, { useState } from 'react';
import {
  Search,
  Star,
  Calendar,
  BarChart3,
  MoreVertical,
  Edit2,
  Trash2,
  Download,
  Upload,
  Filter,
  TrendingUp,
  Clock
} from 'lucide-react';
import { SavedScansSidebarProps, SavedScan } from '../types/scanTypes';

/**
 * Saved Scans Sidebar Component
 * Displays and manages saved LC scanner configurations
 * Features:
 * - Search and filter saved scans
 * - Load, rename, delete operations
 * - Favorite/unfavorite scans
 * - Show scan metadata and stats
 * - Compact design for sidebar layout
 */
export const SavedScansSidebar: React.FC<SavedScansSidebarProps> = ({
  savedScans,
  onLoadScan,
  onDeleteScan,
  onRenameScan,
  onToggleFavorite,
  isVisible,
  selectedScanId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter scans based on search and favorites
  const filteredScans = savedScans.filter(scan => {
    const matchesSearch = searchQuery === '' ||
      scan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (scan.description && scan.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFavorites = !showFavoritesOnly || scan.isFavorite;

    return matchesSearch && matchesFavorites;
  });

  const handleStartRename = (scan: SavedScan) => {
    setEditingId(scan.id);
    setEditingName(scan.name);
  };

  const handleSaveRename = () => {
    if (editingId && editingName.trim()) {
      onRenameScan(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    });
  };

  const getScanTypeIcon = (scanType?: string) => {
    if (scanType?.includes('LC')) return '🎯';
    if (scanType?.includes('Gap')) return '📈';
    if (scanType?.includes('Breakout')) return '🚀';
    if (scanType?.includes('Volume')) return '📊';
    if (scanType?.includes('Parabolic')) return '⚡';
    return '🔍';
  };

  const getScanTypeColor = (scanType?: string) => {
    if (scanType?.includes('LC')) return 'text-yellow-500';
    if (scanType?.includes('Gap')) return 'text-green-500';
    if (scanType?.includes('Breakout')) return 'text-blue-500';
    if (scanType?.includes('Volume')) return 'text-purple-500';
    if (scanType?.includes('Parabolic')) return 'text-orange-500';
    return 'text-gray-500';
  };

  if (!isVisible) return null;

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold text-white">Saved Scans</h2>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search saved scans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              showFavoritesOnly
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Star className="h-3 w-3" />
            Favorites
          </button>

          <div className="text-xs text-gray-400">
            {filteredScans.length} of {savedScans.length}
          </div>
        </div>
      </div>

      {/* Scans List */}
      <div className="flex-1 overflow-y-auto">
        {filteredScans.length === 0 ? (
          <div className="p-4 text-center">
            <div className="text-gray-500 mb-2">
              {searchQuery || showFavoritesOnly ? (
                <>
                  <Filter className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-sm">No scans match your filters</div>
                </>
              ) : (
                <>
                  <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-sm">No saved scans yet</div>
                  <div className="text-xs mt-1">
                    Run a scan and save it to get started
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {filteredScans.map((scan) => (
              <div
                key={scan.id}
                className={`rounded-lg p-3 transition-colors ${
                  selectedScanId === scan.id
                    ? 'bg-yellow-500/20 border-yellow-500 shadow-lg'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                } border`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-lg flex-shrink-0">
                      {getScanTypeIcon(scan.scanType)}
                    </span>
                    <div className="flex-1 min-w-0">
                      {editingId === scan.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={handleSaveRename}
                          onKeyDown={handleKeyPress}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-yellow-500 focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => onLoadScan(scan)}
                          className="text-left w-full"
                        >
                          <div className="font-medium text-white text-sm truncate hover:text-yellow-500 transition-colors">
                            {scan.name}
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {scan.isFavorite && (
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    )}
                    <button
                      onClick={() => setExpandedId(expandedId === scan.id ? null : scan.id)}
                      className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span className={`font-medium ${getScanTypeColor(scan.scanType)}`}>
                    {scan.scanType || 'Custom Scanner'}
                  </span>
                  <span>{scan.resultCount} results</span>
                </div>

                {/* Date Range */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDate(scan.scanParams.start_date)} - {formatDate(scan.scanParams.end_date)}
                  </span>
                </div>

                {/* Expanded Actions */}
                {expandedId === scan.id && (
                  <div className="border-t border-gray-700 pt-2 mt-2">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button
                        onClick={() => handleStartRename(scan)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors text-gray-300"
                      >
                        <Edit2 className="h-3 w-3" />
                        Rename
                      </button>
                      <button
                        onClick={() => onToggleFavorite(scan.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors text-gray-300"
                      >
                        <Star className="h-3 w-3" />
                        {scan.isFavorite ? 'Unfavorite' : 'Favorite'}
                      </button>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1 text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Created {formatDate(scan.createdAt)}</span>
                      </div>
                      {scan.lastRun && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>Last run {formatDate(scan.lastRun)}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {scan.description && (
                      <div className="text-xs text-gray-400 mb-3 p-2 bg-gray-700/50 rounded">
                        {scan.description}
                      </div>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete scan "${scan.name}"? This cannot be undone.`)) {
                          onDeleteScan(scan.id);
                        }
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded transition-colors w-full justify-center"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete Scan
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-700">
        <div className="text-xs text-gray-500 text-center">
          {savedScans.length} saved scan{savedScans.length !== 1 ? 's' : ''}
          {savedScans.filter(s => s.isFavorite).length > 0 && (
            <>
              {' • '}
              {savedScans.filter(s => s.isFavorite).length} favorite{savedScans.filter(s => s.isFavorite).length !== 1 ? 's' : ''}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedScansSidebar;