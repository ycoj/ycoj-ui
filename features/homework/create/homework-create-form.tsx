'use client';

import ClientApis from '@/api/client/method';
import {
  buildCreateHomeworkPayload,
  isPenaltyRuleMapping,
  type HomeworkCreateFormValues,
} from '@/features/homework/create/homework-create-utils';
import LanguageAutoComplete from '@/features/language/language-auto-complete';
import ProblemListEditor from '@/features/problem/problem-list-editor';
import AssignSelectAutoComplete from '@/features/user/assign-select-auto-complete';
import UserAutoComplete from '@/features/user/user-auto-complete';
import CodeEditor from '@/shared/components/code/code-editor';
import MarkdownEditor from '@/shared/components/markdown-editor';
import { Button } from '@/shared/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { ArrowLeft, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

type Props = {
  defaultValues: HomeworkCreateFormValues;
  domainId: string;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export default function HomeworkCreateForm({ defaultValues, domainId }: Props) {
  const t = useTranslations('homeworkCreate');
  const router = useRouter();
  const schema = z
    .object({
      title: z.string().trim().min(1, t('titleRequired')).max(64),
      beginAtDate: z.string().regex(datePattern, t('invalidDate')),
      beginAtTime: z.string().regex(timePattern, t('invalidTime')),
      penaltySinceDate: z.string().regex(datePattern, t('invalidDate')),
      penaltySinceTime: z.string().regex(timePattern, t('invalidTime')),
      extensionDays: z
        .string()
        .refine((value) => Number(value) >= 0, t('extensionInvalid')),
      assign: z.array(z.string()),
      maintainer: z.array(z.string()),
      penaltyRules: z
        .string()
        .trim()
        .min(1, t('penaltyRulesRequired'))
        .refine(isPenaltyRuleMapping, t('penaltyRulesInvalid')),
      pids: z
        .array(
          z.object({
            docId: z.number(),
            pid: z.string().optional(),
            title: z.string(),
          })
        )
        .min(1, t('problemsInvalid')),
      content: z.string().trim().min(1, t('contentRequired')).max(65535),
      langs: z.array(z.string()),
    })
    .refine(
      (values) =>
        dayjs(`${values.beginAtDate}T${values.beginAtTime}`).isBefore(
          dayjs(`${values.penaltySinceDate}T${values.penaltySinceTime}`)
        ),
      { path: ['penaltySinceDate'], message: t('endAfterStart') }
    );
  const {
    control,
    handleSubmit,
    register,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<HomeworkCreateFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const onSubmit = async (values: HomeworkCreateFormValues) => {
    try {
      const response = await ClientApis.Homework.createHomework(
        buildCreateHomeworkPayload(values)
      ).send();
      if (!response?.tid) throw new Error(t('submitFailed'));
      router.push(`/homework/${response.tid}`);
      router.refresh();
    } catch (error) {
      setError('root.serverError', {
        type: 'server',
        message: error instanceof Error ? error.message : t('submitFailed'),
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5"
      data-llm-visible="true"
    >
      <Field>
        <FieldLabel htmlFor="title">{t('homeworkTitle')}</FieldLabel>
        <FieldContent>
          <Input
            id="title"
            autoFocus
            placeholder={t('titlePlaceholder')}
            disabled={isSubmitting}
            aria-invalid={!!errors.title}
            {...register('title')}
          />
          <FieldError errors={[errors.title]} />
        </FieldContent>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Field>
          <FieldLabel htmlFor="beginAtDate">{t('beginDate')}</FieldLabel>
          <FieldContent>
            <Input
              id="beginAtDate"
              type="date"
              disabled={isSubmitting}
              aria-invalid={!!errors.beginAtDate}
              {...register('beginAtDate')}
            />
            <FieldError errors={[errors.beginAtDate]} />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel htmlFor="beginAtTime">{t('beginTime')}</FieldLabel>
          <FieldContent>
            <Input
              id="beginAtTime"
              type="time"
              disabled={isSubmitting}
              aria-invalid={!!errors.beginAtTime}
              {...register('beginAtTime')}
            />
            <FieldError errors={[errors.beginAtTime]} />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel htmlFor="penaltySinceDate">
            {t('deadlineDate')}
          </FieldLabel>
          <FieldContent>
            <Input
              id="penaltySinceDate"
              type="date"
              disabled={isSubmitting}
              aria-invalid={!!errors.penaltySinceDate}
              {...register('penaltySinceDate')}
            />
            <FieldError errors={[errors.penaltySinceDate]} />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel htmlFor="penaltySinceTime">
            {t('deadlineTime')}
          </FieldLabel>
          <FieldContent>
            <Input
              id="penaltySinceTime"
              type="time"
              disabled={isSubmitting}
              aria-invalid={!!errors.penaltySinceTime}
              {...register('penaltySinceTime')}
            />
            <FieldError errors={[errors.penaltySinceTime]} />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel htmlFor="extensionDays">{t('extensionDays')}</FieldLabel>
          <FieldContent>
            <Input
              id="extensionDays"
              type="number"
              min="0"
              step="0.01"
              disabled={isSubmitting}
              aria-invalid={!!errors.extensionDays}
              {...register('extensionDays')}
            />
            <FieldError errors={[errors.extensionDays]} />
          </FieldContent>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="assign">{t('assign')}</FieldLabel>
          <FieldContent>
            <Controller
              control={control}
              name="assign"
              render={({ field }) => (
                <AssignSelectAutoComplete
                  id="assign"
                  domainId={domainId}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder={t('assignPlaceholder')}
                  ariaLabel={t('assign')}
                  disabled={isSubmitting}
                />
              )}
            />
            <FieldDescription>{t('assignHelp')}</FieldDescription>
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel htmlFor="maintainer">{t('maintainer')}</FieldLabel>
          <FieldContent>
            <Controller
              control={control}
              name="maintainer"
              render={({ field }) => (
                <UserAutoComplete
                  multiple
                  id="maintainer"
                  domainId={domainId}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder={t('maintainerPlaceholder')}
                  ariaLabel={t('maintainer')}
                  disabled={isSubmitting}
                />
              )}
            />
            <FieldDescription>{t('maintainerHelp')}</FieldDescription>
            <FieldError errors={[errors.maintainer]} />
          </FieldContent>
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="penaltyRules">{t('penaltyRules')}</FieldLabel>
        <FieldContent>
          <Controller
            control={control}
            name="penaltyRules"
            render={({ field }) => (
              <CodeEditor
                value={field.value}
                onChange={field.onChange}
                language="yaml"
                height="192px"
                readOnly={isSubmitting}
                invalid={!!errors.penaltyRules}
                ariaLabel={t('penaltyRules')}
                path="penalty-rules.yaml"
              />
            )}
          />
          <FieldDescription>{t('penaltyRulesHelp')}</FieldDescription>
          <FieldError errors={[errors.penaltyRules]} />
        </FieldContent>
      </Field>

      <Field>
        <Controller
          control={control}
          name="pids"
          render={({ field }) => (
            <ProblemListEditor
              id="pids"
              domainId={domainId}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isSubmitting}
              invalid={!!errors.pids}
            />
          )}
        />
        <FieldError errors={[errors.pids]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="content">{t('content')}</FieldLabel>
        <FieldContent>
          <MarkdownEditor
            id="content"
            defaultValue={defaultValues.content}
            disabled={isSubmitting}
            aria-invalid={!!errors.content}
            {...register('content')}
          />
          <FieldError errors={[errors.content]} />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel htmlFor="langs">{t('languages')}</FieldLabel>
        <FieldContent>
          <Controller
            control={control}
            name="langs"
            render={({ field }) => (
              <LanguageAutoComplete
                id="langs"
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={t('languagesPlaceholder')}
                ariaLabel={t('languages')}
                disabled={isSubmitting}
              />
            )}
          />
          <FieldDescription>{t('languagesHelp')}</FieldDescription>
        </FieldContent>
      </Field>
      <FieldError errors={[errors.root?.serverError]} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          <Plus />
          {isSubmitting ? t('creating') : t('create')}
        </Button>
        <Button asChild variant="secondary">
          <Link href="/homework">
            <ArrowLeft />
            {t('cancel')}
          </Link>
        </Button>
      </div>
    </form>
  );
}
