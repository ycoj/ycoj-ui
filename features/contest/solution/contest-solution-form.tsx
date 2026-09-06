'use client';

import {
  buildContestSolutionSchema,
  type ContestSolutionFormValues,
} from './contest-solution-form-utils';
import MarkdownEditor from '@/shared/components/markdown-editor';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';

type Props = {
  mode: 'create' | 'edit';
  defaultValues: ContestSolutionFormValues;
  cancelHref: string;
  onSubmit: (values: ContestSolutionFormValues) => Promise<string>;
  extraActions?: ReactNode;
};

export default function ContestSolutionForm({
  mode,
  defaultValues,
  cancelHref,
  onSubmit,
  extraActions,
}: Props) {
  const t = useTranslations('contestSolution');
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContestSolutionFormValues>({
    resolver: zodResolver(
      buildContestSolutionSchema({
        titleRequired: t('titleRequired'),
        titleTooLong: t('titleTooLong'),
        contentRequired: t('contentRequired'),
        contentTooLong: t('contentTooLong'),
      })
    ),
    defaultValues,
  });

  const handleFormSubmit = async (values: ContestSolutionFormValues) => {
    try {
      const path = await onSubmit(values);
      // Push only: the destination page revalidates on navigation, so an
      // extra refresh would refetch without visible benefit.
      router.push(path);
    } catch (error) {
      setError('root.serverError', {
        type: 'server',
        message:
          error instanceof Error && error.message
            ? error.message
            : t('saveFailed'),
      });
    }
  };

  return (
    <form
      className="space-y-6"
      noValidate
      onSubmit={handleSubmit(handleFormSubmit)}
      onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          event.preventDefault();
          if (!isSubmitting) void handleSubmit(handleFormSubmit)();
        }
      }}
      data-llm-visible="true"
    >
      <h1 className="text-2xl font-semibold">
        {mode === 'create' ? t('create') : t('edit')}
      </h1>
      <Field>
        <FieldLabel htmlFor="solution-title">{t('title')}</FieldLabel>
        <Input
          id="solution-title"
          {...register('title')}
          disabled={isSubmitting}
          aria-invalid={!!errors.title}
        />
        <FieldError errors={[errors.title]} />
      </Field>
      <Field>
        <FieldLabel htmlFor="solution-content">{t('content')}</FieldLabel>
        {/* register matches the solution family: MarkdownEditor forwards
            register's onChange/onBlur through its hidden textarea bridge. */}
        <MarkdownEditor
          id="solution-content"
          defaultValue={defaultValues.content}
          disabled={isSubmitting}
          aria-invalid={!!errors.content}
          {...register('content')}
        />
        <FieldError errors={[errors.content]} />
      </Field>
      <FieldError errors={[errors.root?.serverError]} />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t('saving')
            : mode === 'create'
              ? t('create')
              : t('save')}
        </Button>
        <Button asChild variant="secondary">
          <Link href={cancelHref}>{t('cancel')}</Link>
        </Button>
        {extraActions}
      </div>
    </form>
  );
}
