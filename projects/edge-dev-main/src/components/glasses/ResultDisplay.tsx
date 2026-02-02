/**
 * Result Display Component
 * Shows composited image result with download functionality
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Image as ImageIcon,
  Clock,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { CompositingJob } from '@/types/glassesTypes';

interface ResultDisplayProps {
  job: CompositingJob | null;
  onDownload?: (format: 'png' | 'jpg') => void;
  onReset?: () => void;
  loading?: boolean;
}

export function ResultDisplay({
  job,
  onDownload,
  onReset,
  loading = false
}: ResultDisplayProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset image loaded state when job changes
  useEffect(() => {
    if (job?.status === 'complete') {
      setImageLoaded(false);
    }
  }, [job?.id]);

  if (!job && !loading) {
    return null;
  }

  const getStatusIcon = () => {
    if (!job) return null;

    switch (job.status) {
      case 'queued':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'analyzing':
      case 'compositing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (!job) return 'Initializing...';

    switch (job.status) {
      case 'queued':
        return 'Queued for processing';
      case 'analyzing':
        return 'Analyzing images...';
      case 'compositing':
        return 'Compositing glasses onto photo...';
      case 'complete':
        return 'Composition complete!';
      case 'failed':
        return job.error || 'Processing failed';
      default:
        return 'Processing...';
    }
  };

  const getStatusBadge = () => {
    if (!job) return null;

    const variants: Record<string, any> = {
      queued: 'secondary',
      analyzing: 'default',
      compositing: 'default',
      complete: 'default',
      failed: 'destructive'
    };

    return (
      <Badge variant={variants[job.status] || 'secondary'} className="ml-2">
        {job.status}
      </Badge>
    );
  };

  const handleDownload = (format: 'png' | 'jpg') => {
    if (!job?.result?.base64) return;

    // Create download link
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${job.result.base64}`;
    link.download = `glasses-composition-${job.id}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onDownload?.(format);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Result
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          {getStatusText()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress Bar */}
          {job && (job.status === 'queued' || job.status === 'analyzing' || job.status === 'compositing') && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">{job.progress}%</span>
              </div>
              <Progress value={job.progress} className="h-2" />
            </div>
          )}

          {/* Analysis Details */}
          {job && (job.status === 'analyzing' || job.status === 'compositing' || job.status === 'complete') && (
            <div className="grid md:grid-cols-2 gap-4">
              {job.faceAnalysis && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Face Analysis
                  </h4>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p>Shape: <span className="font-medium text-foreground capitalize">{job.faceAnalysis.faceShape}</span></p>
                    <p>Lighting: <span className="font-medium text-foreground">{job.faceAnalysis.lightingDirection}</span></p>
                    <p>Angle: <span className="font-medium text-foreground">{job.faceAnalysis.cameraAngle}</span></p>
                  </div>
                </div>
              )}

              {job.glassesAnalysis && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Glasses Analysis
                  </h4>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p>Type: <span className="font-medium text-foreground capitalize">{job.glassesAnalysis.frameType}</span></p>
                    <p>Color: <span className="font-medium text-foreground">{job.glassesAnalysis.frameColor}</span></p>
                    <p>Lens: <span className="font-medium text-foreground capitalize">{job.glassesAnalysis.lensType}</span></p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Result Image */}
          {job?.status === 'complete' && job.result ? (
            <div className="space-y-4">
              <div className="relative aspect-video max-h-96 w-full overflow-hidden rounded-lg bg-muted">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                )}
                <img
                  src={job.result.imageUrl}
                  alt="Composited result"
                  className={`w-full h-full object-contain transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleDownload('png')}
                  className="gap-2"
                  disabled={!imageLoaded}
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </Button>
                <Button
                  onClick={() => handleDownload('jpg')}
                  variant="outline"
                  className="gap-2"
                  disabled={!imageLoaded}
                >
                  <Download className="w-4 h-4" />
                  Download JPG
                </Button>
                <Button
                  onClick={onReset}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Start Over
                </Button>
              </div>

              {/* Cost Info */}
              {job.cost > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  <span>Cost: ${job.cost.toFixed(4)}</span>
                </div>
              )}
            </div>
          ) : job?.status === 'failed' ? (
            /* Error State */
            <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium text-destructive">Processing Failed</h4>
                  <p className="text-sm text-destructive/80">{job.error}</p>
                  <Button
                    onClick={onReset}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          ) : loading || !job ? (
            /* Loading State */
            <div className="p-12 text-center">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Initializing...</p>
            </div>
          ) : (
            /* Processing State */
            <div className="p-12 text-center">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Processing your images...</p>
              <p className="text-xs text-muted-foreground mt-2">This may take a moment</p>
            </div>
          )}

          {/* Processing Info */}
          {job && job.status !== 'complete' && job.status !== 'failed' && (
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Processing in progress</p>
                <p className="mt-1">
                  Please wait while we analyze your images and create the composition.
                  Large images may take longer to process.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
