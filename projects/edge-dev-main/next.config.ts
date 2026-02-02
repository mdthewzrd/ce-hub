import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable API rewrites to proxy requests to Python backend
  // Exclude Next.js API routes from being proxied
  async rewrites() {
    return [
      // Next.js API routes - don't proxy these
      {
        source: '/api/renata/:path*',
        destination: '/api/renata/:path*', // Let Next.js handle Renata API
      },
      {
        source: '/api/renata_v2/:path*',
        destination: '/api/renata_v2/:path*', // Let Next.js handle Renata V2 API
      },
      {
        source: '/api/copilotkit/:path*',
        destination: '/api/copilotkit/:path*', // Let Next.js handle CopilotKit API
      },
      {
        source: '/api/projects/:id/execute',
        destination: '/api/projects/:id/execute', // Let Next.js handle project execution
      },
      // Proxy all other API requests to Python backend
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ]
  },
};

export default nextConfig;
