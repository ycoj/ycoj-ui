'use client';

import {
  buildPreliminarySchema,
  type PreliminarySchemaMessages,
} from '@/features/preliminary/form/preliminary-form-schema';
import type { PreliminaryFormValues } from '@/features/preliminary/form/preliminary-form-utils';
import PreliminarySectionList from '@/features/preliminary/form/preliminary-section-list';
import { PreliminaryRequestError } from '@/features/preliminary/lib/preliminary-error';
import { Button } from '@/shared/components/ui/button';
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

export type PreliminaryFormMode = 'create' | 'edit';

type Props = {
  mode: PreliminaryFormMode;
  wasPublished?: boolean;
  defaultValues: PreliminaryFormValues;
  cancelHref: string;
  extraActions?: ReactNode;
  onSave: (
    values: PreliminaryFormValues,
    published: boolean
  ) => Promise<string>;
};

export default function PreliminaryForm({
  mode,
  wasPublished,
  defaultValues,
  cancelHref,
  extraActions,
  onSave,
}: Props) {
  const t = useTranslations('preliminaryForm');
  const router = useRouter();
  const messages = useMemo<PreliminarySchemaMessages>(
    () => ({
      titleRequired: t('titleRequired'),
      sectionTitleRequired: t('sectionTitleRequired'),
      promptRequired: t('promptRequired'),
      scoreInvalid: t('scoreInvalid'),
      optionsRequired: t('optionsRequired'),
      answerRequired: t('answerRequired'),
      answerInvalid: t('answerInvalid'),
      sectionsRequired: t('sectionsRequired'),
      questionsRequired: t('questionsRequired'),
      tooManySections: t('tooManySections'),
      tooManyQuestions: t('tooManyQuestions'),
      tooManyOptions: t('tooManyOptions'),
      trueFalseOnlyInReading: t('trueFalseOnlyInReading'),
    }),
    [t]
  );
  const schema = useMemo(() => buildPreliminarySchema(messages), [messages]);
  const methods = useForm<PreliminaryFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    clearErrors,
    trigger,
    formState: { errors, isSubmitting },
  } = methods;
  // Draft saving bypasses handleSubmit (and therefore react-hook-form's
  // isSubmitting), so it tracks its own pending flag. Draft and publish have
  // divergent semantics by design: publish validates the full paper through
  // the Zod schema above, while a draft only requires a title so incomplete
  // papers can be resumed later.
  const [savingDraft, setSavingDraft] = useState(false);
  const busy = isSubmitting || savingDraft;

  // wasPublished only changes the button copy/icons; the draft/publish
  // actions stay the same, so compute the labels once and render one JSX.
  const draftLabel = busy
    ? t('saving')
    : wasPublished
      ? t('unpublish')
      : t('saveDraft');
  const publishLabel = busy
    ? t('saving')
    : wasPublished
      ? t('saveChanges')
      : t('publish');
  const PublishIcon = wasPublished || mode === 'edit' ? Save : Plus;

  const handleSave = async (
    values: PreliminaryFormValues,
    published: boolean
  ) => {
    clearErrors('root.serverError');
    try {
      const path = await onSave(values, published);
      router.push(path);
      router.refresh();
    } catch (error) {
      setError('root.serverError', {
        type: 'server',
        message:
          error instanceof PreliminaryRequestError
            ? t('submitFailed')
            : error instanceof Error && error.message
              ? error.message
              : t('submitFailed'),
      });
    }
  };

  const handleDraftSave = async () => {
    if (busy) return;
    const valid = await trigger('title');
    if (!valid) {
      document.getElementById('title')?.focus();
      return;
    }
    setSavingDraft(true);
    try {
      await handleSave(getValues(), false);
    } finally {
      setSavingDraft(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit((values) => handleSave(values, true))}
        noValidate
        className="space-y-5"
        data-llm-visible="true"
      >
        <Field>
          <FieldLabel htmlFor="title">{t('paperTitle')}</FieldLabel>
          <FieldContent>
            <Input
              id="title"
              autoFocus
              placeholder={t('titlePlaceholder')}
              disabled={busy}
              aria-invalid={!!errors.title}
              {...register('title')}
            />
            <FieldError errors={[errors.title]} />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="content">{t('introduction')}</FieldLabel>
          <FieldContent>
            <Textarea
              id="content"
              rows={3}
              placeholder={t('introductionPlaceholder')}
              disabled={busy}
              {...register('content')}
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel>{t('sections')}</FieldLabel>
          <FieldContent>
            <PreliminarySectionList disabled={busy} />
          </FieldContent>
        </Field>

        <FieldError errors={[errors.root?.serverError]} />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void handleDraftSave()}
          >
            {draftLabel}
          </Button>
          <Button type="submit" disabled={busy}>
            <PublishIcon />
            {publishLabel}
          </Button>
          {extraActions}
          <Button asChild type="button" variant="secondary">
            <Link href={cancelHref}>
              <ArrowLeft />
              {t('cancel')}
            </Link>
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
