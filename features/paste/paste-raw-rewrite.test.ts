import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/next-intl.config', () => ({ default: (config: unknown) => config }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('paste raw route', () => {
  it('proxies the legacy raw URL directly and keeps the existing API proxy', async () => {
    vi.stubEnv('BACKEND_BASEURL', 'https://backend.example/');
    const { default: config } = await import('@/next.config');
    const rewrites = await config.rewrites?.();
    expect(rewrites).toEqual(
      expect.arrayContaining([
        {
          source: '/paste/:id/raw',
          destination: 'https://backend.example/paste/:id/raw',
        },
        {
          source: '/api/:path*',
          destination: 'https://backend.example/:path*',
        },
      ])
    );
  });
});
