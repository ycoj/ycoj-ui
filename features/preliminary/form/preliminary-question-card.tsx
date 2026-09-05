'use client';

import {
  newOption,
  normalizeScoreInput,
} from '@/features/preliminary/form/preliminary-form-utils';
import type { PreliminaryFormValues } from '@/features/preliminary/form/preliminary-form-utils';
import { getAlphabeticId } from '@/features/preliminary/lib/preliminary-utils';
import { Button } from '@/shared/components/ui/button';
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/utils';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  useFieldArray,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form';

type Props = {
  sectionIndex: number;
  questionIndex: number;
  disabled?: boolean;
  onMoveQuestion: (index: number, direction: -1 | 1) => void;
  onRemoveQuestion: (index: number) => void;
};

export default function PreliminaryQuestionCard({
  sectionIndex,
  questionIndex,
  disabled,
  onMoveQuestion,
  onRemoveQuestion,
}: Props) {
  const t = useTranslations('preliminaryForm');
  const tp = useTranslations('preliminary');
  const { control, register, setValue } =
    useFormContext<PreliminaryFormValues>();
  const base = `sections.${sectionIndex}.questions.${questionIndex}` as const;
  const question = useWatch({ control, name: base });
  const { errors } = useFormState({ control });
  const questionErrors =
    errors.sections?.[sectionIndex]?.questions?.[questionIndex];

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: `${base}.options` as const,
  });

  const typeLabel =
    question?.type === 'true_false'
      ? t('trueFalseQuestion')
      : t('choiceQuestion');

  // Explanation visibility is editor-only UI state: the form value keeps just
  // the explanation text, and the editor opens whenever text exists.
  const [explanationOpen, setExplanationOpen] = useState(false);
  const showExplanationEditor =
    explanationOpen || (question?.explanation?.trim() ?? '') !== '';

  const handleRemoveOption = (optionIndex: number) => {
    const optionId = question?.options?.[optionIndex]?.id;
    if (optionId && question?.answer === optionId) {
      setValue(`${base}.answer`, '', { shouldDirty: true });
    }
    removeOption(optionIndex);
  };

  const handleRemoveExplanation = () => {
    setValue(`${base}.explanation`, '', { shouldDirty: true });
    setExplanationOpen(false);
  };

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-sm font-medium"
          data-llm-text={`${questionIndex + 1}. ${typeLabel}`}
        >
          {questionIndex + 1}. {typeLabel}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('moveUp')}
            title={t('moveUp')}
            disabled={disabled}
            onClick={() => onMoveQuestion(questionIndex, -1)}
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
            onClick={() => onMoveQuestion(questionIndex, 1)}
          >
            <ChevronDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('removeQuestion')}
            title={t('removeQuestion')}
            disabled={disabled}
            onClick={() => onRemoveQuestion(questionIndex)}
          >
            <X />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem]">
        <Field>
          <FieldLabel htmlFor={`${base}.prompt`}>{t('prompt')}</FieldLabel>
          <FieldContent>
            <Textarea
              id={`${base}.prompt`}
              rows={2}
              placeholder={t('promptPlaceholder')}
              disabled={disabled}
              aria-invalid={!!questionErrors?.prompt}
              {...register(`${base}.prompt`)}
            />
            <FieldError errors={[questionErrors?.prompt]} />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${base}.score`}>{t('score')}</FieldLabel>
          <FieldContent>
            <Input
              id={`${base}.score`}
              type="number"
              min={1}
              max={1000}
              step={1}
              disabled={disabled}
              aria-invalid={!!questionErrors?.score}
              // Coerces cleared/invalid input to the default score at the
              // input boundary so NaN never reaches the payload builder.
              {...register(`${base}.score`, {
                setValueAs: (value) => normalizeScoreInput(value),
              })}
            />
            <FieldError errors={[questionErrors?.score]} />
          </FieldContent>
        </Field>
      </div>

      {question?.type === 'true_false' ? (
        <Field>
          <FieldLabel>{t('answer')}</FieldLabel>
          <FieldContent>
            <div className="flex flex-wrap gap-4">
              {(['true', 'false'] as const).map((value) => (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 text-sm',
                    disabled && 'cursor-not-allowed opacity-60'
                  )}
                >
                  <input
                    type="radio"
                    value={value}
                    disabled={disabled}
                    className="size-4 accent-primary"
                    {...register(`${base}.answer`)}
                  />
                  {value === 'true' ? tp('trueLabel') : tp('falseLabel')}
                </label>
              ))}
            </div>
            <FieldError errors={[questionErrors?.answer]} />
          </FieldContent>
        </Field>
      ) : (
        <Field>
          <FieldLabel>{t('options')}</FieldLabel>
          <FieldContent>
            <div className="space-y-2">
              {optionFields.map((optionField, optionIndex) => {
                const optionId = question?.options?.[optionIndex]?.id ?? '';
                return (
                  <div key={optionField.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      value={optionId}
                      disabled={disabled}
                      title={`${t('answer')} ${getAlphabeticId(optionIndex)}`}
                      aria-label={`${t('answer')} ${getAlphabeticId(optionIndex)}`}
                      className="size-4 shrink-0 accent-primary"
                      {...register(`${base}.answer`)}
                    />
                    <span className="w-6 shrink-0 text-sm font-medium tabular-nums">
                      {getAlphabeticId(optionIndex)}.
                    </span>
                    <Input
                      placeholder={t('optionPlaceholder')}
                      disabled={disabled}
                      aria-label={`${t('options')} ${getAlphabeticId(optionIndex)}`}
                      {...register(`${base}.options.${optionIndex}.text`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('removeOption', {
                        label: getAlphabeticId(optionIndex),
                      })}
                      title={t('removeOption', {
                        label: getAlphabeticId(optionIndex),
                      })}
                      disabled={disabled}
                      onClick={() => handleRemoveOption(optionIndex)}
                    >
                      <X />
                    </Button>
                  </div>
                );
              })}
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={disabled}
                  onClick={() => appendOption(newOption())}
                >
                  <Plus />
                  {t('addOption')}
                </Button>
              </div>
            </div>
            <FieldError
              errors={[questionErrors?.options, questionErrors?.answer]}
            />
          </FieldContent>
        </Field>
      )}

      {showExplanationEditor ? (
        <Field>
          <FieldLabel htmlFor={`${base}.explanation`}>
            {t('explanation')}
          </FieldLabel>
          <FieldContent>
            <Textarea
              id={`${base}.explanation`}
              rows={2}
              placeholder={t('explanationPlaceholder')}
              disabled={disabled}
              {...register(`${base}.explanation`)}
            />
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={handleRemoveExplanation}
              >
                <X />
                {t('removeExplanation')}
              </Button>
            </div>
          </FieldContent>
        </Field>
      ) : (
        <div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() => setExplanationOpen(true)}
          >
            <Plus />
            {t('addExplanation')}
          </Button>
        </div>
      )}
    </div>
  );
}
