import Homepage from '@/features/homepage/homepage';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getHomepage: vi.fn(),
}));

vi.mock('@/features/user/lib/get-user', () => ({ getUser: mocks.getUser }));
vi.mock('@/api/server/method', () => ({
  default: { UI: { getHomepage: mocks.getHomepage } },
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock('./components/banner', () => ({ default: () => null }));
vi.mock('./components/blogs', () => ({ default: () => null }));
vi.mock('./components/bulletin', () => ({ default: () => null }));
vi.mock('./components/contests', () => ({ default: () => null }));
vi.mock('./components/countdown', () => ({ default: () => null }));
vi.mock('./components/daily-checkin', () => ({ default: () => null }));
vi.mock('./components/discussions', () => ({ default: () => null }));
vi.mock('./components/suggestions', () => ({ default: () => null }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('Homepage access', () => {
  it.each([undefined, null, { _id: 0, uname: 'guest' }])(
    'redirects guests before reading homepage data (%j)',
    async (user) => {
      mocks.getUser.mockResolvedValue(user);
      mocks.getHomepage.mockResolvedValue({ url: '/login' });

      await expect(Homepage()).rejects.toThrow('redirect:/login');
      expect(mocks.getHomepage).toHaveBeenCalledTimes(1);
    }
  );

  it('requests homepage data while the user check is pending', async () => {
    let resolveUser!: (user: undefined) => void;
    mocks.getUser.mockReturnValue(
      new Promise<undefined>((resolve) => {
        resolveUser = resolve;
      })
    );
    mocks.getHomepage.mockResolvedValue({ url: '/login' });

    const result = Homepage();
    expect(mocks.getUser).toHaveBeenCalledTimes(1);
    expect(mocks.getHomepage).toHaveBeenCalledTimes(1);

    resolveUser(undefined);

    await expect(result).rejects.toThrow('redirect:/login');
    expect(mocks.getHomepage).toHaveBeenCalledTimes(1);
  });

  it.each([
    { contents: [], expected: {} },
    {
      contents: [{ sections: [['banner', { pictures: [] }]] }],
      expected: { banner: { pictures: [] } },
    },
  ])('preserves homepage data for authenticated users (%j)', async (data) => {
    const homepage = {
      contents: data.contents,
      udict: {},
      domain: { bulletin: 'Welcome' },
      checkin: { canCheckin: true, record: null, streak: 0 },
    };
    mocks.getUser.mockResolvedValue({ _id: 2, uname: 'alice' });
    mocks.getHomepage.mockResolvedValue(homepage);

    const page = await Homepage();

    expect(mocks.getHomepage).toHaveBeenCalledTimes(1);
    expect(page.props.left.props).toMatchObject({
      contents: data.expected,
      udict: homepage.udict,
      bulletin: 'Welcome',
    });
    expect(page.props.right.props).toMatchObject({
      contents: data.expected,
      udict: homepage.udict,
      checkin: homepage.checkin,
      username: 'alice',
    });
  });
});
