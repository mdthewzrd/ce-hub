/**
 * Glasses Compositor Service
 * Photorealistic glasses compositing while preserving original photos
 *
 * Following visionProcessingService.ts singleton pattern
 */

import {
  GlassesCompositorRequest,
  CompositingJob,
  FaceAnalysis,
  GlassesAnalysis,
  CompositingInstructions,
  QUALITY_PRESETS,
  GlassesCompositorError
} from '@/types/glassesTypes';
import { getVisionProcessing } from './visionProcessingService';

class GlassesCompositorService {
  private apiKey: string;
  private apiEndpoint: string;
  private jobs: Map<string, CompositingJob>;
  private maxJobs: number = 100;
  private jobTimeout: number = 300000; // 5 minutes

  constructor() {
    // Initialize with OpenRouter API (supports multiple vision models)
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
    this.jobs = new Map();

    // Clean up old jobs periodically
    setInterval(() => this.cleanupOldJobs(), 60000); // Every minute
  }

  // ========== MAIN COMPOSITION WORKFLOW ==========

  async composeGlasses(request: GlassesCompositorRequest): Promise<string> {
    const jobId = crypto.randomUUID();

    const quality = request.quality || 'standard';
    const preset = QUALITY_PRESETS[quality];

    const job: CompositingJob = {
      id: jobId,
      status: 'queued',
      progress: 0,
      cost: 0,
      estimatedCost: preset.estimatedCost,
      createdAt: new Date()
    };

    this.jobs.set(jobId, job);

    // Start processing asynchronously
    this.processJob(jobId, request).catch(error => {
      console.error(`Job ${jobId} processing error:`, error);
      this.updateJob(jobId, {
        status: 'failed',
        error: error.message || 'Unknown error occurred'
      });
    });

    return jobId;
  }

  private async processJob(jobId: string, request: GlassesCompositorRequest): Promise<void> {
    const quality = request.quality || 'standard';
    const preset = QUALITY_PRESETS[quality];

    try {
      // Update to analyzing
      this.updateJob(jobId, {
        status: 'analyzing',
        progress: 10,
        startedAt: new Date()
      });

      // Step 1: Analyze person's face
      const faceAnalysis = await this.analyzeFace(request.personImage, preset.analysisDetail);
      this.updateJob(jobId, {
        faceAnalysis,
        progress: 40
      });

      // Step 2: Analyze glasses
      const glassesAnalysis = await this.analyzeGlasses(request.glassesImage, preset.analysisDetail);
      this.updateJob(jobId, {
        glassesAnalysis,
        progress: 60
      });

      // Step 3: Generate compositing instructions
      const instructions = this.generateCompositingInstructions(faceAnalysis, glassesAnalysis);
      this.updateJob(jobId, {
        instructions,
        progress: 70
      });

      // Step 4: Compose the image
      this.updateJob(jobId, {
        status: 'compositing',
        progress: 75
      });

      const compositedImage = await this.compositeImage(
        request.personImage,
        request.glassesImage,
        instructions,
        preset
      );

      // Complete
      this.updateJob(jobId, {
        status: 'complete',
        progress: 100,
        result: {
          imageUrl: compositedImage.url,
          base64: compositedImage.base64,
          thumbnailUrl: compositedImage.thumbnailUrl
        },
        cost: preset.estimatedCost,
        completedAt: new Date()
      });

    } catch (error) {
      throw error;
    }
  }

  // ========== ANALYSIS METHODS ==========

  private async analyzeFace(
    personImage: string,
    detail: 'low' | 'medium' | 'high'
  ): Promise<FaceAnalysis> {
    const visionService = getVisionProcessing();

    const prompt = detail === 'high'
      ? `Analyze this person's face in detail for glasses fitting. Provide:
1. Face shape (oval, round, square, heart, diamond, oblong)
2. Face center coordinates (x, y as percentages from top-left)
3. Eye level (y percentage)
4. Face width and height (in pixels)
5. Lighting direction and intensity (0-100)
6. Camera angle (front, slight angle, profile)
7. Skin tone
8. Hair color
9. Background description

Return as JSON with these exact keys.`
      : `Analyze this face for glasses fitting. Provide face shape, eye level, face dimensions, lighting direction, and camera angle. Return as JSON.`;

    const result = await visionService.analyzeImage({
      image_base64: personImage,
      prompt,
      provider: 'claude-3.5-sonnet',
      options: {
        max_tokens: detail === 'high' ? 4096 : 2000,
        detect_ui: false
      }
    });

    if (!result.success || !result.analysis.description) {
      throw new Error('Failed to analyze face');
    }

    return this.parseFaceAnalysis(result.analysis.description);
  }

  private async analyzeGlasses(
    glassesImage: string,
    detail: 'low' | 'medium' | 'high'
  ): Promise<GlassesAnalysis> {
    const visionService = getVisionProcessing();

    const prompt = detail === 'high'
      ? `Analyze these glasses in detail. Provide:
1. Frame type (full-rim, half-rim, rimless, wayfarer, aviator, cat-eye, round, square, rectangular)
2. Frame color (hex code if possible)
3. Frame material
4. Lens type (clear, tinted, polarized, photochromic, progressive, bifocal)
5. Lens color
6. Frame width in pixels
7. Frame height in pixels
8. Bridge width in pixels
9. Temple length in pixels
10. Whether there are reflections on the lenses

Return as JSON with these exact keys.`
      : `Analyze these glasses. Provide frame type, color, lens type, dimensions (width, height), and whether there are reflections. Return as JSON.`;

    const result = await visionService.analyzeImage({
      image_base64: glassesImage,
      prompt,
      provider: 'claude-3.5-sonnet',
      options: {
        max_tokens: detail === 'high' ? 4096 : 2000,
        detect_ui: false
      }
    });

    if (!result.success || !result.analysis.description) {
      throw new Error('Failed to analyze glasses');
    }

    return this.parseGlassesAnalysis(result.analysis.description);
  }

  // ========== COMPOSITION METHODS ==========

  private generateCompositingInstructions(
    faceAnalysis: FaceAnalysis,
    glassesAnalysis: GlassesAnalysis
  ): CompositingInstructions {
    // Calculate optimal glasses position based on face analysis
    const faceCenter = faceAnalysis.faceCenters[0];
    if (!faceCenter) {
      throw new Error('No face center detected');
    }

    // Position glasses at eye level
    const x = faceCenter.x;
    const y = faceAnalysis.eyeLevel;

    // Calculate scale based on face width
    const scale = faceAnalysis.faceWidth / glassesAnalysis.frameWidth * 0.85;

    // Calculate slight rotation based on camera angle
    let rotation = 0;
    if (faceAnalysis.cameraAngle.includes('slight')) {
      rotation = faceAnalysis.cameraAngle.includes('left') ? -5 : 5;
    }

    return {
      glassesPosition: {
        x,
        y,
        rotation,
        scale
      },
      blendingMode: 'normal',
      opacity: 0.95,
      shadowIntensity: Math.min(faceAnalysis.lightingIntensity / 100, 0.3),
      reflectionColor: glassesAnalysis.hasReflection ? '#add8e6' : undefined,
      adjustments: {
        brightness: 0,
        contrast: 0,
        saturation: 0
      }
    };
  }

  private async compositeImage(
    personImage: string,
    glassesImage: string,
    instructions: CompositingInstructions,
    preset: any
  ): Promise<{ url: string; base64: string; thumbnailUrl?: string }> {
    const visionService = getVisionProcessing();

    const prompt = `You are an expert image compositor. Create a photorealistic image by adding glasses to a person's photo.

CRITICAL REQUIREMENTS:
1. PRESERVE the original person and background completely - DO NOT regenerate or change the person
2. DO NOT create a new person or modify facial features
3. ONLY add the glasses on top of the existing photo
4. Match the lighting, shadows, and reflections exactly to the original photo
5. Make the glasses look like they were in the original photo

Compositing Instructions:
- Position: x=${instructions.glassesPosition.x.toFixed(1)}%, y=${instructions.glassesPosition.y.toFixed(1)}%
- Rotation: ${instructions.glassesPosition.rotation}°
- Scale: ${instructions.glassesPosition.scale.toFixed(2)}
- Opacity: ${instructions.opacity}
- Shadow intensity: ${instructions.shadowIntensity.toFixed(2)}
- Brightness adjustment: ${instructions.adjustments.brightness}
- Contrast adjustment: ${instructions.adjustments.contrast}
- Saturation adjustment: ${instructions.adjustments.saturation}

Return ONLY the base64 encoded image data. Start with "data:image/png;base64," followed by the base64 string.
Do not include any explanation or text - only the image data.`;

    // Use vision analysis to get composited image
    const result = await visionService.analyzeImage({
      image_base64: personImage,
      prompt,
      provider: 'claude-3.5-sonnet',
      options: {
        max_tokens: preset.maxResolution >= 2048 ? 4096 : 2000
      }
    });

    if (!result.success || !result.analysis.description) {
      throw new Error('Failed to composite image');
    }

    // Extract base64 image from response
    const base64Data = this.extractBase64FromResponse(result.analysis.description);

    // Create object URL for preview
    const url = `data:image/png;base64,${base64Data}`;

    return {
      url,
      base64: base64Data
    };
  }

  // ========== PARSING HELPERS ==========

  private parseFaceAnalysis(description: string): FaceAnalysis {
    // Try to extract JSON from description
    const jsonMatch = description.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          faceShape: parsed.faceShape || 'unknown',
          faceCenters: parsed.faceCenters || [{ x: 50, y: 40, confidence: 0.8 }],
          eyeLevel: parsed.eyeLevel || 40,
          faceWidth: parsed.faceWidth || 200,
          faceHeight: parsed.faceHeight || 250,
          lightingDirection: parsed.lightingDirection || 'front',
          lightingIntensity: parsed.lightingIntensity || 70,
          cameraAngle: parsed.cameraAngle || 'front',
          skinTone: parsed.skinTone,
          hairColor: parsed.hairColor,
          backgroundDescription: parsed.backgroundDescription || 'unknown'
        };
      } catch (e) {
        console.warn('Failed to parse face analysis JSON, using defaults');
      }
    }

    // Default values if parsing fails
    return {
      faceShape: 'oval',
      faceCenters: [{ x: 50, y: 40, confidence: 0.7 }],
      eyeLevel: 40,
      faceWidth: 200,
      faceHeight: 250,
      lightingDirection: 'front',
      lightingIntensity: 70,
      cameraAngle: 'front',
      backgroundDescription: 'unknown'
    };
  }

  private parseGlassesAnalysis(description: string): GlassesAnalysis {
    // Try to extract JSON from description
    const jsonMatch = description.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          frameType: parsed.frameType || 'unknown',
          frameColor: parsed.frameColor || '#000000',
          frameMaterial: parsed.frameMaterial,
          lensType: parsed.lensType || 'unknown',
          lensColor: parsed.lensColor,
          frameWidth: parsed.frameWidth || 140,
          frameHeight: parsed.frameHeight || 50,
          bridgeWidth: parsed.bridgeWidth || 20,
          templeLength: parsed.templeLength || 140,
          description: description.substring(0, 200),
          hasReflection: parsed.hasReflection || false
        };
      } catch (e) {
        console.warn('Failed to parse glasses analysis JSON, using defaults');
      }
    }

    // Default values if parsing fails
    return {
      frameType: 'full-rim',
      frameColor: '#000000',
      lensType: 'clear',
      frameWidth: 140,
      frameHeight: 50,
      bridgeWidth: 20,
      templeLength: 140,
      description: description.substring(0, 200),
      hasReflection: false
    };
  }

  private extractBase64FromResponse(response: string): string {
    // Look for data:image pattern
    const dataImageMatch = response.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
    if (dataImageMatch) {
      return dataImageMatch[1];
    }

    // Look for just base64 pattern (long alphanumeric strings)
    const base64Match = response.match(/([A-Za-z0-9+/=]{1000,})/);
    if (base64Match) {
      return base64Match[1];
    }

    // If no base64 found, return empty string (will trigger error)
    console.warn('No base64 image data found in response');
    return '';
  }

  // ========== JOB MANAGEMENT ==========

  private updateJob(jobId: string, updates: Partial<CompositingJob>): void {
    const job = this.jobs.get(jobId);
    if (job) {
      this.jobs.set(jobId, { ...job, ...updates });
    }
  }

  async getJobStatus(jobId: string): Promise<CompositingJob | null> {
    return this.jobs.get(jobId) || null;
  }

  async getAllJobs(): Promise<CompositingJob[]> {
    return Array.from(this.jobs.values()).sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (job && (job.status === 'queued' || job.status === 'analyzing' || job.status === 'compositing')) {
      this.updateJob(jobId, {
        status: 'failed',
        error: 'Job cancelled by user',
        completedAt: new Date()
      });
      return true;
    }
    return false;
  }

  private cleanupOldJobs(): void {
    const now = Date.now();
    for (const [jobId, job] of this.jobs.entries()) {
      const jobAge = now - job.createdAt.getTime();
      if (jobAge > this.jobTimeout) {
        this.jobs.delete(jobId);
      }
    }

    // Keep only the most recent jobs if we exceed max
    if (this.jobs.size > this.maxJobs) {
      const sortedJobs = Array.from(this.jobs.entries())
        .sort(([, a], [, b]) => b.createdAt.getTime() - a.createdAt.getTime());

      for (let i = this.maxJobs; i < sortedJobs.length; i++) {
        this.jobs.delete(sortedJobs[i][0]);
      }
    }
  }

  // ========== UTILITY METHODS ==========

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const visionService = getVisionProcessing();
      return await visionService.validateApiKey('claude-3.5-sonnet');
    } catch {
      return false;
    }
  }

  getQualityPresets() {
    return QUALITY_PRESETS;
  }

  getActiveJobCount(): number {
    return Array.from(this.jobs.values()).filter(
      job => job.status === 'queued' || job.status === 'analyzing' || job.status === 'compositing'
    ).length;
  }

  getCompletedJobCount(): number {
    return Array.from(this.jobs.values()).filter(
      job => job.status === 'complete'
    ).length;
  }

  getTotalCost(): number {
    return Array.from(this.jobs.values())
      .filter(job => job.status === 'complete')
      .reduce((sum, job) => sum + (job.cost || 0), 0);
  }

  clearAllJobs(): void {
    this.jobs.clear();
  }
}

// Singleton instance
let instance: GlassesCompositorService | null = null;

export const getGlassesCompositor = (): GlassesCompositorService => {
  if (!instance) {
    instance = new GlassesCompositorService();
  }
  return instance;
};

export type { GlassesCompositorService };
