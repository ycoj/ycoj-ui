import type { BackendError } from '@/shared/types/sudo';

export function throwBackendError(response: object) {
  if ('error' in response)
    throw new Error((response as BackendError).error.message);
}

export function matchesBackendPath(url: string, path: string) {
  try {
    return new URL(url, 'https://backend.invalid').pathname === path;
  } catch {
    return false;
  }
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
