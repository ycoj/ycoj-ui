import { describe, expect, it, vi } from 'vitest';

vi.mock('@/next-intl.config', () => ({ default: (config: unknown) => config }));

describe('problem short route', () => {
  it('permanently redirects every nested path to the problem route', async () => {
    const { default: config } = await import('@/next.config');
    const redirects = await config.redirects?.();

    expect(redirects).toContainEqual({
      source: '/p/:path*',
      destination: '/problem/:path*',
      permanent: true,
    });
  });
});
