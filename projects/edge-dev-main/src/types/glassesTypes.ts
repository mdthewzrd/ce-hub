/**
 * TypeScript interfaces for Glasses Compositor System
 *
 * Following projectTypes.ts patterns for consistency across the codebase.
 * Enables photorealistic glasses compositing while preserving original photos.
 */

// Core request/response types
export interface GlassesCompositorRequest {
  personImage: string;  // base64 or URL
  glassesImage: string;
  quality?: 'draft' | 'standard' | 'high';
}

export interface FaceAnalysis {
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'diamond' | 'oblong' | 'unknown';
  faceCenters: Array<{
    x: number;
    y: number;
    confidence: number;
  }>;
  eyeLevel: number;
  faceWidth: number;
  faceHeight: number;
  lightingDirection: string;
  lightingIntensity: number;
  cameraAngle: string;
  skinTone?: string;
  hairColor?: string;
  backgroundDescription: string;
}

export interface GlassesAnalysis {
  frameType: 'full-rim' | 'half-rim' | 'rimless' | 'wayfarer' | 'aviator' | 'cat-eye' | 'round' | 'square' | 'rectangular' | 'unknown';
  frameColor: string;
  frameMaterial?: string;
  lensType: 'clear' | 'tinted' | 'polarized' | 'photochromic' | 'progressive' | 'bifocal' | 'unknown';
  lensColor?: string;
  frameWidth: number;
  frameHeight: number;
  bridgeWidth: number;
  templeLength: number;
  description: string;
  hasReflection: boolean;
}

export interface CompositingInstructions {
  glassesPosition: {
    x: number;
    y: number;
    rotation: number;
    scale: number;
  };
  blendingMode: string;
  opacity: number;
  shadowIntensity: number;
  reflectionColor?: string;
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
}

export interface CompositingJob {
  id: string;
  status: 'queued' | 'analyzing' | 'compositing' | 'complete' | 'failed';
  progress: number;
  faceAnalysis?: FaceAnalysis;
  glassesAnalysis?: GlassesAnalysis;
  instructions?: CompositingInstructions;
  result?: {
    imageUrl: string;
    base64: string;
    thumbnailUrl?: string;
  };
  cost: number;
  estimatedCost?: number;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// API request/response types
export interface ComposeGlassesRequest extends GlassesCompositorRequest {
  quality?: 'draft' | 'standard' | 'high';
}

export interface ComposeGlassesResponse {
  success: boolean;
  jobId: string;
  estimatedTime?: number;
  error?: string;
}

export interface JobStatusResponse {
  success: boolean;
  job: CompositingJob | null;
}

export interface JobListResponse {
  success: boolean;
  jobs: CompositingJob[];
}

// Component props interfaces
export interface GlassesCompositorProps {
  onComposeStart?: (jobId: string) => void;
  onComposeComplete?: (job: CompositingJob) => void;
  onError?: (error: string) => void;
}

export interface UploadSectionProps {
  onPersonImageSelect: (image: { url: string; base64: string; file: File }) => void;
  onGlassesImageSelect: (image: { url: string; base64: string; file: File }) => void;
  disabled?: boolean;
  personImage?: { url: string; base64: string; file: File } | null;
  glassesImage?: { url: string; base64: string; file: File } | null;
}

export interface ResultDisplayProps {
  job: CompositingJob | null;
  onDownload?: (format: 'png' | 'jpg') => void;
  onReset?: () => void;
  loading?: boolean;
}

// Error handling
export interface GlassesCompositorError {
  code: 'INVALID_IMAGE' | 'ANALYSIS_FAILED' | 'COMPOSITING_FAILED' | 'API_ERROR' | 'NETWORK_ERROR';
  message: string;
  details?: string;
  timestamp: Date;
}

// Quality presets
export interface QualityPreset {
  name: 'draft' | 'standard' | 'high';
  description: string;
  maxResolution: number;
  analysisDetail: 'low' | 'medium' | 'high';
  compositingPasses: number;
  estimatedCost: number;
}

export const QUALITY_PRESETS: Record<string, QualityPreset> = {
  draft: {
    name: 'draft',
    description: 'Fast preview quality (512px max)',
    maxResolution: 512,
    analysisDetail: 'low',
    compositingPasses: 1,
    estimatedCost: 0.005
  },
  standard: {
    name: 'standard',
    description: 'Good quality for most uses (1024px max)',
    maxResolution: 1024,
    analysisDetail: 'medium',
    compositingPasses: 2,
    estimatedCost: 0.01
  },
  high: {
    name: 'high',
    description: 'Best quality with detailed analysis (2048px max)',
    maxResolution: 2048,
    analysisDetail: 'high',
    compositingPasses: 3,
    estimatedCost: 0.02
  }
};

// Validation types
export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  imageInfo?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

export interface CompositingValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  confidence: number;
}

// Analytics and tracking
export interface CompositingMetrics {
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
  totalCost: number;
  averageQuality: string;
}

// UI state management
export interface GlassesCompositorState {
  personImage: { url: string; base64: string; file: File } | null;
  glassesImage: { url: string; base64: string; file: File } | null;
  currentJob: CompositingJob | null;
  quality: 'draft' | 'standard' | 'high';
  loading: boolean;
  error: string | null;
  pollInterval?: NodeJS.Timeout;
}

// Export all types as a grouped type for convenience
export type GlassesCompositorTypes = {
  Request: GlassesCompositorRequest;
  FaceAnalysis: FaceAnalysis;
  GlassesAnalysis: GlassesAnalysis;
  CompositingJob: CompositingJob;
  Error: GlassesCompositorError;
  State: GlassesCompositorState;
};
