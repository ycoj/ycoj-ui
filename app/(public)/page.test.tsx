import IndexPage from './page';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  landingPage: vi.fn(),
}));

vi.mock('@/features/landing/landing-page', () => ({
  default: mocks.landingPage,
}));
vi.mock('@/features/user/lib/get-user', () => ({
  getUser: mocks.getUser,
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Public landing page access', () => {
  it.each([undefined, null, { _id: 0 }])(
    'renders the landing page for a guest (%j)',
    async (user) => {
      mocks.getUser.mockResolvedValue(user);

      const page = await IndexPage();

      expect(page.type).toBe(mocks.landingPage);
      expect(page.props).toEqual({ siteName: process.env.SITE_NAME ?? '' });
    }
  );

  it('redirects authenticated users to their home page', async () => {
    mocks.getUser.mockResolvedValue({ _id: 42 });

    await expect(IndexPage()).rejects.toThrow('redirect:/home');
  });
});
