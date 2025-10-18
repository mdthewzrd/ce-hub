export class AuthEdgeError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public expose: boolean = false
  ) {
    super(message);
    this.name = 'AuthEdgeError';
  }
}

export class ValidationError extends AuthEdgeError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400, true);
    this.name = 'ValidationError';
    if (field) {
      this.message = `${field}: ${message}`;
    }
  }
}

export class AuthenticationError extends AuthEdgeError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401, true);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AuthEdgeError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403, true);
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends AuthEdgeError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR', 429, true);
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends AuthEdgeError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 'SERVICE_UNAVAILABLE', 503, true);
    this.name = 'ServiceUnavailableError';
  }
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    timestamp: string;
    requestId: string;
  };
}

export function createErrorResponse(
  error: Error,
  requestId: string
): { response: ErrorResponse; statusCode: number } {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An internal error occurred';

  if (error instanceof AuthEdgeError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.expose ? error.message : 'An error occurred';
  } else {
    // Log internal errors but don't expose details
    console.error('Internal error:', {
      message: error.message,
      stack: error.stack,
      requestId,
    });
  }

  return {
    response: {
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        requestId,
      },
    },
    statusCode,
  };
}

export function logError(error: Error, context: Record<string, any> = {}): void {
  const logData: any = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: error.message,
    name: error.name,
    stack: error.stack,
    ...context,
  };

  if (error instanceof AuthEdgeError) {
    logData.code = error.code;
    logData.statusCode = error.statusCode;
    logData.expose = error.expose;
  }

  console.error(JSON.stringify(logData));
}

export function logWarning(message: string, context: Record<string, any> = {}): void {
  const logData = {
    timestamp: new Date().toISOString(),
    level: 'warning',
    message,
    ...context,
  };

  console.warn(JSON.stringify(logData));
}

export function logInfo(message: string, context: Record<string, any> = {}): void {
  const logData = {
    timestamp: new Date().toISOString(),
    level: 'info',
    message,
    ...context,
  };

  console.log(JSON.stringify(logData));
}