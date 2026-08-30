import {
  getSettingOptions,
  getSettingsFormValues,
  getSettingsPayload,
  getVisibleSettings,
  groupSettings,
} from './settings-form-utils';
import {
  SETTING_FLAG,
  type AccountSetting,
} from '@/shared/types/account-settings';
import { describe, expect, it } from 'vitest';

const setting = (
  key: string,
  overrides: Partial<AccountSetting> = {}
): AccountSetting => ({
  key,
  name: key,
  family: 'setting_info',
  type: 'text',
  value: '',
  flag: 0,
  ...overrides,
});

describe('account settings form values', () => {
  it('keeps related built-in fields together without changing form indices or plugin order', () => {
    const settings = [
      setting('qq'),
      setting('gender'),
      setting('bio', { type: 'markdown' }),
      setting('school'),
      setting('studentId'),
      setting('phone'),
      setting('plugin.notes', { family: 'Plugin', type: 'textarea' }),
      setting('plugin.count', { family: 'Plugin', type: 'number' }),
    ];
    const groups = groupSettings(settings);
    expect(
      groups[0].fields.map(({ setting, index }) => [setting.key, index])
    ).toEqual([
      ['qq', 0],
      ['gender', 1],
      ['phone', 5],
      ['school', 3],
      ['studentId', 4],
      ['bio', 2],
    ]);
    expect(groups[1].fields.map(({ setting }) => setting.key)).toEqual([
      'plugin.notes',
      'plugin.count',
    ]);
    expect(settings[2].key).toBe('bio');
  });

  it('excludes hidden/storage/avatar fields and groups plugins by family', () => {
    const visible = getVisibleSettings([
      setting('qq'),
      setting('avatar'),
      setting('hidden', { flag: SETTING_FLAG.HIDDEN }),
      setting('storage', { family: 'setting_storage' }),
      setting('plugin.field', { family: 'Plugin' }),
    ]);
    expect(
      groupSettings(visible).map(({ family, fields }) => [
        family,
        fields.map(({ setting }) => setting.key),
      ])
    ).toEqual([
      ['setting_info', ['qq']],
      ['Plugin', ['plugin.field']],
    ]);
  });

  it('preserves false, zero and empty string, defaults missing fields, and never exposes secrets', () => {
    const settings = [
      setting('flag', { type: 'boolean', value: true }),
      setting('count', { type: 'number', value: 42 }),
      setting('bio', { value: 'default' }),
      setting('fallback', { value: 'default' }),
      setting('secret', { flag: SETTING_FLAG.SECRET }),
    ];
    expect(
      getSettingsFormValues(settings, {
        flag: false,
        count: 0,
        bio: '',
        secret: 'private',
      }).fields.map(({ value }) => value)
    ).toEqual([false, '0', '', 'default', '']);
  });

  it('omits disabled and unchanged secret fields while keeping dotted keys flat and booleans explicit', () => {
    const settings = [
      setting('plugin.enabled', { type: 'boolean' }),
      setting('off', { type: 'boolean' }),
      setting('locked', { flag: SETTING_FLAG.DISABLED }),
      setting('secret', { flag: SETTING_FLAG.SECRET }),
    ];
    const values = getSettingsFormValues(settings, {
      'plugin.enabled': true,
      off: false,
      locked: 'cannot change',
    });
    expect(getSettingsPayload(settings, values)).toEqual({
      'plugin.enabled': true,
      off: false,
    });
  });

  it('accepts both dictionary and tuple-list select options', () => {
    expect(
      getSettingOptions(setting('choice', { range: { '0': 'Zero' } }))
    ).toEqual([['0', 'Zero']]);
    expect(
      getSettingOptions(
        setting('choice', {
          range: [
            ['', 'None'],
            ['x', 'X'],
          ],
        })
      )
    ).toEqual([
      ['', 'None'],
      ['x', 'X'],
    ]);
  });
});
