/**
 * Background Scanner Manager
 *
 * Manages scanner executions that persist across navigation changes.
 * Uses global state and localStorage to track active scans.
 */

export interface ActiveScan {
  id: string;
  name: string;
  status: 'initializing' | 'running' | 'completed' | 'error';
  progress: number;
  message: string;
  startTime: number;
  endTime?: number;
  results?: any;
  error?: string;
  scanId?: string; // Backend scan ID
}

export interface ScanProgressCallback {
  (step: string, message: string, progress?: number): void;
}

class BackgroundScannerManager {
  private activeScans: Map<string, ActiveScan> = new Map();
  private progressCallbacks: Map<string, ScanProgressCallback> = new Map();
  private pollIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // Restore active scans from localStorage on init
    this.restoreFromStorage();

    // Start polling for any restored scans
    this.startPollingForAllActiveScans();
  }

  /**
   * Start a new background scan
   */
  async startScan(
    scanId: string,
    name: string,
    executeFunction: () => Promise<{ scan_id: string; success: boolean }>,
    onComplete?: (results: any) => void,
    onError?: (error: string) => void,
    onProgress?: ScanProgressCallback
  ): Promise<void> {
    const activeScan: ActiveScan = {
      id: scanId,
      name,
      status: 'initializing',
      progress: 0,
      message: 'Initializing scan...',
      startTime: Date.now()
    };

    // Store scan
    this.activeScans.set(scanId, activeScan);
    if (onProgress) {
      this.progressCallbacks.set(scanId, onProgress);
    }

    // Save to localStorage
    this.saveToStorage();

    try {
      // Start the scan execution
      onProgress?.('initializing', 'Starting scan execution...');

      const scanResponse = await executeFunction();

      if (scanResponse.success && scanResponse.scan_id) {
        // Update scan with backend ID
        activeScan.scanId = scanResponse.scan_id;
        activeScan.status = 'running';
        activeScan.message = 'Scanner executing...';
        activeScan.progress = 10;

        this.saveToStorage();

        // Start polling for progress
        this.startProgressPolling(scanId, onComplete, onError, onProgress);

      } else {
        throw new Error((scanResponse as any).error || 'Scan execution failed to start');
      }

    } catch (error: any) {
      activeScan.status = 'error';
      activeScan.error = error.message;
      activeScan.message = `Error: ${error.message}`;
      activeScan.endTime = Date.now();

      this.saveToStorage();
      onError?.(error.message);
    }
  }

  /**
   * Start polling for scan progress
   */
  private startProgressPolling(
    scanId: string,
    onComplete?: (results: any) => void,
    onError?: (error: string) => void,
    onProgress?: ScanProgressCallback
  ): void {
    // Clear any existing interval
    if (this.pollIntervals.has(scanId)) {
      clearInterval(this.pollIntervals.get(scanId)!);
    }

    const pollInterval = setInterval(async () => {
      const scan = this.activeScans.get(scanId);
      if (!scan || !scan.scanId) return;

      try {
        // Poll for scan status
        const response = await fetch(`http://localhost:5666/api/scan/status/${scan.scanId}`);

        if (response.ok) {
          const statusData = await response.json();

          // Update scan with backend status (most accurate source)
          scan.status = statusData.status === 'running' ? 'running' :
                      statusData.status === 'completed' ? 'completed' : 'error';
          scan.progress = statusData.progress_percent || statusData.progress || scan.progress;
          scan.message = statusData.message || scan.message;

          if (statusData.status === 'completed') {
            scan.endTime = Date.now();
            scan.results = statusData.results || statusData.data;
            scan.status = 'completed';
            scan.progress = 100;
            scan.message = 'Scan completed successfully';

            // Stop polling
            clearInterval(pollInterval);
            this.pollIntervals.delete(scanId);

            // Clean up old completed scans (keep for 1 hour)
            this.cleanupOldCompletedScans();

            onComplete?.(scan.results);
          } else if (statusData.status === 'error') {
            scan.endTime = Date.now();
            scan.status = 'error';
            scan.error = statusData.error || statusData.message || 'Unknown error';
            scan.message = `Error: ${scan.error}`;

            // Stop polling
            clearInterval(pollInterval);
            this.pollIntervals.delete(scanId);

            onError?.(scan.error || 'Unknown error');
          }

          // Update progress callback with latest backend status
          if (onProgress) {
            const step = scan.status === 'running' ? 'executing' :
                       scan.status === 'completed' ? 'completed' : 'error';
            onProgress(step, scan.message, scan.progress);
          }
        } else {
          console.warn(`Scan status request failed for ${scanId}: ${response.status}`);
          // Don't stop polling on failure - keep trying
        }
      } catch (error) {
        console.warn(`Failed to poll scan status for ${scanId}:`, error);
        // Don't stop polling on network errors - keep trying
      }

      this.saveToStorage();
    }, 3000); // Poll every 3 seconds

    this.pollIntervals.set(scanId, pollInterval);
  }

  /**
   * Get all active scans
   */
  getActiveScans(): ActiveScan[] {
    return Array.from(this.activeScans.values());
  }

  /**
   * Get a specific scan
   */
  getScan(scanId: string): ActiveScan | undefined {
    return this.activeScans.get(scanId);
  }

  /**
   * Cancel a scan
   */
  async cancelScan(scanId: string): Promise<boolean> {
    const scan = this.activeScans.get(scanId);
    if (!scan) return false;

    try {
      // Cancel backend scan if it has an ID
      if (scan.scanId) {
        await fetch(`http://localhost:5666/api/scan/cancel/${scan.scanId}`, {
          method: 'POST'
        });
      }

      // Stop polling
      if (this.pollIntervals.has(scanId)) {
        clearInterval(this.pollIntervals.get(scanId)!);
        this.pollIntervals.delete(scanId);
      }

      // Update scan status
      scan.status = 'error';
      scan.error = 'Cancelled by user';
      scan.message = 'Scan cancelled';
      scan.endTime = Date.now();

      this.saveToStorage();
      return true;
    } catch (error) {
      console.error(`Failed to cancel scan ${scanId}:`, error);
      return false;
    }
  }

  /**
   * Save current state to localStorage
   */
  private saveToStorage(): void {
    try {
      const scansToSave = Array.from(this.activeScans.entries()).map(([id, scan]) => [
        id,
        {
          ...scan,
          // Don't save callbacks to localStorage
          __callbacks_removed: true
        }
      ]);

      localStorage.setItem('background_scanners', JSON.stringify(scansToSave));
    } catch (error) {
      console.warn('Failed to save background scans to localStorage:', error);
    }
  }

  /**
   * Restore from localStorage
   */
  private restoreFromStorage(): void {
    try {
      const stored = localStorage.getItem('background_scanners');
      if (stored) {
        const scansData = JSON.parse(stored);
        scansData.forEach(([id, scan]: [string, any]) => {
          // Only restore scans that are still running or recently completed
          const now = Date.now();
          const scanAge = now - scan.startTime;

          // Restore if it's running or completed within the last hour
          if (scan.status === 'running' || (scan.status === 'completed' && scanAge < 3600000)) {
            this.activeScans.set(id, scan);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to restore background scans from localStorage:', error);
    }
  }

  /**
   * Start polling for all restored active scans
   */
  private startPollingForAllActiveScans(): void {
    this.activeScans.forEach((scan, scanId) => {
      if (scan.status === 'running' && scan.scanId) {
        this.startProgressPolling(scanId);
      }
    });
  }

  /**
   * Clean up old completed scans
   */
  private cleanupOldCompletedScans(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    for (const [scanId, scan] of this.activeScans.entries()) {
      if ((scan.status === 'completed' || scan.status === 'error') &&
          scan.endTime &&
          (now - scan.endTime) > maxAge) {

        // Stop polling if still active
        if (this.pollIntervals.has(scanId)) {
          clearInterval(this.pollIntervals.get(scanId)!);
          this.pollIntervals.delete(scanId);
        }

        // Remove from active scans
        this.activeScans.delete(scanId);
      }
    }

    this.saveToStorage();
  }

  /**
   * Clean up on page unload
   */
  cleanup(): void {
    // Clear all poll intervals
    for (const interval of this.pollIntervals.values()) {
      clearInterval(interval);
    }
    this.pollIntervals.clear();

    // Save current state
    this.saveToStorage();
  }
}

// Global instance
export const backgroundScannerManager = new BackgroundScannerManager();

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    backgroundScannerManager.cleanup();
  });
}