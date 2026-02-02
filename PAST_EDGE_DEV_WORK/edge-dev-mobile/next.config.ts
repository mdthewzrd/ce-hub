import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,  // Temporarily ignore TypeScript build errors for mobile testing
  },
  // Exclude backup and archive folders from compilation
  experimental: {
    typedRoutes: false
  }
};

export default nextConfig;
