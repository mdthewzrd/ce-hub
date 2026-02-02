/**
 * Upload Handler Integration for Edge.dev Trading Platform
 *
 * This module demonstrates how to integrate the AI code formatter
 * with file upload functionality in the Edge.dev platform.
 */

import { codeFormatter, type CodeFormattingOptions, type FormattingResult } from './codeFormatter';

export interface UploadResult {
  success: boolean;
  originalCode: string;
  formattedCode?: string;
  formattingResult?: FormattingResult;
  error?: string;
  metadata: {
    filename: string;
    fileSize: number;
    uploadTime: string;
    processingTime?: number;
  };
}

export interface UploadOptions extends CodeFormattingOptions {
  autoFormat?: boolean;
  validateSyntax?: boolean;
  maxFileSize?: number; // in bytes
  allowedExtensions?: string[];
}

export class TradingCodeUploadHandler {
  private readonly defaultOptions: UploadOptions = {
    autoFormat: true,
    validateSyntax: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedExtensions: ['.py', '.pyx', '.txt'],
    enableMultiprocessing: true,
    enableAsyncPatterns: true,
    addTradingPackages: true,
    standardizeOutput: true,
    optimizePerformance: true,
    addErrorHandling: true,
    includeLogging: true
  };

  /**
   * Handle file upload and optional code formatting
   */
  public async handleFileUpload(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const startTime = Date.now();
    const mergedOptions = { ...this.defaultOptions, ...options };

    const metadata = {
      filename: file.name,
      fileSize: file.size,
      uploadTime: new Date().toISOString()
    };

    try {
      // Validate file
      const validation = this.validateFile(file, mergedOptions);
      if (!validation.isValid) {
        return {
          success: false,
          originalCode: '',
          error: validation.error,
          metadata
        };
      }

      // Read file content
      const originalCode = await this.readFileContent(file);

      // Basic syntax validation if enabled
      if (mergedOptions.validateSyntax) {
        const syntaxValidation = this.validatePythonSyntax(originalCode);
        if (!syntaxValidation.isValid) {
          return {
            success: false,
            originalCode,
            error: `Syntax validation failed: ${syntaxValidation.errors.join(', ')}`,
            metadata
          };
        }
      }

      // Format code if auto-format is enabled
      let formattingResult: FormattingResult | undefined;
      let formattedCode: string | undefined;

      if (mergedOptions.autoFormat) {
        formattingResult = await codeFormatter.formatTradingCode(originalCode, mergedOptions);
        formattedCode = formattingResult.formattedCode;

        if (!formattingResult.success) {
          console.warn('Code formatting failed, returning original code:', formattingResult.errors);
        }
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        originalCode,
        formattedCode,
        formattingResult,
        metadata: {
          ...metadata,
          processingTime
        }
      };

    } catch (error) {
      return {
        success: false,
        originalCode: '',
        error: error instanceof Error ? error.message : 'Upload processing failed',
        metadata
      };
    }
  }

  /**
   * Handle multiple file uploads with batch processing
   */
  public async handleBatchUpload(
    files: FileList | File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const fileArray = Array.from(files);
    const results: UploadResult[] = [];

    // Process files in parallel for better performance
    const uploadPromises = fileArray.map(file => this.handleFileUpload(file, options));
    const uploadResults = await Promise.allSettled(uploadPromises);

    for (let i = 0; i < uploadResults.length; i++) {
      const result = uploadResults[i];
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          success: false,
          originalCode: '',
          error: `Upload failed: ${result.reason}`,
          metadata: {
            filename: fileArray[i].name,
            fileSize: fileArray[i].size,
            uploadTime: new Date().toISOString()
          }
        });
      }
    }

    return results;
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: File, options: UploadOptions): { isValid: boolean; error?: string } {
    // Check file size
    if (options.maxFileSize && file.size > options.maxFileSize) {
      return {
        isValid: false,
        error: `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(options.maxFileSize)})`
      };
    }

    // Check file extension
    if (options.allowedExtensions) {
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!options.allowedExtensions.includes(fileExtension)) {
        return {
          isValid: false,
          error: `File type '${fileExtension}' not allowed. Allowed types: ${options.allowedExtensions.join(', ')}`
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Read file content as text
   */
  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const content = event.target?.result as string;
        resolve(content);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file content'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Basic Python syntax validation
   */
  private validatePythonSyntax(code: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for empty code
    if (!code.trim()) {
      errors.push('File is empty');
      return { isValid: false, errors };
    }

    // Basic syntax checks
    const lines = code.split('\n');
    let indentStack: number[] = [0];
    let inFunction = false;
    let inClass = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // Check indentation
      const indent = line.length - line.trimStart().length;

      // Check for function/class definitions
      if (trimmedLine.startsWith('def ')) {
        if (!trimmedLine.endsWith(':')) {
          errors.push(`Line ${i + 1}: Function definition must end with colon`);
        }
        inFunction = true;
      }

      if (trimmedLine.startsWith('class ')) {
        if (!trimmedLine.endsWith(':')) {
          errors.push(`Line ${i + 1}: Class definition must end with colon`);
        }
        inClass = true;
      }

      // Check for common syntax errors
      if (trimmedLine.includes('print(') && !trimmedLine.includes(')')) {
        errors.push(`Line ${i + 1}: Unclosed parenthesis in print statement`);
      }

      // Check for proper string quotes
      const singleQuotes = (trimmedLine.match(/'/g) || []).length;
      const doubleQuotes = (trimmedLine.match(/"/g) || []).length;

      if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
        errors.push(`Line ${i + 1}: Unmatched quotes detected`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Create a comprehensive processing report
   */
  public generateProcessingReport(results: UploadResult[]): {
    summary: {
      totalFiles: number;
      successfulUploads: number;
      failedUploads: number;
      totalProcessingTime: number;
      averageFileSize: number;
    };
    details: Array<{
      filename: string;
      status: 'success' | 'failed';
      optimizations?: number;
      errors?: string[];
      processingTime?: number;
    }>;
  } {
    const summary = {
      totalFiles: results.length,
      successfulUploads: results.filter(r => r.success).length,
      failedUploads: results.filter(r => !r.success).length,
      totalProcessingTime: results.reduce((sum, r) => sum + (r.metadata.processingTime || 0), 0),
      averageFileSize: results.reduce((sum, r) => sum + r.metadata.fileSize, 0) / results.length
    };

    const details = results.map(result => ({
      filename: result.metadata.filename,
      status: result.success ? 'success' as const : 'failed' as const,
      optimizations: result.formattingResult?.optimizations.length,
      errors: result.error ? [result.error] : result.formattingResult?.errors,
      processingTime: result.metadata.processingTime
    }));

    return { summary, details };
  }
}

// Export a default instance for easy use
export const uploadHandler = new TradingCodeUploadHandler();

// React hook for upload functionality
export function useFileUpload(options: UploadOptions = {}) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadResults, setUploadResults] = React.useState<UploadResult[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const uploadFile = React.useCallback(async (file: File): Promise<UploadResult> => {
    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadHandler.handleFileUpload(file, options);
      setUploadResults(prev => [...prev, result]);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [options]);

  const uploadFiles = React.useCallback(async (files: FileList | File[]): Promise<UploadResult[]> => {
    setIsUploading(true);
    setError(null);

    try {
      const results = await uploadHandler.handleBatchUpload(files, options);
      setUploadResults(prev => [...prev, ...results]);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [options]);

  const clearResults = React.useCallback(() => {
    setUploadResults([]);
    setError(null);
  }, []);

  return {
    uploadFile,
    uploadFiles,
    clearResults,
    isUploading,
    uploadResults,
    error,
    summary: uploadHandler.generateProcessingReport(uploadResults)
  };
}

// Import React for the hook
import React from 'react';