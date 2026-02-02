export interface UploadedFile {
  id: string;
  name: string;
  type: 'subject' | 'glasses';
  url: string;
  size: number;
  width?: number;
  height?: number;
}

export interface GenerationParams {
  guidance: number;
  refStrength: number;
  lightingWeight: number;
  reflectionWeight: number;
  colorMatchWeight: number;
  seed: number;
}

export interface Task {
  id: string;
  jobId: string;
  subjectFile: UploadedFile;
  glassesFiles: UploadedFile[];
  status: 'queued' | 'running' | 'verifying' | 'completed' | 'failed';
  progress: number;
  params?: GenerationParams;
  result?: {
    imageUrl: string;
    reportUrl: string;
    editReport: EditReport;
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id: string;
  tasks: Task[];
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
}

export interface EditReport {
  taskId: string;
  version: {
    app: string;
    promptPack: string;
    model: string;
    providerApi: string;
  };
  inputs: {
    subject: { assetId: string; w: number; h: number };
    glasses: string[];
  };
  generation: {
    seed: number;
    passes: number;
    guidance: number;
    refStrength: number;
    lightingWeight: number;
    reflectionWeight: number;
  };
  quality: {
    ssim: number;
    faceDist: number;
    fit: 'pass' | 'fail';
  };
  notes: string;
}

export interface GlassesSize {
  lensWidth: string;
  bridge: string;
  temple: string;
  faceWidth: string;
}

export interface ExactSizing {
  model: string;
  frame: string;
  lensWidth: string;
  lensHeight: string;
  bridge: string;
  temple: string;
  frameWidth: string;
  effectiveDiameter?: string;
}

export interface SizingInfo {
  brand: string;
  sizeChartUrl: string;
  exact?: ExactSizing;
  sizes: {
    small: GlassesSize;
    medium: GlassesSize;
    large: GlassesSize;
  };
  fittingGuide: string;
}

export interface ProjectResult {
  taskId: string;
  jobId: string;
  subjectFile: UploadedFile;
  glassesFiles: UploadedFile[];
  imageUrl: string;
  editReport: EditReport;
  params: GenerationParams;
  completedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  glassesFiles: UploadedFile[];
  createdAt: Date;
  updatedAt: Date;
  sizingInfo?: SizingInfo;
  results?: ProjectResult[];
}