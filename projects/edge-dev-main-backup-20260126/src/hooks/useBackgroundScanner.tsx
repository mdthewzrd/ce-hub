/**
 * Background Scanner Hook
 *
 * React hook for managing background scanners that persist across navigation.
 * Integrates with the BackgroundScannerManager for persistent scanner execution.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { backgroundScannerManager, ActiveScan, ScanProgressCallback } from '@/services/backgroundScannerManager';

export interface UseBackgroundScannerOptions {
  onComplete?: (results: any) => void;
  onError?: (error: string) => void;
  onProgress?: ScanProgressCallback;
}

export interface UseBackgroundScannerReturn {
  // Current scan state
  activeScans: ActiveScan[];
  currentScan: ActiveScan | undefined;

  // Actions
  startScan: (name: string, scanRequest: any, options?: UseBackgroundScannerOptions) => Promise<string | null>;
  cancelScan: (scanId: string) => Promise<boolean>;
  getScan: (scanId: string) => ActiveScan | undefined;

  // Status
  hasActiveScans: boolean;
  isLoading: boolean;
  lastError: string | null;
}

export function useBackgroundScanner(): UseBackgroundScannerReturn {
  const [activeScans, setActiveScans] = useState<ActiveScan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Refs to prevent stale closures
  const optionsRef = useRef<UseBackgroundScannerOptions>({});

  // Update active scans list periodically with backend sync
  useEffect(() => {
    const updateScans = async () => {
      // Get local scan manager scans
      const managerScans = backgroundScannerManager.getActiveScans();

      // Also get backend active scans for most accurate status
      try {
        const response = await fetch('http://localhost:5666/api/scan/list');
        if (response.ok) {
          const backendData = await response.json();
          const backendScans = backendData.scans || [];

          // Merge backend data with manager data for complete picture
          const mergedScans = managerScans.map(managerScan => {
            const backendScan = backendScans.find((bs: any) => bs.scan_id === managerScan.scanId);
            if (backendScan) {
              // Backend is authoritative for running status
              return {
                ...managerScan,
                status: backendScan.status === 'running' ? 'running' :
                       backendScan.status === 'completed' ? 'completed' : 'error',
                progress: backendScan.progress_percent || backendScan.progress || managerScan.progress,
                message: backendScan.message || managerScan.message
              };
            }
            return managerScan;
          }) as ActiveScan[];

          setActiveScans(mergedScans);
        } else {
          setActiveScans(managerScans);
        }
      } catch (error) {
        console.warn('Failed to sync with backend scan status:', error);
        setActiveScans(managerScans);
      }
    };

    // Initial load
    updateScans();

    // Update every 3 seconds (match backend polling frequency)
    const interval = setInterval(updateScans, 3000);

    return () => clearInterval(interval);
  }, []);

  // Get current running scan (most recent that's not completed/error)
  const currentScan = activeScans
    .filter(scan => scan.status === 'running')
    .sort((a, b) => b.startTime - a.startTime)[0];

  const hasActiveScans = activeScans.some(scan => scan.status === 'running');

  const startScan = useCallback(async (
    name: string,
    scanRequest: any,
    options?: UseBackgroundScannerOptions
  ): Promise<string | null> => {
    setIsLoading(true);
    setLastError(null);

    // Store options for callbacks
    if (options) {
      optionsRef.current = options;
    }

    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Start the scan
      await backgroundScannerManager.startScan(
        scanId,
        name,
        async () => {
          // Execute scan via API
          const response = await fetch('http://localhost:5666/api/scan/execute', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(scanRequest),
          });

          if (!response.ok) {
            throw new Error(`Scan execution failed: ${response.statusText}`);
          }

          const result = await response.json();
          return result;
        },
        (results) => {
          // On complete
          setIsLoading(false);
          optionsRef.current.onComplete?.(results);
        },
        (error) => {
          // On error
          setIsLoading(false);
          setLastError(error);
          optionsRef.current.onError?.(error);
        },
        (step, message, progress) => {
          // On progress
          optionsRef.current.onProgress?.(step, message, progress);
        }
      );

      return scanId;
    } catch (error: any) {
      setIsLoading(false);
      setLastError(error.message);
      return null;
    }
  }, []);

  const cancelScan = useCallback(async (scanId: string): Promise<boolean> => {
    try {
      const success = await backgroundScannerManager.cancelScan(scanId);
      if (success) {
        setLastError(null);
      }
      return success;
    } catch (error: any) {
      setLastError(error.message);
      return false;
    }
  }, []);

  const getScan = useCallback((scanId: string): ActiveScan | undefined => {
    return backgroundScannerManager.getScan(scanId);
  }, []);

  return {
    activeScans,
    currentScan,
    startScan,
    cancelScan,
    getScan,
    hasActiveScans,
    isLoading,
    lastError,
  };
}

// Hook for getting a specific scan by ID
export function useBackgroundScan(scanId: string | null) {
  const [scan, setScan] = useState<ActiveScan | undefined>(undefined);

  useEffect(() => {
    if (!scanId) {
      setScan(undefined);
      return;
    }

    const updateScan = () => {
      const currentScan = backgroundScannerManager.getScan(scanId);
      setScan(currentScan);
    };

    updateScan();
    const interval = setInterval(updateScan, 1000);

    return () => clearInterval(interval);
  }, [scanId]);

  return scan;
}