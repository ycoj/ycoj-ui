import { clientRequest } from '@/api/client';
import type { BackendError, BackendRedirect } from '@/shared/types/sudo';

export type PasswordResetComplete = {
  code: string;
  password: string;
  verifyPassword: string;
};

const resetPath = (code: string) => `/lostpass/${encodeURIComponent(code)}`;

export const requestPasswordReset = (mail: string) =>
  clientRequest.Post<BackendRedirect | BackendError | Record<string, never>>(
    '/lostpass',
    { mail }
  );

export const completePasswordReset = ({
  code,
  password,
  verifyPassword,
}: PasswordResetComplete) =>
  clientRequest.Post<BackendRedirect | BackendError>(resetPath(code), {
    password,
    verifyPassword,
  });
