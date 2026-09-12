import withNextIntl from './next-intl.config';
import type { NextConfig } from 'next';

const backendBaseUrl = process.env.BACKEND_BASEURL?.replace(/\/+$/, '');
const uploadBaseUrl =
  process.env.NEXT_PUBLIC_UPLOAD_BASEURL?.replace(/\/+$/, '') ??
  backendBaseUrl ??
  '';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@resvg/resvg-js'],
  outputFileTracingIncludes: {
    '/api/scoreboard-export/*/*': [
      './public/fonts/NotoSansCJKsc-Regular.otf',
      './public/fonts/noto-sans-cjk-OFL.txt',
    ],
  },
  env: {
    NEXT_PUBLIC_UPLOAD_BASEURL: uploadBaseUrl,
    SITE_NAME: process.env.SITE_NAME ?? '',
  },
  assetPrefix:
    process.env.NODE_ENV === 'production' ? 'https://next-cdn.ycoj.cc' : '',
  async rewrites() {
    return {
      afterFiles: [
        {
          source: '/paste/:id/raw',
          destination: `${backendBaseUrl}/paste/:id/raw`,
        },
        {
          source: '/fs/:path*',
          destination: `${backendBaseUrl}/fs/:path*`,
        },
      ],
      fallback: [
        {
          source: '/api/:path*',
          destination: `${backendBaseUrl}/:path*`,
        },
      ],
    };
  },
};

export default withNextIntl(nextConfig);
