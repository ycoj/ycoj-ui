import { resumeSudo } from './resume-sudo';
import { safeSudoPath } from '@/shared/lib/sudo-navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ resume: vi.fn(), send: vi.fn() }));
vi.mock('@/api/client/method', () => ({
  default: { Auth: { resumeSudoAction: mocks.resume } },
}));
const origin = 'https://ui.example';

describe('global sudo continuation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.resume.mockReturnValue({ send: mocks.send });
    mocks.send.mockResolvedValue({
      url: `${origin}/manage/user-expiration?q=alice&page=2`,
    });
  });
  it('returns directly to the original GET page including its query', async () => {
    await expect(
      resumeSudo(
        { url: '/manage/user-expiration?q=alice&page=2' },
        origin,
        'failed'
      )
    ).resolves.toBe('/manage/user-expiration?q=alice&page=2');
    expect(mocks.resume).not.toHaveBeenCalled();
  });
  it.each(['post', 'POST', null])(
    'restores a backend-held POST exactly once when method is %s',
    async (method) => {
      const args = {
        operation: 'adjust',
        uids: [1, 2],
        days: -3,
        domainId: 'system',
      };
      await expect(
        resumeSudo(
          { method, redirect: '/manage/user-expiration', args },
          origin,
          'failed'
        )
      ).resolves.toBe('/manage/user-expiration?q=alice&page=2');
      expect(mocks.resume).toHaveBeenCalledExactlyOnceWith(
        '/manage/user-expiration',
        args
      );
    }
  );
  it('supports other protected modules rather than only account expiration', async () => {
    mocks.send.mockResolvedValue({ url: '/manage/setting' });
    await expect(
      resumeSudo(
        {
          method: 'post',
          redirect: '/manage/setting',
          args: { name: 'value' },
        },
        origin,
        'failed'
      )
    ).resolves.toBe('/manage/setting');
    expect(mocks.resume).toHaveBeenCalledWith('/manage/setting', {
      name: 'value',
    });
  });
  it('does not replay GET metadata', async () => {
    await expect(
      resumeSudo(
        { method: 'get', redirect: '/home/settings/account', args: {} },
        origin,
        'failed'
      )
    ).resolves.toBe('/home/settings/account');
    expect(mocks.resume).not.toHaveBeenCalled();
  });
  it('does not retry a network failure', async () => {
    mocks.send.mockRejectedValue(new Error('Offline'));
    await expect(
      resumeSudo(
        { method: null, redirect: '/manage/user-expiration', args: {} },
        origin,
        'failed'
      )
    ).rejects.toThrow('Offline');
    expect(mocks.resume).toHaveBeenCalledOnce();
  });
  it.each([
    { error: { message: 'Forbidden' } },
    { url: '/user/sudo' },
    { url: 'https://evil.example/' },
  ])('does not follow or retry failed continuations %j', async (response) => {
    mocks.send.mockResolvedValue(response);
    await expect(
      resumeSudo(
        { method: null, redirect: '/manage/user-expiration', args: {} },
        origin,
        'failed'
      )
    ).rejects.toThrow();
    expect(mocks.resume).toHaveBeenCalledOnce();
  });
  it.each([
    'https://evil.example/action',
    '//evil.example/action',
    '/\\evil.example/action',
    'javascript:alert(1)',
    '/user/sudo',
    '/d/system/user/sudo',
    '',
  ])('rejects unsafe or looping targets: %s', async (redirect) => {
    expect(safeSudoPath(redirect, origin)).toBeNull();
    await expect(
      resumeSudo({ method: 'post', redirect, args: {} }, origin, 'failed')
    ).rejects.toThrow('failed');
    expect(mocks.resume).not.toHaveBeenCalled();
  });
  it.each([
    '/login',
    '/logout',
    '/register',
    '/user/webauthn',
    '/d/system/logout',
    '/d/foo/user/webauthn',
  ])('does not replay POST to auth session paths: %s', async (redirect) => {
    await expect(
      resumeSudo({ method: 'post', redirect, args: {} }, origin, 'failed')
    ).rejects.toThrow('failed');
    expect(mocks.resume).not.toHaveBeenCalled();
  });
  it.each(['/login', '/logout', '/d/system/register', '/user/webauthn'])(
    'still allows GET navigation to %s',
    async (url) => {
      await expect(resumeSudo({ url }, origin, 'failed')).resolves.toBe(url);
      await expect(
        resumeSudo({ method: 'get', redirect: url, args: {} }, origin, 'failed')
      ).resolves.toBe(url);
      expect(mocks.resume).not.toHaveBeenCalled();
    }
  );
});
