'use client';

import SettingField from './setting-field';
import {
  getSettingsFormValues,
  getSettingsPayload,
  getVisibleSettings,
  groupSettings,
  settingsFormSchema,
  type SettingsFormValues,
} from './settings-form-utils';
import SettingsSection from './settings-section';
import ClientApis from '@/api/client/method';
import parseErrorMessage from '@/shared/components/errored/parse-message';
import { Button } from '@/shared/components/ui/button';
import { FieldError, FieldGroup } from '@/shared/components/ui/field';
import {
  SETTING_FLAG,
  type AccountSettingsData,
} from '@/shared/types/account-settings';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type Props = { data: AccountSettingsData };

export default function AccountSettingsForm({ data }: Props) {
  const t = useTranslations('accountSettings');
  const router = useRouter();
  const settings = getVisibleSettings(data.settings);
  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    values: getSettingsFormValues(settings, data.current),
    resetOptions: { keepDirtyValues: true },
  });

  const submit = async (values: SettingsFormValues) => {
    try {
      const response = await ClientApis.Account.saveAccountSettings(
        getSettingsPayload(settings, values)
      ).send();
      if ('error' in response)
        throw new Error(parseErrorMessage(response.error));
      reset({
        fields: values.fields.map((field, index) =>
          settings[index].flag & SETTING_FLAG.SECRET ? { value: '' } : field
        ),
      });
      toast.success(t('saved'));
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('saveFailed');
      setError('root', { message });
      toast.error(message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="space-y-6"
      aria-label={t('profileTitle')}
      data-llm-visible="true"
    >
      {groupSettings(settings).map(({ family, fields }, groupIndex) => {
        const title = t.has(`families.${family}`)
          ? t(`families.${family}`)
          : family;
        return (
          <SettingsSection
            key={family}
            id={`account-section-${groupIndex}`}
            title={title}
          >
            <FieldGroup className="grid grid-cols-1 items-start gap-x-6 gap-y-5 sm:grid-cols-6">
              {fields.map(({ setting, index }) => (
                <SettingField
                  key={setting.key}
                  setting={setting}
                  index={index}
                  control={control}
                  saving={isSubmitting}
                />
              ))}
            </FieldGroup>
          </SettingsSection>
        );
      })}
      <div className="border-t border-border/60 pt-5 xl:pl-40">
        <div className="flex max-w-4xl flex-wrap items-center justify-end gap-4">
          <FieldError errors={[errors.root]} />
          <Button
            type="submit"
            className="h-9 px-4"
            disabled={isSubmitting}
            data-llm-text={isSubmitting ? t('saving') : t('save')}
          >
            {isSubmitting ? t('saving') : t('save')}
          </Button>
        </div>
      </div>
    </form>
  );
}
