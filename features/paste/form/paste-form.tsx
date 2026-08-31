'use client';

import {
  createPasteSchema,
  getPasteLanguageOptions,
  type PasteFormValues,
} from './paste-form-utils';
import PasteSelect from './paste-select';
import CodeEditor from '@/shared/components/code/code-editor';
import MarkdownEditor from '@/shared/components/markdown-editor';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { PASTE_EXPIRE, type PasteFormOptions } from '@/shared/types/paste';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, Save, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

type Props = {
  options: PasteFormOptions;
  defaultValues: PasteFormValues;
  onSubmit: (values: PasteFormValues) => Promise<string>;
  extraActions?: ReactNode;
  heading: string;
  submitLabel: string;
  cancelHref?: string;
};

export default function PasteForm({
  options,
  defaultValues,
  onSubmit,
  extraActions,
  heading,
  submitLabel,
  cancelHref,
}: Props) {
  const t = useTranslations('paste');
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasteFormValues>({
    resolver: zodResolver(
      createPasteSchema({
        titleTooLong: t('titleTooLong'),
        contentRequired: t('contentRequired'),
        contentTooLong: t('contentTooLong'),
        languageInvalid: t('languageInvalid'),
      })
    ),
    defaultValues,
  });
  const mode = useWatch({ control, name: 'mode' });
  const language = useWatch({ control, name: 'language' });
  const languageOptions = getPasteLanguageOptions(
    options.languageNames,
    language
  );
  const expiryOptions = Object.fromEntries(
    PASTE_EXPIRE.map((key) => [key, t(`expiry.${key}`)])
  );

  const handleFormSubmit = async (values: PasteFormValues) => {
    try {
      const path = await onSubmit(values);
      router.push(path);
      router.refresh();
    } catch (error) {
      setError('root.serverError', {
        message:
          error instanceof Error && error.message
            ? error.message
            : t('submitFailed'),
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
      className="space-y-5"
      data-llm-visible="true"
    >
      <h1 className="text-2xl font-semibold" data-llm-text={heading}>
        {heading}
      </h1>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <Field>
          <FieldLabel htmlFor="paste-title">{t('title')}</FieldLabel>
          <Input
            id="paste-title"
            placeholder={t('titlePlaceholder')}
            disabled={isSubmitting}
            aria-invalid={!!errors.title}
            {...register('title')}
          />
          <FieldError errors={[errors.title]} />
        </Field>
        <Controller
          name="mode"
          control={control}
          render={({ field }) => (
            <PasteSelect
              id="paste-mode"
              label={t('type')}
              value={field.value}
              onChange={field.onChange}
              options={{ code: t('code'), markdown: t('markdown') }}
              disabled={isSubmitting}
              error={errors.mode?.message}
            />
          )}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {mode === 'code' && (
          <Controller
            name="language"
            control={control}
            render={({ field }) => (
              <PasteSelect
                id="paste-language"
                label={t('language')}
                value={field.value}
                onChange={field.onChange}
                options={Object.fromEntries(
                  Object.entries(languageOptions).map(([key, label]) => [
                    key,
                    key ? label : t('plainText'),
                  ])
                )}
                disabled={isSubmitting}
                error={errors.language?.message}
              />
            )}
          />
        )}
        <Controller
          name="expire"
          control={control}
          render={({ field }) => (
            <PasteSelect
              id="paste-expire"
              label={t('expiration')}
              value={field.value}
              onChange={field.onChange}
              options={expiryOptions}
              disabled={isSubmitting}
              error={errors.expire?.message}
            />
          )}
        />
      </div>
      <Field>
        <FieldLabel htmlFor="paste-content">{t('content')}</FieldLabel>
        <Controller
          name="content"
          control={control}
          render={({ field }) =>
            mode === 'markdown' ? (
              <MarkdownEditor
                id="paste-content"
                name={field.name}
                ref={field.ref}
                value={field.value}
                onChange={async (event) => field.onChange(event.target.value)}
                onBlur={async () => field.onBlur()}
                disabled={isSubmitting}
                aria-invalid={!!errors.content}
              />
            ) : (
              <CodeEditor
                value={field.value}
                onChange={field.onChange}
                language={language || 'plaintext'}
                height="28rem"
                readOnly={isSubmitting}
                invalid={!!errors.content}
                ariaLabel={t('content')}
              />
            )
          }
        />
        <FieldError errors={[errors.content]} />
      </Field>
      {errors.root?.serverError && (
        <FieldError errors={[errors.root.serverError]} />
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" />
          ) : extraActions ? (
            <Save />
          ) : (
            <Share2 />
          )}
          {isSubmitting ? t('saving') : submitLabel}
        </Button>
        {extraActions}
        {cancelHref && (
          <Button variant="outline" asChild>
            <Link href={cancelHref}>{t('cancel')}</Link>
          </Button>
        )}
      </div>
    </form>
  );
}
