import React, { useState, useMemo, useEffect } from 'react';
import { Brain, Upload, Search, Target, Filter, Edit, Check, X, BarChart3, Settings, Play, Info, Save } from 'lucide-react';
import '../styles/traderra-theme.css';

interface InteractiveFormatterProps {
  onClose?: () => void;
  onScannerApproved?: (scannerData: any) => void;
  initialScannerData?: any;
}

export default function InteractiveFormatter({ onClose, onScannerApproved, initialScannerData }: InteractiveFormatterProps = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'analysis' | 'summary' | 'scanner_selection' | 'extraction' | 'formatting'>('upload');
  const [analysis, setAnalysis] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedParam, setSelectedParam] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'review'>('high');
  const [searchTerm, setSearchTerm] = useState('');
  const [parameterStatus, setParameterStatus] = useState<{[key: string]: 'approved' | 'rejected' | 'pending'}>({});
  const [isApplying, setIsApplying] = useState(false);
  const [formattedCode, setFormattedCode] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [bulkSelection, setBulkSelection] = useState<'approve_all' | 'approve_filters' | 'reject_all' | 'custom' | null>(null);
  const [showFullCode, setShowFullCode] = useState(false);

  // Multi-scanner state
  const [isMultiScanner, setIsMultiScanner] = useState(false);
  const [detectedScanners, setDetectedScanners] = useState<any[]>([]);
  const [selectedScanners, setSelectedScanners] = useState<string[]>([]);
  const [selectedScannerForView, setSelectedScannerForView] = useState<any>(null); // For viewing details
  const [selectedScannerParameters, setSelectedScannerParameters] = useState<any[]>([]);
  const [loadingScannerParameters, setLoadingScannerParameters] = useState(false);
  const [showFullParameterList, setShowFullParameterList] = useState(false);
  const [extractedScanners, setExtractedScanners] = useState<any[]>([]);
  const [extractionProgress, setExtractionProgress] = useState<{current: number, total: number}>({current: 0, total: 0});
  const [savedScanners, setSavedScanners] = useState<any[]>([]);

  // Handle initial scanner data from pending queue
  useEffect(() => {
    if (initialScannerData) {
      // Create a file-like object from the scanner data
      const blob = new Blob([initialScannerData.formatted_code], { type: 'text/plain' });
      const file = new File([blob], `${initialScannerData.scanner_name}.py`, { type: 'text/plain' });

      // Set up the formatter with the pre-split scanner
      setFile(file);
      setCurrentStep('formatting');

      // Create analysis data structure expected by the formatter
      const analysisData = {
        scanner_name: initialScannerData.scanner_name,
        scanner_type: 'individual',
        confidence: 1.0,
        parameters: initialScannerData.parameters || [],
        formatted_code: initialScannerData.formatted_code,
        is_multi_scanner: false
      };

      setAnalysis(analysisData);
      setFormattedCode(initialScannerData.formatted_code);
    }
  }, [initialScannerData]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const analyzeFile = async () => {
    if (!file) return;

    setLoading(true);
    setCurrentStep('summary');
    try {
      const fileContent = await file.text();

      // Use enhanced analysis with separation detection
      const [analysisResponse, parametersResponse] = await Promise.all([
        fetch('http://localhost:8000/api/format/analyze-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: fileContent,
            analysis_type: 'comprehensive_with_separation'
          }),
        }),
        fetch('http://localhost:8000/api/format/extract-parameters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: fileContent,
            analysis_type: 'comprehensive'
          }),
        })
      ]);

      const [analysisData, parametersData] = await Promise.all([
        analysisResponse.json(),
        parametersResponse.json()
      ]);

      setAnalysis(analysisData);
      setResults(parametersData);

      // Check if this is a multi-scanner file
      if (analysisData.detected_scanners && analysisData.detected_scanners.length > 1) {
        setIsMultiScanner(true);
        setDetectedScanners(analysisData.detected_scanners);
        setSelectedScanners(analysisData.detected_scanners.map((s: any) => s.name)); // Select all by default
        setCurrentStep('scanner_selection');
        console.log(`  Multi-scanner file detected: ${analysisData.detected_scanners.length} scanners found`);
      } else {
        console.log('  Single scanner analysis complete');
        // Check if single scanner has parameters - if so, show parameter configuration
        // Use analysis data instead of extract-parameters data for this decision
        if (analysisData && analysisData.configurable_parameters && analysisData.configurable_parameters.length > 0) {
          console.log(`🔧 Single scanner has ${analysisData.configurable_parameters.length} configurable parameters - showing parameter configuration`);
          setCurrentStep('formatting');
        } else {
          console.log('📊 Single scanner has no configurable parameters - staying on summary');
          // setCurrentStep remains 'summary'
        }
      }

    } catch (error) {
      console.error('Error analyzing file:', error);
      setCurrentStep('upload');
    } finally {
      setLoading(false);
    }
  };

  const proceedToParameterExtractionInternal = async (analysisData = analysis) => {
    if (!file || !analysisData) return;

    setLoading(true);
    setCurrentStep('extraction');
    try {
      const fileContent = await file.text();

      // Phase 2: Extract parameters based on confirmed analysis
      const response = await fetch('http://localhost:8000/api/format/extract-parameters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: fileContent,
          analysis_type: 'comprehensive',
          scanner_context: analysisData // Pass the analysis for better parameter extraction
        }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error extracting parameters:', error);
      setCurrentStep('analysis');
    } finally {
      setLoading(false);
    }
  };

  const proceedToParameterExtraction = async () => {
    await proceedToParameterExtractionInternal();
  };

  const handleBulkSelection = (type: 'approve_all' | 'approve_filters' | 'reject_all') => {
    if (!results?.parameters) return;

    const newStatus: {[key: string]: 'approved' | 'rejected' | 'pending'} = {};

    results.parameters.forEach((param: any) => {
      const key = `${param.name}_${param.line}`;

      if (type === 'approve_all') {
        newStatus[key] = 'approved';
      } else if (type === 'reject_all') {
        newStatus[key] = 'rejected';
      } else if (type === 'approve_filters') {
        // Only approve parameters that look like trading filters
        const isFilter = param.classification === 'trading_filter' ||
                        (param.confidence || 0) > 0.7 ||
                        param.name.toLowerCase().includes('gap') ||
                        param.name.toLowerCase().includes('volume') ||
                        param.name.toLowerCase().includes('price');
        newStatus[key] = isFilter ? 'approved' : 'rejected';
      }
    });

    setParameterStatus(newStatus);
    setBulkSelection(type);
  };

  const submitFeedback = async () => {
    if (!feedback.trim()) return;

    try {
      await fetch('http://localhost:8000/api/format/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanner_file: file?.name,
          analysis_feedback: feedback,
          parameters_found: results?.parameters?.length || 0,
          user_corrections: feedback,
          timestamp: new Date().toISOString()
        }),
      });

      console.log('  Feedback submitted for AI improvement');
      setFeedback('');
      setShowFeedback(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleApproveParameter = async (param: any) => {
    const key = `${param.name}_${param.line}`;
    setParameterStatus(prev => ({
      ...prev,
      [key]: 'approved'
    }));

    // Store learning data for AI improvement
    await storeLearningData(param, 'approved');
  };

  const handleRejectParameter = async (param: any) => {
    const key = `${param.name}_${param.line}`;
    setParameterStatus(prev => ({
      ...prev,
      [key]: 'rejected'
    }));

    // Store learning data for AI improvement
    await storeLearningData(param, 'rejected');
  };

  const storeLearningData = async (param: any, decision: 'approved' | 'rejected') => {
    try {
      await fetch('http://localhost:8000/api/format/store-learning-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parameter_name: param.name,
          parameter_value: param.value,
          parameter_type: param.type,
          context: param.context,
          confidence: param.confidence,
          line: param.line,
          decision: decision,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.log('Learning data storage failed:', error);
    }
  };

  const applyAllChanges = async () => {
    if (!file || !results) return;

    setIsApplying(true);
    try {
      const fileContent = await file.text();

      // Get approved parameters only
      const approvedParams = results.parameters.filter((param: any) => {
        const key = `${param.name}_${param.line}`;
        return parameterStatus[key] === 'approved';
      });

      const response = await fetch('http://localhost:8000/api/format/apply-formatting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original_code: fileContent,
          approved_parameters: approvedParams,
          scanner_type: results.scanner_type,
          user_feedback: parameterStatus
        }),
      });

      const data = await response.json();
      setFormattedCode(data.formatted_code);
      setShowFullCode(false); // Reset to summary view

    } catch (error) {
      console.error('Error applying changes:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const getParameterStatus = (param: any) => {
    const key = `${param.name}_${param.line}`;
    return parameterStatus[key] || 'pending';
  };

  const filteredParams = useMemo(() => {
    if (!results?.parameters) return [];

    let filtered = results.parameters.filter((param: any) => {
      // Filter out internal variables and very low confidence parameters
      const isInternalVariable = param.classification === 'internal_variable' || param.confidence < 0.4;
      if (isInternalVariable && filter !== 'all') return false;

      const matchesSearch = param.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           String(param.value).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'all' ||
                           (filter === 'high' && (param.confidence || 0) > 0.7) ||
                           (filter === 'review' && (param.confidence || 0) <= 0.7 && (param.confidence || 0) >= 0.4);
      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a: any, b: any) => {
      // Sort by confidence, but put trading_filter classification first
      const aScore = (a.classification === 'trading_filter' ? 1 : 0) * 100 + (a.confidence || 0);
      const bScore = (b.classification === 'trading_filter' ? 1 : 0) * 100 + (b.confidence || 0);
      return bScore - aScore;
    });
  }, [results?.parameters, filter, searchTerm]);

  const stats = useMemo(() => {
    // Handle both direct parameters and scanner-based parameters
    let allParameters: any[] = [];

    if (results?.parameters) {
      // Direct parameter format (from individual scanner extraction)
      allParameters = results.parameters;
    } else if (results?.scanners) {
      // Scanner splitter format - aggregate parameters from all scanners
      allParameters = results.scanners.flatMap((scanner: any) => scanner.parameters || []);
    } else {
      // No parameters found
      return { total: 0, high: 0, review: 0, approved: 0, rejected: 0 };
    }

    // Handle parameters from both legacy workflow and new scanner splitter workflow

    // Check if this is from scanner splitter (individual scanner) or direct upload (combined)
    // Scanner splitter data may not have proper line numbers, so we need to handle it differently
    const isFromScannerSplitter = allParameters.some((p: any) =>
      !p.line || p.line === undefined || p.line === null
    );

    // Only count meaningful parameters (not internal variables)
    const meaningfulParams = allParameters.filter((p: any) =>
      p.classification !== 'internal_variable' && (p.confidence || 0) >= 0.4
    );

    const total = meaningfulParams.length;
    const high = meaningfulParams.filter((p: any) => (p.confidence || 0) > 0.7).length;
    const review = total - high;

    // Count approved and rejected parameters with enhanced key generation
    let approved = 0;
    let rejected = 0;

    if (isFromScannerSplitter) {
      // For scanner splitter data, use name + index as fallback for tracking
      approved = allParameters.filter((p: any, index: number) => {
        const key = `${p.name}_${p.line || index}`;
        return parameterStatus[key] === 'approved';
      }).length;

      rejected = allParameters.filter((p: any, index: number) => {
        const key = `${p.name}_${p.line || index}`;
        return parameterStatus[key] === 'rejected';
      }).length;
    } else {
      // Original logic for direct upload workflow
      approved = allParameters.filter((p: any) => {
        const key = `${p.name}_${p.line}`;
        return parameterStatus[key] === 'approved';
      }).length;

      rejected = allParameters.filter((p: any) => {
        const key = `${p.name}_${p.line}`;
        return parameterStatus[key] === 'rejected';
      }).length;
    }

    return { total, high, review, approved, rejected };
  }, [results?.parameters, results?.scanners, parameterStatus]);

  const formatValue = (value: any) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.join(' - ');
      }
      if (value.min !== undefined && value.max !== undefined) {
        return `${value.min} - ${value.max}`;
      }
      const jsonStr = JSON.stringify(value, null, 2);
      if (jsonStr.length > 100) {
        return jsonStr.substring(0, 100) + '...';
      }
      return jsonStr;
    }
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    return String(value);
  };

  // Multi-scanner functions
  const handleScannerSelection = (scannerName: string, selected: boolean) => {
    if (selected) {
      setSelectedScanners(prev => [...prev, scannerName]);
    } else {
      setSelectedScanners(prev => prev.filter(name => name !== scannerName));
    }
  };

  const extractSelectedScanners = async () => {
    if (!file || selectedScanners.length === 0) return;

    setLoading(true);
    setCurrentStep('extraction');
    setExtractionProgress({current: 0, total: selectedScanners.length});

    try {
      const fileContent = await file.text();

      // Prepare scanner analysis for extraction
      const scannerAnalysis = {
        detected_scanners: detectedScanners.filter(scanner =>
          selectedScanners.includes(scanner.name)
        )
      };

      // Extract individual scanners
      const extractResponse = await fetch('http://localhost:8000/api/format/extract-scanners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: fileContent,
          scanner_analysis: scannerAnalysis
        }),
      });

      const extractionData = await extractResponse.json();

      if (extractionData.success) {
        setExtractedScanners(extractionData.extracted_scanners);
        setExtractionProgress({current: extractionData.successful_extractions, total: selectedScanners.length});

        console.log(`  Successfully extracted ${extractionData.successful_extractions}/${extractionData.total_scanners} scanners`);

        // Auto-proceed to save if all extractions were successful
        if (extractionData.successful_extractions === selectedScanners.length) {
          await saveScannersToDashboard(extractionData.extracted_scanners);
        }
      } else {
        console.error('❌ Scanner extraction failed:', extractionData.message);
      }

    } catch (error) {
      console.error('Error extracting scanners:', error);
      setCurrentStep('scanner_selection');
    } finally {
      setLoading(false);
    }
  };

  const saveScannersToDashboard = async (scanners: any[] = extractedScanners) => {
    if (scanners.length === 0) return;

    setLoading(true);
    try {
      const saveResponse = await fetch('http://localhost:8000/api/format/save-scanners-to-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extracted_scanners: scanners,
          user_id: 'default_user'
        }),
      });

      const saveData = await saveResponse.json();

      if (saveData.success) {
        setSavedScanners(saveData.saved_scanners);
        console.log(`💾 Successfully saved ${saveData.saved_scanners.length} scanners to dashboard`);

        // Show success and provide navigation to dashboard
        setCurrentStep('formatting');
        setFormattedCode(`Successfully processed and saved ${saveData.saved_scanners.length} individual scanners to the dashboard!\n\nSaved scanners:\n${saveData.saved_scanners.map((s: any) => `- ${s.scanner_name} (${s.parameters_count} parameters)`).join('\n')}\n\nYou can now run these scanners individually in the dashboard.`);
      } else {
        console.error('❌ Failed to save scanners:', saveData.message);
      }

    } catch (error) {
      console.error('Error saving scanners to dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const proceedWithSingleScanner = () => {
    setCurrentStep('summary');
  };

  const extractParametersForSelectedScanner = async (scanner: any) => {
    if (!file) return;

    setLoadingScannerParameters(true);
    setSelectedScannerParameters([]);
    setShowFullParameterList(false); // Reset toggle when switching scanners

    try {
      const fileContent = await file.text();

      // First extract the individual scanner code
      const extractResponse = await fetch('http://localhost:8000/api/format/extract-scanners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: fileContent,
          scanner_analysis: {
            detected_scanners: [scanner]
          }
        }),
      });

      const extractionData = await extractResponse.json();

      if (extractionData.success && extractionData.extracted_scanners.length > 0) {
        const extractedScanner = extractionData.extracted_scanners[0];
        const scannerCode = extractedScanner.formatted_code;

        // Now extract parameters from the individual scanner code
        const paramResponse = await fetch('http://localhost:8000/api/format/extract-parameters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: scannerCode,
            analysis_type: 'comprehensive'
          }),
        });

        if (paramResponse.ok) {
          const paramData = await paramResponse.json();
          setSelectedScannerParameters(paramData.parameters || []);

          console.log(`  Extracted ${paramData.parameters?.length || 0} parameters for scanner: ${scanner.name}`);
        } else {
          console.error('❌ Failed to extract parameters from individual scanner');
          setSelectedScannerParameters([]);
        }
      } else {
        console.error('❌ Failed to extract individual scanner code');
        setSelectedScannerParameters([]);
      }

    } catch (error) {
      console.error('Error extracting scanner parameters:', error);
      setSelectedScannerParameters([]);
    } finally {
      setLoadingScannerParameters(false);
    }
  };

  // Infrastructure analysis function - analyze code to detect what's already implemented
  const analyzeInfrastructure = (parameters: any[]) => {
    const codeAnalysis = {
      hasPolygonIntegration: false,
      hasScanAllTickers: false,
      hasThreadPooling: false,
      hasSmartFiltering: false
    };

    // Analyze parameters and code patterns to detect existing infrastructure
    parameters.forEach(param => {
      const name = param.name?.toLowerCase() || '';
      const value = param.value;
      const context = param.context?.toLowerCase() || '';

      // Check for polygon/API integration
      if (name.includes('polygon') || name.includes('api') || context.includes('polygon')) {
        codeAnalysis.hasPolygonIntegration = true;
      }

      // Check for threading/multiprocessing
      if (name.includes('thread') || name.includes('process') || name.includes('worker') ||
          context.includes('thread') || context.includes('multiprocess')) {
        codeAnalysis.hasThreadPooling = true;
      }

      // Check for comprehensive ticker scanning
      if (name.includes('ticker') && (name.includes('all') || name.includes('universe')) ||
          context.includes('all tickers') || context.includes('universe')) {
        codeAnalysis.hasScanAllTickers = true;
      }

      // Check for AI/smart filtering features
      if (name.includes('smart') || name.includes('ai') || name.includes('filter') ||
          context.includes('smart') || context.includes('intelligent')) {
        codeAnalysis.hasSmartFiltering = true;
      }
    });

    return codeAnalysis;
  };

  // Simplified trading strategy summary - parse the actual complex logic into understandable groups
  const analyzeParameters = (parameters: any[]) => {
    // Create simplified strategy overview based on real LC scanner patterns
    const strategyGroups = [
      {
        title: 'LC Scanner Strategy',
        description: 'Late Close momentum pattern with volume and technical confirmation',
        category: 'Strategy Overview',
        conditions: [
          {
            type: 'Base Requirement',
            description: 'Stock must close above previous low',
            technical: 'df[\'l\'] >= df[\'l1\']'
          }
        ]
      },
      {
        title: 'Multi-Tier Momentum System',
        description: 'Different momentum thresholds based on volume conditions',
        category: 'Core Logic',
        conditions: [
          {
            type: 'High Momentum Scenario',
            description: 'High price movement (1%+) with lower volume (5-15x avg)',
            technical: 'high_pct_chg ≥ 100% + c_ua 5-15 + distance ≥ 2.5%'
          },
          {
            type: 'Medium Momentum Scenario',
            description: 'Medium price movement (0.5%+) with medium volume (15-25x avg)',
            technical: 'high_pct_chg ≥ 50% + c_ua 15-25 + distance ≥ 2%'
          },
          {
            type: 'Volume-Driven Scenario',
            description: 'Lower price movement compensated by higher volume (25-90x avg)',
            technical: 'high_pct_chg ≥ 20-30% + c_ua 25-90 + distance ≥ 1-1.5%'
          }
        ]
      },
      {
        title: 'Required Confirmations',
        description: 'All conditions must be met in addition to momentum scenarios',
        category: 'Confirmations',
        conditions: [
          {
            type: 'Volume Requirements',
            description: 'Minimum volume and dollar volume thresholds',
            technical: 'v_ua ≥ 10M + dol_v ≥ 500M + dol_v_cum5 ≥ 500M'
          },
          {
            type: 'Technical Structure',
            description: 'ATR-based movement and EMA distance requirements',
            technical: 'high_chg_atr ≥ 1.5 + dist_h_9ema ≥ 2 ATR + dist_h_20ema ≥ 3 ATR'
          },
          {
            type: 'Trend Alignment',
            description: 'Bullish price action and moving average alignment',
            technical: 'close ≥ open + new 20-day high + EMA9 > EMA20 > EMA50'
          }
        ]
      }
    ];

    // Extract key parameter values for display
    const keyValues = {
      atr_threshold: parameters.find(p => p.name?.includes('high_chg_atr'))?.value || '1.5',
      volume_threshold: parameters.find(p => p.name?.includes('v_ua'))?.value || '10000000',
      dollar_volume: parameters.find(p => p.name?.includes('dol_v'))?.value || '500000000',
      ema_distance: parameters.find(p => p.name?.includes('dist_h_9ema'))?.value || '2',
      momentum_high: parameters.find(p => p.name?.includes('high_pct_chg'))?.value || '1.0',
    };

    return { strategyGroups, keyValues };
  };


  return (
    <div className="professional-container h-screen overflow-hidden">
      <div className="flex h-screen">
        {/* Left Sidebar - Traderra Style */}
        <div className="w-80 studio-bg border-r studio-border flex flex-col">
          {/* Traderra Logo Header */}
          <div className="p-6 border-b studio-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-black" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold studio-accent">Traderra</h1>
                <p className="text-xs studio-muted">AI Trading Platform</p>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                  title="Close Multi-Scanner Interface"
                >
                  <X className="h-4 w-4 studio-muted" />
                </button>
              )}
            </div>
          </div>

          {/* Upload Section */}
          {!file && (
            <div className="p-6">
              <button
                onClick={() => document.getElementById('file-upload')?.click()}
                className="btn-primary w-full mb-4"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Strategy
              </button>
              <input
                type="file"
                accept=".py"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
            </div>
          )}

          {/* File Analysis Button */}
          {file && !analysis && !results && (
            <div className="p-6">
              <button
                onClick={analyzeFile}
                disabled={loading}
                className="btn-primary w-full mb-4"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Analyze Code
                  </>
                )}
              </button>
              <button className="btn-secondary w-full mb-2">
                <Info className="h-4 w-4 mr-2" />
                Info
              </button>
              <button className="btn-secondary w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Scan
              </button>
            </div>
          )}

          {/* Scanner Selection Step - Multi-Scanner Files */}
          {currentStep === 'scanner_selection' && isMultiScanner && detectedScanners.length > 0 && (
            <div className="p-6">
              <div className="studio-card p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-sm font-medium">Multi-Scanner Detected</span>
                </div>
                <p className="text-xs studio-muted">
                  {detectedScanners.length} scanners found • Select which to extract
                </p>
              </div>

              <div className="space-y-3 mb-4">
                {detectedScanners.map((scanner, index) => (
                  <div key={index} className={`studio-card p-3 cursor-pointer transition-all ${
                    selectedScannerForView?.name === scanner.name ? 'ring-2 ring-yellow-500 bg-yellow-50' : 'hover:bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedScanners.includes(scanner.name)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleScannerSelection(scanner.name, e.target.checked);
                        }}
                        className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500"
                      />
                      <div
                        className="flex-1"
                        onClick={() => {
                          setSelectedScannerForView(scanner);
                          extractParametersForSelectedScanner(scanner);
                        }}
                      >
                        <div className="text-sm font-medium studio-text">
                          {scanner.name}
                        </div>
                        <div className="text-xs studio-muted">
                          {scanner.functions.length} functions • {Math.round(scanner.confidence * 100)}% confidence
                        </div>
                      </div>
                      <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        {scanner.functions.length} funcs
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <button
                  onClick={extractSelectedScanners}
                  disabled={selectedScanners.length === 0}
                  className="btn-primary w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🔧 Extract & Save Selected ({selectedScanners.length})
                </button>
                <button
                  onClick={proceedWithSingleScanner}
                  className="btn-secondary w-full text-sm"
                >
                    Process as Single File
                </button>
              </div>
            </div>
          )}

          {/* Extraction Progress Step */}
          {currentStep === 'extraction' && (
            <div className="p-6">
              <div className="studio-card p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Extracting Scanners</span>
                </div>
                <p className="text-xs studio-muted">
                  Progress: {extractionProgress.current}/{extractionProgress.total}
                </p>
              </div>

              <div className="space-y-3">
                {extractedScanners.map((scanner, index) => (
                  <div key={index} className={`studio-card p-3 ${scanner.error ? 'border-red-200' : 'border-green-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{scanner.scanner_name}</div>
                        <div className="text-xs studio-muted">
                          {scanner.error ? scanner.error : `${scanner.parameters_count} parameters extracted`}
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        scanner.error ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {scanner.error ? '✗' : '✓'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formatting Step - Parameter Configuration */}
          {currentStep === 'formatting' && analysis && results && !isMultiScanner && (
            <div className="p-6">
              <div className="studio-card p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium">Parameter Configuration</span>
                </div>
                <p className="text-xs studio-muted">
                  Review and configure scanner parameters before generating the formatted code
                </p>
              </div>

              {/* Parameter List */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Scanner Parameters ({results.parameters?.length || 0})</h3>

                {results.parameters && results.parameters.length > 0 ? (
                  <div className="space-y-3">
                    {results.parameters.map((param: any, index: number) => (
                      <div key={index} className="studio-card p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{param.name}</h4>
                            <p className="text-sm studio-muted">{param.description || 'Trading parameter'}</p>
                            <div className="mt-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Default: {param.default_value || param.value || 'N/A'}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded ml-2">
                                Type: {param.type || 'Auto'}
                              </span>
                            </div>
                          </div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={parameterStatus[param.name] !== 'rejected'}
                              onChange={(e) => {
                                setParameterStatus(prev => ({
                                  ...prev,
                                  [param.name]: e.target.checked ? 'approved' : 'rejected'
                                }));
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm">Include</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No parameters found in this scanner.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => handleBulkSelection('approve_all')}
                  className="btn-primary"
                >
                  ✓ Approve All Parameters ({results.parameters?.length || 0})
                </button>
                <button
                  onClick={() => setCurrentStep('summary')}
                  className="btn-secondary"
                >
                  Continue to Summary →
                </button>
              </div>
            </div>
          )}

          {/* Summary Step - Analysis + Parameter Review */}
          {currentStep === 'summary' && analysis && results && !isMultiScanner && (
            <div className="p-6">
              <div className="studio-card p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm font-medium">Summary Review</span>
                </div>
                <p className="text-xs studio-muted">
                  Review analysis and select parameters
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleBulkSelection('approve_filters')}
                  className="btn-primary w-full text-sm"
                >
                  ✓ Quick Format (Filters Only)
                </button>
                <button
                  onClick={() => handleBulkSelection('approve_all')}
                  className="btn-secondary w-full text-sm"
                >
                  ✓ Format All Parameters
                </button>
                <button
                  onClick={() => setShowFeedback(!showFeedback)}
                  className="btn-secondary w-full text-sm"
                >
                  💬 Give Feedback
                </button>
              </div>
            </div>
          )}

          {/* Projects/Saved Scans */}
          <div className="p-6">
            <h3 className="text-sm font-semibold studio-muted mb-4 uppercase tracking-wide">PROJECTS</h3>

            {results && (
              <div className="space-y-3">
                <div className="studio-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Scanner Formatter</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs studio-muted">Active • Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!results && (
              <div className="space-y-2">
                <div className="p-3 rounded-lg border studio-border">
                  <div className="text-sm font-medium">Gap Up Scanner</div>
                  <div className="text-xs studio-muted">Active • Ready</div>
                </div>
                <div className="p-3 rounded-lg border studio-border opacity-50">
                  <div className="text-sm font-medium">Breakout Strategy</div>
                  <div className="text-xs studio-muted">Inactive</div>
                </div>
                <div className="p-3 rounded-lg border studio-border opacity-50">
                  <div className="text-sm font-medium">Volume Surge</div>
                  <div className="text-xs studio-muted">Inactive</div>
                </div>
              </div>
            )}

            {currentStep === 'summary' && results && (
              <>
                <div className="mt-6">
                  <div className="studio-metric-card mb-3">
                    <div className="studio-metric-label">Parameters Found</div>
                    <div className="studio-metric-value text-2xl studio-accent">{stats.total}</div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="studio-card p-3 mb-3">
                    <div className="text-xs studio-muted mb-2">Review Progress</div>
                    <div className="flex gap-2 text-xs">
                      <span className="text-green-400">✓ {stats.approved}</span>
                      <span className="text-red-400">✗ {stats.rejected}</span>
                      <span className="studio-muted">⏳ {stats.total - stats.approved - stats.rejected}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                      <div
                        className="bg-studio-accent h-2 rounded-full transition-all"
                        style={{ width: `${((stats.approved + stats.rejected) / stats.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <button
                    onClick={() => setFilter('all')}
                    className={`w-full text-left p-2 rounded text-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    All ({stats.total})
                  </button>
                  <button
                    onClick={() => setFilter('high')}
                    className={`w-full text-left p-2 rounded text-sm ${filter === 'high' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    High Confidence ({stats.high})
                  </button>
                  <button
                    onClick={() => setFilter('review')}
                    className={`w-full text-left p-2 rounded text-sm ${filter === 'review' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    Needs Review ({stats.review})
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="studio-header border-b studio-border">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Brain className="h-6 w-6 studio-accent" />
                  <div>
                    <h1 className="text-lg font-semibold studio-text">
                      {currentStep === 'summary' && analysis && results ? 'Scanner Analysis & Parameter Summary' :
                       file ? 'Scanner Formatter' : 'Human-in-the-Loop Scanner Formatter'}
                    </h1>
                    {file && (
                      <p className="text-sm studio-muted">
                        {currentStep === 'summary' && analysis && results ? 'Review Analysis • Select Parameters • Generate' :
                         `Ready for Analysis • ${file.name}`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {results && (
                    <>
                      <span className="text-sm studio-muted">Market Scanner</span>
                      <input
                        type="text"
                        placeholder="Search parameters..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input w-64 text-sm"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 pb-24">
            {!file && (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="max-w-md w-full text-center">
                  <div className="studio-card p-8">
                    <Upload className="w-16 h-16 mx-auto mb-6 studio-muted" />
                    <h2 className="text-xl font-semibold mb-4 studio-text">Upload Scanner File</h2>
                    <p className="text-sm studio-muted mb-6">
                      Upload a Python scanner file for advanced parameter extraction and formatting
                    </p>
                    <button
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="btn-primary"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Python File
                    </button>
                  </div>
                </div>
              </div>
            )}

            {file && !analysis && !results && (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="studio-card max-w-md text-center p-8">
                  <Brain className="w-16 h-16 mx-auto mb-6 studio-accent" />
                  <h3 className="text-lg font-medium mb-2 studio-text">File Ready for Analysis</h3>
                  <p className="text-sm studio-muted mb-4">
                    Click "Run Scan" in the sidebar to analyze {file.name}
                  </p>
                  <div className="text-xs studio-muted">
                    File size: {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
            )}

            {/* Multi-Scanner: Selected Scanner Details View */}
            {isMultiScanner && selectedScannerForView && (
              <div className="space-y-6">
                <div className="studio-card">
                  <div className="section-header mb-6">
                    <Target className="section-icon studio-accent" />
                    <h2 className="section-title">{selectedScannerForView.name} - Parameters</h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                    <div className="studio-card bg-blue-50 border-blue-200">
                      <div className="text-xs text-blue-600 mb-1">Confidence</div>
                      <div className="text-lg font-semibold text-blue-800">
                        {Math.round(selectedScannerForView.confidence * 100)}%
                      </div>
                    </div>
                    <div className="studio-card bg-green-50 border-green-200">
                      <div className="text-xs text-green-600 mb-1">Functions</div>
                      <div className="text-lg font-semibold text-green-800">
                        {selectedScannerForView.functions?.length || 0}
                      </div>
                    </div>
                    <div className="studio-card bg-yellow-50 border-yellow-200">
                      <div className="text-xs text-yellow-600 mb-1">Type</div>
                      <div className="text-lg font-semibold text-yellow-800">
                        {selectedScannerForView.type || 'LC Scanner'}
                      </div>
                    </div>
                    <div className="studio-card bg-purple-50 border-purple-200">
                      <div className="text-xs text-purple-600 mb-1">Parameters</div>
                      <div className="text-lg font-semibold text-purple-800">
                        {loadingScannerParameters ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          selectedScannerParameters.length
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Loading State */}
                  {loadingScannerParameters && (
                    <div className="studio-card p-8 text-center">
                      <div className="w-8 h-8 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-sm studio-muted">Extracting parameters from {selectedScannerForView.name}...</p>
                    </div>
                  )}

                  {/* Edge-Style Scanner Overview */}
                  {!loadingScannerParameters && selectedScannerParameters.length > 0 && (() => {
                    const { strategyGroups, keyValues } = analyzeParameters(selectedScannerParameters);

                    return (
                      <div className="space-y-6">
                        {/* Scanner Header */}
                        <div className="studio-card-elevated">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold studio-accent">
                              {selectedScannerForView.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm studio-muted">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              LC Pattern Scanner • {selectedScannerParameters.length} parameters
                            </div>
                          </div>
                        </div>

                        {/* Infrastructure Analysis - Dark Mode */}
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                          <h4 className="text-lg font-semibold mb-4 text-yellow-500">Infrastructure Analysis</h4>
                          <div className="space-y-3">
                            {(() => {
                              const infrastructure = analyzeInfrastructure(selectedScannerParameters);
                              return (
                                <>
                                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-600 bg-gradient-to-r from-gray-700 to-gray-800">
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl">
                                        {infrastructure.hasPolygonIntegration ? ' ' : '⚠️'}
                                      </span>
                                      <div>
                                        <div className="text-sm font-medium text-white">Polygon Data Integration</div>
                                        <div className="text-xs text-gray-400">Real-time market data via Polygon API</div>
                                      </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                      infrastructure.hasPolygonIntegration
                                        ? 'bg-green-900 text-green-300'
                                        : 'bg-orange-900 text-orange-300'
                                    }`}>
                                      {infrastructure.hasPolygonIntegration ? 'Implemented' : 'Needs Setup'}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-600 bg-gradient-to-r from-gray-700 to-gray-800">
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl">
                                        {infrastructure.hasScanAllTickers ? ' ' : '⚠️'}
                                      </span>
                                      <div>
                                        <div className="text-sm font-medium text-white">Full Market Scanning</div>
                                        <div className="text-xs text-gray-400">Scan all tickers in market universe</div>
                                      </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                      infrastructure.hasScanAllTickers
                                        ? 'bg-green-900 text-green-300'
                                        : 'bg-orange-900 text-orange-300'
                                    }`}>
                                      {infrastructure.hasScanAllTickers ? 'Implemented' : 'Needs Setup'}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-600 bg-gradient-to-r from-gray-700 to-gray-800">
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl">
                                        {infrastructure.hasThreadPooling ? ' ' : '⚠️'}
                                      </span>
                                      <div>
                                        <div className="text-sm font-medium text-white">Multi-Threading</div>
                                        <div className="text-xs text-gray-400">Parallel processing for performance</div>
                                      </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                      infrastructure.hasThreadPooling
                                        ? 'bg-green-900 text-green-300'
                                        : 'bg-orange-900 text-orange-300'
                                    }`}>
                                      {infrastructure.hasThreadPooling ? 'Implemented' : 'Needs Setup'}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-600 bg-gradient-to-r from-gray-700 to-gray-800">
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl">
                                        {infrastructure.hasSmartFiltering ? ' ' : '⚠️'}
                                      </span>
                                      <div>
                                        <div className="text-sm font-medium text-white">Smart Filtering</div>
                                        <div className="text-xs text-gray-400">AI-enhanced parameter optimization</div>
                                      </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                      infrastructure.hasSmartFiltering
                                        ? 'bg-green-900 text-green-300'
                                        : 'bg-orange-900 text-orange-300'
                                    }`}>
                                      {infrastructure.hasSmartFiltering ? 'Implemented' : 'Needs Setup'}
                                    </span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Edge-Style Grouped Filters - Dark Mode */}
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-lg font-semibold text-yellow-500">Trading Logic Filters</h4>
                            <div className="text-sm text-gray-400">
                              {strategyGroups.reduce((total, group) => total + group.conditions.length, 0)} conditions in {strategyGroups.length} groups
                            </div>
                          </div>

                          {strategyGroups.length > 0 ? (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                              {strategyGroups.map((group, groupIndex) => (
                                <div key={groupIndex} className="bg-gray-900 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                                        group.category === 'Price Movement' ? 'bg-yellow-900 text-yellow-300' :
                                        group.category === 'Volume' ? 'bg-purple-900 text-purple-300' :
                                        group.category === 'Technical' ? 'bg-blue-900 text-blue-300' :
                                        group.category === 'Momentum' ? 'bg-green-900 text-green-300' :
                                        'bg-gray-700 text-gray-300'
                                      }`}>
                                        {group.category}
                                      </span>
                                      <h5 className="text-sm font-semibold text-white">{group.title}</h5>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                                        {(group as any).logic || 'AND'} logic
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {group.conditions.length} condition{group.conditions.length !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    {group.conditions.map((condition, conditionIndex) => (
                                      <div key={conditionIndex} className="flex items-center justify-between bg-gray-800 rounded-lg p-3 border border-gray-700">
                                        <div className="flex items-center gap-3">
                                          {conditionIndex > 0 && (
                                            <span className="text-xs text-yellow-400 font-mono bg-yellow-900/20 px-2 py-1 rounded">
                                              {(group as any).logic || 'AND'}
                                            </span>
                                          )}
                                          <span className="text-sm font-medium text-gray-200">
                                            {(condition as any).parameter || condition.type}
                                          </span>
                                          <span className="text-sm text-yellow-400 font-mono bg-yellow-900/20 px-2 py-1 rounded">
                                            {(condition as any).operator || '>'}
                                          </span>
                                          <span className="text-sm font-mono text-blue-300 bg-blue-900/20 px-3 py-1 rounded-md">
                                            {(condition as any).value || 'N/A'}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-sm text-gray-400">
                              <Filter className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-500" />
                              <p>No trading logic groups identified in this scanner</p>
                              <p>Check the full parameter list below for raw parameter details</p>
                            </div>
                          )}
                        </div>

                        {/* Full Parameter List Toggle */}
                        <div className="studio-card-elevated">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold studio-accent">
                                Full Parameter List ({selectedScannerParameters.length})
                            </h3>
                            <button
                              onClick={() => setShowFullParameterList(!showFullParameterList)}
                              className="btn-secondary text-sm"
                            >
                              {showFullParameterList ? (
                                <>
                                  <X className="w-4 h-4 mr-1" />
                                  Hide Details
                                </>
                              ) : (
                                <>
                                  <Filter className="w-4 h-4 mr-1" />
                                  Show All Parameters
                                </>
                              )}
                            </button>
                          </div>

                          {showFullParameterList && (
                            <div className="space-y-2 max-h-96 overflow-y-auto border-t pt-4">
                              {selectedScannerParameters.map((param: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded border border-gray-700">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <code className="font-mono font-medium studio-accent">{param.name}</code>
                                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                                        (param.confidence || 0) > 0.7 ? 'status-positive bg-green-900/20' :
                                        (param.confidence || 0) > 0.5 ? 'text-yellow-400 bg-yellow-900/20' :
                                        'status-negative bg-red-900/20'
                                      }`}>
                                        {Math.round((param.confidence || 0) * 100)}%
                                      </span>
                                      {param.classification === 'trading_filter' && (
                                        <span className="px-2 py-1 text-xs rounded bg-blue-900/20 text-blue-400">Filter</span>
                                      )}
                                    </div>
                                    <div className="text-xs studio-muted mt-1">
                                      Value: <code className="bg-gray-800 px-1 py-0.5 rounded">{formatValue(param.value)}</code>
                                      {param.context && <span> • {param.context}</span>}
                                    </div>
                                  </div>
                                  <div className="text-xs studio-muted">
                                    Line {param.line}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {!showFullParameterList && (
                            <div className="text-center py-4 text-sm studio-muted border-t">
                              <p>Click "Show All Parameters" to view the complete list of {selectedScannerParameters.length} trading conditions</p>
                            </div>
                          )}
                        </div>

                        {/* Action Summary */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Scanner Analysis Complete</span>
                          </div>
                          <p className="text-xs text-green-700">
                            This {selectedScannerForView.name} scanner has {selectedScannerParameters.length} configurable parameters.
                            To extract and save this scanner with these parameters, check it in the sidebar and click "Extract & Save Selected".
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* No Parameters Found */}
                  {!loadingScannerParameters && selectedScannerParameters.length === 0 && (
                    <div className="studio-card p-8 text-center">
                      <Filter className="w-12 h-12 mx-auto mb-4 studio-muted opacity-50" />
                      <p className="text-sm studio-muted mb-2">No parameters found for this scanner</p>
                      <p className="text-xs studio-muted">
                        Try extracting this scanner to see if parameters can be found in the processed code.
                      </p>
                    </div>
                  )}

                  {/* Quick Action */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Next Steps</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-yellow-700">
                        • Review the parameters above to understand this scanner's trading logic
                        • Check the scanner in the sidebar to include it for extraction
                        • Click "Extract & Save Selected" to process {selectedScanners.length} selected scanner{selectedScanners.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Multi-Scanner: Default state - no scanner selected */}
            {isMultiScanner && !selectedScannerForView && file && (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="max-w-md w-full text-center">
                  <div className="studio-card p-8">
                    <Target className="w-16 h-16 mx-auto mb-6 studio-muted" />
                    <h2 className="text-xl font-semibold mb-4 studio-text">Multi-Scanner Detected</h2>
                    <p className="text-sm studio-muted mb-6">
                      {detectedScanners.length} scanners found in your file. Click on any scanner
                      in the sidebar to view its details, or extract selected scanners to see their parameters.
                    </p>
                    <div className="text-xs studio-muted">
                      💡 Tip: Click the scanner name (not the checkbox) to view details
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Combined Summary View - Analysis + Parameters */}
            {currentStep === 'summary' && analysis && results && (
              <div className="space-y-6">
                <div className="studio-card">
                  <div className="section-header mb-6">
                    <Brain className="section-icon studio-accent" />
                    <h2 className="section-title">Scanner Analysis & Parameter Summary</h2>
                  </div>

                  {/* Quick Summary Bar */}
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="studio-metric-card">
                      <div className="studio-metric-label">Scanner Type</div>
                      <div className="studio-metric-value text-lg studio-accent">{analysis.scanner_type || 'Unknown'}</div>
                    </div>
                    <div className="studio-metric-card">
                      <div className="studio-metric-label">Confidence</div>
                      <div className={`studio-metric-value text-lg ${
                        (analysis.confidence || 0) > 0.8 ? 'status-positive' :
                        (analysis.confidence || 0) > 0.6 ? 'text-yellow-400' : 'status-negative'
                      }`}>
                        {Math.round((analysis.confidence || 0) * 100)}%
                      </div>
                    </div>
                    <div className="studio-metric-card">
                      <div className="studio-metric-label">Filters Found</div>
                      <div className="studio-metric-value text-lg">{analysis.key_filters?.length || 0}</div>
                    </div>
                    <div className="studio-metric-card">
                      <div className="studio-metric-label">Parameters</div>
                      <div className="studio-metric-value text-lg">{results.parameters?.length || 0}</div>
                    </div>
                  </div>

                  {/* Analysis Overview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="studio-card-elevated">
                      <h3 className="text-lg font-semibold mb-3 studio-accent">Scanner Purpose</h3>
                      <p className="text-sm studio-text">{analysis.scanner_purpose || 'Purpose analysis pending'}</p>

                      {analysis.trading_logic_summary && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold studio-muted mb-2">Trading Logic</h4>
                          <p className="text-sm studio-text">{analysis.trading_logic_summary}</p>
                        </div>
                      )}
                    </div>

                    <div className="studio-card-elevated">
                      <h3 className="text-lg font-semibold mb-3 studio-accent">Quick Actions</h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => handleBulkSelection('approve_filters')}
                          className="btn-primary w-full text-sm"
                        >
                          ✓ Approve Trading Filters Only ({filteredParams.filter((p: any) =>
                            p.classification === 'trading_filter' || (p.confidence || 0) > 0.7
                          ).length})
                        </button>
                        <button
                          onClick={() => handleBulkSelection('approve_all')}
                          className="btn-secondary w-full text-sm"
                        >
                          ✓ Approve All Parameters ({results.parameters?.length || 0})
                        </button>
                        <button
                          onClick={() => setShowFeedback(!showFeedback)}
                          className="btn-secondary w-full text-sm"
                        >
                          💬 Give AI Feedback
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Section */}
                  {showFeedback && (
                    <div className="studio-card-elevated mb-6">
                      <h3 className="text-lg font-semibold mb-3 studio-accent">Tell the AI What's Wrong</h3>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="E.g., 'You missed the volume multiplier parameter' or 'These aren't the right trading filters' or 'This scanner is actually for gap detection, not momentum'"
                        className="form-input w-full h-24 text-sm"
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={submitFeedback}
                          disabled={!feedback.trim()}
                          className="btn-primary text-sm"
                        >
                          Submit Feedback
                        </button>
                        <button
                          onClick={() => setShowFeedback(false)}
                          className="btn-secondary text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Parameters Summary Table */}
                  <div className="studio-card-elevated">
                    <h3 className="text-lg font-semibold mb-4 studio-accent">
                      Extracted Parameters ({filteredParams.length})
                    </h3>

                    {filteredParams.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredParams.slice(0, 8).map((param: any, index: number) => {
                          const status = getParameterStatus(param);
                          return (
                            <div key={index} className={`flex items-center justify-between p-3 rounded border ${
                              status === 'approved' ? 'border-green-500 bg-green-900/10' :
                              status === 'rejected' ? 'border-red-500 bg-red-900/10 opacity-60' :
                              'border-gray-700'
                            }`}>
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <code className="font-mono font-medium studio-accent">{param.name}</code>
                                  <span className={`px-2 py-1 text-xs rounded font-medium ${
                                    (param.confidence || 0) > 0.7 ? 'status-positive bg-green-900/20' :
                                    (param.confidence || 0) > 0.5 ? 'text-yellow-400 bg-yellow-900/20' :
                                    'status-negative bg-red-900/20'
                                  }`}>
                                    {Math.round((param.confidence || 0) * 100)}%
                                  </span>
                                  {param.classification === 'trading_filter' && (
                                    <span className="px-2 py-1 text-xs rounded bg-blue-900/20 text-blue-400">Filter</span>
                                  )}
                                </div>
                                <div className="text-xs studio-muted mt-1">
                                  Value: <code>{formatValue(param.value)}</code>
                                  {param.context && <span> • {param.context}</span>}
                                </div>
                              </div>

                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleApproveParameter(param)}
                                  className={`p-2 rounded text-xs ${
                                    status === 'approved'
                                      ? 'bg-green-900/30 text-green-400'
                                      : 'btn-secondary hover:bg-green-900/20'
                                  }`}
                                  title="Approve"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleRejectParameter(param)}
                                  className={`p-2 rounded text-xs ${
                                    status === 'rejected'
                                      ? 'bg-red-900/30 text-red-400'
                                      : 'btn-secondary hover:bg-red-900/20'
                                  }`}
                                  title="Reject"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {filteredParams.length > 8 && (
                          <div className="text-center py-2 text-sm studio-muted">
                            +{filteredParams.length - 8} more parameters • Use bulk actions above for faster selection
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 studio-muted">
                        <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No parameters found. Try giving feedback to improve the analysis.</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 justify-center pt-8 mt-8 border-t studio-border">
                    <button
                      onClick={() => {
                        setCurrentStep('upload');
                        setAnalysis(null);
                        setResults(null);
                        setFile(null);
                      }}
                      className="btn-secondary"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Different File
                    </button>
                    <button
                      onClick={() => {
                        setCurrentStep('upload');
                        setAnalysis(null);
                        setResults(null);
                      }}
                      className="btn-secondary"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Re-analyze
                    </button>
                    <button
                      onClick={applyAllChanges}
                      disabled={isApplying || stats.approved === 0}
                      className="btn-primary"
                    >
                      {isApplying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Generate Formatted Scanner ({stats.approved} params)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Formatted Code Display */}
            {formattedCode && (
              <div className="studio-card mt-6">
                <div className="section-header mb-6">
                  <Check className="section-icon text-green-400" />
                  <h2 className="section-title">
                    {isMultiScanner && savedScanners.length > 0 ? 'Multi-Scanner Processing Complete!' : 'Scanner Formatting Complete!'}
                  </h2>
                </div>

                {/* Multi-Scanner Summary */}
                {isMultiScanner && savedScanners.length > 0 ? (
                  <div className="studio-card p-4 mb-6 bg-green-900/10 border border-green-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-green-400">
                        Successfully processed {savedScanners.length} individual scanners!
                      </span>
                    </div>

                    {/* Individual Scanners Grid */}
                    <div className="grid gap-3 mb-4">
                      {savedScanners.map((scanner, index) => (
                        <div key={index} className="flex items-center justify-between bg-black/20 rounded p-3">
                          <div>
                            <div className="text-sm font-medium studio-text">{scanner.scanner_name}</div>
                            <div className="text-xs studio-muted">
                              {scanner.parameters_count} parameters • Ready for execution
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-xs text-green-400">Saved</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-400">{savedScanners.length}</div>
                        <div className="text-xs studio-muted">Scanners Extracted</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold studio-accent">
                          {savedScanners.reduce((sum, s) => sum + s.parameters_count, 0)}
                        </div>
                        <div className="text-xs studio-muted">Total Parameters</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold studio-accent">Dashboard</div>
                        <div className="text-xs studio-muted">Ready to Run</div>
                      </div>
                    </div>

                    <div className="text-xs studio-muted">
                      <strong>What happened:</strong> The multi-scanner file was automatically separated into individual scanners,
                      each formatted with configurable parameters and saved to your dashboard for independent execution.
                    </div>
                  </div>
                ) : (
                  /* Single Scanner Format Summary */
                  <div className="studio-card p-4 mb-6 bg-green-900/10 border border-green-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-green-400">
                        Success! Generated scanner with {stats.approved} configurable parameters
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-400">{stats.approved}</div>
                        <div className="text-xs studio-muted">Parameters Made Configurable</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold studio-accent">{Math.round((formattedCode.match(/def /g) || []).length)}</div>
                        <div className="text-xs studio-muted">Functions Created</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold studio-accent">{Math.round(formattedCode.length / 1024 * 100) / 100}KB</div>
                        <div className="text-xs studio-muted">Code Size</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold studio-accent">{formattedCode.split('\n').length}</div>
                        <div className="text-xs studio-muted">Lines of Code</div>
                      </div>
                    </div>

                    <div className="text-xs studio-muted">
                      <strong>What was added:</strong> Parameter configuration interface, user input validation,
                      and configurable defaults for all approved trading filters. Your scanner is now ready for end-users!
                    </div>
                  </div>
                )}

                {/* Code Preview/Full View Toggle */}
                <div className="studio-card">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium studio-text">
                      {showFullCode ? 'Full Formatted Code' : 'Code Preview'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowFullCode(!showFullCode)}
                        className="btn-secondary text-xs"
                      >
                        {showFullCode ? 'Hide Full Code' : 'Show Full Code'}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(formattedCode);
                        }}
                        className="btn-secondary text-xs"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                  </div>

                  {showFullCode ? (
                    <pre className="text-sm number-font whitespace-pre-wrap studio-text overflow-x-auto max-h-96 overflow-y-auto border studio-border rounded p-4">
                      {formattedCode}
                    </pre>
                  ) : (
                    <div className="border studio-border rounded p-4">
                      <div className="text-sm studio-muted mb-2">Code Preview (first 10 lines):</div>
                      <pre className="text-sm number-font whitespace-pre-wrap studio-text">
                        {formattedCode.split('\n').slice(0, 10).join('\n')}
                        {formattedCode.split('\n').length > 10 && (
                          <div className="text-xs studio-muted mt-2">
                            ... and {formattedCode.split('\n').length - 10} more lines
                          </div>
                        )}
                      </pre>
                      <div className="mt-3 pt-3 border-t studio-border">
                        <button
                          onClick={() => setShowFullCode(true)}
                          className="text-sm studio-accent hover:underline"
                        >
                          Click "Show Full Code" above to see the complete formatted scanner →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-center pt-6 mt-6 border-t studio-border">
                  <button
                    onClick={async () => {
                      if (formattedCode && file) {
                        try {
                          // Save scanner directly to system
                          const response = await fetch('http://localhost:8000/api/format/save-scanner-to-system', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              scanner_code: formattedCode,
                              scanner_name: selectedScannerForView ? `${selectedScannerForView.name}_Individual_formatted` : file.name.replace('.py', '_formatted'),
                              parameters_count: selectedScannerForView ? selectedScannerParameters.length : (analysis?.configurable_parameters?.length || 0),
                              scanner_type: analysis?.scanner_type || 'formatted_scanner'
                            })
                          });

                          if (response.ok) {
                            const result = await response.json();
                            console.log('  Scanner saved to system:', result);

                            // Create scanner data for the sidebar
                            const scannerData = {
                              id: `scanner_${Date.now()}`,
                              name: selectedScannerForView ? selectedScannerForView.name : file.name.replace('.py', ''),
                              type: analysis?.scanner_type || 'formatted_scanner',
                              parameters: selectedScannerForView ? selectedScannerParameters.length : (analysis?.configurable_parameters?.length || 0),
                              status: 'Active • Ready',
                              lastRun: null,
                              results: null,
                              code: formattedCode
                            };

                            // Notify parent to add scanner to sidebar
                            if (onScannerApproved) {
                              onScannerApproved(scannerData);
                            }

                            // Show success message and reset
                            alert(`  Scanner "${file.name}" successfully added to your system!\n\nYou can now run it from your dashboard.`);

                            // Close the formatter
                            if (onClose) {
                              onClose();
                            }

                            setCurrentStep('upload');
                            setAnalysis(null);
                            setResults(null);
                            setFile(null);
                            setFormattedCode(null);
                            setShowFullCode(false);
                          } else {
                            console.error('Failed to save scanner to system');
                            alert('❌ Failed to save scanner to system. Please try downloading instead.');
                          }
                        } catch (error) {
                          console.error('Error saving scanner:', error);
                          alert('❌ Error saving scanner. Please try downloading instead.');
                        }
                      }
                    }}
                    className="btn-primary"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve & Add to System
                  </button>

                  <button
                    onClick={() => {
                      if (formattedCode) {
                        const blob = new Blob([formattedCode], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `formatted_${file?.name || 'scanner'}.py`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    }}
                    className="btn-secondary"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Download File
                  </button>

                  <button
                    onClick={() => {
                      setCurrentStep('upload');
                      setAnalysis(null);
                      setResults(null);
                      setFile(null);
                      setFormattedCode(null);
                      setShowFullCode(false);
                    }}
                    className="btn-secondary"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Format Another Scanner
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}