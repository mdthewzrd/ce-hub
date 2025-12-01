'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  Code,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  FileCode,
  Settings,
  Zap,
  Brain
} from 'lucide-react';

interface StrategyUploadProps {
  onUpload: (file: File, code: string, onProgress?: (step: string, message?: string) => void) => Promise<void>;
  onClose: () => void;
}

interface UploadState {
  file: File | null;
  code: string;
  isConverting: boolean;
  conversionStep: string;
  progressMessage: string;
  conversionResult: any;
  error: string | null;
}

const StrategyUpload: React.FC<StrategyUploadProps> = ({ onUpload, onClose }) => {
  const [state, setState] = useState<UploadState>({
    file: null,
    code: '',
    isConverting: false,
    conversionStep: '',
    progressMessage: '',
    conversionResult: null,
    error: null
  });

  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Prevent global drag and drop from opening files in new tabs
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Add global event listeners to prevent default browser behavior
    document.addEventListener('dragenter', preventDefaults, false);
    document.addEventListener('dragover', preventDefaults, false);
    document.addEventListener('dragleave', preventDefaults, false);
    document.addEventListener('drop', handleGlobalDrop, false);

    return () => {
      document.removeEventListener('dragenter', preventDefaults, false);
      document.removeEventListener('dragover', preventDefaults, false);
      document.removeEventListener('dragleave', preventDefaults, false);
      document.removeEventListener('drop', handleGlobalDrop, false);
    };
  }, []);

  const supportedFormats = [
    { ext: '.py', name: 'Python Strategy', icon: FileCode, color: 'text-yellow-400' },
    { ext: '.pine', name: 'Pine Script', icon: FileCode, color: 'text-blue-400' },
    { ext: '.js', name: 'JavaScript', icon: FileCode, color: 'text-green-400' },
    { ext: '.txt', name: 'Plain Text', icon: FileText, color: 'text-gray-400' }
  ];

  const conversionSteps = [
    { step: 'analyzing', text: 'Analyzing code structure...', icon: Brain },
    { step: 'extracting', text: 'Extracting trading logic...', icon: Code },
    { step: 'converting', text: 'Converting to edge.dev format...', icon: Zap },
    { step: 'validating', text: 'Validating strategy...', icon: Settings },
    { step: 'executing', text: 'Executing scanner...', icon: FileCode },
    { step: 'processing', text: 'Processing results...', icon: Loader2 },
    { step: 'complete', text: 'Upload complete!', icon: CheckCircle }
  ];

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setState(prev => ({ ...prev, error: null }));

    // Validate file type
    const validExtensions = ['.py', '.pine', '.js', '.txt'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(fileExtension)) {
      setState(prev => ({
        ...prev,
        error: 'Unsupported file format. Please upload .py, .pine, .js, or .txt files.'
      }));
      return;
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setState(prev => ({
        ...prev,
        file,
        code: content
      }));
    };
    reader.onerror = () => {
      setState(prev => ({
        ...prev,
        error: 'Failed to read file content.'
      }));
    };
    reader.readAsText(file);
  }, []);

  // Drag and Drop handlers
  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0]; // Only handle the first file

    setState(prev => ({ ...prev, error: null }));

    // Validate file type
    const validExtensions = ['.py', '.pine', '.js', '.txt'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(fileExtension)) {
      setState(prev => ({
        ...prev,
        error: 'Unsupported file format. Please upload .py, .pine, .js, or .txt files.'
      }));
      return;
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setState(prev => ({
        ...prev,
        file,
        code: content
      }));
    };
    reader.onerror = () => {
      setState(prev => ({
        ...prev,
        error: 'Failed to read file content.'
      }));
    };
    reader.readAsText(file);
  }, []);

  const handleTextInput = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState(prev => ({
      ...prev,
      code: event.target.value,
      file: null // Clear file if user types directly
    }));
  }, []);

  const simulateConversion = async (): Promise<void> => {
    const steps = [
      { step: 'analyzing', duration: 2000, message: 'Analyzing scanner code...' },
      { step: 'extracting', duration: 2500, message: 'Extracting parameters...' },
      { step: 'converting', duration: 2000, message: 'Converting format...' },
      { step: 'validating', duration: 3000, message: 'Validating syntax...' },
      { step: 'executing', duration: 8000, message: 'Executing scanner...' },
      { step: 'processing', duration: 5000, message: 'Processing results...' },
      { step: 'complete', duration: 1000, message: 'Complete!' }
    ];

    for (const { step, duration, message } of steps) {
      setState(prev => ({
        ...prev,
        conversionStep: step,
        progressMessage: message
      }));
      await new Promise(resolve => setTimeout(resolve, duration));
    }
  };

  const handleConvert = useCallback(async () => {
    if (!state.code.trim()) {
      setState(prev => ({ ...prev, error: 'Please provide strategy code to convert.' }));
      return;
    }

    setState(prev => ({
      ...prev,
      isConverting: true,
      error: null,
      conversionStep: 'analyzing'
    }));

    try {
      // Create progress callback to update UI in real-time
      const progressCallback = (step: string, message?: string) => {
        setState(prev => ({
          ...prev,
          conversionStep: step,
          progressMessage: message || prev.progressMessage
        }));
      };

      // Let the real backend execution drive the progress
      await onUpload(state.file || new File([state.code], 'strategy.txt'), state.code, progressCallback);

      setState(prev => ({
        ...prev,
        isConverting: false,
        conversionStep: 'complete'
      }));

      // Auto-close after successful upload
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      setState(prev => ({
        ...prev,
        isConverting: false,
        error: `Conversion failed: ${error}`
      }));
    }
  }, [state.code, state.file, onUpload, onClose]);

  const handleClear = useCallback(() => {
    setState({
      file: null,
      code: '',
      isConverting: false,
      conversionStep: '',
      conversionResult: null,
      error: null,
      progressMessage: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    const format = supportedFormats.find(f => f.ext === ext);
    return format || supportedFormats[3]; // Default to text
  };

  const currentStep = conversionSteps.find(s => s.step === state.conversionStep);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto border-[#333333] bg-black/90 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#FFD700] text-xl flex items-center gap-2">
              <Upload className="h-6 w-6" />
              Upload & Convert Strategy
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-[#888888] hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Supported Formats */}
          <div>
            <h3 className="text-white font-medium mb-3">Supported Formats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {supportedFormats.map((format, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-[#1a1a1a] rounded border border-[#333333]">
                  <format.icon className={`h-4 w-4 ${format.color}`} />
                  <div>
                    <div className="text-sm text-white">{format.name}</div>
                    <div className="text-xs text-[#888888]">{format.ext}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Section */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* File Upload */}
            <div>
              <h3 className="text-white font-medium mb-3">Upload File</h3>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-[#FFD700] bg-[#FFD700]/10'
                    : 'border-[#333333] hover:border-[#FFD700]'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Upload className={`h-12 w-12 mx-auto mb-4 transition-colors ${
                  isDragging ? 'text-[#FFD700]' : 'text-[#888888]'
                }`} />
                <div className={`mb-2 transition-colors ${
                  isDragging ? 'text-[#FFD700]' : 'text-white'
                }`}>
                  {state.file
                    ? state.file.name
                    : isDragging
                    ? 'Drop your file here!'
                    : 'Click to upload or drag & drop'
                  }
                </div>
                <div className="text-sm text-[#888888]">
                  Support for .py, .pine, .js, .txt files
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".py,.pine,.js,.txt"
                  onChange={handleFileSelect}
                />
              </div>

              {state.file && (
                <div className="mt-3 p-3 bg-[#1a1a1a] rounded border border-[#333333] flex items-center gap-3">
                  {React.createElement(getFileIcon(state.file.name).icon, {
                    className: `h-5 w-5 ${getFileIcon(state.file.name).color}`
                  })}
                  <div className="flex-1">
                    <div className="text-white text-sm">{state.file.name}</div>
                    <div className="text-xs text-[#888888]">
                      {(state.file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <Badge variant="outline" className="border-green-400 text-green-400">
                    Loaded
                  </Badge>
                </div>
              )}
            </div>

            {/* Or Paste Code */}
            <div>
              <h3 className="text-white font-medium mb-3">Or Paste Code</h3>
              <textarea
                ref={textareaRef}
                placeholder="Paste your strategy code here..."
                value={state.code}
                onChange={handleTextInput}
                className="w-full h-40 p-3 bg-[#1a1a1a] border border-[#333333] rounded text-white text-sm font-mono resize-none focus:border-[#FFD700] focus:outline-none"
              />
              <div className="mt-2 text-xs text-[#888888]">
                Supports Python, Pine Script, JavaScript, or plain text descriptions
              </div>
            </div>
          </div>

          {/* Code Preview */}
          {state.code && (
            <div>
              <h3 className="text-white font-medium mb-3">Code Preview</h3>
              <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4 max-h-60 overflow-y-auto">
                <pre className="text-sm text-[#888888] font-mono whitespace-pre-wrap">
                  {state.code.substring(0, 1000)}
                  {state.code.length > 1000 && (
                    <span className="text-[#FFD700]">... ({state.code.length - 1000} more characters)</span>
                  )}
                </pre>
              </div>
            </div>
          )}

          {/* Conversion Process */}
          {state.isConverting && (
            <div>
              <h3 className="text-white font-medium mb-3">AI Conversion Process</h3>
              <div className="space-y-3">
                {conversionSteps.map((step, index) => (
                  <div
                    key={step.step}
                    className={`flex items-center gap-3 p-3 rounded border ${
                      state.conversionStep === step.step
                        ? 'border-[#FFD700] bg-[#FFD700]/10'
                        : conversionSteps.findIndex(s => s.step === state.conversionStep) > index
                        ? 'border-green-400 bg-green-400/10'
                        : 'border-[#333333] bg-[#1a1a1a]'
                    }`}
                  >
                    {state.conversionStep === step.step ? (
                      <Loader2 className="h-5 w-5 animate-spin text-[#FFD700]" />
                    ) : conversionSteps.findIndex(s => s.step === state.conversionStep) > index ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <step.icon className="h-5 w-5 text-[#888888]" />
                    )}
                    <span
                      className={
                        state.conversionStep === step.step
                          ? 'text-[#FFD700]'
                          : conversionSteps.findIndex(s => s.step === state.conversionStep) > index
                          ? 'text-green-400'
                          : 'text-[#888888]'
                      }
                    >
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {state.error && (
            <div className="p-4 bg-red-900/20 border border-red-400 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <div className="text-red-400 font-medium">Conversion Error</div>
                <div className="text-red-300 text-sm mt-1">{state.error}</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#333333]">
            <div className="flex items-center gap-2">
              {(state.file || state.code) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="border-[#333333] text-[#888888] hover:text-white hover:border-white"
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-[#333333] text-[#888888] hover:text-white hover:border-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConvert}
                disabled={!state.code.trim() || state.isConverting}
                className="bg-[#FFD700] hover:bg-[#FFA500] text-black"
              >
                {state.isConverting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Convert Strategy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Conversion Success */}
          {state.conversionStep === 'complete' && !state.isConverting && (
            <div className="p-4 bg-green-900/20 border border-green-400 rounded-lg flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <div className="text-green-400 font-medium">Strategy converted successfully!</div>
                <div className="text-green-300 text-sm mt-1">
                  Your strategy is ready for execution. This dialog will close automatically.
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StrategyUpload;