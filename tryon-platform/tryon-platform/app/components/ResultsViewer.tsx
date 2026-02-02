'use client';

import { useState } from 'react';
import { Job } from '@/types';

interface ResultsViewerProps {
  job: Job;
}

export default function ResultsViewer({ job }: ResultsViewerProps) {
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const [showBefore, setShowBefore] = useState(true);
  const [showReport, setShowReport] = useState(false);

  const selectedTask = job.tasks[selectedTaskIndex];
  const completedTasks = job.tasks.filter(task => task.status === 'completed');

  const downloadFile = async (url: string, filename: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  };

  const getTaskProgress = (task: typeof job.tasks[0]) => {
    switch (task.status) {
      case 'queued':
        return 0;
      case 'running':
        return 50;
      case 'verifying':
        return 75;
      case 'completed':
        return 100;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Processing Results
        </h3>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          job.status === 'completed' ? 'bg-green-100 text-green-800' :
          job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
          job.status === 'failed' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {job.status.toUpperCase()}
        </span>
      </div>

      {/* Task Navigation */}
      {job.tasks.length > 1 && (
        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
          {job.tasks.map((task, index) => (
            <button
              key={task.id}
              onClick={() => setSelectedTaskIndex(index)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                index === selectedTaskIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Photo {index + 1}
              {task.status === 'completed' && (
                <svg className="w-4 h-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {task.status === 'failed' && (
                <svg className="w-4 h-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Selected Task Details */}
      {selectedTask && (
        <div className="space-y-4">
          {/* Task Status and Progress */}
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium capitalize ${
              selectedTask.status === 'completed' ? 'text-green-600' :
              selectedTask.status === 'running' ? 'text-blue-600' :
              selectedTask.status === 'failed' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {selectedTask.status}
            </span>
            {selectedTask.error && (
              <span className="text-red-600 text-xs">{selectedTask.error}</span>
            )}
          </div>

          {(selectedTask.status === 'running' || selectedTask.status === 'verifying') && (
            <div>
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getTaskProgress(selectedTask)}%` }}
                />
              </div>
            </div>
          )}

          {/* Image Viewer */}
          {selectedTask.status === 'completed' && selectedTask.result && (
            <div className="space-y-4">
              {/* Before/After Toggle */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setShowBefore(!showBefore)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <span>{showBefore ? 'Before' : 'After'}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </button>
              </div>

              {/* Image Display */}
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={showBefore ? selectedTask.subjectFile.url : selectedTask.result.imageUrl}
                  alt={showBefore ? 'Original photo' : 'Photo with glasses'}
                  className="w-full h-auto max-h-96 object-contain"
                />
                <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-50 text-white text-sm rounded">
                  {showBefore ? 'Original' : 'With Glasses'}
                </div>
              </div>

              {/* Download Buttons */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => downloadFile(selectedTask.result.imageUrl, `tryon_result_${selectedTask.id}.jpg`)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download Result</span>
                </button>
                <button
                  onClick={() => setShowReport(!showReport)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>View Report</span>
                </button>
              </div>

              {/* Edit Report */}
              {showReport && selectedTask.result.editReport && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Edit Report</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Model:</span>
                      <span className="ml-2 text-gray-600">{selectedTask.result.editReport.version.model}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Seed:</span>
                      <span className="ml-2 text-gray-600">{selectedTask.result.editReport.generation.seed}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">SSIM Score:</span>
                      <span className="ml-2 text-gray-600">{selectedTask.result.editReport.quality.ssim.toFixed(3)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Face Distance:</span>
                      <span className="ml-2 text-gray-600">{selectedTask.result.editReport.quality.faceDist.toFixed(3)}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">Notes:</span>
                      <p className="mt-1 text-gray-600">{selectedTask.result.editReport.notes}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadFile(selectedTask.result.reportUrl, `report_${selectedTask.id}.json`)}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Download full report
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {job.status === 'completed' && (
        <div className="mt-6 pt-6 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total photos processed:</span>
            <span className="font-medium">{completedTasks.length}/{job.tasks.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}