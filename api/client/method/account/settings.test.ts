import { saveAccountSettings, updateAvatar, uploadAvatar } from './settings';
import { uploadClientRequest } from '@/api/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('account settings requests', () => {
  it('posts account fields and explicitly encodes both boolean states for the legacy handler', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ url: '/home/settings/account' }))
      );
    vi.stubGlobal('fetch', fetchMock);
    await saveAccountSettings({
      qq: '12345',
      bio: '# Hello',
      'plugin.enabled': true,
      hidden: false,
    }).send();
    const [url, config] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/home/settings/account');
    expect(config.credentials).toBe('include');
    expect(JSON.parse(config.body)).toEqual({
      category: 'account',
      qq: '12345',
      bio: '# Hello',
      'plugin.enabled': 'on',
      hidden: false,
    });
  });

  it.each(['gravatar', 'github', 'qq'] as const)(
    'encodes the %s avatar provider',
    (provider) => {
      const method = updateAvatar(provider, ' example ');
      expect(method.url).toBe('/home/avatar');
      expect(method.data).toEqual({ avatar: `${provider}:example` });
    }
  );

  it.each([
    ['avatar.jpg', 'image/jpeg'],
    ['avatar.jpeg', 'image/jpeg'],
    ['avatar.png', 'image/png'],
  ])('uploads %s through the existing multipart adapter', (name, type) => {
    const post = vi.spyOn(uploadClientRequest, 'Post');
    const file = new File(['image'], name, { type });
    const method = uploadAvatar(file);
    expect(post).toHaveBeenCalledWith('/home/avatar', expect.any(FormData));
    expect(method.data).toBeInstanceOf(FormData);
    const data = method.data as FormData;
    expect(Array.from(data.keys())).toEqual(['file']);
    expect(data.get('file')).toBe(file);
    expect((data.get('file') as File).type).toBe(type);
  });
});
