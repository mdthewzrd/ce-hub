'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Eye,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Settings,
  Brain,
  Zap,
  BarChart3
} from 'lucide-react';
import EnhancedStrategyUpload from './EnhancedStrategyUpload';
import { useEnhancedUpload, type UploadResult } from '@/hooks/useEnhancedUpload';

const UploadDemoIntegration: React.FC = () => {
  const [showUpload, setShowUpload] = useState(false);
  const {
    uploadStrategy,
    isUploading,
    uploadResults,
    error,
    generateUploadReport,
    clearResults
  } = useEnhancedUpload();

  const handleUpload = async (file: File, code: string, metadata: any) => {
    console.log('  Demo: Starting enhanced upload process...');
    console.log('📁 File:', file.name);
    console.log('📊 Metadata:', metadata);

    const result = await uploadStrategy(file, code, metadata);

    if (result.success) {
      console.log('  Demo: Upload completed successfully!');
      // Here you would typically integrate with your existing strategy management system
      // For example:
      // - Save to database
      // - Update strategy list
      // - Navigate to strategy details
    } else {
      console.error('❌ Demo: Upload failed:', result.error);
    }
  };

  const getScannerTypeIcon = (type: string) => {
    switch (type) {
      case 'A+': return <Target className="h-4 w-4 text-green-400" />;
      case 'LC': return <TrendingUp className="h-4 w-4 text-blue-400" />;
      case 'Custom': return <Settings className="h-4 w-4 text-purple-400" />;
      default: return <Eye className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success
      ? <CheckCircle className="h-4 w-4 text-green-400" />
      : <AlertCircle className="h-4 w-4 text-red-400" />;
  };

  const report = generateUploadReport();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Enhanced Strategy Upload</h2>
          <p className="text-[#888888] mt-1">
            AI-powered upload with manual verification and parameter validation
          </p>
        </div>
        <Button
          onClick={() => setShowUpload(true)}
          className="bg-[#FFD700] hover:bg-[#FFA500] text-black"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Strategy
        </Button>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#333333] bg-[#1a1a1a]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-[#FFD700]" />
              <div>
                <h3 className="text-white font-medium">AI Analysis</h3>
                <p className="text-[#888888] text-sm">Renata AI scanner detection</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#333333] bg-[#1a1a1a]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-blue-400" />
              <div>
                <h3 className="text-white font-medium">Preview & Verify</h3>
                <p className="text-[#888888] text-sm">Manual verification workflow</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#333333] bg-[#1a1a1a]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-green-400" />
              <div>
                <h3 className="text-white font-medium">Parameter Review</h3>
                <p className="text-[#888888] text-sm">Editable parameter validation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#333333] bg-[#1a1a1a]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-purple-400" />
              <div>
                <h3 className="text-white font-medium">Integration</h3>
                <p className="text-[#888888] text-sm">Seamless workflow integration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Results Summary */}
      {uploadResults.length > 0 && (
        <Card className="border-[#333333] bg-[#1a1a1a]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Upload Statistics
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={clearResults}
                className="border-[#333333] text-[#888888] hover:text-white hover:border-white"
              >
                Clear History
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{report.summary.totalUploads}</div>
                <div className="text-[#888888] text-sm">Total Uploads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{report.summary.successfulUploads}</div>
                <div className="text-[#888888] text-sm">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#FFD700]">{report.summary.avgConfidence}%</div>
                <div className="text-[#888888] text-sm">Avg Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{report.summary.totalParameters}</div>
                <div className="text-[#888888] text-sm">Total Parameters</div>
              </div>
            </div>

            {/* Scanner Type Breakdown */}
            <div className="space-y-2">
              <h4 className="text-white font-medium">Scanner Types</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(report.scannerTypes).map(([type, count]) => (
                  <Badge
                    key={type}
                    variant="outline"
                    className="border-[#555555] text-white bg-[#2a2a2a]"
                  >
                    {getScannerTypeIcon(type)}
                    <span className="ml-1">{type}: {count}</span>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Uploads */}
      {uploadResults.length > 0 && (
        <Card className="border-[#333333] bg-[#1a1a1a]">
          <CardHeader>
            <CardTitle className="text-white">Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadResults.slice(-5).reverse().map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded border border-[#333333]"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.success)}
                    <div>
                      <div className="text-white font-medium">
                        {result.metadata.strategyName}
                      </div>
                      <div className="text-[#888888] text-sm flex items-center gap-2">
                        {getScannerTypeIcon(result.metadata.scannerType)}
                        <span>{result.metadata.scannerType}</span>
                        <span>•</span>
                        <span>{result.metadata.parameters.length} params</span>
                        <span>•</span>
                        <span>{result.metadata.confidence}% confidence</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.metadata.aiAnalyzed && (
                      <Badge variant="outline" className="border-blue-400 text-blue-400 bg-blue-400/10">
                        AI Analyzed
                      </Badge>
                    )}
                    {result.metadata.verificationCompleted && (
                      <Badge variant="outline" className="border-green-400 text-green-400 bg-green-400/10">
                        Verified
                      </Badge>
                    )}
                    {result.success ? (
                      <Badge variant="outline" className="border-green-400 text-green-400 bg-green-400/10">
                        Success
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-400 text-red-400 bg-red-400/10">
                        Failed
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-400 bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <div className="text-red-400 font-medium">Upload Error</div>
                <div className="text-red-300 text-sm mt-1">{error}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isUploading && (
        <Card className="border-[#FFD700] bg-[#FFD700]/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#FFD700] border-t-transparent" />
              <div className="text-[#FFD700]">Processing upload...</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Upload Modal */}
      {showUpload && (
        <EnhancedStrategyUpload
          onUpload={handleUpload}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
};

export default UploadDemoIntegration;