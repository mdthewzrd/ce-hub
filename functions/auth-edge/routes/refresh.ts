import { validateRequestBody, TokenRefreshSchema } from '../utils/security.js';
import { createSuccessResponse, ResponseTemplates, createJsonResponse } from '../utils/responses.js';
import { ValidationError, AuthenticationError, logInfo, logError } from '../utils/errors.js';
import { refreshUserSession } from '../supabase.js';

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: {
    id: string;
    email?: string;
    role?: string;
    app_metadata?: Record<string, any>;
    user_metadata?: Record<string, any>;
  };
}

export async function handleRefreshToken(request: Request, requestId: string): Promise<Response> {
  try {
    // Only allow POST method for token refresh
    if (request.method !== 'POST') {
      const response = ResponseTemplates.methodNotAllowed(requestId, request.method);
      return createJsonResponse(response.response, response.statusCode);
    }

    // Validate request body
    const body = await validateRequestBody(request, TokenRefreshSchema);

    // Refresh token with Supabase
    const refreshResult = await refreshUserSession(body.refreshToken);

    if (!refreshResult.session) {
      logInfo('Token refresh failed', {
        requestId,
        error: refreshResult.error,
      });

      if (refreshResult.error?.includes('expired') || refreshResult.error?.includes('invalid_grant')) {
        const response = ResponseTemplates.tokenExpired(requestId);
        return createJsonResponse(response.response, response.statusCode);
      }

      const response = ResponseTemplates.invalidToken(requestId);
      return createJsonResponse(response.response, response.statusCode);
    }

    const { session, user } = refreshResult;

    // Successful token refresh
    logInfo('Token refresh successful', {
      requestId,
      userId: user?.id,
      userEmail: user?.email,
      expiresAt: session.expires_at,
    });

    const responseData: RefreshTokenResponse = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in || 3600,
      expires_at: session.expires_at || Date.now() / 1000 + 3600,
      token_type: session.token_type || 'bearer',
      user: {
        id: user?.id || '',
        email: user?.email,
        role: user?.role || user?.app_metadata?.role,
        app_metadata: user?.app_metadata || {},
        user_metadata: user?.user_metadata || {},
      },
    };

    const response = createSuccessResponse(responseData, requestId);
    return createJsonResponse(response.response, response.statusCode);

  } catch (error) {
    logError(error as Error, { requestId, endpoint: '/refresh' });

    if (error instanceof ValidationError) {
      const response = ResponseTemplates.invalidRequest(requestId, error.message);
      return createJsonResponse(response.response, response.statusCode);
    }

    if (error instanceof AuthenticationError) {
      const response = ResponseTemplates.invalidToken(requestId);
      return createJsonResponse(response.response, response.statusCode);
    }

    const response = ResponseTemplates.serviceUnavailable(requestId);
    return createJsonResponse(response.response, response.statusCode);
  }
}

// Helper function for middleware usage
export async function refreshTokenMiddleware(
  refreshToken: string
): Promise<{ success: boolean; session?: any; user?: any; error?: string }> {
  try {
    const refreshResult = await refreshUserSession(refreshToken);

    if (!refreshResult.session) {
      return {
        success: false,
        error: refreshResult.error || 'Token refresh failed'
      };
    }

    return {
      success: true,
      session: refreshResult.session,
      user: refreshResult.user
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
    };
  }
}