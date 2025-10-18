import { createHealthResponse } from '../utils/responses.js';
import { validateEnvironment } from '../utils/security.js';
import { testSupabaseConnection } from '../supabase.js';
import { logInfo, logWarning } from '../utils/errors.js';

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
  services: {
    supabase: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    environment: {
      status: 'healthy' | 'unhealthy';
      errors?: string[];
    };
    memory?: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  uptime: number;
}

const startTime = Date.now();

export async function handleHealthCheck(request: Request, requestId: string): Promise<Response> {
  try {
    // Only allow GET method for health checks
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const healthCheck = await performHealthCheck();

    logInfo('Health check performed', {
      requestId,
      status: healthCheck.status,
      uptime: healthCheck.uptime,
    });

    return createHealthResponse(healthCheck);

  } catch (error) {
    logWarning('Health check failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const failedHealthCheck: HealthCheckResponse = {
      status: 'unhealthy',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        supabase: {
          status: 'unhealthy',
          error: 'Health check failed',
        },
        environment: {
          status: 'unhealthy',
          errors: ['Health check execution failed'],
        },
      },
      uptime: Date.now() - startTime,
    };

    return createHealthResponse(failedHealthCheck);
  }
}

async function performHealthCheck(): Promise<HealthCheckResponse> {
  const timestamp = new Date().toISOString();
  const uptime = Date.now() - startTime;

  // Check environment configuration
  const envValidation = validateEnvironment();

  // Check Supabase connection
  const supabaseStart = Date.now();
  const supabaseHealth = await testSupabaseConnection();
  const supabaseResponseTime = Date.now() - supabaseStart;

  // Check memory usage (if available)
  let memoryInfo: HealthCheckResponse['services']['memory'];
  try {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage();
      memoryInfo = {
        used: Math.round(memory.heapUsed / 1024 / 1024),
        total: Math.round(memory.heapTotal / 1024 / 1024),
        percentage: Math.round((memory.heapUsed / memory.heapTotal) * 100),
      };
    }
  } catch {
    // Memory info not available in edge runtime
  }

  // Determine overall health status
  const isHealthy = envValidation.valid && supabaseHealth.healthy;

  const healthResponse: HealthCheckResponse = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    version: process.env.npm_package_version || '1.0.0',
    timestamp,
    services: {
      supabase: {
        status: supabaseHealth.healthy ? 'healthy' : 'unhealthy',
        responseTime: supabaseResponseTime,
        ...(supabaseHealth.error && { error: supabaseHealth.error }),
      },
      environment: {
        status: envValidation.valid ? 'healthy' : 'unhealthy',
        ...(envValidation.errors.length > 0 && { errors: envValidation.errors }),
      },
      ...(memoryInfo && { memory: memoryInfo }),
    },
    uptime,
  };

  return healthResponse;
}

// Simplified health check for internal use
export async function isServiceHealthy(): Promise<boolean> {
  try {
    const health = await performHealthCheck();
    return health.status === 'healthy';
  } catch {
    return false;
  }
}

// Health check middleware for other routes
export function healthCheckMiddleware() {
  return async (request: Request): Promise<Response | null> => {
    // Allow health checks to bypass other middleware
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return null; // Let health check proceed
    }

    // Check service health for other endpoints
    const isHealthy = await isServiceHealthy();
    if (!isHealthy) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Authentication service is temporarily unavailable',
            timestamp: new Date().toISOString(),
          },
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return null; // Service is healthy, proceed
  };
}