/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@copilotkit/runtime'],
  },
}

module.exports = nextConfig
