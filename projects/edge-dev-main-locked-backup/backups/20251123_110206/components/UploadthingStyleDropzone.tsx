import React, { useCallback, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';

interface DropzoneProps {
  onFileDrop: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
  className?: string;
}

export function UploadthingStyleDropzone({
  onFileDrop,
  accept = '.py,.txt',
  maxSize = 4,
  disabled = false,
  className = ''
}: DropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDragReject, setIsDragReject] = useState(false);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragActive(true);
  }, [disabled]);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set drag inactive if we're actually leaving the dropzone
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragActive(false);
    setIsDragReject(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    // Check if file type is valid
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      const isValidType = accept.split(',').some(type =>
        file.name.toLowerCase().endsWith(type.trim().replace('.', ''))
      );
      const isValidSize = file.size <= maxSize * 1024 * 1024;

      setIsDragReject(!isValidType || !isValidSize);
    }
  }, [accept, maxSize, disabled]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setIsDragReject(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];

      // Validate file type
      const isValidType = accept.split(',').some(type =>
        file.name.toLowerCase().endsWith(type.trim().replace('.', ''))
      );

      // Validate file size
      const isValidSize = file.size <= maxSize * 1024 * 1024;

      if (!isValidType) {
        alert(`Please upload a valid file type: ${accept}`);
        return;
      }

      if (!isValidSize) {
        alert(`File size must be less than ${maxSize}MB`);
        return;
      }

      onFileDrop(file);
    }
  }, [onFileDrop, accept, maxSize, disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileDrop(files[0]);
    }
    // Reset input value to allow re-uploading same file
    e.target.value = '';
  }, [onFileDrop]);

  const getBorderColor = () => {
    if (isDragReject) return 'border-red-400';
    if (isDragActive) return 'border-blue-400';
    if (disabled) return 'border-gray-600';
    return 'border-gray-500';
  };

  const getBackgroundColor = () => {
    if (isDragReject) return 'bg-red-500/10';
    if (isDragActive) return 'bg-blue-500/10';
    if (disabled) return 'bg-gray-500/5';
    return 'bg-gray-500/5 hover:bg-gray-500/10';
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        id="uploadthing-file-input"
        disabled={disabled}
      />

      <label
        htmlFor="uploadthing-file-input"
        className={`
          flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200
          ${getBorderColor()}
          ${getBackgroundColor()}
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
          <div className={`
            mb-2 transition-colors duration-200
            ${isDragReject ? 'text-red-400' :
              isDragActive ? 'text-blue-400' :
              disabled ? 'text-gray-600' : 'text-gray-400'}
          `}>
            {isDragReject ? (
              <X className="w-8 h-8" />
            ) : isDragActive ? (
              <FileText className="w-8 h-8" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>

          <p className={`
            mb-2 text-sm font-medium transition-colors duration-200
            ${isDragReject ? 'text-red-400' :
              isDragActive ? 'text-blue-400' :
              disabled ? 'text-gray-600' : 'text-gray-300'}
          `}>
            {isDragReject ? (
              'Invalid file type or size'
            ) : isDragActive ? (
              'Drop your file here'
            ) : disabled ? (
              'Upload disabled'
            ) : (
              'Drop files here or click to browse'
            )}
          </p>

          <p className={`
            text-xs transition-colors duration-200
            ${disabled ? 'text-gray-600' : 'text-gray-500'}
          `}>
            {accept} files up to {maxSize}MB
          </p>
        </div>
      </label>
    </div>
  );
}