import { alova } from '@/api/server';
import type { AccountSettingsData } from '@/shared/types/account-settings';
import type { Errorable } from '@/shared/types/error';

export type AccountSettingsResponse =
  Errorable<AccountSettingsData> | { url: string };

export const getAccountSettings = () =>
  alova.Get<AccountSettingsResponse>('/home/settings/account');
