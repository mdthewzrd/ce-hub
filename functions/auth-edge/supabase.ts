import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables validation
const requiredEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
} as const;

// Validate environment variables
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

export const supabaseConfig: SupabaseConfig = {
  url: requiredEnvVars.SUPABASE_URL!,
  anonKey: requiredEnvVars.SUPABASE_ANON_KEY!,
  serviceRoleKey: requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY!,
};

// Client for user operations (with RLS)
export const supabaseClient: SupabaseClient = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'ce-hub-auth-edge/1.0.0',
      },
    },
  }
);

// Admin client for service operations (bypass RLS)
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseConfig.url,
  supabaseConfig.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'ce-hub-auth-edge-admin/1.0.0',
      },
    },
  }
);

// JWT verification configuration
export const jwtConfig = {
  secret: supabaseConfig.anonKey, // Use for JWT verification
  algorithms: ['HS256'] as const,
  issuer: supabaseConfig.url,
  audience: 'authenticated',
};

// Health check for Supabase connectivity
export async function checkSupabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const { error } = await supabaseClient
      .from('auth.users')
      .select('id')
      .limit(1);

    const latency = Date.now() - startTime;

    if (error && !error.message.includes('permission denied')) {
      // Permission denied is expected for anonymous access
      return {
        status: 'unhealthy',
        latency,
        error: error.message,
      };
    }

    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      status: 'unhealthy',
      latency,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// User session validation
export async function validateUserSession(token: string): Promise<{
  valid: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);

    if (error) {
      return {
        valid: false,
        error: error.message,
      };
    }

    if (!user) {
      return {
        valid: false,
        error: 'No user found',
      };
    }

    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Token validation failed',
    };
  }
}

// Refresh token handling
export async function refreshUserToken(refreshToken: string): Promise<{
  success: boolean;
  session?: any;
  error?: string;
}> {
  try {
    const { data, error } = await supabaseClient.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.session) {
      return {
        success: false,
        error: 'No session returned',
      };
    }

    return {
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
        user: data.session.user,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
    };
  }
}

// Refresh user session (alias for consistency)
export async function refreshUserSession(refreshToken: string): Promise<{
  session?: any;
  user?: any;
  error?: string;
}> {
  try {
    const { data, error } = await supabaseClient.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      return {
        error: error.message,
      };
    }

    if (!data.session) {
      return {
        error: 'No session returned',
      };
    }

    return {
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
      },
      user: data.session.user,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Token refresh failed',
    };
  }
}

// Test Supabase connection (alias for health checks)
export async function testSupabaseConnection(): Promise<{
  healthy: boolean;
  responseTime?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const { error } = await supabaseClient
      .from('auth.users')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error && !error.message.includes('permission denied')) {
      // Permission denied is expected for anonymous access
      return {
        healthy: false,
        responseTime,
        error: error.message,
      };
    }

    return {
      healthy: true,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      healthy: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}