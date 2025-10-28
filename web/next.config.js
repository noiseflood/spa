/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Already set if you want to ignore TS errors too
    // ignoreBuildErrors: true,
  },
  transpilePackages: ['@spa-audio/core', '@spa-audio/types', '@spa-audio/react'],
};

module.exports = nextConfig;
