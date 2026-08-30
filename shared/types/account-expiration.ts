import type { BackendError, BackendRedirect } from '@/shared/types/sudo';
import type { BaseUser } from '@/shared/types/user';

export type AccountExpirationUser = BaseUser & {
  priv: number;
  accountExpireDate: string;
  accountExpired: boolean;
  accountAutoExpired: boolean;
  accountExpirationProtected: boolean;
};

export type AccountExpirationData = {
  udocs: AccountExpirationUser[];
  page: number;
  numPages: number;
  count: number;
  q: string;
};

export type AccountExpirationResponse =
  AccountExpirationData | BackendRedirect | BackendError;

export type AccountExpirationAction =
  | { operation: 'set'; uids: number[]; expireDate: string }
  | { operation: 'adjust'; uids: number[]; days: number }
  | { operation: 'clear'; uids: number[] };
