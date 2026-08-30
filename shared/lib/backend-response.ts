import parseErrorMessage from '@/shared/components/errored/parse-message';

const DOMAIN_PREFIX = /^\/d\/[^/]+(?=\/)/;
const AUTH_SESSION_PATHS = new Set([
  '/login',
  '/logout',
  '/register',
  '/user/sudo',
  '/user/webauthn',
]);

export class BackendResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackendResponseError';
  }
}

export function throwBackendError(response: object) {
  if (!('error' in response)) return;
  const error = (response as { error: unknown }).error;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string' && message) {
      const params = (error as { params?: unknown }).params;
      const name = (error as { name?: unknown }).name;
      throw new BackendResponseError(
        parseErrorMessage({
          message,
          name: typeof name === 'string' ? name : 'Error',
          params: Array.isArray(params)
            ? params.map((value) => String(value))
            : undefined,
        })
      );
    }
  }
  throw new BackendResponseError(
    error == null ? 'Request failed' : String(error)
  );
}

export function normalizeBackendPathname(pathname: string) {
  return pathname.replace(DOMAIN_PREFIX, '');
}

export function backendPathname(url: string) {
  try {
    return normalizeBackendPathname(
      new URL(url, 'https://backend.invalid').pathname
    );
  } catch {
    return null;
  }
}

export function matchesBackendPath(url: string, path: string) {
  return backendPathname(url) === path;
}

export function isSudoRequired(response: unknown) {
  return (
    typeof response === 'object' &&
    response !== null &&
    'url' in response &&
    typeof response.url === 'string' &&
    matchesBackendPath(response.url, '/user/sudo')
  );
}

export function isLoginRedirect(url: string) {
  const pathname = backendPathname(url);
  return pathname === '/login' || Boolean(pathname?.startsWith('/login'));
}

export function isAuthSessionPath(url: string) {
  const pathname = backendPathname(url);
  return pathname !== null && AUTH_SESSION_PATHS.has(pathname);
}
