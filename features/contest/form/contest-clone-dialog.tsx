'use client';

import {
  datePattern,
  timePattern,
  type ContestCloneValues,
} from '@/features/contest/form/contest-form-utils';
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
import { useWatch, type Control } from 'react-hook-form';
import { z } from 'zod';

export type ContestCloneDialogProps = {
  defaultValues: ContestCloneValues;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: ContestCloneValues) => Promise<void>;
};

export default function ContestCloneDialog({
  defaultValues,
  onOpenChange,
  onConfirm,
}: ContestCloneDialogProps) {
  const t = useTranslations('contestEdit');
  const schema = z.object({
    title: z.string().trim().min(1, t('titleRequired')).max(64),
    beginAtDate: z.string().regex(datePattern, t('invalidDate')),
    beginAtTime: z.string().regex(timePattern, t('invalidTime')),
    duration: z
      .string()
      .refine((value) => Number(value) > 0, t('durationInvalid')),
  });

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
      {({ control, register, errors, isSubmitting }) => (
        <>
          <Field>
            <FieldLabel htmlFor="clone-title">{t('contestTitle')}</FieldLabel>
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
              <FieldLabel htmlFor="clone-duration">{t('duration')}</FieldLabel>
              <FieldContent>
                <Input
                  id="clone-duration"
                  type="number"
                  min="0.01"
                  step="0.25"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.duration}
                  {...register('duration')}
                />
                <FieldError errors={[errors.duration]} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="clone-endAt">{t('endTime')}</FieldLabel>
              <ContestCloneEndAt control={control} />
            </Field>
          </div>
        </>
      )}
    </CloneDialog>
  );
}

function ContestCloneEndAt({
  control,
}: {
  control: Control<ContestCloneValues>;
}) {
  const [beginAtDate, beginAtTime, duration] = useWatch({
    control,
    name: ['beginAtDate', 'beginAtTime', 'duration'],
  });
  const parsedDuration = Number(duration);
  const endAt =
    beginAtDate && beginAtTime && Number.isFinite(parsedDuration)
      ? dayjs(`${beginAtDate}T${beginAtTime}`)
          .add(parsedDuration, 'hour')
          .format('YYYY-MM-DD HH:mm')
      : '';

  return <Input id="clone-endAt" value={endAt} disabled readOnly />;
}
