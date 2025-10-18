import { handleVerifyToken } from './routes/verify.js';
import { handleRefreshToken } from './routes/refresh.js';
import { handleHealthCheck } from './routes/health.js';
import { generateRequestId, getSecurityHeaders, isOriginAllowed } from './utils/security.js';
import { createOptionsResponse, addCorsHeaders, createJsonResponse } from './utils/responses.js';
import { adaptiveRateLimiter } from './middleware/rateLimiting.js';
import { logInfo, logError, logWarning } from './utils/errors.js';

// Main edge function handler
export default async function handler(request: Request): Promise<Response> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // Extract request info for logging
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const origin = request.headers.get('origin') || '';
    const userAgent = request.headers.get('user-agent') || '';

    // Log incoming request
    logInfo('Request received', {
      requestId,
      method,
      path,
      origin,
      userAgent: userAgent.substring(0, 100), // Truncate for logging
    });

    // Handle CORS preflight requests
    if (method === 'OPTIONS') {
      logInfo('CORS preflight request', { requestId, origin });
      return createOptionsResponse(origin);
    }

    // Validate origin for non-preflight requests
    if (origin && !isOriginAllowed(origin)) {
      logWarning('Origin not allowed', { requestId, origin });
      const response = createJsonResponse(
        {
          error: {
            code: 'ORIGIN_NOT_ALLOWED',
            message: 'Origin not allowed',
            timestamp: new Date().toISOString(),
            requestId,
          },
        },
        403
      );
      return addCorsHeaders(response, origin);
    }

    // Apply rate limiting
    const rateLimitResponse = adaptiveRateLimiter.checkRequest(request);
    if (rateLimitResponse) {
      logWarning('Rate limit exceeded', {
        requestId,
        path,
        userAgent,
        origin,
      });
      return addCorsHeaders(rateLimitResponse, origin);
    }

    // Route to appropriate handler
    let response: Response;

    switch (path) {
      case '/verify':
        response = await handleVerifyToken(request, requestId);
        break;

      case '/refresh':
        response = await handleRefreshToken(request, requestId);
        break;

      case '/health':
        response = await handleHealthCheck(request, requestId);
        break;

      default:
        logWarning('Route not found', { requestId, path, method });
        response = createJsonResponse(
          {
            error: {
              code: 'NOT_FOUND',
              message: `Route ${path} not found`,
              timestamp: new Date().toISOString(),
              requestId,
            },
          },
          404
        );
        break;
    }

    // Add security headers
    const securityHeaders = getSecurityHeaders();
    for (const [key, value] of Object.entries(securityHeaders)) {
      response.headers.set(key, value);
    }

    // Add CORS headers
    response = addCorsHeaders(response, origin);

    // Add request ID to response headers
    response.headers.set('X-Request-ID', requestId);

    // Log successful response
    const duration = Date.now() - startTime;
    logInfo('Request completed', {
      requestId,
      method,
      path,
      status: response.status,
      duration,
    });

    return response;

  } catch (error) {
    // Log unexpected errors
    logError(error as Error, {
      requestId,
      endpoint: 'main_handler',
      duration: Date.now() - startTime,
    });

    // Create error response
    const errorResponse = createJsonResponse(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred',
          timestamp: new Date().toISOString(),
          requestId,
        },
      },
      500
    );

    // Add security headers
    const securityHeaders = getSecurityHeaders();
    for (const [key, value] of Object.entries(securityHeaders)) {
      errorResponse.headers.set(key, value);
    }

    // Add CORS headers if origin is provided
    const origin = request.headers.get('origin');
    if (origin) {
      addCorsHeaders(errorResponse, origin);
    }

    errorResponse.headers.set('X-Request-ID', requestId);

    return errorResponse;
  }
}

// Edge function configuration for Vercel
export const config = {
  runtime: 'edge',
  regions: ['iad1', 'sfo1'], // East and West coast for better global coverage
};

// Health check and startup validation
async function validateStartup(): Promise<void> {
  const { validateEnvironment } = await import('./utils/security.js');
  const { testSupabaseConnection } = await import('./supabase.js');

  // Validate environment on startup
  const envValidation = validateEnvironment();
  if (!envValidation.valid) {
    console.error('Environment validation failed:', envValidation.errors);
    throw new Error('Invalid environment configuration');
  }

  // Test Supabase connection on startup
  const supabaseTest = await testSupabaseConnection();
  if (!supabaseTest.healthy) {
    console.error('Supabase connection failed:', supabaseTest.error);
    throw new Error('Supabase connection failed');
  }

  console.log('Auth Edge Function startup validation successful');
}

// Run startup validation (will be executed when the edge function is deployed)
if (typeof globalThis !== 'undefined') {
  validateStartup().catch((error) => {
    console.error('Startup validation failed:', error);
  });
}