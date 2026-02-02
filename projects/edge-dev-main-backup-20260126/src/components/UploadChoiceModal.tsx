/**
 * UploadChoiceModal Component
 *
 * Unified upload experience that allows users to choose between:
 * - Single Scanner: Traditional upload and run workflow
 * - Multi-Scanner Project: Upload, split, and save as project workflow
 */

'use client'

import React, { useEffect } from 'react';
import { X, Upload, BarChart3, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface UploadChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSingleScanner: () => void;
  onMultiScannerProject: () => void;
}

const UploadChoiceModal: React.FC<UploadChoiceModalProps> = ({
  isOpen,
  onClose,
  onSingleScanner,
  onMultiScannerProject
}) => {
  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl p-6"
           style={{ backgroundColor: 'var(--studio-bg)', borderColor: 'var(--studio-border)' }}
           data-testid="upload-choice-modal">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Scanner Strategy
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-300 mb-6">
            Choose how you'd like to upload and configure your scanner strategy:
          </p>

          {/* Single Scanner Option */}
          <Card
            className="p-6 bg-gray-800 border-gray-700 hover:bg-gray-750 cursor-pointer transition-colors group"
            onClick={onSingleScanner}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 bg-opacity-20 rounded-lg flex items-center justify-center group-hover:bg-opacity-30 transition-colors">
                <Zap className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Single Scanner</h3>
                <p className="text-gray-400 mb-3">
                  Upload one scanner strategy and run it immediately. Perfect for testing individual strategies or running standalone scans.
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <span>• Upload code • Run scan • View results</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Multi-Scanner Project Option */}
          <Card
            className="p-6 bg-gray-800 border-gray-700 hover:bg-gray-750 cursor-pointer transition-colors group"
            onClick={onMultiScannerProject}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-600 bg-opacity-20 rounded-lg flex items-center justify-center group-hover:bg-opacity-30 transition-colors">
                <BarChart3 className="h-6 w-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Multi-Scanner Project</h3>
                <p className="text-gray-400 mb-3">
                  Upload complex scanner code, automatically split it into individual scanners, and save as a reusable project. Ideal for sophisticated multi-strategy compositions.
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <span>• Upload code • Auto-split scanners • Save as project • Configure weights</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadChoiceModal;