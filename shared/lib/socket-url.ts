export type RecordSocketPath = '/record-conn' | '/record-detail-conn';

export type SocketUrlParams = Record<
  string,
  string | number | boolean | undefined
>;

export function createRecordSocketUrl(
  path: RecordSocketPath,
  params: SocketUrlParams
): string | null {
  const base = process.env.NEXT_PUBLIC_WEBSOCKET_BASEURL;
  if (!base) return null;

  let url: URL;
  try {
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    url = new URL(path.replace(/^\//, ''), normalizedBase);
  } catch {
    return null;
  }

  if (url.protocol === 'https:') url.protocol = 'wss:';
  else if (url.protocol === 'http:') url.protocol = 'ws:';
  if (url.protocol !== 'wss:' && url.protocol !== 'ws:') return null;

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    url.searchParams.set(
      key,
      typeof value === 'boolean' ? (value ? '1' : '0') : String(value)
    );
  }
  url.searchParams.set('noTemplate', '1');

  if (typeof window !== 'undefined' && url.host !== window.location.host) {
    const sid = document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith('sid='))
      ?.slice('sid='.length);
    if (sid) url.searchParams.set('sid', sid);
  }

  return url.toString();
}
