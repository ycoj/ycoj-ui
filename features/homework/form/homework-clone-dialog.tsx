'use client';

import {
  datePattern,
  timePattern,
  type HomeworkCloneValues,
} from '@/features/homework/form/homework-form-utils';
import CloneDialog from '@/shared/components/clone-dialog';
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import { z } from 'zod';

export type HomeworkCloneDialogProps = {
  defaultValues: HomeworkCloneValues;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: HomeworkCloneValues) => Promise<void>;
};

export default function HomeworkCloneDialog({
  defaultValues,
  onOpenChange,
  onConfirm,
}: HomeworkCloneDialogProps) {
  const t = useTranslations('homeworkEdit');
  const schema = z
    .object({
      title: z.string().trim().min(1, t('titleRequired')).max(64),
      beginAtDate: z.string().regex(datePattern, t('invalidDate')),
      beginAtTime: z.string().regex(timePattern, t('invalidTime')),
      penaltySinceDate: z.string().regex(datePattern, t('invalidDate')),
      penaltySinceTime: z.string().regex(timePattern, t('invalidTime')),
    })
    .refine(
      (values) =>
        dayjs(`${values.beginAtDate}T${values.beginAtTime}`).isBefore(
          dayjs(`${values.penaltySinceDate}T${values.penaltySinceTime}`)
        ),
      { path: ['penaltySinceDate'], message: t('endAfterStart') }
    );

  return (
    <CloneDialog
      title={t('cloneTitle')}
      description={t('cloneDescription')}
      cloneLabel={t('clone')}
      cloningLabel={t('cloning')}
      failedLabel={t('cloneFailed')}
      resolver={zodResolver(schema)}
      defaultValues={defaultValues}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
    >
      {({ register, errors, isSubmitting }) => (
        <>
          <Field>
            <FieldLabel htmlFor="clone-title">{t('homeworkTitle')}</FieldLabel>
            <FieldContent>
              <Input
                id="clone-title"
                autoFocus
                disabled={isSubmitting}
                aria-invalid={!!errors.title}
                {...register('title')}
              />
              <FieldError errors={[errors.title]} />
            </FieldContent>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="clone-beginAtDate">
                {t('beginDate')}
              </FieldLabel>
              <FieldContent>
                <Input
                  id="clone-beginAtDate"
                  type="date"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.beginAtDate}
                  {...register('beginAtDate')}
                />
                <FieldError errors={[errors.beginAtDate]} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="clone-beginAtTime">
                {t('beginTime')}
              </FieldLabel>
              <FieldContent>
                <Input
                  id="clone-beginAtTime"
                  type="time"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.beginAtTime}
                  {...register('beginAtTime')}
                />
                <FieldError errors={[errors.beginAtTime]} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="clone-penaltySinceDate">
                {t('deadlineDate')}
              </FieldLabel>
              <FieldContent>
                <Input
                  id="clone-penaltySinceDate"
                  type="date"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.penaltySinceDate}
                  {...register('penaltySinceDate')}
                />
                <FieldError errors={[errors.penaltySinceDate]} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="clone-penaltySinceTime">
                {t('deadlineTime')}
              </FieldLabel>
              <FieldContent>
                <Input
                  id="clone-penaltySinceTime"
                  type="time"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.penaltySinceTime}
                  {...register('penaltySinceTime')}
                />
                <FieldError errors={[errors.penaltySinceTime]} />
              </FieldContent>
            </Field>
          </div>
        </>
      )}
    </CloneDialog>
  );
}
