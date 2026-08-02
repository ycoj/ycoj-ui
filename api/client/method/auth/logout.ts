import { clientRequest } from '@/api/client';

export type LogoutResponse = {
  url: string;
};
export const logout = () =>
  clientRequest.Post<LogoutResponse>('/logout', {}, { timeout: 10_000 });
