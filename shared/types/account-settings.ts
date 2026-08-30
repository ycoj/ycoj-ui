import type { BaseUser } from './user';

export const SETTING_FLAG = {
  HIDDEN: 1,
  DISABLED: 2,
  SECRET: 4,
  PRO: 8,
  PUBLIC: 16,
  PRIVATE: 32,
} as const;

export type AccountSettingType =
  | 'text'
  | 'password'
  | 'number'
  | 'float'
  | 'select'
  | 'textarea'
  | 'markdown'
  | 'boolean'
  | 'json'
  | 'yaml';

export type AccountSetting = {
  family: string;
  key: string;
  value: unknown;
  type: AccountSettingType;
  name: string;
  desc?: string | null;
  flag: number;
  subType?: string;
  range?: [string, string][] | Record<string, string> | null;
};

export type AccountSettingsData = {
  category: 'account';
  current: BaseUser;
  settings: AccountSetting[];
};

export type AccountSettingValue = string | number | boolean;
export type AvatarProvider = 'gravatar' | 'github' | 'qq';
