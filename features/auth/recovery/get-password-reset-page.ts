import ServerApis from '@/api/server/method';
import {
  BackendResponseError,
  throwBackendError,
} from '@/shared/lib/backend-response';
import { getTranslations } from 'next-intl/server';
import { unstable_rethrow } from 'next/navigation';
import { cache } from 'react';
import 'server-only';

export type PasswordResetPageState =
  { kind: 'data'; username: string } | { kind: 'error'; message: string };

export const getPasswordResetPage = cache(
  async (code: string): Promise<PasswordResetPageState> => {
    const t = await getTranslations('auth');
    try {
      const response = await ServerApis.Auth.getPasswordReset(code);
      throwBackendError(response);
      if ('uname' in response && typeof response.uname === 'string')
        return { kind: 'data', username: response.uname };
      return { kind: 'error', message: t('resetTokenInvalid') };
    } catch (error) {
      unstable_rethrow(error);
      return {
        kind: 'error',
        message:
          error instanceof BackendResponseError && error.message
            ? error.message
            : t('resetTokenInvalid'),
      };
    }
  }
);
