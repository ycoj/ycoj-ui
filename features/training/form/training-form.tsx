'use client';

import {
  hasDuplicateSectionIds,
  hasCyclicRequireNids,
  hasInvalidRequireNids,
  type TrainingFormValues,
} from '@/features/training/form/training-form-utils';
import TrainingSectionEditor from '@/features/training/form/training-section-editor';
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
import { Textarea } from '@/shared/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export type TrainingFormMode = 'create' | 'edit';

type Props = {
  mode: TrainingFormMode;
  defaultValues: TrainingFormValues;
  domainId: string;
  cancelHref: string;
  canPin: boolean;
  onSubmit: (values: TrainingFormValues) => Promise<string>;
};

export default function TrainingForm({
  mode,
  defaultValues,
  domainId,
  cancelHref,
  canPin,
  onSubmit,
}: Props) {
  const t = useTranslations('trainingForm');
  const router = useRouter();
  const schema = z.object({
    title: z.string().trim().min(1, t('titleRequired')).max(64),
    pin: z
      .string()
      .refine((value) => /^\d+$/.test(value.trim()), t('pinInvalid')),
    content: z.string().trim().min(1, t('summaryRequired')).max(65535),
    description: z.string().trim().min(1, t('descriptionRequired')).max(65535),
    sections: z
      .array(
        z.object({
          id: z.number(),
          title: z.string().trim().min(1, t('sectionTitleRequired')),
          requireNids: z.array(z.number()),
          pids: z
            .array(
              z.object({
                docId: z.number(),
                pid: z.string().optional(),
                title: z.string(),
              })
            )
            .min(1, t('sectionProblemsRequired')),
        })
      )
      .min(1, t('sectionsRequired'))
      .superRefine((sections, ctx) => {
        if (hasDuplicateSectionIds(sections)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('sectionIdDuplicate'),
          });
        }
        sections.forEach((section, index) => {
          if (hasInvalidRequireNids(section, sections)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [index, 'requireNids'],
              message: t('requiresInvalid'),
            });
          }
        });
        if (hasCyclicRequireNids(sections)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('requiresInvalid'),
          });
        }
      }),
  });
  const {
    control,
    handleSubmit,
    register,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TrainingFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleFormSubmit = async (values: TrainingFormValues) => {
    try {
      const path = await onSubmit(values);
      router.push(path);
      router.refresh();
    } catch (error) {
      setError('root.serverError', {
        type: 'server',
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
      <Field>
        <FieldLabel htmlFor="title">{t('trainingTitle')}</FieldLabel>
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

      {canPin && (
        <Field>
          <FieldLabel htmlFor="pin">{t('pin')}</FieldLabel>
          <FieldContent>
            <Input
              id="pin"
              type="number"
              min="0"
              step="1"
              disabled={isSubmitting}
              aria-invalid={!!errors.pin}
              {...register('pin')}
            />
            <FieldDescription>{t('pinHelp')}</FieldDescription>
            <FieldError errors={[errors.pin]} />
          </FieldContent>
        </Field>
      )}

      <Field>
        <FieldLabel htmlFor="content">{t('summary')}</FieldLabel>
        <FieldContent>
          <Textarea
            id="content"
            placeholder={t('summaryPlaceholder')}
            disabled={isSubmitting}
            aria-invalid={!!errors.content}
            {...register('content')}
          />
          <FieldDescription>{t('summaryHelp')}</FieldDescription>
          <FieldError errors={[errors.content]} />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel htmlFor="description">{t('description')}</FieldLabel>
        <FieldContent>
          <MarkdownEditor
            id="description"
            defaultValue={defaultValues.description}
            disabled={isSubmitting}
            aria-invalid={!!errors.description}
            {...register('description')}
          />
          <FieldError errors={[errors.description]} />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>{t('sections')}</FieldLabel>
        <FieldContent>
          <FieldDescription>{t('sectionsHelp')}</FieldDescription>
          <TrainingSectionEditor
            control={control}
            domainId={domainId}
            disabled={isSubmitting}
          />
        </FieldContent>
      </Field>

      <FieldError errors={[errors.root?.serverError]} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {mode === 'create' ? <Plus /> : <Save />}
          {isSubmitting
            ? mode === 'create'
              ? t('creating')
              : t('saving')
            : mode === 'create'
              ? t('create')
              : t('save')}
        </Button>
        <Button asChild variant="secondary">
          <Link href={cancelHref}>
            <ArrowLeft />
            {t('cancel')}
          </Link>
        </Button>
      </div>
    </form>
  );
}
