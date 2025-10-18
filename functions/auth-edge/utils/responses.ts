export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
  requestId: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    timestamp: string;
    requestId: string;
  };
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

export function createSuccessResponse<T>(
  data: T,
  requestId: string
): { response: SuccessResponse<T>; statusCode: number } {
  return {
    response: {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestId,
    },
    statusCode: 200,
  };
}

export function createCreatedResponse<T>(
  data: T,
  requestId: string
): { response: SuccessResponse<T>; statusCode: number } {
  return {
    response: {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestId,
    },
    statusCode: 201,
  };
}

export function createNoContentResponse(
  requestId: string
): { response: SuccessResponse<null>; statusCode: number } {
  return {
    response: {
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
      requestId,
    },
    statusCode: 204,
  };
}

export function createJsonResponse(
  data: any,
  statusCode: number = 200,
  headers: Record<string, string> = {}
): Response {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...headers,
  };

  return new Response(JSON.stringify(data, null, 2), {
    status: statusCode,
    headers: defaultHeaders,
  });
}

export function createCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
  const defaultOrigin = allowedOrigins[0] || '*';

  const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : defaultOrigin;

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function createOptionsResponse(origin?: string): Response {
  return new Response(null, {
    status: 204,
    headers: createCorsHeaders(origin),
  });
}

export function addCorsHeaders(response: Response, origin?: string): Response {
  const corsHeaders = createCorsHeaders(origin);

  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

export function createHealthResponse(data: {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
  services: Record<string, any>;
  uptime: number;
}): Response {
  const statusCode = data.status === 'healthy' ? 200 : 503;

  return createJsonResponse(data, statusCode, {
    'Cache-Control': 'no-cache',
  });
}

export function createRateLimitResponse(
  limit: number,
  windowMs: number,
  retryAfter: number
): Response {
  return createJsonResponse(
    {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded. Maximum ${limit} requests per ${windowMs / 1000} seconds.`,
        retryAfter,
      },
    },
    429,
    {
      'Retry-After': retryAfter.toString(),
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Window': windowMs.toString(),
    }
  );
}

// Common response templates
export const ResponseTemplates = {
  // Authentication
  invalidToken: (requestId: string) => ({
    response: {
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token',
        timestamp: new Date().toISOString(),
        requestId,
      },
    } as ErrorResponse,
    statusCode: 401,
  }),

  tokenExpired: (requestId: string) => ({
    response: {
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
        timestamp: new Date().toISOString(),
        requestId,
      },
    } as ErrorResponse,
    statusCode: 401,
  }),

  // Validation
  missingToken: (requestId: string) => ({
    response: {
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Authentication token is required',
        timestamp: new Date().toISOString(),
        requestId,
      },
    } as ErrorResponse,
    statusCode: 400,
  }),

  invalidRequest: (requestId: string, details?: string) => ({
    response: {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: details || 'Invalid request format',
        timestamp: new Date().toISOString(),
        requestId,
      },
    } as ErrorResponse,
    statusCode: 400,
  }),

  // Service
  serviceUnavailable: (requestId: string) => ({
    response: {
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Authentication service is temporarily unavailable',
        timestamp: new Date().toISOString(),
        requestId,
      },
    } as ErrorResponse,
    statusCode: 503,
  }),

  methodNotAllowed: (requestId: string, method: string) => ({
    response: {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `HTTP method ${method} is not allowed for this endpoint`,
        timestamp: new Date().toISOString(),
        requestId,
      },
    } as ErrorResponse,
    statusCode: 405,
  }),
};