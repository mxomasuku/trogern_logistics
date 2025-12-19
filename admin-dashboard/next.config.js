/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['firebase-admin'],
  transpilePackages: ['@trogern/domain'],
};

module.exports = nextConfig;
