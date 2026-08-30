'use client';

import ProblemListEditor from '@/features/problem/problem-list-editor';
import {
  allocateNextSectionId,
  type TrainingFormValues,
  type TrainingSectionValue,
} from '@/features/training/form/training-form-utils';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Controller,
  useFieldArray,
  useFormState,
  useWatch,
  type Control,
} from 'react-hook-form';

type Props = {
  control: Control<TrainingFormValues>;
  domainId: string;
  disabled?: boolean;
};

export default function TrainingSectionEditor({
  control,
  domainId,
  disabled,
}: Props) {
  const t = useTranslations('trainingForm');
  const { fields, append, move, replace } = useFieldArray({
    control,
    name: 'sections',
  });
  const { errors } = useFormState({ control });
  const sections =
    useWatch({ control, name: 'sections' }) ?? ([] as TrainingSectionValue[]);
  const lastAllocatedIdRef = useRef(
    sections.reduce((max, section) => Math.max(max, section.id), 0)
  );

  const sectionLabel = (index: number) => {
    const section = sections[index];
    const title = section?.title?.trim();
    return t('sectionLabel', {
      number: index + 1,
      title: title || t('untitledSection'),
    });
  };

  const addSection = () => {
    const id = allocateNextSectionId(lastAllocatedIdRef.current, sections);
    lastAllocatedIdRef.current = id;
    append({
      id,
      title: '',
      requireNids: [],
      pids: [],
    });
  };

  const removeSection = (index: number) => {
    const removedId = sections[index]?.id;
    replace(
      sections
        .filter((_, itemIndex) => itemIndex !== index)
        .map((section) => ({
          ...section,
          requireNids: section.requireNids.filter((nid) => nid !== removedId),
        }))
    );
  };

  const sectionErrors = errors.sections;
  const arrayError =
    (sectionErrors?.root?.message as string | undefined) ??
    (sectionErrors?.message as string | undefined);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-3">
        {fields.map((field, index) => {
          const itemErrors = sectionErrors?.[index];
          const siblings = sections
            .map((section, siblingIndex) => ({ section, siblingIndex }))
            .filter(({ section }) => section.id !== sections[index]?.id);

          return (
            <div
              key={field.id}
              className="space-y-4 rounded-lg border p-4"
              data-llm-visible="true"
            >
              <div className="flex items-center justify-between gap-2">
                <h3
                  className="text-sm font-medium"
                  data-llm-text={sectionLabel(index)}
                >
                  {sectionLabel(index)}
                </h3>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={t('moveUp')}
                    title={t('moveUp')}
                    disabled={disabled || index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    <ChevronUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={t('moveDown')}
                    title={t('moveDown')}
                    disabled={disabled || index === fields.length - 1}
                    onClick={() => move(index, index + 1)}
                  >
                    <ChevronDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={t('removeSection')}
                    title={t('removeSection')}
                    disabled={disabled || fields.length <= 1}
                    onClick={() => removeSection(index)}
                  >
                    <X />
                  </Button>
                </div>
              </div>

              <Field>
                <FieldLabel htmlFor={`sections.${index}.title`}>
                  {t('sectionTitle')}
                </FieldLabel>
                <FieldContent>
                  <Controller
                    control={control}
                    name={`sections.${index}.title`}
                    render={({ field: titleField }) => (
                      <Input
                        id={`sections.${index}.title`}
                        placeholder={t('sectionTitlePlaceholder')}
                        disabled={disabled}
                        aria-invalid={!!itemErrors?.title}
                        {...titleField}
                      />
                    )}
                  />
                  <FieldError errors={[itemErrors?.title]} />
                </FieldContent>
              </Field>

              {siblings.length > 0 && (
                <Field>
                  <FieldLabel>{t('requires')}</FieldLabel>
                  <FieldContent>
                    <Controller
                      control={control}
                      name={`sections.${index}.requireNids`}
                      render={({ field: requireField }) => (
                        <div className="space-y-1">
                          {siblings.map(({ section, siblingIndex }) => {
                            const checked = requireField.value.includes(
                              section.id
                            );
                            return (
                              <label
                                key={section.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                <Checkbox
                                  checked={checked}
                                  disabled={disabled}
                                  onCheckedChange={(value) => {
                                    requireField.onChange(
                                      value === true
                                        ? [...requireField.value, section.id]
                                        : requireField.value.filter(
                                            (nid) => nid !== section.id
                                          )
                                    );
                                  }}
                                />
                                <span
                                  data-llm-text={sectionLabel(siblingIndex)}
                                >
                                  {sectionLabel(siblingIndex)}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    />
                    <FieldDescription>{t('requiresHelp')}</FieldDescription>
                    <FieldError errors={[itemErrors?.requireNids]} />
                  </FieldContent>
                </Field>
              )}

              <Field>
                <FieldContent>
                  <Controller
                    control={control}
                    name={`sections.${index}.pids`}
                    render={({ field: pidsField }) => (
                      <ProblemListEditor
                        id={`sections.${index}.pids`}
                        domainId={domainId}
                        value={pidsField.value}
                        onValueChange={pidsField.onChange}
                        onBlur={pidsField.onBlur}
                        disabled={disabled}
                        invalid={!!itemErrors?.pids}
                      />
                    )}
                  />
                  <FieldError errors={[itemErrors?.pids]} />
                </FieldContent>
              </Field>
            </div>
          );
        })}

        <FieldError errors={[{ message: arrayError }]} />

        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={addSection}
        >
          <Plus />
          {t('addSection')}
        </Button>
      </div>
    </DndProvider>
  );
}
