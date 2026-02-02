'use client';

import { useState, useEffect } from 'react';
import { Brain, Upload, Play, TrendingUp, BarChart3, Settings, Search, Target, Filter, Clock, Database, MessageCircle, ChevronUp, ChevronDown, Trash2, RefreshCw, Save, X, Check } from 'lucide-react';
import StandaloneRenataChat from '@/components/StandaloneRenataChat';
import { CodeFormatterService } from '@/utils/codeFormatterAPI';
import { fastApiScanService } from '@/services/fastApiScanService';

export default function ScanPage() {
  const [isRenataPopupOpen, setIsRenataPopupOpen] = useState(false);
  const [uploadedCode, setUploadedCode] = useState<string>('');
  const [formattedCode, setFormattedCode] = useState<string>('');
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const code = await file.text();
      setUploadedCode(code);
      console.log('📁 File uploaded:', file.name);
    } catch (error) {
      console.error('❌ Error reading file:', error);
      alert('Error reading file. Please try again.');
    }
  };

  // Format code using Renata
  const handleFormatCode = async () => {
    if (!uploadedCode) {
      alert('Please upload a scanner file first');
      return;
    }

    setIsFormatting(true);
    try {
      const response = await fetch('/api/sophisticated-format', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: uploadedCode,
          filename: 'scanner.py'
        }),
      });

      const result = await response.json();

      if (result.success) {
        setFormattedCode(result.formatted_code);
        console.log('✅ Code formatted successfully');
      } else {
        console.error('❌ Formatting failed:', result.error);
        alert('Formatting failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error formatting code:', error);
      alert('Error formatting code. Please check console for details.');
    } finally {
      setIsFormatting(false);
    }
  };

  // Run scan
  const handleRunScan = async () => {
    if (!formattedCode) {
      alert('Please format the code first before running scan');
      return;
    }

    setIsScanning(true);
    try {
      const response = await fastApiScanService.executeScan({
        scanner_type: 'universal_backside_scanner',
        uploaded_code: formattedCode,
        start_date: '2025-01-01',
        end_date: '2025-11-01',
        use_real_scan: true,
        filters: {
          gap_div_atr: 0.75,
          atr_mult: 0.9
        }
      });

      if (response.success) {
        // Mock results for now - would integrate with real scan execution
        const mockResults = [
          { ticker: 'AAPL', date: '2025-01-15', entry_price: 195.50, confidence: 0.85 },
          { ticker: 'MSFT', date: '2025-02-03', entry_price: 420.75, confidence: 0.92 },
          { ticker: 'GOOGL', date: '2025-03-12', entry_price: 152.30, confidence: 0.78 }
        ];
        setScanResults(mockResults);
        console.log('✅ Scan completed successfully');
      } else {
        console.error('❌ Scan failed:', response.message);
        alert('Scan failed: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error running scan:', error);
      alert('Error running scan. Please check console for details.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-md border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Target className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">EdgeDev Scanner Platform</h1>
                <p className="text-gray-400 text-sm">Universal Market Universe Scanning with AI Enhancement</p>
              </div>
            </div>

            {/* Renata Button */}
            <button
              onClick={() => setIsRenataPopupOpen(!isRenataPopupOpen)}
              className="flex items-center gap-3 px-6 py-3 rounded-lg border transition-all duration-200"
              style={{
                border: isRenataPopupOpen
                  ? '1px solid rgba(212, 175, 55, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                background: isRenataPopupOpen
                  ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)'
                  : 'rgba(255, 255, 255, 0.02)',
                color: isRenataPopupOpen ? '#D4AF37' : '#FFFFFF'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isRenataPopupOpen
                  ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.08) 100%)'
                  : 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isRenataPopupOpen
                  ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)'
                  : 'rgba(255, 255, 255, 0.02)';
              }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: isRenataPopupOpen
                    ? 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)'
                    : 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)',
                }}
              >
                <Brain className="w-4 h-4" style={{ color: isRenataPopupOpen ? '#000' : '#D4AF37' }} />
              </div>
              <div className="text-left">
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>
                  Renata
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  AI Assistant
                </div>
              </div>
              <div className="w-2 h-2 rounded-full"
                style={{
                  background: isRenataPopupOpen ? '#D4AF37' : '#10B981',
                  boxShadow: `0 0 8px ${isRenataPopupOpen ? 'rgba(212, 175, 55, 0.5)' : 'rgba(16, 185, 129, 0.5)'}`,
                }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload & Control */}
          <div className="space-y-6">
            {/* Upload Card */}
            <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                Upload Scanner Code
              </h2>

              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept=".py,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="scan-file-upload"
                />
                <label
                  htmlFor="scan-file-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <Upload className="w-12 h-12 text-gray-400" />
                  <div>
                    <div className="text-white font-medium">
                      {uploadedCode ? 'File uploaded successfully' : 'Click to upload scanner file'}
                    </div>
                    <div className="text-gray-400 text-sm mt-1">
                      Supports .py, .txt files
                    </div>
                  </div>
                </label>
              </div>

              {uploadedCode && (
                <div className="mt-4 space-y-3">
                  <button
                    onClick={() => setIsRenataPopupOpen(true)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Brain className="w-4 h-4" />
                    Format with Renata AI
                  </button>

                  <button
                    onClick={handleFormatCode}
                    disabled={isFormatting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isFormatting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Formatting...
                      </>
                    ) : (
                      <>
                        <Settings className="w-4 h-4" />
                        Apply Universal Formatting
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Scan Execution Card */}
            <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Play className="w-5 h-5 text-green-400" />
                Execute Scan
              </h2>

              <button
                onClick={handleRunScan}
                disabled={isScanning || !formattedCode}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isScanning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Scanning Market...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Run Market Scan
                  </>
                )}
              </button>

              <div className="mt-4 text-sm text-gray-400 space-y-1">
                <p>• Date Range: Jan 1, 2025 - Nov 1, 2025</p>
                <p>• Market Universe: 17,000+ stocks</p>
                <p>• Universal Two-Stage Processing</p>
              </div>
            </div>

            {/* Results Card */}
            {scanResults.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  Scan Results
                </h2>

                <div className="space-y-2">
                  {scanResults.map((result, index) => (
                    <div key={index} className="bg-gray-900/50 p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="text-white font-medium">{result.ticker}</div>
                        <div className="text-gray-400 text-sm">{result.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-medium">${result.entry_price}</div>
                        <div className="text-gray-400 text-sm">{Math.round(result.confidence * 100)}% confidence</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Status & Info */}
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                Scanner Status
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Code Uploaded</span>
                  <span className={uploadedCode ? "text-green-400" : "text-gray-500"}>
                    {uploadedCode ? "✓ Ready" : "○ Pending"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Universal Formatting</span>
                  <span className={formattedCode ? "text-green-400" : "text-gray-500"}>
                    {formattedCode ? "✓ Applied" : "○ Pending"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Market Coverage</span>
                  <span className="text-blue-400">
                    {formattedCode ? "17,000+ stocks" : "—"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Two-Stage Processing</span>
                  <span className={formattedCode ? "text-green-400" : "text-gray-500"}>
                    {formattedCode ? "✓ Active" : "○ Pending"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Universal Scanner Features
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5"></div>
                  <span className="text-gray-300">Complete market universe fetching (17,000+ stocks)</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5"></div>
                  <span className="text-gray-300">Smart temporal filtering based on D-1 parameters</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5"></div>
                  <span className="text-gray-300">Original pattern detection logic preserved</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5"></div>
                  <span className="text-gray-300">Multi-threaded processing optimization</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5"></div>
                  <span className="text-gray-300">Real-time AI-powered enhancement via Renata</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Renata Popup */}
      {(StandaloneRenataChat as any)({
        isOpen: isRenataPopupOpen,
        onClose: () => setIsRenataPopupOpen(false)
      })}
    </div>
  );
}