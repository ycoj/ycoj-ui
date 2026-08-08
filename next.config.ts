import withNextIntl from './next-intl.config';
import type { NextConfig } from 'next';

const backendBaseUrl = process.env.BACKEND_BASEURL?.replace(/\/+$/, '');
const uploadBaseUrl =
  process.env.NEXT_PUBLIC_UPLOAD_BASEURL?.replace(/\/+$/, '') ??
  backendBaseUrl ??
  '';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_UPLOAD_BASEURL: uploadBaseUrl,
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
