import { alova } from '@/api/server';
import type { BackendError } from '@/shared/types/sudo';

export type PasswordResetPageData = {
  uname: string;
};

export const getPasswordReset = (code: string) =>
  alova.Get<PasswordResetPageData | BackendError>(
    `/lostpass/${encodeURIComponent(code)}`,
    { cacheFor: 0 }
  );
