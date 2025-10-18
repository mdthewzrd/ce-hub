import { validateUserSession } from '../supabase.js';
import { validateRequestBody, TokenVerificationSchema, type TokenVerificationRequest, extractBearerToken, validateJwtClaims, hasRequiredRole, hasRequiredPermissions } from '../utils/security.js';
import { createSuccessResponse, ResponseTemplates, createJsonResponse } from '../utils/responses.js';
import { AuthenticationError, ValidationError, logInfo, logError } from '../utils/errors.js';
import jwt from 'jsonwebtoken';

export interface VerifyTokenResponse {
  valid: boolean;
  user?: {
    id: string;
    email?: string;
    role?: string;
    permissions?: string[];
    app_metadata?: Record<string, any>;
    user_metadata?: Record<string, any>;
    created_at?: string;
    last_sign_in_at?: string;
  };
  exp?: number;
  iat?: number;
}

export async function handleVerifyToken(request: Request, requestId: string): Promise<Response> {
  try {
    // Handle GET request with Authorization header
    if (request.method === 'GET') {
      const token = extractBearerToken(request);
      if (!token) {
        const response = ResponseTemplates.missingToken(requestId);
        return createJsonResponse(response.response, response.statusCode);
      }

      return await verifyTokenLogic(token, { checkExpiry: true }, requestId);
    }

    // Handle POST request with JSON body
    if (request.method === 'POST') {
      const body = await validateRequestBody(request, TokenVerificationSchema);
      const options = {
        checkExpiry: body.options?.checkExpiry ?? true,
        requireRole: body.options?.requireRole,
        requirePermissions: body.options?.requirePermissions,
      };
      return await verifyTokenLogic(body.token, options, requestId);
    }

    const response = ResponseTemplates.methodNotAllowed(requestId, request.method);
    return createJsonResponse(response.response, response.statusCode);

  } catch (error) {
    logError(error as Error, { requestId, endpoint: '/verify' });

    if (error instanceof ValidationError) {
      const response = ResponseTemplates.invalidRequest(requestId, error.message);
      return createJsonResponse(response.response, response.statusCode);
    }

    const response = ResponseTemplates.serviceUnavailable(requestId);
    return createJsonResponse(response.response, response.statusCode);
  }
}

async function verifyTokenLogic(
  token: string,
  options: TokenVerificationRequest['options'],
  requestId: string
): Promise<Response> {
  try {
    // First, try to decode the JWT without verification to get basic info
    let decoded: any;
    try {
      decoded = jwt.decode(token);
      if (!decoded) {
        throw new AuthenticationError('Invalid token format');
      }
    } catch {
      const response = ResponseTemplates.invalidToken(requestId);
      return createJsonResponse(response.response, response.statusCode);
    }

    // Validate JWT claims structure
    const claimsValidation = validateJwtClaims(decoded);
    if (!claimsValidation.valid) {
      logInfo('Token validation failed - invalid claims', {
        requestId,
        error: claimsValidation.error,
        userId: decoded.sub,
      });

      const response = ResponseTemplates.invalidToken(requestId);
      return createJsonResponse(response.response, response.statusCode);
    }

    // Verify token with Supabase
    const verification = await validateUserSession(token);
    if (!verification.valid) {
      logInfo('Token validation failed - Supabase verification', {
        requestId,
        error: verification.error,
        userId: decoded.sub,
      });

      if (verification.error?.includes('expired')) {
        const response = ResponseTemplates.tokenExpired(requestId);
        return createJsonResponse(response.response, response.statusCode);
      }

      const response = ResponseTemplates.invalidToken(requestId);
      return createJsonResponse(response.response, response.statusCode);
    }

    const user = claimsValidation.user!;

    // Apply additional validation based on options
    if (options?.requireRole) {
      if (!hasRequiredRole(user, options.requireRole)) {
        logInfo('Token validation failed - insufficient role', {
          requestId,
          userId: user.id,
          userRole: user.role,
          requiredRole: options.requireRole,
        });

        const response = ResponseTemplates.invalidToken(requestId);
        return createJsonResponse(response.response, response.statusCode);
      }
    }

    if (options?.requirePermissions && options.requirePermissions.length > 0) {
      if (!hasRequiredPermissions(user, options.requirePermissions)) {
        logInfo('Token validation failed - insufficient permissions', {
          requestId,
          userId: user.id,
          userPermissions: user.permissions,
          requiredPermissions: options.requirePermissions,
        });

        const response = ResponseTemplates.invalidToken(requestId);
        return createJsonResponse(response.response, response.statusCode);
      }
    }

    // Successful verification
    logInfo('Token verification successful', {
      requestId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
    });

    const responseData: VerifyTokenResponse = {
      valid: true,
      user: {
        id: user.id,
        ...(user.email && { email: user.email }),
        ...(user.role && { role: user.role }),
        ...(user.permissions && { permissions: user.permissions }),
        ...(user.app_metadata && { app_metadata: user.app_metadata }),
        ...(user.user_metadata && { user_metadata: user.user_metadata }),
        ...(verification.user?.created_at && { created_at: verification.user.created_at }),
        ...(verification.user?.last_sign_in_at && { last_sign_in_at: verification.user.last_sign_in_at }),
      },
      exp: decoded.exp,
      iat: decoded.iat,
    };

    const response = createSuccessResponse(responseData, requestId);
    return createJsonResponse(response.response, response.statusCode);

  } catch (error) {
    logError(error as Error, { requestId, endpoint: '/verify' });

    if (error instanceof AuthenticationError) {
      const response = ResponseTemplates.invalidToken(requestId);
      return createJsonResponse(response.response, response.statusCode);
    }

    const response = ResponseTemplates.serviceUnavailable(requestId);
    return createJsonResponse(response.response, response.statusCode);
  }
}

// Helper function for middleware usage
export async function verifyTokenMiddleware(
  token: string,
  options: TokenVerificationRequest['options'] = { checkExpiry: true }
): Promise<{ valid: boolean; user?: any; error?: string }> {
  try {
    const decoded = jwt.decode(token);
    if (!decoded) {
      return { valid: false, error: 'Invalid token format' };
    }

    const claimsValidation = validateJwtClaims(decoded);
    if (!claimsValidation.valid) {
      return { valid: false, error: claimsValidation.error || 'Invalid claims' };
    }

    const verification = await validateUserSession(token);
    if (!verification.valid) {
      return { valid: false, error: verification.error || 'Token validation failed' };
    }

    const user = claimsValidation.user!;

    // Apply additional validation
    if (options.requireRole && !hasRequiredRole(user, options.requireRole)) {
      return { valid: false, error: 'Insufficient role' };
    }

    if (options.requirePermissions && !hasRequiredPermissions(user, options.requirePermissions)) {
      return { valid: false, error: 'Insufficient permissions' };
    }

    return { valid: true, user };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Token verification failed',
    };
  }
}