/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Commented out for development - static export mode conflicts with error pages
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
