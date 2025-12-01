import React, { useState } from 'react';
import { Download, Upload, Check, AlertCircle, FileText, Target, Send, Eye, X } from 'lucide-react';

interface ScannerSplitterProps {
  onClose?: () => void;
  onPushToFormatter?: (scanner: any) => void;
}

export default function ScannerSplitter({ onClose, onPushToFormatter }: ScannerSplitterProps = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [detectedScanners, setDetectedScanners] = useState<any[]>([]);
  const [extractedScanners, setExtractedScanners] = useState<any[]>([]);
  const [step, setStep] = useState<'upload' | 'detect' | 'extract' | 'complete'>('upload');
  const [pushingScanner, setPushingScanner] = useState<string | null>(null);
  const [pushedScanners, setPushedScanners] = useState<Set<string>>(new Set());
  const [useAI, setUseAI] = useState<boolean>(true); // Default to AI approach
  const [aiProcessing, setAiProcessing] = useState<boolean>(false);
  const [projectName, setProjectName] = useState<string>('');
  const [isCreatingProject, setIsCreatingProject] = useState<boolean>(false);
  const [viewingCode, setViewingCode] = useState<any | null>(null);

  // Auto-generate project name from file name
  React.useEffect(() => {
    if (file && !projectName) {
      setProjectName(file.name.replace('.py', '').replace(/[^a-zA-Z0-9\s]/g, ' ').trim());
    }
  }, [file]);

  const createProject = async () => {
    if (!projectName.trim() || extractedScanners.length === 0) return;

    setIsCreatingProject(true);

    try {
      // Create project
      const projectResponse = await fetch('http://localhost:8000/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim(),
          description: `Multi-scanner project: ${projectName.trim()}`,
          aggregation_method: 'weighted',
          tags: ['multi-scanner', 'auto-split']
        })
      });

      if (!projectResponse.ok) throw new Error('Failed to create project');
      const project = await projectResponse.json();

      // Add each scanner to the project with preserved parameters
      for (let i = 0; i < extractedScanners.length; i++) {
        const scanner = extractedScanners[i];
        await fetch(`http://localhost:8000/api/projects/${project.id}/scanners`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scanner_id: scanner.scanner_name,
            weight: 1.0 / extractedScanners.length, // Equal weights
            enabled: true,
            parameters: scanner.parameters || {}, // Preserve parameters!
            order_index: i
          })
        });
      }

      alert(`✅ Project "${projectName}" created successfully with ${extractedScanners.length} scanners!`);

    } catch (error) {
      console.error('Failed to create project:', error);
      alert('❌ Failed to create project. Please check the console for details.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && uploadedFile.name.endsWith('.py')) {
      setFile(uploadedFile);
      analyzeFile(uploadedFile);
    }
  };

  const analyzeFile = async (file: File) => {
    setLoading(true);
    setStep('detect');

    try {
      const fileContent = await file.text();

      // Analyze for multiple scanners
      const response = await fetch('http://localhost:8000/api/format/analyze-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: fileContent,
          analysis_type: 'comprehensive_with_separation'
        })
      });

      if (response.ok) {
        const analysisData = await response.json();
        setDetectedScanners(analysisData.detected_scanners || []);

        if (useAI) {
          // Use AI-powered approach regardless of detection results
          extractScannersWithAI(fileContent, file.name);
        } else if (analysisData.detected_scanners && analysisData.detected_scanners.length > 1) {
          // Multi-scanner detected, proceed to rule-based extraction
          extractScanners(fileContent, analysisData.detected_scanners);
        } else {
          // Single scanner - not much to split with rule-based approach
          setStep('complete');
        }
      } else {
        console.error('Analysis failed');
        setStep('upload');
      }
    } catch (error) {
      console.error('Error analyzing file:', error);
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  const extractScanners = async (code: string, scanners: any[]) => {
    setStep('extract');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/format/extract-scanners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          scanner_analysis: { detected_scanners: scanners }
        })
      });

      if (response.ok) {
        const extractionData = await response.json();
        setExtractedScanners(extractionData.extracted_scanners || []);
        setStep('complete');
      } else {
        console.error('Extraction failed');
        setStep('detect');
      }
    } catch (error) {
      console.error('Error extracting scanners:', error);
      setStep('detect');
    } finally {
      setLoading(false);
    }
  };

  const extractScannersWithAI = async (code: string, filename: string) => {
    setStep('extract');
    setLoading(true);
    setAiProcessing(true);

    try {
      const response = await fetch('http://localhost:8000/api/format/ai-split-scanners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          filename: filename
        })
      });

      if (response.ok) {
        const extractionData = await response.json();
        // Debug: Frontend received data for verification
        console.log('🔍 Scanner extraction completed:', (extractionData.scanners || extractionData.extracted_scanners || []).length, 'scanners');
        setExtractedScanners(extractionData.scanners || extractionData.extracted_scanners || []);
        setDetectedScanners([]); // Clear rule-based detection for AI approach
        setStep('complete');
      } else {
        console.error('AI extraction failed');
        setStep('detect');
      }
    } catch (error) {
      console.error('Error with AI extraction:', error);
      setStep('detect');
    } finally {
      setLoading(false);
      setAiProcessing(false);
    }
  };

  const downloadScanner = (scanner: any) => {
    const code = scanner.formatted_code;
    const name = scanner.scanner_name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_individual.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePushToFormatter = async (scanner: any) => {
    if (!onPushToFormatter) return;

    const scannerId = scanner.scanner_name;
    setPushingScanner(scannerId);

    try {
      // Call the parent handler
      onPushToFormatter(scanner);

      // Brief delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mark as pushed
      setPushedScanners(prev => new Set([...prev, scannerId]));
    } catch (error) {
      console.error('Error pushing scanner:', error);
    } finally {
      setPushingScanner(null);
    }
  };

  const resetTool = () => {
    setFile(null);
    setDetectedScanners([]);
    setExtractedScanners([]);
    setStep('upload');
    setPushingScanner(null);
    setPushedScanners(new Set());
  };

  return (
    <div className="min-h-screen studio-bg text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-yellow-500">Multi-Scanner Splitter</h1>
              <p className="text-gray-400">Convert multi-scanner files into individual scanners</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Close
            </button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 space-x-4">
          {[
            { key: 'upload', label: 'Upload File', icon: Upload },
            { key: 'detect', label: 'Detect Scanners', icon: AlertCircle },
            { key: 'extract', label: 'Extract Individual', icon: FileText },
            { key: 'complete', label: 'Download', icon: Download },
          ].map(({ key, label, icon: Icon }, index) => (
            <div key={key} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step === key ? 'border-yellow-500 bg-yellow-500 text-black' :
                ['upload', 'detect', 'extract', 'complete'].indexOf(step) > index ? 'border-green-500 bg-green-500 text-white' :
                'border-gray-600 text-gray-400'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`ml-2 text-sm ${
                step === key ? 'text-yellow-500' :
                ['upload', 'detect', 'extract', 'complete'].indexOf(step) > index ? 'text-green-500' :
                'text-gray-500'
              }`}>
                {label}
              </span>
              {index < 3 && <div className="w-8 h-px bg-gray-600 mx-4"></div>}
            </div>
          ))}
        </div>

        {/* AI vs Rule-based Toggle */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">Splitting Method:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUseAI(true)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    useAI
                      ? 'bg-yellow-600 text-black'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  🧠 AI-Powered (Recommended)
                </button>
                <button
                  onClick={() => setUseAI(false)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    !useAI
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  📋 Rule-based
                </button>
              </div>
              {aiProcessing && (
                <div className="text-sm text-yellow-400 flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                  AI analyzing...
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {useAI
                ? 'AI intelligently preserves trading logic and dependencies'
                : 'Traditional pattern-based scanner detection'
              }
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-lg border p-8" style={{ backgroundColor: 'var(--studio-surface)', borderColor: 'var(--studio-border)' }}>
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="text-center">
              <Upload className="w-16 h-16 mx-auto mb-6 text-gray-500" />
              <h2 className="text-xl font-semibold mb-4">Upload Multi-Scanner File</h2>
              <p className="text-gray-400 mb-6">
                Upload Python files like "lc d2 scan" or "SC DMR SCAN" that contain multiple scanner patterns
              </p>

              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 hover:border-gray-500 transition-colors">
                <input
                  type="file"
                  accept=".py"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FileText className="w-12 h-12 text-yellow-500 mb-4" />
                  <span className="text-lg font-medium text-yellow-500 mb-2">Click to upload .py file</span>
                  <span className="text-gray-400 text-sm">or drag and drop your multi-scanner file here</span>
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Detection */}
          {step === 'detect' && (
            <div className="text-center">
              {loading ? (
                <div>
                  <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                  <h2 className="text-xl font-semibold mb-4">Analyzing {file?.name}</h2>
                  <p className="text-gray-400">Detecting individual scanner patterns...</p>
                </div>
              ) : (
                <div>
                  <Check className="w-16 h-16 mx-auto mb-6 text-green-500" />
                  <h2 className="text-xl font-semibold mb-4">
                    Found {detectedScanners.length} Scanner{detectedScanners.length !== 1 ? 's' : ''}
                  </h2>

                  <div className="space-y-3 max-w-md mx-auto">
                    {detectedScanners.map((scanner, index) => (
                      <div key={index} className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <div className="font-medium text-yellow-500">{scanner.name}</div>
                            <div className="text-sm text-gray-400">
                              {scanner.functions.length} functions • {Math.round(scanner.confidence * 100)}% confidence
                            </div>
                          </div>
                          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {detectedScanners.length === 1 && (
                    <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-300">This file contains only one scanner. You can use it directly with your existing system!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Extraction */}
          {step === 'extract' && (
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-xl font-semibold mb-4">Extracting Individual Scanners</h2>
              <p className="text-gray-400">Creating standalone files from {detectedScanners.length} scanners...</p>
            </div>
          )}

          {/* Step 4: Complete - Downloads */}
          {step === 'complete' && (
            <div>
              {extractedScanners.length > 1 ? (
                <div>
                  <div className="text-center mb-8">
                    <Check className="w-16 h-16 mx-auto mb-6 text-green-500" />
                    <h2 className="text-xl font-semibold mb-4">✅ Extraction Complete!</h2>
                    <p className="text-gray-400">
                      Successfully split {file?.name} into {extractedScanners.length} individual scanners
                    </p>
                  </div>

                  <div className="grid gap-4 mb-8">
                    {extractedScanners.map((scanner, index) => (
                      <div key={index} className="bg-gray-900 rounded-lg p-6 border border-gray-600 hover:border-gray-500 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-yellow-500">
                                {scanner.scanner_name}
                              </h3>
                              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                                📊 PROJECT SCANNER
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm text-gray-400">
                              <div>📊 {scanner.parameters?.length || 0} parameters</div>
                              <div>📄 {Math.round(scanner.formatted_code.length / 1024)}KB</div>
                              <div>🔧 Ready for use</div>
                            </div>
                          </div>
                          <div className="ml-4 flex gap-2">
                            <button
                              onClick={() => setViewingCode(scanner)}
                              className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Code
                            </button>
                            <button
                              onClick={() => downloadScanner(scanner)}
                              className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                            {onPushToFormatter && (
                              <button
                                onClick={() => handlePushToFormatter(scanner)}
                                disabled={pushingScanner === scanner.scanner_name || pushedScanners.has(scanner.scanner_name)}
                                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                                  pushedScanners.has(scanner.scanner_name)
                                    ? 'bg-green-600 text-white cursor-not-allowed'
                                    : pushingScanner === scanner.scanner_name
                                    ? 'bg-yellow-500 text-black cursor-wait'
                                    : 'bg-yellow-600 hover:bg-yellow-500 text-black'
                                }`}
                              >
                                {pushingScanner === scanner.scanner_name ? (
                                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                ) : pushedScanners.has(scanner.scanner_name) ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                                {pushedScanners.has(scanner.scanner_name)
                                  ? 'Pushed'
                                  : pushingScanner === scanner.scanner_name
                                  ? 'Pushing...'
                                  : 'Push to Formatter'
                                }
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Project Creation Section */}
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 mb-6">
                    <h4 className="text-blue-400 font-semibold mb-4 flex items-center gap-2">
                      📊 Save as Multi-Scanner Project
                    </h4>
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-sm text-gray-400 mb-2">Project Name</label>
                        <input
                          type="text"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          placeholder={file?.name?.replace('.py', '') || 'My Scanner Project'}
                          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={() => createProject()}
                        disabled={isCreatingProject || !projectName.trim()}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        {isCreatingProject ? (
                          <>Creating...</>
                        ) : (
                          <>📊 Create Project</>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-400 mt-3">
                      Creates a reusable project with all {extractedScanners.length} scanners, configurable weights, and execution settings.
                    </p>
                  </div>

                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
                    <h4 className="text-green-400 font-semibold mb-2">🎉 Next Steps:</h4>
                    <ul className="text-green-300 space-y-1 text-sm">
                      <li>• Download each individual scanner above</li>
                      <li>• Upload them to your existing single-scanner system</li>
                      <li>• Each scanner will work perfectly with parameter extraction</li>
                      <li>• No more complex multi-scanner interface needed!</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 mx-auto mb-6 text-blue-500" />
                  <h2 className="text-xl font-semibold mb-4">Single Scanner Detected</h2>
                  <p className="text-gray-400 mb-6">
                    This file contains only one scanner. You can use it directly with your existing system!
                  </p>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-blue-300">No splitting needed - upload this file to your regular scanner formatter.</p>
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={resetTool}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  Split Another File
                </button>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-black rounded-lg font-medium transition-colors"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Code View Modal */}
      {viewingCode && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-600 max-w-4xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-600">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{viewingCode.scanner_name}</h3>
                  <p className="text-sm text-gray-400">
                    {viewingCode.parameters?.length || 0} parameters • {Math.round((viewingCode.formatted_code?.length || 0) / 1024)}KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingCode(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Scanner Description */}
              <div className="p-4 bg-gray-900 border-b border-gray-600">
                <p className="text-gray-300 text-sm">{viewingCode.description}</p>
              </div>

              {/* Code Display */}
              <div className="flex-1 overflow-auto p-6">
                <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-400 font-mono">Python Code</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(viewingCode.formatted_code || viewingCode.scanner_code || '');
                        // You could add a toast notification here
                      }}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="text-sm text-gray-100 overflow-auto font-mono whitespace-pre-wrap">
                    {viewingCode.formatted_code || viewingCode.scanner_code || 'No code available'}
                  </pre>
                </div>

                {/* Parameters Section */}
                {viewingCode.parameters && viewingCode.parameters.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Parameters ({viewingCode.parameters.length})</h4>
                    <div className="grid gap-3">
                      {viewingCode.parameters.map((param: any, index: number) => (
                        <div key={index} className="bg-gray-900 rounded-lg border border-gray-700 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-yellow-400">{param.name}</span>
                                <span className="px-2 py-1 bg-blue-600 rounded text-xs font-medium text-white">
                                  {param.type}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  param.importance === 'high' ? 'bg-red-600 text-white' :
                                  param.importance === 'medium' ? 'bg-yellow-600 text-black' :
                                  'bg-gray-600 text-white'
                                }`}>
                                  {param.importance}
                                </span>
                              </div>
                              <p className="text-sm text-gray-400">{param.description}</p>
                            </div>
                            <div className="ml-4 text-right">
                              <div className="text-lg font-bold text-green-400">{param.current_value}</div>
                              <div className="text-xs text-gray-500">{param.category}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-600 bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Complexity: {viewingCode.complexity || 'N/A'} • Ready for use
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        downloadScanner(viewingCode);
                        setViewingCode(null);
                      }}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={() => setViewingCode(null)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}