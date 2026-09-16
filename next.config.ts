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
  serverExternalPackages: ['@resvg/resvg-js'],
  // LAN dev access: requests to dev-only resources (HMR socket, _next assets)
  // from other devices carry the machine's private address as their origin.
  allowedDevOrigins: [
    '10.*.*.*',
    '192.168.*.*',
    ...Array.from({ length: 16 }, (_, i) => `172.${16 + i}.*.*`),
    '*.local',
  ],
  experimental: {
    // proxy.ts makes Next buffer request bodies before the backend rewrites;
    // keep /api file uploads (imports, bulk submits) above the 10MB default.
    proxyClientMaxBodySize: '100mb',
  },
  outputFileTracingIncludes: {
    '/scoreboard-export/*/*': [
      './assets/fonts/NotoSansCJKsc-Regular.otf',
      './assets/fonts/noto-sans-cjk-OFL.txt',
    ],
  },
  env: {
    NEXT_PUBLIC_UPLOAD_BASEURL: uploadBaseUrl,
    SITE_NAME: process.env.SITE_NAME ?? '',
  },
  assetPrefix:
    process.env.NODE_ENV === 'production' ? 'https://next-cdn.ycoj.cc' : '',
  async redirects() {
    return [
      {
        source: '/p/:path*',
        destination: '/problem/:path*',
        permanent: true,
      },
    ];
  },
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
        source: '/clangd/v2/:path*',
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
