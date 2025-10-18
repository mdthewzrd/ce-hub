import { logWarning } from '../utils/errors.js';
import { getRateLimitKey } from '../utils/security.js';
import { createRateLimitResponse } from '../utils/responses.js';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for edge function (resets on cold starts)
const rateLimitStore: RateLimitStore = {};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const key in rateLimitStore) {
    if (rateLimitStore[key].resetTime <= now) {
      delete rateLimitStore[key];
    }
  }
}, 60000); // Clean up every minute

export class RateLimiter {
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      keyGenerator: config.keyGenerator || ((req) => getRateLimitKey(req)),
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
      message: config.message || 'Too many requests',
    };
  }

  public check(request: Request): {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const key = this.config.keyGenerator(request);
    const now = Date.now();

    // Get or create rate limit entry
    let entry = rateLimitStore[key];
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
      rateLimitStore[key] = entry;
    }

    // Check if request should be allowed
    const allowed = entry.count < this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - entry.count - 1);
    const retryAfter = allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000);

    // Increment counter if request is being processed
    if (allowed) {
      entry.count++;
    }

    return {
      allowed,
      limit: this.config.maxRequests,
      remaining,
      resetTime: entry.resetTime,
      ...(retryAfter !== undefined && { retryAfter }),
    };
  }

  public createMiddleware() {
    return (request: Request): Response | null => {
      const result = this.check(request);

      if (!result.allowed) {
        logWarning('Rate limit exceeded', {
          key: this.config.keyGenerator(request),
          limit: this.config.maxRequests,
          windowMs: this.config.windowMs,
          userAgent: request.headers.get('user-agent'),
          origin: request.headers.get('origin'),
        });

        return createRateLimitResponse(
          this.config.maxRequests,
          this.config.windowMs,
          result.retryAfter!
        );
      }

      return null; // Allow request to proceed
    };
  }
}

// Default rate limiter for authentication endpoints
export const authRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  message: 'Too many authentication requests',
});

// Strict rate limiter for failed authentication attempts
export const authFailureRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // Only 5 failed attempts per 15 minutes
  message: 'Too many failed authentication attempts',
});

// Rate limiter for token refresh (more permissive)
export const refreshRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 refresh attempts per minute
  message: 'Too many token refresh requests',
});

// Rate limiter for health checks (very permissive)
export const healthRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 1 per second average
  message: 'Too many health check requests',
});

// Middleware factory for different endpoints
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return limiter.createMiddleware();
}

// Enhanced rate limiting with multiple strategies
export class AdaptiveRateLimiter {
  private limiters: Map<string, RateLimiter> = new Map();

  constructor() {
    // Different rate limits for different endpoints
    this.limiters.set('/verify', authRateLimiter);
    this.limiters.set('/refresh', refreshRateLimiter);
    this.limiters.set('/health', healthRateLimiter);
  }

  public checkRequest(request: Request): Response | null {
    const url = new URL(request.url);
    const path = url.pathname;

    // Get appropriate rate limiter
    const limiter = this.limiters.get(path) || authRateLimiter;

    return limiter.createMiddleware()(request);
  }

  public recordFailedAuth(request: Request): Response | null {
    // Apply additional rate limiting for failed auth attempts
    return authFailureRateLimiter.createMiddleware()(request);
  }
}

export const adaptiveRateLimiter = new AdaptiveRateLimiter();