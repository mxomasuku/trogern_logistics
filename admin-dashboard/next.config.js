/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
  transpilePackages: ['@trogern/domain'],
};

module.exports = nextConfig;
