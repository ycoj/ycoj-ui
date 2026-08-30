import ClientApis from '@/api/client/method';
import {
  isSudoRequired,
  matchesBackendPath,
  throwBackendError,
} from '@/shared/lib/backend-response';
import type { AccountExpirationAction } from '@/shared/types/account-expiration';

export async function submitExpiration(
  action: AccountExpirationAction,
  failureMessage: string
) {
  const api = ClientApis.AccountExpiration;
  const response = await (
    action.operation === 'set'
      ? api.setAccountExpiration(action.uids, action.expireDate)
      : action.operation === 'adjust'
        ? api.adjustAccountExpiration(action.uids, action.days)
        : api.clearAccountExpiration(action.uids)
  ).send();
  throwBackendError(response);
  if (isSudoRequired(response)) return 'sudo';
  if (
    !('url' in response) ||
    !matchesBackendPath(response.url, '/manage/user-expiration')
  )
    throw new Error(failureMessage);
  return 'success';
}
