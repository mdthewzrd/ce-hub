/**
 * Health Check API Route
 *
 * Provides system health status and metrics
 */

import { NextRequest, NextResponse } from 'next/server';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    frontend: boolean;
    backend: boolean;
    edgedev?: boolean;
  };
  metrics: {
    memory?: NodeJS.MemoryUsage;
    platform: string;
  };
}

const START_TIME = Date.now();

async function checkBackendHealth(): Promise<boolean> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7447';
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkEdgeDevHealth(): Promise<boolean> {
  try {
    const edgedevUrl = process.env.NEXT_PUBLIC_EDGEDEV_URL || 'http://localhost:5665';
    const response = await fetch(`${edgedevUrl}/`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Check service health
  const [backendHealthy, edgedevHealthy] = await Promise.all([
    checkBackendHealth(),
    checkEdgeDevHealth().catch(() => false), // EdgeDev is optional
  ]);

  // Determine overall health status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (!backendHealthy) {
    status = 'degraded';
  }

  const healthData: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    uptime: Date.now() - START_TIME,
    version: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
    services: {
      frontend: true,
      backend: backendHealthy,
      edgedev: edgedevHealthy,
    },
    metrics: {
      memory: process.memoryUsage(),
      platform: process.platform,
    },
  };

  const responseTime = Date.now() - startTime;

  return NextResponse.json(healthData, {
    status: status === 'healthy' ? 200 : 503,
    headers: {
      'X-Response-Time': responseTime.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

export const dynamic = 'force-dynamic';
