/**
 * Supabase Authentication Demo - Production Hardened
 * CE-Hub Agent Playground - PRP-05 Usage Example
 *
 * @file auth-demo.js
 * @version 2.0.0 - Production Ready
 * @description
 * Minimal usage demonstration of the production-hardened Supabase authentication module.
 * This example shows how to:
 * - Load environment configuration
 * - Initialize the authentication service
 * - Implement OAuth authentication flows
 * - Handle password-based authentication
 * - Manage user sessions with server-side validation
 * - Handle errors gracefully
 *
 * PREREQUISITES:
 * 1. Install dependencies: npm install @supabase/supabase-js dotenv
 * 2. Copy .env.example to .env and configure your values
 * 3. Ensure SUPABASE_URL, SUPABASE_ANON_KEY, and ALLOWED_REDIRECT_HOSTS are set
 *
 * USAGE:
 * node examples/auth-demo.js
 *
 * @author CE-Hub Digital Team (Documenter Agent)
 * @since 2024-10-10
 */

// Load environment variables from .env file
import 'dotenv/config'
import { initializeAuth } from './supabase-auth.js'

/**
 * Demonstrate OAuth Authentication Flow
 * This example shows GitHub OAuth with redirect URL validation
 */
async function demoOAuthAuthentication(authService) {
  console.log('\n=== OAuth Authentication Demo ===\n')

  try {
    // Initiate GitHub OAuth sign-in with redirect URL
    // NOTE: Redirect URL must be in ALLOWED_REDIRECT_HOSTS environment variable
    const redirectUrl = 'http://localhost:3000/auth/callback'

    console.log(`Initiating GitHub OAuth sign-in...`)
    console.log(`Redirect URL: ${redirectUrl}`)

    const result = await authService.signInWithOAuth('github', redirectUrl)

    if (result.success) {
      console.log('✅ OAuth sign-in initiated successfully')
      console.log('OAuth URL:', result.data.url)
      console.log('\nNext steps:')
      console.log('1. User would be redirected to:', result.data.url)
      console.log('2. After OAuth provider authorization, user returns to:', redirectUrl)
      console.log('3. Application exchanges code for session token')
      console.log('4. User is authenticated and session is established')
    } else {
      console.log('❌ OAuth sign-in failed:', result.error)
    }
  } catch (error) {
    console.error('OAuth demo error:', error.message)
  }
}

/**
 * Demonstrate Password Authentication Flow
 * This example shows email/password sign-in with validation
 */
async function demoPasswordAuthentication(authService) {
  console.log('\n=== Password Authentication Demo ===\n')

  try {
    // Example credentials (replace with actual test user credentials)
    const email = 'test@example.com'
    const password = 'testpassword123'

    console.log(`Attempting password sign-in for: ${email}`)

    const result = await authService.signInWithPassword(email, password)

    if (result.success) {
      console.log('✅ Password authentication successful')
      console.log('User ID:', result.user.id)
      console.log('User Email:', result.user.email)
      console.log('Session expires at:', new Date(result.session.expires_at * 1000).toISOString())
    } else {
      console.log('❌ Password authentication failed:', result.error)
      console.log('Note: This is expected if test credentials do not exist')
    }
  } catch (error) {
    console.error('Password demo error:', error.message)
  }
}

/**
 * Demonstrate Session Management
 * This example shows server-side JWT validation and session retrieval
 */
async function demoSessionManagement(authService) {
  console.log('\n=== Session Management Demo ===\n')

  try {
    // Get current user with server-side validation (PRP-05 production feature)
    console.log('Retrieving current user with server-side JWT validation...')

    const result = await authService.getCurrentUser()

    if (result.success && result.user) {
      console.log('✅ User session validated (server-side verification)')
      console.log('User ID:', result.user.id)
      console.log('User Email:', result.user.email)
      console.log('User Created:', new Date(result.user.created_at).toISOString())
      console.log('Last Sign In:', new Date(result.user.last_sign_in_at).toISOString())

      if (result.session) {
        console.log('Session Token Present:', 'Yes')
        console.log('Session Expires:', new Date(result.session.expires_at * 1000).toISOString())
      }
    } else {
      console.log('ℹ️  No active session found')
      console.log('This is expected if no user is currently authenticated')
    }
  } catch (error) {
    console.error('Session management demo error:', error.message)
  }
}

/**
 * Demonstrate Session Refresh
 * This example shows how to refresh an expiring session token
 */
async function demoSessionRefresh(authService) {
  console.log('\n=== Session Refresh Demo ===\n')

  try {
    console.log('Attempting to refresh session token...')

    const result = await authService.refreshSession()

    if (result.success && result.session) {
      console.log('✅ Session refreshed successfully')
      console.log('New Token Issued:', 'Yes')
      console.log('New Expiry:', new Date(result.session.expires_at * 1000).toISOString())
    } else {
      console.log('ℹ️  Session refresh not possible (no active session)')
      console.log('This is expected if no user is currently authenticated')
    }
  } catch (error) {
    console.error('Session refresh demo error:', error.message)
  }
}

/**
 * Demonstrate Sign Out
 * This example shows secure session termination
 */
async function demoSignOut(authService) {
  console.log('\n=== Sign Out Demo ===\n')

  try {
    console.log('Signing out user...')

    const result = await authService.signOut()

    if (result.success) {
      console.log('✅ User signed out successfully')
      console.log('Session terminated and cleared')
    } else {
      console.log('❌ Sign out failed:', result.error)
    }
  } catch (error) {
    console.error('Sign out demo error:', error.message)
  }
}

/**
 * Demonstrate Environment Configuration Loading
 * This example shows how to verify environment variables are properly configured
 */
function demoEnvironmentConfiguration() {
  console.log('\n=== Environment Configuration Demo ===\n')

  // Check required configuration
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY']
  const optionalVars = [
    'ALLOWED_REDIRECT_HOSTS',
    'OAUTH_SCOPES_GITHUB',
    'OAUTH_SCOPES_GOOGLE',
    'OAUTH_SCOPES_DISCORD',
    'OAUTH_SCOPES_TWITTER'
  ]

  console.log('Required Configuration:')
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    const status = value ? '✅ Configured' : '❌ Missing'
    const displayValue = value ? `${value.substring(0, 20)}...` : 'Not set'
    console.log(`  ${varName}: ${status} (${displayValue})`)
  })

  console.log('\nOptional Configuration (PRP-05 Production Features):')
  optionalVars.forEach(varName => {
    const value = process.env[varName]
    const status = value ? '✅ Configured' : 'ℹ️  Using defaults'
    const displayValue = value || 'Default values will be used'
    console.log(`  ${varName}: ${status} (${displayValue})`)
  })

  // Check for missing required configuration
  const missingVars = requiredVars.filter(varName => !process.env[varName])
  if (missingVars.length > 0) {
    console.log('\n⚠️  WARNING: Missing required environment variables:', missingVars.join(', '))
    console.log('Please copy .env.example to .env and configure your values')
    return false
  }

  return true
}

/**
 * Main Demo Function
 * Runs all authentication demonstrations
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║  Supabase Auth Demo - Production Hardened (PRP-05)       ║')
  console.log('║  CE-Hub Agent Playground                                  ║')
  console.log('╚════════════════════════════════════════════════════════════╝')

  // Step 1: Verify environment configuration
  const configValid = demoEnvironmentConfiguration()
  if (!configValid) {
    console.log('\n❌ Demo cannot proceed without required configuration')
    console.log('Please refer to .env.example for configuration instructions')
    process.exit(1)
  }

  try {
    // Step 2: Initialize authentication service
    console.log('\n=== Authentication Service Initialization ===\n')
    console.log('Initializing Supabase Auth Service...')

    const authService = await initializeAuth()
    console.log('✅ Authentication service initialized successfully')
    console.log('Production Features Enabled:')
    console.log('  • Server-side JWT validation (getUser)')
    console.log('  • Redirect URL allow-list validation')
    console.log('  • Environment-driven OAuth scopes')
    console.log('  • Enhanced error handling')

    // Step 3: Run all demos
    await demoSessionManagement(authService)
    await demoOAuthAuthentication(authService)
    await demoPasswordAuthentication(authService)
    await demoSessionRefresh(authService)
    // Note: Commenting out sign out to preserve session for other demos
    // await demoSignOut(authService)

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗')
    console.log('║  Demo Complete                                             ║')
    console.log('╚════════════════════════════════════════════════════════════╝')
    console.log('\nNext Steps:')
    console.log('1. Review the implementation in examples/supabase-auth.js')
    console.log('2. Read the documentation in examples/supabase-auth.md')
    console.log('3. Review security validation in examples/test-report.md')
    console.log('4. Configure your production environment per .env.example')
    console.log('5. Integrate into your application following the usage patterns')

    console.log('\nProduction Deployment Checklist:')
    console.log('[ ] Configure ALLOWED_REDIRECT_HOSTS for your domains')
    console.log('[ ] Set OAuth scopes per provider (optional)')
    console.log('[ ] Enable Row Level Security (RLS) in Supabase')
    console.log('[ ] Configure email templates')
    console.log('[ ] Set up monitoring and logging')
    console.log('[ ] Test authentication flow thoroughly')

  } catch (error) {
    console.error('\n❌ Demo failed:', error.message)
    console.error('Error details:', error)
    process.exit(1)
  }
}

// Run the demo
main().catch(console.error)

/**
 * NPM Script Integration Examples:
 *
 * Add these scripts to your package.json:
 *
 * "scripts": {
 *   "demo:auth": "node examples/auth-demo.js",
 *   "demo:auth:dev": "NODE_ENV=development node examples/auth-demo.js",
 *   "demo:auth:prod": "NODE_ENV=production node examples/auth-demo.js"
 * }
 *
 * Then run with:
 * npm run demo:auth
 */

/**
 * Error Handling Best Practices:
 *
 * The demo shows how to handle errors gracefully:
 * 1. All async operations are wrapped in try-catch blocks
 * 2. Error messages are logged but don't crash the demo
 * 3. Expected errors (no session, invalid credentials) are handled informatively
 * 4. User-friendly messages guide next steps
 *
 * In production applications:
 * - Implement proper error logging (e.g., Sentry, LogRocket)
 * - Display user-friendly error messages in the UI
 * - Never expose sensitive error details to end users
 * - Monitor authentication failures for security alerts
 */

/**
 * Security Considerations:
 *
 * This demo follows PRP-05 production security standards:
 * 1. Server-side JWT validation using getUser()
 * 2. Redirect URL validation against allow-list
 * 3. Environment-driven OAuth scopes
 * 4. Sanitized error messages
 * 5. No hardcoded credentials or sensitive data
 *
 * Always remember:
 * - Never commit .env files to version control
 * - Use different credentials for each environment
 * - Rotate keys regularly
 * - Monitor authentication events
 * - Implement rate limiting in production
 */
