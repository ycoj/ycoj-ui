'use client';

import PreliminaryForm from '@/features/preliminary/form/preliminary-form';
import type { PreliminaryFormValues } from '@/features/preliminary/form/preliminary-form-utils';
import { savePreliminaryValues } from '@/features/preliminary/lib/preliminary-save';
import { useCallback } from 'react';

type Props = {
  defaultValues: PreliminaryFormValues;
};

export default function PreliminaryCreateForm({ defaultValues }: Props) {
  const handleSave = useCallback(
    (values: PreliminaryFormValues, published: boolean) =>
      savePreliminaryValues(values, published),
    []
  );

  return (
    <PreliminaryForm
      mode="create"
      defaultValues={defaultValues}
      cancelHref="/preliminary"
      onSave={handleSave}
    />
  );
}
