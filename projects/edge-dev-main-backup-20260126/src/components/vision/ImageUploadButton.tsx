/**
 * Image Upload Button Component
 * Upload images for vision analysis
 */

'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadButtonProps {
  onImageSelect: (imageData: { url: string; base64: string; file: File }) => void;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  showPreview?: boolean;
  className?: string;
}

export function ImageUploadButton({
  onImageSelect,
  accept = 'image/*',
  maxSizeMB = 10,
  disabled = false,
  showPreview = true,
  className = ''
}: ImageUploadButtonProps) {
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    base64: string;
    file: File;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setLoading(true);

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      setLoading(false);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      setLoading(false);
      return;
    }

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);
      const url = URL.createObjectURL(file);

      const imageData = { url, base64, file };
      setSelectedImage(imageData);
      onImageSelect(imageData);
    } catch (err) {
      setError('Failed to process image');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/...;base64, prefix if needed
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <Button
          onClick={handleClick}
          disabled={disabled || loading}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {selectedImage ? 'Change Image' : 'Upload Image'}
        </Button>

        {selectedImage && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 flex items-center gap-1">
          <X className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Image Preview */}
      {selectedImage && showPreview && (
        <Card className="p-4">
          <div className="space-y-2">
            <div className="relative aspect-video max-h-64 w-full overflow-hidden rounded-lg bg-muted">
              <img
                src={selectedImage.url}
                alt="Uploaded preview"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{selectedImage.file.name}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {(selectedImage.file.size / 1024 / 1024).toFixed(2)} MB • {selectedImage.file.type}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Instructions */}
      {!selectedImage && (
        <Card className="p-4 border-dashed">
          <div className="text-center space-y-2">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
            <div className="text-sm font-medium">Upload an image for analysis</div>
            <div className="text-xs text-muted-foreground">
              Supports: PNG, JPG, GIF, WebP (max {maxSizeMB}MB)
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
