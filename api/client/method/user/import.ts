import { clientRequest } from '@/api/client';
import type { BackendError, BackendRedirect } from '@/shared/types/sudo';

export type ImportUser = {
  email: string;
  username: string;
  displayName?: string;
};

export type UserImportResult = {
  users: ImportUser[];
  messages: string[];
};

export const importUsers = (users: string, draft: boolean) =>
  clientRequest.Post<UserImportResult | BackendError | BackendRedirect>(
    '/manage/userimport',
    { users, draft }
  );
