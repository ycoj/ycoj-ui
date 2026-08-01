import withNextIntl from './next-intl.config';
import type { NextConfig } from 'next';

const backendBaseUrl = process.env.BACKEND_BASEURL?.replace(/\/+$/, '');

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
        destination: `${backendBaseUrl}/:path*`,
      },
      {
        source: '/fs/:path*',
        destination: `${backendBaseUrl}/fs/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
