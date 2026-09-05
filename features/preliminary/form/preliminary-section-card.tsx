'use client';

import {
  getSectionTypeLabel,
  newQuestion,
  type PreliminaryFormValues,
} from '@/features/preliminary/form/preliminary-form-utils';
import PreliminaryQuestionCard from '@/features/preliminary/form/preliminary-question-card';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import type { PreliminaryQuestionType } from '@/shared/types/preliminary';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  useFieldArray,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form';

type Props = {
  sectionIndex: number;
  disabled?: boolean;
  onMoveSection: (index: number, direction: -1 | 1) => void;
  onRemoveSection: (index: number) => void;
};

export default function PreliminarySectionCard({
  sectionIndex,
  disabled,
  onMoveSection,
  onRemoveSection,
}: Props) {
  const t = useTranslations('preliminaryForm');
  const { control, register } = useFormContext<PreliminaryFormValues>();
  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
    move: moveQuestion,
  } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.questions` as const,
  });
  const section = useWatch({
    control,
    name: `sections.${sectionIndex}`,
  });
  const { errors } = useFormState({ control });
  const sectionErrors = errors.sections?.[sectionIndex];

  const sectionTypeName = getSectionTypeLabel(section?.type, t);
  const title = section?.title?.trim();
  const sectionLabel = t('sectionLabel', {
    number: sectionIndex + 1,
    title: title || t('untitledSection'),
  });

  const handleMoveQuestion = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= questionFields.length) return;
    moveQuestion(index, target);
  };

  const handleRemoveQuestion = (index: number) => {
    removeQuestion(index);
  };

  const handleAddQuestion = (type: PreliminaryQuestionType) => {
    appendQuestion(newQuestion(type));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base" data-llm-text={sectionLabel}>
            {sectionLabel}
          </CardTitle>
          <div className="flex shrink-0 items-center gap-1">
            <span className="mr-1 text-xs text-muted-foreground">
              {sectionTypeName}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('moveUp')}
              title={t('moveUp')}
              disabled={disabled}
              onClick={() => onMoveSection(sectionIndex, -1)}
            >
              <ChevronUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('moveDown')}
              title={t('moveDown')}
              disabled={disabled}
              onClick={() => onMoveSection(sectionIndex, 1)}
            >
              <ChevronDown />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('removeSection')}
              title={t('removeSection')}
              disabled={disabled}
              onClick={() => onRemoveSection(sectionIndex)}
            >
              <X />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field>
          <FieldLabel htmlFor={`sections.${sectionIndex}.title`}>
            {t('sectionTitle')}
          </FieldLabel>
          <FieldContent>
            <Input
              id={`sections.${sectionIndex}.title`}
              placeholder={t('sectionTitlePlaceholder')}
              disabled={disabled}
              aria-invalid={!!sectionErrors?.title}
              {...register(`sections.${sectionIndex}.title`)}
            />
            <FieldError errors={[sectionErrors?.title]} />
          </FieldContent>
        </Field>

        {section?.type !== 'single_choice' && (
          <Field>
            <FieldLabel htmlFor={`sections.${sectionIndex}.content`}>
              {t('passage')}
            </FieldLabel>
            <FieldContent>
              <Textarea
                id={`sections.${sectionIndex}.content`}
                rows={6}
                placeholder={t('passagePlaceholder')}
                disabled={disabled}
                className="font-mono"
                {...register(`sections.${sectionIndex}.content`)}
              />
            </FieldContent>
          </Field>
        )}

        <div className="space-y-3">
          {questionFields.map((field, questionIndex) => (
            <PreliminaryQuestionCard
              key={field.id}
              sectionIndex={sectionIndex}
              questionIndex={questionIndex}
              disabled={disabled}
              onMoveQuestion={handleMoveQuestion}
              onRemoveQuestion={handleRemoveQuestion}
            />
          ))}
        </div>
        <FieldError errors={[sectionErrors?.questions]} />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() => handleAddQuestion('choice')}
          >
            <Plus />
            {t('addQuestion')}
          </Button>
          {section?.type === 'program_reading' && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={() => handleAddQuestion('true_false')}
            >
              <Plus />
              {t('addTrueFalse')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
