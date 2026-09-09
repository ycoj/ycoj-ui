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
  async headers() {
    const isolationHeaders = [
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
    ];
    return [
      {
        source: '/problem/:path*',
        has: [{ type: 'query', key: 'clangd', value: '1' }],
        headers: isolationHeaders,
      },
      {
        source: '/clangd/:path*',
        headers: [
          ...isolationHeaders,
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/clangd/v1/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/paste/:id/raw',
        destination: `${backendBaseUrl}/paste/:id/raw`,
      },
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
