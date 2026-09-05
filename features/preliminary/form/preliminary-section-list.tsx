'use client';

import {
  newSection,
  type PreliminaryFormValues,
  type PreliminarySectionValue,
} from '@/features/preliminary/form/preliminary-form-utils';
import PreliminarySectionCard from '@/features/preliminary/form/preliminary-section-card';
import { Button } from '@/shared/components/ui/button';
import { FieldError } from '@/shared/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useFieldArray, useFormContext, useFormState } from 'react-hook-form';

type Props = {
  disabled?: boolean;
};

export default function PreliminarySectionList({ disabled }: Props) {
  const t = useTranslations('preliminaryForm');
  const { control } = useFormContext<PreliminaryFormValues>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'sections',
  });
  const { errors } = useFormState({ control });
  const [sectionType, setSectionType] =
    useState<PreliminarySectionValue['type']>('single_choice');

  const handleMoveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    move(index, target);
  };

  const handleRemoveSection = (index: number) => {
    remove(index);
  };

  const sectionsError = errors.sections;
  const arrayError =
    (sectionsError?.root?.message as string | undefined) ??
    (sectionsError?.message as string | undefined);

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <PreliminarySectionCard
          key={field.id}
          sectionIndex={index}
          disabled={disabled}
          onMoveSection={handleMoveSection}
          onRemoveSection={handleRemoveSection}
        />
      ))}
      {arrayError && <FieldError errors={[{ message: arrayError }]} />}

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={sectionType}
          onValueChange={(value) =>
            setSectionType(value as PreliminarySectionValue['type'])
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-44" aria-label={t('sections')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single_choice">{t('singleChoice')}</SelectItem>
            <SelectItem value="program_reading">
              {t('programReading')}
            </SelectItem>
            <SelectItem value="program_completion">
              {t('programCompletion')}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => {
            append(newSection(sectionType, ''));
          }}
        >
          <Plus />
          {t('addSection')}
        </Button>
      </div>
    </div>
  );
}
