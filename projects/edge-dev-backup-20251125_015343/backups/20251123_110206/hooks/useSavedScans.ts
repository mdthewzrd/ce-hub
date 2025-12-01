/**
 * React Hook for Saved Scans Management
 * Handles localStorage persistence, CRUD operations, and state management for saved scans
 */

import { useState, useEffect, useCallback } from 'react';
import { SavedScan, EnhancedScanResult } from '../types/scanTypes';
import {
  loadSavedScans,
  saveScan,
  updateScan,
  deleteScan,
  toggleScanFavorite,
  renameScan,
  updateScanResults,
  searchSavedScans,
  getFavoriteScans,
  cleanupOldScans,
  getStorageStats
} from '../utils/savedScans';

interface UseSavedScansOptions {
  autoLoadOnMount?: boolean;
  autoCleanupOnMount?: boolean;
  onScanSaved?: (scan: SavedScan) => void;
  onScanLoaded?: (scan: SavedScan) => void;
  onScanDeleted?: (scanId: string) => void;
  onError?: (error: string) => void;
}

export function useSavedScans({
  autoLoadOnMount = true,
  autoCleanupOnMount = true,
  onScanSaved,
  onScanLoaded,
  onScanDeleted,
  onError
}: UseSavedScansOptions = {}) {
  // State
  const [savedScans, setSavedScans] = useState<SavedScan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Load saved scans from localStorage
  const loadScans = useCallback(async () => {
    try {
      setIsLoading(true);
      setLastError(null);

      const scans = loadSavedScans();
      setSavedScans(scans);

      console.log(`📁 Loaded ${scans.length} saved scans`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load saved scans';
      setLastError(errorMessage);
      onError?.(errorMessage);
      console.error('Error loading saved scans:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Save a new scan
  const handleSaveScan = useCallback(async (scanData: Omit<SavedScan, 'id' | 'createdAt'>) => {
    try {
      setIsLoading(true);
      setLastError(null);

      const newScan = saveScan(scanData);
      setSavedScans(prev => [newScan, ...prev.filter(s => s.id !== newScan.id)]);

      onScanSaved?.(newScan);
      console.log(`✅ Saved scan: ${newScan.name}`);

      return newScan;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save scan';
      setLastError(errorMessage);
      onError?.(errorMessage);
      console.error('Error saving scan:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onScanSaved, onError]);

  // Update an existing scan
  const handleUpdateScan = useCallback(async (scanId: string, updates: Partial<SavedScan>) => {
    try {
      setIsLoading(true);
      setLastError(null);

      const updatedScan = updateScan(scanId, updates);
      if (updatedScan) {
        setSavedScans(prev =>
          prev.map(scan => scan.id === scanId ? updatedScan : scan)
        );

        console.log(`✅ Updated scan: ${updatedScan.name}`);
        return updatedScan;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update scan';
      setLastError(errorMessage);
      onError?.(errorMessage);
      console.error('Error updating scan:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Delete a scan
  const handleDeleteScan = useCallback(async (scanId: string) => {
    try {
      setIsLoading(true);
      setLastError(null);

      const success = deleteScan(scanId);
      if (success) {
        setSavedScans(prev => prev.filter(scan => scan.id !== scanId));
        onScanDeleted?.(scanId);
        console.log(`🗑️ Deleted scan: ${scanId}`);
      }

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete scan';
      setLastError(errorMessage);
      onError?.(errorMessage);
      console.error('Error deleting scan:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [onScanDeleted, onError]);

  // Toggle favorite status
  const handleToggleFavorite = useCallback(async (scanId: string) => {
    try {
      const updatedScan = toggleScanFavorite(scanId);
      if (updatedScan) {
        setSavedScans(prev =>
          prev.map(scan => scan.id === scanId ? updatedScan : scan)
        );

        console.log(`${updatedScan.isFavorite ? '⭐' : '⚪'} Toggled favorite: ${updatedScan.name}`);
        return updatedScan;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle favorite';
      setLastError(errorMessage);
      onError?.(errorMessage);
      console.error('Error toggling favorite:', error);
    }
  }, [onError]);

  // Rename a scan
  const handleRenameScan = useCallback(async (scanId: string, newName: string) => {
    try {
      setIsLoading(true);
      setLastError(null);

      const updatedScan = renameScan(scanId, newName);
      if (updatedScan) {
        setSavedScans(prev =>
          prev.map(scan => scan.id === scanId ? updatedScan : scan)
        );

        console.log(`✏️ Renamed scan to: ${newName}`);
        return updatedScan;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to rename scan';
      setLastError(errorMessage);
      onError?.(errorMessage);
      console.error('Error renaming scan:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Load a saved scan (trigger callback)
  const handleLoadScan = useCallback((scan: SavedScan) => {
    try {
      // Update last run time
      handleUpdateScan(scan.id, { lastRun: new Date().toISOString() });

      onScanLoaded?.(scan);
      console.log(`📂 Loading scan: ${scan.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load scan';
      setLastError(errorMessage);
      onError?.(errorMessage);
      console.error('Error loading scan:', error);
    }
  }, [handleUpdateScan, onScanLoaded, onError]);

  // Update scan results after re-running
  const handleUpdateScanResults = useCallback(async (scanId: string, results: EnhancedScanResult[]) => {
    try {
      setIsLoading(true);
      setLastError(null);

      const updatedScan = updateScanResults(scanId, results);
      if (updatedScan) {
        setSavedScans(prev =>
          prev.map(scan => scan.id === scanId ? updatedScan : scan)
        );

        console.log(`🔄 Updated results for scan: ${updatedScan.name} (${results.length} results)`);
        return updatedScan;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update scan results';
      setLastError(errorMessage);
      onError?.(errorMessage);
      console.error('Error updating scan results:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Search scans
  const searchScans = useCallback((query: string) => {
    try {
      return searchSavedScans(query);
    } catch (error) {
      console.error('Error searching scans:', error);
      return [];
    }
  }, []);

  // Get favorite scans
  const getFavorites = useCallback(() => {
    try {
      return getFavoriteScans();
    } catch (error) {
      console.error('Error getting favorite scans:', error);
      return [];
    }
  }, []);

  // Cleanup old scans
  const handleCleanup = useCallback(async () => {
    try {
      setIsLoading(true);
      const removedCount = cleanupOldScans();

      if (removedCount > 0) {
        // Reload scans to reflect cleanup
        await loadScans();
        console.log(`🧹 Cleaned up ${removedCount} old scans`);
      }

      return removedCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cleanup old scans';
      setLastError(errorMessage);
      onError?.(errorMessage);
      console.error('Error cleaning up old scans:', error);
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [loadScans, onError]);

  // Get storage statistics
  const getStats = useCallback(() => {
    try {
      return getStorageStats();
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalScans: 0,
        favoriteScans: 0,
        storageSize: 0,
        lastCleanup: 'Unknown'
      };
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (autoLoadOnMount) {
      loadScans();
    }

    if (autoCleanupOnMount) {
      // Cleanup old scans on mount (non-blocking)
      cleanupOldScans();
    }
  }, [autoLoadOnMount, autoCleanupOnMount, loadScans]);

  // Derived state
  const totalScans = savedScans.length;
  const favoriteScans = savedScans.filter(scan => scan.isFavorite).length;
  const recentScans = savedScans
    .filter(scan => scan.lastRun)
    .sort((a, b) => new Date(b.lastRun!).getTime() - new Date(a.lastRun!).getTime())
    .slice(0, 5);

  // Clear error
  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  return {
    // State
    savedScans,
    isLoading,
    lastError,

    // Actions
    saveScan: handleSaveScan,
    updateScan: handleUpdateScan,
    deleteScan: handleDeleteScan,
    renameScan: handleRenameScan,
    toggleFavorite: handleToggleFavorite,
    loadScan: handleLoadScan,
    updateScanResults: handleUpdateScanResults,

    // Utilities
    loadScans,
    searchScans,
    getFavorites,
    cleanup: handleCleanup,
    getStats,
    clearError,

    // Derived state
    totalScans,
    favoriteScans,
    recentScans,

    // Helpers
    hasSavedScans: totalScans > 0,
    hasFavorites: favoriteScans > 0,
    isEmpty: totalScans === 0
  };
}