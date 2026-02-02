'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Job, UploadedFile } from '@/types';

interface FileUploadProps {
  onUploadComplete: (job: Job) => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [subjectFiles, setSubjectFiles] = useState<File[]>([]);
  const [glassesFiles, setGlassesFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDropSubject = useCallback((acceptedFiles: File[]) => {
    setSubjectFiles(prev => [...prev, ...acceptedFiles].slice(0, 10));
  }, []);

  const onDropGlasses = useCallback((acceptedFiles: File[]) => {
    setGlassesFiles(prev => [...prev, ...acceptedFiles].slice(0, 3));
  }, []);

  const {
    getRootProps: getSubjectRootProps,
    getInputProps: getSubjectInputProps,
    isDragActive: isSubjectDragActive
  } = useDropzone({
    onDrop: onDropSubject,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 10,
    maxSize: 25 * 1024 * 1024 // 25MB
  });

  const {
    getRootProps: getGlassesRootProps,
    getInputProps: getGlassesInputProps,
    isDragActive: isGlassesDragActive
  } = useDropzone({
    onDrop: onDropGlasses,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 3,
    maxSize: 25 * 1024 * 1024 // 25MB
  });

  const handleUpload = async () => {
    if (subjectFiles.length === 0 || glassesFiles.length === 0) {
      alert('Please upload at least one subject photo and one glasses photo');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      subjectFiles.forEach((file) => {
        formData.append('subjects', file);
      });

      glassesFiles.forEach((file) => {
        formData.append('glasses', file);
      });

      const response = await fetch('/api/jobs', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const job: Job = await response.json();
      onUploadComplete(job);

      // Reset form
      setSubjectFiles([]);
      setGlassesFiles([]);
      setUploadProgress(0);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (type: 'subject' | 'glasses', index: number) => {
    if (type === 'subject') {
      setSubjectFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setGlassesFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      {/* Subject Photos Upload */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Your Photos (Subject)
        </h3>
        <div
          {...getSubjectRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isSubjectDragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getSubjectInputProps()} />
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <p className="text-gray-600 mb-2">
            {isSubjectDragActive ? 'Drop photos here...' : 'Drag & drop your photos here'}
          </p>
          <p className="text-sm text-gray-500">or click to select files</p>
          <p className="text-xs text-gray-400 mt-2">PNG, JPG up to 25MB (max 10 photos)</p>
        </div>

        {subjectFiles.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {subjectFiles.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Subject ${index + 1}`}
                  className="w-full h-20 object-cover rounded"
                />
                <button
                  onClick={() => removeFile('subject', index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b truncate">
                  {file.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Glasses Photos Upload */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Glasses Reference Photos
        </h3>
        <div
          {...getGlassesRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isGlassesDragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getGlassesInputProps()} />
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <p className="text-gray-600 mb-2">
            {isGlassesDragActive ? 'Drop glasses photos here...' : 'Drag & drop glasses photos here'}
          </p>
          <p className="text-sm text-gray-500">or click to select files</p>
          <p className="text-xs text-gray-400 mt-2">PNG, JPG up to 25MB (max 3 photos)</p>
        </div>

        {glassesFiles.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {glassesFiles.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Glasses ${index + 1}`}
                  className="w-full h-20 object-cover rounded"
                />
                <button
                  onClick={() => removeFile('glasses', index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b truncate">
                  {file.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={isUploading || subjectFiles.length === 0 || glassesFiles.length === 0}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          isUploading || subjectFiles.length === 0 || glassesFiles.length === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Start Try-On Processing'}
      </button>

      {isUploading && (
        <div className="mt-2">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1 text-center">Uploading files...</p>
        </div>
      )}
    </div>
  );
}