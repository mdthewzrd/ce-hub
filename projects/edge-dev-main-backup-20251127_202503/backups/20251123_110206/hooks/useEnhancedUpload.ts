'use client';

import { useState, useCallback } from 'react';
import { codeFormatter } from '@/utils/codeFormatter';

interface DetectedParameter {
  name: string;
  value: string | number;
  type: 'number' | 'string' | 'boolean';
  description?: string;
  isUnusual?: boolean;
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

interface UploadMetadata {
  strategyName: string;
  scannerType: string;
  confidence: number;
  parameters: DetectedParameter[];
  detectedFeatures: string[];
  expectedEndpoint: string;
  tickerUniverseSize: number;
  aiAnalyzed: boolean;
  verificationCompleted: boolean;
  parameterCount?: number;
  processingTime?: string;
}

interface UploadResult {
  success: boolean;
  formattedCode?: string;
  originalCode: string;
  metadata: UploadMetadata;
  error?: string;
  formattingResult?: any;
}

export function useEnhancedUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Enhanced upload handler that integrates AI analysis with code formatting
   */
  const uploadStrategy = useCallback(async (
    file: File,
    code: string,
    metadata: UploadMetadata
  ): Promise<UploadResult> => {
    setIsUploading(true);
    setError(null);

    try {
      console.log('🚀 Starting enhanced upload process...');
      console.log('📊 Metadata:', metadata);

      // Step 1: Format the code using the bulletproof formatter
      const formattingResult = await codeFormatter.formatTradingCode(code, {
        scannerType: metadata.scannerType,
        preserveParameters: true,
        enhanceInfrastructure: true
      });

      if (!formattingResult.success) {
        throw new Error(`Code formatting failed: ${formattingResult.errors.join(', ')}`);
      }

      // Step 2: Validate that AI-detected parameters are preserved
      const parameterPreservationCheck = validateParameterPreservation(
        metadata.parameters,
        formattingResult.formattedCode
      );

      if (!parameterPreservationCheck.success) {
        console.warn('⚠️ Parameter preservation issues detected:', parameterPreservationCheck.issues);
        // Add warning but don't fail the upload
      }

      // Step 3: Create comprehensive upload result
      const uploadResult: UploadResult = {
        success: true,
        originalCode: code,
        formattedCode: formattingResult.formattedCode,
        metadata: {
          ...metadata,
          // Merge any additional insights from the formatter
          parameterCount: formattingResult.metadata?.parameterCount || metadata.parameters.length,
          processingTime: formattingResult.metadata?.processingTime || new Date().toISOString()
        },
        formattingResult
      };

      console.log('✅ Enhanced upload completed successfully');
      setUploadResults(prev => [...prev, uploadResult]);

      return uploadResult;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Enhanced upload failed';
      console.error('❌ Enhanced upload failed:', err);

      const failureResult: UploadResult = {
        success: false,
        originalCode: code,
        metadata,
        error: errorMessage
      };

      setError(errorMessage);
      setUploadResults(prev => [...prev, failureResult]);

      return failureResult;
    } finally {
      setIsUploading(false);
    }
  }, []);

  /**
   * Validate that AI-detected parameters are preserved in formatted code
   */
  const validateParameterPreservation = (
    originalParameters: DetectedParameter[],
    formattedCode: string
  ): { success: boolean; issues: string[] } => {
    const issues: string[] = [];

    originalParameters.forEach(param => {
      // Check if parameter name exists in formatted code
      if (!formattedCode.includes(param.name)) {
        issues.push(`Parameter '${param.name}' not found in formatted code`);
        return;
      }

      // Check if parameter value is preserved (for numeric values)
      if (param.type === 'number' && !formattedCode.includes(param.value.toString())) {
        issues.push(`Parameter '${param.name}' value '${param.value}' may have been modified`);
      }
    });

    return {
      success: issues.length === 0,
      issues
    };
  };

  /**
   * Generate comprehensive upload report
   */
  const generateUploadReport = useCallback(() => {
    const totalUploads = uploadResults.length;
    const successfulUploads = uploadResults.filter(r => r.success).length;
    const failedUploads = totalUploads - successfulUploads;

    const scannerTypeBreakdown = uploadResults.reduce((acc, result) => {
      const type = result.metadata.scannerType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgConfidence = uploadResults.reduce((sum, result) => {
      return sum + (result.metadata.confidence || 0);
    }, 0) / totalUploads || 0;

    const totalParameters = uploadResults.reduce((sum, result) => {
      return sum + result.metadata.parameters.length;
    }, 0);

    return {
      summary: {
        totalUploads,
        successfulUploads,
        failedUploads,
        successRate: (successfulUploads / totalUploads) * 100,
        avgConfidence: Math.round(avgConfidence),
        totalParameters
      },
      scannerTypes: scannerTypeBreakdown,
      details: uploadResults.map(result => ({
        strategyName: result.metadata.strategyName,
        scannerType: result.metadata.scannerType,
        confidence: result.metadata.confidence,
        parameterCount: result.metadata.parameters.length,
        success: result.success,
        error: result.error,
        aiAnalyzed: result.metadata.aiAnalyzed,
        verificationCompleted: result.metadata.verificationCompleted
      }))
    };
  }, [uploadResults]);

  /**
   * Clear upload history
   */
  const clearResults = useCallback(() => {
    setUploadResults([]);
    setError(null);
  }, []);

  /**
   * Retry failed upload with same metadata
   */
  const retryUpload = useCallback(async (failedResult: UploadResult) => {
    if (failedResult.success) {
      throw new Error('Cannot retry successful upload');
    }

    return uploadStrategy(
      new File([failedResult.originalCode], `${failedResult.metadata.strategyName}.txt`),
      failedResult.originalCode,
      failedResult.metadata
    );
  }, [uploadStrategy]);

  return {
    // Core functions
    uploadStrategy,
    retryUpload,
    clearResults,

    // State
    isUploading,
    uploadResults,
    error,

    // Analytics
    generateUploadReport,

    // Utilities
    validateParameterPreservation
  };
}

export type { UploadResult, UploadMetadata, ScannerAnalysis, DetectedParameter };