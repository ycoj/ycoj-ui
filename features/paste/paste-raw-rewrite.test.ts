import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/next-intl.config', () => ({ default: (config: unknown) => config }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('paste raw route', () => {
  it('proxies the legacy raw URL directly and falls back to the API proxy', async () => {
    vi.stubEnv('BACKEND_BASEURL', 'https://backend.example/');
    const { default: config } = await import('@/next.config');
    const rewrites = await config.rewrites?.();
    expect(rewrites).toEqual({
      afterFiles: [
        {
          source: '/paste/:id/raw',
          destination: 'https://backend.example/paste/:id/raw',
        },
        {
          source: '/fs/:path*',
          destination: 'https://backend.example/fs/:path*',
        },
      ],
      fallback: [
        {
          source: '/api/:path*',
          destination: 'https://backend.example/:path*',
        },
      ],
    });
  });
});
