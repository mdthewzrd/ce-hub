/**
 * Glasses Compositor API
 * Photorealistic glasses compositing endpoint
 *
 * Following /api/vision/route.ts action-based pattern
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGlassesCompositor } from '@/services/glassesCompositorService';

// POST /api/glasses - Handle glasses compositing actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const glassesService = getGlassesCompositor();

    let result;

    switch (action) {
      case 'compose':
        // Compose glasses onto person photo
        if (!data.personImage || !data.glassesImage) {
          return NextResponse.json({
            success: false,
            error: 'Both personImage and glassesImage are required'
          }, { status: 400 });
        }

        const jobId = await glassesService.composeGlasses({
          personImage: data.personImage,
          glassesImage: data.glassesImage,
          quality: data.quality || 'standard'
        });

        result = {
          success: true,
          jobId,
          message: 'Glasses compositing job started'
        };
        break;

      case 'status':
        // Get job status
        if (!data.jobId) {
          return NextResponse.json({
            success: false,
            error: 'jobId is required'
          }, { status: 400 });
        }

        const job = await glassesService.getJobStatus(data.jobId);
        result = {
          success: true,
          job
        };
        break;

      case 'list':
        // List all jobs
        const allJobs = await glassesService.getAllJobs();
        result = {
          success: true,
          jobs: allJobs,
          count: allJobs.length
        };
        break;

      case 'cancel':
        // Cancel a job
        if (!data.jobId) {
          return NextResponse.json({
            success: false,
            error: 'jobId is required'
          }, { status: 400 });
        }

        const cancelled = await glassesService.cancelJob(data.jobId);
        result = {
          success: cancelled,
          message: cancelled ? 'Job cancelled successfully' : 'Job could not be cancelled'
        };
        break;

      case 'validate':
        // Validate API key
        const isValid = await glassesService.validateApiKey();
        result = {
          success: true,
          valid: isValid,
          available: glassesService.isAvailable()
        };
        break;

      case 'presets':
        // Get quality presets
        const presets = glassesService.getQualityPresets();
        result = {
          success: true,
          presets
        };
        break;

      default:
        result = {
          success: false,
          error: `Unknown action: ${action}. Use: compose, status, list, cancel, validate, presets`
        };
        return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Glasses POST API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}

// GET /api/glasses - Get service information
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'info';

    const glassesService = getGlassesCompositor();

    let result;

    switch (action) {
      case 'info':
        // Get service information
        result = {
          success: true,
          available: glassesService.isAvailable(),
          activeJobs: glassesService.getActiveJobCount(),
          completedJobs: glassesService.getCompletedJobCount(),
          totalCost: glassesService.getTotalCost(),
          presets: glassesService.getQualityPresets()
        };
        break;

      case 'stats':
        // Get detailed statistics
        const allJobs = await glassesService.getAllJobs();
        const successfulJobs = allJobs.filter(j => j.status === 'complete');
        const failedJobs = allJobs.filter(j => j.status === 'failed');

        result = {
          success: true,
          statistics: {
            total: allJobs.length,
            queued: allJobs.filter(j => j.status === 'queued').length,
            analyzing: allJobs.filter(j => j.status === 'analyzing').length,
            compositing: allJobs.filter(j => j.status === 'compositing').length,
            complete: successfulJobs.length,
            failed: failedJobs.length,
            successRate: allJobs.length > 0
              ? (successfulJobs.length / allJobs.length * 100).toFixed(1) + '%'
              : 'N/A',
            totalCost: glassesService.getTotalCost(),
            averageCost: successfulJobs.length > 0
              ? (glassesService.getTotalCost() / successfulJobs.length).toFixed(4)
              : 'N/A'
          }
        };
        break;

      default:
        result = {
          success: false,
          error: `Unknown action: ${action}. Use: info, stats`
        };
        return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Glasses GET API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/glasses - Clear all jobs
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    const glassesService = getGlassesCompositor();

    if (action === 'clear') {
      glassesService.clearAllJobs();
      return NextResponse.json({
        success: true,
        message: 'All jobs cleared'
      });
    }

    return NextResponse.json({
      success: false,
      error: `Unknown action: ${action}. Use: clear`
    }, { status: 400 });

  } catch (error) {
    console.error('Glasses DELETE API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
