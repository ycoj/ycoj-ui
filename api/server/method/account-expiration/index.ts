import { alova } from '@/api/server';
import type { AccountExpirationResponse } from '@/shared/types/account-expiration';

export const getAccountExpirations = (page = 1, q = '') =>
  alova.Get<AccountExpirationResponse>('/manage/user-expiration', {
    params: { page, q },
    cacheFor: 0,
  });

const AccountExpiration = { getAccountExpirations };
export default AccountExpiration;
