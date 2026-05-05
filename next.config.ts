import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['node-cron', 'pg', '@prisma/adapter-pg'],
};

export default nextConfig;
