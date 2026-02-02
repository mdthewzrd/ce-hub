import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporarily disabled API rewrites to get frontend working
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: 'http://localhost:5659/api/:path*',
  //     },
  //   ]
  // },
};

export default nextConfig;
