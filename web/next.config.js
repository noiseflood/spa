/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only enable static export for production builds (Cloudflare Pages)
  // Check for CLOUDFLARE_BUILD env var or if explicitly building for production
  output: process.env.CLOUDFLARE_BUILD === 'true' ? 'export' : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Already set if you want to ignore TS errors too
    // ignoreBuildErrors: true,
  },
  transpilePackages: ['@spa-audio/core', '@spa-audio/types', '@spa-audio/react'],
  trailingSlash: true,
};

module.exports = nextConfig;
