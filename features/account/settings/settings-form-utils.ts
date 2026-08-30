import {
  SETTING_FLAG,
  type AccountSetting,
  type AccountSettingValue,
} from '@/shared/types/account-settings';
import { z } from 'zod';

export const settingsFormSchema = z.object({
  fields: z.array(z.object({ value: z.union([z.string(), z.boolean()]) })),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export const getVisibleSettings = (settings: AccountSetting[]) =>
  settings.filter(
    (setting) =>
      setting.key !== 'avatar' &&
      setting.family !== 'setting_storage' &&
      !(setting.flag & SETTING_FLAG.HIDDEN)
  );

export function getSettingValue(
  setting: AccountSetting,
  current: Record<string, unknown>
) {
  if (setting.flag & SETTING_FLAG.SECRET) return '';
  const value = current[setting.key] ?? setting.value;
  if (setting.type === 'boolean') return Boolean(value);
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

export const getSettingsFormValues = (
  settings: AccountSetting[],
  current: Record<string, unknown>
): SettingsFormValues => ({
  fields: settings.map((setting) => ({
    value: getSettingValue(setting, current),
  })),
});

export const getSettingsPayload = (
  settings: AccountSetting[],
  values: SettingsFormValues
): Record<string, AccountSettingValue> =>
  Object.fromEntries(
    settings.flatMap((setting, index) => {
      if (setting.flag & (SETTING_FLAG.HIDDEN | SETTING_FLAG.DISABLED))
        return [];
      const value = values.fields[index].value;
      if (setting.flag & SETTING_FLAG.SECRET && !value) return [];
      return [[setting.key, value]];
    })
  );

export const getSettingOptions = (
  setting: AccountSetting
): [string, string][] =>
  Array.isArray(setting.range)
    ? setting.range
    : Object.entries(setting.range ?? {});

export function groupSettings(settings: AccountSetting[]) {
  const groups = new Map<
    string,
    { setting: AccountSetting; index: number }[]
  >();
  settings.forEach((setting, index) => {
    const fields = groups.get(setting.family) ?? [];
    fields.push({ setting, index });
    groups.set(setting.family, fields);
  });
  const infoOrder = ['qq', 'gender', 'phone', 'school', 'studentId'];
  const infoRank = (key: string) => {
    const index = infoOrder.indexOf(key);
    return index === -1 ? infoOrder.length : index;
  };
  return Array.from(groups, ([family, fields]) => ({
    family,
    fields:
      family === 'setting_info'
        ? fields.sort(
            (a, b) => infoRank(a.setting.key) - infoRank(b.setting.key)
          )
        : fields,
  }));
}
