import ClientApis from '@/api/client/method';
import {
  isAuthSessionPath,
  isSudoRequired,
  throwBackendError,
} from '@/shared/lib/backend-response';
import { safeSudoPath } from '@/shared/lib/sudo-navigation';
import type { SudoResult } from '@/shared/types/sudo';

export async function resumeSudo(
  result: SudoResult,
  origin: string,
  failureMessage: string
) {
  const target = safeSudoPath(
    'url' in result ? result.url : result.redirect,
    origin
  );
  if (!target) throw new Error(failureMessage);
  if ('url' in result) return target;
  const method = result.method?.toLowerCase();
  if (method === 'get') return target;
  if (isAuthSessionPath(target)) throw new Error(failureMessage);
  // The legacy handler clears sudoArgs.method after assigning it to the response body.
  if (method && method !== 'post') throw new Error(failureMessage);
  const response = await ClientApis.Auth.resumeSudoAction(
    target,
    result.args
  ).send();
  throwBackendError(response);
  if (isSudoRequired(response)) throw new Error(failureMessage);
  if ('url' in response) {
    const path =
      typeof response.url === 'string'
        ? safeSudoPath(response.url, origin)
        : null;
    if (!path) throw new Error(failureMessage);
    return path;
  }
  return target;
}
