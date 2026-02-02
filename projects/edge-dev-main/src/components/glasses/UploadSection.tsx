/**
 * Upload Section Component
 * Handles uploading person and glasses images
 *
 * Reusing ImageUploadButton patterns
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageUploadButton } from '@/components/vision/ImageUploadButton';
import { Upload, User, Glasses, Check, AlertCircle } from 'lucide-react';

interface UploadSectionProps {
  onPersonImageSelect: (image: { url: string; base64: string; file: File }) => void;
  onGlassesImageSelect: (image: { url: string; base64: string; file: File }) => void;
  onCompose: () => void;
  disabled?: boolean;
  personImage?: { url: string; base64: string; file: File } | null;
  glassesImage?: { url: string; base64: string; file: File } | null;
  loading?: boolean;
}

export function UploadSection({
  onPersonImageSelect,
  onGlassesImageSelect,
  onCompose,
  disabled = false,
  personImage,
  glassesImage,
  loading = false
}: UploadSectionProps) {
  const [quality, setQuality] = React.useState<'draft' | 'standard' | 'high'>('standard');

  const canCompose = personImage && glassesImage && !disabled && !loading;

  const qualityDescriptions = {
    draft: 'Fast preview (512px, ~$0.005)',
    standard: 'Good quality (1024px, ~$0.01)',
    high: 'Best quality (2048px, ~$0.02)'
  };

  return (
    <div className="space-y-6">
      {/* Upload Areas */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Person Photo Upload */}
        <Card className={personImage ? 'border-green-500/50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Person Photo
              {personImage && (
                <Check className="w-4 h-4 text-green-500" />
              )}
            </CardTitle>
            <CardDescription>
              Upload a clear photo of the person who will wear the glasses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUploadButton
              onImageSelect={onPersonImageSelect}
              disabled={disabled || loading}
              maxSizeMB={10}
            />
            {personImage && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-700">Photo uploaded</p>
                    <p className="text-xs text-green-600 mt-1">{personImage.file.name}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Glasses Photo Upload */}
        <Card className={glassesImage ? 'border-blue-500/50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Glasses className="w-5 h-5" />
              Glasses Photo
              {glassesImage && (
                <Check className="w-4 h-4 text-blue-500" />
              )}
            </CardTitle>
            <CardDescription>
              Upload a photo of the glasses you want to add
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUploadButton
              onImageSelect={onGlassesImageSelect}
              disabled={disabled || loading}
              maxSizeMB={10}
            />
            {glassesImage && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-700">Glasses uploaded</p>
                    <p className="text-xs text-blue-600 mt-1">{glassesImage.file.name}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quality Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quality Setting</CardTitle>
          <CardDescription>
            Choose the output quality for the composited image
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {(['draft', 'standard', 'high'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                disabled={disabled || loading}
                className={`
                  p-4 rounded-lg border-2 text-left transition-all
                  ${quality === q
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                  }
                  ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{q}</span>
                    {quality === q && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {qualityDescriptions[q]}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compose Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Status Messages */}
            {!personImage && !glassesImage && (
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Upload both images to get started</p>
                  <p className="text-muted-foreground mt-1">
                    Upload a person photo and glasses photo to create a photorealistic composition
                  </p>
                </div>
              </div>
            )}

            {personImage && !glassesImage && (
              <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-700">Almost there!</p>
                  <p className="text-blue-600 mt-1">
                    Now upload a photo of glasses to complete the setup
                  </p>
                </div>
              </div>
            )}

            {/* Compose Button */}
            <Button
              onClick={() => onCompose()}
              disabled={!canCompose}
              size="lg"
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Glasses className="w-5 h-5 mr-2 animate-pulse" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Compose Glasses
                </>
              )}
            </Button>

            {/* Info */}
            {canCompose && (
              <div className="text-center text-sm text-muted-foreground">
                Estimated cost: ~${qualityDescriptions[quality].split('~$')[1]} •
                Quality: <Badge variant="secondary" className="ml-1">{quality}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tips for Best Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Use high-resolution photos (at least 1024x1024 pixels)</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Ensure the person's face is clearly visible and well-lit</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Choose glasses photos with good lighting and minimal glare</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Front-facing photos work best for accurate positioning</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
