'use client';

import {
  datePattern,
  timePattern,
  type HomeworkCloneValues,
} from '@/features/homework/form/homework-form-utils';
import { Button } from '@/shared/components/ui/button';
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { Copy, LoaderCircle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog } from 'radix-ui';
import { useForm } from 'react-hook-form';
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
  const tCommon = useTranslations('common');
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
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<HomeworkCloneValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onConfirm(values);
    } catch (error) {
      setError('root.serverError', {
        type: 'server',
        message:
          error instanceof Error && error.message
            ? error.message
            : t('cloneFailed'),
      });
    }
  });

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && isSubmitting) return;
        onOpenChange(open);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs" />
        <Dialog.Content
          className="bg-background fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border p-5 shadow-lg"
          data-llm-visible="true"
        >
          <Dialog.Title
            className="text-lg font-semibold"
            data-llm-text={t('cloneTitle')}
          >
            {t('cloneTitle')}
          </Dialog.Title>
          <Dialog.Description
            className="text-muted-foreground mt-2 text-sm"
            data-llm-text={t('cloneDescription')}
          >
            {t('cloneDescription')}
          </Dialog.Description>
          <form
            className="mt-5 space-y-4"
            noValidate
            onSubmit={(event) => void submit(event)}
          >
            <Field>
              <FieldLabel htmlFor="clone-title">
                {t('homeworkTitle')}
              </FieldLabel>
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
            <FieldError errors={[errors.root?.serverError]} />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                <X aria-hidden="true" />
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                ) : (
                  <Copy aria-hidden="true" />
                )}
                {isSubmitting ? t('cloning') : t('clone')}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
