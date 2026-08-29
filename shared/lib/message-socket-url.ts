export function createMessageSocketUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_WEBSOCKET_BASEURL;
  if (!base) return null;

  let url: URL;
  try {
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    url = new URL('websocket', normalizedBase);
  } catch {
    return null;
  }

  if (url.protocol === 'https:') url.protocol = 'wss:';
  else if (url.protocol === 'http:') url.protocol = 'ws:';
  if (url.protocol !== 'wss:' && url.protocol !== 'ws:') return null;

  if (typeof window !== 'undefined' && url.host !== window.location.host) {
    const sid = document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith('sid='))
      ?.slice('sid='.length);
    if (sid) url.searchParams.set('sid', sid);
  }

  return url.toString();
}
