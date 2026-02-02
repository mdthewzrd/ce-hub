import { NextRequest, NextResponse } from 'next/server';

// Progress tracking for Renata operations
interface ProgressState {
  isActive: boolean;
  progress: number;
  message: string;
  currentTask: string;
  error?: string;
  startTime?: number;
  lastUpdate?: number;
}

let progressState: ProgressState = {
  isActive: false,
  progress: 0,
  message: 'Idle',
  currentTask: 'None'
};

// Get current progress state
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      ...progressState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Progress API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch progress',
      message: 'Progress tracking is currently unavailable'
    }, { status: 500 });
  }
}

// Update progress state
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { isActive, progress, message, currentTask, error } = body;

    progressState = {
      ...progressState,
      isActive: isActive ?? false,
      progress: Math.max(0, Math.min(100, progress ?? 0)),
      message: message || 'Processing...',
      currentTask: currentTask || 'Unknown task',
      error: error || undefined,
      startTime: isActive ? (progressState.startTime || Date.now()) : undefined,
      lastUpdate: Date.now()
    };

    // Auto-clear progress when complete
    if (progress >= 100 && isActive) {
      setTimeout(() => {
        progressState = {
          isActive: false,
          progress: 0,
          message: 'Idle',
          currentTask: 'None'
        };
      }, 5000); // Clear after 5 seconds
    }

    return NextResponse.json({
      success: true,
      ...progressState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Progress Update Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update progress',
      message: 'Progress update failed'
    }, { status: 500 });
  }
}

// Clear progress state
export async function DELETE(request: NextRequest) {
  try {
    progressState = {
      isActive: false,
      progress: 0,
      message: 'Idle',
      currentTask: 'None'
    };

    return NextResponse.json({
      success: true,
      message: 'Progress cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Progress Clear Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to clear progress',
      message: 'Progress clearing failed'
    }, { status: 500 });
  }
}