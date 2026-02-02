/**
 * Glasses Compositor Page
 * Main page for photorealistic glasses compositing tool
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadSection } from '@/components/glasses/UploadSection';
import { ResultDisplay } from '@/components/glasses/ResultDisplay';
import { Glasses, Sparkles } from 'lucide-react';
import {
  CompositingJob,
  GlassesCompositorState
} from '@/types/glassesTypes';

export default function GlassesCompositorPage() {
  const [state, setState] = useState<GlassesCompositorState>({
    personImage: null,
    glassesImage: null,
    currentJob: null,
    quality: 'standard',
    loading: false,
    error: null
  });

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Poll job status
  const startPolling = useCallback((jobId: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch('/api/glasses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status', jobId })
        });

        const data = await response.json();

        if (data.success && data.job) {
          setState(prev => ({ ...prev, currentJob: data.job }));

          // Stop polling if job is complete or failed
          if (data.job.status === 'complete' || data.job.status === 'failed') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            setState(prev => ({ ...prev, loading: false }));
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to check job status',
          loading: false
        }));
      }
    }, 2000); // Poll every 2 seconds
  }, []);

  const handlePersonImageSelect = useCallback((image: { url: string; base64: string; file: File }) => {
    setState(prev => ({
      ...prev,
      personImage: image,
      error: null,
      currentJob: null
    }));
  }, []);

  const handleGlassesImageSelect = useCallback((image: { url: string; base64: string; file: File }) => {
    setState(prev => ({
      ...prev,
      glassesImage: image,
      error: null,
      currentJob: null
    }));
  }, []);

  const handleCompose = useCallback(async () => {
    if (!state.personImage || !state.glassesImage) {
      setState(prev => ({
        ...prev,
        error: 'Please upload both a person photo and glasses photo'
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      currentJob: null
    }));

    try {
      const response = await fetch('/api/glasses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compose',
          personImage: state.personImage.base64,
          glassesImage: state.glassesImage.base64,
          quality: state.quality
        })
      });

      const data = await response.json();

      if (data.success && data.jobId) {
        // Start polling for job status
        startPolling(data.jobId);
      } else {
        throw new Error(data.error || 'Failed to start compositing job');
      }
    } catch (error) {
      console.error('Error starting compositing:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start compositing',
        loading: false
      }));
    }
  }, [state.personImage, state.glassesImage, state.quality, startPolling]);

  const handleReset = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    setState({
      personImage: null,
      glassesImage: null,
      currentJob: null,
      quality: 'standard',
      loading: false,
      error: null
    });
  }, []);

  const handleDownload = useCallback((format: 'png' | 'jpg') => {
    console.log(`Downloading result as ${format}`);
    // Download is handled by the ResultDisplay component
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Glasses className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Glasses Compositor</h1>
            <p className="text-muted-foreground">Photorealistic glasses compositing while preserving your original photos</p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <Card className="mb-6 border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-medium text-destructive">Error</h4>
                <p className="text-sm text-destructive/80 mt-1">{state.error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Upload */}
        <div className="space-y-6">
          <UploadSection
            onPersonImageSelect={handlePersonImageSelect}
            onGlassesImageSelect={handleGlassesImageSelect}
            onCompose={handleCompose}
            disabled={state.loading}
            personImage={state.personImage}
            glassesImage={state.glassesImage}
            loading={state.loading}
          />
        </div>

        {/* Right Column - Results */}
        <div>
          <ResultDisplay
            job={state.currentJob}
            onDownload={handleDownload}
            onReset={handleReset}
            loading={state.loading && !state.currentJob}
          />
        </div>
      </div>

      {/* Info Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>About This Tool</CardTitle>
          <CardDescription>
            Create photorealistic images of anyone wearing any glasses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-medium mb-2">How It Works</h4>
              <p className="text-muted-foreground">
                Our AI analyzes both images to understand face shape, glasses dimensions, lighting,
                and camera angle, then composites them while preserving the original photo.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Cost Effective</h4>
              <p className="text-muted-foreground">
                At $0.01-0.02 per composition, this is 70%+ cheaper than traditional image generation
                services while delivering superior results.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Privacy First</h4>
              <p className="text-muted-foreground">
                Images are processed securely and never stored. Your original photos remain completely
                unchanged - only the composited result is generated.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
