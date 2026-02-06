import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    SITE_NAME: process.env.SITE_NAME ?? '',
  },
  assetPrefix:
    process.env.NODE_ENV === 'production' ? 'https://next-cdn.ycoj.cc' : '',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_BASEURL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
