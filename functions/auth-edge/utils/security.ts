import { z } from 'zod';
import { ValidationError } from './errors.js';

// Request validation schemas
export const TokenVerificationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  options: z.object({
    checkExpiry: z.boolean().optional().default(true),
    requireRole: z.string().optional(),
    requirePermissions: z.array(z.string()).optional(),
  }).optional().default({}),
});

export const TokenRefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type TokenVerificationRequest = z.infer<typeof TokenVerificationSchema>;
export type TokenRefreshRequest = z.infer<typeof TokenRefreshSchema>;

// Request ID generation
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Extract authorization token from request
export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

// Validate and parse request body
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        firstError.message,
        firstError.path.join('.')
      );
    }
    throw new ValidationError('Invalid JSON body');
  }
}

// Sanitize sensitive data for logging
export function sanitizeForLogging(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveKeys = [
    'token',
    'refreshToken',
    'access_token',
    'refresh_token',
    'password',
    'secret',
    'key',
    'authorization',
    'x-api-key',
  ];

  const sanitized = { ...data };

  function redactValue(obj: any, path: string[] = []): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item, index) => redactValue(item, [...path, index.toString()]));
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key];
      const keyLower = key.toLowerCase();

      if (sensitiveKeys.some(sk => keyLower.includes(sk))) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = redactValue(value, currentPath);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  return redactValue(sanitized);
}

// CORS validation
export function isOriginAllowed(origin: string): boolean {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

  // Allow localhost in development
  if (process.env.NODE_ENV === 'development') {
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return true;
    }
  }

  return allowedOrigins.includes(origin) || allowedOrigins.includes('*');
}

// Rate limiting key generation
export function getRateLimitKey(request: Request, identifier?: string): string {
  if (identifier) {
    return `auth_edge:${identifier}`;
  }

  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const connectingIp = request.headers.get('cf-connecting-ip');

  const ip = forwarded?.split(',')[0]?.trim() || realIp || connectingIp || 'unknown';

  return `auth_edge:ip:${ip}`;
}

// Security headers for responses
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

// Validate environment configuration
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Validate URL format
  if (process.env.SUPABASE_URL) {
    try {
      new URL(process.env.SUPABASE_URL);
    } catch {
      errors.push('SUPABASE_URL is not a valid URL');
    }
  }

  // Validate ALLOWED_ORIGINS format
  if (process.env.ALLOWED_ORIGINS) {
    const origins = process.env.ALLOWED_ORIGINS.split(',');
    for (const origin of origins) {
      if (origin.trim() !== '*') {
        try {
          new URL(origin.trim());
        } catch {
          errors.push(`Invalid origin in ALLOWED_ORIGINS: ${origin}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// User role and permission validation
export interface UserContext {
  id: string;
  email?: string;
  role?: string;
  permissions?: string[];
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
}

export function hasRequiredRole(user: UserContext, requiredRole: string): boolean {
  if (!user.role) {
    return false;
  }

  // Role hierarchy (higher roles include lower ones)
  const roleHierarchy = ['user', 'moderator', 'admin', 'super_admin'];
  const userRoleIndex = roleHierarchy.indexOf(user.role);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

  return userRoleIndex >= requiredRoleIndex;
}

export function hasRequiredPermissions(
  user: UserContext,
  requiredPermissions: string[]
): boolean {
  if (!user.permissions || requiredPermissions.length === 0) {
    return requiredPermissions.length === 0;
  }

  return requiredPermissions.every(permission =>
    user.permissions!.includes(permission)
  );
}

// Token expiry validation
export function isTokenExpired(exp: number): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  return exp <= currentTime;
}

// JWT claims validation
export function validateJwtClaims(payload: any): {
  valid: boolean;
  user?: UserContext;
  error?: string;
} {
  try {
    // Validate required claims
    if (!payload.sub) {
      return { valid: false, error: 'Missing subject claim' };
    }

    if (!payload.aud || !payload.aud.includes('authenticated')) {
      return { valid: false, error: 'Invalid audience claim' };
    }

    if (!payload.iss) {
      return { valid: false, error: 'Missing issuer claim' };
    }

    // Check expiry
    if (payload.exp && isTokenExpired(payload.exp)) {
      return { valid: false, error: 'Token has expired' };
    }

    // Extract user context
    const user: UserContext = {
      id: payload.sub,
      email: payload.email,
      role: payload.role || payload.app_metadata?.role,
      permissions: payload.app_metadata?.permissions || [],
      app_metadata: payload.app_metadata || {},
      user_metadata: payload.user_metadata || {},
    };

    return { valid: true, user };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid token claims',
    };
  }
}