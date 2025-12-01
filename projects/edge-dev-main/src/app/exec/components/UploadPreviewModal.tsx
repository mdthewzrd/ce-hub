'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  FileText,
  Code,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Brain,
  Settings,
  TrendingUp,
  Target,
  Zap,
  Edit3,
  Shield,
  AlertTriangle,
  Info
} from 'lucide-react';

interface DetectedParameter {
  name: string;
  value: string | number;
  type: 'number' | 'string' | 'boolean';
  description?: string;
  isUnusual?: boolean;
  operator?: '>=' | '<=' | '>' | '<' | '==' | '!=';
}

interface ScannerAnalysis {
  scannerType: 'A+' | 'LC' | 'Custom' | 'Unknown';
  confidence: number;
  parameterCount: number;
  parameters: DetectedParameter[];
  expectedEndpoint: string;
  tickerUniverseSize: number;
  detectedFeatures: string[];
  warnings: string[];
}

interface UploadPreviewData {
  file: File;
  code: string;
  analysis: ScannerAnalysis | null;
  isAnalyzing: boolean;
  error: string | null;
}

interface UploadPreviewModalProps {
  uploadData: UploadPreviewData;
  onConfirm: (data: {
    file: File;
    code: string;
    strategyName: string;
    parameters: DetectedParameter[];
    verifiedAnalysis: ScannerAnalysis;
  }) => Promise<void>;
  onCancel: () => void;
  onReanalyze: () => Promise<void>;
  analysisProgress?: number;
  analysisMessage?: string;
}

const UploadPreviewModal: React.FC<UploadPreviewModalProps> = ({
  uploadData,
  onConfirm,
  onCancel,
  onReanalyze,
  analysisProgress = 0,
  analysisMessage = 'Initializing analysis...'
}) => {
  const [strategyName, setStrategyName] = useState('');
  const [editableParameters, setEditableParameters] = useState<DetectedParameter[]>([]);
  const [verificationChecks, setVerificationChecks] = useState({
    detectionCorrect: false,
    parametersCorrect: false,
    strategyNamed: false
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAutoConfirming, setIsAutoConfirming] = useState(false);

  // 🔧 CRITICAL FIX: Force close ALL modals and cleanup DOM
  const forceCloseAllModals = useCallback(() => {
    console.log('🚪 FORCE CLOSING ALL MODALS - Complete cleanup');

    // Close upload modal
    onCancel();

    // 🔧 FIXED: Immediate DOM cleanup - NO DELAY to prevent modal blocking
    // Force immediate DOM cleanup to remove any lingering modal elements
    const modalOverlays = document.querySelectorAll('.fixed.inset-0.bg-black');
    const modalContainers = document.querySelectorAll('[class*="backdrop-blur"]');
    const zIndexModals = document.querySelectorAll('[style*="z-index: 50"], [class*="z-50"]');

    console.log(`🧹 IMMEDIATE CLEANUP: ${modalOverlays.length} overlays, ${modalContainers.length} containers, ${zIndexModals.length} z-index modals`);

    modalOverlays.forEach((modal, index) => {
      console.log(`   Removing overlay ${index + 1}`);
      modal.remove();
    });

    modalContainers.forEach((modal, index) => {
      if (modal.classList.contains('fixed')) {
        console.log(`   Removing container ${index + 1}`);
        modal.remove();
      }
    });

    zIndexModals.forEach((modal, index) => {
      if (modal.classList.contains('fixed')) {
        console.log(`   Removing z-index modal ${index + 1}`);
        modal.remove();
      }
    });

    // Force body scroll unlock immediately
    document.body.style.overflow = 'unset';
    document.body.style.pointerEvents = 'auto';

    console.log('  IMMEDIATE DOM cleanup completed - All modals removed instantly');

    // 🔧 Additional failsafe: Use requestAnimationFrame for any stubborn modals
    requestAnimationFrame(() => {
      const remainingModals = document.querySelectorAll('.fixed.inset-0');
      if (remainingModals.length > 0) {
        console.log(`🔧 FAILSAFE: Removing ${remainingModals.length} remaining modals`);
        remainingModals.forEach(modal => modal.remove());
      }
    });

  }, [onCancel]);

  // Initialize editable parameters when analysis is available
  useEffect(() => {
    if (uploadData.analysis?.parameters) {
      setEditableParameters([...uploadData.analysis.parameters]);
    }
  }, [uploadData.analysis]);

  // Auto-generate strategy name based on file and scanner type
  useEffect(() => {
    if (uploadData.analysis && uploadData.file && !strategyName) {
      const baseName = uploadData.file.name.replace(/\.[^/.]+$/, '');
      const scannerType = uploadData.analysis.scannerType;
      const timestamp = new Date().toISOString().slice(0, 10);
      setStrategyName(`${baseName}_${scannerType}_${timestamp}`);
    }
  }, [uploadData.analysis, uploadData.file, strategyName]);

  // Update strategy named check when name changes
  useEffect(() => {
    setVerificationChecks(prev => ({
      ...prev,
      strategyNamed: strategyName.trim().length >= 3
    }));
  }, [strategyName]);

  // 🔧 DISABLED: Auto-confirmation for successful AI agent analysis
  // User requested manual control - they want to review analysis and manually click "Run Scan"
  /* DISABLED AUTO-CONFIRMATION - User wants manual control
  useEffect(() => {
    if (uploadData.analysis &&
        !uploadData.isAnalyzing &&
        !uploadData.error &&
        uploadData.analysis.confidence >= 90 &&
        uploadData.analysis.parameterCount > 0 &&
        analysisProgress >= 100 &&         // 🔧 ADD PROGRESS CHECK
        strategyName.trim().length >= 3 &&
        !isAutoConfirming) {

      console.log('🚀 All conditions met for auto-confirmation - Analysis complete at 100%');
      setIsAutoConfirming(true);

      // Auto-check verification boxes for successful AI analysis
      setTimeout(() => {
        console.log('  Auto-checking verification boxes');
        setVerificationChecks({
          detectionCorrect: true,
          parametersCorrect: true,
          strategyNamed: true
        });

        // Auto-proceed with upload after user can see the verification
        setTimeout(async () => {
          console.log('🚀 Auto-proceeding with upload');
          try {
            await handleProceed();
            console.log('  Auto-upload completed successfully');

            // 🔧 CRITICAL FIX: Force close ALL modals immediately after successful auto-confirmation
            console.log('🚪 Force closing all modals after successful auto-confirmation');
            forceCloseAllModals(); // This closes ALL modals and cleans up DOM

          } catch (error) {
            console.error('❌ Auto-upload failed:', error);
            setIsAutoConfirming(false);
          }
        }, 2000); // 2 second delay to show verification checks

      }, 1500); // 1.5 second delay to show completion
    }
  }, [uploadData.analysis, uploadData.isAnalyzing, uploadData.error, strategyName, analysisProgress, isAutoConfirming, forceCloseAllModals]);
  */

  // 🔧 NEW: Manual control - analysis completes but user must manually proceed
  useEffect(() => {
    if (uploadData.analysis &&
        !uploadData.isAnalyzing &&
        !uploadData.error &&
        analysisProgress >= 100) {
      console.log('  Analysis complete - Progress should be 100%');
      console.log('👤 MANUAL MODE: User must review and manually click "Proceed" to continue');
    }
  }, [uploadData.analysis, uploadData.isAnalyzing, uploadData.error, analysisProgress]);

  // 🔧 DEBUG: State transition validation
  useEffect(() => {
    if (uploadData.analysis && !uploadData.isAnalyzing) {
      console.log('  Analysis complete - Progress should be 100%');
      console.log(`Current analysisProgress: ${analysisProgress}%`);
      console.log(`Parameter count: ${uploadData.analysis.parameterCount}`);
      console.log(`Confidence: ${uploadData.analysis.confidence}%`);
      console.log(`isAnalyzing: ${uploadData.isAnalyzing}`);
      console.log(`Strategy name length: ${strategyName.trim().length}`);
      console.log(`Auto-confirming: ${isAutoConfirming}`);

      // Report auto-confirmation readiness
      const ready = uploadData.analysis.confidence >= 90 &&
                   uploadData.analysis.parameterCount > 0 &&
                   analysisProgress >= 100 &&
                   strategyName.trim().length >= 3 &&
                   !isAutoConfirming;
      console.log(`🚀 Auto-confirmation ready: ${ready}`);
    }
  }, [uploadData.analysis, uploadData.isAnalyzing, analysisProgress, strategyName, isAutoConfirming]);

  const handleParameterEdit = useCallback((index: number, field: keyof DetectedParameter, value: any) => {
    setEditableParameters(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const handleCheckboxChange = useCallback((check: keyof typeof verificationChecks, checked: boolean) => {
    setVerificationChecks(prev => ({
      ...prev,
      [check]: checked
    }));
  }, []);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-400 border-green-400 bg-green-400/10';
    if (confidence >= 70) return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
    return 'text-red-400 border-red-400 bg-red-400/10';
  };

  const getScannerTypeIcon = (type: string) => {
    switch (type) {
      case 'A+': return <Target className="h-4 w-4" />;
      case 'LC': return <TrendingUp className="h-4 w-4" />;
      case 'Custom': return <Settings className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
  };

  const getParameterOperator = (paramName: string): string => {
    const name = paramName.toLowerCase();

    // Common minimum threshold parameters
    if (name.includes('min') || name.includes('threshold') || name.includes('floor')) {
      return '>=';
    }

    // Common maximum threshold parameters
    if (name.includes('max') || name.includes('ceiling') || name.includes('limit')) {
      return '<=';
    }

    // Multiplier parameters (typically minimums)
    if (name.includes('mult') || name.includes('multiplier')) {
      return '>=';
    }

    // Volume parameters (typically minimums)
    if (name.includes('vol') && (name.includes('min') || name.includes('mult'))) {
      return '>=';
    }

    // ATR parameters (typically minimums)
    if (name.includes('atr') && name.includes('mult')) {
      return '>=';
    }

    // Days parameters (typically exact values)
    if (name.includes('days') || name.includes('period')) {
      return '==';
    }

    // Percentage parameters
    if (name.includes('pct') || name.includes('percent') || name.includes('abs')) {
      return name.includes('max') ? '<=' : '>=';
    }

    // Default for numerical parameters
    return '>=';
  };


  const isReadyToProceed = Object.values(verificationChecks).every(Boolean) && uploadData.analysis;

  const handleProceed = async () => {
    if (!isReadyToProceed || !uploadData.analysis) return;

    setIsProcessing(true);
    try {
      await onConfirm({
        file: uploadData.file,
        code: uploadData.code,
        strategyName: strategyName.trim(),
        parameters: editableParameters,
        verifiedAnalysis: uploadData.analysis
      });
    } catch (error) {
      console.error('Upload confirmation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (uploadData.isAnalyzing) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-[#333333] bg-black/90 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Brain className="h-8 w-8 text-[#FFD700] animate-pulse" />
            </div>
            <h3 className="text-white text-lg font-medium mb-2">Analyzing Scanner Code</h3>
            <p className="text-[#888888] text-sm mb-4">
              Renata AI is analyzing your code to detect scanner type, parameters, and configuration...
            </p>

            {/* Progress Bar */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{analysisProgress}%</span>
                <span className="text-xs text-[#888888]">Analyzing...</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 shadow-inner">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ease-out ${
                    analysisProgress >= 100
                      ? 'bg-gradient-to-r from-green-600 to-green-500'
                      : 'bg-gradient-to-r from-yellow-600 to-yellow-500'
                  }`}
                  style={{
                    width: `${analysisProgress}%`,
                    boxShadow: analysisProgress > 0 ? '0 0 10px rgba(234, 179, 8, 0.5)' : 'none'
                  }}
                ></div>
              </div>
              <div className="text-center">
                <span className="text-[#888888] text-sm">{analysisMessage}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto border-[#333333] bg-black/90 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#FFD700] text-xl flex items-center gap-2">
              <Eye className="h-6 w-6" />
              Upload Preview & Verification
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-[#888888] hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Display */}
          {uploadData.error && (
            <div className="p-4 bg-red-900/20 border border-red-400 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <div className="text-red-400 font-medium">Analysis Error</div>
                <div className="text-red-300 text-sm mt-1">{uploadData.error}</div>
              </div>
            </div>
          )}

          {/* Auto-Confirmation Banner */}
          {isAutoConfirming && (
            <div className="p-4 bg-green-900/20 border border-green-400 rounded-lg flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <div className="text-green-400 font-medium">AI Analysis Successful - Auto-confirming Upload</div>
                <div className="text-green-300 text-sm mt-1">
                  High confidence analysis complete. Automatically verifying and proceeding with upload...
                </div>
              </div>
            </div>
          )}

          {/* File Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                File Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#888888]">Filename:</span>
                  <span className="text-white">{uploadData.file.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Size:</span>
                  <span className="text-white">{(uploadData.file.size / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Type:</span>
                  <span className="text-white">{uploadData.file.type || 'text/plain'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888888]">Lines:</span>
                  <span className="text-white">{uploadData.code.split('\n').length}</span>
                </div>
              </div>
            </div>

            {/* Scanner Detection Results */}
            {uploadData.analysis && (
              <div>
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Detection Results
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getScannerTypeIcon(uploadData.analysis.scannerType)}
                      <span className="text-white">Scanner Type:</span>
                    </div>
                    <Badge variant="outline" className="border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10">
                      {uploadData.analysis.scannerType}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#888888]">Confidence:</span>
                    <Badge variant="outline" className={getConfidenceColor(uploadData.analysis.confidence)}>
                      {uploadData.analysis.confidence}%
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#888888]">Parameters:</span>
                    <span className="text-white">{uploadData.analysis.parameterCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#888888]">Endpoint:</span>
                    <code className="text-[#FFD700] text-xs bg-[#1a1a1a] px-2 py-1 rounded">
                      {uploadData.analysis.expectedEndpoint}
                    </code>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#888888]">Universe Size:</span>
                    <span className="text-white">{uploadData.analysis.tickerUniverseSize.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Strategy Name Input */}
          <div>
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Strategy Name
            </h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="strategyName" className="text-[#888888] text-sm block mb-2">
                  Choose a descriptive name for this strategy
                </label>
                <input
                  id="strategyName"
                  type="text"
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  placeholder="Enter strategy name..."
                  className="w-full mt-1 px-3 py-2 bg-[#1a1a1a] border border-[#333333] rounded text-white focus:border-[#FFD700] focus:outline-none"
                />
              </div>
              {strategyName.length < 3 && (
                <p className="text-yellow-400 text-xs flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Strategy name must be at least 3 characters long
                </p>
              )}
            </div>
          </div>

          {/* Parameter Review Section - Cleaned up and simplified */}
          {uploadData.analysis && editableParameters.length > 0 && (
            <div>
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Scanner Parameters ({editableParameters.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {editableParameters.map((param, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border ${
                      param.isUnusual
                        ? 'border-yellow-400 bg-yellow-400/5'
                        : 'border-[#333333] bg-[#1a1a1a]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Parameter name and type */}
                      <div className="flex items-center gap-3">
                        <div className="text-white font-mono text-sm">{param.name}</div>
                        <Badge variant="outline" className="border-[#555555] text-[#888888] text-xs px-2 py-0.5">
                          {param.type}
                        </Badge>
                      </div>

                      {/* Parameter equation display */}
                      <div className="flex items-center gap-2">
                        <span className="text-[#FFD700] text-sm font-mono">
                          {getParameterOperator(param.name)}
                        </span>
                        <input
                          type={param.type === 'number' ? 'number' : 'text'}
                          value={param.value.toString()}
                          onChange={(e) => {
                            const value = param.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
                            handleParameterEdit(index, 'value', value);
                          }}
                          className="w-24 text-sm px-2 py-1 bg-[#0a0a0a] border border-[#333333] rounded text-white focus:border-[#FFD700] focus:outline-none text-center"
                        />
                      </div>
                    </div>

                    {/* Description (only if meaningful) */}
                    {param.description && !param.description.startsWith('Configuration parameter:') && (
                      <p className="text-[#888888] text-xs mt-2 pl-2 border-l-2 border-[#333333]">
                        {param.description}
                      </p>
                    )}

                    {/* Unusual value warning */}
                    {param.isUnusual && (
                      <div className="flex items-center gap-2 mt-2 text-yellow-400 text-xs">
                        <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                        <span>Unusual value for {uploadData.analysis?.scannerType} scanner</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary info */}
              <div className="mt-3 p-2 bg-[#0a0a0a] border border-[#333333] rounded">
                <p className="text-[#888888] text-xs flex items-center gap-2">
                  <Info className="h-3 w-3" />
                  These parameters will be used for adaptive universe pre-filtering and scan execution
                </p>
              </div>
            </div>
          )}

          {/* Warnings Section */}
          {uploadData.analysis?.warnings && uploadData.analysis.warnings.length > 0 && (
            <div>
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                Warnings
              </h3>
              <div className="space-y-2">
                {uploadData.analysis.warnings.map((warning, index) => (
                  <div key={index} className="p-3 bg-yellow-900/20 border border-yellow-400 rounded flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                    <p className="text-yellow-300 text-sm">{warning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detected Features */}
          {uploadData.analysis?.detectedFeatures && uploadData.analysis.detectedFeatures.length > 0 && (
            <div>
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Detected Features
              </h3>
              <div className="flex flex-wrap gap-2">
                {uploadData.analysis.detectedFeatures.map((feature, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-blue-400 text-blue-400 bg-blue-400/10"
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Manual Verification Checklist */}
          <div>
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Manual Verification
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="detectionCorrect"
                  checked={verificationChecks.detectionCorrect}
                  onChange={(e) => handleCheckboxChange('detectionCorrect', e.target.checked)}
                  className="mt-1 w-4 h-4 text-[#FFD700] bg-[#1a1a1a] border-[#333333] rounded focus:ring-[#FFD700] focus:ring-2"
                />
                <div>
                  <label htmlFor="detectionCorrect" className="text-white text-sm cursor-pointer">
                    Scanner type detection looks correct
                  </label>
                  <p className="text-[#888888] text-xs mt-1">
                    Verify that the detected scanner type ({uploadData.analysis?.scannerType}) matches your expectations
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="parametersCorrect"
                  checked={verificationChecks.parametersCorrect}
                  onChange={(e) => handleCheckboxChange('parametersCorrect', e.target.checked)}
                  className="mt-1 w-4 h-4 text-[#FFD700] bg-[#1a1a1a] border-[#333333] rounded focus:ring-[#FFD700] focus:ring-2"
                />
                <div>
                  <label htmlFor="parametersCorrect" className="text-white text-sm cursor-pointer">
                    All parameters and values are correct
                  </label>
                  <p className="text-[#888888] text-xs mt-1">
                    Review all detected parameters above and edit if necessary
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="strategyNamed"
                  checked={verificationChecks.strategyNamed}
                  onChange={(e) => handleCheckboxChange('strategyNamed', e.target.checked)}
                  className="mt-1 w-4 h-4 text-[#FFD700] bg-[#1a1a1a] border-[#333333] rounded focus:ring-[#FFD700] focus:ring-2"
                />
                <div>
                  <label htmlFor="strategyNamed" className="text-white text-sm cursor-pointer">
                    I have named this strategy appropriately
                  </label>
                  <p className="text-[#888888] text-xs mt-1">
                    The strategy name will be used for identification and organization
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#333333]">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onReanalyze}
                disabled={uploadData.isAnalyzing}
                className="border-[#333333] text-[#888888] hover:text-white hover:border-white"
              >
                <Brain className="h-4 w-4 mr-2" />
                Re-analyze
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                className="border-[#333333] text-[#888888] hover:text-white hover:border-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleProceed}
                disabled={!isReadyToProceed || isProcessing}
                className="bg-[#FFD700] hover:bg-[#FFA500] text-black"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Proceed with Upload
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] border border-[#333333] rounded-full">
              <Info className="h-3 w-3 text-[#888888]" />
              <span className="text-[#888888] text-xs">
                Step 1 of 3: Preview & Verification
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadPreviewModal;