import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define public routes that don't require authentication
// This matcher will be used to skip authentication for these routes
const isPublicRoute = createRouteMatcher([
  // Public pages
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',

  // Public API routes - all endpoints that should work without authentication
  '/api/webhook(.*)',
  '/api/debug-user(.*)',
  '/api/fix-user-id(.*)',
  '/api/trades-debug(.*)',
  '/api/debug-trades(.*)',
  '/api/get-current-user-id(.*)',
  '/api/renata/chat(.*)',
  '/api/copilotkit(.*)',
  '/api/test-prisma(.*)',
  '/api/openrouter-key(.*)',
  '/api/trades(.*)',
  '/api/agui(.*)',
  '/api/agui-chat(.*)',
  '/api/agents(.*)',      // Multi-agent system API
  '/api/test(.*)',        // Test endpoint
  '/api/health(.*)',      // Health check endpoint

  // Public pages for testing
  '/dashboard-test(.*)',
  '/dashboard(.*)',
  '/journal(.*)',
  '/statistics(.*)',
  '/analytics(.*)',
  '/calendar(.*)',
  '/trades(.*)',
  '/settings(.*)',
  '/daily-summary(.*)',
  '/ag-ui-test(.*)',
])

// Middleware handler
export default clerkMiddleware((auth, request) => {
  // Clerk's createRouteMatcher handles the logic:
  // - If isPublicRoute returns true, authentication is skipped
  // - If isPublicRoute returns false, auth().protect() is called

  // We only need to explicitly call protect() for non-public routes
  if (!isPublicRoute(request)) {
    auth().protect()
  }
  // For public routes, we simply return without calling protect()
  // This allows the request to proceed through to the route handler
})

// Middleware configuration
// This defines which routes the middleware should run on
export const config = {
  matcher: [
    // Match all routes except:
    // - _next (Next.js internals)
    // - static files (images, fonts, etc.)
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes and tRPC routes
    '/(api|trpc)(.*)',
  ],
}
