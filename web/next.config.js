/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Already set if you want to ignore TS errors too
    // ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
