import AppLayout from './layout';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getNavInfos: vi.fn() }));

vi.mock('@/features/user/lib/get-user', () => ({
  getNavInfos: mocks.getNavInfos,
}));
vi.mock('@/features/message/message-realtime-provider', () => ({
  default: () => null,
}));
vi.mock('@/features/navigation/app-frame', () => ({ default: () => null }));
vi.mock('@/features/realname/realname-reminder', () => ({
  default: () => null,
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AppLayout access', () => {
  it.each([undefined, null, { _id: 0, priv: 0 }])(
    'redirects unauthenticated users to login (%j)',
    async (user) => {
      mocks.getNavInfos.mockResolvedValue({ navItems: [], user });

      await expect(AppLayout({ children: null })).rejects.toThrow(
        'redirect:/login'
      );
    }
  );

  it('keeps the realname redirect for authenticated unverified users', async () => {
    mocks.getNavInfos.mockResolvedValue({
      navItems: [],
      user: { _id: 2, priv: 0, realnameStatus: 'none' },
    });

    await expect(AppLayout({ children: null })).rejects.toThrow(
      'redirect:/home/realname'
    );
  });

  it('renders the layout for authenticated approved users', async () => {
    mocks.getNavInfos.mockResolvedValue({
      navItems: [],
      user: { _id: 2, priv: 0, realnameStatus: 'approved', unreadMsg: 3 },
    });

    const layout = await AppLayout({ children: 'Home content' });

    expect(layout.props).toMatchObject({ userId: 2, initialUnread: 3 });
    expect(layout.props.children.props.children).toBe('Home content');
  });
});
