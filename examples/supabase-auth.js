/**
 * Supabase Authentication Implementation - PRODUCTION HARDENED
 * CE-Hub Agent Playground - PRP-05 Production Hardening
 *
 * @file supabase-auth.js
 * @version 2.0.0 - Production Ready
 * @description
 * Production-hardened Supabase authentication module with enhanced security features:
 *
 * PRODUCTION ENHANCEMENTS (PRP-05):
 * - Server-side validation using getUser() instead of getClaims()
 * - Environment-driven OAuth scope configuration per provider
 * - Redirect URL allow-list validation with wildcard support
 * - Enhanced error handling with comprehensive message mapping
 * - Full JSDoc documentation for all functions and classes
 *
 * SECURITY FEATURES:
 * - Defensive input validation and sanitization
 * - XSS prevention with script tag detection
 * - OAuth 2.1 + PKCE flow implementation
 * - Secure error handling without information leakage
 * - JWT server-side validation for production reliability
 * - Password strength validation (min 8 characters)
 * - Email format validation with regex
 * - Provider whitelist enforcement
 *
 * ENVIRONMENT CONFIGURATION REQUIRED:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_ANON_KEY: Your Supabase anonymous/public key
 * - ALLOWED_REDIRECT_HOSTS: Comma-separated list of allowed redirect hosts
 * - OAUTH_SCOPES_[PROVIDER]: Optional provider-specific OAuth scopes
 *
 * Based on RAG Intelligence from Supabase Documentation (source_id: bce031a97618e1f9)
 * CE-Hub Engineering Standards - Defensive Security Implementation
 *
 * @author CE-Hub Digital Team (Engineer Agent)
 * @since 2024-10-10
 */

import { createClient } from '@supabase/supabase-js'

/**
 * Input Validation Helper - Defensive Security Practice
 *
 * @param {string} value - The value to validate
 * @param {string} type - The type/name of the field being validated
 * @param {boolean} required - Whether the field is required
 * @returns {string} The validated and trimmed value
 * @throws {Error} If validation fails
 */
function validateInput(value, type, required = true) {
  if (required && (!value || value.trim() === '')) {
    throw new Error(`${type} is required and cannot be empty`)
  }

  if (value && typeof value !== 'string') {
    throw new Error(`${type} must be a string`)
  }

  // Sanitize potential XSS attempts
  if (value && value.includes('<script>')) {
    throw new Error(`${type} contains invalid characters`)
  }

  return value?.trim()
}

/**
 * Validate Redirect URL Against Allow-List
 * PRODUCTION HARDENED: Validates redirect URLs against environment-configured allow-list
 *
 * @param {string} redirectUrl - The URL to validate
 * @returns {boolean} True if the URL is valid and allowed
 * @throws {Error} If URL is invalid or not in allow-list
 */
function validateRedirectUrl(redirectUrl) {
  if (!redirectUrl) {
    return true // null/undefined redirect is valid (uses default)
  }

  // Validate URL format
  let url
  try {
    url = new URL(redirectUrl)
  } catch {
    throw new Error('Invalid redirect URL format')
  }

  // Get allowed hosts from environment variable
  // Expected format: "localhost,app.example.com,*.example.com"
  const allowedHosts = process.env.ALLOWED_REDIRECT_HOSTS?.split(',').map(h => h.trim()) || []

  if (allowedHosts.length === 0) {
    throw new Error('ALLOWED_REDIRECT_HOSTS not configured - redirect URL validation required')
  }

  // Check if URL host matches any allowed host
  const hostname = url.hostname
  const isAllowed = allowedHosts.some(allowedHost => {
    // Support wildcard patterns like *.example.com
    if (allowedHost.startsWith('*.')) {
      const domain = allowedHost.substring(2)
      return hostname.endsWith(domain)
    }
    return hostname === allowedHost
  })

  if (!isAllowed) {
    throw new Error(`Redirect URL host "${hostname}" is not in the allow-list`)
  }

  return true
}

/**
 * Get OAuth Scopes from Environment Configuration
 * PRODUCTION HARDENED: Dynamic scope configuration per environment
 *
 * @param {string} provider - The OAuth provider name
 * @returns {string} Comma-separated scope string
 */
function getScopesFromEnv(provider) {
  // Try provider-specific scope configuration first
  const providerScopes = process.env[`OAUTH_SCOPES_${provider.toUpperCase()}`]
  if (providerScopes) {
    return providerScopes
  }

  // Fall back to default scopes for the provider
  const defaultScopes = {
    github: 'read:user user:email',
    google: 'openid email profile',
    discord: 'identify email',
    twitter: 'users.read tweet.read'
  }

  return defaultScopes[provider] || 'openid email profile'
}

/**
 * Secure Error Handler - No sensitive data exposure
 * PRODUCTION HARDENED: Enhanced error mapping for production scenarios
 *
 * @param {Error} error - The error object to handle
 * @param {string} context - The context where the error occurred
 * @returns {string} A sanitized, user-friendly error message
 */
function handleAuthError(error, context) {
  // Log full error for debugging (should go to secure logging service in production)
  console.error(`Auth Error in ${context}:`, error.message)

  // Return generic error messages to prevent information leakage
  const genericErrors = {
    'Invalid login credentials': 'Authentication failed',
    'Email not confirmed': 'Please verify your email',
    'Too many requests': 'Please try again later',
    'User not found': 'Authentication failed',
    'Invalid token': 'Session expired - please sign in again',
    'Token expired': 'Session expired - please sign in again',
    'Invalid OAuth provider': 'Authentication provider not supported',
    'Invalid redirect URL format': 'Configuration error - please contact support',
    'Redirect URL host is not in the allow-list': 'Redirect URL not authorized',
    'ALLOWED_REDIRECT_HOSTS not configured': 'Service configuration error',
    'default': 'Authentication error occurred'
  }

  // Match error message to generic response
  const errorMessage = error.message || 'Unknown error'
  return genericErrors[errorMessage] || genericErrors.default
}

/**
 * Secure Supabase Authentication Service
 * PRODUCTION HARDENED: Implements OAuth 2.1 + PKCE flow with defensive security practices
 *
 * @class SupabaseAuthService
 * @description
 * Production-ready authentication service with:
 * - Server-side JWT validation using getUser()
 * - Environment-driven OAuth scope configuration
 * - Redirect URL allow-list validation
 * - Enhanced error handling with sanitized messages
 * - Comprehensive input validation
 * - PKCE flow for OAuth providers
 */
class SupabaseAuthService {
  /**
   * Initialize Supabase Authentication Service
   *
   * @param {string} supabaseUrl - Supabase project URL
   * @param {string} supabaseAnonKey - Supabase anonymous/public key
   * @throws {Error} If configuration parameters are invalid
   */
  constructor(supabaseUrl, supabaseAnonKey) {
    // Input validation for configuration
    this.supabaseUrl = validateInput(supabaseUrl, 'Supabase URL')
    this.supabaseAnonKey = validateInput(supabaseAnonKey, 'Supabase Anon Key')

    // Initialize client with secure defaults
    this.supabase = createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce' // PKCE flow for enhanced security
      }
    })
  }

  /**
   * Sign in with OAuth Provider
   * PRODUCTION HARDENED: Implements PKCE flow with environment-driven configuration
   *
   * @param {string} provider - OAuth provider name (github, google, discord, twitter)
   * @param {string|null} redirectTo - Optional redirect URL after authentication
   * @returns {Promise<Object>} OAuth sign-in response with success status and data
   * @throws {Error} Validation and authentication errors are caught and sanitized
   */
  async signInWithOAuth(provider = 'github', redirectTo = null) {
    try {
      // Validate provider input
      const validProviders = ['github', 'google', 'discord', 'twitter']
      if (!validProviders.includes(provider)) {
        throw new Error('Invalid OAuth provider')
      }

      // PRODUCTION: Validate redirect URL against allow-list
      if (redirectTo) {
        validateRedirectUrl(redirectTo)
      }

      // PRODUCTION: Get scopes from environment configuration
      const scopes = getScopesFromEnv(provider)

      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: redirectTo,
          scopes: scopes
        }
      })

      if (error) {
        throw error
      }

      return {
        success: true,
        data: data,
        message: 'OAuth sign-in initiated successfully'
      }

    } catch (error) {
      return {
        success: false,
        error: handleAuthError(error, 'OAuth Sign In'),
        data: null
      }
    }
  }

  /**
   * Sign in with Email/Password
   * PRODUCTION HARDENED: Implements secure credential handling with validation
   *
   * @param {string} email - User email address
   * @param {string} password - User password (min 8 characters)
   * @returns {Promise<Object>} Authentication response with user, session, and success status
   * @throws {Error} Validation and authentication errors are caught and sanitized
   */
  async signInWithPassword(email, password) {
    try {
      // Defensive input validation
      email = validateInput(email, 'Email')
      password = validateInput(password, 'Password')

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format')
      }

      // Password strength check
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters')
      }

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email,
        password: password
      })

      if (error) {
        throw error
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
        message: 'Authentication successful'
      }

    } catch (error) {
      return {
        success: false,
        error: handleAuthError(error, 'Password Sign In'),
        user: null,
        session: null
      }
    }
  }

  /**
   * Get Current User with Server-Side Validation
   * PRODUCTION HARDENED: Uses getUser() for proper server-side validation
   *
   * @returns {Promise<Object>} User data with success status and session info
   * @throws {Error} Authentication errors are caught and returned in error field
   */
  async getCurrentUser() {
    try {
      // PRODUCTION: Use getUser() for server-side validation (recommended for production)
      // This validates the JWT against the server and returns fresh user data
      const { data: { user }, error } = await this.supabase.auth.getUser()

      if (error) {
        throw error
      }

      if (!user) {
        return {
          success: false,
          user: null,
          message: 'No active session'
        }
      }

      // Get session data separately for complete context
      const { data: { session } } = await this.supabase.auth.getSession()

      return {
        success: true,
        user: user,
        session: session,
        message: 'User retrieved successfully'
      }

    } catch (error) {
      return {
        success: false,
        error: handleAuthError(error, 'Get Current User'),
        user: null,
        session: null
      }
    }
  }

  /**
   * Sign Out User
   * PRODUCTION HARDENED: Secure session termination with enhanced error handling
   *
   * @returns {Promise<Object>} Sign out response with success status
   * @throws {Error} Sign out errors are caught and sanitized
   */
  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut()

      if (error) {
        throw error
      }

      return {
        success: true,
        message: 'Sign out successful'
      }

    } catch (error) {
      return {
        success: false,
        error: handleAuthError(error, 'Sign Out')
      }
    }
  }

  /**
   * Refresh Session
   * PRODUCTION HARDENED: Handles token refresh with comprehensive error handling
   *
   * @returns {Promise<Object>} Refreshed session data with success status
   * @throws {Error} Refresh errors are caught and sanitized
   */
  async refreshSession() {
    try {
      const { data, error } = await this.supabase.auth.refreshSession()

      if (error) {
        throw error
      }

      return {
        success: true,
        session: data.session,
        message: 'Session refreshed successfully'
      }

    } catch (error) {
      return {
        success: false,
        error: handleAuthError(error, 'Session Refresh'),
        session: null
      }
    }
  }
}

/**
 * Initialize Authentication Service
 * PRODUCTION HARDENED: Secure initialization with environment validation
 *
 * @returns {Promise<SupabaseAuthService>} Initialized authentication service instance
 * @throws {Error} If required environment variables are missing
 *
 * @example
 * // Initialize auth service from environment variables
 * const authService = await initializeAuth()
 *
 * // Sign in with OAuth
 * const result = await authService.signInWithOAuth('github', 'https://app.example.com/callback')
 *
 * // Get current user
 * const user = await authService.getCurrentUser()
 */
export async function initializeAuth() {
  try {
    // Environment variables validation
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing')
    }

    const authService = new SupabaseAuthService(supabaseUrl, supabaseAnonKey)

    console.log('Supabase Auth Service initialized successfully')
    return authService

  } catch (error) {
    console.error('Auth initialization failed:', error.message)
    throw error
  }
}

export default SupabaseAuthService