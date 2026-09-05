'use client';

import ContestSolutionDeleteButton from './contest-solution-delete-button';
import ClientApis from '@/api/client/method';
import MarkdownEditor from '@/shared/components/markdown-editor';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

type Props = {
  tid: string;
  sid?: string;
  initialValues?: { title: string; content: string };
};

export default function ContestSolutionForm({
  tid,
  sid,
  initialValues,
}: Props) {
  const t = useTranslations('contestSolution');
  const router = useRouter();
  const schema = z.object({
    title: z.string().trim().min(1, t('titleRequired')),
    content: z
      .string()
      .refine((value) => value.trim().length > 0, t('contentRequired')),
  });
  type Values = z.infer<typeof schema>;
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initialValues ?? { title: '', content: '' },
  });
  const onSubmit = async (values: Values) => {
    try {
      const result = await ClientApis.Contest.saveContestSolution(
        tid,
        values,
        sid
      );
      if ('error' in result) {
        setError('root', { message: result.error.message });
        return;
      }
      if (!result.sid) {
        setError('root', { message: t('saveFailed') });
        return;
      }
      router.push(`/contest/${tid}/solution/${result.sid}`);
      router.refresh();
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : t('saveFailed'),
      });
    }
  };
  return (
    <form
      className="space-y-6"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(event) => {
        if (event.ctrlKey && event.key === 'Enter') {
          event.preventDefault();
          if (!isSubmitting) void handleSubmit(onSubmit)();
        }
      }}
      data-llm-visible="true"
    >
      <h1 className="text-2xl font-semibold">
        {sid ? t('edit') : t('create')}
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
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <MarkdownEditor
              id="solution-content"
              {...field}
              onChange={async (event) => field.onChange(event.target.value)}
              onBlur={async () => field.onBlur()}
              disabled={isSubmitting}
              aria-invalid={!!errors.content}
            />
          )}
        />
        <FieldError errors={[errors.content]} />
      </Field>
      <FieldError errors={[errors.root]} />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('saving') : sid ? t('save') : t('create')}
        </Button>
        <Button asChild variant="secondary">
          <Link
            href={sid ? `/contest/${tid}/solution/${sid}` : `/contest/${tid}`}
          >
            {t('cancel')}
          </Link>
        </Button>
        {sid && !isSubmitting && (
          <ContestSolutionDeleteButton tid={tid} sid={sid} />
        )}
      </div>
    </form>
  );
}
