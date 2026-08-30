import { clientRequest } from '@/api/client';
import type { BackendError, BackendRedirect } from '@/shared/types/sudo';

export type AccountExpirationMutationResponse = BackendRedirect | BackendError;

export const setAccountExpiration = (uids: number[], expireDate: string) =>
  clientRequest.Post<AccountExpirationMutationResponse>(
    '/manage/user-expiration',
    { operation: 'set', uids, expireDate }
  );

export const adjustAccountExpiration = (uids: number[], days: number) =>
  clientRequest.Post<AccountExpirationMutationResponse>(
    '/manage/user-expiration',
    { operation: 'adjust', uids, days }
  );

export const clearAccountExpiration = (uids: number[]) =>
  clientRequest.Post<AccountExpirationMutationResponse>(
    '/manage/user-expiration',
    { operation: 'clear', uids }
  );

const AccountExpiration = {
  setAccountExpiration,
  adjustAccountExpiration,
  clearAccountExpiration,
};
export default AccountExpiration;
