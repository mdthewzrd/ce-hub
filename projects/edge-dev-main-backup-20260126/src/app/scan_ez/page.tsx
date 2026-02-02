'use client'

import React, { useState, useRef, useEffect } from 'react';
import {
  Brain, Upload, Play, CheckCircle2, AlertCircle, Loader2,
  FileCode, Calendar, Settings, Trash2, RefreshCw, TrendingUp,
  Database, BarChart3, Edit2, Check, Save, X, Download, Search,
  ChevronRight, Info, Sparkles, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';

// Dynamically import EdgeChart to avoid SSR issues
const EdgeChart = dynamic(() => import('@/components/EdgeChart'), {
  ssr: false,
  loading: () => (
    <div className="h-96 flex items-center justify-center" style={{
      background: 'var(--studio-bg-secondary)',
      border: '1px solid var(--studio-border)',
      borderRadius: '12px'
    }}>
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">📈</div>
        <div className="text-lg font-medium" style={{ color: 'var(--studio-text-secondary)' }}>
          Loading chart...
        </div>
      </div>
    </div>
  )
});

interface ScanResult {
  success: boolean;
  results?: any[];
  total_found?: number;
  execution_time?: number;
  message?: string;
  error?: string;
  details?: string;
}

interface UploadedFile {
  name: string;
  size: number;
  content: string;
}

interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt?: string;
  tags?: string[];
}

interface SavedScan extends Project {
  lastResults?: number;
  lastRun?: string;
}

interface DayNavigationState {
  selectedDate: Date;
  baseDay: Date;
  dayOffset: number;
}

interface ScanProgress {
  message: string;
  percent: number;
  stage?: string;
}

export default function ScanEZPage() {
  // State
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [scanStartDate, setScanStartDate] = useState<string>(() => {
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);
    return ninetyDaysAgo.toISOString().split('T')[0];
  });
  const [scanEndDate, setScanEndDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [parameters, setParameters] = useState<string>('{}');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Saved scans state - multiple scan cards
  const [savedScans, setSavedScans] = useState<SavedScan[]>([]);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const [isLoadingScans, setIsLoadingScans] = useState(false);

  // Current working scan (uploaded or loaded)
  const [currentScan, setCurrentScan] = useState<Project | null>(null);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Save scan modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [scanNameToSave, setScanNameToSave] = useState('');

  // Progress and execution state
  const [scanProgress, setScanProgress] = useState<ScanProgress>({ message: '', percent: 0 });
  const [executionStage, setExecutionStage] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(false);

  // Chart state
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'hour' | '15min' | '5min'>('day');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  // Day navigation
  const [dayNavigation, setDayNavigation] = useState<DayNavigationState>({
    selectedDate: new Date(),
    baseDay: new Date(),
    dayOffset: 0
  });

  // Sorting state
  const [sortField, setSortField] = useState<'ticker' | 'date' | 'gapPercent' | 'volume' | 'score'>('ticker');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Load saved scans on mount
  useEffect(() => {
    loadSavedScans();
  }, []);

  // Load saved scans (scan_ez tagged)
  const loadSavedScans = async () => {
    setIsLoadingScans(true);
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        // Filter for scan_ez projects
        const scans = data.data?.filter((p: any) =>
          p.tags?.includes('scan-ez')
        ).map((p: any) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          description: p.description || '',
          tags: p.tags || [],
          createdAt: p.createdAt,
          lastResults: 0,
          lastRun: p.updatedAt
        })) || [];
        setSavedScans(scans);
        console.log(`✅ Loaded ${scans.length} saved scans`);
      }
    } catch (error) {
      console.error('Failed to load scans:', error);
    } finally {
      setIsLoadingScans(false);
    }
  };

  // Load a saved scan
  const loadScan = (scan: SavedScan) => {
    setActiveScanId(scan.id);
    setCurrentScan({
      id: scan.id,
      name: scan.name,
      code: scan.code,
      description: scan.description,
      tags: scan.tags,
      createdAt: scan.createdAt
    });
    setUploadedFile({
      name: `${scan.name}.py`,
      size: scan.code?.length || 0,
      content: scan.code || ''
    });
    setScanResult(null);
    setSelectedTicker(null);
    console.log('✅ Loaded scan:', scan.name);
  };

  // Create a new scan (upload button)
  const createNewScan = () => {
    setActiveScanId(null);
    setCurrentScan(null);
    setUploadedFile(null);
    setScanResult(null);
    setIsUploadModalOpen(true);
  };

  // Save current scan
  const saveCurrentScan = () => {
    if (!currentScan) {
      alert('No scan to save');
      return;
    }
    setScanNameToSave(currentScan.name);
    setIsSaveModalOpen(true);
  };

  // Confirm save scan
  const confirmSaveScan = async () => {
    if (!currentScan || !scanNameToSave.trim()) {
      alert('Please enter a name for the scan');
      return;
    }

    try {
      const response = await fetch('/api/projects/save-scanner-ez', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: scanNameToSave.trim(),
          code: currentScan.code,
          description: currentScan.description || `Scan EZ scanner: ${scanNameToSave}`
        })
      });

      if (response.ok) {
        console.log('✅ Scan saved:', scanNameToSave);
        setIsSaveModalOpen(false);
        setScanNameToSave('');
        await loadSavedScans();
        alert('Scan saved successfully!');
      } else {
        alert('Failed to save scan');
      }
    } catch (error) {
      console.error('Failed to save scan:', error);
      alert('Error saving scan');
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.py')) {
      alert('Please upload a Python file (.py)');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const name = file.name.replace('.py', '');

      const newScan: Project = {
        id: `ez_${Date.now()}`,
        name: name,
        code: content,
      };

      setUploadedFile({
        name: file.name,
        size: file.size,
        content
      });

      setCurrentScan(newScan);
      setScanResult(null);
      setSelectedTicker(null);
      setIsUploadModalOpen(false);

      // Auto-save to projects.json
      try {
        const saveResponse = await fetch('/api/projects/save-scanner-ez', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name,
            code: content,
            description: `Scan EZ scanner uploaded from ${file.name}`
          })
        });

        if (saveResponse.ok) {
          console.log('✅ Scan saved automatically');
          await loadSavedScans();
        }
      } catch (error) {
        console.warn('⚠️ Auto-save failed:', error);
      }

      console.log('✅ Scan loaded from file:', name);
    };
    reader.readAsText(file);
  };

  // Handle drag and drop
  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;

    if (!file.name.endsWith('.py')) {
      alert('Please upload a Python file (.py)');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const name = file.name.replace('.py', '');

      const newScan: Project = {
        id: `ez_${Date.now()}`,
        name: name,
        code: content,
      };

      setUploadedFile({
        name: file.name,
        size: file.size,
        content
      });

      setCurrentScan(newScan);
      setScanResult(null);
      setSelectedTicker(null);
      setIsUploadModalOpen(false);

      // Auto-save
      try {
        const saveResponse = await fetch('/api/projects/save-scanner-ez', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name,
            code: content,
            description: `Scan EZ scanner uploaded from ${file.name}`
          })
        });

        if (saveResponse.ok) {
          console.log('✅ Scan saved automatically');
          await loadSavedScans();
        }
      } catch (error) {
        console.warn('⚠️ Auto-save failed:', error);
      }

      console.log('✅ Scan loaded from file:', name);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Remove uploaded file/scan
  const removeFile = () => {
    setUploadedFile(null);
    setCurrentScan(null);
    setScanResult(null);
    setSelectedTicker(null);
    setActiveScanId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Execute scan
  const executeScan = async () => {
    if (!currentScan) {
      alert('Please upload a scanner file first');
      return;
    }

    setIsScanning(true);
    setIsInitializing(true);
    setScanResult(null);
    setSelectedTicker(null);

    setScanProgress({ message: 'Initializing...', percent: 0 });
    setExecutionStage('initializing');

    try {
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(parameters);
      } catch (e) {
        console.warn('Invalid JSON in parameters, using empty object');
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      setScanProgress({ message: 'Loading scanner code...', percent: 10 });
      setExecutionStage('loading');

      await new Promise(resolve => setTimeout(resolve, 600));
      setScanProgress({ message: 'Validating scanner...', percent: 20 });
      setExecutionStage('validating');

      await new Promise(resolve => setTimeout(resolve, 600));
      setScanProgress({ message: 'Preparing scan environment...', percent: 30 });
      setExecutionStage('preparing');

      await new Promise(resolve => setTimeout(resolve, 800));
      setScanProgress({ message: 'Connecting to data sources...', percent: 40 });
      setExecutionStage('connecting');

      setIsInitializing(false);

      // Use the scan_ez specific endpoint
      const response = await fetch('/api/scan_ez/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanner_code: currentScan.code,
          scanner_name: currentScan.name,
          start_date: scanStartDate,
          end_date: scanEndDate,
          parameters: parsedParams,
        }),
      });

      setScanProgress({ message: 'Executing scan...', percent: 50 });
      setExecutionStage('executing');

      const result: ScanResult = await response.json();
      setScanResult(result);

      setScanProgress({ message: 'Completing...', percent: 90 });
      setExecutionStage('completing');

      await new Promise(resolve => setTimeout(resolve, 400));
      setScanProgress({ message: 'Done!', percent: 100 });
      setExecutionStage('completed');

    } catch (error) {
      setScanResult({
        success: false,
        error: 'Failed to execute scan',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      setScanProgress({ message: 'Failed', percent: 0 });
      setExecutionStage('failed');
    } finally {
      setIsScanning(false);
      setTimeout(() => {
        setScanProgress({ message: '', percent: 0 });
        setExecutionStage('');
      }, 2000);
    }
  };

  // Handle sort
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle row click
  const handleRowClick = async (result: any, index: number) => {
    const rowId = `${result.ticker}-${result.date || 'nodate'}-${index}`;
    setSelectedRow(rowId);
    setSelectedTicker(result.ticker);
    setIsLoadingData(true);

    try {
      const response = await fetch(`http://localhost:5666/api/chart-data?ticker=${result.ticker}&timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedData(data);
      }
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Process scan results
  const scanResults = React.useMemo(() => {
    if (!scanResult?.results) return [];
    return scanResult.results.map((r: any) => ({
      ticker: r.ticker || 'UNKNOWN',
      date: r.date || new Date().toISOString().split('T')[0],
      gap: r.gap || 0,
      gapPercent: (r.gap || 0) * 100,
      volume: r.pm_vol || 0,
      score: r.score || 0,
      ...r
    }));
  }, [scanResult]);

  // Sorted results
  const sortedResults = React.useMemo(() => {
    if (!scanResults.length) return [];

    return [...scanResults].sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case 'ticker':
          aVal = a.ticker;
          bVal = b.ticker;
          break;
        case 'date':
          aVal = new Date(a.date).getTime();
          bVal = new Date(b.date).getTime();
          break;
        case 'gapPercent':
          aVal = a.gapPercent;
          bVal = b.gapPercent;
          break;
        case 'volume':
          aVal = a.volume;
          bVal = b.volume;
          break;
        case 'score':
          aVal = a.score;
          bVal = b.score;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [scanResults, sortField, sortDirection]);

  // Statistics
  const stats = React.useMemo(() => {
    if (!scanResults.length) return null;

    const totalResults = scanResults.length;
    const avgGap = scanResults.reduce((sum, r) => sum + r.gapPercent, 0) / totalResults;
    const avgVolume = scanResults.reduce((sum, r) => sum + r.volume, 0) / totalResults;

    return {
      totalResults,
      avgGap: avgGap.toFixed(1),
      avgVolume: (avgVolume / 1000000).toFixed(1)
    };
  }, [scanResults]);

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
  };

  const getScanStatus = () => {
    if (isInitializing) {
      return { text: 'Initializing...', color: '#3b82f6', icon: <Loader2 className="h-4 w-4 animate-spin" /> };
    }
    if (isScanning && executionStage === 'executing') {
      return { text: 'Scanning...', color: '#D4AF37', icon: <Loader2 className="h-4 w-4 animate-spin" /> };
    }
    if (scanResult?.success) {
      return { text: 'Scan Completed', color: '#22c55e', icon: <CheckCircle2 className="h-4 w-4" /> };
    }
    if (scanResult?.error) {
      return { text: 'Scan Failed', color: '#ef4444', icon: <AlertCircle className="h-4 w-4" /> };
    }
    return { text: 'Ready to Scan', color: '#6b7280', icon: null };
  };

  const scanStatus = getScanStatus();

  return (
    <div style={{ background: '#111111', color: 'var(--studio-text)', minHeight: '100vh' }}>
      {/* Left Sidebar - Scan Cards */}
      <div
        className="w-72 flex flex-col"
        style={{
          position: 'fixed',
          top: '0',
          left: '0',
          height: '100vh',
          width: '288px',
          zIndex: '30',
          background: '#111111'
        }}
      >
        {/* Logo Section */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
            backgroundColor: '#111111'
          }}
        >
          <div className="flex items-center gap-4">
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #D4AF37 0%, rgba(212, 175, 55, 0.8) 100%)',
                boxShadow: '0 4px 16px rgba(212, 175, 55, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(212, 175, 55, 0.3)'
              }}
            >
              <Brain className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#D4AF37',
                  letterSpacing: '0.5px',
                  textShadow: '0 2px 4px rgba(212, 175, 55, 0.3)',
                  marginBottom: '2px'
                }}
              >
                Traderra
              </h1>
              <p
                style={{
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '500',
                  letterSpacing: '0.3px'
                }}
              >
                Scan EZ
              </p>
            </div>
          </div>
        </div>

        {/* New Scan Button */}
        <div style={{ padding: '16px 20px' }}>
          <button
            onClick={createNewScan}
            disabled={isScanning}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '10px',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              background: 'rgba(34, 197, 94, 0.1)',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              opacity: isScanning ? 0.6 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isScanning) {
                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isScanning) {
                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)';
                e.currentTarget.style.transform = 'translateY(0px)';
              }
            }}
          >
            <Plus style={{ width: '18px', height: '18px', color: '#22C55E' }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF' }}>
              New Scan
            </span>
          </button>
        </div>

        {/* Saved Scans Section */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 20px'
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.5)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '12px',
              paddingLeft: '4px'
            }}
          >
            Saved Scans
          </div>

          {isLoadingScans ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <Loader2 className="h-6 w-6 animate-spin mx-auto" style={{ color: '#D4AF37' }} />
            </div>
          ) : savedScans.length === 0 ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.5)',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px dashed rgba(255, 255, 255, 0.1)'
              }}
            >
              No saved scans yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {savedScans.map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => !isScanning && loadScan(scan)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: activeScanId === scan.id
                      ? '1px solid rgba(212, 175, 55, 0.5)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    background: activeScanId === scan.id
                      ? 'rgba(212, 175, 55, 0.1)'
                      : 'rgba(255, 255, 255, 0.02)',
                    cursor: isScanning ? 'wait' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isScanning && activeScanId !== scan.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isScanning && activeScanId !== scan.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: activeScanId === scan.id
                          ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0.1) 100%)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: activeScanId === scan.id
                          ? '1px solid rgba(212, 175, 55, 0.4)'
                          : '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <FileCode
                        style={{
                          width: '14px',
                          height: '14px',
                          color: activeScanId === scan.id ? '#D4AF37' : 'rgba(255, 255, 255, 0.6)'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: activeScanId === scan.id ? '#D4AF37' : '#FFFFFF',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {scan.name}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'rgba(255, 255, 255, 0.5)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {scan.description || 'Python scanner'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Scan Info (bottom of sidebar) */}
        {currentScan && (
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid rgba(212, 175, 55, 0.15)',
              background: 'rgba(17, 17, 17, 0.8)'
            }}
          >
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                background: 'rgba(212, 175, 55, 0.05)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#FFFFFF' }}>
                  {currentScan.name}
                </span>
                {!isScanning && (
                  <button
                    onClick={removeFile}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash2 size={12} style={{ color: '#ef4444' }} />
                  </button>
                )}
              </div>

              {isScanning && scanProgress.percent > 0 && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                      fontSize: '10px',
                      color: '#D4AF37'
                    }}
                  >
                    <span>{scanProgress.message}</span>
                    <span>{scanProgress.percent}%</span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '4px',
                      background: 'rgba(212, 175, 55, 0.2)',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: `${scanProgress.percent}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #D4AF37 0%, #E5B84A 100%)',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(212, 175, 55, 0.2)',
            textAlign: 'center',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.5)'
          }}
        >
          Scan EZ v1.0
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          marginLeft: '296px',
          minHeight: '100vh'
        }}
      >
        {/* Header */}
        <header
          style={{
            backgroundColor: '#111111',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
            padding: '20px 24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Brain className="h-8 w-8" style={{ color: '#D4AF37' }} />
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#FFFFFF' }}>
                  Scan EZ
                </h1>
                <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Easy Python scanner execution
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {scanStatus.icon}
              <span style={{ fontSize: '14px', color: scanStatus.color }}>
                {scanStatus.text}
              </span>
              {currentScan && (
                <>
                  <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#D4AF37' }}>
                    {currentScan.name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginTop: '16px',
              padding: '16px',
              background: 'rgba(17, 17, 17, 0.6)',
              borderRadius: '10px',
              border: '1px solid rgba(212, 175, 55, 0.15)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: '#D4AF37', fontWeight: '600' }}>FROM:</label>
              <input
                type="date"
                value={scanStartDate}
                onChange={(e) => setScanStartDate(e.target.value)}
                disabled={isScanning}
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#fff',
                  fontSize: '13px'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: '#D4AF37', fontWeight: '600' }}>TO:</label>
              <input
                type="date"
                value={scanEndDate}
                onChange={(e) => setScanEndDate(e.target.value)}
                disabled={isScanning}
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#fff',
                  fontSize: '13px'
                }}
              />
            </div>
            <button
              onClick={executeScan}
              disabled={isScanning || !currentScan}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: (!isScanning && currentScan)
                  ? 'linear-gradient(135deg, #D4AF37 0%, rgba(212, 175, 55, 0.8) 100%)'
                  : 'rgba(212, 175, 55, 0.3)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                borderRadius: '8px',
                color: '#000',
                fontSize: '14px',
                fontWeight: '600',
                cursor: (!isScanning && currentScan) ? 'pointer' : 'not-allowed',
                opacity: (isScanning || !currentScan) ? 0.6 : 1
              }}
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Scanner
                </>
              )}
            </button>
          </div>
        </header>

        {/* Results Area */}
        <main style={{ padding: '24px' }}>
          <div
            style={{
              backgroundColor: 'rgba(17, 17, 17, 0.6)',
              borderRadius: '12px',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              padding: '20px'
            }}
          >
            {/* Results Table */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#D4AF37', marginBottom: '16px' }}>
                Scan Results
              </h3>
              <div
                style={{
                  height: '300px',
                  overflowY: 'auto',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  border: '1px solid rgba(212, 175, 55, 0.1)'
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#111' }}>
                    <tr style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
                      {[
                        { field: 'ticker', label: 'TICKER' },
                        { field: 'date', label: 'DATE' },
                        { field: 'gapPercent', label: 'GAP %' },
                        { field: 'volume', label: 'VOLUME' }
                      ].map(({ field, label }) => (
                        <th
                          key={field}
                          onClick={() => !isScanning && handleSort(field as any)}
                          style={{
                            padding: '12px 16px',
                            color: sortField === field ? '#D4AF37' : 'rgba(255, 255, 255, 0.8)',
                            fontSize: '12px',
                            fontWeight: '600',
                            textAlign: 'left',
                            cursor: !isScanning ? 'pointer' : 'default'
                          }}
                        >
                          {label} {sortField === field && (
                            <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedResults.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{
                          padding: '40px',
                          textAlign: 'center',
                          color: 'rgba(255, 255, 255, 0.5)'
                        }}>
                          {isScanning ? 'Scanning...' : 'No results. Upload a scanner and run to see results.'}
                        </td>
                      </tr>
                    ) : (
                      sortedResults.map((result, index) => {
                        const rowId = `${result.ticker}-${result.date}-${index}`;
                        return (
                          <tr
                            key={index}
                            onClick={() => !isScanning && handleRowClick(result, index)}
                            style={{
                              cursor: !isScanning ? 'pointer' : 'wait',
                              background: selectedRow === rowId ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                            }}
                          >
                            <td style={{
                              padding: '12px 16px',
                              color: selectedRow === rowId ? '#D4AF37' : '#fff',
                              fontWeight: '600',
                              fontSize: '13px'
                            }}>
                              {result.ticker}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                              {formatDateDisplay(result.date)}
                            </td>
                            <td style={{ padding: '12px 16px', color: '#10b981', fontSize: '13px' }}>
                              {result.gapPercent.toFixed(1)}%
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                              {(result.volume / 1000000).toFixed(1)}M
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div
                  style={{
                    padding: '16px',
                    background: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#D4AF37', fontWeight: '600', marginBottom: '4px' }}>
                    TOTAL RESULTS
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
                    {stats.totalResults}
                  </div>
                </div>
                <div
                  style={{
                    padding: '16px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '600', marginBottom: '4px' }}>
                    AVG GAP %
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                    {stats.avgGap}%
                  </div>
                </div>
                <div
                  style={{
                    padding: '16px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '600', marginBottom: '4px' }}>
                    AVG VOLUME
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                    {stats.avgVolume}M
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '100'
          }}
          onClick={() => setIsUploadModalOpen(false)}
        >
          <div
            style={{
              background: '#111',
              borderRadius: '12px',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              padding: '32px',
              maxWidth: '500px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#D4AF37', marginBottom: '20px' }}>
              Upload Scanner File
            </h2>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".py"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            {/* Clickable drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              style={{
                border: '2px dashed rgba(212, 175, 55, 0.3)',
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)';
                e.currentTarget.style.background = 'rgba(212, 175, 55, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Upload className="h-12 w-12 mx-auto mb-4" style={{ color: 'rgba(212, 175, 55, 0.5)' }} />
              <p style={{ fontSize: '14px', color: '#fff', marginBottom: '4px' }}>
                Drop your .py file here
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                or click to browse
              </p>
            </div>

            {/* Browse button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '12px',
                background: 'rgba(34, 197, 94, 0.2)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '8px',
                color: '#22C55E',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Browse Files
            </button>
            <button
              onClick={() => setIsUploadModalOpen(false)}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
