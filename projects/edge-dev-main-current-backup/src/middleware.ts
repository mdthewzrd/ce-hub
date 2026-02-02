// Temporarily disable authentication for platform access
// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// const isPublicRoute = createRouteMatcher([
//   '/sign-in(.*)',
//   '/sign-up(.*)',
//   '/api/webhook(.*)',
// ]);

// export default clerkMiddleware((auth, req) => {
//   if (!isPublicRoute(req)) {
//     // New Clerk API - just redirect to sign-in if not authenticated
//     if (!auth().userId) {
//       throw new Error("Unauthorized - Please sign in");
//     }
//   }
// });

export default function middleware(req: Request) {
  // Allow all requests during development
  return;
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};