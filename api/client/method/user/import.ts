import { clientRequest } from '@/api/client';
import type { BackendError, BackendRedirect } from '@/shared/types/sudo';

// The response also carries `password` and any extra payload keys; they are
// intentionally dropped at this boundary so secrets stay out of the UI.
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
