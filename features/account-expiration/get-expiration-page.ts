import ServerApis from '@/api/server/method';
import {
  isSudoRequired,
  throwBackendError,
} from '@/shared/lib/backend-response';
import type { AccountExpirationData } from '@/shared/types/account-expiration';
import { getTranslations } from 'next-intl/server';
import { redirect, unstable_rethrow } from 'next/navigation';
import { cache } from 'react';
import 'server-only';

export type ExpirationPageState =
  | { kind: 'data'; data: AccountExpirationData }
  | { kind: 'error'; message: string };

export const getExpirationPage = cache(
  async (page: number, q: string): Promise<ExpirationPageState> => {
    const t = await getTranslations('accountExpiration');
    try {
      const response = await ServerApis.AccountExpiration.getAccountExpirations(
        page,
        q
      );
      throwBackendError(response);
      if (isSudoRequired(response)) redirect('/user/sudo');
      if ('udocs' in response) return { kind: 'data', data: response };
      return { kind: 'error', message: t('loadFailed') };
    } catch (error) {
      unstable_rethrow(error);
      return {
        kind: 'error',
        message:
          error instanceof Error && error.message
            ? error.message
            : t('loadFailed'),
      };
    }
  }
);
