import withNextIntl from './next-intl.config';
import type { NextConfig } from 'next';

// keep in sync with CLANGD_ISOLATION_PARAM in
// features/problem/scratchpad/clangd/clangd-support.ts (feature TS is not
// imported here to keep the build-time config dependency-free)
const CLANGD_ISOLATION_PARAM = 'clangd';

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
      // Cross-origin isolation is only required by the optional clangd Wasm
      // mode, so it is gated on the opt-in query parameter. `has` query
      // matching applies to full document loads only; client-side soft
      // navigations keep the headers of the originally loaded document. That
      // is graceful: the client-side getClangdSupport() fallback reports
      // 'unsupported' whenever the loaded document is not cross-origin
      // isolated. A cookie-based `has` match would have the same limitation.
      {
        source: '/problem/:path*',
        has: [{ type: 'query', key: CLANGD_ISOLATION_PARAM, value: '1' }],
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
