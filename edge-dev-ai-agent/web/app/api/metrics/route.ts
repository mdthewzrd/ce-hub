/**
 * Metrics API Route
 *
 * Provides application metrics and analytics data
 */

import { NextRequest, NextResponse } from 'next/server';

interface MetricsData {
  timestamp: string;
  app: {
    name: string;
    version: string;
    environment: string;
  };
  performance: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpuUsage?: NodeJS.CpuUsage;
  };
  endpoints: {
    chat: string;
    scan: string;
    backtest: string;
    health: string;
  };
  features: {
    copilotKit: boolean;
    edgedevIntegration: boolean;
    analytics: boolean;
  };
}

const START_TIME = Date.now();

export async function GET(request: NextRequest) {
  const metricsData: MetricsData = {
    timestamp: new Date().toISOString(),
    app: {
      name: process.env.NEXT_PUBLIC_APP_NAME || 'EdgeDev AI Agent',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',
      environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
    },
    performance: {
      uptime: Date.now() - START_TIME,
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    },
    endpoints: {
      chat: '/api/chat',
      scan: '/api/edgedev/execute',
      backtest: '/api/edgedev/execute',
      health: '/api/health',
    },
    features: {
      copilotKit: true,
      edgedevIntegration: true,
      analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    },
  };

  return NextResponse.json(metricsData, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Metrics-Version': '1.0',
    },
  });
}

export const dynamic = 'force-dynamic';
