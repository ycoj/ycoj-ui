const HOME_PATH = '/home';

/**
 * Picks the post-login destination. An explicit `redirect` parameter wins;
 * otherwise the user returns to the same-site page that referred them to the
 * login page, falling back to `/home` for external or login referrers.
 */
export function resolveLoginRedirect(
  referrer: string,
  origin: string,
  explicitRedirect?: string | null
): string {
  if (explicitRedirect) return explicitRedirect;
  if (!referrer) return HOME_PATH;

  let url: URL;
  try {
    url = new URL(referrer);
  } catch {
    return HOME_PATH;
  }

  if (url.origin !== origin) return HOME_PATH;
  if (url.pathname === '/login' || url.pathname.startsWith('/login/'))
    return HOME_PATH;

  const target = `${url.pathname}${url.search}${url.hash}`;
  if (target.startsWith('//') || target.includes('\\')) return HOME_PATH;

  return target;
}
