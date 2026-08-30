'use client';

import {
  AVATAR_ACCEPT,
  avatarProviders,
  createAvatarSchema,
  getAvatarFormValues,
  type AvatarFormValues,
} from './avatar-form-utils';
import SettingsSection from './settings-section';
import ClientApis from '@/api/client/method';
import avatarUrl from '@/features/user/lib/avatar-url';
import parseErrorMessage from '@/shared/components/errored/parse-message';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
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
import type { BaseUser } from '@/shared/types/user';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

type Props = { current: BaseUser; disabled?: boolean };

export default function AvatarSettings({ current, disabled = false }: Props) {
  const t = useTranslations('accountSettings.avatar');
  const router = useRouter();
  const [preview, setPreview] = useState<string>();
  const [previewVersion, setPreviewVersion] = useState(0);
  const {
    control,
    register,
    setValue,
    clearErrors,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AvatarFormValues>({
    resolver: zodResolver(
      createAvatarSchema({
        required: t('required'),
        invalidEmail: t('invalidEmail'),
        invalidQq: t('invalidQq'),
        fileRequired: t('fileRequired'),
        fileTooLarge: t('fileTooLarge'),
        invalidFileType: t('invalidFileType'),
      })
    ),
    defaultValues: getAvatarFormValues(current.avatar, current.mail),
  });
  const provider = useWatch({ control, name: 'provider' });
  const busy = disabled || isSubmitting;

  useEffect(
    () => () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  const submit = async (values: AvatarFormValues) => {
    try {
      const request =
        values.provider === 'upload'
          ? values.file && ClientApis.Account.uploadAvatar(values.file)
          : ClientApis.Account.updateAvatar(values.provider, values.identifier);
      if (!request) return;
      const response = await request.send();
      if ('error' in response)
        throw new Error(parseErrorMessage(response.error));
      if (values.provider === 'upload' && values.file)
        setPreview(URL.createObjectURL(values.file));
      else
        setPreview(
          `${avatarUrl(`${values.provider}:${values.identifier}`, 128)}&v=${previewVersion + 1}`
        );
      setPreviewVersion((version) => version + 1);
      toast.success(t('saved'));
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('saveFailed');
      setError('root', { message });
      toast.error(message);
    }
  };

  return (
    <SettingsSection id="avatar" title={t('title')}>
      <div className="flex flex-col items-start gap-5 sm:flex-row">
        <Avatar className="size-16 shrink-0">
          <AvatarImage
            key={preview ?? current.avatar}
            src={preview ?? avatarUrl(current.avatar, 128)}
            alt={t('preview', { name: current.uname })}
          />
          <AvatarFallback>
            {current.uname.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <form
          onSubmit={handleSubmit(submit)}
          className="grid w-full min-w-0 max-w-2xl flex-1 grid-cols-1 items-start gap-x-4 gap-y-4 sm:grid-cols-[8rem_minmax(0,1fr)] 2xl:grid-cols-[8rem_minmax(0,1fr)_auto]"
          aria-label={t('title')}
          noValidate
        >
          <Field className="min-w-0 gap-2">
            <FieldLabel htmlFor="avatar-provider" data-llm-text={t('provider')}>
              {t('provider')}
            </FieldLabel>
            <Controller
              control={control}
              name="provider"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue('identifier', '');
                    setValue('file', undefined);
                    clearErrors();
                  }}
                  disabled={busy}
                >
                  <SelectTrigger
                    id="avatar-provider"
                    className="h-9 w-full"
                    ref={field.ref}
                    onBlur={field.onBlur}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {avatarProviders.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`providers.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          {provider === 'upload' ? (
            <Field
              className="min-w-0 gap-2"
              data-invalid={Boolean(errors.file)}
            >
              <FieldLabel htmlFor="avatar-file" data-llm-text={t('file')}>
                {t('file')}
              </FieldLabel>
              <Input
                id="avatar-file"
                className="h-9"
                type="file"
                accept={AVATAR_ACCEPT}
                disabled={busy}
                onChange={(event) =>
                  setValue('file', event.target.files?.[0], {
                    shouldValidate: true,
                  })
                }
                aria-invalid={Boolean(errors.file)}
                aria-describedby="avatar-file-help"
              />
              <FieldDescription
                className="text-xs"
                id="avatar-file-help"
                data-llm-text={t('uploadHelp')}
              >
                {t('uploadHelp')}
              </FieldDescription>
              <FieldError errors={[errors.file]} />
            </Field>
          ) : (
            <Field
              className="min-w-0 gap-2"
              data-invalid={Boolean(errors.identifier)}
            >
              <FieldLabel
                htmlFor="avatar-identifier"
                data-llm-text={t(`labels.${provider}`)}
              >
                {t(`labels.${provider}`)}
              </FieldLabel>
              <Input
                id="avatar-identifier"
                className="h-9"
                {...register('identifier')}
                type={provider === 'gravatar' ? 'email' : 'text'}
                inputMode={provider === 'qq' ? 'numeric' : undefined}
                placeholder={t(`placeholders.${provider}`)}
                disabled={busy}
                aria-invalid={Boolean(errors.identifier)}
              />
              <FieldError errors={[errors.identifier]} />
            </Field>
          )}
          <Button
            type="submit"
            variant="secondary"
            className="h-9 w-fit shadow-none sm:col-start-2 2xl:col-start-3 2xl:mt-7"
            disabled={busy}
            data-llm-text={isSubmitting ? t('saving') : t('save')}
          >
            {isSubmitting ? t('saving') : t('save')}
          </Button>
          <FieldError
            className="sm:col-span-2 2xl:col-span-3"
            errors={[errors.root]}
          />
        </form>
      </div>
    </SettingsSection>
  );
}
