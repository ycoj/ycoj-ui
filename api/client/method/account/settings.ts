import { clientRequest, uploadClientRequest } from '@/api/client';
import type {
  AccountSettingValue,
  AvatarProvider,
} from '@/shared/types/account-settings';
import type { Errorable } from '@/shared/types/error';

export type AccountMutationResponse = Errorable<{ url: string }>;

export const saveAccountSettings = (
  values: Record<string, AccountSettingValue>
) => {
  // The legacy settings handler recognizes only "on" as a true boolean.
  const fields = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      value === true ? 'on' : value,
    ])
  );
  return clientRequest.Post<AccountMutationResponse>('/home/settings/account', {
    ...fields,
    category: 'account',
  });
};

export const updateAvatar = (provider: AvatarProvider, identifier: string) =>
  clientRequest.Post<AccountMutationResponse>('/home/avatar', {
    avatar: `${provider}:${identifier.trim()}`,
  });

export const uploadAvatar = (file: File) => {
  const data = new FormData();
  data.append('file', file);
  return uploadClientRequest.Post<AccountMutationResponse>(
    '/home/avatar',
    data
  );
};
