import avatarUrl from '@/features/user/lib/avatar-url';
import 'server-only';

const AVATAR_HOSTS = new Set([
  'gravatar.loli.net',
  'gravatar.com',
  'secure.gravatar.com',
  'github.com',
  'avatars.githubusercontent.com',
  'q1.qlogo.cn',
]);

export async function loadExportAvatar(avatar: string, signal: AbortSignal) {
  const source = avatarUrl(avatar);
  if (!source) return '';
  try {
    let url = new URL(source.startsWith('//') ? `https:${source}` : source);
    const timeout = AbortSignal.any([signal, AbortSignal.timeout(5000)]);
    for (let redirects = 0; redirects < 4; redirects++) {
      if (url.protocol !== 'https:' || !AVATAR_HOSTS.has(url.hostname))
        return '';
      const response = await fetch(url, {
        signal: timeout,
        redirect: 'manual',
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        await response.body?.cancel();
        if (!location) return '';
        url = new URL(location, url);
        continue;
      }
      if (!response.ok) return '';
      const mime = response.headers.get('content-type')?.split(';')[0];
      if (!mime || !['image/png', 'image/jpeg', 'image/gif'].includes(mime)) {
        await response.body?.cancel();
        return '';
      }
      return `data:${mime};base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`;
    }
  } catch {
    signal.throwIfAborted();
  }
  return '';
}
