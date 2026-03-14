import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Transpile workspace packages
  transpilePackages: ['@emithq/core'],
};

export default nextConfig;
