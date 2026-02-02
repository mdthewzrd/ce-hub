'use client'

import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Search,
  Calendar,
  TrendingUp,
  Star,
  AlertCircle,
  Loader,
  Check
} from 'lucide-react';

interface SavedScan {
  id: string;
  scan_name: string;
  description?: string;
  scan_type: string;
  results_count: number;
  timestamp: string;
  is_favorite: boolean;
  tags?: string[];
}

interface LoadSavedScansModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (scanId: string) => void;
}

export const LoadSavedScansModal: React.FC<LoadSavedScansModalProps> = ({
  isOpen,
  onClose,
  onLoad
}) => {
  const [savedScans, setSavedScans] = useState<SavedScan[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScan, setSelectedScan] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  // Load saved scans when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSavedScans();
    }
  }, [isOpen]);

  const loadSavedScans = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5666/api/scans/user/test_user_123');
      const data = await response.json();

      if (data.success) {
        setSavedScans(data.scans || []);
        console.log(`📂 Loaded ${data.scans?.length || 0} saved scans`);
      } else {
        setError('Failed to load saved scans');
        console.error('❌ Failed to load saved scans:', data);
      }
    } catch (error) {
      setError('Network error loading saved scans');
      console.error('❌ Error loading saved scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredScans = savedScans.filter(scan =>
    scan.scan_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scan.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scan.scan_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLoad = () => {
    if (selectedScan) {
      console.log('🔄 Loading saved scan:', selectedScan);
      onLoad(selectedScan);
      onClose();
      setSelectedScan(null);
      setSearchTerm('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-white">Load Saved Scan</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search saved scans..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-6 w-6 text-yellow-500 animate-spin" />
              <span className="ml-2 text-gray-300">Loading saved scans...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-red-400 p-4 bg-red-900/30 rounded-lg border border-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          ) : filteredScans.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchTerm ? 'No saved scans found matching your search' : 'No saved scans found'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {searchTerm ? 'Try a different search term' : 'Save a scan to see it here'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredScans.map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => setSelectedScan(scan.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedScan === scan.id
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white">{scan.scan_name}</h3>
                        {scan.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                      </div>
                      {scan.description && (
                        <p className="text-sm text-gray-400 mb-2">{scan.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Type:</span>
                          <span>{scan.scan_type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(scan.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>{scan.results_count} results</span>
                        </div>
                      </div>
                      {scan.tags && scan.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {scan.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      {selectedScan === scan.id && (
                        <Check className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            {filteredScans.length} saved scan{filteredScans.length !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLoad}
              disabled={!selectedScan || loading}
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-colors"
            >
              Load Scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadSavedScansModal;