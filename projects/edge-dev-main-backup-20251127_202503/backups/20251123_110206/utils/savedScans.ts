/**
 * Saved Scans Utility Functions
 * Handles localStorage persistence, CRUD operations, and data management for saved scans
 */

import { SavedScan, SavedScansStorage, EnhancedScanResult } from '../types/scanTypes';

// Constants
const STORAGE_KEY = 'traderra_saved_scans';
const STORAGE_VERSION = '1.0';
const MAX_SAVED_SCANS = 50;
const AUTO_CLEANUP_DAYS = 90;

/**
 * Generate unique ID for saved scans
 */
function generateScanId(): string {
  return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get saved scans storage structure from localStorage
 */
function getSavedScansStorage(): SavedScansStorage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        version: STORAGE_VERSION,
        scans: [],
        settings: {
          maxSavedScans: MAX_SAVED_SCANS,
          autoCleanupDays: AUTO_CLEANUP_DAYS
        }
      };
    }

    const parsed = JSON.parse(stored);

    // Version migration (future-proofing)
    if (parsed.version !== STORAGE_VERSION) {
      console.log(`Migrating saved scans from version ${parsed.version} to ${STORAGE_VERSION}`);
      return migrateSavedScansStorage(parsed);
    }

    return parsed;
  } catch (error) {
    console.error('Error loading saved scans from localStorage:', error);
    return {
      version: STORAGE_VERSION,
      scans: [],
      settings: {
        maxSavedScans: MAX_SAVED_SCANS,
        autoCleanupDays: AUTO_CLEANUP_DAYS
      }
    };
  }
}

/**
 * Save scans storage to localStorage
 */
function setSavedScansStorage(storage: SavedScansStorage): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    return true;
  } catch (error) {
    console.error('Error saving scans to localStorage:', error);
    return false;
  }
}

/**
 * Migration function for future version updates
 */
function migrateSavedScansStorage(oldStorage: any): SavedScansStorage {
  // Add migration logic here when needed
  return {
    version: STORAGE_VERSION,
    scans: oldStorage.scans || [],
    settings: {
      maxSavedScans: MAX_SAVED_SCANS,
      autoCleanupDays: AUTO_CLEANUP_DAYS
    }
  };
}

/**
 * Load all saved scans
 */
export function loadSavedScans(): SavedScan[] {
  const storage = getSavedScansStorage();
  return storage.scans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Save a new scan
 */
export function saveScan(scanData: Omit<SavedScan, 'id' | 'createdAt'>): SavedScan {
  const storage = getSavedScansStorage();

  // Create new scan with generated ID
  const newScan: SavedScan = {
    ...scanData,
    id: generateScanId(),
    createdAt: new Date().toISOString()
  };

  // Add to scans array
  storage.scans.push(newScan);

  // Enforce max scans limit
  if (storage.scans.length > storage.settings.maxSavedScans) {
    // Remove oldest scans (keep favorites)
    storage.scans = storage.scans
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, storage.settings.maxSavedScans);
  }

  // Save to localStorage
  setSavedScansStorage(storage);

  console.log(`✅ Saved scan: ${newScan.name} (${newScan.id})`);
  return newScan;
}

/**
 * Update an existing scan
 */
export function updateScan(scanId: string, updates: Partial<SavedScan>): SavedScan | null {
  const storage = getSavedScansStorage();
  const scanIndex = storage.scans.findIndex(scan => scan.id === scanId);

  if (scanIndex === -1) {
    console.error(`Scan not found: ${scanId}`);
    return null;
  }

  // Update scan
  storage.scans[scanIndex] = {
    ...storage.scans[scanIndex],
    ...updates
  };

  // Save to localStorage
  setSavedScansStorage(storage);

  console.log(`✅ Updated scan: ${storage.scans[scanIndex].name} (${scanId})`);
  return storage.scans[scanIndex];
}

/**
 * Delete a saved scan
 */
export function deleteScan(scanId: string): boolean {
  const storage = getSavedScansStorage();
  const initialLength = storage.scans.length;

  storage.scans = storage.scans.filter(scan => scan.id !== scanId);

  if (storage.scans.length === initialLength) {
    console.error(`Scan not found for deletion: ${scanId}`);
    return false;
  }

  // Save to localStorage
  setSavedScansStorage(storage);

  console.log(`🗑️ Deleted scan: ${scanId}`);
  return true;
}

/**
 * Get a specific saved scan by ID
 */
export function getScanById(scanId: string): SavedScan | null {
  const storage = getSavedScansStorage();
  return storage.scans.find(scan => scan.id === scanId) || null;
}

/**
 * Toggle favorite status of a scan
 */
export function toggleScanFavorite(scanId: string): SavedScan | null {
  const storage = getSavedScansStorage();
  const scan = storage.scans.find(scan => scan.id === scanId);

  if (!scan) {
    console.error(`Scan not found: ${scanId}`);
    return null;
  }

  scan.isFavorite = !scan.isFavorite;

  // Save to localStorage
  setSavedScansStorage(storage);

  console.log(`${scan.isFavorite ? '⭐' : '⚪'} Toggled favorite for scan: ${scan.name} (${scanId})`);
  return scan;
}

/**
 * Rename a saved scan
 */
export function renameScan(scanId: string, newName: string): SavedScan | null {
  if (!newName.trim()) {
    console.error('New name cannot be empty');
    return null;
  }

  return updateScan(scanId, { name: newName.trim() });
}

/**
 * Update scan results (when re-running a saved scan)
 */
export function updateScanResults(scanId: string, results: EnhancedScanResult[]): SavedScan | null {
  return updateScan(scanId, {
    results,
    resultCount: results.length,
    lastRun: new Date().toISOString()
  });
}

/**
 * Search saved scans by name or description
 */
export function searchSavedScans(query: string): SavedScan[] {
  const storage = getSavedScansStorage();
  const searchQuery = query.toLowerCase().trim();

  if (!searchQuery) {
    return storage.scans;
  }

  return storage.scans.filter(scan =>
    scan.name.toLowerCase().includes(searchQuery) ||
    (scan.description && scan.description.toLowerCase().includes(searchQuery)) ||
    (scan.tags && scan.tags.some(tag => tag.toLowerCase().includes(searchQuery)))
  );
}

/**
 * Get scans by category/type
 */
export function getScansByType(scanType: string): SavedScan[] {
  const storage = getSavedScansStorage();
  return storage.scans.filter(scan => scan.scanType === scanType);
}

/**
 * Get favorite scans
 */
export function getFavoriteScans(): SavedScan[] {
  const storage = getSavedScansStorage();
  return storage.scans.filter(scan => scan.isFavorite);
}

/**
 * Clean up old scans (based on auto cleanup settings)
 */
export function cleanupOldScans(): number {
  const storage = getSavedScansStorage();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - storage.settings.autoCleanupDays);

  const initialCount = storage.scans.length;

  // Keep favorites and recent scans
  storage.scans = storage.scans.filter(scan =>
    scan.isFavorite || new Date(scan.createdAt) > cutoffDate
  );

  const removedCount = initialCount - storage.scans.length;

  if (removedCount > 0) {
    setSavedScansStorage(storage);
    console.log(`🧹 Cleaned up ${removedCount} old scans`);
  }

  return removedCount;
}

/**
 * Export saved scans to JSON file
 */
export function exportSavedScans(): string {
  const storage = getSavedScansStorage();
  return JSON.stringify(storage, null, 2);
}

/**
 * Import saved scans from JSON data
 */
export function importSavedScans(jsonData: string): boolean {
  try {
    const importedData = JSON.parse(jsonData);

    if (!importedData.scans || !Array.isArray(importedData.scans)) {
      throw new Error('Invalid data format');
    }

    // Merge with existing scans (avoid duplicates by name)
    const storage = getSavedScansStorage();
    const existingNames = storage.scans.map(scan => scan.name);

    const newScans = importedData.scans.filter((scan: SavedScan) =>
      !existingNames.includes(scan.name)
    );

    // Add new scans with fresh IDs
    newScans.forEach((scan: any) => {
      const newScan: SavedScan = {
        ...scan,
        id: generateScanId(),
        createdAt: scan.createdAt || new Date().toISOString()
      };
      storage.scans.push(newScan);
    });

    setSavedScansStorage(storage);

    console.log(`📥 Imported ${newScans.length} new scans`);
    return true;

  } catch (error) {
    console.error('Error importing saved scans:', error);
    return false;
  }
}

/**
 * Get storage statistics
 */
export function getStorageStats(): {
  totalScans: number;
  favoriteScans: number;
  storageSize: number;
  lastCleanup: string;
} {
  const storage = getSavedScansStorage();
  const storageString = JSON.stringify(storage);

  return {
    totalScans: storage.scans.length,
    favoriteScans: storage.scans.filter(scan => scan.isFavorite).length,
    storageSize: new Blob([storageString]).size,
    lastCleanup: 'Not implemented' // Could be added to storage.settings
  };
}

/**
 * Validate scan data before saving
 */
export function validateScanData(scanData: Partial<SavedScan>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!scanData.name || !scanData.name.trim()) {
    errors.push('Scan name is required');
  }

  if (scanData.name && scanData.name.length > 100) {
    errors.push('Scan name must be 100 characters or less');
  }

  if (!scanData.scanParams) {
    errors.push('Scan parameters are required');
  }

  if (scanData.scanParams) {
    if (!scanData.scanParams.start_date) {
      errors.push('Start date is required');
    }
    if (!scanData.scanParams.end_date) {
      errors.push('End date is required');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}