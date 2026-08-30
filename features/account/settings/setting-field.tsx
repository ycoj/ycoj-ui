'use client';

import {
  getSettingOptions,
  type SettingsFormValues,
} from './settings-form-utils';
import MarkdownEditor from '@/shared/components/markdown-editor';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/utils';
import {
  SETTING_FLAG,
  type AccountSetting,
} from '@/shared/types/account-settings';
import { useTranslations } from 'next-intl';
import { Controller, type Control } from 'react-hook-form';

type Props = {
  setting: AccountSetting;
  index: number;
  control: Control<SettingsFormValues>;
  saving: boolean;
};

const builtinFields = new Set([
  'qq',
  'gender',
  'bio',
  'school',
  'studentId',
  'phone',
  'backgroundImage',
]);

export default function SettingField({
  setting,
  index,
  control,
  saving,
}: Props) {
  const t = useTranslations('accountSettings');
  const builtin = builtinFields.has(setting.key);
  const label = builtin
    ? t(`fields.${setting.key}`)
    : setting.name || setting.key;
  const description =
    builtin && t.has(`help.${setting.key}`)
      ? t(`help.${setting.key}`)
      : setting.desc;
  const disabled = saving || Boolean(setting.flag & SETTING_FLAG.DISABLED);
  const secret = Boolean(setting.flag & SETTING_FLAG.SECRET);
  const id = `account-field-${index}`;
  const isBoolean = setting.type === 'boolean';
  const options = getSettingOptions(setting);
  const fullWidth =
    ['markdown', 'textarea', 'json', 'yaml'].includes(setting.type) ||
    setting.key === 'backgroundImage';
  const schoolField = setting.key === 'school' || setting.key === 'studentId';

  return (
    <Field
      className={cn(
        'min-w-0 gap-2',
        fullWidth
          ? 'sm:col-span-6'
          : schoolField
            ? 'sm:col-span-3'
            : 'sm:col-span-3 xl:col-span-2'
      )}
      data-disabled={disabled}
      data-llm-visible="true"
    >
      <FieldLabel id={`${id}-label`} htmlFor={id} data-llm-text={label}>
        {label}
      </FieldLabel>
      <Controller
        name={`fields.${index}.value`}
        control={control}
        render={({ field }) => {
          const common = {
            id,
            disabled,
            'aria-describedby': description ? `${id}-description` : undefined,
          };
          if (isBoolean)
            return (
              <Checkbox
                {...common}
                ref={field.ref}
                checked={field.value === true}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                onBlur={field.onBlur}
              />
            );
          if (setting.type === 'select')
            return (
              <Select
                value={String(
                  options.findIndex(([value]) => value === String(field.value))
                )}
                onValueChange={(value) =>
                  field.onChange(options[Number(value)][0])
                }
                disabled={disabled}
              >
                <SelectTrigger
                  {...common}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  className="h-9 w-full"
                >
                  <SelectValue placeholder={t('selectPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {options.map(([value, text], optionIndex) => (
                    <SelectItem key={value} value={String(optionIndex)}>
                      {setting.key === 'gender' && t.has(`gender.${value}`)
                        ? t(`gender.${value}`)
                        : text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          if (setting.type === 'markdown')
            return (
              <div role="group" aria-labelledby={`${id}-label`}>
                <MarkdownEditor
                  {...field}
                  {...common}
                  value={String(field.value)}
                  className="h-56! min-h-0! shadow-none"
                  onChange={async (event) => field.onChange(event)}
                  onBlur={async () => field.onBlur()}
                />
              </div>
            );
          const textProps = {
            ...field,
            ...common,
            value: String(field.value),
            placeholder: secret ? t('unchanged') : undefined,
          };
          if (['textarea', 'json', 'yaml'].includes(setting.type))
            return (
              <Textarea
                {...textProps}
                rows={4}
                className="field-sizing-fixed min-h-24 shadow-none"
              />
            );
          const numeric = setting.type === 'number' || setting.type === 'float';
          return (
            <Input
              {...textProps}
              className="h-9"
              type={
                secret || setting.type === 'password'
                  ? 'password'
                  : numeric
                    ? 'number'
                    : 'text'
              }
              step={setting.type === 'float' ? 'any' : numeric ? 1 : undefined}
            />
          );
        }}
      />
      {description && (
        <FieldDescription
          className="text-xs"
          id={`${id}-description`}
          data-llm-text={description}
        >
          {description}
        </FieldDescription>
      )}
    </Field>
  );
}
