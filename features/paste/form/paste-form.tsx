'use client';

import {
  createPasteSchema,
  getPasteDefaults,
  getPasteLanguageOptions,
  type PasteFormValues,
} from './paste-form-utils';
import PasteSelect from './paste-select';
import ClientApis from '@/api/client/method';
import CodeEditor from '@/shared/components/code/code-editor';
import parseErrorMessage from '@/shared/components/errored/parse-message';
import MarkdownEditor from '@/shared/components/markdown-editor';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import type {
  PasteDoc,
  PasteExpire,
  PasteFormOptions,
} from '@/shared/types/paste';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, Save, Share2, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

type Props = { options: PasteFormOptions; paste?: PasteDoc };

export default function PasteForm({ options, paste }: Props) {
  const t = useTranslations('paste');
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    setError,
    clearErrors,
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
    defaultValues: getPasteDefaults(options, paste),
  });
  const mode = useWatch({ control, name: 'mode' });
  const language = useWatch({ control, name: 'language' });
  const busy = isSubmitting || deleting;
  const languageOptions = getPasteLanguageOptions(
    options.languageOptions,
    language
  );
  const expiryOptions = Object.fromEntries(
    (Object.keys(options.expiryOptions) as PasteExpire[]).map((key) => [
      key,
      t(`expiry.${key}`),
    ])
  );

  const showError = (error: unknown) =>
    setError('root.serverError', {
      message: error instanceof Error ? error.message : t('submitFailed'),
    });

  const onSubmit = async (values: PasteFormValues) => {
    if (deleting) return;
    try {
      const { title, mode, language, content, expire } = values;
      if (paste) {
        const response = await ClientApis.Paste.updatePaste(
          paste._id,
          title,
          mode,
          language,
          content,
          expire
        ).send();
        if ('error' in response)
          throw new Error(parseErrorMessage(response.error));
        if (!response.url) throw new Error(t('submitFailed'));
        router.push(`/paste/${encodeURIComponent(paste._id)}`);
      } else {
        const response = await ClientApis.Paste.createPaste(
          title,
          mode,
          language,
          content,
          expire
        ).send();
        if ('error' in response)
          throw new Error(parseErrorMessage(response.error));
        if (!response.id) throw new Error(t('submitFailed'));
        router.push(`/paste/${encodeURIComponent(response.id)}`);
      }
      router.refresh();
    } catch (error) {
      showError(error);
    }
  };

  const onDelete = async () => {
    if (!paste || busy || !window.confirm(t('deleteConfirm'))) return;
    clearErrors('root.serverError');
    setDeleting(true);
    try {
      const response = await ClientApis.Paste.deletePaste(paste._id).send();
      if ('error' in response)
        throw new Error(parseErrorMessage(response.error));
      if (!response.url) throw new Error(t('deleteFailed'));
      router.push('/paste');
      router.refresh();
    } catch (error) {
      showError(error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5"
      data-llm-visible="true"
    >
      <h1
        className="text-2xl font-semibold"
        data-llm-text={paste ? t('edit') : t('create')}
      >
        {paste ? t('edit') : t('create')}
      </h1>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <Field>
          <FieldLabel htmlFor="paste-title">{t('title')}</FieldLabel>
          <Input
            id="paste-title"
            placeholder={t('titlePlaceholder')}
            disabled={busy}
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
              disabled={busy}
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
                disabled={busy}
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
              disabled={busy}
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
                disabled={busy}
                aria-invalid={!!errors.content}
              />
            ) : (
              <CodeEditor
                value={field.value}
                onChange={field.onChange}
                language={language || 'plaintext'}
                height="28rem"
                readOnly={busy}
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
        <Button type="submit" disabled={busy}>
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" />
          ) : paste ? (
            <Save />
          ) : (
            <Share2 />
          )}
          {isSubmitting ? t('saving') : paste ? t('save') : t('share')}
        </Button>
        {paste && (
          <>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => void onDelete()}
            >
              {deleting ? <LoaderCircle className="animate-spin" /> : <Trash />}
              {deleting ? t('deleting') : t('delete')}
            </Button>
            <Button variant="outline" asChild disabled={busy}>
              <Link
                href={`/paste/${encodeURIComponent(paste._id)}`}
                aria-disabled={busy}
                tabIndex={busy ? -1 : undefined}
                onClick={(event) => {
                  if (busy) event.preventDefault();
                }}
              >
                {t('cancel')}
              </Link>
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
